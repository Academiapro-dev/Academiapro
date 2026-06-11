// app/api/agent-marketing/meta-ads/generer-campagnes/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Audience {
  type: "cold" | "warm" | "hot" | "lookalike" | "retargeting";
  interets: string[];
  demographics: {
    ageMin: number;
    ageMax: number;
    profils: string[];
  };
  lookalike?: {
    pourcentage: number;
    source: string;
  };
  customAudience?: string;
}

interface CopyPublicitaire {
  accroche: string;
  corps: string;
  cta: string;
  format: "image" | "carrousel" | "video" | "stories";
  variante: string;
}

interface FormatCreatif {
  type: "image" | "carrousel" | "video" | "stories";
  specifications: {
    dimensions?: string;
    duree?: number;
    nbSlides?: number;
    style: string;
  };
  script?: string;
  texteVisuel?: string;
}

interface Campagne {
  id: string;
  nom: string;
  objectif: "AWARENESS" | "CONSIDERATION" | "CONVERSION" | "RETARGETING" | "LOOKALIKE";
  statut: "active" | "pause" | "draft";
  budget: {
    journalier: number;
    total: number;
    type: "CBO" | "ABO";
    optimisation: string;
  };
  audience: Audience;
  copies: CopyPublicitaire[];
  formats: FormatCreatif[];
  metriques: {
    roas: number;
    ctr: number;
    cpc: number;
    cpm: number;
    impressions: number;
    clics: number;
    conversions: number;
    depenses: number;
  };
  recommandations: string[];
  dateCreation: string;
  prochainOptimisation: string;
}

interface RapportMeta {
  periode: string;
  dateGeneration: string;
  resume: {
    depensesTotal: number;
    revenusTotal: number;
    roasGlobal: number;
    conversionsTotal: number;
    impressionsTotal: number;
    clicsTotal: number;
    ctrMoyen: number;
  };
  campagnes: Campagne[];
  alertes: string[];
  recommandationsStrategiques: string[];
  actionsAutomatiques: string[];
  prochainRapport: string;
}

// ============================================================
// DONNÉES MOCK META ADS (simulation API Meta)
// ============================================================

const MOCK_CAMPAGNES_EXISTANTES: Partial<Campagne>[] = [
  {
    id: "camp_001",
    nom: "AcadémIA - Awareness IA Formation",
    objectif: "AWARENESS",
    statut: "active",
    metriques: {
      roas: 0,
      ctr: 1.8,
      cpc: 0.45,
      cpm: 8.1,
      impressions: 125000,
      clics: 2250,
      conversions: 0,
      depenses: 1012.5,
    },
  },
  {
    id: "camp_002",
    nom: "AcadémIA - Consideration Visiteurs",
    objectif: "CONSIDERATION",
    statut: "active",
    metriques: {
      roas: 1.2,
      ctr: 0.8,
      cpc: 1.2,
      cpm: 9.6,
      impressions: 85000,
      clics: 680,
      conversions: 45,
      depenses: 816,
    },
  },
  {
    id: "camp_003",
    nom: "AcadémIA - Conversion Formations",
    objectif: "CONVERSION",
    statut: "active",
    metriques: {
      roas: 3.8,
      ctr: 2.1,
      cpc: 0.95,
      cpm: 19.95,
      impressions: 45000,
      clics: 945,
      conversions: 127,
      depenses: 897.75,
    },
  },
  {
    id: "camp_004",
    nom: "AcadémIA - Retargeting Panier Abandonné",
    objectif: "RETARGETING",
    statut: "active",
    metriques: {
      roas: 5.2,
      ctr: 3.4,
      cpc: 0.72,
      cpm: 24.48,
      impressions: 28000,
      clics: 952,
      conversions: 89,
      depenses: 685.44,
    },
  },
  {
    id: "camp_005",
    nom: "AcadémIA - Lookalike Apprenants 1%",
    objectif: "LOOKALIKE",
    statut: "active",
    metriques: {
      roas: 2.9,
      ctr: 1.6,
      cpc: 1.1,
      cpm: 17.6,
      impressions: 62000,
      clics: 992,
      conversions: 67,
      depenses: 1091.2,
    },
  },
];

// ============================================================
// GÉNÉRATEUR DE CAMPAGNES VIA CLAUDE
// ============================================================

async function genererCampagnesAvecClaude(): Promise<Campagne[]> {
  const prompt = `Tu es un expert Meta Ads spécialisé dans la publicité pour les plateformes d'e-learning et de formation en IA.

Génère 5 campagnes Meta Ads complètes pour AcadémIA Pro, une plateforme de formations en Intelligence Artificielle premium.

Pour CHAQUE campagne, génère en JSON strict :
{
  "campagnes": [
    {
      "id": "string unique",
      "nom": "string",
      "objectif": "AWARENESS|CONSIDERATION|CONVERSION|RETARGETING|LOOKALIKE",
      "statut": "active",
      "budget": {
        "journalier": number (€),
        "total": number (€ mensuel),
        "type": "CBO|ABO",
        "optimisation": "description stratégie budget"
      },
      "audience": {
        "type": "cold|warm|hot|lookalike|retargeting",
        "interets": ["liste intérêts Facebook précis"],
        "demographics": {
          "ageMin": number,
          "ageMax": number,
          "profils": ["types de profils ciblés"]
        },
        "lookalike": {"pourcentage": number, "source": "string"} ou null,
        "customAudience": "description audience personnalisée" ou null
      },
      "copies": [
        {
          "accroche": "texte accrocheur (<40 chars)",
          "corps": "corps du message persuasif (100-150 chars)",
          "cta": "Commencer gratuitement|Télécharger|S'inscrire|Découvrir",
          "format": "image|carrousel|video|stories",
          "variante": "A|B|C"
        }
      ],
      "formats": [
        {
          "type": "image|carrousel|video|stories",
          "specifications": {
            "dimensions": "string",
            "duree": number ou null,
            "nbSlides": number ou null,
            "style": "description visuelle détaillée"
          },
          "script": "script vidéo si applicable" ou null,
          "texteVisuel": "texte à afficher sur le visuel"
        }
      ],
      "metriques": {
        "roas": 0,
        "ctr": 0,
        "cpc": 0,
        "cpm": 0,
        "impressions": 0,
        "clics": 0,
        "conversions": 0,
        "depenses": 0
      },
      "recommandations": ["liste de recommandations spécifiques"],
      "dateCreation": "${new Date().toISOString()}",
      "prochainOptimisation": "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}"
    }
  ]
}

CAMPAGNES À CRÉER :
1. AWARENESS - Notoriété large (audience froide 25-55 ans, intérêt IA/tech)
2. CONSIDERATION - Visiteurs site web (retargeting 30 jours, engagement)
3. CONVERSION - Achats formations et packs (audience chaude, intention achat)
4. RETARGETING - Panier abandonné + visiteurs page tarif non convertis
5. LOOKALIKE - 1% similaire apprenants existants

PRODUITS AcadémIA Pro :
- Formation IA Fondamentaux : 297€
- Pack Expert IA : 597€
- Masterclass ChatGPT Business : 197€
- Formation Automatisation IA : 497€
- Certification IA Pro : 897€

Génère des copies TRÈS persuasives avec vraie urgence et preuve sociale.
Réponds UNIQUEMENT avec le JSON valide, sans markdown.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Réponse Claude invalide");
  }

  try {
    const parsed = JSON.parse(content.text);
    return parsed.campagnes as Campagne[];
  } catch {
    // Extraction JSON robuste
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.campagnes as Campagne[];
    }
    throw new Error("Impossible de parser le JSON généré par Claude");
  }
}

// ============================================================
// POST /api/agent-marketing/meta-ads/generer-campagnes
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { regenerer = false, objectifs } = body;

    console.log("[MetaAds Agent] Génération campagnes AcadémIA Pro...");

    // Génération via Claude
    const campagnesGenerees = await genererCampagnesAvecClaude();

    // Filtrage par objectifs si spécifié
    const campagnesFiltrees = objectifs
      ? campagnesGenerees.filter((c) => objectifs.includes(c.objectif))
      : campagnesGenerees;

    const response = {
      succes: true,
      agent: "Meta Ads Agent - AcadémIA Pro",
      action: regenerer ? "REGENERATION" : "CREATION",
      timestamp: new Date().toISOString(),
      nbCampagnes: campagnesFiltrees.length,
      campagnes: campagnesFiltrees,
      resume: {
        objectifsCibles: campagnesFiltrees.map((c) => c.objectif),
        budgetTotalJournalier: campagnesFiltrees.reduce(
          (acc, c) => acc + (c.budget?.journalier || 0),
          0
        ),
        budgetTotalMensuel: campagnesFiltrees.reduce(
          (acc, c) => acc + (c.budget?.total || 0),
          0
        ),
        formatsUtilises: [
          ...new Set(campagnesFiltrees.flatMap((c) => c.formats?.map((f) => f.type) || [])),
        ],
        nbCopiesTotales: campagnesFiltrees.reduce(
          (acc, c) => acc + (c.copies?.length || 0),
          0
        ),
      },
      prochainOptimisation: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      actionsDisponibles: [
        "POST /api/agent-marketing/meta-ads/optimiser",
        "GET /api/agent-marketing/meta-ads/rapport",
      ],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[MetaAds Agent] Erreur génération:", error);
    return NextResponse.json(
      {
        succes: false,
        erreur: "Erreur lors de la génération des campagnes",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/agent-marketing/meta-ads/optimiser/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// TYPES OPTIMISATION
// ============================================================

interface ActionOptimisation {
  campagneId: string;
  campagneNom: string;
  type:
    | "PAUSE_VISUEL"
    | "AJUSTER_BUDGET"
    | "NOUVELLE_COPY"
    | "PAUSE_CAMPAGNE"
    | "AUGMENTER_BUDGET"
    | "TESTER_AUDIENCE";
  raison: string;
  ancienneValeur?: string | number;
  nouvelleValeur?: string | number;
  priorite: "CRITIQUE" | "HAUTE" | "MOYENNE" | "BASSE";
  impact_estime: string;
  nouveauxCopies?: NouveauCopy[];
}

interface NouveauCopy {
  accroche: string;
  corps: string;
  cta: string;
  format: string;
  variante: string;
  raisonChangement: string;
}

interface ResultatOptimisation {
  campagneId: string;
  campagneNom: string;
  objectif: string;
  metriquesActuelles: {
    roas: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    depenses: number;
  };
  statut: "PERFORMANT" | "SOUS_PERFORMANT" | "CRITIQUE" | "EXCELLENT";
  score: number;
  actions: ActionOptimisation[];
  budgetRecommande: {
    actuel: number;
    recommande: number;
    variation: string;
    justification: string;
  };
}

// ============================================================
// DONNÉES MOCK PERFORMANCE
// ============================================================

const MOCK_PERFORMANCE = [
  {
    id: "camp_001",
    nom: "AcadémIA - Awareness IA Formation",
    objectif: "AWARENESS",
    metriques