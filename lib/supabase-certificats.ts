// ============================================================
// AcadémIA Pro — Supabase Certificats Service
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type Mention = "Passable" | "Assez Bien" | "Bien" | "Très Bien" | "Excellent";
export type Niveau = "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
export type BadgeType =
  | "PREMIER_MODULE"
  | "FORMATION_COMPLETE"
  | "MENTION_EXCELLENCE"
  | "SCORE_PARFAIT"
  | "SPEED_LEARNER"
  | "PERSEVERANCE"
  | "TOP_APPRENANT";

// ----------------------------
// Certificat
// ----------------------------
export interface Certificat {
  id: string;
  apprenant_id: string;
  formation_id: string;
  niveau: Niveau;
  score: number;
  mention: Mention;
  numero_serie: string;
  pdf_url: string | null;
  qr_code: string | null;
  date_obtention: string;
  valide: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CertificatInsert {
  apprenant_id: string;
  formation_id: string;
  niveau: Niveau;
  score: number;
  mention: Mention;
  numero_serie: string;
  pdf_url?: string | null;
  qr_code?: string | null;
  date_obtention?: string;
  valide?: boolean;
}

export interface CertificatUpdate {
  niveau?: Niveau;
  score?: number;
  mention?: Mention;
  pdf_url?: string | null;
  qr_code?: string | null;
  date_obtention?: string;
  valide?: boolean;
}

// ----------------------------
// Progression Certification
// ----------------------------
export interface ProgressionCertification {
  id: string;
  apprenant_id: string;
  formation_id: string;
  modules_completes: number;
  score_moyen: number;
  test_final: boolean;
  projet_valide: boolean;
  eligible_certificat: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressionCertificationInsert {
  apprenant_id: string;
  formation_id: string;
  modules_completes?: number;
  score_moyen?: number;
  test_final?: boolean;
  projet_valide?: boolean;
  eligible_certificat?: boolean;
}

export interface ProgressionCertificationUpdate {
  modules_completes?: number;
  score_moyen?: number;
  test_final?: boolean;
  projet_valide?: boolean;
  eligible_certificat?: boolean;
}

// ----------------------------
// Badge
// ----------------------------
export interface Badge {
  id: string;
  apprenant_id: string;
  type: BadgeType;
  formation_id: string | null;
  obtenu_le: string;
  partage_linkedin: boolean;
  created_at?: string;
}

export interface BadgeInsert {
  apprenant_id: string;
  type: BadgeType;
  formation_id?: string | null;
  obtenu_le?: string;
  partage_linkedin?: boolean;
}

export interface BadgeUpdate {
  partage_linkedin?: boolean;
}

// ----------------------------
// Vérification
// ----------------------------
export interface Verification {
  id: string;
  numero_certificat: string;
  verifie_par_ip: string;
  date_verification: string;
  created_at?: string;
}

export interface VerificationInsert {
  numero_certificat: string;
  verifie_par_ip: string;
  date_verification?: string;
}

// ----------------------------
// Résultats des fonctions RPC
// ----------------------------
export interface EligibiliteCertificatResult {
  eligible: boolean;
  raison: string | null;
  score_moyen: number;
  modules_completes: number;
  test_final: boolean;
  projet_valide: boolean;
  progression_id: string | null;
}

export interface MentionResult {
  mention: Mention;
  seuil_min: number;
  seuil_max: number;
}

export interface NumeroSerieResult {
  numero_serie: string;
  genere_le: string;
}

export interface ValidationCertificatResult {
  valide: boolean;
  certificat: Certificat | null;
  message: string;
}

export interface CertificatApprenantResult {
  certificats: Certificat[];
  total: number;
  badges: Badge[];
}

// ----------------------------
// Types génériques réponses
// ----------------------------
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: string | null;
}

// ----------------------------
// Filtres & options
// ----------------------------
export interface CertificatFilters {
  apprenant_id?: string;
  formation_id?: string;
  niveau?: Niveau;
  mention?: Mention;
  valide?: boolean;
  date_debut?: string;
  date_fin?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface BadgeFilters {
  apprenant_id?: string;
  type?: BadgeType;
  formation_id?: string;
  partage_linkedin?: boolean;
}

// ----------------------------
// Database schema type
// ----------------------------
export interface Database {
  public: {
    Tables: {
      certificats: {
        Row: Certificat;
        Insert: CertificatInsert;
        Update: CertificatUpdate;
      };
      progressions_certification: {
        Row: ProgressionCertification;
        Insert: ProgressionCertificationInsert;
        Update: ProgressionCertificationUpdate;
      };
      badges: {
        Row: Badge;
        Insert: BadgeInsert;
        Update: BadgeUpdate;
      };
      verifications: {
        Row: Verification;
        Insert: VerificationInsert;
        Update: Partial<VerificationInsert>;
      };
    };
    Functions: {
      verifier_eligibilite_certificat: {
        Args: { apprenant_id: string; formation_id: string };
        Returns: EligibiliteCertificatResult;
      };
      calculer_mention: {
        Args: { score: number };
        Returns: MentionResult;
      };
      generer_numero_serie: {
        Args: Record<string, never>;
        Returns: NumeroSerieResult;
      };
      valider_certificat: {
        Args: { numero: string };
        Returns: ValidationCertificatResult;
      };
      get_certificats_apprenant: {
        Args: { apprenant_id: string };
        Returns: CertificatApprenantResult;
      };
    };
  };
}

// ============================================================
// CLIENT SUPABASE
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// ============================================================
// HELPERS INTERNES
// ============================================================

function handleError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Une erreur inattendue est survenue.";
}

function buildResponse<T>(
  data: T | null,
  error: unknown = null
): ServiceResponse<T> {
  if (error !== null) {
    return { data: null, error: handleError(error), success: false };
  }
  return { data, error: null, success: true };
}

// ============================================================
// SERVICE — CERTIFICATS
// ============================================================

export const certificatsService = {

  // ----------------------------
  // Créer un certificat
  // ----------------------------
  async creer(
    payload: CertificatInsert
  ): Promise<ServiceResponse<Certificat>> {
    try {
      const { data, error } = await supabase
        .from("certificats")
        .insert({
          ...payload,
          date_obtention: payload.date_obtention ?? new Date().toISOString(),
          valide: payload.valide ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return buildResponse<Certificat>(data);
    } catch (err) {
      return buildResponse<Certificat>(null, err);
    }
  },

  // ----------------------------
  // Récupérer par ID
  // ----------------------------
  async getById(id: string): Promise<ServiceResponse<Certificat>> {
    try {
      const { data, error } = await supabase
        .from("certificats")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return buildResponse<Certificat>(data);
    } catch (err) {
      return buildResponse<Certificat>(null, err);
    }
  },

  // ----------------------------
  // Récupérer par numéro de série
  // ----------------------------
  async getByNumeroSerie(
    numeroSerie: string
  ): Promise<ServiceResponse<Certificat>> {
    try {
      const { data, error } = await supabase
        .from("certificats")
        .select("*")
        .eq("numero_serie", numeroSerie)
        .single();

      if (error) throw error;
      return buildResponse<Certificat>(data);
    } catch (err) {
      return buildResponse<Certificat>(null, err);
    }
  },

  // ----------------------------
  // Lister avec filtres & pagination
  // ----------------------------
  async lister(
    filters: CertificatFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<Certificat>> {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = "date_obtention",
        ascending = false,
      } = options;

      const offset = (page - 1) * limit;

      let query = supabase
        .from("certificats")
        .select("*", { count: "exact" });

      if (filters.apprenant_id) query = query.eq("apprenant_id", filters.apprenant_id);
      if (filters.formation_id) query = query.eq("formation_id", filters.formation_id);
      if (filters.niveau)       query = query.eq("niveau", filters.niveau);
      if (filters.mention)      query = query.eq("mention", filters.mention);
      if (filters.valide !== undefined) query = query.eq("valide", filters.valide);
      if (filters.date_debut)   query = query.gte("date_obtention", filters.date_debut);
      if (filters.date_fin)     query = query.lte("date_obtention", filters.date_fin);

      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count ?? 0;
      return {
        data: data ?? [],
        total,
        page,
        limit,
        hasMore: offset + limit < total,
        error: null,
      };
    } catch (err) {
      return {
        data: [],
        total: 0,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
        hasMore: false,
        error: handleError(err),
      };
    }
  },

  // ----------------------------
  // Mettre à jour
  // ----------------------------
  async mettrAJour(
    id: string,
    payload: CertificatUpdate
  ): Promise<ServiceResponse<Certificat>> {
    try {
      const { data, error } = await supabase
        .from("certificats")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return buildResponse<Certificat>(data);
    } catch (err) {
      return buildResponse<Certificat>(null, err);
    }
  },

  // ----------------------------
  // Révoquer (invalider)
  // ----------------------------
  async revoquer(id: string): Promise<ServiceResponse<Certificat>> {
    return certificatsService.mettrAJour(id, { valide: false });
  },

  // ----------------------------
  // Mettre à jour l'URL du PDF
  // ----------------------------
  async mettreAJourPdf(
    id: string,
    pdfUrl: string
  ): Promise<ServiceResponse<Certificat>> {
    return certificatsService.mettrAJour(id, { pdf_url: pdfUrl });
  },

  // ----------------------------
  // Mettre à jour le QR code
  // ----------------------------
  async mettreAJourQrCode(
    id: string,
    qrCode: string
  ): Promise<ServiceResponse<Certificat>> {
    return certificatsService.mettrAJour(id, { qr_code: qrCode });
  },

  // ----------------------------
  // Supprimer
  // ----------------------------
  async supprimer(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("certificats")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return buildResponse<boolean>(true);
    } catch (err) {
      return buildResponse<boolean>(null, err);
    }
  },

  // ----------------------------
  // Compter par apprenant
  // ----------------------------
  async compterParApprenant(apprenantId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from("certificats")
        .select("*", { count: "exact", head: true })
        .eq("apprenant_id", apprenantId)
        .eq("valide", true);

      if (error) throw error;
      return buildResponse<number>(count ?? 0);
    } catch (err) {
      return buildResponse<number>(null, err);
    }
  },
};

// ============================================================
// SERVICE — PROGRESSIONS CERTIFICATION
// ============================================================

export const progressionsCertificationService = {

  // ----------------------------
  // Créer ou initialiser une progression
  // ----------------------------
  async initialiser(
    payload: ProgressionCertificationInsert
  ): Promise<ServiceResponse<ProgressionCertification>> {
    try {
      const { data, error } = await supabase
        .from("progressions_certification")
        .insert({
          modules_completes: 0,
          score_moyen: 0,
          test_final: false,
          projet_valide: false,
          eligible_certificat: false,
          ...payload,