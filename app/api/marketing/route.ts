import { mesurer } from "../../../lib/usageIA";
// app/api/marketing/route.ts — Agent Marketing connecté à CAM
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

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
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  mesurer("marketing", data);
  return data.content[0].text || "";
}

// 🚨 LES CONSIGNES DE CET AGENT ONT ETE REECRITES LE 25/08.
//
// CE QUI A ETE RETIRE, ET POURQUOI :
//
// 1. « PLATEFORME DE FORMATION 100% IA ». La formule dit exactement ce
//    qu il ne faut pas dire a un organisme de formation : que le contenu
//    sort d une machine. Ce qui se vend, c est un catalogue et une
//    plateforme ; la facon dont ils ont ete produits ne regarde personne.
//
// 2. « SOCIAL PROOF » dans la landing page. C etait une commande de
//    temoignages a une machine qui n en a aucun : elle les inventait.
//    Douze articles de blog ont du etre reecrits le 25/08 pour cette
//    raison exacte — Sophie la coach, Marc le plombier, Camille l ancienne
//    banquiere, tous inventes, tous publies.
//
// 3. LE PRIX DE 1400 EUR EN DUR. Aucun prix ne s affiche publiquement,
//    c est une decision de strategie commerciale.
//
// 🚨 LA CONSIGNE LA PLUS IMPORTANTE EST CELLE SUR LES CHIFFRES. Ces
// modeles produisent des statistiques fausses avec un aplomb parfait :
// « selon une etude McKinsey de janvier 2026, 12 % des taches... ». La
// source existe, le chiffre est invente, et un lecteur qui verifie ne
// croit plus rien du reste. INTERDIRE LES CHIFFRES EST PLUS SUR QUE
// DEMANDER DE LES VERIFIER.
const SYSTEM_MARKETING = `Tu es l Agent Marketing d AcadémIA Pro, editeur d une plateforme de formation et d un catalogue de formations professionnelles.

REGLES ABSOLUES, sans exception :
- AUCUN chiffre, AUCUN pourcentage, AUCUNE statistique. Tu ne disposes d aucune source verifiable : tout chiffre que tu produirais serait invente.
- AUCUN temoignage, AUCUN avis client, AUCUN nom de personne. Aucune formule du type nos clients, nos apprenants, ils temoignent.
- AUCUN prix, AUCUN montant, AUCUNE mention de tarif.
- AUCUN nom de concurrent.
- AUCUNE mention de la facon dont les contenus sont produits.
- AUCUNE promesse de resultat, de delai ou de gain de temps chiffre.
- AUCUNE affirmation absolue du type le seul, aucun autre, unique sur le marche.

CE QUI REMPLACE CES ELEMENTS : le probleme concret du lecteur, decrit avec precision, et ce que la plateforme lui permet de faire.

LE SUJET DE CHAQUE PHRASE EST LE CLIENT, jamais l editeur.

Vouvoiement. Style direct, phrases courtes. Pas de guillemets doubles. Pas de markdown.

Chaque phrase doit se lire du point de vue de quelqu un qui cherche une raison de ne pas signer.`;

async function generer_contenu(type: string, contexte: any): Promise<string> {
  const prompts: Record<string, string> = {
    landing_page: `Redige le texte complet d une landing page pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Public cible: ${contexte.cible || "professionnels"}
Inclus: titre principal, sous-titre, trois benefices concrets decrits sans chiffre, une section sur ce que la plateforme ne fait pas, un appel a l action, une FAQ de trois questions.
Rappel: aucun temoignage, aucun chiffre, aucun prix.`,

    pub_google: `Redige 3 annonces Google Ads pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Format: Titre 1 (30 car max) | Titre 2 (30 car max) | Description (90 car max)
Rappel: aucun chiffre, aucun prix, aucune promesse de resultat.`,

    pub_meta: `Redige 2 publicites Meta Ads pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Public: ${contexte.cible || "professionnels en activite"}
Inclus: accroche, texte principal, appel a l action. Ton direct, ancre sur une situation reelle.
Rappel: aucun chiffre, aucun temoignage, aucun prix.`,

    article_seo: `Redige un article pour le blog d AcadémIA Pro.
Sujet: ${contexte.sujet || "formation professionnelle"}
Mot cle principal: ${contexte.mot_cle || "formation"}
Longueur: 600 mots. Structure: titre, introduction, trois sections, conclusion.
Le mot cle apparait naturellement, jamais repete artificiellement.
Rappel: aucune statistique, aucune source citee, aucun temoignage, aucun concurrent nomme.`,

    strategie: `Cree une strategie marketing pour AcadémIA Pro.
Objectif: ${contexte.objectif || "obtenir les premiers clients"}
Periode: ${contexte.periode || "3 mois"}
Inclus: canaux prioritaires et pourquoi, actions concretes par canal, ce qu il faut mesurer, planning mensuel.
Ce document est interne : les chiffres de budget fournis en contexte peuvent y figurer, mais aucune statistique de marche inventee.`,

    tunnel_vente: `Cree un tunnel de vente pour AcadémIA Pro.
Formation: ${contexte.formation || "nos formations"}
Inclus: etape 1 attraction, etape 2 consideration, etape 3 decision, etape 4 fidelisation. Actions et messages pour chaque etape.
Ce document est interne. Les messages destines aux prospects ne comportent ni chiffre, ni temoignage, ni prix.`,
  };

  const prompt = prompts[type] || prompts.strategie;
  return await appel_claude(SYSTEM_MARKETING, prompt);
}

async function stats_marketing() {
  const { data } = await supabase.from("marketing").select("type,statut,canal");
  if (!data) return {};
  const total = data.length;
  const par_type = data.reduce((acc: any, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});
  return { total, par_type };
}

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels du site
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
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
      const { type, contexte } = body;
      const contenu = await generer_contenu(type, contexte || {});

      // 🚨 STATUT BROUILLON, TOUJOURS. Rien de ce qui sort d ici ne part
      // sans relecture — doctrine du 24/08 : « je prefere qu il n y ait
      // pas d articles plutot que des articles qui agissent contre moi ».
      await supabase.from("marketing").insert({
        type,
        titre: `${type} — ${new Date().toLocaleDateString("fr-FR")}`,
        contenu,
        canal: contexte?.canal || type,
        cible: contexte?.cible || "",
        statut: "brouillon",
      });

      return NextResponse.json({ succes: true, contenu });
    }

    if (action === "stats") return NextResponse.json(await stats_marketing());

    if (action === "liste") {
      const { data } = await supabase.from("marketing").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err
