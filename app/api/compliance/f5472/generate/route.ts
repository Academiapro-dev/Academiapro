import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const P = "topmostSubform[0].";

// ---------------------------------------------------------------------------
// 🚨 TROIS DEFAUTS CORRIGES LE 31/08. C ETAIT LA ROUTE LA PLUS EXPOSEE DU
// MODULE, ET SA JUMELLE f1120/generate ETAIT DEJA JUSTE — quelqu un a
// corrige l une et oublie l autre.
//
// DEFAUT 1 — AUCUNE SESSION N ETAIT EXIGEE. Ni sessionCourante, ni controle
// d origine : la route repondait a n importe quel appelant.
//
// DEFAUT 2 — LE TENANT VENAIT DU CORPS DE LA REQUETE. Il suffisait de poster
// { tenant_id: "..." } pour obtenir le formulaire 5472 d un AUTRE
// ORGANISME : son EIN, son adresse, L IDENTITE DE SON ACTIONNAIRE ETRANGER
// et le detail de ses transactions. Et la route renvoyait en prime UN LIEN
// SIGNE VALABLE UNE HEURE vers ce PDF. Un identifiant devine ou apercu
// suffisait a emporter le dossier fiscal americain d un client.
//
// DEFAUT 3 — LES DEPENSES N ETAIENT PAS FILTREES. La lecture additionnait
// LES AVANCES DE TOUTE LA BASE, tous clients confondus. Les montants portes
// sur le formulaire etaient donc faux des qu il existe plus d un client —
// un chiffre faux sur une declaration IRS, c est pire qu une absence.
//
// LA REGLE, LA MEME QUE PARTOUT AILLEURS : le tenant vient de la SESSION,
// jamais de la requete. Ce que le navigateur envoie n est jamais une
// autorisation.
// ---------------------------------------------------------------------------

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return Number(n).toFixed(2);
}

// Convertit une date ISO AAAA-MM-JJ au format IRS MM/JJ/AAAA
function dateIRS(v: unknown): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  if (p.length !== 3) return s;
  return p[1] + "/" + p[2] + "/" + p[0];
}

// Coupe l'adresse a la premiere virgule : rue / ville-etat-zip
function coupeAdresse(v: unknown): { rue: string; villeEtatZip: string } {
  const s = String(v ?? "").trim();
  const i = s.indexOf(",");
  if (i === -1) return { rue: s, villeEtatZip: "" };
  return {
    rue: s.slice(0, i).trim(),
    villeEtatZip: s.slice(i + 1).trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // L ORGANISME VIENT DE LA SESSION SIGNEE, ET DE NULLE PART AILLEURS.
    // Un tenant_id present dans le corps de la requete est desormais
    // IGNORE : il n a jamais rien prouve.
    const session = sessionCourante();
    const tenantId = session ? session.tenantId : null;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Session sans societe rattachee. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const year = Number(body.year) || new Date().getFullYear();

    const { data: m, error: eMap } = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("tax_year", year)
      .maybeSingle();

    if (eMap) {
      console.error("[f5472] lecture mapping :", eMap.message);
      return NextResponse.json({ error: "Lecture du mapping impossible." }, { status: 500 });
    }
    if (!m) {
      return NextResponse.json({ error: "Aucun mapping pour cet exercice" }, { status: 404 });
    }

    // ---- RECALCUL A LA VOLEE DES AVANCES DU MEMBRE ----
    //
    // ⚠️ LE FILTRE tenant_id EST INDISPENSABLE ICI. Sans lui, cette lecture
    // additionnait les avances de TOUS les clients : le montant porte sur le
    // formulaire n avait aucun rapport avec la societe declarante.
    const { data: dep, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, devise, date_depense")
      .eq("tenant_id", tenantId)
      .eq("avance_perso", true)
      .eq("rembourse", false)
      .gte("date_depense", year + "-01-01")
      .lte("date_depense", year + "-12-31")
      .limit(5000);

    if (eDep) {
      console.error("[f5472] lecture depenses :", eDep.message);
      return NextResponse.json({ error: "Lecture des depenses impossible." }, { status: 500 });
    }

    const taux = Number(m.taux_eur_usd) || 1;
    let totalUsdNatif = 0;
    let totalEurNatif = 0;

    for (const d of dep ?? []) {
      const montant = Number(d.montant_ttc) || 0;
      const devise = String(d.devise || "").toUpperCase();
      if (devise === "EUR") {
        totalEurNatif += montant;
      } else {
        totalUsdNatif += montant;
      }
    }

    const totalUsd = Math.round((totalUsdNatif + totalEurNatif * taux) * 100) / 100;
    const nbAvances = (dep ?? []).length;
    const adr = coupeAdresse(m.ri_address);

    const res = await fetch("https://academiapro.fr/forms/f5472.pdf");
    if (!res.ok) {
      return NextResponse.json({ error: "PDF source introuvable" }, { status: 500 });
    }
    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    const setText = (path: string, value: unknown) => {
      if (value === null || value === undefined || value === "") return;
      try {
        form.getTextField(P + path).setText(String(value));
      } catch {
        // champ absent : on ignore silencieusement
      }
    };

    const check = (path: string) => {
      try {
        form.getCheckBox(P + path).check();
      } catch {
        // case absente : on ignore
      }
    };

    // ---- PAGE 1 : Part I ----
    setText("Page1[0].Line1a[0].f1_5[0]", m.ri_name);
    setText("Page1[0].Line1a[0].f1_6[0]", adr.rue);
    setText("Page1[0].Line1a[0].f1_7[0]", adr.villeEtatZip);
    setText("Page1[0].f1_8[0]", m.ri_ein);
    setText("Page1[0].f1_9[0]", money(totalUsd));
    setText("Page1[0].f1_10[0]", m.ri_business_activity);
    setText("Page1[0].f1_11[0]", m.ri_naics);
    setText("Page1[0].Line1f_ReadOrder[0].f1_12[0]", money(totalUsd));
    setText("Page1[0].f1_13[0]", m.ri_nb_5472);
    setText("Page1[0].f1_14[0]", money(totalUsd));
    setText("Page1[0].f1_15[0]", m.ri_nb_partsviii);
    setText("Page1[0].f1_16[0]", m.ri_country_incorp);
    setText("Page1[0].f1_17[0]", dateIRS(m.ri_date_incorp));
    setText("Page1[0].f1_18[0]", m.ri_country_resident);
    setText("Page1[0].f1_19[0]", m.ri_country_business);

    if (m.ri_initial_year) check("Page1[0].Line1j_ReadOrder[0].c1_2[0]");
    if (m.ri_is_foreign_owned_de) check("Page1[0].c1_4[0]");

    // ---- PAGE 1 : Part II (25% foreign shareholder) ----
    setText("Page1[0].f1_20[0]", m.fs_name_address);
    setText("Page1[0].f1_22[0]", m.fs_us_id);
    setText("Page1[0].f1_23[0]", m.fs_ftin);
    setText("Page1[0].f1_24[0]", m.fs_country_business);
    setText("Page1[0].f1_25[0]", m.fs_country_citizenship);
    setText("Page1[0].f1_26[0]", m.fs_country_resident);

    // ---- PAGE 2 : Part III (related party) ----
    if (m.rp_is_foreign) check("Page2[0].c2_1[0]");
    setText("Page2[0].f2_1[0]", m.rp_name_address);
    setText("Page2[0].f2_4[0]", m.rp_ftin);
    setText("Page2[0].f2_5[0]", m.rp_business_activity);
    setText("Page2[0].f2_6[0]", m.rp_naics);
    setText("Page2[0].f2_7[0]", m.rp_country_business);
    setText("Page2[0].f2_8[0]", m.rp_country_resident);
    if (m.rp_related_to_reporting) check("Page2[0].c2_2[0]");
    if (m.rp_is_25pct_shareholder) check("Page2[0].c2_4[0]");

    // ---- PAGE 2 : Part IV (transactions) ----
    setText("Page2[0].f2_18[0]", money(m.p4_l17a_beginning_balance_usd));
    setText("Page2[0].f2_19[0]", money(totalUsd));
    setText("Page2[0].f2_24[0]", money(totalUsd));

    // ---- PAGE 3 : Part VII (tout No = index [1]) ----
    for (let i = 1; i <= 12; i++) {
      check("Page3[0].c3_" + i + "[1]");
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    // ---- Rangement au coffre prive ----
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = tenantId + "/5472/" + year + "/f5472-" + stamp + ".pdf";

    const { error: eUp } = await supabase.storage
      .from("compliance-docs")
      .upload(path, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (eUp) {
      console.error("[f5472] depot au coffre :", eUp.message);
      return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(path, 3600);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      year,
      path,
      url: signed?.signedUrl ?? null,
      calcul: {
        nb_avances: nbAvances,
        total_usd_natif: Math.round(totalUsdNatif * 100) / 100,
        total_eur_natif: Math.round(totalEurNatif * 100) / 100,
        taux_eur_usd: taux,
        taux_valide: m.taux_valide,
        total_usd: totalUsd,
      },
      controle: {
        rue: adr.rue,
        ville_etat_zip: adr.villeEtatZip,
        date_incorp_irs: dateIRS(m.ri_date_incorp),
      },
      note: "PDF fictif - taux provisoire, qualification non validee par fiscaliste",
    });
  } catch (e: unknown) {
    console.error("[f5472] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
