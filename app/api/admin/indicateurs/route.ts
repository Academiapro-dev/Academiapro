import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// Compte les lignes d une table sans les rapatrier. Une table absente rend
// zero plutot que de faire tomber toute la page : un indicateur manquant
// vaut mieux qu un tableau de bord blanc.
async function compter(table: string, filtre?: (q: any) => any): Promise<number> {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filtre) q = filtre(q);
    const { count, error } = await q;
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch (e) {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(String(session.email).toLowerCase().trim()) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const now = new Date();
    const debutMois = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    // 1) CHIFFRE D AFFAIRES.
    // Deux sources, et elles ne se recouvrent pas :
    //  - Lemon Squeezy encaisse le B2C et les abonnements ;
    //  - factures porte ce que la LLC facture elle-meme (dossiers cabinet).
    // Les avoirs se retranchent, les factures annulees ne comptent pas.
    let caCentimes = 0;
    const { data: commandes } = await supabase
      .from("commandes_lemonsqueezy")
      .select("montant_centimes, statut, evenement")
      .limit(20000);

    for (const c of commandes || []) {
      const s = String(c.statut || "").toLowerCase();
      if (s === "refunded" || s === "rembourse" || s === "annule") continue;
      caCentimes = caCentimes + (Number(c.montant_centimes) || 0);
    }

    let caFactures = 0;
    const { data: fact } = await supabase
      .from("factures")
      .select("montant_ht, statut, est_avoir")
      .limit(20000);

    for (const f of fact || []) {
      if (String(f.statut || "").toLowerCase() === "annulee") continue;
      const m = Number(f.montant_ht) || 0;
      caFactures = caFactures + (f.est_avoir ? -m : m);
    }

    const caTotal = Math.round((caCentimes / 100 + caFactures) * 100) / 100;

    // 2) APPRENANTS inscrits, tous organismes confondus.
    const apprenants = await compter("organisme_apprenants");

    // 3) FORMATIONS VENDUES ce mois-ci.
    const formationsVendues = await compter("commandes_lemonsqueezy", function (q: any) {
      return q.gte("cree_le", debutMois);
    });

    // 4) SEANCES reservees ce mois-ci.
    const seances = await compter("organisme_seances", function (q: any) {
      return q.gte("created_at", debutMois);
    });

    // 5) CERTIFICATS delivres, depuis le debut.
    const certificats = await compter("certificats_delivres");

    // 6) PIPELINE : les prospects encore ouverts. Un prospect gagne ou perdu
    // ne dit rien de ce qui reste a travailler.
    const { data: lignesCrm } = await supabase
      .from("crm")
      .select("statut")
      .limit(20000);

    let pipeline = 0;
    for (const l of lignesCrm || []) {
      const s = String(l.statut || "").toLowerCase();
      if (s === "gagne" || s === "perdu" || s === "client" || s === "desinscrit") continue;
      pipeline = pipeline + 1;
    }

    return NextResponse.json({
      ok: true,
      calcule_le: new Date().toISOString(),
      indicateurs: {
        ca_total: caTotal,
        apprenants: apprenants,
        formations_vendues: formationsVendues,
        seances: seances,
        certificats: certificats,
        pipeline: pipeline,
      },
      detail: {
        ca_encaisse_lemonsqueezy: Math.round(caCentimes) / 100,
        ca_facture_llc: Math.round(caFactures * 100) / 100,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
