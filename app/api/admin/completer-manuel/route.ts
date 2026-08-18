import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

const CARACTERES_PAR_PAGE = 3200;
const CARACTERES_PAR_PASSE = 14000;
const PAGES_MIN = 30;
const PAGES_MAX = 300;
const QUESTIONS_PAR_QCM = 10;
const QUESTIONS_PAR_MODULE_EXAMEN = 2;
const MODULES_PAR_LOT_EXAMEN = 5;
const SEUIL_REUSSITE = 70;

const REGLE_EVALUATION =
  "REGLE ABSOLUE POUR LES QUESTIONS : n interroge JAMAIS sur des dates, des noms propres, " +
  "des filiations d ecoles ou des anecdotes historiques. Ces elements figurent dans le cours pour la culture " +
  "du stagiaire, pas pour le pieger. Les questions portent exclusivement sur ce qu un praticien doit savoir FAIRE : " +
  "la methode, le protocole, le choix de la technique selon la situation, les applications concretes, " +
  "les precautions et la securite. Gradue la difficulte : commence par la comprehension, termine par l application.";

// 🚨🚨🚨 LES TERMES INTERDITS — ajoutes le 18/08.
//
// Les 331 formations d'origine ont ete nettoyees a la main. Les centaines
// qui suivent ne doivent pas reintroduire le probleme : la regle est posee
// ICI, dans le generateur, plutot que verifiee formation par formation.
//
// ⚠️ DEUX FAMILLES DE RISQUE. Les MARQUES DEPOSEES : « sophrologie » est
// libre, « caycedienne » est une marque. Les TITRES REGLEMENTES :
// psychologue, psychotherapeute, osteopathe sont proteges par la loi, et
// l'usurpation de titre est un delit penal.
//
// 🚨 CE BLOC N'APPAUVRIT PAS LE CONTENU. On enseigne la relaxation
// dynamique sans nommer Caycedo, le retraitement des souvenirs sans ecrire
// EMDR. La substance reste, l'etiquette juridique disparait.
const TERMES_INTERDITS =
  "\n🚨 TERMES INTERDITS — REGLE ABSOLUE.\n" +
  "N'ecris JAMAIS : sophrologie caycedienne, methode Caycedo, EMDR, Process Communication, " +
  "MBSR, Kabat-Zinn, methode Pilates, Feldenkrais, Vittoz, Reiki Usui, MBTI, DISC, " +
  "Ennegramme au sens depose, CNV de Rosenberg presentee comme methode deposee.\n" +
  "👉 Emploie a la place : sophrologie, relaxation dynamique, pleine conscience, meditation, " +
  "communication bienveillante, ecoute active, hypnose, gainage postural, profils comportementaux.\n\n" +
  "Ne dis JAMAIS que la formation permet de devenir ou d'exercer comme : psychologue, " +
  "psychotherapeute, medecin, infirmier, kinesitherapeute, osteopathe, dieteticien, avocat, " +
  "expert-comptable, architecte.\n" +
  "👉 Emploie : praticien en..., technicien en..., accompagnant en..., conseiller en...\n\n" +
  "N'ecris JAMAIS : titre RNCP, certification RS, France Competences, eligible au CPF, " +
  "diplome d'Etat, reconnu par l'Etat, credits ECTS, TOSA, Adobe Certified.\n" +
  "👉 La seule formule autorisee : « attestation de fin de formation » ou " +
  "« Certification AcadeMIA Pro ».\n\n" +
  "Ne cite AUCUN nom d'ecole, d'institut ni d'organisme certificateur, et n'affirme aucun " +
  "partenariat. N'ecris AUCUNE promesse de resultat, AUCUN taux de reussite, AUCUN temoignage, " +
  "AUCUN salaire moyen.\n";

// 🖥️🖥️ LES SCHEMAS D'INTERFACE — ajoutes le 18/08.
//
// POURQUOI CE BLOC EXISTE. Jacques a montre un manuel Excel ou l'interface
// etait RECONSTITUEE EN HTML : le ruban avec ses onglets, la barre de
// formule, la grille de cellules avec ses en-tetes de colonnes, les
// onglets de feuilles. Aucune capture d'ecran, et pourtant on voit
// exactement de quoi on parle.
//
// 🎯 CE QUE CELA DEBLOQUE. Les formations sur logiciel etaient jusqu'ici
// impossibles a produire : une capture exige d'ouvrir le logiciel, de
// photographier chaque etape — cent a cent cinquante images par formation
// — et de tout refaire a chaque version. Un schema HTML se genere avec le
// texte, ne vieillit pas, et se lit aussi bien.
//
// ⚠️ CE BLOC N'EST INJECTE QUE SI formations.interface_logiciel EST VRAI.
// Douze formations sont concernees aujourd'hui : Excel, VBA, Photoshop,
// Illustrator, Figma, After Effects, WordPress, Shopify, Notion,
// Bureautique, Creation musicale, et F900 le manuel de la plateforme.
//
// 🚨 LES 441 AUTRES NE LE VERRONT JAMAIS. Une formation de sophrologie ou
// de droit n'a aucun besoin de schema d'interface, et lui en imposer
// degraderait le contenu. C'est la meme prudence que pour la carte de la
// plateforme dans le generateur de supports.
//
// ⚠️ LE STYLE EST ECRIT EN DUR DANS CHAQUE BALISE, sans feuille de style
// separee : le contenu est stocke en base puis assemble dans un PDF, ou
// aucune feuille externe n'est chargee.
const SCHEMAS_INTERFACE =
  "\n🖥️ CETTE FORMATION PORTE SUR UN LOGICIEL — ILLUSTRE-LA.\n\n" +
  "Un cours sur un logiciel qui ne montre rien est inutilisable. Tu DOIS donc " +
  "inserer des SCHEMAS D'INTERFACE reconstituant ce que le stagiaire voit a l'ecran, " +
  "a chaque fois qu'une manipulation le justifie — au minimum DEUX PAR SECTION.\n\n" +

  "COMMENT LES PRODUIRE : en HTML, directement dans le texte, avec le style ecrit " +
  "dans chaque balise (attribut style=\"...\"). N'utilise JAMAIS de feuille de style " +
  "separee ni de classe CSS : le contenu est ensuite assemble dans un document ou " +
  "aucune feuille externe n'est chargee.\n\n" +

  "CE QUE TU DOIS RECONSTITUER selon le logiciel :\n" +
  "  - la barre de menus ou le ruban, avec ses onglets, celui qui est actif etant mis en valeur ;\n" +
  "  - la zone de travail : grille de cellules, plan de travail, editeur, tableau de bord ;\n" +
  "  - les barres d'outils et les panneaux lateraux, avec le nom des outils ;\n" +
  "  - les boites de dialogue, avec leurs champs, leurs cases et leurs boutons ;\n" +
  "  - les menus deroulants ouverts, quand l'etape consiste a choisir une commande.\n\n" +

  "EXEMPLE DE CE QUI EST ATTENDU, pour un tableur :\n\n" +
  "<div style=\"border:1px solid #ccc;border-radius:6px;overflow:hidden;margin:18px 0;font-family:Arial,sans-serif;font-size:13px\">\n" +
  "  <div style=\"background:#217346;color:#fff;padding:8px 12px;font-weight:bold\">Classeur1.xlsx</div>\n" +
  "  <div style=\"background:#f3f3f3;padding:7px 12px;border-bottom:1px solid #ddd\">\n" +
  "    <span style=\"color:#217346;font-weight:bold;border-bottom:2px solid #217346;padding-bottom:4px\">Accueil</span>\n" +
  "    <span style=\"color:#666;margin-left:16px\">Insertion</span>\n" +
  "    <span style=\"color:#666;margin-left:16px\">Formules</span>\n" +
  "    <span style=\"color:#666;margin-left:16px\">Donnees</span>\n" +
  "  </div>\n" +
  "  <div style=\"background:#fff;padding:7px 12px;border-bottom:1px solid #ddd\">\n" +
  "    <span style=\"border:1px solid #ccc;padding:3px 10px;margin-right:8px\">B2</span>\n" +
  "    <span style=\"color:#888\">fx</span>\n" +
  "    <span style=\"margin-left:10px;font-family:monospace\">=SOMME(B2:B5)</span>\n" +
  "  </div>\n" +
  "  <table style=\"width:100%;border-collapse:collapse\">\n" +
  "    <tr style=\"background:#f8f8f8\">\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px;width:36px\"></td>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px;text-align:center\">A</td>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px;text-align:center;background:#217346;color:#fff\">B</td>\n" +
  "    </tr>\n" +
  "    <tr>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px;background:#f8f8f8;text-align:center\">1</td>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px\"><b>Produit</b></td>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px\"><b>Ventes</b></td>\n" +
  "    </tr>\n" +
  "    <tr>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px;background:#f8f8f8;text-align:center\">2</td>\n" +
  "      <td style=\"border:1px solid #ddd;padding:6px\">Licence A</td>\n" +
  "      <td style=\"border:2px solid #217346;padding:6px;background:#eaf5ee\">1 200 EUR</td>\n" +
  "    </tr>\n" +
  "  </table>\n" +
  "</div>\n\n" +

  "REGLES IMPERATIVES POUR CES SCHEMAS :\n" +
  "  - Chaque schema est PRECEDE d'une phrase qui dit ce qu'il montre, et SUIVI de " +
  "l'explication de la manipulation. Un schema seul n'apprend rien.\n" +
  "  - NOMME LES ELEMENTS EXACTEMENT comme ils apparaissent dans le logiciel, en " +
  "francais si l'interface est en francais.\n" +
  "  - Reprends les COULEURS reelles du logiciel : le vert d'Excel, le bleu de Word, " +
  "le fond sombre de Photoshop. Le stagiaire doit reconnaitre ce qu'il a sous les yeux.\n" +
  "  - Donne les RACCOURCIS CLAVIER quand ils existent, dans un tableau en fin de section.\n" +
  "  - Ne decris JAMAIS une commande sans dire OU elle se trouve : quel onglet, quel menu, " +
  "quel panneau.\n" +
  "  - Les schemas ne remplacent pas le texte : ils s'y ajoutent. La densite du cours " +
  "reste la meme.\n";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LANGUES: any = { fr: "francais", en: "English", es: "espanol", pt: "portugues", de: "Deutsch" };

const COURS = [
  {
    titre: "Fondements et cadre conceptuel",
    consigne: "Expose les fondements theoriques : origines, auteurs de reference, concepts cles, cadre conceptuel. Cite des travaux et des recherches.",
    logiciel: "Presente le logiciel et son interface : a quoi il sert, comment il s organise, ce que le stagiaire voit en l ouvrant pour la premiere fois. Reconstitue l ecran d accueil complet.",
  },
  {
    titre: "Methode et protocole",
    consigne: "Decris la methode operatoire etape par etape : preparation, deroulement, criteres de reussite, variantes selon les publics. Sois concret et sequentiel.",
    logiciel: "Decris les manipulations etape par etape, chaque etape montrant l ecran correspondant : ou cliquer, ce qui s ouvre, ce qui change. Le stagiaire doit pouvoir suivre sans le logiciel sous les yeux.",
  },
  {
    titre: "Etudes de cas",
    consigne: "Presente au moins quatre situations reelles et detaillees : contexte, difficulte rencontree, demarche suivie, resultat, enseignement a en tirer. Des recits, pas des generalites.",
    logiciel: "Presente au moins quatre cas d usage complets : le besoin de depart, le fichier ou le document a produire, les manipulations dans l ordre avec leurs ecrans, et le resultat obtenu.",
  },
  {
    titre: "Erreurs frequentes et remediation",
    consigne: "Recense les erreurs les plus courantes, leurs causes, leurs consequences et la maniere de les corriger. Un tableau erreur / remede est bienvenu.",
    logiciel: "Recense les erreurs et messages d erreur les plus frequents : ce que le stagiaire voit s afficher, pourquoi, et comment s en sortir. Montre les boites de dialogue d erreur.",
  },
  {
    titre: "Applications professionnelles",
    consigne: "Montre comment transposer ce module dans la pratique professionnelle : publics concernes, adaptations, cadre d intervention, indicateurs de suivi.",
    logiciel: "Montre l usage professionnel reel : quels documents produire, comment gagner du temps, quels reglages adopter en entreprise, comment partager et collaborer.",
  },
  {
    titre: "Approfondissement et ressources",
    consigne: "Approfondis les points delicats non couverts jusqu ici, ouvre sur les debats du domaine, et termine par une bibliographie commentee et un glossaire.",
    logiciel: "Approfondis les fonctions avancees non encore couvertes, donne le tableau complet des raccourcis clavier utiles, et termine par un glossaire des termes du logiciel.",
  },
];

const EXERCICES = {
  titre: "Exercices pratiques et corriges",
  consigne: "Propose au moins huit exercices progressifs et concrets, chacun suivi de son corrige commente. Consignes precises, duree indicative, materiel necessaire, critere de reussite. Pas d invitation vague a reflechir.",
  logiciel: "Propose au moins huit exercices a realiser DANS LE LOGICIEL, chacun avec les donnees de depart, la consigne precise, le resultat attendu montre en schema, et le corrige explique manipulation par manipulation.",
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

function systemePour(langue: string, avecInterface: boolean): string {
  const n = LANGUES[langue] || "francais";
  let texte = "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels denses, precis et de haute qualite academique, entierement en " + n + "." +
    " Tu ne delayes jamais : chaque paragraphe apporte une information nouvelle." +
    " Tu n inventes aucun titre officiel et aucun prix.";

  if (avecInterface) {
    texte += " Tu illustres systematiquement tes explications par des schemas d interface " +
      "reconstitues en HTML, avec le style ecrit dans chaque balise.";
  }

  return texte;
}

function invitePour(
  titreFormation: string,
  chapitre: any,
  module: any,
  langue: string,
  mission: any,
  dejaEcrites: string[],
  avecInterface: boolean
): string {
  const n = LANGUES[langue] || "francais";

  // 🖥️ La consigne du logiciel REMPLACE la consigne generale quand la
  // formation porte sur un outil : « decris la methode etape par etape »
  // devient « montre l ecran a chaque etape ».
  const consigne = (avecInterface && mission.logiciel) ? mission.logiciel : mission.consigne;

  let texte =
    "Formation: " + titreFormation + "\n" +
    "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
    "Module " + module.numero + ": " + module.titre + "\n" +
    "Langue: " + n + "\n\n" +
    "SECTION A REDIGER : " + mission.titre + "\n" +
    consigne + "\n\n";

  if (dejaEcrites.length > 0) {
    texte += "SECTIONS DEJA REDIGEES DANS CE MODULE, A NE PAS REPRENDRE :\n- " +
      dejaEcrites.join("\n- ") + "\n" +
      "N y reviens pas, meme brievement. Apporte uniquement du contenu nouveau.\n\n";
  }

  if (module.type === "pratique") {
    texte += "Ce module est de nature PRATIQUE : privilegie les scripts complets, les fiches de suivi et les protocoles.\n";
  }
  if (module.type === "evaluation") {
    texte += "Ce module est de nature EVALUATIVE : privilegie les questions, les corriges commentes et les criteres de notation.\n";
  }

  if (avecInterface) {
    texte += SCHEMAS_INTERFACE;
  }

  texte += TERMES_INTERDITS;

  texte += "\nRedige directement le contenu de la section, sans introduction sur ce que tu vas faire, sans conclusion sur ce que tu viens de faire.";

  return texte;
}

async function appeler(cle: string, langue: string, invite: string, avecInterface: boolean): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELE,
      // 🖥️ Les schemas HTML sont volumineux : un module de logiciel a
      // besoin de plus de place qu'un module de notions.
      max_tokens: avecInterface ? 8000 : 4000,
      system: systemePour(langue, avecInterface),
      messages: [{ role: "user", content: invite }],
    }),
  });

  if (!r.ok) throw new Error("Claude a repondu " + r.status);

  const reponse = await r.json();
  return (reponse.content || [])
    .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
    .join("")
    .trim();
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const langue = (url.searchParams.get("langue") || "fr").trim();
    const refaire = url.searchParams.get("refaire") === "oui";
    const reset = url.searchParams.get("reset") === "oui";
    const cible = url.searchParams.get("cible") || "";
    const examen = url.searchParams.get("examen") === "oui";
    const lot = Number(url.searchParams.get("lot") || 0);

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, duree, interface_logiciel")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    // 🖥️ LE DRAPEAU QUI COMMANDE TOUT. Douze formations sur 453 le portent.
    const avecInterface = fiche.interface_logiciel === true;

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan" }, { status: 404 });
    }

    const trouve = String(fiche.duree || "").match(/(\d{1,4})/);
    const heuresTotal = trouve ? parseInt(trouve[1], 10) : 0;
    const pagesCours = Math.min(PAGES_MAX, Math.max(PAGES_MIN, heuresTotal));
    const cibleCoursParModule = Math.round((pagesCours * CARACTERES_PAR_PAGE) / plan.length);
    const passesCours = Math.max(1, Math.min(COURS.length, Math.ceil(cibleCoursParModule / CARACTERES_PAR_PASSE)));

    const cleExamen = code + "_ch99_mod1_" + langue;

    // ---- EXAMEN FINAL : un lot de cinq modules par appel ----
    if (examen) {
      const debut = lot * MODULES_PAR_LOT_EXAMEN;
      const lots = Math.ceil(plan.length / MODULES_PAR_LOT_EXAMEN);

      if (debut >= plan.length) {
        return NextResponse.json({ ok: true, code: code, examen: true, termine: true, lots: lots });
      }

      const groupe = plan.slice(debut, debut + MODULES_PAR_LOT_EXAMEN);
      const sommaire = groupe
        .map(function (m: any) { return "Module " + m.module_num + " : " + m.module_titre; })
        .join("\n");
      const combien = groupe.length * QUESTIONS_PAR_MODULE_EXAMEN;
      const premier = debut * QUESTIONS_PAR_MODULE_EXAMEN + 1;

      const invite =
        "Formation: " + fiche.titre + "\n" +
        "Langue: " + (LANGUES[langue] || "francais") + "\n\n" +
        "SECTION A REDIGER : partie d un examen final\n" +
        "Redige " + combien + " questions a choix multiple, soit EXACTEMENT " +
        QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, dans l ordre des modules ci-dessous. " +
        "Numerote-les a partir de " + premier + ". " +
        "Quatre propositions par question, une seule correcte. Les deux questions d un meme module doivent porter sur des aspects DIFFERENTS de ce module. " +
        "Apres les questions, donne le corrige avec la bonne reponse et son explication.\n\n" +
        REGLE_EVALUATION + "\n" +
        TERMES_INTERDITS + "\n" +
        "MODULES CONCERNES :\n" + sommaire;

      const texte = await appeler(cle, langue, invite, false);

      const { data: existant } = await supabase
        .from("lms_cache")
        .select("contenu")
        .eq("cache_key", cleExamen)
        .maybeSingle();

      let contenuExamen = "";

      if (lot === 0) {
        const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
        contenuExamen =
          "## Examen final\n\n" +
          "Cet examen porte sur l ensemble des " + plan.length + " modules de la formation, a raison de " +
          QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, soit " + total + " questions.\n\n" +
          texte;
      } else {
        contenuExamen = String((existant && existant.contenu) || "") + "\n\n" + texte;
      }

      if (debut + MODULES_PAR_LOT_EXAMEN >= plan.length) {
        const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
        contenuExamen +=
          "\n\n## Obtenir votre Certification AcademIA Pro\n\n" +
          "Comptez vos points : chaque bonne reponse vaut un point, sur " + total + " au total.\n\n" +
          "A partir de " + SEUIL_REUSSITE + " % de bonnes reponses, soit " +
          Math.ceil((total * SEUIL_REUSSITE) / 100) + " points, la Certification AcademIA Pro de la formation " +
          fiche.titre + " vous est delivree. Vous la recevez par email et la telechargez depuis votre espace personnel sur academiapro.fr.\n\n" +
          "En dessous de ce seuil, reprenez les modules ou vos reponses etaient fausses, puis repassez l examen. " +
          "Le nombre de tentatives n est pas limite : l objectif est votre maitrise, pas votre classement.\n";
      }

      if (existant) {
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
        examen: true,
        lot: lot,
        lots: lots,
        lot_suivant: debut + MODULES_PAR_LOT_EXAMEN < plan.length ? lot + 1 : null,
        modules_traites: groupe.length,
        caracteres: contenuExamen.length,
      });
    }

    // ---- MODULES : une seule section par appel ----
    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key")
      .eq("formation_code", code)
      .eq("langue", langue);

    const dejaLa = new Set((cache || []).map((c: any) => c.cache_key));

    let aFaire = plan.filter(function (l: any) {
      return !dejaLa.has(code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue);
    });

    if (refaire && cible) {
      aFaire = plan.filter(function (l: any) {
        return "ch" + l.chapitre_num + "_mod" + l.module_num === cible;
      });
      if (aFaire.length === 0) {
        return NextResponse.json({ ok: false, erreur: "module " + cible + " introuvable dans le plan" }, { status: 404 });
      }
    }

    if (aFaire.length === 0) {
      return NextResponse.json({
        ok: true,
        code: code,
        termine: true,
        restants: 0,
        total: plan.length,
        heures: heuresTotal,
        pages_cours: pagesCours,
        cible_cours_par_module: cibleCoursParModule,
        passes_cours: passesCours,
        interface_logiciel: avecInterface,
      });
    }

    const l = aFaire[0];
    const chapitre = { numero: l.chapitre_num, titre: l.chapitre_titre };
    const module = { numero: l.module_num, titre: l.module_titre, type: l.type };
    const identifiant = "ch" + l.chapitre_num + "_mod" + l.module_num;
    const cacheKey = code + "_" + identifiant + "_" + langue;

    const { data: ligne } = await supabase
      .from("lms_cache")
      .select("contenu")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    let contenuActuel = reset ? "" : String((ligne && ligne.contenu) || "");

    const missions: any[] = COURS.slice(0, passesCours).concat([EXERCICES, QCM, SYNTHESE]);
    const dejaEcrites = missions
      .map(function (m: any) { return m.titre; })
      .filter(function (t: string) { return contenuActuel.indexOf("## " + t) >= 0; });

    const suivante = missions.filter(function (m: any) {
      return dejaEcrites.indexOf(m.titre) < 0;
    })[0];

    if (!suivante) {
      return NextResponse.json({
        ok: true,
        code: code,
        module: identifiant,
        module_termine: true,
        sections: dejaEcrites,
        caracteres: contenuActuel.length,
        pages_estimees: Math.round(contenuActuel.length / CARACTERES_PAR_PAGE),
        restants: refaire ? 0 : aFaire.length - 1,
        interface_logiciel: avecInterface,
      });
    }

    let texte = "";

    if (suivante.local) {
      texte = gabaritSynthese(module.titre, code, identifiant);
    } else {
      texte = await appeler(
        cle,
        langue,
        invitePour(fiche.titre, chapitre, module, langue, suivante, dejaEcrites, avecInterface),
        avecInterface
      );

      if (texte.length < 400) {
        return NextResponse.json(
          { ok: false, code: code, erreur: "section trop courte : " + suivante.titre },
          { status: 500 }
        );
      }
    }

    const nouveau = (contenuActuel ? contenuActuel + "\n\n" : "") + "## " + suivante.titre + "\n\n" + texte;

    if (ligne) {
      await supabase.from("lms_cache").update({ contenu: nouveau }).eq("cache_key", cacheKey);
    } else {
      await supabase.from("lms_cache").insert({
        cache_key: cacheKey,
        formation_code: code,
        chapitre_num: l.chapitre_num,
        module_num: l.module_num,
        langue: langue,
        contenu: nouveau,
        created_at: new Date().toISOString(),
      });
    }

    // 🖥️ On compte les schemas produits, pour verifier d'un coup d'oeil que
    // la consigne a ete suivie. Un module de logiciel sans schema signale
    // que quelque chose n'a pas fonctionne.
    const schemas = avecInterface
      ? (texte.match(/<div style=/g) || []).length + (texte.match(/<table style=/g) || []).length
      : null;

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      heures: heuresTotal,
      pages_cours: pagesCours,
      modules_du_plan: plan.length,
      passes_cours: passesCours,
      module: identifiant,
      section_produite: suivante.titre,
      sans_ia: suivante.local === true,
      sections_faites: dejaEcrites.length + 1,
      sections_totales: missions.length,
      caracteres: nouveau.length,
      pages_estimees: Math.round(nouveau.length / CARACTERES_PAR_PAGE),
      interface_logiciel: avecInterface,
      schemas_produits: schemas,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
