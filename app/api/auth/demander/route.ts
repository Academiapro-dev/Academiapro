import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://academiapro.fr";
const EXPEDITEUR = "AcademIA Pro <contact@academiapro.fr>";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const cle = process.env.RESEND_API_KEY || "";
    if (!cle) {
      const noms = Object.keys(process.env).filter((k) => k.indexOf("RESEND") >= 0);
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY absente", variables_resend_vues: noms },
        { status: 500 }
      );
    }

    const corps = await req.json().catch(() => ({}));
    const email = String(corps.email || "").toLowerCase().trim();
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      return NextResponse.json({ success: false, error: "Adresse email invalide" }, { status: 400 });
    }

    await supabase
      .from("liens_magiques")
      .update({ utilise: true })
      .eq("email", email)
      .eq("utilise", false);

    const jeton = crypto.randomBytes(32).toString("base64url");
    const expire = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const { error: erreurInsert } = await supabase
      .from("liens_magiques")
      .insert({ email: email, jeton: jeton, expire_le: expire });

    if (erreurInsert) {
      return NextResponse.json({ success: false, error: erreurInsert.message }, { status: 500 });
    }

    const lien = SITE + "/api/auth/valider?jeton=" + encodeURIComponent(jeton);

    const resend = new Resend(cle);
    const envoi = await resend.emails.send({
      from: EXPEDITEUR,
      to: email,
      subject: "Votre lien de connexion AcademIA Pro",
      html:
        '<div style="font-family:Georgia,serif;background:#050508;color:#fff;padding:40px 20px">' +
        '<div style="max-width:520px;margin:0 auto;background:rgba(255,255,255,0.03);' +
        'border:1px solid rgba(200,169,110,0.3);border-radius:16px;padding:32px">' +
        '<h1 style="color:#c8a96e;font-size:22px;margin:0 0 18px">Votre connexion a AcademIA Pro</h1>' +
        '<p style="color:rgba(255,255,255,0.75);line-height:1.7;margin:0 0 24px">' +
        "Cliquez sur le bouton ci-dessous pour acceder a votre espace de formation. " +
        "Ce lien est valable 20 minutes et ne peut servir qu une seule fois.</p>" +
        '<p style="text-align:center;margin:0 0 24px">' +
        '<a href="' + lien + '" style="display:inline-block;background:#c8a96e;color:#050508;' +
        'padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Me connecter</a></p>' +
        '<p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:0">' +
        "Si vous n avez pas demande cette connexion, ignorez simplement cet email : " +
        "personne ne peut acceder a votre espace sans ce lien.</p>" +
        "</div></div>",
    });

    if ((envoi as any)?.error) {
      return NextResponse.json(
        { success: false, error: String((envoi as any).error?.message || (envoi as any).error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
