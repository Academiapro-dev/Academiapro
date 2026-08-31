import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { genererFactureHTML } from "./template";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLE_API_FACTURE = process.env.CLE_API_FACTURE || "";

// 🚨 LIMITE DE DEBIT — 31/08. UNE CLE FIXE SE DEVINE, UN DEBIT NON.
//
// CETTE ROUTE EST GARDEE PAR UNE SEULE CLE, QUI NE CHANGE JAMAIS. C est la
// serrure la plus simple de tout /api/admin : les autres routes exigent une
// session signee ou un mot de passe hache. Ici, qui detient la chaine entre.
//
// LE DEBIT EST DONC LA SECONDE BARRIERE, ET ELLE PROTEGE DE DEUX CHOSES :
//   - L ESSAI EN MASSE. Sans compteur, une machine teste des milliers de
//     cles a la minute. Avec vingt essais par quart d heure, l attaque
//     devient inutile.
//   - LA CREATION EN RAFALE si la cle venait a fuiter. Chaque appel reussi
//     consomme un NUMERO DE FACTURE LEGAL, pris dans une suite continue.
//     Des factures parasites y feraient des trous qu un controleur
//     remarquerait — et un numero consomme ne se reprend pas.
//
// LE SEUIL EST LARGE POUR L USAGE REEL : la facturation normale passe par
// les crons, qui appellent depuis quelques adresses stables.
const MAX_PAR_IP = 20;
const FENETRE_IP_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  // LE COMPTEUR VIENT AVANT LA VERIFICATION DE LA CLE. C est l ordre qui
  // compte : un attaquant qui essaie mille cles fausses doit etre arrete
  // AVANT d avoir pu les essayer, pas apres.
  if (!limiter(ipDe(req), "creer_facture", MAX_PAR_IP, FENETRE_IP_MS)) {
    return NextResponse.json(
      { error: "Trop de demandes. Reessayez dans un quart d heure." },
      { status: 429 }
    );
  }

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
      console.error("[creer-facture] numerotation :", numErr ? numErr.message : "aucun numero rendu");
      return NextResponse.json({ error: "Erreur numerotation" }, { status: 500 });
    }
    const numero = numData as string;

    // 6) Hash SHA-256 d'inalterabilite + horodatage
    const horodatage = new Date().toISOString();
    const contenuHash = [
      numero, projet, client_nom, montant_ht, montant_tva, montant_ttc, horodatage
    ].join("|");
    const hash_sha256 = crypto.createHash("sha256").update(contenuHash).digest("hex");

    // 7) HTML genere AVANT l'insertion, pour etre stocke avec la facture
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

    // 8) Insertion dans la table factures (centrale)
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
      console.error("[creer-facture] insertion :", insErr.message);
      return NextResponse.json({ error: "Erreur insertion" }, { status: 500 });
    }

    // 9) Reponse
    return NextResponse.json({
      success: true,
      numero,
      projet,
      tenant_id,
      montant_ht,
      montant_tva,
      montant_ttc,
      hash_sha256,
      facture_id: facture.id,
      facture_html,
    });
  } catch (error: any) {
    // Le detail reste dans les journaux : un message d erreur de base de
    // donnees renseigne sur la structure des tables.
    console.error("[creer-facture] exception :", String(error?.message || error));
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
