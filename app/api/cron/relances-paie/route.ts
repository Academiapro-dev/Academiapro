import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA RELANCE AUTOMATIQUE DU RECAPITULATIF DE PAIE
//
// Sans la confirmation du client, aucun bulletin du mois ne s emet. Un
// client qui oublie le courriel bloque donc la paie de ses salaries, et
// personne ne s en apercoit avant le jour du virement.
//
// CHAQUE MATIN (vercel.json), pour chaque recapitulatif encore sans reponse :
//   · deux jours apres l envoi (ou la derniere relance), un rappel part au
//     client, avec le meme lien ;
//   · trois rappels au plus ;
//   · au troisieme, le cabinet qui l a envoye est prevenu que le client ne
//     repond pas — a lui d appeler, ou de lever l attente avec un motif.
// ⚠️ LA MARQUE DU COURRIEL est celle du domaine d ou le recapitulatif est
// parti (colonne `site`) : un client de Mr Comptable recoit un rappel de
// Mr Comptable, jamais d AcadeMIA Pro.
// ⚠️ UN LIEN DE PLUS DE 60 JOURS n est plus relance : il n est plus valable.
// Chaque rappel est inscrit au journal (compta_audit).
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const JOUR = 24 * 3600 * 1000;
const INTERVALLE_JOURS = 2;
const RELANCES_MAX = 3;
const DUREE_LIEN_JOURS = 60;

function marqueDe(site: string) {
  if (String(site || "").indexOf("mrcomptable") >= 0) {
    return { site: "https://mrcomptable.fr", expediteur: "Mr. Comptable <contact@mrcomptable.fr>" };
  }
  return { site: "https://academiapro.fr", expediteur: "AcadéMIA Pro <contact@academiapro.fr>" };
}

function moisEnClair(periode: string): string {
  const noms = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
    "septembre", "octobre", "novembre", "décembre"];
  const m = Number(String(periode).slice(5, 7));
  return (noms[m - 1] || "") + " " + String(periode).slice(0, 4);
}

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }

  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) return NextResponse.json({ erreur: "envoi de courriel indisponible (RESEND_API_KEY)" }, { status: 500 });
  const resend = new Resend(cle);

  const { data, error } = await supabase
    .from("paie_recaps")
    .select("id, societe_id, periode, jeton, contenu, destinataire, envoye_par, site, nb_relances, derniere_relance, cree_le")
    .eq("statut", "envoye")
    .order("cree_le", { ascending: true })
    .limit(300);
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

  const maintenant = Date.now();
  let relances = 0;
  let cabinetsPrevenus = 0;
  let ignores = 0;
  const echecs: string[] = [];

  for (const r of ((data || []) as any[])) {
    const cree = new Date(String(r.cree_le)).getTime();
    if (!isFinite(cree) || maintenant - cree > DUREE_LIEN_JOURS * JOUR) { ignores++; continue; }
    const nb = Number(r.nb_relances || 0);
    if (nb >= RELANCES_MAX) { ignores++; continue; }
    const depuis = new Date(String(r.derniere_relance || r.cree_le)).getTime();
    if (maintenant - depuis < INTERVALLE_JOURS * JOUR) { ignores++; continue; }
    if (String(r.destinataire || "").indexOf("@") < 1) { ignores++; continue; }

    const marque = marqueDe(r.site);
    const contenu: any = r.contenu || {};
    const societe = String(contenu.societe || "");
    const lien = marque.site + "/compliance/recap-paie/" + r.jeton;
    const rang = nb + 1;

    const envoi: any = await resend.emails.send({
      from: marque.expediteur,
      to: r.destinataire,
      reply_to: String(r.envoye_par || "").indexOf("@") > 0 ? r.envoye_par : undefined,
      subject: "Rappel — paie de " + moisEnClair(r.periode) + " — " + societe + " : votre confirmation est attendue",
      html: '<div style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">'
        + "<h2>Votre paie de " + html(moisEnClair(r.periode)) + " attend votre vérification</h2>"
        + "<p>Votre cabinet a préparé la paie de " + html(societe) + " et vous l'a envoyée pour vérification. "
        + "Tant que vous ne l'avez pas confirmée, les bulletins de vos salariés ne peuvent pas être émis.</p>"
        + '<p style="text-align:center;margin:28px 0"><a href="' + lien + '" style="background:#c8a96e;color:#050508;'
        + 'padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Vérifier et confirmer</a></p>'
        + '<p style="font-size:12px;color:#777">Rappel ' + rang + " sur " + RELANCES_MAX
        + ". Vous pouvez répondre à ce courriel pour toute question.</p></div>",
    } as any).catch(function (e: any) { return { error: e }; });

    if (envoi && envoi.error) {
      echecs.push(String(r.id) + " : " + String(envoi.error.message || envoi.error));
      continue;
    }

    await supabase.from("paie_recaps")
      .update({ nb_relances: rang, derniere_relance: new Date().toISOString() })
      .eq("id", r.id).eq("statut", "envoye");
    relances++;

    await supabase.from("compta_audit").insert({
      societe_id: r.societe_id, email: "relance-automatique", action: "paie.recap_relance",
      cible: "paie_recaps", reference: String(r.id), avant: null,
      apres: { rang: rang, destinataire: r.destinataire, periode: r.periode }, adresse_ip: null,
    });

    // Au dernier rappel, le cabinet est prevenu.
    if (rang === RELANCES_MAX && String(r.envoye_par || "").indexOf("@") > 0) {
      const alerte: any = await resend.emails.send({
        from: marque.expediteur,
        to: r.envoye_par,
        subject: "Paie de " + moisEnClair(r.periode) + " — " + societe + " : le client ne répond pas",
        html: '<div style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">'
          + "<h2>Le client n'a pas confirmé la paie</h2>"
          + "<p>" + html(r.destinataire) + " n'a pas répondu au récapitulatif de " + html(moisEnClair(r.periode))
          + " malgré " + RELANCES_MAX + " rappels. Les bulletins du mois ne peuvent pas être émis.</p>"
          + "<p>Appelez-le, ou, si vous avez la carte blanche sur ce dossier, levez l'attente avec un motif "
          + "dans « Validation du mois ».</p>"
          + '<p style="text-align:center;margin:26px 0"><a href="' + marque.site + '/admin/compliance/bulletins-paie" '
          + 'style="background:#c8a96e;color:#050508;padding:12px 24px;border-radius:8px;text-decoration:none;'
          + 'font-weight:bold">Ouvrir la paie</a></p></div>',
      } as any).catch(function (e: any) { return { error: e }; });
      if (alerte && alerte.error) echecs.push(String(r.id) + " (cabinet) : " + String(alerte.error.message || alerte.error));
      else cabinetsPrevenus++;
    }
  }

  return NextResponse.json({
    success: true,
    en_attente: (data || []).length,
    relances: relances,
    cabinets_prevenus: cabinetsPrevenus,
    ignores: ignores,
    echecs: echecs,
  });
}
