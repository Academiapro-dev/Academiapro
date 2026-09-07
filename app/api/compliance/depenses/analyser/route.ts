import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../../lib/session";
import { limiter, ipDe } from "../../../../../lib/limiteur";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA LECTURE D UN JUSTIFICATIF PAR IA — CLIENT MYSTERLLC — 07/09.
//
// REPRISE DE /api/admin/analyser-justificatif, avec UNE difference : la
// session client remplace le mot de passe de comptabilite. Celui-ci
// protege la comptabilite de Jacques ; ici, le client est deja connecte et
// le controle se fait sur le tenant.
//
// 🚨 CE QUE FAIT CETTE ROUTE. Elle recoit une photo ou un PDF, le montre au
// modele, et rend fournisseur, montant, devise, date, pays et categorie.
// L ecran s en sert pour PREREMPLIR le formulaire — pas pour enregistrer.
//
// ⚠️ ELLE N ECRIT RIEN EN BASE. L enregistrement passe par
// /api/compliance/depenses, avec le fichier. Separer les deux permet au
// client de corriger ce que l IA a lu avant de valider : un montant mal lu
// sur une photo floue ne doit pas finir dans le 5472.
//
// ⚠️ LE MODELE PEUT SE TROMPER, et il le dit : « Si une information est
// illisible ou absente, mets null ». L ecran affiche « verifiez et
// completez » — jamais « enregistre automatiquement ».
//
// ⚠️ LES CATEGORIES SONT CELLES DE /api/compliance/depenses. Si l une des
// deux listes change, changer l autre : une categorie inconnue serait
// ramenee a « Autre » a l enregistrement, et le client ne comprendrait pas
// pourquoi son choix a disparu.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PROMPT = "Analyse ce justificatif de dépense (facture ou reçu). Réponds UNIQUEMENT avec un objet JSON valide, sans balises markdown, sans texte autour, avec exactement ces clés : fournisseur (nom commercial court, ex Anthropic, Vercel, OVH), montant_ttc (nombre décimal, le total TTC payé), devise (USD, EUR, GBP ou CHF), date_depense (format YYYY-MM-DD, la date de la facture), pays_fournisseur (code à deux lettres, ex US, FR), categorie (une seule valeur parmi : Logiciels, Hebergement, IA / API, Frais generaux, Honoraires, Frais bancaires, Agent enregistre, Taxes et redevances, Autre), description (une ligne courte, ex Abonnement API mensuel). Si une information est illisible ou absente, mets null.";

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "compliance-analyse", 20, 600000)) {
    return NextResponse.json({ ok: false, erreur: "Trop de tentatives, réessayez dans quelques minutes." }, { status: 429 });
  }

  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) {
    return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
  }
  if (!tenant) {
    return NextResponse.json({ ok: false, erreur: "Aucun espace rattaché à votre compte." }, { status: 403 });
  }

  try {
    const fd = await req.formData();

    // 🚨 LA SOCIETE EST VERIFIEE MEME ICI, alors que cette route n ecrit
    // rien. Un client ne doit pas pouvoir faire lire des documents par
    // l IA sous le couvert d une societe qui n est pas la sienne — ce
    // serait consommer des appels au nom d un autre.
    const societeId = String(fd.get("societe") || "");
    const { data: societe } = await supabase
      .from("compliance_tenants")
      .select("id")
      .eq("id", societeId)
      .eq("tenant_id", tenant)
      .limit(1)
      .maybeSingle();
    if (!societe) {
      return NextResponse.json({ ok: false, erreur: "Société introuvable." }, { status: 404 });
    }

    const fichier = fd.get("fichier") as File | null;
    if (!fichier || fichier.size === 0) {
      return NextResponse.json({ ok: false, erreur: "Fichier manquant." }, { status: 400 });
    }
    if (fichier.size > 4 * 1024 * 1024) {
      return NextResponse.json({ ok: false, erreur: "Fichier trop lourd (4 Mo maximum)." }, { status: 400 });
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
      console.error("[compliance/depenses/analyser] API " + r.status + " : " + txt.slice(0, 200));
      return NextResponse.json({ ok: false, erreur: "Lecture impossible pour le moment." }, { status: 502 });
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
      return NextResponse.json(
        { ok: false, erreur: "Le document n'a pas pu être lu. Saisissez les informations à la main." },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, extrait: extrait });
  } catch (e: any) {
    console.error("[compliance/depenses/analyser] " + String(e && e.message ? e.message : e));
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }
}
