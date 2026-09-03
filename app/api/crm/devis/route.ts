import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// ══════════════════════════════════════════════════════════════════════════
// LE DEVIS MR CRM — 03/09.
//
// MEME MONTAGE QUE MR LMS : Jacques envoie un lien a jeton apres l echange,
// le prospect renseigne SA fiche, choisit son effectif, et obtient son
// devis. Personne ne recopie rien.
//
// 🚨 LE PALIER SE DEDUIT DE L EFFECTIF, IL NE SE CHOISIT PAS. Le prospect
// dit combien de personnes utiliseront l outil ; le palier suit. Il voit
// ainsi qu a six personnes il bascule a 99 € plutot que de payer cinq
// utilisateurs supplementaires a 7 €.
//
// 🚨 TOUT EST COMPRIS DANS L ABONNEMENT — facturation, campagnes,
// rendez-vous en ligne. AUCUN MODULE PAYANT. Decision du 03/09, apres
// releve du marche : les CRM francais qui gagnent sur cette cible incluent
// tout et ne facturent que l usage externe. Vendre des modules a 13-41 €
// piece ferait monter la facture affichee au-dessus de la concurrence a
// effectif egal.
//
// SEULS SE PAIENT A L USAGE : la telephonie, les SMS, la signature. Ils ont
// un cout reel pour la maison.
//
// 🚨 LA TELEPHONIE EST RESERVEE AUX CLIENTS EUROPEENS. Les lignes portent
// `perimetre = 'eea'` dans `tarifs` ; ce filtre les retire du devis pour un
// pays hors Espace economique europeen. Hors EEA, la minute coute sept fois
// plus cher chez l operateur et la maison perdrait de l argent sur chaque
// appel.
// ⚠️ CE FILTRE N EST QU UN PREMIER NIVEAU. Deux autres gardes existent
// ailleurs : aucun numero non europeen ne s associe a un compte, et un
// appel dont l identifiant d appelant n est pas europeen ne part pas.
// ══════════════════════════════════════════════════════════════════════════

const PRODUIT = "crm";

// Les pays de l Espace economique europeen, plus la Suisse et le
// Royaume-Uni, ou l origination reste possible a tarif europeen.
// ⚠️ COMPARAISON EN MINUSCULES SANS ACCENT : le prospect saisit son pays
// librement, « france », « France » et « FRANCE » doivent passer.
const PAYS_EEA = [
  "france", "allemagne", "autriche", "belgique", "bulgarie", "chypre",
  "croatie", "danemark", "espagne", "estonie", "finlande", "grece",
  "hongrie", "irlande", "islande", "italie", "lettonie", "liechtenstein",
  "lituanie", "luxembourg", "malte", "norvege", "pays-bas", "pologne",
  "portugal", "roumanie", "slovaquie", "slovenie", "suede", "tchequie",
  "republique tcheque", "suisse", "royaume-uni",
];

const CHAMPS_PROSPECT = [
  "raison_sociale",
  "contact_nom",
  "contact_email",
  "adresse",
  "code_postal",
  "ville",
  "pays",
  "telephone",
  "siret",
];

const OFFRES = ["solo", "equipe", "entreprise"];

function texte(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

function sansAccent(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function estEuropeen(pays: any): boolean {
  const p = sansAccent(String(pays || ""));
  if (!p) return true; // Pays non renseigne : on ne retire rien avant de savoir.
  return PAYS_EEA.indexOf(p) >= 0;
}

// LE PALIER SE DEDUIT DE L EFFECTIF. `seuil_max` de la ligne abonnement
// donne le plafond de chaque palier ; au-dela du dernier, l utilisateur
// supplementaire s ajoute a l unite.
function palierPour(nb: number, abonnements: any[]) {
  const tries = abonnements
    .slice()
    .sort(function (a: any, b: any) { return (a.plafond || 0) - (b.plafond || 0); });

  for (const a of tries) {
    if (a.plafond !== null && nb <= a.plafond) return a;
  }
  return tries[tries.length - 1] || null;
}

function rangerTarifs(lignes: any[], europeen: boolean) {
  const abonnements = lignes
    .filter(function (l: any) { return l.poste === "abonnement"; })
    .map(function (l: any) {
      return {
        offre: l.offre,
        libelle: l.libelle,
        prix: Number(l.montant) || 0,
        plafond: l.seuil_max === null || l.seuil_max === undefined
          ? null
          : Number(l.seuil_max),
      };
    });

  function poste(nom: string, offre?: string) {
    return lignes.find(function (l: any) {
      return l.poste === nom && (!offre || l.offre === offre);
    }) || null;
  }

  function lots(nom: string, offre: string) {
    return lignes
      .filter(function (l: any) { return l.poste === nom && l.offre === offre; })
      .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
      .map(function (l: any) {
        const nombre = Number(l.seuil_min) || 0;
        const prix = Number(l.montant) || 0;
        return {
          libelle: l.libelle,
          nombre: nombre,
          prix: prix,
          unitaire: nombre > 0 ? Math.round((prix / nombre) * 1000) / 1000 : 0,
        };
      });
  }

  return { abonnements: abonnements, poste: poste, lots: lots, europeen: europeen };
}

async function lireProspect(jeton: string) {
  const { data } = await supabase
    .from("prospects_devis")
    .select("*")
    .eq("jeton", jeton)
    .eq("produit", PRODUIT)
    .maybeSingle();
  return data;
}

async function lireTarifs() {
  const { data } = await supabase
    .from("tarifs")
    .select("offre, poste, libelle, montant, pourcentage, unite, seuil_min, seuil_max, perimetre, optionnel, commentaire")
    .eq("produit", PRODUIT)
    .limit(300);
  return data || [];
}

// Construit la grille visible par le prospect, pour une offre donnee.
function grillePour(lignes: any[], offre: string, europeen: boolean) {
  const dedans = lignes.filter(function (l: any) { return l.offre === offre; });
  const r = rangerTarifs(lignes, europeen);

  function un(nom: string) {
    return dedans.find(function (l: any) { return l.poste === nom; }) || null;
  }

  function lots(nom: string) {
    return dedans
      .filter(function (l: any) { return l.poste === nom; })
      .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
      .map(function (l: any) {
        const nombre = Number(l.seuil_min) || 0;
        const prix = Number(l.montant) || 0;
        return {
          nombre: nombre,
          prix: prix,
          unitaire: nombre > 0 ? Math.round((prix / nombre) * 1000) / 1000 : 0,
        };
      });
  }

  const abo = un("abonnement");
  const sup = un("utilisateur_sup");
  const sig = un("signature");
  const sigOfferte = un("signature_offerte");
  const tel = un("telephonie");
  const sms = un("sms");

  return {
    offre: offre,
    abonnement: abo ? Number(abo.montant) || 0 : 0,
    abonnement_libelle: abo ? abo.libelle : "",
    plafond: abo && abo.seuil_max !== null ? Number(abo.seuil_max) : null,
    utilisateur_sup: sup ? Number(sup.montant) || 0 : 0,

    signature_unitaire: sig ? Number(sig.montant) || 0 : 0,
    signature_lots: lots("signature_lot"),
    signatures_offertes: sigOfferte ? Number(sigOfferte.seuil_min) || 0 : 0,

    // 🚨 LA TELEPHONIE DISPARAIT HORS EEA. On ne renvoie meme pas le prix :
    // ce qui n est pas envoye ne peut pas s afficher par erreur.
    telephonie: europeen && tel ? Number(tel.montant) || 0 : 0,
    telephonie_lots: europeen ? lots("telephonie_lot") : [],
    telephonie_disponible: europeen && !!tel,

    sms: sms ? Number(sms.montant) || 0 : 0,
    sms_lots: lots("sms_lot"),
  };
}

// ── LECTURE ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const jeton = texte(new URL(req.url).searchParams.get("jeton"), 64);
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const prospect = await lireProspect(jeton);
    if (!prospect) {
      // On ne distingue pas un jeton faux d un jeton expire : le message
      // est le meme, pour qu on ne puisse pas en deviner un.
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable. Demandez-nous-en un nouveau." },
        { status: 404 }
      );
    }

    const lignes = await lireTarifs();
    const europeen = estEuropeen(prospect.pays);

    const grilles: any = {};
    for (const o of OFFRES) grilles[o] = grillePour(lignes, o, europeen);

    return NextResponse.json({
      ok: true,
      prospect: {
        raison_sociale: prospect.raison_sociale || "",
        contact_nom: prospect.contact_nom || "",
        contact_email: prospect.contact_email || "",
        adresse: prospect.adresse || "",
        code_postal: prospect.code_postal || "",
        ville: prospect.ville || "",
        pays: prospect.pays || "France",
        telephone: prospect.telephone || "",
        siret: prospect.siret || "",
        utilisateurs_estimes: prospect.utilisateurs_estimes || 1,
        telephonie: !!prospect.telephonie,
        sms: !!prospect.sms,
        minutes_estimees: prospect.minutes_estimees || 0,
        sms_estimes: prospect.sms_estimes || 0,
        statut: prospect.statut || "invite",
        numero_devis: prospect.numero_devis || "",
      },
      europeen: europeen,
      tarifs: grilles,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// ── ENREGISTREMENT ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const corps = await req.json();
    const jeton = texte(corps.jeton, 64);
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const prospect = await lireProspect(jeton);
    if (!prospect) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable. Demandez-nous-en un nouveau." },
        { status: 404 }
      );
    }

    // Un devis signe ne se modifie plus : sans ce garde-fou, un prospect
    // pourrait changer son effectif apres accord.
    if (prospect.signe_le) {
      return NextResponse.json(
        { ok: false, erreur: "Ce devis a été accepté ; il ne peut plus être modifié." },
        { status: 409 }
      );
    }

    const maj: any = { updated_at: new Date().toISOString() };
    for (const champ of CHAMPS_PROSPECT) {
      if (corps[champ] !== undefined) maj[champ] = texte(corps[champ], 300) || null;
    }

    const nbUtil = parseInt(String(corps.utilisateurs_estimes || ""), 10);
    maj.utilisateurs_estimes = isNaN(nbUtil) || nbUtil < 1 ? 1 : Math.min(nbUtil, 10000);

    const europeen = estEuropeen(maj.pays || prospect.pays);

    // 🚨 LA TELEPHONIE NE PEUT PAS ETRE ACTIVEE HORS EEA, quelle que soit
    // la case cochee cote navigateur. Le formulaire ne l affiche pas, mais
    // rien n empeche d envoyer le champ a la main : la garde est ici.
    maj.telephonie = europeen && corps.telephonie === true;
    maj.sms = corps.sms === true;

    const mn = parseInt(String(corps.minutes_estimees || ""), 10);
    maj.minutes_estimees = isNaN(mn) || mn < 0 ? 0 : Math.min(mn, 1000000);

    const nbSms = parseInt(String(corps.sms_estimes || ""), 10);
    maj.sms_estimes = isNaN(nbSms) || nbSms < 0 ? 0 : Math.min(nbSms, 1000000);

    if ((prospect.statut || "invite") === "invite") maj.statut = "renseigne";

    if (!prospect.numero_devis) {
      const annee = new Date().getUTCFullYear();
      // Numero global, toutes marques confondues : deux devis ne peuvent
      // pas porter le meme numero.
      const { count } = await supabase
        .from("prospects_devis")
        .select("id", { count: "exact", head: true })
        .not("numero_devis", "is", null);
      const rang = (typeof count === "number" ? count : 0) + 1;
      maj.numero_devis = String(annee) + "-" + String(rang).padStart(3, "0");
    }

    const { error } = await supabase
      .from("prospects_devis")
      .update(maj)
      .eq("jeton", jeton)
      .eq("produit", PRODUIT);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // ── LE CALCUL, FAIT ICI ET NON DANS LE NAVIGATEUR ──────────────────────
    const lignes = await lireTarifs();
    const rang = rangerTarifs(lignes, europeen);
    const palier = palierPour(maj.utilisateurs_estimes, rang.abonnements);
    const offre = palier ? palier.offre : "solo";
    const g = grillePour(lignes, offre, europeen);

    // Au-dela du dernier palier, chaque utilisateur en plus se facture.
    const supplementaires = g.plafond !== null && maj.utilisateurs_estimes > g.plafond
      ? maj.utilisateurs_estimes - g.plafond
      : 0;
    const coutSup = supplementaires * g.utilisateur_sup;

    const mensuelFixe = g.abonnement + coutSup;

    const coutTel = maj.telephonie ? maj.minutes_estimees * g.telephonie : 0;
    const coutSms = maj.sms ? maj.sms_estimes * g.sms : 0;
    const mensuelTotal = Math.round((mensuelFixe + coutTel + coutSms) * 100) / 100;

    // LE COUT PAR UTILISATEUR : c est le chiffre que le prospect compare a
    // ce qu il paie ailleurs. Jamais un total annuel.
    const coutParUtilisateur = maj.utilisateurs_estimes > 0
      ? Math.round((mensuelTotal / maj.utilisateurs_estimes) * 100) / 100
      : null;

    return NextResponse.json({
      ok: true,
      numero_devis: maj.numero_devis || prospect.numero_devis,
      devis: {
        offre: offre,
        offre_libelle: g.abonnement_libelle,
        utilisateurs: maj.utilisateurs_estimes,
        plafond: g.plafond,
        abonnement: g.abonnement,
        utilisateurs_supplementaires: supplementaires,
        utilisateur_sup: g.utilisateur_sup,
        cout_supplementaires: coutSup,

        signature_unitaire: g.signature_unitaire,
        signature_lots: g.signature_lots,
        signatures_offertes: g.signatures_offertes,

        telephonie_disponible: g.telephonie_disponible,
        telephonie: g.telephonie,
        telephonie_lots: g.telephonie_lots,
        telephonie_active: maj.telephonie,
        minutes: maj.minutes_estimees,
        cout_telephonie: Math.round(coutTel * 100) / 100,

        sms: g.sms,
        sms_lots: g.sms_lots,
        sms_actif: maj.sms,
        sms_nombre: maj.sms_estimes,
        cout_sms: Math.round(coutSms * 100) / 100,

        mensuel_fixe: mensuelFixe,
        mensuel_total: mensuelTotal,
        cout_par_utilisateur: coutParUtilisateur,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
