import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// Bucket unique pour toutes les pieces justificatives. Le nom est historique
// — il a ete cree pour les formateurs — mais il sert desormais l ensemble
// des briques : mieux vaut un nom imparfait qu un second coffre a gerer.
const BUCKET = "pieces-formateurs";

const TAILLE_MAX = 8 * 1024 * 1024;
const VALIDITE_LECTURE_S = 3600;

// UNE PIECE JUSTIFICATIVE EST UN FICHIER, PAS UNE CASE A COCHER.
//
// Et pour les pieces qui ENGAGENT — un contrat —, le fichier ne suffit pas
// davantage : il devient SIGNABLE des son depot. C est la demande de Jacques,
// et elle est juste : reclamer plus tard un contrat signe, c est se condamner
// a ne jamais le verifier. On fait signer en amont, quel que soit le document.
//
// Cette liste blanche dit, pour chaque piece : dans quelle table elle vit,
// quelle colonne porte le chemin du fichier, quel drapeau la declare presente,
// et — si elle engage — qui doit la signer.
const PIECES: any = {
  formateur_cv: {
    table: "organisme_formateurs",
    colonne: "cv_chemin",
    drapeau: "cv_depose",
    libelle: "CV",
    nom: "nom",
  },
  formateur_diplome: {
    table: "organisme_formateurs",
    colonne: "diplome_chemin",
    drapeau: "diplome_depose",
    libelle: "Diplome",
    nom: "nom",
  },
  soustraitance_contrat: {
    table: "organisme_soustraitance",
    colonne: "contrat_chemin",
    drapeau: "contrat_signe",
    libelle: "Contrat signe",
    nom: "prestataire",
    date: "contrat_date",
    signable: true,
    signataire: "contact_email",
  },
  soustraitance_certificat: {
    table: "organisme_soustraitance",
    colonne: "certificat_chemin",
    drapeau: "qualiopi_prestataire",
    libelle: "Certificat Qualiopi",
    nom: "prestataire",
  },
};

const TYPES_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

function extension(nom: string): string {
  const bout = String(nom || "").split(".").pop();
  if (!bout || bout.length > 5) return "pdf";
  return bout.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// La reference est DETERMINISTE : une meme piece sur une meme fiche porte
// toujours la meme. Sans cela, redeposer le fichier creerait un second
// document et la preuve de signature pointerait vers l ancien.
function referenceDe(cle: string, id: string): string {
  return "PJ-" + cle.slice(0, 3).toUpperCase() + "-" + String(id).replace(/-/g, "").slice(0, 10).toUpperCase();
}

// La ligne doit appartenir a cet organisme : sans ce controle, un client
// pourrait deposer une piece sur le dossier d un autre.
async function ligneDe(piece: any, id: string, tenant: string) {
  const champs = ["id", piece.nom, piece.colonne];
  if (piece.signataire) champs.push(piece.signataire);

  const { data } = await supabase
    .from(piece.table)
    .select(champs.join(", "))
    .eq("id", id)
    .eq("tenant_id", tenant)
    .maybeSingle();
  return data || null;
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const formulaire = await req.formData().catch(function () { return null; });
    if (!formulaire) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible." }, { status: 400 });
    }

    const id = String(formulaire.get("id") || "").trim();
    const cle = String(formulaire.get("piece") || "").trim().toLowerCase();
    const fichier = formulaire.get("fichier") as File | null;

    const piece = PIECES[cle];
    if (!id || !piece) {
      return NextResponse.json({ ok: false, erreur: "Piece inconnue." }, { status: 400 });
    }

    if (!fichier || typeof fichier === "string") {
      return NextResponse.json({ ok: false, erreur: "Aucun fichier recu." }, { status: 400 });
    }

    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json(
        { ok: false, erreur: "Fichier trop lourd : 8 Mo au maximum." },
        { status: 400 }
      );
    }

    if (fichier.type && TYPES_ACCEPTES.indexOf(fichier.type) < 0) {
      return NextResponse.json(
        { ok: false, erreur: "Format non accepte. Deposez un PDF, une image ou un document Word." },
        { status: 400 }
      );
    }

    const ligne = await ligneDe(piece, id, tenant);
    if (!ligne) {
      return NextResponse.json({ ok: false, erreur: "Fiche introuvable." }, { status: 404 });
    }

    const reference = referenceDe(cle, id);

    // UN DOCUMENT DEJA SIGNE NE SE REMPLACE PLUS. La preuve porte l empreinte
    // du fichier signe : le remplacer la rendrait fausse.
    if (piece.signable) {
      const { data: signature } = await supabase
        .from("organisme_signatures")
        .select("id, signe_le")
        .eq("document_reference", reference)
        .eq("annulee", false)
        .maybeSingle();

      if (signature) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "Ce document a deja ete signe le "
              + new Date(signature.signe_le).toLocaleDateString("fr-FR")
              + ". Il ne peut plus etre remplace : la preuve de signature porte son empreinte.",
          },
          { status: 409 }
        );
      }
    }

    const octets = Buffer.from(await fichier.arrayBuffer());
    const chemin = String(tenant) + "/" + piece.table + "/" + id + "/" + cle + "." + extension(fichier.name);

    const { error: erreurDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, {
        contentType: fichier.type || "application/octet-stream",
        upsert: true,
      });

    if (erreurDepot) {
      return NextResponse.json(
        { ok: false, erreur: "Depot impossible : " + erreurDepot.message },
        { status: 500 }
      );
    }

    const modifications: any = {};
    modifications[piece.colonne] = chemin;
    modifications[piece.drapeau] = true;
    if (piece.date) modifications[piece.date] = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from(piece.table)
      .update(modifications)
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // LE FICHIER DEVIENT UN DOCUMENT SIGNABLE. Il entre dans le meme registre
    // que les conventions generees, avec son empreinte : la brique de
    // signature le traite ensuite sans rien savoir de son origine.
    let signable = false;
    let signataire = "";

    if (piece.signable) {
      signataire = String((ligne as any)[piece.signataire] || "").toLowerCase().trim();

      if (signataire) {
        const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

        const { data: deja } = await supabase
          .from("organisme_documents")
          .select("id")
          .eq("reference", reference)
          .maybeSingle();

        const contenu: any = {
          tenant_id: tenant,
          type: cle,
          stagiaire_email: signataire,
          formation_code: null,
          reference: reference,
          pdf_chemin: chemin,
          pdf_sha256: empreinte,
          pdf_octets: octets.length,
          donnees: {
            titre: piece.libelle + " - " + ((ligne as any)[piece.nom] || ""),
            contrepartie: (ligne as any)[piece.nom] || "",
            origine: "depot",
            nom_fichier: fichier.name,
          },
        };

        if (deja) {
          await supabase.from("organisme_documents").update(contenu).eq("id", deja.id);
        } else {
          await supabase.from("organisme_documents").insert(contenu);
        }

        signable = true;
      }
    }

    return NextResponse.json({
      ok: true,
      piece: piece.libelle,
      fiche: (ligne as any)[piece.nom] || "",
      nom_fichier: fichier.name,
      octets: octets.length,
      signable: signable,
      signataire: signataire || null,
      reference: signable ? reference : null,
      lien_signature: signable ? "/signature/" + reference : null,
      rappel: piece.signable && !signataire
        ? "Renseignez l adresse du prestataire pour pouvoir lui faire signer ce document."
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// LA RELECTURE. Un lien temporaire d une heure, pour montrer la piece a
// l auditeur ou la verifier soi-meme.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    const cle = String(url.searchParams.get("piece") || "").trim().toLowerCase();

    const piece = PIECES[cle];
    if (!id || !piece) {
      return NextResponse.json({ ok: false, erreur: "Piece inconnue." }, { status: 400 });
    }

    const ligne = await ligneDe(piece, id, tenant);
    if (!ligne) {
      return NextResponse.json({ ok: false, erreur: "Fiche introuvable." }, { status: 404 });
    }

    const chemin = (ligne as any)[piece.colonne];
    if (!chemin) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun fichier depose pour cette piece." },
        { status: 404 }
      );
    }

    const { data: signe, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(chemin, VALIDITE_LECTURE_S);

    if (error || !signe || !signe.signedUrl) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture impossible : le fichier est introuvable dans le coffre." },
        { status: 500 }
      );
    }

    // L etat de signature, s il y a lieu : c est ce que l ecran affiche.
    const reference = referenceDe(cle, id);
    let signature: any = null;

    if (piece.signable) {
      const { data } = await supabase
        .from("organisme_signatures")
        .select("signataire_email, signe_le, empreinte_sha256")
        .eq("document_reference", reference)
        .eq("annulee", false)
        .maybeSingle();
      signature = data || null;
    }

    return NextResponse.json({
      ok: true,
      piece: piece.libelle,
      fiche: (ligne as any)[piece.nom] || "",
      lien: signe.signedUrl,
      validite_minutes: Math.round(VALIDITE_LECTURE_S / 60),
      signable: !!piece.signable,
      reference: piece.signable ? reference : null,
      lien_signature: piece.signable ? "/signature/" + reference : null,
      signature: signature,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// LE RETRAIT. Retirer la piece efface le drapeau : le dossier redevient
// incomplet, comme il doit l etre. Un document signe, lui, ne se retire pas.
export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    const cle = String(url.searchParams.get("piece") || "").trim().toLowerCase();

    const piece = PIECES[cle];
    if (!id || !piece) {
      return NextResponse.json({ ok: false, erreur: "Piece inconnue." }, { status: 400 });
    }

    const ligne = await ligneDe(piece, id, tenant);
    if (!ligne) {
      return NextResponse.json({ ok: false, erreur: "Fiche introuvable." }, { status: 404 });
    }

    const reference = referenceDe(cle, id);

    if (piece.signable) {
      const { data: signature } = await supabase
        .from("organisme_signatures")
        .select("id, signe_le")
        .eq("document_reference", reference)
        .eq("annulee", false)
        .maybeSingle();

      if (signature) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "Ce document a ete signe le "
              + new Date(signature.signe_le).toLocaleDateString("fr-FR")
              + " : il ne peut plus etre retire. La preuve de signature en depend.",
          },
          { status: 409 }
        );
      }
    }

    const chemin = (ligne as any)[piece.colonne];
    if (chemin) {
      await supabase.storage.from(BUCKET).remove([chemin]);
    }

    const modifications: any = {};
    modifications[piece.colonne] = null;
    modifications[piece.drapeau] = false;
    if (piece.date) modifications[piece.date] = null;

    const { error } = await supabase
      .from(piece.table)
      .update(modifications)
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    if (piece.signable) {
      await supabase.from("organisme_documents").delete().eq("reference", reference);
    }

    return NextResponse.json({ ok: true, retiree: piece.libelle });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
