import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function reparerAccents(s: string): string {
  let t = String(s || "");
  t = t.replace(/([A-Za-z])\u00CC([\u0080-\u00BF])/g, function (tout, lettre, marque) {
    try {
      return (lettre + String.fromCharCode(0x0300 + (marque.charCodeAt(0) - 0x80))).normalize("NFC");
    } catch (e) {
      return lettre;
    }
  });
  t = t.replace(/[\u0080-\u009F]/g, "");
  try { t = t.normalize("NFC"); } catch (e) {}
  return t;
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

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const { data: marqueurs } = await supabase
      .from("lms_plans")
      .select("formation_code")
      .eq("chapitre_num", 0)
      .order("formation_code", { ascending: true });

    const codes = (marqueurs || []).map((m: any) => m.formation_code);

    if (codes.length === 0) {
      return NextResponse.json({ ok: true, termine: true, restants: 0 });
    }

    const code = codes[0];

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      await supabase.from("lms_plans").delete().eq("formation_code", code).eq("chapitre_num", 0);
      return NextResponse.json({ ok: true, code: code, ignore: true, restants: codes.length - 1 });
    }

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    const extrait = fichier
      ? reparerAccents(texteBrut((await fichier.text()).slice(0, 60000))).slice(0, 12000)
      : "";

    const invite =
      "Voici le support de cours d une formation professionnelle.\n\n" +
      "Formation : " + fiche.titre + "\n" +
      "Domaine : " + (fiche.domaine || "non precise") + "\n" +
      "Niveau : " + (fiche.niveau || "non precise") + "\n\n" +
      "Extrait du support :\n" + (extrait || "(support indisponible)") + "\n\n" +
      "Construis le plan pedagogique de cette formation : EXACTEMENT 5 chapitres de 4 modules chacun, soit 20 modules.\n" +
      "Le dernier module de chaque chapitre est de type evaluation. Dans chaque chapitre, le troisieme module est de type pratique, les autres de type theorie.\n" +
      "Reponds UNIQUEMENT par un tableau JSON, sans commentaire, sans balises, au format exact :\n" +
      "[{\"chapitre\":1,\"titre_chapitre\":\"...\",\"module\":1,\"titre_module\":\"...\",\"type\":\"theorie\"}, ...]\n" +
      "Les titres sont en francais, precis, sans numerotation repetee, sans mention de certification, sans prix.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 4000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!r.ok) {
      return NextResponse.json({ ok: false, code: code, erreur: "Claude a repondu " + r.status }, { status: 500 });
    }

    const reponse = await r.json();
    let texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    texte = texte.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let plan: any[] = [];
    try {
      plan = JSON.parse(texte);
    } catch (e) {
      return NextResponse.json({ ok: false, code: code, erreur: "reponse illisible de Claude" }, { status: 500 });
    }

    const lignes = (plan || [])
      .filter((l: any) => l && l.chapitre && l.module && l.titre_module)
      .slice(0, 20)
      .map((l: any) => ({
        formation_code: code,
        chapitre_num: Number(l.chapitre),
        chapitre_titre: String(l.titre_chapitre || fiche.titre).slice(0, 200),
        module_num: Number(l.module),
        module_titre: String(l.titre_module).slice(0, 200),
        type: ["theorie", "pratique", "evaluation"].indexOf(String(l.type)) >= 0 ? String(l.type) : "theorie",
      }));

    if (lignes.length < 8) {
      return NextResponse.json({ ok: false, code: code, erreur: "plan trop court (" + lignes.length + ")" }, { status: 500 });
    }

    await supabase.from("lms_plans").delete().eq("formation_code", code).eq("chapitre_num", 0);

    const { error } = await supabase.from("lms_plans").insert(lignes);
    if (error) {
      return NextResponse.json({ ok: false, code: code, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      nb_modules: lignes.length,
      restants: codes.length - 1,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
