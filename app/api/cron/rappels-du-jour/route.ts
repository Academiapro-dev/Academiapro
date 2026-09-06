import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ══════════════════════════════════════════════════════════════════════════
// LES RAPPELS DU JOUR, PAR COURRIEL — 06/09.
//
// CE QU IL FAIT. Chaque matin, il previent chaque organisme des personnes
// qu il a prevu de rappeler aujourd hui — et de celles qu il avait prevu de
// rappeler avant et qui attendent encore.
//
// POURQUOI. Le compteur « 3 personnes a rappeler aujourd hui » existe en
// haut du CRM depuis le 06/09, mais il faut ouvrir l ecran pour le voir.
// Un rappel note lundi pour jeudi ne sert a rien si personne n ouvre le
// CRM le jeudi matin.
//
// 🚨 UN COURRIEL PAR ORGANISME, JAMAIS DE RECAPITULATIF GLOBAL. Melanger
// les fiches de plusieurs clients serait une fuite de donnees.
//
// ⚠️ LES RAPPELS EN RETARD Y FIGURENT. Un rappel prevu hier et oublie doit
// remonter : le masquer parce que sa date est passee, c est le perdre.
//
// ⚠️ SEUL LE DERNIER APPEL DE CHAQUE FICHE COMPTE. Un contact marque
// « a rappeler » il y a un mois puis « a repondu » hier n est plus a
// rappeler — c est l etat courant qui decide, pas l historique.
//
// 🚨 SEPT HEURES, TOUS LES JOURS OUVRES. Avant la journee, pas pendant :
// le courriel doit etre lu au moment ou l on decide de ce qu on fait.
// ══════════════════════════════════════════════════════════════════════════

const EXPEDITEUR = "Mr CRM <contact@mrcrm.fr>";
const SITE = "https://www.mrcrm.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function jour(d: any): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch (e) {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  // La date du jour, en texte, pour comparer a `rappeler_le` qui est une
  // date sans heure. ⚠️ COMPARAISON EN TEXTE, PAS EN DATE : convertir en
  // objet Date ramenerait a minuit UTC, et un rappel du jour disparaitrait
  // le matin en heure francaise.
  const d = new Date();
  const aujourdhui = d.getFullYear() + "-"
    + String(d.getMonth() + 1).padStart(2, "0") + "-"
    + String(d.getDate()).padStart(2, "0");

  // ⚠️ ON LIT TOUS LES APPELS PORTANT UNE DATE DE RAPPEL ECHUE, du plus
  // recent au plus ancien. C est l ordre qui permet de ne garder que le
  // DERNIER appel de chaque fiche.
  const { data: appels, error } = await supabase
    .from("crm_appels")
    .select("tenant_id, fiche_email, numero, resultat, notes, appele_le, rappeler_le")
    .not("rappeler_le", "is", null)
    .lte("rappeler_le", aujourdhui)
    .order("appele_le", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[cron/rappels-du-jour] " + error.message);
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  // 🚨 ON NE RETIENT QUE LE DERNIER APPEL PAR FICHE, ET SEULEMENT S IL
  // PORTE ENCORE « a rappeler ». Sans ce filtre, un contact rappele et
  // traite depuis remonterait indefiniment.
  const vus: any = {};
  const parTenant: any = {};

  for (const a of appels || []) {
    const cle = String(a.tenant_id) + "|" + String(a.fiche_email);
    if (vus[cle]) continue;
    vus[cle] = true;
    if (a.resultat !== "rappeler") continue;

    if (!parTenant[a.tenant_id]) parTenant[a.tenant_id] = [];
    parTenant[a.tenant_id].push(a);
  }

  const tenants = Object.keys(parTenant);
  if (tenants.length === 0) {
    return NextResponse.json({ ok: true, organismes: 0, info: "aucun rappel aujourd hui" });
  }

  // Les noms des fiches et les adresses des organismes.
  const emails = ([] as string[]).concat.apply([],
    tenants.map(function (t) {
      return parTenant[t].map(function (a: any) { return a.fiche_email; });
    }));

  const [fichesR, orgasR] = await Promise.all([
    supabase.from("crm").select("tenant_id, email, nom, organisme").in("email", emails),
    supabase.from("organismes_formation")
      .select("tenant_id, raison_sociale, email_contact").in("tenant_id", tenants),
  ]);

  const fiches = fichesR.data || [];
  const orgas = orgasR.data || [];

  function ficheDe(tenant: string, email: string): any {
    return fiches.filter(function (f: any) {
      return f.tenant_id === tenant && f.email === email;
    })[0] || {};
  }

  let envoyes = 0;
  const sansAdresse: string[] = [];

  for (const tenant of tenants) {
    const orga = orgas.filter(function (o: any) { return o.tenant_id === tenant; })[0];
    const adresse = orga && orga.email_contact ? String(orga.email_contact).trim() : "";

    if (!adresse || adresse.indexOf("@") < 1) {
      sansAdresse.push(orga ? (orga.raison_sociale || tenant) : tenant);
      continue;
    }

    const liste = parTenant[tenant];

    const lignes = liste.slice(0, 40).map(function (a: any) {
      const f = ficheDe(tenant, a.fiche_email);
      const enRetard = String(a.rappeler_le).slice(0, 10) < aujourdhui;
      return '<li style="margin-bottom:8px;">'
        + '<strong>' + (f.nom || a.fiche_email) + '</strong>'
        + (f.organisme ? ' <span style="color:#888;">· ' + f.organisme + '</span>' : "")
        + (a.numero ? ' <span style="color:#8a6d3b;">· ' + a.numero + '</span>' : "")
        + (enRetard
          ? ' <span style="color:#c0392b;">· prévu le ' + jour(a.rappeler_le) + '</span>'
          : "")
        + (a.notes
          ? '<br/><span style="color:#666;font-size:13px;">'
            + String(a.notes).slice(0, 150) + '</span>'
          : "")
        + '</li>';
    }).join("");

    const enRetard = liste.filter(function (a: any) {
      return String(a.rappeler_le).slice(0, 10) < aujourdhui;
    }).length;

    const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>'
      + '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
      + '</head><body style="margin:0;padding:0;background:#ffffff;">'
      + '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;'
      + 'color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">'
      + '<p>' + liste.length + ' personne' + (liste.length > 1 ? "s" : "")
      + ' à rappeler aujourd\'hui.'
      + (enRetard > 0
        ? ' <span style="color:#c0392b;">Dont ' + enRetard + ' prévue'
          + (enRetard > 1 ? "s" : "") + ' les jours précédents.</span>'
        : "")
      + '</p>'
      + '<ul style="padding-left:18px;margin:16px 0;">' + lignes + '</ul>'
      + (liste.length > 40
        ? '<p style="color:#888;font-size:13px;">… et ' + (liste.length - 40) + ' autres.</p>'
        : "")
      + '<p style="margin-top:22px;"><a href="' + SITE + '/organisme/crm" '
      + 'style="color:#8a6d3b;">Ouvrir mes contacts</a> — le filtre '
      + '« À rappeler aujourd\'hui » les affiche seuls.</p>'
      + '</div></body></html>';

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
          subject: liste.length + " personne" + (liste.length > 1 ? "s" : "")
            + " à rappeler aujourd'hui",
          html: html,
        }),
      });
      if (r.ok) envoyes++;
      else {
        const detail = await r.text();
        console.error("[cron/rappels-du-jour] Resend " + r.status
          + " pour " + adresse + " : " + detail.slice(0, 200));
      }
    } catch (e: any) {
      console.error("[cron/rappels-du-jour] " + String(e));
    }
  }

  return NextResponse.json({
    ok: true,
    organismes: tenants.length,
    envoyes: envoyes,
    sans_adresse: sansAdresse.length > 0 ? sansAdresse : undefined,
  });
}
