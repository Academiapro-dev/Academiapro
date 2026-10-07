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

// Un montant et un mois a la francaise, pour les messages.
function eurosFr(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function nombre(v: any): number {
  const n = Number(String(v || "0").replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : r2(n);
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    // Les ecritures de paie deja passees sur le dossier.
    const { data } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num, ecriture_date, ecriture_lib, debit, compte_num")
      .eq("societe_id", id)
      .like("ecriture_num", "%PAIE%")
      .order("ecriture_date", { ascending: false })
      .limit(200);

    const pieces: any = {};
    for (const l of data || []) {
      const n = String(l.ecriture_num);
      if (!pieces[n]) {
        pieces[n] = { ecriture_num: n, date: l.ecriture_date, libelle: l.ecriture_lib, brut: 0 };
      }
      if (String(l.compte_num).startsWith("641")) {
        pieces[n].brut = r2(pieces[n].brut + (Number(l.debit) || 0));
      }
    }

    const liste = Object.keys(pieces).map(function (k) { return pieces[k]; });

    return NextResponse.json({
      ok: true,
      comptes: {
        brut: "641000", charges_patronales: "645000",
        net_a_payer: "421000", securite_sociale: "431000",
        autres_organismes: "437000", impot_source: "442000",
      },
      total: liste.length,
      paies: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    const refusDroit = await barrage("saisir", String(b.societe_id));
    if (refusDroit) return refusDroit;

    const session = sessionCourante();

    const date = String(b.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, erreur: "Date invalide." }, { status: 400 });
    }

    const brut = nombre(b.brut);
    const salariales = nombre(b.cotisations_salariales);
    const patronales = nombre(b.cotisations_patronales);
    const impot = nombre(b.impot_source);
    const netSaisi = nombre(b.net_a_payer);

    if (brut <= 0) {
      return NextResponse.json(
        { ok: false, erreur: "Le salaire brut doit être positif." },
        { status: 400 }
      );
    }

    // CONTROLE : le net se deduit du brut. S il ne correspond pas au net
    // saisi, c est qu une ligne du bulletin a ete oubliee.
    const netCalcule = r2(brut - salariales - impot);

    if (netSaisi > 0 && Math.abs(r2(netCalcule - netSaisi)) > 0.02) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le net ne tombe pas juste : brut " + eurosFr(brut)
            + " moins cotisations " + eurosFr(salariales)
            + (impot > 0 ? " moins impôt " + eurosFr(impot) : "")
            + " donne " + eurosFr(netCalcule)
            + " alors que vous avez saisi " + eurosFr(netSaisi)
            + ". Vérifiez le bulletin.",
          net_calcule: netCalcule,
        },
        { status: 400 }
      );
    }

    const net = netSaisi > 0 ? netSaisi : netCalcule;

    const mois = date.slice(0, 7);
    // Le mois tel qu il se lit : « septembre 2026 ».
    const moisLisible = MOIS_FR[Number(date.slice(5, 7)) - 1] + " " + date.slice(0, 4);
    const numero = "OD" + date.slice(0, 4) + "-PAIE" + date.slice(5, 7);

    const { data: deja } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", b.societe_id)
      .eq("ecriture_num", numero)
      .limit(1);

    if ((deja || []).length > 0 && b.forcer !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Une écriture de paie existe déjà pour " + moisLisible + "." },
        { status: 409 }
      );
    }

    const commun = {
      societe_id: b.societe_id,
      journal_code: "OD",
      journal_lib: "Operations diverses",
      ecriture_num: numero,
      ecriture_date: date,
      piece_ref: String(b.reference || "PAIE-" + mois).slice(0, 60),
      piece_date: date,
      ecriture_lib: "Salaires " + mois
        + (b.effectif ? " - " + b.effectif + (Number(b.effectif) > 1 ? " salariés" : " salarié") : ""),
      devise: "EUR",
      valid_date: new Date().toISOString().slice(0, 10),
      saisi_par: session ? session.email : null,
    };

    const lignes: any[] = [
      { ...commun, compte_num: "641000", compte_lib: "Remunerations du personnel", debit: brut, credit: 0 },
    ];

    if (patronales > 0) {
      lignes.push({
        ...commun, compte_num: "645000",
        compte_lib: "Charges de securite sociale et de prevoyance",
        debit: patronales, credit: 0,
      });
    }

    lignes.push({
      ...commun, compte_num: "421000",
      compte_lib: "Personnel - remunerations dues",
      debit: 0, credit: net,
    });

    // Les cotisations salariales et patronales partent ensemble aux organismes.
    const organismes = r2(salariales + patronales);
    if (organismes > 0) {
      lignes.push({
        ...commun, compte_num: "431000", compte_lib: "Securite sociale",
        debit: 0, credit: organismes,
      });
    }

    if (impot > 0) {
      lignes.push({
        ...commun, compte_num: "442000", compte_lib: "Etat - prelevement a la source",
        debit: 0, credit: impot,
      });
    }

    const debit = r2(lignes.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
    const credit = r2(lignes.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

    if (Math.abs(r2(debit - credit)) > 0.02) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "L’écriture ne tombe pas juste : débit " + eurosFr(debit)
            + " contre crédit " + eurosFr(credit) + ". Rien n’a été enregistré.",
          debit: debit, credit: credit,
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
      brut: brut,
      net: net,
      cout_total: r2(brut + patronales),
      message: "Paie de " + moisLisible + " passée sous le numéro " + numero + " : "
        + eurosFr(brut) + " de brut, " + eurosFr(net) + " de net, "
        + eurosFr(r2(brut + patronales)) + " de coût total.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
