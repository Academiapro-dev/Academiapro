// ============================================================
// AcadémIA Pro - CRM Supabase TypeScript - Code Complet
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type ContactStatus =
  | "prospect"
  | "lead"
  | "client"
  | "inactif"
  | "vip";
export type OpportuniteStatut =
  | "nouvelle"
  | "qualification"
  | "proposition"
  | "negociation"
  | "gagnee"
  | "perdue";
export type InteractionType =
  | "email"
  | "appel"
  | "reunion"
  | "demo"
  | "formation"
  | "support";
export type Priorite = "basse" | "moyenne" | "haute" | "urgente";

export interface Entreprise {
  id: string;
  nom: string;
  secteur: string | null;
  taille: "TPE" | "PME" | "ETI" | "GE" | null;
  site_web: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string;
  chiffre_affaires: number | null;
  nb_employes: number | null;
  score_compte: number;
  date_creation: string;
  date_modification: string;
  metadata: Record<string, unknown>;
}

export interface Contact {
  id: string;
  entreprise_id: string | null;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  poste: string | null;
  departement: string | null;
  statut: ContactStatus;
  score_lead: number;
  source: string | null;
  tags: string[];
  date_naissance: string | null;
  linkedin_url: string | null;
  date_dernier_contact: string | null;
  date_creation: string;
  date_modification: string;
  metadata: Record<string, unknown>;
  entreprise?: Entreprise;
}

export interface Interaction {
  id: string;
  contact_id: string;
  opportunite_id: string | null;
  type: InteractionType;
  titre: string;
  description: string | null;
  date_interaction: string;
  duree_minutes: number | null;
  resultat: string | null;
  prochain_suivi: string | null;
  cree_par: string;
  date_creation: string;
  contact?: Contact;
  opportunite?: Opportunite;
}

export interface Opportunite {
  id: string;
  contact_id: string;
  entreprise_id: string | null;
  titre: string;
  description: string | null;
  statut: OpportuniteStatut;
  valeur_estimee: number;
  probabilite: number;
  valeur_ponderee: number;
  priorite: Priorite;
  date_cloture_prevue: string | null;
  date_cloture_reelle: string | null;
  source: string | null;
  concurrents: string[];
  etape_suivante: string | null;
  date_creation: string;
  date_modification: string;
  contact?: Contact;
  entreprise?: Entreprise;
  interactions?: Interaction[];
}

export interface Note {
  id: string;
  contact_id: string | null;
  entreprise_id: string | null;
  opportunite_id: string | null;
  titre: string;
  contenu: string;
  priorite: Priorite;
  tags: string[];
  est_epinglee: boolean;
  cree_par: string;
  date_creation: string;
  date_modification: string;
}

export interface DoublonCandidat {
  contact_original: Contact;
  contact_doublon: Contact;
  score_similarite: number;
  raisons: string[];
}

export interface ScoreContact {
  contact_id: string;
  score_total: number;
  details: {
    score_completude_profil: number;
    score_engagement: number;
    score_opportunites: number;
    score_recence: number;
    score_interactions: number;
  };
}

export interface FiltresContact {
  statut?: ContactStatus;
  entreprise_id?: string;
  score_min?: number;
  score_max?: number;
  tags?: string[];
  source?: string;
  date_creation_debut?: string;
  date_creation_fin?: string;
  recherche?: string;
}

export interface FiltresOpportunite {
  statut?: OpportuniteStatut;
  priorite?: Priorite;
  valeur_min?: number;
  valeur_max?: number;
  probabilite_min?: number;
  contact_id?: string;
  entreprise_id?: string;
  date_cloture_debut?: string;
  date_cloture_fin?: string;
}

export interface PaginationOptions {
  page: number;
  limite: number;
  tri_par?: string;
  ordre?: "asc" | "desc";
}

export interface ResultatPagine<T> {
  donnees: T[];
  total: number;
  page: number;
  limite: number;
  total_pages: number;
}

export interface StatistiquesCRM {
  total_contacts: number;
  contacts_par_statut: Record<ContactStatus, number>;
  total_opportunites: number;
  valeur_pipeline_total: number;
  valeur_ponderee_total: number;
  taux_conversion: number;
  opportunites_par_statut: Record<OpportuniteStatut, number>;
  interactions_ce_mois: number;
  top_sources: Array<{ source: string; count: number }>;
}

// ============================================================
// SCHÉMA SQL (Migration Supabase)
// ============================================================

export const SCHEMA_SQL = `
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table Entreprises
CREATE TABLE IF NOT EXISTS entreprises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  secteur VARCHAR(100),
  taille VARCHAR(10) CHECK (taille IN ('TPE', 'PME', 'ETI', 'GE')),
  site_web VARCHAR(500),
  telephone VARCHAR(50),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(20),
  pays VARCHAR(100) DEFAULT 'France',
  chiffre_affaires DECIMAL(15,2),
  nb_employes INTEGER,
  score_compte INTEGER DEFAULT 0 CHECK (score_compte >= 0 AND score_compte <= 100),
  date_creation TIMESTAMPTZ DEFAULT NOW(),
  date_modification TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telephone VARCHAR(50),
  poste VARCHAR(150),
  departement VARCHAR(100),
  statut VARCHAR(20) DEFAULT 'prospect' 
    CHECK (statut IN ('prospect', 'lead', 'client', 'inactif', 'vip')),
  score_lead INTEGER DEFAULT 0 CHECK (score_lead >= 0 AND score_lead <= 100),
  source VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  date_naissance DATE,
  linkedin_url VARCHAR(500),
  date_dernier_contact TIMESTAMPTZ,
  date_creation TIMESTAMPTZ DEFAULT NOW(),
  date_modification TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table Opportunités
CREATE TABLE IF NOT EXISTS opportunites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  titre VARCHAR(300) NOT NULL,
  description TEXT,
  statut VARCHAR(20) DEFAULT 'nouvelle'
    CHECK (statut IN ('nouvelle', 'qualification', 'proposition', 'negociation', 'gagnee', 'perdue')),
  valeur_estimee DECIMAL(12,2) DEFAULT 0,
  probabilite INTEGER DEFAULT 0 CHECK (probabilite >= 0 AND probabilite <= 100),
  valeur_ponderee DECIMAL(12,2) GENERATED ALWAYS AS (valeur_estimee * probabilite / 100) STORED,
  priorite VARCHAR(10) DEFAULT 'moyenne'
    CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
  date_cloture_prevue DATE,
  date_cloture_reelle DATE,
  source VARCHAR(100),
  concurrents TEXT[] DEFAULT '{}',
  etape_suivante TEXT,
  date_creation TIMESTAMPTZ DEFAULT NOW(),
  date_modification TIMESTAMPTZ DEFAULT NOW()
);

-- Table Interactions
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('email', 'appel', 'reunion', 'demo', 'formation', 'support')),
  titre VARCHAR(300) NOT NULL,
  description TEXT,
  date_interaction TIMESTAMPTZ DEFAULT NOW(),
  duree_minutes INTEGER,
  resultat TEXT,
  prochain_suivi TIMESTAMPTZ,
  cree_par VARCHAR(255) NOT NULL,
  date_creation TIMESTAMPTZ DEFAULT NOW()
);

-- Table Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE CASCADE,
  titre VARCHAR(300) NOT NULL,
  contenu TEXT NOT NULL,
  priorite VARCHAR(10) DEFAULT 'moyenne'
    CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
  tags TEXT[] DEFAULT '{}',
  est_epinglee BOOLEAN DEFAULT FALSE,
  cree_par VARCHAR(255) NOT NULL,
  date_creation TIMESTAMPTZ DEFAULT NOW(),
  date_modification TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_entreprise ON contacts(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts(statut);
CREATE INDEX IF NOT EXISTS idx_contacts_score ON contacts(score_lead DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_nom_prenom ON contacts USING gin(
  (prenom || ' ' || nom) gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS idx_opportunites_contact ON opportunites(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunites_statut ON opportunites(statut);
CREATE INDEX IF NOT EXISTS idx_opportunites_cloture ON opportunites(date_cloture_prevue);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_notes_contact ON notes(contact_id);

-- Fonction mise