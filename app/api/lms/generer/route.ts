import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const CHAPITRES = [
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

async function generer(formation, chapitre, module, langue) {
  const langue_nom = LANGUES[langue] || "francais";

  const type_instructions = {
    theorie: `STRUCTURE OBLIGATOIRE DU CONTENU THEORIQUE:
1. INTRODUCTION GENERALE (3 paragraphes denses - contexte historique et scientifique)
2. FONDEMENTS THEORIQUES (5 paragraphes - bases conceptuelles approfondies avec citations d auteurs)
3. MECANISMES ET PROCESSUS (4 paragraphes - comment ca fonctionne scientifiquement)
4. RECHERCHES ET ETUDES SCIENTIFIQUES (3 paragraphes - etudes cliniques et resultats)
5. APPLICATIONS THEORIQUES (3 paragraphes - comment appliquer cette theorie)
6. ENCADRE POINTS CLES (liste de 10 points essentiels a retenir)
7. CONCEPTS AVANCES (4 paragraphes - approfondissement pour praticiens)
8. LIENS AVEC LES AUTRES MODULES (2 paragraphes)
9. GLOSSAIRE DU MODULE (15 termes cles avec definitions)
10. BIBLIOGRAPHIE SELECTIVE (8 references)
TOTAL MINIMUM: 30 paragraphes denses + glossaire + bibliographie`,

    pratique: `STRUCTURE OBLIGATOIRE DU CONTENU PRATIQUE:
1. INTRODUCTION ET OBJECTIFS PRATIQUES (2 paragraphes)
2. PREPARATION ET CADRE DE PRATIQUE (3 paragraphes - environnement, materiel, posture)
3. EXERCICE 1 COMPLET (objectif + preparation + protocole detaille etape par etape + variantes + contre-indications)
4. EXERCICE 2 COMPLET (meme structure)
5. EXERCICE 3 COMPLET (meme structure)
6. EXERCICE 4 COMPLET (meme structure)
7. EXERCICE 5 COMPLET (meme structure)
8. SCRIPT COMPLET DE SEANCE (guide verbal mot a mot pour une seance de 45 minutes)
9. FICHE DE SUIVI APPRENANT (grille d evaluation et d auto-evaluation)
10. ADAPTATION POUR DIFFERENTS PUBLICS (enfants, seniors, sportifs, personnes en difficulte)
11. ERREURS COURANTES ET CORRECTIONS
12. PROGRESSION ET NIVEAUX D AVANCEMENT
TOTAL MINIMUM: 25 paragraphes denses + scripts + fiches`,

    evaluation: `STRUCTURE OBLIGATOIRE DU CONTENU EVALUATION:
1. INTRODUCTION ET OBJECTIFS DE L EVALUATION (1 paragraphe)
2. QCM PARTIE 1 - 10 QUESTIONS (chaque question avec 4 options A B C D + reponse correcte + explication detaillee de 3-4 lignes)
3. QCM PARTIE 2 - 10 QUESTIONS AVANCEES (meme structure)
4. QUESTIONS DE CAS PRATIQUE - 5 SCENARIOS (description complete du cas + questions + reponses attendues detaillees)
5. QUESTIONS DE REFLEXION PROFESSIONNELLE - 3 QUESTIONS (avec reponses type)
6. GRILLE D AUTO-EVALUATION (20 criteres avec indicateurs de maitrise)
7. CORRIGE COMPLET ET JUSTIFICATIONS SCIENTIFIQUES
8. RESSOURCES COMPLEMENTAIRES (10 references livres articles sites)
9. CONSEILS POUR PROGRESSER
TOTAL MINIMUM: 30 questions evaluatives + explications completes`,
  };

  const prompt = "Tu es Claire Beaumont, formatrice experte en sophrologie caycedienne certifiee au niveau doctoral pour AcadeMIA Pro. Tu rediges un MANUEL DE FORMATION PROFESSIONNEL COMPLET equivalent a 15 pages d un livre universitaire. FORMATION: " + formation.titre + ". CHAPITRE " + chapitre.numero + ": " + chapitre.titre + ". MODULE " + module.numero + ": " + module.titre + ". LANGUE: " + langue_nom + ". " + (type_instructions[module.type] || type_instructions.theorie) + ". REGLES ABSOLUES: Chaque paragraphe doit faire minimum 8 lignes. Utilise un vocabulaire professionnel et academique. Cite des auteurs reels (Caycedo, Benson, Kabat-Zinn etc). Inclus des exemples concrets tires de la pratique clinique. N abrege JAMAIS. Redige ENTIEREMENT en " + langue_nom + ". Le contenu doit etre immediatement utilisable par un sophrologue professionnel.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: "Tu es un auteur de manuels universitaires de formation professionnelle. Chaque module que tu rediges est equivalent a un chapitre complet d un livre de 300 pages. Tu ne fais jamais de contenu court ou superficiel. Tu developpes chaque point en profondeur avec des exemples concrets des citations scientifiques et des applications pratiques detaillees. Tu rediges toujours entierement dans la langue demandee sans jamais melanger les langues.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return "Erreur generation contenu";
  const data = await res.json();
  return data.content[0].text || "";
}

export async function POST(req) {
  try {
    const { formation_code, chapitre_num, module_num, langue = "fr" } = await req.json();

    const { data: formations } = await supabase.from("formations").select("*").eq("code", formation_code).limit(1);
    if (!formations || formations.length === 0) return NextResponse.json({ erreur: "Formation introuvable" }, { status: 404 });

    const formation = formations[0];
    const chapitre = CHAPITRES[chapitre_num - 1];
    if (!chapitre) return NextResponse.json({ erreur: "Chapitre introuvable" }, { status: 404 });

    const module = chapitre.modules[module_num - 1];
    if (!module) return NextResponse.json({ erreur: "Module introuvable" }, { status: 404 });

    const cache_key = formation_code + "_ch" + chapitre_num + "_mod" + module_num + "_" + langue;
    const { data: cache } = await supabase.from("lms_cache").select("contenu").eq("cache_key", cache_key).limit(1);

    if (cache && cache.length > 0) {
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
  return NextResponse.json({ chapitres: CHAPITRES, status: "ok" });
}
