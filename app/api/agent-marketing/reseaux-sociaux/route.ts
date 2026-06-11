import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type Platform = "LinkedIn" | "Instagram" | "Facebook" | "TikTok" | "YouTube";

interface PublicationPayload {
  platform: Platform;
  topic: string;
  tone?: string;
  user_id: string;
  academy_id?: string;
}

interface GeneratedPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  call_to_action: string;
  recommended_schedule: string;
  character_count: number;
}

interface Publication {
  id: string;
  user_id: string;
  academy_id: string | null;
  platform: Platform;
  topic: string;
  tone: string;
  content: string;
  hashtags: string[];
  call_to_action: string;
  recommended_schedule: string;
  character_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const PLATFORM_CONFIGS: Record<
  Platform,
  {
    maxChars: number;
    style: string;
    hashtagCount: number;
    emojiIntensity: string;
  }
> = {
  LinkedIn: {
    maxChars: 3000,
    style:
      "professionnel, inspirant, axé sur la valeur éducative et le développement personnel",
    hashtagCount: 5,
    emojiIntensity: "modéré",
  },
  Instagram: {
    maxChars: 2200,
    style:
      "visuel, engageant, storytelling émotionnel, communautaire et inspirant",
    hashtagCount: 15,
    emojiIntensity: "élevé",
  },
  Facebook: {
    maxChars: 63206,
    style:
      "conversationnel, accessible, orienté communauté et partage de valeur",
    hashtagCount: 8,
    emojiIntensity: "modéré",
  },
  TikTok: {
    maxChars: 2200,
    style:
      "dynamique, viral, accrocheur dès la première ligne, tendance et authentique",
    hashtagCount: 10,
    emojiIntensity: "très élevé",
  },
  YouTube: {
    maxChars: 5000,
    style:
      "descriptif, SEO optimisé, informatif avec timestamps et ressources utiles",
    hashtagCount: 6,
    emojiIntensity: "faible",
  },
};

function generatePostContent(
  platform: Platform,
  topic: string,
  tone: string
): GeneratedPost {
  const config = PLATFORM_CONFIGS[platform];

  const contentTemplates: Record<Platform, string> = {
    LinkedIn: `🎓 Transformez votre avenir avec AcadémIA Pro

${topic} — voici ce que personne ne vous dit vraiment.

Dans un monde où l'apprentissage évolue à vitesse grand V, maîtriser ${topic} n'est plus une option, c'est une nécessité absolue.

Voici les 3 vérités que j'aurais aimé connaître plus tôt :

✅ La pratique surpasse toujours la théorie pure
✅ L'accompagnement personnalisé accélère votre progression de 300%
✅ La communauté d'apprenants est votre plus grand atout

Chez AcadémIA Pro, nous avons révolutionné l'approche pédagogique en combinant l'intelligence artificielle et l'expertise humaine pour vous offrir une expérience d'apprentissage sur mesure.

Ton : ${tone}

Qu'est-ce qui vous a le plus challengé dans votre parcours d'apprentissage sur ${topic} ? Partagez en commentaire 👇`,

    Instagram: `✨ POV: Tu découvres enfin comment maîtriser ${topic} 🚀

Le secret que les meilleurs apprenants utilisent ? Une méthode structurée + un accompagnement IA personnalisé 🤖💡

Avec AcadémIA Pro, tu ne suis plus des cours. Tu VIS une transformation.

🔥 Ce que tu vas gagner :
→ Des compétences concrètes sur ${topic}
→ Un mentor IA disponible 24h/24
→ Une communauté qui te booste chaque jour
→ Des résultats mesurables dès la première semaine

La différence entre ceux qui réussissent et les autres ? Ils passent à l'action MAINTENANT.

Ton ${tone} pour avancer : commence par 15 minutes par jour. Juste 15 minutes. 🎯

Sauvegarde ce post pour te rappeler de te lancer ! 🔖

Tague un ami qui veut progresser sur ${topic} 👇`,

    Facebook: `🎓 AcadémIA Pro — L'académie qui change des vies

Bonjour la communauté ! 

Aujourd'hui, parlons de ${topic} — un sujet qui passionne et qui transforme vraiment les parcours professionnels et personnels.

Nous sommes nombreux à vouloir progresser, mais la vraie question est : comment apprendre efficacement sans perdre des mois en tâtonnements ?

La réponse : une approche personnalisée guidée par l'IA.

Chez AcadémIA Pro, nous croyons que chaque apprenant est unique. C'est pourquoi notre plateforme analyse votre profil, vos objectifs et votre rythme pour créer un parcours sur mesure autour de ${topic}.

Ton : ${tone}

📚 Ce que nos membres disent :
"J'ai progressé plus en 3 semaines avec AcadémIA Pro qu'en 6 mois en autodidacte"

Vous souhaitez en savoir plus ? Commentez "INFO" et nous vous envoyons tous les détails ! 

Partagez ce post si vous connaissez quelqu'un qui cherche à se former sur ${topic} 🙏`,

    TikTok: `⚡ ATTENDS — Si tu scrolles, tu rates ça sur ${topic}

Non mais sérieusement... 🤯

Tu sais ce qui sépare les gens qui MAÎTRISENT ${topic} de ceux qui galèrent encore dans 5 ans ?

Une seule chose. LA MÉTHODE.

Et chez AcadémIA Pro, on a codé cette méthode avec l'IA pour que toi, tu la comprennes en quelques semaines max.

POV : tu dans 30 jours ✅
→ Tu maîtrises ${topic}
→ Tu impressionnes ton entourage  
→ Tu te demandes pourquoi t'as pas commencé avant

Ton ${tone} du jour : passe à l'action maintenant, pas demain 🎯

Commente "JE VEUX" si tu veux le lien gratuit 🔥

Suis le compte pour plus de pépites comme ça 💎`,

    YouTube: `📚 Maîtrisez ${topic} avec AcadémIA Pro — Guide Complet 2024

Dans cette vidéo, nous explorons en profondeur ${topic} et comment notre approche pédagogique basée sur l'IA révolutionne l'apprentissage.

Ton de la vidéo : ${tone}

⏱️ TIMESTAMPS :
00:00 - Introduction et présentation
02:30 - Pourquoi ${topic} est essentiel aujourd'hui
07:15 - La méthode AcadémIA Pro expliquée
14:00 - Démonstration pratique et cas concrets
22:45 - Résultats de nos apprenants
28:00 - Comment commencer gratuitement
32:00 - Questions / Réponses

🎯 CE QUE VOUS APPRENDREZ :
• Les fondamentaux de ${topic} expliqués simplement
• Les erreurs les plus courantes et comment les éviter
• La roadmap complète pour progresser rapidement
• Les outils recommandés par nos experts

📌 RESSOURCES MENTIONNÉES :
• Accès gratuit AcadémIA Pro : [lien en description]
• Guide PDF téléchargeable : [lien en description]
• Notre communauté privée : [lien en description]

N'oubliez pas de vous ABONNER et d'activer la 🔔 pour ne rater aucune formation gratuite !`,
  };

  const hashtagSets: Record<Platform, string[]> = {
    LinkedIn: [
      "#AcadémIAPro",
      "#Formation",
      "#ApprentissageIA",
      "#DéveloppementProfessionnel",
      "#Innovation",
    ],
    Instagram: [
      "#AcadémIAPro",
      "#Formation",
      "#ApprendreEnLigne",
      "#IA",
      "#Motivation",
      "#Succès",
      "#Apprentissage",
      "#Productivité",
      "#Coaching",
      "#Growth",
      "#Skills",
      "#Online",
      "#Education",
      "#Mindset",
      "#Goals",
    ],
    Facebook: [
      "#AcadémIAPro",
      "#Formation",
      "#ApprentissageEnLigne",
      "#IA",
      "#Education",
      "#Compétences",
      "#Carrière",
      "#Transformation",
    ],
    TikTok: [
      "#AcadémIAPro",
      "#Formation",
      "#ApprendreAvecTikTok",
      "#IA",
      "#Motivation",
      "#Skills",
      "#Growth",
      "#Viral",
      "#Trending",
      "#Education",
    ],
    YouTube: [
      "#AcadémIAPro",
      "#Formation",
      "#IntelligenceArtificielle",
      "#Tutoriel",
      "#ApprendreEnLigne",
      "#Education",
    ],
  };

  const ctaMap: Record<Platform, string> = {
    LinkedIn:
      "Connectez-vous avec moi pour en savoir plus sur AcadémIA Pro et commencez votre transformation gratuite aujourd'hui.",
    Instagram:
      "Clique sur le lien en bio pour ton accès gratuit à AcadémIA Pro ! 🔗",
    Facebook:
      "Commentez INFO pour recevoir tous les détails sur AcadémIA Pro directement en message privé !",
    TikTok:
      "Commente JE VEUX pour recevoir le lien gratuit vers AcadémIA Pro ! 🚀",
    YouTube:
      "Abonnez-vous et cliquez sur le lien en description pour commencer gratuitement sur AcadémIA Pro !",
  };

  const scheduleMap: Record<Platform, string> = {
    LinkedIn: "Mardi ou Mercredi entre 8h-10h ou 17h-19h",
    Instagram: "Lundi, Mercredi ou Vendredi entre 11h-13h ou 19h-21h",
    Facebook: "Mercredi ou Jeudi entre 13h-16h",
    TikTok: "Tous les jours entre 18h-22h, pic à 21h",
    YouTube: "Vendredi entre 14h-17h ou Samedi matin",
  };

  const content = contentTemplates[platform];

  return {
    platform,
    content: content.substring(0, config.maxChars),
    hashtags: hashtagSets[platform],
    call_to_action: ctaMap[platform],
    recommended_schedule: scheduleMap[platform],
    character_count: content.length,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { platform, topic, tone, user_id, academy_id } =
      body as PublicationPayload;

    if (!platform || !topic || !user_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Paramètres manquants : platform, topic et user_id sont requis",
          required_fields: ["platform", "topic", "user_id"],
        },
        { status: 400 }
      );
    }

    const validPlatforms: Platform[] = [
      "LinkedIn",
      "Instagram",
      "Facebook",
      "TikTok",
      "YouTube",
    ];

    if (!validPlatforms.includes(platform as Platform)) {
      return NextResponse.json(
        {
          success: false,
          error: `Plateforme invalide. Plateformes supportées : ${validPlatforms.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const resolvedTone = tone || "inspirant et professionnel";

    const generatedPost = generatePostContent(
      platform as Platform,
      topic,
      resolvedTone
    );

    const publicationData = {
      user_id,
      academy_id: academy_id || null,
      platform: generatedPost.platform,
      topic,
      tone: resolvedTone,
      content: generatedPost.content,
      hashtags: generatedPost.hashtags,
      call_to_action: generatedPost.call_to_action,
      recommended_schedule: generatedPost.recommended_schedule,
      character_count: generatedPost.character_count,
      status: "generated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: savedPublication, error: insertError } = await supabaseAdmin
      .from("publications")
      .insert(publicationData)
      .select()
      .single();

    if (insertError) {
      console.error("Erreur Supabase INSERT:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la sauvegarde de la publication",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Post ${platform} généré et sauvegardé avec succès pour AcadémIA Pro`,
        data: {
          publication: savedPublication,
          generated_content: generatedPost,
          platform_config: PLATFORM_CONFIGS[platform as Platform],
          metadata: {
            agent: "AcadémIA Pro Social Media Agent",
            version: "1.0.0",
            generated_at: new Date().toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/social-agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);