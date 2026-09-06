import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA COMMANDE DE CREDITS — SMS et minutes d appel — 06/09.
//
// 🚨 AUCUN PAIEMENT EN LIGNE. En B2B le reglement se fait par virement :
// le client commande, Jacques facture, et credite a reception. Lemon
// Squeezy n a d interet que pour la TVA du B2C ; ici la facture porte la
// TVA comme n importe quelle facture entre entreprises.
//
// ⚠️ LA COMMANDE NE CREDITE RIEN. Crediter des la commande reviendrait a
// livrer avant d etre paye — et les minutes consommees, elles, ont bien
// coute chez l operateur.
//
// ⚠️ LES PRIX SONT RECOPIES DEPUIS `tarifs` AU MOMENT DE LA COMMANDE, et
// figes dans la ligne. Si la grille change entre la commande et le
// virement, c est le prix annonce au client qui vaut.
//
// 🚨 LES LOTS SONT LUS EN BASE, JAMAIS ECRITS ICI. Une grille recopiee dans
// du code finit toujours par mentir : celle de `tarifs` est la seule.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function contexte() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) return { erreur: "Vous devez être connecté.", code: 401 };
  if (!tenant) return { erreur: "Aucun organisme rattaché à votre compte.", code: 403 };
  return { email: email, tenant: tenant };
}

// LES LOTS DISPONIBLES, LUS DANS `tarifs`.
//
// ⚠️ ON NE FILTRE PAS SUR `produit` : les lots sont identiques pour Mr LMS
// et Mr CRM, meme fournisseur et meme cout. On prend les premiers trouves,
// dedupliques par quantite.
async function lireLots() {
  const { data } = await supabase
    .from("tarifs")
    .select("produit, poste, libelle, montant, seuil_min, perimetre")
    .in("poste", ["sms_lot", "telephonie_lot"])
    .order("seuil_min", { ascending: true });

  const vus: any = {};
  const sms: any[] = [];
  const minutes: any[] = [];

  for (const l of data || []) {
    const nombre = Number(l.seuil_min) || 0;
    const prix = Number(l.montant) || 0;
    if (nombre <= 0 || prix <= 0) continue;

    const nature = l.poste === "sms_lot" ? "sms" : "minutes";
    const cle = nature + ":" + nombre;
    if (vus[cle]) continue;
    vus[cle] = true;

    const lot = {
      nature: nature,
      nombre: nombre,
      prix: prix,
      // Le prix a l unite : c est lui qui rend la remise lisible.
      // « 240 € » ne dit rien ; « 0,08 € la minute » se compare.
      unitaire: Math.round((prix / nombre) * 10000) / 10000,
      libelle: l.libelle,
    };

    if (nature === "sms") sms.push(lot);
    else minutes.push(lot);
  }

  return { sms: sms, minutes: minutes };
}

export async function GET() {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const lots = await lireLots();

  // Le solde actuel, et les commandes en cours.
  const [orgaR, commandesR] = await Promise.all([
    supabase
      .from("organismes_formation")
      .select("sms_credits, minutes_credits, tel_numero, sms_expediteur")
      .eq("tenant_id", c.tenant)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("crm_commandes_credits")
      .select("id, nature, quantite, prix, statut, commande_le, creditee_le")
      .eq("tenant_id", c.tenant)
      .order("commande_le", { ascending: false })
      .limit(20),
  ]);

  const orga: any = orgaR.data || {};

  return NextResponse.json({
    ok: true,
    lots: lots,
    sms_credits: Number(orga.sms_credits || 0),
    // ⚠️ LE CREDIT D APPEL EST EN SECONDES EN BASE — Plivo facture a la
    // seconde. On l affiche en minutes, qui est ce que le client achete.
    minutes_credits: Math.floor(Number(orga.minutes_credits || 0) / 60),
    sms_expediteur: orga.sms_expediteur || null,
    tel_numero: orga.tel_numero || null,
    commandes: commandesR.data || [],
  });
}

export async function POST(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const b = await req.json().catch(function () { return null; });
  if (!b || !b.nature || !b.nombre) {
    return NextResponse.json({ ok: false, erreur: "Choisissez un lot." }, { status: 400 });
  }

  const nature = String(b.nature);
  if (nature !== "sms" && nature !== "minutes") {
    return NextResponse.json({ ok: false, erreur: "Lot inconnu." }, { status: 400 });
  }

  // 🚨 LE LOT EST RETROUVE EN BASE, PAS PRIS DANS LA REQUETE. Accepter le
  // prix envoye par l ecran laisserait commander mille minutes a un euro.
  const lots = await lireLots();
  const liste = nature === "sms" ? lots.sms : lots.minutes;
  const lot = liste.filter(function (l: any) {
    return l.nombre === Number(b.nombre);
  })[0];

  if (!lot) {
    return NextResponse.json({ ok: false, erreur: "Ce lot n'existe pas." }, { status: 400 });
  }

  // ⚠️ UNE SEULE COMMANDE EN ATTENTE PAR NATURE. Sans ce garde-fou, un
  // client qui touche deux fois le bouton commanderait deux lots et
  // recevrait deux factures pour un seul besoin.
  const { data: enCours } = await supabase
    .from("crm_commandes_credits")
    .select("id")
    .eq("tenant_id", c.tenant)
    .eq("nature", nature)
    .in("statut", ["commandee", "facturee"])
    .limit(1);

  if ((enCours || []).length > 0) {
    return NextResponse.json(
      {
        ok: false,
        erreur: "Vous avez déjà une commande en cours pour ce type de crédit. "
          + "Elle sera créditée dès réception de votre règlement.",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("crm_commandes_credits")
    .insert({
      tenant_id: c.tenant,
      nature: nature,
      quantite: lot.nombre,
      prix: lot.prix,
      commande_par: c.email,
    })
    .select("id, nature, quantite, prix, statut, commande_le")
    .maybeSingle();

  if (error) {
    console.error("[organisme/credits] " + error.message);
    return NextResponse.json({ ok: false, erreur: "Commande impossible." }, { status: 500 });
  }

  // ---- PREVENIR JACQUES ----
  //
  // ⚠️ L ECHEC DE CE COURRIEL NE FAIT PAS ECHOUER LA COMMANDE. Elle est
  // deja en base : perdre l alerte est un retard, perdre la commande serait
  // une vente perdue. Le detail part dans les journaux.
  try {
    const { data: orga } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, email_contact")
      .eq("tenant_id", c.tenant)
      .limit(1)
      .maybeSingle();

    const nom = orga && orga.raison_sociale ? orga.raison_sociale : c.tenant;
    const quoi = nature === "sms"
      ? lot.nombre + " SMS"
      : lot.nombre + " minutes d'appel";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        from: "Mr CRM <contact@mrcrm.fr>",
        to: "contact@academiapro.fr",
        subject: "Commande de crédits — " + nom,
        html: '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;">'
          + "<p><strong>" + nom + "</strong> commande <strong>" + quoi + "</strong>"
          + " pour " + lot.prix.toFixed(2) + " € HT.</p>"
          + "<p>Demandé par " + c.email + ".</p>"
          + "<p>À facturer, puis à créditer depuis /admin/credits une fois le "
          + "virement reçu.</p></div>",
      }),
    });
  } catch (e: any) {
    console.error("[organisme/credits] alerte : " + String(e));
  }

  return NextResponse.json({
    ok: true,
    commande: data,
    message: "Votre commande est enregistrée. Vous recevrez une facture, et "
      + "vos crédits seront ajoutés dès réception du règlement.",
  });
}
