import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

async function generateContenu(formation: string, nom: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Tu es un expert pédagogique pour AcadémiA Pro.
Génère un manuel de formation complet et professionnel pour :
- Formation : ${formation}
- Apprenant : ${nom}

Structure obligatoire :
# Manuel de Formation — ${formation}
## Préparé spécialement pour : ${nom}
## Introduction
## Objectifs de la formation (5 objectifs)
## Module 1 — Titre + Contenu + Exercices pratiques
## Module 2 — Titre + Contenu + Exercices pratiques
## Module 3 — Titre + Contenu + Exercices pratiques
## Ressources complémentaires
## Message final signé Jacques Lalou, Fondateur AcadémiA Pro`
    }]
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

function genererHTMLPDF(formation: string, nom: string, contenu: string): string {
  const prenom = nom ? nom.split(" ")[0] : "Apprenant";
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; background: #ffffff; color: #1a1a1a; }
  
  .couverture {
    background: #0a0a0a;
    color: #ffffff;
    padding: 80px 60px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
  }
  .logo { font-size: 32px; color: #c8a96e; font-weight: bold; letter-spacing: 3px; margin-bottom: 8px; }
  .logo-sub { color: #888; font-size: 14px; letter-spacing: 2px; margin-bottom: 80px; }
  .titre-manuel { font-size: 42px; color: #ffffff; line-height: 1.3; margin-bottom: 20px; }
  .formation-badge { background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block; margin-bottom: 60px; }
  .apprenant-info { border-top: 1px solid #333; padding-top: 30px; }
  .apprenant-label { color: #888; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .apprenant-nom { color: #c8a96e; font-size: 24px; font-weight: bold; }
  .date-edition { color: #666; font-size: 13px; margin-top: 8px; }
  
  .contenu { padding: 60px; background: #ffffff; }
  h1 { font-size: 28px; color: #c8a96e; margin: 40px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #c8a96e; }
  h2 { font-size: 22px; color: #1a1a1a; margin: 32px 0 16px 0; }
  h3 { font-size: 18px; color: #c8a96e; margin: 24px 0 12px 0; }
  p { font-size: 15px; line-height: 1.9; color: #1a1a1a; text-align: justify; margin-bottom: 16px; }
  ul, ol { padding-left: 24px; margin-bottom: 16px; }
  li { font-size: 15px; line-height: 1.8; color: #1a1a1a; margin-bottom: 6px; }
  
  .module-box { background: #f8f4ee; border-left: 4px solid #c8a96e; padding: 24px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  
  .footer-page { 
    position: fixed; bottom: 20px; left: 0; right: 0;
    text-align: center; font-size: 11px; color: #999;
    border-top: 1px solid #eee; padding-top: 10px;
  }
  
  @media print {
    .couverture { page-break-after: always; }
    h1 { page-break-before: auto; }
  }
</style>
</head>
<body>

<div class="couverture">
  <div class="logo">AcadémiA Pro</div>
  <div class="logo-sub">L'excellence académique augmentée par l'IA</div>
  <div class="titre-manuel">Manuel de<br/>Formation</div>
  <div class="formation-badge">${formation}</div>
  <div class="apprenant-info">
    <div class="apprenant-label">Préparé exclusivement pour</div>
    <div class="apprenant-nom">${nom}</div>
    <div class="date-edition">Édition du ${date}</div>
  </div>
</div>

<div class="contenu">
${contenu.split("\n").map(line => {
  if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
  if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
  if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
  if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
  if (line.trim() === "") return "<br/>";
  return `<p>${line}</p>`;
}).join("\n")}
</div>

<div class="footer-page">
  AcadémiA Pro — Manuel personnel de ${prenom} — ${date} — contact@academiapro.fr
</div>

</body>
</html>`;
}

async function sauvegarderSupabase(userId: string, formationId: string, htmlContent: string): Promise<string> {
  const fileName = `manuels/${userId}_${formationId}_${Date.now()}.html`;
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${fileName}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "text/html",
      },
      body: htmlContent,
    }
  );
  
  if (res.ok) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${fileName}`;
  }
  return "";
}

async function envoyerEmailAvecPDF(
  email: string, nom: string, formation: string, 
  htmlContent: string, lienManuel: string
): Promise<void> {
  const prenom = nom ? nom.split(" ")[0] : "cher apprenant";
  
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: `🎓 ${prenom} — Votre manuel "${formation}" est prêt !`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;margin:0;padding:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;border-bottom:2px solid #c8a96e;padding-bottom:20px;margin-bottom:30px;">
    <div style="font-size:28px;color:#c8a96e;font-weight:bold;letter-spacing:2px;">AcadémiA Pro</div>
    <div style="color:#888;font-size:13px;margin-top:4px;">L'excellence académique augmentée par l'IA</div>
  </div>
  <div style="background:#1a1a1a;border:1px solid #c8a96e;border-radius:12px;padding:30px;text-align:center;margin-bottom:24px;">
    <div style="font-size:48px;margin-bottom:16px;">🎓</div>
    <h1 style="color:#c8a96e;font-size:24px;margin:0 0 12px 0;">Félicitations ${prenom} !</h1>
    <p style="color:#ccc;margin:0 0 16px 0;">Votre manuel de formation personnalisé vient d'être généré</p>
    <div style="background:#c8a96e;color:#0a0a0a;padding:8px 20px;border-radius:20px;font-weight:bold;display:inline-block;">${formation}</div>
  </div>
  <p style="color:#ccc;line-height:1.8;margin-bottom:24px;">
    Votre manuel a été créé <strong style="color:#c8a96e;">spécialement pour vous</strong>, 
    à la minute de votre inscription. Il contient le programme complet, 
    les exercices pratiques et toutes les ressources dont vous avez besoin.
  </p>
  <a href="${lienManuel}" style="display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:16px;">
    📄 Télécharger mon Manuel PDF
  </a>
  <a href="https://academiapro.fr/espace-apprenant" style="display:block;background:transparent;border:1px solid #c8a96e;color:#c8a96e;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-size:15px;margin-bottom:30px;">
    👉 Accéder à mon Espace Apprenant
  </a>
  <div style="border-top:1px solid #333;padding-top:20px;color:#888;font-size:13px;">
    Avec toute ma fierté,<br/>
    <strong style="color:#c8a96e;">Jacques Lalou</strong><br/>
    Fondateur AcadémiA Pro<br/>
    contact@academiapro.fr
  </div>
</div>
</body>
</html>`,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { nom, email, formation, formation_id, user_id } = await req.json();

    if (!email || !formation) {
      return NextResponse.json({ success: false, message: "Données manquantes" }, { status: 400 });
    }

    const contenu = await generateContenu(formation, nom || "");
    const htmlPDF = genererHTMLPDF(formation, nom || "", contenu);
    const lienManuel = await sauvegarderSupabase(user_id || "guest", formation_id || "0", htmlPDF);

    await envoyerEmailAvecPDF(email, nom || "", formation, htmlPDF, lienManuel);

    return NextResponse.json({ 
      success: true, 
      message: "Manuel PDF généré et envoyé !",
      lien: lienManuel
    });

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}