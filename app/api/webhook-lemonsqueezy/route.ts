import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Second webhook, DEDIE AU PACK B2B. Le webhook historique ne traite que le
// B2C : il ecarte tout produit dont le nom ne contient pas "academia", donc
// il ignorerait les paiements du pack. On ne le remanie pas, on double.
const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_PACK || process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

function sansAccents(s: string): string {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function courriel(sujet: string, html: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <bienvenue@academiapro.fr>",
        to: "contact@academiapro.fr",
        subject: sujet,
        html: html,
      }),
    });
  } catch (e) {
    console.error("courriel pack:", e);
  }
}

export async function POST(req: Request) {
  try {
    const brut = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const attendu = crypto.createHmac("sha256", SECRET).update(brut).digest("hex");
    const valide =
      SECRET &&
      signature.length === attendu.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(attendu));
    if (!valide) {
      return NextResponse.json({ erreur: "signature invalide" }, { status: 401 });
    }

    const corps = JSON.parse(brut);
    const evenement = (corps && corps.meta && corps.meta.event_name) || "inconnu";
    const attributs = (corps && corps.data && corps.data.attributes) || {};
    const premier = attributs.first_order_item || {};
    const nomProduit = sansAccents(String(attributs.product_name || premier.product_name || ""));

    // On ne traite QUE les produits du pack. Tout le reste appartient a
    // l autre webhook.
    const estPack = nomProduit.indexOf("pack lms") >= 0;
    const estGestion = nomProduit.indexOf("gestion administrative") >= 0;
    if (!estPack && !estGestion) {
      return NextResponse.json({ ignore: true, produit: nomProduit });
    }

    const custom = (corps && corps.meta && corps.meta.custom_data) || {};
    const tenantDemande = String(custom.tenant || custom.tenant_id || "").trim();
    const email = String(attributs.user_email || "").toLowerCase().trim();
    const montant = typeof attributs.total === "number" ? attributs.total / 100 : 0;

    // L organisme est designe par le tenant transmis au paiement ; a defaut,
    // on le retrouve par l adresse de l acheteur.
    let organisme: any = null;

    if (tenantDemande) {
      const { data } = await supabase
        .from("organismes_formation")
        .select("*")
        .eq("tenant_id", tenantDemande)
        .maybeSingle();
      organisme = data || null;
    }

    if (!organisme && email) {
      const { data } = await supabase
        .from("organismes_formation")
        .select("*")
        .eq("email_contact", email)
        .maybeSingle();
      organisme = data || null;
    }

    if (!organisme) {
      await courriel(
        "Paiement du pack sans organisme retrouvé",
        "<p>Un paiement est arrivé sans qu'on puisse le rattacher à un organisme.</p>" +
        "<p>Événement : " + evenement + "<br>Produit : " + nomProduit +
        "<br>Adresse : " + (email || "inconnue") +
        "<br>Montant : " + montant + " €</p>" +
        "<p>À rattacher à la main.</p>"
      );
      return NextResponse.json({ ok: true, rattache: false });
    }

    const majuscule: any = { updated_at: new Date().toISOString() };

    // MISE EN SERVICE : paiement unique, on note qu elle est reglee.
    if (nomProduit.indexOf("mise en service") >= 0 && evenement === "order_created") {
      majuscule.frais_installation = montant;
      majuscule.statut = "actif";
    }

    // ABONNEMENT : ouverture, renouvellement, ou fin.
    if (nomProduit.indexOf("abonnement") >= 0) {
      if (evenement === "subscription_created" || evenement === "subscription_payment_success") {
        majuscule.abonnement_mensuel = montant || organisme.abonnement_mensuel;
        majuscule.statut = "actif";
      }
      if (evenement === "subscription_expired" || evenement === "order_refunded") {
        majuscule.statut = "suspendu";
      }
      if (evenement === "subscription_payment_failed") {
        majuscule.statut = "impaye";
      }
    }

    // GESTION ADMINISTRATIVE : option souscrite.
    if (estGestion && evenement === "order_created") {
      majuscule.gestion_souscrite = true;
      majuscule.forfait_gestion = montant;
    }

    await supabase
      .from("organismes_formation")
      .update(majuscule)
      .eq("tenant_id", organisme.tenant_id);

    await courriel(
      "Pack — " + evenement + " — " + organisme.raison_sociale,
      "<p><strong>" + organisme.raison_sociale + "</strong></p>" +
      "<p>Produit : " + nomProduit + "<br>Montant : " + montant + " €" +
      "<br>Nouveau statut : " + (majuscule.statut || organisme.statut) + "</p>"
    );

    return NextResponse.json({
      ok: true,
      rattache: true,
      organisme: organisme.raison_sociale,
      statut: majuscule.statut || organisme.statut,
    });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
