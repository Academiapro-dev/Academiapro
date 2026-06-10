# API Route Next.js 14 - Mr Juridique Agent IA

## Structure des fichiers

```
app/api/mr-juridique/
├── question/route.ts
├── generer-document/route.ts
├── signer-envoyer/route.ts
├── holding/
│   ├── rapport/route.ts
│   └── factures-inter/route.ts
├── veille/route.ts
└── rapport/route.ts

lib/
├── mr-juridique/
│   ├── types.ts
│   ├── constants.ts
│   ├── document-generator.ts
│   ├── signature-service.ts
│   ├── holding-service.ts
│   ├── compliance-service.ts
│   ├── veille-service.ts
│   └── mr-comptable-bridge.ts
```

---

## `lib/mr-juridique/types.ts`

```typescript
// ============================================================
// TYPES - MR JURIDIQUE - ACADÉMIA PRO
// ============================================================

export type NiveauValidation = 1 | 2 | 3;

export type DomaineExpertise =
  | "droit_societes"
  | "fiscalite_internationale"
  | "holding_structure"
  | "propriete_intellectuelle"
  | "droit_formation"
  | "contrats"
  | "prix_transfert"
  | "compliance_ocde";

export type TypeDocument =
  | "contrat_formation"
  | "attestation_formation"
  | "cgv"
  | "nda"
  | "mise_en_demeure"
  | "statuts_sas"
  | "statuts_llc"
  | "pacte_actionnaires"
  | "convention_licence_marque"
  | "convention_services_tech"
  | "convention_management_fees"
  | "convention_prix_transfert"
  | "facture_interco"
  | "rapport_compliance"
  | "contrat_prestation";

export type StatutDocument =
  | "brouillon"
  | "genere"
  | "en_signature"
  | "signe"
  | "envoye"
  | "archive";

export type StatutSignature =
  | "en_attente"
  | "signe_partie1"
  | "signe_toutes_parties"
  | "refuse"
  | "expire";

export interface EntiteJuridique {
  id: string;
  nom: string;
  type: "LLC" | "SAS" | "SARL" | "SA" | "EIRL" | "SCI";
  pays: "FR" | "US" | "OTHER";
  siret?: string;
  ein?: string; // US Tax ID
  adresse: string;
  representant: string;
  email: string;
  pourcentageHolding?: number;
}

export interface QuestionJuridique {
  question: string;
  domaine?: DomaineExpertise;
  contexte?: string;
  entitesConcernees?: string[];
  urgent?: boolean;
  userId: string;
}

export interface ReponseJuridique {
  id: string;
  question: string;
  reponse: string;
  domaine: DomaineExpertise;
  references: ReferenceJuridique[];
  risques: RisqueJuridique[];
  recommandations: string[];
  documentsAssocies?: TypeDocument[];
  niveauConfiance: number; // 0-100
  necessiteValidationHumaine: boolean;
  timestamp: string;
  disclaimer: string;
}

export interface ReferenceJuridique {
  type: "loi" | "decret" | "jurisprudence" | "article" | "convention";
  reference: string;
  titre: string;
  url?: string;
  pertinence: number; // 0-100
}

export interface RisqueJuridique {
  niveau: "faible" | "moyen" | "eleve" | "critique";
  description: string;
  mitigation: string;
}

export interface DemandeDocument {
  typeDocument: TypeDocument;
  donnees: Record<string, unknown>;
  parties: PartieContrat[];
  montant?: number;
  devise?: "EUR" | "USD";
  userId: string;
  urgent?: boolean;
  notes?: string;
}

export interface PartieContrat {
  role: "client" | "prestataire" | "actionnaire" | "licenseur" | "licencie";
  entite: EntiteJuridique;
  signataire: string;
  email: string;
  ordre?: number;
}

export interface DocumentJuridique {
  id: string;
  type: TypeDocument;
  titre: string;
  contenu: string; // HTML/Markdown
  contenuPDF?: Buffer;
  statut: StatutDocument;
  niveauValidation: NiveauValidation;
  parties: PartieContrat[];
  montant?: number;
  devise?: "EUR" | "USD";
  dateCreation: string;
  dateModification: string;
  dateSignature?: string;
  dateEnvoi?: string;
  signataires: SignataireInfo[];
  metadonnees: MetadonneesDocument;
  transmisComptable: boolean;
}

export interface SignataireInfo {
  email: string;
  nom: string;
  statut: StatutSignature;
  dateSignature?: string;
  ipSignature?: string;
  certificat?: string;
}

export interface MetadonneesDocument {
  version: string;
  droit_applicable: string;
  juridiction: string;
  langue: string;
  confidentialite: "public" | "confidentiel" | "tres_confidentiel";
  duree_validite?: number; // jours
  renouvellement_auto?: boolean;
  tags: string[];
}

export interface DemandeSignatureEnvoi {
  documentId: string;
  signataires: {
    email: string;
    nom: string;
    ordre: number;
  }[];
  messagePersonnalise?: string;
  delaiSignature?: number; // jours
  relanceAuto?: boolean;
  userId: string;
}

export interface ResultatSignatureEnvoi {
  documentId: string;
  statut: "envoye" | "erreur";
  lienSignature: string;
  signataires: SignataireInfo[];
  dateExpiration: string;
  transmisComptable?: boolean;
  factureCreee?: string;
}

// ============================================================
// HOLDING STRUCTURE
// ============================================================

export interface StructureHolding {
  llc: EntiteJuridique & {
    etat: "Wyoming";
    ein: string;
    pourcentageSAS: number; // 95
  };
  sas: EntiteJuridique & {
    rcs: string;
    capital: number;
  };
  president: {
    nom: string; // Jacques Zenou
    pourcentage: number; // 5
    statut: "irrévocable";
    email: string;
  };
  conventions: ConventionInterco[];
}

export interface ConventionInterco {
  id: string;
  type:
    | "licence_marque"
    | "services_tech"
    | "management_fees"
    | "prix_transfert";
  description: string;
  tauxOuMontant: number; // pourcentage ou montant fixe
  baseCalcul: "CA" | "fixe" | "couts";
  periodicite: "mensuelle" | "trimestrielle" | "annuelle";
  derniereFacture?: string;
  prochaineFact?: string;
  montantDernierPeriode?: number;
  statut: "actif" | "suspendu" | "en_revision";
  conformiteOCDE: boolean;
}

export interface FactureInterco {
  id: string;
  conventionId: string;
  typeFacture:
    | "licence_marque"
    | "services_tech"
    | "management_fees"
    | "dividende";
  emetteur: EntiteJuridique;
  destinataire: EntiteJuridique;
  periode: string; // "2024-01"
  baseFacturation: number;
  taux: number;
  montantHT: number;
  tva?: number;
  montantTTC?: number;
  devise: "EUR" | "USD";
  statut: "brouillon" | "validee" | "envoyee" | "payee";
  dateEmission: string;
  dateEcheance: string;
  referenceOCDE: string;
  documentJustificatif?: string;
}

export interface RapportHolding {
  periode: string;
  dateGeneration: string;
  structure: StructureHolding;
  facturesInterco: FactureInterco[];
  totalLicenceMarque: MonthlyAmount;
  totalServicesTech: MonthlyAmount;
  totalManagementFees: MonthlyAmount;
  complianceOCDE: ComplianceOCDE;
  complianceFrance: ComplianceFrance;
  complianceUSA: ComplianceUSA;
  alertes: AlerteJuridique[];
  prochainEcheances: Echeance[];
  recommandations: string[];
}

export interface MonthlyAmount {
  montant: number;
  devise: "EUR" | "USD";
  evolution: number; // % vs période précédente
  conforme: boolean;
}

export interface ComplianceOCDE {
  statut: "conforme" | "attention" | "non_conforme";
  prixTransfertValides: boolean;
  documentationComplete: boolean;
  dernierAudit: string;
  prochainAudit: string;
  score: number; // 0-100
  details: string[];
}

export interface ComplianceFrance {
  urssaf: { statut: "a_jour" | "en_retard"; dernierePaiement: string };
  tva: { statut: "a_jour" | "en_retard"; dernierDeclaration: string };
  is: { statut: "a_jour" | "en_retard"; prochainEcheance: string };
  inpi: { marqueProtegee: boolean; renouvellement: string };
  score: number;
}

export interface ComplianceUSA {
  wyomingReport: { statut: "a_jour" | "en_retard"; prochainRapport: string };
  federal: { statut: "a_jour" | "en_retard"; derniereFiling: string };
  score: number;
}

export interface AlerteJuridique {
  id: string;
  niveau: "info" | "attention" | "urgent" | "critique";
  titre: string;
  description: string;
  action: string;
  echeance?: string;
  documentId?: string;
}

export interface Echeance {
  date: string;
  type: string;
  description: string;
  montant?: number;
  devise?: "EUR" | "USD";
  responsable: string;
}

// ============================================================
// VEILLE JURIDIQUE
// ============================================================

export interface VeilleJuridique {
  dateGeneration: string;
  domaines: DomaineExpertise[];
  actualites: ActualiteJuridique[];
  alertesRegulementaires: AlerteReglementaire[];
  changementsLegislatifs: ChangementLegislatif[];
  jurisprudences: Jurisprudence[];
  impactHolding: ImpactHolding[];
}

export interface ActualiteJuridique {
  id: string;
  titre: string;
  resume: string;
  source: string;
  date: string;
  domaine: DomaineExpertise;
  importance: "faible" | "moyenne" | "haute" | "critique";
  urlSource?: string;
}

export interface AlerteReglementaire {
  id: string;
  reglementation: string;
  description: string;
  dateEnvigueur: string;
  actionRequise: string;
  entitesConcernees: string[];
  delaiCompliance: string;
}

export interface ChangementLegislatif {
  texte: string;
  ancien: string;
  nouveau: string;
  dateEffet: string;
  impact: string;
}

export interface Jurisprudence {
  reference: string;
  juridiction: string;
  date: string;
  resume: string;
  impact: string;
  pertinence: number;
}

export interface ImpactHolding {
  domaine: string;
  description: string;
  impactLLC: string;
  impactSAS: string;
  actionsRequises: string[];
  priorite: "basse" | "moyenne" | "haute";
}

// ============================================================
// RAPPORT GÉNÉRAL
// ============================================================

export interface RapportMrJuridique {
  id: string;
  periode: string;
  dateGeneration: string;
  kpis: KPIJuridique;
  documentsGeneres: SummaryDocuments;
  activiteConventions: ActiviteConventions;
  complianceGlobale: ComplianceGlobale;
  synchronisationComptable: SyncComptable;
  alertes: AlerteJuridique[];
  prochainEcheances: Echeance[];
  veille: VeilleResume;
}

export interface KPIJuridique {
  documentsCreesTotal: number;
  documentsCreesMois: number;
  documentsSignes: number;
  documentsEnAttente: number;
  tempsReponseMoyen: number; // heures
  tauxAutomatisation: number; // %
  economiesEstimees: number; // EUR vs avocat traditionnel
  risquesIdentifies: number;
  risquesResolus: number;
}

export interface SummaryDocuments {
  parType: Record<TypeDocument, number>;
  parNiveau: Record<NiveauValidation, number>;
  parStatut: Record<StatutDocument, number>;
  montantTotalContrats: number;
}

export interface ActiviteConventions {
  facturesEmisesTotal: number;
  montantLicences: number;
  montantServices: number;
  montantManagement: number;
  montantTotal: number;
  devise: "EUR";
}

export interface ComplianceGlobale {
  score: number; // 0-100
  france: number;
  usa: number;
  ocde: number;
  statut: "conforme" | "attention" | "non_conforme";
}

export interface SyncComptable {
  derniereSync: string;
  documentsTransmis: number;
  facturesCreees: number;
  relancesEnCours: number;
  statut: "synchronise" | "en_attente" | "erreur";
}

export interface VeilleResume {
  nouvellesActualites: number;
  alertesCritiques: number;
  changementsLegislatifs: number;
  derniereMiseAJour: string;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  documentationUrl?: string;
}