import { mesurer } from "../../../lib/usageIA";
// app/api/emailing/route.ts — Agent Emailing connecté à CAM
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

// DEUX AXES, ET C EST VOULU.
//
// AXE 1 — LE TYPE. La PROSPECTION part d un sous-domaine dedie : si une
// campagne se fait mal noter, la reputation du domaine principal n est pas
// touchee, et les courriels que les clients ATTENDENT — inscription,
// certificat, facture — continuent d arriver.
//
// AXE 2 — LE PRODUIT. Un cabinet comptable ne doit pas recevoir un message
// signe d une academie de formation. L expediteur, l adresse de reponse ET
// le contenu genere suivent donc le produit.
//
// Personne ne releve la boite des sous-domaines de prospection : le reply_to
// ramene donc toujours les reponses vers une adresse reelle.

const PRODUITS: Record<string, any> = {
  academia: {
    marque: "AcadémIA Pro",
    site: "academiapro.fr",
    prospection: "Jacques Lalou <jacques@contact-pro.academiapro.fr>",
    client: "AcadémIA Pro <contact@academiapro.fr>",
    reponse: "contact@academiapro.fr",
    metier: "la formation professionnelle",
    cible: "un responsable de formation ou un dirigeant",
  },
  comptable: {
    marque: "Mr. Comptable",
    site: "mrcomptable.fr",
    prospection: "Jacques Lalou <jacques@contact-pro.mrcomptable.fr>",
    client: "Mr. Comptable <contact@mrcomptable.fr>",
    reponse: "contact@mrcomptable.fr",
    metier: "la tenue comptable et les declarations fiscales",
    cible: "un expert-comptable ou un responsable de cabinet",
  },
};

const TYPES_PROSPECTION = ["prospection", "relance", "newsletter"];

function produitDe(valeur: any) {
  const cle = String(valeur || "academia").trim().toLowerCase();
  return PRODUITS[cle] ? cle : "academia";
}

async function appel_claude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  mesurer("emailing", data);
  return data.content[0].text || "";
}

async function envoyer_email(
  type: string,
  produit: string,
  destinataire: string,
  sujet: string,
  corps: string
) {
  const p = PRODUITS[produit] || PRODUITS.academia;
  const prospection = TYPES_PROSPECTION.indexOf(String(type)) >= 0;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: prospection ? p.prospection : p.client,
      reply_to: p.reponse,
      to: destinataire,
      subject: sujet,
      html: corps.replace(/\n/g, "<br/>"),
    }),
  });
  return res.ok;
}

async function sauver_email(
  type: string,
  destinataire: string,
  sujet: string,
  corps: string,
  envoye: boolean
) {
  await supabase.from("emails_automatiques").insert({
    type, destinataire, sujet, corps,
    envoye: envoye,
    created_at: new Date().toISOString(),
  });
}

async function generer_campagne(
  type: string,
  produit: string,
  contexte: any
): Promise<{ sujet: string; corps: string }> {
  const p = PRODUITS[produit] || PRODUITS.academia;

  // INTERDICTIONS ABSOLUES. Le modele contourne les consignes vagues par des
  // formules generiques — « les retours de nos utilisateurs », « nos clients
  // constatent ». Devant un professionnel du chiffre, une allegation
  // invérifiable coute la credibilite de tout le message.
  const system = `Tu es l Agent Emailing de ${p.marque}, qui edite un logiciel pour ${p.metier}. Tu ecris a ${p.cible}, au nom de Jacques Lalou, fondateur, a la premiere personne du singulier.

INTERDICTIONS ABSOLUES, sans exception :
- Ne jamais evoquer des utilisateurs, clients ou temoignages existants, meme de facon vague ou anonyme. Pas de « nos utilisateurs », « nos clients », « les retours du terrain », « beaucoup de cabinets ».
- Ne jamais citer de chiffre, de pourcentage, de duree de gain, de classement ni de statistique.
- Ne jamais promettre un resultat.
- Ne jamais mentionner une certification, un agrement ou un label.
- Ne jamais citer une autre marque que ${p.marque}.
- Ne jamais inventer un contact anterieur, une demande ou un echange qui n a pas eu lieu.

Style : direct, sobre, professionnel, chaleureux sans familiarite. Signature : Jacques Lalou, ${p.marque}. Pas de guillemets doubles. Pas de markdown.`;

  const prompts: Record<string, string> = {
    prospection: `Redige un PREMIER courriel de prise de contact a froid pour ${p.marque}. Le destinataire ne te connait pas et n a jamais rien demande : n invente aucun historique.
Nom: ${contexte.nom || "Madame, Monsieur"}
Sujet: ${contexte.formation || "notre solution"}
Court — dix lignes au maximum. Dis qui tu es, ce que fait l outil concretement, et propose un echange bref. Termine par ${p.site}. Aucune pression, aucune urgence artificielle.
Format: SUJET: xxx\n\nCORPS: xxx`,

    bienvenue: `Redige un email de bienvenue pour un nouvel inscrit sur ${p.marque}.
Prénom: ${contexte.prenom || "cher client"}
Offre: ${contexte.formation || "votre acces"}
Inclus: accueil chaleureux, acces a la plateforme, prochaines etapes, contact support.
Format: SUJET: xxx\n\nCORPS: xxx`,

    relance: `Redige une relance pour un prospect qui a DEJA ete en contact avec ${p.marque} et n a pas donne suite. N invente rien d autre sur cet echange.
Nom: ${contexte.nom || "cher prospect"}
Sujet d interet: ${contexte.formation || "notre solution"}
Inclus: rappel de ce que fait l outil, proposition d echange, CTA vers ${p.site}. Pas d urgence artificielle.
Format: SUJET: xxx\n\nCORPS: xxx`,

    remotivation: `Redige un email de remotivation pour un utilisateur de ${p.marque} inactif depuis ${contexte.jours || 7} jours.
Prénom: ${contexte.prenom || "cher client"}
Offre: ${contexte.formation || "votre acces"}
Progression: ${contexte.progression || "en cours"}
Inclus: encouragement, rappel des objectifs, offre d aide, CTA reprendre.
Format: SUJET: xxx\n\nCORPS: xxx`,

    certification: `Redige un email de felicitations pour un apprenant de ${p.marque} qui vient d obtenir son attestation de suivi.
Prénom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Inclus: felicitations chaleureuses, ce que l attestation atteste, suite recommandee.
Format: SUJET: xxx\n\nCORPS: xxx`,

    newsletter: `Redige une newsletter mensuelle pour ${p.marque}.
Mois: ${contexte.mois || new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
Nouveautes: ${contexte.nouvelles_formations || "nouveautes du mois"}
Inclus: actualites, conseil pratique, CTA vers ${p.site}.
Format: SUJET: xxx\n\nCORPS: xxx`,

    rappel_classe: `Redige un email de rappel pour une classe virtuelle ${p.marque}.
Prénom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Date: ${contexte.date || "demain"}
Heure: ${contexte.heure || "14h00"}
Inclus: rappel, lien de connexion, preparation, contact formateur.
Format: SUJET: xxx\n\nCORPS: xxx`,
  };

  const prompt = prompts[type] || prompts.bienvenue;
  const texte = await appel_claude(system, prompt);

  const lignes = texte.split("\n");
  let sujet = "";
  let corps = "";
  let in_corps = false;

  for (const ligne of lignes) {
    if (ligne.startsWith("SUJET:")) {
      sujet = ligne.replace("SUJET:", "").trim();
    } else if (ligne.startsWith("CORPS:")) {
      corps = ligne.replace("CORPS:", "").trim();
      in_corps = true;
    } else if (in_corps) {
      corps += "\n" + ligne;
    }
  }

  if (!sujet) sujet = `${p.marque} — ${type}`;
  if (!corps) corps = texte;

  return { sujet, corps: corps.trim() };
}

async function stats_emailing() {
  const { data } = await supabase.from("emails_automatiques").select("type,envoye");
  if (!data) return {};
  const total = data.length;
  const envoyes = data.filter(e => e.envoye).length;
  const par_type = data.reduce((acc: any, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  return { total, envoyes, en_attente: total - envoyes, par_type };
}

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels des sites de la maison.
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const DOMAINES = ["academiapro.fr", "mrcomptable.fr", "vercel.app", "localhost"];
  const appelLegitime = DOMAINES.some(function (d) {
    return origineApp.includes(d) || referentApp.includes(d);
  });
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generer") {
      const { type, contexte, envoyer } = body;
      const produit = produitDe(body.produit);
      const p = PRODUITS[produit];

      const { sujet, corps } = await generer_campagne(type, produit, contexte || {});

      let ok = false;
      if (envoyer && contexte?.email) {
        ok = await envoyer_email(type, produit, contexte.email, sujet, corps);
      }

      // On enregistre le statut REEL de l envoi, pas une valeur figee :
      // sans cela les statistiques annoncent zero envoi alors que tout part.
      await sauver_email(type, contexte?.email || p.reponse, sujet, corps, ok);

      if (envoyer && contexte?.email) {
        return NextResponse.json({
          succes: true,
          sujet,
          corps,
          envoye: ok,
          produit: produit,
          expediteur: TYPES_PROSPECTION.indexOf(String(type)) >= 0 ? p.prospection : p.client,
        });
      }

      return NextResponse.json({ succes: true, sujet, corps, envoye: false, produit: produit });
    }

    if (action === "stats") return NextResponse.json(await stats_emailing());

    if (action === "liste") {
      const { data } = await supabase.from("emails_automatiques").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_emailing());
}
