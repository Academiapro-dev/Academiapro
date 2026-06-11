// app/api/garantie/route.ts - Fichier principal avec handlers GET/POST

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ============================================================
// CONFIGURATION & CLIENTS
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// ============================================================
// TYPES & INTERFACES
// ============================================================

type StatutDemande =
  | "en_attente"
  | "approuve"
  | "refuse"
  | "alternative_proposee"
  | "rembourse";

type RaisonAbandon =
  | "contenu_inadequat"
  | "trop_difficile"
  | "manque_temps"
  | "attentes_non_satisfaites"
  | "probleme_technique"
  | "raison_personnelle"
  | "autre";

interface DemandeRemboursement {
  apprenant_id: string;
  formation_id: string;
  stripe_payment_intent_id: string;
  raison: RaisonAbandon;
  description?: string;
  email_apprenant: string;
  nom_apprenant: string;
}

interface DemandeDB {
  id: string;
  apprenant_id: string;
  formation_id: string;
  stripe_payment_intent_id: string;
  raison: RaisonAbandon;
  description?: string;
  email_apprenant: string;
  nom_apprenant: string;
  statut: StatutDemande;
  montant?: number;
  stripe_refund_id?: string;
  date_demande: string;
  date_traitement?: string;
  progression_au_moment_demande?: number;
  jours_depuis_achat?: number;
  solution_alternative?: string;
  created_at: string;
  updated_at: string;
}

interface ProgressionFormation {
  pourcentage_complete: number;
  date_achat: string;
  montant_paye: number;
  nom_formation: string;
  stripe_customer_id?: string;
}

interface VerificationConditions {
  eligible: boolean;
  raison_refus?: string;
  progression: number;
  jours_depuis_achat: number;
  montant_rembourse?: number;
  solution_alternative?: string;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère la progression de l'apprenant dans une formation
 */
async function getProgressionFormation(
  apprenant_id: string,
  formation_id: string
): Promise<ProgressionFormation | null> {
  const { data, error } = await supabase
    .from("inscriptions")
    .select(
      `
      pourcentage_complete,
      date_achat,
      montant_paye,
      stripe_customer_id,
      formations (
        nom,
        id
      )
    `
    )
    .eq("apprenant_id", apprenant_id)
    .eq("formation_id", formation_id)
    .single();

  if (error || !data) {
    console.error("[GARANTIE] Erreur récupération progression:", error);
    return null;
  }

  return {
    pourcentage_complete: data.pourcentage_complete || 0,
    date_achat: data.date_achat,
    montant_paye: data.montant_paye,
    nom_formation: (data.formations as { nom: string })?.nom || "Formation",
    stripe_customer_id: data.stripe_customer_id,
  };
}

/**
 * Vérifie les conditions d'éligibilité au remboursement
 */
async function verifierConditionsEligibilite(
  apprenant_id: string,
  formation_id: string
): Promise<VerificationConditions> {
  const progression = await getProgressionFormation(apprenant_id, formation_id);

  if (!progression) {
    return {
      eligible: false,
      raison_refus: "Inscription non trouvée pour cette formation",
      progression: 0,
      jours_depuis_achat: 0,
    };
  }

  const dateAchat = new Date(progression.date_achat);
  const maintenant = new Date();
  const diffMs = maintenant.getTime() - dateAchat.getTime();
  const jours = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Vérification délai 30 jours
  if (jours > 30) {
    return {
      eligible: false,
      raison_refus: `La période de garantie de 30 jours est expirée (${jours} jours écoulés)`,
      progression: progression.pourcentage_complete,
      jours_depuis_achat: jours,
      solution_alternative: "seance_coaching",
    };
  }

  // Vérification progression < 50%
  if (progression.pourcentage_complete >= 50) {
    return {
      eligible: false,
      raison_refus: `Vous avez complété ${progression.pourcentage_complete}% de la formation (limite : moins de 50%)`,
      progression: progression.pourcentage_complete,
      jours_depuis_achat: jours,
      solution_alternative: "seance_coaching",
    };
  }

  // Vérification pas de remboursement déjà traité
  const { data: demandeExistante } = await supabase
    .from("remboursements")
    .select("id, statut")
    .eq("apprenant_id", apprenant_id)
    .eq("formation_id", formation_id)
    .in("statut", ["approuve", "rembourse"])
    .single();

  if (demandeExistante) {
    return {
      eligible: false,
      raison_refus: "Un remboursement a déjà été traité pour cette formation",
      progression: progression.pourcentage_complete,
      jours_depuis_achat: jours,
    };
  }

  return {
    eligible: true,
    progression: progression.pourcentage_complete,
    jours_depuis_achat: jours,
    montant_rembourse: progression.montant_paye,
  };
}

/**
 * Déclenche le remboursement Stripe
 */
async function declencherRemboursementStripe(
  payment_intent_id: string,
  montant?: number
): Promise<{ success: boolean; refund_id?: string; error?: string }> {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment_intent_id,
      reason: "requested_by_customer",
    };

    if (montant) {
      refundParams.amount = Math.round(montant * 100); // Convertir en centimes
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refund_id: refund.id,
    };
  } catch (error) {
    const stripeError = error as Stripe.StripeRawError;
    console.error("[GARANTIE] Erreur Stripe:", stripeError.message);
    return {
      success: false,
      error: stripeError.message,
    };
  }
}

/**
 * Enregistre la demande dans Supabase
 */
async function enregistrerDemande(
  demande: DemandeRemboursement,
  statut: StatutDemande,
  details: {
    progression: number;
    jours_depuis_achat: number;
    montant?: number;
    stripe_refund_id?: string;
    solution_alternative?: string;
  }
): Promise<DemandeDB | null> {
  const { data, error } = await supabase
    .from("remboursements")
    .insert({
      apprenant_id: demande.apprenant_id,
      formation_id: demande.formation_id,
      stripe_payment_intent_id: demande.stripe_payment_intent_id,
      raison: demande.raison,
      description: demande.description,
      email_apprenant: demande.email_apprenant,
      nom_apprenant: demande.nom_apprenant,
      statut: statut,
      montant: details.montant,
      stripe_refund_id: details.stripe_refund_id,
      progression_au_moment_demande: details.progression,
      jours_depuis_achat: details.jours_depuis_achat,
      solution_alternative: details.solution_alternative,
      date_demande: new Date().toISOString(),
      date_traitement:
        statut === "approuve" || statut === "rembourse"
          ? new Date().toISOString()
          : null,
    })
    .select()
    .single();

  if (error) {
    console.error("[GARANTIE] Erreur Supabase insertion:", error);
    return null;
  }

  return data;
}

/**
 * Met à jour le statut dans le CRM (table contacts Supabase)
 */
async function mettreAJourCRM(
  apprenant_id: string,
  statut: StatutDemande,
  formation_id: string
): Promise<void> {
  const statutCRM =
    statut === "approuve" || statut === "rembourse"
      ? "remboursé"
      : "alternative_proposee";

  const { error } = await supabase
    .from("contacts")
    .update({
      statut_crm: statutCRM,
      derniere_action: `demande_remboursement_${statut}`,
      date_derniere_interaction: new Date().toISOString(),
      metadata: supabase
        .from("contacts")
        .select("metadata")
        .eq("apprenant_id", apprenant_id),
    })
    .eq("apprenant_id", apprenant_id);

  if (error) {
    console.error("[GARANTIE] Erreur mise à jour CRM:", error);
    // Non bloquant - on continue même si le CRM échoue
  }
}

/**
 * Analyse les raisons d'abandon pour amélioration
 */
async function analyserRaisonAbandon(
  formation_id: string,
  raison: RaisonAbandon,
  description?: string
): Promise<void> {
  // Incrémenter le compteur dans la table analytics
  const { error } = await supabase.rpc("incrementer_raison_abandon", {
    p_formation_id: formation_id,
    p_raison: raison,
    p_description: description || null,
    p_date: new Date().toISOString(),
  });

  if (error) {
    // Fallback : insertion directe dans table analytics
    await supabase.from("analytics_abandons").insert({
      formation_id,
      raison,
      description,
      date: new Date().toISOString(),
    });
  }
}

/**
 * Envoie email de confirmation à l'ap