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

function nombre(v: any): number {
  const n = Number(String(v || "0").replace(",", ".").replace(/\s/g, ""));
  return isNaN(n) ? 0 : r2(n);
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

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
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

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
        { ok: false, erreur: "Le salaire brut doit etre positif." },
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
          erreur: "Le net ne tombe pas juste : brut " + brut.toFixed(2)
            + " moins cotisations " + salariales.toFixed(2)
            + (impot > 0 ? " moins impot " + impot.toFixed(2) : "")
            + " donne " + netCalcule.toFixed(2)
            + " alors que vous avez saisi " + netSaisi.toFixed(2)
            + ". Verifiez le bulletin.",
          net_calcule: netCalcule,
        },
        { status: 400 }
      );
    }

    const net = netSaisi > 0 ? netSaisi : netCalcule;

    const mois = date.slice(0, 7);
    const numero = "OD" + date.slice(0, 4) + "-PAIE" + date.slice(5, 7);

    const { data: deja } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", b.societe_id)
      .eq("ecriture_num", numero)
      .limit(1);

    if ((deja || []).length > 0 && b.forcer !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Une ecriture de paie existe deja pour " + mois + "." },
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
      ecriture_lib: "Salaires " + mois + (b.effectif ? " - " + b.effectif + " salarie(s)" : ""),
      devise: "EUR",
      valid_date: new Date().toISOString().slice(0, 10),
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
          erreur: "L ecriture ne tombe pas juste : debit " + debit.toFixed(2)
            + " contre credit " + credit.toFixed(2) + ". Rien n a ete enregistre.",
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
      message: "Paie de " + mois + " passee sous " + numero + " : "
        + brut.toFixed(2) + " EUR de brut, " + net.toFixed(2) + " EUR de net, "
        + r2(brut + patronales).toFixed(2) + " EUR de cout total.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
