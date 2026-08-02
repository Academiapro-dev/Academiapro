import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Lettres AA, AB... puis AAA : la convention des logiciels comptables.
function lettreSuivante(derniere: string): string {
  if (!derniere) return "AA";
  const chiffres = derniere.toUpperCase().split("");
  let i = chiffres.length - 1;
  while (i >= 0) {
    if (chiffres[i] !== "Z") {
      chiffres[i] = String.fromCharCode(chiffres[i].charCodeAt(0) + 1);
      return chiffres.join("");
    }
    chiffres[i] = "A";
    i = i - 1;
  }
  return "A" + chiffres.join("");
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const compte = (req.nextUrl.searchParams.get("compte") || "").replace(/\D/g, "");

    // Les comptes lettrables du plan : le socle commun plus ceux du dossier.
    const { data: communs } = await supabase
      .from("compta_comptes")
      .select("numero, libelle, lettrable")
      .is("societe_id", null)
      .eq("lettrable", true)
      .limit(2000);

    const { data: propres } = await supabase
      .from("compta_comptes")
      .select("numero, libelle, lettrable")
      .eq("societe_id", id)
      .eq("lettrable", true)
      .limit(2000);

    const lettrables: any = {};
    for (const c of communs || []) lettrables[c.numero] = c.libelle;
    for (const c of propres || []) lettrables[c.numero] = c.libelle;

    if (!compte) {
      // Vue d ensemble : combien reste-t-il a lettrer sur chaque compte.
      const { data: toutes } = await supabase
        .from("compta_ecritures")
        .select("compte_num, debit, credit, lettrage")
        .eq("societe_id", id)
        .limit(50000);

      const parCompte: any = {};
      for (const e of toutes || []) {
        if (!lettrables[e.compte_num]) continue;
        if (!parCompte[e.compte_num]) {
          parCompte[e.compte_num] = { numero: e.compte_num, libelle: lettrables[e.compte_num], total: 0, lettres: 0, solde: 0 };
        }
        const p = parCompte[e.compte_num];
        p.total = p.total + 1;
        if (e.lettrage) p.lettres = p.lettres + 1;
        p.solde = r2(p.solde + (Number(e.debit) || 0) - (Number(e.credit) || 0));
      }

      const comptes = Object.keys(parCompte).sort().map(function (k) {
        const p = parCompte[k];
        return { ...p, a_lettrer: p.total - p.lettres };
      });

      return NextResponse.json({ ok: true, vue: "comptes", comptes: comptes });
    }

    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select("id, ecriture_num, ecriture_date, ecriture_lib, piece_ref, debit, credit, lettrage, date_lettrage")
      .eq("societe_id", id)
      .eq("compte_num", compte)
      .order("ecriture_date", { ascending: true })
      .limit(5000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const toutes = (lignes || []).map(function (l: any) {
      return { ...l, mouvement: r2((Number(l.debit) || 0) - (Number(l.credit) || 0)) };
    });

    const ouvertes = toutes.filter(function (l: any) { return !l.lettrage; });

    // Propositions : une ligne debitrice et une ligne creditrice qui
    // s annulent exactement. C est le cas courant, facture puis reglement.
    const propositions: any[] = [];
    const pris: any = {};

    for (const a of ouvertes) {
      if (pris[a.id] || a.mouvement <= 0) continue;
      for (const b of ouvertes) {
        if (pris[b.id] || b.id === a.id || b.mouvement >= 0) continue;
        if (Math.abs(a.mouvement + b.mouvement) > 0.005) continue;
        pris[a.id] = true;
        pris[b.id] = true;
        propositions.push({
          montant: a.mouvement,
          lignes: [a, b],
          ecart_jours: Math.abs(
            Math.round((new Date(b.ecriture_date).getTime() - new Date(a.ecriture_date).getTime()) / 86400000)
          ),
        });
        break;
      }
    }

    const soldeOuvert = r2(ouvertes.reduce(function (s: number, l: any) { return s + l.mouvement; }, 0));

    return NextResponse.json({
      ok: true,
      vue: "compte",
      compte: { numero: compte, libelle: lettrables[compte] || "" },
      total: toutes.length,
      lettres: toutes.length - ouvertes.length,
      a_lettrer: ouvertes.length,
      solde_ouvert: soldeOuvert,
      propositions: propositions,
      lignes: toutes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // Delettrage : on rend les lignes a leur etat ouvert.
    if (b.action === "delettrer") {
      const lettre = String(b.lettre || "").trim().toUpperCase();
      if (!lettre) {
        return NextResponse.json({ ok: false, erreur: "Lettre non precisee." }, { status: 400 });
      }

      const { error } = await supabase
        .from("compta_ecritures")
        .update({ lettrage: null, date_lettrage: null })
        .eq("societe_id", b.societe_id)
        .eq("compte_num", String(b.compte || ""))
        .eq("lettrage", lettre);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Lettrage " + lettre + " annule." });
    }

    const ids = Array.isArray(b.ids) ? b.ids : [];
    if (ids.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Un lettrage porte sur au moins deux lignes." },
        { status: 400 }
      );
    }

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("id, compte_num, debit, credit, lettrage")
      .in("id", ids)
      .eq("societe_id", b.societe_id)
      .limit(200);

    const retenues = lignes || [];

    if (retenues.length !== ids.length) {
      return NextResponse.json(
        { ok: false, erreur: "Certaines lignes sont introuvables sur ce dossier." },
        { status: 404 }
      );
    }

    const comptes = Array.from(new Set(retenues.map(function (l: any) { return l.compte_num; })));
    if (comptes.length > 1) {
      return NextResponse.json(
        { ok: false, erreur: "Un lettrage ne porte que sur un seul compte." },
        { status: 400 }
      );
    }

    const dejaLettree = retenues.find(function (l: any) { return !!l.lettrage; });
    if (dejaLettree) {
      return NextResponse.json(
        { ok: false, erreur: "Une des lignes porte deja la lettre " + dejaLettree.lettrage + "." },
        { status: 409 }
      );
    }

    // LA REGLE : un lettrage ne se pose que sur un ensemble qui s annule.
    const somme = r2(
      retenues.reduce(function (s: number, l: any) {
        return s + (Number(l.debit) || 0) - (Number(l.credit) || 0);
      }, 0)
    );

    if (Math.abs(somme) > 0.005) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ces lignes ne s annulent pas : il reste " + somme.toFixed(2)
            + " EUR. Un lettrage suppose une somme nulle.",
          ecart: somme,
        },
        { status: 400 }
      );
    }

    // Lettre suivante disponible sur le compte.
    const { data: existantes } = await supabase
      .from("compta_ecritures")
      .select("lettrage")
      .eq("societe_id", b.societe_id)
      .eq("compte_num", comptes[0])
      .not("lettrage", "is", null)
      .order("lettrage", { ascending: false })
      .limit(1);

    const derniere = (existantes || [])[0];
    const lettre = lettreSuivante(derniere && derniere.lettrage ? derniere.lettrage : "");

    const { error } = await supabase
      .from("compta_ecritures")
      .update({ lettrage: lettre, date_lettrage: new Date().toISOString().slice(0, 10) })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      lettre: lettre,
      lignes: ids.length,
      message: ids.length + " lignes lettrees sous " + lettre + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
