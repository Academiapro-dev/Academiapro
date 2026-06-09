```typescript
// app/api/visio/classe/route.ts - Main router
// app/api/visio/classe/creer/route.ts
// app/api/visio/classe/rejoindre/route.ts
// app/api/visio/classe/emarger/route.ts
// app/api/visio/classe/sessions/route.ts

// ============================================================
// FICHIER 1 : lib/daily.ts — Client Daily.co
// ============================================================

// lib/daily.ts
export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    max_participants: number;
    enable_recording: string;
    enable_chat: boolean;
    enable_whiteboard: boolean;
    exp: number;
    nbf: number;
  };
}

export interface DailyToken {
  token: string;
  room_name: string;
  is_owner: boolean;
  user_name: string;
  user_id: string;
  exp: number;
}

export interface DailyRecording {
  id: string;
  room_name: string;
  start_ts: number;
  status: string;
  max_participants: number;
  duration: number;
  share_token: string;
  s3key: string;
  mtgSessionId: string;
  tracks: Array<{
    type: string;
    participantId: string;
  }>;
}

const DAILY_API_BASE = "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY!;

const dailyHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${DAILY_API_KEY}`,
};

export async function createDailyRoom(params: {
  name: string;
  expiresIn?: number; // minutes
  privacy?: "public" | "private";
}): Promise<DailyRoom> {
  const expiresAt = Math.floor(Date.now() / 1000) + (params.expiresIn || 180) * 60;
  const startsAt = Math.floor(Date.now() / 1000) - 60;

  const response = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: dailyHeaders,
    body: JSON.stringify({
      name: params.name,
      privacy: params.privacy || "private",
      properties: {
        max_participants: 50,
        enable_recording: "cloud",
        enable_chat: true,
        enable_whiteboard: true,
        exp: expiresAt,
        nbf: startsAt,
        start_video_off: false,
        start_audio_off: false,
        lang: "fr",
        geo: "eu",
        enable_prejoin_ui: true,
        enable_network_ui: true,
        enable_noise_cancellation_ui: true,
        recording_type: "cloud",
        permissions: {
          hasPresence: true,
          canSend: ["audio", "video", "screenVideo", "screenAudio", "customVideo"],
          canAdmin: ["participants", "transcription"],
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Daily.co room creation failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function createDailyToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner?: boolean;
  expiresIn?: number; // minutes
}): Promise<DailyToken> {
  const expiresAt = Math.floor(Date.now() / 1000) + (params.expiresIn || 180) * 60;

  const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: "POST",
    headers: dailyHeaders,
    body: JSON.stringify({
      properties: {
        room_name: params.roomName,
        user_id: params.userId,
        user_name: params.userName,
        is_owner: params.isOwner || false,
        exp: expiresAt,
        enable_recording: params.isOwner ? "cloud" : undefined,
        start_cloud_recording: params.isOwner ? true : undefined,
        lang: "fr",
        prejoin_ui_disabled: false,
        permissions: params.isOwner
          ? {
              hasPresence: true,
              canSend: true,
              canAdmin: ["participants", "transcription", "recording"],
            }
          : {
              hasPresence: true,
              canSend: ["audio", "video", "screenVideo", "screenAudio"],
            },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Daily.co token creation failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    ...data,
    room_name: params.roomName,
    is_owner: params.isOwner || false,
    user_name: params.userName,
    user_id: params.userId,
    exp: expiresAt,
  };
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    headers: dailyHeaders,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Daily.co get room failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method: "DELETE",
    headers: dailyHeaders,
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Daily.co delete room failed: ${JSON.stringify(error)}`);
  }
}

export async function getDailyRecordings(roomName: string): Promise<DailyRecording[]> {
  const response = await fetch(
    `${DAILY_API_BASE}/recordings?room_name=${roomName}`,
    { headers: dailyHeaders }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.data || [];
}

export async function getDailyRoomParticipants(roomName: string): Promise<number> {
  const response = await fetch(
    `${DAILY_API_BASE}/presence`,
    { headers: dailyHeaders }
  );

  if (!response.ok) return 0;

  const data = await response.json();
  return data[roomName]?.participants?.length || 0;
}
```

```typescript
// ============================================================
// FICHIER 2 : lib/supabase-server.ts — Client Supabase Server
// ============================================================

// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

export interface SessionLive {
  id: string;
  formation_id: string;
  titre: string;
  description?: string;
  formateur_id: string;
  formateur_nom: string;
  formateur_avatar_ia: boolean;
  daily_room_name: string;
  daily_room_url: string;
  statut: "planifiee" | "en_cours" | "terminee" | "annulee";
  date_debut_prevue: string;
  date_debut_reelle?: string;
  date_fin_reelle?: string;
  max_participants: number;
  participants_connectes: number;
  enregistrement_actif: boolean;
  replay_url?: string;
  replay_disponible: boolean;
  niveau_acces: "Premium" | "Live" | "Premium_Live";
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmargementLive {
  id: string;
  session_id: string;
  user_id: string;
  user_email: string;
  user_nom: string;
  date_entree: string;
  date_sortie?: string;
  duree_presence_minutes?: number;
  statut: "present" | "absent" | "excuse";
  token_acces: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  niveau_accompagnement: "Starter" | "Essential" | "Premium" | "Live" | "Premium_Live";
  formations_acces: string[];
  avatar_ia_actif?: boolean;
}

export function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}

export async function verifyUserToken(token: string): Promise<UserProfile | null> {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export function hasVisioAccess(
  niveau: UserProfile["niveau_accompagnement"]
): boolean {
  return ["Premium", "Live", "Premium_Live"].includes(niveau);
}
```

```typescript
// ============================================================
// FICHIER 3 : POST /api/visio/classe/creer/route.ts
// ============================================================

// app/api/visio/classe/creer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDailyRoom, getDailyRoom } from "@/lib/daily";
import {
  createSupabaseServer,
  verifyUserToken,
  hasVisioAccess,
} from "@/lib/supabase-server";

const CreerSalleSchema = z.object({
  formation_id: z.string().uuid("ID formation invalide"),
  titre: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  date_debut_prevue: z.string().datetime("Date invalide (ISO 8601 requis)"),
  duree_minutes: z.number().int().min(15).max(480).default(90),
  formateur_avatar_ia: z.boolean().default(false),
  niveau_acces: z.enum(["Premium", "Live", "Premium_Live"]).default("Live"),
  metadata: z.record(z.unknown()).optional(),
});

type CreerSalleInput = z.infer<typeof CreerSalleSchema>;

function generateRoomName(formationId: string, titre: string): string {
  const slug = titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 30);

  const timestamp = Date.now().toString(36);
  const shortId = formationId.replace(/-/g,