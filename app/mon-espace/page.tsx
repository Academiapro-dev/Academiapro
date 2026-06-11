// app/espace-personnel/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  BookOpen, Calendar, Bot, Award, User, CreditCard,
  ChevronRight, Download, Share2, QrCode, Bell,
  TrendingUp, Clock, CheckCircle, Play, Star,
  MessageSquare, Target, Zap, Shield, RefreshCw,
  LogOut, Settings, Menu, X, ArrowRight, BarChart2,
  FileText, Linkedin, Lock, Unlock, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, Badge
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Formation {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'paused';
  instructor: string;
  total_lessons: number;
  completed_lessons: number;
  certificate_url?: string;
  thumbnail: string;
  category: string;
  duration_hours: number;
  last_accessed?: string;
}

interface Session {
  id: string;
  title: string;
  date: string;
  duration_minutes: number;
  instructor: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  summary?: string;
  meeting_url?: string;
  type: 'tutoring' | 'coaching' | 'workshop';
}

interface Conversation {
  id: string;
  date: string;
  preview: string;
  messages_count: number;
  topic: string;
}

interface Recommendation {
  id: string;
  title: string;
  type: 'formation' | 'ressource' | 'objectif';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Certificate {
  id: string;
  formation_title: string;
  issued_date: string;
  qr_code_url: string;
  certificate_url: string;
  verification_id: string;
  skills: string[];
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  objectives: string[];
  preferences: {
    learning_style: string;
    preferred_schedule: string;
    notifications_email: boolean;
    notifications_sms: boolean;
    notifications_app: boolean;
  };
  member_since: string;
  level: string;
  points: number;
}

interface Subscription {
  id: string;
  plan_name: string;
  plan_type: 'starter' | 'pro' | 'elite';
  status: 'active' | 'cancelled' | 'paused' | 'trial';
  price_monthly: number;
  next_renewal: string;
  features: string[];
  sessions_remaining: number;
  sessions_total: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockFormations: Formation[] = [
  {
    id: '1',
    title: 'Intelligence Artificielle & Machine Learning',
    description: 'Maîtrisez les fondamentaux de l\'IA et du ML avec des projets pratiques.',
    progress: 68,
    status: 'in_progress',
    instructor: 'Dr. Sophie Martin',
    total_lessons: 48,
    completed_lessons: 32,
    thumbnail: '/formations/ai-ml.jpg',
    category: 'Technologie',
    duration_hours: 36,
    last_accessed: '2024-01-15',
  },
  {
    id: '2',
    title: 'Leadership & Management Agile',
    description: 'Développez vos compétences de leadership dans un contexte agile.',
    progress: 100,
    status: 'completed',
    instructor: 'Marc Dubois',
    total_lessons: 32,
    completed_lessons: 32,
    certificate_url: '/certificates/leadership-agile.pdf',
    thumbnail: '/formations/leadership.jpg',
    category: 'Management',
    duration_hours: 24,
    last_accessed: '2024-01-10',
  },
  {
    id: '3',
    title: 'Data Science avec Python',
    description: 'Analyse de données avancée et visualisation avec Python.',
    progress: 25,
    status: 'in_progress',
    instructor: 'Emma Laurent',
    total_lessons: 56,
    completed_lessons: 14,
    thumbnail: '/formations/data-science.jpg',
    category: 'Données',
    duration_hours: 42,
    last_accessed: '2024-01-12',
  },
  {
    id: '4',
    title: 'Communication Stratégique',
    description: 'Techniques avancées de communication pour les professionnels.',
    progress: 100,
    status: 'completed',
    instructor: 'Claire Moreau',
    total_lessons: 28,
    completed_lessons: 28,
    certificate_url: '/certificates/communication.pdf',
    thumbnail: '/formations/communication.jpg',
    category: 'Soft Skills',
    duration_hours: 18,
    last_accessed: '2023-12-20',
  },
];

const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Session de coaching individuel',
    date: '2024-01-20T14:00:00',
    duration_minutes: 60,
    instructor: 'Dr. Sophie Martin',
    status: 'upcoming',
    meeting_url: 'https://meet.academia.pro/session-123',
    type: 'coaching',
  },
  {
    id: '2',
    title: 'Atelier pratique Machine Learning',
    date: '2024-01-15T10:00:00',
    duration_minutes: 90,
    instructor: 'Dr. Sophie Martin',
    status: 'completed',
    summary: 'Nous avons travaillé sur les réseaux de neurones convolutifs. Excellente progression sur la compréhension des couches d\'activation.',
    type: 'workshop',
  },
  {
    id: '3',
    title: 'Tutorat Python avancé',
    date: '2024-01-10T16:00:00',
    duration_minutes: 45,
    instructor: 'Emma Laurent',
    status: 'completed',
    summary: 'Révision des concepts de pandas et matplotlib. Points à retravailler : les jointures complexes.',
    type: 'tutoring',
  },
  {
    id: '4',
    title: 'Session de planification objectifs',
    date: '2024-01-25T11:00:00',
    duration_minutes: 60,
    instructor: 'Marc Dubois',
    status: 'upcoming',
    meeting_url: 'https://meet.academia.pro/session-456',
    type: 'coaching',
  },
];

const mockConversations: Conversation[] = [
  {
    id: '1',
    date: '2024-01-15T09:30:00',
    preview: 'Comment optimiser mon plan d\'apprentissage pour l\'IA ?',
    messages_count: 12,
    topic: 'Plan d\'apprentissage IA',
  },
  {
    id: '2',
    date: '2024-01-14T14:20:00',
    preview: 'Explique-moi les réseaux de neurones récurrents...',
    messages_count: 8,
    topic: 'Concepts ML avancés',
  },
  {
    id: '3',
    date: '2024-01-12T11:00:00',
    preview: 'Quelles certifications sont reconnues dans le domaine de la data ?',
    messages_count: 15,
    topic: 'Certifications Data Science',
  },
];

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Commencer le module sur les Transformers',
    type: 'formation',
    description: 'Basé sur votre progression en ML, cette étape est cruciale pour votre objectif.',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Lire "Deep Learning" de Goodfellow',
    type: 'ressource',
    description: 'Ressource incontournable pour approfondir vos bases théoriques.',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Objectif : Premier projet Kaggle',
    type: 'objectif',
    description: 'Participez à une compétition Kaggle pour mettre en pratique vos connaissances.',
    priority: 'high',
  },
];

const mockCertificates: Certificate[] = [
  {
    id: '1',
    formation_title: 'Leadership & Management Agile',
    issued_date: '2024-01-10',
    qr_code_url: '/qr/cert-1.png',
    certificate_url: '/certificates/leadership-agile.pdf',
    verification_id: 'ACAD-2024-LMA-001',
    skills: ['Leadership', 'Agile', 'Scrum', 'Management', 'Communication'],
  },
  {
    id: '2',
    formation_title: 'Communication Stratégique',
    issued_date: '2023-12-20',
    qr_code_url: '/qr/cert-2.png',
    certificate_url: '/certificates/communication.pdf',
    verification_id: 'ACAD-2023-CS-089',
    skills: ['Communication', 'Présentation', 'Négociation', 'Influence'],
  },
];

const mockProfile: UserProfile = {
  id: '1',
  full_name: 'Alexandre Dupont',
  email: 'alexandre.dupont@email.com',
  bio: 'Passionné par l\'IA et la transformation digitale. En reconversion vers la Data Science.',
  objectives: ['Maîtriser le Machine Learning', 'Obtenir une certification AWS', 'Évoluer vers un poste de Data Scientist'],
  preferences: {
    learning_style: 'Visuel & Pratique',
    preferred_schedule: 'Soir et weekend',
    notifications_email: true,
    notifications_sms: false,
    notifications_app: true,
  },
  member_since: '2023-09-01',
  level: 'Avancé',
  points: 2840,
};

const mockSubscription: Subscription = {
  id: '1',
  plan_name: 'AcadémIA Pro Elite',
  plan_type: 'elite',
  status: 'active',
  price_monthly: 299,
  next_renewal: '2024-02-01',
  features: [
    'Formations illimitées',
    '8 séances/mois avec formateur',
    'Agent IA personnel 24/7',
    'Certifications reconnues',
    'Accès ressources premium',
    'Support prioritaire',
  ],
  sessions_remaining: 3,
  sessions_total: 8,
};

// ─── Utility Functions ────────────────────────────────────────────────────────

const formatDate = (dateStr: string