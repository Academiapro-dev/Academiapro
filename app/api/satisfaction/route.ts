import { NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json();
  const email = (b.email || "").toLowerCase().trim();
  if (!email || !b.formation) return NextResponse.json({ erreur: "email et formation requis" }, { status: 400 });
  const r = await fetch(URL + "/rest/v1/satisfaction_chaud", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ email, formation_slug: b.formation, note_globale: b.note_globale, note_contenu: b.note_contenu, note_animation: b.note_animation, note_utilite: b.note_utilite, recommande: b.recommande, commentaire: b.commentaire || "" }) });
  if (!r.ok) return NextResponse.json({ erreur: "enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
