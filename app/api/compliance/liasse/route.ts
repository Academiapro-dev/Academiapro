import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Sans cette option, Next met en cache le resultat des requetes et la route
// travaille sur des donnees perimees — un dossier cree a l instant reste
// introuvable.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function sessionPresente(req: NextRequest): boolean {
  try {
    return !!req.cookies.get("sb_user")?.value;
  } catch {
    return false;
  }
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Bareme IS (hypothese PME : taux reduit 15 % jusqu'a 42 500, puis 25 %)
function calculIS(base: number): { is_15: number; is_25: number; total: number } {
  if (base <= 0) return { is_15: 0, is_25: 0, total: 0 };
  const tranche15 = Math.min(base, 42500);
  const tranche25 = Math.max(base - 42500, 0);
  const is_15 = r2(tranche15 * 0.15);
  const is_25 = r2(tranche25 * 0.25);
  return { is_15, is_25, total: r2(is_15 + is_25) };
}

export async function GET(req: NextRequest) {
  if (!sessionPresente(req)) {
    return NextResponse.json(
      { error: "Connectez-vous pour produire une liasse." },
      { status: 401 }
    );
  }

  try {
    // CHOIX DU DOSSIER : jamais devine des qu il y en a plusieurs.
    const codeDemande = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const idDemande = (req.nextUrl.searchParams.get("societe_id") || "").trim();

    const { data: dossiers, error: erreurDossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, forme, regime_fiscal, exercice_debut, exercice_fin, actif")
      .limit(500);

    if (erreurDossiers) {
      return NextResponse.json(
        { error: "Lecture des dossiers: " + erreurDossiers.message },
        { status: 500 }
      );
    }

    const liste = (dossiers || []).filter(function (s: any) { return s.actif !== false; });

    if (liste.length === 0) {
      return NextResponse.json(
        { error: "Aucun dossier comptable. Ouvrez-en un avant de produire une liasse." },
        { status: 404 }
      );
    }

    let dossier: any = null;

    if (idDemande) {
      dossier = liste.find(function (s: any) { return s.id === idDemande; }) || null;
    } else if (codeDemande) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === codeDemande;
      }) || null;
    } else if (liste.length === 1) {
      dossier = liste[0];
    }

    if (!dossier) {
      if (!codeDemande && !idDemande) {
        return NextResponse.json(
          {
            error: "Precisez le dossier : ?societe=CODE",
            dossiers: liste.map(function (s: any) {
              return { code: s.code, raison_sociale: s.raison_sociale };
            }),
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Dossier introuvable.",
          demande: codeDemande || idDemande,
          dossiers_connus: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 404 }
      );
    }

    const anneeDemandee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);

    let debut: string;
    let fin: string;

    if (anneeDemandee) {
      debut = anneeDemandee + "-01-01";
      fin = anneeDemandee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const annee = new Date().getFullYear();
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    }

    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", dossier.id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    if (error) {
      return NextResponse.json(
        { error: "Lecture ecritures: " + error.message },
        { status: 500 }
      );
    }
    if (!lignes || lignes.length === 0) {
      return NextResponse.json(
        {
          error: "Aucune ecriture pour " + dossier.raison_sociale
            + " entre le " + debut + " et le " + fin + ".",
          dossier: dossier.code,
        },
        { status: 404 }
      );
    }

    // ---- Soldes par compte ----
    const comptes: Record<string, { lib: string; debit: number; credit: number }> = {};
    for (const l of lignes) {
      const num = l.compte_num;
      if (!comptes[num]) comptes[num] = { lib: l.compte_lib, debit: 0, credit: 0 };
      comptes[num].debit += Number(l.debit || 0);
      comptes[num].credit += Number(l.credit || 0);
    }

    // ---- Compte de resultat (type 2033-B) ----
    let produits = 0;
    let charges = 0;
    const detail_charges: Record<string, number> = {};
    const detail_produits: Record<string, number> = {};

    // ---- Bilan (type 2033-A) ----
    let immobilisations = 0; // classe 2
    let stocks = 0;          // classe 3
    let creances = 0;        // classe 4, solde debiteur
    let dettes = 0;          // classe 4, solde crediteur
    let treso_active = 0;    // classe 5, solde debiteur
    let treso_passive = 0;   // classe 5, solde crediteur
    let capitaux_hors_resultat = 0; // classe 1, credit - debit

    for (const num of Object.keys(comptes)) {
      const c = comptes[num];
      const solde = r2(c.debit - c.credit); // positif = debiteur
      const classe = num.charAt(0);
      if (classe === "7") {
        const montant = r2(c.credit - c.debit);
        produits = r2(produits + montant);
        detail_produits[num + " " + c.lib] = montant;
      } else if (classe === "6") {
        const montant = r2(c.debit - c.credit);
        charges = r2(charges + montant);
        detail_charges[num + " " + c.lib] = montant;
      } else if (classe === "2") {
        immobilisations = r2(immobilisations + solde);
      } else if (classe === "3") {
        stocks = r2(stocks + solde);
      } else if (classe === "4") {
        if (solde >= 0) creances = r2(creances + solde);
        else dettes = r2(dettes - solde);
      } else if (classe === "5") {
        if (solde >= 0) treso_active = r2(treso_active + solde);
        else treso_passive = r2(treso_passive - solde);
      } else if (classe === "1") {
        capitaux_hors_resultat = r2(capitaux_hors_resultat + (c.credit - c.debit));
      }
    }

    const resultat = r2(produits - charges);
    const deficit_reportable = resultat < 0 ? r2(-resultat) : 0;

    // L IMPOT SUIT LE REGIME INSCRIT AU DOSSIER. Hors IS, on ne calcule rien :
    // presenter un impot sur une societe transparente serait faux, et un
    // chiffre faux vaut moins que pas de chiffre.
    const regime = String(dossier.regime_fiscal || "a_determiner");
    const soumisIS = regime === "is";
    const impot = soumisIS ? calculIS(resultat) : { is_15: 0, is_25: 0, total: 0 };

    const total_actif = r2(immobilisations + stocks + creances + treso_active);
    const capitaux_propres = r2(capitaux_hors_resultat + resultat);
    const total_passif = r2(capitaux_propres + dettes + treso_passive);
    const ecart = r2(total_actif - total_passif);

    let noteRegime = "";
    if (regime === "is") {
      noteRegime = "Societe a l impot sur les societes. Taux reduit 15 % suppose (conditions PME a verifier).";
    } else if (regime === "a_determiner") {
      noteRegime = "REGIME FISCAL NON TRANCHE pour ce dossier : aucun impot n est calcule. Renseignez le regime sur la fiche du dossier.";
    } else if (regime === "transparent" || regime === "ir") {
      noteRegime = "Societe non soumise a l IS : le resultat est impose entre les mains des associes. La liasse 2065/2033 ne s applique pas en l etat.";
    } else {
      noteRegime = "Regime " + regime + " : aucun impot calcule.";
    }

    return NextResponse.json({
      success: true,
      dossier: {
        code: dossier.code,
        raison_sociale: dossier.raison_sociale,
        siren: dossier.siren,
        forme: dossier.forme,
        regime_fiscal: regime,
      },
      periode: { debut: debut, fin: fin },
      soumis_is: soumisIS,
      note_regime: noteRegime,
      avertissement:
        "Document de travail. La liasse reelle (2065 + 2033) se teletransmet en EDI-TDFC.",
      compte_resultat: {
        produits,
        charges,
        detail_produits,
        detail_charges,
        resultat_comptable: resultat,
      },
      impot_societes: {
        applicable: soumisIS,
        base_imposable: soumisIS && resultat > 0 ? resultat : 0,
        tranche_15_pct: impot.is_15,
        tranche_25_pct: impot.is_25,
        is_total: impot.total,
        deficit_reportable,
      },
      bilan: {
        actif: {
          immobilisations,
          stocks,
          creances,
          tresorerie: treso_active,
          total: total_actif,
        },
        passif: {
          capitaux_propres_hors_resultat: capitaux_hors_resultat,
          resultat_exercice: resultat,
          capitaux_propres: capitaux_propres,
          dettes,
          tresorerie_passive: treso_passive,
          total: total_passif,
        },
      },
      controle: {
        equilibre: ecart === 0,
        ecart,
        nb_lignes_lues: lignes.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
