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
    .select("id, label, legal_name, formation_state, tenant_id, forfait")
    .eq("id", entiteId)
    .eq("tenant_id", tenant)
    .limit(1)
    .maybeSingle();
  return data || null;
}

// ══════════════════════════════════════════════════════════════════════════
// 🚨 LE FORFAIT DECIDE DE L ACCES A LA COMPTABILITE — 07/09.
//
// Deux forfaits en base (`tarifs`, produit 'mysterllc') :
//   suivi         49 €/mois — echeances, formulaires preremplis, relances
//   comptabilite  99 €/mois — tout le suivi, PLUS la saisie des depenses
//
// Sans ce controle, une societe a 49 € accedait a la comptabilite comme
// une societe a 99 € : la difference de prix ne reposait sur rien.
//
// ⚠️ LE CONTROLE EST DANS LA ROUTE, PAS SEULEMENT DANS L ECRAN. Un ecran
// qui masque un bouton n empeche personne d appeler l adresse directement.
//
// ⚠️ UNE SOCIETE SANS FORFAIT EST TRAITEE COMME « suivi ». Elle n a rien
// souscrit : lui ouvrir la comptabilite reviendrait a offrir le forfait le
// plus cher a celui qui n en a pris aucun.
//
// ⚠️ LE MESSAGE DIT QUOI FAIRE. « Non autorise » laisserait le client
// croire a un defaut ; on nomme le forfait qui ouvre la fonction.
// ══════════════════════════════════════════════════════════════════════════
function comptabiliteOuverte(societe: any): boolean {
  return societe && societe.forfait === "comptabilite";
}

const REFUS_FORFAIT = "Cette société est au forfait Suivi. La tenue de la "
  + "comptabilité — dépenses, justificatifs, compte courant d'associé — "
  + "fait partie du forfait Suivi et comptabilité. Écrivez-nous pour "
  + "changer de forfait.";

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

  // 🚨 LE FORFAIT EST VERIFIE AVANT TOUTE LECTURE. On rend 403 avec le
  // nom de la societe et son forfait : l ecran peut ainsi afficher un
  // message utile plutot qu une page vide.
  if (!comptabiliteOuverte(societe)) {
    return NextResponse.json(
      {
        ok: false,
        erreur: REFUS_FORFAIT,
        forfait: societe.forfait || null,
        societe: { id: societe.id, label: societe.label },
      },
      { status: 403 }
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
//
// 🆕 DEUX FORMATS ACCEPTES — 07/09.
//
// ⚠️ L AJOUT AVEC JUSTIFICATIF ARRIVE EN `multipart/form-data` : c est le
// seul moyen de faire passer un fichier. Les autres actions — rembourser,
// supprimer — arrivent en JSON, comme avant. On lit l en-tete pour savoir
// lequel, plutot que d imposer un format a l ecran.
//
// 🚨 LE FICHIER EST TELEVERSE AVANT L INSERTION, et si le televersement
// echoue, RIEN N EST ENREGISTRE. Une depense sans sa piece alors que le
// client croit l avoir jointe, c est exactement le trou de justificatif
// qu on cherche a eviter.
export async function POST(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  let b: any = null;
  let fichier: File | null = null;

  const typeContenu = String(req.headers.get("content-type") || "");
  if (typeContenu.indexOf("multipart/form-data") >= 0) {
    const fd = await req.formData().catch(function () { return null; });
    if (!fd) {
      return NextResponse.json({ ok: false, erreur: "Formulaire illisible." }, { status: 400 });
    }
    b = {};
    fd.forEach(function (v: any, k: string) {
      if (k === "fichier") return;
      b[k] = String(v);
    });
    // Les booleens arrivent en texte depuis un formulaire.
    b.avance_perso = b.avance_perso === "true";
    b.recurrente = b.recurrente === "true";
    const f = fd.get("fichier");
    if (f && typeof f === "object" && (f as any).size > 0) fichier = f as File;
  } else {
    b = await req.json().catch(function () { return null; });
  }

  if (!b || !b.action) {
    return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
  }

  const societe = await societeDuClient(String(b.societe || ""), c.tenant);
  if (!societe) {
    return NextResponse.json({ ok: false, erreur: "Société introuvable." }, { status: 404 });
  }

  // ⚠️ MEME CONTROLE EN ECRITURE. Sans lui, une societe au forfait Suivi
  // ne verrait rien mais pourrait quand meme ajouter des depenses en
  // appelant la route directement.
  if (!comptabiliteOuverte(societe)) {
    return NextResponse.json(
      { ok: false, erreur: REFUS_FORFAIT, forfait: societe.forfait || null },
      { status: 403 }
    );
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

    // ---- LE JUSTIFICATIF ----
    //
    // ⚠️ MEME BUCKET ET MEME FORME DE CHEMIN QUE LA COMPTABILITE D ACADEMIA
    // (`documents-comptables`, `Depenses/<annee>/<horodatage>_<nom>`). Un
    // seul endroit, une seule regle de rangement : l export et la lecture
    // des pieces fonctionnent a l identique pour les deux.
    //
    // ⚠️ LE CHEMIN PORTE LA SOCIETE. Sans cela, deux clients qui televersent
    // « facture.pdf » la meme seconde se marcheraient dessus.
    let cheminPiece: string | null = null;
    if (fichier) {
      if (fichier.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, erreur: "Fichier trop lourd (8 Mo maximum)." },
          { status: 400 }
        );
      }
      const octets = Buffer.from(await fichier.arrayBuffer());
      const nomPropre = String(fichier.name || "piece")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
      const annee = String(date).slice(0, 4);
      cheminPiece = "Depenses/" + annee + "/" + societe.id.slice(0, 8)
        + "_" + Date.now() + "_" + nomPropre;

      const { error: eUp } = await supabase.storage
        .from("documents-comptables")
        .upload(cheminPiece, octets, {
          contentType: fichier.type || "application/octet-stream",
          upsert: false,
        });

      if (eUp) {
        console.error("[compliance/depenses] televersement : " + eUp.message);
        return NextResponse.json(
          { ok: false, erreur: "Le justificatif n'a pas pu être enregistré. Réessayez." },
          { status: 500 }
        );
      }
    }

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
        pdf_url: cheminPiece,
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

  // ---- OUVRIR UNE PIECE ----
  //
  // ⚠️ LE BUCKET EST PRIVE : les pieces ne s ouvrent que par URL signee,
  // valable cinq minutes. On verifie que la depense appartient bien a la
  // societe du client avant de signer quoi que ce soit.
  if (b.action === "ouvrir_piece") {
    const id = String(b.id || "");
    const { data: dep } = await supabase
      .from("depenses")
      .select("pdf_url")
      .eq("id", id)
      .eq("entite_id", societe.id)
      .limit(1)
      .maybeSingle();

    if (!dep || !dep.pdf_url) {
      return NextResponse.json({ ok: false, erreur: "Aucune pièce sur cette dépense." }, { status: 404 });
    }

    let chemin = String(dep.pdf_url);
    if (chemin.indexOf("documents-comptables/") === 0) {
      chemin = chemin.slice("documents-comptables/".length);
    }

    const { data: signee, error: eS } = await supabase.storage
      .from("documents-comptables")
      .createSignedUrl(chemin, 300);

    if (eS || !signee) {
      return NextResponse.json({ ok: false, erreur: "Pièce indisponible." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, url: signee.signedUrl });
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
