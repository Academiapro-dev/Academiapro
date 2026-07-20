import { NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HD = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const f = u.searchParams.get("formation") || "";
  const t = u.searchParams.get("type") || "positionnement";
  const r = await fetch(URL + "/rest/v1/evaluations_questions?formation_slug=eq." + encodeURIComponent(f) + "&type=eq." + t + "&order=ordre.asc&select=id,ordre,question,options", { headers: HD, cache: "no-store" });
  const data = await r.json();
  return NextResponse.json({ questions: Array.isArray(data) ? data : [] });
}

export async function POST(req: Request) {
  const b = await req.json();
  const f = b.formation || ""; const t = b.type || "positionnement";
  const email = (b.email || "").toLowerCase().trim();
  const reponses = Array.isArray(b.reponses) ? b.reponses : [];
  if (!email || !f) return NextResponse.json({ erreur: "email et formation requis" }, { status: 400 });
  const rq = await fetch(URL + "/rest/v1/evaluations_questions?formation_slug=eq." + encodeURIComponent(f) + "&type=eq." + t + "&order=ordre.asc&select=bonne_reponse", { headers: HD, cache: "no-store" });
  const qs = await rq.json();
  if (!Array.isArray(qs) || qs.length === 0) return NextResponse.json({ erreur: "aucune question" }, { status: 404 });
  let score = 0;
  qs.forEach((q: any, i: number) => { if (reponses[i] === q.bonne_reponse) score++; });
  await fetch(URL + "/rest/v1/evaluations_reponses", { method: "POST", headers: { ...HD, Prefer: "return=minimal" }, body: JSON.stringify({ email, formation_slug: f, type: t, score, total: qs.length, reponses }) });
  return NextResponse.json({ score, total: qs.length });
}
