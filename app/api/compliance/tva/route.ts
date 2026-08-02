import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// Comptes normalises du plan comptable general francais.
const COLLECTEE = "445710";
const DEDUCTIBLE_BS = "445660";
const DEDUCTIBLE_IMMO = "445620";
const CREDIT_REPORT = "445670";
const A_DECAISSER = "445510";
const INTRACOM = "445200";

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const code = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, regime_tva, exercice_debut, exercice_fin, actif")
      .limit(500);

    const liste = (dossiers || []).filter(function (s: any) { return s.actif !== false; });

    if (liste.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucun dossier comptable." }, { status: 404 });
    }

    let dossier: any = null;
    if (id) dossier = liste.find(function (s: any) { return s.id === id; }) || null;
    else if (code) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === code;
      }) || null;
    } else if (liste.length === 1) dossier = liste[0];

    if (!dossier) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Precisez le dossier : ?societe=CODE",
          dossiers: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 400 }
      );
    }

    const regime = String(dossier.regime_tva || "reel_normal");

    if (regime === "franchise" || regime === "non_assujetti") {
      return NextResponse.json({
        ok: true,
        dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale },
        regime: regime,
        declaration: null,
        note: regime === "franchise"
          ? "Ce dossier est en franchise en base : aucune TVA n est facturee ni deduite, et aucune declaration n est due."
          : "Ce dossier n est pas assujetti a la TVA : aucune declaration n est due.",
      });
    }

    // PERIODE. Reel normal : le mois demande, ou le mois precedent par defaut.
    // Reel simplifie : l exercice entier, la CA12 etant annuelle.
    const mensuel = regime === "reel_normal";
    let debut: string;
    let fin: string;
    let libellePeriode: string;

    const moisDemande = (req.nextUrl.searchParams.get("mois") || "").trim();

    if (mensuel) {
      let annee: number;
      let mois: number;

      if (/^\d{4}-\d{2}$/.test(moisDemande)) {
        annee = parseInt(moisDemande.slice(0, 4), 10);
        mois = parseInt(moisDemande.slice(5, 7), 10);
      } else {
        const maintenant = new Date();
        const precedent = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - 1, 1));
        annee = precedent.getUTCFullYear();
        mois = precedent.getUTCMonth() + 1;
      }

      const premier = new Date(Date.UTC(annee, mois - 1, 1));
      const dernier = new Date(Date.UTC(annee, mois, 0));
      debut = premier.toISOString().slice(0, 10);
      fin = dernier.toISOString().slice(0, 10);
      libellePeriode = premier.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    } else {
      if (dossier.exercice_debut && dossier.exercice_fin) {
        debut = String(dossier.exercice_debut).slice(0, 10);
        fin = String(dossier.exercice_fin).slice(0, 10);
      } else {
        const annee = new Date().getFullYear();
        debut = annee + "-01-01";
        fin = annee + "-12-31";
      }
      libellePeriode = "exercice du " + debut + " au " + fin;
    }

    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit, ecriture_date, ecriture_num, ecriture_lib")
      .eq("societe_id", dossier.id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Soldes des comptes de TVA sur la periode.
    const soldes: any = {};
    let baseCollectee = 0;
    let baseDeductible = 0;

    for (const l of lignes || []) {
      const num = String(l.compte_num || "");
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;

      if (num.startsWith("4457") || num.startsWith("4456") || num.startsWith("4455")
        || num.startsWith("4452") || num.startsWith("4453")) {
        if (!soldes[num]) soldes[num] = { lib: l.compte_lib, debit: 0, credit: 0 };
        soldes[num].debit = r2(soldes[num].debit + debit);
        soldes[num].credit = r2(soldes[num].credit + credit);
      }

      // Bases hors taxes : produits pour la collectee, charges et
      // immobilisations pour la deductible.
      if (num.charAt(0) === "7") baseCollectee = r2(baseCollectee + credit - debit);
      if (num.charAt(0) === "6" || num.charAt(0) === "2") {
        baseDeductible = r2(baseDeductible + debit - credit);
      }
    }

    function solde(num: string, sens: string): number {
      const s = soldes[num];
      if (!s) return 0;
      return sens === "credit" ? r2(s.credit - s.debit) : r2(s.debit - s.credit);
    }

    const collectee = solde(COLLECTEE, "credit");
    const deductibleBS = solde(DEDUCTIBLE_BS, "debit");
    const deductibleImmo = solde(DEDUCTIBLE_IMMO, "debit");
    const intracom = solde(INTRACOM, "credit");
    const creditAnterieur = solde(CREDIT_REPORT, "debit");

    const deductibleTotal = r2(deductibleBS + deductibleImmo);
    const dueBrute = r2(collectee + intracom);
    const solde_final = r2(dueBrute - deductibleTotal - creditAnterieur);

    const aDecaisser = solde_final > 0 ? solde_final : 0;
    const creditAReporter = solde_final < 0 ? r2(-solde_final) : 0;

    // CONTROLE : le solde calcule doit se retrouver au compte 445510 apres
    // l ecriture de liquidation. Un ecart signale une liquidation oubliee
    // ou une ecriture passee au mauvais compte.
    const soldeCompteADecaisser = solde(A_DECAISSER, "credit");
    const ecartLiquidation = r2(soldeCompteADecaisser - aDecaisser);

    const detail = Object.keys(soldes).sort().map(function (num) {
      const s = soldes[num];
      return {
        compte: num,
        libelle: s.lib,
        debit: s.debit,
        credit: s.credit,
        solde: r2(s.credit - s.debit),
      };
    });

    return NextResponse.json({
      ok: true,
      dossier: {
        code: dossier.code,
        raison_sociale: dossier.raison_sociale,
        siren: dossier.siren,
      },
      regime: regime,
      formulaire: mensuel ? "CA3" : "CA12",
      periode: { debut: debut, fin: fin, libelle: libellePeriode },
      bases: {
        produits_ht: baseCollectee,
        charges_et_immobilisations_ht: baseDeductible,
      },
      tva: {
        collectee: collectee,
        intracommunautaire_due: intracom,
        deductible_biens_services: deductibleBS,
        deductible_immobilisations: deductibleImmo,
        deductible_totale: deductibleTotal,
        credit_anterieur_reporte: creditAnterieur,
        a_decaisser: aDecaisser,
        credit_a_reporter: creditAReporter,
      },
      controle: {
        solde_compte_445510: soldeCompteADecaisser,
        ecart_liquidation: ecartLiquidation,
        liquidation_passee: Math.abs(ecartLiquidation) < 0.01 && aDecaisser > 0,
        nb_lignes_lues: (lignes || []).length,
      },
      detail_comptes: detail,
      avertissement:
        "Document de travail calcule depuis les ecritures. La declaration reelle se depose "
        + "sur impots.gouv.fr ou par voie EDI. Verifiez la ventilation par taux avant tout depot.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
