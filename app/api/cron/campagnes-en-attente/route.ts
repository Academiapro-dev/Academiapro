import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ══════════════════════════════════════════════════════════════════════════
// LE RAPPEL DU LUNDI, COTE CLIENT — 06/09.
//
// PENDANT DE /api/cron/produits-en-attente, qui previent Jacques pour SES
// campagnes. Celui-ci previent CHAQUE ORGANISME pour les siennes.
//
// CE QU IL FAIT. Il compte, organisme par organisme, les fiches dont une
// campagne secondaire attend son message depuis sept jours, et envoie un
// courriel a l adresse de contact de l organisme.
//
// 🚨 UN COURRIEL PAR ORGANISME, JAMAIS UN RECAPITULATIF GLOBAL. Melanger
// les fiches de plusieurs clients dans un meme envoi serait une fuite de
// donnees — et le destinataire ne saurait pas lesquelles sont les siennes.
//
// ⚠️ SEPT JOURS DEPUIS LE DERNIER MESSAGE, QUEL QU IL SOIT. Meme calcul
// que dans app/organisme/crm/page.tsx (DELAI_ENTRE_MESSAGES). 🚨 SI CE
// DELAI CHANGE ICI, LE CHANGER AUSSI LA-BAS : un rappel pour des fiches
// que l ecran refuse encore d ouvrir ferait perdre confiance dans les deux.
//
// ⚠️ IL N ENVOIE RIEN AUX CONTACTS. Le message part par les moyens du
// client — sa messagerie, son telephone. Ce cron ne fait que RAPPELER.
// ══════════════════════════════════════════════════════════════════════════

const DELAI_ENTRE_MESSAGES = 7;
const EXPEDITEUR = "Mr CRM <contact@mrcrm.fr>";
const SITE = "https://www.mrcrm.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function dernierMessageDe(p: any): number | null {
  let recent: number | null = null;
  function retenir(d: any) {
    if (!d) return;
    const t = new Date(d).getTime();
    if (!isNaN(t) && (recent === null || t > recent)) recent = t;
  }
  retenir(p.relance_le);
  const x = p.produits;
  if (x && typeof x === "object") {
    for (const k of Object.keys(x)) retenir(x[k]);
  }
  return recent;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  // ⚠️ ON NE LIT QUE LES FICHES QUI PORTENT DES CAMPAGNES SECONDAIRES.
  // `produits <> '{}'` ecarte d emblee la grande majorite.
  const { data: fiches, error } = await supabase
    .from("crm")
    .select("id, tenant_id, nom, email, organisme, campagne, produits, relance_le, desinscrit")
    .neq("produits", "{}")
    .not("desinscrit", "is", true)
    .not("tenant_id", "is", null)
    .limit(2000);

  if (error) {
    console.error("[cron/campagnes-en-attente] " + error.message);
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  // Regroupement par organisme.
  const parTenant: any = {};
  for (const f of fiches || []) {
    const x = f.produits;
    if (!x || typeof x !== "object") continue;

    const restantes = Object.keys(x).filter(function (c) { return !x[c]; });
    if (restantes.length === 0) continue;

    const dernier = dernierMessageDe(f);
    const jours = dernier === null ? 999 : Math.floor((Date.now() - dernier) / 86400000);
    if (jours < DELAI_ENTRE_MESSAGES) continue;

    if (!parTenant[f.tenant_id]) parTenant[f.tenant_id] = [];
    parTenant[f.tenant_id].push({
      nom: f.nom || f.email || "sans nom",
      organisme: f.organisme || "",
      campagnes: restantes,
    });
  }

  const tenants = Object.keys(parTenant);
  if (tenants.length === 0) {
    return NextResponse.json({ ok: true, organismes: 0, info: "aucune campagne a ecrire" });
  }

  // Les libelles des campagnes, et l adresse de chaque organisme.
  const { data: defs } = await supabase
    .from("crm_campagnes")
    .select("tenant_id, cle, libelle")
    .in("tenant_id", tenants);

  const { data: orgas } = await supabase
    .from("organismes_formation")
    .select("tenant_id, raison_sociale, email_contact")
    .in("tenant_id", tenants);

  function libelleDe(tenant: string, cle: string): string {
    const d = (defs || []).filter(function (x: any) {
      return x.tenant_id === tenant && x.cle === cle;
    })[0];
    return d ? d.libelle : cle;
  }

  let envoyes = 0;
  const sansAdresse: string[] = [];

  for (const tenant of tenants) {
    const orga = (orgas || []).filter(function (o: any) { return o.tenant_id === tenant; })[0];
    const adresse = orga && orga.email_contact ? String(orga.email_contact).trim() : "";

    // ⚠️ UN ORGANISME SANS ADRESSE DE CONTACT NE RECOIT RIEN, et ce n est
    // pas une erreur a signaler bruyamment : c est une donnee manquante a
    // completer. On la remonte dans la reponse pour qu elle se voie.
    if (!adresse || adresse.indexOf("@") < 1) {
      sansAdresse.push(orga ? (orga.raison_sociale || tenant) : tenant);
      continue;
    }

    const liste = parTenant[tenant];
    const lignes = liste.slice(0, 30).map(function (x: any) {
      const noms = x.campagnes.map(function (c: string) { return libelleDe(tenant, c); });
      return '<li style="margin-bottom:7px;">'
        + '<strong>' + x.nom + '</strong>'
        + (x.organisme ? ' <span style="color:#888;">· ' + x.organisme + '</span>' : "")
        + '<br/><span style="color:#8a6d3b;font-size:13px;">' + noms.join(" · ") + '</span></li>';
    }).join("");

    const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>'
      + '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
      + '</head><body style="margin:0;padding:0;background:#ffffff;">'
      + '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;'
      + 'color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">'
      + '<p>' + liste.length + ' contact(s) attendent un message.</p>'
      + '<ul style="padding-left:18px;margin:16px 0;">' + lignes + '</ul>'
      + (liste.length > 30
        ? '<p style="color:#888;font-size:13px;">… et ' + (liste.length - 30) + ' autres.</p>'
        : "")
      + '<p style="margin-top:22px;"><a href="' + SITE + '/organisme/crm" '
      + 'style="color:#8a6d3b;">Ouvrir mes contacts</a> — le message de chaque '
      + 'campagne y est prêt à copier.</p>'
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
          subject: liste.length + " contact(s) attendent un message",
          html: html,
        }),
      });
      if (r.ok) envoyes++;
      else {
        const detail = await r.text();
        console.error("[cron/campagnes-en-attente] Resend " + r.status
          + " pour " + adresse + " : " + detail.slice(0, 200));
      }
    } catch (e: any) {
      console.error("[cron/campagnes-en-attente] " + String(e));
    }
  }

  return NextResponse.json({
    ok: true,
    organismes: tenants.length,
    envoyes: envoyes,
    sans_adresse: sansAdresse.length > 0 ? sansAdresse : undefined,
  });
}
