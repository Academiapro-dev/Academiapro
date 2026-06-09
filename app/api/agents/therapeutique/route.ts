# API Route Next.js 14 - Agents Thérapeutiques AcadémIA Pro

## Structure du projet

```
app/
├── api/
│   └── therapeutic/
│       ├── route.ts          # Route principale
│       ├── agents.ts         # Configuration agents
│       ├── session.ts        # Gestion sessions
│       └── crm.ts           # CRM & historique
├── types/
│   └── therapeutic.ts        # Types TypeScript
└── lib/
    └── therapeutic-utils.ts  # Utilitaires
```

---

## 1. Types TypeScript

```typescript
// app/types/therapeutic.ts

export type AgentType =
  | "hypnose"
  | "pnl"
  | "sophrologie"
  | "meditation"
  | "coaching"
  | "nutrition"
  | "langues";

export type SessionStatus =
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type MessageRole = "system" | "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  agentType?: AgentType;
  metadata?: Record<string, unknown>;
}

export interface TherapeuticSession {
  id: string;
  userId: string;
  agentType: AgentType;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes: number;
  messages: Message[];
  objectives: string[];
  breakthroughs: string[];
  techniques: string[];
  emotionalState: {
    start: EmotionalState;
    end?: EmotionalState;
  };
  report?: SessionReport;
  crmEntry?: CRMEntry;
}

export interface EmotionalState {
  energy: number;        // 1-10
  anxiety: number;       // 1-10
  motivation: number;    // 1-10
  clarity: number;       // 1-10
  wellbeing: number;     // 1-10
  notes?: string;
}

export interface SessionReport {
  id: string;
  sessionId: string;
  generatedAt: Date;
  summary: string;
  keyInsights: string[];
  techniquesUsed: string[];
  progressIndicators: ProgressIndicator[];
  recommendations: Recommendation[];
  nextSessionFocus: string[];
  homework: HomeworkItem[];
  contraindications?: string[];
  referralNeeded?: boolean;
  referralReason?: string;
}

export interface ProgressIndicator {
  category: string;
  before: number;
  after: number;
  delta: number;
  interpretation: string;
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  category: string;
  action: string;
  rationale: string;
  timeframe: string;
  resources?: string[];
}

export interface HomeworkItem {
  title: string;
  description: string;
  frequency: string;
  duration: string;
  technique: string;
  materials?: string[];
}

export interface CRMEntry {
  id: string;
  userId: string;
  sessionId: string;
  agentType: AgentType;
  date: Date;
  duration: number;
  tags: string[];
  sentimentScore: number;    // -1 à 1
  engagementScore: number;   // 0-100
  progressScore: number;     // 0-100
  flaggedForReview: boolean;
  notes: string;
  followUpDate?: Date;
  followUpAction?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  sessionHistory: string[];  // IDs de sessions
  totalSessions: number;
  preferredAgents: AgentType[];
  therapeuticGoals: string[];
  contraindications: string[];
  createdAt: Date;
  lastSessionAt?: Date;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  title: string;
  expertise: string[];
  systemPrompt: string;
  sessionStructure: SessionPhase[];
  techniques: string[];
  contraindications: string[];
  maxSessionDuration: number;  // minutes
  reportTemplate: string;
}

export interface SessionPhase {
  name: string;
  durationPercent: number;
  objectives: string[];
  techniques: string[];
}

// Request/Response types

export interface StartSessionRequest {
  userId: string;
  agentType: AgentType;
  objectives?: string[];
  initialEmotionalState?: EmotionalState;
  contextNotes?: string;
  previousSessionId?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  userId: string;
  message: string;
  currentEmotionalState?: Partial<EmotionalState>;
}

export interface EndSessionRequest {
  sessionId: string;
  userId: string;
  finalEmotionalState?: EmotionalState;
  userFeedback?: string;
  generateReport?: boolean;
}

export interface GetHistoryRequest {
  userId: string;
  agentType?: AgentType;
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}
```

---

## 2. Configuration des Agents

```typescript
// app/api/therapeutic/agents.ts

import { AgentConfig, AgentType } from "@/types/therapeutic";

export const THERAPEUTIC_AGENTS: Record<AgentType, AgentConfig> = {
  
  // ═══════════════════════════════════════════════════════════
  // AGENT HYPNOSE ERICKSONNIENNE
  // ═══════════════════════════════════════════════════════════
  hypnose: {
    type: "hypnose",
    name: "Dr. Hypnos",
    title: "Hypnothérapeute Éricksonien Certifié",
    expertise: [
      "Hypnose Éricksonienne",
      "Hypnose conversationnelle",
      "Suggestion indirecte",
      "Métaphores thérapeutiques",
      "Régression hypnotique",
      "Ancrage hypnotique",
      "Inductions adaptatives",
    ],
    maxSessionDuration: 30,
    contraindications: [
      "Psychose active",
      "Épisode maniaque",
      "Épilepsie non contrôlée",
      "Déficits cognitifs sévères",
    ],
    techniques: [
      "Induction progressive",
      "Confusion mentale",
      "Catalepsie suggérée",
      "Lévitation du bras",
      "Approfondissement",
      "Ancrage ressource",
      "Dissociation thérapeutique",
    ],
    sessionStructure: [
      {
        name: "Accueil & Calibration",
        durationPercent: 15,
        objectives: ["Établir le rapport", "Évaluer l'état initial", "Définir l'intention"],
        techniques: ["Rapport pacing", "Observation comportementale"],
      },
      {
        name: "Induction Hypnotique",
        durationPercent: 20,
        objectives: ["Induire état de transe légère", "Bypass critique"],
        techniques: ["Induction progressive", "Fixation", "Confusion"],
      },
      {
        name: "Travail Thérapeutique",
        durationPercent: 45,
        objectives: ["Travail sur l'objectif", "Restructuration", "Ancrage"],
        techniques: ["Suggestion indirecte", "Métaphore", "Régression"],
      },
      {
        name: "Réorientation & Intégration",
        durationPercent: 20,
        objectives: ["Retour état normal", "Ancrage ressource", "Intégration"],
        techniques: ["Comptage", "Suggestions post-hypnotiques"],
      },
    ],
    reportTemplate: "hypnose_v2",
    systemPrompt: `Tu es Dr. Hypnos, un hypnothérapeute éricksonien de renommée internationale avec 20 ans d'expérience clinique.

## TON IDENTITÉ PROFESSIONNELLE

Tu maîtrises parfaitement :
- L'hypnose Éricksonienne et ses subtilités linguistiques
- Les patterns de langage Milton (présuppositions, doubles liaisons, métaphores)
- La calibration comportementale et la synchronisation
- Les techniques d'induction adaptatives selon le profil client
- La thérapie par régression d'âge et les ego states
- L'hypnose conversationnelle au quotidien

## PROTOCOLE DE SESSION (30 MINUTES)

### Phase 1 - Accueil & Calibration (0-5 min)
- Crée un espace sécurisé avec bienveillance absolue
- Utilise le pacing & leading naturellement
- Évalue les représentations système (VAK - Visuel/Auditif/Kinesthésique)
- Identifie l'état désiré avec précision
- Explique simplement le processus hypnotique

### Phase 2 - Induction (5-10 min)
- Adapte l'induction au profil (visuelle, auditive, kinesthésique)
- Utilise des suggestions progressives et naturelles
- Intègre la confusion créative subtilement
- Valide les signes de transe (respiration, relaxation musculaire)
- Approfondis l'état avec des techniques d'escalier ou de jardin

### Phase 3 - Travail Thérapeutique (10-25 min)
- Navigue dans l'état hypnotique avec douceur
- Utilise des métaphores thérapeutiques personnalisées
- Applique les suggestions indirectes (en 3 temps)
- Travaille les ego states si nécessaire
- Pose des ancrages ressource puissants
- Intègre des suggestions post-hypnotiques bénéfiques

### Phase 4 - Réorientation (25-30 min)
- Guide doucement vers le retour
- Ancre les ressources dans l'état vigile
- Valide l'expérience vécue
- Pose des suggestions de continuation positive
- Termine par une phrase d'ancrage mémorable

## STYLE DE COMMUNICATION

**Langage Éricksonien obligatoire :**
- "Peut-être que tu remarques déjà..."
- "À mesure que tu continues de lire... tu peux te permettre..."
- "Certaines personnes découvrent que..."
- "Tu n'as pas à savoir comment..."
- "Et pendant que ta main droite se pose confortablement..."

**Patterns linguistiques :**
- Présuppositions embedded : "Quand tu te sentiras mieux..."
- Doubles contraintes positives : "Tu peux y aller maintenant ou dans quelques instants..."
- Questions Socratiques : "Qu'est-ce que tu remarques de différent ?"
- Nominations vagues : "Cette ressource intérieure..."

## ÉTHIQUE & SÉCURITÉ

⚠️ TOUJOURS :
- Obtenir le consentement explicite avant toute technique
- Respecter les contraindications absolues
- Ne jamais induire une transe sans préparation
- Orienter vers un professionnel de santé si nécessaire
- Maintenir des limites thérapeutiques claires
- Documenter les réactions