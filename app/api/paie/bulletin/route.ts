import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LE BULLETIN DE PAIE EN PDF — 15/09/2026
//
// Il prend le calcul rendu par /api/paie/calculer, le met en page, l archive
// au coffre et ENREGISTRE LE BULLETIN EN BASE.
//
// 🚨 UN BULLETIN EMIS NE SE MODIFIE PLUS. Il se corrige par un bulletin
// rectificatif qui porte le numero du bulletin corrige. C est la meme regle
// que le registre des mandats immobiliers : ce qui est sorti est sorti.
//
// 🚨 LE DETAIL DU CALCUL EST PHOTOGRAPHIE EN JSON dans `detail`. Si un taux
// change l an prochain, ce bulletin reste lisible et justifiable. Sans
// cette photographie, un controle URSSAF trois ans plus tard serait
// indefendable.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 LES MENTIONS OBLIGATOIRES — article R3243-1 du code du travail.
//
// Leur absence est sanctionnee, et un bulletin incomplet ne fait pas preuve
// du paiement du salaire. Ce qui DOIT y figurer :
//   · identite et adresse de l employeur, son SIRET, son code APE
//   · identite du salarie, son emploi, sa classification
//   · 🚨 L INTITULE DE LA CONVENTION COLLECTIVE applicable, ou la reference
//     au code du travail s il n y en a pas
//   · la periode et les heures de travail, en distinguant les heures
//     majorees
//   · la nature et le montant des accessoires de salaire
//   · le brut, les cotisations par famille, le net imposable, le net a payer
//   · la date de paiement, les conges payes
//   · 🚨 LA MENTION DE CONSERVATION SANS LIMITATION DE DUREE
//   · 🚨 LA MENTION DU PORTAIL mesdroitssociaux.gouv.fr — obligatoire
//     depuis 2017
//
// ⚠️ DEPUIS 2025, LE « MONTANT NET SOCIAL » EST OBLIGATOIRE. Il sert de
// reference aux prestations sociales (RSA, prime d activite). Il ne se
// confond ni avec le net imposable ni avec le net a payer.
// ⛔ IL N EST PAS CALCULE ICI : sa definition exclut certaines cotisations
// de prevoyance, et le faire a moitie serait pire que de ne pas le faire.
// A TRAITER AVANT LE PREMIER BULLETIN REEL.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// ⚠️ pdf-lib N ACCEPTE QUE LE LATIN-1 avec les polices standard. Les
// caracteres hors de cette table — guillemets courbes, tirets longs,
// espaces insecables — font PLANTER la generation au lieu de s afficher mal.
// On les remplace avant d ecrire.
function ascii(v: any): string {
  return String(v === null || v === undefined ? "" : v)
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\xFF]/g, "");
}

// Les montants a la francaise : 1 234,56
function euros(n: any): string {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// LES TAUX HORAIRES, A QUATRE DECIMALES QUAND ILS EN ONT.
//
// 🚨 UN TAUX ARRONDI A DEUX DECIMALES REND LE BULLETIN INVERIFIABLE. Une
// heure supplementaire a 12,31 majoree de 25 % vaut 15,3875 : imprime
// « 15,39 », le salarie qui multiplie 4 x 15,39 trouve 61,56 alors que la
// ligne annonce 61,55. Un ecart d un centime suffit a faire douter de tout
// le bulletin.
// ⚠️ ON N AJOUTE PAS DE DECIMALES INUTILES : 12,31 reste « 12,31 ».
function taux(n: any): string {
  const v = Number(n || 0);
  const d = Math.round(v * 100) === Math.round(v * 10000) / 100 ? 2 : 4;
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: d });
}

function moisDe(periode: string): string {
  const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
  const p = periode.split("-");
  return MOIS[Number(p[1]) - 1] + " " + p[0];
}

// LE NUMERO DU BULLETIN.
//
// 🚨 IL EST ATTRIBUE PAR LA ROUTE, JAMAIS SAISI. Meme regle que les mandats
// immobiliers : un numero saisi a la main finit par avoir des trous ou des
// doublons, et c est exactement ce qu un controle cherche.
async function numeroSuivant(tenantId: string, societeId: string, periode: string): Promise<string> {
  const annee = periode.slice(0, 4);
  const { data } = await supabase
    .from("paie_bulletins")
    .select("numero")
    .eq("tenant_id", tenantId)
    .eq("societe_id", societeId)
    .like("numero", annee + "-%")
    .order("numero", { ascending: false })
    .limit(1);

  let n = 1;
  if (data && data[0] && data[0].numero) {
    const m = String(data[0].numero).match(/-(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return annee + "-" + String(n).padStart(5, "0");
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
  const periode = String(corps.periode || "").trim();

  if (!contratId || !/^\d{4}-\d{2}-01$/.test(periode)) {
    return NextResponse.json({
      erreur: "contrat_id et periode (AAAA-MM-01) sont obligatoires",
    }, { status: 400 });
  }

  // ---- LE CALCUL ----
  // 🚨 ON NE RECALCULE PAS ICI : on appelle le moteur, seul endroit ou le
  // calcul vit. Deux calculs a deux endroits finissent toujours par
  // diverger.
  const hote = req.headers.get("host") || "";
  const r = await fetch("https://" + hote + "/api/paie/calculer?contrat="
    + encodeURIComponent(contratId) + "&periode=" + encodeURIComponent(periode)
    + "&secret=" + encodeURIComponent(process.env.CRON_SECRET || ""));

  const calcul = await r.json();
  if (!r.ok || calcul.erreur) {
    return NextResponse.json({ erreur: calcul.erreur || "calcul impossible" }, { status: 400 });
  }

  // ---- LE CONTRAT, LE SALARIE, LA SOCIETE ----
  const { data: contrat } = await supabase
    .from("paie_contrats")
    .select("*, paie_salaries(*)")
    .eq("id", contratId)
    .maybeSingle();

  if (!contrat) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

  const salarie = contrat.paie_salaries || {};

  const { data: societe } = await supabase
    .from("compta_societes")
    .select("*")
    .eq("id", contrat.societe_id)
    .maybeSingle();

  // 🚨 LA CONVENTION COLLECTIVE EST UNE MENTION OBLIGATOIRE. Quand il n y
  // en a pas, on ecrit la reference au code du travail — jamais rien.
  let convention = "Code du travail (aucune convention collective applicable)";
  if (contrat.idcc) {
    const { data: cc } = await supabase
      .from("paie_conventions")
      .select("idcc, nom")
      .eq("idcc", contrat.idcc)
      .maybeSingle();
    if (cc) convention = "IDCC " + cc.idcc + " - " + cc.nom;
    else convention = "IDCC " + contrat.idcc;
  }

  // ---- LE PDF ----
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);                // A4
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  const NOIR = rgb(0.1, 0.1, 0.1);
  const GRIS = rgb(0.45, 0.45, 0.45);
  const TRAIT = rgb(0.8, 0.8, 0.8);

  let y = 800;

  const ecrire = function (txt: string, x: number, taille: number, f: any, couleur: any) {
    page.drawText(ascii(txt), { x: x, y: y, size: taille, font: f, color: couleur });
  };

  const droite = function (txt: string, xFin: number, taille: number, f: any, couleur: any) {
    const t = ascii(txt);
    const l = f.widthOfTextAtSize(t, taille);
    page.drawText(t, { x: xFin - l, y: y, size: taille, font: f, color: couleur });
  };

  const ligne = function () {
    page.drawLine({
      start: { x: 40, y: y }, end: { x: 555, y: y },
      thickness: 0.5, color: TRAIT,
    });
  };

  // ---- EN-TETE ----
  ecrire("BULLETIN DE PAIE", 40, 16, gras, NOIR);
  droite("Periode : " + moisDe(periode), 555, 11, gras, NOIR);
  y -= 22;
  ligne();
  y -= 18;

  // L employeur, a gauche
  const yEmployeur = y;
  ecrire("EMPLOYEUR", 40, 8, gras, GRIS);
  y -= 13;
  ecrire(societe ? societe.raison_sociale : "", 40, 10, gras, NOIR);
  y -= 12;
  // ⚠️ compta_societes PORTE L ADRESSE EN UN SEUL CHAMP, et un SIREN — pas
  // un SIRET, pas de code APE, pas de ville separee. Le bulletin affiche
  // donc ce qui existe.
  // 🚨 LE SIRET ET LE CODE APE SONT DES MENTIONS OBLIGATOIRES (art.
  // R3243-1). Tant que compta_societes ne les porte pas, le bulletin est
  // INCOMPLET AU SENS DE LA LOI. ⛔ A AJOUTER AVANT LE PREMIER BULLETIN
  // REEL : deux colonnes sur compta_societes, siret et code_ape.
  if (societe && societe.adresse) { ecrire(societe.adresse, 40, 8.5, police, NOIR); y -= 11; }
  if (societe && (societe.code_postal || societe.ville)) {
    ecrire((societe.code_postal || "") + " " + (societe.ville || ""), 40, 8.5, police, NOIR);
    y -= 11;
  }
  // 🚨 SIRET ET CODE APE SONT DES MENTIONS OBLIGATOIRES (art. R3243-1).
  // ⚠️ LE SIRET IDENTIFIE L ETABLISSEMENT, le SIREN l entreprise : sur un
  // bulletin, c est l etablissement qui compte. On affiche le SIREN en
  // repli, faute de mieux, mais un bulletin sans SIRET reste INCOMPLET AU
  // SENS DE LA LOI.
  if (societe && societe.siret) {
    ecrire("SIRET " + societe.siret, 40, 8.5, police, NOIR); y -= 11;
  } else if (societe && societe.siren) {
    ecrire("SIREN " + societe.siren + " (SIRET a renseigner)", 40, 8.5, police, NOIR); y -= 11;
  }
  if (societe && societe.code_ape) {
    ecrire("APE " + societe.code_ape, 40, 8.5, police, NOIR); y -= 11;
  }

  // Le salarie, a droite
  const yBas = y;
  y = yEmployeur;
  ecrire("SALARIE", 320, 8, gras, GRIS);
  y -= 13;
  ecrire((salarie.prenom || "") + " " + (salarie.nom || ""), 320, 10, gras, NOIR);
  y -= 12;
  if (salarie.adresse) { ecrire(salarie.adresse, 320, 8.5, police, NOIR); y -= 11; }
  if (salarie.code_postal || salarie.ville) {
    ecrire((salarie.code_postal || "") + " " + (salarie.ville || ""), 320, 8.5, police, NOIR);
    y -= 11;
  }
  // ⚠️ LE NUMERO DE SECURITE SOCIALE FIGURE SUR LE BULLETIN, mais jamais
  // dans une liste a l ecran.
  if (salarie.numero_secu) {
    ecrire("N secu " + salarie.numero_secu, 320, 8.5, police, NOIR); y -= 11;
  }

  y = Math.min(yBas, y) - 8;
  ligne();
  y -= 14;

  // ---- EMPLOI ET CONVENTION ----
  ecrire("Emploi : " + (contrat.intitule_poste || ""), 40, 8.5, police, NOIR);
  droite("Categorie : " + (contrat.categorie === "cadre" ? "Cadre" : "Non cadre"), 555, 8.5, police, NOIR);
  y -= 11;
  // 🚨 MENTION OBLIGATOIRE.
  ecrire("Convention collective : " + convention, 40, 8.5, police, NOIR);
  y -= 11;
  if (contrat.type_contrat === "mission") {
    ecrire("Contrat de mission" + (contrat.eu_raison_sociale
      ? " - entreprise utilisatrice : " + contrat.eu_raison_sociale : ""), 40, 8.5, police, NOIR);
    y -= 11;
    if (contrat.motif_recours) {
      ecrire("Motif de recours : " + contrat.motif_recours, 40, 8.5, police, GRIS);
      y -= 11;
    }
  }
  y -= 4;
  ligne();
  y -= 14;

  // ---- LE BRUT ----
  ecrire("ELEMENTS DE REMUNERATION", 40, 8, gras, GRIS);
  droite("Base", 340, 8, gras, GRIS);
  droite("Taux", 420, 8, gras, GRIS);
  droite("Montant", 555, 8, gras, GRIS);
  y -= 13;

  for (const l of (calcul.lignes_brut || [])) {
    ecrire(l.libelle, 40, 8.5, police, NOIR);
    if (l.quantite !== null && l.quantite !== undefined) droite(euros(l.quantite), 340, 8.5, police, NOIR);
    if (l.taux !== null && l.taux !== undefined) droite(taux(l.taux), 420, 8.5, police, NOIR);
    droite(euros(l.montant), 555, 8.5, police, NOIR);
    y -= 11;
  }

  // ---- LES INDEMNITES DE MISSION ----
  for (const l of (calcul.lignes_mission || [])) {
    ecrire(l.libelle, 40, 8.5, police, NOIR);
    if (l.base) droite(euros(l.base), 340, 8.5, police, NOIR);
    if (l.taux) droite(euros(l.taux) + " %", 420, 8.5, police, NOIR);
    droite(euros(l.montant), 555, 8.5, police, NOIR);
    y -= 11;
  }

  y -= 3;
  ligne();
  y -= 13;
  ecrire("SALAIRE BRUT", 40, 9.5, gras, NOIR);
  droite(euros(calcul.brut_total), 555, 9.5, gras, NOIR);
  y -= 16;
  ligne();
  y -= 14;

  // ---- LES COTISATIONS ----
  ecrire("COTISATIONS ET CONTRIBUTIONS", 40, 8, gras, GRIS);
  droite("Base", 300, 8, gras, GRIS);
  droite("Taux", 360, 8, gras, GRIS);
  droite("Part salariale", 460, 8, gras, GRIS);
  droite("Part patronale", 555, 8, gras, GRIS);
  y -= 13;

  let familleCourante = "";
  for (const c of (calcul.lignes_cotisations || [])) {
    // ⚠️ SI LA PAGE SE REMPLIT, ON EN OUVRE UNE AUTRE. Un bulletin de cadre
    // avec tranche 2 depasse la premiere page.
    // ⚠️ `page` EST DECLAREE AVEC `let` POUR CETTE SEULE RAISON : les
    // fonctions d ecriture la lisent a chaque appel, donc leur changer la
    // page suffit a rediriger la suite du bulletin.
    if (y < 120) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }

    if (c.famille !== familleCourante) {
      familleCourante = c.famille;
      y -= 3;
    }

    ecrire(c.libelle, 40, 8, police, NOIR);
    droite(euros(c.base), 300, 8, police, NOIR);
    droite(c.taux_salarial > 0 ? euros(c.taux_salarial) + " %" : "", 360, 8, police, NOIR);
    droite(c.part_salariale > 0 ? euros(c.part_salariale) : "", 460, 8, police, NOIR);
    droite(c.part_patronale > 0 ? euros(c.part_patronale) : "", 555, 8, police, NOIR);
    y -= 10;
  }

  y -= 3;
  ligne();
  y -= 13;
  ecrire("TOTAL DES COTISATIONS", 40, 9, gras, NOIR);
  droite(euros(calcul.total_salarial), 460, 9, gras, NOIR);
  droite(euros(calcul.total_patronal), 555, 9, gras, NOIR);
  y -= 12;

  // 🚨 LA REDUCTION S IMPUTE SUR LES COTISATIONS PATRONALES UNIQUEMENT.
  // Elle diminue le cout employeur, jamais le net du salarie.
  if (calcul.rgdu && calcul.rgdu > 0) {
    ecrire("Reduction generale degressive unique", 40, 8, police, NOIR);
    if (calcul.rgdu_detail && calcul.rgdu_detail.coefficient) {
      droite("coef. " + String(calcul.rgdu_detail.coefficient), 360, 8, police, GRIS);
    }
    droite("- " + euros(calcul.rgdu), 555, 8, police, NOIR);
    y -= 11;
    ecrire("Total patronal apres reduction", 40, 8.5, gras, NOIR);
    droite(euros(calcul.total_patronal_apres_rgdu), 555, 8.5, gras, NOIR);
    y -= 12;
  }
  y -= 6;
  ligne();
  y -= 15;

  // ---- LES TOTAUX ----
  // 🚨 MENTION OBLIGATOIRE DEPUIS 2023. Le montant net social sert de
  // reference aux prestations sociales : RSA, prime d activite. Il ne se
  // confond ni avec le net imposable ni avec le net a payer.
  ecrire("Montant net social", 40, 9, gras, NOIR);
  droite(euros(calcul.net_social), 555, 9, gras, NOIR);
  y -= 13;
  ecrire("Net imposable", 40, 9, police, NOIR);
  droite(euros(calcul.net_imposable), 555, 9, police, NOIR);
  y -= 12;
  ecrire("Net a payer avant impot sur le revenu", 40, 9, police, NOIR);
  droite(euros(calcul.net_avant_impot), 555, 9, police, NOIR);
  y -= 12;
  ecrire("Prelevement a la source", 40, 9, police, NOIR);
  droite("- " + euros(calcul.prelevement_source), 555, 9, police, NOIR);
  y -= 15;

  ecrire("NET A PAYER", 40, 12, gras, NOIR);
  droite(euros(calcul.net_a_payer) + " EUR", 555, 12, gras, NOIR);
  y -= 16;
  ecrire("Cout total employeur", 40, 8, police, GRIS);
  droite(euros(calcul.cout_employeur), 555, 8, police, GRIS);
  y -= 20;
  ligne();
  y -= 12;

  // ---- LES MENTIONS OBLIGATOIRES ----
  // 🚨 LES DEUX SONT EXIGEES PAR LE CODE DU TRAVAIL. Leur absence est
  // sanctionnee.
  // ═══════════════════════════════════════════════════════════════════
  // 🚨 LES CONGES PAYES — MENTION OBLIGATOIRE (art. R3243-1).
  //
  // Le salarie doit voir ce qu il a acquis et ce qu il lui reste. C est la
  // premiere chose qu il regarde apres son net.
  // ⚠️ SEUL LE CDI L AFFICHE : sur une mission ou un CDD, les conges sont
  // compenses par l ICCP, et un compteur y serait faux.
  // ═══════════════════════════════════════════════════════════════════
  if (calcul.conges) {
    y -= 4;
    ligne();
    y -= 12;
    ecrire("CONGES PAYES", 40, 8, gras, GRIS);
    droite("Acquis", 320, 8, gras, GRIS);
    droite("Pris", 420, 8, gras, GRIS);
    droite("Solde", 555, 8, gras, GRIS);
    y -= 11;
    ecrire("Periode du " + String(calcul.conges.periode_reference).slice(0, 10)
      + " (en jours " + calcul.conges.unite + ")", 40, 8, police, NOIR);
    droite(euros(calcul.conges.acquis), 320, 8, police, NOIR);
    droite(euros(calcul.conges.pris), 420, 8, police, NOIR);
    droite(euros(calcul.conges.solde), 555, 8, gras, NOIR);
    y -= 14;
  }

  ecrire("Dans votre interet et pour vous aider a faire valoir vos droits, conservez ce bulletin de paie", 40, 7, police, GRIS);
  y -= 9;
  ecrire("sans limitation de duree.", 40, 7, police, GRIS);
  y -= 11;
  ecrire("Pour connaitre vos droits : www.mesdroitssociaux.gouv.fr", 40, 7, police, GRIS);
  y -= 9;
  // 🚨 LA MENTION QUI ACCOMPAGNE LE MONTANT NET SOCIAL, exigee avec lui.
  ecrire("Le montant net social est le revenu pris en compte pour le calcul de vos prestations sociales.", 40, 7, police, GRIS);

  const octets = Buffer.from(await pdf.save());
  const sha = crypto.createHash("sha256").update(octets).digest("hex");

  // ---- ARCHIVAGE ET ENREGISTREMENT ----
  const numero = await numeroSuivant(contrat.tenant_id, contrat.societe_id, periode);
  const chemin = contrat.tenant_id + "/" + contrat.societe_id
    + "/paie/" + periode.slice(0, 4) + "/bulletin-" + numero + ".pdf";

  const { error: eUp } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, octets, { contentType: "application/pdf", upsert: false });

  if (eUp) {
    return NextResponse.json({
      erreur: "archivage impossible : " + eUp.message,
    }, { status: 500 });
  }

  // 🚨 L INSERT EST VERIFIE. Lecon du 15/09 sur compliance_documents : un
  // insert Supabase non verifie echoue EN SILENCE, et le defaut ne se
  // decouvre que des semaines plus tard.
  const { data: bulletin, error: eIns } = await supabase
    .from("paie_bulletins")
    .insert({
      tenant_id: contrat.tenant_id,
      societe_id: contrat.societe_id,
      contrat_id: contratId,
      periode: periode,
      numero: numero,
      brut: calcul.brut_total,
      total_salarial: calcul.total_salarial,
      total_patronal: calcul.total_patronal,
      net_imposable: calcul.net_imposable,
      net_avant_impot: calcul.net_avant_impot,
      prelevement_source: calcul.prelevement_source,
      net_a_payer: calcul.net_a_payer,
      cout_employeur: calcul.cout_employeur,
      ifm: calcul.ifm,
      iccp: calcul.iccp,
      rgdu: calcul.rgdu,
      net_social: calcul.net_social,
      detail: calcul,
      chemin_pdf: chemin,
      sha256: sha,
      statut: "brouillon",
    })
    .select()
    .maybeSingle();

  if (eIns) {
    return NextResponse.json({
      erreur: "le PDF est archive (" + chemin + ") mais son enregistrement a echoue : " + eIns.message,
    }, { status: 500 });
  }

  const { data: signe } = await supabase.storage
    .from(BUCKET).createSignedUrl(chemin, 3600);

  return NextResponse.json({
    success: true,
    numero: numero,
    periode: periode,
    bulletin_id: bulletin ? bulletin.id : null,
    brut: calcul.brut_total,
    net_a_payer: calcul.net_a_payer,
    cout_employeur: calcul.cout_employeur,
    chemin: chemin,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    statut: "brouillon",
    reserves: calcul.reserves,
    message: "Bulletin " + numero + " genere en BROUILLON. "
      + "⛔ Il ne sera « emis » qu apres controle au centime contre un bulletin reel.",
  });
}
