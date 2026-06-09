# Composant Séance Live 1-to-1 - AcadémIA Pro

## Structure des fichiers

```
components/
  LiveSession/
    index.tsx
    VideoPlayer.tsx
    ChatPanel.tsx
    SessionTimer.tsx
    SessionControls.tsx
    SessionReport.tsx
hooks/
  useSessionTimer.ts
  useDailyCall.ts
  useHeyGenAvatar.ts
  useSessionChat.ts
types/
  session.types.ts
```

---

## `types/session.types.ts`

```typescript
export type SessionStatus =
  | "idle"
  | "connecting"
  | "active"
  | "paused"
  | "ended"
  | "error";

export type MessageRole = "user" | "avatar" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SessionReport {
  id: string;
  sessionDate: Date;
  duration: number; // secondes
  subject: string;
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  nextSteps: string[];
  score?: number;
  transcript: ChatMessage[];
}

export interface SessionConfig {
  roomUrl: string;
  avatarId: string;
  heygenApiKey: string;
  studentName: string;
  subject: string;
  maxDuration: number; // secondes (default: 1800 = 30min)
}

export interface AvatarStreamState {
  isConnected: boolean;
  isLoading: boolean;
  streamUrl?: string;
  sessionId?: string;
  error?: string;
}
```

---

## `hooks/useSessionTimer.ts`

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSessionTimerReturn {
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  isWarning: boolean;
  isCritical: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
}

export function useSessionTimer(
  maxDuration: number = 1800,
  onTimeUp?: () => void
): UseSessionTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            setIsRunning(false);
            onTimeUpRef.current?.();
            return maxDuration;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, maxDuration]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const remaining = maxDuration - elapsed;

  return {
    elapsed,
    remaining,
    isRunning,
    isWarning: remaining <= 300 && remaining > 60, // 5 dernières min
    isCritical: remaining <= 60, // dernière minute
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: () => {
      setIsRunning(false);
      setElapsed(0);
    },
    formatTime,
  };
}
```

---

## `hooks/useHeyGenAvatar.ts`

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import type { AvatarStreamState } from "@/types/session.types";

interface UseHeyGenAvatarReturn {
  avatarState: AvatarStreamState;
  videoRef: React.RefObject<HTMLVideoElement>;
  startAvatar: (avatarId: string, apiKey: string) => Promise<void>;
  sendTextToAvatar: (text: string) => Promise<void>;
  stopAvatar: () => Promise<void>;
  isAvatarSpeaking: boolean;
}

export function useHeyGenAvatar(): UseHeyGenAvatarReturn {
  const [avatarState, setAvatarState] = useState<AvatarStreamState>({
    isConnected: false,
    isLoading: false,
  });
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const apiKeyRef = useRef<string>("");

  const startAvatar = useCallback(
    async (avatarId: string, apiKey: string) => {
      apiKeyRef.current = apiKey;
      setAvatarState({ isConnected: false, isLoading: true });

      try {
        // 1. Créer une session HeyGen Streaming
        const sessionRes = await fetch(
          "https://api.heygen.com/v1/streaming.new",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": apiKey,
            },
            body: JSON.stringify({
              quality: "high",
              avatar_name: avatarId,
              voice: { rate: 1.0, emotion: "Friendly" },
              video_encoding: "H264",
              knowledge_base: "",
              version: "v2",
            }),
          }
        );

        if (!sessionRes.ok) throw new Error("Échec création session HeyGen");
        const sessionData = await sessionRes.json();
        const { session_id, sdp: offerSdp, ice_servers } = sessionData.data;
        sessionIdRef.current = session_id;

        // 2. Setup WebRTC
        const pc = new RTCPeerConnection({ iceServers: ice_servers });
        peerConnectionRef.current = pc;

        pc.ontrack = (event) => {
          if (event.track.kind === "video" && videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = async ({ candidate }) => {
          if (candidate && session_id) {
            await fetch("https://api.heygen.com/v1/streaming.ice", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apiKey,
              },
              body: JSON.stringify({
                session_id,
                candidate: candidate.toJSON(),
              }),
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (
            pc.connectionState === "connected" ||
            pc.connectionState === "completed"
          ) {
            setAvatarState({
              isConnected: true,
              isLoading: false,
              sessionId: session_id,
            });
          }
        };

        // 3. Set remote description (offer from HeyGen)
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: offerSdp })
        );

        // 4. Create & set local answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // 5. Send answer to HeyGen
        await fetch("https://api.heygen.com/v1/streaming.start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            session_id,
            sdp: answer.sdp,
          }),
        });
      } catch (error) {
        setAvatarState({
          isConnected: false,
          isLoading: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    },
    []
  );

  const sendTextToAvatar = useCallback(async (text: string) => {
    if (!sessionIdRef.current || !apiKeyRef.current) return;
    setIsAvatarSpeaking(true);

    try {
      await fetch("https://api.heygen.com/v1/streaming.task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKeyRef.current,
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          text,
          task_type: "talk",
        }),
      });

      // Estimation durée parole (~150 mots/min)
      const wordCount = text.split(" ").length;
      const speakDuration = (wordCount / 150) * 60 * 1000;
      setTimeout(() => setIsAvatarSpeaking(false), speakDuration);
    } catch {
      setIsAvatarSpeaking(false);
    }
  }, []);

  const stopAvatar = useCallback(async () => {
    if (sessionIdRef.current && apiKeyRef.current) {
      await fetch("https://api.heygen.com/v1/streaming.stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKeyRef.current,
        },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      }).catch(() => {});
    }
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    sessionIdRef.current = null;
    setAvatarState({ isConnected: false, isLoading: false });
    setIsAvatarSpeaking(false);
  }, []);

  return {
    avatarState,
    videoRef,
    startAvatar,
    sendTextToAvatar,
    stopAvatar,
    isAvatarSpeaking,
  };
}
```

---

## `hooks/useSessionChat.ts`

```typescript
"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "@/types/session.types";
import { v4 as uuidv4 } from "uuid";

interface UseSessionChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  addUserMessage: (content: string) => ChatMessage;
  addAvatarMessage: (content: string) => ChatMessage;
  addSystemMessage: (content: string) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
  getTranscript: () => string;
}

export function useSessionChat(): UseSessionChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const addUserMessage = useCallback((content: string): ChatMessage => {
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new