import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifierMdp(mdp: string): Promise<boolean> {
  if (!mdp) return false;
  const { data } = await supabase.from("parametres_securite")
    .select("hash, sel").eq("cle", "mdp_admin").single();
  if (!data) return false;
  const h = crypto.createHash("sha256").update(mdp + data.sel).digest("hex");
  return h === data.hash;
}

const PROMPT = "Analyse ce justificatif de depense (facture ou recu). Reponds UNIQUEMENT avec un objet JSON valide, sans balises markdown, sans texte autour, avec exactement ces cles : fournisseur (nom commercial court, ex Anthropic, Vercel, OVH), montant_ttc (nombre decimal, le total TTC paye), devise (USD ou EUR), date_depense (format YYYY-MM-DD, la date de la facture), pays_fournisseur (code court, ex US, FR), categorie (une seule valeur parmi : Logiciels, IA / API, Hebergement, Domaines, Services juridiques, Marketing, Frais generaux, Autres), description (une ligne courte, ex Abonnement API mensuel). Si une information est illisible ou absente, mets null.";

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "analyse", 20, 600000)) {
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }
  if (!(await verifierMdp(req.headers.get("x-mdp-compta") || ""))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  try {
    const fd = await req.formData();
    const fichier = fd.get("fichier") as File | null;
    if (!fichier || fichier.size === 0) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (fichier.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop lourd (4 Mo max)" }, { status: 400 });
    }

    const bytes = Buffer.from(await fichier.arrayBuffer());
    const b64 = bytes.toString("base64");
    const type = fichier.type || "image/jpeg";
    const estPdf = type === "application/pdf" || fichier.name.toLowerCase().endsWith(".pdf");

    const bloc = estPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
      : { type: "image", source: { type: "base64", media_type: type, data: b64 } };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: [bloc, { type: "text", text: PROMPT }] }],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: "API: " + txt.slice(0, 150) }, { status: 500 });
    }
    const data = await r.json();
    let texte = "";
    for (const c of data.content || []) {
      if (c.type === "text") texte += c.text;
    }
    texte = texte.replace(/```json/g, "").replace(/```/g, "").trim();

    let extrait: any = null;
    try {
      extrait = JSON.parse(texte);
    } catch {
      return NextResponse.json({ error: "Analyse illisible, saisie manuelle requise" }, { status: 422 });
    }

    return NextResponse.json({ success: true, extrait });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
