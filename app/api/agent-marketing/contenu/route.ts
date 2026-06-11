import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type ContentType = "article-blog" | "newsletter" | "temoignage" | "script-video";

interface GenerateContentRequest {
  type: ContentType;
  sujet: string;
  tonalite?: string;
  mots_cles?: string[];
  longueur?: "court" | "moyen" | "long";
  auteur_id?: string;
}

interface GeneratedContent {
  titre: string;
  contenu: string;
  meta_description?: string;
  tags?: string[];
}

function generateArticleBlog(sujet: string, mots_cles: string[], longueur: string): GeneratedContent {
  const titre = `Découvrez comment ${sujet} transforme votre apprentissage avec AcadémIA Pro`;

  const introduction = `Dans un monde où la formation continue devient indispensable, ${sujet} représente une opportunité unique de développer vos compétences. AcadémIA Pro vous accompagne dans cette démarche avec des outils pédagogiques innovants et une approche personnalisée.`;

  const developpement = longueur === "long"
    ? `L'intelligence artificielle révolutionne la manière dont nous abordons ${sujet}. Grâce aux algorithmes adaptatifs d'AcadémIA Pro, chaque apprenant bénéficie d'un parcours sur mesure qui s'ajuste en temps réel à ses besoins et à son niveau de maîtrise.\n\nLes études montrent que les apprenants utilisant des plateformes d'IA comme AcadémIA Pro progressent en moyenne 40% plus rapidement que ceux suivant des formations traditionnelles. Cette efficacité remarquable s'explique par la capacité du système à identifier les lacunes et à proposer des exercices ciblés.\n\nEn intégrant ${sujet} dans votre quotidien professionnel, vous découvrirez de nouvelles perspectives et opportunités. Les ${mots_cles.join(", ")} sont autant de compétences que vous développerez naturellement au fil de votre parcours.`
    : `Avec AcadémIA Pro, maîtriser ${sujet} devient accessible à tous. Notre plateforme utilise les dernières avancées en intelligence artificielle pour créer une expérience d'apprentissage unique et efficace. Les concepts liés aux ${mots_cles.join(", ")} sont présentés de manière progressive et intuitive.`;

  const conclusion = `Ne laissez pas passer cette opportunité de vous former sur ${sujet}. Rejoignez dès aujourd'hui la communauté AcadémIA Pro et commencez votre parcours vers l'excellence. Votre futur commence maintenant.`;

  const contenu = `${introduction}\n\n${developpement}\n\n${conclusion}`;

  return {
    titre,
    contenu,
    meta_description: `Apprenez tout sur ${sujet} avec AcadémIA Pro. Formation IA personnalisée, progression garantie. Découvrez notre approche innovante.`,
    tags: [...mots_cles, "formation", "IA", "académia-pro"],
  };
}

function generateNewsletter(sujet: string, mots_cles: string[], tonalite: string): GeneratedContent {
  const titre = `📚 AcadémIA Pro Newsletter — ${sujet} : Ce que vous devez savoir ce mois-ci`;

  const contenu = `Bonjour cher membre de la communauté AcadémIA Pro,

Nous espérons que votre parcours d'apprentissage se déroule à merveille. Ce mois-ci, nous mettons le focus sur ${sujet}, un domaine en pleine effervescence qui offre des opportunités exceptionnelles.

🔥 LES ACTUALITÉS DU MOIS

Notre équipe pédagogique a travaillé d'arrache-pied pour vous préparer les meilleurs contenus autour de ${sujet}. Vous trouverez cette semaine de nouveaux modules dédiés aux ${mots_cles.slice(0, 2).join(" et ")} dans votre espace personnel.

💡 LE CONSEIL D'EXPERT

Pour progresser efficacement sur ${sujet}, nos experts recommandent une pratique quotidienne de 20 à 30 minutes. La régularité prime sur l'intensité. AcadémIA Pro a d'ailleurs intégré de nouveaux rappels intelligents pour vous aider à maintenir cette cadence.

📊 VOS STATISTIQUES

Ce mois-ci, notre communauté a franchi le cap des 50 000 heures d'apprentissage cumulées. Chaque session contribue à améliorer nos algorithmes et donc votre expérience personnalisée.

🎯 DÉFI DU MOIS

Complétez le parcours dédié à ${sujet} avant la fin du mois et obtenez votre certification AcadémIA Pro. Partagez votre succès sur les réseaux avec le hashtag #AcadémIAPro.

À très bientôt pour de nouvelles aventures d'apprentissage,

L'équipe AcadémIA Pro`;

  return {
    titre,
    contenu,
    meta_description: `Newsletter AcadémIA Pro — Focus sur ${sujet} et les dernières actualités de votre plateforme de formation IA.`,
    tags: [...mots_cles, "newsletter", "formation-ia"],
  };
}

function generateTemoignage(sujet: string, mots_cles: string[]): GeneratedContent {
  const prenoms = ["Sophie M.", "Thomas B.", "Laure D.", "Karim A.", "Élodie P."];
  const profils = ["Développeuse Web", "Chef de Projet", "Consultante RH", "Entrepreneur", "Formatrice"];
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
  const profil = profils[Math.floor(Math.random() * profils.length)];

  const titre = `Témoignage : Comment ${prenom} a transformé sa carrière grâce à ${sujet} avec AcadémIA Pro`;

  const contenu = `"Avant de découvrir AcadémIA Pro, j'avais essayé plusieurs formations sur ${sujet} sans jamais vraiment progresser. Les cours classiques ne s'adaptaient pas à mon rythme ni à mes objectifs professionnels."

— ${prenom}, ${profil}

AVANT ACADÉMIA PRO

${prenom} passait des heures à chercher des ressources dispersées sur ${sujet}. "Je gaspillais un temps précieux à trier les informations pertinentes des informations obsolètes. Je ne savais pas par où commencer et je me décourageais rapidement."

Les concepts liés aux ${mots_cles.join(", ")} lui semblaient inaccessibles. "J'avais l'impression que ces sujets étaient réservés à une élite technique. Je ne me sentais pas légitime pour me former dans ce domaine."

LA DÉCOUVERTE D'ACADÉMIA PRO

"Un collègue m'a parlé d'AcadémIA Pro lors d'un événement professionnel. J'étais sceptique au départ, mais j'ai décidé de tester la version gratuite. Dès les premières heures, j'ai senti que cette approche était différente."

L'algorithme personnalisé a immédiatement identifié les points forts et les axes d'amélioration de ${prenom} concernant ${sujet}. "La plateforme m'a proposé un parcours qui correspondait exactement à mes besoins. C'était comme avoir un tuteur personnel disponible 24h/24."

LES RÉSULTATS APRÈS 3 MOIS

Après seulement 90 jours d'utilisation régulière d'AcadémIA Pro, ${prenom} a obtenu sa certification sur ${sujet} et a pu l'appliquer directement dans son travail quotidien.

"J'ai décroché une promotion grâce aux compétences développées sur AcadémIA Pro. Mon manager a été impressionné par ma montée en compétences sur ${sujet}. Je n'aurais jamais cru progresser aussi vite."

SON CONSEIL

"Ne perdez plus de temps avec des formations inadaptées. AcadémIA Pro comprend vraiment vos besoins et vous guide vers l'essentiel. Si vous voulez maîtriser ${sujet}, c'est la plateforme qu'il vous faut."

Note : 5/5 étoiles ⭐⭐⭐⭐⭐`;

  return {
    titre,
    contenu,
    meta_description: `Découvrez comment nos apprenants transforment leur carrière avec AcadémIA Pro. Témoignage authentique sur la formation ${sujet}.`,
    tags: [...mots_cles, "temoignage", "success-story", "formation"],
  };
}

function generateScriptVideo(sujet: string, mots_cles: string[], longueur: string): GeneratedContent {
  const duree = longueur === "court" ? "60 secondes" : longueur === "moyen" ? "3 minutes" : "5 minutes";
  const titre = `Script Vidéo AcadémIA Pro — ${sujet} [${duree}]`;

  const contenu = `=== SCRIPT VIDÉO ACADÉMIA PRO ===
SUJET : ${sujet}
DURÉE ESTIMÉE : ${duree}
FORMAT : Tutoriel / Présentation

--- INTRODUCTION (0:00 - 0:15) ---

[VISUEL : Logo AcadémIA Pro en animation, fond dégradé bleu profond]
[MUSIQUE : Jingle AcadémIA Pro, ton dynamique et inspirant]

VOIX OFF :
"Vous souhaitez maîtriser ${sujet} rapidement et efficacement ? Vous êtes au bon endroit. Je suis [Nom du présentateur] et avec AcadémIA Pro, nous allons révolutionner votre façon d'apprendre."

[VISUEL : Présentateur face caméra, environnement moderne et lumineux]

--- ACCROCHE PROBLÈME (0:15 - 0:35) ---

[VISUEL : Infographie animée montrant les obstacles classiques]

VOIX OFF :
"Combien de fois avez-vous commencé une formation sur ${sujet} sans aller jusqu'au bout ? Vous n'êtes pas seul. 73% des apprenants abandonnent leurs cours en ligne faute d'un accompagnement adapté."

[VISUEL : Statistiques animées, chiffres qui apparaissent progressivement]

--- PRÉSENTATION SOLUTION (0:35 - 1:30) ---

[VISUEL : Interface AcadémIA Pro en démonstration screen recording]

VOIX OFF :
"AcadémIA Pro change la donne avec une approche unique basée sur l'intelligence artificielle adaptative. Voici comment nous transformons votre apprentissage de ${sujet} :"

POINT 1 — [VISUEL : Animation icône personnalisation]
"Un parcours 100% personnalisé selon votre niveau et vos objectifs sur ${mots_cles[0] || sujet}."

POINT 2 — [VISUEL : Animation icône progression]
"Des exercices adaptatifs qui évoluent avec vous pour une progression constante sur ${mots_cles[1] || "vos compétences"}."

POINT 3 — [VISUEL : Animation icône communauté]
"Une communauté d'apprenants et des mentors experts disponibles pour vous guider."

--- DÉMONSTRATION (1:30 - 3:00) ---

[VISUEL : Screen recording de l'interface AcadémIA Pro]

VOIX OFF :
"Laissez-moi vous montrer concrètement comment fonctionne AcadémIA Pro pour apprendre ${sujet}."

[ACTION : Navigation dans le tableau de bord]
"Dès votre connexion, l'algorithme analyse votre profil et génère votre parcours personnalisé."

[ACTION : Démonstration d'un module sur sujet]
"Chaque leçon sur ${sujet} est construite selon les principes de la science cognitive pour maximiser la mémorisation."

[ACTION : Affichage des statistiques de progression]
"Suivez votre progression en temps réel et célébrez chaque étape franchie."

--- TÉMOIGNAGE RAPIDE (3:00 - 3:30) ---

[VISUEL : Photo/vidéo d'un apprenant satisfait]

"En 3 mois avec AcadémIA Pro, j'ai complètement maîtrisé ${sujet} et obtenu ma certification. C'est la meilleure décision que j'aie prise pour ma carrière."
— Extrait témoignage apprenant

--- CALL TO ACTION (3:30 - 4:00) ---

[VISUEL : Écran de présentation de l'offre avec bouton CTA]
[MUSIQUE : Crescendo motivant]

VOIX OFF :
"Rejoignez dès maintenant les 50 000 apprenants qui font confiance à AcadémIA Pro pour développer leurs compétences sur ${sujet} et bien plus encore."

[VISUEL : Offre d'essai gratuit en grand format]

"Commencez votre essai gratuit de 14 jours. Sans engagement. Sans carte bancaire. Lien en description."

--- OUTRO (4:00 - 4:15) ---

[VISUEL : Logo AcadémIA Pro, réseaux sociaux]

VOIX OFF :
"Abonnez-vous pour ne manquer aucun de nos conseils sur ${mots_cles.join(", ")} et activez la cloche. À très bientôt sur AcadémIA Pro !"

[MUSIQUE : Jingle de fin]

=== FIN DU SCRIPT ===

NOTES DE PRODUCTION :
- Résolution recommandée : 4K / 1080p
- Format : 16:9 pour YouTube, adapter en 9:16 pour Reels/TikTok
- Sous-titres : Obligatoires en français et anglais
- Hashtags : #AcadémIAPro #${sujet.replace(/\s+/g, "")} #FormationIA #ApprendreAvecIA`;

  return {
    titre,
    contenu,
    meta_description: `Script vidéo professionnel AcadémIA Pro sur ${sujet}. Contenu optimisé pour YouTube et réseaux sociaux.`,
    tags: [...mots_cles, "video", "script", "youtube", "contenu-video"],
  };
}

function generateContent(request: GenerateContentRequest): GeneratedContent {
  const {
    type,
    sujet,
    mots_cles = [],
    longueur = "moyen",
    tonalite = "professionnel",
  } = request;

  switch (type) {
    case "article-blog":
      return generateArticleBlog(sujet, mots_cles, longueur);
    case "newsletter":
      return generateNewsletter(sujet, mots_cles, tonalite);
    case "temoignage":
      return generate