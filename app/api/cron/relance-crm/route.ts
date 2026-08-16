import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// LA RELANCE AUTOMATIQUE DES PROSPECTS DU CRM.
//
// ÉPROUVÉE LE 16/08, PUIS REFERMÉE. Un vrai message a été envoyé ce
// jour-là vers l'adresse de Jacques, et tout a été vérifié à l'écran :
// les accents s'affichent correctement dans le courriel, l'objet s'adapte
// à la source du prospect, le pied de page porte le lien de désinscription
// et ce lien est accepté par /desinscription.
//
// ⚠️ UN DÉTAIL À NE PAS MAL LIRE : l'aperçu JSON rendu dans le navigateur
// affiche « suite Ã  votre » — c'est la façon dont Vercel rend le JSON, pas
// un défaut du courriel. Le message reçu, lui, est impeccable. Ne pas
// « corriger » un encodage qui n'est cassé qu'à l'écran de contrôle.
//
// ELLE RESTE ENDORMIE. Tant que ACTIVE vaut false, la route lit, calcule,
// et ne poste rien : elle renvoie ce qu'elle AURAIT envoyé.
//
// POURQUOI CETTE PRUDENCE. Le domaine d'envoi a quinze jours d'existence
// et quelques messages à son actif. Une relance partie toute seule ne se
// rattrape pas : une réputation abîmée ne se répare pas, elle se remplace
// par un autre domaine. Et un rebond — un message vers une adresse
// inexistante — l'abîme autant qu'une plainte. C'est pourquoi on désarme
// les fiches d'essai avant tout envoi réel.
//
// CHAQUE PROSPECT PORTE AUSSI SON PROPRE INTERRUPTEUR — la colonne
// relance_auto. Même la route ouverte, seuls ceux qu'on a marqués sont
// relancés. Deux verrous valent mieux qu'un.
//
// CE QUI A ÉTÉ CORRIGÉ LE 16/08 :
//
// (1) LE LIEN DE DÉSINSCRIPTION MANQUAIT ENTIÈREMENT. C'est ce qui rend la
// prospection B2B licite sans consentement préalable, et ce qui protège le
// domaine : un destinataire qui ne peut pas se désabonner clique sur
// « spam », et c'est bien pire.
//
// ⚠️ LE FORMAT DU LIEN A ÉTÉ PRIS SUR LA PAGE ET LA ROUTE EXISTANTES, pas
// inventé. Trois détails qui l'auraient cassé s'ils avaient été devinés :
// /desinscription attend DEUX paramètres séparés — ?e=adresse&j=jeton — et
// non un jeton composé ; le secret est SESSION_SECRET, pas CRON_SECRET ; et
// le jeton fait 32 caractères, pas 24.
//
// (2) L'OBJET ÉTAIT FIGÉ : « Suite à votre demande » serait parti à des
// gens qui n'ont jamais rien demandé. Il s'adapte désormais à la source.
//
// (3) LE PROMPT INTERDIT MAINTENANT d'inventer un chiffre, un tarif, une
// date de session ou un témoignage — les mêmes règles que partout ailleurs.
const ACTIVE = false;

// Le délai avant relance, et le nombre maximum de relances par prospect.
// Trois messages sans réponse suffisent : au-delà, on insiste.
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

// LE JETON EST CALCULÉ EXACTEMENT COMME /api/desinscription L'ATTEND.
// Même secret, même algorithme, même longueur — toute différence et le
// lien serait rejeté au moment où quelqu'un veut s'en servir.
function lienDesinscription(email: string) {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const jeton = crypto
    .createHmac("sha256", secret)
    .update(String(email).toLowerCase())
    .digest("hex")
    .slice(0, 32);
  return SITE + "/desinscription?e=" + encodeURIComponent(String(email).toLowerCase())
    + "&j=" + jeton;
}

// L'OBJET S'ADAPTE À CE QU'ON SAIT DU PROSPECT.
//
// « Suite à votre demande » ne vaut que pour quelqu'un qui a effectivement
// demandé quelque chose — un formulaire, un chat, un webinaire. Pour un
// contact importé ou venu d'ailleurs, c'est faux, et un objet faux se
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
  const lien = lienDesinscription(destinataire);

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
      // L'en-tête standard que les messageries lisent pour proposer le
      // désabonnement d'un clic, avant même d'ouvrir le message.
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

  // QUI EST RELANCÉ : un prospect qui a une adresse, qui n'est ni client ni
  // perdu, qui n'est pas désinscrit, qui n'a pas donné signe depuis le
  // délai, et qui n'a pas déjà été relancé trop souvent.
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
  const partis: string[] = [];

  for (const p of cibles) {
    const texte = await redigerRelance(p);
    if (!texte) continue;

    const sujet = objetPour(p);

    // MODE ENDORMI : on montre ce qui partirait, on n'envoie rien.
    if (!ACTIVE) {
      apercu.push({
        nom: p.nom,
        email: p.email,
        score: p.score,
        relances_deja: p.relances || 0,
        objet: sujet,
        desinscription: lienDesinscription(String(p.email)),
        message: texte,
      });
      continue;
    }

    // MARQUAGE AVANT ENVOI, comme pour la campagne : si l'appel échoue, la
    // ligne porte déjà son compteur et ne sera pas reprise deux fois.
    await supabase
      .from("crm")
      .update({
        relances: (p.relances || 0) + 1,
        relance_le: new Date().toISOString(),
      })
      .eq("id", p.id);

    const ok = await envoyer(String(p.email), sujet, texte);

    if (ok) { envoyes++; partis.push(String(p.email)); }
    await pause(2000);
  }

  return NextResponse.json({
    active: ACTIVE,
    examines: cibles.length,
    envoyes: ACTIVE ? envoyes : 0,
    destinataires: ACTIVE ? partis : undefined,
    apercu: ACTIVE ? undefined : apercu,
    note: ACTIVE
      ? "ROUTE OUVERTE - des messages sont reellement partis. Remettre ACTIVE a false."
      : "Route endormie : rien n a ete envoye. Passer ACTIVE a true pour ouvrir.",
  });
}
