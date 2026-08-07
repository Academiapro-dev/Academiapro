import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { genererFactureHTML } from "./template";

export const runtime = "nodejs";
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLE_API_FACTURE = process.env.CLE_API_FACTURE || "";

export async function POST(req: NextRequest) {
  try {
    // 1) Securite : verifier la cle d'appel
    const cle = req.headers.get("x-cle-facture") || "";
    if (!CLE_API_FACTURE || cle !== CLE_API_FACTURE) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await req.json();

    // 2) Champs recus
    const projet = body.projet || "academia";
    const client_nom = body.client_nom || "";
    const client_email = body.client_email || null;
    const client_pays = body.client_pays || null;
    const type_client = body.type_client || "B2C";
    const numero_tva_client = body.numero_tva_client || null;
    const montant_ht = parseFloat(body.montant_ht) || 0;
    const taux_tva = parseFloat(body.taux_tva) || 0;
    const zone = body.zone || null;
    const autoliquidation = body.autoliquidation === true;
    const description = body.description || "";
    const devise = body.devise || "EUR";

    // tenant_id : sans lui, la facture n'apparait ni au bilan ni au compte
    // de resultat, qui filtrent tous deux sur cette colonne.
    const tenant_id = body.tenant_id || null;

    // 3) Verifier que le projet existe dans le referentiel
    const { data: projetRow, error: projetErr } = await supabase
      .from("projets")
      .select("code")
      .eq("code", projet)
      .single();
    if (projetErr || !projetRow) {
      return NextResponse.json({ error: "Projet inconnu: " + projet }, { status: 400 });
    }

    // 4) Calculs TVA
    const montant_tva = autoliquidation ? 0 : +(montant_ht * taux_tva / 100).toFixed(2);
    const montant_ttc = +(montant_ht + montant_tva).toFixed(2);

    // 5) Numero legal atomique via la fonction SQL
    const { data: numData, error: numErr } = await supabase
      .rpc("generer_numero_facture");
    if (numErr || !numData) {
      return NextResponse.json({ error: "Erreur numerotation" }, { status: 500 });
    }
    const numero = numData as string;

    // 6) Hash SHA-256 d'inalterabilite + horodatage
    const horodatage = new Date().toISOString();
    const contenuHash = [
      numero, projet, client_nom, montant_ht, montant_tva, montant_ttc, horodatage
    ].join("|");
    const hash_sha256 = crypto.createHash("sha256").update(contenuHash).digest("hex");

    // 8) Generer le HTML bilingue AVANT l'insertion, pour le stocker :
    // une facture sans son rendu n'est pas opposable.
    const date_emission = new Date().toISOString().slice(0, 10);

    const facture_html = genererFactureHTML({
      numero,
      projet,
      client_nom,
      client_pays,
      type_client,
      numero_tva_client,
      montant_ht,
      taux_tva,
      montant_tva,
      montant_ttc,
      devise,
      autoliquidation,
      description,
      date_emission,
    });

    // 7) Insertion dans la table factures (centrale)
    const { data: facture, error: insErr } = await supabase
      .from("factures")
      .insert({
        numero,
        projet,
        tenant_id,
        client_nom,
        client_email,
        client_pays,
        type_client,
        numero_tva_client,
        montant_ht,
        taux_tva,
        montant_tva,
        montant_ttc,
        devise,
        zone,
        autoliquidation,
        description,
        html: facture_html,
        statut: "emise",
        statut_paiement: "en_attente",
        date_emission,
        hash_sha256,
        horodatage_hash: horodatage,
      })
      .select()
      .single();

    if (insErr) {
      return NextResponse.json({ error: "Erreur insertion: " + insErr.message }, { status: 500 });
    }

    // 9) Reponse
    return NextResponse.json({
      success: true,
      numero,
      projet,
      tenant_id,
      montant_ht,
      montant_t
