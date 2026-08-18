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

const COURS = [
  {
    titre: "Fondements et cadre conceptuel",
    consigne: "Expose les fondements theoriques : origines, auteurs de reference, concepts cles, cadre conceptuel. Cite des travaux et des recherches.",
  },
  {
    titre: "Methode et protocole",
    consigne: "Decris la methode operatoire etape par etape : preparation, deroulement, criteres de reussite, variantes selon les publics. Sois concret et sequentiel.",
  },
  {
    titre: "Etudes de cas",
    consigne: "Presente au moins quatre situations reelles et detaillees : contexte, difficulte rencontree, demarche suivie, resultat, enseignement a en tirer. Des recits, pas des generalites.",
  },
  {
    titre: "Erreurs frequentes et remediation",
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
  titre: "Exercices pratiques et corriges",
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

const SYNTHESE = { titre: "Votre synthese personnelle", local: true };

function gabaritSynthese(titreModule: string, code: string, cible: string): string {
  const lien = "https://academiapro.fr/synthese?code=" + code + "&cible=" + cible;

  return "Vous venez de terminer ce module. Avant de passer au suivant, redigez VOTRE PROPRE SYNTHESE de " +
    titreModule + ".\n\n" +
    "Ce qui est attendu :\n\n" +
    "- de 300 a 500 mots, avec vos mots, sans recopier le cours ;\n" +
    "- les notions cles du module, telles que vous les avez comprises ;\n" +
    "- la methode ou le protocole, decrit comme si vous l expliquiez a un confrere ;\n" +
    "- deux situations concretes dans lesquelles vous comptez l appliquer ;\n" +
    "- ce qui reste flou pour vous, s il y a lieu.\n\n" +
    "DEPOSEZ VOTRE SYNTHESE ICI :\n" + lien + "\n\n" +
    "Vous pouvez la modifier tant qu elle n a pas ete corrigee. Une fois evaluee, vous recevrez par email " +
    "une note et un retour ecrit signalant les points essentiels que vous auriez omis.\n\n" +
    "Ce travail compte davantage que le QCM. Le QCM verifie que vous reconnaissez une bonne reponse ; " +
    "la synthese verifie que vous avez reellement integre le module et que vous savez le transmettre.";
}

async function appeler(cle: string, invite: string, langue: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODELE, max_tokens: 4000, system: systemePour(langue), messages: [{ role: "user", content: invite }] }),
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
    "REDIGE ENTIEREMENT EN " + nomLangue.toUpperCase() + ", titres compris.";
  return texte;
}

function latin1(t: string): string {
  return String(t || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\u0000-\u00FF]/g, "");
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

function centrer(page: any, texte: string, y: number, police: any, taille: number, couleur: any) {
  let l = 0;
  try { l = police.widthOfTextAtSize(texte, taille); } catch (e) { l = texte.length * taille * 0.5; }
  page.drawText(texte, { x: (LARGEUR - l) / 2, y: y, size: taille, font: police, color: couleur });
}

// ══════════════════════════════════════════════════════════════════
// 🖥️🖥️ LES SCHEMAS D'INTERFACE DANS LE MANUEL PDF — ajoute le 18/08.
//
// POURQUOI CE BLOC EXISTE. Depuis le 18/08, le generateur produit pour les
// formations sur logiciel des SCHEMAS D'INTERFACE ECRITS EN HTML : le ruban
// d'Excel, la barre de formule, la grille de cellules. La page de lecture
// les affiche correctement, mais LE MANUEL PDF NON — pdf-lib ne sait que
// dessiner du texte, et le stagiaire aurait recu trente lignes de code brut
// dans son manuel.
//
// 🎯 CE CHANTIER A ETE FAIT AVANT LA PREMIERE VENTE, deliberement. Ses
// mots : « je prefere le faire tant qu'il n'y a pas de client ».
//
// COMMENT ON PROCEDE. On ne convertit pas le HTML : on le LIT et on le
// REDESSINE. Un <table> devient un vrai tableau PDF avec ses bordures, ses
// fonds de couleur et ses cellules en gras ; un <div> isole devient un
// bandeau colore. Les couleurs sont reprises de l'attribut style, donc le
// vert d'Excel reste vert dans le manuel.
//
// ⚠️ CE QUI N'EST PAS RENDU, ET C'EST ASSUME : les bordures individuelles
// par cellule, les images, les polices particulieres. On garde la
// structure, les couleurs de fond et le gras — assez pour reconnaitre
// l'ecran decrit.
//
// 🚨 LES FORMATIONS SANS SCHEMA NE SONT PAS TOUCHEES : le detecteur ne
// s'active que si le bloc contient une balise. Les 504 autres formations
// passent par le chemin habituel.
// ══════════════════════════════════════════════════════════════════

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

// Extrait une couleur d'un attribut style : background, background-color,
// ou color selon la propriete demandee.
function couleurDuStyle(style: string, propriete: string): any {
  const motif = new RegExp("(?:^|;)\\s*" + propriete + "(?:-color)?\\s*:\\s*([^;]+)", "i");
  const trouve = String(style || "").match(motif);
  if (!trouve) return null;
  return hexEnCouleur(trouve[1]);
}

function sansBalises(html: string): string {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Lit un <table> HTML et en tire des rangs de cellules, avec leur style.
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
        texte: latin1(c.replace(/\*\*/g, "").trim()),
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

// Le contenu porte-t-il un schema ou un tableau a redessiner ?
function contientSchema(bloc: string): boolean {
  return /<(table|tr|td|div)\b/i.test(bloc);
}

function estTableauMarkdown(bloc: string): boolean {
  const lignes = String(bloc).split("\n").filter(function (l: string) {
    const t = l.trim();
    return t.startsWith("|") && t.endsWith("|");
  });
  return lignes.length >= 2;
}

async function composerManuel(fiche: any, plan: any[], contenus: any, examen: string, langue: string): Promise<Uint8Array> {
  const titre = latin1(fiche.titre || fiche.code);

  const livre = await PDFDocument.create();
  const normal = await livre.embedFont("Times-Roman");
  const gras = await livre.embedFont("Times-Bold");
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

  function ecrire(lignes: string[], police: any, taille: number, interligne: number, couleur: any, avant: number, retrait: number) {
    y = y - avant;
    for (const l of lignes) {
      if (y < BAS + interligne) nouvellePage();
      page.drawText(l, { x: MARGE + retrait, y: y, size: taille, font: police, color: couleur });
      y = y - interligne;
    }
  }

  // 🖥️ DESSINE UN TABLEAU, qu'il vienne d'un <table> HTML ou du markdown.
  //
  // Les colonnes se partagent la largeur utile a parts egales — un calcul
  // proportionnel au contenu donnerait un meilleur rendu mais compliquerait
  // beaucoup le code pour un gain modeste sur des schemas d'interface, ou
  // les colonnes sont deja regulieres.
  function dessinerTableau(rangs: any[]) {
    if (!rangs || rangs.length === 0) return;

    const colonnes = Math.max.apply(null, rangs.map(function (r: any) { return r.length; }));
    if (colonnes < 1) return;

    const largeurCol = UTILE / colonnes;
    const taille = colonnes > 6 ? 7 : colonnes > 4 ? 8 : 9;
    const interligne = taille + 3;
    const marge = 4;

    y = y - 12;

    for (const rang of rangs) {
      // Hauteur du rang : la cellule qui prend le plus de lignes.
      let lignesMax = 1;
      const decoupes: string[][] = [];

      for (let i = 0; i < colonnes; i++) {
        const cel = rang[i];
        const police = cel && cel.gras ? fixeGras : fixe;
        const morceaux = cel && cel.texte
          ? couper(cel.texte, police, taille, largeurCol - marge * 2)
          : [""];
        decoupes.push(morceaux);
        if (morceaux.length > lignesMax) lignesMax = morceaux.length;
      }

      const hauteurRang = lignesMax * interligne + marge * 2;

      if (y - hauteurRang < BAS) nouvellePage();

      const hautRang = y;

      for (let i = 0; i < colonnes; i++) {
        const cel = rang[i];
        const x = MARGE + i * largeurCol;

        if (cel && cel.fond) {
          page.drawRectangle({
            x: x,
            y: hautRang - hauteurRang,
            width: largeurCol,
            height: hauteurRang,
            color: cel.fond,
          });
        }

        page.drawRectangle({
          x: x,
          y: hautRang - hauteurRang,
          width: largeurCol,
          height: hauteurRang,
          borderColor: TRAIT,
          borderWidth: 0.5,
        });

        let yc = hautRang - marge - taille;
        for (const ligne of decoupes[i]) {
          if (!ligne) { yc = yc - interligne; continue; }
          page.drawText(ligne, {
            x: x + marge,
            y: yc,
            size: taille,
            font: cel && cel.gras ? fixeGras : fixe,
            color: (cel && cel.encre) || ENCRE,
          });
          yc = yc - interligne;
        }
      }

      y = hautRang - hauteurRang;
    }

    y = y - 14;
  }

  // 🖥️ UN <div> SANS TABLEAU : c'est un bandeau — barre de titre d'une
  // fenetre, onglet de ruban, message. On le redessine comme tel.
  function dessinerBandeau(html: string) {
    const style = (html.match(/style\s*=\s*"([^"]*)"/i) || ["", ""])[1];
    const fond = couleurDuStyle(style, "background") || rgb(0.95, 0.95, 0.95);
    const encre = couleurDuStyle(style, "color") || ENCRE;
    const texte = latin1(sansBalises(html));

    if (!texte) return;

    const lignes = couper(texte, fixe, 9, UTILE - 16);
    const hauteur = lignes.length * 13 + 12;

    if (y - hauteur < BAS) nouvellePage();

    y = y - 10;
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, color: fond });
    page.drawRectangle({ x: MARGE, y: y - hauteur, width: UTILE, height: hauteur, borderColor: TRAIT, borderWidth: 0.5 });

    let yc = y - 14;
    for (const l of lignes) {
      page.drawText(l, { x: MARGE + 8, y: yc, size: 9, font: fixe, color: encre });
      yc = yc - 13;
    }

    y = y - hauteur - 12;
  }

  // 🖥️ Traite un bloc qui contient du HTML : on en tire les tableaux et les
  // bandeaux, dans l'ordre ou ils apparaissent.
  function dessinerSchema(bloc: string) {
    const tableaux = bloc.match(/<table[\s\S]*?<\/table>/gi) || [];

    if (tableaux.length > 0) {
      // Ce qui precede le premier tableau : souvent la barre de titre.
      const avant = bloc.slice(0, bloc.indexOf(tableaux[0]));
      const divsAvant = avant.match(/<div[^>]*>[\s\S]*?<\/div>/gi) || [];
      for (const d of divsAvant) {
        if (!/<table/i.test(d)) dessinerBandeau(d);
      }

      for (const t of tableaux) {
        dessinerTableau(lireTableauHTML(t));
      }
      return;
    }

    // Aucun tableau : on traite les div comme des bandeaux.
    const divs = bloc.match(/<div[^>]*>[\s\S]*?<\/div>/gi) || [];
    if (divs.length > 0) {
      for (const d of divs) dessinerBandeau(d);
      return;
    }

    // Balises orphelines : on affiche au moins le texte, jamais le code.
    const texte = latin1(sansBalises(bloc));
    if (texte) ecrire(couper(texte, normal, 11, UTILE), normal, 11, 16.5, ENCRE, 7, 0);
  }

  function corps(texte: string) {
    for (const bloc of String(texte).split(/\n{2,}/)) {
      const brut = bloc.trim();
      if (!brut) continue;

      // 🖥️ UN SCHEMA D'INTERFACE : on le redessine.
      if (contientSchema(brut)) {
        dessinerSchema(brut);
        continue;
      }

      // 🖥️ UN TABLEAU EN MARKDOWN : on le redessine aussi.
      if (estTableauMarkdown(brut)) {
        dessinerTableau(lireTableauMarkdown(brut));
        continue;
      }

      const x = latin1(brut).replace(/[ \t]+/g, " ").trim();
      if (!x) continue;
      if (x.indexOf("## ") === 0 || x.indexOf("# ") === 0) {
        const t = x.replace(/^#+\s*/, "");
        ecrire(couper(t, gras, 11.5, UTILE), gras, 11.5, 16, OR, 12, 0);
      } else if (x.indexOf("- ") === 0 || x.indexOf("* ") === 0) {
        ecrire(couper("- " + x.slice(2), normal, 11, UTILE - 16), normal, 11, 16, ENCRE, 2, 16);
      } else {
        ecrire(couper(x, normal, 11, UTILE), normal, 11, 16.5, ENCRE, 7, 0);
      }
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
        page.drawText(ligne, { x: MARGE, y: yt, size: 19, font: gras, color: OR });
        yt = yt - 25;
      }
      sommaire.push({ niveau: 1, numero: String(l.chapitre_num), titre: latin1(l.chapitre_titre), page: pages.length });
      y = HAUTEUR - 180;
    }

    if (y < BAS + 80) nouvellePage();
    const num = String(l.chapitre_num) + "." + String(l.module_num);
    y = y - 18;
    page.drawText(num, { x: MARGE, y: y, size: 13, font: gras, color: OR });
    let ys = y;
    for (const ligne of couper(latin1(l.module_titre), gras, 13, UTILE - 40)) {
      page.drawText(ligne, { x: MARGE + 36, y: ys, size: 13, font: gras, color: ENCRE });
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
    page.drawText("Examen final", { x: MARGE, y: HAUTEUR - 118, size: 19, font: gras, color: OR });
    sommaire.push({ niveau: 1, numero: "", titre: "Examen final", page: pages.length });
    y = HAUTEUR - 180;
    corps(examen);
  }

  const doc = await PDFDocument.create();
  const n2 = await doc.embedFont("Times-Roman");
  const g2 = await doc.embedFont("Times-Bold");

  const cv = doc.addPage([LARGEUR, HAUTEUR]);
  cv.drawText("AcadeMIA Pro", { x: MARGE, y: HAUTEUR - 232, size: 12, font: n2, color: GRIS });
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

  const infos: string[] = ["Formation " + latin1(fiche.code), "AcadeMIA Pro"];
  if (fiche.duree) infos.push(latin1(String(fiche.duree)));
  if (fiche.domaine) infos.push(latin1(String(fiche.domaine)));

  let yi = yt2 - 76;
  cv.drawText(infos.join(" - "), { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE });
  yi = yi - 18;
  const nbCh = sommaire.filter(function (s: any) { return s.niveau === 1; }).length;
  const nbMo = sommaire.filter(function (s: any) { return s.niveau === 2; }).length;
  cv.drawText(String(nbCh) + " chapitres - " + String(nbMo) + " modules", { x: MARGE, y: yi, size: 11, font: n2, color: ENCRE });
  yi = yi - 18;
  cv.drawText("DOCUMENT RESERVE AUX STAGIAIRES INSCRITS", { x: MARGE, y: yi, size: 10, font: n2, color: GRIS });

  const date = latin1(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }));
  cv.drawText("Edition du " + date, { x: MARGE, y: 90, size: 10, font: n2, color: GRIS });

  const parPage = 32;
  const nbSommaire = Math.max(1, Math.ceil(sommaire.length / parPage));
  const pagesSommaire: any[] = [];
  for (let i = 0; i < nbSommaire; i++) pagesSommaire.push(doc.addPage([LARGEUR, HAUTEUR]));
  const decalage = 1 + nbSommaire;

  for (let i = 0; i < nbSommaire; i++) {
    const p = pagesSommaire[i];
    let ys = HAUTEUR - 130;
    if (i === 0) {
      centrer(p, "Table des Matieres", HAUTEUR - 110, g2, 26, OR);
      p.drawRectangle({ x: MARGE, y: HAUTEUR - 126, width: UTILE, height: 1.5, color: OR });
      ys = HAUTEUR - 180;
    }
    for (const s of sommaire.slice(i * parPage, i * parPage + parPage)) {
      const numero = String(s.page + decalage);
      if (s.niveau === 1) {
        const etiquette = s.numero ? s.numero + ". " + s.titre : s.titre;
        const t = couper(etiquette, g2, 13, UTILE - 50)[0] || s.titre;
        p.drawText(t, { x: MARGE, y: ys, size: 13, font: g2, color: OR });
        p.drawText("p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 12, font: g2, color: OR });
        ys = ys - 21;
      } else {
        const t = couper(s.numero + " " + s.titre, n2, 11, UTILE - 80)[0] || s.titre;
        p.drawText(t, { x: MARGE + 26, y: ys, size: 11, font: n2, color: ENCRE });
        p.drawText("p." + numero, { x: LARGEUR - MARGE - 34, y: ys, size: 10, font: n2, color: GRIS });
        ys = ys - 18;
      }
    }
  }

  const copiees = await doc.copyPages(livre, livre.getPageIndices());
  for (const p of copiees) doc.addPage(p);

  const toutes = doc.getPages();
  for (let i = decalage; i < toutes.length; i++) {
    toutes[i].drawText(titre.slice(0, 68), { x: MARGE, y: HAUTEUR - 44, size: 8, font: n2, color: GRIS });
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
        from: "AcademIA Pro <bienvenue@academiapro.fr>",
        to: email,
        subject: "Votre manuel " + fiche.titre + " est pret",
        html:
          '<div style="font-family:Georgia,serif;line-height:1.7">' +
          '<h1 style="color:#c8a96e">Votre manuel est pret</h1>' +
          "<p>Le manuel complet de votre formation vous attend au format PDF : cours, exercices corriges, " +
          "questionnaires de validation et examen final.</p>" +
          '<p><a href="' + adresse + '">Telecharger mon manuel</a></p>' +
          '<p><a href="https://academiapro.fr/dashboard">Acceder a mon espace de formation</a></p>' +
          "<p>L equipe AcademIA Pro</p></div>",
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

    // 🖥️ REFAIRE UN MANUEL A LA DEMANDE, sans passer par une commande.
    //
    // Sert a EPROUVER le rendu des schemas avant la premiere vente. On
    // recompose le PDF depuis ce qui est deja en cache, sans rien produire
    // ni envoyer d'email.
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

      const faites = missions
        .map(function (m: any) { return m.titre; })
        .filter(function (t: string) { return actuel.indexOf("## " + t) >= 0; });

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
          "Cet examen porte sur l ensemble des " + plan.length + " modules de la formation, a raison de " +
          QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, soit " + total + " questions.\n\n" +
          "\u2014LOT\u2014\n" + morceau;
      } else {
        contenuExamen = examenActuel + "\n\n\u2014LOT\u2014\n" + morceau;
      }

      if (debut + MODULES_PAR_LOT_EXAMEN >= plan.length) {
        contenuExamen +=
          "\n\n## Obtenir votre Certification AcademIA Pro\n\n" +
          "Comptez vos points : chaque bonne reponse vaut un point, sur " + total + " au total.\n\n" +
          "A partir de " + SEUIL_REUSSITE + " % de bonnes reponses, soit " +
          Math.ceil((total * SEUIL_REUSSITE) / 100) + " points, la Certification AcademIA Pro de la formation " +
          fiche.titre + " vous est delivree. Vous la recevez par email et la telechargez depuis votre espace personnel sur academiapro.fr.\n\n" +
          "En dessous de ce seuil, reprenez les modules ou vos reponses etaient fausses, puis repassez l examen. " +
          "Le nombre de tentatives n est pas limite : l objectif est votre maitrise, pas votre classement.\n";
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
