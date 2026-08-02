import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage } from "../../../../lib/droits";

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

function base(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
}

async function existeDeja(societeId: string, numero: string): Promise<boolean> {
  const { data } = await supabase
    .from("compta_ecritures")
    .select("ecriture_num")
    .eq("societe_id", societeId)
    .eq("ecriture_num", numero)
    .limit(1);
  return (data || []).length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id || !b.type) {
      return NextResponse.json(
        { ok: false, erreur: "Dossier et type d ecriture sont necessaires." },
        { status: 400 }
      );
    }

    // LE BARRAGE, selon la nature du geste : la dotation est une ecriture
    // d inventaire, la liquidation de TVA releve de la declaration.
    const droit = b.type === "tva" ? "declarer" : "valider";
    const refusDroit = await barrage(droit, String(b.societe_id));
    if (refusDroit) return refusDroit;

    const session = sessionCourante();
    const cookie = req.headers.get("cookie") || "";
    const aujourdhui = new Date().toISOString().slice(0, 10);

    // ---- DOTATION AUX AMORTISSEMENTS ----
    if (b.type === "dotation") {
      const annee = parseInt(b.annee, 10) || new Date().getFullYear();

      const r = await fetch(
        base(req) + "/api/compliance/immobilisations?societe_id=" + b.societe_id + "&year=" + annee,
        { headers: { cookie: cookie } }
      );
      const data = await r.json();

      if (!data.ok) {
        return NextResponse.json({ ok: false, erreur: data.erreur || "Lecture impossible." }, { status: 500 });
      }

      const biens = (data.biens || []).filter(function (x: any) {
        return !x.sorti && x.dotation_exercice > 0;
      });

      if (biens.length === 0) {
        return NextResponse.json(
          { ok: false, erreur: "Aucune dotation a passer pour " + annee + "." },
          { status: 404 }
        );
      }

      const numero = "OD" + annee + "-DOTATION";
      if (await existeDeja(b.societe_id, numero)) {
        return NextResponse.json(
          { ok: false, erreur: "La dotation " + annee + " a deja ete passee." },
          { status: 409 }
        );
      }

      const fin = annee + "-12-31";
      const lignes: any[] = [];
      let total = 0;

      for (const x of biens) {
        lignes.push({
          societe_id: b.societe_id,
          journal_code: "OD",
          journal_lib: "Operations diverses",
          ecriture_num: numero,
          ecriture_date: fin,
          compte_num: x.compte_amort,
          compte_lib: "Amortissements - " + String(x.designation).slice(0, 80),
          ecriture_lib: "Dotation " + annee + " - " + String(x.designation).slice(0, 80),
          debit: 0,
          credit: x.dotation_exercice,
          devise: "EUR",
          valid_date: aujourdhui,
          saisi_par: session ? session.email : null,
        });
        total = r2(total + x.dotation_exercice);
      }

      lignes.push({
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: numero,
        ecriture_date: fin,
        compte_num: "681100",
        compte_lib: "Dotations aux amortissements",
        ecriture_lib: "Dotation aux amortissements " + annee,
        debit: total,
        credit: 0,
        devise: "EUR",
        valid_date: aujourdhui,
        saisi_par: session ? session.email : null,
      });

      const { error } = await supabase.from("compta_ecritures").insert(lignes);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        ecriture_num: numero,
        lignes: lignes.length,
        total: total,
        message: "Dotation " + annee + " passee : " + total.toFixed(2)
          + " EUR sur " + biens.length + " bien(s).",
      });
    }

    // ---- LIQUIDATION DE TVA ----
    if (b.type === "tva") {
      const mois = String(b.mois || "").trim();

      const r = await fetch(
        base(req) + "/api/compliance/tva?societe_id=" + b.societe_id + (mois ? "&mois=" + mois : ""),
        { headers: { cookie: cookie } }
      );
      const data = await r.json();

      if (!data.ok) {
        return NextResponse.json({ ok: false, erreur: data.erreur || "Lecture impossible." }, { status: 500 });
      }
      if (!data.tva) {
        return NextResponse.json(
          { ok: false, erreur: data.note || "Aucune TVA a liquider sur ce dossier." },
          { status: 400 }
        );
      }

      const t = data.tva;
      const fin = String(data.periode.fin).slice(0, 10);
      const numero = "OD" + fin.replace(/-/g, "").slice(0, 6) + "-TVA";

      if (await existeDeja(b.societe_id, numero)) {
        return NextResponse.json(
          { ok: false, erreur: "La liquidation de " + data.periode.libelle + " a deja ete passee." },
          { status: 409 }
        );
      }

      const lignes: any[] = [];
      const commun = {
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: numero,
        ecriture_date: fin,
        ecriture_lib: "Liquidation de TVA - " + data.periode.libelle,
        devise: "EUR",
        valid_date: aujourdhui,
        saisi_par: session ? session.email : null,
      };

      if (t.collectee > 0) {
        lignes.push({ ...commun, compte_num: "445710", compte_lib: "TVA collectee", debit: t.collectee, credit: 0 });
      }
      if (t.intracommunautaire_due > 0) {
        lignes.push({ ...commun, compte_num: "445200", compte_lib: "TVA due intracommunautaire", debit: t.intracommunautaire_due, credit: 0 });
      }
      if (t.deductible_biens_services > 0) {
        lignes.push({ ...commun, compte_num: "445660", compte_lib: "TVA deductible sur biens et services", debit: 0, credit: t.deductible_biens_services });
      }
      if (t.deductible_immobilisations > 0) {
        lignes.push({ ...commun, compte_num: "445620", compte_lib: "TVA deductible sur immobilisations", debit: 0, credit: t.deductible_immobilisations });
      }
      if (t.credit_anterieur_reporte > 0) {
        lignes.push({ ...commun, compte_num: "445670", compte_lib: "Credit de TVA a reporter", debit: 0, credit: t.credit_anterieur_reporte });
      }

      if (t.a_decaisser > 0) {
        lignes.push({ ...commun, compte_num: "445510", compte_lib: "TVA a decaisser", debit: 0, credit: t.a_decaisser });
      } else if (t.credit_a_reporter > 0) {
        lignes.push({ ...commun, compte_num: "445670", compte_lib: "Credit de TVA a reporter", debit: t.credit_a_reporter, credit: 0 });
      }

      if (lignes.length < 2) {
        return NextResponse.json(
          { ok: false, erreur: "Aucun mouvement de TVA sur cette periode." },
          { status: 404 }
        );
      }

      const debit = r2(lignes.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
      const credit = r2(lignes.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

      if (Math.abs(r2(debit - credit)) > 0.01) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "L ecriture de liquidation ne tombe pas juste : ecart de "
              + r2(debit - credit).toFixed(2) + " EUR. Rien n a ete passe.",
          },
          { status: 409 }
        );
      }

      const { error } = await supabase.from("compta_ecritures").insert(lignes);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        ecriture_num: numero,
        lignes: lignes.length,
        message: "Liquidation de " + data.periode.libelle + " passee : "
          + (t.a_decaisser > 0
            ? t.a_decaisser.toFixed(2) + " EUR a decaisser."
            : t.credit_a_reporter.toFixed(2) + " EUR de credit a reporter."),
      });
    }

    return NextResponse.json({ ok: false, erreur: "Type d ecriture inconnu." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
