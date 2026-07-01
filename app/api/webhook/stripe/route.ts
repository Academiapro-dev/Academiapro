import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

async function envoyerEmailBienvenue(email: string, nom: string, formationTitre: string, lmsCode: string, pdfUrl: string) {
  const htmlBody = "<h1>Bienvenue " + nom + " !</h1>" +
    "<p>Votre formation <strong>" + formationTitre + "</strong> est prete.</p>" +
    "<p><a href=\"https://academiapro.fr/lms/" + lmsCode + "\">Acceder a votre formation</a></p>" +
    "<p><a href=\"" + pdfUrl + "\">Telecharger votre manuel PDF</a></p>" +
    "<p>Bienvenue chez AcademIA Pro !</p>";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcademIA Pro <bienvenue@academiapro.fr>",
        to: email,
        subject: "Bienvenue sur AcademIA Pro",
        html: htmlBody,
      }),
    });
  } catch (e) {
    console.error("Erreur envoi email bienvenue:", e);
  }
}
async function genererPdfManuel(formationCode: string, formationTitre: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
    const res = await fetch(baseUrl + "/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: formationCode, titre: formationTitre }),
    });
    const data = await res.json();
    return data.pdf_url || null;
  } catch (e) {
    console.error("Erreur generation PDF:", e);
    return null;
  }
}

async function activerAccesLMS(email: string, formationCode: string, formationTitre: string) {
  try {
    await supabase.from("formations_lms").insert({
      email,
      formation_code: formationCode,
      formation_titre: formationTitre,
      date_achat: new Date().toISOString(),
      statut: "actif",
    });
  } catch (e) {
    console.error("Erreur activation LMS:", e);
  }
}

async function crediterSeancesAudio(email: string, secondes: number) {
  try {
    await supabase.from("credits_seances").insert({
      user_email: email,
      secondes_restantes: secondes,
      type_seance: "audio",
    });
  } catch (e) {
    console.error("Erreur credit seances:", e);
  }
}