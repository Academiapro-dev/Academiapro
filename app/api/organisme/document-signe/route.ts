import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE DOCUMENT AVEC SA SIGNATURE MANUSCRITE — 14/09.
//
// LE BESOIN, VU A L ESSAI PAR JACQUES : « la signature avec l empreinte
// fonctionne mais je n ai pas retrouve la signature manuelle que j ai
// faite ». La chaine du CRM conserve le trace DANS LA PREUVE
// (organisme_signatures.trace_signature), mais ne le DESSINE PAS sur le
// document : un mandat signe n avait donc pas l air signe.
//
// 🚨 L ORIGINAL N EST JAMAIS MODIFIE, ET C EST ESSENTIEL. L empreinte
// SHA-256 de la preuve porte sur le fichier archive au moment de la
// signature : le reecrire rendrait la preuve fausse. Cette route rend donc
// une COPIE tamponnee, calculee a la demande a partir de l original et du
// trace conserve. Les deux coexistent : l original fait foi, la copie se
// montre et s envoie.
//
// ⚠️ LA POSITION DU TRACE. Les documents produits depuis un modele
// enregistrent ou la ligne « Le client » a ete dessinee
// (donnees.signature_position). Pour les autres, on retombe sur une
// position raisonnable en bas de la derniere page. Mieux vaut un trace un
// peu haut qu un document sans signature visible.
//
// ⚠️ QUI PEUT VOIR. Le signataire, l organisme proprietaire du document, et
// l administrateur — exactement les memes droits que la lecture du
// document original.
// ══════════════════════════════════════════════════════════════════════════

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: function (url: any, options: any) { return fetch(url, { ...(options || {}), cache: "no-store" }); } } }
);

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-").replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

// Le trace est une image encodee en base64, telle que l ecran de signature
// l a produite. On accepte PNG et JPEG, avec ou sans en-tete data:.
function imageDuTrace(trace: string): { octets: Buffer; type: "png" | "jpg" } | null {
  const t = String(trace || "").trim();
  if (!t) return null;
  let base64 = t;
  let type: "png" | "jpg" | null = null;
  const m = t.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (m) { type = m[1].toLowerCase() === "png" ? "png" : "jpg"; base64 = m[2]; }
  let octets: Buffer;
  try { octets = Buffer.from(base64, "base64"); } catch (e) { return null; }
  if (octets.length < 16) return null;
  if (!type) {
    if (octets[0] === 0x89 && octets[1] === 0x50) type = "png";
    else if (octets[0] === 0xff && octets[1] === 0xd8) type = "jpg";
    else return null;
  }
  return { octets: octets, type: type };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const reference = String(url.searchParams.get("reference") || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("organisme_documents")
      .select("id, tenant_id, type, reference, stagiaire_email, pdf_chemin, pdf_sha256, donnees")
      .eq("reference", reference)
      .maybeSingle();

    if (!doc) return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });

    const estLeSignataire = String(doc.stagiaire_email || "").toLowerCase() === String(session.email || "").toLowerCase();
    const estLOrganisme = session.tenantId === doc.tenant_id;
    const estAdmin = ADMINS.indexOf(session.email) >= 0;
    if (!estLeSignataire && !estLOrganisme && !estAdmin) {
      return NextResponse.json({ ok: false, erreur: "Ce document ne vous concerne pas." }, { status: 403 });
    }

    // LA SIGNATURE LA PLUS RECENTE, NON ANNULEE. C est elle qui porte le
    // trace et la date qu on va apposer.
    const { data: sig } = await supabase
      .from("organisme_signatures")
      .select("signataire_email, signataire_nom, signe_le, empreinte_sha256, trace_signature, trace_sha256")
      .eq("document_reference", reference)
      .eq("annulee", false)
      .order("signe_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sig) {
      return NextResponse.json({ ok: false, erreur: "Ce document n'est pas encore signé." }, { status: 409 });
    }
    if (!doc.pdf_chemin) {
      return NextResponse.json({ ok: false, erreur: "Le document original n'est pas archivé." }, { status: 404 });
    }

    const trace = imageDuTrace(sig.trace_signature || "");
    if (!trace) {
      return NextResponse.json({
        ok: false,
        erreur: "Cette signature ne comporte pas de tracé manuscrit : le document reste celui d'origine, et sa preuve est dans le registre des signatures.",
      }, { status: 409 });
    }

    const { data: fichier, error: eLire } = await supabase.storage.from(BUCKET).download(doc.pdf_chemin);
    if (eLire || !fichier) {
      return NextResponse.json({ ok: false, erreur: "Document original illisible." }, { status: 404 });
    }
    const original = Buffer.from(await fichier.arrayBuffer());

    const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
    const police = await pdf.embedFont(StandardFonts.Helvetica);
    const gris = rgb(0.45, 0.45, 0.45);

    const pages = pdf.getPages();
    const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
    const pos = donnees.signature_position && typeof donnees.signature_position === "object"
      ? donnees.signature_position
      : null;

    // ⚠️ LA POSITION ENREGISTREE A LA PRODUCTION EST LA SEULE EXACTE. Sans
    // elle, on se place au-dessus de la ligne de signature du client, telle
    // que la route de production la dessine : x 330, et une hauteur qui
    // laisse le trace au-dessus du trait.
    const page = pages[Math.min(Math.max(0, pos ? Number(pos.page) || 0 : pages.length - 1), pages.length - 1)];
    const x = pos ? Number(pos.x) || 330 : 330;
    const yLigne = pos ? Number(pos.y) || 150 : 150;

    const img = trace.type === "png" ? await pdf.embedPng(trace.octets) : await pdf.embedJpg(trace.octets);
    const LARGEUR = 170;
    const HAUTEUR = 44;
    const e = Math.min(LARGEUR / img.width, HAUTEUR / img.height, 1);
    page.drawImage(img, { x: x, y: yLigne + 6, width: img.width * e, height: img.height * e });

    const jour = new Date(sig.signe_le).toLocaleDateString("fr-FR");
    page.drawText(ascii("Signé électroniquement le " + jour + " par " + (sig.signataire_nom || sig.signataire_email)),
      { x: x, y: Math.max(yLigne - 12, 24), size: 7.5, font: police, color: gris });
    page.drawText(ascii("Empreinte du document signé : " + String(sig.empreinte_sha256 || "").slice(0, 32) + "…"),
      { x: x, y: Math.max(yLigne - 21, 16), size: 6.5, font: police, color: gris });

    const octets = Buffer.from(await pdf.save());
    const empreinteCopie = crypto.createHash("sha256").update(octets).digest("hex");

    // La copie tamponnee est archivee a cote de l original, sous un chemin
    // distinct. ⚠️ upsert : la refaire deux fois ne cree pas deux fichiers.
    const cheminCopie = String(doc.tenant_id) + "/" + reference + "-signe.pdf";
    await supabase.storage.from(BUCKET).upload(cheminCopie, octets, { contentType: "application/pdf", upsert: true });

    await supabase.from("organisme_documents").update({
      donnees: { ...donnees, pdf_signe: { chemin: cheminCopie, sha256: empreinteCopie, produit_le: new Date().toISOString() } },
    }).eq("id", doc.id);

    if (url.searchParams.get("lien") === "1") {
      const { data: signe } = await supabase.storage.from(BUCKET).createSignedUrl(cheminCopie, 3600);
      return NextResponse.json({ ok: true, reference: reference, url: signe ? signe.signedUrl : null, empreinte_original: doc.pdf_sha256, empreinte_copie: empreinteCopie });
    }

    return new NextResponse(octets, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="' + reference + '-signe.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
