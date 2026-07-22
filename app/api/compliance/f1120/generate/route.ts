import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const P = "topmostSubform[0].";

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return Number(n).toFixed(2);
}

function dateIRS(v: unknown): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  if (p.length !== 3) return s;
  return p[1] + "/" + p[2] + "/" + p[0];
}

export async function POST(req: Request) {
  const journal: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenant_id as string | undefined;
    const year = Number(body.year) || new Date().getFullYear();
    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id requis" }, { status: 400 });
    }

    const { data: m, error: eMap } = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("tax_year", year)
      .maybeSingle();

    if (eMap) {
      return NextResponse.json({ error: "Lecture mapping: " + eMap.message }, { status: 500 });
    }
    if (!m) {
      return NextResponse.json({ error: "Aucun mapping pour cet exercice" }, { status: 404 });
    }

    // ---- RECALCUL A LA VOLEE (meme logique que le 5472) ----
    const { data: dep, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, devise, date_depense")
      .eq("avance_perso", true)
      .eq("rembourse", false)
      .gte("date_depense", year + "-01-01")
      .lte("date_depense", year + "-12-31");

    if (eDep) {
      return NextResponse.json({ error: "Lecture depenses: " + eDep.message }, { status: 500 });
    }

    const taux = Number(m.taux_eur_usd) || 1;
    let totalUsdNatif = 0;
    let totalEurNatif = 0;

    for (const d of dep ?? []) {
      const montant = Number(d.montant_ttc) || 0;
      if (String(d.devise || "").toUpperCase() === "EUR") {
        totalEurNatif += montant;
      } else {
        totalUsdNatif += montant;
      }
    }

    const totalUsd = Math.round((totalUsdNatif + totalEurNatif * taux) * 100) / 100;

    const res = await fetch("https://academiapro.fr/forms/f1120.pdf");
    if (!res.ok) {
      return NextResponse.json({ error: "PDF source introuvable" }, { status: 500 });
    }

    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    const setText = (chemin: string, valeur: unknown) => {
      if (valeur === null || valeur === undefined || valeur === "") return;
      try {
        form.getTextField(P + chemin).setText(String(valeur));
      } catch (e: unknown) {
        journal.push("TEXTE " + chemin + " : " + (e instanceof Error ? e.message : String(e)));
      }
    };

    const cocher = (chemin: string) => {
      try {
        form.getCheckBox(P + chemin).check();
      } catch (e: unknown) {
        journal.push("CASE " + chemin + " : " + (e instanceof Error ? e.message : String(e)));
      }
    };

    // ---- PAGE 1 ----
    setText("Page1[0].f1_4[0]", m.ri_name);
    setText("Page1[0].f1_5[0]", m.adr_rue);
    setText("Page1[0].f1_6[0]", m.adr_suite);
    setText("Page1[0].f1_7[0]", m.adr_ville);
    setText("Page1[0].f1_8[0]", m.adr_etat);
    setText("Page1[0].f1_9[0]", m.adr_pays);
    setText("Page1[0].f1_10[0]", m.adr_zip);
    setText("Page1[0].f1_11[0]", m.ri_ein);
    setText("Page1[0].f1_12[0]", dateIRS(m.ri_date_incorp));
    setText("Page1[0].f1_13[0]", money(totalUsd));

    if (m.f1120_initial_return) cocher("Page1[0].c1_6[0]");

    // ---- PAGE 4 : Schedule K question 7 ----
    if (m.f1120_schedk_q7_foreign_owner) cocher("Page4[0].c4_8[0]");
    setText("Page4[0].f4_31[0]", m.f1120_schedk_q7_pct);
    setText("Page4[0].f4_32[0]", m.f1120_schedk_q7_country);
    setText("Page4[0].f4_33[0]", m.ri_nb_5472);

    // ---- PAGE 5 : Schedule K question 27 (digital assets = No) ----
    if (!m.f1120_schedk_q27_digital_assets) cocher("Page5[0].c5_16[1]");

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = tenantId + "/1120/" + year + "/f1120-" + stamp + ".pdf";

    const { error: eUp } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (eUp) {
      return NextResponse.json({ error: "Upload coffre: " + eUp.message, journal }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(chemin, 3600);

    return NextResponse.json({
      success: true,
      year,
      path: chemin,
      url: signed?.signedUrl ?? null,
      calcul: {
        nb_avances: (dep ?? []).length,
        total_usd_natif: Math.round(totalUsdNatif * 100) / 100,
        total_eur_natif: Math.round(totalEurNatif * 100) / 100,
        taux_eur_usd: taux,
        taux_valide: m.taux_valide,
        total_usd: totalUsd,
      },
      controle: {
        adresse: [m.adr_rue, m.adr_suite, m.adr_ville, m.adr_etat, m.adr_pays, m.adr_zip],
        date_incorp_irs: dateIRS(m.ri_date_incorp),
        initial_return: m.f1120_initial_return,
        q7_yes: m.f1120_schedk_q7_foreign_owner,
        q27_digital: m.f1120_schedk_q27_digital_assets,
      },
      nb_avertissements: journal.length,
      avertissements: journal,
      note: "PDF fictif - taux provisoire, qualification non validee par fiscaliste",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), journal },
      { status: 500 }
    );
  }
}
