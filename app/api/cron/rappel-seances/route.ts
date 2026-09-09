import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ══════════════════════════════════════════════════════════════════════════
// LE RAPPEL DE LA VEILLE AUX APPRENANTS — 09/09 (Mr LMS).
//
// CE QU IL FAIT. Chaque soir a 18 h (heure de Paris), pour chaque seance
// prevue LE LENDEMAIN, il previent les apprenants de la formation :
//   - par SMS s ils ont un telephone europeen ET que l organisme a un nom
//     d expediteur et des credits ;
//   - par COURRIEL sinon. Personne n est oublie parce qu il manque un
//     numero : le courriel est la voie de secours, pas une option.
//
// POURQUOI LE SOIR ET PAS LE MATIN. Un rappel recu a 7 h pour une seance
// a 9 h ne laisse pas le temps de s organiser. La veille au soir, si.
//
// 🚨 LES MEMES REGLES QUE /api/organisme/sms, REPRISES A L IDENTIQUE :
// cloisonnement par tenant, nom d expediteur de l organisme (jamais un nom
// par defaut), decompte des credits AVANT l envoi et conditionne au solde,
// credits rendus si Brevo refuse, Europe seulement, trace dans sms_envoyes
// avant l envoi. ⚠️ Si la route SMS change une regle, la reporter ici.
//
// 🚨 LE COURRIEL PART D UN DOMAINE NEUTRE. Un apprenant est le client de
// l ORGANISME, pas le notre : aucune marque de la maison ne doit apparaitre.
// espaces-formations.fr est le domaine reserve a cet usage (marque blanche
// AcadeMIA). Le nom affiche est celui de l organisme.
//
// ⚠️ UN APPRENANT N EST PREVENU QU UNE FOIS PAR SEANCE, meme si le cron est
// relance : sms_envoyes porte reference_id = seance et destinataire, et
// on le consulte avant d envoyer. Pour le courriel, la meme trace est
// ecrite dans sms_envoyes avec origine 'rappel_seance_email' — c est le
// journal le plus proche qui existe, plutot qu une table de plus.
//
// ⚠️ `telephone` sur organisme_apprenants a ete ajoutee le 09/09 : les
// apprenants deja saisis n en ont pas, ils recevront le courriel jusqu a
// ce que l organisme complete la fiche.
// ══════════════════════════════════════════════════════════════════════════

const URL_BREVO = "https://api.brevo.com/v3/transactionalSMS/sms";
const EXPEDITEUR_MAIL_DOMAINE = "rappels@espaces-formations.fr";
const ORIGINE_SMS = "rappel_seance";
const ORIGINE_MAIL = "rappel_seance_email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Copie de /api/organisme/sms — voir l avertissement en tete.
const INDICATIFS_EEA = [
  "33", "32", "352", "41", "49", "31", "34", "351", "39", "43", "353", "45",
  "46", "358", "47", "354", "423", "48", "420", "421", "36", "40", "359",
  "385", "386", "370", "371", "372", "30", "357", "356",
];
const INDICATIFS_TRIES = INDICATIFS_EEA.slice().sort(function (a, b) { return b.length - a.length; });

function estEuropeen(numero: string): boolean {
  for (const i of INDICATIFS_TRIES) if (numero.indexOf(i) === 0) return true;
  return false;
}

function numeroPropre(brut: string): string | null {
  let t = String(brut || "").replace(/[^0-9+]/g, "");
  if (!t) return null;
  if (t.indexOf("+") === 0) t = t.slice(1);
  else if (t.indexOf("00") === 0) t = t.slice(2);
  else if (t.indexOf("0") === 0) t = "33" + t.slice(1);
  if (/^33[1-9]\d{8}$/.test(t)) return t;
  if (/^\d{8,15}$/.test(t)) return t;
  return null;
}

function expediteurValide(brut: any): string | null {
  const t = String(brut || "").trim();
  return /^[A-Za-z0-9]{3,11}$/.test(t) ? t : null;
}

function autorise(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true;
  if (req.headers.get("authorization") === "Bearer " + secret) return true;
  return new URL(req.url).searchParams.get("cle") === secret;
}

// La date de demain, en heure de Paris, au format AAAA-MM-JJ. ⚠️ Toujours
// Paris : un cron a 18 h Paris tourne a 16 h ou 17 h UTC, et « demain » en
// UTC n est pas toujours « demain » a Paris.
function demainParis(): string {
  const maintenant = new Date();
  const paris = new Date(maintenant.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  paris.setDate(paris.getDate() + 1);
  return paris.getFullYear() + "-" + String(paris.getMonth() + 1).padStart(2, "0") + "-" + String(paris.getDate()).padStart(2, "0");
}

function jourParis(d: any): string {
  return new Date(d).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).slice(0, 10);
}

function heureParis(d: any): string {
  return new Date(d).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}

function dateLongueParis(d: any): string {
  return new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
}

function coupe(t: string, n: number): string {
  const s = String(t || "").trim();
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ ok: false, erreur: "Acces refuse" }, { status: 401 });

  const compter = new URL(req.url).searchParams.get("compter") === "1";
  const demain = demainParis();

  // Les seances du lendemain : on lit large (48 h) puis on filtre sur le
  // jour de Paris, parce que `debut` est un instant UTC.
  const debutFenetre = new Date(demain + "T00:00:00+02:00");
  debutFenetre.setHours(debutFenetre.getHours() - 3);
  const finFenetre = new Date(demain + "T23:59:59+02:00");
  finFenetre.setHours(finFenetre.getHours() + 3);

  const { data: seancesBrutes, error: eS } = await supabase
    .from("organisme_seances")
    .select("id, tenant_id, formation_code, titre, debut, duree_minutes, salle, formateur, statut")
    .gte("debut", debutFenetre.toISOString())
    .lte("debut", finFenetre.toISOString())
    .limit(500);

  if (eS) return NextResponse.json({ ok: false, erreur: eS.message }, { status: 500 });

  const seances = (seancesBrutes || []).filter(function (s: any) {
    const st = String(s.statut || "").toLowerCase();
    return jourParis(s.debut) === demain && st.indexOf("annul") < 0;
  });

  if (seances.length === 0) {
    return NextResponse.json({ ok: true, demain, seances: 0, info: "aucune seance demain" });
  }

  const tenants = Array.from(new Set(seances.map(function (s: any) { return s.tenant_id; })));

  const [orgasR, apprenantsR] = await Promise.all([
    supabase.from("organismes_formation")
      .select("tenant_id, raison_sociale, email_contact, sms_expediteur, sms_credits, id")
      .in("tenant_id", tenants),
    supabase.from("organisme_apprenants")
      .select("id, tenant_id, email, nom, telephone, formation_code, statut, statut_stagiaire")
      .in("tenant_id", tenants)
      .limit(5000),
  ]);

  const orgas: any = {};
  for (const o of orgasR.data || []) orgas[o.tenant_id] = o;
  const apprenants = apprenantsR.data || [];

  const cleBrevo = process.env.BREVO_API_KEY || "";
  const cleResend = process.env.RESEND_API_KEY || "";

  let sms = 0, mails = 0, dejaPrevenus = 0, sansCanal = 0;
  const details: any[] = [];

  for (const s of seances) {
    const orga = orgas[s.tenant_id];
    if (!orga) continue;

    const concernes = apprenants.filter(function (a: any) {
      if (a.tenant_id !== s.tenant_id) return false;
      if (a.formation_code !== s.formation_code) return false;
      const st = String(a.statut || a.statut_stagiaire || "").toLowerCase();
      return st.indexOf("abandon") < 0 && st.indexOf("annul") < 0 && st.indexOf("termin") < 0;
    });

    // Ceux deja prevenus pour cette seance.
    const { data: traces } = await supabase
      .from("sms_envoyes")
      .select("destinataire, origine")
      .eq("tenant_id", s.tenant_id)
      .eq("reference_id", String(s.id))
      .in("origine", [ORIGINE_SMS, ORIGINE_MAIL]);
    const deja = new Set((traces || []).map(function (t: any) { return t.destinataire; }));

    const quand = dateLongueParis(s.debut) + " à " + heureParis(s.debut);
    const lieu = s.salle ? " — " + coupe(s.salle, 30) : "";
    const texteSms = coupe(
      "Rappel : " + coupe(s.titre || s.formation_code, 50) + ", demain " + quand + lieu + ". " + coupe(orga.raison_sociale || "", 25),
      160
    );

    const expediteur = expediteurValide(orga.sms_expediteur);

    for (const a of concernes) {
      const numero = a.telephone ? numeroPropre(a.telephone) : null;
      const peutSms = !!(numero && estEuropeen(numero) && expediteur && cleBrevo);
      const destinataire = peutSms ? numero! : String(a.email || "").toLowerCase().trim();
      if (!destinataire) { sansCanal++; continue; }
      if (deja.has(destinataire)) { dejaPrevenus++; continue; }

      if (compter) {
        details.push({ seance: s.titre, apprenant: a.email, canal: peutSms ? "sms" : "email" });
        if (peutSms) sms++; else mails++;
        continue;
      }

      if (peutSms) {
        // Decompte conditionne au solde, AVANT l envoi.
        const { data: o2 } = await supabase.from("organismes_formation").select("sms_credits").eq("id", orga.id).maybeSingle();
        const credits = Number((o2 && o2.sms_credits) || 0);
        if (credits < 1) {
          // Plus de credits : on bascule sur le courriel.
          await envoyerMail(cleResend, orga, a, s, quand, lieu);
          mails++;
          continue;
        }
        const { data: debite } = await supabase
          .from("organismes_formation").update({ sms_credits: credits - 1 }).eq("id", orga.id).gte("sms_credits", 1).select("id").maybeSingle();
        if (!debite) { await envoyerMail(cleResend, orga, a, s, quand, lieu); mails++; continue; }

        const { data: trace } = await supabase.from("sms_envoyes").insert({
          tenant_id: s.tenant_id, destinataire: numero, message: texteSms, origine: ORIGINE_SMS,
          reference_id: String(s.id), statut: "en_cours", envoye_par: "cron",
        }).select("id").maybeSingle();

        const r = await fetch(URL_BREVO, {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": cleBrevo, accept: "application/json" },
          body: JSON.stringify({ type: "transactional", sender: expediteur, recipient: numero, content: texteSms }),
        });
        const brut = await r.text();
        if (!r.ok) {
          await supabase.from("organismes_formation").update({ sms_credits: credits }).eq("id", orga.id);
          if (trace) await supabase.from("sms_envoyes").update({ statut: "echec", erreur: brut.slice(0, 400) }).eq("id", trace.id);
          console.error("[cron/rappel-seances] Brevo " + r.status + " : " + brut.slice(0, 200));
          continue;
        }
        let rep: any = null; try { rep = JSON.parse(brut); } catch (e) {}
        if (trace) await supabase.from("sms_envoyes").update({ statut: "envoye", message_id: rep && (rep.messageId || rep.reference) ? String(rep.messageId || rep.reference) : null }).eq("id", trace.id);
        sms++;
      } else {
        await envoyerMail(cleResend, orga, a, s, quand, lieu);
        mails++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mode: compter ? "comptage" : "envoi",
    demain,
    seances: seances.length,
    sms, courriels: mails, deja_prevenus: dejaPrevenus, sans_canal: sansCanal,
    details: compter ? details.slice(0, 100) : undefined,
  });
}

async function envoyerMail(cleResend: string, orga: any, a: any, s: any, quand: string, lieu: string) {
  const email = String(a.email || "").toLowerCase().trim();
  if (!email || email.indexOf("@") < 1) return;

  // La trace d abord, comme pour le SMS.
  const { data: trace } = await supabase.from("sms_envoyes").insert({
    tenant_id: s.tenant_id, destinataire: email, message: "Rappel de séance : " + (s.titre || s.formation_code) + " — " + quand,
    origine: ORIGINE_MAIL, reference_id: String(s.id), statut: "en_cours", envoye_par: "cron",
  }).select("id").maybeSingle();

  if (!cleResend) {
    if (trace) await supabase.from("sms_envoyes").update({ statut: "echec", erreur: "RESEND_API_KEY absente" }).eq("id", trace.id);
    return;
  }

  const nomOrga = String(orga.raison_sociale || "Votre organisme de formation").replace(/[<>"]/g, "");
  const html = '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.7">'
    + '<p>Bonjour' + (a.nom ? " " + String(a.nom).replace(/[<>]/g, "") : "") + ",</p>"
    + "<p>Votre séance <strong>" + String(s.titre || s.formation_code).replace(/[<>]/g, "") + "</strong> a lieu <strong>demain, " + quand + "</strong>"
    + (s.salle ? " — " + String(s.salle).replace(/[<>]/g, "") : "") + (s.formateur ? ", avec " + String(s.formateur).replace(/[<>]/g, "") : "") + ".</p>"
    + "<p>À demain.</p>"
    + '<p style="color:#666;font-size:14px">' + nomOrga + (orga.email_contact ? " — " + orga.email_contact : "") + "</p>"
    + "</div>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cleResend, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: nomOrga + " <" + EXPEDITEUR_MAIL_DOMAINE + ">",
      to: [email],
      reply_to: orga.email_contact || undefined,
      subject: "Rappel : votre séance de demain, " + quand,
      html,
    }),
  });

  if (trace) {
    await supabase.from("sms_envoyes").update({ statut: r.ok ? "envoye" : "echec", erreur: r.ok ? null : (await r.text()).slice(0, 400) }).eq("id", trace.id);
  }
}
