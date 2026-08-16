import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// LA RELANCE AUTOMATIQUE DES PROSPECTS DU CRM.
//
// CONSTRUITE MAIS ENDORMIE. Tant que ACTIVE vaut false, la route lit,
// calcule, et ne poste rien : elle renvoie ce qu elle AURAIT envoye. On
// peut donc l eprouver sans risque, et l ouvrir le jour ou les premiers
// messages auront montre qu ils sont bien recus.
//
// POURQUOI CETTE PRUDENCE. Le domaine d envoi a quinze jours d existence
// et sept messages a son actif. Une relance mal tournee partie toute seule
// ne se rattrape pas : une reputation abimee ne se repare pas, elle se
// remplace par un autre domaine.
//
// CHAQUE PROSPECT PORTE AUSSI SON PROPRE INTERRUPTEUR — la colonne
// relance_auto. Meme la route ouverte, seuls ceux qu on a marques sont
// relances. Deux verrous valent mieux qu un.
//
// TROIS CORRECTIONS DU 16/08, apres lecture de l apercu reel.
//
// (1) LE LIEN DE DESINSCRIPTION MANQUAIT. La campagne organismes en met un
// dans chaque message, celle-ci n en avait aucun. C est ce qui rend la
// prospection B2B licite sans consentement prealable, et c est aussi ce
// qui protege le domaine : un destinataire qui ne peut pas se desabonner
// clique sur « spam », et c est bien pire.
//
// (2) L OBJET ETAIT FIGE : « Suite a votre demande » serait parti a des
// gens qui n ont jamais rien demande — un prospect importe, un contact
// pris en salon. L objet s adapte desormais a ce qu on sait de lui.
//
// (3) L ENCODAGE DES ACCENTS. L apercu rendait « suite Ã  votre » : le
// charset n etait declare nulle part. Il l est maintenant dans l en-tete
// de la requete ET dans le corps HTML du message.
const ACTIVE = false;

// Le delai avant relance, et le nombre maximum de relances par prospect.
// Trois messages sans reponse suffisent : au-dela, on insiste.
const JOURS_AVANT_RELANCE = 7;
const RELANCES_MAX = 2;
const LOT = 5;

const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.academiapro.fr>";
const REPONSE = "contact@academiapro.fr";
const SITE = "https://academiapro.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// LE JETON DE DESINSCRIPTION EST SIGNE, comme celui de la campagne
// organismes : sans signature, n importe qui pourrait desinscrire
// n importe quelle adresse en devinant l URL.
function jetonDesinscription(email: string) {
  const secret = process.env.CRON_SECRET || "";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(String(email).toLowerCase())
    .digest("hex")
    .slice(0, 24);
  return encodeURIComponent(String(email)) + "." + signature;
}

// L OBJET S ADAPTE A CE QU ON SAIT DU PROSPECT.
//
// « Suite a votre demande » ne vaut que pour quelqu un qui a effectivement
// demande quelque chose — un formulaire, un chat, un webinaire. Pour un
// contact importe ou venu d ailleurs, c est faux, et un objet faux se
// paie en signalements.
function objetPour(p: any): string {
  const source = String(p.source || "").toLowerCase();
  const demande = ["formulaire", "chat", "webinaire"].indexOf(source) >= 0;

  if (demande && p.formation_interesse) {
    return "Suite à votre demande sur " + p.formation_interesse;
  }
  if (demande) {
    return "Suite à votre demande";
  }
  if (p.formation_interesse) {
    return "Votre projet de formation " + p.formation_interesse;
  }
  return "Votre projet de formation";
}

async function redigerRelance(p: any): Promise<string | null> {
  const cle = process.env.ANTHROPIC_API_KEY || "";
  if (!cle) return null;

  const contexte = [
    "Nom : " + (p.nom || "inconnu"),
    p.formation_interesse ? "Interesse par : " + p.formation_interesse : "",
    p.domaine ? "Domaine : " + p.domaine : "",
    p.source ? "Venu par : " + p.source : "",
    p.notes ? "Notes : " + p.notes : "",
    p.relances ? "Deja relance " + p.relances + " fois" : "Jamais relance",
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: "Redige une relance courte a ce prospect d un organisme "
            + "de formation. Trois paragraphes au maximum. Pas de formule "
            + "commerciale creuse, pas de point d exclamation. Tutoiement "
            + "interdit : vouvoiement. Termine par une question simple a "
            + "laquelle il peut repondre en une ligne.\n\n"
            + "N invente aucun chiffre, aucun tarif, aucune date de session, "
            + "aucun temoignage. Ne promets aucun resultat. Si tu ne sais "
            + "pas quelque chose, ne l ecris pas.\n\n"
            + "Ne rends que le corps du message, sans objet ni signature.\n\n"
            + contexte,
        }],
      }),
    });

    const d = await r.json();
    if (!r.ok || !d.content || !d.content[0]) return null;
    return String(d.content[0].text || "").trim() || null;
  } catch (e) {
    return null;
  }
}

async function envoyer(destinataire: string, sujet: string, texte: string) {
  const lien = SITE + "/desinscription?jeton=" + jetonDesinscription(destinataire);

  // Le charset est declare DANS le document : sans lui, certains clients
  // de messagerie rendent « suite Ã  votre » au lieu de « suite à votre ».
  const html = '<!DOCTYPE html><html lang="fr"><head>'
    + '<meta charset="utf-8"/>'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
    + '</head><body style="margin:0;padding:0;background:#ffffff;">'
    + '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.75;'
    + 'color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">'
    + texte.replace(/\n/g, "<br/>")
    + '<br/><br/>Jacques Lalou<br/>AcadémIA Pro<br/>'
    + '<a href="' + SITE + '" style="color:#8a6d3b;">academiapro.fr</a>'
    + '<hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0 14px;"/>'
    + '<p style="font-size:12px;color:#888;line-height:1.6;margin:0;">'
    + 'Vous recevez ce message parce que vous avez été en contact avec AcadémIA Pro. '
    + '<a href="' + lien + '" style="color:#888;">Ne plus recevoir de messages</a>.'
    + '</p></div></body></html>';

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      reply_to: REPONSE,
      to: destinataire,
      subject: sujet,
      html: html,
      // L en-tete standard que les messageries lisent pour proposer le
      // desabonnement d un clic, avant meme d ouvrir le message.
      headers: {
        "List-Unsubscribe": "<" + lien + ">",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  return r.ok;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  const limite = new Date();
  limite.setDate(limite.getDate() - JOURS_AVANT_RELANCE);

  // QUI EST RELANCE : un prospect qui a une adresse, qui n est ni client ni
  // perdu, qui n est pas desinscrit, qui n a pas donne signe depuis le
  // delai, et qui n a pas deja ete relance trop souvent.
  const { data: cibles, error } = await supabase
    .from("crm")
    .select("id, nom, email, statut, score, source, domaine, formation_interesse, notes, relances, derniere_interaction, relance_auto")
    .not("email", "is", null)
    .not("statut", "in", "(client,perdu)")
    .not("desinscrit", "is", true)
    .eq("relance_auto", true)
    .lt("derniere_interaction", limite.toISOString())
    .or("relances.is.null,relances.lt." + RELANCES_MAX)
    .order("score", { ascending: false })
    .limit(LOT);

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({
      active: ACTIVE,
      info: "aucun prospect a relancer",
    });
  }

  const apercu: any[] = [];
  let envoyes = 0;

  for (const p of cibles) {
    const texte = await redigerRelance(p);
    if (!texte) continue;

    const sujet = objetPour(p);

    // MODE ENDORMI : on montre ce qui partirait, on n envoie rien.
    if (!ACTIVE) {
      apercu.push({
        nom: p.nom,
        email: p.email,
        score: p.score,
        relances_deja: p.relances || 0,
        objet: sujet,
        message: texte,
      });
      continue;
    }

    // MARQUAGE AVANT ENVOI, comme pour la campagne : si l appel echoue, la
    // ligne porte deja son compteur et ne sera pas reprise deux fois.
    await supabase
      .from("crm")
      .update({
        relances: (p.relances || 0) + 1,
        relance_le: new Date().toISOString(),
      })
      .eq("id", p.id);

    const ok = await envoyer(String(p.email), sujet, texte);

    if (ok) envoyes++;
    await pause(2000);
  }

  return NextResponse.json({
    active: ACTIVE,
    examines: cibles.length,
    envoyes: ACTIVE ? envoyes : 0,
    apercu: ACTIVE ? undefined : apercu,
    note: ACTIVE
      ? undefined
      : "Route endormie : rien n a ete envoye. Passer ACTIVE a true pour ouvrir.",
  });
}
