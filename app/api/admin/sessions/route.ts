import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { verifierMdp } from "../securite/route";
import { limiter, ipDe } from "../../../../lib/limiteur";

async function autorise(req: NextRequest): Promise<boolean> {
  if (!(await verifierMdp(req.headers.get("x-mdp-compta") || ""))) return false;
  const o = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
  return o.includes("academiapro.fr") || o.includes("vercel.app") || o.includes("localhost");
}

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "sessions", 15, 600000)) { return NextResponse.json({ error: "Trop de tentatives, reessayez dans quelques minutes" }, { status: 429 }); }
  if (!(await autorise(req))) return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  try {
    const body = await req.json();
    const action = body.action || "";

    if (action === "lister_sessions") {
      const { data } = await supabase.from("agent_memories")
        .select("id,agent_id,session_label,created_at")
        .order("created_at", { ascending: false }).limit(100);
      return NextResponse.json({ sessions: data || [] });
    }

    if (action === "ouvrir_session") {
      const { data } = await supabase.from("agent_memories")
        .select("*").eq("id", body.id).single();
      return NextResponse.json({ session: data || null });
    }

    if (action === "supprimer_session") {
      const { error } = await supabase.from("agent_memories").delete().eq("id", body.id);
      return NextResponse.json({ success: !error });
    }

    if (action === "lister_fichiers") {
      const { data, error } = await supabase.storage.from("agent_documents")
        .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data) return NextResponse.json({ fichiers: [] });
      const noms = data.filter(f => f.name).map(f => f.name);
      const { data: signes } = await supabase.storage.from("agent_documents")
        .createSignedUrls(noms, 3600);
      const urls: any = {};
      (signes || []).forEach((s: any) => { if (s.path) urls[s.path] = s.signedUrl; });
      return NextResponse.json({
        fichiers: data.filter(f => f.name).map(f => ({
          nom: f.name,
          url: urls[f.name] || "",
          type: f.name.endsWith(".pdf") ? "pdf" : "image",
          agent: f.name.split("_")[0],
          date: (f as any).created_at || "",
        })),
      });
    }

    if (action === "supprimer_fichier") {
      const { error } = await supabase.storage.from("agent_documents").remove([body.nom]);
      return NextResponse.json({ success: !error });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
