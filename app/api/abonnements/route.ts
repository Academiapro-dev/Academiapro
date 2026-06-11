// types/abonnement.ts
export type FormulaType = "STARTER" | "STANDARD" | "PREMIUM" | "ELITE";
export type AbonnementStatus =
  | "ACTIF"
  | "PAUSE"
  | "RESILIÉ"
  | "EXPIRÉ"
  | "EN_ATTENTE";
export type PaiementStatus = "RÉUSSI" | "ÉCHOUÉ" | "REMBOURSÉ" | "EN_ATTENTE";

export interface Formule {
  id: FormulaType;
  nom: string;
  prixMensuel: number;
  seancesMensuelles: number;
  rolloverMax: number;
  stripePriceId: string;
}

export interface Abonnement {
  id: string;
  userId: string;
  formule: FormulaType;
  status: AbonnementStatus;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  dateDebut: Date;
  dateFin: Date;
  dateProchainRenouvellement: Date;
  seancesRestantes: number;
  seancesRollover: number;
  seancesUtiliseesCeMois: number;
  pauseUtilisee: boolean;
  datePause?: Date;
  dateReprisePrevue?: Date;
  dateSouhaiteeResiliation?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaiementHistorique {
  id: string;
  abonnementId: string;
  userId: string;
  montant: number;
  devise: string;
  status: PaiementStatus;
  stripePaymentIntentId: string;
  stripeInvoiceId: string;
  description: string;
  createdAt: Date;
}

export interface SeanceUtilisation {
  id: string;
  abonnementId: string;
  userId: string;
  sessionId: string;
  dateUtilisation: Date;
  typeSeance: string;
  seancesDeduites: number;
  soldeAvant: number;
  soldeApres: number;
}

export interface CreateAbonnementPayload {
  userId: string;
  formule: FormulaType;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

export interface ModifierAbonnementPayload {
  nouvelleFormule: FormulaType;
  effectifImmediatement?: boolean;
}

export interface RésilierAbonnementPayload {
  raison?: string;
  dateSouhaitee?: string;
}

export interface PauseAbonnementPayload {
  dureeJours: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

```typescript
// lib/db.ts
// Simulation d'une couche d'accès aux données
// Remplacez par votre ORM (Prisma, Drizzle, etc.)

import {
  Abonnement,
  PaiementHistorique,
  SeanceUtilisation,
} from "@/types/abonnement";

// Simuler une base de données en mémoire pour l'exemple
const abonnementsDB: Map<string, Abonnement> = new Map();
const paiementsDB: Map<string, PaiementHistorique[]> = new Map();
const utilisationsDB: Map<string, SeanceUtilisation[]> = new Map();

export const db = {
  abonnements: {
    async create(data: Abonnement): Promise<Abonnement> {
      abonnementsDB.set(data.id, data);
      return data;
    },

    async findByUserId(userId: string): Promise<Abonnement | null> {
      for (const abonnement of abonnementsDB.values()) {
        if (
          abonnement.userId === userId &&
          abonnement.status !== "RESILIÉ" &&
          abonnement.status !== "EXPIRÉ"
        ) {
          return abonnement;
        }
      }
      return null;
    },

    async findById(id: string): Promise<Abonnement | null> {
      return abonnementsDB.get(id) || null;
    },

    async findByStripeSubscriptionId(
      stripeSubId: string
    ): Promise<Abonnement | null> {
      for (const abonnement of abonnementsDB.values()) {
        if (abonnement.stripeSubscriptionId === stripeSubId) {
          return abonnement;
        }
      }
      return null;
    },

    async update(
      id: string,
      data: Partial<Abonnement>
    ): Promise<Abonnement | null> {
      const existing = abonnementsDB.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date() };
      abonnementsDB.set(id, updated);
      return updated;
    },

    async findAbonnementsExpirantDans(jours: number): Promise<Abonnement[]> {
      const dateTarget = new Date();
      dateTarget.setDate(dateTarget.getDate() + jours);
      const result: Abonnement[] = [];

      for (const abonnement of abonnementsDB.values()) {
        if (abonnement.status !== "ACTIF") continue;
        const diffMs =
          abonnement.dateProchainRenouvellement.getTime() -
          dateTarget.getTime();
        const diffJours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        if (diffJours <= 1) {
          result.push(abonnement);
        }
      }
      return result;
    },
  },

  paiements: {
    async create(data: PaiementHistorique): Promise<PaiementHistorique> {
      const existing = paiementsDB.get(data.abonnementId) || [];
      existing.push(data);
      paiementsDB.set(data.abonnementId, existing);
      return data;
    },

    async findByAbonnementId(
      abonnementId: string
    ): Promise<PaiementHistorique[]> {
      return paiementsDB.get(abonnementId) || [];
    },

    async findByUserId(userId: string): Promise<PaiementHistorique[]> {
      const result: PaiementHistorique[] = [];
      for (const paiements of paiementsDB.values()) {
        for (const p of paiements) {
          if (p.userId === userId) result.push(p);
        }
      }
      return result.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    },
  },

  utilisations: {
    async create(data: SeanceUtilisation): Promise<SeanceUtilisation> {
      const existing = utilisationsDB.get(data.abonnementId) || [];
      existing.push(data);
      utilisationsDB.set(data.abonnementId, existing);
      return data;
    },

    async findByAbonnementId(
      abonnementId: string
    ): Promise<SeanceUtilisation[]> {
      return utilisationsDB.get(abonnementId) || [];
    },
  },
};
```

```typescript
// lib/formules.ts
import { Formule, FormulaType } from "@/types/abonnement";

export const FORMULES: Record<FormulaType, Formule> = {
  STARTER: {
    id: "STARTER",
    nom: "AcadémIA Starter",
    prixMensuel: 29.99,
    seancesMensuelles: 4,
    rolloverMax: 2,
    stripePriceId: process.env.STRIPE_PRICE_STARTER!,
  },
  STANDARD: {
    id: "STANDARD",
    nom: "AcadémIA Standard",
    prixMensuel: 59.99,
    seancesMensuelles: 8,
    rolloverMax: 4,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD!,
  },
  PREMIUM: {
    id: "PREMIUM",
    nom: "AcadémIA Premium",
    prixMensuel: 99.99,
    seancesMensuelles: 16,
    rolloverMax: 8,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM!,
  },
  ELITE: {
    id: "ELITE",
    nom: "AcadémIA Elite",
    prixMensuel: 149.99,
    seancesMensuelles: 30,
    rolloverMax: 15,
    stripePriceId: process.env.STRIPE_PRICE_ELITE!,
  },
};

export function getFormule(type: FormulaType): Formule {
  return FORMULES[type];
}

export function isUpgrade(
  ancienneFormule: FormulaType,
  nouvelleFormule: FormulaType
): boolean {
  const order: FormulaType[] = ["STARTER", "STANDARD", "PREMIUM", "ELITE"];
  return order.indexOf(nouvelleFormule) > order.indexOf(ancienneFormule);
}

export function calculerRollover(
  seancesRestantes: number,
  rolloverMax: number
): number {
  return Math.min(seancesRestantes, rolloverMax);
}
```

```typescript
// lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY est requis");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export async function récupérerAbonnementStripe(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function annulerAbonnementStripe(
  subscriptionId: string,
  immédiatement: boolean = false
): Promise<Stripe.Subscription> {
  if (immédiatement) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function modifierAbonnementStripe(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: "always_invoice",
  });
}

export async function pauserAbonnementStripe(
  subscriptionId: string,
  repriseDate: Date
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: "void",
      resumes_at: Math.floor(repriseDate.getTime() / 1000),
    },
  });
}

export async function reprendreAbonnementStripe(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe