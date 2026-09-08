import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// LE RETOUR DU PRESTATAIRE DE FAX — 08/09 (Sinch Fax API v3).
//
// Sinch appelle cette adresse quand le fax est termine, reussi ou non
// (evenement FAX_COMPLETED). On a demande le retour en JSON
// (callbackUrlContentType=application/json a l envoi) : pas de fichier
// joint, seulement l objet fax.
//
// 🚨 UN WEBHOOK REPOND TOUJOURS 200, meme pour un message qu on ne
// reconnait pas. Ce qui n est pas reconnu est journalise.
//
// 🚨 SINCH V3 NE SIGNE PAS SES APPELS. La protection est le jeton
// FAX_CALLBACK_TOKEN, place dans l adresse de rappel a l envoi (?cle=...).
// Sans jeton en base ou jeton different : ignore, mais 200 quand meme.
//
// Ce que cette route ecrit : donnees.transmission.statut et l accuse du
// prestataire, sur l accuse de lecture ET sur la ligne depot_irs_fax.
// Elle n ecrit rien d autre, et jamais un fichier.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const jeton = (process.env.FAX_CALLBACK_TOKEN || "").trim();
  const url = new URL(req.url);
  const reference = String(url.searchParams.get("ref") || "").trim();
  const cleRecue = String(url.searchParams.get("cle") || "").trim();

  if (!jeton || !cleRecue || cleRecue !== jeton) {
    console.error("[transmettre/statut] jeton absent ou invalide pour", reference);
    return NextResponse.json({ ok: false, raison: "jeton" }, { status: 200 });
  }

  // Le corps : JSON attendu ; on tolere le multipart au cas ou.
  let corps: any = null;
  const type = req.headers.get("content-type") || "";
  try {
    if (type.indexOf("application/json") >= 0) {
      corps = await req.json();
    } else {
      const fd = await req.formData();
      const brut = fd.get("fax");
      corps = { fax: typeof brut === "string" ? JSON.parse(brut) : null, event: fd.get("event") };
    }
  } catch {
    console.error("[transmettre/statut] corps illisible.");
    return NextResponse.json({ ok: false, raison: "corps" }, { status: 200 });
  }

  const fax = corps && corps.fax ? corps.fax : null;
  if (!reference || !fax) {
    console.error("[transmettre/statut] retour sans reference ou sans fax.");
    return NextResponse.json({ ok: false, raison: "incomplet" }, { status: 200 });
  }

  const statutPrestataire = String(fax.status || "").toUpperCase();
  const succes = statutPrestataire === "COMPLETED" || statutPrestataire === "SUCCESS";
  const statut = succes ? "transmis" : "echec";
  const accuse = {
    fax_id: fax.id != null ? String(fax.id) : null,
    evenement: corps.event || null,
    statut_prestataire: statutPrestataire || null,
    pages: fax.numberOfPages ?? fax.num_pages ?? null,
    prix: fax.price ?? null,
    termine_le: fax.completedTime || corps.eventTime || new Date().toISOString(),
    erreur: fax.errorType || fax.errorMessage || null,
    destinataire: fax.to || null,
  };

  const { data: docs } = await supabase
    .from("compliance_documents")
    .select("id, donnees, doc_type")
    .eq("reference", reference)
    .in("doc_type", ["accuse_lecture", "depot_irs_fax"]);

  for (const d of docs || []) {
    const donnees = d.donnees && typeof d.donnees === "object" ? d.donnees : {};
    const transmission = donnees.transmission && typeof donnees.transmission === "object" ? donnees.transmission : {};
    // On ne rattache le retour qu au bon fax.
    if (transmission.fax_id && accuse.fax_id && String(transmission.fax_id) !== accuse.fax_id) continue;
    await supabase
      .from("compliance_documents")
      .update({ donnees: { ...donnees, transmission: { ...transmission, statut, accuse_prestataire: accuse, statut_recu_le: new Date().toISOString() } } })
      .eq("id", d.id);
  }

  return NextResponse.json({ ok: true, statut }, { status: 200 });
}
