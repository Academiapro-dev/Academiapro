```tsx
// app/formations/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  title: string;
  duration: string;
  description: string;
}

interface Chapter {
  title: string;
  modules: Module[];
}

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface Formation {
  id: string;
  title: string;
  subtitle: string;
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  duration: string;
  totalHours: number;
  category: string;
  description: string;
  objectives: string[];
  prerequisites: string[];
  chapters: Chapter[];
  testimonials: Testimonial[];
  expert: {
    name: string;
    title: string;
    avatar: string;
    bio: string;
    expertise: string[];
    linkedin: string;
  };
  faq: FAQItem[];
  pricing: {
    elearning: number;
    premium: number;
    live: number;
  };
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  lastUpdated: string;
  certificate: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const getFormation = (id: string): Formation => ({
  id,
  title: "Maîtrisez l'Intelligence Artificielle Générative",
  subtitle: "De ChatGPT aux architectures LLM avancées",
  level: "Intermédiaire",
  duration: "8 semaines",
  totalHours: 40,
  category: "Intelligence Artificielle",
  description:
    "Une formation complète et immersive pour comprendre, utiliser et déployer les modèles d'IA générative dans vos projets professionnels. Du prompt engineering aux fine-tunings avancés, maîtrisez les outils qui redéfinissent l'avenir du travail.",
  objectives: [
    "Comprendre le fonctionnement des LLM et transformers",
    "Maîtriser le prompt engineering avancé",
    "Intégrer des APIs IA dans des applications réelles",
    "Déployer des agents IA autonomes",
    "Évaluer et optimiser les performances des modèles",
    "Respecter les enjeux éthiques et réglementaires",
  ],
  prerequisites: [
    "Bases en programmation Python",
    "Notions de machine learning",
    "Curiosité technologique",
  ],
  chapters: [
    {
      title: "Fondamentaux de l'IA Générative",
      modules: [
        {
          title: "Histoire et évolution des LLM",
          duration: "45 min",
          description:
            "Des premiers RNN aux transformers modernes, comprenez la révolution en cours.",
        },
        {
          title: "Architecture Transformer en profondeur",
          duration: "1h30",
          description:
            "Mécanismes d'attention, encodeurs, décodeurs – décryptage complet.",
        },
        {
          title: "Écosystème des modèles 2024",
          duration: "1h",
          description:
            "GPT-4, Claude, Gemini, Mistral, Llama – comparatif et cas d'usage.",
        },
      ],
    },
    {
      title: "Prompt Engineering Avancé",
      modules: [
        {
          title: "Anatomie d'un prompt efficace",
          duration: "1h",
          description:
            "Structure, contexte, contraintes – les 7 composantes d'un prompt parfait.",
        },
        {
          title: "Techniques Chain-of-Thought & Few-Shot",
          duration: "1h30",
          description: "Raisonnement pas à pas et apprentissage par exemples.",
        },
        {
          title: "Prompt injection et sécurité",
          duration: "45 min",
          description: "Risques, attaques courantes et stratégies de défense.",
        },
      ],
    },
    {
      title: "Intégration API & Développement",
      modules: [
        {
          title: "OpenAI API masterclass",
          duration: "2h",
          description:
            "Completions, embeddings, function calling – tout en pratique.",
        },
        {
          title: "LangChain & orchestration d'agents",
          duration: "2h30",
          description:
            "Construire des pipelines IA complexes avec mémoire et outils.",
        },
        {
          title: "RAG : Retrieval Augmented Generation",
          duration: "2h",
          description:
            "Connecter vos LLM à vos données propriétaires en temps réel.",
        },
      ],
    },
    {
      title: "Déploiement & Production",
      modules: [
        {
          title: "Fine-tuning et personnalisation",
          duration: "2h",
          description: "Adapter les modèles à votre domaine métier spécifique.",
        },
        {
          title: "Optimisation des coûts et performances",
          duration: "1h30",
          description: "Caching, batching, choix du modèle – réduire les coûts de 80%.",
        },
        {
          title: "Monitoring et observabilité IA",
          duration: "1h",
          description:
            "LangSmith, Helicone – tracer et évaluer vos applications en prod.",
        },
      ],
    },
    {
      title: "Cas d'Usage Métiers & Éthique",
      modules: [
        {
          title: "IA pour le marketing et le contenu",
          duration: "1h30",
          description: "Automatisation créative, personnalisation à grande échelle.",
        },
        {
          title: "IA pour la data et l'analyse",
          duration: "1h30",
          description: "Text-to-SQL, analyse de documents, extraction d'informations.",
        },
        {
          title: "Éthique, biais et régulation EU AI Act",
          duration: "1h",
          description:
            "Responsabilité, transparence et conformité réglementaire.",
        },
      ],
    },
  ],
  testimonials: [
    {
      name: "Camille Rousseau",
      role: "Product Manager @ Thales",
      avatar: "CR",
      rating: 5,
      comment:
        "Formation exceptionnelle. En 8 semaines, j'ai pu déployer mon premier agent IA en production. Le niveau premium avec l'IA 24/7 a été un game-changer – j'ai pu poser mes questions à 23h avant mes présentations.",
      date: "Mars 2024",
    },
    {
      name: "Thomas Delacour",
      role: "CTO @ Startup FinTech",
      avatar: "TD",
      rating: 5,
      comment:
        "Le contenu est d'une densité rare. Chaque module est actionnable immédiatement. J'ai intégré le RAG dans notre application en suivant exactement les exercices du chapitre 3. ROI immédiat.",
      date: "Février 2024",
    },
    {
      name: "Sophie Martin",
      role: "Data Scientist @ BNP Paribas",
      avatar: "SM",
      rating: 5,
      comment:
        "Le Live Avatar IA vaut vraiment l'investissement. La qualité des sessions en temps réel surpasse largement ce que j'avais eu dans d'autres formations. L'expert attitré connaît vraiment son sujet.",
      date: "Avril 2024",
    },
    {
      name: "Alexandre Fontaine",
      role: "Consultant IA indépendant",
      avatar: "AF",
      rating: 4,
      comment:
        "Contenu très solide, particulièrement la partie LangChain et agents. Quelques modules auraient mérité plus d'exemples concrets mais globalement une des meilleures formations IA du marché.",
      date: "Mars 2024",
    },
  ],
  expert: {
    name: "Dr. Isabelle Mercier",
    title: "Lead AI Researcher & Formatrice Senior",
    avatar: "IM",
    bio: "Docteure en Machine Learning de l'École Polytechnique, Isabelle a passé 12 ans chez Google DeepMind avant de rejoindre AcadémIA Pro. Elle a co-signé 23 publications sur les LLM et accompagne aujourd'hui les organisations dans leur transformation IA. Ses formations ont formé plus de 4 000 professionnels depuis 2022.",
    expertise: [
      "Large Language Models",
      "Reinforcement Learning",
      "AI Ethics",
      "MLOps",
      "NLP",
    ],
    linkedin: "https://linkedin.com",
  },
  faq: [
    {
      question: "Quelle est la durée d'accès à la formation ?",
      answer:
        "L'accès est illimité dans le temps pour tous les niveaux. Vous pouvez suivre la formation à votre rythme et y revenir autant de fois que nécessaire. Les mises à jour de contenu sont incluses gratuitement.",
    },
    {
      question: "Quelle est la différence entre Premium Agent IA et Live Avatar IA ?",
      answer:
        "Le niveau Premium inclut un agent IA disponible 24/7 pour répondre à vos questions sur le contenu de la formation, corriger vos exercices et vous débloquer à tout moment. Le niveau Live Avatar IA ajoute des sessions en direct avec un avatar IA ultra-réaliste animé par notre expert, ainsi que des ateliers de groupe hebdomadaires.",
    },
    {
      question: "Un certificat est-il délivré à la fin ?",
      answer:
        "Oui, un certificat de complétion AcadémIA Pro est délivré après validation de tous les modules et exercices pratiques. Ce certificat est reconnu par plus de 200 entreprises partenaires. Il est partageable sur LinkedIn via un lien de vérification.",
    },
    {
      question: "Y a-t-il des prérequis techniques stricts ?",
      answer:
        "Des bases en Python sont recommandées pour les chapitres de développement. Cependant, nous fournissons un module de remise à niveau Python accessible dès l'inscription. Les parties conceptuelles et métiers sont accessibles sans prérequis techniques.",
    },
    {
      question: "Puis-je passer d'un niveau à l'autre en cours de formation ?",
      answer:
        "Oui, vous pouvez upgrader votre niveau à tout moment en payant uniquement la différence de tarif. Les downgrades ne sont pas possibles mais vous conservez les avantages déjà utilisés.",
    },
    {
      question: "La formation est-elle éligible au CPF ou aux financements OPCO ?",
      answer:
        "La formation est éligible aux financements OPCO via demande de prise en charge employeur. Un dossier CPF est en cours de validation (Q3 2024). Contactez notre équipe