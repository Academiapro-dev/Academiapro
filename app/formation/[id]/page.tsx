```tsx
// app/formations/[id]/page.tsx
import type { Metadata } from 'next'
import FormationPageClient from './FormationPageClient'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Formation ${params.id} | AcadémIA Pro`,
    description: 'Découvrez notre formation premium avec accompagnement IA personnalisé',
  }
}

export default function FormationPage({ params }: Props) {
  return <FormationPageClient id={params.id} />
}
```

```tsx
// app/formations/[id]/FormationPageClient.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: number
  title: string
  duration: string
  description: string
}

interface Chapter {
  id: number
  title: string
  modules: Module[]
}

interface Testimonial {
  id: number
  name: string
  role: string
  avatar: string
  rating: number
  comment: string
  level: string
  date: string
}

interface FAQ {
  id: number
  question: string
  answer: string
}

interface Expert {
  name: string
  title: string
  avatar: string
  bio: string
  specialties: string[]
  experience: string
  linkedin: string
}

interface Formation {
  id: string
  title: string
  subtitle: string
  level: string
  duration: string
  students: number
  rating: number
  category: string
  tags: string[]
  description: string
  objectives: string[]
  prerequisites: string[]
  chapters: Chapter[]
  testimonials: Testimonial[]
  expert: Expert
  faq: FAQ[]
}

interface PricingPlan {
  id: string
  name: string
  icon: string
  badge?: string
  price: number
  priceMonthly?: number
  features: string[]
  highlighted: boolean
  color: string
}

// ─── Mock Data Factory ────────────────────────────────────────────────────────

function getFormationData(id: string): Formation {
  return {
    id,
    title: 'Maîtrisez l\'Intelligence Artificielle Générative',
    subtitle: 'De GPT-4 aux agents autonomes – devenez un expert IA en 12 semaines',
    level: 'Intermédiaire',
    duration: '12 semaines · 48h de contenu',
    students: 2847,
    rating: 4.9,
    category: 'Intelligence Artificielle',
    tags: ['IA Générative', 'LLM', 'Prompt Engineering', 'Agents IA', 'Python'],
    description:
      'Plongez au cœur de la révolution IA avec cette formation complète conçue par des experts de l\'industrie. Vous apprendrez à exploiter les modèles de langage les plus avancés, à créer des agents autonomes et à intégrer l\'IA dans vos workflows professionnels.',
    objectives: [
      'Maîtriser les fondamentaux des LLM et transformers',
      'Créer des prompts avancés et des chaînes de raisonnement',
      'Développer des agents IA autonomes avec LangChain',
      'Intégrer l\'IA dans des applications production',
      'Optimiser les coûts et performances des modèles',
      'Déployer des solutions IA éthiques et robustes',
    ],
    prerequisites: [
      'Bases en programmation Python',
      'Notions de machine learning (optionnel)',
      'Curiosité et motivation pour l\'apprentissage',
    ],
    chapters: [
      {
        id: 1,
        title: 'Fondamentaux de l\'IA Générative',
        modules: [
          { id: 1, title: 'Histoire et évolution des LLM', duration: '45 min', description: 'De GPT-1 à GPT-4 : comprendre l\'évolution des modèles de langage et leurs capacités.' },
          { id: 2, title: 'Architecture Transformer expliquée', duration: '1h 20 min', description: 'Plongée technique dans l\'architecture qui a révolutionné l\'IA moderne.' },
          { id: 3, title: 'Écosystème des modèles IA', duration: '55 min', description: 'Panorama complet : OpenAI, Anthropic, Mistral, Llama et les open-source.' },
          { id: 4, title: 'Premiers pas avec l\'API OpenAI', duration: '1h 10 min', description: 'Configuration, premiers appels et exploration des endpoints disponibles.' },
        ],
      },
      {
        id: 2,
        title: 'Prompt Engineering Avancé',
        modules: [
          { id: 5, title: 'Anatomie d\'un prompt parfait', duration: '50 min', description: 'Déconstruction des éléments clés d\'un prompt efficace et reproductible.' },
          { id: 6, title: 'Techniques Few-Shot et Chain-of-Thought', duration: '1h 30 min', description: 'Méthodes avancées pour guider le raisonnement des modèles.' },
          { id: 7, title: 'Prompt Templates et Variables', duration: '45 min', description: 'Création de templates réutilisables pour des workflows scalables.' },
          { id: 8, title: 'Évaluation et itération de prompts', duration: '1h', description: 'Méthodologies pour mesurer et améliorer la qualité des outputs.' },
        ],
      },
      {
        id: 3,
        title: 'Agents IA et Automatisation',
        modules: [
          { id: 9, title: 'Introduction à LangChain', duration: '1h 40 min', description: 'Framework principal pour la création d\'applications LLM complexes.' },
          { id: 10, title: 'Création d\'agents autonomes', duration: '2h', description: 'Agents ReAct, AutoGPT-style et architectures multi-agents.' },
          { id: 11, title: 'Intégration d\'outils externes', duration: '1h 15 min', description: 'APIs, bases de données, web scraping et file management.' },
          { id: 12, title: 'Mémoire et contexte persistant', duration: '1h', description: 'Systèmes de mémoire courte et longue durée pour agents intelligents.' },
        ],
      },
      {
        id: 4,
        title: 'RAG & Bases de Données Vectorielles',
        modules: [
          { id: 13, title: 'Retrieval Augmented Generation', duration: '1h 30 min', description: 'Principe du RAG et pourquoi il révolutionne les applications IA.' },
          { id: 14, title: 'Embeddings et similarité sémantique', duration: '55 min', description: 'Comprendre et utiliser les représentations vectorielles du langage.' },
          { id: 15, title: 'Pinecone, Weaviate, Chroma', duration: '1h 20 min', description: 'Comparatif et mise en œuvre des principales bases vectorielles.' },
          { id: 16, title: 'Projet : Chatbot sur documents', duration: '2h 30 min', description: 'Construction complète d\'un assistant IA intelligent sur vos données.' },
        ],
      },
      {
        id: 5,
        title: 'Déploiement et Production',
        modules: [
          { id: 17, title: 'Fine-tuning et PEFT', duration: '2h', description: 'Adapter les modèles à vos besoins spécifiques avec LoRA et QLoRA.' },
          { id: 18, title: 'Optimisation des coûts', duration: '45 min', description: 'Stratégies de caching, compression et sélection de modèles.' },
          { id: 19, title: 'Monitoring et observabilité', duration: '1h', description: 'LangSmith, Langfuse et outils de suivi en production.' },
          { id: 20, title: 'IA Éthique et sécurité', duration: '1h 10 min', description: 'Guardrails, modération et bonnes pratiques responsables.' },
        ],
      },
    ],
    testimonials: [
      {
        id: 1,
        name: 'Sophie Marchand',
        role: 'Data Scientist chez BNP Paribas',
        avatar: 'SM',
        rating: 5,
        comment: 'Absolument transformateur. J\'ai intégré des agents IA dans nos processus métier dès la fin de la formation. Le niveau Premium avec l\'agent 24/7 m\'a permis de progresser à mon propre rythme sans jamais me sentir bloquée.',
        level: 'Premium Agent IA',
        date: 'Novembre 2024',
      },
      {
        id: 2,
        name: 'Thomas Dubois',
        role: 'Développeur Full-Stack Freelance',
        avatar: 'TD',
        rating: 5,
        comment: 'Le Live Avatar IA, c\'est une expérience unique. Avoir un tuteur disponible à 3h du matin quand j\'étais en plein débogage... ça change tout. J\'ai lancé ma première SaaS IA deux mois après la formation.',
        level: 'Live Avatar IA',
        date: 'Octobre 2024',
      },
      {
        id: 3,
        name: 'Aïcha Konaté',
        role: 'Responsable Innovation, Société Générale',
        avatar: 'AK',
        rating: 5,
        comment: 'La qualité du contenu est exceptionnelle. J\'ai commencé avec l\'e-learning et upgradé après 2 semaines tellement j\'étais accro. Maintenant je forme mes équipes sur les méthodes apprises ici.',
        level: 'E-Learning Premium',
        date: 'Décembre 2024',
      },
      {
        id: 4,
        name: 'Pierre-Louis Favre',
        role: 'CTO, Startup HealthTech',
        avatar: 'PF',
        rating: 5,
        comment: 'Excellent rapport qualité-prix surtout pour le niveau intermédiaire. Les projets pratiques sont directement applicables en entreprise. Notre produit utilise désormais du RAG et nos métriques ont explosé.',
        level: 'Premium Agent IA',
        date: 'Janvier 2025',
      },
    ],
    expert: {
      name: 'Dr. Alexandre Fontaine',
      title: 'Expert IA & Architecte LLM',
      avatar: 'AF',
      bio: 'Docteur en Machine Learning (INRIA), ex-chercheur chez DeepMind, fondateur de 2 startups IA. Alexandre a formé plus de 15 000 professionnels en Europe et accompagné 50+ entreprises dans leur transformation IA. Il cumule 12 ans d\'expérience au cœur de l\'IA générative.',
      specialties