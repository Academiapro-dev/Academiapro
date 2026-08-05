import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage, dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const JOURNAUX: any = {
  AC: "Achats",
  VE: "Ventes",
  BQ: "Banque",
  CA: "Caisse",
  OD: "Operations diverses",
  AN: "A nouveaux",
};

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

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[|\r\n\t]/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    // La consultation etait reservee a une liste d administrateurs en dur.
    // Elle s ouvre desormais a tout utilisateur, mais BORNEE AUX DOSSIERS DE
    // SON ORGANISME : c est le cloisonnement qui protege, pas une liste
    // d emails ecrite dans le code.
    const autorises = await dossiersAutorises();
    if (autorises.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun dossier ne vous est confie." },
        { status: 403 }
      );
    }

    const code = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin")
      .in("id", autorises)
      .limit(500);

    const liste = dossiers || [];
    let dossier: any = null;

    if (id) dossier = liste.find(function (s: any) { return s.id === id; }) || null;
    else if (code) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === code;
      }) || null;
    }

    if (!dossier) {
      return NextResponse.json({
        ok: true,
        journaux: JOURNAUX,
        dossiers: liste.map(function (s: any) {
          return { id: s.id, code: s.code, raison_sociale: s.raison_sociale };
        }),
        ecritures: [],
      });
    }

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num, journal_code, ecriture_date, compte_num, compte_lib, ecriture_lib, debit, credit, piece_ref, source_table, verrouille")
      .eq("societe_id", dossier.id)
      .order("ecriture_date", { ascending: false })
      .limit(400);

    const pieces: any = {};
    for (const l of lignes || []) {
      if (!pieces[l.ecriture_num]) {
        pieces[l.ecriture_num] = {
          ecriture_num: l.ecriture_num,
          journal_code: l.journal_code,
          ecriture_date: l.ecriture_date,
          piece_ref: l.piece_ref,
          libelle: l.ecriture_lib,
          manuelle: !l.source_table,
          verrouillee: l.verrouille === true,
          lignes: [],
          debit: 0,
          credit: 0,
        };
      }
      const p = pieces[l.ecriture_num];
      p.lignes.push(l);
      p.debit = r2(p.debit + (Number(l.debit) || 0));
      p.credit = r2(p.credit + (Number(l.credit) || 0));
    }

    const ecritures = Object.keys(pieces)
      .map(function (k) {
        const p = pieces[k];
        return { ...p, equilibree: Math.abs(r2(p.debit - p.credit)) < 0.01 };
      })
      .sort(function (a: any, b: any) {
        return String(b.ecriture_num).localeCompare(String(a.ecriture_num));
      });

    return NextResponse.json({
      ok: true,
      journaux: JOURNAUX,
      dossier: { id: dossier.id, code: dossier.code, raison_sociale: dossier.raison_sociale },
      exercice: { debut: dossier.exercice_debut, fin: dossier.exercice_fin },
      total: ecritures.length,
      ecritures: ecritures.slice(0, 100),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const societeId = String(b.societe_id || "").trim();
    if (!societeId) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LE BARRAGE : le droit de saisir, sur ce dossier precisement. Il verifie
    // d abord que le dossier appartient bien a l organisme de la session.
    const refusDroit = await barrage("saisir", societeId);
    if (refusDroit) return refusDroit;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin")
      .eq("id", societeId)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const journal = String(b.journal || "OD").trim().toUpperCase();
    if (!JOURNAUX[journal]) {
      return NextResponse.json(
        { ok: false, erreur: "Journal inconnu. Utilisez AC, VE, BQ, CA, OD ou AN." },
        { status: 400 }
      );
    }

    const date = String(b.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, erreur: "Date invalide." }, { status: 400 });
    }

    // On n ecrit jamais sur un exercice verrouille : il faudrait contrepasser.
    const { data: verrou } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", societeId)
      .eq("verrouille", true)
      .gte("ecriture_date", date.slice(0, 4) + "-01-01")
      .lte("ecriture_date", date.slice(0, 4) + "-12-31")
      .limit(1);

    if ((verrou || []).length > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "L exercice " + date.slice(0, 4) + " est verrouille."
            + " Passez par une contrepassation plutot que par une saisie.",
        },
        { status: 409 }
      );
    }

    if (dossier.exercice_debut && date < String(dossier.exercice_debut).slice(0, 10)) {
      return NextResponse.json(
        { ok: false, erreur: "Cette date precede l ouverture de l exercice du dossier." },
        { status: 400 }
      );
    }
    if (dossier.exercice_fin && date > String(dossier.exercice_fin).slice(0, 10)) {
      return NextResponse.json(
        { ok: false, erreur: "Cette date depasse la cloture de l exercice du dossier." },
        { status: 400 }
      );
    }

    const libelle = propre(b.libelle, 200);
    if (!libelle || libelle.length < 3) {
      return NextResponse.json(
        { ok: false, erreur: "Le libelle de l ecriture est obligatoire." },
        { status: 400 }
      );
    }

    const brutes = Array.isArray(b.lignes) ? b.lignes : [];
    if (brutes.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Une ecriture comporte au moins deux lignes." },
        { status: 400 }
      );
    }

    const { data: communs } = await supabase
      .from("compta_comptes")
      .select("numero, libelle")
      .is("societe_id", null)
      .limit(2000);

    const { data: propresComptes } = await supabase
      .from("compta_comptes")
      .select("numero, libelle")
      .eq("societe_id", societeId)
      .limit(2000);

    const plan: any = {};
    for (const c of communs || []) plan[c.numero] = c.libelle;
    for (const c of propresComptes || []) plan[c.numero] = c.libelle;

    const lignes: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    const inconnus: string[] = [];

    for (let i = 0; i < brutes.length; i = i + 1) {
      const l = brutes[i] || {};
      const compte = String(l.compte || "").replace(/\D/g, "").slice(0, 12);
      if (!compte) continue;

      if (!plan[compte]) {
        if (inconnus.indexOf(compte) < 0) inconnus.push(compte);
        continue;
      }

      const debit = r2(Number(String(l.debit || 0).replace(",", ".")) || 0);
      const credit = r2(Number(String(l.credit || 0).replace(",", ".")) || 0);

      if (debit <= 0 && credit <= 0) continue;

      if (debit > 0 && credit > 0) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "Ligne " + (i + 1) + " : une ligne porte un debit OU un credit, jamais les deux.",
          },
          { status: 400 }
        );
      }

      totalDebit = r2(totalDebit + debit);
      totalCredit = r2(totalCredit + credit);

      lignes.push({
        societe_id: societeId,
        journal_code: journal,
        journal_lib: JOURNAUX[journal],
        ecriture_date: date,
        compte_num: compte,
        compte_lib: plan[compte],
        comp_aux_num: propre(l.aux_num, 40),
        comp_aux_lib: propre(l.aux_lib, 120),
        piece_ref: propre(b.piece_ref, 60),
        piece_date: b.piece_date ? String(b.piece_date).slice(0, 10) : date,
        ecriture_lib: propre(l.libelle, 200) || libelle,
        debit: debit,
        credit: credit,
        devise: propre(b.devise, 3) || "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
      });
    }

    if (inconnus.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Compte(s) absent(s) du plan de ce dossier : " + inconnus.join(", ")
            + ". Creez-les avant de saisir.",
          comptes_inconnus: inconnus,
        },
        { status: 400 }
      );
    }

    if (lignes.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Il faut au moins deux lignes portant un montant." },
        { status: 400 }
      );
    }

    const ecart = r2(totalDebit - totalCredit);
    if (Math.abs(ecart) > 0.005) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ecriture desequilibree : debit " + totalDebit.toFixed(2)
            + " contre credit " + totalCredit.toFixed(2)
            + ", ecart de " + ecart.toFixed(2) + ".",
          debit: totalDebit,
          credit: totalCredit,
          ecart: ecart,
        },
        { status: 400 }
      );
    }

    const annee = date.slice(0, 4);
    const prefixe = journal + annee + "-";

    const { data: dernieres } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", societeId)
      .like("ecriture_num", prefixe + "%")
      .order("ecriture_num", { ascending: false })
      .limit(1);

    let rang = 1;
    const derniere = (dernieres || [])[0];
    if (derniere && derniere.ecriture_num) {
      const suffixe = String(derniere.ecriture_num).split("-").pop() || "0";
      const n = parseInt(suffixe, 10);
      if (!isNaN(n)) rang = n + 1;
    }

    const numero = prefixe + String(rang).padStart(4, "0");
    for (const l of lignes) l.ecriture_num = numero;

    const { error } = await supabase.from("compta_ecritures").insert(lignes);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ecriture_num: numero,
      lignes: lignes.length,
      debit: totalDebit,
      credit: totalCredit,
      message: "Ecriture " + numero + " enregistree, " + lignes.length
        + " lignes, " + totalDebit.toFixed(2) + " EUR equilibres.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
