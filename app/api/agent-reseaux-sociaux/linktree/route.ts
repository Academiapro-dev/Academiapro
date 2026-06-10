# AcadémIA Pro - API Route Linktree Next.js 14 TypeScript

## Structure des fichiers

```
app/
├── api/
│   └── links/
│       ├── route.ts                    # GET tous les liens + stats
│       ├── [id]/
│       │   └── route.ts               # GET/PATCH/DELETE un lien
│       ├── track/
│       │   └── route.ts               # POST tracker un clic
│       ├── optimize/
│       │   └── route.ts               # POST réorganisation auto
│       └── analytics/
│           └── route.ts               # GET analytics détaillées
├── links/
│   └── page.tsx                       # Page Linktree publique
└── dashboard/
    └── links/
        └── page.tsx                   # Dashboard admin
```

---

## 1. Types & Interfaces

```typescript
// types/links.ts
export type LinkCategory = 
  | 'formation' 
  | 'seance' 
  | 'lead_magnet' 
  | 'pack' 
  | 'communaute' 
  | 'webinaire';

export type TrafficSource = 
  | 'instagram' 
  | 'tiktok' 
  | 'youtube' 
  | 'direct' 
  | 'email' 
  | 'linkedin' 
  | 'other';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface LinkStats {
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  conversionRate: number;        // % clics → achat
  revenue: number;               // CA généré
  trafficSources: Record<TrafficSource, number>;
  clicksByHour: number[];        // 24 valeurs
  clicksByDay: number[];         // 7 derniers jours
  lastClickAt: string | null;
}

export interface LimitedOffer {
  isActive: boolean;
  endDate: string;
  originalPrice?: number;
  discountedPrice?: number;
  spotsLeft?: number;
  badge?: string;
}

export interface Link {
  id: string;
  emoji: string;
  label: string;
  sublabel?: string;
  url: string;
  category: LinkCategory;
  isActive: boolean;
  isPinned: boolean;
  isHighlighted: boolean;
  order: number;
  autoOrder: number;             // ordre calculé par algo
  stats: LinkStats;
  limitedOffer?: LimitedOffer;
  seasonalBoost?: Season[];      // activer en certaines saisons
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinktreeConfig {
  autoOptimize: boolean;
  optimizeInterval: 'hourly' | 'daily' | 'weekly';
  lastOptimizedAt: string;
  currentSeason: Season;
  pinnedLinkId?: string;
  highlightStrategy: 'best_converting' | 'most_clicked' | 'revenue' | 'manual';
}

export interface LinktreeData {
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
    accentColor: string;
    backgroundColor: string;
  };
  links: Link[];
  config: LinktreeConfig;
  globalStats: {
    totalClicks: number;
    totalRevenue: number;
    totalConversions: number;
    averageConversionRate: number;
  };
}

export interface TrackClickPayload {
  linkId: string;
  source?: TrafficSource;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
}

export interface TrackClickResponse {
  success: boolean;
  redirectUrl: string;
  message?: string;
}

export interface OptimizeResponse {
  success: boolean;
  changes: {
    linkId: string;
    label: string;
    previousOrder: number;
    newOrder: number;
    reason: string;
  }[];
  highlightedLink: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

## 2. Données mock & utilitaires

```typescript
// lib/links-data.ts
import { Link, LinktreeConfig, LinktreeData, Season } from '@/types/links';

export const getCurrentSeason = (): Season => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

// Simule une DB - remplacer par Prisma/Supabase en production
const linksDB: Link[] = [
  {
    id: 'link_formations',
    emoji: '🎓',
    label: 'Voir les 131 formations',
    sublabel: 'Catalogue complet IA & développement personnel',
    url: '/catalogue',
    category: 'formation',
    isActive: true,
    isPinned: false,
    isHighlighted: false,
    order: 1,
    autoOrder: 1,
    stats: {
      totalClicks: 8420,
      clicksToday: 147,
      clicksThisWeek: 892,
      clicksThisMonth: 3241,
      conversionRate: 12.4,
      revenue: 45230,
      trafficSources: {
        instagram: 3200,
        tiktok: 2100,
        youtube: 1500,
        direct: 800,
        email: 400,
        linkedin: 300,
        other: 120,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)),
      clicksByDay: [120, 145, 98, 167, 134, 189, 147],
      lastClickAt: new Date().toISOString(),
    },
    tags: ['catalogue', 'formations', 'ia'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_seances',
    emoji: '🧘',
    label: 'Réserver une séance',
    sublabel: 'Coaching personnalisé 1:1',
    url: '/seances',
    category: 'seance',
    isActive: true,
    isPinned: false,
    isHighlighted: false,
    order: 2,
    autoOrder: 2,
    stats: {
      totalClicks: 3210,
      clicksToday: 43,
      clicksThisWeek: 298,
      clicksThisMonth: 1102,
      conversionRate: 28.7,
      revenue: 62400,
      trafficSources: {
        instagram: 1200,
        tiktok: 450,
        youtube: 800,
        direct: 400,
        email: 250,
        linkedin: 80,
        other: 30,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 20)),
      clicksByDay: [40, 55, 38, 62, 45, 71, 43],
      lastClickAt: new Date().toISOString(),
    },
    tags: ['coaching', 'seance', 'personnalise'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_ebook',
    emoji: '📥',
    label: 'E-book gratuit',
    sublabel: '\"Maîtriser l\'IA en 30 jours\" - 127 pages',
    url: '/lead-magnets/ebook',
    category: 'lead_magnet',
    isActive: true,
    isPinned: false,
    isHighlighted: false,
    order: 3,
    autoOrder: 3,
    stats: {
      totalClicks: 12890,
      clicksToday: 234,
      clicksThisWeek: 1456,
      clicksThisMonth: 5678,
      conversionRate: 67.3,
      revenue: 0,
      trafficSources: {
        instagram: 5200,
        tiktok: 4100,
        youtube: 1800,
        direct: 900,
        email: 600,
        linkedin: 200,
        other: 90,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 80)),
      clicksByDay: [200, 210, 198, 245, 220, 289, 234],
      lastClickAt: new Date().toISOString(),
    },
    tags: ['gratuit', 'ebook', 'lead-magnet'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_starter',
    emoji: '🎯',
    label: 'Starter Pack 47€',
    sublabel: 'Accès 15 formations essentielles',
    url: '/packs/starter',
    category: 'pack',
    isActive: true,
    isPinned: false,
    isHighlighted: true,
    order: 4,
    autoOrder: 4,
    stats: {
      totalClicks: 5670,
      clicksToday: 89,
      clicksThisWeek: 567,
      clicksThisMonth: 2103,
      conversionRate: 18.9,
      revenue: 50400,
      trafficSources: {
        instagram: 2300,
        tiktok: 1500,
        youtube: 900,
        direct: 600,
        email: 250,
        linkedin: 90,
        other: 30,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 40)),
      clicksByDay: [80, 95, 72, 110, 88, 123, 89],
      lastClickAt: new Date().toISOString(),
    },
    limitedOffer: {
      isActive: true,
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      originalPrice: 97,
      discountedPrice: 47,
      spotsLeft: 23,
      badge: '🔥 -52% ce week-end',
    },
    tags: ['pack', 'starter', 'promo'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_ia_complet',
    emoji: '🚀',
    label: 'Pack IA Complet',
    sublabel: 'Accès illimité à toutes les formations',
    url: '/packs/ia-complet',
    category: 'pack',
    isActive: true,
    isPinned: true,
    isHighlighted: true,
    order: 5,
    autoOrder: 5,
    stats: {
      totalClicks: 4320,
      clicksToday: 67,
      clicksThisWeek: 423,
      clicksThisMonth: 1589,
      conversionRate: 22.1,
      revenue: 142300,
      trafficSources: {
        instagram: 1800,
        tiktok: 1100,
        youtube: 700,
        direct: 450,
        email: 180,
        linkedin: 60,
        other: 30,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 30)),
      clicksByDay: [60, 72, 55, 85, 68, 96, 67],
      lastClickAt: new Date().toISOString(),
    },
    limitedOffer: {
      isActive: false,
      endDate: '',
      badge: '⭐ Best-seller',
    },
    seasonalBoost: ['autumn', 'winter'],
    tags: ['pack', 'complet', 'ia', 'bestseller'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_communaute',
    emoji: '💬',
    label: 'Rejoindre la communauté',
    sublabel: '4 200+ membres actifs',
    url: '/communaute',
    category: 'communaute',
    isActive: true,
    isPinned: false,
    isHighlighted: false,
    order: 6,
    autoOrder: 6,
    stats: {
      totalClicks: 6780,
      clicksToday: 112,
      clicksThisWeek: 756,
      clicksThisMonth: 2890,
      conversionRate: 45.2,
      revenue: 18900,
      trafficSources: {
        instagram: 3100,
        tiktok: 1800,
        youtube: 900,
        direct: 600,
        email: 250,
        linkedin: 100,
        other: 30,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 60)),
      clicksByDay: [100, 118, 92, 135, 108, 156, 112],
      lastClickAt: new Date().toISOString(),
    },
    tags: ['communaute', 'discord', 'reseau'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'link_webinaire',
    emoji: '📅',
    label: 'Webinaire gratuit',
    sublabel: 'Prochain : \"IA & Productivité\" - Jeudi 20h',
    url: '/lead-magnets/webinaire',
    category: 'webinaire',
    isActive: true,
    isPinned: false,
    isHighlighted: false,
    order: 7,
    autoOrder: 7,
    stats: {
      totalClicks: 7890,
      clicksToday: 178,
      clicksThisWeek: 1023,
      clicksThisMonth: 3456,
      conversionRate: 52.8,
      revenue: 23400,
      trafficSources: {
        instagram: 3400,
        tiktok: 2100,
        youtube: 1200,
        direct: 700,
        email: 300,
        linkedin: 150,
        other: 40,
      },
      clicksByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 70)),
      clicksByDay