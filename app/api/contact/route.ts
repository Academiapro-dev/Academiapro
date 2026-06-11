import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const resendApiKey = process.env.RESEND_API_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface ContactFormData {
  nom: string;
  prenom: string;
  email: string;
  sujet: string;
  message: string;
}

interface ContactRecord {
  nom: string;
  prenom: string;
  email: string;
  sujet: string;
  message: string;
  created_at: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateContactForm(data: Partial<ContactFormData>): string[] {
  const errors: string[] = [];

  if (!data.nom || data.nom.trim().length < 2) {
    errors.push("Le nom doit contenir au moins 2 caractères");
  }

  if (!data.prenom || data.prenom.trim().length < 2) {
    errors.push("Le prénom doit contenir au moins 2 caractères");
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push("L'adresse email est invalide");
  }

  if (!data.sujet || data.sujet.trim().length < 5) {
    errors.push("Le sujet doit contenir au moins 5 caractères");
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push("Le message doit contenir au moins 10 caractères");
  }

  return errors;
}

function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, "");
}

async function saveContactToSupabase(
  contactData: ContactRecord
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("contacts")
    .insert([contactData])
    .select()
    .single();

  return {
    data: data as Record<string, unknown> | null,
    error: error as Error | null,
  };
}

async function sendEmailNotification(
  contactData: ContactFormData
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau message de contact - AcadémIA Pro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 30px;
        }
        .field {
          margin-bottom: 20px;
          border-bottom: 1px solid #eeeeee;
          padding-bottom: 15px;
        }
        .field:last-child {
          border-bottom: none;
        }
        .field-label {
          font-weight: bold;
          color: #6366f1;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .field-value {
          font-size: 16px;
          color: #333333;
        }
        .message-box {
          background-color: #f8f9ff;
          border-left: 4px solid #6366f1;
          padding: 15px;
          border-radius: 0 4px 4px 0;
          white-space: pre-wrap;
        }
        .footer {
          background-color: #f8f9ff;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #888888;
          border-top: 1px solid #eeeeee;
        }
        .badge {
          display: inline-block;
          background-color: #6366f1;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AcadémIA Pro</h1>
          <p>Nouveau message de contact reçu</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Nom complet</div>
            <div class="field-value">${contactData.prenom} ${contactData.nom}</div>
          </div>
          <div class="field">
            <div class="field-label">Adresse email</div>
            <div class="field-value">
              <a href="mailto:${contactData.email}" style="color: #6366f1;">${contactData.email}</a>
            </div>
          </div>
          <div class="field">
            <div class="field-label">Sujet</div>
            <div class="field-value">
              <span class="badge">${contactData.sujet}</span>
            </div>
          </div>
          <div class="field">
            <div class="field-label">Message</div>
            <div class="message-box field-value">${contactData.message}</div>
          </div>
        </div>
        <div class="footer">
          <p>Ce message a été envoyé depuis le formulaire de contact d'AcadémIA Pro</p>
          <p>© ${new Date().getFullYear()} AcadémIA Pro - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Nouveau message de contact - AcadémIA Pro

Nom complet: ${contactData.prenom} ${contactData.nom}
Email: ${contactData.email}
Sujet: ${contactData.sujet}

Message:
${contactData.message}

---
Ce message a été envoyé depuis le formulaire de contact d'AcadémIA Pro
  `;

  await resend.emails.send({
    from: "AcadémIA Pro <noreply@academiapro.fr>",
    to: ["contact@academiapro.fr"],
    replyTo: contactData.email,
    subject: `[Contact] ${contactData.sujet} - ${contactData.prenom} ${contactData.nom}`,
    html: htmlContent,
    text: textContent,
  });
}

async function sendConfirmationEmail(
  contactData: ContactFormData
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de votre message - AcadémIA Pro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          font-weight: bold;
          color: #333333;
          margin-bottom: 15px;
        }
        .checkmark {
          text-align: center;
          font-size: 60px;
          margin: 20px 0;
        }
        .info-box {
          background-color: #f0f0ff;
          border: 1px solid #d0d0ff;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .info-box p {
          margin: 0;
          color: #4a4a8a;
        }
        .footer {
          background-color: #f8f9ff;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #888888;
          border-top: 1px solid #eeeeee;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 12px 25px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AcadémIA Pro</h1>
        </div>
        <div class="content">
          <div class="checkmark">✅</div>
          <div class="greeting">Bonjour ${contactData.prenom} ${contactData.nom},</div>
          <p>Nous avons bien reçu votre message concernant <strong>${contactData.sujet}</strong>.</p>
          <div class="info-box">
            <p>Notre équipe vous répondra dans les meilleurs délais, généralement sous 24 à 48 heures ouvrées.</p>
          </div>
          <p>En attendant, n'hésitez pas à explorer notre plateforme et découvrir toutes les fonctionnalités d'AcadémIA Pro.</p>
          <div style="text-align: center;">
            <a href="https://academiapro.fr" class="btn">Visiter AcadémIA Pro</a>
          </div>
          <p>Cordialement,<br><strong>L'équipe AcadémIA Pro</strong></p>
        </div>
        <div class="footer">
          <p>Vous recevez cet email car vous avez soumis un formulaire de contact sur AcadémIA Pro</p>
          <p>© ${new Date().getFullYear()} AcadémIA Pro - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "AcadémIA Pro <noreply@academiapro.fr>",
    to: [contactData.email],
    subject: "Confirmation de votre message - AcadémIA Pro",
    html: htmlContent,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);

  const responseData: ApiResponse = {
    success: true,
    message: "API Contact AcadémIA Pro est opérationnelle",
    data: {
      status: "healthy",
      version: "1.0.0",
      service: "AcadémIA Pro Contact API",
      timestamp: new Date().toISOString(),
      endpoint: url.pathname,
      methods: ["GET", "POST"],
      fields_required: ["nom", "prenom", "email", "sujet", "message"],
      documentation: {
        POST: "Soumettre un formulaire de contact",
        GET: "Vérifier le statut de l'API",
      },
      environment: process.env.NODE_ENV || "development",
    },
  };

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-API-Version": "1.0.0",
      "X-Service": "AcadémIA Pro Contact API",
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: Partial<ContactFormData>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Format de données invalide",
          error: "Le corps de la requête doit être un JSON valide",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const validationErrors = validateContactForm(body);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Données du formulaire invalides",
          error: validationErrors.join(", "),
          data: {
            errors: validationErrors,
          },
        } as ApiResponse,
        { status: 422 }
      );
    }

    const sanitizedData: ContactFormData = {
      nom: sanitizeString(body.nom as string),
      prenom: sanitizeString(body.prenom as string),
      email: sanitizeString(body.email as string).toLowerCase(),
      sujet: sanitizeString(body.sujet as string),
      message: sanitizeString(body.message as string),
    };

    const contactRecord: ContactRecord = {
      ...sanitizedData,
      created_at: new Date().toISOString(),
      status: "pending",