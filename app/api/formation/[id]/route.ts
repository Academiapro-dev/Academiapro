import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const langue = req.nextUrl.searchParams.get("lang") || "fr";

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const h = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  // Chercher la formation originale
  const resF = await fetch(
    `${SUPABASE_URL}/rest/v1/formations?code=eq.${id}&select=*`,
    { headers: h }
  );
  const formations = await resF.json();
  const formation = formations[0];

  if (!formation) {
    return NextResponse.json({ error: "Formation non trouvee" }, { status: 404 });
  }

  // Si langue FR retourner directement
  if (langue === "fr") {
    return NextResponse.json({ ...formation, langue: "fr", traduit: false });
  }

  // Chercher la traduction
  const resT = await fetch(
    `${SUPABASE_URL}/rest/v1/formations_traductions?code=eq.${id}&langue=eq.${langue}&select=*`,
    { headers: h }
  );
  const traductions = await resT.json();
  const traduction = traductions[0];

  if (traduction) {
    return NextResponse.json({
      ...formation,
      titre: traduction.titre || formation.titre,
      description: traduction.description || formation.description,
      objectifs: traduction.objectifs || formation.objectifs,
      prerequis: traduction.prerequis || formation.prerequis,
      public_cible: traduction.public_cible || formation.public_cible,
      langue,
      traduit: true,
    });
  }

  // Pas de traduction — retourner original
  return NextResponse.json({ ...formation, langue: "fr", traduit: false });
}
