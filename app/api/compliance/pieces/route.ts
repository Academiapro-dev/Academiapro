import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { barrage, lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "pieces-comptables";
const TAILLE_MAX = 15 * 1024 * 1024;

const TYPES: any = {
  facture_achat: "Facture d achat",
  facture_vente: "Facture de vente",
  note_frais: "Note de frais",
  releve_bancaire: "Releve bancaire",
  contrat: "Contrat",
  bulletin_paie: "Bulletin de paie",
  avis_impot: "Avis d imposition",
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

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Telechargement : lien signe, valable une heure.
    const piece = url.searchParams.get("piece");
    if (piece) {
      const { data: ligne } = await supabase
        .from("compta_pieces")
        .select("chemin, nom, societe_id")
        .eq("id", piece)
        .maybeSingle();

      if (!ligne) {
        return NextResponse.json({ ok: false, erreur: "Piece introuvable." }, { status: 404 });
      }

      // Un lien signe donne acces au justificatif lui-meme.
      const refus = await lecture(ligne.societe_id);
      if (refus) return refus;

      const { data: signe, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(ligne.chemin, 3600);

      if (error || !signe) {
        return NextResponse.json({ ok: false, erreur: "Fichier introuvable." }, { status: 404 });
      }

      return NextResponse.json({ ok: true, url: signe.signedUrl, nom: ligne.nom });
    }

    const id = (url.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data: pieces } = await supabase
      .from("compta_pieces")
      .select("*")
      .eq("societe_id", id)
      .order("created_at", { ascending: false })
      .limit(2000);

    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num, ecriture_date, ecriture_lib, journal_code, debit, credit")
      .eq("societe_id", id)
      .limit(20000);

    const avecPiece: any = {};
    for (const p of pieces || []) {
      if (p.ecriture_num) avecPiece[p.ecriture_num] = true;
    }

    const regroupees: any = {};
    for (const e of ecritures || []) {
      const n = String(e.ecriture_num);
      if (avecPiece[n] || e.journal_code === "AN") continue;
      if (!regroupees[n]) {
        regroupees[n] = {
          ecriture_num: n,
          date: e.ecriture_date,
          libelle: e.ecriture_lib,
          journal: e.journal_code,
          montant: 0,
        };
      }
      regroupees[n].montant = Math.round((regroupees[n].montant + (Number(e.debit) || 0)) * 100) / 100;
    }

    const sansPiece = Object.keys(regroupees)
      .map(function (k) { return regroupees[k]; })
      .sort(function (a: any, b: any) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 200);

    return NextResponse.json({
      ok: true,
      types: TYPES,
      total: (pieces || []).length,
      rattachees: (pieces || []).filter(function (p: any) { return !!p.ecriture_num; }).length,
      sans_piece: sansPiece.length,
      pieces: pieces || [],
      ecritures_sans_piece: sansPiece,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const type = req.headers.get("content-type") || "";

    // Rattachement d une piece deja deposee a une ecriture.
    if (type.indexOf("application/json") >= 0) {
      const b = await req.json().catch(function () { return null; });
      if (!b || !b.id) {
        return NextResponse.json({ ok: false, erreur: "Piece non precisee." }, { status: 400 });
      }

      const { data: piece } = await supabase
        .from("compta_pieces")
        .select("societe_id")
        .eq("id", b.id)
        .maybeSingle();

      if (!piece) {
        return NextResponse.json({ ok: false, erreur: "Piece introuvable." }, { status: 404 });
      }

      const refus = await barrage("deposer_pieces", piece.societe_id);
      if (refus) return refus;

      const { error } = await supabase
        .from("compta_pieces")
        .update({ ecriture_num: propre(b.ecriture_num, 40) })
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: b.ecriture_num ? "Piece rattachee a " + b.ecriture_num + "." : "Rattachement retire.",
      });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e: any) {
      return NextResponse.json({ ok: false, erreur: "Formulaire illisible." }, { status: 400 });
    }

    const societeId = String(form.get("societe_id") || "").trim();
    if (!societeId) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await barrage("deposer_pieces", societeId);
    if (refus) return refus;

    const session = sessionCourante();

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

    const octets = Buffer.from(await fichier.arrayBuffer());
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

    const extension = (fichier.name || "piece.pdf").split(".").pop() || "pdf";
    const chemin = societeId + "/" + Date.now() + "-"
      + Math.random().toString(36).slice(2, 7) + "." + extension.toLowerCase();

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

    function nombre(v: any) {
      const n = Number(String(v || "").replace(",", "."));
      return isNaN(n) || n === 0 ? null : Math.round(n * 100) / 100;
    }

    const typeDoc = String(form.get("type_document") || "facture_achat");

    const { data, error } = await supabase
      .from("compta_pieces")
      .insert({
        societe_id: societeId,
        ecriture_num: propre(form.get("ecriture_num"), 40),
        nom: propre(form.get("nom"), 200) || fichier.name || "Piece",
        type_document: TYPES[typeDoc] ? typeDoc : "autre",
        chemin: chemin,
        empreinte_sha256: empreinte,
        octets: octets.length,
        montant_ttc: nombre(form.get("montant_ttc")),
        montant_ht: nombre(form.get("montant_ht")),
        tva: nombre(form.get("tva")),
        date_piece: form.get("date_piece") ? String(form.get("date_piece")).slice(0, 10) : null,
        fournisseur: propre(form.get("fournisseur"), 200),
        reference: propre(form.get("reference"), 80),
        notes: propre(form.get("notes"), 1000),
        depose_par: session ? session.email : null,
      })
      .select("id, nom")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      piece: (data || [])[0] || null,
      empreinte: empreinte,
      message: "Piece deposee et son empreinte calculee.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Piece non precisee." }, { status: 400 });
    }

    const { data: piece } = await supabase
      .from("compta_pieces")
      .select("chemin, ecriture_num, societe_id")
      .eq("id", id)
      .maybeSingle();

    if (!piece) {
      return NextResponse.json({ ok: false, erreur: "Piece introuvable." }, { status: 404 });
    }

    const refus = await barrage("deposer_pieces", piece.societe_id);
    if (refus) return refus;

    if (piece.ecriture_num) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Cette piece justifie l ecriture " + piece.ecriture_num
            + ". Detachez-la avant de la supprimer.",
        },
        { status: 409 }
      );
    }

    await supabase.storage.from(BUCKET).remove([piece.chemin]);
    const { error } = await supabase.from("compta_pieces").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Piece supprimee." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
