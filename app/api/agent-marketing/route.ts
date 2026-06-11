import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PostsPayload {
  sujet: string;
  plateformes: string[];
  ton: string;
  nombrePosts: number;
  userId: string;
}

interface AdsPayload {
  produit: string;
  budget: number;
  cible: string;
  plateforme: string;
  duree: number;
  userId: string;
}

interface EbookPayload {
  titre: string;
  sujet: string;
  chapitres: string[];
  publicCible: string;
  userId: string;
}

interface WebinarPayload {
  titre: string;
  date: string;
  duree: number;
  intervenant: string;
  description: string;
  userId: string;
}

interface RapportPayload {
  periode: string;
  campagneId?: string;
  userId: string;
}

type ActionPayload =
  | PostsPayload
  | AdsPayload
  | EbookPayload
  | WebinarPayload
  | RapportPayload;

interface RequestBody {
  action: string;
  payload: ActionPayload;
}

function generatePostContent(sujet: string, plateforme: string, ton: string): string {
  const tones: Record<string, string> = {
    professionnel: "Dans un contexte professionnel,",
    inspirant: "Pour vous inspirer aujourd'hui,",
    educatif: "Saviez-vous que",
    humoristique: "On rigole mais sérieusement,"
  };

  const prefix = tones[ton] || "Découvrez comment";
  const platformFormats: Record<string, string> = {
    linkedin: `${prefix} ${sujet} transforme le monde des affaires. Partagez votre expérience en commentaire. #Marketing #AcadémIA`,
    twitter: `${prefix} ${sujet} change tout ! 🚀 #AcadémIA #Marketing`,
    instagram: `✨ ${prefix} ${sujet} ✨\n\nDécouvrez nos conseils exclusifs.\n\n#AcadémIA #Formation #Marketing`,
    facebook: `${prefix} ${sujet}. Rejoignez notre communauté AcadémIA Pro pour en savoir plus !`
  };

  return platformFormats[plateforme] || `${prefix} ${sujet}. #AcadémIA`;
}

async function handleGenererPosts(payload: PostsPayload) {
  const posts: object[] = [];
  const savedPosts: object[] = [];

  for (const plateforme of payload.plateformes) {
    for (let i = 0; i < payload.nombrePosts; i++) {
      const contenu = generatePostContent(payload.sujet, plateforme, payload.ton);

      const postData = {
        user_id: payload.userId,
        plateforme,
        contenu,
        sujet: payload.sujet,
        ton: payload.ton,
        statut: "brouillon",
        created_at: new Date().toISOString(),
        metadata: {
          generatedBy: "agent-marketing",
          index: i + 1
        }
      };

      const { data, error } = await supabase
        .from("publications_social")
        .insert(postData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur sauvegarde post Supabase: ${error.message}`);
      }

      posts.push({ plateforme, contenu, index: i + 1 });
      savedPosts.push(data);
    }
  }

  return {
    action: "generer-posts",
    success: true,
    totalPostsGeneres: savedPosts.length,
    posts,
    savedIds: savedPosts.map((p: any) => p.id),
    message: `${savedPosts.length} posts générés et sauvegardés avec succès`
  };
}

async function handleGenererAds(payload: AdsPayload) {
  const adVariants = [
    {
      titre: `Découvrez ${payload.produit} - Offre Exclusive`,
      description: `Ciblé pour ${payload.cible}. Budget optimisé de ${payload.budget}€ sur ${payload.duree} jours.`,
      cta: "En savoir plus",
      format: "image"
    },
    {
      titre: `${payload.produit} - Transformez votre quotidien`,
      description: `Solution idéale pour ${payload.cible}. Résultats garantis avec AcadémIA Pro.`,
      cta: "Commencer maintenant",
      format: "video"
    },
    {
      titre: `[Promo] ${payload.produit} à ne pas manquer`,
      description: `Offre limitée pour ${payload.cible}. Rejoignez des milliers d'utilisateurs satisfaits.`,
      cta: "Profiter de l'offre",
      format: "carousel"
    }
  ];

  const campagneData = {
    user_id: payload.userId,
    produit: payload.produit,
    plateforme: payload.plateforme,
    budget: payload.budget,
    cible: payload.cible,
    duree_jours: payload.duree,
    variantes_ads: adVariants,
    statut: "en_attente",
    budget_quotidien: Math.round(payload.budget / payload.duree),
    created_at: new Date().toISOString(),
    metadata: {
      generatedBy: "agent-marketing",
      nombreVariantes: adVariants.length
    }
  };

  const { data, error } = await supabase
    .from("campagnes_ads")
    .insert(campagneData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur sauvegarde campagne Supabase: ${error.message}`);
  }

  return {
    action: "generer-ads",
    success: true,
    campagneId: data.id,
    produit: payload.produit,
    plateforme: payload.plateforme,
    budgetTotal: payload.budget,
    budgetQuotidien: Math.round(payload.budget / payload.duree),
    duree: payload.duree,
    variantes: adVariants,
    message: `Campagne ads créée avec ${adVariants.length} variantes`
  };
}

async function handleGenererEbook(payload: EbookPayload) {
  const structure = {
    titre: payload.titre,
    sousTitre: `Guide complet pour ${payload.publicCible}`,
    introduction: `Ce guide a été conçu spécialement pour ${payload.publicCible} souhaitant maîtriser ${payload.sujet}.`,
    chapitres: payload.chapitres.map((chapitre, index) => ({
      numero: index + 1,
      titre: chapitre,
      contenu: `Dans ce chapitre, nous explorons en détail ${chapitre} et son impact sur ${payload.sujet}.`,
      sousSection: [
        `Introduction à ${chapitre}`,
        `Techniques avancées`,
        `Études de cas pratiques`,
        `Exercices et mises en pratique`
      ]
    })),
    conclusion: `En appliquant ces principes, ${payload.publicCible} pourra exceller dans ${payload.sujet}.`,
    ressources: [
      "Templates téléchargeables",
      "Checklist pratique",
      "Accès à la communauté AcadémIA Pro"
    ]
  };

  const ebookData = {
    user_id: payload.userId,
    plateforme: "ebook",
    contenu: JSON.stringify(structure),
    sujet: payload.sujet,
    ton: "educatif",
    statut: "genere",
    created_at: new Date().toISOString(),
    metadata: {
      generatedBy: "agent-marketing",
      type: "ebook",
      titre: payload.titre,
      publicCible: payload.publicCible,
      nombreChapitres: payload.chapitres.length
    }
  };

  const { data, error } = await supabase
    .from("publications_social")
    .insert(ebookData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur sauvegarde ebook Supabase: ${error.message}`);
  }

  return {
    action: "generer-ebook",
    success: true,
    ebookId: data.id,
    titre: payload.titre,
    nombreChapitres: payload.chapitres.length,
    structure,
    message: `Ebook "${payload.titre}" généré avec succès`
  };
}

async function handleConfigurerWebinaire(payload: WebinarPayload) {
  const webinarConfig = {
    titre: payload.titre,
    date: payload.date,
    dureeMinutes: payload.duree,
    intervenant: payload.intervenant,
    description: payload.description,
    agenda: [
      { temps: "0-5 min", activite: "Accueil et présentation" },
      { temps: "5-20 min", activite: `Introduction à ${payload.titre}` },
      { temps: "20-45 min", activite: "Contenu principal et démonstration" },
      { temps: "45-55 min", activite: "Questions / Réponses" },
      { temps: "55-60 min", activite: "Conclusion et appel à l'action" }
    ],
    emailSequence: [
      { delai: "J-7", objet: `Rappel : Webinaire "${payload.titre}" dans 7 jours` },
      { delai: "J-1", objet: `À demain ! Votre place est confirmée - ${payload.titre}` },
      { delai: "J+0", objet: `C'est aujourd'hui ! Le webinaire commence dans 1h` },
      { delai: "J+1", objet: `Replay disponible : ${payload.titre}` }
    ],
    lienInscription: `https://academia.pro/webinaire/${Date.now()}`,
    capaciteMax: 500
  };

  const webinarData = {
    user_id: payload.userId,
    plateforme: "webinaire",
    contenu: JSON.stringify(webinarConfig),
    sujet: payload.titre,
    ton: "professionnel",
    statut: "configure",
    created_at: new Date().toISOString(),
    metadata: {
      generatedBy: "agent-marketing",
      type: "webinaire",
      date: payload.date,
      intervenant: payload.intervenant
    }
  };

  const { data, error } = await supabase
    .from("publications_social")
    .insert(webinarData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur sauvegarde webinaire Supabase: ${error.message}`);
  }

  return {
    action: "configurer-webinaire",
    success: true,
    webinarId: data.id,
    configuration: webinarConfig,
    message: `Webinaire "${payload.titre}" configuré avec succès`
  };
}

async function handleRapport(payload: RapportPayload) {
  const postsQuery = supabase
    .from("publications_social")
    .select("*")
    .eq("user_id", payload.userId);

  const campagnesQuery = supabase
    .from("campagnes_ads")
    .select("*")
    .eq("user_id", payload.userId);

  if (payload.campagneId) {
    campagnesQuery.eq("id", payload.campagneId);
  }

  const [postsResult, campagnesResult] = await Promise.all([
    postsQuery,
    campagnesQuery
  ]);

  if (postsResult.error) {
    throw new Error(`Erreur récupération posts: ${postsResult.error.message}`);
  }

  if (campagnesResult.error) {
    throw new Error(`Erreur récupération campagnes: ${campagnesResult.error.message}`);
  }

  const posts = postsResult.data || [];
  const campagnes = campagnesResult.data || [];

  const statsByPlateforme: Record<string, number> = {};
  posts.forEach((post: any) => {
    const plateforme = post.plateforme || "inconnu";
    statsByPlateforme[plateforme] = (statsByPlateforme[plateforme] || 0) + 1;
  });

  const budgetTotal = campagnes.reduce((sum: number, c: any) => sum + (c.budget || 0), 0);

  const rapport = {
    periode: payload.periode,
    genereA: new Date().toISOString(),
    publications: {
      total: posts.length,
      parPlateforme: statsByPlateforme,
      parStatut: {
        brouillon: posts.filter((p: any) => p.statut === "brouillon").length,
        publie: posts.filter((p: any) => p.statut === "publie").length,
        genere: posts.filter((p: any) => p.statut === "genere").length,
        configure: posts.filter((p: any) => p.statut === "configure").length
      }
    },
    campagnes: {
      total: campagnes.length,
      budgetTotalInvesti: budgetTotal,
      parStatut: {
        en_attente: campagnes.filter((c: any) => c.statut === "en_attente").length,
        active: campagnes.filter((c: any) => c.statut === "active").length,
        terminee: campagnes.filter((c: any) => c.statut === "terminee").length
      },
      details: campagnes.map((c: any) => ({
        id: c.id,
        produit: c.produit,
        plateforme: c.plateforme,
        budget: c.budget,
        statut: c.statut,
        createdAt: c.created_at
      }))
    },
    recommandations: [
      posts.length < 5 ? "Augmentez votre fréquence de publications sociales" : null,
      campagnes.length === 0 ? "Lancez votre première campagne ads" : null,
      budgetTotal > 0 ? `Budget total investi en ads: ${budgetTotal}€` : "Aucun budget ads encore alloué",
      "Analysez vos meilleurs posts pour dupliquer le succès",
      "Planifiez un webinaire mensuel pour engager votre audience"
    ].filter(Boolean)
  };

  return {
    action: "rapport",
    success: true,
    rapport,
    message: `Rapport généré pour la période: ${payload.periode}`
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody