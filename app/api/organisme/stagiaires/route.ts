import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const PAYEURS = [
  "entreprise",
  "opco",
  "cpf",
  "pouvoirs_publics",
  "particulier",
  "organisme_formation",
  "fonds_propres",
];

// Cadre F-1 du Cerfa 10443*17.
const STATUTS = ["salarie_prive", "apprenti", "recherche_emploi", "particulier", "autre"];

// Cadre C du Cerfa : lignes 2a a 2h, puis 4 a 8.
const DISPOSITIFS = [
  "apprentissage",
  "professionnalisation",
  "reconversion_alternance",
  "transition_pro",
  "cpf",
  "demandeur_emploi",
  "travailleur_non_salarie",
  "plan_developpement",
  "public_europe",
  "public_etat",
  "public_region",
  "public_france_travail",
  "public_autre",
];

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

function organismeDeLaDemande(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    const demande = new URL(req.url).searchParams.get("tenant");
    if (demande) return demande;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data: registre, error } = await supabase
      .from("organisme_apprenants")
      .select("id, email, nom, statut, payeur, dispositif, statut_stagiaire, formation_code, prix_vente, created_at")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: valides } = await supabase
      .from("progression_apprenants")
      .select("user_email")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(5000);

    const compte: any = {};
    for (const v of valides || []) {
      compte[v.user_email] = (compte[v.user_email] || 0) + 1;
    }

    const liste = (registre || []).map(function (a: any) {
      return { ...a, modules_valides: compte[a.email] || 0 };
    });

    const parPayeur: any = {};
    let chiffre = 0;
    let incomplets = 0;
    for (const a of liste) {
      const p = a.payeur || "non_renseigne";
      parPayeur[p] = (parPayeur[p] || 0) + 1;
      chiffre = chiffre + (Number(a.prix_vente) || 0);
      if (!a.statut_stagiaire || !a.payeur) incomplets = incomplets + 1;
    }

    return NextResponse.json({
      ok: true,
      tenant_id: tenant,
      nombre: liste.length,
      payeurs: PAYEURS,
      statuts: STATUTS,
      dispositifs: DISPOSITIFS,
      par_payeur: parPayeur,
      chiffre_declare: chiffre,
      incomplets: incomplets,
      apprenants: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const brut = String(corps.emails || corps.email || "");
    const trouves = brut
      .split(/[\s,;]+/)
      .map(function (e) { return e.trim().toLowerCase(); })
      .filter(function (e) { return e.length > 4 && e.indexOf("@") > 0 && e.indexOf(".") > 0; });

    const uniques = Array.from(new Set(trouves));

    if (uniques.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucune adresse valable dans votre saisie." }, { status: 400 });
    }

    const payeur = String(corps.payeur || "").trim().toLowerCase();
    if (payeur && PAYEURS.indexOf(payeur) < 0) {
      return NextResponse.json({ ok: false, erreur: "Payeur inconnu." }, { status: 400 });
    }

    const dispositif = String(corps.dispositif || "").trim().toLowerCase();
    if (dispositif && DISPOSITIFS.indexOf(dispositif) < 0) {
      return NextResponse.json({ ok: false, erreur: "Dispositif inconnu." }, { status: 400 });
    }

    const statutStagiaire = String(corps.statut_stagiaire || "").trim().toLowerCase();
    if (statutStagiaire && STATUTS.indexOf(statutStagiaire) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut de stagiaire inconnu." }, { status: 400 });
    }

    const formation = String(corps.formation_code || "").trim().toUpperCase();
    const prix = corps.prix_vente !== undefined && corps.prix_vente !== null && corps.prix_vente !== ""
      ? Number(corps.prix_vente)
      : null;

    if (prix !== null && (isNaN(prix) || prix < 0)) {
      return NextResponse.json({ ok: false, erreur: "Prix de vente invalide." }, { status: 400 });
    }

    const lignes = uniques.map(function (email) {
      return {
        tenant_id: tenant,
        email: email,
        nom: uniques.length === 1 && corps.nom ? String(corps.nom).trim() : null,
        statut: "invite",
        payeur: payeur || null,
        dispositif: dispositif || null,
        statut_stagiaire: statutStagiaire || null,
        formation_code: formation || null,
        prix_vente: prix,
      };
    });

    const { error } = await supabase
      .from("organisme_apprenants")
      .upsert(lignes, { onConflict: "tenant_id,email", ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ajoutes: uniques.length, emails: uniques });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps || !corps.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const modifications: any = {};

    // LE NOM. Il ne figurait nulle part en modification, alors qu il est
    // porte par l attestation de fin de formation : un stagiaire inscrit
    // par une simple adresse restait anonyme jusqu au bout.
    if (corps.nom !== undefined) {
      modifications.nom = corps.nom ? String(corps.nom).trim().slice(0, 200) : null;
    }

    if (corps.payeur !== undefined) {
      const p = String(corps.payeur || "").trim().toLowerCase();
      if (p && PAYEURS.indexOf(p) < 0) {
        return NextResponse.json({ ok: false, erreur: "Payeur inconnu." }, { status: 400 });
      }
      modifications.payeur = p || null;
    }

    if (corps.dispositif !== undefined) {
      const dd = String(corps.dispositif || "").trim().toLowerCase();
      if (dd && DISPOSITIFS.indexOf(dd) < 0) {
        return NextResponse.json({ ok: false, erreur: "Dispositif inconnu." }, { status: 400 });
      }
      modifications.dispositif = dd || null;
    }

    if (corps.statut_stagiaire !== undefined) {
      const s = String(corps.statut_stagiaire || "").trim().toLowerCase();
      if (s && STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut de stagiaire inconnu." }, { status: 400 });
      }
      modifications.statut_stagiaire = s || null;
    }

    if (corps.formation_code !== undefined) {
      modifications.formation_code = corps.formation_code
        ? String(corps.formation_code).trim().toUpperCase()
        : null;
    }

    if (corps.prix_vente !== undefined) {
      const prix = corps.prix_vente === null || corps.prix_vente === ""
        ? null
        : Number(corps.prix_vente);
      if (prix !== null && (isNaN(prix) || prix < 0)) {
        return NextResponse.json({ ok: false, erreur: "Prix de vente invalide." }, { status: 400 });
      }
      modifications.prix_vente = prix;
    }

    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_apprenants")
      .update(modifications)
      .eq("id", corps.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: corps.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = organismeDeLaDemande(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_apprenants")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
