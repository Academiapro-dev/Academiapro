import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// LE RETOUR DU PRESTATAIRE DE FAX — 08/09.
//
// Phaxio appelle cette adresse quand le fax est termine, reussi ou non
// (webhook « postflight », v2.1). C est un POST multipart, a traiter comme
// un formulaire. Il renvoie jusqu a seize fois si on ne repond pas 200.
//
// 🚨 UN WEBHOOK REPOND TOUJOURS 200, meme pour un message qu on ne
// reconnait pas : sinon le prestataire insiste seize fois sur une erreur
// qu on ne saura pas traiter. Ce qui n est pas reconnu est journalise.
//
// 🚨 LA SIGNATURE EST VERIFIEE. Sans elle, n importe qui pourrait poster
// « fax reussi » sur n importe quelle reference. Phaxio signe chaque
// appel : en-tete X-Phaxio-Signature = HMAC-SHA1 (jeton de rappel du
// compte) de : URL appelee + parametres tries par nom (nom+valeur
// concatenes) + parts fichier triees (nom+SHA1 du contenu). Documente sur
// phaxio.com/docs/security/callbacks, verifie le 08/09.
// Sans PHAXIO_CALLBACK_TOKEN dans Vercel, aucun retour n est accepte.
//
// Ce que cette route ecrit : donnees.transmission.statut et l accuse du
// prestataire, sur l accuse de lecture ET sur la ligne depot_irs_fax.
// Elle n ecrit rien d autre, et jamais un fichier.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function signatureAttendue(url: string, champs: Array<[string, string]>, fichiers: Array<[string, Buffer]>, jeton: string): string {
  let chaine = url;
  champs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  for (const [nom, valeur] of champs) chaine += nom + valeur;
  fichiers.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  for (const [nom, contenu] of fichiers) {
    chaine += nom + crypto.createHash("sha1").update(contenu).digest("hex");
  }
  return crypto.createHmac("sha1", jeton).update(chaine).digest("hex");
}

export async function POST(req: NextRequest) {
  const jeton = process.env.PHAXIO_CALLBACK_TOKEN || "";
  if (!jeton) {
    console.error("[transmettre/statut] PHAXIO_CALLBACK_TOKEN absent : retour ignore.");
    return NextResponse.json({ ok: false, raison: "non configure" }, { status: 200 });
  }

  const url = new URL(req.url);
  const reference = String(url.searchParams.get("ref") || "").trim();

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    console.error("[transmettre/statut] corps illisible.");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const champs: Array<[string, string]> = [];
  const fichiers: Array<[string, Buffer]> = [];
  for (const [nom, valeur] of fd.entries()) {
    if (typeof valeur === "string") champs.push([nom, valeur]);
    else fichiers.push([nom, Buffer.from(await (valeur as Blob).arrayBuffer())]);
  }

  // L URL signee est celle qu on a fournie a l envoi : schema, hote,
  // chemin et parametre ref, sans rien d autre.
  const urlSignee = "https://" + (req.headers.get("host") || "") + url.pathname + url.search;
  const recue = req.headers.get("x-phaxio-signature") || "";
  const attendue = signatureAttendue(urlSignee, champs.slice(), fichiers, jeton);

  if (!recue || recue.toLowerCase() !== attendue.toLowerCase()) {
    console.error("[transmettre/statut] signature invalide pour", reference);
    return NextResponse.json({ ok: false, raison: "signature" }, { status: 200 });
  }

  // Le corps du retour : un champ « fax » en JSON (v2.1).
  let fax: any = null;
  const brut = champs.find(([n]) => n === "fax");
  if (brut) {
    try { fax = JSON.parse(brut[1]); } catch { fax = null; }
  }

  if (!reference || !fax) {
    console.error("[transmettre/statut] retour sans reference ou sans fax.");
    return NextResponse.json({ ok: false, raison: "incomplet" }, { status: 200 });
  }

  const succes = String(fax.status || "").toLowerCase() === "success";
  const statut = succes ? "transmis" : "echec";
  const accuse = {
    fax_id: fax.id != null ? String(fax.id) : null,
    statut_prestataire: fax.status || null,
    pages: fax.num_pages ?? null,
    cout_cents: fax.cost ?? null,
    termine_le: fax.completed_at ? new Date(Number(fax.completed_at) * 1000).toISOString() : new Date().toISOString(),
    erreur: fax.error_type || fax.error_message || null,
    destinataires: fax.recipients || null,
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
