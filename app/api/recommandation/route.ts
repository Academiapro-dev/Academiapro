import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email requis" }, { status: 400 });
    }

    const { data: formationsSuivies } = await supabase
      .from("formations_lms_acces")
      .select("formation_code")
      .eq("email", email);

    const codesActuels = (formationsSuivies || []).map((f: any) => f.formation_code);

    const { data: toutesFormations } = await supabase
      .from("formations")
      .select("code, titre, domaine, prix")
      .limit(50);

    if (!toutesFormations || toutesFormations.length === 0) {
      return NextResponse.json({ success: true, recommandations: [] });
    }

    const disponibles = toutesFormations.filter((f: any) => !codesActuels.includes(f.code));

    const domainesActuels = toutesFormations
      .filter((f: any) => codesActuels.includes(f.code))
      .map((f: any) => f.domaine)
      .filter(Boolean);

    let recommandations = disponibles;
    if (domainesActuels.length > 0) {
      const memeLDomaine = disponibles.filter((f: any) => domainesActuels.includes(f.domaine));
      if (memeLDomaine.length >= 3) {
        recommandations = memeLDomaine;
      }
    }

    const top3 = recommandations.slice(0, 3);

    return NextResponse.json({ success: true, recommandations: top3 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}