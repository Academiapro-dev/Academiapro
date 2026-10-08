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
  return NextResponse.json({ ok: false, erreur: "Réservé à l’administrateur." }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Un montant a la francaise, pour les messages : « 1 200,00 € ».
function eurosFr(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// 🆕 08/10 — LE NOM D UN COMPTE SE LIT AU PLAN, comme le fait la saisie : le
// plan propre au dossier d abord, le plan commun ensuite. Les ecritures que le
// logiciel passe lui-meme portaient des noms ecrits en dur, sans accents
// (« TVA collectee », « Remunerations du personnel ») : le meme compte
// portait alors deux noms selon que l ecriture etait saisie ou automatique.
// Le nom donne en second ne sert que si le compte manque au plan.
async function nomsDuPlan(societeId: string): Promise<any> {
  const { data: communs } = await supabase
    .from("compta_comptes").select("numero, libelle").is("societe_id", null).limit(3000);
  const { data: propres } = await supabase
    .from("compta_comptes").select("numero, libelle").eq("societe_id", societeId).limit(3000);
  const plan: any = {};
  for (const c of communs || []) plan[c.numero] = c.libelle;
  for (const c of propres || []) plan[c.numero] = c.libelle;
  return plan;
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
        { ok: false, erreur: "Dossier et type d’écriture sont nécessaires." },
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
          { ok: false, erreur: "Aucune dotation à passer pour " + annee + "." },
          { status: 404 }
        );
      }

      const numero = "OD" + annee + "-DOTATION";
      if (await existeDeja(b.societe_id, numero)) {
        return NextResponse.json(
          { ok: false, erreur: "La dotation " + annee + " a déjà été passée." },
          { status: 409 }
        );
      }

      const fin = annee + "-12-31";
      const lignes: any[] = [];
      let total = 0;
      const planDotation = await nomsDuPlan(String(b.societe_id));
      // 🆕 08/10 — UNE ECRITURE PASSEE PAR LE LOGICIEL PORTE SA REFERENCE.
      // Sans elle, le tableau de bord et la revision reclamaient une piece
      // pour la dotation que le logiciel venait lui-meme de calculer.
      const pieceDotation = "DOTATION-" + annee;

      for (const x of biens) {
        lignes.push({
          societe_id: b.societe_id,
          journal_code: "OD",
          journal_lib: "Operations diverses",
          ecriture_num: numero,
          ecriture_date: fin,
          piece_ref: pieceDotation,
          piece_date: fin,
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
        piece_ref: pieceDotation,
        piece_date: fin,
        compte_num: "681100",
        compte_lib: planDotation["681100"] || "Dotations aux amortissements",
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
        message: "Dotation " + annee + " passée : " + eurosFr(total)
          + " sur " + biens.length + (biens.length > 1 ? " biens." : " bien."),
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
          { ok: false, erreur: data.note || "Aucune TVA à liquider sur ce dossier." },
          { status: 400 }
        );
      }

      const t = data.tva;
      const fin = String(data.periode.fin).slice(0, 10);
      const numero = "OD" + fin.replace(/-/g, "").slice(0, 6) + "-TVA";

      if (await existeDeja(b.societe_id, numero)) {
        return NextResponse.json(
          { ok: false, erreur: "La liquidation de " + data.periode.libelle + " a déjà été passée." },
          { status: 409 }
        );
      }

      const lignes: any[] = [];
      const plan = await nomsDuPlan(String(b.societe_id));
      const commun = {
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: numero,
        ecriture_date: fin,
        // 🆕 08/10 — la reference de la declaration : « CA3-2026-09 ».
        piece_ref: String(data.formulaire || "TVA") + "-" + fin.slice(0, 7),
        piece_date: fin,
        ecriture_lib: "Liquidation de TVA - " + data.periode.libelle,
        devise: "EUR",
        valid_date: aujourdhui,
        saisi_par: session ? session.email : null,
      };

      if (t.collectee > 0) {
        lignes.push({ ...commun, compte_num: "445710", compte_lib: plan["445710"] || "TVA collectée", debit: t.collectee, credit: 0 });
      }
      if (t.intracommunautaire_due > 0) {
        lignes.push({ ...commun, compte_num: "445200", compte_lib: plan["445200"] || "TVA due intracommunautaire", debit: t.intracommunautaire_due, credit: 0 });
      }
      if (t.deductible_biens_services > 0) {
        lignes.push({ ...commun, compte_num: "445660", compte_lib: plan["445660"] || "TVA déductible sur autres biens et services", debit: 0, credit: t.deductible_biens_services });
      }
      if (t.deductible_immobilisations > 0) {
        lignes.push({ ...commun, compte_num: "445620", compte_lib: plan["445620"] || "TVA déductible sur immobilisations", debit: 0, credit: t.deductible_immobilisations });
      }
      if (t.credit_anterieur_reporte > 0) {
        lignes.push({ ...commun, compte_num: "445670", compte_lib: plan["445670"] || "Crédit de TVA à reporter", debit: 0, credit: t.credit_anterieur_reporte });
      }

      if (t.a_decaisser > 0) {
        lignes.push({ ...commun, compte_num: "445510", compte_lib: plan["445510"] || "TVA à décaisser", debit: 0, credit: t.a_decaisser });
      } else if (t.credit_a_reporter > 0) {
        lignes.push({ ...commun, compte_num: "445670", compte_lib: plan["445670"] || "Crédit de TVA à reporter", debit: t.credit_a_reporter, credit: 0 });
      }

      if (lignes.length < 2) {
        return NextResponse.json(
          { ok: false, erreur: "Aucun mouvement de TVA sur cette période." },
          { status: 404 }
        );
      }

      const debit = r2(lignes.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
      const credit = r2(lignes.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

      if (Math.abs(r2(debit - credit)) > 0.01) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "L’écriture de liquidation ne tombe pas juste : écart de "
              + eurosFr(r2(debit - credit)) + ". Rien n’a été passé.",
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
        message: "Liquidation de " + data.periode.libelle + " passée : "
          + (t.a_decaisser > 0
            ? eurosFr(t.a_decaisser) + " à décaisser."
            : eurosFr(t.credit_a_reporter) + " de crédit à reporter."),
      });
    }

    return NextResponse.json({ ok: false, erreur: "Type d’écriture inconnu." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
