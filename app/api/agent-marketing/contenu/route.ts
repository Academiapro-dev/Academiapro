```typescript
// app/api/agent-marketing/contenu/article-blog/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ArticleBlogRequest {
  domaine: string;
  formation: {
    id: string;
    titre: string;
    url: string;
    description: string;
  };
  motsCles: string[];
  tonalite?: "professionnel" | "accessible" | "inspirant";
  langue?: "fr" | "en";
}

export async function POST(request: NextRequest) {
  try {
    const body: ArticleBlogRequest = await request.json();
    const {
      domaine,
      formation,
      motsCles,
      tonalite = "professionnel",
      langue = "fr",
    } = body;

    if (!domaine || !formation || !motsCles?.length) {
      return NextResponse.json(
        {
          error: "Paramètres manquants : domaine, formation et motsCles requis",
        },
        { status: 400 }
      );
    }

    const prompt = `Tu es un expert en rédaction SEO et en formation IA pour AcadémIA Pro.

Génère un article de blog SEO complet en ${langue === "fr" ? "français" : "anglais"} sur le domaine : "${domaine}".

FORMATION ASSOCIÉE :
- Titre : ${formation.titre}
- Description : ${formation.description}
- URL : ${formation.url}

MOTS CLÉS À INTÉGRER NATURELLEMENT : ${motsCles.join(", ")}

TONALITÉ : ${tonalite}

STRUCTURE OBLIGATOIRE (minimum 1500 mots) :
1. H1 : Titre principal accrocheur avec mot clé principal
2. Introduction engageante (150-200 mots) avec hook émotionnel
3. H2 : Section 1 - Problématique / Context (300 mots)
   - H3 sous-sections si nécessaire
   - Liste à puces pertinente
4. H2 : Section 2 - Solutions / Approches (400 mots)
   - H3 sous-sections
   - Exemples concrets chiffrés
5. H2 : Section 3 - Mise en pratique / Conseils experts (400 mots)
   - H3 sous-sections
   - Étapes actionnables
6. H2 : Section 4 - Cas d'usage / Résultats (200 mots)
   - Chiffres et statistiques
7. Conclusion synthétique (150 mots)
8. CTA final vers : ${formation.url}

RÈGLES SEO :
- Mot clé principal dans H1, premier paragraphe, H2 principal, conclusion
- Mots clés secondaires répartis naturellement
- Paragraphes courts (3-4 lignes max)
- Méta-description de 155 caractères à la fin
- Slug URL suggéré

LIEN INTERNE OBLIGATOIRE : Intègre naturellement un lien contextuel vers "${formation.url}" avec le texte d'ancrage approprié.

FORMAT DE RÉPONSE JSON :
{
  "metaDescription": "string (155 chars max)",
  "slugUrl": "string",
  "titre": "string",
  "tempsLecture": "string",
  "contenu": "string (markdown complet)",
  "motsClesIntegres": ["array"],
  "scoreSeoPredictif": number (0-100),
  "suggestions": ["array d'améliorations possibles"]
}`;

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";

          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              fullContent += chunk.delta.text;
              const data = JSON.stringify({
                type: "delta",
                content: chunk.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          const finalMessage = await stream.finalMessage();
          const completionData = JSON.stringify({
            type: "complete",
            usage: finalMessage.usage,
            metadata: {
              domaine,
              formation: formation.id,
              generatedAt: new Date().toISOString(),
              model: "claude-opus-4-5",
            },
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[ARTICLE-BLOG] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'article" },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/agent-marketing/contenu/newsletter/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface NewsletterRequest {
  type: "hebdomadaire_prospects" | "mensuelle_apprenants";
  segment: {
    nom: string;
    interets: string[];
    niveauIA: "debutant" | "intermediaire" | "avance";
    formations?: string[];
  };
  contenu: {
    conseilIA?: string;
    nouvelleFormation?: {
      titre: string;
      url: string;
      prix: number;
      promotion?: number;
    };
    temoignage?: {
      prenom: string;
      resultat: string;
    };
    offre?: {
      description: string;
      reduction: number;
      deadline: string;
    };
  };
  personnalisation: {
    prenom?: string;
    entreprise?: string;
    objectif?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: NewsletterRequest = await request.json();
    const { type, segment, contenu, personnalisation } = body;

    if (!type || !segment) {
      return NextResponse.json(
        { error: "Paramètres manquants : type et segment requis" },
        { status: 400 }
      );
    }

    const isHebdomadaire = type === "hebdomadaire_prospects";
    const prenomVariable = personnalisation?.prenom || "{{PRENOM}}";

    const prompt = `Tu es un expert en email marketing et copywriting pour AcadémIA Pro, plateforme de formation IA.

Génère une ${isHebdomadaire ? "newsletter hebdomadaire pour prospects" : "newsletter mensuelle pour apprenants actifs"} hautement personnalisée.

SEGMENT CIBLE :
- Niveau IA : ${segment.niveauIA}
- Intérêts : ${segment.interets.join(", ")}
- Formations suivies : ${segment.formations?.join(", ") || "Aucune encore"}

PERSONNALISATION :
- Prénom : ${prenomVariable}
- Entreprise : ${personnalisation?.entreprise || "Non spécifiée"}
- Objectif principal : ${personnalisation?.objectif || "Progresser en IA"}

ÉLÉMENTS À INTÉGRER :
${contenu.conseilIA ? `• Conseil IA : ${contenu.conseilIA}` : "• Inclure un conseil IA actionnable adapté au niveau"}
${
  contenu.nouvelleFormation
    ? `• Nouvelle formation : "${contenu.nouvelleFormation.titre}" - ${contenu.nouvelleFormation.prix}€${contenu.nouvelleFormation.promotion ? ` (promo -${contenu.nouvelleFormation.promotion}%)` : ""} - URL: ${contenu.nouvelleFormation.url}`
    : ""
}
${contenu.temoignage ? `• Témoignage de ${contenu.temoignage.prenom} : "${contenu.temoignage.resultat}"` : "• Générer un témoignage inspirant pertinent"}
${contenu.offre ? `• Offre spéciale : ${contenu.offre.description} - ${contenu.offre.reduction}% de réduction jusqu'au ${contenu.offre.deadline}` : ""}

STRUCTURE EMAIL (format HTML + texte) :
1. Objet principal (max 50 chars) - TEST A/B avec 3 variantes
2. Pré-header (max 100 chars)
3. En-tête personnalisé avec prénom
4. Accroche émotionnelle (2-3 lignes)
5. Section "Conseil IA de la semaine/du mois"
6. Section "Formation spotlight" avec bouton CTA
7. Section "Success story" (témoignage)
8. Section offre/promotion si applicable
9. Footer avec liens et désinscription

RÈGLES COPYWRITING :
- Ton : ${isHebdomadaire ? "enthousiaste et motivant pour prospects" : "expert et bienveillant pour apprenants"}
- Utiliser "vous" formel mais chaleureux
- 1 seul CTA principal fort
- Personnalisation profonde avec {{PRENOM}}, {{ENTREPRISE}}, {{OBJECTIF}}
- Urgence subtile sans pression excessive

FORMAT JSON DE RÉPONSE :
{
  "objetEmail": {
    "principal": "string",
    "varianteB": "string",
    "varianteC": "string"
  },
  "preHeader": "string",
  "contenuHTML": "string",
  "contenuTexte": "string",
  "ctaPrincipal": {
    "texte": "string",
    "url": "string"
  },
  "variablesDynamiques": ["{{PRENOM}}", "{{ENTREPRISE}}"],
  "scoreEngagementPredictif": number,
  "meilleurMomentEnvoi": "string",
  "segmentRecommande": "string"
}`;

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({
                type: "delta",
                content: chunk.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          const finalMessage = await stream.finalMessage();
          const completionData = JSON.stringify({
            type: "complete",
            usage: finalMessage.usage,
            metadata: {
              newsletterType: type,
              segment: segment.nom,
              generatedAt: new Date().toISOString(),
            },
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[NEWSLETTER] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la newsletter" },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/agent-marketing/contenu/temoignage/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface TemoignageRequest {
  formation: {
    id: string;
    titre: string;
    domaine: string;
    duree: string;
    competencesAcquises: string[];
  };
  profil: {
    secteurActivite: string;
    niveauPoste: "junior" | "mid" | "senior" | "dirigeant";
    tailleEntreprise?: "startup" | "pme" | "etl" | "grand_groupe";
  };
  plateformes: ("texte" | "video_script" | "linkedin")[];
  nombreTemoignages?: number;
  objectifConversion?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TemoignageRequest = await request.json();
    const {
      formation,
      profil,
      plateformes,
      nombreTemoignages = 3,
      objectifConversion,
    } = body;

    if (!formation || !profil || !plateformes?.length) {
      return NextResponse.json(
        { error: "Paramètres manquants : formation, profil et plateformes requis" },
        { status: 400 }
      );
    }

    const prompt = `Tu es un expert en marketing de preuve sociale et en psychologie de la conversion pour AcadémIA Pro.

Génère ${nombreTemoignages} témoignages ultra-crédibles et authentiques pour la formation "${formation.titre}".

FORMATION :
- Domaine : ${formation.domaine}
- Durée : ${formation.duree}
- Compétences acquises : ${formation.competencesAcquises.join(", ")}

PROFIL CIBLE :
- Secteur d'activité : ${profil.secteurActivite}
- Niveau de poste : ${profil.niveauPoste}
- Taille d'entreprise : ${profil.tailleEntreprise || "variée"}

OBJECTIF DE CONVERSION : ${objectifConversion || "Augmenter les inscriptions à la formation"}

PLATEFORMES DEMANDÉES : ${plateformes.join(", ")}

POUR CHAQUE TÉMOIGNAGE, GÉNÈRE :

1. FICHE IDENTITÉ :
- Prénom réaliste (diversité : mix genres/origines)
- Profession spécifique dans le secteur
- Âge approximatif
- Entreprise fictive crédible

2. FORMAT TEXTE (si demandé) :
- 150-200 mots
- Contexte AVANT (problème/défi)
- Expér