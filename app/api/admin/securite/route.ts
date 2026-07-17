import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hacher(mdp: string, sel: string): string {
  return crypto.createHash("sha256").update(mdp + sel).digest("hex");
}

export async function verifierMdp(mdp: string): Promise<boolean> {
  if (!mdp) return false;
  const { data } = await supabase.from("parametres_securite")
    .select("hash, sel").eq("cle", "mdp_admin").single();
  if (!data) return false;
  return hacher(mdp, data.sel) === data.hash;
}

export async function POST(req: NextRequest) {
  try {
    const o = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    if (!o.includes("academiapro.fr") && !o.includes("vercel.app") && !o.includes("localhost")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const body = await req.json();

    if (body.action === "changer_mdp") {
      const ancien = String(body.ancien || "");
      const nouveau = String(body.nouveau || "");
      if (!(await verifierMdp(ancien))) {
        return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 401 });
      }
      if (nouveau.length < 8) {
        return NextResponse.json({ error: "8 caracteres minimum" }, { status: 400 });
      }
      const sel = crypto.randomBytes(16).toString("hex");
      const { error } = await supabase.from("parametres_securite")
        .update({ hash: hacher(nouveau, sel), sel, modifie_le: new Date().toISOString() })
        .eq("cle", "mdp_admin");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
