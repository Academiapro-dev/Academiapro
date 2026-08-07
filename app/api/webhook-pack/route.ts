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
//
// Le .trim() est indispensable : une valeur collee dans Vercel emporte
// souvent un espace ou un retour a la ligne invisible, et la signature ne
// correspond alors jamais.
const SECRET_BRUT = process.env.LEMONSQUEEZY_WEBHOOK_PACK || "";
const SECRET_REPLI = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
const SECRET = String(SECRET_BRUT || SECRET_REPLI).trim();

const FRAIS_LS_PCT = 5;
const FRAIS_LS_FIXE = 0.5;

function sansAccents(s: string): string {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function baseCommission(montantHT: number): number {
  if (!montantHT || montantHT <= 0) return 0;
  const frais = (montantHT * FRAIS_LS_PCT) / 100 + FRAIS_LS_FIXE;
  return Math.max(0, Math.round((montantHT - frais) * 100) / 100);
}

function montantHT(attributs: any): number {
  const centimes =
    typeof attributs.subtotal === "number"
      ? attributs.subtotal - (typeof attributs.discount_total === "number" ? attributs.discount_total : 0)
      : (typeof attributs.total === "number" ? attributs.total : 0) -
        (typeof attributs.tax === "number" ? attributs.tax : 0);

  return Math.max(0, Math.round(centimes) / 100);
}

async function courriel(destinataire: string, sujet: string, html: string) {
  if (!destinataire || !process.env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <bienvenue@academiapro.fr>",
        to: destinataire,
        subject: sujet,
        html: html,
      }),
    });
  } catch (e) {
    console.error("courriel pack:", e);
  }
}

// COMMISSION D APPORT SUR LE PACK. Versee UNE SEULE FOIS, sur la MISE EN
// SERVICE — jamais sur les abonnements mensuels : presenter un client est un
// acte unique, alors que la plateforme se maintient pendant des annees.
async function crediterApport(code: string, produit: string, montant: number) {
  const base = baseCommission(montant);
  if (!code || base <= 0) return;

  try {
    const { data: affilie } = await supabase
      .from("affilies")
      .select("id, code_affiliation, commission_pct, total_ventes, total_gains, statut, nom, email")
      .eq("code_affiliation", code)
      .maybeSingle();

    if (!affilie || String(affilie.statut || "actif") !== "actif") return;

    const taux = Number(affilie.commission_pct) || 15;
    const commission = Math.round(base * taux) / 100;

    await supabase.from("ventes_affiliation").insert({
      code_affiliation: affilie.code_affiliation,
      formation_code: "PACK",
      montant: base,
      commission: commission,
      statut: "a_regler",
    });

    await supabase
      .from("affilies")
      .update({
        total_ventes: (affilie.total_ventes || 0) + 1,
        total_gains: Math.round(((Number(affilie.total_gains) || 0) + commission) * 100) / 100,
      })
      .eq("id", affilie.id);

    if (affilie.email) {
      await courriel(
        affilie.email,
        "Une affaire vous a ete attribuee",
        '<div style="font-family:Georgia,serif;line-height:1.7;color:#1a1a1a">' +
        '<h1 style="color:#c8a96e">Bonne nouvelle</h1>' +
        "<p>Un organisme que vous nous avez presente vient de souscrire.</p>" +
        "<p>Votre commission : <strong>" + commission + " EUR</strong>, soit " + taux +
        " % de " + base + " EUR (montant hors taxes, frais de paiement deduits).</p>" +
        '<p><a href="https://academiapro.fr/partenaire?code=' + affilie.code_affiliation +
        '">Voir votre tableau de bord</a></p>' +
        "<p>AcademIA Pro</p></div>"
      );
    }

    await courriel(
      "contact@academiapro.fr",
      "Commission d apport a regler : " + commission + " EUR",
      "<p>Partenaire : " + (affilie.nom || affilie.code_affiliation) +
      "<br>Produit : " + produit +
      "<br>Base retenue : " + base + " EUR<br>Commission : " + commission + " EUR</p>"
    );
  } catch (e) {
    console.error("apport pack:", e);
  }
}

export async function POST(req: Request) {
  try {
    const brut = await req.text();
    const signature = String(req.headers.get("x-signature") || "").trim();
    const attendu = crypto.createHmac("sha256", SECRET).update(brut, "utf8").digest("hex");

    if (signature !== attendu) {
      // DIAGNOSTIC. Le secret n est jamais revele : seulement sa longueur et
      // les douze premiers caracteres des deux empreintes, ce qui suffit a
      // savoir si elles different et pourquoi.
      return NextResponse.json(
        {
          erreur: "signature invalide",
          variable_utilisee: SECRET_BRUT
            ? "LEMONSQUEEZY_WEBHOOK_PACK"
            : (SECRET_REPLI ? "repli sur LEMONSQUEEZY_WEBHOOK_SECRET" : "AUCUN SECRET TROUVE"),
          longueur_secret: SECRET.length,
          longueur_avant_nettoyage: String(SECRET_BRUT || SECRET_REPLI).length,
          signature_recue: signature.slice(0, 12),
          signature_attendue: attendu.slice(0, 12),
          longueur_corps: brut.length,
        },
        { status: 401 }
      );
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
    const affiliation = String(custom.affiliation || "").trim().toUpperCase();
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
        "contact@academiapro.fr",
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

    // MISE EN SERVICE : paiement unique.
    if (nomProduit.indexOf("mise en service") >= 0 && evenement === "order_created") {
      majuscule.frais_installation = montant;
      majuscule.statut = "actif";

      // C est ici, et seulement ici, que l apporteur est paye.
      if (affiliation) {
        await crediterApport(affiliation, "Pack — mise en service", montantHT(attributs));
      }
    }

    // ABONNEMENT : ouverture, renouvellement, ou fin. Aucune commission.
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

    // Remboursement : la commission n est plus due.
    if (evenement === "order_refunded" && affiliation) {
      try {
        await supabase
          .from("ventes_affiliation")
          .update({ statut: "annulee" })
          .eq("code_affiliation", affiliation)
          .eq("formation_code", "PACK")
          .eq("statut", "a_regler");
      } catch (e) {
        console.error("apport remboursement:", e);
      }
    }

    await supabase
      .from("organismes_formation")
      .update(majuscule)
      .eq("tenant_id", organisme.tenant_id);

    await courriel(
      "contact@academiapro.fr",
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
      apport: affiliation || null,
    });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
