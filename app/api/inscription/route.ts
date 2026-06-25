import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function generateManuel(formation: string, nom: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Tu es un expert pédagogique pour AcadémiA Pro.
Génère un manuel de formation complet et professionnel pour :
- Formation : ${formation}
- Apprenant : ${nom}

Structure obligatoire :
# Manuel de Formation — ${formation}
## Préparé spécialement pour : ${nom}

## Introduction
[Introduction motivante et personnalisée]

## Objectifs de la formation
[5 objectifs clairs et mesurables]

## Module 1 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Module 2 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Module 3 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Ressources complémentaires
[Livres, liens, outils recommandés]

## Message de fin
[Message encourageant signé Jacques Lalou]`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

async function sendEmailFelicitations(
  email: string,
  nom: string,
  formation: string,
  contenuManuel: string
): Promise<void> {
  const prenom = nom ? nom.split(" ")[0] : "cher apprenant";

  const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;border-bottom:2px solid #c8a96e;padding-bottom:20px;margin-bottom:30px;">
      <div style="font-size:28px;color:#c8a96e;font-weight:bold;letter-spacing:2px;">AcadémiA Pro</div>
      <div style="color:#888;font-size:14px;margin-top:5px;">L'excellence académique augmentée par l'IA</div>
    </div>
    <div style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a);border:1px solid #c8a96e;border-radius:12px;padding:30px;margin:20px 0;text-align:center;">
      <h1 style="color:#c8a96e;font-size:24px;margin:0 0 10px 0;">🎓 Félicitations ${prenom} !</h1>
      <p style="color:#ccc;">Votre manuel de formation personnalisé est prêt</p>
      <div style="background:#c8a96e;color:#0a0a0a;padding:8px 20px;border-radius:20px;font-weight:bold;display:inline-block;margin:15px 0;">${formation}</div>
    </div>
    <div style="background:#ffffff;color:#1a1a1a;border-left:3px solid #c8a96e;padding:32px;border-radius:8px;margin:20px 0;font-size:15px;line-height:1.9;white-space:pre-wrap;">
${contenuManuel}
    </div>
    <a href="https://academiapro.fr/espace-apprenant" style="display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin:30px 0;">
      👉 Accéder à mon Espace Apprenant
    </a>
    <div style="border-top:1px solid #333;padding-top:20px;color:#888;font-size:13px;">
      Avec toute ma fierté,<br/>
      <strong style="color:#c8a96e;">Jacques Lalou</strong><br/>
      Fondateur AcadémiA Pro<br/>
      contact@academiapro.fr
    </div>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: `🎓 ${prenom}, votre manuel "${formation}" est prêt !`,
      html: htmlEmail,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { nom, email, interet, source, formation } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requis" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Format email invalide" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, message: "Erreur serveur" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/liste_attente`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ nom, email, interet, source }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      if (err.includes("duplicate")) {
        return NextResponse.json(
          { success: false, message: "Email déjà inscrit" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Erreur inscription" },
        { status: 500 }
      );
    }

    const nomFormation = formation || interet || "Formation AcadémiA Pro";

    Promise.resolve().then(async () => {
      try {
        const contenuManuel = await generateManuel(nomFormation, nom || "");
        await sendEmailFelicitations(email, nom || "", nomFormation, contenuManuel);
        console.log(`✅ Manuel généré et envoyé à ${email}`);
      } catch (err) {
        console.error("Erreur génération manuel:", err);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Inscription confirmée ! Votre manuel arrive dans quelques instants.",
    });

  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function generateManuel(formation: string, nom: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Tu es un expert pédagogique pour AcadémiA Pro.
Génère un manuel de formation complet et professionnel pour :
- Formation : ${formation}
- Apprenant : ${nom}

Structure obligatoire :
# Manuel de Formation — ${formation}
## Préparé spécialement pour : ${nom}

## Introduction
[Introduction motivante et personnalisée]

## Objectifs de la formation
[5 objectifs clairs et mesurables]

## Module 1 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Module 2 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Module 3 — [Titre]
### Contenu
[Contenu détaillé]
### Exercices pratiques
[2-3 exercices]

## Ressources complémentaires
[Livres, liens, outils recommandés]

## Message de fin
[Message encourageant signé Jacques Lalou]`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

async function sendEmailFelicitations(
  email: string,
  nom: string,
  formation: string,
  contenuManuel: string
): Promise<void> {
  const prenom = nom ? nom.split(" ")[0] : "cher apprenant";

  const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;border-bottom:2px solid #c8a96e;padding-bottom:20px;margin-bottom:30px;">
      <div style="font-size:28px;color:#c8a96e;font-weight:bold;letter-spacing:2px;">AcadémiA Pro</div>
      <div style="color:#888;font-size:14px;margin-top:5px;">L'excellence académique augmentée par l'IA</div>
    </div>
    <div style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a);border:1px solid #c8a96e;border-radius:12px;padding:30px;margin:20px 0;text-align:center;">
      <h1 style="color:#c8a96e;font-size:24px;margin:0 0 10px 0;">🎓 Félicitations ${prenom} !</h1>
      <p style="color:#ccc;">Votre manuel de formation personnalisé est prêt</p>
      <div style="background:#c8a96e;color:#0a0a0a;padding:8px 20px;border-radius:20px;font-weight:bold;display:inline-block;margin:15px 0;">${formation}</div>
    </div>
    <div style="background:#ffffff;color:#1a1a1a;border-left:3px solid #c8a96e;padding:32px;border-radius:8px;margin:20px 0;font-size:15px;line-height:1.9;white-space:pre-wrap;">
${contenuManuel}
    </div>
    <a href="https://academiapro.fr/espace-apprenant" style="display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin:30px 0;">
      👉 Accéder à mon Espace Apprenant
    </a>
    <div style="border-top:1px solid #333;padding-top:20px;color:#888;font-size:13px;">
      Avec toute ma fierté,<br/>
      <strong style="color:#c8a96e;">Jacques Lalou</strong><br/>
      Fondateur AcadémiA Pro<br/>
      contact@academiapro.fr
    </div>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: `🎓 ${prenom}, votre manuel "${formation}" est prêt !`,
      html: htmlEmail,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { nom, email, interet, source, formation } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requis" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Format email invalide" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, message: "Erreur serveur" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/liste_attente`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ nom, email, interet, source }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      if (err.includes("duplicate")) {
        return NextResponse.json(
          { success: false, message: "Email déjà inscrit" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Erreur inscription" },
        { status: 500 }
      );
    }

    const nomFormation = formation || interet || "Formation AcadémiA Pro";

    Promise.resolve().then(async () => {
      try {
        const contenuManuel = await generateManuel(nomFormation, nom || "");
        await sendEmailFelicitations(email, nom || "", nomFormation, contenuManuel);
        console.log(`✅ Manuel généré et envoyé à ${email}`);
      } catch (err) {
        console.error("Erreur génération manuel:", err);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Inscription confirmée ! Votre manuel arrive dans quelques instants.",
    });

  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

