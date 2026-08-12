import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Traduction automatique du blog : appelee par le cron
// Vercel chaque nuit. Detecte les articles publies sans
// traduction EN/ES et les traduit via Claude, une seule
// fois chacun (flux tendu).
//
// SEUL LE BLOG ACADEMIA PRO EST TRADUIT. Les articles
// Mr. Comptable visent les cabinets francais : la reforme
// de la facture electronique n a pas de sens hors de France.

export const maxDuration = 300;

const LANGUES: Record<string, string> = {
  en: "English",
  es: "Spanish",
};

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

async function claude(prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  return data?.content?.[0]?.text || "";
}

async function traduire(article: any, code: string,
  nom: string) {
  const prompt =
    "You are translating a French blog article into " + nom
    + " for SEO purposes.\n"
    + "Return ONLY a JSON object, no markdown fences, with"
    + " exactly these keys: slug (URL-friendly, lowercase,"
    + " hyphens, translated keywords), titre, extrait,"
    + " contenu (PRESERVE formatting: ## stays ##, **bold**"
    + " stays **bold**, line breaks preserved), meta_titre"
    + " (max 60 chars), meta_description (max 155 chars).\n\n"
    + "FRENCH ARTICLE:\ntitre: " + (article.titre || "")
    + "\nextrait: " + (article.extrait || "")
    + "\ncontenu:\n" + (article.contenu || "");
  let brut = (await claude(prompt)).trim();
  if (brut.startsWith("```")) {
    brut = brut.split("```")[1] || brut;
    if (brut.startsWith("json")) brut = brut.slice(4);
  }
  return JSON.parse(brut);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  const supa = clientAdmin();
  const { data: articles } = await supa
    .from("blog")
    .select("id, titre, slug, extrait, contenu")
    .eq("publie", true)
    .eq("marque", "academiapro");
  const { data: existantes } = await supa
    .from("blog_traductions")
    .select("article_id, langue");

  const deja = new Set(
    (existantes || []).map((e) => e.article_id + ":" + e.langue));

  const resultats: string[] = [];
  for (const article of (articles || [])) {
    for (const [code, nom] of Object.entries(LANGUES)) {
      if (deja.has(article.id + ":" + code)) continue;
      try {
        const t = await traduire(article, code, nom);
        if (!t.slug || !t.titre || !t.contenu) {
          resultats.push(article.id + ":" + code
            + " ECHEC cles manquantes");
          continue;
        }
        await supa.from("blog_traductions").insert({
          article_id: article.id,
          langue: code,
          slug: t.slug,
          titre: t.titre,
          extrait: t.extrait || "",
          contenu: t.contenu,
          meta_titre: t.meta_titre || t.titre.slice(0, 60),
          meta_description: t.meta_description || "",
        });
        resultats.push(article.id + ":" + code + " OK");
      } catch (e) {
        resultats.push(article.id + ":" + code + " ECHEC");
      }
    }
  }

  return NextResponse.json({
    traites: resultats.length,
    details: resultats,
  });
}
