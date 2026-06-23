import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const code = params.id.toUpperCase();
  const lang = req.nextUrl.searchParams.get("lang") || "fr";

  // 1 — Recuperer la formation de base
  const { data: formations, error } = await supabase
    .from("formations")
    .select("*")
    .eq("code", code)
    .limit(1);

  if (error || !formations || formations.length === 0) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  const formation = formations[0];

  // 2 — Si langue != fr, chercher la traduction
  if (lang !== "fr") {
    const { data: traductions } = await supabase
      .from("formations_traductions")
      .select("titre, description, objectifs, prerequis, public_cible, programme, contenu_html")
      .eq("code", code)
      .eq("langue", lang)
      .limit(1);

    if (traductions && traductions.length > 0) {
      const t = traductions[0];
      // Fusionner — les champs traduits remplacent les champs francais
      return NextResponse.json({
        ...formation,
        titre: t.titre || formation.titre,
        description: t.description || formation.description,
        objectifs: t.objectifs || formation.objectifs,
        prerequis: t.prerequis || formation.prerequis,
        public_cible: t.public_cible || formation.public_cible,
        programme: t.programme || formation.programme,
        langue: lang,
      });
    }
  }

  // 3 — Retourner le francais par defaut
  return NextResponse.json({ ...formation, langue: "fr" });
}
