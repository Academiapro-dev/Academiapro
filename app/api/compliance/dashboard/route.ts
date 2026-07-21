import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  const legitime =
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr")
    || origine.includes("vercel.app") || referent.includes("vercel.app")
    || origine.includes("localhost") || referent.includes("localhost");
  if (!legitime) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenant_id = req.nextUrl.searchParams.get("tenant_id") || "";
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id manquant" }, { status: 400 });
  }

  try {
    // Profil du tenant
    const { data: tenant } = await supabase
      .from("compliance_tenants")
      .select("legal_name, wy_filing_id, member_residence, has_us_source_income")
      .eq("tenant_id", tenant_id)
      .single();

    // Echeances a venir, avec le titre de la regle
    const { data: deadlinesRaw } = await supabase
      .from("compliance_deadlines")
      .select("id, rule_code, period_label, due_date, status, amount_due, currency")
      .eq("tenant_id", tenant_id)
      .order("due_date", { ascending: true });

    // Titres des regles (jointure manuelle)
    const { data: rules } = await supabase
      .from("compliance_rules")
      .select("code, title, jurisdiction, channel");
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
    const { data: docsRaw } = await supabase
      .from("compliance_documents")
      .select("id, doc_type, title, version, storage_path, uploaded_at")
      .eq("tenant_id", tenant_id)
      .order("uploaded_at", { ascending: false });

    const docs = [];
    for (const doc of docsRaw || []) {
      // storage_path est du type "compliance-docs/xxx/yyy.html"
      const p = (doc.storage_path || "").replace(/^compliance-docs\//, "");
      let url = null;
      try {
        const { data: signed } = await supabase.storage
          .from("compliance-docs")
          .createSignedUrl(p, 3600);
        url = signed?.signedUrl || null;
      } catch (e) {
        url = null;
      }
      docs.push({ ...doc, download_url: url });
    }

    return NextResponse.json({
      success: true,
      tenant,
      deadlines,
      documents: docs,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
