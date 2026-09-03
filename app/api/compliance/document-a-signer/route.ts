import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";
import { marqueCompliance, MarqueCompliance } from "../../../../lib/marque-compliance";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// CREER UN DOCUMENT A FAIRE SIGNER — MYSTERLLC, 01/09.
//
// CE QUI MANQUAIT. La route de signature, l ecran de signature et le
// registre existaient depuis ce matin. Mais RIEN NE CREAIT DE DOCUMENT
// SIGNABLE : le mecanisme complet etait inutilisable, faute de premiere
// etape.
//
// CE QUE FAIT CETTE ROUTE, DANS L ORDRE :
//   1. verifie que la societe appartient bien au gestionnaire,
//   2. fabrique le document en HTML,
//   3. L ARCHIVE AU COFFRE et calcule son empreinte SHA-256,
//   4. l enregistre dans compliance_documents avec une reference unique,
//   5. envoie le lien de signature a l adresse du CLIENT.
//
// 🚨 L ARCHIVAGE PRECEDE L ENVOI, ET CE N EST PAS UN DETAIL. La route de
// signature REFUSE de signer un document non archive : une signature sans
// document prouverait un accord sans pouvoir montrer sur quoi il portait.
// Si le depot echoue, rien n est envoye.
//
// 🚨 LES FORMULAIRES IRS NE PASSENT PAS PAR ICI. Le 5472, le 1120 et le
// 7004 exigent une signature manuscrite ou les procedures propres a l IRS.
// La liste des types signables est verifiee deux fois : ici, et dans la
// route de signature.
//
// ⚠️ LE LIEN PART A L ADRESSE DU CLIENT, JAMAIS A CELLE DE LA SESSION.
// C est ce qui fait que la preuve porte le nom de celui qui s engage, et
// non de celui qui a prepare le document.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "documents-signes";

// 🚨 MEME LISTE QUE DANS /api/compliance/signature. Un type present ici
// mais absent la-bas produirait un document impossible a signer.
const TYPES_SIGNABLES = [
  "mandat",
  "lettre_mission",
  "autorisation_depot",
  "accuse_lecture",
  "convention",
  "devis",
];

const LIBELLES: Record<string, string> = {
  mandat: "Mandat de gestion",
  lettre_mission: "Lettre de mission",
  autorisation_depot: "Autorisation de dépôt",
  accuse_lecture: "Accusé de lecture avant dépôt",
  convention: "Convention de prestation",
  devis: "Devis",
};

function echappe(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function documentHTML(titre: string, corps: string, societe: string, type: string, marque: MarqueCompliance): string {
  const date = new Date().toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ⚠️ LE CORPS EST ECHAPPE PUIS SES SAUTS DE LIGNE RESTITUES. Sans
  // echappement, un texte contenant des balises casserait le document — ou
  // pire, y glisserait du contenu que le signataire n aurait pas vu.
  const paragraphes = echappe(corps)
    .split("\n\n")
    .map(function (p) { return "<p>" + p.replace(/\n/g, "<br/>") + "</p>"; })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>
  body { font-family: Georgia, serif; color:#1a1a1a; padding:44px; max-width:760px; margin:0 auto; line-height:1.8; }
  h1 { color:#1a1a2e; border-bottom:3px solid #c8a96e; padding-bottom:12px; font-size:24px; }
  .meta { color:#666; font-size:13px; margin-bottom:28px; }
  .corps { font-size:15px; }
  .mention { background:#f5f1e8; border-left:4px solid #c8a96e; padding:14px 18px; margin-top:34px; font-size:13px; color:#555; }
  .footer { margin-top:44px; font-size:12px; color:#888; border-top:1px solid #eee; padding-top:14px; }
</style></head><body>

<h1>${echappe(titre)}</h1>

<p class="meta">
  ${echappe(LIBELLES[type] || type)} — ${echappe(societe)}<br/>
  Document établi le ${date}
</p>

<div class="corps">
${paragraphes}
</div>

<div class="mention">
  Ce document est destiné à être signé électroniquement. La signature
  électronique simple, au sens du règlement européen eIDAS, est opposable
  entre les parties. Elle ne vaut pas vérification d'identité.
</div>

<div class="footer">
  ${echappe(marque.nom)} — document préparé le ${date}.<br/>
  Une empreinte SHA-256 de ce fichier est conservée avec la signature :
  toute modification ultérieure la rendrait invalide.
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    // 🚨 LA MARQUE VIENT DE L HOTE APPELANT — 03/09. Mr. Comptable et
    // MysterLLC partagent cette route. Le document, le lien et le courriel
    // portent la marque du site depuis lequel le gestionnaire ou le cabinet
    // travaille — jamais l autre.
    const marque = marqueCompliance(req);

    const b = await req.json().catch(function () { return {}; });

    const type = String(b.doc_type || "").trim();
    const titre = String(b.titre || "").trim();
    const corps = String(b.corps || "").trim();
    const emailSignataire = String(b.signataire_email || "").toLowerCase().trim();
    const entiteDemandee = String(b.entite_id || "").trim();

    // 🚨 LE PREMIER VERROU : LE TYPE.
    if (TYPES_SIGNABLES.indexOf(type) < 0) {
      return NextResponse.json(
        {
          error: "Ce type de document ne se signe pas electroniquement. Les"
            + " formulaires destines a l'administration americaine exigent une"
            + " signature manuscrite ou la procedure propre a l'IRS.",
        },
        { status: 400 }
      );
    }

    if (!titre) {
      return NextResponse.json({ error: "Indiquez un titre." }, { status: 400 });
    }
    if (!emailSignataire || emailSignataire.indexOf("@") < 1) {
      return NextResponse.json(
        { error: "Indiquez l'adresse du signataire." },
        { status: 400 }
      );
    }

    // ---- LA SOCIETE CONCERNEE ----
    //
    // ⚠️ L IDENTIFIANT RECU N EST PAS UNE AUTORISATION. Il est cherche AVEC
    // le filtre tenant_id de la session : une societe d un autre
    // gestionnaire est simplement introuvable.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[document-a-signer] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;
    const societe = entite.legal_name || entite.label;

    // ---- LA REFERENCE ----
    //
    // Elle identifie le document dans toute la chaine : le lien de
    // signature la porte, la preuve la cite, le registre la retrouve.
    // Un fragment aleatoire evite qu on devine les references voisines.
    const suffixe = crypto.randomBytes(4).toString("hex").toUpperCase();
    const reference = "SIG-" + new Date().toISOString().slice(0, 10).replace(/-/g, "")
      + "-" + suffixe;

    const html = documentHTML(titre, corps, societe, type, marque);
    const octets = Buffer.from(html, "utf-8");
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = tenantId + "/" + entiteId + "/" + reference + ".html";

    // 🚨 L ARCHIVAGE D ABORD. Si le depot echoue, rien n est envoye : mieux
    // vaut aucun document qu un lien vers un fichier inexistant.
    const { error: eUp } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "text/html", upsert: false });

    if (eUp) {
      console.error("[document-a-signer] depot :", eUp.message);
      return NextResponse.json(
        { error: "Archivage impossible. Le document n'a pas ete envoye." },
        { status: 500 }
      );
    }

    const { error: eDoc } = await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      doc_type: type,
      title: titre,
      version: 1,
      reference: reference,
      signataire_email: emailSignataire,
      storage_path: chemin,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      file_hash: empreinte,
      pdf_octets: octets.length,
      size_bytes: octets.length,
      mime_type: "text/html",
      donnees: {
        signataire_nom: String(b.signataire_nom || "").trim() || null,
        prepare_par: session ? session.email : null,
      },
    });

    if (eDoc) {
      console.error("[document-a-signer] enregistrement :", eDoc.message);
      return NextResponse.json(
        { error: "Enregistrement impossible : " + eDoc.message },
        { status: 500 }
      );
    }

    // ---- LE LIEN DE SIGNATURE ----
    //
    // ⚠️ IL POINTE SUR LE SITE DE LA MARQUE APPELANTE. Un lien vers un
    // autre site enverrait le client d un cabinet chez un gestionnaire de
    // LLC, ou l inverse — le defaut corrige le 01/09 sur les liens de
    // connexion, puis le 03/09 ici.
    const lien = marque.site + "/compliance/signature/"
      + encodeURIComponent(reference);

    const cle = process.env.RESEND_API_KEY || "";
    const expediteur = marque.expediteur;

    const email: Record<string, unknown> = { destinataire: emailSignataire };

    if (!cle) {
      email.envoye = false;
      email.raison = "RESEND_API_KEY absente";
    } else {
      const corpsHtml =
        '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.75">' +
        '<p style="color:#a07840;font-size:13px;letter-spacing:2px;margin:0 0 6px">DOCUMENT À SIGNER</p>' +
        '<h1 style="color:#1a1a2e;font-size:22px;margin:0 0 16px">' + echappe(titre) + "</h1>" +
        "<p>Un document vous est soumis pour signature concernant <strong>" +
        echappe(societe) + "</strong>.</p>" +
        "<p>Vous pourrez le lire entièrement avant de signer. Un code de " +
        "vérification à six chiffres vous sera envoyé au moment de la signature.</p>" +
        '<p style="text-align:center;margin:28px 0">' +
        '<a href="' + lien + '" style="display:inline-block;background:#c8a96e;color:#050508;' +
        'padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">' +
        "Lire et signer</a></p>" +
        '<p style="font-size:13px;color:#666">Si vous n\'attendiez pas ce document, ' +
        "ignorez ce message : aucune signature ne sera enregistrée sans votre action.</p>" +
        '<p style="font-size:13px;color:#999;margin-top:26px">' + echappe(marque.signature) + "</p>" +
        "</div>";

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + cle,
          },
          body: JSON.stringify({
            from: expediteur,
            to: [emailSignataire],
            subject: titre + " — document à signer",
            html: corpsHtml,
          }),
        });
        email.statut_http = r.status;
        email.envoye = r.ok;
        if (!r.ok) {
          email.raison = "Resend a refuse l'envoi";
          email.reponse = (await r.text()).slice(0, 400);
        }
      } catch (e: unknown) {
        email.envoye = false;
        email.raison = "Appel a Resend impossible";
        email.reponse = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      success: true,
      reference: reference,
      lien: lien,
      empreinte: empreinte,
      societe: entite.label,
      type: type,
      email: email,
    });
  } catch (e: unknown) {
    console.error("[document-a-signer] exception :",
      e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
