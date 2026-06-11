import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const resendApiKey = process.env.RESEND_API_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface WebinarRegistration {
  id: string;
  email: string;
  prenom: string;
  created_at: string;
  confirmed: boolean;
}

interface RegistrationPayload {
  email: string;
  prenom: string;
}

interface ApiError {
  message: string;
  code?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePrenom(prenom: string): boolean {
  return prenom.trim().length >= 2 && prenom.trim().length <= 50;
}

async function sendConfirmationEmail(
  email: string,
  prenom: string
): Promise<void> {
  await resend.emails.send({
    from: "AcadémIA Pro <webinaire@academia-pro.fr>",
    to: [email],
    subject: "Confirmation inscription Webinaire AcadémIA Pro",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Confirmation Webinaire AcadémIA Pro</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">AcadémIA Pro</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Webinaire Exclusif</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e1b4b; font-size: 22px; margin-bottom: 16px;">
                Bonjour ${prenom} ! 🎉
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Votre inscription au webinaire <strong>AcadémIA Pro</strong> a bien été enregistrée.
                Nous sommes ravis de vous compter parmi nos participants.
              </p>
              <div style="background-color: #f0f0ff; border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="color: #4338ca; margin: 0 0 12px 0; font-size: 16px;">📅 Détails du Webinaire</h3>
                <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Événement :</strong> Intelligence Artificielle & Formation</p>
                <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Plateforme :</strong> Lien envoyé 24h avant</p>
                <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Email inscrit :</strong> ${email}</p>
              </div>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
                Vous recevrez un rappel avec le lien de connexion 24 heures avant le début du webinaire.
                En cas de question, répondez directement à cet email.
              </p>
              <div style="text-align: center;">
                <a href="https://academia-pro.fr" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Visiter AcadémIA Pro
                </a>
              </div>
            </div>
            <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 AcadémIA Pro · Tous droits réservés
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">
                Vous recevez cet email car vous vous êtes inscrit à notre webinaire.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RegistrationPayload = await request.json();
    const { email, prenom } = body;

    if (!email || !prenom) {
      const error: ApiError = {
        message: "Les champs email et prénom sont obligatoires",
        code: "MISSING_FIELDS",
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    if (!validateEmail(email)) {
      const error: ApiError = {
        message: "Format email invalide",
        code: "INVALID_EMAIL",
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    if (!validatePrenom(prenom)) {
      const error: ApiError = {
        message: "Le prénom doit contenir entre 2 et 50 caractères",
        code: "INVALID_PRENOM",
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPrenom = prenom.trim();

    const { data: existingUser, error: checkError } = await supabase
      .from("webinaires")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Erreur vérification doublon Supabase:", checkError);
      const error: ApiError = {
        message: "Erreur lors de la vérification de l inscription",
        code: "DATABASE_CHECK_ERROR",
      };
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    if (existingUser) {
      const error: ApiError = {
        message: "Cet email est déjà inscrit au webinaire",
        code: "ALREADY_REGISTERED",
      };
      return NextResponse.json({ success: false, error }, { status: 409 });
    }

    const { data: insertedData, error: insertError } = await supabase
      .from("webinaires")
      .insert([
        {
          email: normalizedEmail,
          prenom: normalizedPrenom,
          confirmed: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Erreur insertion Supabase:", insertError);
      const error: ApiError = {
        message: "Erreur lors de l enregistrement de l inscription",
        code: "DATABASE_INSERT_ERROR",
      };
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    const registration = insertedData as WebinarRegistration;

    try {
      await sendConfirmationEmail(normalizedEmail, normalizedPrenom);

      await supabase
        .from("webinaires")
        .update({ confirmed: true })
        .eq("id", registration.id);
    } catch (emailError) {
      console.error("Erreur envoi email Resend:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Inscription enregistrée avec succès",
        data: {
          id: registration.id,
          email: normalizedEmail,
          prenom: normalizedPrenom,
          created_at: registration.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inattendue POST webinaire:", error);
    const apiError: ApiError = {
      message: "Erreur interne du serveur",
      code: "INTERNAL_SERVER_ERROR",
    };
    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      const error: ApiError = {
        message: "Accès non autorisé",
        code: "UNAUTHORIZED",
      };
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const { count: totalCount, error: totalError } = await supabase
      .from("webinaires")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("Erreur comptage total Supabase:", totalError);
      const error: ApiError = {
        message: "Erreur lors de la récupération des statistiques",
        code: "DATABASE_COUNT_ERROR",
      };
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    const { count: confirmedCount, error: confirmedError } = await supabase
      .from("webinaires")
      .select("*", { count: "exact", head: true })
      .eq("confirmed", true);

    if (confirmedError) {
      console.error("Erreur comptage confirmés Supabase:", confirmedError);
      const error: ApiError = {
        message: "Erreur lors de la récupération des confirmations",
        code: "DATABASE_CONFIRMED_ERROR",
      };
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { count: recentCount, error: recentError } = await supabase
      .from("webinaires")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    if (recentError) {
      console.error("Erreur comptage récents Supabase:", recentError);
    }

    const { data: recentRegistrations, error: recentDataError } = await supabase
      .from("webinaires")
      .select("id, prenom, email, created_at, confirmed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentDataError) {
      console.error("Erreur récupération derniers inscrits:", recentDataError);
    }

    const stats = {
      total_inscrits: totalCount ?? 0,
      inscrits_confirmes: confirmedCount ?? 0,
      inscrits_non_confirmes: (totalCount ?? 0) - (confirmedCount ?? 0),
      inscrits_dernières_24h: recentCount ?? 0,
      taux_confirmation:
        totalCount && totalCount > 0
          ? Math.round(((confirmedCount ?? 0) / totalCount) * 100)
          : 0,
      derniers_inscrits: recentRegistrations ?? [],
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Statistiques récupérées avec succès",
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur inattendue GET webinaire stats:", error);
    const apiError: ApiError = {
      message: "Erreur interne du serveur",
      code: "INTERNAL_SERVER_ERROR",
    };
    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    );
  }
}