# AcadémIA Pro - PWA & Push Notifications API

## Structure des fichiers

```
src/
├── app/
│   └── api/
│       └── pwa/
│           ├── subscribe/route.ts
│           ├── unsubscribe/route.ts
│           ├── notify/route.ts
│           └── statut/route.ts
├── lib/
│   ├── webpush.ts
│   ├── supabase-server.ts
│   └── push-templates.ts
├── types/
│   └── pwa.ts
└── public/
    └── sw.js
```

---

## 1. Types TypeScript

```typescript
// src/types/pwa.ts

export interface PushSubscriptionData {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationType =
  | 'virtual_class_reminder'
  | 'therapy_session_reminder'
  | 'new_module'
  | 'certificate_obtained'
  | 'tutor_message'
  | 'promotional_offer';

export interface SendNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  broadcast?: boolean;
  type: NotificationType;
  custom_payload?: Partial<NotificationPayload>;
  scheduled_at?: string;
  metadata?: {
    class_id?: string;
    session_id?: string;
    module_id?: string;
    certificate_id?: string;
    message_id?: string;
    offer_id?: string;
    scheduled_time?: string;
    instructor_name?: string;
    module_name?: string;
    discount_percentage?: number;
    [key: string]: unknown;
  };
}

export interface SubscribeRequest {
  user_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  device_info?: {
    user_agent?: string;
    device_type?: 'mobile' | 'desktop' | 'tablet';
  };
}

export interface UnsubscribeRequest {
  user_id: string;
  endpoint: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface NotificationResult {
  user_id: string;
  endpoint: string;
  status: 'sent' | 'failed' | 'expired';
  error?: string;
}

export interface PwaStatutResponse {
  total_subscriptions: number;
  active_subscriptions: number;
  inactive_subscriptions: number;
  notifications_sent_today: number;
  notifications_sent_week: number;
  subscriptions_by_device: {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
  };
  server_vapid_configured: boolean;
  last_notification_sent?: string;
}
```

---

## 2. Configuration Web Push

```typescript
// src/lib/webpush.ts

import webpush, { PushSubscription, SendResult } from 'web-push';
import { NotificationPayload } from '@/types/pwa';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY manquante dans .env');
}

if (!process.env.VAPID_PRIVATE_KEY) {
  throw new Error('VAPID_PRIVATE_KEY manquante dans .env');
}

if (!process.env.VAPID_EMAIL) {
  throw new Error('VAPID_EMAIL manquante dans .env');
}

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const webPushConfig = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  isConfigured:
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY &&
    !!process.env.VAPID_EMAIL,
};

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; result?: SendResult; error?: string }> {
  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 heures
        urgency: getUrgencyLevel(payload.type),
        topic: payload.tag,
      }
    );

    return { success: true, result };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };

    // Subscription expirée ou invalide
    if (err.statusCode === 410 || err.statusCode === 404) {
      return {
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
      };
    }

    return {
      success: false,
      error: err.message || 'Erreur envoi notification',
    };
  }
}

function getUrgencyLevel(
  type: string
): 'very-low' | 'low' | 'normal' | 'high' {
  const urgencyMap: Record<string, 'very-low' | 'low' | 'normal' | 'high'> = {
    virtual_class_reminder: 'high',
    therapy_session_reminder: 'high',
    new_module: 'normal',
    certificate_obtained: 'normal',
    tutor_message: 'high',
    promotional_offer: 'low',
  };

  return urgencyMap[type] || 'normal';
}

export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}
```

---

## 3. Templates de Notifications

```typescript
// src/lib/push-templates.ts

import {
  NotificationPayload,
  NotificationType,
  SendNotificationRequest,
} from '@/types/pwa';

const BASE_ICON = '/icons/icon-192x192.png';
const BASE_BADGE = '/icons/badge-72x72.png';

type TemplateFactory = (
  metadata: SendNotificationRequest['metadata'],
  customPayload?: Partial<NotificationPayload>
) => NotificationPayload;

const notificationTemplates: Record<NotificationType, TemplateFactory> = {
  virtual_class_reminder: (metadata, custom) => ({
    title: '🎓 Classe virtuelle dans 30 minutes !',
    body: metadata?.instructor_name
      ? `Votre session avec ${metadata.instructor_name} commence bientôt. Préparez-vous !`
      : 'Votre classe virtuelle commence dans 30 minutes. Rejoignez maintenant !',
    icon: BASE_ICON,
    badge: BASE_BADGE,
    image: '/notifications/virtual-class.png',
    tag: `virtual-class-${metadata?.class_id || 'default'}`,
    url: metadata?.class_id
      ? `/classes/${metadata.class_id}/rejoindre`
      : '/classes',
    type: 'virtual_class_reminder',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'join',
        title: '▶️ Rejoindre',
        icon: '/icons/join.png',
      },
      {
        action: 'remind_later',
        title: '⏰ Rappel 10 min',
        icon: '/icons/remind.png',
      },
    ],
    data: {
      class_id: metadata?.class_id,
      type: 'virtual_class_reminder',
      url: metadata?.class_id
        ? `/classes/${metadata.class_id}/rejoindre`
        : '/classes',
    },
    ...custom,
  }),

  therapy_session_reminder: (metadata, custom) => ({
    title: '💆 Séance thérapeutique dans 15 minutes',
    body: `Votre séance de bien-être commence dans 15 minutes. ${
      metadata?.scheduled_time
        ? `Heure : ${metadata.scheduled_time}`
        : 'Prenez un moment pour vous préparer.'
    }`,
    icon: BASE_ICON,
    badge: BASE_BADGE,
    image: '/notifications/therapy.png',
    tag: `therapy-${metadata?.session_id || 'default'}`,
    url: metadata?.session_id
      ? `/therapie/${metadata.session_id}`
      : '/therapie',
    type: 'therapy_session_reminder',
    vibrate: [100, 50, 100],
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'join_session',
        title: '🌿 Rejoindre la séance',
        icon: '/icons/therapy.png',
      },
      {
        action: 'reschedule',
        title: '📅 Reprogrammer',
        icon: '/icons/calendar.png',
      },
    ],
    data: {
      session_id: metadata?.session_id,
      type: 'therapy_session_reminder',
      url: metadata?.session_id
        ? `/therapie/${metadata.session_id}`
        : '/therapie',
    },
    ...custom,
  }),

  new_module: (metadata, custom) => ({
    title: '📚 Nouveau module disponible !',
    body: metadata?.module_name
      ? `Le module "${metadata.module_name}" vient d'être ajouté à votre parcours d'apprentissage.`
      : 'Un nouveau contenu de formation est disponible sur AcadémIA Pro !',
    icon: BASE_ICON,
    badge: BASE_BADGE,
    image: '/notifications/new-module.png',
    tag: `module-${metadata?.module_id || 'new'}`,
    url: metadata?.module_id
      ? `/modules/${metadata.module_id}`
      : '/modules',
    type: 'new_module',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    actions: [
      {
        action: 'view_module',
        title: '👁️ Voir le module',
        icon: '/icons/module.png',
      },
      {
        action: 'save_later',
        title: '🔖 Sauvegarder',
        icon: '/icons/bookmark.png',
      },
    ],
    data: {
      module_id: metadata?.module_id,
      