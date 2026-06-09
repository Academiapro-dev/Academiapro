# API Route Next.js 14 - Notifications Multi-Canal AcadémIA Pro

## Structure des fichiers

```
app/
├── api/
│   └── notifications/
│       ├── route.ts
│       ├── virtual-class/
│       │   └── route.ts
│       ├── therapy/
│       │   └── route.ts
│       └── training/
│           └── route.ts
lib/
├── notifications/
│   ├── email-templates.ts
│   ├── sms-templates.ts
│   ├── push-notifications.ts
│   ├── resend-client.ts
│   ├── twilio-client.ts
│   └── scheduler.ts
types/
└── notifications.ts
```

---

## 1. Types - `types/notifications.ts`

```typescript
export type NotificationChannel = "email" | "sms" | "push";
export type NotificationStatus = "pending" | "sent" | "failed" | "scheduled";

export type VirtualClassNotificationType =
  | "reminder_j1"
  | "reminder_h1"
  | "reminder_15min"
  | "reminder_30min";

export type TherapyNotificationType =
  | "booking_confirmation"
  | "reminder_h1"
  | "reminder_15min"
  | "reminder_10min"
  | "session_report";

export type TrainingNotificationType =
  | "welcome"
  | "inactivity_3days"
  | "module_completed"
  | "certificate_available";

export interface BaseNotificationPayload {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  userPushToken?: string;
  locale?: "fr" | "en";
}

export interface VirtualClassPayload extends BaseNotificationPayload {
  type: VirtualClassNotificationType;
  sessionId: string;
  sessionTitle: string;
  sessionDate: Date;
  sessionLink: string;
  instructorName: string;
  duration: number; // minutes
}

export interface TherapyPayload extends BaseNotificationPayload {
  type: TherapyNotificationType;
  appointmentId: string;
  therapistName: string;
  appointmentDate: Date;
  sessionLink?: string;
  sessionType: "video" | "audio" | "in-person";
  reportContent?: string;
  reportLink?: string;
  duration: number; // minutes
}

export interface TrainingPayload extends BaseNotificationPayload {
  type: TrainingNotificationType;
  trainingId: string;
  trainingTitle: string;
  moduleTitle?: string;
  moduleNumber?: number;
  totalModules?: number;
  progressPercentage?: number;
  certificateLink?: string;
  certificateId?: string;
  lastActiveDate?: Date;
}

export interface NotificationResult {
  channel: NotificationChannel;
  status: NotificationStatus;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationResponse {
  success: boolean;
  notificationId: string;
  results: NotificationResult[];
  scheduledAt?: Date;
  errors?: string[];
}

export interface ScheduledNotification {
  id: string;
  type: string;
  payload: VirtualClassPayload | TherapyPayload | TrainingPayload;
  scheduledAt: Date;
  channels: NotificationChannel[];
  status: NotificationStatus;
}
```

---

## 2. Client Resend - `lib/notifications/resend-client.ts`

```typescript
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_CONFIG = {
  from: {
    noreply: "AcadémIA Pro <noreply@academia-pro.fr>",
    notifications: "Notifications AcadémIA <notifications@academia-pro.fr>",
    therapy: "Thérapie AcadémIA <therapy@academia-pro.fr>",
    training: "Formation AcadémIA <formation@academia-pro.fr>",
  },
  replyTo: "support@academia-pro.fr",
  tags: {
    virtualClass: [{ name: "category", value: "virtual-class" }],
    therapy: [{ name: "category", value: "therapy" }],
    training: [{ name: "category", value: "training" }],
  },
} as const;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<{ messageId: string } | { error: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: params.from ?? EMAIL_CONFIG.from.noreply,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo ?? EMAIL_CONFIG.replyTo,
      tags: params.tags,
    });

    if (error) {
      console.error("[Resend] Email send error:", error);
      return { error: error.message };
    }

    return { messageId: data!.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Resend] Unexpected error:", message);
    return { error: message };
  }
}
```

---

## 3. Client Twilio - `lib/notifications/twilio-client.ts`

```typescript
import twilio from "twilio";

if (
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_PHONE_NUMBER
) {
  throw new Error(
    "Twilio environment variables are not properly configured: " +
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER required"
  );
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const SMS_CONFIG = {
  from: process.env.TWILIO_PHONE_NUMBER,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  maxLength: 160,
} as const;

export function formatPhoneNumber(phone: string): string {
  // Normalise vers format E.164 (+33...)
  const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+33${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

export async function sendSMS(params: {
  to: string;
  body: string;
}): Promise<{ messageId: string } | { error: string }> {
  try {
    const formattedPhone = formatPhoneNumber(params.to);

    const message = await twilioClient.messages.create({
      body: params.body.slice(0, SMS_CONFIG.maxLength),
      from: SMS_CONFIG.messagingServiceSid ?? SMS_CONFIG.from,
      to: formattedPhone,
    });

    console.log(`[Twilio] SMS sent - SID: ${message.sid}, Status: ${message.status}`);
    return { messageId: message.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMS error";
    console.error("[Twilio] SMS error:", message);
    return { error: message };
  }
}
```

---

## 4. Push Notifications - `lib/notifications/push-notifications.ts`

```typescript
// Compatible Firebase Cloud Messaging (FCM) via fetch natif
const FCM_API_URL = "https://fcm.googleapis.com/v1/projects";

if (!process.env.FCM_PROJECT_ID || !process.env.FCM_SERVICE_ACCOUNT_KEY) {
  console.warn("[Push] FCM not configured - push notifications disabled");
}

interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
}

interface FCMResponse {
  name?: string;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

async function getFCMAccessToken(): Promise<string> {
  // En production : utiliser google-auth-library
  // Ici version simplifiée avec variable d'env token statique pour dev
  if (process.env.FCM_ACCESS_TOKEN) {
    return process.env.FCM_ACCESS_TOKEN;
  }

  try {
    const { GoogleAuth } = await import("google-auth-library");
    const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_KEY!);
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token!;
  } catch {
    throw new Error("Failed to get FCM access token");
  }
}

export async function sendPushNotification(
  params: PushPayload
): Promise<{ messageId: string } | { error: string }> {
  if (!process.env.FCM_PROJECT_ID) {
    return { error: "FCM not configured" };
  }

  try {
    const accessToken = await getFCMAccessToken();
    const projectId = process.env.FCM_PROJECT_ID;

    const fcmMessage = {
      message: {
        token: params.token,
        notification: {
          title: params.title,
          body: params.body,
          ...(params.imageUrl && { image: params.imageUrl }),
        },
        data: params.data ?? {},
        android: {
          priority: "high" as const,
          notification: {
            sound: params.sound ?? "default",
            badge: params.badge?.toString(),
            channel_id: "academia_notifications",
          },
        },
        apns: {
          payload: {
            aps: {
              badge: params.badge ?? 1,
              sound: params.sound ?? "default",
              "content-available": 1,
            },
          },
          headers: {
            "apns-priority": "10",
          },
        },
        webpush: {
          notification: {
            icon: "/icons/notification-icon.png",
            badge: "/icons/badge-icon.png",
            requireInteraction: true,
          },
        },
      },
    };

    const response = await fetch(
      `${FCM_API_URL}/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fcmMessage),
      }
    );

    const result: FCMResponse = await response.json();

    if (!response.ok || result.error) {
      const errorMsg = result.error?.message ?? `HTTP ${response.status}`;
      console.error("[FCM] Push notification error:", errorMsg);
      return { error: errorMsg };
    }

    console.log(`[FCM] Push sent - Name: