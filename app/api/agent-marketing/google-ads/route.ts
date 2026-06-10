```typescript
// app/api/agent-marketing/google-ads/generer-campagnes/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface MotCle {
  texte: string;
  type: "exact" | "phrase" | "large" | "large_modifie";
  enchereMax?: number;
}

interface Annonce {
  id: string;
  titres: string[]; // max 15 titres, 30 chars chacun
  descriptions: string[]; // max 4 descriptions, 90 chars chacun
  urlFinale: string;
  urlAffichage?: string;
  statut: "active" | "pausee" | "en_revision";
  score?: number;
}

interface Extension {
  type: "lien_annexe" | "accroche" | "lieu" | "appel";
  contenu: string;
  description1?: string;
  description2?: string;
  urlFinale?: string;
}

interface Campagne {
  id: string;
  nom: string;
  type: "search" | "display" | "shopping";
  budget: number;
  strategieEnchere: "cpa_cible" | "roas_cible" | "maximiser_conversions";
  cpaCible?: number;
  roasCible?: number;
  motsCles: MotCle[];
  motsClesNegatifs: string[];
  annonces: Annonce[];
  extensions: Extension[];
  statut: "active" | "pausee" | "brouillon";
  dateCreation: string;
  metriques?: MetriquesCampagne;
}

interface MetriquesCampagne {
  impressions: number;
  clics: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number;
  coutTotal: number;
}

interface RapportGoogle {
  dateGeneration: string;
  periode: string;
  campagnes: CampagneRapport[];
  totaux: MetriquesCampagne;
  recommandations: string[];
  alertes: string[];
}

interface CampagneRapport {
  campagneId: string;
  nom: string;
  metriques: MetriquesCampagne;
  annoncesMeilleuresPerformances: string[];
  annoncesSousPerformantes: string[];
  motsClesTop: string[];
}

// ============================================================
// DONNÉES ACADÉMIA PRO — CONFIGURATION CAMPAGNES
// ============================================================

const ACADEMIA_CONFIG = {
  urlBase: "https://academia-pro.fr",
  marque: "AcadémIA Pro",
  garantie: "Garantie 30 jours",
  agent: "Agent IA 24h/24",
  certification: "Certifié",

  campagnes: [
    {
      nom: "Formations IA",
      segment: "ia",
      urlPage: "/formations/intelligence-artificielle",
      budget: 50,
      cpaCible: 35,
      thematiques: ["Expert Claude", "No-Code", "Apps Natives", "Marketing IA"],
      produits: [
        "Formation Claude Expert",
        "No-Code IA",
        "Apps Natives IA",
        "Marketing IA",
      ],
    },
    {
      nom: "Formations Bien-être",
      segment: "bien_etre",
      urlPage: "/formations/bien-etre",
      budget: 40,
      cpaCible: 45,
      thematiques: ["Hypnose", "PNL", "Sophrologie", "Coaching"],
      produits: [
        "Formation Hypnose",
        "Formation PNL",
        "Sophrologie",
        "Coaching Pro",
      ],
    },
    {
      nom: "Formations Langues",
      segment: "langues",
      urlPage: "/formations/langues",
      budget: 35,
      cpaCible: 30,
      thematiques: ["Anglais", "Espagnol", "Hébreu", "Arabe"],
      produits: [
        "Apprendre Anglais",
        "Cours Espagnol",
        "Formation Hébreu",
        "Cours Arabe",
      ],
    },
    {
      nom: "Packs AcadémIA Pro",
      segment: "packs",
      urlPage: "/packs",
      budget: 60,
      roasCible: 400,
      thematiques: ["Pack IA", "Pack Marketing", "Pack Entrepreneur"],
      produits: ["Pack IA Complet", "Pack Marketing Digital", "Pack Entrepreneur"],
    },
    {
      nom: "Séances Thérapeutiques",
      segment: "therapeutique",
      urlPage: "/seances",
      budget: 45,
      cpaCible: 55,
      thematiques: ["Visio", "Audio", "Abonnements"],
      produits: [
        "Séance Visio",
        "Séance Audio",
        "Abonnement Mensuel",
        "Pack 10 Séances",
      ],
    },
  ],
};

// ============================================================
// GÉNÉRATEUR CLAUDE — MOTS CLÉS
// ============================================================

async function genererMotsCles(
  config: (typeof ACADEMIA_CONFIG.campagnes)[0]
): Promise<{ motsCles: MotCle[]; motsClesNegatifs: string[] }> {
  const prompt = `Tu es un expert Google Ads spécialisé en marketing digital.
  
Génère exactement 10 mots clés principaux avec leurs variations pour la campagne "${config.nom}" d'AcadémIA Pro.

Thématiques : ${config.thematiques.join(", ")}
Produits : ${config.produits.join(", ")}
URL : ${config.urlPage}

RÈGLES STRICTES :
- 10 mots clés en français
- Pour chaque mot clé : spécifie le type (exact/phrase/large)
- Inclure variations longue traîne
- Mots clés avec intention d'achat forte

Génère aussi 15 mots clés négatifs pertinents (gratuit, torrent, crack, etc.)

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "motsCles": [
    {"texte": "formation intelligence artificielle", "type": "phrase", "enchereMax": 2.50},
    {"texte": "apprendre claude ia", "type": "exact", "enchereMax": 3.00}
  ],
  "motsClesNegatifs": ["gratuit", "torrent", "crack", "free", "youtube"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Réponse Claude invalide");

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON non trouvé dans la réponse");
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback structuré si parsing échoue
    return {
      motsCles: config.thematiques.map((theme, i) => ({
        texte: `formation ${theme.toLowerCase()} academia pro`,
        type: i % 2 === 0 ? "phrase" : "exact",
        enchereMax: 2.0 + i * 0.5,
      })),
      motsClesNegatifs: [
        "gratuit",
        "torrent",
        "crack",
        "free",
        "youtube",
        "cours gratuit",
        "télécharger",
        "pirate",
      ],
    };
  }
}

// ============================================================
// GÉNÉRATEUR CLAUDE — ANNONCES RSA
// ============================================================

async function genererAnnonces(
  config: (typeof ACADEMIA_CONFIG.campagnes)[0],
  index: number
): Promise<Annonce> {
  const prompt = `Tu es un copywriter expert Google Ads pour AcadémIA Pro.

Crée une annonce Responsive Search Ad complète pour la campagne "${config.nom}".

CONTRAINTES ABSOLUES :
- Titres : EXACTEMENT 15 titres, MAXIMUM 30 caractères chacun (espaces compris)
- Descriptions : EXACTEMENT 4 descriptions, MAXIMUM 90 caractères chacune
- Inclure obligatoirement : "${ACADEMIA_CONFIG.garantie}" | "${ACADEMIA_CONFIG.agent}" | "Certification"
- Thématiques : ${config.thematiques.join(", ")}
- URL finale : ${ACADEMIA_CONFIG.urlBase}${config.urlPage}
- Ton : professionnel, incitatif, bénéfices clairs

EXEMPLES FORMAT TITRE (30 chars max) :
"Formation IA Certifiée" ✓ (22 chars)
"Apprenez l'IA en 30 jours" ✓ (26 chars)

EXEMPLES FORMAT DESCRIPTION (90 chars max) :
"Maîtrisez l'IA avec notre agent 24h/24. Garantie 30 jours satisfait ou remboursé." ✓

Réponds UNIQUEMENT en JSON valide :
{
  "titres": ["titre1", "titre2", ..., "titre15"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Réponse Claude invalide");

  let titres: string[] = [];
  let descriptions: string[] = [];

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON non trouvé");
    const parsed = JSON.parse(jsonMatch[0]);
    titres = parsed.titres || [];
    descriptions = parsed.descriptions || [];
  } catch {
    // Fallback annonces
    titres = [
      `Formation ${config.nom.slice(0, 20)}`,
      "Certifié AcadémIA Pro",
      "Agent IA 24h/24",
      "Garantie 30 Jours",
      "Apprenez en Ligne",
      "Experts Certifiés",
      "Commencez Maintenant",
      "Formation Premium",
      "Résultats Garantis",
      "Support Inclus",
      "Accès Illimité",
      "Inscription Rapide",
      "100% En Ligne",
      "Formateurs Experts",
      "Satisfaction Garantie",
    ];
    descriptions = [
      `Formez-vous à ${config.thematiques[0]} avec notre agent IA 24h/24. Garantie 30 jours.`,
      `Accédez à ${config.produits.length} formations certifiées. Support illimité inclus.`,
      `${config.thematiques.join(", ")}. Certification reconnue. Commencez aujourd'hui !`,
      `AcadémIA Pro : la référence en formation IA. Satisfait ou remboursé 30 jours.`,
    ];
  }

  // Validation & truncation stricte
  const titresValides = titres
    .slice(0, 15)
    .map((t) => t.slice(0, 30))
    .filter((t) => t.length > 0);

  const descriptionsValides = descriptions
    .slice(0, 4)
    .map((d) => d.slice(0, 90))
    .filter((d) => d.length > 0);

  // Compléter si insuffisant
  while (titresValides.length < 15) {
    const fallback = [
      "Formation Certifiée",
      "AcadémIA Pro",
      "Agent IA 24h/24",
      "Garantie 30 Jours",
      "Inscription Ouverte",
    ];
    titresValides.push(
      fallback[titresValides.length % fallback.length].slice(0, 30)
    );
  }

  while (descriptionsValides.length < 4) {
    descriptionsValides.push(
      `Rejoignez AcadémIA Pro. Formation certifiée, agent IA 24h/24, garantie 30 jours.`.slice(
        0,
        90
      )
    );
  }

  return {
    id: `annonce_${config.segment}_${index}_${Date.now()}`,
    titres: titresValides,
    descriptions: descriptionsValides,
    urlFinale: `${ACADEMIA_CONFIG.urlBase}${config.urlPage}`,
    urlAffichage: `academia-pro.fr${config.urlPage}`,
    statut: "active",
    score: Math.floor(Math.random() * 20) + 80,
  };
}

// ============================================================
// GÉNÉRATEUR — EXTENSIONS
// ============================================================

async function genererExtensions(
  config: (typeof ACADEMIA_CONFIG.campagnes)[0]
): Promise<Extension[]> {
  const extensions: Extension[] = [];

  // Extensions liens annexes (4 minimum)
  const liensAnnexes = [
    {
      titre: "Toutes nos formations",
      desc1: "Catalogue complet disponible",
      desc2: "Plus de 50 formations certifiées",
      url: "/formations",
    },
    {
      titre: "Agent IA 24h/24",
      desc1: "Support intelligent permanent",
      desc2: "Réponses instantanées garanties",
      url: "/agent-ia",
    },
    {
      titre: "Garantie 30 jours",
      desc1: "Satisfait ou remboursé",
      desc2: "Sans question posée",
      url: "/garantie",
    },
    {
      titre: "Témoignages clients",
      desc1: "Plus de 2000 avis vérifiés",
      desc2: "Note moyenne 4.9/5",
      url: "/avis",
    },
    {
      titre: config.thematiques[0],
      desc1: `Expertise ${config.thematiques[0]}`,
      desc2: "Formation intensive certifiante",
      url: `${config.urlPage}/${config.thematiques[0].toLowerCase().replace(/\s+/g, "-")}`,
    },
  ];

  liensAnnexes.forEach((lien) => {
    extensions.push({
      type: "lien_annexe",
      contenu: lien.titre,
      description1: lien.desc1,
      description2: lien.desc2,
      urlFinale: `${ACADEMIA_CONFIG.urlBase}${lien.url}`,
    });
  });

  // Extensions accroche
  const accroches = [
    "Garantie