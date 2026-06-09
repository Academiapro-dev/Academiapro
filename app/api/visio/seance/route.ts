# API Route Next.js 14 - Séances Thérapeutiques 1-to-1 Daily.co AcadémIA Pro

## Structure des fichiers

```
app/api/visio/seance/
├── creer/route.ts
├── demarrer/route.ts
├── terminer/route.ts
├── historique/route.ts
└── _lib/
    ├── daily.ts
    ├── tokens.ts
    ├── prompts.ts
    ├── compte-rendu.ts
    ├── email.ts
    ├── crm.ts
    └── types.ts
```

---

## `app/api/visio/seance/_lib/types.ts`

```typescript
export type Specialite =
  | "anxiete"
  | "stress"
  | "confiance"
  | "deuil"
  | "burnout"
  | "phobies"
  | "relations"
  | "sommeil"
  | "nutrition"
  | "performance";

export type StatutSeance =
  | "en_attente"
  | "active"
  | "terminee"
  | "annulee"
  | "expiree";

export type NiveauUrgence = "faible" | "modere" | "eleve" | "critique";

export interface Apprenant {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  historiqueSeances?: string[];
  crmContactId?: string;
}

export interface ReservationSeance {
  id: string;
  apprenantId: string;
  specialite: Specialite;
  datePrevue: string;
  paiementId: string;
  statutPaiement: "en_attente" | "valide" | "rembourse" | "echec";
  montant: number;
  devise: string;
}

export interface SalleDaily {
  id: string;
  name: string;
  url: string;
  privacy: "private" | "public";
  config: DailyRoomConfig;
  created_at: number;
}

export interface DailyRoomConfig {
  max_participants: number;
  enable_recording: string;
  exp: number;
  enable_chat: boolean;
  enable_screenshare: boolean;
  start_video_off: boolean;
  start_audio_off: boolean;
  lang: string;
  eject_at_room_exp: boolean;
  enable_knocking: boolean;
}

export interface DailyToken {
  token: string;
  room_name: string;
  user_id: string;
  user_name: string;
  is_owner: boolean;
  exp: number;
}

export interface SeanceComplete {
  id: string;
  reservationId: string;
  apprenantId: string;
  specialite: Specialite;
  salle: SalleDaily;
  tokenApprenant: string;
  tokenAvatar: string;
  urlRejoindre: string;
  systemPrompt: string;
  statut: StatutSeance;
  debutAt?: string;
  finAt?: string;
  dureeMinutes?: number;
  enregistrementUrl?: string;
  compteRendu?: CompteRendu;
  createdAt: string;
  expiresAt: string;
}

export interface CompteRendu {
  id: string;
  seanceId: string;
  apprenantId: string;
  specialite: Specialite;
  dateSeance: string;
  dureeMinutes: number;
  resumeExecutif: string;
  pointsAbordes: string[];
  progressionObservee: string;
  exercicesRecommandes: ExerciceRecommande[];
  objectifsSuivant: string[];
  niveauUrgence: NiveauUrgence;
  notesTherapeutiques: string;
  prochainRdvSuggere: string;
  transcriptionResumee?: string;
  generatedAt: string;
}

export interface ExerciceRecommande {
  nom: string;
  description: string;
  frequence: string;
  duree: string;
  objectif: string;
}

export interface DemarrerSeanceRequest {
  seanceId: string;
  apprenantId: string;
}

export interface TerminerSeanceRequest {
  seanceId: string;
  apprenantId: string;
  notesApprenant?: string;
  transcription?: TranscriptionSegment[];
  scoreEngagement?: number;
}

export interface TranscriptionSegment {
  speaker: "apprenant" | "avatar";
  texte: string;
  timestamp: number;
}

export interface CRMUpdate {
  contactId: string;
  derniereSeance: string;
  specialitesTravaillees: string[];
  nombreSeancesTotal: number;
  scoreProgression: number;
  prochainRdv?: string;
  tags: string[];
  notes: string;
}
```

---

## `app/api/visio/seance/_lib/daily.ts`

```typescript
import type { SalleDaily, DailyRoomConfig } from "./types";

const DAILY_API_URL = "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY!;

if (!DAILY_API_KEY) {
  throw new Error("DAILY_API_KEY manquante dans les variables d'environnement");
}

const dailyHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${DAILY_API_KEY}`,
};

/**
 * Crée une salle Daily.co privée pour une séance 1-to-1
 * - Max 2 participants
 * - Enregistrement activé
 * - Expiration 35 minutes depuis maintenant
 */
export async function creerSallePrivee(
  seanceId: string,
  specialite: string
): Promise<SalleDaily> {
  const maintenant = Math.floor(Date.now() / 1000);
  const expirationSecondes = maintenant + 35 * 60; // 35 minutes

  const nomSalle = `academia-${specialite}-${seanceId}-${maintenant}`;

  const roomConfig: DailyRoomConfig = {
    max_participants: 2,
    enable_recording: "cloud",
    exp: expirationSecondes,
    enable_chat: true,
    enable_screenshare: false,
    start_video_off: false,
    start_audio_off: false,
    lang: "fr",
    eject_at_room_exp: true,
    enable_knocking: false,
  };

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: dailyHeaders,
    body: JSON.stringify({
      name: nomSalle,
      privacy: "private",
      properties: roomConfig,
    }),
  });

  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(
      `Erreur Daily.co création salle: ${erreur.error || response.statusText}`
    );
  }

  const salle = await response.json();

  return {
    id: salle.id,
    name: salle.name,
    url: salle.url,
    privacy: salle.privacy,
    config: roomConfig,
    created_at: salle.created_at,
  };
}

/**
 * Démarre l'enregistrement cloud d'une salle Daily.co
 */
export async function demarrerEnregistrement(
  nomSalle: string
): Promise<{ recordingId: string }> {
  const response = await fetch(
    `${DAILY_API_URL}/rooms/${nomSalle}/recordings`,
    {
      method: "POST",
      headers: dailyHeaders,
      body: JSON.stringify({
        layout: { preset: "active-participant" },
      }),
    }
  );

  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(
      `Erreur démarrage enregistrement: ${erreur.error || response.statusText}`
    );
  }

  const data = await response.json();
  return { recordingId: data.id };
}

/**
 * Arrête l'enregistrement et récupère l'URL
 */
export async function arreterEnregistrement(
  nomSalle: string,
  recordingId: string
): Promise<{ url: string; duration: number }> {
  // Arrêt de l'enregistrement
  await fetch(
    `${DAILY_API_URL}/rooms/${nomSalle}/recordings/${recordingId}/stop`,
    {
      method: "POST",
      headers: dailyHeaders,
    }
  );

  // Attendre que l'enregistrement soit prêt (polling simple)
  let tentatives = 0;
  const maxTentatives = 10;

  while (tentatives < maxTentatives) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = await fetch(
      `${DAILY_API_URL}/recordings/${recordingId}`,
      {
        headers: dailyHeaders,
      }
    );

    if (response.ok) {
      const recording = await response.json();
      if (recording.status === "finished" && recording.download_link) {
        return {
          url: recording.download_link,
          duration: recording.duration || 0,
        };
      }
    }
    tentatives++;
  }

  throw new Error("Timeout: enregistrement non disponible après 30 secondes");
}

/**
 * Programme la suppression automatique du replay après 48h
 */
export async function programmerSuppressionReplay(
  recordingId: string
): Promise<void> {
  const supprimerApres48h = async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, 48 * 60 * 60 * 1000)
    );

    try {
      await fetch(`${DAILY_API_URL}/recordings/${recordingId}`, {
        method: "DELETE",
        headers: dailyHeaders,
      });
      console.log(`Replay ${recordingId} supprimé après 48h`);
    } catch (error) {
      console.error(`Erreur suppression replay ${recordingId}:`, error);
    }
  };

  // Exécution en arrière-plan sans bloquer la réponse
  supprimerApres48h().catch(console.error);
}

/**
 * Récupère les informations d'une salle Daily.co
 */
export async function obtenirInfosSalle(
  nomSalle: string
): Promise<SalleDaily | null> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${nomSalle}`, {
    headers: dailyHeaders,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Erreur récupération salle: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Supprime une salle Daily.co
 */
export async function supprimerSalle(nomSalle: string): Promise<void> {
  await fetch(`${DAILY_API_URL}/rooms/${nomSalle}`, {
    method: "DELETE",
    headers: dailyHeaders,
  });
}
```

---

## `app/api/visio/seance/_lib/tokens.ts`

```typescript
import type { DailyToken, Specialite } from "./types";

const DAILY_API_URL = "https://api.daily.co/v1