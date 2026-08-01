import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";
const TAILLE_MAX = 15 * 1024 * 1024;
const ANNEES_DEFAUT = 10;

const CATEGORIES: any = {
  partenariat: "Contrat de partenariat",
  bon_commande: "Bon de commande",
  convention: "Convention",
  fournisseur: "Contrat fournisseur",
  assurance: "Assurance",
  bancaire: "Document bancaire",
  societe: "Document de societe",
  fiscal: "Document fiscal",
  autre: "Autre",
};

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const url = new URL(req.url);

    // Telechargement : lien signe, valable une heure. Le coffre reste prive,
    // aucun document n est jamais accessible par une adresse publique.
    const piece = url.searchParams.get("piece");
    if (piece) {
      const { data: ligne } = await supabase
        .from("coffre_documents")
        .select("chemin, titre")
        .eq("id", piece)
        .maybeSingle();

      if (!ligne) {
        return NextResponse.json({ ok: false, erreur: "Piece introuvable." }, { status: 404 });
      }

      const { data: signe, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(ligne.chemin, 3600);

      if (error || !signe) {
        return NextResponse.json(
          { ok: false, erreur: "Fichier introuvable au coffre." },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, url: signe.signedUrl, titre: ligne.titre });
    }

    const { data: pieces } = await supabase
      .from("coffre_documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    const { data: organismes } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale")
      .limit(500);

    const nomDe: any = {};
    for (const o of organismes || []) nomDe[o.tenant_id] = o.raison_sociale;

    const maintenant = Date.now();

    const liste = (pieces || []).map(function (p: any) {
      const echu = p.conserver_jusqu_au
        ? new Date(p.conserver_jusqu_au).getTime() < maintenant
        : false;
      return {
        ...p,
        organisme: p.tenant_id ? nomDe[p.tenant_id] || "client inconnu" : null,
        categorie_nom: CATEGORIES[p.categorie] || p.categorie,
        echu: echu,
      };
    });

    return NextResponse.json({
      ok: true,
      categories: CATEGORIES,
      total: liste.length,
      miennes: liste.filter(function (p: any) { return !p.tenant_id; }).length,
      clients: liste.filter(function (p: any) { return !!p.tenant_id; }).length,
      signees: liste.filter(function (p: any) { return p.signe; }).length,
      echues: liste.filter(function (p: any) { return p.echu; }).length,
      pieces: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e: any) {
      return NextResponse.json({ ok: false, erreur: "Formulaire illisible." }, { status: 400 });
    }

    const fichier = form.get("fichier") as File | null;
    if (!fichier || typeof fichier.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, erreur: "Aucun fichier recu." }, { status: 400 });
    }

    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json(
        { ok: false, erreur: "Fichier trop volumineux : 15 Mo maximum." },
        { status: 400 }
      );
    }

    const titre = String(form.get("titre") || "").trim();
    if (titre.length < 3) {
      return NextResponse.json(
        { ok: false, erreur: "Donnez un titre a ce document." },
        { status: 400 }
      );
    }

    const categorie = String(form.get("categorie") || "autre").trim();
    if (!CATEGORIES[categorie]) {
      return NextResponse.json({ ok: false, erreur: "Categorie inconnue." }, { status: 400 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

    const extension = (fichier.name || "").split(".").pop() || "pdf";
    const tenant = String(form.get("tenant_id") || "").trim();

    // Les contrats de l editeur vivent sous editeur/, ceux des clients sous
    // leur identifiant : un seul coffre, deux rangements, aucun melange.
    const dossier = tenant ? tenant : "editeur";
    const chemin = dossier + "/coffre-" + Date.now() + "." + extension.toLowerCase();

    const { error: erreurDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });

    if (erreurDepot) {
      return NextResponse.json(
        { ok: false, erreur: "Depot impossible : " + erreurDepot.message },
        { status: 500 }
      );
    }

    const annees = Number(form.get("annees")) > 0 ? Number(form.get("annees")) : ANNEES_DEFAUT;
    const conserver = new Date();
    conserver.setFullYear(conserver.getFullYear() + annees);

    const { data, error } = await supabase
      .from("coffre_documents")
      .insert({
        tenant_id: tenant || null,
        categorie: categorie,
        titre: titre,
        contrepartie: String(form.get("contrepartie") || "").trim() || null,
        reference: String(form.get("reference") || "").trim() || null,
        chemin: chemin,
        empreinte_sha256: empreinte,
        octets: octets.length,
        signe: String(form.get("signe") || "") === "true",
        signe_le: form.get("signe_le") ? String(form.get("signe_le")) : null,
        conserver_jusqu_au: conserver.toISOString().slice(0, 10),
        notes: String(form.get("notes") || "").trim() || null,
        depose_par: session.email,
      })
      .select("id, titre, empreinte_sha256")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      piece: (data || [])[0] || null,
      empreinte: empreinte,
      conserver_jusqu_au: conserver.toISOString().slice(0, 10),
      message: "Document depose au coffre. Son empreinte est calculee et conservee.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
