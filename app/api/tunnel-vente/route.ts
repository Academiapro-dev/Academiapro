```typescript
// app/api/tunnel-vente/route.ts
// Types et interfaces globaux

export interface Prospect {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  scoreProspect: number;
  etapeActuelle: EtapeTunnel;
  historiqueEtapes: HistoriqueEtape[];
  achats: Achat[];
  panierAbandonné: PanierAbandon | null;
  dateCreation: Date;
  derniereActivite: Date;
  offresActives: OffreLimitee[];
}

export type EtapeTunnel =
  | "decouverte"
  | "interet"
  | "consideration"
  | "achat_starter"
  | "achat_formation"
  | "achat_pack"
  | "abonnement"
  | "abandon";

export interface HistoriqueEtape {
  etape: EtapeTunnel;
  dateEntree: Date;
  dateSortie: Date | null;
  dureeSecondes: number | null;
  actionDeclenchee: string | null;
}

export interface Achat {
  id: string;
  produit: TypeProduit;
  montant: number;
  devise: string;
  dateAchat: Date;
  upsellDeclenche: boolean;
  upsellConverti: boolean;
}

export type TypeProduit =
  | "starter"
  | "formation_1h"
  | "formation_complete"
  | "pack_essentiel"
  | "pack_premium"
  | "abonnement_mensuel"
  | "abonnement_annuel";

export interface PanierAbandon {
  produit: TypeProduit;
  montant: number;
  dateAbandon: Date;
  nombreRelances: number;
  derniereRelance: Date | null;
  tokenRecuperation: string;
}

export interface OffreLimitee {
  id: string;
  produit: TypeProduit;
  prixOriginal: number;
  prixReduit: number;
  reduction: number;
  dateExpiration: Date;
  tokenOffre: string;
  utilisee: boolean;
}

export interface UpsellConfig {
  declencheur: TypeProduit;
  produitUpsell: TypeProduit;
  delaiHeures: number;
  sujetEmail: string;
  templateEmail: string;
  reductionPourcentage: number;
  dureeOffreHeures: number;
}

export interface AnalyticsTunnel {
  periode: {
    debut: Date;
    fin: Date;
  };
  totalProspects: number;
  tauxConversionParEtape: Record<EtapeTunnel, TauxConversion>;
  revenus: {
    total: number;
    parProduit: Record<TypeProduit, number>;
  };
  upsells: {
    declenches: number;
    convertis: number;
    tauxConversion: number;
    revenuGenere: number;
  };
  abandons: {
    total: number;
    recuperes: number;
    tauxRecuperation: number;
  };
  topEtapeAbandon: EtapeTunnel;
  scoreProspectMoyen: number;
}

export interface TauxConversion {
  entrees: number;
  sorties: number;
  conversions: number;
  taux: number;
  revenuMoyen: number;
}
```

```typescript
// app/api/tunnel-vente/etape/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// ============================================================
// CONFIGURATION UPSELL
// ============================================================

const UPSELL_CONFIGS: UpsellConfig[] = [
  {
    declencheur: "starter",
    produitUpsell: "formation_1h",
    delaiHeures: 1,
    sujetEmail: "🎯 [AcadémIA Pro] Votre formation personnalisée vous attend",
    templateEmail: "upsell_formation_apres_starter",
    reductionPourcentage: 20,
    dureeOffreHeures: 48,
  },
  {
    declencheur: "formation_1h",
    produitUpsell: "pack_essentiel",
    delaiHeures: 24,
    sujetEmail: "🚀 [AcadémIA Pro] Passez au pack complet - Offre 24h",
    templateEmail: "upsell_pack_apres_formation",
    reductionPourcentage: 15,
    dureeOffreHeures: 72,
  },
  {
    declencheur: "formation_complete",
    produitUpsell: "pack_premium",
    delaiHeures: 24,
    sujetEmail: "💎 [AcadémIA Pro] Pack Premium - Votre progression accélérée",
    templateEmail: "upsell_pack_premium_apres_formation",
    reductionPourcentage: 25,
    dureeOffreHeures: 72,
  },
  {
    declencheur: "pack_essentiel",
    produitUpsell: "abonnement_mensuel",
    delaiHeures: 48,
    sujetEmail: "⭐ [AcadémIA Pro] Abonnez-vous - Accès illimité aux séances",
    templateEmail: "upsell_abonnement_apres_pack",
    reductionPourcentage: 30,
    dureeOffreHeures: 96,
  },
  {
    declencheur: "pack_premium",
    produitUpsell: "abonnement_annuel",
    delaiHeures: 48,
    sujetEmail: "🏆 [AcadémIA Pro] Abonnement annuel - Économisez 40%",
    templateEmail: "upsell_abonnement_annuel_apres_pack",
    reductionPourcentage: 40,
    dureeOffreHeures: 120,
  },
];

// ============================================================
// PRIX DES PRODUITS
// ============================================================

const PRIX_PRODUITS: Record<TypeProduit, number> = {
  starter: 9.99,
  formation_1h: 49.99,
  formation_complete: 129.99,
  pack_essentiel: 199.99,
  pack_premium: 349.99,
  abonnement_mensuel: 79.99,
  abonnement_annuel: 699.99,
};

// ============================================================
// SCORE PAR ÉTAPE
// ============================================================

const SCORE_PAR_ETAPE: Record<EtapeTunnel, number> = {
  decouverte: 10,
  interet: 25,
  consideration: 50,
  achat_starter: 70,
  achat_formation: 85,
  achat_pack: 95,
  abonnement: 100,
  abandon: -10,
};

// ============================================================
// BASE DE DONNÉES SIMULÉE (remplacer par Prisma/Supabase)
// ============================================================

const prospectsDB = new Map<string, Prospect>();
const upsellQueue = new Map<
  string,
  {
    prospectId: string;
    config: UpsellConfig;
    planifieAt: Date;
    envoye: boolean;
  }
>();
const analyticsDB: AnalyticsEntry[] = [];

interface AnalyticsEntry {
  prospectId: string;
  etape: EtapeTunnel;
  action: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

// ============================================================
// UTILITAIRES
// ============================================================

function genererToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

function genererIdUnique(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function calculerNouveauScore(
  scoreActuel: number,
  etape: EtapeTunnel,
  achatMontant?: number
): number {
  let nouveauScore = scoreActuel + SCORE_PAR_ETAPE[etape];

  // Bonus selon le montant d'achat
  if (achatMontant) {
    if (achatMontant > 300) nouveauScore += 15;
    else if (achatMontant > 100) nouveauScore += 10;
    else if (achatMontant > 50) nouveauScore += 5;
  }

  // Plafonner entre 0 et 100
  return Math.min(100, Math.max(0, nouveauScore));
}

function determinerEtapeDepuisProduit(produit: TypeProduit): EtapeTunnel {
  const mapping: Partial<Record<TypeProduit, EtapeTunnel>> = {
    starter: "achat_starter",
    formation_1h: "achat_formation",
    formation_complete: "achat_formation",
    pack_essentiel: "achat_pack",
    pack_premium: "achat_pack",
    abonnement_mensuel: "abonnement",
    abonnement_annuel: "abonnement",
  };
  return mapping[produit] || "consideration";
}

async function envoyerEmailUpsell(
  prospect: Prospect,
  config: UpsellConfig,
  offre: OffreLimitee
): Promise<void> {
  // Simulation envoi email - Remplacer par Resend/SendGrid/Brevo
  console.log(`
    ═══════════════════════════════════════
    📧 EMAIL UPSELL ENVOYÉ
    ═══════════════════════════════════════
    À: ${prospect.email}
    Nom: ${prospect.prenom} ${prospect.nom}
    Sujet: ${config.sujetEmail}
    Template: ${config.templateEmail}
    Produit proposé: ${config.produitUpsell}
    Prix original: ${PRIX_PRODUITS[config.produitUpsell]}€
    Prix réduit: ${offre.prixReduit}€
    Réduction: ${config.reductionPourcentage}%
    Expiration offre: ${offre.dateExpiration.toLocaleString("fr-FR")}
    Token offre: ${offre.tokenOffre}
    ═══════════════════════════════════════
  `);

  // TODO: Intégration réelle
  // await resend.emails.send({
  //   from: 'AcadémIA Pro <noreply@academia-pro.fr>',
  //   to: prospect.email,
  //   subject: config.sujetEmail,
  //   react: UpsellEmailTemplate({ prospect, config, offre })
  // });
}

async function envoyerEmailRelance(
  prospect: Prospect,
  abandon: PanierAbandon,
  numeroRelance: number
): Promise<void> {
  const messages = [
    {
      sujet: "🛒 [AcadémIA Pro] Vous avez oublié quelque chose...",
      corps: `Bonjour ${prospect.prenom}, votre panier vous attend !`,
    },
    {
      sujet: "⏰ [AcadémIA Pro] Dernière chance - 10% de réduction",
      corps: `${prospect.prenom}, profitez de 10% de remise supplémentaire !`,
    },
    {
      sujet: "🎁 [AcadémIA Pro] Offre spéciale récupération panier",
      corps: `${prospect.prenom}, voici une offre exclusive pour vous !`,
    },
  ];

  const message = messages[Math.min(numeroRelance - 1, messages.length - 1)];

  console.log(`
    ═══════════════════════════════════════
    📧 EMAIL RELANCE ABANDON PANIER
    ═══════════════════════════════════════
    À: ${prospect.email}
    Sujet: ${message.sujet}
    Numéro relance: ${numeroRelance}/3
    Produit: ${abandon.produit}
    Montant: ${abandon.montant}€
    Token récupération: ${abandon.tokenRecuperation}
    ═══════════════════════════════════════
  `);
}

function planifierUpsell(prospect: Prospect, config: UpsellConfig): void {
  const planifieAt = new Date();
  planifieAt.setHours(planifieAt.getHours() + config.delaiHeures);

  const upsellId = `${prospect.id}-${config.produitUpsell}-${Date.now()}`;

  upsellQueue.set(upsellId, {
    prospectId: prospect.id,
    config,
    planifieAt,
    envoye: false,
  });

  console.log(`
    ⏰ UPSELL PLANIFIÉ
    ID: ${upsellId}
    Prospect: ${prospect.email}
    Produit: ${config.produitUpsell}
    Envoi prévu: ${planifieAt.toLocaleString("fr-FR")}
  `);
}

function creerOffre(
  produit: TypeProduit,
  reductionPourcentage: number,
  dureeHeures: number
): OffreLimitee {
  const prixOriginal = PRIX_PRODUITS[produit];
  const prixReduit = prixOriginal * (1 - reductionPourcentage / 100);
  const dateExpiration = new Date();
  dateExpiration.setHours(dateExpiration.getHours() + dureeHeures);

  return {
    id: genererIdUnique(),
    produit,
    prixOriginal,
    prixReduit: Math.round(prixReduit * 100) / 100,
    reduction: reductionPourcentage,
    dateExpiration,
    tokenOffre: genererToken(),
    utilisee: false,
  };
}

// ============================================================
// POST /api/tunnel-vente/etape
// ============================================================

interface EtapeRequest {
  prospectId?: string;
  email: string;
  nom: string;
  prenom: string;
  etape: EtapeTunnel;
  produitAchete?: TypeProduit;
  panierAbandon?: {
    produit: TypeProduit;
    montant: number;
  };
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (pathname.endsWith("/etape")) {
    return handleEtape(request);
  } else if (pathname.endsWith("/upsell")) {
    return handleUpsell(request);
  } else if (pathname.endsWith("/relance")) {
    return handleRelance(request);
  }

  return NextResponse.json({ error: "Route non trouvée" }, { status: 404 });
}
```

```typescript
// app/api/tunnel-vente/etape/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest