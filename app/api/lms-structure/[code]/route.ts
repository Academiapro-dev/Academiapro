import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  const code = params.code?.toUpperCase();
  const lang = req.nextUrl.searchParams.get("lang") || "fr";

  const { data: lms } = await supabase
    .from("formations_lms")
    .select("contenu")
    .eq("formation_code", code)
    .limit(1);

  if (!lms || lms.length === 0) {
    return NextResponse.json({ chapitres: [] });
  }

  const contenu = lms[0].contenu;
  let chapitres = contenu?.chapitres || [];

  // Normaliser la structure — chaque chapitre doit avoir numero, titre, modules[]
  chapitres = chapitres.map((ch, idx) => {
    const modules = (ch.modules || []).map((mod, midx) => ({
      numero: mod.numero || midx + 1,
      titre: mod.titre || ("Module " + (midx + 1)),
      type: mod.type || "theorie",
    }));
    return {
      numero: ch.numero || idx + 1,
      titre: ch.titre || ("Chapitre " + (idx + 1)),
      modules,
    };
  });

  // Si langue != fr, traduire les titres via lms_cache si disponible
  if (lang !== "fr") {
    for (const ch of chapitres) {
      for (const mod of ch.modules) {
        const cache_key = code + "_ch" + ch.numero + "_mod" + mod.numero + "_" + lang;
        const { data: cache } = await supabase
          .from("lms_cache")
          .select("contenu")
          .eq("cache_key", cache_key)
          .limit(1);
        // Le titre traduit est dans le premier heading du contenu cache
        if (cache && cache.length > 0 && cache[0].contenu) {
          const firstHeading = cache[0].contenu
            .split("\n")
            .find(l => l.trim().startsWith("#"));
          if (firstHeading) {
            mod.titre = firstHeading.replace(/^#+\s*/, "").trim().substring(0, 80);
          }
        }
      }
    }
  }

  const formateur = contenu?.formateur || contenu?.meta?.expert || null;
  const coach = contenu?.coach || null;
  const expert_titre = contenu?.meta?.expert_titre || null;

  return NextResponse.json({ chapitres, code, langue: lang, formateur, coach, expert_titre });
}