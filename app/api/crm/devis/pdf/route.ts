import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
// LE PDF DU DEVIS MR CRM — 03/09.
//
// 🚨 LES MONTANTS SE RELISENT EN BASE. Seul le jeton circule : un PDF qui
// recevrait ses chiffres du navigateur pourrait etre fabrique avec
// n importe quels montants.
//
// 🚨 LE CALCUL EST LE MEME QUE DANS /api/crm/devis. Un ecart entre l ecran
// et l imprime est pire qu une erreur partout : le client ne sait plus
// lequel croire. TOUTE MODIFICATION SE FAIT DANS LES DEUX FICHIERS.
//
// ⚠️ AUCUN TOTAL ANNUEL. Le devis se presente en cout par utilisateur.
// ⚠️ LA TELEPHONIE N EST IMPRIMEE QUE POUR UN CLIENT EUROPEEN.
// ══════════════════════════════════════════════════════════════════════════

const PRODUIT = "crm";

const EMETTEUR = {
  nom: "ACADÉMIA PRO LLC",
  adresse: "30 N Gould St STE R, Sheridan, WY 82801, États-Unis",
  identifiant: "EIN 32-0862305",
  contact: "contact@academiapro.fr",
  produit: "Mr CRM",
};

const PAYS_EEA = [
  "france", "allemagne", "autriche", "belgique", "bulgarie", "chypre",
  "croatie", "danemark", "espagne", "estonie", "finlande", "grece",
  "hongrie", "irlande", "islande", "italie", "lettonie", "liechtenstein",
  "lituanie", "luxembourg", "malte", "norvege", "pays-bas", "pologne",
  "portugal", "roumanie", "slovaquie", "slovenie", "suede", "tchequie",
  "republique tcheque", "suisse", "royaume-uni",
];

function sansAccent(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function estEuropeen(pays: any): boolean {
  const p = sansAccent(String(pays || ""));
  if (!p) return true;
  return PAYS_EEA.indexOf(p) >= 0;
}

// pdf-lib encode en WinAnsi : les lettres accentuees francaises passent
// tres bien. Seuls quelques signes typographiques n y sont pas.
function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20ac/g, "EUR")
    .replace(/\u00b7/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\xFF]/g, " ");
}

// 🚨 DEUX DECIMALES QUAND IL Y EN A — 03/09. « 18,80 EUR » et non
// « 18,8 EUR ». Les montants ronds restent sans decimale.
// ⚠️ L ECRAN ET LE PDF DOIVENT ECRIRE LE MEME MONTANT.
function euros(n: any): string {
  const v = Number(n) || 0;
  const entier = Math.round(v * 100) % 100 === 0;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  }) + " EUR";
}

function centimes(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }) + " EUR";
}

function grillePour(lignes: any[], offre: string, europeen: boolean) {
  const dedans = lignes.filter(function (l: any) { return l.offre === offre; });

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
    plafond: abo && abo.seuil_max !== null && abo.seuil_max !== undefined
      ? Number(abo.seuil_max)
      : null,
    utilisateur_sup: sup ? Number(sup.montant) || 0 : 0,
    signature_unitaire: sig ? Number(sig.montant) || 0 : 0,
    signature_lots: lots("signature_lot"),
    signatures_offertes: sigOfferte ? Number(sigOfferte.seuil_min) || 0 : 0,
    telephonie: europeen && tel ? Number(tel.montant) || 0 : 0,
    telephonie_lots: europeen ? lots("telephonie_lot") : [],
    telephonie_disponible: europeen && !!tel,
    sms: sms ? Number(sms.montant) || 0 : 0,
    sms_lots: lots("sms_lot"),
  };
}

function palierPour(nb: number, lignes: any[]) {
  const abos = lignes
    .filter(function (l: any) { return l.poste === "abonnement"; })
    .map(function (l: any) {
      return {
        offre: l.offre,
        plafond: l.seuil_max === null || l.seuil_max === undefined
          ? null
          : Number(l.seuil_max),
      };
    })
    .sort(function (a: any, b: any) { return (a.plafond || 0) - (b.plafond || 0); });

  for (const a of abos) {
    if (a.plafond !== null && nb <= a.plafond) return a.offre;
  }
  return abos.length > 0 ? abos[abos.length - 1].offre : "solo";
}

export async function GET(req: NextRequest) {
  try {
    const jeton = String(new URL(req.url).searchParams.get("jeton") || "").trim();
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const { data: p } = await supabase
      .from("prospects_devis")
      .select("*")
      .eq("jeton", jeton)
      .eq("produit", PRODUIT)
      .maybeSingle();

    if (!p) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable." },
        { status: 404 }
      );
    }

    if (!p.raison_sociale) {
      return NextResponse.json(
        { ok: false, erreur: "Renseignez votre fiche avant de télécharger le devis." },
        { status: 400 }
      );
    }

    const { data: lignes } = await supabase
      .from("tarifs")
      .select("offre, poste, libelle, montant, pourcentage, unite, seuil_min, seuil_max, perimetre, optionnel")
      .eq("produit", PRODUIT)
      .limit(300);

    const europeen = estEuropeen(p.pays);
    const nbUtil = Number(p.utilisateurs_estimes) || 1;
    const offre = palierPour(nbUtil, lignes || []);
    const g = grillePour(lignes || [], offre, europeen);

    const supplementaires = g.plafond !== null && nbUtil > g.plafond
      ? nbUtil - g.plafond
      : 0;
    const coutSup = supplementaires * g.utilisateur_sup;
    const mensuelFixe = g.abonnement + coutSup;

    const telActive = europeen && !!p.telephonie;
    const minutes = Number(p.minutes_estimees) || 0;
    const coutTel = telActive ? minutes * g.telephonie : 0;

    const smsActif = !!p.sms;
    const nbSms = Number(p.sms_estimes) || 0;
    const coutSms = smsActif ? nbSms * g.sms : 0;

    const mensuelTotal = Math.round((mensuelFixe + coutTel + coutSms) * 100) / 100;
    const coutParUtilisateur = nbUtil > 0
      ? Math.round((mensuelTotal / nbUtil) * 100) / 100
      : null;

    // ── Le document ────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const encre = rgb(0.12, 0.12, 0.14);
    const or = rgb(0.62, 0.53, 0.33);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 800;

    function saut(besoin: number) {
      if (y - besoin < 70) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
    }

    function ecrire(t: string, taille: number, police: any, couleur: any, decalage: number) {
      saut(taille + 6);
      page.drawText(ascii(t), { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
      y = y - taille - 6;
    }

    function ligne(g1: string, d1: string, forte?: boolean) {
      saut(18);
      const police = forte ? gras : normal;
      page.drawText(ascii(g1), { x: 55, y: y, size: 10, font: police, color: encre });
      const largeur = police.widthOfTextAtSize(ascii(d1), 10);
      page.drawText(ascii(d1), { x: 545 - largeur, y: y, size: 10, font: police, color: or });
      y = y - 16;
    }

    function paragraphe(t: string, taille: number, couleur: any) {
      const mots = ascii(t).split(" ");
      let courante = "";
      for (const mot of mots) {
        const essai = courante ? courante + " " + mot : mot;
        if (normal.widthOfTextAtSize(essai, taille) > 490) {
          saut(taille + 4);
          page.drawText(courante, { x: 55, y: y, size: taille, font: normal, color: couleur });
          y = y - taille - 4;
          courante = mot;
        } else {
          courante = essai;
        }
      }
      if (courante) {
        saut(taille + 4);
        page.drawText(courante, { x: 55, y: y, size: taille, font: normal, color: couleur });
        y = y - taille - 4;
      }
    }

    function titreCadre(t: string) {
      y = y - 12;
      saut(32);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.95, 0.94, 0.90) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: or });
      y = y - 28;
    }

    ecrire("DEVIS", 20, gras, or, 0);
    ecrire(EMETTEUR.produit + " - Savoir qui rappeler, et quoi lui dire", 12, normal, gris, 0);
    y = y - 6;

    const aujourdhui = new Date();
    const dateFr = aujourdhui.toLocaleDateString("fr-FR");
    const validite = new Date(aujourdhui.getTime() + 30 * 86400000).toLocaleDateString("fr-FR");

    ecrire(
      "Devis n° " + (p.numero_devis || "-") + "   -   " + dateFr
      + "   -   Validite : " + validite + "   -   Prix hors taxes",
      9, normal, gris, 0
    );

    titreCadre("EMETTEUR");
    ligne("Denomination", EMETTEUR.nom);
    ligne("Adresse", EMETTEUR.adresse);
    ligne("Identifiant", EMETTEUR.identifiant);
    ligne("Contact", EMETTEUR.contact);

    titreCadre("DESTINATAIRE");
    ligne("Raison sociale", p.raison_sociale || "-");
    if (p.contact_nom) ligne("Contact", p.contact_nom);
    if (p.contact_email) ligne("Adresse electronique", p.contact_email);
    if (p.telephone) ligne("Telephone", p.telephone);
    const lieu = [p.adresse, [p.code_postal, p.ville].filter(Boolean).join(" "), p.pays]
      .filter(Boolean).join(", ");
    if (lieu) ligne("Adresse", lieu);
    if (p.siret) ligne("SIRET", p.siret);

    titreCadre("OBJET");
    paragraphe(
      "Mise a disposition d'un outil de gestion de la relation client pour "
      + (p.raison_sociale || "votre organisation") + " : contacts, historique des "
      + "echanges, relances, devis et factures, campagnes et prise de rendez-vous "
      + "en ligne.",
      10, encre
    );
    y = y - 2;
    paragraphe(
      "Tout est compris dans l'abonnement. Aucun module a debloquer : le tarif "
      + "depend du nombre d'utilisateurs, pas des fonctionnalites.",
      10, encre
    );

    titreCadre("ABONNEMENT");
    ligne(g.abonnement_libelle || "Abonnement", euros(g.abonnement), true);
    if (supplementaires > 0) {
      ligne(String(supplementaires) + " utilisateur(s) au-dela de " + g.plafond
            + " - " + euros(g.utilisateur_sup) + " chacun",
            euros(coutSup));
    }
    y = y - 4;
    paragraphe(
      "Pour " + nbUtil + " utilisateur(s). Sans engagement de duree ; le tarif suit "
      + "votre effectif, mois par mois.",
      9, gris
    );

    titreCadre("A L'USAGE");
    paragraphe(
      "Ces services se facturent a ce que vous consommez, en plus de l'abonnement.",
      9, gris
    );
    y = y - 4;

    if (g.telephonie_disponible) {
      ligne("Appel sortant, a la minute", centimes(g.telephonie));
      for (const l of g.telephonie_lots) {
        ligne("  Lot de " + l.nombre + " minutes - " + centimes(l.unitaire) + " la minute",
              euros(l.prix));
      }
    }

    ligne("SMS envoye", centimes(g.sms));
    for (const l of g.sms_lots) {
      ligne("  Lot de " + l.nombre + " SMS - " + centimes(l.unitaire) + " le message",
            euros(l.prix));
    }

    // 🚨 LE PRIX DE LA SIGNATURE S IMPRIME MEME QUAND UN LOT EST COMPRIS.
    // « La signature est un cadeau, jamais un du. »
    ligne("Signature electronique, a l'unite", centimes(g.signature_unitaire));
    for (const l of g.signature_lots) {
      ligne("  Lot de " + l.nombre + " signatures - " + centimes(l.unitaire) + " l'unite",
            euros(l.prix));
    }

    if (g.signatures_offertes > 0) {
      y = y - 4;
      ligne(String(g.signatures_offertes) + " signatures comprises chaque annee",
            "comprises", true);
      paragraphe(
        "Elles se renouvellent tant que votre abonnement est en cours. Au-dela, les "
        + "signatures sont facturees a l'unite ou par lot.",
        9, gris
      );
    }

    y = y - 4;
    // 🚨 DESCRIPTION FACTUELLE, AUCUNE QUALIFICATION JURIDIQUE, AUCUN
    // CONCURRENT NOMME.
    paragraphe(
      "Chaque signature produit un dossier de preuve : identite du signataire verifiee "
      + "par courriel, code a six chiffres, trace manuscrit horodate, consentement "
      + "scelle, empreinte cryptographique et chainage au registre. Il s'agit d'une "
      + "signature electronique simple, integree a l'outil. Pour un acte exigeant une "
      + "signature qualifiee, recourez a un prestataire agree.",
      9, gris
    );

    if (!g.telephonie_disponible) {
      y = y - 2;
      paragraphe(
        "La telephonie integree est disponible pour les clients etablis dans l'Espace "
        + "economique europeen.",
        9, gris
      );
    }

    // ⚠️ LECTURE EN COUT PAR UTILISATEUR, JAMAIS EN TOTAL ANNUEL.
    if (coutParUtilisateur !== null) {
      titreCadre("LECTURE PRATIQUE");
      let phrase = "Pour " + nbUtil + " utilisateur(s), l'abonnement represente "
        + euros(coutParUtilisateur) + " par personne et par mois";
      if (coutTel > 0 || coutSms > 0) {
        phrase = phrase + ", usage estime compris";
      }
      phrase = phrase + " - soit " + euros(mensuelTotal) + " par mois au total.";
      paragraphe(phrase, 10, encre);

      if (coutTel > 0 || coutSms > 0) {
        y = y - 2;
        const details: string[] = [];
        if (coutTel > 0) details.push(minutes + " minutes d'appel (" + euros(coutTel) + ")");
        if (coutSms > 0) details.push(nbSms + " SMS (" + euros(coutSms) + ")");
        paragraphe(
          "Estimation d'usage mensuel : " + details.join(", ")
          + ". Votre facture suivra votre consommation reelle.",
          9, gris
        );
      }
    }

    titreCadre("CONDITIONS");
    paragraphe(
      "Facturation mensuelle a terme echu pour l'abonnement et les services a l'usage.",
      10, encre
    );
    paragraphe("Sans engagement de duree ; resiliation par courriel avec un preavis d'un mois.", 10, encre);
    paragraphe(
      "Vos donnees - contacts, historique, documents - vous appartiennent et vous sont "
      + "restituees sur demande, dans un format exploitable.",
      10, encre
    );
    paragraphe(
      "Prix hors taxes. " + EMETTEUR.nom + " est une societe de droit americain ; la TVA "
      + "applicable depend de votre situation (autoliquidation le cas echeant).",
      10, encre
    );

    titreCadre("BON POUR ACCORD");
    y = y - 6;
    paragraphe("Nom, qualite, date, signature - ou signature electronique via l'espace fourni.", 10, gris);
    y = y - 26;
    page.drawLine({
      start: { x: 55, y: y },
      end: { x: 300, y: y },
      thickness: 0.7,
      color: gris,
    });

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(EMETTEUR.produit + " - " + EMETTEUR.nom + " - Devis n° "
              + (p.numero_devis || "-") + " - Page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    // La date d envoi est posee au premier telechargement : sans elle, on ne
    // sait pas depuis quand un devis dort.
    if (!p.devis_envoye_le) {
      await supabase
        .from("prospects_devis")
        .update({
          devis_envoye_le: new Date().toISOString(),
          statut: "devis_envoye",
          updated_at: new Date().toISOString(),
        })
        .eq("jeton", jeton)
        .eq("produit", PRODUIT);
    }

    const octets = await pdf.save();
    const nomFichier = "devis-" + (p.numero_devis || "mrcrm") + ".pdf";

    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
