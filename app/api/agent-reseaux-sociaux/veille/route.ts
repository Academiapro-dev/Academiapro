// app/api/agent-reseaux-sociaux/veille/tendances/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface TendanceIA {
  hashtag: string;
  volume: number;
  croissance: string;
  categorie: "IA" | "formation" | "bien-être" | "tech";
  plateforme: string[];
  sujetViral: string;
  pertinenceAcademIA: number;
}

interface NouvelleAnthropic {
  titre: string;
  description: string;
  date: string;
  impact: "majeur" | "modéré" | "mineur";
  opportuniteContenu: string;
}

interface TendancesResponse {
  hashtags: TendanceIA[];
  sujetsVirauxSemaine: string[];
  nouvellesAnthropic: NouvelleAnthropic[];
  actuFormationFrance: string[];
  scoreOpportunite: number;
  synthese: string;
  recommandationsImmédiates: string[];
  generatedAt: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "7j";
    const plateformes = searchParams.get("plateformes") || "linkedin,twitter,instagram";

    const prompt = `Tu es un expert en veille stratégique des réseaux sociaux pour AcadémIA Pro, 
    une plateforme française de formation professionnelle utilisant l'IA (Claude d'Anthropic).
    
    Génère une analyse complète des tendances actuelles pour la période: ${periode}
    Plateformes surveillées: ${plateformes}
    
    Contexte AcadémIA Pro:
    - Plateforme de formation professionnelle IA
    - Public cible: professionnels français 25-45 ans
    - Valeurs: innovation, accessibilité, bien-être au travail
    - Différenciateur: utilisation de Claude (Anthropic) pour personnaliser les parcours
    
    Génère une réponse JSON structurée avec:
    {
      "hashtags": [
        {
          "hashtag": "#string",
          "volume": number (estimé),
          "croissance": "+X%",
          "categorie": "IA|formation|bien-être|tech",
          "plateforme": ["linkedin", "twitter"],
          "sujetViral": "description du sujet viral associé",
          "pertinenceAcademIA": number (0-100)
        }
      ],
      "sujetsVirauxSemaine": ["sujet1", "sujet2", ...],
      "nouvellesAnthropic": [
        {
          "titre": "string",
          "description": "string",
          "date": "string",
          "impact": "majeur|modéré|mineur",
          "opportuniteContenu": "string"
        }
      ],
      "actuFormationFrance": ["actualité1", "actualité2", ...],
      "scoreOpportunite": number (0-100),
      "synthese": "analyse narrative complète",
      "recommandationsImmédiates": ["action1", "action2", ...]
    }
    
    Sois précis, actionnable et focalisé sur les opportunités réelles pour AcadémIA Pro.
    Inclus minimum 10 hashtags trending, 5 sujets viraux, 3 nouvelles Anthropic, 5 actus formation France.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Réponse Claude invalide");
    }

    // Extraction JSON depuis la réponse Claude
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Format JSON non trouvé dans la réponse");
    }

    const tendancesData = JSON.parse(jsonMatch[0]) as Omit<
      TendancesResponse,
      "generatedAt"
    >;

    const response: TendancesResponse = {
      ...tendancesData,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        metadata: {
          periode,
          plateformes: plateformes.split(","),
          modelUtilise: "claude-opus-4-5",
          tokensUtilises: message.usage.input_tokens + message.usage.output_tokens,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur veille tendances:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'analyse des tendances",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/agent-reseaux-sociaux/veille/concurrents/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface PostConcurrent {
  plateforme: string;
  typeContenu: string;
  sujet: string;
  engagement: {
    likes: number;
    commentaires: number;
    partages: number;
    tauxEngagement: string;
  };
  formatUtilise: string;
  performanceEstimee: "haute" | "moyenne" | "faible";
  leconPourAcademIA: string;
}

interface ProduitConcurrent {
  nom: string;
  typeOffre: string;
  prixEstime: string;
  dateDetection: string;
  menaceNiveau: "haute" | "moyenne" | "faible";
  differenciationAcademIA: string;
}

interface AnalyseConcurrent {
  nom: string;
  scorePresenceSociale: number;
  frequencePublication: string;
  formatsPrivilegies: string[];
  sujetsRecurrents: string[];
  postsPerformants: PostConcurrent[];
  nouveauxProduits: ProduitConcurrent[];
  strategieDetectee: string;
  pointsFaibles: string[];
  pointsForts: string[];
  alerteNiveau: "urgent" | "attention" | "normal";
  recommandationReponse: string;
}

interface ConccurrentsResponse {
  concurrents: AnalyseConcurrent[];
  syntheseGlobale: string;
  tendancesCommunes: string[];
  opportunitesDifferenciation: string[];
  alertesPrioritaires: string[];
  scoreCompetitiviteAcademIA: number;
  generatedAt: string;
}

const CONCURRENTS_CIBLES = [
  {
    nom: "Jobescape",
    description: "Plateforme IA orientation et transition professionnelle",
    positionnement: "Reconversion professionnelle assistée par IA",
  },
  {
    nom: "Ottho",
    description: "Assistant IA pour la formation en entreprise",
    positionnement: "LMS intelligent et personnalisé",
  },
  {
    nom: "Exploria",
    description: "Plateforme d'exploration de carrières avec IA",
    positionnement: "Découverte métiers et compétences futures",
  },
  {
    nom: "360Learning",
    description: "Plateforme collaborative learning avec IA",
    positionnement: "Formation collaborative en entreprise",
  },
  {
    nom: "Babbel for Business",
    description: "Formation linguistique IA",
    positionnement: "Langues professionnelles",
  },
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const concurrent = searchParams.get("concurrent");
    const focus = searchParams.get("focus") || "all"; // posts, produits, engagement

    const concurrentsAAnalyser = concurrent
      ? CONCURRENTS_CIBLES.filter(
          (c) => c.nom.toLowerCase() === concurrent.toLowerCase()
        )
      : CONCURRENTS_CIBLES;

    const prompt = `Tu es un expert en intelligence concurrentielle pour AcadémIA Pro.
    
    Analyse approfondie des concurrents sur les réseaux sociaux.
    Focus demandé: ${focus}
    
    AcadémIA Pro - Contexte:
    - Formation professionnelle IA avec Claude (Anthropic)
    - Marché: France, B2C et B2B
    - Plateformes actives: LinkedIn, Twitter/X, Instagram, YouTube
    - USP: Personnalisation poussée via Claude, bien-être intégré, accompagnement humain
    
    Concurrents à analyser:
    ${JSON.stringify(concurrentsAAnalyser, null, 2)}
    
    Pour chaque concurrent, génère une analyse JSON complète:
    {
      "concurrents": [
        {
          "nom": "string",
          "scorePresenceSociale": number (0-100),
          "frequencePublication": "X posts/semaine",
          "formatsPrivilegies": ["carousel", "vidéo", "article", ...],
          "sujetsRecurrents": ["sujet1", "sujet2", ...],
          "postsPerformants": [
            {
              "plateforme": "linkedin",
              "typeContenu": "string",
              "sujet": "string",
              "engagement": {
                "likes": number,
                "commentaires": number,
                "partages": number,
                "tauxEngagement": "X%"
              },
              "formatUtilise": "string",
              "performanceEstimee": "haute|moyenne|faible",
              "leconPourAcademIA": "string actionnable"
            }
          ],
          "nouveauxProduits": [
            {
              "nom": "string",
              "typeOffre": "string",
              "prixEstime": "string",
              "dateDetection": "string",
              "menaceNiveau": "haute|moyenne|faible",
              "differenciationAcademIA": "string"
            }
          ],
          "strategieDetectee": "description narrative",
          "pointsFaibles": ["faiblesse1", "faiblesse2"],
          "pointsForts": ["force1", "force2"],
          "alerteNiveau": "urgent|attention|normal",
          "recommandationReponse": "action recommandée pour AcadémIA Pro"
        }
      ],
      "syntheseGlobale": "analyse narrative",
      "tendancesCommunes": ["tendance1", "tendance2"],
      "opportunitesDifferenciation": ["opportunité1", "opportunité2"],
      "alertesPrioritaires": ["alerte1", "alerte2"],
      "scoreCompetitiviteAcademIA": number (0-100)
    }
    
    Sois précis, basé sur des patterns réels du marché EdTech IA français.
    Identifie clairement les menaces et opportunités concrètes.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Réponse Claude invalide");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Format JSON non trouvé");
    }

    const concurrentsData = JSON.parse(jsonMatch[0]) as Omit<
      ConccurrentsResponse,
      "generatedAt"
    >;

    // Filtrage des alertes urgentes
    const alertesUrgentes = concurrentsData.concurrents
      .filter((c) => c.alerteNiveau === "urgent")
      .map((c) => ({
        concurrent: c.nom,
        alerte: c.recommandationReponse,
        alertesProduits: c.nouveauxProduits.filter(
          (p) => p.menaceNiveau === "haute"
        ),
      }));

    const response: ConccurrentsResponse = {
      ...concurrentsData,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        alertesUrgentes,
        metadata: {
          concurrentsAnalyses: concurrentsAAnalyser.map((c) => c.nom),
          focus,
          modelUtilise: "claude-opus-4-5",
          tokensUtilises:
            message.usage.input_tokens + message.usage.output_tokens,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur veille concurrents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'analyse concurrentielle",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/agent-reseaux-sociaux/veille/opportunites/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface OpportuniteContenu {
  id: string;
  type:
    | "sujet_non_couvert"
    | "format_viral"
    | "mot_cle_trending"
    | "moment_opportun";
  titre: string;
  description: string;
  urgence: "immédiate" | "24h" | "semaine";
  potentielViral: number; // 0-100
  effort: "faible" | "moyen" | "élevé";
  plateforme: string[];
  formatRecommande: string;
  angleEditorial: string;
  hookSuggere: string;
  motsClesAssocies: string[];
  expirationEstimee: string;
  raisonOpportunite: string;
  exempleContenu: string;
  metriquesEstimees: {
    porteeEstimee: string;
    engagementPrevu: string;
    leadsPotentiels: number;
  };
}

interface MomentPublicationOptimal {
  plateforme: string;
  joursOptimaux: string[];
  heuresOptimales: string[];
  justification: string;
  contexteActuel: string;