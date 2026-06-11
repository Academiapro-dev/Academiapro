// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ============================================================
// INITIALISATION CLIENTS
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// SCHÉMA DE VALIDATION ZOD
// ============================================================

const ContactSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides"),

  email: z
    .string()
    .email("L'adresse email est invalide")
    .max(254, "L'email ne peut pas dépasser 254 caractères")
    .toLowerCase(),

  sujet: z
    .string()
    .min(3, "Le sujet doit contenir au moins 3 caractères")
    .max(200, "Le sujet ne peut pas dépasser 200 caractères"),

  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000, "Le message ne peut pas dépasser 5000 caractères"),

  telephone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{8})$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),

  entreprise: z.string().max(150).optional(),
});

type ContactFormData = z.infer<typeof ContactSchema>;

// ============================================================
// TYPES SUPABASE
// ============================================================

interface ContactMessage {
  id?: string;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  telephone?: string;
  entreprise?: string;
  statut: "nouveau" | "lu" | "en_cours" | "résolu";
  source: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

interface CRMContact {
  id?: string;
  email: string;
  nom: string;
  telephone?: string;
  entreprise?: string;
  nb_contacts: number;
  dernier_contact: string;
  tags: string[];
  updated_at?: string;
}

// ============================================================
// TEMPLATES EMAIL
// ============================================================

const emailAdminTemplate = (data: ContactFormData): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message - AcadémIA Pro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
    .body { padding: 32px; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .alert-icon { font-size: 20px; }
    .alert-text { font-size: 14px; color: #92400e; font-weight: 500; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px; }
    .field-value { font-size: 15px; color: #111827; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; word-break: break-word; }
    .field-value.message-field { white-space: pre-wrap; line-height: 1.6; min-height: 80px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .action-btn { display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center; margin: 24px 0; }
    .metadata { background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 12px; color: #6b7280; }
    .metadata p { margin-bottom: 4px; }
    .footer { background: #1f2937; padding: 24px 32px; text-align: center; }
    .footer p { color: #9ca3af; font-size: 13px; }
    .footer strong { color: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 AcadémIA Pro</h1>
      <p>Système de gestion des contacts</p>
      <span class="badge">📬 Nouveau message reçu</span>
    </div>
    
    <div class="body">
      <div class="alert">
        <span class="alert-icon">⚡</span>
        <span class="alert-text">Un nouveau message nécessite votre attention. Répondez dans les 24h.</span>
      </div>

      <div class="grid">
        <div class="field">
          <div class="field-label">👤 Nom complet</div>
          <div class="field-value">${escapeHtml(data.nom)}</div>
        </div>
        <div class="field">
          <div class="field-label">📧 Email</div>
          <div class="field-value">${escapeHtml(data.email)}</div>
        </div>
      </div>

      ${
        data.telephone || data.entreprise
          ? `
      <div class="grid">
        ${
          data.telephone
            ? `
        <div class="field">
          <div class="field-label">📞 Téléphone</div>
          <div class="field-value">${escapeHtml(data.telephone)}</div>
        </div>`
            : ""
        }
        ${
          data.entreprise
            ? `
        <div class="field">
          <div class="field-label">🏢 Entreprise</div>
          <div class="field-value">${escapeHtml(data.entreprise)}</div>
        </div>`
            : ""
        }
      </div>`
          : ""
      }

      <div class="field">
        <div class="field-label">📝 Sujet</div>
        <div class="field-value">${escapeHtml(data.sujet)}</div>
      </div>

      <div class="field">
        <div class="field-label">💬 Message</div>
        <div class="field-value message-field">${escapeHtml(data.message)}</div>
      </div>

      <hr class="divider">

      <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${encodeURIComponent(data.sujet)}" class="action-btn">
        ↩️ Répondre directement à ${escapeHtml(data.nom)}
      </a>

      <div class="metadata">
        <p>🕐 <strong>Reçu le :</strong> ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        <p>🌐 <strong>Source :</strong> Formulaire de contact AcadémIA Pro</p>
      </div>
    </div>

    <div class="footer">
      <p><strong>AcadémIA Pro</strong> — Plateforme d'Intelligence Artificielle pour l'Éducation</p>
      <p style="margin-top: 8px;">Ce message a été généré automatiquement par le système CRM</p>
    </div>
  </div>
</body>
</html>
`;

const emailConfirmationTemplate = (data: ContactFormData): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation - AcadémIA Pro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
    .header .emoji { font-size: 48px; margin-bottom: 16px; display: block; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 16px; }
    .body { padding: