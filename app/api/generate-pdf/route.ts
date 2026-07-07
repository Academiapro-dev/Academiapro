import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function generateContenu(formation: string, nom: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: "Tu es un expert pédagogique pour AcadémiA Pro. Génère un manuel de formation complet pour : " + formation + ". Apprenant : " + nom + ". Structure : Introduction, 5 Objectifs, Module 1, Module 2, Module 3, Ressources, Message final signé Jacques Lalou."
      }]
    }),
  });
  const data = await response.json();
  mesurer("generate-pdf", data);
  return data.content[0].text;
}

function genererHTML(formation: string, nom: string, contenu: string): string {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; background: #ffffff; color: #1a1a1a; margin: 0; padding: 0; }
  .couverture { background: #0a0a0a; color: #fff; padding: 80px 60px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .logo { font-size: 32px; color: #c8a96e; font-weight: bold; letter-spacing: 3px; margin-bottom: 8px; }
  .logo-sub { color: #888; font-size: 14px; margin-bottom: 80px; }
  .titre { font-size: 42px; line-height: 1.3; margin-bottom: 20px; }
  .badge { background: #c8a96e; color: #0a0a0a; padding: 10px 24px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 60px; }
  .apprenant { border-top: 1px solid #333; padding-top: 30px; }
  .apprenant-label { color: #888; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; }
  .apprenant-nom { color: #c8a96e; font-size: 24px; font-weight: bold; }
  .date { color: #666; font-size: 13px; margin-top: 8px; }
  .contenu { padding: 60px; }
  h1 { font-size: 26px; color: #c8a96e; margin: 40px 0 16px 0; border-bottom: 2px solid #c8a96e; padding-bottom: 8px; }
  h2 { font-size: 20px; color: #1a1a1a; margin: 28px 0 12px 0; }
  h3 { font-size: 17px; color: #c8a96e; margin: 20px 0 10px 0; }
  p { font-size: 15px; line-height: 1.9; text-align: justify; margin-bottom: 14px; }
  li { font-size: 15px; line-height: 1.8; margin-bottom: 6px; }
  .footer { text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding: 16px; margin-top: 40px; }
</style>
</head>
<body>
<div class="couverture">
  <div class="logo">AcadémiA Pro</div>
  <div class="logo-sub">L'excellence académique augmentée par l'IA</div>
  <div class="titre">Manuel de Formation</div>
  <div class="badge">${formation}</div>
  <div class="apprenant">
    <div class="apprenant-label">Préparé exclusivement pour</div>
    <div class="apprenant-nom">${nom}</div>
    <div class="date">Édition du ${date}</div>
  </div>
</div>
<div class="contenu">
${contenu.split("\n").map((line: string) => {
  if (line.startsWith("# ")) return "<h1>" + line.slice(2) + "</h1>";
  if (line.startsWith("## ")) return "<h2>" + line.slice(3) + "</h2>";
  if (line.startsWith("### ")) return "<h3>" + line.slice(4) + "</h3>";
  if (line.startsWith("- ")) return "<li>" + line.slice(2) + "</li>";
  if (line.trim() === "") return "<br/>";
  return "<p>" + line + "</p>";
}).join("")}
</div>
<div class="footer">AcadémiA Pro — Manuel de ${nom} — ${date} — contact@academiapro.fr</div>
</body>
</html>`;
}

async function verifierCache(formationId: string): Promise<string | null> {
  const fileName = "manuels/formation_" + formationId + ".html";
  const res = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/" + fileName,
    { method: "HEAD" }
  );
  if (res.ok) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/" + fileName;
  }
  return null;
}

async function sauvegarderCache(formationId: string, htmlContent: string): Promise<string> {
  const fileName = "manuels/formation_" + formationId + ".html";
  const res = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/" + fileName,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "text/html",
        "x-upsert": "true",
      },
      body: htmlContent,
    }
  );
  if (res.ok) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/" + fileName;
  }
  return "";
}

async function envoyerEmail(email: string, nom: string, formation: string, lien: string): Promise<void> {
  const prenom = nom ? nom.split(" ")[0] : "cher apprenant";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: "🎓 " + prenom + " — Votre manuel " + formation + " est prêt !",
      html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;padding:40px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;border-bottom:2px solid #c8a96e;padding-bottom:20px;margin-bottom:30px;">
    <div style="font-size:28px;color:#c8a96e;font-weight:bold;">AcadémiA Pro</div>
  </div>
  <div style="background:#1a1a1a;border:1px solid #c8a96e;border-radius:12px;padding:30px;text-align:center;margin-bottom:24px;">
    <div style="font-size:48px;margin-bottom:16px;">🎓</div>
    <h1 style="color:#c8a96e;font-size:24px;margin:0 0 12px 0;">Félicitations ${prenom} !</h1>
    <p style="color:#ccc;margin:0 0 16px 0;">Votre manuel personnalisé est prêt</p>
    <div style="background:#c8a96e;color:#0a0a0a;padding:8px 20px;border-radius:20px;font-weight:bold;display:inline-block;">${formation}</div>
  </div>
  <a href="${lien}" style="display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:16px;">📄 Télécharger mon Manuel PDF</a>
  <a href="https://academiapro.fr/espace-apprenant" style="display:block;border:1px solid #c8a96e;color:#c8a96e;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-size:15px;margin-bottom:30px;">👉 Accéder à mon Espace Apprenant</a>
  <div style="border-top:1px solid #333;padding-top:20px;color:#888;font-size:13px;">
    Avec toute ma fierté,<br/>
    <strong style="color:#c8a96e;">Jacques Lalou</strong><br/>
    Fondateur AcadémiA Pro
  </div>
</div>`,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { nom, email, formation, formation_id } = await req.json();

    if (!email || !formation) {
      return NextResponse.json({ success: false, message: "Données manquantes" }, { status: 400 });
    }

    const formationKey = formation_id || formation.toLowerCase().replace(/\s+/g, "-");

    // VÉRIFICATION CACHE
    console.log("Vérification cache pour :", formationKey);
    let lienManuel = await verifierCache(formationKey);

    if (lienManuel) {
      console.log("✅ Manuel trouvé en cache — réutilisation");
    } else {
      console.log("⚙️ Génération nouveau manuel...");
      const contenu = await generateContenu(formation, nom || "");
      const htmlContent = genererHTML(formation, nom || "", contenu);
      lienManuel = await sauvegarderCache(formationKey, htmlContent);
      console.log("✅ Manuel généré et mis en cache");
    }

    await envoyerEmail(email, nom || "", formation, lienManuel || "https://academiapro.fr/espace-apprenant");

    return NextResponse.json({
      success: true,
      message: "Manuel envoyé !",
      lien: lienManuel,
      cache: lienManuel !== null
    });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}