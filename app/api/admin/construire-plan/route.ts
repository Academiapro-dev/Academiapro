import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function reparerEncodage(s: string): string {
  let t = String(s || "");
  if (!/[\u00C3\u00CC\u00C2][\u0080-\u00BF]/.test(t)) return t;
  const propre = t.replace(/[^\u0000-\u00FF]/g, "");
  const octets = new Uint8Array(propre.length);
  for (let i = 0; i < propre.length; i++) {
    octets[i] = propre.charCodeAt(i) & 0xff;
  }
  try {
    return new TextDecoder("utf-8").decode(octets).normalize("NFC");
  } catch (e) {
    return t;
  }
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const executer = url.searchParams.get("executer") === "oui";

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: deja } = await supabase
      .from("lms_plans")
      .select("id")
      .eq("formation_code", code)
      .limit(1);

    if (deja && deja.length > 0) {
      return NextResponse.json({ ok: true, code: code, deja: true });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    if (!fichier) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun support pour cette formation" }, { status: 404 });
    }

    const brut = texteBrut(reparerEncodage((await fichier.text()).slice(0, 150000)));

    const titres: string[] = [];
    const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
    let m;
    while ((m = motif.exec(brut)) !== null) {
      const t = m[2].replace(/\s+/g, " ").trim();
      if (t && titres.indexOf(t) < 0) titres.push(t);
      if (titres.length >= 20) break;
    }

    if (titres.length < 4) {
      return NextResponse.json(
        { ok: false, code: code, erreur: "seulement " + titres.length + " modules lisibles dans le support" },
        { status: 422 }
      );
    }

    const titreFiche = reparerEncodage(String(fiche.titre || ""));

    const lignes: any[] = [];
    for (let i = 0; i < titres.length; i++) {
      const chapitre = Math.floor(i / 4) + 1;
      const position = (i % 4) + 1;
      const dernier = position === 4 || i === titres.length - 1;
      lignes.push({
        formation_code: code,
        chapitre_num: chapitre,
        chapitre_titre: titreFiche + " - Partie " + chapitre,
        module_num: position,
        module_titre: titres[i],
        type: dernier ? "evaluation" : (position === 3 ? "pratique" : "theorie"),
      });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - rien enregistre",
        code: code,
        nb_modules: lignes.length,
        plan: lignes,
        pour_executer: "/api/admin/construire-plan?code=" + code + "&executer=oui",
      });
    }

    const { error } = await supabase.from("lms_plans").insert(lignes);
    if (error) {
      return NextResponse.json({ ok: false, code: code, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mode: "EXECUTION", code: code, nb_modules: lignes.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
