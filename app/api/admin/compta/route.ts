import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { verifierMdp } from "../securite/route";
import { limiter, ipDe } from "../../../../lib/limiteur";

async function autorise(req: NextRequest): Promise<boolean> {
  if (!(await verifierMdp(req.headers.get("x-mdp-compta") || ""))) return false;
  const o = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
  return o.includes("academiapro.fr") || o.includes("vercel.app") || o.includes("localhost");
}

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "compta", 15, 600000)) { return NextResponse.json({ error: "Trop de tentatives, reessayez dans quelques minutes" }, { status: 429 }); }
  if (!(await autorise(req))) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const action = body.action || "";

    if (action === "lister") {
      const trimestre = body.trimestre || "";
      const { data: factures } = await supabase
        .from("factures").select("*").order("numero", { ascending: false });
      const { data: tva } = await supabase
        .from("tva_par_periode").select("*").eq("trimestre", trimestre).order("pays");
      const { data: depenses } = await supabase
        .from("depenses").select("*").order("date_depense", { ascending: false });
      return NextResponse.json({
        factures: factures || [], tva: tva || [], depenses: depenses || []
      });
    }

    if (action === "supprimer_depense") {
      const id = body.id;
      if (!id) return NextResponse.json({ error: "Id manquant" }, { status: 400 });
      const { error } = await supabase.from("depenses").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "signer_pdf") {
      let chemin = body.chemin || "";
      if (!chemin) return NextResponse.json({ error: "Chemin manquant" }, { status: 400 });
      // Tolerance : certains pdf_url historiques incluent le nom du bucket
      if (chemin.startsWith("documents-comptables/")) {
        chemin = chemin.slice("documents-comptables/".length);
      }
      const { data, error } = await supabase.storage
        .from("documents-comptables").createSignedUrl(chemin, 300);
      if (error || !data) return NextResponse.json({ error: "PDF indisponible" }, { status: 404 });
      return NextResponse.json({ url: data.signedUrl });
    }

    if (action === "marquer_payee") {
      const id = body.id;
      if (!id) return NextResponse.json({ error: "Id manquant" }, { status: 400 });
      const { error } = await supabase.from("factures")
        .update({ statut_paiement: "payee", date_paiement: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "creer_avoir") {
      const id = body.id;
      if (!id) return NextResponse.json({ error: "Id manquant" }, { status: 400 });
      const { data: f } = await supabase.from("factures").select("*").eq("id", id).single();
      if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
      if (f.est_avoir) return NextResponse.json({ error: "Deja un avoir" }, { status: 400 });

      const { data: av } = await supabase.from("factures")
        .select("numero").like("numero", "A2026-%")
        .order("numero", { ascending: false }).limit(1);
      let n = 1;
      if (av && av.length) n = parseInt(av[0].numero.split("-")[1]) + 1;
      const numeroAvoir = "A2026-" + String(n).padStart(4, "0");

      const { error: insErr } = await supabase.from("factures").insert({
        numero: numeroAvoir, projet: f.projet, client_nom: f.client_nom,
        client_email: f.client_email, client_pays: f.client_pays,
        type_client: f.type_client, numero_tva_client: f.numero_tva_client,
        montant_ht: -Math.abs(f.montant_ht), taux_tva: f.taux_tva,
        montant_tva: -Math.abs(f.montant_tva), montant_ttc: -Math.abs(f.montant_ttc),
        devise: f.devise, zone: f.zone, trimestre: f.trimestre,
        autoliquidation: f.autoliquidation,
        description: "AVOIR sur facture " + f.numero,
        statut: "emise", statut_paiement: "payee", est_avoir: true,
        facture_origine: f.numero,
        date_emission: new Date().toISOString().slice(0, 10),
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

      const { data: tt } = await supabase.from("tva_par_periode")
        .select("*").eq("trimestre", f.trimestre).eq("pays", f.client_pays);
      if (tt && tt.length) {
        const l = tt[0];
        await supabase.from("tva_par_periode").update({
          total_ht: Number(l.total_ht) - Math.abs(f.montant_ht),
          total_tva: Number(l.total_tva) - Math.abs(f.montant_tva),
          nb_factures: l.nb_factures + 1,
        }).eq("id", l.id);
      }
      return NextResponse.json({ success: true, numero: numeroAvoir });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur serveur: " + (e?.message || e) }, { status: 500 });
  }
}
