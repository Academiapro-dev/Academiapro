import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

// L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge donnait acces au coffre complet d un autre
// organisme, avec des URL de telechargement valables une heure.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

export async function GET(req: NextRequest) {
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

  const journal: string[] = [];

  try {
    // Profil du tenant
    const { data: tenant } = await supabase
      .from("compliance_tenants")
      .select("legal_name, wy_filing_id, member_residence, has_us_source_income")
      .eq("tenant_id", tenantId)
      .single();

    // Echeances
    const { data: deadlinesRaw } = await supabase
      .from("compliance_deadlines")
      .select("id, rule_code, period_label, due_date, status, amount_due, currency")
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: true })
      .limit(500);

    // Titres des regles (catalogue commun a tous les tenants)
    const { data: rules } = await supabase
      .from("compliance_rules")
      .select("code, title, jurisdiction, channel")
      .limit(500);
    const titreMap: Record<string, any> = {};
    for (const r of rules || []) {
      titreMap[r.code] = r;
    }
    const deadlines = (deadlinesRaw || []).map((d: any) => ({
      ...d,
      title: titreMap[d.rule_code]?.title || d.rule_code,
      jurisdiction: titreMap[d.rule_code]?.jurisdiction || "",
      channel: titreMap[d.rule_code]?.channel || "",
    }));

    // Coffre : documents + URL signee (1h)
    const { data: docsRaw, error: eDocs } = await supabase
      .from("compliance_documents")
      .select("id, doc_type, title, version, storage_path, uploaded_at")
      .eq("tenant_id", tenantId)
      .order("uploaded_at", { ascending: false })
      .limit(200);

    if (eDocs) {
      journal.push("Lecture documents : " + eDocs.message);
    }

    const nbLus = (docsRaw || []).length;

    const docs = [];
    for (const doc of docsRaw || []) {
      const p = (doc.storage_path || "").replace(/^compliance-docs\//, "");
      let url = null;
      try {
        const { data: signed, error: eSign } = await supabase.storage
          .from("compliance-docs")
          .createSignedUrl(p, 3600);
        url = signed?.signedUrl || null;
        if (eSign) {
          journal.push("URL signee KO pour " + doc.title + " : " + eSign.message);
        }
      } catch (e: unknown) {
        journal.push(
          "URL signee exception pour " + doc.title + " : " +
          (e instanceof Error ? e.message : String(e))
        );
      }
      docs.push({ ...doc, download_url: url });
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      tenant,
      deadlines,
      documents: docs,
      diagnostic: {
        nb_documents_lus: nbLus,
        nb_documents_renvoyes: docs.length,
        avertissements: journal,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e), journal },
      { status: 500 }
    );
  }
}
