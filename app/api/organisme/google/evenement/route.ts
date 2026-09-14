import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession } from "../../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// POSER UN RENDEZ-VOUS DANS L AGENDA — 14/09.
//
// Le client prend un rendez-vous depuis la fiche du prospect ; il apparait
// dans son agenda Google, avec le nom, le telephone et un lien vers la
// fiche.
//
// 🚨 LE JETON D ACCES DURE UNE HEURE. On le rafraichit AVANT chaque appel
// s il est expire — sinon la premiere prise de rendez-vous du lendemain
// echouerait, et le client croirait la connexion perdue.
//
// ⚠️ SI GOOGLE REFUSE LE RAFRAICHISSEMENT (autorisation retiree cote
// compte Google), on desactive la connexion et on le DIT : « reconnectez
// votre agenda ». Laisser une connexion morte en place, c est laisser
// l outil echouer en silence a chaque rendez-vous.
//
// ⚠️ ON N ECRIT QUE DANS L AGENDA DU CLIENT, jamais ailleurs : la portee
// demandee est calendar.events, rien de plus. On ne lit pas ses
// rendez-vous, on ne touche pas a ses autres agendas.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

// Le jeton utilisable maintenant. Rafraichi si besoin, et le nouveau est
// garde : sinon on rafraichirait a chaque appel pour rien.
async function jetonValide(tenant: string): Promise<any> {
  const { data: c } = await supabase
    .from("organisme_google").select("*").eq("tenant_id", tenant).maybeSingle();

  if (!c || !c.actif || !c.refresh_token) {
    return { erreur: "Aucun agenda connecté. Connectez le vôtre depuis votre espace." };
  }

  const encoreBon = c.access_token && c.expire_le && new Date(c.expire_le).getTime() > Date.now();
  if (encoreBon) return { jeton: c.access_token, calendrier: c.calendar_id || "primary" };

  const id = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const secret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  if (!id || !secret) return { erreur: "La connexion à Google n'est pas configurée." };

  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: id, client_secret: secret,
        refresh_token: c.refresh_token, grant_type: "refresh_token",
      }).toString(),
    });
    const d = await r.json();
    if (!r.ok || !d.access_token) {
      // 🚨 L AUTORISATION A ETE RETIREE COTE GOOGLE. On ferme proprement.
      await supabase.from("organisme_google").update({
        actif: false, access_token: null, expire_le: null, maj_le: new Date().toISOString(),
      }).eq("tenant_id", tenant);
      return { erreur: "Google a refusé la connexion (l'accès a peut-être été retiré depuis votre compte). Reconnectez votre agenda." };
    }

    const expire = new Date(Date.now() + ((Number(d.expires_in) || 3600) - 60) * 1000).toISOString();
    await supabase.from("organisme_google").update({
      access_token: d.access_token, expire_le: expire, maj_le: new Date().toISOString(),
    }).eq("tenant_id", tenant);

    return { jeton: d.access_token, calendrier: c.calendar_id || "primary" };
  } catch (e: any) {
    return { erreur: "Google injoignable : " + String(e) };
  }
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });

  const titre = propre(b.titre, 200);
  const debut = propre(b.debut, 40);
  if (!titre) return NextResponse.json({ ok: false, erreur: "Donnez un titre au rendez-vous." }, { status: 400 });
  if (!debut) return NextResponse.json({ ok: false, erreur: "Indiquez la date et l'heure." }, { status: 400 });

  const d0 = new Date(debut);
  if (isNaN(d0.getTime())) return NextResponse.json({ ok: false, erreur: "Date illisible." }, { status: 400 });

  const minutes = Math.max(5, Math.min(600, Number(b.duree) || 30));
  const d1 = new Date(d0.getTime() + minutes * 60000);

  const acces = await jetonValide(tenant);
  if (acces.erreur) return NextResponse.json({ ok: false, erreur: acces.erreur }, { status: 409 });

  // La fiche, si le rendez-vous vient du CRM : son nom, son telephone et
  // son adresse enrichissent l evenement sans qu on ait rien a ressaisir.
  let fiche: any = null;
  if (b.fiche_id) {
    const cle = String(b.fiche_id);
    const r = cle.indexOf("@") > 0
      ? await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
      : await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
    fiche = r.data;
  }

  const details: string[] = [];
  if (fiche) {
    if (fiche.nom) details.push("Contact : " + fiche.nom);
    if (fiche.organisme) details.push("Société : " + fiche.organisme);
    if (fiche.telephone) details.push("Téléphone : " + fiche.telephone);
    if (fiche.email) details.push("Courriel : " + fiche.email);
  }
  if (b.notes) details.push(String(b.notes).slice(0, 2000));
  details.push("Rendez-vous créé depuis votre CRM.");

  const evenement: any = {
    summary: titre,
    description: details.join("\n"),
    start: { dateTime: d0.toISOString() },
    end: { dateTime: d1.toISOString() },
  };
  if (b.lieu) evenement.location = propre(b.lieu, 300);

  // ⚠️ ON N INVITE PERSONNE SANS QUE LE CLIENT L AIT DEMANDE. Un invite
  // recoit un courriel de Google : l ajouter d office enverrait un message
  // que le client n a pas voulu.
  if (b.inviter === true && fiche && fiche.email) {
    evenement.attendees = [{ email: fiche.email }];
  }

  try {
    const r = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(acces.calendrier) + "/events"
        + (b.inviter === true ? "?sendUpdates=all" : ""),
      {
        method: "POST",
        headers: { Authorization: "Bearer " + acces.jeton, "Content-Type": "application/json" },
        body: JSON.stringify(evenement),
      }
    );
    const d = await r.json();
    if (!r.ok) {
      return NextResponse.json({
        ok: false,
        erreur: "Google a refusé : " + ((d && d.error && d.error.message) || r.status),
      }, { status: 502 });
    }

    // La fiche garde la trace : on saura, en la rouvrant, qu un rendez-vous
    // est pris et quand.
    if (fiche && fiche.id) {
      await supabase.from("crm").update({ derniere_interaction: new Date().toISOString() }).eq("id", fiche.id);
    }

    return NextResponse.json({
      ok: true,
      lien: d.htmlLink || null,
      debut: d0.toISOString(),
      message: "Rendez-vous ajouté à votre agenda le "
        + d0.toLocaleDateString("fr-FR") + " à "
        + d0.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "."
        + (b.inviter === true && fiche && fiche.email ? " Une invitation a été envoyée à " + fiche.email + "." : ""),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Envoi impossible : " + String(e) }, { status: 500 });
  }
}
