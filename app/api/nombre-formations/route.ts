import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET() {
  try {
    // Les ateliers, dont le code commence par SK, ne sont pas des formations.
    //
    // SEULES LES FORMATIONS ACTIVES SE COMPTENT — 30/08. Sans le filtre,
    // la route rendait 564 : les 560 actives PLUS 4 formations inactives,
    // que personne ne peut acheter. Le chiffre affiche sur la page
    // d accueil etait donc faux, et differait selon la langue parce que
    // le francais lisait une autre source. Mesure en base ce jour-la :
    // 560 actives, 4 inactives.
    const { count: formations } = await supabase
      .from("formations")
      .select("code", { count: "exact", head: true })
      .not("code", "like", "SK%")
      .eq("actif", true);

    const { count: ateliers } = await supabase
      .from("formations")
      .select("code", { count: "exact", head: true })
      .like("code", "SK%")
      .eq("actif", true);

    return NextResponse.json({
      success: true,
      total: formations || 0,
      ateliers: ateliers || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, erreur: String(e) }, { status: 500 });
  }
}
