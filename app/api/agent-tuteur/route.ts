```typescript
// app/api/tutor/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface TutorRequest {
  message: string;
  formation_id: string;
  apprenant_id: string;
  conversation_id?: string;
}

interface Formation {
  id: string;
  titre: string;
  domaine: string;
  niveau: string;
  objectifs: string[];
  competences_cles: string[];
}

interface AbandonSignal {
  detected: boolean;
  score: number;
  reasons: string[];
}

interface TutorResponse {
  response: string;
  conversation_id: string;
  abandon_signal: AbandonSignal;
  tokens_used: number;
  processing_time_ms: number;
  formation_context: string;
}

interface ConversationRecord {
  id: string;
  apprenant_id: string;
  formation_id: string;
  messages: Message[];
  created_at: string;
  updated_at?: string;
  abandon_score?: number;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// ANTHROPIC CLIENT
// ============================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// FORMATIONS CATALOGUE (à remplacer par DB en production)
// ============================================================

const FORMATIONS_CATALOGUE: Record<string, Formation> = {
  "formation-dev-web": {
    id: "formation-dev-web",
    titre: "Développement Web Full Stack",
    domaine: "informatique",
    niveau: "intermédiaire",
    objectifs: [
      "Maîtriser HTML/CSS/JavaScript",
      "Développer des APIs REST",
      "Utiliser React et Node.js",
    ],
    competences_cles: ["Frontend", "Backend", "Base de données", "DevOps"],
  },
  "formation-data-science": {
    id: "formation-data-science",
    titre: "Data Science & Machine Learning",
    domaine: "data",
    niveau: "avancé",
    objectifs: [
      "Analyser des données complexes",
      "Construire des modèles ML",
      "Visualiser des insights",
    ],
    competences_cles: ["Python", "Statistiques", "ML", "Visualisation"],
  },
  "formation-marketing-digital": {
    id: "formation-marketing-digital",
    titre: "Marketing Digital & Growth",
    domaine: "marketing",
    niveau: "débutant",
    objectifs: [
      "Créer des campagnes digitales",
      "Analyser les métriques",
      "Optimiser les conversions",
    ],
    competences_cles: ["SEO/SEA", "Social Media", "Analytics", "Content"],
  },
  "formation-gestion-projet": {
    id: "formation-gestion-projet",
    titre: "Gestion de Projet Agile",
    domaine: "management",
    niveau: "intermédiaire",
    objectifs: [
      "Maîtriser Scrum et Kanban",
      "Gérer une équipe agile",
      "Livrer des projets avec succès",
    ],
    competences_cles: ["Scrum", "Kanban", "Leadership", "Communication"],
  },
};

// ============================================================
// SYSTEM PROMPTS PAR DOMAINE
// ============================================================

function buildSystemPrompt(formation: Formation): string {
  const aiAdviceByDomain: Record<string, string> = {
    informatique: `
## 🤖 Conseils IA Générative pour le Développement
- Utilise GitHub Copilot pour accélérer l'écriture de code répétitif
- Prompts efficaces : sois précis sur le langage, le contexte et les contraintes
- Valide TOUJOURS le code généré par l'IA avant de l'intégrer
- L'IA excelle pour : boilerplate, tests unitaires, documentation, refactoring
- L'IA limite : logique métier complexe, sécurité critique, architecture
- Prompt template : "En [langage], écris [fonction] qui [objectif] avec [contraintes]"`,

    data: `
## 🤖 Conseils IA Générative pour la Data Science
- Utilise Claude/ChatGPT pour générer du code d'analyse exploratoire
- Prompts data : spécifie le format de tes données, la librairie souhaitée
- L'IA peut t'aider à interpréter des résultats statistiques
- Attention aux hallucinations sur les résultats numériques - vérifie toujours
- Utilise l'IA pour documenter tes notebooks et expliquer tes modèles
- Prompt template : "Avec pandas/sklearn, [action] sur [description_dataset]"`,

    marketing: `
## 🤖 Conseils IA Générative pour le Marketing Digital
- L'IA est excellent pour : copywriting, A/B testing d'accroches, briefs créatifs
- Utilise ChatGPT/Claude pour générer des variations de messages publicitaires
- Prompts marketing : définis le persona cible, le ton, l'objectif de conversion
- L'IA peut analyser et optimiser tes landing pages si tu lui fournis le texte
- Attention : personnalise toujours le contenu généré avec ta brand voice
- Prompt template : "Pour [persona], rédige [type_contenu] avec ton [caractère]"`,

    management: `
## 🤖 Conseils IA Générative pour la Gestion de Projet
- Utilise l'IA pour générer des templates : user stories, critères d'acceptance
- L'IA peut t'aider à structurer des rétrospectives et faciliter des ateliers
- Prompts agile : donne le contexte du projet, l'équipe, les contraintes
- Génère des plans de communication et des reporting automatiquement
- L'IA excelle pour : résolution de conflits, facilitation, documentation
- Prompt template : "En contexte [projet], rédige [livrable] pour [audience]"`,
  };

  const domainExpertise: Record<string, string> = {
    informatique: `expert développeur full-stack senior avec 15 ans d'expérience, 
    spécialisé en architecture logicielle, bonnes pratiques de code et pédagogie technique`,
    data: `expert data scientist et ML engineer avec 12 ans d'expérience, 
    spécialisé en statistiques appliquées, modélisation et communication des insights`,
    marketing: `expert en marketing digital et growth hacking avec 10 ans d'expérience, 
    spécialisé en acquisition, rétention et optimisation des conversions`,
    management: `expert en gestion de projet agile et leadership avec 15 ans d'expérience, 
    coach certifié Scrum Master et spécialiste transformation digitale`,
  };

  const expertise =
    domainExpertise[formation.domaine] ||
    "expert pédagogue polyvalent avec expertise multidisciplinaire";
  const aiAdvice =
    aiAdviceByDomain[formation.domaine] || aiAdviceByDomain["informatique"];

  return `# 🎓 AcadémIA Pro - Agent Tuteur Expert

## TON IDENTITÉ
Tu es ARIA (Adaptive Responsive Intelligence for Academics), ${expertise}.
Tu es le tuteur personnel dédié à la formation **"${formation.titre}"** (niveau: ${formation.niveau}).

## TA MISSION PRINCIPALE
Accompagner l'apprenant avec bienveillance et expertise pour qu'il maîtrise ces compétences :
${formation.competences_cles.map((c) => `- ${c}`).join("\n")}

Et atteigne ces objectifs :
${formation.objectifs.map((o) => `- ${o}`).join("\n")}

## TON STYLE PÉDAGOGIQUE
1. **Socrateur** : Guide par des questions plutôt que donner les réponses directement
2. **Progressif** : Adapte la complexité au niveau détecté dans la conversation
3. **Concret** : Toujours illustrer avec des exemples pratiques et du monde réel
4. **Encourageant** : Célèbre les progrès, normalise les erreurs comme apprentissage
5. **Structuré** : Organise tes réponses avec des titres clairs quand c'est pertinent

## FORMAT DE RÉPONSE
- Réponses concises : 150-300 mots maximum sauf pour exercices/explications détaillées
- Utilise des emojis avec parcimonie pour rendre vivant (max 2-3 par message)
- Code : toujours avec blocs formatés et commentaires explicatifs
- Fin de message : propose TOUJOURS une prochaine étape ou question de vérification
- Langue : Français courant et professionnel

## GESTION DES EXERCICES
Quand tu proposes un exercice :
- Énonce clairement l'objectif pédagogique
- Décompose en étapes si complexe
- Fournis des indices progressifs si l'apprenant bloque
- Valide et explique la solution complète après tentative

## GESTION DES ERREURS & BLOCAGES
- Ne jamais juger négativement une erreur
- Identifier la source du blocage (conceptuelle, technique, motivation)
- Proposer une approche alternative si la première n'a pas fonctionné
- Suggérer des ressources complémentaires si nécessaire

${aiAdvice}

## CONTRAINTES IMPORTANTES
- Ne JAMAIS mentionner que tu es Claude ou un produit Anthropic
- Tu es ARIA, l'IA de AcadémIA Pro
- Si on te demande ta technologie : "Je suis ARIA, l'assistant IA propriétaire d'AcadémIA Pro"
- Reste toujours dans le contexte de la formation ${formation.titre}
- Pour les questions hors-sujet : recadre gentiment vers la formation`;
}

// ============================================================
// ABANDON SIGNAL DETECTOR
// ============================================================

function detectAbandonSignals(
  messages: Message[],
  currentMessage: string
): AbandonSignal {
  const abandonKeywords = [
    "je comprends pas",
    "trop difficile",
    "à quoi ça sert",
    "c'est nul",
    "j'arrête",
    "je laisse tomber",
    "c'est inutile",
    "rien compris",
    "trop compliqué",
    "perte de temps",
    "démotivé",
    "découragé",
    "j'y arrive pas",
    "c'est pas pour moi",
    "impossible",
    "je sais pas",
    "helpless",
    "abandonner",
  ];

  const frustrationIndicators = [
    "???",
    "!!!",
    "wtf",
    "nul",
    "merde",
    "pfff",
    "bof",
  ];

  let score = 0;
  const reasons: string[]