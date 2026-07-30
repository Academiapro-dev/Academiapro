import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function contexte(req: NextRequest) {
  const session = sessionCourante();
  if (!session) return { session: null, tenant: null };
  const admin = ADMINS.indexOf(session.email) >= 0;
  let tenant = session.tenantId;
  if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");
  return { session: session, tenant: tenant };
}

// ATTENTION : ceci n est PAS l imprime officiel du bilan pedagogique et
// financier. C est un ETAT PREPARATOIRE qui rassemble les chiffres dont
// l organisme a besoin pour le remplir. Le mapping vers les rubriques exactes
// du Cerfa reste a faire depuis la source officielle.
export async function GET(req: NextRequest) {
  try {
    const { session, tenant } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const brut = new URL(req.url).searchParams.get("annee");
    const annee = brut && /^\d{4}$/.test(brut)
      ? parseInt(brut, 10)
      : new Date().getUTCFullYear();

    const debut = new Date(Date.UTC(annee, 0, 1)).toISOString();
    const fin = new Date(Date.UTC(annee + 1, 0, 1)).toISOString();

    const { data: inscrits, error } = await supabase
      .from("organisme_apprenants")
      .select("email, formation_code, prix_vente, payeur, created_at")
      .eq("tenant_id", tenant)
      .gte("created_at", debut)
      .lt("created_at", fin)
      .limit(10000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: fiches } = await supabase
      .from("formations")
      .select("code, titre, duree")
      .limit(1000);

    const infoDe: any = {};
    for (const f of fiches || []) infoDe[f.code] = f;

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_vente_public")
      .eq("tenant_id", tenant)
      .limit(1000);

    const prixDe: any = {};
    for (const c of catalogue || []) {
      prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;
    }

    const parFinanceur: any = {};
    const parFormation: any = {};
    const stagiaires = new Set<string>();
    let heures = 0;
    let chiffre = 0;
    let sansFinanceur = 0;
    let sansFormation = 0;

    for (const i of inscrits || []) {
      stagiaires.add(i.email);

      const financeur = i.payeur || "non_renseigne";
      if (!i.payeur) sansFinanceur = sansFinanceur + 1;

      let prix = Number(i.prix_vente);
      if (!prix || isNaN(prix)) prix = prixDe[i.formation_code || ""] || 0;

      const fiche = infoDe[i.formation_code || ""] || {};
      const duree = Number(fiche.duree) || 0;
      if (!i.formation_code) sansFormation = sansFormation + 1;

      heures = heures + duree;
      chiffre = chiffre + prix;

      if (!parFinanceur[financeur]) {
        parFinanceur[financeur] = { stagiaires: 0, heures: 0, montant: 0 };
      }
      parFinanceur[financeur].stagiaires = parFinanceur[financeur].stagiaires + 1;
      parFinanceur[financeur].heures = parFinanceur[financeur].heures + duree;
      parFinanceur[financeur].montant = parFinanceur[financeur].montant + prix;

      const code = i.formation_code || "sans_formation";
      if (!parFormation[code]) {
        parFormation[code] = {
          titre: fiche.titre || code,
          duree: duree,
          stagiaires: 0,
          heures: 0,
          montant: 0,
        };
      }
      parFormation[code].stagiaires = parFormation[code].stagiaires + 1;
      parFormation[code].heures = parFormation[code].heures + duree;
      parFormation[code].montant = parFormation[code].montant + prix;
    }

    // Modules valides sur l annee : preuve de realisation, utile en audit.
    const { data: valides } = await supabase
      .from("progression_apprenants")
      .select("user_email")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(10000);

    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret")
      .eq("tenant_id", tenant)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      avertissement:
        "Etat preparatoire. Ce document n est pas l imprime officiel du bilan pedagogique et financier : il rassemble les chiffres necessaires a son remplissage.",
      annee: annee,
      organisme: fiche || null,
      stagiaires_distincts: stagiaires.size,
      inscriptions: (inscrits || []).length,
      heures_stagiaires: heures,
      chiffre_declare: chiffre,
      modules_valides: (valides || []).length,
      sans_financeur: sansFinanceur,
      sans_formation: sansFormation,
      par_financeur: parFinanceur,
      par_formation: parFormation,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
