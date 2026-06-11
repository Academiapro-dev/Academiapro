import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// ============================================================
// TYPES TYPESCRIPT
// ============================================================

export type FormatSeance = "visio" | "audio";
export type StatutReservation =
  | "en_attente"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee"
  | "no_show";
export type TypeAbonnement = "visio" | "audio";
export type FormuleAbonnement = "starter" | "bien-etre" | "intensif";

// ─── Reservations ───────────────────────────────────────────

export interface Reservation {
  id: string;
  apprenant_id: string;
  specialite: string;
  format: FormatSeance;
  tarif: number;
  statut: StatutReservation;
  date_heure: string;
  lien_salle: string | null;
  created_at: string;
}

export interface ReservationInsert {
  apprenant_id: string;
  specialite: string;
  format: FormatSeance;
  tarif: number;
  statut?: StatutReservation;
  date_heure: string;
  lien_salle?: string | null;
}

export interface ReservationUpdate {
  specialite?: string;
  format?: FormatSeance;
  tarif?: number;
  statut?: StatutReservation;
  date_heure?: string;
  lien_salle?: string | null;
}

// ─── Sessions Séances ────────────────────────────────────────

export interface SessionSeance {
  id: string;
  reservation_id: string;
  duree_reelle: number | null;
  transcript: string | null;
  compte_rendu: string | null;
  note: number | null;
  replay_url: string | null;
  created_at: string;
}

export interface SessionSeanceInsert {
  reservation_id: string;
  duree_reelle?: number | null;
  transcript?: string | null;
  compte_rendu?: string | null;
  note?: number | null;
  replay_url?: string | null;
}

export interface SessionSeanceUpdate {
  duree_reelle?: number | null;
  transcript?: string | null;
  compte_rendu?: string | null;
  note?: number | null;
  replay_url?: string | null;
}

// ─── Abonnements Séances ─────────────────────────────────────

export interface AbonnementSeance {
  id: string;
  apprenant_id: string;
  type: TypeAbonnement;
  formule: FormuleAbonnement;
  prix: number;
  seances_restantes: number;
  renouvellement: string;
  actif: boolean;
}

export interface AbonnementSeanceInsert {
  apprenant_id: string;
  type: TypeAbonnement;
  formule: FormuleAbonnement;
  prix: number;
  seances_restantes: number;
  renouvellement: string;
  actif?: boolean;
}

export interface AbonnementSeanceUpdate {
  type?: TypeAbonnement;
  formule?: FormuleAbonnement;
  prix?: number;
  seances_restantes?: number;
  renouvellement?: string;
  actif?: boolean;
}

// ─── Comptes Rendus ──────────────────────────────────────────

export interface CompteRendu {
  id: string;
  session_id: string;
  apprenant_id: string;
  specialite: string;
  resume: string | null;
  exercices: ExerciceItem[] | null;
  objectifs: ObjectifItem[] | null;
  ressources: RessourceItem[] | null;
  created_at: string;
}

export interface ExerciceItem {
  titre: string;
  description: string;
  duree_estimee?: string;
  priorite?: "haute" | "moyenne" | "basse";
}

export interface ObjectifItem {
  titre: string;
  description: string;
  echeance?: string;
  atteint?: boolean;
}

export interface RessourceItem {
  titre: string;
  url?: string;
  type: "article" | "video" | "podcast" | "livre" | "outil" | "autre";
  description?: string;
}

export interface CompteRenduInsert {
  session_id: string;
  apprenant_id: string;
  specialite: string;
  resume?: string | null;
  exercices?: ExerciceItem[] | null;
  objectifs?: ObjectifItem[] | null;
  ressources?: RessourceItem[] | null;
}

export interface CompteRenduUpdate {
  specialite?: string;
  resume?: string | null;
  exercices?: ExerciceItem[] | null;
  objectifs?: ObjectifItem[] | null;
  ressources?: RessourceItem[] | null;
}

// ─── Réponses API génériques ─────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ApiListResponse<T> {
  data: T[];
  error: string | null;
  success: boolean;
  count?: number;
}

// ─── Résultats métier ─────────────────────────────────────────

export interface AbonnementActifResult {
  actif: boolean;
  abonnement: AbonnementSeance | null;
  seances_restantes: number;
  message: string;
}

export interface DecompteSeanceResult {
  success: boolean;
  seances_restantes_avant: number;
  seances_restantes_apres: number;
  message: string;
  abonnement: AbonnementSeance | null;
}

export interface RolloverResult {
  success: boolean;
  seances_reportees: number;
  seances_restantes_avant: number;
  seances_restantes_apres: number;
  message: string;
  abonnement: AbonnementSeance | null;
}

export interface FormuleConfig {
  seances_mensuelles: number;
  rollover_max: number;
  prix_visio: number;
  prix_audio: number;
}

// ─── Configuration des formules ───────────────────────────────

export const FORMULES_CONFIG: Record<FormuleAbonnement, FormuleConfig> = {
  starter: {
    seances_mensuelles: 2,
    rollover_max: 1,
    prix_visio: 79,
    prix_audio: 59,
  },
  "bien-etre": {
    seances_mensuelles: 4,
    rollover_max: 2,
    prix_visio: 149,
    prix_audio: 109,
  },
  intensif: {
    seances_mensuelles: 8,
    rollover_max: 4,
    prix_visio: 279,
    prix_audio: 199,
  },
};

// ============================================================
// CRUD — RESERVATIONS
// ============================================================

/**
 * Crée une nouvelle réservation de séance
 */
export async function creerReservation(
  data: ReservationInsert
): Promise<ApiResponse<Reservation>> {
  try {
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        ...data,
        statut: data.statut ?? "en_attente",
      })
      .select()
      .single();

    if (error) throw error;

    return { data: reservation, error: null, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { data: null, error: message, success: false };
  }
}

/**
 * Récupère une réservation par son ID
 */
export async function getReservationById(
  id: string
): Promise<ApiResponse<Reservation>> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { data: null, error: message, success: false };
  }
}

/**
 * Récupère toutes les réservations d'un apprenant
 */
export async function getReservationsByApprenant(
  apprenantId: string,
  statut?: StatutReservation
): Promise<ApiListResponse<Reservation>> {
  try {
    let query = supabase
      .from("reservations")
      .select("*", { count: "exact" })
      .eq("apprenant_id", apprenantId)
      .order("date_heure", { ascending: false });

    if (statut) {
      query = query.eq("statut", statut);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data ?? [],
      error: null,
      success: true,
      count: count ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { data: [], error: message, success: false };
  }
}

/**
 * Met à jour une réservation
 */
export async function updateReservation(
  id: string,
  updates: ReservationUpdate
): Promise<ApiResponse<Reservation>> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { data: null, error: message, success: false };
  }
}

/**
 * Annule une réservation
 */
export async function annulerReservation(
  id: string
): Promise<ApiResponse<Reservation>> {
  return updateReservation(id, { statut: "annulee" });
}

/**
 * Confirme une réservation avec lien de salle
 */
export async function confirmerReservation(
  id: string,
  lienSalle: string
): Promise<ApiResponse<Reservation>> {
  return updateReservation(id, {
    statut: "confirmee",
    lien_salle: lienSalle,
  });
}

/**
 * Supprime une réservation
 */
export async function supprimerReservation(
  id: string
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { data: null, error: null, success: true };
  } catch (err)