import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LE BULLETIN DE PAIE EN PDF — 15/09/2026, corrige le 16/09
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
// 🆕🚨 16/09 — UN SEUL BULLETIN PAR CONTRAT ET PAR MOIS
//
// DEFAUT TROUVE A L ESSAI, ET C EST LE PLUS GRAVE DE LA NUIT : chaque appel
// de cette route creait un NOUVEAU bulletin. Trois PDF sortis pour Thomas
// MARTIN en septembre, TROIS EMIS, tous a 1 995,24 EUR. La DSN ne lit que
// les bulletins emis : elle aurait declare 5 985,72 EUR de brut et trois
// fois les cotisations.
//
// LA REGLE, ARBITREE PAR JACQUES LE 16/09 :
//   · un BROUILLON existe deja pour ce mois  → ON LE REECRIT. Meme numero,
//     meme chemin, le PDF est remplace au coffre.
//   · un bulletin EMIS existe deja           → on ouvre un RECTIFICATIF :
//     nouveau numero, statut brouillon, qui pointe celui qu il corrige.
//     Il ANNULERA le precedent au moment de son emission.
//   · rien n existe                          → bulletin normal.
//
// ⚠️ LE RECTIFICATIF NAIT ICI, PAS AU CALCUL. « Calculer » ne fait
// qu afficher : s il creait un rectificatif, chaque clic en fabriquerait un
// et on retomberait exactement sur le defaut qu on repare.
//
// 🚨 LE GARDE-FOU EST AUSSI EN BASE — deux index uniques partiels sur
// (contrat_id, periode), l un pour les brouillons, l autre pour les emis.
// Une regle qui ne vit que dans une route se contourne par un second
// onglet ou un appel direct.
// ═══════════════════════════════════════════════════════════════════════
//
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
//   · 🚨 LA MENTION DU PORTAIL mesdroitssociaux.gouv.fr
//   · 🚨 LE MONTANT NET SOCIAL, obligatoire depuis 2023
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// ⚠️ pdf-lib N ACCEPTE QUE LE LATIN-1 avec les polices standard. Les
// caracteres hors de cette table — guillemets courbes, tirets longs,
// espaces insecables, emoji — font PLANTER la generation au lieu de
// s afficher mal. On les remplace avant d ecrire.
// 🚨 LES LETTRES ACCENTUEES, ELLES, PASSENT : elles sont dans le latin-1.
// C est pourquoi le bulletin peut et doit etre ecrit en francais correct.
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
// 🚨 UNE DATE LUE PAR UN SALARIE S ECRIT EN FRANCAIS.
// Le bulletin affichait « jusqu au 2026-11-30 », le format de la base de
// donnees, au milieu d un document par ailleurs entierement en francais.
// ⚠️ CE N EST PAS UN DETAIL D ESTHETIQUE : un salarie qui lit une date
// qu il ne reconnait pas se demande si le reste du bulletin le concerne.
// ⛔ ET LA DSN, ELLE, GARDE SON PROPRE FORMAT (JJMMAAAA sans separateur) :
// les deux ne se melangent pas.
function dateFr(d: any): string {
  const v = String(d || "").slice(0, 10);
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return v;
  return m[3] + "/" + m[2] + "/" + m[1];
}

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
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const p = periode.split("-");
  return MOIS[Number(p[1]) - 1] + " " + p[0];
}

// LE NUMERO DU BULLETIN.
//
// 🚨 IL EST ATTRIBUE PAR LA ROUTE, JAMAIS SAISI. Meme regle que les mandats
// immobiliers : un numero saisi a la main finit par avoir des trous ou des
// doublons, et c est exactement ce qu un controle cherche.
// ⚠️ LES BULLETINS ANNULES COMPTENT DANS LA NUMEROTATION : on ne reutilise
// jamais un numero sorti, sinon deux documents differents porteraient le
// meme identifiant.
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

  // ═══════════════════════════════════════════════════════════════════
  // ---- QUE FAIT-ON DE CE QUI EXISTE DEJA POUR CE MOIS ? ----
  //
  // 🚨 CE BLOC SE LIT AVANT TOUT LE RESTE. Il decide si on reecrit, si on
  // ouvre un rectificatif, ou si c est un premier bulletin — et le PDF
  // lui-meme change de titre selon la reponse.
  // ⚠️ ON LIT TOUS LES BULLETINS DU MOIS, y compris les annules : le
  // numero suivant doit en tenir compte.
  // ═══════════════════════════════════════════════════════════════════
  const { data: existants, error: eLect } = await supabase
    .from("paie_bulletins")
    .select("id, numero, statut, chemin_pdf, type_bulletin, rectifie_id")
    .eq("contrat_id", contratId)
    .eq("periode", periode)
    .order("numero", { ascending: true });

  if (eLect) {
    return NextResponse.json({
      erreur: "lecture des bulletins du mois impossible : " + eLect.message,
    }, { status: 500 });
  }

  const brouillon = (existants || []).filter(function (b: any) {
    return b.statut === "brouillon";
  })[0] || null;

  const emisActif = (existants || []).filter(function (b: any) {
    return b.statut === "emis";
  })[0] || null;

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

  // ---- LE ROLE DE CE BULLETIN ----
  const estRectificatif = !brouillon && !!emisActif;
  const reecriture = !!brouillon;

  const numero = brouillon
    ? String(brouillon.numero)
    : await numeroSuivant(contrat.tenant_id, contrat.societe_id, periode);

  const chemin = contrat.tenant_id + "/" + contrat.societe_id
    + "/paie/" + periode.slice(0, 4) + "/bulletin-" + numero + ".pdf";

  // ---- LE PDF ----
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);                // A4
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  const NOIR = rgb(0.1, 0.1, 0.1);
  const GRIS = rgb(0.45, 0.45, 0.45);
  const ROUGE = rgb(0.68, 0.16, 0.16);
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

  // 🆕 16/09 — COUPER UN LIBELLE TROP LONG PLUTOT QUE DE LE LAISSER
  // CHEVAUCHER LA COLONNE SUIVANTE.
  // ⚠️ AVEC CINQ COLONNES DE CHIFFRES, la place du libelle se reduit :
  // « Fonds national d'aide au logement - moins de 50 salariés » ne tient
  // plus. Un texte qui deborde sur un montant rend le bulletin illisible
  // exactement la ou il doit etre le plus clair.
  const couper = function (txt: string, f: any, taille: number, largeur: number): string {
    let t = ascii(txt);
    if (f.widthOfTextAtSize(t, taille) <= largeur) return t;
    while (t.length > 1 && f.widthOfTextAtSize(t + "...", taille) > largeur) {
      t = t.slice(0, -1);
    }
    return t + "...";
  };

  // ---- EN-TETE ----
  // 🆕 16/09 — LE TITRE DIT CE QUE LE DOCUMENT EST. Un rectificatif qui
  // ressemble a un bulletin ordinaire se classe comme un bulletin
  // ordinaire, et le salarie garde les deux sans savoir lequel vaut.
  ecrire(estRectificatif ? "BULLETIN DE PAIE RECTIFICATIF" : "BULLETIN DE PAIE",
    40, 16, gras, estRectificatif ? ROUGE : NOIR);
  droite("Période : " + moisDe(periode), 555, 11, gras, NOIR);
  y -= 13;
  if (estRectificatif) {
    ecrire("Annule et remplace le bulletin " + String(emisActif.numero), 40, 8, police, ROUGE);
  }
  droite("N° " + numero, 555, 8, police, GRIS);
  y -= 9;
  ligne();
  y -= 18;

  // L employeur, a gauche
  const yEmployeur = y;
  ecrire("EMPLOYEUR", 40, 8, gras, GRIS);
  y -= 13;
  ecrire(societe ? societe.raison_sociale : "", 40, 10, gras, NOIR);
  y -= 12;
  if (societe && societe.adresse) { ecrire(societe.adresse, 40, 8.5, police, NOIR); y -= 11; }
  if (societe && (societe.code_postal || societe.ville)) {
    ecrire((societe.code_postal || "") + " " + (societe.ville || ""), 40, 8.5, police, NOIR);
    y -= 11;
  }
  // 🚨 SIRET ET CODE APE SONT DES MENTIONS OBLIGATOIRES (art. R3243-1).
  // ⚠️ LE SIRET IDENTIFIE L ETABLISSEMENT, le SIREN l entreprise : sur un
  // bulletin, c est l etablissement qui compte.
  //
  // 🆕🚨 16/09 — QUAND ILS MANQUENT, LE BULLETIN LE DIT EN ROUGE.
  // DEFAUT TROUVE A L ESSAI : le bloc employeur etait simplement VIDE de
  // ces deux mentions, et rien ne le signalait. Un bulletin muet laisse
  // croire qu il est complet. ⛔ AcadeMIA Pro LLC, societe americaine, n a
  // ni SIRET ni code APE : elle ne peut pas etablir un bulletin francais
  // valable, et c est exactement ce que le document doit afficher.
  if (societe && societe.siret) {
    ecrire("SIRET " + societe.siret, 40, 8.5, police, NOIR); y -= 11;
  } else if (societe && societe.siren) {
    ecrire("SIREN " + societe.siren, 40, 8.5, police, NOIR); y -= 10;
    ecrire("SIRET manquant - mention obligatoire (art. R3243-1)", 40, 7, police, ROUGE); y -= 11;
  } else {
    ecrire("SIRET manquant - mention obligatoire (art. R3243-1)", 40, 7, police, ROUGE); y -= 11;
  }
  if (societe && societe.code_ape) {
    ecrire("APE " + societe.code_ape, 40, 8.5, police, NOIR); y -= 11;
  } else {
    ecrire("Code APE manquant - mention obligatoire", 40, 7, police, ROUGE); y -= 11;
  }

  // Le salarie, a droite
  const yBas = y;
  y = yEmployeur;
  ecrire("SALARIÉ", 320, 8, gras, GRIS);
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
    ecrire("N° sécu " + salarie.numero_secu, 320, 8.5, police, NOIR); y -= 11;
  } else {
    ecrire("N° sécu manquant - rejet DSN assuré", 320, 7, police, ROUGE); y -= 11;
  }

  y = Math.min(yBas, y) - 8;
  ligne();
  y -= 14;

  // ---- EMPLOI ET CONVENTION ----
  ecrire("Emploi : " + (contrat.intitule_poste || ""), 40, 8.5, police, NOIR);
  droite("Catégorie : " + (contrat.categorie === "cadre" ? "Cadre" : "Non cadre"), 555, 8.5, police, NOIR);
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
  } else if (contrat.type_contrat === "cdd") {
    ecrire("Contrat à durée déterminée"
      + (contrat.date_fin ? " - jusqu'au " + dateFr(contrat.date_fin) : ""),
      40, 8.5, police, NOIR);
    y -= 11;
  } else if (contrat.type_contrat === "cdi") {
    ecrire("Contrat à durée indéterminée", 40, 8.5, police, NOIR);
    y -= 11;
  }
  y -= 4;
  ligne();
  y -= 14;

  // ---- LE BRUT ----
  ecrire("ÉLÉMENTS DE RÉMUNÉRATION", 40, 8, gras, GRIS);
  droite("Base", 340, 8, gras, GRIS);
  droite("Taux", 420, 8, gras, GRIS);
  droite("Montant", 555, 8, gras, GRIS);
  y -= 13;

  for (const l of (calcul.lignes_brut || [])) {
    ecrire(couper(l.libelle, police, 8.5, 250), 40, 8.5, police, NOIR);
    if (l.quantite !== null && l.quantite !== undefined) droite(euros(l.quantite), 340, 8.5, police, NOIR);
    if (l.taux !== null && l.taux !== undefined) droite(taux(l.taux), 420, 8.5, police, NOIR);
    droite(euros(l.montant), 555, 8.5, police, NOIR);
    y -= 11;
  }

  // ---- LES INDEMNITES DE FIN DE CONTRAT ----
  for (const l of (calcul.lignes_mission || [])) {
    ecrire(couper(l.libelle, police, 8.5, 250), 40, 8.5, police, NOIR);
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

  // ═══════════════════════════════════════════════════════════════════
  // ---- LES COTISATIONS ----
  //
  // 🆕🚨 16/09 — CINQ COLONNES, PAS QUATRE. DEFAUT TROUVE A L ESSAI : une
  // seule colonne « Taux » existait, et elle ne portait que le taux
  // SALARIAL. Neuf lignes patronales sur treize affichaient donc un montant
  // sans aucune explication : maladie 303,36 EUR sorti de nulle part.
  // ⚠️ UN BULLETIN DOIT ETRE REFAISABLE A LA MAIN par qui le lit. Une base,
  // un taux, un montant — des deux cotes.
  // ═══════════════════════════════════════════════════════════════════
  ecrire("COTISATIONS ET CONTRIBUTIONS", 40, 8, gras, GRIS);
  droite("Base", 285, 8, gras, GRIS);
  droite("Taux sal.", 345, 8, gras, GRIS);
  droite("Part salariale", 420, 8, gras, GRIS);
  droite("Taux pat.", 480, 8, gras, GRIS);
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

    // 🚨 L ALERTE SE LIT A COTE DU LIBELLE, EN ROUGE. Une cotisation
    // obligatoire a zero doit se voir : c est ce qui se decouvre au
    // controle, pas a la lecture.
    if (c.alerte) {
      const l1 = couper(c.libelle, police, 8, 150);
      ecrire(l1, 40, 8, police, NOIR);
      const largeur = police.widthOfTextAtSize(ascii(l1), 8);
      ecrire(couper("(" + c.alerte + ")", police, 6.5, 195 - largeur),
        40 + largeur + 4, 6.5, police, ROUGE);
    } else {
      ecrire(couper(c.libelle, police, 8, 195), 40, 8, police, NOIR);
    }

    droite(euros(c.base), 285, 8, police, NOIR);
    droite(c.taux_salarial > 0 ? euros(c.taux_salarial) + " %" : "", 345, 8, police, NOIR);
    droite(c.part_salariale > 0 ? euros(c.part_salariale) : "", 420, 8, police, NOIR);
    droite(c.taux_patronal > 0 ? euros(c.taux_patronal) + " %" : "", 480, 8, police, NOIR);
    droite(c.part_patronale > 0 ? euros(c.part_patronale)
      : (c.alerte ? "0,00" : ""), 555, 8, police, c.alerte ? ROUGE : NOIR);
    y -= 10;

    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — QUAND LE SALARIE ET L EMPLOYEUR N ONT PAS LA MEME
    // ASSIETTE, LE BULLETIN DOIT MONTRER LES DEUX
    //
    // ⛔ DEFAUT TROUVE SUR LE PREMIER BULLETIN D APPRENTI : la colonne
    // « Base » portait 1 138,88 et la part salariale 13,72 a 6,80 % — or
    // 6,80 % de 1 138,88 font 76,09. Le MONTANT etait juste (6,80 % des
    // 201,78 EUR reellement soumis), c est la BASE AFFICHEE qui mentait.
    // 🚨 UN BULLETIN QUI NE SE VERIFIE PAS LIGNE A LIGNE N EST PAS UN
    // BULLETIN. Il est remis au salarie, oppose a l URSSAF, et produit en
    // cas de litige : chaque montant doit pouvoir se refaire de tete.
    // ⚠️ LA COLONNE « BASE » RESTE L ASSIETTE PATRONALE, qui vaut pour la
    // grande majorite des lignes et pour tous les autres salaries. La
    // difference se dit en dessous, en clair, plutot que d ajouter une
    // sixieme colonne illisible sur une page A4.
    // ⚠️ NULLE PARTOUT AILLEURS : `base_salariale` n est renseignee que
    // lorsqu une exoneration reduit l assiette du salarie.
    // ═══════════════════════════════════════════════════════════════
    const baseSal = (c as any).base_salariale;
    if (baseSal !== null && baseSal !== undefined
        && Number(baseSal) !== Number(c.base)) {
      // ⚠️ AVEC LES ACCENTS : cette ligne est lue par le salarie. `ascii()`
      // conserve tout le latin-1, donc rien n y fait obstacle — l ASCII pur
      // ne concerne que le code, jamais un texte remis a quelqu un.
      ecrire("dont assiette salariale " + euros(Number(baseSal))
        + " EUR apr\u00e8s exon\u00e9ration apprenti", 48, 6.5, police, GRIS);
      y -= 8;
    }
  }

  y -= 3;
  ligne();
  y -= 13;
  ecrire("TOTAL DES COTISATIONS", 40, 9, gras, NOIR);
  droite(euros(calcul.total_salarial), 420, 9, gras, NOIR);
  droite(euros(calcul.total_patronal), 555, 9, gras, NOIR);
  y -= 12;

  // 🚨 LA REDUCTION S IMPUTE SUR LES COTISATIONS PATRONALES UNIQUEMENT.
  // Elle diminue le cout employeur, jamais le net du salarie.
  if (calcul.rgdu && calcul.rgdu > 0) {
    ecrire("Réduction générale dégressive unique (part employeur)", 40, 8, police, NOIR);
    if (calcul.rgdu_detail && calcul.rgdu_detail.coefficient) {
      droite("coef. " + String(calcul.rgdu_detail.coefficient), 480, 8, police, GRIS);
    }
    droite("- " + euros(calcul.rgdu), 555, 8, police, NOIR);
    y -= 11;
    ecrire("Total patronal après réduction", 40, 8.5, gras, NOIR);
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
  ecrire("Net à payer avant impôt sur le revenu", 40, 9, police, NOIR);
  droite(euros(calcul.net_avant_impot), 555, 9, police, NOIR);
  y -= 12;
  // 🆕 16/09 — LE PRELEVEMENT A LA SOURCE DIT POURQUOI IL EST A ZERO.
  // ⚠️ UNE LIGNE « 0,00 » SANS EXPLICATION laisse croire a un salarie non
  // imposable. Le taux personnalise vient du compte rendu metier de la DSN
  // precedente : sans depot, pas de taux.
  ecrire("Prélèvement à la source", 40, 9, police, NOIR);
  if (calcul.prelevement_mention) {
    const l = police.widthOfTextAtSize(ascii("Prélèvement à la source"), 9);
    ecrire("(" + calcul.prelevement_mention + ")", 40 + l + 6, 7, police, GRIS);
  }
  droite("- " + euros(calcul.prelevement_source), 555, 9, police, NOIR);
  y -= 15;

  ecrire("NET À PAYER", 40, 12, gras, NOIR);
  droite(euros(calcul.net_a_payer) + " EUR", 555, 12, gras, NOIR);
  y -= 16;
  ecrire("Coût total employeur", 40, 8, police, GRIS);
  droite(euros(calcul.cout_employeur), 555, 8, police, GRIS);
  y -= 20;
  ligne();
  y -= 12;

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
    ecrire("CONGÉS PAYÉS", 40, 8, gras, GRIS);
    droite("Acquis", 320, 8, gras, GRIS);
    droite("Pris", 420, 8, gras, GRIS);
    droite("Solde", 555, 8, gras, GRIS);
    y -= 11;
    // ⚠️ LA MEME REGLE VAUT ICI : la periode de reference des conges est lue
    // par le salarie, elle s ecrit donc en francais.
    ecrire("Période du " + dateFr(calcul.conges.periode_reference)
      + " (en jours " + calcul.conges.unite + ")", 40, 8, police, NOIR);
    droite(euros(calcul.conges.acquis), 320, 8, police, NOIR);
    droite(euros(calcul.conges.pris), 420, 8, police, NOIR);
    droite(euros(calcul.conges.solde), 555, 8, gras, NOIR);
    y -= 14;
  }

  ecrire("Dans votre intérêt et pour vous aider à faire valoir vos droits, conservez ce bulletin de paie", 40, 7, police, GRIS);
  y -= 9;
  ecrire("sans limitation de durée.", 40, 7, police, GRIS);
  y -= 11;
  ecrire("Pour connaître vos droits : www.mesdroitssociaux.gouv.fr", 40, 7, police, GRIS);
  y -= 9;
  // 🚨 LA MENTION QUI ACCOMPAGNE LE MONTANT NET SOCIAL, exigee avec lui.
  ecrire("Le montant net social est le revenu pris en compte pour le calcul de vos prestations sociales.", 40, 7, police, GRIS);

  const octets = Buffer.from(await pdf.save());
  const sha = crypto.createHash("sha256").update(octets).digest("hex");

  // ═══════════════════════════════════════════════════════════════════
  // ---- ARCHIVAGE ET ENREGISTREMENT ----
  //
  // ⚠️ `upsert` SUIT LE ROLE DU BULLETIN : on remplace le PDF d un
  // brouillon qu on reecrit, jamais celui d un bulletin deja sorti.
  // 🚨 UN BULLETIN EMIS GARDE SON PDF POUR TOUJOURS : c est le document
  // remis au salarie, et un rectificatif ne l efface pas, il s ajoute.
  // ═══════════════════════════════════════════════════════════════════
  const { error: eUp } = await supabase.storage
    .from(BUCKET)
    // ═══════════════════════════════════════════════════════════════
    // 🆕🚨 22/09 — ON ECRASE TOUJOURS LE FICHIER DU MEME NOM
    //
    // `upsert` valait `reecriture`, c est-a-dire VRAI seulement quand un
    // brouillon existait deja en base. Un PDF reste dans le bucket quand
    // son bulletin est supprime : le nom etait alors pris, l archivage
    // refuse avec « The resource already exists », et AUCUN BULLETIN
    // N ETAIT CREE — donc pas de bouton « Emettre », sans que rien
    // n explique pourquoi.
    // ⛔ LE NOM DU FICHIER PORTE DEJA LE NUMERO DU BULLETIN : deux
    // bulletins differents ne peuvent pas se marcher dessus. Ecraser un
    // fichier de meme nom, c est refaire le PDF du meme bulletin — ce que
    // « Sortir le PDF » est precisement cense faire.
    // ═══════════════════════════════════════════════════════════════
    .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

  if (eUp) {
    return NextResponse.json({
      erreur: "archivage impossible : " + eUp.message,
    }, { status: 500 });
  }

  const valeurs: any = {
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
    type_bulletin: estRectificatif ? "rectificatif" : "normal",
    rectifie_id: estRectificatif ? emisActif.id : null,
  };

  let bulletin: any = null;

  if (reecriture) {
    // 🚨 ON REECRIT LE BROUILLON EXISTANT — meme ligne, meme numero.
    // ⚠️ ON NE TOUCHE NI A type_bulletin NI A rectifie_id : si ce brouillon
    // etait deja un rectificatif, il le reste. Les ecraser ferait perdre le
    // lien vers le bulletin corrige, et le rectificatif n annulerait plus
    // rien a l emission.
    delete valeurs.type_bulletin;
    delete valeurs.rectifie_id;

    const { data: maj, error: eMaj } = await supabase
      .from("paie_bulletins")
      .update(valeurs)
      .eq("id", brouillon.id)
      .eq("statut", "brouillon")
      .select()
      .maybeSingle();

    if (eMaj) {
      return NextResponse.json({
        erreur: "le PDF est archive (" + chemin + ") mais la mise a jour du bulletin a echoue : " + eMaj.message,
      }, { status: 500 });
    }
    bulletin = maj;
  } else {
    // 🚨 L INSERT EST VERIFIE. Lecon du 15/09 sur compliance_documents : un
    // insert Supabase non verifie echoue EN SILENCE, et le defaut ne se
    // decouvre que des semaines plus tard.
    const { data: ins, error: eIns } = await supabase
      .from("paie_bulletins")
      .insert(valeurs)
      .select()
      .maybeSingle();

    if (eIns) {
      return NextResponse.json({
        erreur: "le PDF est archive (" + chemin + ") mais son enregistrement a echoue : " + eIns.message,
      }, { status: 500 });
    }
    bulletin = ins;
  }

  const { data: signe } = await supabase.storage
    .from(BUCKET).createSignedUrl(chemin, 3600);

  // ⚠️ LE MESSAGE DIT CE QUI VIENT DE SE PASSER, pas seulement que ca a
  // marche. Reecrire un brouillon et ouvrir un rectificatif ne sont pas le
  // meme geste, et celui qui clique doit savoir lequel il a fait.
  let message = "";
  if (estRectificatif) {
    message = "Bulletin RECTIFICATIF " + numero + " en brouillon. "
      + "Il annulera le bulletin " + String(emisActif.numero) + " au moment de son émission.";
  } else if (reecriture) {
    message = "Bulletin " + numero + " recalculé (le brouillon du mois a été remplacé). "
      + "⛔ Il ne sera « émis » qu'après contrôle au centime.";
  } else {
    message = "Bulletin " + numero + " généré en BROUILLON. "
      + "⛔ Il ne sera « émis » qu'après contrôle au centime contre un bulletin réel.";
  }

  return NextResponse.json({
    success: true,
    numero: numero,
    periode: periode,
    bulletin_id: bulletin ? bulletin.id : null,
    type_bulletin: estRectificatif ? "rectificatif" : "normal",
    rectifie: estRectificatif ? String(emisActif.numero) : null,
    reecriture: reecriture,
    brut: calcul.brut_total,
    net_a_payer: calcul.net_a_payer,
    cout_employeur: calcul.cout_employeur,
    chemin: chemin,
    sha256: sha,
    url: signe ? signe.signedUrl : null,
    statut: "brouillon",
    reserves: calcul.reserves,
    message: message,
  });
}
