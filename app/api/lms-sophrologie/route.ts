import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const LANGUES = {
  fr: "francais", en: "English", ar: "العربية", es: "espanol", pt: "portugues", de: "Deutsch",
};

// Structure de secours, utilisee UNIQUEMENT si aucun plan n existe pour cette
// formation. Elle vient de la sophrologie : c est l origine de cette route.
const CHAPITRES_SECOURS = [
  { numero: 1, titre: "Fondements Theoriques et Scientifiques", modules: [
    { numero: 1, titre: "Histoire et origines de la sophrologie caycedienne", type: "theorie" },
    { numero: 2, titre: "Neurobiologie et mecanismes physiologiques", type: "theorie" },
    { numero: 3, titre: "Protocoles d induction et sophronisation de base", type: "pratique" },
    { numero: 4, titre: "Evaluation et QCM Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Les 12 Degres Caycediens RD1 a RD4", modules: [
    { numero: 1, titre: "RD1 Decontraction Musculaire Progressive", type: "theorie" },
    { numero: 2, titre: "RD2 Sophro-Activation Positive", type: "theorie" },
    { numero: 3, titre: "RD3 Sophro-Contemplation du Corps", type: "theorie" },
    { numero: 4, titre: "Pratique guidee RD1-RD4 et QCM", type: "pratique" },
  ]},
  { numero: 3, titre: "Les Degres Superieurs RD5 a RD12", modules: [
    { numero: 1, titre: "RD5 a RD8 Approfondissement et presence totale", type: "theorie" },
    { numero: 2, titre: "RD9 a RD12 Contemplation de la conscience", type: "theorie" },
    { numero: 3, titre: "Applications cliniques et protocoles specialises", type: "pratique" },
    { numero: 4, titre: "Cas cliniques et QCM", type: "evaluation" },
  ]},
  { numero: 4, titre: "Applications Professionnelles", modules: [
    { numero: 1, titre: "Sophrologie perinatale et accompagnement naissance", type: "pratique" },
    { numero: 2, titre: "Sophrologie du sport de haut niveau", type: "pratique" },
    { numero: 3, titre: "Sophrologie oncologique et gestion douleur chronique", type: "pratique" },
    { numero: 4, titre: "Creation de protocoles personnalises et QCM", type: "evaluation" },
  ]},
  { numero: 5, titre: "Pratique Professionnelle et Certification", modules: [
    { numero: 1, titre: "Construction et gestion d un cabinet de sophrologie", type: "pratique" },
    { numero: 2, titre: "Ethique deontologie et cadre legal du sophrologue", type: "theorie" },
    { numero: 3, titre: "Supervision memoire professionnel et soutenance", type: "pratique" },
    { numero: 4, titre: "Examen blanc final 20 questions", type: "evaluation" },
  ]},
];

// LE PLAN QUI FAIT FOI EST lms_plans.
//
// Cette route lisait formations_lms pendant que le sommaire affichait
// lms_plans : le stagiaire cliquait sur un module et en lisait un autre. Le
// JSON reste en repli pour les formations sans plan construit.
async function chapitresDe(formation_code) {
  try {
    const { data: plans } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", formation_code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (plans && plans.length > 0) {
      const parNumero = new Map();
      for (const ligne of plans) {
        const num = Number(ligne.chapitre_num) || 1;
        if (!parNumero.has(num)) {
          parNumero.set(num, {
            numero: num,
            titre: ligne.chapitre_titre || ("Chapitre " + num),
            modules: [],
          });
        }
        parNumero.get(num).modules.push({
          numero: Number(ligne.module_num) || parNumero.get(num).modules.length + 1,
          titre: ligne.module_titre || "Module",
          type: ligne.type || "theorie",
        });
      }
      return Array.from(parNumero.values()).sort((a, b) => a.numero - b.numero);
    }
  } catch (e) {}

  try {
    const { data } = await supabase
      .from("formations_lms")
      .select("contenu")
      .eq("formation_code", formation_code)
      .limit(1);

    const plan = data && data[0] && data[0].contenu ? data[0].contenu.chapitres : null;
    if (plan && plan.length > 0) return plan;
  } catch (e) {}

  return CHAPITRES_SECOURS;
}

// VERROU D ACCES. Un stagiaire rattache a un organisme ne peut ouvrir que les
// formations que cet organisme a souscrites.
async function accesAutorise(formation_code) {
  const session = sessionCourante();
  if (!session) return { ok: false, code: 401, erreur: "Connectez-vous pour acceder a ce module." };

  if (!session.tenantId) return { ok: true };

  const { data } = await supabase
    .from("organisme_catalogue")
    .select("actif")
    .eq("tenant_id", session.tenantId)
    .eq("formation_code", formation_code)
    .maybeSingle();

  if (!data || data.actif !== true) {
    return {
      ok: false,
      code: 403,
      erreur: "Cette formation ne fait pas partie du catalogue souscrit par votre organisme.",
    };
  }

  return { ok: true };
}

async function appel_claude(prompt, langue_nom, auteur) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: "Tu es " + auteur + ", auteur de manuels universitaires de niveau doctoral dans ta discipline. Tu rediges des contenus denses professionnels et academiques. Chaque paragraphe fait minimum 8 lignes. Tu n abreges jamais. Tu rediges entierement en " + langue_nom + ".",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  mesurer("lms-sophrologie", data);
  return data.content[0].text || "";
}

async function generer(formation, chapitre, module, langue) {
  const langue_nom = LANGUES[langue] || "francais";
  const auteur = formation.formateur || "Claire Beaumont";
  const contexte = "Formation: " + formation.titre + ". Domaine: " + (formation.domaine || "") + ". Chapitre " + chapitre.numero + ": " + chapitre.titre + ". Module " + module.numero + ": " + module.titre + ".";

  const prompts = {
    theorie: [
      contexte + " PARTIE 1 SUR 3 - INTRODUCTION ET FONDEMENTS. Redige: (1) Introduction generale 3 paragraphes denses sur le contexte historique et scientifique. (2) Genese de la discipline et auteurs fondateurs 4 paragraphes. (3) Contexte philosophique et scientifique 3 paragraphes. (4) Travaux et decouvertes fondamentales 3 paragraphes. Traite STRICTEMENT le sujet du module indique. Langue: " + langue_nom,
      contexte + " PARTIE 2 SUR 3 - BASES THEORIQUES ET SCIENTIFIQUES. Redige: (1) Mecanismes et principes detailles 4 paragraphes avec references scientifiques. (2) Etudes et recherches publiees 3 paragraphes. (3) Concepts fondamentaux et definitions 4 paragraphes. (4) Comparaison avec les autres approches du domaine 3 paragraphes. (5) Applications en pratique professionnelle 3 paragraphes. Traite STRICTEMENT le sujet du module. Langue: " + langue_nom,
      contexte + " PARTIE 3 SUR 3 - APPROFONDISSEMENT ET RESSOURCES. Redige: (1) Concepts avances pour praticiens experimentes 4 paragraphes. (2) Cas illustratifs detailles 3 paragraphes. (3) Points cles essentiels liste de 10 items developpes. (4) Glossaire de 15 termes cles avec definitions completes. (5) Bibliographie selective de 8 references commentees. Traite STRICTEMENT le sujet du module. Langue: " + langue_nom,
    ],
    pratique: [
      contexte + " PARTIE 1 SUR 3 - PREPARATION ET EXERCICES 1 ET 2. Redige: (1) Introduction aux objectifs pratiques 2 paragraphes. (2) Preparation du cadre et de l environnement 3 paragraphes. (3) EXERCICE 1 COMPLET: objectif preparation protocole detaille etape par etape variantes contre-indications. (4) EXERCICE 2 COMPLET: meme structure complete. Traite STRICTEMENT le sujet du module. Langue: " + langue_nom,
      contexte + " PARTIE 2 SUR 3 - EXERCICES 3 4 ET 5. Redige: (1) EXERCICE 3 COMPLET avec protocole detaille. (2) EXERCICE 4 COMPLET avec protocole detaille. (3) EXERCICE 5 COMPLET avec protocole detaille. (4) Deroule complet d une seance guidee mot a mot pour 30 minutes. Traite STRICTEMENT le sujet du module. Langue: " + langue_nom,
      contexte + " PARTIE 3 SUR 3 - ADAPTATION ET SUIVI. Redige: (1) Adaptation pour differents publics 4 paragraphes par public. (2) Erreurs courantes et corrections detaillees. (3) Fiche de suivi apprenant avec grille d evaluation 20 criteres. (4) Progression et niveaux d avancement. (5) Ressources complementaires 8 references. Traite STRICTEMENT le sujet du module. Langue: " + langue_nom,
    ],
    evaluation: [
      contexte + " PARTIE 1 SUR 3 - QCM OBLIGATOIRE FORMAT STRICT. Redige exactement 10 questions QCM portant sur le sujet du module. CHAQUE QUESTION DOIT ETRE AU FORMAT EXACT SUIVANT SANS EXCEPTION:\nQ1. [Enonce de la question detaille]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nReponse : A - [Explication detaillee de 3 lignes minimum]\n\nN evalue JAMAIS sur des dates ni sur des noms propres : uniquement methode, protocole, application et securite. Respect absolu du format. Commence directement par Q1. Langue: " + langue_nom,
      contexte + " PARTIE 2 SUR 3 - QCM AVANCE FORMAT STRICT. Redige exactement 10 questions QCM avancees niveau expert. CHAQUE QUESTION AU FORMAT EXACT:\nQ11. [Enonce]\nA) [Option]\nB) [Option]\nC) [Option]\nD) [Option]\nReponse : B - [Explication detaillee]\n\nN evalue JAMAIS sur des dates ni sur des noms propres. Commence par Q11. Langue: " + langue_nom,
      contexte + " PARTIE 3 SUR 3 - CAS PRATIQUES ET EXAMEN BLANC. Redige: (1) EXAMEN BLANC - 5 questions de synthese au format QCM:\nEB1. [Question]\nA) B) C) D)\nReponse : [lettre] - [explication]\n(2) 3 cas pratiques detailles avec questions et corrections. (3) Grille d auto-evaluation 20 criteres. (4) Conseils de progression. Langue: " + langue_nom,
    ],
  };

  const type_prompts = prompts[module.type] || prompts.theorie;

  // LE QCM EST UN APPEL A PART, PAS UNE CONSIGNE DE PLUS.
  //
  // Seuls les modules « evaluation » recevaient un questionnaire : sur vingt
  // modules, seize se terminaient par « Ce module n a pas encore de
  // questionnaire ». Le stagiaire lisait des heures de cours sans jamais
  // verifier ce qu il en retenait — et sa progression n avancait pas, puisqu
  // elle ne s enregistre qu a la validation d une copie.
  //
  // Ajoutee en fin d une invite qui en portait deja cinq, la demande etait
  // ignoree : le module se regenerait sans une seule question. Un appel dedie
  // ne peut pas etre noye. Les modules d evaluation n en ont pas besoin :
  // leurs trois parties sont deja des questionnaires.
  const invites = module.type === "evaluation"
    ? type_prompts
    : type_prompts.concat([
        contexte +
        " TU REDIGES UNIQUEMENT UN QCM, RIEN D AUTRE. Ni introduction, ni cours," +
        " ni conclusion : dix questions et leurs corriges, un point c est tout.\n\n" +
        "Commence ta reponse EXACTEMENT par cette ligne :\n" +
        "## QCM\n\n" +
        "Puis les dix questions, au format EXACT suivant, sans aucune variation :\n" +
        "Q1. [Enonce de la question]\n" +
        "A) [Option A]\n" +
        "B) [Option B]\n" +
        "C) [Option C]\n" +
        "D) [Option D]\n" +
        "Reponse : A - [Explication de 3 lignes minimum]\n\n" +
        "Puis Q2, Q3, et ainsi de suite jusqu a Q10, au meme format.\n\n" +
        "Les questions portent STRICTEMENT sur le sujet de ce module." +
        " N evalue JAMAIS sur des dates ni sur des noms propres : uniquement" +
        " methode, protocole, application et securite. Langue: " + langue_nom,
      ]);

  const parties = await Promise.all(invites.map(p => appel_claude(p, langue_nom, auteur)));
  return parties.join("\n\n---\n\n");
}

export async function POST(req) {
  try {
    const { formation_code, chapitre_num, module_num, langue = "fr" } = await req.json();

    const acces = await accesAutorise(formation_code);
    if (!acces.ok) {
      return NextResponse.json({ erreur: acces.erreur }, { status: acces.code });
    }

    const { data: formations } = await supabase.from("formations").select("*").eq("code", formation_code).limit(1);
    if (!formations || formations.length === 0) return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });

    const formation = formations[0];
    const chapitres = await chapitresDe(formation_code);

    const chapitre = chapitres[chapitre_num - 1];
    if (!chapitre) return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });

    const module = (chapitre.modules || [])[module_num - 1];
    if (!module) return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });

    const cache_key = formation_code + "_ch" + chapitre_num + "_mod" + module_num + "_" + langue;
    const { data: cache } = await supabase.from("lms_cache").select("contenu").eq("cache_key", cache_key).limit(1);

    if (cache && cache.length > 0 && cache[0].contenu && cache[0].contenu.length > 100) {
      return NextResponse.json({ succes: true, depuis_cache: true, chapitre, module, contenu: cache[0].contenu });
    }

    const contenu = await generer(formation, chapitre, module, langue);

    await supabase.from("lms_cache").insert({
      cache_key, formation_code, chapitre_num, module_num, langue, contenu,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ succes: true, depuis_cache: false, chapitre, module, contenu });

  } catch (err) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ chapitres: CHAPITRES_SECOURS, status: "ok" });
}
