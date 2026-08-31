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
const NF = "Page1[0].NameFieldsReadOrder[0].";

// ---------------------------------------------------------------------------
// 🚨 PLUSIEURS SOCIETES PAR ORGANISME — 31/08 apres-midi.
//
// CE QUI CHANGE. Cette route generait « le » 1120 du compte : elle tenait
// pour acquis qu un organisme n avait qu une societe. Un gestionnaire qui
// suit des dizaines de LLC aurait obtenu le MEME formulaire pour toutes,
// rempli avec les chiffres de la premiere. Des montants faux sur une
// declaration IRS sont pires qu une absence de declaration.
//
// 🚨🚨 L IDENTIFIANT RECU N EST JAMAIS UNE AUTORISATION. C est le defaut
// trouve le meme jour dans f5472 et f3916, ou le tenant etait pris dans le
// corps de la requete sans verification. La regle appliquee ici : l entite
// est cherchee AVEC le filtre tenant_id de la session. Une societe d un
// autre gestionnaire ne correspond a aucune ligne — elle est introuvable,
// et rien ne fuit.
//
// ---- DEFAUT TROUVE A L AUDIT DU SOIR — 31/08 ---------------------------
//
// 🚨 LE REPLI SILENCIEUX PRODUISAIT DES MONTANTS FAUX. La lecture du
// mapping et celle des depenses tentaient d abord un filtre par entite,
// puis RETOMBAIENT sur un filtre par tenant seul. Si le premier filtre
// echouait, le 1120 de la societe A sortait rempli avec LES AVANCES DE
// TOUT LE PORTEFEUILLE — sans erreur, sans avertissement.
//
// La colonne entite_id existe sur les cinq tables du module, verifie en
// base le 31/08. LE REPLI EST SUPPRIME : un echec de lecture est desormais
// une erreur franche.
//
// ⚠️ NE PAS LE REINTRODUIRE. Un repli qui change le PERIMETRE des donnees
// n est pas une securite, c est une source de faux silencieux.
//
// ⚠️ CETTE ROUTE ET f5472/generate SONT JUMELLES. Le motif du 31/08 s est
// produit deux fois : un defaut corrige dans l une, oublie dans l autre.
// TOUTE MODIFICATION ICI DOIT ETRE REPORTEE LA-BAS, ET RECIPROQUEMENT.
// ---------------------------------------------------------------------------

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("mysterllc.com") || referent.includes("mysterllc.com") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

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

export async function POST(req: NextRequest) {
  const journal: string[] = [];

  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
  // sb_user, un cookie forge permettait de generer le 1120 d un autre organisme.
  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const year = Number(body.year) || new Date().getFullYear();
    const entiteDemandee = String(body.entite_id || "").trim();

    // ---- LA SOCIETE CONCERNEE ----
    //
    // ⚠️ LE FILTRE tenant_id EST CE QUI REND L IDENTIFIANT RECU INOFFENSIF.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[f1120] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;

    // ---- LE MAPPING DE CETTE SOCIETE ----
    //
    // 🚨 DOUBLE FILTRE OBLIGATOIRE, SANS REPLI : tenant_id borne a
    // l organisme, entite_id borne a la societe.
    const { data: m, error: eMap } = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("tax_year", year)
      .maybeSingle();

    if (eMap) {
      console.error("[f1120] lecture mapping :", eMap.message);
      return NextResponse.json({ error: "Lecture du mapping impossible." }, { status: 500 });
    }

    if (!m) {
      return NextResponse.json(
        {
          error: "Aucun mapping pour " + entite.label + " sur l'exercice " + year
            + ". Renseignez-le avant de generer le formulaire.",
        },
        { status: 404 }
      );
    }

    // ---- RECALCUL DES AVANCES ----
    //
    // 🚨 DOUBLE FILTRE OBLIGATOIRE : ces montants partent sur une
    // declaration fiscale americaine.
    const { data: dep, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, devise, date_depense")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("avance_perso", true)
      .eq("rembourse", false)
      .gte("date_depense", year + "-01-01")
      .lte("date_depense", year + "-12-31")
      .limit(5000);

    if (eDep) {
      console.error("[f1120] lecture depenses :", eDep.message);
      return NextResponse.json({ error: "Lecture des depenses impossible." }, { status: 500 });
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

    // ---- PAGE 1 : nom et adresse sous NameFieldsReadOrder ----
    setText(NF + "f1_4[0]", m.ri_name);
    setText(NF + "f1_5[0]", m.adr_rue);
    setText(NF + "f1_6[0]", m.adr_suite);
    setText(NF + "f1_7[0]", m.adr_ville);
    setText(NF + "f1_8[0]", m.adr_etat);
    setText(NF + "f1_9[0]", m.adr_pays);
    setText(NF + "f1_10[0]", m.adr_zip);

    // ---- PAGE 1 : B, C, D directement sous Page1 ----
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

    // Le chemin porte l identifiant de l ENTITE : sans cela, les documents
    // de toutes les societes se melangeraient dans un meme dossier.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = tenantId + "/" + entiteId + "/1120/" + year + "/f1120-" + stamp + ".pdf";

    const { error: eUp } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (eUp) {
      console.error("[f1120] depot au coffre :", eUp.message);
      return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(chemin, 3600);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      societe: entite.label,
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
    console.error("[f1120] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur.", journal }, { status: 500 });
  }
}
