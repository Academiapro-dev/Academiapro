import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ══════════════════════════════════════════════════════════════════════════
// LA COMPTABILITE D UNE SOCIETE MYSTERLLC — 07/09.
//
// POURQUOI CETTE ROUTE EXISTE. La fiche d une societe annonce depuis
// toujours que « les montants se recalculent automatiquement depuis les
// depenses marquees comme avances personnelles » — alors qu il n existait
// nulle part ou les marquer. C etait une promesse d ecran non tenue.
//
// 🚨 LA BRIQUE EXISTAIT DEJA, ELLE N ETAIT PAS BRANCHEE. La table
// `depenses` porte `entite_id` depuis le debut, avec une cle etrangere
// vers `compliance_tenants`. Zero ligne l utilisait au 07/09.
// L ecran /admin/comptabilite d AcadeMIA lit la meme table sans ce filtre,
// parce que c est la comptabilite de Jacques et qu il n a qu une societe.
//
// ⚠️ CE QUI CHANGE ICI, ET C EST TOUT : le CLOISONNEMENT. Une dependance
// appartient a une SOCIETE, la societe appartient a un CLIENT, et le
// client est celui de la session. Deux verrous, pas un.
//
// 🚨 LE TENANT VIENT DU COOKIE SIGNE, JAMAIS DE LA REQUETE. Accepter un
// tenant envoye par l ecran laisserait n importe qui lire la comptabilite
// de n importe quelle societe en changeant un identifiant.
//
// ⚠️ POURQUOI PAS DE MOT DE PASSE SEPARE, contrairement a
// /api/admin/compta. Celui-ci protege la comptabilite de Jacques, qui vit
// sous /admin. Ici, la session client suffit : le middleware a deja
// verifie qu il est connecte, et le filtre sur `tenant_id` fait le reste.
// Un mot de passe de plus n ajouterait rien qu un obstacle.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les categories proposees. ⚠️ ELLES NE SONT PAS EN BASE : les figer ici
// evite qu un client invente une categorie qui casserait les regroupements.
const CATEGORIES = [
  "Logiciels",
  "Hebergement",
  "IA / API",
  "Frais generaux",
  "Honoraires",
  "Frais bancaires",
  "Agent enregistre",
  "Taxes et redevances",
  "Autre",
];

const DEVISES = ["USD", "EUR", "GBP", "CHF"];

function trimestreDe(dateTexte: string): string {
  const d = new Date(dateTexte);
  if (isNaN(d.getTime())) return "";
  return d.getFullYear() + "-T" + (Math.floor(d.getMonth() / 3) + 1);
}

async function contexte() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) return { erreur: "Vous devez être connecté.", code: 401 };
  if (!tenant) return { erreur: "Aucun espace rattaché à votre compte.", code: 403 };
  return { email: email, tenant: tenant };
}

// 🚨 LE VERROU CENTRAL. Il repond a une seule question : cette societe
// appartient-elle bien au client de la session ?
//
// ⚠️ TOUTE ACTION PASSE PAR LUI, sans exception. Une action qui ferait
// confiance a `entite_id` sans ce controle ouvrirait la comptabilite de
// tous les clients a celui qui devine un identifiant.
async function societeDuClient(entiteId: string, tenant: string) {
  if (!entiteId) return null;
  const { data } = await supabase
    .from("compliance_tenants")
    .select("id, label, legal_name, formation_state, tenant_id")
    .eq("id", entiteId)
    .eq("tenant_id", tenant)
    .limit(1)
    .maybeSingle();
  return data || null;
}

// ---- LIRE ----
export async function GET(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const entiteId = String(req.nextUrl.searchParams.get("societe") || "");
  const societe = await societeDuClient(entiteId, c.tenant);
  if (!societe) {
    return NextResponse.json(
      { ok: false, erreur: "Société introuvable." },
      { status: 404 }
    );
  }

  // ⚠️ LE TRIMESTRE EST FACULTATIF. Sans lui, on rend tout : un client qui
  // arrive veut voir son historique, pas un trimestre vide.
  const trimestre = String(req.nextUrl.searchParams.get("trimestre") || "");

  let q = supabase
    .from("depenses")
    .select("id, fournisseur, categorie, description, pays_fournisseur, "
      + "montant_ttc, devise, avance_perso, rembourse, recurrente, "
      + "date_depense, trimestre, pdf_url, created_at")
    .eq("entite_id", societe.id)
    .order("date_depense", { ascending: false });

  if (trimestre) q = q.eq("trimestre", trimestre);

  const { data, error } = await q.limit(500);

  if (error) {
    console.error("[compliance/depenses] GET : " + error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  const lignes = data || [];

  // ══════════════════════════════════════════════════════════════════════
  // LE COMPTE COURANT D ASSOCIE.
  //
  // 🚨 C EST LE CHIFFRE QUI ALIMENTE LE FORM 5472. Une avance personnelle
  // est une somme que le proprietaire a payee pour la societe : elle lui
  // est due, et elle se declare comme transaction entre la societe et son
  // proprietaire etranger.
  //
  // ⚠️ ON TOTALISE PAR DEVISE, JAMAIS EN UNE SEULE MONNAIE. Convertir
  // supposerait un taux, et le taux officiel de l IRS n est publie qu en
  // debut d annee suivante. Additionner des dollars et des euros
  // produirait un chiffre faux qui aurait l air juste.
  //
  // ⚠️ LES AVANCES DEJA REMBOURSEES SORTENT DU TOTAL : elles ne sont plus
  // dues. Mais elles restent dans la liste — elles se declarent quand meme.
  // ══════════════════════════════════════════════════════════════════════
  const parDevise: any = {};
  let nbAvances = 0;

  for (const l of lignes) {
    if (!l.avance_perso || l.rembourse) continue;
    const d = String(l.devise || "EUR");
    parDevise[d] = (parDevise[d] || 0) + Number(l.montant_ttc || 0);
    nbAvances++;
  }

  const compteCourant = Object.keys(parDevise).map(function (d) {
    return { devise: d, montant: Math.round(parDevise[d] * 100) / 100 };
  });

  // 🚨 LES MOUVEMENTS SANS JUSTIFICATIF. Jacques, le 07/09 : « MysterLLC
  // passera la main a un expert-comptable si la comptabilite possede des
  // trous sur le plan des justificatifs ».
  //
  // ⚠️ CE N EST PAS UN REFUS DE CLIENT, C EST UNE LIMITE DE SERVICE : on ne
  // prepare pas un formulaire qu on ne peut pas justifier. Le compte se
  // rend ici pour que l ecran puisse l afficher, et plus tard bloquer la
  // generation.
  const sansJustificatif = lignes.filter(function (l: any) {
    return !l.pdf_url;
  }).length;

  return NextResponse.json({
    ok: true,
    societe: {
      id: societe.id,
      label: societe.label,
      legal_name: societe.legal_name,
      formation_state: societe.formation_state,
    },
    depenses: lignes,
    compte_courant: compteCourant,
    nb_avances: nbAvances,
    sans_justificatif: sansJustificatif,
    categories: CATEGORIES,
    devises: DEVISES,
  });
}

// ---- ECRIRE ----
export async function POST(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const b = await req.json().catch(function () { return null; });
  if (!b || !b.action) {
    return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
  }

  const societe = await societeDuClient(String(b.societe || ""), c.tenant);
  if (!societe) {
    return NextResponse.json({ ok: false, erreur: "Société introuvable." }, { status: 404 });
  }

  // ---- AJOUTER UNE DEPENSE ----
  if (b.action === "ajouter") {
    const fournisseur = String(b.fournisseur || "").trim().slice(0, 120);
    if (fournisseur.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez le fournisseur." },
        { status: 400 }
      );
    }

    const montant = Number(b.montant_ttc);
    if (!montant || isNaN(montant) || montant <= 0) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez un montant." },
        { status: 400 }
      );
    }

    // ⚠️ CATEGORIE ET DEVISE SONT RAMENEES A LA LISTE. Une valeur libre 
    // casserait les regroupements par categorie et le total par devise.
    const categorie = CATEGORIES.indexOf(String(b.categorie)) >= 0
      ? String(b.categorie) : "Autre";
    const devise = DEVISES.indexOf(String(b.devise)) >= 0
      ? String(b.devise) : "EUR";

    const date = String(b.date_depense || "").slice(0, 10)
      || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("depenses")
      .insert({
        entite_id: societe.id,
        // ⚠️ ON POSE AUSSI `tenant_id` : il sert aux lectures transverses
        // et evite qu une ligne se retrouve orpheline si `entite_id`
        // venait a etre efface.
        tenant_id: c.tenant,
        fournisseur: fournisseur,
        categorie: categorie,
        description: String(b.description || "").slice(0, 500) || null,
        pays_fournisseur: String(b.pays_fournisseur || "").slice(0, 2).toUpperCase() || null,
        montant_ttc: montant,
        devise: devise,
        avance_perso: b.avance_perso === true,
        recurrente: b.recurrente === true,
        date_depense: date,
        trimestre: trimestreDe(date),
        pdf_url: String(b.pdf_url || "") || null,
      })
      .select("id, fournisseur, categorie, montant_ttc, devise, avance_perso, "
        + "recurrente, date_depense, trimestre, pdf_url")
      .maybeSingle();

    if (error) {
      console.error("[compliance/depenses] ajouter : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Enregistrement impossible." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, depense: data });
  }

  // ---- MARQUER UNE AVANCE REMBOURSEE ----
  //
  // ⚠️ ON NE SUPPRIME PAS L AVANCE : elle sort du compte courant mais reste
  // dans la liste. Une avance remboursee est un mouvement entre la societe
  // et son proprietaire — elle se declare au 5472 comme les autres.
  if (b.action === "rembourser") {
    const id = String(b.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dépense non précisée." }, { status: 400 });
    }

    const { error } = await supabase
      .from("depenses")
      .update({ rembourse: true })
      .eq("id", id)
      .eq("entite_id", societe.id);

    if (error) {
      console.error("[compliance/depenses] rembourser : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Modification impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- SUPPRIMER ----
  //
  // ⚠️ SUPPRESSION REELLE, contrairement aux colonnes ou aux campagnes du
  // CRM. Une depense saisie par erreur — mauvais montant, doublon — n a
  // aucune valeur d historique : la garder desactivee fausserait les
  // totaux sans rien apporter.
  if (b.action === "supprimer") {
    const id = String(b.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dépense non précisée." }, { status: 400 });
    }

    const { error } = await supabase
      .from("depenses")
      .delete()
      .eq("id", id)
      .eq("entite_id", societe.id);

    if (error) {
      console.error("[compliance/depenses] supprimer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Suppression impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
