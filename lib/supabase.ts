import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpxrbwsbhmggoajtxzqn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export type Formation = {
  id: string
  titre: string
  description: string
  duree: number
  niveau: string
  categorie: string
  prix: number
  image_url: string
  created_at: string
  updated_at: string
}

export type Apprenant = {
  id: string
  email: string
  nom: string
  prenom: string
  avatar_url: string
  pack_id: string
  date_inscription: string
  progression: number
  created_at: string
}

export type Seance = {
  id: string
  apprenant_id: string
  formation_id: string
  titre: string
  duree_minutes: number
  statut: 'en_cours' | 'termine' | 'planifie'
  date_seance: string
  notes: string
  created_at: string
}

export type Certificat = {
  id: string
  apprenant_id: string
  formation_id: string
  titre: string
  date_obtention: string
  code_verification: string
  pdf_url: string
  created_at: string
}

export type Skill = {
  id: string
  nom: string
  description: string
  categorie: string
  niveau: 'debutant' | 'intermediaire' | 'avance' | 'expert'
  icone: string
  created_at: string
}

export type Pack = {
  id: string
  nom: string
  description: string
  prix_mensuel: number
  prix_annuel: number
  fonctionnalites: string[]
  limite_formations: number
  limite_certificats: number
  support_prioritaire: boolean
  ia_avancee: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      formations: {
        Row: Formation
        Insert: Omit<Formation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Formation, 'id'>>
      }
      apprenants: {
        Row: Apprenant
        Insert: Omit<Apprenant, 'id' | 'created_at'>
        Update: Partial<Omit<Apprenant, 'id'>>
      }
      seances: {
        Row: Seance
        Insert: Omit<Seance, 'id' | 'created_at'>
        Update: Partial<Omit<Seance, 'id'>>
      }
      certificats: {
        Row: Certificat
        Insert: Omit<Certificat, 'id' | 'created_at'>
        Update: Partial<Omit<Certificat, 'id'>>
      }
      skills: {
        Row: Skill
        Insert: Omit<Skill, 'id' | 'created_at'>
        Update: Partial<Omit<Skill, 'id'>>
      }
      packs: {
        Row: Pack
        Insert: Omit<Pack, 'id' | 'created_at'>
        Update: Partial<Omit<Pack, 'id'>>
      }
    }
  }
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function getFormation(id: string): Promise<Formation | null> {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur getFormation:', error.message)
    return null
  }

  return data
}

export async function getFormations(): Promise<Formation[]> {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getFormations:', error.message)
    return []
  }

  return data || []
}

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur getSkills:', error.message)
    return []
  }

  return data || []
}

export async function getPacks(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from('packs')
    .select('*')
    .order('prix_mensuel', { ascending: true })

  if (error) {
    console.error('Erreur getPacks:', error.message)
    return []
  }

  return data || []
}

export async function getApprenant(email: string): Promise<Apprenant | null> {
  const { data, error } = await supabase
    .from('apprenants')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Erreur getApprenant:', error.message)
    return null
  }

  return data
}

export async function getCertificats(apprenantId: string): Promise<Certificat[]> {
  const { data, error } = await supabase
    .from('certificats')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_obtention', { ascending: false })

  if (error) {
    console.error('Erreur getCertificats:', error.message)
    return []
  }

  return data || []
}

export async function getSeances(apprenantId: string): Promise<Seance[]> {
  const { data, error } = await supabase
    .from('seances')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_seance', { ascending: false })

  if (error) {
    console.error('Erreur getSeances:', error.message)
    return []
  }

  return data || []
}

export default supabase