import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TABLES_ACADEMIA = [
  "projets", "depenses", "factures", "tva_par_periode",
  "formations", "blog_sujets", "posts_sociaux", "videos_marketing_index",
];
const TABLES_HEBREWPRO = [
  "parametres", "compagnons", "parcours", "posts_sociaux",
  "parrainages", "utilisateurs", "blog", "blog_traductions", "dedicaces",
];

async function exporter(url: string, cle: string, tables: string[]) {
  const sb = createClient(url, cle);
  const resultat: any = {};
  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select("*").limit(5000);
      resultat[t] = error ? { erreur: error.message } : data;
    } catch (e: any) {
      resultat[t] = { erreur: String(e?.message || e) };
    }
  }
  return resultat;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  try {
    const date = new Date().toISOString().slice(0, 10);

    const academia = await exporter(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      TABLES_ACADEMIA
    );

    let hebrewpro: any = { info: "cle HEBREWPRO_SERVICE_KEY absente" };
    if (process.env.HEBREWPRO_SUPABASE_URL && process.env.HEBREWPRO_SERVICE_KEY) {
      hebrewpro = await exporter(
        process.env.HEBREWPRO_SUPABASE_URL,
        process.env.HEBREWPRO_SERVICE_KEY,
        TABLES_HEBREWPRO
      );
    }

    const compter = (exp: any) => Object.keys(exp)
      .map(t => t + ": " + (Array.isArray(exp[t]) ? exp[t].length + " lignes" : "ERREUR ou info"))
      .join("<br>");

    const pj = (nom: string, objet: any) => ({
      filename: nom,
      content: Buffer.from(JSON.stringify(objet, null, 1)).toString("base64"),
    });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "AcademIA Backup <contact@hebrewproai.com>",
        to: ["contact@academiapro.fr"],
        subject: "Backup quotidien " + date + " - AcademIA + HebrewPro",
        html: "<h3>Backup du " + date + "</h3><p><b>AcademIA:</b><br>" + compter(academia)
          + "</p><p><b>HebrewPro:</b><br>" + compter(hebrewpro) + "</p>",
        attachments: [
          pj("backup_academia_" + date + ".json", academia),
          pj("backup_hebrewpro_" + date + ".json", hebrewpro),
        ],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: "Resend: " + txt.slice(0, 200) }, { status: 500 });
    }
    return NextResponse.json({ success: true, date });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
