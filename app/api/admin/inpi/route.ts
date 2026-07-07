import { mesurer } from "../../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels du site
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const { email } = await req.json();

    // Générer le dossier complet via Claude
    const prompts = [
      {
        titre: "1. Analyse et Classes INPI",
        prompt: "Génère l analyse complète des classes INPI pour la marque AcadémIA Pro, plateforme de formation professionnelle 100% IA et bien-être thérapeutique. Classes recommandées avec justification détaillée."
      },
      {
        titre: "2. Description Officielle de la Marque",
        prompt: "Rédige la description officielle complète de la marque AcadémIA Pro pour dépôt INPI. Liste précise des produits et services par classe."
      },
      {
        titre: "3. Guide de Dépôt Étape par Étape",
        prompt: "Rédige le guide complet étape par étape pour déposer la marque AcadémIA Pro sur inpi.fr avec toutes les informations nécessaires."
      },
      {
        titre: "4. NDA Protection Avant Dépôt",
        prompt: "Génère le NDA complet pour protéger la marque AcadémIA Pro avant le dépôt INPI."
      },
    ];

    let dossierComplet = `DOSSIER PROTECTION MARQUE INPI
AcadémIA Pro — Jacques Lalou
Date : ${new Date().toLocaleDateString("fr-FR")}
Préparé par : Mr Juridique IA — AcadémIA Pro

${"=".repeat(60)}

`;

    for (const p of prompts) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: "Tu es Mr Juridique, juriste expert en propriété intellectuelle et droit des affaires français avec 20 ans d experience. Tu prépares le dossier INPI complet pour AcadémIA Pro de Jacques Lalou.",
          messages: [{ role: "user", content: p.prompt }],
        }),
      });
      const data = await res.json();
      mesurer("admin-inpi", data);
      const contenu = data?.content?.[0]?.text || "";
      dossierComplet += `${p.titre}
${"─".repeat(40)}
${contenu}

${"=".repeat(60)}

`;
    }

    // Envoyer par email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mr Juridique <contact@academiapro.fr>",
        to: [email || "contact@academiapro.fr"],
        subject: "🏛️ Dossier INPI Complet — Protection Marque AcadémIA Pro",
        html: `
<div style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;">
  <h1 style="color:#c8a96e;border-bottom:2px solid #c8a96e;padding-bottom:10px;">
    🏛️ Dossier Protection Marque INPI
  </h1>
  <p><strong>AcadémIA Pro — Jacques Lalou</strong></p>
  <p>Date : ${new Date().toLocaleDateString("fr-FR")}</p>
  <p>Préparé par : Mr Juridique IA</p>
  <hr style="border-color:#c8a96e;"/>
  
  <div style="background:#f8f4ee;padding:20px;border-radius:8px;margin:20px 0;">
    <h2 style="color:#c8a96e;">📋 Étapes à suivre</h2>
    <ol>
      <li>Lisez le dossier complet ci-dessous</li>
      <li>Connectez-vous sur <a href="https://www.inpi.fr">inpi.fr</a></li>
      <li>Créez votre compte INPI</li>
      <li>Déposez la marque AcadémIA Pro</li>
      <li>Payez : 190€ × 3 classes = <strong>570€</strong></li>
      <li>Suivez votre dossier pendant 6 mois</li>
    </ol>
  </div>

  <pre style="white-space:pre-wrap;font-family:Georgia,serif;font-size:14px;line-height:1.8;background:#fff;padding:20px;border:1px solid #eee;border-radius:8px;">
${dossierComplet}
  </pre>

  <div style="background:#fff8e7;border-left:4px solid #c8a96e;padding:15px;margin-top:20px;">
    <p><strong>⚠️ Note importante :</strong> Ce dossier est préparé par Mr Juridique IA à titre informatif. 
    Pour les décisions juridiques importantes, consultez un avocat spécialisé en propriété intellectuelle.</p>
  </div>

  <p style="color:#c8a96e;margin-top:30px;"><strong>AcadémIA Pro — Mr Juridique</strong></p>
</div>
        `,
      }),
    });

    if (emailRes.ok) {
      // Sauvegarder dans Supabase
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/documents_juridiques`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            type: "inpi_dossier",
            titre: "Dossier INPI Complet — AcadémIA Pro",
            contenu: dossierComplet,
            statut: "envoye",
          }),
        }
      );

      return NextResponse.json({
        success: true,
        message: `Dossier INPI complet envoyé à ${email || "contact@academiapro.fr"} ✅`
      });
    } else {
      return NextResponse.json({ success: false, message: "Erreur envoi email" }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Erreur génération dossier" }, { status: 500 });
  }
}
