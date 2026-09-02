import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge permettait de deposer des pieces dans le coffre
// d un autre organisme.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

function nomSur(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const form = await req.formData();

    const fichier = form.get("fichier") as File | null;
    const titre = String(form.get("titre") || "");
    const docType = String(form.get("doc_type") || "piece_justificative");
    const ruleCode = String(form.get("rule_code") || "");
    const notes = String(form.get("notes") || "");

    if (!fichier) {
      return NextResponse.json({ error: "Aucun fichier recu" }, { status: 400 });
    }
    if (!titre) {
      return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());

    if (octets.length === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }
    if (octets.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (maximum 20 Mo)" },
        { status: 400 }
      );
    }

    const hash = createHash("sha256").update(octets).digest("hex");

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: docType,
    });
    const version = ver || 1;

    const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin =
      tenantId + "/pieces/" + docType + "/" + horodatage + "-" + nomSur(fichier.name);

    const { error: eUp } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, octets, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });

    if (eUp) {
      return NextResponse.json(
        { error: "Depot au coffre echoue : " + eUp.message },
        { status: 500 }
      );
    }

    const { error: eIns } = await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      rule_code: ruleCode || null,
      doc_type: docType,
      title: titre,
      version: version,
      storage_path: "compliance-docs/" + chemin,
      file_hash: hash,
      mime_type: fichier.type || "application/octet-stream",
      size_bytes: octets.length,
      notes: notes || null,
    });

    if (eIns) {
      return NextResponse.json(
        { error: "Fichier depose mais enregistrement echoue : " + eIns.message, path: chemin },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      titre,
      doc_type: docType,
      version,
      path: chemin,
      taille_octets: octets.length,
      hash_sha256: hash,
      mime_type: fichier.type || "application/octet-stream",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
