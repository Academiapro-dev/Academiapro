```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// CONFIGURATION SUPABASE
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type Plateforme =
  | "instagram"
  | "linkedin"
  | "twitter"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "pinterest";

export type TypePublication =
  | "post"
  | "story"
  | "reel"
  | "video"
  | "article"
  | "thread"
  | "carousel"
  | "live";

export type StatutPublication =
  | "brouillon"
  | "planifie"
  | "publie"
  | "archive"
  | "erreur";

export type TypeVeille =
  | "tendance"
  | "concurrent"
  | "mention"
  | "hashtag"
  | "actualite"
  | "opportunite";

// ------------------------------------------------------------
// TABLE : publications
// ------------------------------------------------------------

export interface Publication {
  id: string;
  plateforme: Plateforme;
  type: TypePublication;
  contenu: string;
  hashtags: string[];
  statut: StatutPublication;
  planifie_le: string | null;
  publie_le: string | null;
  likes: number;
  commentaires: number;
  partages: number;
  reach: number;
  created_at?: string;
  updated_at?: string;
}

export interface PublicationInsert
  extends Omit<Publication, "id" | "created_at" | "updated_at"> {
  id?: string;
}

export interface PublicationUpdate extends Partial<PublicationInsert> {
  id: string;
}

export interface PublicationStats {
  total_publications: number;
  total_likes: number;
  total_commentaires: number;
  total_partages: number;
  total_reach: number;
  engagement_rate: number;
  meilleure_publication: Publication | null;
}

// ------------------------------------------------------------
// TABLE : tunnels_social
// ------------------------------------------------------------

export interface TunnelSocial {
  id: string;
  plateforme: Plateforme;
  mot_declencheur: string;
  etape: number;
  lead_id: string | null;
  converti: boolean;
  created_at: string;
}

export interface TunnelSocialInsert
  extends Omit<TunnelSocial, "id" | "created_at"> {
  id?: string;
}

export interface TunnelSocialUpdate extends Partial<TunnelSocialInsert> {
  id: string;
}

export interface TunnelStats {
  total_entrees: number;
  total_convertis: number;
  taux_conversion: number;
  par_plateforme: Record<string, { entrees: number; convertis: number }>;
  par_mot_declencheur: Record<string, number>;
}

// ------------------------------------------------------------
// TABLE : performances_social
// ------------------------------------------------------------

export interface PerformanceSocial {
  id: string;
  plateforme: Plateforme;
  semaine: string;
  followers: number;
  reach: number;
  engagement: number;
  leads_generes: number;
  ca_genere: number;
  meilleur_post: string | null;
  created_at: string;
}

export interface PerformanceSocialInsert
  extends Omit<PerformanceSocial, "id" | "created_at"> {
  id?: string;
}

export interface PerformanceSocialUpdate
  extends Partial<PerformanceSocialInsert> {
  id: string;
}

export interface EvolutionPerformance {
  plateforme: Plateforme;
  semaines: string[];
  followers: number[];
  reach: number[];
  engagement: number[];
  leads: number[];
  ca: number[];
  croissance_followers: number;
  croissance_reach: number;
  roi_moyen: number;
}

// ------------------------------------------------------------
// TABLE : veille_sociale
// ------------------------------------------------------------

export interface VeilleSociale {
  id: string;
  type: TypeVeille;
  source: string;
  contenu: string;
  pertinence: number;
  traite: boolean;
  created_at: string;
}

export interface VeilleSocialeInsert
  extends Omit<VeilleSociale, "id" | "created_at"> {
  id?: string;
}

export interface VeilleSocialeUpdate extends Partial<VeilleSocialeInsert> {
  id: string;
}

// ------------------------------------------------------------
// TABLE : linktree_clics
// ------------------------------------------------------------

export interface LinktreeClic {
  id: string;
  lien: string;
  source: Plateforme | string;
  clic_le: string;
  converti: boolean;
  created_at?: string;
}

export interface LinktreeClicInsert extends Omit<LinktreeClic, "id"> {
  id?: string;
}

export interface LinktreeStats {
  lien: string;
  total_clics: number;
  total_convertis: number;
  taux_conversion: number;
  clics_par_source: Record<string, number>;
}

// ------------------------------------------------------------
// RAPPORT HEBDOMADAIRE
// ------------------------------------------------------------

export interface RapportHebdomadaire {
  semaine: string;
  date_debut: string;
  date_fin: string;
  publications: {
    total: number;
    par_plateforme: Record<string, number>;
    par_type: Record<string, number>;
    engagement_moyen: number;
    meilleure_publication: Publication | null;
  };
  performances: {
    total_reach: number;
    total_leads: number;
    total_ca: number;
    engagement_rate: number;
    evolution_followers: Record<string, number>;
  };
  tunnels: {
    entrees: number;
    conversions: number;
    taux_conversion: number;
  };
  linktree: {
    total_clics: number;
    total_conversions: number;
    lien_plus_clique: string;
  };
  veille: {
    nouvelles_alertes: number;
    tendances_cles: string[];
    opportunites: number;
  };
  recommandations: string[];
}

export interface MeilleurMomentPublication {
  plateforme: Plateforme;
  jour_semaine: string;
  heure: number;
  score_engagement: number;
  basé_sur: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ============================================================
// FONCTIONS UTILITAIRES INTERNES
// ============================================================

function formatResponse<T>(
  data: T | null,
  error: unknown
): ApiResponse<T> {
  if (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Erreur inconnue";
    return { data: null, error: message, success: false };
  }
  return { data, error: null, success: true };
}

function getNumeroSemaine(date: Date = new Date()): string {
  const debut = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - debut.getTime();
  const unJour = 86400000;
  const jourAnnee = Math.floor(diff / unJour);
  const semaine = Math.ceil((jourAnnee + debut.getDay() + 1) / 7);
  return `${date.getFullYear()}-S${String(semaine).padStart(2, "0")}`;
}

function getDebutSemaine(semaine: string): Date {
  const [annee, sem] = semaine.split("-S");
  const dateDebut = new Date(Number(annee), 0, 1);
  const jourSemaine = dateDebut.getDay();
  const joursOffset = (Number(sem) - 1) * 7 - jourSemaine;
  dateDebut.setDate(dateDebut.getDate() + joursOffset);
  return dateDebut;
}

function getFinSemaine(dateDebut: Date): Date {
  const fin = new Date(dateDebut);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}

// ============================================================
// CRUD — PUBLICATIONS
// ============================================================

export async function creerPublication(
  data: PublicationInsert
): Promise<ApiResponse<Publication>> {
  const { data: result, error } = await supabase
    .from("publications")
    .insert(data)
    .select()
    .single();
  return formatResponse<Publication>(result, error);
}

export async function getPublication(
  id: string
): Promise<ApiResponse<Publication>> {
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("id", id)
    .single();
  return formatResponse<Publication>(data, error);
}

export async function getPublications(filtres?: {
  plateforme?: Plateforme;
  statut?: StatutPublication;
  type?: TypePublication;
  date_debut?: string;
  date_fin?: string;
  limite?: number;
  page?: number;
}): Promise<ApiResponse<Publication[]>> {
  let query = supabase.from("publications").select("*");

  if (filtres?.plateforme) query = query.eq("plateforme", filtres.plateforme);
  if (filtres?.statut) query = query.eq("statut", filtres.statut);
  if (filtres?.type) query = query.eq("type", filtres.type);
  if (filtres?.date_debut)
    query = query.gte("publie_le", filtres.date_debut);
  if (filtres?.date_fin)
    query = query.lte("publie_le", filtres.date_fin);

  const limite = filtres?.limite ?? 50;
  const page = filtres?.page ?? 0;
  query = query
    .range(page * limite, (page + 1) * limite - 1)
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  return formatResponse<Publication[]>(data, error);
}

export async function mettreAJourPublication(
  data: PublicationUpdate
): Promise<ApiResponse<Publication>> {
  const { id, ...updates } = data;
  const { data: result, error } = await supabase
    .from("publications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return formatResponse<Publication>(result, error);
}

export async function supprimerPublication(
  id: string
): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from("publications")
    .delete()
    .eq("id", id);
  return formatResponse<null>(null, error);
}

export async function publierMaintenant(
  id: string
): Promise<ApiResponse<Publication>> {
  return mettreAJourPublication({
    id,
    statut: "publie",
    publie_le: new Date().toISOString(),
  });
}

export async function archiverPublications(
  ids: string[]
): Promise<ApiResponse<Publication[]>> {
  const { data, error } = await supabase
    .from("publications")
    .update({ statut: "archive", updated_at: new Date().toISOString() })
    .in("id", ids)
    .select();
  return formatResponse<Publication[]>(data, error);
}

export async function mettreAJourMetriques(
  id: string,
  metriques: {
    likes?: number;
    commentaires?: number;
    partages?: number;
    reach?: number;
  }
): Promise<ApiResponse<Publication>> {
  return mettreAJourPublication({ id, ...metriques });
}

// ============================================================
// CRUD — TUNNELS SOCIAL
// ============================================================

export async function creerTunnelSocial(
  data: TunnelSocialInsert
): Promise<ApiResponse<TunnelSocial>> {
  const { data: result, error } = await supabase
    .from("tunnels_social")
    .insert({ ...data, created_at: new Date().toISOString() })
    .select()
    .single();
  return formatResponse<TunnelSocial>(result, error);
}

export async function getTunnelSocial(
  id: string
): Promise<ApiResponse<TunnelSocial>> {
  const { data, error } = await supabase
    .from("tunnels_social")
    .select("*")
    .eq("id", id)
    .single();
  return formatResponse<TunnelSocial>(data, error);
}

export async function getTunnelsSocial(filtres?: {
  plateforme?: Plateforme;
  converti?: boolean;
  mot_declencheur?: string;
  lead_id?: string;
}): Promise<ApiResponse<TunnelSocial[]>> {
  let query = supabase
    .from("tunnels_social")
    .select("*")
    .order("created_at", { ascending: false });

  if (filtres?.plateforme) query = query.eq("plateforme", filtres.plateforme);
  if (filtres?.converti !== undefined)
    query = query.eq("converti", filtres.converti);
  if (filtres?.mot_declencheur)
    query = query.eq("mot_declencheur", filtres.mot_declencheur);
  if (filtres?.lead_id) query = query.eq("lead_id", filtres.lead_id);

  const { data, error } = await query;
  return formatResponse<TunnelSocial[]>(data, error);
}

export async function mettreAJourTunnelSocial(
  data: TunnelSocialUpdate
): Promise<ApiResponse<TunnelSocial>> {
  const { id, ...updates } = data;
  const { data: result, error } = await supabase
    .from("tunnels_social")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return formatResponse<TunnelSocial>(result, error);
}

export async function marquerTunnelConverti(
  id: string,
  leadId: string
): Promise<ApiResponse<TunnelSocial>> {
  return mettreAJourTunnelSocial({ id, converti: true, lead_id: leadId });
}

export async function avancerEtapeTunnel(
  id: string
): Promise<ApiResponse<TunnelSocial>> {
  const { data: tunnel, error } = await supabase
    .from("tunnels_social")
    .