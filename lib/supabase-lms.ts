```typescript
// ============================================================
// supabase/config.ts - Configuration Supabase AcadémIA Pro
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================
// TYPES TYPESCRIPT
// ============================================================

export type NiveauAbonnement = "elearning" | "premium" | "live";
export type StatutAbonnement = "actif" | "expire" | "suspendu" | "essai";
export type StatutSession = "planifiee" | "en_cours" | "terminee" | "annulee";
export type StatutProspect = "nouveau" | "contacte" | "converti" | "perdu";
export type AgentType =
  | "tuteur"
  | "coach"
  | "commercial"
  | "support"
  | "evaluateur";

export interface Stagiaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  profil?: Record<string, unknown>;
  created_at: string;
}

export interface Abonnement {
  id: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  statut: StatutAbonnement;
  date_debut: string;
  date_fin?: string;
}

export interface Progression {
  id: string;
  apprenant_id: string;
  formation_id: string;
  module_id: string;
  complete: boolean;
  score?: number;
  temps_passe?: number;
}

export interface SessionLive {
  id: string;
  formation_id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  replay_url?: string;
  statut: StatutSession;
}

export interface Presence {
  id: string;
  session_id: string;
  apprenant_id: string;
  heure_entree?: string;
  heure_sortie?: string;
  present: boolean;
}

export interface AgentConversation {
  id: string;
  agent_type: AgentType;
  apprenant_id: string;
  formation_id: string;
  messages: Message[];
  created_at: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Certificat {
  id: string;
  apprenant_id: string;
  formation_id: string;
  niveau: NiveauAbonnement;
  date_obtention: string;
  url_pdf?: string;
}

export interface Prospect {
  id: string;
  email: string;
  formation_id: string;
  score?: number;
  statut: StatutProspect;
  source?: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      stagiaires: {
        Row: Stagiaire;
        Insert: Omit<Stagiaire, "id" | "created_at">;
        Update: Partial<Omit<Stagiaire, "id" | "created_at">>;
      };
      abonnements: {
        Row: Abonnement;
        Insert: Omit<Abonnement, "id">;
        Update: Partial<Omit<Abonnement, "id">>;
      };
      progressions: {
        Row: Progression;
        Insert: Omit<Progression, "id">;
        Update: Partial<Omit<Progression, "id">>;
      };
      sessions_live: {
        Row: SessionLive;
        Insert: Omit<SessionLive, "id">;
        Update: Partial<Omit<SessionLive, "id">>;
      };
      presences: {
        Row: Presence;
        Insert: Omit<Presence, "id">;
        Update: Partial<Omit<Presence, "id">>;
      };
      agents_conversations: {
        Row: AgentConversation;
        Insert: Omit<AgentConversation, "id" | "created_at">;
        Update: Partial<Omit<AgentConversation, "id" | "created_at">>;
      };
      certificats: {
        Row: Certificat;
        Insert: Omit<Certificat, "id">;
        Update: Partial<Omit<Certificat, "id">>;
      };
      prospects: {
        Row: Prospect;
        Insert: Omit<Prospect, "id" | "created_at">;
        Update: Partial<Omit<Prospect, "id" | "created_at">>;
      };
    };
  };
}

// ============================================================
// CLIENTS SUPABASE
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[AcadémIA Pro] Variables d'environnement Supabase manquantes"
  );
}

// Client côté navigateur
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Client côté serveur avec cookies (Next.js App Router)
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

// Client admin avec service role (opérations sensibles)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================
// CRUD - STAGIAIRES
// ============================================================

export const stagiaireService = {
  async getById(id: string): Promise<Stagiaire | null> {
    const { data, error } = await supabaseClient
      .from("stagiaires")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[stagiaireService.getById]", error.message);
      return null;
    }
    return data;
  },

  async getByEmail(email: string): Promise<Stagiaire | null> {
    const { data, error } = await supabaseClient
      .from("stagiaires")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error) return null;
    return data;
  },

  async getAll(): Promise<Stagiaire[]> {
    const { data, error } = await supabaseClient
      .from("stagiaires")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[stagiaireService.getAll]", error.message);
      return [];
    }
    return data ?? [];
  },

  async create(
    payload: Database["public"]["Tables"]["stagiaires"]["Insert"]
  ): Promise<Stagiaire | null> {
    const { data, error } = await supabaseClient
      .from("stagiaires")
      .insert({ ...payload, email: payload.email.toLowerCase().trim() })
      .select()
      .single();

    if (error) {
      console.error("[stagiaireService.create]", error.message);
      return null;
    }
    return data;
  },

  async update(
    id: string,
    payload: Database["public"]["Tables"]["stagiaires"]["Update"]
  ): Promise<Stagiaire | null> {
    const { data, error } = await supabaseClient
      .from("stagiaires")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[stagiaireService.update]", error.message);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from("stagiaires")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[stagiaireService.delete]", error.message);
      return false;
    }
    return true;
  },
};

// ============================================================
// CRUD - ABONNEMENTS
// ============================================================

export const abonnementService = {
  async getByApprenant(apprenantId: string): Promise<Abonnement[]> {
    const { data, error } = await supabaseClient
      .from("abonnements")
      .select("*")
      .eq("apprenant_id", apprenantId)
      .order("date_debut", { ascending: false });

    if (error) {
      console.error("[abonnementService.getByApprenant]", error.message);
      return [];
    }
    return data ?? [];
  },

  async getActifByApprenant(
    apprenantId: string,
    formationId: string
  ): Promise<Abonnement | null> {
    const { data, error } = await supabaseClient
      .from("abonnements")
      .select("*")
      .eq("apprenant_id", apprenantId)
      .eq("formation_id", formationId)
      .eq("statut", "actif")
      .single();

    if (error) return null;
    return data;
  },

  async create(
    payload: Database["public"]["Tables"]["abonnements"]["Insert"]
  ): Promise<Abonnement | null> {
    const { data, error } = await supabaseClient
      .from("abonnements")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[abonnementService.create]", error.message);
      return null;
    }
    return data;
  },

  async update(
    id: string,
    payload: Database["public"]["Tables"]["abonnements"]["Update"]
  ): Promise<Abonnement | null> {
    const { data, error } = await supabaseClient
      .from("abonnements")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[abonnementService.update]", error.message);
      return null;
    }
    return data;
  },

  async résilier(id: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from("abonnements")
      .update({ statut: "expire" })
      .eq("id", id);

    if (error) {