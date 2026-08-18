import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../lib/session";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODELE = "claude-sonnet-4-6";
const BUCKET = "formations-pdf";

const CARACTERES_PAR_PAGE = 3200;
const CARACTERES_PAR_PASSE = 14000;
const PAGES_MIN = 30;
const PAGES_MAX = 300;
const QUESTIONS_PAR_QCM = 10;
const QUESTIONS_PAR_MODULE_EXAMEN = 2;
const MODULES_PAR_LOT_EXAMEN = 5;
const SEUIL_REUSSITE = 70;

// Le plafond de jetons d une passe. A 4000 les sections longues etaient
// coupees en plein mot dans le manuel : « la zone Nom affiche la refer ».
const JETONS_PAR_PASSE = 8000;

// LA LANGUE DE L ACHETEUR. Elle est jointe a la commande par la route de
// paiement et voyage jusqu ici : le manuel, les exercices, les questionnaires
// et l examen sont produits dans cette langue, et le cache est indexe dessus.
const LANGUES: Record<string, string> = {
  fr: "francais",
  en: "English",
  es: "espanol",
  pt: "portugues",
  de: "Deutsch",
  ar: "arabe",
  he: "hebreu",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LARGEUR = 595.28;
const HAUTEUR = 841.89;
const MARGE = 62;
const UTILE = LARGEUR - MARGE * 2;
const BAS = 70;

const OR = rgb(0.706, 0.612, 0.365);
const ENCRE = rgb(0.13, 0.13, 0.13);
const GRIS = rgb(0.45, 0.45, 0.45);
const TRAIT = rgb(0.82, 0.82, 0.82);

function systemePour(langue: string): string {
  const nom = LANGUES[langue] || "francais";
  return (
    "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels de formation professionnelle denses, " +
    "complets et de haute qualite academique, ENTIEREMENT en " + nom + ". Tu ne delayes jamais : chaque paragraphe apporte une " +
    "information nouvelle. Tu n inventes aucun titre officiel et aucun prix."
  );
}

const REGLE_EVALUATION =
  "REGLE ABSOLUE POUR LES QUESTIONS : n interroge JAMAIS sur des dates, des noms propres, " +
  "des filiations d ecoles ou des anecdotes historiques. Ces elements figurent dans le cours pour la culture " +
  "du stagiaire, pas pour le pieger. Les questions portent exclusivement sur ce qu un praticien doit savoir FAIRE : " +
  "la methode, le protocole, le choix de la technique selon la situation, les applications concretes, " +
  "les precautions et la securite. Gradue la difficulte : commence par la comprehension, termine par l application.";

// Les titres portent leurs accents : ils sont imprimes dans le manuel, donc
// destines a un tiers. Ils sont ecrits en sequences d echappement pour que le
// fichier source reste en ASCII pur et survive a tout copier-coller.
const COURS = [
  {
    titre: "Fondements et cadre conceptuel",
    consigne: "Expose les fondements theoriques : origines, auteurs de reference, concepts cles, cadre conceptuel. Cite des travaux et des recherches.",
  },
  {
    titre: "M\u00e9thode et protocole",
    consigne: "Decris la methode operatoire etape par etape : preparation, deroulement, criteres de reussite, variantes selon les publics. Sois concret et sequentiel.",
  },
  {
    titre: "\u00c9tudes de cas",
    consigne: "Presente au moins quatre situations reelles et detaillees : contexte, difficulte rencontree, demarche suivie, resultat, enseignement a en tirer. Des recits, pas des generalites.",
  },
  {
    titre: "Erreurs fr\u00e9quentes et rem\u00e9diation",
    consigne: "Recense les erreurs les plus courantes, leurs causes, leurs consequences et la maniere de les corriger. Un tableau erreur / remede est bienvenu.",
  },
  {
    titre: "Applications professionnelles",
    consigne: "Montre comment transposer ce module dans la pratique professionnelle : publics concernes, adaptations, cadre d intervention, indicateurs de suivi.",
  },
  {
    titre: "Approfondissement et ressources",
    consigne: "Approfondis les points delicats non couverts jusqu ici, ouvre sur les debats du domaine, et termine par une bibliographie commentee et un glossaire.",
  },
];

const EXERCICES = {
  titre: "Exercices pratiques et corrig\u00e9s",
  consigne: "Propose au moins huit exercices progressifs et concrets, chacun suivi de son corrige commente. Consignes precises, duree indicative, materiel necessaire, critere de reussite. Pas d invitation vague a reflechir.",
};

const QCM = {
  titre: "QCM du module",
  consigne:
    "Commence par une phrase adressee au stagiaire lui rappelant que ce questionnaire sert a consolider ses acquis, " +
    "qu il dispose du corrige et qu il peut le refaire autant de fois qu il le souhaite. " +
    "Redige ensuite exactement " + QUESTIONS_PAR_QCM + " questions a choix multiple portant sur ce seul module. " +
    "Quatre propositions par question, une seule correcte. Apres les questions, donne le corrige avec, pour chacune, " +
    "la bonne reponse ET l explication de pourquoi les autres sont fausses.\n\n" + REGLE_EVALUATION,
};

const SYNTHESE = { titre: "Votre synth\u00e8se personnelle", local: true };

// Comparaison insensible aux accents et a la casse.
//
// INDISPENSABLE : la reprise du generateur repere les sections deja ecrites en
// cherchant « ## <titre> » dans le cache. Les titres portent desormais leurs
// accents, alors que tout le cache existant a ete ecrit sans. Sans cette
// normalisation, plus aucune section ne serait reconnue et les 532 formations
// seraient reecrites entierement, a nos frais.
function sansAccents(t: string): string {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function gabaritSynthese(titreModule: string, code: string, cible: string): string {
  const lien = "https://academiapro.fr/synthese?code=" + code + "&cible=" + cible;

  return "Vous venez de terminer ce module. Avant de passer au suivant, r\u00e9digez VOTRE PROPRE SYNTH\u00c8SE de " +
    titreModule + ".\n\n" +
    "Ce qui est attendu :\n\n" +
    "- de 300 \u00e0 500 mots, avec vos mots, sans recopier le cours ;\n" +
    "- les notions cl\u00e9s du module, telles que vous les avez comprises ;\n" +
    "- la m\u00e9thode ou le protocole, d\u00e9crit comme si vous l\u2019expliquiez \u00e0 un confr\u00e8re ;\n" +
    "- deux situations concr\u00e8tes dans lesquelles vous comptez l\u2019appliquer ;\n" +
    "- ce qui reste flou pour vous, s\u2019il y a lieu.\n\n" +
    "D\u00c9POSEZ VOTRE SYNTH\u00c8SE ICI :\n" + lien + "\n\n" +
    "Vous pouvez la modifier tant qu\u2019elle n\u2019a pas \u00e9t\u00e9 corrig\u00e9e. Une fois \u00e9valu\u00e9e, vous recevrez par email " +
    "une note et un retour \u00e9crit signalant les points essentiels que vous auriez omis.\n\n" +
    "Ce travail compte davantage que le QCM. Le QCM v\u00e9rifie que vous reconnaissez une bonne r\u00e9ponse ; " +
    "la synth\u00e8se v\u00e9rifie que vous avez r\u00e9ellement int\u00e9gr\u00e9 le module et que vous savez le transmettre.";
}

async function appeler(cle: string, invite: string, langue: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODELE, max_tokens: JETONS_PAR_PASSE, system: systemePour(langue), messages: [{ role: "user", content: invite }] }),
  });
  if (!r.ok) throw new Error("Claude a repondu " + r.status);
  const rep = await r.json();
  return (rep.content || []).map(function (b: any) { return b && b.type === "text" ? b.text : ""; }).join("").trim();
}

function invitePour(titreFormation: string, l: any, mission: any, dejaEcrites: string[], langue: string): string {
  const nomLangue = LANGUES[langue] || "francais";

  let texte =
    "Formation: " + titreFormation + "\n" +
    "Chapitre " + l.chapitre_num + ": " + l.chapitre_titre + "\n" +
    "Module " + l.module_num + ": " + l.module_titre + "\n" +
    "Langue de redaction: " + nomLangue + "\n\n" +
    "SECTION A REDIGER : " + mission.titre + "\n" +
    mission.consigne + "\n\n";

  if (dejaEcrites.length > 0) {
    texte += "SECTIONS DEJA REDIGEES DANS CE MODULE, A NE PAS REPRENDRE :\n- " +
      dejaEcrites.join("\n- ") + "\n" +
      "N y reviens pas, meme brievement. Apporte uniquement du contenu nouveau.\n\n";
  }

  if (l.type === "pratique") {
    texte += "Ce module est de nature PRATIQUE : privilegie les scripts complets, les fiches de suivi et les protocoles.\n";
  }
  if (l.type === "evaluation") {
    texte += "Ce module est de nature EVALUATIVE : privilegie les questions, les corriges commentes et les criteres de notation.\n";
  }

  texte += "Redige directement le contenu de la section, sans introduction sur ce que tu vas faire, sans conclusion sur ce que tu viens de faire. " +
    "Termine toujours ta derniere phrase : ne t arrete jamais au milieu d un mot ou d une phrase. " +
    "REDIGE ENTIEREMENT EN " + nomLangue.toUpperCase() + ", titres compris.";
  return texte;
}

// ==================================================================
// LE TEXTE AVANT LE DESSIN : entites, symboles, jeu de caracteres.
//
// pdf-lib ne dessine que ce que la police sait encoder. Les polices
// standard (Times, Courier) sont en WinAnsi : tout le latin accentue,
// plus l euro, la puce, le symbole marque deposee.
//
// Trois etapes, dans cet ordre :
//   1. decoderEntites  -> &#9776; devient le caractere reel
//   2. translitterer   -> le caractere reel devient dessinable
//   3. le reste est supprime, mais seulement en dernier recours
//
// AVANT, l etape 1 n existait pas et l etape 3 s appliquait d emblee :
// le stagiaire lisait « &#128196; Budget_2024.xlsx » et « CA () » au
// lieu de « CA (euro) ».
// ==================================================================

const ENTITES_NOMMEES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  hellip: "...", mdash: "-", ndash: "-", minus: "-",
  laquo: "\u00ab", raquo: "\u00bb", deg: "\u00b0", euro: "\u20ac",
  bull: "\u2022", middot: "\u00b7", times: "\u00d7", divide: "\u00f7",
  rarr: "->", larr: "<-", harr: "<->", uarr: "^", darr: "v",
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"',
  eacute: "\u00e9", egrave: "\u00e8", agrave: "\u00e0", ccedil: "\u00e7",
  ugrave: "\u00f9", ocirc: "\u00f4", ecirc: "\u00ea", icirc: "\u00ee",
  acirc: "\u00e2", ucirc: "\u00fb", euml: "\u00eb", iuml: "\u00ef",
  copy: "(c)", reg: "(r)", trade: "\u2122",
};

function pointDeCode(cp: number): string {
  try { return String.fromCodePoint(cp); } catch (e) { return ""; }
}

function decoderEntites(t: string): string {
  return String(t || "")
    .replace(/&#x([0-9a-f]+);/gi, function (_m, h) { return pointDeCode(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (_m, d) { return pointDeCode(parseInt(d, 10)); })
    .replace(/&([a-z]+);/gi, function (m, n) {
      const v = ENTITES_NOMMEES[String(n).toLowerCase()];
      return v === undefined ? m : v;
    });
}

// Les symboles nommes un par un. Le reste passe par les plages.
const SYMBOLES: Record<string, string> = {
  "\u2630": "=",          // menu hamburger
  "\u2302": "",           // maison
  "\u25d0": "o",
  "\u2715": "x", "\u2716": "x", "\u2717": "-", "\u2718": "-",
  "\u2713": "x", "\u2714": "x",
  "\u2212": "-", "\u2261": "=", "\u2260": "!=", "\u2264": "<=", "\u2265": ">=",
  "\u2211": "Somme", "\u221a": "racine", "\u221e": "infini",
  "\u2190": "<-", "\u2191": "^", "\u2192": "->", "\u2193": "v", "\u2194": "<->",
  "\u21d0": "<-", "\u21d2": "->", "\u21d4": "<->",
  "\u21b5": "Entree", "\u23ce": "Entree", "\u21e5": "Tab", "\u21e7": "Maj",
  "\u232b": "Retour", "\u2318": "Cmd", "\u2325": "Alt",
  "\u25b6": ">", "\u25c0": "<", "\u25b2": "^", "\u25bc": "v",
  "\u25a0": "[]", "\u25a1": "[]", "\u25fb": "[]", "\u25fc": "[]",
  "\u25cf": "o", "\u25cb": "o",
  "\uff5c": "|", "\u2026": "...", "\u00a0": " ",
  "\u2018": "'", "\u2019": "'", "\u201a": "'", "\u201b": "'",
  "\u201c": '"', "\u201d": '"', "\u201e": '"',
  "\u2013": "-", "\u2014": "-", "\u2015": "-",
  "\u2039": "<", "\u203a": ">",
};

// Les caracteres au-dessus de U+00FF que WinAnsi sait tout de meme dessiner.
const WINANSI_EN_PLUS = "\u20ac\u2022\u2020\u2021\u2122\u2030\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192";

function translitterer(t: string): string {
  let sortie = "";
  const texte = String(t || "");

  for (const car of texte) {
    const cp = car.codePointAt(0) || 0;

    const remplace = SYMBOLES[car];
    if (remplace !== undefined) { sortie += remplace; continue; }

    if (cp <= 0xff) { sortie += car; continue; }
    if (WINANSI_EN_PLUS.indexOf(car) >= 0) { sortie += car; continue; }

    if (cp >= 0x2500 && cp <= 0x257f) { sortie += "-"; continue; }   // filets
    if (cp >= 0x2580 && cp <= 0x259f) { sortie += " "; continue; }   // pavés
    if (cp >= 0x25a0 && cp <= 0x25ff) { sortie += "-"; continue; }   // formes
    if (cp >= 0x2190 && cp <= 0x21ff) { sortie += "->"; continue; }  // flèches
    if (cp >= 0x1f000) { sortie += ""; continue; }                   // émoji
    if (cp >= 0x2600 && cp <= 0x27bf) { sortie += ""; continue; }    // pictos

    // Dernier recours : la lettre sans son signe diacritique.
    const base = car.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    sortie += base.length === 1 && (base.codePointAt(0) || 0) <= 0xff ? base : "";
  }

  return sortie;
}

function latin1(t: string): string {
  return translitterer(decoderEntites(String(t || "")));
}

// Le filet de securite absolu : si une police refuse un caractere, on
// redessine la ligne en ASCII plutot que de faire echouer tout le manuel.
function asciiPur(t: string): string {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "");
}

function couper(texte: string, police: any, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  for (const paragraphe of String(texte).split("\n")) {
    const mots = paragraphe.split(/\s+/).filter(Boolean);
    let ligne = "";
    for (const mot of mots) {
      const essai = ligne ? ligne + " " + mot : mot;
      let l = 0;
      try { l = police.widthOfTextAtSize(essai, taille); } catch (e) { l = essai.length * taille * 0.5; }
      if (l > largeur && ligne) { lignes.push(ligne); ligne = mot; } else { ligne = essai; }
    }
    if (ligne) lignes.push(ligne);
  }
  return lignes;
}

function mesurer(police: any, texte: string, taille: number): number {
  try { return police.widthOfTextAtSize(texte, taille); } catch (e) { return texte.length * taille * 0.5; }
}

function tracer(page: any, texte: string, options: any) {
  try { page.drawText(texte, options); }
  catch (e) {
    try { page.drawText(asciiPur(texte), options); } catch (e2) { /* on n interrompt jamais un manuel */ }
  }
}

function centrer(page: any, texte: string, y: number, police: any, taille: number, couleur: any) {
  const l = mesurer(police, texte, taille);
  tracer(page, texte, { x: (LARGEUR - l) / 2, y: y, size: taille, font: police, color: couleur });
}

// ==================================================================
// LE MARKDOWN EN LIGNE : gras, italique, code.
//
// Le modele ecrit **cellule**, *legende* et `=SOMME(A1:A10)`. Avant, tout
// cela partait tel quel dans le PDF, asterisques comprises. On decoupe la
// phrase en segments porteurs de leur style, et chaque segment est dessine
// avec sa propre police.
// ==================================================================

function analyserInline(texte: string): any[] {
  const segments: any[] = [];
  const source = String(texte || "");
  const motif = /(`[^`\n]+`)|(\*\*\*[^*\n]+\*\*\*)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)/g;

  let position = 0;
  let trouve: any;

  function ajouterSimple(brut: string) {
    // Les marqueurs orphelins ne doivent jamais atteindre la page.
    const propre = brut.replace(/\*\*/g, "").replace(/`/g, "");
    if (propre) segments.push({ t: propre, gras: false, italique: false, code: false });
  }

  while ((trouve = motif.exec(source)) !== null) {
    if (trouve.index > position) ajouterSimple(source.slice(position, trouve.index));

    const bloc = trouve[0];
    if (bloc.charAt(0) === "`") {
      segments.push({ t: bloc.slice(1, -1), gras: false, italique: false, code: true });
    } else if (bloc.indexOf("***") === 0) {
      segments.push({ t: bloc.slice(3, -3), gras: true, italique: true, code: false });
    } else if (bloc.indexOf("**") === 0) {
      segments.push({ t: bloc.slice(2, -2), gras: true, italique: false, code: false });
    } else {
      segments.push({ t: bloc.slice(1, -1), gras: false, italique: true, code: false });
    }

    position = trouve.index + bloc.length;
  }

  if (position < source.length) ajouterSimple(source.slice(position));
  if (segments.length === 0) segments.push({ t: "", gras: false, italique: false, code: false });
  return segments;
}

function sansBalises(html: string): string {
  return decoderEntites(
    String(html || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

// Un <table> HTML : des rangs de cellules, avec leur style.
function lireTableauHTML(html: string): any[] {
  const rangs: any[] = [];
  const lignes = String(html).match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (const tr of lignes) {
    const cellules: any[] = [];
    const cases = tr.match(/<(td|th)[\s\S]*?<\/(td|th)>/gi) || [];

    for (const c of cases) {
      const style = (c.match(/style\s*=\s*"([^"]*)"/i) || ["", ""])[1];
      cellules.push({
        texte: latin1(sansBalises(c)),
        fond: couleurDuStyle(style, "background"),
        encre: couleurDuStyle(style, "color") || ENCRE,
        gras: /font-weight\s*:\s*bold/i.test(style) || /<(b|strong|th)\b/i.test(c),
      });
    }

    if (cellules.length > 0) rangs.push(cellules);
  }

  return rangs;
}

// Un tableau ecrit en markdown : | Onglet | Contenu |
function lireTableauMarkdown(texte: string): any[] {
  const rangs: any[] = [];
  const lignes = String(texte).split("\n");
  let premiere = true;

  for (const brute of lignes) {
    const l = brute.trim();
    if (!l.startsWith("|") || !l.endsWith("|")) continue;
    if (/^\|[\s:|-]+\|$/.test(l)) continue;

    const cellules = l.slice(1, -1).split("|").map(function (c: string) {
      return {
        texte: latin1(c.replace(/\*\*/g, "").replace(/`/g, "").trim()),
        fond: premiere ? rgb(0.957, 0.937, 0.894) : null,
        encre: premiere ? rgb(0.478, 0.373, 0.165) : ENCRE,
        gras: premiere,
      };
    });

    if (cellules.length > 0) {
      rangs.push(cellules);
      premiere = false;
    }
  }

  return rangs;
}

// "#217346" ou "#fff" -> une couleur pdf-lib. Null si illisible.
function hexEnCouleur(hex: string): any {
  const h = String(hex || "").replace(/[^0-9a-f]/gi, "");
  if (h.length === 3) {
    return rgb(
      parseInt(h[0] + h[0], 16) / 255,
      parseInt(h[1] + h[1], 16) / 255,
      parseInt(h[2] + h[2], 16) / 255
    );
  }
  if (h.length === 6) {
    return rgb(
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    );
  }
  return null;
}

function couleurDuStyle(style: string, propriete: string): any {
  const motif = new RegExp("(?:^|;)\\s*" + propriete + "(?:-color)?\\s*:\\s*([^;]+)", "i");
  const trouve = String(style || "").match(motif);
  if (!trouve) return null;
  return hexEnCouleur(trouve[1]);
}

// ==================================================================
// LA LECTURE DU HTML A PROFONDEUR EQUILIBREE.
//
// C EST ICI QUE SE JOUAIT LE RUBAN ETALE SUR CINQ PAGES. L ancienne
// expression <div[^>]*>[\s\S]*?</div> n est pas gourmande : sur des div
// imbriques elle s arrete a la PREMIERE fermeture rencontree. Chaque
// enfant du ruban devenait donc un bandeau isole, un par ligne.
//
// On compte desormais les ouvertures et les fermetures. Et un conteneur
// dont tous les enfants sont courts est rendu sur UNE SEULE bande.
// ==================================================================

const BALISES_BLOC = "div|table|section|header|footer|nav|ul|ol|li|p";

function finDeBalise(texte: string, debut: number, nom: string): number {
  const motif = new RegExp("<\\s*(/?)" + nom + "\\b[^>]*?(/?)>", "gi");
  motif.lastIndex = debut;
  let profondeur = 0;
  let trouve: any;

  while ((trouve = motif.exec(texte)) !== null) {
    if (trouve[1]) {
      profondeur = profondeur - 1;
      if (profondeur <= 0) return trouve.index + trouve[0].length;
    } else if (!trouve[2]) {
      profondeur = profondeur + 1;
    }
  }
  return texte.length;
}

// Separe un contenu en morceaux de texte et en elements HTML complets.
function decouperElements(texte: string): any[] {
  const sortie: any[] = [];
  const source = String(texte || "");
  const motif = new RegExp("<\\s*(" + BALISES_BLOC + ")\\b", "gi");
  let position = 0;

  while (true) {
    motif.lastIndex = position;
    const trouve = motif.exec(source);
    if (!trouve) {
      if (position < source.length) sortie.push({ type: "texte", contenu: source.slice(position) });
      break;
    }
    if (trouve.index > position) sortie.push({ type: "texte", contenu: source.slice(position, trouve.index) });
    const fin = finDeBalise(source, trouve.index, trouve[1]);
    sortie.push({ type: "element", contenu: source.slice(trouve.index, fin) });
    position = fin;
  }

  return sortie.filter(function (s: any) { return s.contenu && s.contenu.trim(); });
}

function ouverture(html: string): any {
  const m = String(html).match(/^<\s*([a-z0-9]+)([^>]*)>/i);
  if (!m) return null;
  const nom = m[1].toLowerCase();
  const style = (m[2].match(/style\s*=\s*"([^"]*)"/i) || ["", ""])[1];
  const debut = m[0].length;
  const fin = String(html).toLowerCase().lastIndexOf("</" + nom);
  return { nom: nom, style: style, interieur: fin > debut ? html.slice(debut, fin) : html.slice(debut) };
}

// Le contenu porte-t-il un schema a redessiner ?
function contientSchema(bloc: string): boolean {
  return new RegExp("<\\s*(" + BALISES_BLOC + "|tr|td)\\b", "i").test(bloc);
}

async function composerManuel(fiche: any, plan: any[], contenus: any, examen: string, langue: string): Promise<Uint8Array> {
  const titre = latin1(fiche.titre || fiche.code);

  const livre = await PDFDocument.create();
  const normal = await livre.embedFont("Times-Roman");
  const gras = await livre.embedFont("Times-Bold");
  const italique = await livre.embedFont("Times-Italic");
  const grasItalique = await livre.embedFont("Times-BoldItalic");
  const fixe = await livre.embedFont("Courier");
  const fixeGras = await livre.embedFont("Courier-Bold");

  let page = livre.addPage([LARGEUR, HAUTEUR]);
  let y = HAUTEUR - MARGE - 26;
  const pages: any[] = [page];
  const sommaire: any[] = [];
  let chapitreCourant = -1;

  function nouvellePage() {
    page = livre.addPage([LARGEUR, HAUTEUR]);
    pages.push(page);
    y = HAUTEUR - MARGE - 26;
  }

  function policePour(seg: any): any {
    if (seg.code) return fixe;
    if (seg.gras && seg.italique) return grasItalique;
    if (seg.gras) return gras;
    if (seg.italique) return italique;
    return normal;
  }

  function ecrire(lignes: string[], police: any, taille: number, interligne: number, couleur: any, avant: number, retrait: number) {
    y = y - avant;
    for (const l of lignes) {
      if (y < BAS + interligne) nouvellePage();
      tracer(page, l, { x: MARGE + retrait, y: y, size: taille, font: police, color: couleur });
      y = y - interligne;
    }
  }

  // Decoupe des segments stylisés en lignes, chaque mot gardant sa police.
  // « colle » retient l absence d espace avant le mot : c est ce qui evite
  // d ecrire « (extension .xlsx , .xlsm ) » au lieu de « (extension .xlsx, .xlsm) ».
  function couperRiche(segments: any[], taille: number, largeur: number): any[][] {
    const jetons: any[] = [];
    let espaceEnAttente = false;

    for (const seg of segments) {
      const texte = latin1(seg.t);
      const morceaux = texte.split(/(\s+)/);
      for (const p of morceaux) {
        if (!p) continue;
        if (/^\s+$/.test(p)) { espaceEnAttente = true; continue; }
        jetons.push({ texte: p, seg: seg, colle: !espaceEnAttente && jetons.length > 0 });
        espaceEnAttente = false;
      }
    }

    const lignes: any[][] = [];
    let ligne: any[] = [];
    let largeurCourante = 0;

    for (const jeton of jetons) {
      const police = policePour(jeton.seg);
      const largeurMot = mesurer(police, jeton.texte, taille);
      const largeurEspace = ligne.length > 0 && !jeton.colle ? mesurer(normal, " ", taille) : 0;

      if (ligne.length > 0 && largeurCourante + largeurEspace + largeurMot > largeur) {
        lignes.push(ligne);
        ligne = [{ texte: jeton.texte, seg: jeton.seg, colle: true }];
        largeurCourante = largeurMot;
      } else {
        ligne.push(jeton);
        largeurCourante = largeurCourante + largeurEspace + largeurMot;
      }
    }

    if (ligne.length > 0) lignes.push(ligne);
    return lignes;
  }

  function ecrireRiche(segments: any[], taille: number, interligne: number, couleur: any, avant: number, retrait: number, forcerCouleur: boolean) {
    const lignes = couperRiche(segments, taille, UTILE - retrait);
    y = y - avant;

    for (const l of lignes) {
      if (y < BAS + interligne) nouvellePage();
      let x = MARGE + retrait;

      for (let i = 0; i < l.length; i++) {
        const jeton = l[i];
        const police = policePour(jeton.seg);
        if (i > 0 && !jeton.colle) x = x + mesurer(normal, " ", taille);
        tracer(page, jeton.texte, {
          x: x,
          y: y,
          size: taille,
          font: police,
          color: forcerCouleur ? couleur : (jeton.seg.code ? rgb(0.30, 0.30, 0.36) : couleur),
        });
        x = x + mesurer(police, jeton.texte, taille);
      }

      y = y - interligne;
    }
  }

  function paragraphe(texte: string) {
    ecrireRiche(analyserInline(texte), 11, 16.5, ENCRE, 7, 0, false);
  }

  function titreNiveau(niveau: number, texte: string) {
    if (niveau <= 2) {
      ecrireRiche(analyserInline(texte), 11.5, 16, OR, 14, 0, true);
    } else if (niveau === 3) {
      ecrireRiche(analyserInline(texte), 10.8, 15, ENCRE, 11, 0, true);
    } else {
      ecrireRiche(analyserInline(texte), 10.2, 14, GRIS, 9, 0, true);
    }
  }

  function puce(texte: string) {
    if (y < BAS + 20) nouvellePage();
    y = y - 3;
    tracer(page, "-", { x: MARGE + 4, y: y, size: 11, font: normal, color: ENCRE });
    ecrireRiche(analyserInline(texte), 11, 16, ENCRE, 0, 18, false);
  }

  function filet() {
    if (y < BAS + 24) nouvellePage();
    y = y - 10;
    page.drawRectangle({ x: MARGE + UTILE * 0.3, y: y, width: UTILE * 0.4, height: 0.5, color: TRAIT });
    y = y - 12;
  }

  function blocCode(lignes: string[]) {
    const contenu = lignes.map(function (l) { return latin1(l); });
    const decoupees: string[] = [];
    for (const l of contenu) {
      const morceaux = couper(l || " ", fixe, 8.5, UTILE - 20);
      for (const m of morceaux) decoupees.push(m);
    }

    const hauteur = decoupees.length * 12 + 14;
    if (y - hauteur < BAS && hauteur < HAUTEUR - MARGE - BAS) nouvellePage();

    y = y - 10;
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, color: rgb(0.965, 0.961, 0.949) });
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, borderColor: TRAIT, borderWidth: 0.5 });

    let yc = y - 15;
    for (const l of decoupees) {
      if (yc < BAS) { nouvellePage(); yc = y - 15; }
      tracer(page, l, { x: MARGE + 10, y: yc, size: 8.5, font: fixe, color: ENCRE });
      yc = yc - 12;
    }

    y = y - hauteur - 12;
  }

  // DESSINE UN TABLEAU, qu il vienne d un <table> HTML ou du markdown.
  //
  // Deux passes : on calcule d abord toutes les hauteurs, ce qui permet de
  // savoir si le tableau tient sur la page restante. Un schema d interface
  // coupe en deux pages ne veut plus rien dire.
  //
  // Les largeurs sont proportionnelles au contenu, avec un plancher, au lieu
  // du partage a parts egales qui ecrasait les colonnes denses.
  function dessinerTableau(rangs: any[], monospace: boolean) {
    if (!rangs || rangs.length === 0) return;

    const colonnes = Math.max.apply(null, rangs.map(function (r: any) { return r.length; }));
    if (colonnes < 1) return;

    const taille = colonnes > 6 ? 7 : colonnes > 4 ? 8 : 9;
    const interligne = taille + 3;
    const marge = 4;

    const policeNormale = monospace ? fixe : normal;
    const policeGrasse = monospace ? fixeGras : gras;

    // Poids de chaque colonne : la cellule la plus longue, plafonnee.
    const poids: number[] = [];
    let total = 0;
    for (let i = 0; i < colonnes; i++) {
      let maxi = 1;
      for (const rang of rangs) {
        const cel = rang[i];
        const longueur = cel && cel.texte ? Math.min(String(cel.texte).length, 70) : 1;
        if (longueur > maxi) maxi = longueur;
      }
      poids.push(maxi);
      total = total + maxi;
    }

    const plancher = UTILE * 0.10;
    const largeurs: number[] = [];
    let sommeLargeurs = 0;
    for (let i = 0; i < colonnes; i++) {
      const l = Math.max(plancher, (UTILE * poids[i]) / total);
      largeurs.push(l);
      sommeLargeurs = sommeLargeurs + l;
    }
    for (let i = 0; i < colonnes; i++) largeurs[i] = (largeurs[i] * UTILE) / sommeLargeurs;

    // Premiere passe : les decoupes et les hauteurs.
    const preparation: any[] = [];
    let hauteurTotale = 0;

    for (const rang of rangs) {
      let lignesMax = 1;
      const decoupes: string[][] = [];

      for (let i = 0; i < colonnes; i++) {
        const cel = rang[i];
        const police = cel && cel.gras ? policeGrasse : policeNormale;
        const morceaux = cel && cel.texte
          ? couper(cel.texte, police, taille, largeurs[i] - marge * 2)
          : [""];
        decoupes.push(morceaux);
        if (morceaux.length > lignesMax) lignesMax = morceaux.length;
      }

      const hauteur = lignesMax * interligne + marge * 2;
      preparation.push({ rang: rang, decoupes: decoupes, hauteur: hauteur });
      hauteurTotale = hauteurTotale + hauteur;
    }

    y = y - 12;

    // Si le tableau entier tient sur une page vierge, on ne le coupe pas.
    if (y - hauteurTotale < BAS && hauteurTotale < HAUTEUR - MARGE - BAS - 30) nouvellePage();

    // Seconde passe : le trace.
    for (const p of preparation) {
      if (y - p.hauteur < BAS) nouvellePage();
      const hautRang = y;

      let x = MARGE;
      for (let i = 0; i < colonnes; i++) {
        const cel = p.rang[i];

        if (cel && cel.fond) {
          page.drawRectangle({ x: x, y: hautRang - p.hauteur, width: largeurs[i], height: p.hauteur, color: cel.fond });
        }

        page.drawRectangle({
          x: x,
          y: hautRang - p.hauteur,
          width: largeurs[i],
          height: p.hauteur,
          borderColor: TRAIT,
          borderWidth: 0.5,
        });

        let yc = hautRang - marge - taille;
        for (const ligne of p.decoupes[i]) {
          if (ligne) {
            tracer(page, ligne, {
              x: x + marge,
              y: yc,
              size: taille,
              font: cel && cel.gras ? policeGrasse : policeNormale,
              color: (cel && cel.encre) || ENCRE,
            });
          }
          yc = yc - interligne;
        }

        x = x + largeurs[i];
      }

      y = hautRang - p.hauteur;
    }

    y = y - 14;
  }

  // UN BANDEAU : barre de titre, onglet de ruban, message d etat.
  function dessinerBandeau(style: string, texte: string) {
    const propre = latin1(texte);
    if (!propre) return;

    const fond = couleurDuStyle(style, "background") || rgb(0.95, 0.95, 0.95);
    const encre = couleurDuStyle(style, "color") || ENCRE;
    const lignes = couper(propre, fixe, 9, UTILE - 16);
    const hauteur = lignes.length * 13 + 12;

    if (y - hauteur < BAS) nouvellePage();

    y = y - 10;
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, color: fond });
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, borderColor: TRAIT, borderWidth: 0.5 });

    let yc = y - 14;
    for (const l of lignes) {
      tracer(page, l, { x: MARGE + 8, y: yc, size: 9, font: fixe, color: encre });
      yc = yc - 13;
    }

    y = y - hauteur - 12;
  }

  // Un element HTML complet. Recursif : un conteneur descend dans ses
  // enfants, sauf si ses enfants sont tous courts — auquel cas ils sont
  // rassembles sur une seule bande, comme une rangee de boutons.
  function dessinerElement(html: string, profondeur: number) {
    if (profondeur > 6) {
      const t = latin1(sansBalises(html));
      if (t) paragraphe(t);
      return;
    }

    const info = ouverture(html);
    if (!info) {
      const t = latin1(sansBalises(html));
      if (t) paragraphe(t);
      return;
    }

    if (info.nom === "table") {
      dessinerTableau(lireTableauHTML(html), true);
      return;
    }

    const enfants = decouperElements(info.interieur);
    const blocs = enfants.filter(function (e: any) { return e.type === "element"; });

    if (blocs.length === 0) {
      dessinerBandeau(info.style, sansBalises(info.interieur));
      return;
    }

    const contientTableau = blocs.some(function (e: any) { return /^<\s*table/i.test(e.contenu); });

    if (!contientTableau) {
      const tousCourts = blocs.every(function (e: any) {
        const sous = ouverture(e.contenu);
        if (!sous) return false;
        if (new RegExp("<\\s*(" + BALISES_BLOC + ")\\b", "i").test(sous.interieur)) return false;
        return sansBalises(sous.interieur).length <= 40;
      });

      if (tousCourts) {
        const textes = blocs
          .map(function (e: any) { const sous = ouverture(e.contenu); return sous ? sansBalises(sous.interieur) : ""; })
          .filter(Boolean);
        if (textes.length > 0) { dessinerBandeau(info.style, textes.join("   ")); return; }
      }
    }

    for (const e of enfants) {
      if (e.type === "element") {
        dessinerElement(e.contenu, profondeur + 1);
      } else {
        const t = latin1(sansBalises(e.contenu));
        if (t) paragraphe(t);
      }
    }
  }

  // Le markdown d une zone sans HTML, lu ligne par ligne.
  //
  // C EST ICI que les ### sortaient en clair : l ancien test
  // x.indexOf("## ") === 0 renvoyait 1 sur « ### Section A », jamais 0.
  function ecrireMarkdown(texte: string) {
    const lignes = String(texte || "").split("\n");
    let tampon: string[] = [];
    let tableau: string[] = [];
    let codeLignes: string[] = [];
    let dansCode = false;

    function viderTampon() {
      if (tampon.length > 0) { paragraphe(tampon.join(" ")); tampon = []; }
    }
    function viderTableau() {
      if (tableau.length > 0) { dessinerTableau(lireTableauMarkdown(tableau.join("\n")), false); tableau = []; }
    }

    for (const brute of lignes) {
      const s = String(brute).trim();

      if (/^```/.test(s)) {
        if (dansCode) { blocCode(codeLignes); codeLignes = []; dansCode = false; }
        else { viderTampon(); viderTableau(); dansCode = true; }
        continue;
      }
      if (dansCode) { codeLignes.push(String(brute)); continue; }

      if (!s) { viderTampon(); viderTableau(); continue; }

      if (s.startsWith("|") && s.endsWith("|")) { viderTampon(); tableau.push(s); continue; }
      viderTableau();

      if (/^(-{3,}|_{3,}|\*{3,})$/.test(s)) { viderTampon(); filet(); continue; }

      const entete = s.match(/^(#{1,6})\s+(.*)$/);
      if (entete) { viderTampon(); titreNiveau(entete[1].length, entete[2]); continue; }

      const liste = s.match(/^([-*+])\s+(.*)$/);
      if (liste) { viderTampon(); puce(liste[2]); continue; }

      const numerotee = s.match(/^(\d{1,3})[.)]\s+(.*)$/);
      if (numerotee) { viderTampon(); puce(numerotee[1] + ". " + numerotee[2]); continue; }

      tampon.push(s);
    }

    if (dansCode && codeLignes.length > 0) blocCode(codeLignes);
    viderTampon();
    viderTableau();
  }

  // Separe le contenu d un module en zones HTML et en zones markdown.
  //
  // Le decoupage par lignes vides d avant cassait les schemas en morceaux :
  // une ligne vide au milieu d un <table> et le tableau partait en trois.
  function corps(texte: string) {
    const source = String(texte || "");
    const motif = new RegExp("<\\s*(" + BALISES_BLOC + ")\\b", "i");
    let position = 0;

    while (position < source.length) {
      const reste = source.slice(position);
      const trouve = reste.search(motif);

      if (trouve < 0) { ecrireMarkdown(reste); break; }

      if (trouve > 0) ecrireMarkdown(reste.slice(0, trouve));

      const debutAbsolu = position + trouve;
      const nom = (source.slice(debutAbsolu).match(new RegExp("^<\\s*(" + BALISES_BLOC + ")\\b", "i")) || ["", "div"])[1];
      const finAbsolue = finDeBalise(source, debutAbsolu, nom);

      dessinerElement(source.slice(debutAbsolu, finAbsolue), 0);
      position = finAbsolue;
    }
  }

  for (const l of plan) {
    if (l.chapitre_num !== chapitreCourant) {
      chapitreCourant = l.chapitre_num;
      nouvellePage();
      const etiquette = "Chapitre " + l.chapitre_num + " - " + latin1(l.chapitre_titre);
      page.drawRectangle({ x: MARGE, y: HAUTEUR - 132, width: UTILE, height: 1.5, color: OR });
      let yt = HAUTEUR - 118;
      for (const ligne of couper(etiquette, gras, 19, UTILE)) {
        tracer(page, ligne, { x: MARGE, y: yt, size: 19, font: gras, color: OR });
        yt = yt - 25;
      }
      sommaire.push({ niveau: 1, numero: String(l.chapitre_num), titre: latin1(l.chapitre_titre), page: pages.length });
      y = HAUTEUR - 180;
    }

    if (y < BAS + 80) nouvellePage();
    const num = String(l.chapitre_num) + "." + String(l.module_num);
    y = y - 18;
    tracer(page, num, { x: MARGE, y: y, size: 13, font: gras, color: OR });
    let ys = y;
    for (const ligne of couper(latin1(l.module_titre), gras, 13, UTILE - 40)) {
      tracer(page, ligne, { x: MARGE + 36, y: ys, size: 13, font: gras, color: ENCRE });
      ys = ys - 18;
    }
    y = ys - 8;
    sommaire.push({ niveau: 2, numero: num, titre: latin1(l.module_titre), page: pages.length });

    corps(contenus[fiche.code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue] || "");
  }

  // L examen final ferme le manuel, comme un chapitre a part entiere.
  if (examen) {
    nouvellePage();
    page.drawRectangle({ x: MARGE, y: HAUTEUR - 132, width: UTILE, height: 1.5, color: OR });
    tracer(page, "Examen final", { x: MARGE, y: HAUTEUR - 118, size: 19, font: gras, color: OR });
    sommaire.push({ niveau: 1, numero: "", titre: "Examen final", page: pages.length });
    y = HAUTEUR - 180;
    corps(examen);
  }

  const doc = await PDFDocument.create();
  const n2 = await doc.embedFont("Times-Roman");
  const g2 = await doc.embedFont("Times-Bold");

  const cv = doc.addPage([LARGEUR, HAUTEUR]);
  tracer(cv, "Acad\u00e9MIA Pro", { x: MARGE, y: HAUTEUR - 232, size: 12, font: n2, color: GRIS });
  cv.drawRectangle({ x: MARGE, y: HAUTEUR - 244, width: UTILE, height: 2, color: OR });

  centrer(cv, "Manuel Professionnel de Formation", HAUTEUR - 330, n2, 17, ENCRE);

  let yt2 = HAUTEUR - 390;
  for (const l of couper(titre, g2, 30, UTILE)) {
    centrer(cv, l, yt2, g2, 30, OR);
    yt2 = yt2 - 38;
  }

  if (fiche.niveau) {
    centrer(cv, latin1(String(fiche.niveau)), yt2 - 6, n2, 14, ENCRE);
    yt2 = yt2 - 30;
  }

  cv.drawRectangle({ x: MARGE, y: yt2 - 40, width: UTILE, height: 2, color: OR });

  const infos: string[] = ["Formation " + latin1(fiche.code), "Acad\u00e9MIA Pro"];
  if (fiche.duree) infos.push(latin1(String(fiche.duree)));
  if (fiche.domaine) infos.push(latin1(String(fiche.domaine)));

  let yi = yt2 - 76;
  tracer(cv, infos.join(" - "), { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE });
  yi = yi - 18;
  const nbCh = sommaire.filter(function (s: any) { return s.niveau === 1; }).length;
  const nbMo = sommaire.filter(function (s: any) { return s.niveau === 2; }).length;
  tracer(cv, String(nbCh) + " chapitres - " + String(nbMo) + " modules", { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE });
  yi = yi - 18;
  tracer(cv, "DOCUMENT R\u00c9SERV\u00c9 AUX STAGIAIRES INSCRITS", { x: MARGE, y: yi, size: 10, font: n2, color: GRIS });

  const date = latin1(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }));
  tracer(cv, "\u00c9dition du " + date, { x: MARGE, y: 90, size: 10, font: n2, color: GRIS });

  const parPage = 32;
  const nbSommaire = Math.max(1, Math.ceil(sommaire.length / parPage));
  const pagesSommaire: any[] = [];
  for (let i = 0; i < nbSommaire; i++) pagesSommaire.push(doc.addPage([LARGEUR, HAUTEUR]));
  const decalage = 1 + nbSommaire;

  for (let i = 0; i < nbSommaire; i++) {
    const p = pagesSommaire[i];
    let ys = HAUTEUR - 130;
    if (i === 0) {
      centrer(p, "Table des Mati\u00e8res", HAUTEUR - 110, g2, 26, OR);
      p.drawRectangle({ x: MARGE, y: HAUTEUR - 126, width: UTILE, height: 1.5, color: OR });
      ys = HAUTEUR - 180;
    }
    for (const s of sommaire.slice(i * parPage, i * parPage + parPage)) {
      const numero = String(s.page + decalage);
      if (s.niveau === 1) {
        const etiquette = s.numero ? s.numero + ". " + s.titre : s.titre;
        const t = couper(etiquette, g2, 13, UTILE - 50)[0] || s.titre;
        tracer(p, t, { x: MARGE, y: ys, size: 13, font: g2, color: OR });
        tracer(p, "p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 12, font: g2, color: OR });
        ys = ys - 21;
      } else {
        const t = couper(s.numero + " " + s.titre, n2, 11, UTILE - 80)[0] || s.titre;
        tracer(p, t, { x: MARGE + 26, y: ys, size: 11, font: n2, color: ENCRE });
        tracer(p, "p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 10, font: n2, color: GRIS });
        ys = ys - 18;
      }
    }
  }

  const copiees = await doc.copyPages(livre, livre.getPageIndices());
  for (const p of copiees) doc.addPage(p);

  const toutes = doc.getPages();
  for (let i = decalage; i < toutes.length; i++) {
    tracer(toutes[i], titre.slice(0, 68), { x: MARGE, y: HAUTEUR - 44, size: 8, font: n2, color: GRIS });
    toutes[i].drawRectangle({ x: MARGE, y: HAUTEUR - 52, width: UTILE, height: 0.5, color: rgb(0.87, 0.87, 0.87) });
    centrer(toutes[i], String(i + 1), 40, n2, 9, GRIS);
  }

  return await doc.save();
}

async function livrer(fiche: any, plan: any[], contenus: any, examen: string, email: string, identifiant: string, langue: string) {
  const octets = await composerManuel(fiche, plan, contenus, examen, langue);
  const chemin = "manuels/" + fiche.code + "_manuel_" + langue + ".pdf";

  await supabase.storage
    .from(BUCKET)
    .upload(chemin, new Blob([octets], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

  const { data: lien } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, 60 * 60 * 24 * 365);

  const adresse = (lien && lien.signedUrl) || "https://academiapro.fr/dashboard";

  if (email && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Acad\u00e9MIA Pro <bienvenue@academiapro.fr>",
        to: email,
        subject: "Votre manuel " + fiche.titre + " est pr\u00eat",
        html:
          '<div style="font-family:Georgia,serif;line-height:1.7">' +
          '<h1 style="color:#c8a96e">Votre manuel est pr\u00eat</h1>' +
          "<p>Le manuel complet de votre formation vous attend au format PDF : cours, exercices corrig\u00e9s, " +
          "questionnaires de validation et examen final.</p>" +
          '<p><a href="' + adresse + '">T\u00e9l\u00e9charger mon manuel</a></p>' +
          '<p><a href="https://academiapro.fr/dashboard">Acc\u00e9der \u00e0 mon espace de formation</a></p>' +
          "<p>L\u2019\u00e9quipe Acad\u00e9MIA Pro</p></div>",
      }),
    });
  }

  await supabase
    .from("commandes_lemonsqueezy")
    .update({ manuel_statut: "pret", manuel_url: chemin })
    .eq("identifiant_ls", identifiant);

  return octets.length;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    const entete = req.headers.get("authorization") || "";
    const admin = emailDeSession() === "contact@academiapro.fr";
    const parSecret = process.env.CRON_SECRET
      ? (secret === process.env.CRON_SECRET || entete === "Bearer " + process.env.CRON_SECRET)
      : false;

    if (!admin && !parSecret) {
      return NextResponse.json({ ok: false, erreur: "acces refuse" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) return NextResponse.json({ ok: false, erreur: "cle absente" }, { status: 500 });

    // REFAIRE UN MANUEL A LA DEMANDE, sans passer par une commande.
    //   /api/traiter-commandes?secret=XXX&refaire=F007
    const refaire = (url.searchParams.get("refaire") || "").trim().toUpperCase();
    if (refaire) {
      const langueDemandee = (url.searchParams.get("langue") || "fr").trim();

      const { data: ficheR } = await supabase
        .from("formations")
        .select("code, titre, domaine, niveau, duree")
        .eq("code", refaire)
        .maybeSingle();

      if (!ficheR) {
        return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
      }

      const { data: planR } = await supabase
        .from("lms_plans")
        .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
        .eq("formation_code", refaire)
        .gt("chapitre_num", 0)
        .order("chapitre_num", { ascending: true })
        .order("module_num", { ascending: true });

      if (!planR || planR.length === 0) {
        return NextResponse.json({ ok: false, erreur: "aucun plan" }, { status: 404 });
      }

      const { data: cacheR } = await supabase
        .from("lms_cache")
        .select("cache_key, contenu")
        .eq("formation_code", refaire)
        .eq("langue", langueDemandee);

      const contenusR: any = {};
      for (const c of cacheR || []) contenusR[c.cache_key] = c.contenu || "";

      const modulesEcrits = (cacheR || []).filter(function (c: any) {
        return c.cache_key.indexOf("_ch99_") < 0;
      }).length;

      if (modulesEcrits === 0) {
        return NextResponse.json({ ok: false, erreur: "aucun module en cache pour cette langue" }, { status: 404 });
      }

      const examenR = String(contenusR[refaire + "_ch99_mod1_" + langueDemandee] || "")
        .split("\u2014LOT\u2014").join("").trim();

      const octetsR = await composerManuel(ficheR, planR, contenusR, examenR, langueDemandee);
      const cheminR = "manuels/" + refaire + "_manuel_" + langueDemandee + ".pdf";

      await supabase.storage
        .from(BUCKET)
        .upload(cheminR, new Blob([octetsR], { type: "application/pdf" }), { upsert: true, cacheControl: "60" });

      const { data: lienR } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(cheminR, 60 * 60 * 24 * 7);

      return NextResponse.json({
        ok: true,
        code: refaire,
        langue: langueDemandee,
        modules_en_cache: modulesEcrits,
        modules_du_plan: planR.length,
        octets: octetsR.length,
        lien: (lienR && lienR.signedUrl) || null,
      });
    }

    const { data: commandes } = await supabase
      .from("commandes_lemonsqueezy")
      .select("identifiant_ls, formation, email, donnees")
      .eq("manuel_statut", "a_generer")
      .order("id", { ascending: true })
      .limit(1);

    if (!commandes || commandes.length === 0) {
      return NextResponse.json({ ok: true, rien_a_faire: true });
    }

    const cmd = commandes[0];
    const code = String(cmd.formation || "").toUpperCase();

    // LA LANGUE DE L ACHETEUR, jointe a la commande par la route de paiement.
    let langue = "fr";
    try {
      const perso = cmd.donnees && cmd.donnees.meta && cmd.donnees.meta.custom_data;
      const demandee = String((perso && perso.langue) || "fr").toLowerCase().trim();
      if (LANGUES[demandee]) langue = demandee;
    } catch (e) {
      langue = "fr";
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, duree")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      await supabase.from("commandes_lemonsqueezy").update({ manuel_statut: "sans_fiche" }).eq("identifiant_ls", cmd.identifiant_ls);
      return NextResponse.json({ ok: false, code: code, erreur: "formation introuvable" });
    }

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
      await supabase.from("commandes_lemonsqueezy").update({ manuel_statut: "sans_plan" }).eq("identifiant_ls", cmd.identifiant_ls);
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan pour cette formation" });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key, contenu")
      .eq("formation_code", code)
      .eq("langue", langue);

    const contenus: any = {};
    for (const c of cache || []) contenus[c.cache_key] = c.contenu || "";

    // La duree annoncee en base fixe le volume du cours : une page par heure.
    const trouve = String(fiche.duree || "").match(/(\d{1,4})/);
    const heures = trouve ? parseInt(trouve[1], 10) : 0;
    const pagesCours = Math.min(PAGES_MAX, Math.max(PAGES_MIN, heures));
    const cibleParModule = Math.round((pagesCours * CARACTERES_PAR_PAGE) / plan.length);
    const passesCours = Math.max(1, Math.min(COURS.length, Math.ceil(cibleParModule / CARACTERES_PAR_PASSE)));
    const missions: any[] = COURS.slice(0, passesCours).concat([EXERCICES, QCM, SYNTHESE]);

    // ---- 1. UNE section de module par passage ----
    for (const l of plan) {
      const identifiant = "ch" + l.chapitre_num + "_mod" + l.module_num;
      const cleCache = code + "_" + identifiant + "_" + langue;
      const actuel = String(contenus[cleCache] || "");
      const actuelSansAccents = sansAccents(actuel);

      const faites = missions
        .map(function (m: any) { return m.titre; })
        .filter(function (t: string) { return actuelSansAccents.indexOf(sansAccents("## " + t)) >= 0; });

      const suivante = missions.filter(function (m: any) {
        return faites.indexOf(m.titre) < 0;
      })[0];

      if (!suivante) continue;

      let texte = "";
      if (suivante.local) {
        texte = gabaritSynthese(l.module_titre, code, identifiant);
      } else {
        texte = await appeler(cle, invitePour(fiche.titre, l, suivante, faites, langue), langue);
        if (texte.length < 400) {
          return NextResponse.json({ ok: false, code: code, erreur: "section trop courte : " + suivante.titre }, { status: 500 });
        }
      }

      const nouveau = (actuel ? actuel + "\n\n" : "") + "## " + suivante.titre + "\n\n" + texte;

      if (contenus[cleCache] !== undefined) {
        await supabase.from("lms_cache").update({ contenu: nouveau }).eq("cache_key", cleCache);
      } else {
        await supabase.from("lms_cache").insert({
          cache_key: cleCache,
          formation_code: code,
          chapitre_num: l.chapitre_num,
          module_num: l.module_num,
          langue: langue,
          contenu: nouveau,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        code: code,
        langue: langue,
        module: identifiant,
        section: suivante.titre,
        sections_faites: faites.length + 1,
        sections_totales: missions.length,
        taille: nouveau.length,
      });
    }

    // ---- 2. L examen final, un lot de cinq modules par passage ----
    const cleExamen = code + "_ch99_mod1_" + langue;
    const examenActuel = String(contenus[cleExamen] || "");
    const lotsTotal = Math.ceil(plan.length / MODULES_PAR_LOT_EXAMEN);
    const lotsFaits = examenActuel ? examenActuel.split("\u2014LOT\u2014").length - 1 : 0;

    if (lotsFaits < lotsTotal) {
      const debut = lotsFaits * MODULES_PAR_LOT_EXAMEN;
      const groupe = plan.slice(debut, debut + MODULES_PAR_LOT_EXAMEN);
      const sommaire = groupe
        .map(function (m: any) { return "Module " + m.module_num + " : " + m.module_titre; })
        .join("\n");
      const combien = groupe.length * QUESTIONS_PAR_MODULE_EXAMEN;
      const premier = debut * QUESTIONS_PAR_MODULE_EXAMEN + 1;
      const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
      const nomLangue = LANGUES[langue] || "francais";

      const invite =
        "Formation: " + fiche.titre + "\n" +
        "Langue de redaction: " + nomLangue + "\n\n" +
        "SECTION A REDIGER : partie d un examen final\n" +
        "Redige " + combien + " questions a choix multiple, soit EXACTEMENT " +
        QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, dans l ordre des modules ci-dessous. " +
        "Numerote-les a partir de " + premier + ". " +
        "Quatre propositions par question, une seule correcte. Les deux questions d un meme module doivent porter sur des aspects DIFFERENTS de ce module. " +
        "Apres les questions, donne le corrige avec la bonne reponse et son explication. " +
        "REDIGE ENTIEREMENT EN " + nomLangue.toUpperCase() + ".\n\n" +
        REGLE_EVALUATION + "\n\n" +
        "MODULES CONCERNES :\n" + sommaire;

      const morceau = await appeler(cle, invite, langue);

      let contenuExamen = "";
      if (lotsFaits === 0) {
        contenuExamen =
          "Cet examen porte sur l\u2019ensemble des " + plan.length + " modules de la formation, \u00e0 raison de " +
          QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, soit " + total + " questions.\n\n" +
          "\u2014LOT\u2014\n" + morceau;
      } else {
        contenuExamen = examenActuel + "\n\n\u2014LOT\u2014\n" + morceau;
      }

      if (debut + MODULES_PAR_LOT_EXAMEN >= plan.length) {
        contenuExamen +=
          "\n\n## Obtenir votre Certification Acad\u00e9MIA Pro\n\n" +
          "Comptez vos points : chaque bonne r\u00e9ponse vaut un point, sur " + total + " au total.\n\n" +
          "\u00c0 partir de " + SEUIL_REUSSITE + " % de bonnes r\u00e9ponses, soit " +
          Math.ceil((total * SEUIL_REUSSITE) / 100) + " points, la Certification Acad\u00e9MIA Pro de la formation " +
          fiche.titre + " vous est d\u00e9livr\u00e9e. Vous la recevez par email et la t\u00e9l\u00e9chargez depuis votre espace personnel sur academiapro.fr.\n\n" +
          "En dessous de ce seuil, reprenez les modules o\u00f9 vos r\u00e9ponses \u00e9taient fausses, puis repassez l\u2019examen. " +
          "Le nombre de tentatives n\u2019est pas limit\u00e9 : l\u2019objectif est votre ma\u00eetrise, pas votre classement.\n";
      }

      if (contenus[cleExamen] !== undefined) {
        await supabase.from("lms_cache").update({ contenu: contenuExamen }).eq("cache_key", cleExamen);
      } else {
        await supabase.from("lms_cache").insert({
          cache_key: cleExamen,
          formation_code: code,
          chapitre_num: 99,
          module_num: 1,
          langue: langue,
          contenu: contenuExamen,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        code: code,
        langue: langue,
        examen: true,
        lot: lotsFaits + 1,
        lots: lotsTotal,
        taille: contenuExamen.length,
      });
    }

    // ---- 3. Tout est produit : on compose et on livre ----
    const examenPropre = examenActuel.split("\u2014LOT\u2014").join("").trim();
    const poids = await livrer(fiche, plan, contenus, examenPropre, cmd.email, cmd.identifiant_ls, langue);
    return NextResponse.json({ ok: true, code: code, langue: langue, livre: true, octets: poids });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
