```typescript
// app/api/agent-reseaux-sociaux/optimisation/analyser/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface PostPerformance {
  id: string;
  platform: Platform;
  content: string;
  format: ContentFormat;
  publishedAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    clicks: number;
    engagementRate: number;
  };
  hashtags: string[];
  publishHour: number;
}

interface TunnelPerformance {
  id: string;
  name: string;
  platform: Platform;
  steps: TunnelStep[];
  overallConversionRate: number;
  totalVisitors: number;
  totalConversions: number;
}

interface TunnelStep {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  dropRate: number;
  conversionRate: number;
}

interface ManyChatMessage {
  id: string;
  name: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
}

interface EmailSequence {
  id: string;
  subject: string;
  position: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

interface WeeklyAnalysis {
  weekId: string;
  periodStart: string;
  periodEnd: string;
  contentPerformance: ContentPerformanceAnalysis;
  tunnelPerformance: TunnelPerformanceAnalysis;
  automaticAdjustments: AutomaticAdjustments;
  weeklyReport: WeeklyReport;
  analyzedAt: string;
}

interface ContentPerformanceAnalysis {
  byPlatform: Record<Platform, PlatformContentAnalysis>;
  globalInsights: GlobalContentInsights;
}

interface PlatformContentAnalysis {
  platform: Platform;
  top3Posts: PostPerformance[];
  bottom3Posts: PostPerformance[];
  bestFormat: ContentFormat;
  formatPerformance: Record<ContentFormat, FormatMetrics>;
  optimalPublishHour: number;
  optimalPublishHourConfidence: number;
  topHashtags: HashtagPerformance[];
  averageEngagementRate: number;
  totalPosts: number;
}

interface FormatMetrics {
  format: ContentFormat;
  averageEngagementRate: number;
  totalPosts: number;
  averageReach: number;
  averageImpressions: number;
}

interface HashtagPerformance {
  hashtag: string;
  usageCount: number;
  averageEngagementRate: number;
  reachBoost: number;
}

interface GlobalContentInsights {
  bestPerformingPlatform: Platform;
  worstPerformingPlatform: Platform;
  universalBestFormat: ContentFormat;
  crossPlatformTopHashtags: HashtagPerformance[];
  totalPostsAnalyzed: number;
  averageEngagementAllPlatforms: number;
}

interface TunnelPerformanceAnalysis {
  tunnels: TunnelAnalysis[];
  bestTunnel: string;
  worstTunnel: string;
  criticalDropSteps: CriticalDropStep[];
  manyChatAnalysis: ManyChatAnalysis;
  emailAnalysis: EmailAnalysis;
}

interface TunnelAnalysis {
  tunnelId: string;
  tunnelName: string;
  platform: Platform;
  conversionRate: number;
  weeklyChange: number;
  bottleneckStep: TunnelStep;
  revenue: number;
  revenuePerVisitor: number;
}

interface CriticalDropStep {
  tunnelId: string;
  tunnelName: string;
  stepId: string;
  stepName: string;
  dropRate: number;
  lostVisitors: number;
  estimatedRevenueLoss: number;
  recommendation: string;
}

interface ManyChatAnalysis {
  messages: ManyChatMessage[];
  bestMessage: ManyChatMessage;
  worstMessage: ManyChatMessage;
  averageOpenRate: number;
  averageClickRate: number;
  recommendations: string[];
}

interface EmailAnalysis {
  sequences: EmailSequence[];
  bestEmail: EmailSequence;
  worstEmail: EmailSequence;
  averageOpenRate: number;
  averageClickRate: number;
  recommendations: string[];
}

interface AutomaticAdjustments {
  frequencyAdjustments: FrequencyAdjustment[];
  formatPriorities: FormatPriority[];
  scheduleAdjustments: ScheduleAdjustment[];
  newContentAngles: ContentAngle[];
  abTests: ABTest[];
  appliedAt?: string;
  status: "pending" | "applied" | "partial";
}

interface FrequencyAdjustment {
  platform: Platform;
  currentFrequency: number;
  recommendedFrequency: number;
  reason: string;
  expectedImpact: string;
}

interface FormatPriority {
  platform: Platform;
  prioritizedFormats: Array<{
    format: ContentFormat;
    priority: number;
    reason: string;
    allocatedPercentage: number;
  }>;
}

interface ScheduleAdjustment {
  platform: Platform;
  currentSlots: number[];
  recommendedSlots: number[];
  reason: string;
  expectedEngagementBoost: number;
}

interface ContentAngle {
  id: string;
  title: string;
  description: string;
  targetPlatforms: Platform[];
  basedOn: string;
  expectedEngagement: "low" | "medium" | "high" | "very_high";
  priority: number;
}

interface ABTest {
  id: string;
  name: string;
  type: "title" | "hook" | "cta" | "format" | "schedule";
  variantA: ABVariant;
  variantB: ABVariant;
  platform: Platform;
  startDate: string;
  endDate: string;
  status: "planned" | "running" | "completed";
  winner?: "A" | "B" | "inconclusive";
}

interface ABVariant {
  id: string;
  label: string;
  content: string;
  metrics?: {
    impressions: number;
    engagementRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

interface WeeklyReport {
  summary: PlatformSummary[];
  priorityActions: PriorityAction[];
  growthProjection: GrowthProjection;
  vsLastWeek: WeekComparison;
  generatedAt: string;
  reportId: string;
}

interface PlatformSummary {
  platform: Platform;
  totalReach: number;
  totalImpressions: number;
  averageEngagementRate: number;
  newFollowers: number;
  totalPosts: number;
  topContent: string;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

interface PriorityAction {
  priority: 1 | 2 | 3;
  action: string;
  platform: Platform | "all";
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  deadline: string;
  kpi: string;
}

interface GrowthProjection {
  nextMonth: {
    expectedFollowerGrowth: Record<Platform, number>;
    expectedEngagementGrowth: Record<Platform, number>;
    expectedRevenueGrowth: number;
    confidence: number;
  };
  assumptions: string[];
  riskFactors: string[];
}

interface WeekComparison {
  engagementChange: Record<Platform, number>;
  reachChange: Record<Platform, number>;
  followerGrowthChange: Record<Platform, number>;
  conversionRateChange: number;
  revenueChange: number;
  overallScore: number;
  scoreChange: number;
}

type Platform =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "twitter"
  | "facebook";

type ContentFormat = "image" | "video" | "text" | "carousel" | "reel" | "story";

// ============================================================
// SCHEMAS VALIDATION
// ============================================================

const AnalyzeRequestSchema = z.object({
  weekId: z.string().optional(),
  platforms: z
    .array(
      z.enum([
        "instagram",
        "tiktok",
        "linkedin",
        "youtube",
        "twitter",
        "facebook",
      ])
    )
    .optional(),
  includeContentPerformance: z.boolean().default(true),
  includeTunnelPerformance: z.boolean().default(true),
  includeAdjustments: z.boolean().default(true),
  forceReanalysis: z.boolean().default(false),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
});

const ApplyRequestSchema = z.object({
  weekId: z.string(),
  adjustments: z.object({
    applyFrequencyAdjustments: z.boolean().default(true),
    applyFormatPriorities: z.boolean().default(true),
    applyScheduleAdjustments: z.boolean().default(true),
    applyNewContentAngles: z.boolean().default(false),
    launchABTests: z.boolean().default(false),
    platforms: z
      .array(
        z.enum([
          "instagram",
          "tiktok",
          "linkedin",
          "youtube",
          "twitter",
          "facebook",
        ])
      )
      .optional(),
  }),
  dryRun: z.boolean().default(false),
});

// ============================================================
// SERVICES & HELPERS
// ============================================================

class SocialMediaDataService {
  static async fetchPostsData(
    platforms: Platform[],
    dateRange: { start: string; end: string }
  ): Promise<PostPerformance[]> {
    // Simulation données réelles - remplacer par appels API Meta, TikTok, LinkedIn, etc.
    const mockPosts: PostPerformance[] = [];
    const formats: ContentFormat[] = [
      "image",
      "video",
      "carousel",
      "reel",
      "story",
      "text",
    ];

    for (const platform of platforms) {
      for (let i = 0; i < 20; i++) {
        const format = formats[Math.floor(Math.random() * formats.length)];
        const reach = Math.floor(Math.random() * 50000) + 1000;
        const impressions = reach * (1 + Math.random());
        const likes = Math.floor(reach * (Math.random() * 0.1));
        const comments = Math.floor(likes * (Math.random() * 0.2));
        const shares = Math.floor(likes * (Math.random() * 0.15));
        const saves = Math.floor(likes * (Math.random() * 0.3));
        const clicks = Math.floor(reach * (Math.random() * 0.05));
        const engagementRate =
          ((likes + comments + shares + saves) / impressions) * 100;

        mockPosts.push({
          id: `post_${platform}_${i}`,
          platform,
          content: `Contenu éducatif AcadémIA Pro - Post ${i + 1}`,
          format,
          publishedAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          metrics: {
            likes,
            comments,
            shares,
            saves,
            reach,
            impressions: Math.floor(impressions),
            clicks,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
          },
          hashtags: [
            "#éducation",
            "#IA",
            "#apprentissage",
            "#AcadémIA",
            "#formation",
          ].slice(0, Math.floor(Math.random() * 5) + 1),
          publishHour: Math.floor(Math.random() * 24),
        });
      }
    }

    return mockPosts;
  }

  static async fetchTunnelData(): Promise<TunnelPerformance[]> {
    return [
      {
        id: "tunnel_instagram_lead",
        name: "Lead Instagram → Formation",
        platform: "instagram",
        overallConversionRate: 3.2,
        totalVisitors: 1250,
        totalConversions: 40,
        steps: [
          {
            id: "step_1",
            name: "Vue Story/Reel",
            visitors: 1250,
            conversions: 750,
            dropRate: 40,
            conversionRate: 60,
          },
          {
            id: "step_2",
            name: "Clic lien bio",
            visitors: 750,
            conversions: 320,
            dropRate: 57.3,
            conversionRate: 42.7,
          },
          {
            id: "step_3",
            name: "Page landing",
            visitors: 320,
            conversions: 180,
            dropRate: 43.75,
            conversionRate: 56.25,
          },
          {
            id: "step_4",
            name: "Opt-in email",
            visitors: 180,
            conversions: 95,
            dropRate: 47.2,
            conversionRate: 52.8,
          },
          {
            id: "step_5",
            name: "Achat formation",
            visitors: 95,
            conversions: 40,
            dropRate: 57.9,
            conversionRate: 42.1,
          },
        ],
      },
      {
        id: "tunnel_linkedin_b2b",
        name: "LinkedIn B2B → Consultation",
        platform: "linkedin",
        overallConversionRate: 5.8,
        totalVisitors: 890,
        totalConversions: 52,
        steps: [
          {
            id: "step_1",
            name: "Vue article/post",
            visitors: 890,
            conversions: 534,
            dropRate: 40,
            conversionRate: 60,
          },
          {
            id: "step_2",
            name: "Clic CTA",
            visitors: 534,
            conversions: 267,
            dropRate: 50,
            conversionRate: 50,
          },
          {
            id: "step_3",
            name: "Page consultation",
            visitors: 267,
            conversions: 160,
            dropRate: 40.1,
            conversionRate: 59.9,
          },
          {
            id: "step_4",
            name: "Prise RDV",
            visitors: 160,
            conversions: 52,
            dropRate: 67.5,
            conversionRate: 32.5,
          },
        ],
      },
    ];
  