import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Redacteur automatique : appele par le cron chaque lundi.
// Prend le prochain sujet 'a_faire', redige un article
// complet via Claude avec la voix de la marque du sujet.
//
// DEUX MARQUES, DEUX VOIX. Un sujet porte sa marque. La voix, l auteur,
// la categorie et les chemins de maillage en decoulent. Un article
// Mr. Comptable ne doit jamais paraitre sur le blog AcademIA Pro, ni
// tutoyer un cabinet.

export const maxDuration = 300;

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

const ANNEE = new Date().getFullYear();

const VOIX_ACADEMIA = `Nous sommes en ${ANNEE}. Toute reference temporelle doit utiliser ${ANNEE} ou au-dela, jamais une annee passee. Tu es le redacteur du blog AcademIA Pro,
plateforme francaise de formation professionnelle propulsee
par l IA (266 formations professionnelles : IA, business,
marketing, langues, bien-etre, tech), fondee par un auteur
et praticien expert en PNL, hypnose et psychanalyse.

TON STYLE :
- Tutoie le lecteur, ton chaleureux et direct
- Concret avant tout : exemples reels, chiffres, cas d usage
- Phrases courtes. Pas de jargon non explique.
- Bienveillant mais jamais mielleux : tu respectes
  l intelligence du lecteur
- Tu demystifies : l IA et la formation sont accessibles
  a tous, c est le message central

STRUCTURE OBLIGATOIRE :
- Introduction qui accroche par un probleme reel du lecteur
- 4 a 6 sections avec titres ## clairs
- Des passages en **gras** pour les points cles
- Une conclusion avec un pas concret a faire aujourd hui
- 900 a 1300 mots

REGLES :
- Jamais de promesses irrealistes ni de sensationnalisme
- Mentionner naturellement (sans forcer) qu AcademIA Pro
  propose des formations sur le sujet quand c est pertinent
- Contenu original et utile : le lecteur doit repartir
  avec de la valeur meme s il n achete rien

INTERDICTIONS ABSOLUES :
- Ne JAMAIS ecrire que les formations sont certifiantes,
  eligibles au CPF, a un OPCO ou a Transitions Pro, ni
  enregistrees au RNCP ou au Repertoire Specifique
- AcademIA Pro delivre SON PROPRE certificat, apres une
  evaluation exigeante : c est ainsi qu il faut le dire
- Ne JAMAIS presenter les seances comme therapeutiques ni
  promettre un resultat de sante

MAILLAGE INTERNE OBLIGATOIRE :
- Integre naturellement 2 a 3 liens internes au format
  markdown [texte du lien](/chemin) dans le corps de
  l article, la ou c est pertinent pour le lecteur
- Chemins autorises UNIQUEMENT : /formations (catalogue),
  /seances (seances d accompagnement), /tarifs,
  /classe-virtuelle, /faq, /essai-gratuit
- N invente JAMAIS d autre chemin ni d URL externe
- Le texte du lien decrit la destination (ex : [decouvre
  notre catalogue de formations](/formations)), jamais de
  "clique ici"`;

const VOIX_COMPTABLE = `Nous sommes en ${ANNEE}. Toute reference temporelle doit utiliser ${ANNEE} ou au-dela, jamais une annee passee. Tu es le redacteur du blog Mr. Comptable,
logiciel de comptabilite destine aux cabinets d expertise
comptable francais.

A QUI TU T ADRESSES :
- A un expert-comptable ou a un collaborateur de cabinet,
  pas a un chef d entreprise et pas a un particulier
- Ton lecteur connait son metier mieux que toi : tu ne lui
  expliques pas ce qu est un lettrage, tu lui parles de ce
  qui change et de ce que cela lui coute

TON STYLE :
- VOUVOIEMENT, toujours. Ton professionnel et sobre.
- Precis avant tout : dates, textes applicables, obligations
- Phrases courtes. Le vocabulaire technique du metier est
  acquis, celui de la reforme s explique.
- Jamais d enthousiasme commercial, jamais d emoji

STRUCTURE OBLIGATOIRE :
- Introduction qui pose l obligation ou le probleme concret
- 4 a 6 sections avec titres ## clairs
- Des passages en **gras** pour les points cles
- Une conclusion avec ce qu il y a a verifier ou preparer
- 900 a 1300 mots

REGLES :
- Jamais de promesses irrealistes ni de sensationnalisme
- Mentionner naturellement (sans forcer) que Mr. Comptable
  prend en charge le sujet quand c est pertinent
- Contenu original et utile : le lecteur doit repartir
  avec de la valeur meme s il n achete rien

INTERDICTIONS ABSOLUES :
- Ne JAMAIS ecrire que Mr. Comptable est une plateforme
  agreee : c est une solution compatible au sens de la
  reforme, le transport des factures est assure par une
  plateforme agreee a laquelle nous nous raccordons
- Ne JAMAIS citer le nom d un prestataire, d un partenaire
  ni d un editeur concurrent
- Ne JAMAIS donner de conseil fiscal ou juridique
  personnalise : tu decris la regle, tu ne l appliques pas
  a un cas
- Ne JAMAIS inventer de chiffre sur Mr. Comptable : ni
  nombre de cabinets, ni nombre de dossiers, ni gain de
  temps chiffre

MAILLAGE INTERNE OBLIGATOIRE :
- Integre naturellement 2 a 3 liens internes au format
  markdown [texte du lien](/chemin) dans le corps de
  l article, la ou c est pertinent pour le lecteur
- Chemins autorises UNIQUEMENT : /comptable (presentation
  du logiciel), /comptable/inscription (ouverture d un
  espace), /comptable/cgv (conditions generales)
- N invente JAMAIS d autre chemin ni d URL externe
- Le texte du lien decrit la destination (ex : [le detail
  de l offre](/comptable)), jamais de "cliquez ici"`;

const CATEGORIES_ACADEMIA = "Intelligence Artificielle,"
  + " Business, Bien-Etre, Formation Pro, Tech";

const CATEGORIES_COMPTABLE = "Facture electronique, Fiscalite,"
  + " Tenue comptable, Cabinet";

async function claude(prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  return data?.content?.[0]?.text || "";
}

function slugifier(titre: string): string {
  return titre.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  const supa = clientAdmin();

  // marque= permet de forcer la marque traitee. Sans ce parametre, on
  // prend le plus ancien sujet a faire, quelle que soit sa marque.
  const marqueDemandee = req.nextUrl.searchParams.get("marque");

  let requete = supa
    .from("blog_sujets")
    .select("*")
    .eq("statut", "a_faire");

  if (marqueDemandee) {
    requete = requete.eq("marque", marqueDemandee);
  }

  const { data: sujets } = await requete
    .order("id", { ascending: true })
    .limit(1);

  if (!sujets || sujets.length === 0) {
    return NextResponse.json(
      { message: "aucun sujet a traiter" });
  }
  const sujet = sujets[0];

  const estComptable = sujet.marque === "mrcomptable";

  const voix = estComptable ? VOIX_COMPTABLE : VOIX_ACADEMIA;
  const categories = estComptable
    ? CATEGORIES_COMPTABLE : CATEGORIES_ACADEMIA;
  const categorieDefaut = estComptable
    ? "Cabinet" : "Formation Pro";
  const auteur = estComptable ? "Mr. Comptable" : "AcademIA Pro";

  const prompt = voix
    + "\n\nSUJET DE L ARTICLE : " + sujet.titre
    + "\nANGLE : " + (sujet.angle || "libre")
    + "\nMOTS-CLES SEO a integrer naturellement : "
    + (sujet.mots_cles || "")
    + "\n\nReturn ONLY a JSON object, no markdown fences,"
    + " with exactly these keys:"
    + " titre (titre final accrocheur),"
    + " extrait (2 phrases qui donnent envie, max 200 car),"
    + " contenu (article complet, ## pour les titres,"
    + " ** pour le gras, sauts de ligne preserves),"
    + " categorie (une parmi : " + categories + ").";

  let brut = (await claude(prompt)).trim();
  if (brut.startsWith("```")) {
    brut = brut.split("```")[1] || brut;
    if (brut.startsWith("json")) brut = brut.slice(4);
  }

  let article: any;
  try {
    article = JSON.parse(brut);
  } catch {
    return NextResponse.json(
      { erreur: "reponse Claude non parsable",
        sujet: sujet.titre }, { status: 500 });
  }
  if (!article.titre || !article.contenu) {
    return NextResponse.json(
      { erreur: "cles manquantes",
        sujet: sujet.titre }, { status: 500 });
  }

  const { error: errInsert } = await supa.from("blog").insert({
    titre: article.titre,
    slug: slugifier(article.titre),
    extrait: article.extrait || "",
    contenu: article.contenu,
    categorie: article.categorie || categorieDefaut,
    auteur: auteur,
    marque: sujet.marque || "academiapro",
    publie: true,
  });
  if (errInsert) {
    return NextResponse.json(
      { erreur: "insertion blog", details: errInsert.message },
      { status: 500 });
  }

  await supa.from("blog_sujets")
    .update({ statut: "traite",
      traite_le: new Date().toISOString() })
    .eq("id", sujet.id);

  return NextResponse.json({
    redige: article.titre,
    marque: sujet.marque || "academiapro",
    statut: "publie",
  });
}
