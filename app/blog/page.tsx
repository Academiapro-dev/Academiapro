```tsx
// app/blog/page.tsx
import type { Metadata } from 'next'
import BlogPageClient from './BlogPageClient'

export const metadata: Metadata = {
  title: 'Blog AcadémIA Pro | IA, No-Code, Marketing & Formation',
  description:
    'Découvrez nos articles experts sur l\'IA avec Claude, le No-Code, le Marketing Digital, le Bien-être et les Formations. Restez à la pointe de l\'innovation.',
  openGraph: {
    title: 'Blog AcadémIA Pro | IA, No-Code, Marketing & Formation',
    description:
      'Découvrez nos articles experts sur l\'IA avec Claude, le No-Code, le Marketing Digital, le Bien-être et les Formations.',
    type: 'website',
    url: 'https://academia-pro.fr/blog',
    images: [
      {
        url: 'https://academia-pro.fr/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog AcadémIA Pro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog AcadémIA Pro',
    description: 'Articles experts sur l\'IA, No-Code, Marketing et Formation',
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}
```

```tsx
// app/blog/BlogPageClient.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import Script from 'next/script'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category =
  | 'IA et Claude'
  | 'No-Code'
  | 'Marketing'
  | 'Bien-être'
  | 'Langues'
  | 'Formations'

interface Article {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readTime: string
  category: Category
  image: string
  author: string
  authorAvatar: string
  featured?: boolean
  metaTitle: string
  metaDescription: string
  tags: string[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  {
    id: 1,
    slug: '10-prompts-claude-comptabilite',
    title: '10 Prompts Claude pour automatiser sa comptabilité',
    excerpt:
      'Découvrez comment Claude peut transformer votre gestion comptable avec des prompts précis et efficaces. Gain de temps garanti pour les entrepreneurs et freelances.',
    content: '',
    date: '2026-01-15',
    readTime: '8 min',
    category: 'IA et Claude',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    author: 'Sophie Martin',
    authorAvatar: 'https://i.pravatar.cc/40?img=1',
    featured: true,
    metaTitle: '10 Prompts Claude pour automatiser sa comptabilité | AcadémIA Pro',
    metaDescription:
      'Utilisez ces 10 prompts Claude pour automatiser vos tâches comptables, réduire les erreurs et gagner des heures chaque semaine.',
    tags: ['Claude', 'comptabilité', 'automatisation', 'prompts'],
  },
  {
    id: 2,
    slug: 'creer-chatbot-24h-sans-coder',
    title: 'Comment créer un chatbot en 24h sans coder',
    excerpt:
      'Guide pas-à-pas pour construire votre premier chatbot fonctionnel sans une ligne de code. Les meilleurs outils no-code pour débutants en 2026.',
    content: '',
    date: '2026-01-10',
    readTime: '12 min',
    category: 'No-Code',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80',
    author: 'Marc Dubois',
    authorAvatar: 'https://i.pravatar.cc/40?img=2',
    featured: false,
    metaTitle: 'Créer un chatbot en 24h sans coder | AcadémIA Pro',
    metaDescription:
      'Suivez notre guide complet pour créer votre chatbot en moins de 24h, sans aucune compétence en programmation.',
    tags: ['chatbot', 'no-code', 'automatisation', 'débutant'],
  },
  {
    id: 3,
    slug: '5-meilleurs-outils-ia-marketing-2026',
    title: 'Les 5 meilleurs outils IA pour le marketing en 2026',
    excerpt:
      'Analyse comparative des outils IA incontournables pour booster vos campagnes marketing : génération de contenu, analyse prédictive et personnalisation.',
    content: '',
    date: '2026-01-08',
    readTime: '10 min',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    author: 'Julie Rousseau',
    authorAvatar: 'https://i.pravatar.cc/40?img=3',
    featured: false,
    metaTitle: '5 Meilleurs Outils IA Marketing 2026 | AcadémIA Pro',
    metaDescription:
      'Découvrez les 5 outils IA qui révolutionnent le marketing digital en 2026 : fonctionnalités, prix et cas d\'usage concrets.',
    tags: ['marketing', 'IA', 'outils', '2026'],
  },
  {
    id: 4,
    slug: 'sophrologie-ia-gerer-stress',
    title: 'Sophrologie et IA : la combinaison gagnante pour gérer le stress',
    excerpt:
      'Comment l\'intelligence artificielle peut amplifier les bienfaits de la sophrologie pour une gestion du stress plus efficace et personnalisée.',
    content: '',
    date: '2026-01-05',
    readTime: '7 min',
    category: 'Bien-être',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    author: 'Camille Bernard',
    authorAvatar: 'https://i.pravatar.cc/40?img=4',
    featured: false,
    metaTitle: 'Sophrologie et IA pour gérer le stress | AcadémIA Pro',
    metaDescription:
      'Explorez comment combiner sophrologie et intelligence artificielle pour une gestion du stress révolutionnaire et personnalisée.',
    tags: ['sophrologie', 'bien-être', 'stress', 'IA'],
  },
  {
    id: 5,
    slug: 'apprendre-anglais-claude-methode-complete',
    title: 'Apprendre l\'anglais avec Claude : méthode complète',
    excerpt:
      'Une méthode structurée et éprouvée pour maîtriser l\'anglais grâce à Claude. Des exercices, des conversations simulées et un suivi personnalisé.',
    content: '',
    date: '2026-01-02',
    readTime: '15 min',
    category: 'Langues',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    author: 'Thomas Leroy',
    authorAvatar: 'https://i.pravatar.cc/40?img=5',
    featured: false,
    metaTitle: 'Apprendre l\'anglais avec Claude - Méthode Complète | AcadémIA Pro',
    metaDescription:
      'Maîtrisez l\'anglais avec notre méthode complète utilisant Claude AI : conversations, exercices et progression personnalisée.',
    tags: ['anglais', 'langues', 'Claude', 'apprentissage'],
  },
  {
    id: 6,
    slug: 'formation-ia-pour-entreprises',
    title: 'Former ses équipes à l\'IA : le guide complet 2026',
    excerpt:
      'Tout ce que vous devez savoir pour déployer une formation IA efficace dans votre entreprise. Méthodes, outils et retours d\'expérience.',
    content: '',
    date: '2025-12-28',
    readTime: '11 min',
    category: 'Formations',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    author: 'Sophie Martin',
    authorAvatar: 'https://i.pravatar.cc/40?img=1',
    featured: false,
    metaTitle: 'Former ses équipes à l\'IA - Guide 2026 | AcadémIA Pro',
    metaDescription:
      'Guide complet pour former vos équipes à l\'IA en 2026 : stratégies, programmes et mesure des résultats.',
    tags: ['formation', 'entreprise', 'IA', 'équipes'],
  },
  {
    id: 7,
    slug: 'automatiser-reseaux-sociaux-ia',
    title: 'Automatiser ses réseaux sociaux avec l\'IA en 2026',
    excerpt:
      'Stratégies et outils pour automatiser votre présence sur les réseaux sociaux sans perdre en authenticité grâce à l\'intelligence artificielle.',
    content: '',
    date: '2025-12-20',
    readTime: '9 min',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    author: 'Julie Rousseau',
    authorAvatar: 'https://i.pravatar.cc/40?img=3',
    featured: false,
    metaTitle: 'Automatiser Réseaux Sociaux avec IA | AcadémIA Pro',
    metaDescription:
      'Apprenez à automatiser votre stratégie social media avec l\'IA tout en préservant l\'authenticité de votre marque.',
    tags: ['réseaux sociaux', 'automatisation', 'marketing', 'IA'],
  },
  {
    id: 8,
    slug: 'no-code-outils-entrepreneurs',
    title: 'Top 10 outils No-Code pour entrepreneurs en 2026',
    excerpt:
      'Sélection des meilleurs outils no-code pour créer votre MVP, automatiser vos processus et développer votre activité sans développeur.',
    content: '',
    date: '2025-12-15',
    readTime: '13 min',
    category: 'No-Code',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    author: 'Marc Dubois',
    authorAvatar: 'https://i.pravatar.cc/40?img=2',
    featured: false,
    metaTitle: 'Top 10 Outils No-Code Entrepreneurs 2026 | AcadémIA Pro',
    metaDescription:
      'Les 10 outils no-code essentiels pour les entrepreneurs en 2026 : Bubble, Webflow, Make et bien d\'autres.',
    tags: ['no-code', 'entrepreneurs', 'outils', 'MVP'],
  },
]

const CATEGORIES: Category[] = [
  'IA et Claude',
  'No-Code',
  'Marketing',
  'Bien-être',
  'Langues',
  'Formations',
]

const CATEGORY_COLORS: Record<Category, string> = {
  'IA et Claude': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'No-Code': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Marketing': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Bien-être': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Langues': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Formations': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

const CATEGORY_ICONS: Record<Category, string> = {
  'IA et Claude': '🤖',
  'No-Code': '🧩',
  'Marketing': '📈',
  'Bien-être': '🌿',
  'Langues': '🌍',
  'Formations': '🎓',
}

const ARTICLES_PER_PAGE = 6

// ─── Schema.org Helper ───────────────────────────────────────────────────────

function generateArticleSchema(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: article.date,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AcadémIA Pro',
      logo: {
        '@type': 'ImageObject',
        url: 'https://academia-pro.fr/logo.png',
      },
    },
    url: `https://academia-pro.fr/blog/${article.slug}`,
    keywords: article.tags.join(', '),
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CategoryBadge({ category, small = false }: { category: Category; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-medium
        ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}
        ${CATEGORY_COLORS[category]}`}
    >
      <span>{CATEGORY_ICONS[category]}</span>
      {category}
    </span>
  )
}

function FeaturedArticle({ article }: { article: Article }) {
  return (
    <article
      className="relative group rounded-2xl overflow-hidden border border-[#c8a96e]/20 
        bg-gradient-to-br from-[#0d0d14] to-[#050508] cursor-pointer
        hover:border-[#c8a96e]/40 transition-all duration-500"
    >
      <div className="grid lg:grid-cols-2 min-h-[420px]">
        {/* Image */}
        <div className="relative overflow-hidden">
          <div
            