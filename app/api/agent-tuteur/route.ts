```typescript
// app/api/tutor/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TutorRequest {
  message: string;
  formation_id: string;
  apprenant_id: string;
  conversation_id?: string;
}

interface ConversationRow {
  id: string;
  apprenant_id: string;
  formation_id: string;
  messages: Message[];
  created_at: string;
  abandon_signals: number;
}

interface FormationConfig {
  domaine: string;
  expert_persona: string;
  system_prompt: string;
  ia_tips: string[];
}

// ─────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// Configurations formations
// ─────────────────────────────────────────────
const FORMATION_CONFIGS: Record<string, FormationConfig> = {
  developpement_web: {
    domaine: "Développement Web",
    expert_persona: "développeur senior full-stack avec 15 ans d'expérience",
    system_prompt: `Tu es un développeur senior full-stack expert (React, Next.js, Node.js, bases de données).
Tu accompagnes des apprenants dans leur parcours d'apprentissage du développement web.
Ton style : pédagogue, bienveillant, concret. Tu donnes toujours des exemples de code commentés.
Tu poses des questions de vérification pour t'assurer de la compréhension.`,
    ia_tips: [
      "Utilise GitHub Copilot pour accélérer l'écriture de code boilerplate",
      "ChatGPT et Claude excellent pour déboguer et expliquer les messages d'erreur",
      "Prompt engineering : décris toujours le contexte (framework, version, contrainte)",
    ],
  },
  data_science: {
    domaine: "Data Science & IA",
    expert_persona: "data scientist senior spécialisé ML/IA avec doctorat",
    system_prompt: `Tu es un data scientist expert (Python, pandas, scikit-learn, deep learning, statistiques).
Tu guides des apprenants à travers les concepts complexes de la data science avec clarté et rigueur.
Ton style : rigoureux mais accessible, tu utilises des analogies pour les concepts abstraits.
Tu encourages l'approche expérimentale et la pensée critique sur les données.`,
    ia_tips: [
      "Code Interpreter de ChatGPT est idéal pour l'analyse exploratoire rapide",
      "Claude excelle pour expliquer des algorithmes complexes et revoir ton code Python",
      "Copilot dans Jupyter accélère l'écriture de pipelines ML répétitifs",
    ],
  },
  marketing_digital: {
    domaine: "Marketing Digital",
    expert_persona: "directeur marketing digital avec expertise growth hacking",
    system_prompt: `Tu es un expert en marketing digital (SEO, SEA, social media, content marketing, analytics).
Tu coaces des apprenants pour maîtriser les stratégies digitales modernes.
Ton style : orienté résultats, tu illustres avec des cas concrets et des métriques réelles.
Tu encourages la créativité tout en restant data-driven.`,
    ia_tips: [
      "ChatGPT et Claude transforment la création de contenu : briefings, A/B tests, copywriting",
      "Midjourney et DALL-E pour créer des visuels de campagne en quelques secondes",
      "Utilise l'IA pour analyser tes concurrents et générer des insights stratégiques",
    ],
  },
  default: {
    domaine: "Formation Professionnelle",
    expert_persona: "formateur expert et pédagogue expérimenté",
    system_prompt: `Tu es un formateur expert et pédagogue expérimenté.
Tu accompagnes des apprenants dans leur parcours de formation professionnelle.
Ton style : bienveillant, structuré, adaptatif selon le niveau de l'apprenant.
Tu vérifies régulièrement la compréhension et adaptes tes explications.`,
    ia_tips: [
      "L'IA générative peut vous aider à créer des fiches de révision personnalisées",
      "Utilisez Claude ou ChatGPT comme partenaire de pratique et de questions-réponses",
      "L'IA accélère la recherche d'informations complémentaires sur votre domaine",
    ],
  },
};

// ─────────────────────────────────────────────
// Détection signaux d'abandon
// ─────────────────────────────────────────────
const ABANDON_SIGNALS = [
  /je (ne |n')comprends (pas|plus|rien)/i,
  /c'est trop (difficile|compliqué|dur)/i,
  /j'abandonne/i,
  /je (lâche|laisse) tomber/i,
  /ça (ne|n') sert (à rien|pas)/i,
  /je suis (nul|nulle|pas fait|pas faite)/i,
  /c'est (inutile|impossible pour moi)/i,
  /je vais (arrêter|tout arrêter)/i,
  /frustré|découragé|démotivé/i,
  /perdre (mon temps|la tête)/i,
];

function detectAbandonSignals(message: string): boolean {
  return ABANDON_SIGNALS.some((pattern) => pattern.test(message));
}

// ─────────────────────────────────────────────
// Alerte agent anti-abandon
// ─────────────────────────────────────────────
async function triggerAbandonAlert(
  apprenant_id: string,
  formation_id: string,
  message: string,
  conversation_id: string
): Promise<void> {
  try {
    await supabase.from("abandon_alerts").insert({
      apprenant_id,
      formation_id,
      conversation_id,
      trigger_message: message.substring(0, 200),
      detected_at: new Date().toISOString(),
      status: "pending",
      severity: "medium",
    });

    // Appel webhook agent anti-abandon si configuré
    if (process.env.ABANDON_AGENT_WEBHOOK_URL) {
      await fetch(process.env.ABANDON_AGENT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apprenant_id,
          formation_id,
          conversation_id,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Non-bloquant : on log mais on ne plante pas la réponse
        console.warn("[AbandonAlert] Webhook call failed silently");
      });
    }
  } catch (error) {
    console.error("[AbandonAlert] Failed to create alert:", error);
  }
}

// ─────────────────────────────────────────────
// Récupération / création conversation Supabase
// ─────────────────────────────────────────────
async function getOrCreateConversation(
  apprenant_id: string,
  formation_id: string,
  conversation_id?: string
): Promise<ConversationRow> {
  // Récupération conversation existante
  if (conversation_id) {
    const { data, error } = await supabase
      .from("agents_conversations")
      .select("*")
      .eq("id", conversation_id)
      .eq("apprenant_id", apprenant_id)
      .single();

    if (!error && data) return data as ConversationRow;
  }

  // Recherche dernière conversation active pour cette formation
  const { data: existing } = await supabase
    .from("agents_conversations")
    .select("*")
    .eq("apprenant_id", apprenant_id)
    .eq("formation_id", formation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing as ConversationRow;

  // Création nouvelle conversation
  const { data: created, error: createError } = await supabase
    .from("agents_conversations")
    .insert({
      apprenant_id,
      formation_id,
      messages: [],
      abandon_signals: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create conversation: ${createError?.message}`);
  }

  return created as ConversationRow;
}

// ─────────────────────────────────────────────
// Mise à jour conversation Supabase
// ─────────────────────────────────────────────
async function updateConversation(
  conversation_id: string,
  newMessages: Message[],
  hasAbandonSignal: boolean
): Promise<void> {
  const updateData: Record<string, unknown> = {
    messages: newMessages,
    updated_at: new Date().toISOString(),
  };

  if (hasAbandonSignal) {
    // Incrémentation compteur signaux abandon
    const { data } = await supabase
      .from("agents_conversations")
      .select("abandon_signals")
      .eq("id", conversation_id)
      .single();

    updateData.abandon_signals = ((data?.abandon_signals as number) || 0) + 1;
  }

  await supabase
    .from("agents_conversations")
    .update(updateData)
    .eq("id", conversation_id);
}

// ─────────────────────────────────────────────
// Construction system prompt complet
// ─────────────────────────────────────────────
function buildSystemPrompt(
  config: FormationConfig,
  hasAbandonSignal: boolean
): string {
  const iaTipsFormatted = config.ia_tips
    .map((tip, i) => `  ${i + 1}. ${tip}`)
    .join("\n");

  const abandonGuidance = hasAbandonSignal
    ? `
⚠️ ATTENTION - SIGNAL DE DÉMOTIVATION DÉTECTÉ :
L'apprenant montre des signes de découragement. Priorité absolue :
1. Reconnaître et valider son ressenti avec empathie
2. Reformuler la difficulté en challenge surmontable
3. Rappeler ses progrès accomplis
4. Proposer une approche plus simple ou décomposée
5. Terminer ta réponse par un encouragement sincère et un micro-objectif atteignable
`
    : "";

  return `Tu es ${config.expert_persona} et tuteur IA pour AcadémIA Pro, spécialisé en ${config.domaine}.

${config.system_prompt}

═══════════════════════════════════════
DIR