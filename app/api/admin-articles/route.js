import { NextResponse } from "next/server";
import { clientAdmin } from "@/lib/supabase";

export async function GET(req) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }
  const supa = clientAdmin();
  const { data } = await supa
    .from("blog")
    .select("id, titre, extrait, contenu, categorie, created_at")
    .eq("publie", false)
    .order("created_at", { ascending: false });
  return NextResponse.json({ brouillons: data || [] });
}

export async function POST(req) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }
  const { action, id } = await req.json();
  const supa = clientAdmin();
  if (action === "publier") {
    await supa.from("blog")
      .update({ publie: true }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (action === "refuser") {
    await supa.from("blog")
      .delete().eq("id", id).eq("publie", false);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { erreur: "action inconnue" }, { status: 400 });
}
