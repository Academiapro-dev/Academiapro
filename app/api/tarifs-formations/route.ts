import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    // LA DUREE EST DESORMAIS RENVOYEE : la page Tarifs en a besoin pour
    // masquer les formules de classe virtuelle sur les formations courtes,
    // comme le fait deja la fiche formation.
    const { data, error } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .order("domaine", { ascending: true })
      .order("prix", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, formations: [], error: error.message },
        { status: 500 }
      );
    }

    // Les ateliers (codes SK) ont leur propre page et un prix fixe :
    // la grille des cinq paliers de la page Tarifs ne s'applique pas a eux.
    const formations = (data || []).filter(
      (f: any) => String(f.code || "").toUpperCase().indexOf("SK") !== 0
    );

    return NextResponse.json({ success: true, formations: formations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, formations: [], error: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
