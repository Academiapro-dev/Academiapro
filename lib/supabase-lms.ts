```typescript
// ============================================================
// supabase/config.ts — Configuration AcadémIA Pro LMS
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variables d'environnement Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises."
  );
}

// ============================================================
// TYPES TYPESCRIPT — TABLES
// ============================================================

export type NiveauAbonnement = "elearning" | "premium" | "live";
export type StatutAbonnement = "actif" | "expire" | "suspendu" | "en_attente";
export type StatutSession = "planifie" | "en_cours" | "termine" | "annule";
export type StatutProspect =
  | "nouveau"
  | "contacte"
  | "qualifie"
  | "converti"
  | "perdu";
export type AgentType =
  | "onboarding"
  | "pedagogique"
  | "support"
  | "commercial"
  | "evaluation";

export interface Stagiaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  profil?: Record<string, unknown> | null;
  created_at: string;
}

export interface StagiaireInsert {
  id?: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  profil?: Record<string, unknown> | null;
  created_at?: string;
}

export interface StagiaireUpdate {
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  profil?: Record<string, unknown> | null;
}

// ---

export interface Abonnement {
  id: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  statut: StatutAbonnement;
  date_debut: string;
  date_fin: string;
}

export interface AbonnementInsert {
  id?: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  statut?: StatutAbonnement;
  date_debut: string;
  date_fin: string;
}

export interface AbonnementUpdate {
  niveau?: NiveauAbonnement;
  statut?: StatutAbonnement;
  date_debut?: string;
  date_fin?: string;
}

// ---

export interface Progression {
  id: string;
  apprenant_id: string;
  formation_id: string;
  module_id: string;
  complete: boolean;
  score?: number | null;
  temps_passe?: number | null; // en secondes
}

export interface ProgressionInsert {
  id?: string;
  apprenant_id: string;
  formation_id: string;
  module_id: string;
  complete?: boolean;
  score?: number | null;
  temps_passe?: number | null;
}

export interface ProgressionUpdate {
  complete?: boolean;
  score?: number | null;
  temps_passe?: number | null;
}

// ---

export interface SessionLive {
  id: string;
  formation_id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  replay_url?: string | null;
  statut: StatutSession;
}

export interface SessionLiveInsert {
  id?: string;
  formation_id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  replay_url?: string | null;
  statut?: StatutSession;
}

export interface SessionLiveUpdate {
  titre?: string;
  date_debut?: string;
  date_fin?: string;
  replay_url?: string | null;
  statut?: StatutSession;
}

// ---

export interface Presence {
  id: string;
  session_id: string;
  apprenant_id: string;
  heure_entree?: string | null;
  heure_sortie?: string | null;
  present: boolean;
}

export interface PresenceInsert {
  id?: string;
  session_id: string;
  apprenant_id: string;
  heure_entree?: string | null;
  heure_sortie?: string | null;
  present?: boolean;
}

export interface PresenceUpdate {
  heure_entree?: string | null;
  heure_sortie?: string | null;
  present?: boolean;
}

// ---

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface AgentConversation {
  id: string;
  agent_type: AgentType;
  apprenant_id: string;
  formation_id?: string | null;
  messages: Message[];
  created_at: string;
}

export interface AgentConversationInsert {
  id?: string;
  agent_type: AgentType;
  apprenant_id: string;
  formation_id?: string | null;
  messages?: Message[];
  created_at?: string;
}

export interface AgentConversationUpdate {
  messages?: Message[];
}

// ---

export interface Certificat {
  id: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  date_obtention: string;
  url_pdf?: string | null;
}

export interface CertificatInsert {
  id?: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  date_obtention?: string;
  url_pdf?: string | null;
}

export interface CertificatUpdate {
  url_pdf?: string | null;
  date_obtention?: string;
}

// ---

export interface Prospect {
  id: string;
  email: string;
  formation_id?: string | null;
  score?: number | null;
  statut: StatutProspect;
  source?: string | null;
  created_at: string;
}

export interface ProspectInsert {
  id?: string;
  email: string;
  formation_id?: string | null;
  score?: number | null;
  statut?: StatutProspect;
  source?: string | null;
  created_at?: string;
}

export interface ProspectUpdate {
  email?: string;
  formation_id?: string | null;
  score?: number | null;
  statut?: StatutProspect;
  source?: string | null;
}

// ============================================================
// DATABASE TYPE (Supabase Schema)
// ============================================================

export interface Database {
  public: {
    Tables: {
      stagiaires: {
        Row: Stagiaire;
        Insert: StagiaireInsert;
        Update: StagiaireUpdate;
      };
      abonnements: {
        Row: Abonnement;
        Insert: AbonnementInsert;
        Update: AbonnementUpdate;
      };
      progressions: {
        Row: Progression;
        Insert: ProgressionInsert;
        Update: ProgressionUpdate;
      };
      sessions_live: {
        Row: SessionLive;
        Insert: SessionLiveInsert;
        Update: SessionLiveUpdate;
      };
      presences: {
        Row: Presence;
        Insert: PresenceInsert;
        Update: PresenceUpdate;
      };
      agents_conversations: {
        Row: AgentConversation;
        Insert: AgentConversationInsert;
        Update: AgentConversationUpdate;
      };
      certificats: {
        Row: Certificat;
        Insert: CertificatInsert;
        Update: CertificatUpdate;
      };
      prospects: {
        Row: Prospect;
        Insert: ProspectInsert;
        Update: ProspectUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      niveau_abonnement: NiveauAbonnement;
      statut_abonnement: StatutAbonnement;
      statut_session: StatutSession;
      statut_prospect: StatutProspect;
      agent_type: AgentType;
    };
  };
}

// ============================================================
// SUPABASE CLIENTS
// ============================================================

/**
 * Client Supabase côté navigateur (singleton)
 * Usage : composants React, hooks, actions client
 */
export const supabaseClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Client Supabase côté serveur (Next.js App Router)
 * Usage : Server Components, Route Handlers, Server Actions
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignoré dans les Server Components (lecture seule)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignoré dans les Server Components (lecture seule)
        }
      },
    },
  });
}

/**
 * Client Supabase avec droits admin (service role)
 * Usage : opérations administratives, webhooks, scripts
 * ⚠️  Ne jamais exposer côté client
 */
export function createSupabaseAdminClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante — client admin indisponible."
    );
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================
// RÉSULTAT GÉNÉRIQUE
// ============================================================

export interface CrudResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

function ok<T>(data: T): CrudResult<T> {
  return { data, error: null, success: true };
}

function fail<T>(message: string): CrudResult<T> {
  return