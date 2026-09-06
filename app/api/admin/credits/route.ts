import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES COMMANDES DE CREDITS, COTE EDITEUR — 06/09.
//
// 🚨 C EST ICI QUE LE CREDIT EST REELLEMENT AJOUTE. La commande du client
// ne credite rien : elle attend le virement. Cette route est le seul
// endroit du code qui augmente `sms_credits` et `minutes_credits`.
//
// ⚠️ ELLE VIT SOUS /api/admin, protege par le middleware qui le reserve a
// contact@academiapro.fr. Aucun client ne peut l atteindre, quel que soit
// son organisme.
//
// ⚠️ LE CREDIT S AJOUTE, IL NE REMPLACE PAS. Un client qui commande un
// second lot avant d avoir epuise le premier garderait sinon moins que ce
// qu il a paye.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  // Les commandes en attente d abord, les autres ensuite : c est la file
  // de travail, pas un historique.
  const { data, error } = await supabase
    .from("crm_commandes_credits")
    .select("id, tenant_id, nature, quantite, prix, statut, commande_par, reference, notes, commande_le, creditee_le")
    .order("commande_le", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/credits] GET : " + error.message);
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  // Le nom des organismes, pour ne pas lire des identifiants.
  const tenants = Array.from(new Set((data || []).map(function (c: any) {
    return c.tenant_id;
  })));

  const { data: orgas } = tenants.length > 0
    ? await supabase
        .from("organismes_formation")
        .select("tenant_id, raison_sociale, email_contact, sms_credits, minutes_credits, sms_expediteur, tel_numero")
        .in("tenant_id", tenants)
    : { data: [] as any[] };

  const parTenant: any = {};
  for (const o of orgas || []) parTenant[o.tenant_id] = o;

  const commandes = (data || []).map(function (c: any) {
    const o = parTenant[c.tenant_id] || {};
    return {
      ...c,
      organisme: o.raison_sociale || c.tenant_id,
      email_contact: o.email_contact || "",
      sms_credits: Number(o.sms_credits || 0),
      // ⚠️ EN SECONDES EN BASE, affichees en minutes : Plivo facture a la
      // seconde, et le client achete des minutes.
      minutes_credits: Math.floor(Number(o.minutes_credits || 0) / 60),
      sms_expediteur: o.sms_expediteur || "",
      tel_numero: o.tel_numero || "",
    };
  });

  return NextResponse.json({ ok: true, commandes: commandes });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(function () { return null; });
  if (!b || !b.action || !b.id) {
    return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
  }

  const { data: cmd } = await supabase
    .from("crm_commandes_credits")
    .select("id, tenant_id, nature, quantite, statut")
    .eq("id", String(b.id))
    .limit(1)
    .maybeSingle();

  if (!cmd) {
    return NextResponse.json({ ok: false, erreur: "Commande introuvable." }, { status: 404 });
  }

  // ---- MARQUER FACTUREE ----
  if (b.action === "facturer") {
    const { error } = await supabase
      .from("crm_commandes_credits")
      .update({
        statut: "facturee",
        reference: String(b.reference || "").slice(0, 60) || null,
      })
      .eq("id", cmd.id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- CREDITER ----
  if (b.action === "crediter") {
    // 🚨 UN SEUL CREDIT PAR COMMANDE. Sans ce controle, deux clics
    // creditent deux fois — et le second lot n a jamais ete paye.
    if (cmd.statut === "creditee") {
      return NextResponse.json(
        { ok: false, erreur: "Cette commande a déjà été créditée." },
        { status: 409 }
      );
    }
    if (cmd.statut === "annulee") {
      return NextResponse.json(
        { ok: false, erreur: "Cette commande est annulée." },
        { status: 409 }
      );
    }

    const { data: orga } = await supabase
      .from("organismes_formation")
      .select("id, sms_credits, minutes_credits, email_contact, raison_sociale")
      .eq("tenant_id", cmd.tenant_id)
      .limit(1)
      .maybeSingle();

    if (!orga) {
      return NextResponse.json({ ok: false, erreur: "Organisme introuvable." }, { status: 404 });
    }

    // ⚠️ ON AJOUTE, ON NE REMPLACE PAS.
    // ⚠️ LES MINUTES SE STOCKENT EN SECONDES : le webhook Plivo decompte a
    // la seconde. Multiplier ici est le seul endroit ou la conversion se
    // fait — la faire ailleurs ferait diverger les deux comptes.
    const champs: any = {};
    if (cmd.nature === "sms") {
      champs.sms_credits = Number(orga.sms_credits || 0) + Number(cmd.quantite || 0);
    } else {
      champs.minutes_credits = Number(orga.minutes_credits || 0)
        + Number(cmd.quantite || 0) * 60;
    }

    const { error: e1 } = await supabase
      .from("organismes_formation")
      .update(champs)
      .eq("id", orga.id);

    if (e1) {
      console.error("[admin/credits] crédit : " + e1.message);
      return NextResponse.json({ ok: false, erreur: e1.message }, { status: 500 });
    }

    // ⚠️ LA COMMANDE EST MARQUEE APRES LE CREDIT, jamais avant. Si la
    // seconde ecriture echoue, on voit une commande a crediter dont le
    // credit est deja passe — genant. L inverse serait pire : une commande
    // marquee creditee sans que le client ait rien recu.
    const { error: e2 } = await supabase
      .from("crm_commandes_credits")
      .update({
        statut: "creditee",
        creditee_le: new Date().toISOString(),
        reference: String(b.reference || "").slice(0, 60) || null,
      })
      .eq("id", cmd.id);

    if (e2) {
      console.error("[admin/credits] marquage : " + e2.message);
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le crédit est passé mais la commande n'a pas pu être "
            + "marquée. Vérifiez avant de recommencer.",
        },
        { status: 500 }
      );
    }

    // ---- PREVENIR LE CLIENT ----
    // ⚠️ L ECHEC DE CE COURRIEL NE DEFAIT PAS LE CREDIT. Il est passe.
    try {
      if (orga.email_contact) {
        const quoi = cmd.nature === "sms"
          ? cmd.quantite + " SMS"
          : cmd.quantite + " minutes d'appel";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            from: "Mr CRM <contact@mrcrm.fr>",
            to: String(orga.email_contact).trim(),
            subject: "Vos crédits sont ajoutés",
            html: '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;">'
              + "<p>Votre règlement nous est parvenu : <strong>" + quoi
              + "</strong> viennent d'être ajoutés à votre compte.</p>"
              + '<p><a href="https://www.mrcrm.fr/organisme/credits" '
              + 'style="color:#8a6d3b;">Voir votre solde</a></p></div>',
          }),
        });
      }
    } catch (e: any) {
      console.error("[admin/credits] alerte client : " + String(e));
    }

    return NextResponse.json({ ok: true });
  }

  // ---- ANNULER ----
  if (b.action === "annuler") {
    if (cmd.statut === "creditee") {
      // ⛔ ON NE RETIRE PAS UN CREDIT DEJA DONNE. Le client a peut-etre
      // deja consomme : lui reprendre ses minutes le laisserait avec un
      // solde negatif et une facture payee.
      return NextResponse.json(
        {
          ok: false,
          erreur: "Cette commande est déjà créditée. Pour la reprendre, "
            + "ajustez le solde à la main.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("crm_commandes_credits")
      .update({ statut: "annulee", notes: String(b.notes || "").slice(0, 400) || null })
      .eq("id", cmd.id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
