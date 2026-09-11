import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";
// 🚨 LE CONTROLE D ORIGINE EST DESORMAIS PARTAGE — 01/09.
//
// Cette route avait deja recu mysterllc.com le 31/08 : elle fonctionnait.
// Mais elle gardait SA PROPRE COPIE de la fonction, ce qui annulait
// l interet du fichier partage — la prochaine marque aurait ete oubliee
// ici comme ailleurs.
//
// ⚠️ NE PAS REDEFINIR origineLegitime ICI.
import { origineLegitime } from "../../../../../lib/origine";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const P = "topmostSubform[0].";

// ---------------------------------------------------------------------------
// 🚨 TROIS DEFAUTS CORRIGES LE 31/08, PUIS PASSAGE AU MULTI-SOCIETES.
//
// DEFAUT 1 — AUCUNE SESSION N ETAIT EXIGEE. Ni sessionCourante, ni controle
// d origine : la route repondait a n importe quel appelant.
//
// DEFAUT 2 — LE TENANT VENAIT DU CORPS DE LA REQUETE. Il suffisait de poster
// { tenant_id: "..." } pour obtenir le formulaire 5472 d un AUTRE
// ORGANISME : son EIN, son adresse, L IDENTITE DE SON ACTIONNAIRE ETRANGER
// et le detail de ses transactions. Et la route renvoyait en prime UN LIEN
// SIGNE VALABLE UNE HEURE vers ce PDF.
//
// DEFAUT 3 — LES DEPENSES N ETAIENT PAS FILTREES. La lecture additionnait
// LES AVANCES DE TOUTE LA BASE, tous clients confondus.
//
// ---- AJOUT DU 31/08 APRES-MIDI : PLUSIEURS SOCIETES PAR ORGANISME --------
//
// Un gestionnaire qui suit des dizaines de LLC doit pouvoir generer LE
// formulaire DE LA SOCIETE QU IL A OUVERTE. La route accepte donc
// `entite_id` — c est un choix dans une liste, il vient logiquement du
// navigateur.
//
// 🚨🚨 MAIS UN IDENTIFIANT RECU N EST JAMAIS UNE AUTORISATION. C est
// exactement le defaut 2 ci-dessus. La regle appliquee ici : l entite est
// cherchee AVEC le filtre tenant_id de la session. Une entite d un autre
// organisme ne correspond a aucune ligne — elle est donc introuvable, et
// rien ne fuit.
//
// ---- DEFAUT 4, TROUVE A L AUDIT DU SOIR — 31/08 -------------------------
//
// 🚨 LE REPLI SILENCIEUX PRODUISAIT DES MONTANTS FAUX. La lecture du
// mapping et celle des depenses tentaient d abord un filtre par entite,
// puis RETOMBAIENT sur un filtre par tenant seul en cas d echec. Ce repli
// avait ete ecrit parce que la colonne entite_id pouvait ne pas exister
// encore sur ces tables.
//
// CE QU IL PRODUISAIT : si le filtre par entite echouait pour une raison
// quelconque, le formulaire de la societe A etait rempli avec LES AVANCES
// DE TOUT LE PORTEFEUILLE. Aucune erreur, aucun avertissement — un PDF
// d apparence normale, avec des chiffres qui ne correspondent a rien.
//
// POURQUOI C EST PIRE QU UNE PANNE : une declaration IRS qui ne part pas
// se remarque. Une declaration qui part avec les chiffres d une autre
// societe se decouvre au controle, des annees plus tard.
//
// LA COLONNE entite_id EXISTE SUR LES CINQ TABLES DU MODULE, verifie en
// base le 31/08 (information_schema.columns). LE REPLI EST DONC SUPPRIME :
// un echec de lecture est desormais une erreur franche, pas un chemin
// cache.
//
// ⚠️ NE PAS LE REINTRODUIRE. Un repli qui change le PERIMETRE des donnees
// n est pas une securite, c est une source de faux silencieux. Un repli
// n est acceptable que s il produit le MEME resultat par un autre moyen.
//
// ⚠️ CETTE ROUTE ET f1120/generate SONT JUMELLES. Le motif du 31/08 s est
// produit deux fois : un defaut corrige dans l une, oublie dans l autre.
// TOUTE MODIFICATION ICI DOIT ETRE REPORTEE LA-BAS, ET RECIPROQUEMENT.
//
// ---- 🆕 09/09 — DEUX CORRECTIONS DE CONTENU, AVANT LE PREMIER VRAI DEPOT ----
//
// 1. LIGNE 1c « TOTAL ASSETS ». La route y ecrivait le TOTAL DES AVANCES
//    (totalUsd). L actif total d une societe n est pas la somme des avances
//    de son membre. Le mapping porte `ri_total_assets_usd` depuis le
//    debut : c est cette colonne qui est ecrite, et rien si elle est vide.
//    Le total des avances reste sur 1f, 1h et Part IV (ligne 17b / 22),
//    ou il a sa place.
//
// 2. PART V. Une entite disregarded detenue par un etranger decrit dans la
//    Part V, SUR UNE FEUILLE JOINTE, les apports et distributions de son
//    membre (instruction 5472, rev. 12-2024). La route ne cochait pas la
//    case (c2_6) et ne joignait rien. Desormais : la case est cochee des
//    qu il y a au moins une avance, et une page « Part V — Statement » est
//    ajoutee au PDF, listant chaque avance (date, fournisseur, montant,
//    devise) et le total en dollars au taux du mapping.
// ---------------------------------------------------------------------------

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

// Les polices standard du PDF ne connaissent que le latin courant.
function pourPdf(t: string): string {
  return String(t || "").replace(/[\u202F\u00A0]/g, " ").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // L ORGANISME VIENT DE LA SESSION SIGNEE, ET DE NULLE PART AILLEURS.
    // Un tenant_id present dans le corps de la requete est IGNORE.
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
    const entiteDemandee = String(body.entite_id || "").trim();

    // ---- LA SOCIETE CONCERNEE ----
    //
    // ⚠️ LE FILTRE tenant_id EST CE QUI REND L IDENTIFIANT RECU INOFFENSIF.
    // Sans lui, poster l identifiant d une societe d un autre gestionnaire
    // rendrait son formulaire — le defaut corrige ce matin.
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
      console.error("[f5472] lecture entite :", eEntite.message);
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
    // 🚨 LE DOUBLE FILTRE EST OBLIGATOIRE, SANS REPLI. tenant_id borne a
    // l organisme, entite_id borne a la societe. Prendre le mapping du
    // tenant seul rendrait le meme formulaire pour toutes les societes du
    // portefeuille.
    const { data: mapping, error: eMap } = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("tax_year", year)
      .maybeSingle();

    if (eMap) {
      console.error("[f5472] lecture mapping :", eMap.message);
      return NextResponse.json({ error: "Lecture du mapping impossible." }, { status: 500 });
    }

    if (!mapping) {
      return NextResponse.json(
        {
          error: "Aucun mapping 5472 pour " + entite.label + " sur l'exercice " + year
            + ". Renseignez-le avant de generer le formulaire.",
        },
        { status: 404 }
      );
    }

    const m = mapping;

    // ---- RECALCUL DES AVANCES DU MEMBRE ----
    //
    // 🚨 LE DOUBLE FILTRE EST OBLIGATOIRE ICI AUSSI, ET C EST LE PLUS
    // SENSIBLE : ces montants partent sur une declaration fiscale
    // americaine. Sans le filtre par entite, la somme porterait sur tout le
    // portefeuille du gestionnaire.
    const { data: dep, error: eDep } = await supabase
      .from("depenses")
      .select("montant_ttc, devise, date_depense, fournisseur")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("avance_perso", true)
      .eq("rembourse", false)
      .gte("date_depense", year + "-01-01")
      .lte("date_depense", year + "-12-31")
      .order("date_depense", { ascending: true })
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
    // 🆕 09/09 : 1c = l actif total du mapping, jamais le total des avances.
    setText("Page1[0].f1_9[0]", money(m.ri_total_assets_usd));
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

    // ---- PAGE 2 : Part V (transactions d une DE) — 🆕 09/09 ----
    // La case c2_6 est cochee des qu il y a une avance, et la feuille
    // jointe est ajoutee en fin de document.
    if (m.ri_is_foreign_owned_de && nbAvances > 0) check("Page2[0].PartV[0].c2_6[0]");

    // ---- PAGE 3 : Part VII (tout No = index [1]) ----
    for (let i = 1; i <= 12; i++) {
      check("Page3[0].c3_" + i + "[1]");
    }

    form.updateFieldAppearances(font);

    // ---- LA FEUILLE JOINTE DE LA PART V — 🆕 09/09 ----
    if (m.ri_is_foreign_owned_de && nbAvances > 0) {
      const gras = await doc.embedFont(StandardFonts.HelveticaBold);
      const L = 612, H = 792, M = 54;
      let page = doc.addPage([L, H]);
      let y = H - M;
      const ligne = (t: string, f: any, s: number) => {
        if (y < M + 20) { page = doc.addPage([L, H]); y = H - M; }
        page.drawText(pourPdf(t), { x: M, y, size: s, font: f, color: rgb(0, 0, 0) });
        y -= s * 1.5;
      };
      ligne("Form 5472 — Part V — Attached statement", gras, 12);
      ligne("Reporting corporation: " + String(m.ri_name || "") + (m.ri_ein ? "   EIN " + m.ri_ein : ""), font, 10);
      ligne("Tax year " + year + " — Foreign-owned U.S. DE", font, 10);
      y -= 6;
      ligne("Reportable transactions between the disregarded entity and its foreign owner (Regulations section 1.482-1(i)(7)):", font, 10);
      ligne("contributions to the entity by its sole member, in the form of expenses paid personally on behalf of the entity.", font, 10);
      y -= 6;
      ligne("Date          Payee                                   Amount        Currency", gras, 9.5);
      for (const d of dep ?? []) {
        const date = dateIRS(d.date_depense).padEnd(14);
        const payee = String(d.fournisseur || "").slice(0, 38).padEnd(40);
        const montant = money(Number(d.montant_ttc) || 0).padStart(12);
        ligne(date + payee + montant + "   " + String(d.devise || "USD").toUpperCase(), font, 9);
      }
      y -= 6;
      ligne("Total contributions, converted to U.S. dollars at " + taux + " USD per EUR: $ " + money(totalUsd), gras, 10);
      ligne("Distributions from the entity to the member during the tax year: none recorded.", font, 10);
    }

    const bytes = await doc.save();

    // ---- Rangement au coffre prive ----
    //
    // Le chemin porte l identifiant de l ENTITE : sans cela, les documents
    // de cinquante societes se melangeraient dans un meme dossier.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = tenantId + "/" + entiteId + "/5472/" + year + "/f5472-" + stamp + ".pdf";

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
      entite_id: entiteId,
      societe: entite.label,
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
        total_assets: m.ri_total_assets_usd ?? null,
        part_v: !!(m.ri_is_foreign_owned_de && nbAvances > 0),
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
