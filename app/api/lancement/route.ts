import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const o = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    if (!o.includes("academiapro.fr") && !o.includes("hebrewproai.com") && !o.includes("vercel.app") && !o.includes("localhost")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const nom = String(body.nom || "").slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const projet = body.projet === "hebrewpro" ? "hebrewpro" : "academia";

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const { error } = await supabase.from("liste_attente").insert({
      nom: nom || null, email, projet,
      interet: "lancement", source: "page_lancement",
    });

    if (error) {
      if (String(error.message).includes("duplicate") || String(error.code) === "23505") {
        return NextResponse.json({ success: true, deja: true });
      }
      return NextResponse.json({ error: "Erreur enregistrement" }, { status: 500 });
    }

    // Email de confirmation (non bloquant)
    const estHebrew = projet === "hebrewpro";
    const nomMarque = estHebrew ? "HebrewPro AI" : "AcademIA Pro";
    const bonjour = nom ? "Bonjour " + nom + "," : "Bonjour,";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: nomMarque + " <contact@hebrewproai.com>",
          to: [email],
          subject: "Votre place est reservee - " + nomMarque,
          html: "<p>" + bonjour + "</p>"
            + "<p>Votre inscription a la liste de lancement de <b>" + nomMarque + "</b> est confirmee.</p>"
            + "<p>En tant que membre fondateur, vous beneficierez de <b>l offre Founders : -50%</b> sur votre premiere commande, reservee aux inscrits de cette liste.</p>"
            + "<p>Vous serez averti(e) en priorite des l ouverture.</p>"
            + "<p>A tres vite,<br>L equipe " + nomMarque + "</p>",
        }),
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
