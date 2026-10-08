import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// 2050 — actif. Le reel normal presente brut, amortissements et net :
// « amort » designe les comptes 28 et 29 qui viennent en deduction.
// « tiers » designe un poste dont les comptes changent de cote selon leur
// solde : un client crediteur n est pas une creance, il est une dette.
const ACTIF = [
  { code: "AB", libelle: "Frais d’établissement", brut: ["201"], amort: ["2801"] },
  { code: "AF", libelle: "Concessions, brevets, licences, logiciels", brut: ["205", "203"], amort: ["2805", "2803"] },
  { code: "AH", libelle: "Fonds commercial", brut: ["206", "207"], amort: ["2807", "2907"] },
  { code: "AN", libelle: "Terrains", brut: ["211", "212"], amort: ["2811"] },
  { code: "AP", libelle: "Constructions", brut: ["213", "214"], amort: ["2813", "2814"] },
  { code: "AR", libelle: "Installations techniques et outillage", brut: ["215"], amort: ["2815"] },
  { code: "AT", libelle: "Autres immobilisations corporelles", brut: ["218"], amort: ["2818"] },
  { code: "BH", libelle: "Autres immobilisations financières", brut: ["26", "27"], amort: ["296", "297"] },
  { code: "BL", libelle: "Matières premières et approvisionnements", brut: ["31", "32"], amort: ["391", "392"] },
  { code: "BT", libelle: "Marchandises", brut: ["37"], amort: ["397"] },
  { code: "BV", libelle: "Avances et acomptes versés", brut: ["409"], amort: [] },
  { code: "BX", libelle: "Clients et comptes rattachés", brut: ["411", "413", "416", "418"], amort: ["491"], tiers: true },
  { code: "BZ", libelle: "Autres créances", brut: ["425", "43", "44", "45", "46"], amort: [], tiers: true },
  { code: "CF", libelle: "Disponibilités", brut: ["51", "53", "58"], amort: [] },
  { code: "CH", libelle: "Charges constatées d’avance", brut: ["486"], amort: [] },
];

// 2051 — passif. Un seul montant par poste.
const PASSIF = [
  { code: "DA", libelle: "Capital social ou individuel", racines: ["101", "108"] },
  { code: "DB", libelle: "Primes d’émission, de fusion, d’apport", racines: ["104"] },
  { code: "DD", libelle: "Réserve légale", racines: ["1061"] },
  { code: "DG", libelle: "Autres réserves", racines: ["106"] },
  { code: "DH", libelle: "Report à nouveau", racines: ["110", "119"] },
  { code: "DI", libelle: "Résultat de l’exercice", racines: ["120", "129"] },
  { code: "DK", libelle: "Subventions d’investissement", racines: ["13"] },
  { code: "DP", libelle: "Provisions pour risques et charges", racines: ["15"] },
  { code: "DU", libelle: "Emprunts et dettes auprès des établissements de crédit", racines: ["16"] },
  { code: "DV", libelle: "Emprunts et dettes financières divers", racines: ["17", "455"], tiers: true },
  { code: "DW", libelle: "Avances et acomptes reçus", racines: ["419"] },
  { code: "DX", libelle: "Fournisseurs et comptes rattachés", racines: ["401", "403", "404", "408"], tiers: true },
  { code: "DY", libelle: "Dettes fiscales et sociales", racines: ["42", "43", "44"], tiers: true },
  { code: "EA", libelle: "Autres dettes", racines: ["46", "45"], tiers: true },
  { code: "EB", libelle: "Produits constatés d’avance", racines: ["487"] },
];

// 2052 et 2053 — compte de resultat developpe.
const RESULTAT = [
  { code: "FC", libelle: "Ventes de marchandises", racines: ["707"], sens: "credit" },
  { code: "FD", libelle: "Production vendue - biens", racines: ["701", "702", "703"], sens: "credit" },
  { code: "FG", libelle: "Production vendue - services", racines: ["704", "705", "706", "708"], sens: "credit" },
  { code: "FM", libelle: "Production stockée", racines: ["713"], sens: "credit" },
  { code: "FN", libelle: "Production immobilisée", racines: ["72"], sens: "credit" },
  { code: "FO", libelle: "Subventions d’exploitation", racines: ["74"], sens: "credit" },
  { code: "FP", libelle: "Reprises sur provisions et transferts de charges", racines: ["781", "791"], sens: "credit" },
  { code: "FQ", libelle: "Autres produits", racines: ["75"], sens: "credit" },
  { code: "FS", libelle: "Achats de marchandises", racines: ["607"], sens: "debit" },
  { code: "FT", libelle: "Variation de stock de marchandises", racines: ["6037"], sens: "debit" },
  { code: "FU", libelle: "Achats de matières premières", racines: ["601", "602"], sens: "debit" },
  { code: "FV", libelle: "Variation de stock de matières", racines: ["6031", "6032"], sens: "debit" },
  { code: "FW", libelle: "Autres achats et charges externes", racines: ["604", "605", "606", "61", "62"], sens: "debit" },
  { code: "FX", libelle: "Impôts, taxes et versements assimilés", racines: ["63"], sens: "debit" },
  { code: "FY", libelle: "Salaires et traitements", racines: ["641", "644", "648"], sens: "debit" },
  { code: "FZ", libelle: "Charges sociales", racines: ["645", "646", "647"], sens: "debit" },
  { code: "GA", libelle: "Dotations aux amortissements", racines: ["6811"], sens: "debit" },
  { code: "GC", libelle: "Dotations aux dépréciations et provisions", racines: ["6815", "6817", "6816"], sens: "debit" },
  { code: "GE", libelle: "Autres charges", racines: ["65"], sens: "debit" },
  { code: "GJ", libelle: "Produits financiers", racines: ["76"], sens: "credit" },
  { code: "GR", libelle: "Charges financières", racines: ["66"], sens: "debit" },
  { code: "HA", libelle: "Produits exceptionnels", racines: ["77"], sens: "credit" },
  { code: "HE", libelle: "Charges exceptionnelles", racines: ["67"], sens: "debit" },
  { code: "HK", libelle: "Impôts sur les bénéfices", racines: ["695", "699"], sens: "debit" },
];

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Un montant a la francaise, pour les controles affiches : « 1 200,00 ».
function fr2(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes").select("*").eq("id", id).maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);
    let debut: string;
    let fin: string;

    if (annee) {
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const a = new Date().getFullYear();
      debut = a + "-01-01";
      fin = a + "-12-31";
    }

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    const comptes: any = {};
    for (const l of lignes || []) {
      const n = String(l.compte_num || "");
      if (!comptes[n]) comptes[n] = { numero: n, libelle: l.compte_lib, debit: 0, credit: 0 };
      comptes[n].debit = r2(comptes[n].debit + (Number(l.debit) || 0));
      comptes[n].credit = r2(comptes[n].credit + (Number(l.credit) || 0));
    }

    const pris: any = {};

    function cumuler(racines: string[], sens: string, marquer: boolean, tiers: boolean) {
      let total = 0;
      const detail: any[] = [];
      for (const num of Object.keys(comptes)) {
        let racine = "";
        for (const r of racines) {
          if (num.startsWith(r) && r.length > racine.length) racine = r;
        }
        if (!racine) continue;
        if (marquer && pris[num] && pris[num].length >= racine.length) continue;

        const c = comptes[num];
        const solde = sens === "credit" ? r2(c.credit - c.debit) : r2(c.debit - c.credit);
        if (Math.abs(solde) < 0.005) continue;

        // UN COMPTE DE TIERS CHANGE DE COTE SELON SON SOLDE. Une dette sociale
        // n est pas une creance negative : elle appartient au passif. On laisse
        // donc le compte au poste de l autre cote plutot que de le retenir ici.
        if (tiers && solde < 0) continue;

        if (marquer) pris[num] = racine;
        total = r2(total + solde);
        detail.push({ compte: num, libelle: c.libelle, montant: solde });
      }
      return { total: total, detail: detail };
    }

    // L actif en trois colonnes : c est la difference avec le simplifie.
    const actif = ACTIF.map(function (c: any) {
      const b = cumuler(c.brut, "debit", true, c.tiers === true);
      const a = c.amort.length > 0 ? cumuler(c.amort, "credit", true, false) : { total: 0, detail: [] };
      return {
        code: c.code, libelle: c.libelle,
        brut: b.total, amortissements: a.total, net: r2(b.total - a.total),
        comptes: b.detail,
      };
    });

    const passif = PASSIF.map(function (c: any) {
      const p = cumuler(c.racines, "credit", true, c.tiers === true);
      return { code: c.code, libelle: c.libelle, montant: p.total, comptes: p.detail };
    });

    const resultat = RESULTAT.map(function (c: any) {
      const p = cumuler(c.racines, c.sens, true, false);
      return { code: c.code, libelle: c.libelle, sens: c.sens, montant: p.total, comptes: p.detail };
    });

    const totalBrut = r2(actif.reduce(function (s: number, c: any) { return s + c.brut; }, 0));
    const totalAmort = r2(actif.reduce(function (s: number, c: any) { return s + c.amortissements; }, 0));
    const totalNet = r2(totalBrut - totalAmort);
    const totalPassif = r2(passif.reduce(function (s: number, c: any) { return s + c.montant; }, 0));

    const produits = r2(resultat.filter(function (c: any) { return c.sens === "credit"; })
      .reduce(function (s: number, c: any) { return s + c.montant; }, 0));
    const charges = r2(resultat.filter(function (c: any) { return c.sens === "debit"; })
      .reduce(function (s: number, c: any) { return s + c.montant; }, 0));

    const resultatCalcule = r2(produits - charges);
    const resultatAuBilan = (passif.find(function (c: any) { return c.code === "DI"; }) || { montant: 0 }).montant;

    // UN EXERCICE CLOTURE N A PLUS DE COMPTE DE GESTION : la cloture les a
    // soldes par le resultat, qui vit desormais au bilan. Comparer le resultat
    // recalcule au poste DI n a donc plus de sens, et laisser le controle en
    // echec bloquerait a jamais la teletransmission d un exercice pourtant sain.
    const gestionSoldee = Math.abs(produits) < 0.005 && Math.abs(charges) < 0.005;
    const exerciceCloture = gestionSoldee && Math.abs(resultatAuBilan) > 0.005;

    // 🆕 08/10 — AVANT LA CLOTURE, les comptes 120 et 129 sont vides : le
    // resultat ne figure pas encore au bilan, et l actif depasse le passif
    // EXACTEMENT du resultat. Ce n est pas une anomalie. Sans cette regle, la
    // liasse d un dossier au reel normal affichait « ne tombe pas juste »
    // pendant tout l exercice, jusqu a sa cloture. Meme regle que la 2033.
    const exerciceOuvert = !gestionSoldee && Math.abs(resultatAuBilan) < 0.005;
    const ecartBilan = r2(totalNet - totalPassif);
    const ecartResiduel = exerciceOuvert ? r2(ecartBilan - resultatCalcule) : ecartBilan;

    const orphelins = Object.keys(comptes)
      .filter(function (n) {
        if (pris[n]) return false;
        const c = comptes[n];
        return Math.abs(r2(c.debit - c.credit)) > 0.005;
      })
      .map(function (n) {
        return { compte: n, libelle: comptes[n].libelle, solde: r2(comptes[n].debit - comptes[n].credit) };
      });

    const controles = [
      {
        nom: exerciceOuvert
          ? "Actif net égale passif plus résultat"
          : "Total actif net égale total passif",
        ok: Math.abs(ecartResiduel) < 0.01,
        detail: exerciceOuvert
          ? "Actif " + fr2(totalNet) + " · Passif " + fr2(totalPassif)
            + " · Résultat " + fr2(resultatCalcule)
            + (Math.abs(ecartResiduel) < 0.01
              ? " — l’écart correspond exactement au résultat de l’exercice"
              : " — il reste " + fr2(ecartResiduel) + " d’écart inexpliqué")
          : "Actif " + fr2(totalNet) + " · Passif " + fr2(totalPassif),
      },
      {
        nom: exerciceOuvert
          ? "Le résultat sera porté au bilan à la clôture"
          : "Le résultat se retrouve au bilan",
        ok: exerciceCloture || exerciceOuvert
          ? true
          : Math.abs(r2(resultatCalcule - resultatAuBilan)) < 0.01,
        detail: exerciceCloture
          ? "Exercice clôturé — résultat de " + fr2(resultatAuBilan) + " logé au bilan"
          : exerciceOuvert
            ? "Exercice ouvert : résultat calculé " + fr2(resultatCalcule)
              + ", pas encore affecté aux comptes 120 ou 129"
            : "Calculé " + fr2(resultatCalcule),
      },
      {
        nom: "Tous les comptes sont ventilés",
        ok: orphelins.length === 0,
        detail: orphelins.length === 0 ? "Aucun compte orphelin" : orphelins.length + (orphelins.length > 1 ? " comptes hors liasse" : " compte hors liasse"),
      },
    ];

    return NextResponse.json({
      ok: true,
      formulaire: "2050",
      regime_du_dossier: dossier.regime_fiscal,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale, siren: dossier.siren },
      periode: { debut: debut, fin: fin },
      exercice_cloture: exerciceCloture,
      exercice_ouvert: exerciceOuvert,
      bilan_actif: { lignes: actif, total_brut: totalBrut, total_amortissements: totalAmort, total_net: totalNet },
      bilan_passif: { lignes: passif, total: totalPassif },
      compte_resultat: { lignes: resultat, produits: produits, charges: charges, resultat: resultatCalcule },
      orphelins: orphelins,
      controles: controles,
      pret_pour_edi: controles.every(function (c: any) { return c.ok; }),
      avertissement:
        "Présentation du régime réel normal. À vérifier par l’expert-comptable avant tout dépôt.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
