import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ══════════════════════════════════════════════════════════════════════════
// L ALERTE DE CREDIT BAS — 06/09.
//
// POURQUOI. Le client paie ses SMS et ses minutes par virement : entre sa
// commande et le credit, il s ecoule au mieux quelques heures. Le prevenir
// QUAND IL EST A ZERO revient a l interrompre — il decouvre le probleme au
// moment ou il en a besoin.
//
// 🚨 ON NE DONNE RIEN D AVANCE. Jacques, le 06/09 : offrir des credits
// « ouvre une faille dans la strategie, et apres on acceptera plus
// important ». La grille dit « aucune negociation, jamais de remise » : une
// avance serait une remise deguisee. La reponse au delai n est pas un
// cadeau, c est de prevenir a temps.
//
// ⚠️ LE VIREMENT INSTANTANE EST LA NORME EUROPEENNE DEPUIS JANVIER 2025 :
// toutes les banques doivent le proposer, sans surcout, et l argent arrive
// en dix secondes. Le message le dit — c est ce qui decide un client a
// commander aujourd hui plutot que dans trois semaines.
//
// ⚠️ UNE SEULE ALERTE PAR SEUIL FRANCHI. Un courriel chaque matin pendant
// une semaine ne se lit plus : on marque la date, et on ne repart que si le
// solde est remonte puis redescendu.
// ══════════════════════════════════════════════════════════════════════════

// Les seuils. ⚠️ ASSEZ HAUT POUR LAISSER LE TEMPS DE COMMANDER : a dix
// minutes restantes, l alerte arriverait trop tard.
const SEUIL_SMS = 50;
const SEUIL_SECONDES = 50 * 60;

const EXPEDITEUR = "Mr CRM <contact@mrcrm.fr>";
const SITE = "https://www.mrcrm.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  // ⚠️ ON NE LIT QUE LES ORGANISMES EQUIPES. Un organisme sans expediteur
  // SMS ni numero d appel n a rien a consommer : l alerter serait du bruit.
  const { data: orgas, error } = await supabase
    .from("organismes_formation")
    .select("tenant_id, raison_sociale, email_contact, sms_expediteur, "
      + "sms_credits, tel_numero, minutes_credits, alerte_credits_le")
    .not("email_contact", "is", null)
    .limit(1000);

  if (error) {
    console.error("[cron/credits-bas] " + error.message);
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  let envoyes = 0;
  const traites: string[] = [];

  for (const o of orgas || []) {
    const adresse = String(o.email_contact || "").trim();
    if (!adresse || adresse.indexOf("@") < 1) continue;

    const sms = Number(o.sms_credits || 0);
    const sec = Number(o.minutes_credits || 0);

    // Ce qui est bas, et seulement si l organisme peut s en servir.
    const smsBas = !!o.sms_expediteur && sms <= SEUIL_SMS;
    const telBas = !!o.tel_numero && sec <= SEUIL_SECONDES;

    if (!smsBas && !telBas) continue;

    // 🚨 UNE SEULE ALERTE TANT QUE LE SOLDE N EST PAS REMONTE.
    //
    // ⚠️ SEPT JOURS DE SILENCE APRES UNE ALERTE. Sans ce delai, un client
    // qui tarde a commander recevrait le meme courriel tous les jours — et
    // ne le lirait plus le jour ou il compte vraiment.
    if (o.alerte_credits_le) {
      const depuis = Date.now() - new Date(o.alerte_credits_le).getTime();
      if (depuis < 7 * 86400000) continue;
    }

    const lignes: string[] = [];
    if (telBas) {
      const minutes = Math.floor(sec / 60);
      lignes.push("<li><strong>" + minutes + " minute"
        + (minutes > 1 ? "s" : "") + "</strong> d'appel</li>");
    }
    if (smsBas) {
      lignes.push("<li><strong>" + sms + " SMS</strong></li>");
    }

    const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>'
      + '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
      + '</head><body style="margin:0;padding:0;background:#ffffff;">'
      + '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;'
      + 'color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">'
      + "<p>Votre solde arrive à sa fin. Il vous reste :</p>"
      + '<ul style="padding-left:18px;margin:14px 0;">' + lignes.join("") + "</ul>"
      // 🚨 LE DELAI EST DIT FRANCHEMENT, ET LA SOLUTION AVEC. Cacher que le
      // credit suit le virement ferait decouvrir l attente au pire moment.
      + "<p>Commandez maintenant pour ne pas être interrompu. Avec un "
      + "<strong>virement instantané</strong> — gratuit et proposé par toutes "
      + "les banques européennes depuis 2025 — vos crédits sont ajoutés dans "
      + "la journée.</p>"
      + '<p style="margin-top:22px;"><a href="' + SITE + '/organisme/credits" '
      + 'style="color:#8a6d3b;font-weight:bold;">Commander des crédits</a></p>'
      + "</div></body></html>";

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          to: adresse,
          subject: telBas && smsBas
            ? "Vos crédits arrivent à leur fin"
            : telBas
              ? "Vos minutes d'appel arrivent à leur fin"
              : "Vos SMS arrivent à leur fin",
          html: html,
        }),
      });

      if (r.ok) {
        envoyes++;
        traites.push(o.raison_sociale || o.tenant_id);
        // ⚠️ LA DATE EST POSEE APRES L ENVOI REUSSI. La poser avant ferait
        // taire l alerte pour sept jours alors que rien n est parti.
        await supabase
          .from("organismes_formation")
          .update({ alerte_credits_le: new Date().toISOString() })
          .eq("tenant_id", o.tenant_id);
      } else {
        const detail = await r.text();
        console.error("[cron/credits-bas] Resend " + r.status
          + " pour " + adresse + " : " + detail.slice(0, 200));
      }
    } catch (e: any) {
      console.error("[cron/credits-bas] " + String(e));
    }
  }

  return NextResponse.json({
    ok: true,
    examines: (orgas || []).length,
    envoyes: envoyes,
    organismes: traites.length > 0 ? traites : undefined,
  });
}
