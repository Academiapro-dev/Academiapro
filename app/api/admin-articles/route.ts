import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ecran d administration des brouillons. Deux marques cohabitent dans la
// table blog : la marque est renvoyee avec chaque ligne, et le parametre
// marque= permet de n afficher que celles d une marque.

function clientSupa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }
  const supa = clientSupa();

  const marque = req.nextUrl.searchParams.get("marque");

  let requete = supa
    .from("blog")
    .select("id, titre, extrait, contenu, categorie, marque, created_at")
    .eq("publie", false);

  if (marque) {
    requete = requete.eq("marque", marque);
  }

  const { data } = await requete
    .order("created_at", { ascending: false });

  return NextResponse.json({ brouillons: data || [] });
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }
  const { action, id } = await req.json();
  const supa = clientSupa();
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
