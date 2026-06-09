# CRM AcadémIA Pro - API Routes Next.js 14 TypeScript

## Structure des fichiers

```
app/api/crm/
├── contacts/
│   ├── route.ts          (POST, GET)
│   └── [id]/
│       ├── route.ts      (GET, PUT, DELETE)
│       └── interactions/
│           └── route.ts  (POST, GET)
├── pipeline/
│   └── route.ts          (PUT, GET)
├── stats/
│   └── route.ts          (GET)
└── lib/
    ├── types.ts
    ├── scoring.ts
    ├── enrichment.ts
    └── db.ts
```

---

## `app/api/crm/lib/types.ts`

```typescript
// ============================================================
// TYPES & INTERFACES - CRM AcadémIA Pro
// ============================================================

export type ContactSource =
  | "web_capture"
  | "manual"
  | "import"
  | "referral"
  | "social"
  | "webinar"
  | "api";

export type ContactStatus =
  | "visitor"
  | "lead"
  | "prospect"
  | "student"
  | "alumni"
  | "inactive";

export type PipelineStage =
  | "discovery"
  | "interest"
  | "consideration"
  | "intent"
  | "evaluation"
  | "enrollment"
  | "active_student"
  | "completed"
  | "churned";

export type InteractionType =
  | "page_view"
  | "form_submit"
  | "email_open"
  | "email_click"
  | "chat_message"
  | "phone_call"
  | "webinar_attendance"
  | "course_view"
  | "payment"
  | "support_ticket"
  | "download"
  | "video_watch";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface GeoLocation {
  country: string;
  city: string;
  region: string;
  timezone: string;
  ip: string;
}

export interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  userAgent: string;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface LeadScore {
  total: number;
  demographic: number;
  behavioral: number;
  engagement: number;
  intent: number;
  recency: number;
  grade: "A" | "B" | "C" | "D" | "F";
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  courseId?: string;
  courseName?: string;
  transactionId: string;
  provider: "stripe" | "paypal" | "bank_transfer";
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Interaction {
  id: string;
  contactId: string;
  type: InteractionType;
  title: string;
  description?: string;
  url?: string;
  duration?: number; // seconds
  metadata?: Record<string, unknown>;
  payment?: Payment;
  agentId?: string;
  isAutoCapture: boolean;
  scoreImpact: number;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "agent" | "user" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  contactId: string;
  channel: "chat" | "email" | "phone" | "whatsapp";
  status: "open" | "closed" | "archived";
  messages: ConversationMessage[];
  sentiment?: "positive" | "neutral" | "negative";
  summary?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  // Identité
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  // Statut CRM
  status: ContactStatus;
  source: ContactSource;
  pipelineStage: PipelineStage;
  assignedTo?: string;
  tags: string[];
  // Score
  score: LeadScore;
  // Enrichissement
  geo?: GeoLocation;
  device?: DeviceInfo;
  utm?: UTMParams;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  interests: string[];
  // Apprentissage
  enrolledCourses: string[];
  completedCourses: string[];
  totalSpent: number;
  currency: string;
  // Interactions
  interactions: Interaction[];
  conversations: Conversation[];
  payments: Payment[];
  // Dédoublonnage
  duplicateOf?: string;
  mergedIds: string[];
  // Alertes
  alerts: Alert[];
  // Métadonnées
  isArchived: boolean;
  archivedAt?: string;
  archivedReason?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  type:
    | "duplicate_detected"
    | "high_intent"
    | "inactive"
    | "payment_failed"
    | "course_completed"
    | "score_threshold";
  severity: "info" | "warning" | "critical";
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineUpdate {
  contactId: string;
  stage: PipelineStage;
  reason?: string;
  agentId?: string;
}

export interface CRMStats {
  overview: {
    totalContacts: number;
    activeLeads: number;
    students: number;
    revenue: number;
    avgScore: number;
    conversionRate: number;
  };
  pipeline: Record<PipelineStage, number>;
  sources: Record<ContactSource, number>;
  scoreDistribution: Record<"A" | "B" | "C" | "D" | "F", number>;
  recentInteractions: number;
  duplicatesDetected: number;
  alertsPending: number;
  topCourses: Array<{ courseId: string; enrollments: number; revenue: number }>;
  monthlyTrend: Array<{
    month: string;
    leads: number;
    conversions: number;
    revenue: number;
  }>;
}

// Request/Response types
export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source: ContactSource;
  geo?: GeoLocation;
  device?: DeviceInfo;
  utm?: UTMParams;
  customFields?: Record<string, unknown>;
  autoCapture?: boolean;
  visitorData?: {
    pageUrl: string;
    referrer?: string;
    sessionDuration?: number;
    pagesViewed?: string[];
  };
}

export interface CreateInteractionRequest {
  type: InteractionType;
  title: string;
  description?: string;
  url?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  payment?: Omit<Payment, "id" | "createdAt">;
  agentId?: string;
  isAutoCapture?: boolean;
}

export interface ContactsQueryParams {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  pipelineStage?: PipelineStage;
  source?: ContactSource;
  scoreMin?: number;
  scoreMax?: number;
  tags?: string;
  search?: string;
  sortBy?: "score" | "createdAt" | "lastSeenAt" | "totalSpent";
  sortOrder?: "asc" | "desc";
  includeArchived?: boolean;
  hasDuplicates?: boolean;
  assignedTo?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    processingTime?: number;
  };
}
```

---

## `app/api/crm/lib/scoring.ts`

```typescript
// ============================================================
// MOTEUR DE SCORING - Lead Scoring Automatique
// ============================================================

import type {
  Contact,
  Interaction,
  LeadScore,
  PipelineStage,
} from "./types";

interface ScoringWeights {
  demographic: number;
  behavioral: number;
  engagement: number;
  intent: number;
  recency: number;
}

const WEIGHTS: ScoringWeights = {
  demographic: 0.2,
  behavioral: 0.25,
  engagement: 0.25,
  intent: 0.2,
  recency: 0.1,
};

const INTERACTION_SCORES: Record<string, number> = {
  page_view: 1,
  email_open: 3,
  email_click: 5,
  download: 8,
  video_watch: 10,
  course_view: 12,
  webinar_attendance: 15,
  form_submit: 20,
  chat_message: 10,
  phone_call: 25,
  payment: 50,
  support_ticket: -5,
};

const PIPELINE_STAGE_BONUS: Record<PipelineStage, number> = {
  discovery: 0,
  interest: 10,
  consideration: 20,
  intent: 35,
  evaluation: 45,
  enrollment: 60,
  active_student: 80,
  completed: 70,
  churned: -20,
};

export function calculateDemographicScore(contact: Partial<Contact>): number {
  let score = 0;

  // Email professionnel (+15)
  if (contact.email && !isPersonalEmail(contact.email)) score += 15;

  // Téléphone renseigné (+10)
  if (contact.phone) score += 10;

  // Entreprise renseignée (+8)
  if (contact.company) score += 8;

  // Titre de poste (+7)
  if (contact.jobTitle) score += 7;

  // LinkedIn (+5)
  if (contact.linkedinUrl) score += 5;

  // Localisation complète (+5)
  if (contact.geo?.country && contact.geo?.city) score += 5;

  return Math.min(score, 100);
}

export function calculateBehavioralScore(
  interactions: Interaction[]
): number {
  if (!interactions.length) return 0;

  const recentInteractions = interactions.filter((i) => {
    const date = new Date(i.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  let score = 0;

  // Score basé sur les types d'interactions
  for (const interaction of recentInteractions) {
    const baseScore = INTERACTION_SCORES[interaction.type] ?? 1;
    score += baseScore