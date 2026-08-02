import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage, lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const TYPES: any = {
  creance_client: {
    nom: "Depreciation de creance client",
    provision: "491000", dotation: "681700", reprise: "781700",
  },
  risque: {
    nom: "Provision pour risque",
    provision: "151000", dotation: "681500", reprise: "781500",
  },
  charge: {
    nom: "Provision pour charge",
    provision: "151000", dotation: "681500", reprise: "781500",
  },
};

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

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[|\r\n\t]/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

async function numeroSuivant(societeId: string, annee: string): Promise<string> {
  const prefixe = "OD" + annee + "-";
  const { data } = await supabase
    .from("compta_ecritures")
    .select("ecriture_num")
    .eq("societe_id", societeId)
    .like("ecriture_num", prefixe + "P%")
    .order("ecriture_num", { ascending: false })
    .limit(1);

  let rang = 1;
  const derniere = (data || [])[0];
  if (derniere && derniere.ecriture_num) {
    const n = parseInt(String(derniere.ecriture_num).replace(prefixe + "P", ""), 10);
    if (!isNaN(n)) rang = n + 1;
  }
  return prefixe + "P" + String(rang).padStart(3, "0");
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data, error } = await supabase
      .from("compta_provisions")
      .select("*")
      .eq("societe_id", id)
      .order("date_constitution", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = (data || []).map(function (p: any) {
      const reprise = Number(p.montant_reprise) || 0;
      const restante = r2(Number(p.montant_provision) - reprise);
      return {
        ...p,
        type_nom: (TYPES[p.type] || {}).nom || p.type,
        montant_restant: restante,
        soldee: restante <= 0.005,
      };
    });

    const enCours = liste.filter(function (p: any) { return !p.soldee; });

    return NextResponse.json({
      ok: true,
      types: Object.keys(TYPES).map(function (k) {
        return { code: k, nom: TYPES[k].nom };
      }),
      total: liste.length,
      en_cours: enCours.length,
      montant_en_cours: r2(enCours.reduce(function (s: number, p: any) { return s + p.montant_restant; }, 0)),
      provisions: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LE BARRAGE : une reprise de provision augmente le resultat imposable.
    const refusDroit = await barrage("valider", String(b.societe_id));
    if (refusDroit) return refusDroit;

    const session = sessionCourante();
    const email = session ? session.email : null;

    // ---- REPRISE : la provision devient sans objet, en tout ou partie. ----
    if (b.action === "reprendre") {
      const { data: prov } = await supabase
        .from("compta_provisions")
        .select("*")
        .eq("id", b.id)
        .maybeSingle();

      if (!prov) {
        return NextResponse.json({ ok: false, erreur: "Provision introuvable." }, { status: 404 });
      }

      const dejaRepris = Number(prov.montant_reprise) || 0;
      const restante = r2(Number(prov.montant_provision) - dejaRepris);

      let montant = Number(String(b.montant || restante).replace(",", "."));
      if (isNaN(montant) || montant <= 0) montant = restante;
      if (montant > restante + 0.005) {
        return NextResponse.json(
          { ok: false, erreur: "La reprise depasse la provision restante (" + restante.toFixed(2) + " EUR)." },
          { status: 400 }
        );
      }

      const config = TYPES[prov.type] || TYPES.risque;
      const date = String(b.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const numero = await numeroSuivant(b.societe_id, date.slice(0, 4));

      const commun = {
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: numero,
        ecriture_date: date,
        ecriture_lib: "Reprise de provision - " + (prov.tiers || prov.reference || prov.type),
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
        saisi_par: email,
      };

      const lignes = [
        { ...commun, compte_num: prov.compte_provision, compte_lib: "Provision", debit: r2(montant), credit: 0 },
        { ...commun, compte_num: config.reprise, compte_lib: "Reprise sur provision", debit: 0, credit: r2(montant) },
      ];

      const { error } = await supabase.from("compta_ecritures").insert(lignes);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      await supabase
        .from("compta_provisions")
        .update({
          montant_reprise: r2(dejaRepris + montant),
          reprise_le: date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prov.id);

      return NextResponse.json({
        ok: true,
        ecriture_num: numero,
        message: "Reprise de " + montant.toFixed(2) + " EUR passee sous " + numero + ".",
      });
    }

    // ---- CONSTITUTION ----
    const type = TYPES[String(b.type || "")] ? String(b.type) : "creance_client";
    const config = TYPES[type];

    const base = Number(String(b.montant_base || "").replace(",", "."));
    if (isNaN(base) || base <= 0) {
      return NextResponse.json(
        { ok: false, erreur: "Le montant de base doit etre positif." },
        { status: 400 }
      );
    }

    let taux = Number(String(b.taux_depreciation || 100).replace(",", "."));
    if (isNaN(taux) || taux <= 0 || taux > 100) taux = 100;

    // La depreciation d une creance se calcule sur le montant HORS TAXES :
    // la TVA sera recuperee separement si la creance devient irrecouvrable.
    const montant = r2(base * (taux / 100));

    const date = String(b.date_constitution || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const numero = await numeroSuivant(b.societe_id, date.slice(0, 4));

    const commun = {
      societe_id: b.societe_id,
      journal_code: "OD",
      journal_lib: "Operations diverses",
      ecriture_num: numero,
      ecriture_date: date,
      ecriture_lib: "Dotation - " + (propre(b.tiers, 80) || config.nom),
      devise: "EUR",
      valid_date: new Date().toISOString().slice(0, 10),
      saisi_par: email,
    };

    const lignes = [
      { ...commun, compte_num: config.dotation, compte_lib: "Dotation aux provisions", debit: montant, credit: 0 },
      { ...commun, compte_num: config.provision, compte_lib: "Provision", debit: 0, credit: montant },
    ];

    const { error: erreurEcriture } = await supabase.from("compta_ecritures").insert(lignes);
    if (erreurEcriture) {
      return NextResponse.json({ ok: false, erreur: erreurEcriture.message }, { status: 500 });
    }

    const { error } = await supabase.from("compta_provisions").insert({
      societe_id: b.societe_id,
      type: type,
      tiers: propre(b.tiers, 200),
      compte_tiers: b.compte_tiers ? String(b.compte_tiers).replace(/\D/g, "").slice(0, 12) : null,
      reference: propre(b.reference, 80),
      montant_base: r2(base),
      taux_depreciation: taux,
      montant_provision: montant,
      compte_provision: config.provision,
      compte_dotation: config.dotation,
      date_constitution: date,
      motif: propre(b.motif, 1000),
      ecriture_num: numero,
    });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ecriture_num: numero,
      montant: montant,
      message: "Provision de " + montant.toFixed(2) + " EUR constituee, ecriture " + numero + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
