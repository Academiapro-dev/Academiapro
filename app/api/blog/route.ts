# API Route Next.js 14 - Blog SEO Automatique AcadémIA Pro

## Structure des fichiers

```
app/api/blog/
├── generer/route.ts
├── articles/route.ts
├── article/[slug]/route.ts
├── publier/route.ts
├── sitemap/route.ts
└── _lib/
    ├── claude.ts
    ├── supabase.ts
    ├── seo.ts
    ├── social.ts
    ├── scheduler.ts
    └── types.ts
```

---

## Types — `app/api/blog/_lib/types.ts`

```typescript
export type Domaine =
  | "ia"
  | "no-code"
  | "marketing"
  | "bien-etre"
  | "langues"
  | "management"
  | "comptabilite";

export interface Article {
  id: string;
  titre: string;
  slug: string;
  meta_description: string;
  contenu_markdown: string;
  contenu_html: string;
  domaine: Domaine;
  mots_cles: string[];
  formation_liee_id: string;
  formation_liee_url: string;
  formation_liee_titre: string;
  statut: "brouillon" | "planifie" | "publie" | "archive";
  date_creation: string;
  date_publication: string | null;
  date_planifiee: string | null;
  auteur: string;
  image_couverture: string | null;
  temps_lecture: number;
  nb_mots: number;
  score_seo: number;
  partage_twitter: boolean;
  partage_linkedin: boolean;
  partage_facebook: boolean;
  vues: number;
}

export interface GenerationRequest {
  domaine: Domaine;
  sujet?: string;
  mots_cles_cibles?: string[];
  formation_id?: string;
  publier_immediat?: boolean;
  date_planifiee?: string;
}

export interface GenerationResponse {
  success: boolean;
  article?: Article;
  erreur?: string;
  tokens_utilises?: number;
}

export interface SujetGenere {
  titre: string;
  angle: string;
  mots_cles: string[];
  intention_recherche: string;
}

export interface Formation {
  id: string;
  titre: string;
  slug: string;
  domaine: Domaine;
  description_courte: string;
  prix: number;
  url: string;
}
```

---

## Supabase Client — `app/api/blog/_lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Article, Formation } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client server-side avec clé service (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── Articles ────────────────────────────────────────────────────────────────

export async function sauvegarderArticle(
  article: Omit<Article, "id" | "vues">
): Promise<Article> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      ...article,
      vues: 0,
      date_creation: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase insert: ${error.message}`);
  return data as Article;
}

export async function mettreAJourArticle(
  id: string,
  updates: Partial<Article>
): Promise<Article> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Supabase update: ${error.message}`);
  return data as Article;
}

export async function recupererArticles(params: {
  statut?: Article["statut"];
  domaine?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: Article[]; total: number }> {
  let query = supabaseAdmin
    .from("articles")
    .select("*", { count: "exact" })
    .order("date_creation", { ascending: false });

  if (params.statut) query = query.eq("statut", params.statut);
  if (params.domaine) query = query.eq("domaine", params.domaine);
  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(
    params.offset,
    params.offset + (params.limit ?? 10) - 1
  );

  const { data, error, count } = await query;
  if (error) throw new Error(`Supabase select: ${error.message}`);

  return { articles: (data as Article[]) ?? [], total: count ?? 0 };
}

export async function recupererArticleParSlug(
  slug: string
): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Supabase select slug: ${error.message}`);
  }
  return data as Article | null;
}

export async function recupererArticlesPlanifies(): Promise<Article[]> {
  const maintenant = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("statut", "planifie")
    .lte("date_planifiee", maintenant);

  if (error) throw new Error(`Supabase planifies: ${error.message}`);
  return (data as Article[]) ?? [];
}

export async function recupererTousArticlesPublies(): Promise<
  Pick<Article, "slug" | "domaine" | "date_publication" | "date_creation">[]
> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("slug, domaine, date_publication, date_creation")
    .eq("statut", "publie")
    .order("date_publication", { ascending: false });

  if (error) throw new Error(`Supabase sitemap: ${error.message}`);
  return data ?? [];
}

// ─── Formations ──────────────────────────────────────────────────────────────

export async function recupererFormationParDomaine(
  domaine: string
): Promise<Formation | null> {
  const { data, error } = await supabaseAdmin
    .from("formations")
    .select("*")
    .eq("domaine", domaine)
    .eq("active", true)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") return null;
  return data as Formation | null;
}

export async function recupererFormationParId(
  id: string
): Promise<Formation | null> {
  const { data } = await supabaseAdmin
    .from("formations")
    .select("*")
    .eq("id", id)
    .single();
  return data as Formation | null;
}

// ─── Statistiques ────────────────────────────────────────────────────────────

export async function incrementerVues(slug: string): Promise<void> {
  await supabaseAdmin.rpc("incrementer_vues_article", { article_slug: slug });
}
```

---

## Claude Integration — `app/api/blog/_lib/claude.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { Domaine, SujetGenere } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Configuration par domaine ───────────────────────────────────────────────

const DOMAINES_CONFIG: Record<
  Domaine,
  {
    label: string;
    audience: string;
    ton: string;
    sujets_exemples: string[];
    vocabulaire_cle: string[];
  }
> = {
  ia: {
    label: "Intelligence Artificielle",
    audience: "professionnels et entrepreneurs",
    ton: "expert, accessible, innovant",
    sujets_exemples: [
      "ChatGPT pour automatiser votre travail quotidien",
      "Les meilleurs outils IA gratuits en 2024",
      "Comment l'IA transforme les métiers du marketing",
      "Prompt engineering : guide complet débutant",
      "IA générative vs IA traditionnelle : différences clés",
    ],
    vocabulaire_cle: [
      "intelligence artificielle",
      "IA générative",
      "machine learning",
      "automatisation",
      "ChatGPT",
      "LLM",
      "prompt",
    ],
  },
  "no-code": {
    label: "No-Code & Low-Code",
    audience: "entrepreneurs et créateurs sans compétences techniques",
    ton: "pratique, encourageant, concret",
    sujets_exemples: [
      "Créer une app mobile sans coder en 2024",
      "Bubble vs Webflow : quel outil choisir",
      "Automatiser son business avec Make et Zapier",
      "No-code pour freelances : lancez votre SaaS",
      "Les limites du no-code et comment les dépasser",
    ],
    vocabulaire_cle: [
      "no-code",
      "low-code",
      "sans programmer",
      "application web",
      "automatisation",
      "workflow",
      "intégration",
    ],
  },
  marketing: {
    label: "Marketing Digital",
    audience: "marketeurs et chefs d'entreprise",
    ton: "stratégique, data-driven, actionnable",
    sujets_exemples: [
      "SEO 2024 : les changements Google à connaître",
      "Email marketing : taux d'ouverture au-dessus de 40%",
      "Stratégie réseaux sociaux B2B efficace",
      "Google Ads vs Meta Ads : où investir son budget",
      "Content marketing : créer un blog qui génère des leads",
    ],
    vocabulaire_cle: [
      "marketing digital",
      "SEO",
      "conversion",
      "ROI",
      "funnel",
      "leads",
      "inbound marketing",
    ],
  },
  "bien-etre": {
    label: "Bien-être & Développement Personnel",
    audience: "adultes en quête d'équilibre et d'épanouissement",
    ton: "bienveillant, inspirant, scientifiquement fondé",
    sujets_exemples: [
      "Méditation : 10 minutes par jour pour réduire le stress",
      "Burn-out : les signes précoces et comment les éviter",
      "Développer sa résilience émotionnelle au travail",
      "Alimentation et productivité : ce que dit la science",
      "Sommeil et performance : optimiser sa récupération",
    ],
    vocabulaire_cle: [
      "bien-être",
      "développement personnel",
      "mindfulness",
      "équilibre vie pro-perso",
      "gestion du stress",
      "pleine conscience",
    ],
  },
  langues: {
    label: "Apprentissage des Langues",
    audience: "adultes souhaitant apprendre ou améliorer une langue",
    ton: "motivant, méthodique, culturellement enrichissant",
    sujets_exemples: [
      "Apprendre l'anglais en 6 mois : méthode prouvée",
      "Les meilleures apps pour apprendre l'espagnol",
      "Parler couramment une langue : les 5 habitudes clés",
      "Immersion linguistique à domicile : comment faire",
      "Business English : vocabulaire essentiel pour réussir",
    ],
    vocabulaire_cle: [
      "apprentissage des langues",
      "parler couramment",
      "méthode naturelle",
      "vocabulaire",
      "grammaire",
      "immersion",
    ],
  },
  management: {
    label: "Management & Leadership",
    audience: "managers, dirigeants et futurs leaders",
    ton: "autoritatif, inspirant, basé sur l'expérience terrain",
    sujets_exemples: [
      "Management bienveillant : mythe ou réalité efficace",
      "Donner du feedback constructif : techniques avancées",
      "Gérer une équipe remote en 2024",
      "Intelligence émotionnelle en leadership : guide pratique",
      "Délégation efficace : les 5 étapes incontournables",
    ],
    vocabulaire_cle: [
      "management",
      "leadership",
      "équipe",
      "performance",
      "motivation",
      "délégation",
      "feedback",
    ],
  },
  comptabilite: {
    label: "Comptabilité & Finance",
    audience: "entrepreneurs, indépendants et professionnels",
    ton: "rigoureux, pédagogique, démystificateur",
    sujets_exemples: [
      "Comptabilité pour auto-entrepreneur : guide complet",
      "TVA : comprendre et éviter les erreurs courantes",
      "Optimisation fiscale légale pour PME en France",
      "Bilan comptable : comment le lire et l'analyser",
      "Trésorerie d'entreprise : les fondamentaux indispensables",
    ],
    vocabulaire_cle: [
      "comptabilité",
      "fiscalité",
      "bilan",
      "trésorerie",
      "TVA",
      "charges",
      "optimisation fiscale",
    ],
  },
};

// ─── Génération du sujet ──────────────────────────────────────────────────────

export async function genererSujet(
  domaine: Domaine,
  sujets_existants: string[] = []
): Promise<SujetGenere> {
  const config = DOMAINES_CONFIG[domaine];

  const prompt = `Tu es un expert SEO et content strategist pour AcadémIA Pro, une plateforme de formation en ligne française.

Génère UN sujet d'article de blog pour le domaine "${config.label}".

Audience cible : ${config.audience}
Ton éditorial : ${config.ton}

Sujets déjà traités à éviter :
${sujets_existants.slice(0, 10).join("\n")}

Critères du sujet :
- Volume de recherche mensuel potentiel > 500
- Intention de recherche informationnelle ou commerciale
- Pas encore traité dans la liste ci-dessus
- Pertinent pour des formations en ligne
- Adapté au marché francophone

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "titre":