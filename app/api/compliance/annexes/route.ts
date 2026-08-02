import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

const ADMINS = ["contact@academiapro.fr"];

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

// Le meme calcul que l ecran des immobilisations : le plan se recalcule,
// il ne se stocke pas.
function coefficient(duree: number): number {
  if (duree < 3) return 1;
  if (duree <= 4) return 1.25;
  if (duree <= 6) return 1.75;
  return 2.25;
}

function planAmortissement(immo: any) {
  const base = r2(Number(immo.valeur_acquisition) - Number(immo.valeur_residuelle || 0));
  const duree = Number(immo.duree_annees) || 1;
  const depart = new Date(immo.date_service || immo.date_acquisition);
  const anneeDepart = depart.getUTCFullYear();
  const moisDepart = depart.getUTCMonth() + 1;

  const lignes: any[] = [];
  let reste = base;
  let cumul = 0;
  const nbAnnees = Math.ceil(duree) + (moisDepart > 1 ? 1 : 0);

  for (let i = 0; i < nbAnnees && reste > 0.005; i = i + 1) {
    let dotation = 0;
    if (immo.mode === "degressif") {
      const taux = (1 / duree) * coefficient(duree);
      const restantes = duree - i;
      const lineaire = restantes > 0 ? 1 / restantes : 1;
      dotation = r2(reste * (lineaire > taux ? lineaire : taux));
      if (i === 0) dotation = r2(dotation * ((13 - moisDepart) / 12));
    } else {
      dotation = r2(base / duree);
      if (i === 0) dotation = r2(dotation * ((12 - moisDepart + 1) / 12));
    }
    if (dotation > reste) dotation = reste;
    cumul = r2(cumul + dotation);
    reste = r2(base - cumul);
    lignes.push({ annee: anneeDepart + i, dotation: dotation, cumul: cumul });
  }

  return lignes;
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes").select("*").eq("id", id).maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10)
      || (dossier.exercice_fin
        ? parseInt(String(dossier.exercice_fin).slice(0, 4), 10)
        : new Date().getFullYear());

    const debut = dossier.exercice_debut
      ? String(dossier.exercice_debut).slice(0, 10)
      : annee + "-01-01";
    const fin = dossier.exercice_fin
      ? String(dossier.exercice_fin).slice(0, 10)
      : annee + "-12-31";

    // ---- 2033-C : immobilisations et amortissements ----
    const { data: immos } = await supabase
      .from("compta_immobilisations")
      .select("*")
      .eq("societe_id", id)
      .limit(2000);

    const biens = (immos || []).map(function (b: any) {
      const plan = planAmortissement(b);
      const jusqua = plan.filter(function (l: any) { return l.annee <= annee; });
      const avant = plan.filter(function (l: any) { return l.annee < annee; });
      const cette = plan.find(function (l: any) { return l.annee === annee; });

      const cumulFin = jusqua.length > 0 ? jusqua[jusqua.length - 1].cumul : 0;
      const cumulDebut = avant.length > 0 ? avant[avant.length - 1].cumul : 0;

      const acquis = String(b.date_acquisition || "").slice(0, 10);
      const entreeExercice = acquis >= debut && acquis <= fin;
      const sortieExercice = b.date_sortie
        && String(b.date_sortie).slice(0, 10) >= debut
        && String(b.date_sortie).slice(0, 10) <= fin;

      return {
        designation: b.designation,
        compte: b.compte_immo,
        date_service: b.date_service,
        mode: b.mode,
        duree: b.duree_annees,
        valeur_brute: r2(Number(b.valeur_acquisition)),
        entree_exercice: entreeExercice ? r2(Number(b.valeur_acquisition)) : 0,
        sortie_exercice: sortieExercice ? r2(Number(b.valeur_acquisition)) : 0,
        amort_debut: cumulDebut,
        dotation: cette ? cette.dotation : 0,
        amort_fin: cumulFin,
        valeur_nette: r2(Number(b.valeur_acquisition) - cumulFin),
        sorti: !!b.date_sortie,
      };
    });

    const actifs = biens.filter(function (b: any) { return !b.sorti; });

    const c2033 = {
      brut_debut: r2(actifs.reduce(function (s: number, b: any) { return s + b.valeur_brute - b.entree_exercice; }, 0)),
      entrees: r2(biens.reduce(function (s: number, b: any) { return s + b.entree_exercice; }, 0)),
      sorties: r2(biens.reduce(function (s: number, b: any) { return s + b.sortie_exercice; }, 0)),
      brut_fin: r2(actifs.reduce(function (s: number, b: any) { return s + b.valeur_brute; }, 0)),
      amort_debut: r2(actifs.reduce(function (s: number, b: any) { return s + b.amort_debut; }, 0)),
      dotations: r2(actifs.reduce(function (s: number, b: any) { return s + b.dotation; }, 0)),
      amort_fin: r2(actifs.reduce(function (s: number, b: any) { return s + b.amort_fin; }, 0)),
      valeur_nette: r2(actifs.reduce(function (s: number, b: any) { return s + b.valeur_nette; }, 0)),
      biens: biens,
    };

    // ---- 2033-D : provisions et deficits reportables ----
    const { data: provisions } = await supabase
      .from("compta_provisions")
      .select("*")
      .eq("societe_id", id)
      .limit(2000);

    const lignesProv = (provisions || []).map(function (p: any) {
      const constituee = String(p.date_constitution || "").slice(0, 10);
      const reprise = p.reprise_le ? String(p.reprise_le).slice(0, 10) : null;
      const dansExercice = constituee >= debut && constituee <= fin;
      const repriseExercice = reprise && reprise >= debut && reprise <= fin;
      const montant = r2(Number(p.montant_provision));
      const repris = r2(Number(p.montant_reprise) || 0);

      return {
        type: p.type,
        tiers: p.tiers,
        compte: p.compte_provision,
        montant_debut: dansExercice ? 0 : montant,
        dotation: dansExercice ? montant : 0,
        reprise: repriseExercice ? repris : 0,
        montant_fin: r2(montant - repris),
      };
    });

    const d2033 = {
      montant_debut: r2(lignesProv.reduce(function (s: number, p: any) { return s + p.montant_debut; }, 0)),
      dotations: r2(lignesProv.reduce(function (s: number, p: any) { return s + p.dotation; }, 0)),
      reprises: r2(lignesProv.reduce(function (s: number, p: any) { return s + p.reprise; }, 0)),
      montant_fin: r2(lignesProv.reduce(function (s: number, p: any) { return s + p.montant_fin; }, 0)),
      provisions: lignesProv,
    };

    // ---- 2057 : etat des echeances des creances et des dettes ----
    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit, lettrage, ecriture_date")
      .eq("societe_id", id)
      .lte("ecriture_date", fin)
      .limit(50000);

    const tiers: any = {};
    for (const l of ecritures || []) {
      const n = String(l.compte_num || "");
      if (!(n.startsWith("41") || n.startsWith("40") || n.startsWith("42")
        || n.startsWith("43") || n.startsWith("44"))) continue;
      if (l.lettrage) continue;

      if (!tiers[n]) tiers[n] = { compte: n, libelle: l.compte_lib, solde: 0, plus_ancienne: null };
      tiers[n].solde = r2(tiers[n].solde + (Number(l.debit) || 0) - (Number(l.credit) || 0));

      const t = new Date(l.ecriture_date).getTime();
      if (!tiers[n].plus_ancienne || t < tiers[n].plus_ancienne) tiers[n].plus_ancienne = t;
    }

    const finTemps = new Date(fin).getTime();

    const echeances = Object.keys(tiers)
      .map(function (n) {
        const t = tiers[n];
        const jours = t.plus_ancienne ? Math.round((finTemps - t.plus_ancienne) / 86400000) : 0;
        return {
          ...t,
          anciennete_jours: jours,
          a_un_an_au_plus: jours <= 365,
          nature: n.startsWith("41") ? "creance" : "dette",
        };
      })
      .filter(function (t: any) { return Math.abs(t.solde) > 0.005; })
      .sort(function (a: any, b: any) { return b.anciennete_jours - a.anciennete_jours; });

    const creances = echeances.filter(function (t: any) { return t.nature === "creance"; });
    const dettes = echeances.filter(function (t: any) { return t.nature === "dette"; });

    return NextResponse.json({
      ok: true,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale, siren: dossier.siren },
      annee: annee,
      periode: { debut: debut, fin: fin },
      annexe_2033_c: c2033,
      annexe_2033_d: d2033,
      annexe_2057: {
        creances: creances,
        dettes: dettes,
        total_creances: r2(creances.reduce(function (s: number, t: any) { return s + t.solde; }, 0)),
        total_dettes: r2(dettes.reduce(function (s: number, t: any) { return s - t.solde; }, 0)),
        creances_anciennes: creances.filter(function (t: any) { return !t.a_un_an_au_plus; }).length,
      },
      avertissement:
        "Les echeances sont deduites de l anciennete des ecritures non lettrees. "
        + "Un compte de tiers mal lettre fausse cette annexe : lettrez avant de deposer.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
