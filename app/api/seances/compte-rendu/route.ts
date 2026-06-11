// app/api/sessions/generate-report/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface SessionReportRequest {
  apprenant_id: string;
  session_id?: string;
  specialite: string;
  conversation_history: Message[];
  apprenant_info?: {
    nom?: string;
    prenom?: string;
    email?: string;
    niveau?: string;
    objectifs_generaux?: string[];
  };
  duree_session_minutes?: number;
  metadata?: Record<string, unknown>;
}

interface StructuredReport {
  resume_seance: string;
  points_travailles: Array<{
    titre: string;
    description: string;
    niveau_maitrise: "debutant" | "intermediaire" | "avance" | "expert";
    progression: number; // 0-100
  }>;
  exercices_recommandes: Array<{
    titre: string;
    description: string;
    difficulte: "facile" | "moyen" | "difficile";
    duree_estimee_minutes: number;
    objectif: string;
    ressource_url?: string;
  }>;
  objectifs_prochaine_seance: Array<{
    objectif: string;
    priorite: "haute" | "moyenne" | "basse";
    justification: string;
  }>;
  ressources_complementaires: Array<{
    titre: string;
    type: "article" | "video" | "exercice" | "documentation" | "livre" | "outil";
    description: string;
    url?: string;
    pertinence: string;
  }>;
  evaluation_globale: {
    score_engagement: number; // 0-10
    score_comprehension: number; // 0-10
    score_progression: number; // 0-10
    commentaire_global: string;
  };
  tags: string[];
  duree_recommandee_prochaine_seance_minutes: number;
}

interface CRMUpdatePayload {
  apprenant_id: string;
  session_id: string;
  specialite: string;
  date_session: string;
  score_engagement: number;
  score_comprehension: number;
  score_progression: number;
  tags: string[];
  points_travailles_count: number;
  next_session_objectives: string[];
}

// ============================================================
// CLIENTS INITIALIZATION
// ============================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// ============================================================
// PROMPT ENGINEERING
// ============================================================

function buildReportPrompt(
  specialite: string,
  conversation: Message[],
  apprenantInfo?: SessionReportRequest["apprenant_info"],
  duree?: number
): string {
  const conversationText = conversation
    .map(
      (msg, idx) =>
        `[${idx + 1}] ${msg.role === "user" ? "👤 Apprenant" : "🤖 AcadémIA"}: ${msg.content}`
    )
    .join("\n\n");

  const apprenantContext = apprenantInfo
    ? `
**Informations apprenant:**
- Nom: ${apprenantInfo.prenom || ""} ${apprenantInfo.nom || ""}
- Niveau actuel: ${apprenantInfo.niveau || "Non spécifié"}
- Objectifs généraux: ${apprenantInfo.objectifs_generaux?.join(", ") || "Non spécifiés"}
`
    : "";

  return `Tu es un expert pédagogique senior spécialisé en ${specialite} pour la plateforme AcadémIA Pro. 
Tu dois analyser en profondeur cette séance d'apprentissage et générer un compte-rendu structuré, 
détaillé et actionnable.

**Spécialité:** ${specialite}
**Durée de la séance:** ${duree ? `${duree} minutes` : "Non spécifiée"}
${apprenantContext}

**Transcript complet de la séance:**
---
${conversationText}
---

**INSTRUCTIONS CRITIQUES:**
1. Analyse chaque échange pour identifier les concepts abordés, les difficultés rencontrées et les progrès réalisés
2. Sois précis et spécifique à la spécialité ${specialite}
3. Les recommandations doivent être personnalisées et actionnables
4. Évalue objectivement la progression sans être ni trop indulgent ni trop sévère
5. Les ressources recommandées doivent être pertinentes et accessibles

Génère UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) avec exactement cette structure:

{
  "resume_seance": "Résumé narratif complet de 150-200 mots décrivant le déroulement, les thèmes abordés et les interactions clés",
  "points_travailles": [
    {
      "titre": "Nom du concept/compétence travaillé",
      "description": "Description détaillée de ce qui a été travaillé",
      "niveau_maitrise": "debutant|intermediaire|avance|expert",
      "progression": 65
    }
  ],
  "exercices_recommandes": [
    {
      "titre": "Nom de l'exercice",
      "description": "Description précise de l'exercice à réaliser",
      "difficulte": "facile|moyen|difficile",
      "duree_estimee_minutes": 30,
      "objectif": "Ce que l'exercice va permettre de consolider",
      "ressource_url": "https://... (optionnel)"
    }
  ],
  "objectifs_prochaine_seance": [
    {
      "objectif": "Objectif précis et mesurable",
      "priorite": "haute|moyenne|basse",
      "justification": "Pourquoi cet objectif est prioritaire basé sur la séance actuelle"
    }
  ],
  "ressources_complementaires": [
    {
      "titre": "Titre de la ressource",
      "type": "article|video|exercice|documentation|livre|outil",
      "description": "Pourquoi cette ressource est utile",
      "url": "https://... (si applicable)",
      "pertinence": "Lien direct avec ce qui a été travaillé"
    }
  ],
  "evaluation_globale": {
    "score_engagement": 8,
    "score_comprehension": 7,
    "score_progression": 6,
    "commentaire_global": "Commentaire bienveillant et constructif de 100 mots"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "duree_recommandee_prochaine_seance_minutes": 60
}

Génère entre 2-5 points travaillés, 3-5 exercices recommandés, 2-4 objectifs, 3-5 ressources.`;
}

// ============================================================
// EMAIL TEMPLATE
// ============================================================

function generateEmailHTML(
  report: StructuredReport,
  specialite: string,
  apprenantInfo?: SessionReportRequest["apprenant_info"],
  sessionDate?: string
): string {
  const prenom = apprenantInfo?.prenom || "Apprenant";
  const dateFormatted = sessionDate
    ? new Date(sessionDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const scoreColor = (score: number) => {
    if (score >= 8) return "#10B981";
    if (score >= 6) return "#F59E0B";
    return "#EF4444";
  };

  const difficulteColor = (diff: string) => {
    if (diff === "facile") return "#10B981";
    if (diff === "moyen") return "#F59E0B";
    return "#EF4444";
  };

  const prioriteIcon = (priorite: string) => {
    if (priorite === "haute") return "🔴";
    if (priorite === "moyenne") return "🟡";
    return "🟢";
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      article: "📄",
      video: "🎥",
      exercice: "✏️",
      documentation: "📚",
      livre: "📖",
      outil: "🔧",
    };
    return icons[type] || "📌";
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-rendu de séance - AcadémIA Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0F4FF;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 40px 20px; text-align: center;">
    <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 20px; margin-bottom: 16px;">
      <span style="color: rgba(255,255,255,0.9); font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">AcadémIA Pro</span>
    </div>
    <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">
      📋 Compte-rendu de séance
    </h1>
    <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 16px;">
      ${specialite} · ${dateFormatted}
    </p>
  </div>

  <!-- Main Content -->
  <div style="max-width: 680px; margin: 0 auto; padding: 0 20px 40px 20px;">
    
    <!-- Greeting -->
    <div style="background: white; border-radius: 16px; padding: 28px; margin-top: 24px; box-shadow: 0 2px 12px rgba(102,126,234,0.08);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Bonjour <strong style="color: #667EEA;">${prenom}</strong>