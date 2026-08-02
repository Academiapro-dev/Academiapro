import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Coefficients du degressif selon la duree, conformes a l article 39 A.
function coefficient(duree: number): number {
  if (duree < 3) return 1;
  if (duree <= 4) return 1.25;
  if (duree <= 6) return 1.75;
  return 2.25;
}

// PLAN D AMORTISSEMENT CALCULE, jamais stocke : corriger une duree recalcule
// tout, au lieu de laisser un plan fige se desynchroniser.
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
    const annee = anneeDepart + i;
    let dotation = 0;

    if (immo.mode === "degressif") {
      const taux = (1 / duree) * coefficient(duree);
      const anneesRestantes = duree - i;
      const tauxLineaire = anneesRestantes > 0 ? 1 / anneesRestantes : 1;
      // On bascule au lineaire des qu il devient plus favorable.
      const tauxRetenu = tauxLineaire > taux ? tauxLineaire : taux;
      dotation = r2(reste * tauxRetenu);
      // Premiere annee : prorata en mois entiers, mois d acquisition compris.
      if (i === 0) dotation = r2(dotation * ((13 - moisDepart) / 12));
    } else {
      dotation = r2(base / duree);
      if (i === 0) {
        // Lineaire : prorata au jour, arrondi au mois pour rester lisible.
        dotation = r2(dotation * ((12 - moisDepart + 1) / 12));
      }
    }

    if (dotation > reste) dotation = reste;
    cumul = r2(cumul + dotation);
    reste = r2(base - cumul);

    lignes.push({
      annee: annee,
      dotation: dotation,
      cumul: cumul,
      valeur_nette: r2(Number(immo.valeur_acquisition) - cumul),
    });
  }

  return { base: base, lignes: lignes };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10)
      || new Date().getFullYear();

    const { data, error } = await supabase
      .from("compta_immobilisations")
      .select("*")
      .eq("societe_id", id)
      .order("date_service", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    let totalBrut = 0;
    let totalCumul = 0;
    let totalDotation = 0;

    const biens = (data || []).map(function (immo: any) {
      const plan = planAmortissement(immo);
      const jusquAnnee = plan.lignes.filter(function (l: any) { return l.annee <= annee; });
      const derniere = jusquAnnee[jusquAnnee.length - 1];
      const cetteAnnee = plan.lignes.find(function (l: any) { return l.annee === annee; });

      const cumul = derniere ? derniere.cumul : 0;
      const vnc = r2(Number(immo.valeur_acquisition) - cumul);
      const sorti = !!immo.date_sortie;

      if (!sorti) {
        totalBrut = r2(totalBrut + Number(immo.valeur_acquisition));
        totalCumul = r2(totalCumul + cumul);
        totalDotation = r2(totalDotation + (cetteAnnee ? cetteAnnee.dotation : 0));
      }

      // Cession : la plus ou moins-value se mesure sur la valeur nette.
      let plusValue = null;
      if (sorti && immo.prix_cession !== null && immo.prix_cession !== undefined) {
        plusValue = r2(Number(immo.prix_cession) - vnc);
      }

      return {
        ...immo,
        base_amortissable: plan.base,
        plan: plan.lignes,
        cumul_amortissements: cumul,
        valeur_nette: vnc,
        dotation_exercice: cetteAnnee ? cetteAnnee.dotation : 0,
        amorti: vnc <= Number(immo.valeur_residuelle || 0) + 0.005,
        sorti: sorti,
        plus_value_cession: plusValue,
      };
    });

    return NextResponse.json({
      ok: true,
      annee: annee,
      total: biens.length,
      en_service: biens.filter(function (b: any) { return !b.sorti; }).length,
      valeur_brute: totalBrut,
      amortissements_cumules: totalCumul,
      valeur_nette_totale: r2(totalBrut - totalCumul),
      dotation_exercice: totalDotation,
      biens: biens,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const designation = String(b.designation || "").trim();
    if (designation.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "La designation du bien est obligatoire." },
        { status: 400 }
      );
    }

    const valeur = Number(String(b.valeur_acquisition || "").replace(",", "."));
    if (isNaN(valeur) || valeur <= 0) {
      return NextResponse.json(
        { ok: false, erreur: "La valeur d acquisition doit etre positive." },
        { status: 400 }
      );
    }

    const duree = Number(String(b.duree_annees || "").replace(",", "."));
    if (isNaN(duree) || duree <= 0 || duree > 50) {
      return NextResponse.json(
        { ok: false, erreur: "La duree doit etre comprise entre 1 et 50 ans." },
        { status: 400 }
      );
    }

    const acquisition = String(b.date_acquisition || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(acquisition)) {
      return NextResponse.json({ ok: false, erreur: "Date d acquisition invalide." }, { status: 400 });
    }

    const fiche: any = {
      societe_id: b.societe_id,
      code: b.code ? String(b.code).trim().toUpperCase().slice(0, 20) : null,
      designation: designation.slice(0, 200),
      compte_immo: String(b.compte_immo || "218300").replace(/\D/g, "") || "218300",
      compte_amort: String(b.compte_amort || "281830").replace(/\D/g, "") || "281830",
      compte_dotation: String(b.compte_dotation || "681100").replace(/\D/g, "") || "681100",
      date_acquisition: acquisition,
      date_service: b.date_service ? String(b.date_service).slice(0, 10) : acquisition,
      valeur_acquisition: r2(valeur),
      valeur_residuelle: r2(Number(String(b.valeur_residuelle || 0).replace(",", ".")) || 0),
      duree_annees: duree,
      mode: b.mode === "degressif" ? "degressif" : "lineaire",
      date_sortie: b.date_sortie ? String(b.date_sortie).slice(0, 10) : null,
      prix_cession: b.prix_cession !== undefined && b.prix_cession !== null && b.prix_cession !== ""
        ? r2(Number(String(b.prix_cession).replace(",", ".")) || 0)
        : null,
      notes: b.notes ? String(b.notes).slice(0, 1000) : null,
      updated_at: new Date().toISOString(),
    };

    const r = b.id
      ? await supabase.from("compta_immobilisations").update(fiche).eq("id", b.id)
      : await supabase.from("compta_immobilisations").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: (b.id ? "Fiche modifiee" : "Bien immobilise enregistre") + " : " + designation + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
