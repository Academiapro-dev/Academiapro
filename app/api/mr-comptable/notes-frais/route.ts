```typescript
// app/api/mr-comptable/notes-frais/email/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface ExpenseData {
  id: string;
  date: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  fournisseur: string;
  nature: string;
  categorie: ExpenseCategory;
  deductible: boolean;
  tvaRecuperable: number;
  contexte?: string;
  justificatif?: string;
  source: "email" | "whatsapp";
  statut: ExpenseStatus;
  anomalies: string[];
  createdAt: string;
  weekNumber: number;
  year: number;
}

type ExpenseCategory =
  | "repas_affaires"
  | "repas_seul"
  | "transport"
  | "materiel_informatique"
  | "abonnement_logiciel"
  | "autre";

type ExpenseStatus =
  | "validee"
  | "en_attente_contexte"
  | "anomalie"
  | "non_deductible";

interface ClaudeExtractionResult {
  date: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  fournisseur: string;
  nature: string;
  categorie: ExpenseCategory;
  confidence: number;
  anomalies: string[];
}

interface WeeklyReport {
  semaine: number;
  annee: number;
  periode: { debut: string; fin: string };
  totalNotesFrais: number;
  totalDeductible: number;
  totalNonDeductible: number;
  tvaRecuperable: number;
  nombreNotes: number;
  anomalies: ReportAnomaly[];
  justificatifsManquants: string[];
  detailParCategorie: CategoryDetail[];
  notes: ExpenseData[];
}

interface ReportAnomaly {
  expenseId: string;
  description: string;
  severity: "warning" | "error";
}

interface CategoryDetail {
  categorie: ExpenseCategory;
  total: number;
  deductible: number;
  tvaRecuperable: number;
  nombre: number;
}

interface GmailMessage {
  id: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: GmailPart[];
    body?: { data?: string; size?: number };
  };
}

interface GmailPart {
  mimeType: string;
  filename?: string;
  body?: {
    data?: string;
    attachmentId?: string;
    size?: number;
  };
  parts?: GmailPart[];
}

// ============================================================
// IN-MEMORY STORAGE (remplacer par DB en production)
// ============================================================

const expensesStore: ExpenseData[] = [];

// ============================================================
// UTILITAIRES
// ============================================================

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDates(week: number, year: number): { debut: string; fin: string } {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + (dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek));
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    debut: weekStart.toISOString().split("T")[0],
    fin: weekEnd.toISOString().split("T")[0],
  };
}

function generateId(): string {
  return `NF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// ============================================================
// RÈGLES FISCALES
// ============================================================

interface FiscalRule {
  deductible: boolean;
  tvaRecuperable: number;
  requiresContext: boolean;
  conditions?: string;
}

function applyFiscalRules(
  categorie: ExpenseCategory,
  contexte?: string,
  montantTTC?: number,
  tva?: number
): FiscalRule {
  const tvaAmount = tva || 0;

  switch (categorie) {
    case "repas_affaires":
      const clientPresent =
        contexte &&
        (contexte.toLowerCase().includes("client") ||
          contexte.toLowerCase().includes("prospect") ||
          contexte.toLowerCase().includes("partenaire") ||
          contexte.toLowerCase().includes("avec "));
      return {
        deductible: !!clientPresent,
        tvaRecuperable: clientPresent ? tvaAmount : 0,
        requiresContext: !contexte,
        conditions: clientPresent
          ? "Repas affaires avec client — déductible"
          : "Repas sans client identifié — non déductible",
      };

    case "repas_seul":
      const enDeplacement =
        contexte &&
        (contexte.toLowerCase().includes("déplacement") ||
          contexte.toLowerCase().includes("deplacement") ||
          contexte.toLowerCase().includes("mission") ||
          contexte.toLowerCase().includes("voyage"));
      return {
        deductible: !!enDeplacement,
        tvaRecuperable: 0,
        requiresContext: !contexte,
        conditions: enDeplacement
          ? "Repas en déplacement professionnel — déductible"
          : "Repas seul sans déplacement — non déductible",
      };

    case "transport":
      return {
        deductible: true,
        tvaRecuperable: tvaAmount,
        requiresContext: false,
        conditions: "Transport professionnel — 100% déductible",
      };

    case "materiel_informatique":
      return {
        deductible: true,
        tvaRecuperable: tvaAmount,
        requiresContext: false,
        conditions:
          "Matériel informatique — déductible par amortissement (3 ans)",
      };

    case "abonnement_logiciel":
      return {
        deductible: true,
        tvaRecuperable: tvaAmount,
        requiresContext: false,
        conditions: "Abonnement logiciel — 100% déductible",
      };

    default:
      return {
        deductible: false,
        tvaRecuperable: 0,
        requiresContext: true,
        conditions: "Catégorie non reconnue — vérification manuelle requise",
      };
  }
}

// ============================================================
// CLAUDE VISION — EXTRACTION DONNÉES
// ============================================================

async function extractExpenseDataWithClaude(
  imageBase64: string,
  mimeType: string
): Promise<ClaudeExtractionResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const prompt = `Tu es un expert comptable français spécialisé dans l'analyse de notes de frais.
  
Analyse cette image de reçu/facture et extrais les informations suivantes avec précision.

INSTRUCTIONS D'EXTRACTION :
1. DATE : Format ISO (YYYY-MM-DD). Si absente, utilise la date du jour.
2. MONTANT HT : Montant hors taxes en euros (nombre décimal)
3. TVA : Montant de la TVA en euros (nombre décimal). Calcule si non explicite (TTC / 1.20 * 0.20 pour TVA 20%)
4. MONTANT TTC : Montant total TTC en euros
5. FOURNISSEUR : Nom du fournisseur/commerce
6. NATURE : Description de la dépense (ex: "Déjeuner", "Billet train Paris-Lyon", "MacBook Pro", "Abonnement Adobe CC")
7. CATÉGORIE : Détermine parmi : repas_affaires, repas_seul, transport, materiel_informatique, abonnement_logiciel, autre
8. ANOMALIES : Liste les problèmes détectés (montants illisibles, date manquante, TVA incohérente, etc.)

RÈGLES DE CATÉGORISATION :
- Restaurant, café, repas → repas_affaires ou repas_seul (incertain = repas_affaires)
- SNCF, RATP, taxi, Uber, avion, parking → transport
- Ordinateur, écran, souris, clavier, téléphone professionnel → materiel_informatique
- Logiciel, SaaS, abonnement numérique → abonnement_logiciel

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "date": "YYYY-MM-DD",
  "montantHT": 0.00,
  "tva": 0.00,
  "montantTTC": 0.00,
  "fournisseur": "Nom",
  "nature": "Description",
  "categorie": "categorie_enum",
  "confidence": 0.95,
  "anomalies": []
}`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Claude n'a pas retourné de texte");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Impossible d'extraire le JSON de la réponse Claude");
  }

  return JSON.parse(jsonMatch[0]) as ClaudeExtractionResult;
}

async function extractExpenseFromPDF(
  pdfBase64: string
): Promise<ClaudeExtractionResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const prompt = `Tu es un expert comptable français. Analyse ce document PDF de note de frais/facture.
  
Extrais les données comptables et retourne UNIQUEMENT ce JSON :
{
  "date": "YYYY-MM-DD",
  "montantHT": 0.00,
  "tva": 0.00,
  "montantTTC": 0.00,
  "fournisseur": "Nom",
  "nature": "Description détaillée",
  "categorie": "repas_affaires|repas_seul|transport|materiel_informatique|abonnement_logiciel|autre",
  "confidence": 0.95,
  "anomalies": ["liste des problèmes si présents"]
}`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          } as {
            type: "document";
            source: {
              type: "base64";
              media_type: "application/pdf";
              data: string;
            };
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Claude n'a pas retourné de texte");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Impossible d'extraire le JSON");
  }

  return JSON.parse(jsonMatch[0]) as ClaudeExtractionResult;
}

// ============================================================
// GMAIL API
// ============================================================

async function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth });
}

async function fetchNewExpenseEmails(): Promise<GmailMessage[]> {
  const gmail = await getGmailClient();

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: `to:notesdefrais@academiapro.fr is:unread has:attachment`,
    maxResults: 50,
  });

  const messages = listResponse.data.messages || [];
  const fullMessages: GmailMessage[] = [];

  for (const msg of messages) {
    const fullMsg = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
    });
    fullMessages.push(fullMsg.data as GmailMessage);

    // Marquer comme lu
    await gmail.users.messages.modify({
      userId: "me",
      id: msg.id!,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
  }

  return fullMessages;
}

async function getAttachmentContent(
  messageId: string,
  attachmentId: string
): Promise<string> {
  const gmail = await getGmailClient();

  const attachment = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  return attachment.data.data || "";
}

function extractAttachments(
  message: GmailMessage
): Array<{
  data: string;
  mimeType: string;
  filename: string;
  attachmentId?: string;
}> {
  const attachments: Array<{
    data: string;
    mimeType: string;
    filename: string;
    attachmentId?: string;
  }> = [];

  const supportedTypes = [
    "image/jpeg