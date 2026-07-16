import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Securite : mot de passe compta + origine du site
    const mdp = req.headers.get("x-mdp-compta") || "";
    if (mdp !== "COMPTA2026") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
    const origine = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    if (!origine.includes("academiapro.fr") && !origine.includes("vercel.app") && !origine.includes("localhost")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const fd = await req.formData();
    const fournisseur = String(fd.get("fournisseur") || "");
    const categorie = String(fd.get("categorie") || "Autres");
    const description = String(fd.get("description") || "");
    const pays_fournisseur = String(fd.get("pays_fournisseur") || "");
    const projet = String(fd.get("projet") || "academia");
    const montant_ttc = parseFloat(String(fd.get("montant_ttc"))) || 0;
    const devise = String(fd.get("devise") || "EUR");
    const avance_perso = String(fd.get("avance_perso")) === "true";
    const date_depense = String(fd.get("date_depense") || new Date().toISOString().slice(0, 10));
    const fichier = fd.get("fichier") as File | null;

    if (!fournisseur || montant_ttc <= 0) {
      return NextResponse.json({ error: "Fournisseur et montant obligatoires" }, { status: 400 });
    }

    // Verifier le projet dans le referentiel
    const { data: projetRow } = await supabase
      .from("projets").select("code").eq("code", projet).single();
    if (!projetRow) {
      return NextResponse.json({ error: "Projet inconnu: " + projet }, { status: 400 });
    }

    // Trimestre calcule depuis la date
    const d = new Date(date_depense);
    const trimestre = d.getFullYear() + "-T" + (Math.floor(d.getMonth() / 3) + 1);

    // Upload du justificatif (optionnel) - chemin relatif comme les 17 existantes
    let pdf_url: string | null = null;
    if (fichier && fichier.size > 0) {
      const bytes = Buffer.from(await fichier.arrayBuffer());
      const nomProper = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const chemin = "Depenses/" + d.getFullYear() + "/" + Date.now() + "_" + nomProper;
      const { error: upErr } = await supabase.storage
        .from("documents-comptables")
        .upload(chemin, bytes, { contentType: fichier.type || "application/octet-stream", upsert: true });
      if (upErr) {
        return NextResponse.json({ error: "Upload justificatif: " + upErr.message }, { status: 500 });
      }
      pdf_url = chemin;
    }

    // Insertion - TVA a 0 et tva_deductible false (en attente fiscaliste)
    const { error: insErr } = await supabase.from("depenses").insert({
      fournisseur, categorie, description, pays_fournisseur, projet,
      montant_ttc, montant_ht: montant_ttc, taux_tva: 0, montant_tva: 0,
      devise, tva_deductible: false, avance_perso, rembourse: false,
      date_depense, trimestre, pdf_url,
    });
    if (insErr) {
      return NextResponse.json({ error: "Insertion: " + insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pdf_url });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur serveur: " + (e?.message || e) }, { status: 500 });
  }
}
