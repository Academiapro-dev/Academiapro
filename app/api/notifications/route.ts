import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function supabase(endpoint: string, method: string, body?: object) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function envoyerEmailNotification(
  email: string,
  prenom: string,
  titre: string,
  message: string,
  lien: string
): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "AcadémiA Pro <contact@academiapro.fr>",
      to: [email],
      subject: "🔔 " + titre,
      html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f5f5f5;padding:40px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;border-bottom:2px solid #c8a96e;padding-bottom:20px;margin-bottom:30px;">
    <div style="font-size:28px;color:#c8a96e;font-weight:bold;">AcadémiA Pro</div>
  </div>
  <div style="background:#1a1a1a;border:1px solid #c8a96e;border-radius:12px;padding:30px;margin-bottom:24px;">
    <div style="font-size:32px;margin-bottom:16px;text-align:center;">🔔</div>
    <h1 style="color:#c8a96e;font-size:22px;margin:0 0 12px 0;text-align:center;">${titre}</h1>
    <p style="color:#ccc;line-height:1.8;text-align:center;margin:0;">${message}</p>
  </div>
  <a href="${lien}" style="display:block;background:#c8a96e;color:#0a0a0a;text-align:center;padding:16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:30px;">
    👉 Accéder maintenant
  </a>
  <div style="border-top:1px solid #333;padding-top:20px;color:#888;font-size:13px;text-align:center;">
    <strong style="color:#c8a96e;">AcadémiA Pro</strong> — contact@academiapro.fr
  </div>
</div>`,
    }),
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, message: "user_id requis" }, { status: 400 });
    }

    const notifications = await supabase(
      "notifications?user_id=eq." + userId + "&order=created_at.desc&limit=20",
      "GET"
    );

    const nonLues = notifications.filter((n: { lu: boolean }) => !n.lu).length;

    return NextResponse.json({
      success: true,
      notifications,
      nonLues,
    });

  } catch (error) {
    console.error("Erreur GET notifications:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, user_id, email, prenom, formation, module, lien } = await req.json();

    if (!type || !user_id) {
      return NextResponse.json({ success: false, message: "Données manquantes" }, { status: 400 });
    }

    let titre = "";
    let message = "";
    let lienNotif = lien || "https://academiapro.fr/espace-apprenant";
    let emoji = "🔔";

    switch (type) {
      case "nouveau_module":
        emoji = "📚";
        titre = "Nouveau module disponible !";
        message = "Le module " + module + " de votre formation " + formation + " est maintenant disponible.";
        lienNotif = lien || "https://academiapro.fr/lms";
        break;

      case "rappel_formation":
        emoji = "⏰";
        titre = "Votre formation vous attend " + (prenom || "") + " !";
        message = "Vous n'avez pas encore terminé " + formation + ". Reprenez là où vous en étiez !";
        lienNotif = lien || "https://academiapro.fr/lms";
        break;

      case "classe_virtuelle":
        emoji = "🎓";
        titre = "Classe virtuelle dans 1 heure !";
        message = "Votre classe virtuelle " + formation + " commence dans 1 heure. Préparez-vous !";
        lienNotif = lien || "https://academiapro.fr/classe-virtuelle";
        break;

      case "certificat":
        emoji = "🏆";
        titre = "Félicitations " + (prenom || "") + " — Certificat disponible !";
        message = "Vous avez terminé " + formation + ". Votre certificat est prêt à être téléchargé !";
        lienNotif = lien || "https://academiapro.fr/certificats";
        break;

      case "bienvenue":
        emoji = "👋";
        titre = "Bienvenue sur AcadémiA Pro " + (prenom || "") + " !";
        message = "Votre compte est activé. Découvrez vos formations et commencez votre parcours dès maintenant.";
        lienNotif = lien || "https://academiapro.fr/espace-apprenant";
        break;

      case "manuel_pret":
        emoji = "📖";
        titre = "Votre manuel est prêt !";
        message = "Le manuel de formation " + formation + " vient d'être généré spécialement pour vous.";
        lienNotif = lien || "https://academiapro.fr/espace-apprenant";
        break;

      default:
        emoji = "🔔";
        titre = "Notification AcadémiA Pro";
        message = "Vous avez une nouvelle notification.";
    }

    const notificationComplete = emoji + " " + titre;

    await supabase("notifications", "POST", {
      user_id,
      type,
      titre: notificationComplete,
      message,
      lien: lienNotif,
      lu: false,
      created_at: new Date().toISOString(),
    });

    if (email) {
      envoyerEmailNotification(
        email,
        prenom || "",
        notificationComplete,
        message,
        lienNotif
      ).catch(err => console.error("Email notif error:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Notification envoyée !",
      notification: {
        titre: notificationComplete,
        message,
        lien: lienNotif,
      }
    });

  } catch (error) {
    console.error("Erreur POST notifications:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { notification_id, user_id } = await req.json();

    if (notification_id) {
      await supabase(
        "notifications?id=eq." + notification_id,
        "PATCH",
        { lu: true }
      );
    } else if (user_id) {
      await supabase(
        "notifications?user_id=eq." + user_id,
        "PATCH",
        { lu: true }
      );
    }

    return NextResponse.json({ success: true, message: "Notification(s) marquée(s) comme lue(s)" });

  } catch (error) {
    console.error("Erreur PATCH notifications:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}