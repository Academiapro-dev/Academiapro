import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "qualiopi-preuves";
const TAILLE_MAX = 20 * 1024 * 1024;

function sessionDuCookie() {
  try {
    const brut = cookies().get("sb_user")?.value;
    if (!brut) return null;
    const u = JSON.parse(decodeURIComponent(brut));
    if (!u || !u.tenant_id) return null;
    return { tenantId: u.tenant_id, email: u.email || null };
  } catch (e) {
    return null;
  }
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function nettoyerNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

export async function GET(req: NextRequest) {
  const session = sessionDuCookie();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  const indicateurId = req.nextUrl.searchParams.get("indicateur_id");
  if (!indicateurId) {
    return NextResponse.json(
      { ok: false, erreur: "indicateur_id manquant" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("qualiopi_preuves")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("indicateur_id", indicateurId)
    .order("uploaded_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_preuves: " + error.message },
      { status: 500 }
    );
  }

  const avecLiens = [];
  for (const p of data || []) {
    let url = null;
    if (p.storage_path) {
      const signe = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(p.storage_path, 3600);
      url = signe.data ? signe.data.signedUrl : null;
    }
    avecLiens.push({
      id: p.id,
      titre: p.titre,
      mime_type: p.mime_type,
      size_bytes: p.size_bytes,
      notes: p.notes,
      uploaded_at: p.uploaded_at,
      url: url,
    });
  }

  return NextResponse.json({ ok: true, preuves: avecLiens });
}

export async function POST(req: NextRequest) {
  const session = sessionDuCookie();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, erreur: "Formulaire illisible : " + e.message },
      { status: 400 }
    );
  }

  const indicateurId = String(form.get("indicateur_id") || "");
  const titre = String(form.get("titre") || "");
  const notes = String(form.get("notes") || "");
  const fichier = form.get("fichier") as File | null;

  if (!indicateurId) {
    return NextResponse.json(
      { ok: false, erreur: "indicateur_id manquant" },
      { status: 400 }
    );
  }
  if (!fichier || typeof fichier.arrayBuffer !== "function") {
    return NextResponse.json(
      { ok: false, erreur: "Aucun fichier recu" },
      { status: 400 }
    );
  }
  if (fichier.size > TAILLE_MAX) {
    return NextResponse.json(
      { ok: false, erreur: "Fichier trop volumineux (20 Mo maximum)" },
      { status: 400 }
    );
  }

  const octets = Buffer.from(await fichier.arrayBuffer());
  const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

  const chemin =
    session.tenantId +
    "/" +
    indicateurId +
    "/" +
    Date.now() +
    "_" +
    nettoyerNom(fichier.name || "preuve");

  const envoi = await supabase.storage.from(BUCKET).upload(chemin, octets, {
    contentType: fichier.type || "application/octet-stream",
    upsert: false,
  });

  if (envoi.error) {
    return NextResponse.json(
      { ok: false, erreur: "Depot dans le bucket : " + envoi.error.message },
      { status: 500 }
    );
  }

  const { data: existantes } = await supabase
    .from("qualiopi_preuves")
    .select("version")
    .eq("tenant_id", session.tenantId)
    .eq("indicateur_id", indicateurId)
    .order("version", { ascending: false })
    .limit(1);

  const version =
    existantes && existantes.length > 0 ? (existantes[0].version || 0) + 1 : 1;

  const { data, error } = await supabase
    .from("qualiopi_preuves")
    .insert({
      tenant_id: session.tenantId,
      indicateur_id: indicateurId,
      titre: titre || fichier.name || "Preuve",
      storage_path: chemin,
      file_hash: empreinte,
      mime_type: fichier.type || null,
      size_bytes: fichier.size,
      version: version,
      notes: notes || null,
    })
    .select()
    .limit(1);

  if (error) {
    await supabase.storage.from(BUCKET).remove([chemin]);
    return NextResponse.json(
      { ok: false, erreur: "Ecriture qualiopi_preuves: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, preuve: (data || [])[0] || null });
}

export async function DELETE(req: NextRequest) {
  const session = sessionDuCookie();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, erreur: "id manquant" },
      { status: 400 }
    );
  }

  const { data: lignes, error: errLect } = await supabase
    .from("qualiopi_preuves")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .limit(1);

  if (errLect) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture : " + errLect.message },
      { status: 500 }
    );
  }
  if (!lignes || lignes.length === 0) {
    return NextResponse.json(
      { ok: false, erreur: "Preuve introuvable" },
      { status: 404 }
    );
  }

  const preuve = lignes[0];

  if (preuve.storage_path) {
    await supabase.storage.from(BUCKET).remove([preuve.storage_path]);
  }

  const { error } = await supabase
    .from("qualiopi_preuves")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Suppression : " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
