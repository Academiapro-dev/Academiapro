import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE FAX ENTRANT (Sinch) — 09/09. La brique neuve de la creation A→Z :
// l IRS renvoie l EIN PAR FAX au numero de retour (SINCH_FAX_FROM).
//
// CE QUE FAIT CETTE ROUTE : Sinch appelle cette adresse a chaque fax recu
// (a configurer dans le service Fax : « Incoming fax webhook »,
// https://<hote>/api/compliance/fax-entrant?cle=FAX_CALLBACK_TOKEN,
// JSON). Elle telecharge le document via l API Sinch, l archive au coffre
// dans compliance-docs/fax-entrant/<annee>/, l inscrit dans la table
// fax_entrants, et previent par courriel (COMPLIANCE_EXPEDITEUR →
// FAX_ENTRANT_ALERTE). Elle ne devine PAS a quelle societe le fax
// appartient : un fax de l IRS ne porte pas notre identifiant. Le
// rattachement se fait sur l ecran de creation (« EIN recu »), ou le
// document est propose ; l EIN lui-meme est lu par le titulaire.
//
// ⚠️ Sinch v3 ne signe pas ses appels : le jeton dans l adresse est la
// seule barriere, comme pour le statut. Toujours repondre 200 une fois
// le fax range, sinon Sinch reessaie et cree des doublons ; l identifiant
// Sinch est unique en table pour les absorber.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const BUCKET = "compliance-docs";
const SINCH_URL = "https://fax.api.sinch.com/v3/projects/";

export async function POST(req: NextRequest) {
  const jeton = (process.env.FAX_CALLBACK_TOKEN || "").trim();
  const cle = req.nextUrl.searchParams.get("cle") || "";
  if (!jeton || cle !== jeton) return NextResponse.json({ ok: false }, { status: 401 });

  let corps: any = null;
  try { corps = await req.json(); } catch { return NextResponse.json({ ok: false, erreur: "JSON illisible" }, { status: 400 }); }
  const fax = corps && (corps.fax || corps);
  const faxId = fax && fax.id ? String(fax.id) : null;
  if (!faxId) return NextResponse.json({ ok: false, erreur: "identifiant absent" }, { status: 400 });

  // Deja range ? (Sinch reessaie)
  const { data: deja } = await supabase.from("fax_entrants").select("id").eq("sinch_id", faxId).maybeSingle();
  if (deja) return NextResponse.json({ ok: true, deja: true });

  const projet = (process.env.SINCH_PROJECT_ID || "").trim(), ak = (process.env.SINCH_ACCESS_KEY || "").trim(), as = (process.env.SINCH_ACCESS_SECRET || "").trim();
  let chemin: string | null = null, sha: string | null = null, octets = 0, erreur: string | null = null;
  try {
    const r = await fetch(SINCH_URL + encodeURIComponent(projet) + "/faxes/" + encodeURIComponent(faxId) + "/file?fileFormat=pdf", {
      headers: { Authorization: "Basic " + Buffer.from(ak + ":" + as).toString("base64") },
    });
    if (!r.ok) erreur = "telechargement " + r.status;
    else {
      const b = Buffer.from(await r.arrayBuffer());
      sha = crypto.createHash("sha256").update(b).digest("hex"); octets = b.length;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      chemin = "fax-entrant/" + new Date().getUTCFullYear() + "/fax-" + stamp + "-" + faxId + ".pdf";
      const up = await supabase.storage.from(BUCKET).upload(chemin, b, { contentType: "application/pdf", upsert: false });
      if (up.error) { erreur = "archivage " + up.error.message; chemin = null; }
    }
  } catch (e: any) { erreur = String(e && e.message ? e.message : e); }

  await supabase.from("fax_entrants").insert({
    sinch_id: faxId, expediteur: fax.from || null, destinataire: fax.to || null, pages: fax.numberOfPages || null,
    recu_le: fax.completedTime || fax.createTime || new Date().toISOString(), chemin, sha256: sha, octets, erreur, brut: fax,
  });

  // Alerte : un fax recu est presque toujours l IRS qui repond.
  const dest = (process.env.FAX_ENTRANT_ALERTE || "").trim();
  if (dest && process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.COMPLIANCE_EXPEDITEUR || "Suivi des echeances <contact@academiapro.fr>", to: dest,
          subject: "Fax reçu" + (fax.from ? " de " + fax.from : "") + (fax.numberOfPages ? " — " + fax.numberOfPages + " page(s)" : ""),
          html: "<p>Un fax vient d'arriver sur le numéro " + (fax.to || "") + ".</p><p>" + (chemin ? "Archivé au coffre : " + chemin : "ATTENTION : non archivé (" + erreur + ")") + "</p><p>S'il s'agit d'une réponse de l'IRS (EIN), ouvrez le chemin de création de la société concernée et saisissez l'EIN.</p>",
        }),
      });
    } catch (e) {}
  }

  return NextResponse.json({ ok: true, chemin, erreur });
}
