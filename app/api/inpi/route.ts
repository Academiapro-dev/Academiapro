// app/api/inpi/route.ts - Main INPI Agent API Route
// Next.js 14 TypeScript - Agent INPI AcadémIA Pro

import { NextRequest, NextResponse } from "next/server";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface MarqueInfo {
  nom: string;
  depositaire: string;
  dateDepot: string;
  dateExpiration: string;
  classes: number[];
  statut: "active" | "expiree" | "en_cours" | "opposition";
  numero: string;
  territoire: "FR" | "EU" | "WIPO";
}

interface AlerteMarque {
  id: string;
  type: "similarite" | "expiration" | "opposition" | "domaine";
  priorite: "haute" | "moyenne" | "basse";
  marque: string;
  description: string;
  dateDetection: string;
  territoire: string;
  actionRequise: string;
  lienSource?: string;
}

interface SurveillanceResult {
  dateVerification: string;
  marqueProtegee: MarqueInfo;
  alertes: AlerteMarque[];
  marquesSimlaires: MarqueSimilaire[];
  domainesSurveilles: DomaineSurveillance[];
  prochainControle: string;
}

interface MarqueSimilaire {
  nom: string;
  scoresSimilarite: number;
  depositaire: string;
  dateDepot: string;
  classes: number[];
  territoire: string;
  risqueConflict: "eleve" | "moyen" | "faible";
  numeroDepot: string;
}

interface DomaineSurveillance {
  domaine: string;
  disponible: boolean;
  enregistrePar?: string;
  dateEnregistrement?: string;
  risque: "eleve" | "moyen" | "faible";
}

interface DossierDepot {
  marque: string;
  classes: ClasseNice[];
  formulaireM1: FormulaireM1;
  descriptionServices: string;
  coutEstime: CoutDepot;
  documentsRequis: string[];
  etapesDepot: EtapeDepot[];
  delaisEstimes: DelaisDepot;
}

interface ClasseNice {
  numero: number;
  libelle: string;
  description: string;
  servicesCouverts: string[];
}

interface FormulaireM1 {
  identiteDeposant: IdentiteDeposant;
  representationMarque: RepresentationMarque;
  listeProduitServices: string;
  priorite?: string;
  dateRemplissage: string;
  instructionsDepot: string[];
}

interface IdentiteDeposant {
  raisonSociale: string;
  formeJuridique: string;
  adresse: string;
  siren: string;
  representantLegal: string;
  email: string;
  telephone: string;
}

interface RepresentationMarque {
  typeMarque: string;
  denominationMarque: string;
  descriptionVisuelle: string;
  couleurs?: string[];
  sloganAssocie?: string;
}

interface CoutDepot {
  fraisBase: number;
  fraisParClasse: number;
  nombreClasses: number;
  totalEstime: number;
  detailCouts: DetailCout[];
  moyensPaiement: string[];
}

interface DetailCout {
  poste: string;
  montant: number;
  description: string;
}

interface EtapeDepot {
  numero: number;
  titre: string;
  description: string;
  dureeEstimee: string;
  documentsNecessaires: string[];
  lienUtile?: string;
}

interface DelaisDepot {
  instructionDossier: string;
  publicationBOPI: string;
  periodeOpposition: string;
  enregistrementFinal: string;
  totalProcessus: string;
}

interface DossierRenouvellement {
  marqueActuelle: MarqueInfo;
  dateExpiration: string;
  alerteEnvoyee: boolean;
  coutRenouvellement: CoutDepot;
  formulaireRenouvellement: FormulaireRenouvellement;
  etapesRenouvellement: EtapeDepot[];
  documentsRequis: string[];
}

interface FormulaireRenouvellement {
  numeroMarque: string;
  nomMarque: string;
  deposant: IdentiteDeposant;
  classesRenouveler: number[];
  dateDepotRenouvellement: string;
  instructions: string[];
}

interface RapportMensuel {
  periode: string;
  dateGeneration: string;
  marqueProtegee: MarqueInfo;
  resumeExecutif: string;
  statistiquesSurveillance: StatistiquesSurveillance;
  alertesDuMois: AlerteMarque[];
  marquesDetectees: MarqueSimilaire[];
  actionsRecommandees: ActionRecommandee[];
  prochainEcheances: Echeance[];
  historiqueComplet: HistoriqueEntry[];
}

interface StatistiquesSurveillance {
  nombreControlesEffectues: number;
  nombreAlertesGenerees: number;
  nombreMarquesAnalysees: number;
  nombreDomainesVerifies: number;
  tauxMenaces: number;
  territorioiresSurveilles: string[];
}

interface ActionRecommandee {
  priorite: "urgente" | "haute" | "normale";
  action: string;
  description: string;
  deadline?: string;
  coutEstime?: number;
}

interface Echeance {
  date: string;
  type: string;
  description: string;
  actionRequise: string;
  alerteActive: boolean;
}

interface HistoriqueEntry {
  date: string;
  type: string;
  description: string;
  resultat: string;
  territoire: string;
}

interface AlerteRequest {
  type: "test" | "surveillance" | "expiration" | "urgence";
  destinataires: string[];
  sujet?: string;
  messagePersonnalise?: string;
  declencherSurveillance?: boolean;
}

interface AlerteResponse {
  success: boolean;
  alerteId: string;
  messageEnvoye: string;
  destinatairesNotifies: string[];
  timestamp: string;
  prochaineSurveillance?: string;
}

interface RenouvellementRequest {
  numeroMarque: string;
  classesPourRenouveler?: number[];
  contactEmail: string;
  preparerDossierComplet: boolean;
}

// ============================================================
// CONFIGURATION MARQUE ACADÉMIA PRO
// ============================================================

const MARQUE_CONFIG = {
  nom: "AcadémIA Pro",
  nomVariantes: [
    "AcademIA Pro",
    "Academia Pro",
    "AcadémIA",
    "AcademIA",
    "Académia Pro",
    "AcademiaPro",
    "Academ-IA",
    "Acad-IA Pro",
  ],
  depositaire: {
    raisonSociale: "ACADÉMIA PRO SAS",
    formeJuridique: "SAS",
    adresse: "15 Rue de la Innovation, 75008 Paris, France",
    siren: "123 456 789",
    representantLegal: "Directeur Général",
    email: "juridique@academia-pro.fr",
    telephone: "+33 1 XX XX XX XX",
  },
  classes: [41, 42, 44],
  dateDepot: "2024-01-15",
  dateExpiration: "2034-01-15",
  statut: "active" as const,
  numero: "FR4399999",
  territoire: "FR" as const,
};

const CLASSES_NICE: ClasseNice[] = [
  {
    numero: 41,
    libelle: "Éducation · Formation · Enseignement",
    description:
      "Services d'éducation, de formation professionnelle et d'enseignement",
    servicesCouverts: [
      "Formation en ligne utilisant l'intelligence artificielle",
      "Enseignement et formation professionnelle continue",
      "Organisation de séminaires et ateliers sur l'IA",
      "Services de coaching pédagogique personnalisé par IA",
      "Conception de programmes de formation sur mesure",
      "Certification et délivrance de diplômes formation IA",
      "Tutorat individuel assisté par intelligence artificielle",
      "Évaluation et assessment des compétences numériques",
      "Formation des formateurs aux outils d'IA pédagogique",
      "E-learning et microlearning adaptatif par IA",
    ],
  },
  {
    numero: 42,
    libelle: "Services Technologiques · Intelligence Artificielle",
    description:
      "Services technologiques, recherche et développement dans le domaine de l'IA",
    servicesCouverts: [
      "Développement de logiciels d'intelligence artificielle pour l'éducation",
      "Services de plateforme SaaS pour la formation en ligne",
      "Conception et déploiement d'agents conversationnels pédagogiques",
      "Analyse de données éducatives et learning analytics",
      "Services cloud pour hébergement plateformes e-learning",
      "Recherche et développement en intelligence artificielle appliquée",
      "Conseil technologique en transformation numérique éducative",
      "Intégration API d'outils IA dans systèmes pédagogiques",
      "Cybersécurité pour plateformes éducatives numériques",
      "Services de personnalisation algorithmique des parcours apprenants",
    ],
  },
  {
    numero: 44,
    libelle: "Services Bien-être · Thérapeutiques",
    description: "Services de bien-être mental et accompagnement thérapeutique",
    servicesCouverts: [
      "Services de bien-être mental et développement personnel par IA",
      "Accompagnement psychologique digital et thérapie cognitive assistée",
      "Coaching de vie et développement personnel utilisant l'IA",
      "Services de gestion du stress et mindfulness digitaux",
      "Accompagnement dans les transitions professionnelles et reconversions",
      "Support émotionnel et écoute active via agents conversationnels",
      "Programmes de résilience et gestion des émotions en ligne",
      "Services de santé mentale préventive par apprentissage adaptatif",
      "Thérapies comportementales cognitives assistées par technologie",
      "Accompagnement burn-out et épuisement professionnel digital",
    ],
  },
];

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function generateId(): string {
  return `INPI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function formatDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function formatDateTime(date: Date = new Date()): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function calculerSimilarite(nom1: string, nom2: string): number {
  const n1 = nom1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const n2 = nom2.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (n1 === n2) return 100;

  // Algorithme Levenshtein simplifié
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 100;

  let commonChars = 0;
  const shorter = n1.length < n2.length ? n1 : n2;
  const longer = n1.length < n2.length ? n2 : n1;

  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) commonChars++;
  }

  // Bonus si contient le terme principal
  const termePrincipal = "academia";
  const bonusTerme =
    n1.includes(termePrincipal) || n2.includes(termePrincipal) ? 20 : 0;

  return Math.min(
    100,
    Math.round((commonChars / maxLen) * 100) + bonusTerme
  );
}

// ============================================================
// GÉNÉRATEUR DE DONNÉES SURVEILLANCE SIMULÉES
// ============================================================

function genererMarquesSimilaires(): MarqueSimilaire[] {
  const marquesSuspects = [
    {
      nom: "AcadémIA Plus",
      depositaire: "Digital Learning Solutions SARL",
      classes: [41, 42],
    },
    {
      nom: "AcademIA Formation",
      depositaire: "FormaPro Technologies SAS",
      classes: [41],
    },
    {
      nom: "AcadémiIA Pro",
      depositaire: "Innovation Pédagogique SA",
      classes: [41, 42, 44],
    },
    {
      nom: "Académia IA",
      depositaire: "StartupEdu France",
      classes: [42],
    },
    {
      nom: "AcademiaPro Digital",
      depositaire: "EduTech Ventures SARL",
      classes: [41, 44],
    },
  ];

  return marquesSuspects.map((m, index) => {
    const score = calculerSimilarite("AcadémIA Pro", m.nom);
    return {
      nom: m.nom,
      scoresSimilarite: score,
      depositaire: m.depositaire,
      dateDepot: formatDate(addDays(new Date(), -(index * 15 + 5))),
      classes: m.classes,
      territoire: index < 3 ? "FR" : index === 3 ? "EU" : "WIPO",
      risqueConflict:
        score >= 70 ? "eleve" : score >= 50 ? "moyen" : "faible",
      numeroDepot: `FR${4400000 + index * 1000 + Math.floor(Math.random() * 999)}`,
    };
  });
}

function genererDomainesSurveillance(): DomaineSurveillance[] {
  const domaines = [
    { domaine: "academia-pro.fr", disponible: false, risque: "eleve" as const },
    { domaine: "academia-pro.com", disponible: false, risque: "eleve" as const },
    { domaine: "academiapro.fr", disponible: true, risque: "eleve" as const },
    { domaine: "academiapro.com", disponible: false, risque: "moyen" as const },
    { domaine: "academiaproai.fr", disponible: true, ris