import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LA PLAQUETTE — 09/09 (Mr Comptable).
//
// Les comptes annuels PRESENTES : page de garde au nom du cabinet et du
// client, bilan (actif / passif), compte de resultat, soldes intermediaires
// de gestion. Depuis la balance de l exercice, sans ressaisie. C est ce que
// le client recoit et ce que la banque demande ; les leaders le vendent
// tous.
//
// LE REGROUPEMENT suit le plan comptable general par prefixe de compte.
// Il est volontairement simple (bilan et compte de resultat en liste
// abregee) : une plaquette detaillee avec annexe complete est un autre
// chantier. ⚠️ Les comptes de la classe 12 (resultat) sont ignores si les
// comptes de gestion sont encore ouverts : le resultat est alors calcule.
//
// ?apercu=1 rend les totaux en JSON (pour l ecran) ; sans parametre, le
// PDF est produit et telecharge. Rien n est ecrit en base.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: function (url: any, options: any) { return fetch(url, { ...(options || {}), cache: "no-store" }); } } }
);

function r2(n: number): number { return Math.round(n * 100) / 100; }
// ⚠️ toLocaleString fr-FR insere une espace fine (U+202F) que la police
// standard du PDF ne sait pas encoder : on la remplace par une espace.
function fr(n: number): string { return r2(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, " "); }
function pourPdf(t: string): string {
  return String(t || "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u0152\u0153\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u20AC]/g, "?");
}

type Poste = { libelle: string; prefixes: string[]; sens: "debit" | "credit" };

// ACTIF : soldes debiteurs. PASSIF : soldes crediteurs. Les comptes
// d amortissement et de depreciation (28, 29, 39, 49, 59) viennent en
// moins de l actif correspondant.
const ACTIF: Poste[] = [
  { libelle: "Immobilisations incorporelles", prefixes: ["20", "280"], sens: "debit" },
  { libelle: "Immobilisations corporelles", prefixes: ["21", "22", "23", "281", "282"], sens: "debit" },
  { libelle: "Immobilisations financières", prefixes: ["26", "27", "29"], sens: "debit" },
  { libelle: "Stocks et en-cours", prefixes: ["3"], sens: "debit" },
  { libelle: "Clients et comptes rattachés", prefixes: ["41"], sens: "debit" },
  { libelle: "Autres créances", prefixes: ["409", "42", "43", "44", "45", "46", "47"], sens: "debit" },
  { libelle: "Valeurs mobilières de placement", prefixes: ["50"], sens: "debit" },
  { libelle: "Disponibilités", prefixes: ["51", "53", "54", "58", "59"], sens: "debit" },
  { libelle: "Charges constatées d'avance", prefixes: ["486"], sens: "debit" },
];
const PASSIF: Poste[] = [
  { libelle: "Capital social", prefixes: ["101", "108"], sens: "credit" },
  { libelle: "Primes et réserves", prefixes: ["104", "105", "106"], sens: "credit" },
  { libelle: "Report à nouveau", prefixes: ["11"], sens: "credit" },
  { libelle: "Résultat de l'exercice", prefixes: ["12"], sens: "credit" },
  { libelle: "Subventions et provisions réglementées", prefixes: ["13", "14"], sens: "credit" },
  { libelle: "Provisions pour risques et charges", prefixes: ["15"], sens: "credit" },
  { libelle: "Emprunts et dettes financières", prefixes: ["16", "17", "18", "519"], sens: "credit" },
  { libelle: "Fournisseurs et comptes rattachés", prefixes: ["40"], sens: "credit" },
  { libelle: "Dettes fiscales et sociales", prefixes: ["42", "43", "44"], sens: "credit" },
  { libelle: "Autres dettes", prefixes: ["419", "45", "46", "47"], sens: "credit" },
  { libelle: "Produits constatés d'avance", prefixes: ["487"], sens: "credit" },
];
const RESULTAT: Array<{ libelle: string; prefixes: string[]; type: "produit" | "charge" }> = [
  { libelle: "Chiffre d'affaires", prefixes: ["70"], type: "produit" },
  { libelle: "Production stockée et immobilisée", prefixes: ["71", "72"], type: "produit" },
  { libelle: "Subventions d'exploitation", prefixes: ["74"], type: "produit" },
  { libelle: "Autres produits d'exploitation", prefixes: ["75", "781", "791"], type: "produit" },
  { libelle: "Achats et variation de stocks", prefixes: ["60"], type: "charge" },
  { libelle: "Services extérieurs", prefixes: ["61", "62"], type: "charge" },
  { libelle: "Impôts et taxes", prefixes: ["63"], type: "charge" },
  { libelle: "Charges de personnel", prefixes: ["64"], type: "charge" },
  { libelle: "Autres charges d'exploitation", prefixes: ["65"], type: "charge" },
  { libelle: "Dotations aux amortissements et provisions", prefixes: ["681"], type: "charge" },
  { libelle: "Produits financiers", prefixes: ["76", "786", "796"], type: "produit" },
  { libelle: "Charges financières", prefixes: ["66", "686"], type: "charge" },
  { libelle: "Produits exceptionnels", prefixes: ["77", "787", "797"], type: "produit" },
  { libelle: "Charges exceptionnelles", prefixes: ["67", "687"], type: "charge" },
  { libelle: "Impôt sur les bénéfices", prefixes: ["69"], type: "charge" },
];

function commence(num: string, prefixes: string[]): boolean {
  return prefixes.some(function (p) { return num.indexOf(p) === 0; });
}

async function construire(societeId: string) {
  const { data: dossier } = await supabase
    .from("compta_societes")
    .select("id, code, raison_sociale, siren, forme, adresse, exercice_debut, exercice_fin")
    .eq("id", societeId)
    .maybeSingle();
  if (!dossier) return null;
  const debut = String(dossier.exercice_debut || "").slice(0, 10);
  const fin = String(dossier.exercice_fin || "").slice(0, 10);
  if (!debut || !fin) return { erreur: "Renseignez les dates d'exercice du dossier." };

  const { data: lignes } = await supabase
    .from("compta_ecritures")
    .select("compte_num, debit, credit")
    .eq("societe_id", societeId)
    .gte("ecriture_date", debut)
    .lte("ecriture_date", fin)
    .limit(50000);

  const soldes: any = {};
  for (const l of lignes || []) {
    const n = String(l.compte_num);
    soldes[n] = r2((soldes[n] || 0) + (Number(l.debit) || 0) - (Number(l.credit) || 0));
  }
  const numeros = Object.keys(soldes);

  let produits = 0, charges = 0;
  const cr = RESULTAT.map(function (p) {
    let m = 0;
    for (const n of numeros) if (commence(n, p.prefixes)) m += soldes[n];
    const montant = p.type === "produit" ? r2(-m) : r2(m);
    if (p.type === "produit") produits += montant; else charges += montant;
    return { libelle: p.libelle, type: p.type, montant };
  });
  produits = r2(produits); charges = r2(charges);
  const resultatCalcule = r2(produits - charges);
  const gestionOuverte = numeros.some(function (n) { return (n.charAt(0) === "6" || n.charAt(0) === "7") && Math.abs(soldes[n]) > 0.005; });

  function postes(liste: Poste[]) {
    return liste.map(function (p) {
      let m = 0;
      for (const n of numeros) {
        if (!commence(n, p.prefixes)) continue;
        // Un compte de tiers debiteur va a l actif, crediteur au passif :
        // on ne prend que le sens du poste.
        const s = soldes[n];
        if (p.sens === "debit" && s > 0) m += s;
        if (p.sens === "credit" && s < 0) m += -s;
        // Amortissements et depreciations (credit) viennent en moins de l actif.
        if (p.sens === "debit" && s < 0 && /^(28|29|39|49|59)/.test(n)) m += s;
      }
      return { libelle: p.libelle, montant: r2(m) };
    });
  }
  const actif = postes(ACTIF);
  const passif = postes(PASSIF);
  if (gestionOuverte) {
    const idx = passif.findIndex(function (p) { return p.libelle === "Résultat de l'exercice"; });
    if (idx >= 0) passif[idx].montant = resultatCalcule;
  }
  const totalActif = r2(actif.reduce(function (s, p) { return s + p.montant; }, 0));
  const totalPassif = r2(passif.reduce(function (s, p) { return s + p.montant; }, 0));

  const ca = cr[0].montant;
  const achats = cr.find(function (x) { return x.libelle.indexOf("Achats") === 0; })!.montant;
  const services = cr.find(function (x) { return x.libelle.indexOf("Services") === 0; })!.montant;
  const impots = cr.find(function (x) { return x.libelle.indexOf("Impôts et taxes") === 0; })!.montant;
  const personnel = cr.find(function (x) { return x.libelle.indexOf("Charges de personnel") === 0; })!.montant;
  const dotations = cr.find(function (x) { return x.libelle.indexOf("Dotations") === 0; })!.montant;
  const valeurAjoutee = r2(ca + cr[1].montant - achats - services);
  const ebe = r2(valeurAjoutee + cr[2].montant - impots - personnel);
  const resultatExploitation = r2(ebe + cr[3].montant - cr[8].montant - dotations);

  return {
    dossier, exercice: { debut, fin }, nb_comptes: numeros.length,
    actif, passif, total_actif: totalActif, total_passif: totalPassif, equilibre: Math.abs(r2(totalActif - totalPassif)) < 0.05,
    compte_resultat: cr, produits, charges, resultat: resultatCalcule, gestion_ouverte: gestionOuverte,
    sig: { chiffre_affaires: ca, valeur_ajoutee: valeurAjoutee, ebe, resultat_exploitation: resultatExploitation, resultat_net: resultatCalcule },
  };
}

async function cabinetDe(tenantId: string | null) {
  if (!tenantId) return null;
  const { data } = await supabase.from("compliance_tenants").select("legal_name, label, principal_office_address").eq("tenant_id", tenantId).order("label").limit(1).maybeSingle();
  return data || null;
}

async function pdfPlaquette(p: any, cabinet: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
  const L = 595.28, H = 841.89, M = 56;
  const OR = rgb(0.784, 0.663, 0.431), NUIT = rgb(0.1, 0.1, 0.18), GRIS = rgb(0.4, 0.4, 0.4);
  const exo = "Exercice du " + new Date(p.exercice.debut).toLocaleDateString("fr-FR") + " au " + new Date(p.exercice.fin).toLocaleDateString("fr-FR");
  const nomCabinet = pourPdf(cabinet ? (cabinet.legal_name || cabinet.label) : "");

  function page(titre: string) {
    const pg = pdf.addPage([L, H]);
    pg.drawText(pourPdf(titre), { x: M, y: H - M, size: 18, font: gras, color: NUIT });
    pg.drawText(pourPdf(p.dossier.raison_sociale + " — " + exo), { x: M, y: H - M - 22, size: 10, font: police, color: GRIS });
    pg.drawLine({ start: { x: M, y: H - M - 32 }, end: { x: L - M, y: H - M - 32 }, thickness: 1.5, color: OR });
    return pg;
  }
  function tableau(pg: any, y0: number, titre: string, lignes: Array<{ libelle: string; montant: number }>, total: { libelle: string; montant: number } | null) {
    let y = y0;
    pg.drawText(pourPdf(titre), { x: M, y, size: 12, font: gras, color: OR }); y -= 18;
    for (const l of lignes) {
      if (Math.abs(l.montant) < 0.005) continue;
      pg.drawText(pourPdf(l.libelle), { x: M + 6, y, size: 10, font: police, color: NUIT });
      const v = fr(l.montant); const w = police.widthOfTextAtSize(v, 10);
      pg.drawText(v, { x: L - M - w, y, size: 10, font: police, color: NUIT });
      y -= 15;
    }
    if (total) {
      pg.drawLine({ start: { x: M, y: y + 10 }, end: { x: L - M, y: y + 10 }, thickness: 0.5, color: GRIS });
      pg.drawText(pourPdf(total.libelle), { x: M + 6, y: y - 2, size: 10.5, font: gras, color: NUIT });
      const v = fr(total.montant); const w = gras.widthOfTextAtSize(v, 10.5);
      pg.drawText(v, { x: L - M - w, y: y - 2, size: 10.5, font: gras, color: NUIT });
      y -= 22;
    }
    return y - 10;
  }

  // Page de garde
  const g = pdf.addPage([L, H]);
  g.drawText("COMPTES ANNUELS", { x: M, y: H - 220, size: 26, font: gras, color: NUIT });
  g.drawLine({ start: { x: M, y: H - 232 }, end: { x: L - M, y: H - 232 }, thickness: 2, color: OR });
  g.drawText(pourPdf(p.dossier.raison_sociale), { x: M, y: H - 270, size: 16, font: gras, color: NUIT });
  g.drawText(pourPdf((p.dossier.forme ? p.dossier.forme + " · " : "") + (p.dossier.siren ? "SIREN " + p.dossier.siren : "")), { x: M, y: H - 292, size: 10.5, font: police, color: GRIS });
  if (p.dossier.adresse) g.drawText(pourPdf(p.dossier.adresse), { x: M, y: H - 308, size: 10.5, font: police, color: GRIS });
  g.drawText(pourPdf(exo), { x: M, y: H - 340, size: 12, font: police, color: NUIT });
  if (nomCabinet) {
    g.drawText("Comptes établis par", { x: M, y: 140, size: 9.5, font: police, color: GRIS });
    g.drawText(nomCabinet, { x: M, y: 124, size: 12, font: gras, color: NUIT });
    if (cabinet.principal_office_address) g.drawText(pourPdf(cabinet.principal_office_address), { x: M, y: 108, size: 9.5, font: police, color: GRIS });
  }
  g.drawText("Document établi le " + new Date().toLocaleDateString("fr-FR") + ". Montants en euros.", { x: M, y: 80, size: 9, font: police, color: GRIS });

  // Bilan
  const b = page("Bilan");
  let y = tableau(b, H - M - 60, "ACTIF", p.actif, { libelle: "TOTAL ACTIF", montant: p.total_actif });
  y = tableau(b, y, "PASSIF", p.passif, { libelle: "TOTAL PASSIF", montant: p.total_passif });
  if (!p.equilibre) b.drawText("Attention : actif et passif ne sont pas égaux — l'exercice n'est pas clôturé ou la balance présente un écart.", { x: M, y: y - 6, size: 9, font: police, color: rgb(0.7, 0.2, 0.2) });

  // Compte de resultat
  const c = page("Compte de résultat");
  y = tableau(c, H - M - 60, "PRODUITS", p.compte_resultat.filter(function (x: any) { return x.type === "produit"; }), { libelle: "TOTAL PRODUITS", montant: p.produits });
  y = tableau(c, y, "CHARGES", p.compte_resultat.filter(function (x: any) { return x.type === "charge"; }), { libelle: "TOTAL CHARGES", montant: p.charges });
  c.drawText((p.resultat >= 0 ? "BÉNÉFICE" : "PERTE") + " DE L'EXERCICE", { x: M + 6, y: y - 4, size: 12, font: gras, color: NUIT });
  const vr = fr(Math.abs(p.resultat)); const wr = gras.widthOfTextAtSize(vr, 12);
  c.drawText(vr, { x: L - M - wr, y: y - 4, size: 12, font: gras, color: NUIT });

  // SIG
  const s = page("Soldes intermédiaires de gestion");
  tableau(s, H - M - 60, "", [
    { libelle: "Chiffre d'affaires", montant: p.sig.chiffre_affaires },
    { libelle: "Valeur ajoutée", montant: p.sig.valeur_ajoutee },
    { libelle: "Excédent brut d'exploitation", montant: p.sig.ebe },
    { libelle: "Résultat d'exploitation", montant: p.sig.resultat_exploitation },
    { libelle: "Résultat net", montant: p.sig.resultat_net },
  ], null);

  return await pdf.save();
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const refus = await lecture(id);
    if (refus) return refus;

    const p: any = await construire(id);
    if (!p) return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    if (p.erreur) return NextResponse.json({ ok: false, erreur: p.erreur }, { status: 400 });

    if (req.nextUrl.searchParams.get("apercu") === "1") {
      return NextResponse.json({ ok: true, ...p });
    }

    const cabinet = await cabinetDe(session.tenantId || null);
    const octets = await pdfPlaquette(p, cabinet);
    const nom = "plaquette-" + String(p.dossier.code || "dossier").replace(/[^A-Za-z0-9_-]/g, "") + "-" + p.exercice.fin.slice(0, 4) + ".pdf";
    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="' + nom + '"', "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
