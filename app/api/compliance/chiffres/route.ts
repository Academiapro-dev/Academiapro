import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LES CHIFFRES D UN DOSSIER.
//
// Le plan comptable general francais range les comptes par classe, et le
// premier chiffre suffit a savoir ce qu on lit :
//
//   classe 5 — tresorerie : banque et caisse
//   classe 6 — charges : ce qui sort
//   classe 7 — produits : ce qui entre
//   411     — clients : ce qu on nous doit
//   401     — fournisseurs : ce qu on doit
//
// SENS DES SOLDES. Un produit est au CREDIT, une charge au DEBIT. Un solde
// de tresorerie est debiteur quand le compte est approvisionne. Se tromper
// de sens donne un resultat inverse, et personne ne s en apercoit avant le
// bilan.

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const societeId = url.searchParams.get("societe_id") || "";

    // Le dossier doit appartenir au cabinet connecte.
    const { data: societes, error: eSoc } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin, devise")
      .eq("tenant_id", session.tenantId)
      .eq("actif", true)
      .limit(500);

    if (eSoc) {
      return NextResponse.json({ ok: false, erreur: eSoc.message }, { status: 500 });
    }

    const liste = societes || [];

    if (liste.length === 0) {
      return NextResponse.json({ ok: true, dossiers: [], total: null });
    }

    const choisi = societeId
      ? liste.filter(function (s: any) { return s.id === societeId; })
      : liste;

    if (societeId && choisi.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const resultats: any[] = [];

    for (const s of choisi) {
      const { data: lignes } = await supabase
        .from("compta_ecritures")
        .select("compte_num, debit, credit, ecriture_date, journal_code")
        .eq("societe_id", s.id)
        .limit(50000);

      let produits = 0;
      let charges = 0;
      let tresorerie = 0;
      let clients = 0;
      let fournisseurs = 0;

      // Les douze derniers mois, pour la courbe.
      const parMois: any = {};

      for (const l of lignes || []) {
        const compte = String(l.compte_num || "");
        const d = Number(l.debit) || 0;
        const c = Number(l.credit) || 0;
        const classe = compte.slice(0, 1);

        if (classe === "7") {
          // Un produit s enregistre au credit ; un avoir vient le diminuer.
          produits = produits + c - d;

          const mois = String(l.ecriture_date || "").slice(0, 7);
          if (mois) {
            if (!parMois[mois]) parMois[mois] = { produits: 0, charges: 0 };
            parMois[mois].produits = parMois[mois].produits + c - d;
          }
        } else if (classe === "6") {
          charges = charges + d - c;

          const mois = String(l.ecriture_date || "").slice(0, 7);
          if (mois) {
            if (!parMois[mois]) parMois[mois] = { produits: 0, charges: 0 };
            parMois[mois].charges = parMois[mois].charges + d - c;
          }
        } else if (classe === "5") {
          // La tresorerie est debitrice quand le compte est approvisionne.
          tresorerie = tresorerie + d - c;
        } else if (compte.indexOf("411") === 0) {
          clients = clients + d - c;
        } else if (compte.indexOf("401") === 0) {
          fournisseurs = fournisseurs + c - d;
        }
      }

      const mois = Object.keys(parMois).sort().slice(-12).map(function (m) {
        return {
          mois: m,
          produits: r2(parMois[m].produits),
          charges: r2(parMois[m].charges),
          resultat: r2(parMois[m].produits - parMois[m].charges),
        };
      });

      resultats.push({
        id: s.id,
        code: s.code,
        nom: s.raison_sociale,
        devise: s.devise || "EUR",
        exercice: { debut: s.exercice_debut, fin: s.exercice_fin },
        chiffre_affaires: r2(produits),
        charges: r2(charges),
        resultat: r2(produits - charges),
        tresorerie: r2(tresorerie),
        clients: r2(clients),
        fournisseurs: r2(fournisseurs),
        lignes: (lignes || []).length,
        mois: mois,
      });
    }

    // Le cumul du cabinet, pour la vue d ensemble.
    const total = {
      dossiers: resultats.length,
      chiffre_affaires: r2(resultats.reduce(function (a, r) { return a + r.chiffre_affaires; }, 0)),
      charges: r2(resultats.reduce(function (a, r) { return a + r.charges; }, 0)),
      resultat: r2(resultats.reduce(function (a, r) { return a + r.resultat; }, 0)),
      tresorerie: r2(resultats.reduce(function (a, r) { return a + r.tresorerie; }, 0)),
      clients: r2(resultats.reduce(function (a, r) { return a + r.clients; }, 0)),
      fournisseurs: r2(resultats.reduce(function (a, r) { return a + r.fournisseurs; }, 0)),
    };

    return NextResponse.json({
      ok: true,
      dossiers: resultats,
      total: total,
      tous: liste.map(function (s: any) {
        return { id: s.id, code: s.code, raison_sociale: s.raison_sociale };
      }),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
