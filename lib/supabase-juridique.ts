```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type DocumentJuridiqueType =
  | "contrat"
  | "facture"
  | "statuts"
  | "pv_ag"
  | "mandat"
  | "convention"
  | "accord"
  | "mise_en_demeure"
  | "cession"
  | "autre";

export type DocumentStatut =
  | "brouillon"
  | "en_attente_signature"
  | "signe"
  | "envoye"
  | "archive"
  | "annule";

export type NiveauDocument = "confidentiel" | "interne" | "public" | "secret";

export interface DocumentJuridique {
  id: string;
  type: DocumentJuridiqueType;
  destinataire: string;
  contenu: string;
  statut: DocumentStatut;
  signe_le: string | null;
  envoye_le: string | null;
  archive_url: string | null;
  niveau: NiveauDocument;
  created_at: string;
}

export interface DocumentJuridiqueInsert
  extends Omit<DocumentJuridique, "id" | "created_at"> {
  id?: string;
  created_at?: string;
}

export interface DocumentJuridiqueUpdate
  extends Partial<DocumentJuridiqueInsert> {}

// ------------------------------------------------------------

export type HoldingFluxType =
  | "dividende"
  | "remuneration"
  | "pret"
  | "remboursement_pret"
  | "frais_gestion"
  | "apport"
  | "cession_parts"
  | "loyer"
  | "prestation_service";

export interface HoldingFlux {
  id: string;
  type: HoldingFluxType;
  montant: number;
  de_entite: string;
  vers_entite: string;
  mois: number;
  annee: number;
  signe: boolean;
  paye: boolean;
  created_at: string;
}

export interface HoldingFluxInsert extends Omit<HoldingFlux, "id" | "created_at"> {
  id?: string;
  created_at?: string;
}

export interface HoldingFluxUpdate extends Partial<HoldingFluxInsert> {}

// ------------------------------------------------------------

export type VeilleJuridiqueDomaine =
  | "fiscal"
  | "social"
  | "commercial"
  | "immobilier"
  | "penal"
  | "europeen"
  | "crypto"
  | "ia"
  | "travail"
  | "holding";

export type NiveauUrgence = "faible" | "moyen" | "eleve" | "critique";

export type NiveauImpact = "negligeable" | "modere" | "important" | "majeur";

export interface VeilleJuridique {
  id: string;
  domaine: VeilleJuridiqueDomaine;
  titre: string;
  resume: string;
  urgence: NiveauUrgence;
  impact: NiveauImpact;
  action_requise: string | null;
  traite: boolean;
  created_at: string;
}

export interface VeilleJuridiqueInsert
  extends Omit<VeilleJuridique, "id" | "created_at"> {
  id?: string;
  created_at?: string;
}

export interface VeilleJuridiqueUpdate extends Partial<VeilleJuridiqueInsert> {}

// ------------------------------------------------------------

export type UrssafStatut =
  | "a_declarer"
  | "declare"
  | "paye"
  | "en_retard"
  | "controle"
  | "regularisation";

export interface UrssafDeclaration {
  id: string;
  mois: number;
  annee: number;
  ca_declare: number;
  cotisations: number;
  statut: UrssafStatut;
  declare_le: string | null;
  paye_le: string | null;
  preuve_url: string | null;
}

export interface UrssafDeclarationInsert
  extends Omit<UrssafDeclaration, "id"> {
  id?: string;
}

export interface UrssafDeclarationUpdate
  extends Partial<UrssafDeclarationInsert> {}

// ------------------------------------------------------------

export type ComplianceType =
  | "kbis"
  | "statuts_a_jour"
  | "registre_beneficiaires"
  | "declaration_fiscale"
  | "audit_comptes"
  | "ag_annuelle"
  | "rapport_gestion"
  | "dac6"
  | "lcb_ft"
  | "rgpd";

export type ComplianceStatut =
  | "conforme"
  | "non_conforme"
  | "en_cours"
  | "expire"
  | "a_renouveler";

export interface ComplianceHolding {
  id: string;
  entite: string;
  type: ComplianceType;
  echeance: string;
  statut: ComplianceStatut;
  complete_le: string | null;
  document_url: string | null;
  created_at: string;
}

export interface ComplianceHoldingInsert
  extends Omit<ComplianceHolding, "id" | "created_at"> {
  id?: string;
  created_at?: string;
}

export interface ComplianceHoldingUpdate
  extends Partial<ComplianceHoldingInsert> {}

// ============================================================
// RÉSULTATS DES FONCTIONS RPC
// ============================================================

export type StructureJuridique =
  | "sasu"
  | "sas"
  | "sarl"
  | "eurl"
  | "sci"
  | "holding_pure"
  | "holding_animatrice"
  | "lmnp"
  | "me";

export type RegimeFiscal =
  | "micro_bic"
  | "micro_bnc"
  | "reel_simplifie"
  | "reel_normal"
  | "is"
  | "ir";

export type ResidenceFiscale =
  | "france"
  | "dubai"
  | "portugal"
  | "luxembourg"
  | "suisse"
  | "autre_ue"
  | "hors_ue";

export interface OptimisationFiscaleResultat {
  ca: number;
  structure: StructureJuridique;
  residence: ResidenceFiscale;
  charge_sociale_estimee: number;
  impot_estime: number;
  taux_effectif: number;
  economies_potentielles: number;
  recommandations: string[];
  score_optimisation: number;
  dividende_optimise: number;
  remuneration_optimisee: number;
  regime_recommande: RegimeFiscal;
}

export interface FactureInterSocietes {
  id_facture: string;
  emetteur: string;
  recepteur: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  mois: number;
  annee: number;
  objet: string;
  statut: string;
  date_emission: string;
  date_echeance: string;
}

export interface GenerationFacturesResultat {
  factures_generees: FactureInterSocietes[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  nb_factures: number;
}

export interface ComplianceVerificationItem {
  entite: string;
  type: ComplianceType;
  statut: ComplianceStatut;
  echeance: string;
  jours_restants: number;
  alerte: boolean;
  action: string;
}

export interface ComplianceVerificationResultat {
  items: ComplianceVerificationItem[];
  score_global: number;
  non_conformites: number;
  alertes_critiques: number;
  prochaines_echeances: ComplianceVerificationItem[];
  recommandations: string[];
}

export interface RapportMensuelJuridique {
  periode: {
    mois: number;
    annee: number;
  };
  documents: {
    total: number;
    signes: number;
    en_attente: number;
    archives: number;
  };
  flux_holding: {
    total_entre: number;
    total_sorti: number;
    solde_net: number;
    nb_flux: number;
  };
  urssaf: {
    ca_total: number;
    cotisations_dues: number;
    statut: UrssafStatut;
  };
  compliance: {
    score: number;
    alertes: number;
    conformes: number;
  };
  veille: {
    nouvelles_alertes: number;
    urgentes: number;
    traitees: number;
  };
  resume_executif: string;
  actions_prioritaires: string[];
  generated_at: string;
}

export interface UrssafCalculResultat {
  ca: number;
  regime: RegimeFiscal;
  base_cotisable: number;
  taux_cotisations: number;
  cotisations_totales: number;
  detail_cotisations: {
    maladie: number;
    retraite_base: number;
    retraite_complementaire: number;
    invalidite_deces: number;
    allocations_familiales: number;
    csg_crds: number;
    formation_professionnelle: number;
  };
  net_apres_cotisations: number;
  accre_applicable: boolean;
  cotisations_avec_accre: number;
}

// ============================================================
// DATABASE SCHEMA
// ============================================================

export interface Database {
  public: {
    Tables: {
      documents_juridiques: {
        Row: DocumentJuridique;
        Insert: DocumentJuridiqueInsert;
        Update: DocumentJuridiqueUpdate;
      };
      holding_flux: {
        Row: HoldingFlux;
        Insert: HoldingFluxInsert;
        Update: HoldingFluxUpdate;
      };
      veille_juridique: {
        Row: VeilleJuridique;
        Insert: VeilleJuridiqueInsert;
        Update: VeilleJuridiqueUpdate;
      };
      urssaf_declarations: {
        Row: UrssafDeclaration;
        Insert: UrssafDeclarationInsert;
        Update: UrssafDeclarationUpdate;
      };
      compliance_holding: {
        Row: ComplianceHolding;
        Insert: ComplianceHoldingInsert;
        Update: ComplianceHoldingUpdate;
      };
    };
    Functions: {
      calculer_optimisation_fiscale: {
        Args: {
          ca: number;
          structure: StructureJuridique;
          residence: ResidenceFiscale;
        };
        Returns: OptimisationFiscaleResultat;
      };
      generer_factures_inter_societes: {
        Args: {
          ca_mois: number;
        };
        Returns: GenerationFacturesResultat;
      };
      verifier_compliance_holding: {
        Args: Record<string, never>;
        Returns: ComplianceVerificationResultat;
      };
      rapport_mensuel_juridique: {
        Args: Record<string, never>;
        Returns: RapportMensuelJuridique;
      };
      calculer_urssaf: {
        Args: {
          ca: number;
          regime: RegimeFiscal;
        };
        Returns: UrssafCalculResultat;
      };
    };
  };
}

// ============================================================
// CLIENT SUPABASE
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================================
// SERVICE — DOCUMENTS JURIDIQUES
// ============================================================

export const documentsJuridiquesService = {
  async getAll(): Promise<DocumentJuridique[]> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[documents_juridiques.getAll] ${error.message}`);
    return data ?? [];
  },

  async getById(id: string): Promise<DocumentJuridique | null> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(`[documents_juridiques.getById] ${error.message}`);
    return data;
  },

  async getByStatut(statut: DocumentStatut): Promise<DocumentJuridique[]> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .select("*")
      .eq("statut", statut)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[documents_juridiques.getByStatut] ${error.message}`);
    return data ?? [];
  },

  async getByType(type: DocumentJuridiqueType): Promise<DocumentJuridique[]> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[documents_juridiques.getByType] ${error.message}`);
    return data ?? [];
  },

  async getEnAttente(): Promise<DocumentJuridique[]> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .select("*")
      .eq("statut", "en_attente_signature")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`[documents_juridiques.getEnAttente] ${error.message}`);
    return data ?? [];
  },

  async create(
    payload: DocumentJuridiqueInsert
  ): Promise<DocumentJuridique> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`[documents_juridiques.create] ${error.message}`);
    return data;
  },

  async update(
    id: string,
    payload: DocumentJuridiqueUpdate
  ): Promise<DocumentJuridique> {
    const { data, error } = await supabase
      .from("documents_juridiques")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`[documents_juridiques.update] ${error.message}`);
    return data;
  },

  async signer(id