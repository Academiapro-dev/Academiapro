import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "pieces-formateurs";
const TAILLE_MAX = 8 * 1024 * 1024;
const VALIDITE_LECTURE_S = 3600;

// Une piece justificative, c est un FICHIER. Cocher une case ne prouve rien :
// l auditeur ne demande pas si le CV existe, il demande a le voir. Le meme
// mecanisme sert le CV et le diplome, qui souffraient du meme defaut.
const PIECES: any = {
  cv: { colonne: "cv_chemin", drapeau: "cv_depose", libelle: "CV" },
  diplome: { colonne: "diplome_chemin", drapeau: "diplome_depose", libelle: "Diplome" },
};

const TYPES_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
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

// LE DEPOT. Le fichier va dans un espace prive : il ne se lit que par un lien
// temporaire, jamais par une adresse devinable.
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
    const piece = String(formulaire.get("piece") || "").trim().toLowerCase();
    const fichier = formulaire.get("fichier") as File | null;

    if (!id || !PIECES[piece]) {
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

    // Le formateur doit appartenir a cet organisme : sans ce controle, un
    // client pourrait deposer une piece sur le formateur d un autre.
    const { data: formateur } = await supabase
      .from("organisme_formateurs")
      .select("id, nom")
      .eq("id", id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!formateur) {
      return NextResponse.json({ ok: false, erreur: "Formateur introuvable." }, { status: 404 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());
    const chemin = String(tenant) + "/" + id + "/" + piece + "." + extension(fichier.name);

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
    modifications[PIECES[piece].colonne] = chemin;
    modifications[PIECES[piece].drapeau] = true;

    const { error } = await supabase
      .from("organisme_formateurs")
      .update(modifications)
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      piece: PIECES[piece].libelle,
      formateur: formateur.nom,
      nom_fichier: fichier.name,
      octets: octets.length,
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
    const piece = String(url.searchParams.get("piece") || "").trim().toLowerCase();

    if (!id || !PIECES[piece]) {
      return NextResponse.json({ ok: false, erreur: "Piece inconnue." }, { status: 400 });
    }

    const { data: formateur } = await supabase
      .from("organisme_formateurs")
      .select("id, nom, cv_chemin, diplome_chemin")
      .eq("id", id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!formateur) {
      return NextResponse.json({ ok: false, erreur: "Formateur introuvable." }, { status: 404 });
    }

    const chemin = (formateur as any)[PIECES[piece].colonne];
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

    return NextResponse.json({
      ok: true,
      piece: PIECES[piece].libelle,
      formateur: formateur.nom,
      lien: signe.signedUrl,
      validite_minutes: Math.round(VALIDITE_LECTURE_S / 60),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// LE RETRAIT. Retirer la piece efface le drapeau : le dossier redevient
// incomplet, comme il doit l etre.
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
    const piece = String(url.searchParams.get("piece") || "").trim().toLowerCase();

    if (!id || !PIECES[piece]) {
      return NextResponse.json({ ok: false, erreur: "Piece inconnue." }, { status: 400 });
    }

    const { data: formateur } = await supabase
      .from("organisme_formateurs")
      .select("id, nom, cv_chemin, diplome_chemin")
      .eq("id", id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!formateur) {
      return NextResponse.json({ ok: false, erreur: "Formateur introuvable." }, { status: 404 });
    }

    const chemin = (formateur as any)[PIECES[piece].colonne];
    if (chemin) {
      await supabase.storage.from(BUCKET).remove([chemin]);
    }

    const modifications: any = {};
    modifications[PIECES[piece].colonne] = null;
    modifications[PIECES[piece].drapeau] = false;

    const { error } = await supabase
      .from("organisme_formateurs")
      .update(modifications)
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, retiree: PIECES[piece].libelle });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
