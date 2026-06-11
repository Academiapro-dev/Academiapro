import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// TYPES TYPESCRIPT
// ============================================================

export type LeadStatut = "nouveau" | "qualifié" | "converti" | "perdu";
export type SequenceType = "nurturing" | "onboarding" | "relance" | "promo";
export type PublicationStatut = "brouillon" | "planifié" | "publié" | "archivé";
export type CampagneStatut = "active" | "pause" | "terminée" | "brouillon";
export type ContenuStatut = "brouillon" | "révision" | "publié" | "archivé";
export type Plateforme =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "google"
  | "tiktok";

export interface Lead {
  id?: string;
  email: string;
  prenom: string;
  metier: string;
  source: string;
  score: number;
  statut: LeadStatut;
  created_at?: string;
}

export interface SequenceEmail {
  id?: string;
  lead_id: string;
  sequence_type: SequenceType;
  etape: number;
  envoye: boolean;
  ouvert: boolean;
  clique: boolean;
  created_at?: string;
}

export interface PublicationSocial {
  id?: string;
  plateforme: Plateforme;
  contenu: string;
  hashtags: string[];
  statut: PublicationStatut;
  publie_le?: string;
  likes: number;
  partages: number;
}

export interface CampagneAds {
  id?: string;
  plateforme: Plateforme;
  nom: string;
  budget: number;
  depense: number;
  clics: number;
  conversions: number;
  roas: number;
  statut: CampagneStatut;
}

export interface ContenuBlog {
  id?: string;
  titre: string;
  contenu: string;
  mots_cles: string[];
  statut: ContenuStatut;
  publie_le?: string;
  vues: number;
}

export interface Webinaire {
  id?: string;
  titre: string;
  date: string;
  inscrits: number;
  presents: number;
  conversions: number;
  replay_url?: string;
}

export interface Ebook {
  id?: string;
  email: string;
  source: string;
  telecharge_le: string;
  converti: boolean;
}

// Types pour les rapports
export interface RapportMarketing {
  periode: {
    debut: string;
    fin: string;
  };
  leads: {
    total: number;
    nouveaux: number;
    qualifies: number;
    convertis: number;
    score_moyen: number;
    taux_conversion: number;
  };
  emails: {
    total_envoyes: number;
    taux_ouverture: number;
    taux_clic: number;
    sequences_actives: number;
  };
  social: {
    total_publications: number;
    total_likes: number;
    total_partages: number;
    engagement_rate: number;
    meilleure_plateforme: string;
  };
  ads: {
    budget_total: number;
    depense_totale: number;
    total_clics: number;
    total_conversions: number;
    roas_moyen: number;
    cout_par_conversion: number;
  };
  blog: {
    total_articles: number;
    total_vues: number;
    article_plus_lu: string;
    vues_moyennes: number;
  };
  webinaires: {
    total: number;
    taux_presence_moyen: number;
    total_conversions: number;
    taux_conversion_moyen: number;
  };
  ebooks: {
    total_telechargements: number;
    taux_conversion: number;
    meilleure_source: string;
  };
}

export interface ScoreLead {
  score_total: number;
  details: {
    source: number;
    metier: number;
    engagement_email: number;
    telechargements: number;
    webinaires: number;
  };
}

export interface ConversionTracking {
  lead_id: string;
  source_conversion: string;
  valeur: number;
  timestamp: string;
  canal: string;
}

// ============================================================
// CLIENT SUPABASE
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================================
// CRUD LEADS
// ============================================================

export const LeadsCRUD = {
  async creer(lead: Omit<Lead, "id" | "created_at">): Promise<Lead> {
    const score = await calculerScoreLead(lead.email, lead.source, lead.metier);
    const { data, error } = await supabase
      .from("leads")
      .insert({ ...lead, score: score.score_total })
      .select()
      .single();

    if (error) throw new Error(`Erreur création lead: ${error.message}`);
    return data as Lead;
  },

  async lire(id: string): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(`Erreur lecture lead: ${error.message}`);
    return data as Lead;
  },

  async lireTous(filtres?: {
    statut?: LeadStatut;
    source?: string;
    score_min?: number;
  }): Promise<Lead[]> {
    let query = supabase.from("leads").select("*");

    if (filtres?.statut) query = query.eq("statut", filtres.statut);
    if (filtres?.source) query = query.eq("source", filtres.source);
    if (filtres?.score_min) query = query.gte("score", filtres.score_min);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new Error(`Erreur lecture leads: ${error.message}`);
    return data as Lead[];
  },

  async mettreAJour(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Erreur mise à jour lead: ${error.message}`);
    return data as Lead;
  },

  async supprimer(id: string): Promise<void> {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw new Error(`Erreur suppression lead: ${error.message}`);
  },

  async rechercherParEmail(email: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw new Error(`Erreur recherche lead: ${error.message}`);
    return data as Lead | null;
  },

  async mettreAJourStatut(id: string, statut: LeadStatut): Promise<Lead> {
    return this.mettreAJour(id, { statut });
  },

  async rafraichirScore(id: string): Promise<Lead> {
    const lead = await this.lire(id);
    const score = await calculerScoreLead(lead.email, lead.source, lead.metier);
    return this.mettreAJour(id, { score: score.score_total });
  },
};

// ============================================================
// CRUD SEQUENCES EMAIL
// ============================================================

export const SequencesEmailCRUD = {
  async creer(
    sequence: Omit<SequenceEmail, "id" | "created_at">
  ): Promise<SequenceEmail> {
    const { data, error } = await supabase
      .from("sequences_email")
      .insert(sequence)
      .select()
      .single();

    if (error) throw new Error(`Erreur création séquence: ${error.message}`);
    return data as SequenceEmail;
  },

  async lirePourLead(lead_id: string): Promise<SequenceEmail[]> {
    const { data, error } = await supabase
      .from("sequences_email")
      .select("*")
      .eq("lead_id", lead_id)
      .order("etape", { ascending: true });

    if (error)
      throw new Error(`Erreur lecture séquences lead: ${error.message}`);
    return data as SequenceEmail[];
  },

  async marquerEnvoye(id: string): Promise<SequenceEmail> {
    const { data, error } = await supabase
      .from("sequences_email")
      .update({ envoye: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Erreur marquage envoi: ${error.message}`);

    // Mise à jour du score lead après envoi
    const sequence = data as SequenceEmail;
    await LeadsCRUD.rafraichirScore(sequence.lead_id);

    return sequence;
  },

  async marquerOuvert(id: string): Promise<SequenceEmail> {
    const { data, error } = await supabase
      .from("sequences_email")
      .update({ ouvert: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Erreur marquage ouverture: ${error.message}`);

    const sequence = data as SequenceEmail;
    await LeadsCRUD.rafraichirScore(sequence.lead_id);

    return sequence;
  },

  async marquerClique(id: string): Promise<SequenceEmail> {
    const { data, error } = await supabase
      .from("sequences_email")
      .update({ clique: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Erreur marquage clic: ${error.message}`);

    const sequence = data as SequenceEmail;
    await LeadsCRUD.rafraichirScore(sequence.lead_id);

    return sequence;
  },

  async statistiques(): Promise<{
    total: number;
    taux_ouverture: number;
    taux_clic: number;
    par_type: Record<SequenceType, number>;
  }> {
    const { data, error } = await supabase
      .from("sequences_email")
      .select("*")
      .eq("envoye", true);

    if (error) throw new Error(`Erreur stats séquences: ${error.message}`);

    const sequences = data as SequenceEmail[];
    const total = sequences.length;
    const ouverts = sequences.filter((s) => s.ouvert).length;
    const cliques = sequences.filter((s) => s.clique).length;

    const par_type = sequences.reduce(
      (acc, seq) => {
        acc[seq.sequence_type] = (acc[seq.sequence_type] || 0) + 1;
        return acc;
      },
      {} as Record<SequenceType, number>
    );

    return {
      total,
      taux_ouverture: total > 0 ? (ouverts / total) * 100 : 0,
      taux_clic: total > 0 ? (cliques / total) * 100 : 0,
      par_type,
    };
  },
};

// ============================================================
// CRUD PUBLICATIONS SOCIAL
// ============================================================

export const PublicationsSocialCRUD = {
  async creer(
    publication: Omit<PublicationSocial, "id">
  ): Promise<PublicationSocial> {
    const { data, error } = await supabase
      .from("publications_social")
      .insert(publication)
      .select()
      .single();

    if (error) throw new Error(`Erreur création publication: ${error.message}`);
    return data as PublicationSocial;
  },

  async lire(id: string): Promise<PublicationSocial> {
    const { data, error } = await supabase
      .from("publications_social")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(`Erreur lecture publication: ${error.message}`);
    return data as PublicationSocial;
  },

  async lireTous(filtres?: {
    plateforme?: Plateforme;
    statut?: PublicationStatut;
  }): Promise<PublicationSocial[]> {
    let query = supabase.from("publications_social").select("*");

    if (filtres?.plateforme)
      query = query.eq("plateforme", filtres.plateforme);
    if (filtres?.statut) query = query.eq("statut", filtres.statut);

    const { data, error } = await query.order("publie_le", {
      ascending: false,
    });

    if (error)
      throw new Error(`Erreur lecture publications: ${error.message}`);
    return data as PublicationSocial[];
  },

  async mettreAJour(
    id: string,
    updates: Partial<PublicationSocial>
  ): Promise<PublicationSocial> {
    const { data, error } = await supabase
      .from("publications_social")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error)
      throw new Error(`Erreur mise à jour publication: ${error.message}`);
    return data as PublicationSocial;
  },

  async supprimer(id: string): Promise<void> {
    const { error } = await supabase
      .from("publications_social")
      .delete()
      .eq("id", id);
    if (error)
      throw new Error(`Erreur suppression publication: ${error.message}`);
  },

  async mettreAJourEngagement(
    id: string,
    likes: number,
    partages: number
  ): Promise<PublicationSocial> {
    return this.mettreAJour(id, { likes, partages });
  },

  async meilleurContenu(
    plateforme?: Plateforme,
    limit = 5
  ): Promise<PublicationSocial[]> {
    let query = supabase
      .from("publications_social")
      .select("*")
      .eq("statut", "publié");

    if (plateforme) query = query.eq("plateforme", plateforme);

    const { data, error } = await query
      .order("likes",