import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 20/09/2026 — LES DOCUMENTS DE FIN DE CONTRAT
//
// DEUX DOCUMENTS, DEUX REGIMES JURIDIQUES DIFFERENTS. Ils sortent ensemble
// parce qu ils se remettent ensemble, mais ils n obeissent pas aux memes
// regles et il ne faut jamais les confondre.
//
//   1. LE CERTIFICAT DE TRAVAIL (L1234-19, D1234-6)
//      🚨 « CONTIENT EXCLUSIVEMENT » quatre mentions. Le mot est dans le
//      texte. Tout ajout appreciatif — « a donne satisfaction », « nous le
//      recommandons » — est INTERDIT, et une mention defavorable engage la
//      responsabilite de l employeur.
//      ⚠️ La date de sortie est la FIN DU PREAVIS, meme non travaille.
//      ⚠️ Les mentions 3 et 4 de D1234-6 (solde du DIF, organisme
//      collecteur) sont CADUQUES : le DIF a ete remplace par le compte
//      personnel de formation au 01/01/2015 et les heures non utilisees
//      devaient etre transferees avant le 30/06/2021. On ne les ecrit pas.
//
//   2. LE RECU POUR SOLDE DE TOUT COMPTE (L1234-20, D1234-7)
//      🚨 IL FAIT L INVENTAIRE DES SOMMES VERSEES, poste par poste. Une
//      somme qui n y figure pas n est PAS couverte par l effet liberatoire.
//      🚨 DOUBLE EXEMPLAIRE, ET LA MENTION EN EST FAITE SUR LE RECU
//      (D1234-7) : c est une obligation de forme, pas un usage.
//      🚨 SIX MOIS POUR LE DENONCER (L1234-20). Passe ce delai il devient
//      liberatoire POUR LES SEULES SOMMES QUI Y SONT MENTIONNEES.
//      🚨 LA DATE DE SIGNATURE FAIT COURIR LE DELAI (Cass. soc. 20/02/2019,
//      n°17-27.600) : sans date certaine, le delai ne court pas et le recu
//      ne libere de rien. Le document la porte donc en toutes lettres.
//      ⛔ LE SALARIE N EST PAS OBLIGE DE LE SIGNER. Un refus de signature
//      ne fait pas obstacle a la remise des sommes.
//
// ⛔ CE QUE CETTE ROUTE NE PRODUIT PAS : l attestation France Travail. Elle
// n existe plus sous forme de document depuis juin 2021 — c est le
// signalement DSN « fin de contrat de travail unique » qui la remplace, et
// il est deja produit par /api/dsn/evenement.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// ⚠️ pdf-lib N ACCEPTE QUE LE LATIN-1 avec les polices standard : tout
// caractere hors de cette plage fait echouer la generation entiere.
function ascii(v: any): string {
  return String(v === null || v === undefined ? "" : v)
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\xFF]/g, "");
}

function dateFr(d: any): string {
  const v = String(d || "").slice(0, 10);
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return v;
  return m[3] + "/" + m[2] + "/" + m[1];
}

// La date en toutes lettres, pour le recu : « 30 novembre 2026 ».
// 🚨 LA DATE DE SIGNATURE FAIT COURIR LE DELAI DE SIX MOIS : elle doit etre
// lisible sans ambiguite, pas au format de la base de donnees.
function dateLongue(d: any): string {
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const v = String(d || "").slice(0, 10);
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return v;
  return String(Number(m[3])) + " " + MOIS[Number(m[2]) - 1] + " " + m[1];
}

function euros(n: any): string {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🚨 SIX MOIS APRES LA SIGNATURE : la date au-dela de laquelle le recu
// devient liberatoire. Elle est ECRITE SUR LE DOCUMENT pour que le salarie
// sache jusqu a quand il peut contester.
function sixMoisApres(d: any): string {
  const v = String(d || "").slice(0, 10);
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCMonth(dt.getUTCMonth() + 6);
  return dt.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  let corps: any = {};
  try { corps = await req.json(); } catch { corps = {}; }

  const contratId = String(corps.contrat_id || "").trim();
  if (!contratId) {
    return NextResponse.json({
      erreur: "contrat_id est obligatoire",
    }, { status: 400 });
  }

  // ---- LE CONTRAT, LE SALARIE, LA SOCIETE ----
  const { data: contrat, error: eCt } = await supabase
    .from("paie_contrats")
    .select("*, paie_salaries(*)")
    .eq("id", contratId)
    .maybeSingle();

  if (eCt || !contrat) {
    return NextResponse.json({
      erreur: "contrat introuvable" + (eCt ? " : " + eCt.message : ""),
    }, { status: 404 });
  }

  const salarie: any = (contrat as any).paie_salaries || {};

  const { data: societe } = await supabase
    .from("compta_societes")
    .select("*")
    .eq("id", (contrat as any).societe_id)
    .maybeSingle();

  // ═══════════════════════════════════════════════════════════════════
  // ---- LA DATE DE SORTIE ----
  //
  // 🚨 C EST LA FIN DU PREAVIS, MEME NON TRAVAILLE. Un salarie dispense de
  // preavis reste dans les effectifs jusqu a son terme : le certificat qui
  // porterait la date de son dernier jour de presence lui ferait perdre des
  // droits.
  // ⚠️ ON PREND, DANS L ORDRE : la date de rupture effective si elle est
  // saisie, sinon la fin prevue du contrat.
  // ═══════════════════════════════════════════════════════════════════
  const dateSortie = String((contrat as any).rompu_le
    || (contrat as any).date_fin || "").slice(0, 10);

  if (!dateSortie) {
    return NextResponse.json({
      erreur: "ce contrat n'a AUCUNE date de fin : ni rupture effective, ni "
        + "terme prévu. ⛔ Le certificat de travail ne peut pas être établi "
        + "sans date de sortie — c'est l'une des quatre mentions que "
        + "l'article D1234-6 rend obligatoires.",
    }, { status: 400 });
  }

  const dateEntree = String((contrat as any).date_debut || "").slice(0, 10);

  const CATEGORIES: any = {
    non_cadre: "non cadre", cadre: "cadre", etam: "ETAM",
    agent_maitrise: "agent de maîtrise", employe: "employé",
    ouvrier: "ouvrier", apprenti: "apprenti",
  };
  const catBrute = String((contrat as any).categorie || "");
  const categorieFr = CATEGORIES[catBrute] || catBrute.replace(/_/g, " ");

  // ═══════════════════════════════════════════════════════════════════
  // ---- L INVENTAIRE DES SOMMES ----
  //
  // 🚨 UNE SOMME NON MENTIONNEE N EST PAS COUVERTE PAR L EFFET LIBERATOIRE.
  // L inventaire se fait donc sur LES BULLETINS EMIS, jamais sur un calcul
  // refait ici : ce qui est ecrit sur le recu doit etre exactement ce que le
  // salarie a recu.
  // ⚠️ ON PREND LE DERNIER MOIS, celui de la rupture. Les mois anterieurs
  // ont deja ete soldes par leurs propres bulletins.
  // ⛔ LES BULLETINS ANNULES SONT EXCLUS : un rectificatif remplace celui
  // qu il corrige, et inventorier les deux doublerait les sommes.
  // ═══════════════════════════════════════════════════════════════════
  const moisSortie = dateSortie.slice(0, 7) + "-01";

  const { data: bulletins } = await supabase
    .from("paie_bulletins")
    .select("*")
    .eq("contrat_id", contratId)
    .eq("statut", "emis")
    .lte("periode", moisSortie)
    .order("periode", { ascending: false });

  const dernier: any = (bulletins || [])[0] || null;

  if (!dernier) {
    return NextResponse.json({
      erreur: "aucun bulletin ÉMIS jusqu'au mois de la rupture ("
        + moisSortie.slice(0, 7) + "). ⛔ LE REÇU POUR SOLDE DE TOUT COMPTE "
        + "FAIT L'INVENTAIRE DES SOMMES VERSÉES : sans bulletin émis, il n'y "
        + "a rien à inventorier. Émettre le dernier bulletin d'abord.",
    }, { status: 400 });
  }

  const anomalies: string[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 20/09 — ON REFUSE, ON N AVERTIT PAS
  //
  // Premier essai : le recu de Thomas inventoriait le salaire de SEPTEMBRE
  // pour un contrat qui se termine le 30 NOVEMBRE — deux mois de salaire
  // manquants — et la route se contentait d une anomalie a l ecran.
  // ⛔ UN RECU POUR SOLDE DE TOUT COMPTE N EST PAS UN BROUILLON. Signe, il
  // libere l employeur POUR LES SOMMES QUI Y SONT MENTIONNEES : en produire
  // un qui ignore deux mois de salaire, c est fabriquer la preuve d un
  // solde qui n a pas eu lieu. Un avertissement dans un coin de l ecran ne
  // protege de rien — le document, lui, circule.
  // 🚨 MEME REGLE QUE LA DSN : « ne jamais envoyer un fichier dont on sait
  // deja qu il reviendra avec une anomalie ».
  // ═══════════════════════════════════════════════════════════════════
  if (String(dernier.periode).slice(0, 7) !== dateSortie.slice(0, 7)) {
    return NextResponse.json({
      erreur: "le dernier bulletin émis est celui de "
        + String(dernier.periode).slice(5, 7) + "/"
        + String(dernier.periode).slice(0, 4) + ", alors que le contrat se "
        + "termine le " + dateFr(dateSortie) + ". ⛔ LES DOCUMENTS NE SONT "
        + "PAS PRODUITS : le reçu pour solde de tout compte inventorie les "
        + "sommes versées, et signé il libère l'employeur POUR CELLES QUI Y "
        + "FIGURENT. En établir un sans les derniers mois de salaire "
        + "reviendrait à attester d'un solde qui n'a pas eu lieu. Émettre le "
        + "bulletin de " + dateSortie.slice(5, 7) + "/"
        + dateSortie.slice(0, 4) + " d'abord.",
    }, { status: 400 });
  }

  const detail: any = dernier.detail || {};

  // Les postes de l inventaire, dans l ordre ou un salarie les cherche.
  const postes: any[] = [];
  const ajouter = function (libelle: string, montant: any) {
    const m = Number(montant || 0);
    if (m === 0) return;
    postes.push({ libelle: libelle, montant: Math.round(m * 100) / 100 });
  };

  // 🚨 LE SALAIRE DU DERNIER MOIS EST LE NET A PAYER, pas le brut : le recu
  // inventorie CE QUI A ETE VERSE.
  ajouter("Salaire du mois de " + String(dernier.periode).slice(5, 7) + "/"
    + String(dernier.periode).slice(0, 4) + " (net à payer, bulletin "
    + dernier.numero + ")", dernier.net_a_payer);

  // ⚠️ L IFM ET L INDEMNITE DE CONGES SONT DEJA DANS LE NET CI-DESSUS : on
  // les detaille pour memoire, SANS LES ADDITIONNER une seconde fois.
  const pourMemoire: any[] = [];
  if (Number(dernier.ifm || 0) > 0) {
    pourMemoire.push({
      libelle: (String((contrat as any).type_contrat) === "mission"
        ? "dont indemnité de fin de mission" : "dont indemnité de précarité"),
      montant: Number(dernier.ifm),
    });
  }
  if (Number(dernier.iccp || 0) > 0) {
    pourMemoire.push({
      libelle: "dont indemnité compensatrice de congés payés",
      montant: Number(dernier.iccp),
    });
  }

  const total = postes.reduce(function (s: number, p: any) {
    return s + Number(p.montant);
  }, 0);

  // ═══════════════════════════════════════════════════════════════════
  // ---- CE QUI N EST PAS CALCULE, ET QUI SE DIT ----
  //
  // ⛔ NE JAMAIS LAISSER CROIRE QUE L INVENTAIRE EST COMPLET. Ce que la base
  // ne connait pas ne peut pas y figurer, et une somme oubliee n est pas
  // couverte par l effet liberatoire — donc restera reclamable.
  // ═══════════════════════════════════════════════════════════════════
  anomalies.push("⚠️ L'INVENTAIRE PORTE SUR CE QUE LA PAIE CONNAÎT. N'y "
    + "figurent PAS, faute d'être gérés : les RTT non pris, le compte "
    + "épargne-temps, l'épargne salariale, une indemnité de non-concurrence, "
    + "une indemnité de licenciement, un bonus dû. ⛔ Les ajouter à la main "
    + "avant remise : une somme non mentionnée reste réclamable sans limite "
    + "de six mois.");

  const moisSansMutuelle = !detail || !Array.isArray(detail.lignes_cotisations)
    || !detail.lignes_cotisations.some(function (l: any) {
      const c = String((l && l.code) || "").toUpperCase();
      return c === "MUTUELLE" || c === "PREVOYANCE";
    });
  if (moisSansMutuelle) {
    anomalies.push("⚠️ AUCUNE MUTUELLE NI PRÉVOYANCE sur le dernier "
      + "bulletin : la mention de portabilité du certificat de travail a été "
      + "écrite au conditionnel. Si le salarié était couvert, la préciser.");
  }

  // ---- LE PDF : DEUX PAGES, DEUX DOCUMENTS ----
  const pdf = await PDFDocument.create();
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  const NOIR = rgb(0.1, 0.1, 0.1);
  const GRIS = rgb(0.45, 0.45, 0.45);
  const TRAIT = rgb(0.8, 0.8, 0.8);

  let page = pdf.addPage([595, 842]);
  let y = 800;

  const ecrire = function (txt: string, x: number, taille: number, f: any, couleur: any) {
    page.drawText(ascii(txt), { x: x, y: y, size: taille, font: f, color: couleur });
  };
  const droite = function (txt: string, xFin: number, taille: number, f: any, couleur: any) {
    const t = ascii(txt);
    page.drawText(t, { x: xFin - f.widthOfTextAtSize(t, taille), y: y,
      size: taille, font: f, color: couleur });
  };
  const ligne = function () {
    page.drawLine({ start: { x: 40, y: y }, end: { x: 555, y: y },
      thickness: 0.5, color: TRAIT });
  };
  // Un paragraphe coupe a la largeur de la page.
  const paragraphe = function (txt: string, x: number, largeur: number,
      taille: number, f: any, couleur: any) {
    const mots = ascii(txt).split(" ");
    let l = "";
    for (const mot of mots) {
      const essai = l ? l + " " + mot : mot;
      if (f.widthOfTextAtSize(essai, taille) > largeur && l) {
        page.drawText(l, { x: x, y: y, size: taille, font: f, color: couleur });
        y -= taille + 4;
        l = mot;
      } else {
        l = essai;
      }
    }
    if (l) {
      page.drawText(l, { x: x, y: y, size: taille, font: f, color: couleur });
      y -= taille + 4;
    }
  };

  const enTete = function () {
    ecrire(String(societe ? societe.raison_sociale || "" : ""), 40, 11, gras, NOIR);
    y -= 14;
    ecrire(String(societe ? societe.adresse || "" : ""), 40, 9, police, GRIS);
    y -= 11;
    ecrire(String(societe ? (societe.code_postal || "") + " "
      + (societe.ville || "") : ""), 40, 9, police, GRIS);
    y -= 11;
    ecrire("SIRET " + String(societe ? societe.siret || "" : ""), 40, 9, police, GRIS);
    y -= 24;
  };

  // ══════════════ PAGE 1 — LE CERTIFICAT DE TRAVAIL ══════════════
  enTete();

  ecrire("CERTIFICAT DE TRAVAIL", 40, 16, gras, NOIR);
  y -= 26;

  // 🚨 « CONTIENT EXCLUSIVEMENT » (D1234-6) : rien d autre que ces mentions.
  paragraphe("Je soussigné, représentant la société "
    + String(societe ? societe.raison_sociale || "" : "") + ", certifie que :",
    40, 515, 10, police, NOIR);
  y -= 8;

  ecrire(String(salarie.civilite || "") + " " + String(salarie.prenom || "")
    + " " + String(salarie.nom || ""), 40, 12, gras, NOIR);
  y -= 16;
  if (salarie.adresse) {
    ecrire(String(salarie.adresse), 40, 9, police, GRIS);
    y -= 11;
    ecrire(String(salarie.code_postal || "") + " " + String(salarie.ville || ""),
      40, 9, police, GRIS);
    y -= 11;
  }
  if (salarie.nir) {
    ecrire("N° de sécurité sociale : " + String(salarie.nir), 40, 9, police, GRIS);
    y -= 11;
  }
  y -= 10;

  paragraphe("a été employé dans notre entreprise du " + dateFr(dateEntree)
    + " au " + dateFr(dateSortie) + ".", 40, 515, 10, police, NOIR);
  y -= 6;

  paragraphe("Emploi occupé : " + String((contrat as any).intitule_poste || "")
    // 🚨 LA CATEGORIE VIENT DE LA BASE SOUS SA FORME TECHNIQUE
    // (« non_cadre »). Un document remis au salarie s ecrit en francais :
    // le PDF portait « Agent administratif (non_cadre) ».
    + (categorieFr ? " (" + categorieFr + ")" : "")
    + ", du " + dateFr(dateEntree) + " au " + dateFr(dateSortie) + ".",
    40, 515, 10, police, NOIR);
  y -= 14;

  // ⚠️ LA PORTABILITE : le maintien des garanties est de droit (L911-8 du
  // code de la securite sociale) pour le salarie indemnise par l assurance
  // chomage. ⛔ ELLE N EST PAS DUE EN CAS DE FAUTE LOURDE.
  paragraphe("Le cas échéant, les garanties de frais de santé et de "
    + "prévoyance dont bénéficiait l'intéressé(e) sont maintenues à titre "
    + "gratuit, dans les conditions de l'article L911-8 du code de la "
    + "sécurité sociale, pendant une durée égale à celle de son dernier "
    + "contrat, dans la limite de douze mois, s'il est pris en charge par "
    + "l'assurance chômage.", 40, 515, 9, police, GRIS);
  y -= 18;

  paragraphe("Ce certificat est remis à l'intéressé(e) pour valoir ce que de "
    + "droit.", 40, 515, 10, police, NOIR);
  y -= 30;

  ecrire("Fait à " + String(societe ? societe.ville || "" : "") + ", le "
    + dateLongue(dateSortie), 40, 10, police, NOIR);
  y -= 40;
  ecrire("Signature et cachet de l'employeur", 40, 9, police, GRIS);

  // ══════════════ PAGE 2 — LE RECU POUR SOLDE DE TOUT COMPTE ══════════════
  page = pdf.addPage([595, 842]);
  y = 800;

  enTete();

  ecrire("REÇU POUR SOLDE DE TOUT COMPTE", 40, 16, gras, NOIR);
  y -= 14;
  // 🚨 D1234-7 : LA MENTION DU DOUBLE EXEMPLAIRE EST OBLIGATOIRE ET FIGURE
  // SUR LE RECU LUI-MEME.
  ecrire("Établi en double exemplaire, dont l'un est remis au salarié "
    + "(article D1234-7 du code du travail)", 40, 9, police, GRIS);
  y -= 26;

  ecrire(String(salarie.civilite || "") + " " + String(salarie.prenom || "")
    + " " + String(salarie.nom || ""), 40, 12, gras, NOIR);
  y -= 16;
  ecrire("Contrat du " + dateFr(dateEntree) + " au " + dateFr(dateSortie)
    + " — " + String((contrat as any).intitule_poste || ""), 40, 9, police, GRIS);
  y -= 24;

  paragraphe("Je soussigné(e), pour solde de tout compte, reconnais avoir "
    + "reçu de la société " + String(societe ? societe.raison_sociale || "" : "")
    + " les sommes suivantes :", 40, 515, 10, police, NOIR);
  y -= 10;

  ligne();
  y -= 16;

  for (const p of postes) {
    ecrire(String(p.libelle), 40, 10, police, NOIR);
    droite(euros(p.montant) + " EUR", 555, 10, police, NOIR);
    y -= 16;
  }

  for (const p of pourMemoire) {
    ecrire("     " + String(p.libelle), 40, 9, police, GRIS);
    droite(euros(p.montant) + " EUR", 555, 9, police, GRIS);
    y -= 14;
  }

  y -= 4;
  ligne();
  y -= 18;
  ecrire("TOTAL NET VERSÉ", 40, 12, gras, NOIR);
  droite(euros(total) + " EUR", 555, 12, gras, NOIR);
  y -= 30;

  // ═══════════════════════════════════════════════════════════════════
  // 🚨 LA MENTION LIBERATOIRE ET LE DELAI DE SIX MOIS
  //
  // Sans elle, le recu ne libere de rien. Et le delai ne court QUE si la
  // date de signature est certaine (Cass. soc. 20/02/2019, n°17-27.600) :
  // la ligne de date est donc imprimee, a remplir de la main du salarie.
  // ⛔ ON N ECRIT PAS LA DATE A SA PLACE : un recu pre-date serait conteste.
  // ═══════════════════════════════════════════════════════════════════
  paragraphe("Ce reçu pour solde de tout compte peut être dénoncé dans les "
    + "six mois qui suivent sa signature, délai au-delà duquel il devient "
    + "libératoire pour l'employeur pour les seules sommes qui y sont "
    + "mentionnées (article L1234-20 du code du travail). La dénonciation "
    + "s'effectue par lettre recommandée avec accusé de réception.",
    40, 515, 9, police, NOIR);
  y -= 10;

  paragraphe("La signature de ce reçu n'est pas obligatoire et ne prive le "
    + "salarié d'aucun droit sur les sommes qui n'y sont pas mentionnées.",
    40, 515, 9, police, GRIS);
  y -= 26;

  ecrire("Fait à ............................................, le "
    + "............................................", 40, 10, police, NOIR);
  y -= 24;
  ecrire("Signature du salarié, précédée de la mention « Reçu pour solde de "
    + "tout compte »", 40, 9, police, GRIS);
  y -= 50;
  ecrire("Signature et cachet de l'employeur", 330, 9, police, GRIS);

  // ---- ARCHIVAGE ----
  const octets = await pdf.save();
  const sha = crypto.createHash("sha256").update(Buffer.from(octets)).digest("hex");

  const chemin = (contrat as any).tenant_id + "/" + (contrat as any).societe_id
    + "/paie/" + dateSortie.slice(0, 4) + "/fin-contrat-" + contratId.slice(0, 8)
    + "-" + dateSortie.replace(/-/g, "") + ".pdf";

  // ⚠️ `upsert: true` : ces documents se refont tant qu ils ne sont pas
  // remis — une date de rupture corrigee doit pouvoir les regenerer.
  const { error: eUp } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

  if (eUp) {
    return NextResponse.json({
      erreur: "archivage impossible : " + eUp.message,
    }, { status: 500 });
  }

  const { data: signe } = await supabase.storage
    .from(BUCKET).createSignedUrl(chemin, 3600);

  return NextResponse.json({
    success: true,
    contrat_id: contratId,
    salarie: String(salarie.prenom || "") + " " + String(salarie.nom || ""),
    date_entree: dateEntree,
    date_sortie: dateSortie,
    bulletin_inventorie: dernier.numero,
    postes: postes,
    pour_memoire: pourMemoire,
    total: Math.round(total * 100) / 100,
    liberatoire_le: sixMoisApres(dateSortie),
    chemin: chemin,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    anomalies: anomalies,
    message: "Certificat de travail et reçu pour solde de tout compte "
      + "produits en un seul PDF de deux pages. ⚠️ LE REÇU SE REMET EN DEUX "
      + "EXEMPLAIRES : imprimer la seconde page deux fois.",
  });
}
