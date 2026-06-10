# API Route Next.js 14 TypeScript - Agent Marketing IA AcadémIA Pro

## Structure des fichiers

```
app/api/agent-marketing/
├── generer-posts/route.ts
├── generer-ads/route.ts
├── generer-ebook/route.ts
├── configurer-webinaire/route.ts
├── performances/route.ts
├── rapport/route.ts
└── _lib/
    ├── claude-client.ts
    ├── types.ts
    ├── constants.ts
    ├── validators.ts
    └── helpers.ts
```

---

## `app/api/agent-marketing/_lib/types.ts`

```typescript
// ============================================================
// TYPES & INTERFACES - Agent Marketing AcadémIA Pro
// ============================================================

export type Plateforme = "linkedin" | "instagram" | "tiktok" | "facebook";
export type TypeContenu =
  | "post_formation"
  | "temoignage"
  | "conseil_ia"
  | "extrait_cours"
  | "annonce"
  | "story"
  | "reel";
export type TypeAd = "google" | "meta";
export type StatutPublication = "planifie" | "publie" | "erreur" | "brouillon";

// ─── Formation ───────────────────────────────────────────────
export interface Formation {
  id: string;
  titre: string;
  description: string;
  domaine: string;
  prix: number;
  duree: string;
  niveau: "debutant" | "intermediaire" | "avance";
  beneficesCles: string[];
  publicCible: string;
  instructeur?: string;
  notesMoyenne?: number;
  nombreApprenants?: number;
}

// ─── Post Réseaux Sociaux ─────────────────────────────────────
export interface PostReseauSocial {
  id: string;
  plateforme: Plateforme;
  typeContenu: TypeContenu;
  texte: string;
  hashtags: string[];
  heurePublication: string;
  datePublication: string;
  statutPublication: StatutPublication;
  formation?: Formation;
  mediasSuggest?: string[];
  scoreEngagement?: number;
  metriques?: MetriquesPost;
}

export interface MetriquesPost {
  impressions: number;
  engagements: number;
  clics: number;
  partages: number;
  commentaires: number;
  tauxEngagement: number;
}

// ─── Google Ads ───────────────────────────────────────────────
export interface GoogleAd {
  id: string;
  formation: Formation;
  titres: string[]; // max 15 titres, 30 chars chacun
  descriptions: string[]; // max 4 descriptions, 90 chars chacun
  urlFinale: string;
  urlAffichage: string;
  motsCles: MotCle[];
  extensions: ExtensionAnnonce;
  texteLandingPage: TexteLandingPage;
  scoreQualite?: number;
}

export interface MotCle {
  terme: string;
  typeCorrespondance: "exact" | "expression" | "large";
  enchereMax?: number;
  volumeRecherche?: number;
  competition?: "faible" | "moyenne" | "elevee";
}

export interface ExtensionAnnonce {
  sitelinks: { titre: string; url: string; description?: string }[];
  accroches: string[];
  extraitsStructures: { entete: string; valeurs: string[] }[];
  appels?: string[];
}

export interface TexteLandingPage {
  titre: string;
  sousTitre: string;
  avantages: string[];
  preuvesSociales: string[];
  cta: string;
  faq: { question: string; reponse: string }[];
}

// ─── Meta Ads ─────────────────────────────────────────────────
export interface MetaAd {
  id: string;
  formation: Formation;
  copiesPrimaires: string[];
  titresAnnonce: string[];
  descriptionsCta: string[];
  audiences: AudienceMeta[];
  carouselSlides: CarouselSlide[];
  scriptVideo: ScriptVideo;
}

export interface AudienceMeta {
  nom: string;
  description: string;
  ageMin: number;
  ageMax: number;
  interets: string[];
  comportements: string[];
  demographiques: string[];
  taille_estimee?: string;
}

export interface CarouselSlide {
  ordre: number;
  titre: string;
  description: string;
  imageDescription: string;
  cta: string;
  url: string;
}

export interface ScriptVideo {
  duree: string;
  hook: string; // 3 premières secondes
  corps: string[];
  cta: string;
  texteSuperpose: string[];
}

// ─── E-Book ───────────────────────────────────────────────────
export interface EBook {
  id: string;
  titre: string;
  sousTitre: string;
  auteur: string;
  formation?: Formation;
  domaine: string;
  chapitres: ChapitreEBook[];
  introduction: string;
  conclusion: string;
  contenuHtml: string;
  urlPdf?: string;
  metadonnees: MetadonneesEBook;
  sequenceEmail: EmailNurturing[];
}

export interface ChapitreEBook {
  numero: number;
  titre: string;
  contenu: string;
  sousChapitres?: { titre: string; contenu: string }[];
  encadres?: string[];
  listePoints?: string[];
  pageEstimee: number;
}

export interface MetadonneesEBook {
  nombrePages: number;
  nombreMots: number;
  dateCreation: string;
  version: string;
  motsClesSeo: string[];
  description: string;
}

export interface EmailNurturing {
  ordre: number;
  delaiJours: number;
  sujet: string;
  preheader: string;
  corps: string;
  cta: string;
  urlCta: string;
}

// ─── Webinaire ────────────────────────────────────────────────
export interface Webinaire {
  id: string;
  titre: string;
  formation?: Formation;
  domaine: string;
  dateHeure: string;
  dureeMinutes: number;
  intervenant: string;
  script: ScriptWebinaire;
  slides: SlideWebinaire[];
  pageInscription: PageInscription;
  emailsRappels: EmailRappel[];
  offreSpeciale: OffreSpeciale;
}

export interface ScriptWebinaire {
  introduction: string; // 5 min
  partiesPrincipales: {
    titre: string;
    dureeMinutes: number;
    contenu: string;
    pointsCles: string[];
    transitions: string;
  }[];
  sessionQuestions: string; // 10 min
  pitchOffre: string; // 5 min
  conclusion: string; // 5 min
  scriptComplet: string;
}

export interface SlideWebinaire {
  numero: number;
  titre: string;
  contenu: string[];
  notesOrateur: string;
  typeSlide:
    | "titre"
    | "contenu"
    | "image"
    | "temoignage"
    | "demo"
    | "offre"
    | "qa";
}

export interface PageInscription {
  titre: string;
  sousTitre: string;
  avantages: string[];
  profilIntervenant: string;
  cequevousapprendrez: string[];
  preuvesSociales: string[];
  formulaireChamps: string[];
  urlInscription: string;
}

export interface EmailRappel {
  type: "confirmation" | "j-7" | "j-1" | "h-1" | "post-webinaire";
  sujet: string;
  corps: string;
  cta?: string;
}

export interface OffreSpeciale {
  titre: string;
  description: string;
  prixOriginal: number;
  prixSpecial: number;
  reduction: number;
  validiteHeures: number;
  bonus: string[];
  urlAchat: string;
  scriptPitch: string;
}

// ─── Performances & Reporting ─────────────────────────────────
export interface PerformancesCanal {
  canal: string;
  periode: string;
  impressions: number;
  clics: number;
  conversions: number;
  cout: number;
  revenus: number;
  roas: number;
  cpc: number;
  cpa: number;
  tauxConversion: number;
}

export interface RapportMarketing {
  id: string;
  periode: { debut: string; fin: string };
  resume: string;
  performancesParCanal: PerformancesCanal[];
  postsPerformants: PostReseauSocial[];
  alertes: Alerte[];
  recommandations: Recommandation[];
  kpis: KPI[];
  tendances: string[];
  prochainObjectifs: string[];
}

export interface Alerte {
  niveau: "info" | "attention" | "critique";
  message: string;
  canal: string;
  valeurActuelle: number;
  valeurSeuil: number;
  actionRecommandee: string;
}

export interface Recommandation {
  priorite: "haute" | "moyenne" | "basse";
  canal: string;
  action: string;
  impactEstime: string;
  effortEstime: string;
  details: string;
}

export interface KPI {
  nom: string;
  valeur: number;
  unite: string;
  variation: number; // % vs période précédente
  tendance: "hausse" | "baisse" | "stable";
  objectif?: number;
}

// ─── Requêtes API ─────────────────────────────────────────────
export interface RequeteGenererPosts {
  formations: Formation[];
  plateformes: Plateforme[];
  typesContenu: TypeContenu[];
  nombreJours: number;
  inclusTemoignages?: boolean;
  inclutsConseilsIA?: boolean;
}

export interface RequeteGenererAds {
  formations: Formation[];
  typesAd: TypeAd[];
  budget?: number;
  objectifCampagne?: "notoriete" | "trafic" | "conversion" | "leads";
}

export interface RequeteGenererEbook {
  titre: string;
  domaine: string;
  formation?: Formation;
  nombreChapitres: number;
  publicCible: string;
  objectifMarketing: string;
  auteur: string;
}

export interface RequeteConfigurerWebinaire {
  titre: string;
  formation?: Formation;
  domaine: string;
  dateHeure: string;
  intervenant: string;
  publicCible: string;
  objectifVentes?: number;
}

export interface RequeteRapport {
  periodeDebut: string;
  periodeFin: string;
  canaux: string[];
  donneesPerformances?: PerformancesCanal[];
}

// ─── Réponses API ─────────────────────────────────────────────
export interface ReponseAPI<T> {
  succes: boolean;
  donnees?: T;
  erreur?: string;
  messageErreur?: string;
  timestamp: string;
  dureeTraitement?: number;
}

export interface ReponseGenererPosts {
  posts: PostReseauSocial[];
  planning: PlanningPublication[];
  statistiquesGeneration: {
    totalPosts: number;
    parPlateforme: Record<Plateforme, number>;
    parTypeContenu: Record<TypeContenu, number>;
  };
}

export interface PlanningPublication {
  date: string;
  plateforme: Plateforme;
  heureOptimale: string;
  postId: string;
  statutPlanification: string;
}
```

---

## `app/api/agent-marketing/_lib/constants.ts`

```typescript
// ============================================================
// CONSTANTES - Agent Marketing AcadémIA Pro
// ============================================================

import type { Plateforme, TypeContenu } from "./types";

// ─── Heures Optimales de Publication ────────────────────────
export const HEURES_OPTIMALES: Record<Plateforme, string[]> = {
  linkedin: ["08:00", "12:00", "17:30"],
  instagram: ["09:00", "13:00", "20:00"],
  tiktok: ["07:00", "12:00", "19:00"],
  facebook: ["09:00", "14:00", "20:00"],
};

// ─── Limites de Caractères ───────────────────────────────────
export const LIMITES_CARACTERES: Record<Plateforme, number> = {
  linkedin: 3000,
  instagram: 2200,
  tiktok: 150,
  facebook: 63206,
};

// ─── Nombre de Hashtags Optimal ──────────────────────────────
export const HASHTAGS_OPTIMAL: Record<Plateforme, number> = {
  linkedin: 5,
  instagram: 20,
  tiktok: 8,
  facebook: 3,
};

// ─── Ton par Plateforme ───────────────────────────────────────
export const TON_PAR_PLATEFORME: Record<Plateforme, string> = {
  linkedin:
    "professionnel, inspirant, expertise, networking, développement de carrière",
  instagram:
    "visuel, inspirant, lifestyle, émotionnel, communauté, transformation personnelle",
  tiktok: "décontracté, divertissant, hook accrocheur, viral, jeune, direct",
  facebook:
    "convivial, grand public, storytelling, communauté, partage, accessibilité",
};

// ─── Types de Contenu par Plateforme ─────────────────────────
export const CONTENU_PAR_PLATEFORME: Record<Plateforme, TypeContenu[]> = {
  linkedin: ["post_formation", "conseil_ia", "temoignage", "annonce"],
  instagram: ["post_formation", "story", "reel", "temoignage", "extrait_cours"],
  tiktok: ["reel", "conseil_ia", "extrait_cours"],
  facebook: [
    "post_formation",
    "temoignage",
    "annonce",
    "conseil_ia",
    "extrait_cours",
  ],
};

// ─── Hashtags de Base AcadémIA Pro ───────────────────────────
export const HASHTAGS_BASE = {
  global: ["#AcadémIAPro", "#FormationIA", "#ApprentissageIA", "#EdTech"],
  linkedin: ["#Formation", "#DéveloppementProfessionnel", "#Leadership", "#IA"],
  instagram: ["#Apprendre", "#Success", "#Formation", "#Intelligence"],
  tiktok: ["#FormationTikTok", "#ApprendreSurTikTok", "#IA"],
  facebook: ["#AcadémIA", "#Formation", "#IA"],
};

//