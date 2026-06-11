// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// TYPES
// ============================================================
interface Stagiaire {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatar_url?: string;
  formations_inscrites: Formation[];
  certificats: Certificat[];
  prochaine_seance?: SeanceLive;
  derniere_formation_id?: string;
}

interface Formation {
  id: string;
  titre: string;
  description: string;
  progression: number;
  total_modules: number;
  modules_completes: number;
  duree_totale: string;
  categorie: string;
  image_url?: string;
  derniere_activite: string;
}

interface Certificat {
  id: string;
  titre: string;
  date_obtention: string;
  organisme: string;
  url_pdf?: string;
}

interface SeanceLive {
  id: string;
  titre: string;
  date: string;
  heure: string;
  formateur: string;
  lien_zoom?: string;
  places_restantes: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  lu: boolean;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================
// MOCK DATA (fallback si Supabase non configuré)
// ============================================================
const MOCK_DATA: Stagiaire = {
  id: '1',
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie.dupont@email.com',
  formations_inscrites: [
    {
      id: 'f1',
      titre: 'Intelligence Artificielle & Machine Learning',
      description: 'Maîtrisez les fondamentaux de l\'IA et du ML',
      progression: 68,
      total_modules: 12,
      modules_completes: 8,
      duree_totale: '24h',
      categorie: 'IA',
      derniere_activite: '2024-01-15',
    },
    {
      id: 'f2',
      titre: 'Développement Web Full-Stack',
      description: 'React, Node.js, bases de données modernes',
      progression: 35,
      total_modules: 20,
      modules_completes: 7,
      duree_totale: '40h',
      categorie: 'Dev',
      derniere_activite: '2024-01-12',
    },
    {
      id: 'f3',
      titre: 'Leadership & Management Agile',
      description: 'Développez votre leadership en environnement Agile',
      progression: 90,
      total_modules: 8,
      modules_completes: 7,
      duree_totale: '16h',
      categorie: 'Management',
      derniere_activite: '2024-01-14',
    },
  ],
  certificats: [
    {
      id: 'c1',
      titre: 'Python pour la Data Science',
      date_obtention: '2023-11-20',
      organisme: 'AcadémIA Pro',
    },
    {
      id: 'c2',
      titre: 'Fondamentaux du Cloud AWS',
      date_obtention: '2023-12-05',
      organisme: 'AcadémIA Pro',
    },
    {
      id: 'c3',
      titre: 'Communication Professionnelle',
      date_obtention: '2024-01-10',
      organisme: 'AcadémIA Pro',
    },
  ],
  prochaine_seance: {
    id: 's1',
    titre: 'Workshop IA Générative : Cas Pratiques',
    date: '2024-01-22',
    heure: '14:00',
    formateur: 'Dr. Alexandre Martin',
    lien_zoom: 'https://zoom.us/j/example',
    places_restantes: 4,
  },
  derniere_formation_id: 'f1',
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    message: 'Nouveau module disponible dans "IA & Machine Learning"',
    type: 'info',
    lu: false,
    created_at: '2024-01-15T10:00:00',
  },
  {
    id: 'n2',
    message: 'Félicitations ! Vous avez obtenu votre certificat Python 🎉',
    type: 'success',
    lu: false,
    created_at: '2024-01-14T15:30:00',
  },
  {
    id: 'n3',
    message: 'Rappel : Séance live dans 2 jours',
    type: 'warning',
    lu: true,
    created_at: '2024-01-13T09:00:00',
  },
];

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================

const GoldIcon = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <span style={{ color: '#c8a96e', fontSize: size }} className="flex items-center justify-center">
    {children}
  </span>
);

const ProgressBar = ({ value, animated = true }: { value: number; animated?: boolean }) => (
  <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1a1a2e' }}>
    <motion.div
      className="h-2 rounded-full"
      style={{
        background: 'linear-gradient(90deg, #c8a96e, #e8c98e)',
        boxShadow: '0 0 8px rgba(200, 169, 110, 0.4)',
      }}
      initial={animated ? { width: 0 } : { width: `${value}%` }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
  </div>
);

const CategoryBadge = ({ categorie }: { categorie: string }) => {
  const colors: Record<string, string> = {
    IA: '#7c3aed',
    Dev: '#0891b2',
    Management: '#059669',
    Design: '#db2777',
  };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        backgroundColor: `${colors[categorie] || '#6b7280'}20`,
        color: colors[categorie] || '#6b7280',
        border: `1px solid ${colors[categorie] || '#6b7280'}40`,
      }}
    >
      {categorie}
    </span>
  );
};

// ============================================================
// COMPOSANT NOTIFICATIONS
// ============================================================
const NotificationPanel = ({
  notifications,
  onClose,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.95 }}
    className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
    style={{
      backgroundColor: '#0d0d1a',
      border: '1px solid rgba(200, 169, 110, 0.2)',
    }}
  >
    <div
      className="flex items-center justify-between p-4"
      style={{ borderBottom: '1px solid rgba(200, 169, 110, 0.1)' }}
    >
      <span className="font-semibold text-white">Notifications</span>
      <button
        onClick={onMarkAllRead}
        className="text-xs hover:text-yellow-300 transition-colors"
        style={{ color: '#c8a96e' }}
      >
        Tout marquer lu
      </button>
    </div>
    <div className="max-h-72 overflow-y-auto">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            opacity: notif.lu ? 0.6 : 1,
          }}
        >
          <div className="flex gap-3 items-start">
            <div
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{
                backgroundColor: notif.lu
                  ? 'transparent'
                  : notif.type === 'success'
                  ? '#10b981'
                  : notif.type === 'warning'
                  ? '#f59e0b'
                  : '#c8a96e',
              }}
            />
            <div>
              <p className="text-sm text-gray-300">{notif.message}</p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(notif.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="p-3 text-center">
      <button
        onClick={onClose}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Fermer
      </button>
    </div>
  </motion.div>
);

// ============================================================
// COMPOSANT AGENT IA CHAT
// ============================================================
const AIChat = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Bonjour ! Je suis votre assistant IA AcadémIA Pro. Comment puis-je vous aider dans votre apprentissage aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_REPLIES = [
    'Où en suis-je dans ma formation ?',
    'Prochaine séance live ?',
    'Mes certificats',
    'Aide pour un exercice',
  ];

  const simulateResponse = async (userMessage: string) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1200));
    
    const responses: Record<string, string> = {
      'Où en suis-je dans ma formation ?':
        'Vous progressez très bien ! Votre formation principale "IA & Machine Learning