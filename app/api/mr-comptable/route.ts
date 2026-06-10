# Mr Comptable — API Route Next.js 14 TypeScript

## Structure des fichiers

```
app/api/mr-comptable/
├── facture/route.ts
├── note-frais/route.ts
├── rapprochement/route.ts
├── paiement/route.ts
├── declaration/route.ts
├── rapport/route.ts
└── _lib/
    ├── types.ts
    ├── openai.ts
    ├── supabase.ts
    ├── stripe.ts
    ├── banking.ts
    ├── yousign.ts
    ├── urssaf.ts
    ├── notifications.ts
    └── comptabilite.ts
```

---

## `_lib/types.ts`

```typescript
// ============================================================
// TYPES & INTERFACES — Mr Comptable AcadémIA Pro
// ============================================================

export type NiveauPaiement = 1 | 2 | 3;
export type StatutFacture = "reçue" | "traitée" | "rapprochée" | "payée" | "rejetée";
export type SourceFacture = "gmail" | "whatsapp" | "upload" | "stripe";
export type TypeDeclaration = "CA3" | "URSSAF" | "IS" | "IR_2042" | "ACOMPTE_IS";
export type TypeContrat = "formation" | "convention_entreprise" | "nda" | "prestation";
export type BanqueConnectee = "shine" | "blank" | "n26";
export type CategorieDepense =
  | "formation_materiel"
  | "logiciels_abonnements"
  | "deplacement"
  | "restauration"
  | "marketing"
  | "honoraires"
  | "charges_sociales"
  | "loyer_bureau"
  | "fournitures"
  | "autre";

// ---- Facture ----
export interface FactureInput {
  source: SourceFacture;
  fichierBase64?: string;
  fichierUrl?: string;
  emailId?: string;
  whatsappMessageId?: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, unknown>;
}

export interface FactureExtraite {
  id: string;
  source: SourceFacture;
  fournisseur: string;
  siret?: string;
  tva_intracom?: string;
  numero_facture: string;
  date_facture: string;
  date_echeance?: string;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  montant_ttc: number;
  devise: string;
  categorie: CategorieDepense;
  description: string;
  tva_deductible: boolean;
  statut: StatutFacture;
  fichier_url?: string;
  created_at: string;
  confidence_score: number;
  raw_extraction: Record<string, unknown>;
}

// ---- Note de Frais ----
export interface NoteFraisInput {
  whatsappFrom: string;
  whatsappMessageId: string;
  imageBase64?: string;
  imageUrl?: string;
  description?: string;
  collaborateur?: string;
}

export interface NoteFraisExtraite {
  id: string;
  collaborateur: string;
  telephone: string;
  date_depense: string;
  montant_ttc: number;
  taux_tva: number;
  montant_tva: number;
  montant_ht: number;
  categorie: CategorieDepense;
  description: string;
  lieu?: string;
  justificatif_url?: string;
  statut: "soumise" | "validée" | "remboursée" | "rejetée";
  confidence_score: number;
  created_at: string;
}

// ---- Rapprochement Bancaire ----
export interface TransactionBancaire {
  id: string;
  banque: BanqueConnectee;
  date: string;
  libelle: string;
  montant: number;
  sens: "debit" | "credit";
  solde_apres: number;
  reference?: string;
  categorie_banque?: string;
  rapprochee: boolean;
  facture_id?: string;
}

export interface RapprochementResult {
  date_rapprochement: string;
  transactions_totales: number;
  transactions_rapprochees: number;
  transactions_non_rapprochees: number;
  ecarts: EcartRapprochement[];
  soldes: Record<BanqueConnectee, number>;
  taux_rapprochement: number;
}

export interface EcartRapprochement {
  transaction_id: string;
  banque: BanqueConnectee;
  date: string;
  libelle: string;
  montant: number;
  raison_ecart: string;
  suggestion?: string;
}

// ---- Paiement ----
export interface PaiementInput {
  facture_id?: string;
  fournisseur: string;
  iban: string;
  bic?: string;
  montant: number;
  devise: string;
  reference: string;
  description: string;
  banque_source: BanqueConnectee;
  date_execution?: string;
  urgence?: boolean;
}

export interface PaiementResult {
  id: string;
  statut: "automatique" | "notification_envoyée" | "attente_validation" | "exécuté" | "refusé";
  niveau: NiveauPaiement;
  montant: number;
  fournisseur: string;
  reference_bancaire?: string;
  yousign_procedure_id?: string;
  message: string;
  created_at: string;
}

// ---- Déclaration Fiscale ----
export interface DeclarationInput {
  type: TypeDeclaration;
  periode_debut: string;
  periode_fin: string;
  annee_fiscale: number;
  trimestre?: 1 | 2 | 3 | 4;
  soumettre?: boolean;
  simuler?: boolean;
}

export interface DeclarationResult {
  id: string;
  type: TypeDeclaration;
  periode: string;
  annee_fiscale: number;
  montants: Record<string, number>;
  statut: "calculée" | "simulée" | "soumise" | "validée";
  fichier_url?: string;
  echeance: string;
  optimisations?: OptimisationFiscale[];
  created_at: string;
}

export interface OptimisationFiscale {
  titre: string;
  description: string;
  economie_estimee: number;
  risque: "faible" | "moyen" | "élevé";
  action_requise: string;
}

// ---- Rapport ----
export interface RapportQuery {
  type: "quotidien" | "hebdomadaire" | "mensuel" | "annuel";
  date?: string;
  semaine?: number;
  mois?: number;
  annee?: number;
  format?: "json" | "pdf";
}

export interface RapportFinancier {
  id: string;
  type: RapportQuery["type"];
  periode: string;
  genere_le: string;
  kpis: KPIsFinanciers;
  tresorerie: TresorerieDetail;
  facturation: FacturationDetail;
  fiscal: FiscalDetail;
  alertes: Alerte[];
  recommandations: string[];
}

export interface KPIsFinanciers {
  chiffre_affaires: number;
  charges_totales: number;
  resultat_net: number;
  marge_nette: number;
  tva_a_payer: number;
  tresorerie_totale: number;
  creances_clients: number;
  dettes_fournisseurs: number;
  variation_ca: number;
}

export interface TresorerieDetail {
  soldes: Record<BanqueConnectee, number>;
  total: number;
  prevision_30j: number;
  flux_entrants: number;
  flux_sortants: number;
}

export interface FacturationDetail {
  factures_emises: number;
  factures_reçues: number;
  notes_frais: number;
  en_attente_paiement: number;
  en_retard: number;
}

export interface FiscalDetail {
  tva_collectee: number;
  tva_deductible: number;
  tva_a_declarer: number;
  urssaf_estimee: number;
  is_acompte_prochain?: number;
  prochaine_echeance: string;
}

export interface Alerte {
  niveau: "info" | "warning" | "critical";
  titre: string;
  message: string;
  action?: string;
}

// ---- API Response ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  timestamp: string;
  agent: "Mr Comptable — AcadémIA Pro";
}
```

---

## `_lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import type {
  FactureExtraite,
  NoteFraisExtraite,
  TransactionBancaire,
  PaiementResult,
  DeclarationResult,
  RapportFinancier,
} from "./types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ---- Factures ----
export async function insertFacture(facture: FactureExtraite): Promise<FactureExtraite> {
  const { data, error } = await supabase
    .from("factures")
    .insert(facture)
    .select()
    .single();
  if (error) throw new Error(`Supabase insertFacture: ${error.message}`);
  return data;
}

export async function getFactures(filters?: {
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  fournisseur?: string;
}): Promise<FactureExtraite[]> {
  let query = supabase.from("factures").select("*").order("date_facture", { ascending: false });
  if (filters?.statut) query = query.eq("statut", filters.statut);
  if (filters?.dateDebut) query = query.gte("date_facture", filters.dateDebut);
  if (filters?.dateFin) query = query.lte("date_facture", filters.dateFin);
  if (filters?.fournisseur) query = query.ilike("fournisseur", `%${filters.fournisseur}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase getFactures: ${error.message}`);
  return data || [];
}

export async function updateFactureStatut(
  id: string,
  statut: FactureExtraite["statut"],
  updates?: Partial<FactureExtraite>
): Promise<void> {
  const { error } = await supabase
    .from("factures")
    .update({ statut, ...updates })
    .eq("id", id);
  if (error) throw new Error(`Supabase updateFactureStatut: ${error.message}`);
}

// ---- Notes de Frais ----
export async function insertNoteFrais(note: NoteFraisExtraite): Promise<NoteFraisExtraite> {
  const { data, error } = await supabase
    .from("notes_frais")
    .insert(note)
    .select()
    .single();
  if (error) throw new Error(`Supabase insertNoteFrais: ${error.message}`);
  return data;
}

export async function getNotesFrais(filters?: {
  collaborateur?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
}): Promise<NoteFraisExtraite[]> {
  let query = supabase.from("notes_frais").select("*").order("date_depense", { ascending: false });
  if (filters?.collaborateur) query = query.ilike("collaborateur", `%${filters.collaborateur}%`);
  if (filters?.statut) query = query.eq("statut", filters.statut);
  if (filters?.dateDebut) query = query.gte("date_depense", filters.dateDebut);
  if (filters?.dateFin) query = query.lte("date_depense", filters.dateFin);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase getNotesFrais: ${error.message}`);
  return data || [];
}

// ---- Transactions Bancaires ----
export async function insertTransactions(
  transactions: TransactionBancaire[]
): Promise<void> {
  const { error } = await supabase
    .from("transactions_bancaires")
    .upsert(transactions, { onConflict: "id" });
  if (error) throw new Error(`Supabase insertTransactions: ${error.message}`);
}

export async function getTransactionsNonRapprochees(): Promise<TransactionBancaire[]> {
  const { data, error } = await supabase
    .from("transactions_bancaires")
    .select("*")
    .eq("rapprochee", false)
    .order("date", { ascending: false });
  if (error) throw new Error(`Supabase getTransactionsNonRapprochees: ${error.message}`);
  return data || [];
}

export async function updateRapprochement(
  transactionId: string,
  factureId: string
): Promise<void> {
  const { error } = await supabase
    .from("transactions_bancaires")
    .update({ rapprochee: true, facture_id: factureId })
    .eq("id", transactionId);
  if (error) throw new Error(`Supabase updateRapprochement: ${error.message}`);
}

// ---- Paiements ----
export async function insertPaiement(paiement: PaiementResult): Promise<PaiementResult> {
  const { data, error } = await supabase
    .from("paiements")
    .insert(paiement)
    .select()
    .single();
  if (error) throw new Error(`Supabase insertPaiement: ${error.message}`);
  return data;
}

// ---- Déclarations ----
export async function insertDeclaration(declaration: DeclarationResult): Promise<DeclarationResult> {
  const { data, error } = await supabase
    .from("declarations_fiscales")
    .insert(declaration)
    .select()
    .single();
  if (error) throw new Error(`Supabase insertDeclaration: ${error.message}`);
  return data;
}

export async function getDeclarations(type?: string, annee?: number): Promise<DeclarationResult[]> {
  let query = supabase.from("declarations_fiscales").select("*").order("created_at", { ascending: false });
  if