import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Lecture seule des chiffres comptables, reservee a l administrateur.
// La saisie reste sur /admin/comptabilite, qui a sa propre protection.
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

export async function GET() {
  const session = sessionCourante();

  if (!session || !session.email || ADMINS.indexOf(session.email) < 0) {
    return NextResponse.json({ ok: false, erreur: "Accès refusé." }, { status: 403 });
  }

  const { data: factures } = await supabase
    .from("factures")
    .select("*")
    .order("numero", { ascending: false })
    .limit(2000);

  const { data: depenses } = await supabase
    .from("depenses")
    .select("*")
    .order("date_depense", { ascending: false })
    .limit(2000);

  return NextResponse.json({
    ok: true,
    factures: factures || [],
    depenses: depenses || [],
  });
}
