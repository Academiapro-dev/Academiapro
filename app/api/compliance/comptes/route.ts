import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const CLASSES: any = {
  1: "Capitaux",
  2: "Immobilisations",
  3: "Stocks",
  4: "Tiers",
  5: "Tresorerie",
  6: "Charges",
  7: "Produits",
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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

async function dossierDemande(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
  const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
  if (!code && !id) return null;

  const { data } = await supabase
    .from("compta_societes")
    .select("id, code, raison_sociale")
    .limit(500);

  const liste = data || [];
  if (id) return liste.find(function (s: any) { return s.id === id; }) || null;
  return liste.find(function (s: any) {
    return String(s.code || "").trim().toUpperCase() === code;
  }) || null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const dossier = await dossierDemande(req);

    // Le plan commun sert de socle ; les comptes propres au dossier le
    // completent, et PRIMENT sur un compte commun de meme numero. Un cabinet
    // peut ainsi personnaliser un libelle sans toucher au socle.
    const { data: communs, error: e1 } = await supabase
      .from("compta_comptes")
      .select("*")
      .is("societe_id", null)
      .order("numero", { ascending: true })
      .limit(2000);

    if (e1) {
      return NextResponse.json({ ok: false, erreur: e1.message }, { status: 500 });
    }

    let propres: any[] = [];
    if (dossier) {
      const { data, error: e2 } = await supabase
        .from("compta_comptes")
        .select("*")
        .eq("societe_id", dossier.id)
        .order("numero", { ascending: true })
        .limit(2000);

      if (e2) {
        return NextResponse.json({ ok: false, erreur: e2.message }, { status: 500 });
      }
      propres = data || [];
    }

    const parNumero: any = {};
    for (const c of communs || []) {
      parNumero[c.numero] = { ...c, origine: "commun" };
    }
    for (const c of propres) {
      parNumero[c.numero] = { ...c, origine: "dossier" };
    }

    const liste = Object.keys(parNumero)
      .sort()
      .map(function (n) {
        const c = parNumero[n];
        return { ...c, classe_nom: CLASSES[c.classe] || "" };
      });

    // Comptes reellement mouvementes, pour distinguer le plan theorique de
    // celui qui sert vraiment.
    let utilises: any = {};
    if (dossier) {
      const { data: ecritures } = await supabase
        .from("compta_ecritures")
        .select("compte_num")
        .eq("societe_id", dossier.id)
        .limit(50000);

      for (const e of ecritures || []) {
        utilises[e.compte_num] = (utilises[e.compte_num] || 0) + 1;
      }
    }

    const avecUsage = liste.map(function (c: any) {
      return { ...c, mouvements: utilises[c.numero] || 0 };
    });

    return NextResponse.json({
      ok: true,
      classes: CLASSES,
      dossier: dossier ? { code: dossier.code, raison_sociale: dossier.raison_sociale } : null,
      total: avecUsage.length,
      communs: (communs || []).length,
      propres: propres.length,
      mouvementes: avecUsage.filter(function (c: any) { return c.mouvements > 0; }).length,
      comptes: avecUsage,
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
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const numero = String(b.numero || "").replace(/\D/g, "").slice(0, 12);
    if (numero.length < 3) {
      return NextResponse.json(
        { ok: false, erreur: "Un numero de compte comporte au moins trois chiffres." },
        { status: 400 }
      );
    }

    const libelle = propre(b.libelle, 200);
    if (!libelle || libelle.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le libelle du compte est obligatoire." },
        { status: 400 }
      );
    }

    const classe = parseInt(numero.charAt(0), 10);
    if (!CLASSES[classe]) {
      return NextResponse.json(
        { ok: false, erreur: "Le premier chiffre doit designer une classe de 1 a 7." },
        { status: 400 }
      );
    }

    const societeId = b.societe_id ? String(b.societe_id) : null;

    const fiche: any = {
      societe_id: societeId,
      numero: numero,
      libelle: libelle,
      classe: classe,
      type: propre(b.type, 40),
      lettrable: b.lettrable === true,
      compte_tva: b.compte_tva ? String(b.compte_tva).replace(/\D/g, "").slice(0, 12) : null,
      taux_tva: b.taux_tva !== undefined && b.taux_tva !== null && b.taux_tva !== ""
        ? Number(String(b.taux_tva).replace(",", "."))
        : null,
      notes: propre(b.notes, 1000),
    };

    if (fiche.taux_tva !== null && (isNaN(fiche.taux_tva) || fiche.taux_tva < 0 || fiche.taux_tva > 100)) {
      return NextResponse.json({ ok: false, erreur: "Taux de TVA invalide." }, { status: 400 });
    }

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    const requete = supabase.from("compta_comptes").select("id").eq("numero", numero);
    const { data: deja } = await (societeId
      ? requete.eq("societe_id", societeId)
      : requete.is("societe_id", null)
    ).maybeSingle();

    const r = deja
      ? await supabase.from("compta_comptes").update(fiche).eq("id", deja.id)
      : await supabase.from("compta_comptes").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      numero: numero,
      remplace: !!deja,
      portee: societeId ? "dossier" : "commun",
      message: (deja ? "Compte " + numero + " modifie" : "Compte " + numero + " cree")
        + (societeId ? " pour ce dossier." : " dans le plan commun."),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Compte non precise." }, { status: 400 });
    }

    const { data: compte } = await supabase
      .from("compta_comptes")
      .select("numero, societe_id")
      .eq("id", id)
      .maybeSingle();

    if (!compte) {
      return NextResponse.json({ ok: false, erreur: "Compte introuvable." }, { status: 404 });
    }

    // Un compte mouvemente ne se supprime pas : la piste d audit serait rompue.
    const requete = supabase
      .from("compta_ecritures")
      .select("*", { count: "exact", head: true })
      .eq("compte_num", compte.numero);

    const { count } = await (compte.societe_id
      ? requete.eq("societe_id", compte.societe_id)
      : requete
    );

    if (typeof count === "number" && count > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ce compte porte " + count + " ecriture(s) : il ne peut pas etre supprime."
            + " Rendez-le inactif si vous ne voulez plus l utiliser.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("compta_comptes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: compte.numero });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
