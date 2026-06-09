```tsx
"use client";

import { useState, useMemo, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================

type ContactStatus = "actif" | "prospect" | "inactif" | "vip" | "suspendu";
type Formation = "Marketing Digital" | "Leadership" | "Data Science" | "Finance" | "IA & Tech" | "Management";

interface Contact {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: ContactStatus;
  score: number;
  formation: Formation;
  derniereInteraction: string;
  montant: number;
  tags: string[];
  avatar: string;
  entreprise: string;
  progression: number;
}

type SortField = keyof Contact;
type SortDirection = "asc" | "desc";

// ============================================================
// DATA
// ============================================================

const MOCK_CONTACTS: Contact[] = [
  { id: "1", nom: "Dubois", prenom: "Alexandre", email: "a.dubois@techcorp.fr", telephone: "+33 6 12 34 56 78", statut: "vip", score: 98, formation: "IA & Tech", derniereInteraction: "2024-01-15", montant: 12500, tags: ["premium", "certifié", "mentor"], avatar: "AD", entreprise: "TechCorp SA", progression: 95 },
  { id: "2", nom: "Martin", prenom: "Sophie", email: "s.martin@innovlab.com", telephone: "+33 6 23 45 67 89", statut: "actif", score: 87, formation: "Data Science", derniereInteraction: "2024-01-12", montant: 8900, tags: ["certifié", "actif"], avatar: "SM", entreprise: "InnovLab", progression: 78 },
  { id: "3", nom: "Bernard", prenom: "Lucas", email: "l.bernard@startup.io", telephone: "+33 6 34 56 78 90", statut: "prospect", score: 62, formation: "Marketing Digital", derniereInteraction: "2024-01-10", montant: 2400, tags: ["nouveau", "intéressé"], avatar: "LB", entreprise: "StartupIO", progression: 35 },
  { id: "4", nom: "Petit", prenom: "Émilie", email: "e.petit@consulting.fr", telephone: "+33 6 45 67 89 01", statut: "actif", score: 79, formation: "Leadership", derniereInteraction: "2024-01-14", montant: 6750, tags: ["certifié", "fidèle"], avatar: "EP", entreprise: "Consulting Plus", progression: 65 },
  { id: "5", nom: "Moreau", prenom: "Thomas", email: "t.moreau@finance-pro.com", telephone: "+33 6 56 78 90 12", statut: "vip", score: 95, formation: "Finance", derniereInteraction: "2024-01-15", montant: 18200, tags: ["premium", "certifié", "ambassadeur"], avatar: "TM", entreprise: "Finance Pro", progression: 100 },
  { id: "6", nom: "Leroy", prenom: "Camille", email: "c.leroy@digital.agency", telephone: "+33 6 67 89 01 23", statut: "inactif", score: 34, formation: "Marketing Digital", derniereInteraction: "2023-11-20", montant: 1200, tags: ["inactif", "relance"], avatar: "CL", entreprise: "Digital Agency", progression: 20 },
  { id: "7", nom: "Simon", prenom: "Antoine", email: "a.simon@management.fr", telephone: "+33 6 78 90 12 34", statut: "actif", score: 71, formation: "Management", derniereInteraction: "2024-01-11", montant: 5400, tags: ["actif", "formation"], avatar: "AS", entreprise: "Management Co", progression: 55 },
  { id: "8", nom: "Laurent", prenom: "Julie", email: "j.laurent@datatech.io", telephone: "+33 6 89 01 23 45", statut: "suspendu", score: 28, formation: "Data Science", derniereInteraction: "2023-10-05", montant: 800, tags: ["suspendu", "litige"], avatar: "JL", entreprise: "DataTech", progression: 15 },
  { id: "9", nom: "Michel", prenom: "Pierre", email: "p.michel@ai-solutions.com", telephone: "+33 6 90 12 34 56", statut: "prospect", score: 55, formation: "IA & Tech", derniereInteraction: "2024-01-08", montant: 0, tags: ["prospect", "demo"], avatar: "PM", entreprise: "AI Solutions", progression: 10 },
  { id: "10", nom: "Garcia", prenom: "Isabella", email: "i.garcia@globalcorp.eu", telephone: "+33 6 01 23 45 67", statut: "vip", score: 92, formation: "Leadership", derniereInteraction: "2024-01-13", montant: 15600, tags: ["premium", "international", "certifié"], avatar: "IG", entreprise: "GlobalCorp EU", progression: 88 },
  { id: "11", nom: "Roux", prenom: "Nicolas", email: "n.roux@fintech.fr", telephone: "+33 6 12 98 76 54", statut: "actif", score: 83, formation: "Finance", derniereInteraction: "2024-01-09", montant: 7300, tags: ["certifié", "fidèle"], avatar: "NR", entreprise: "FinTech France", progression: 72 },
  { id: "12", nom: "Fournier", prenom: "Marie", email: "m.fournier@edtech.co", telephone: "+33 6 23 87 65 43", statut: "actif", score: 68, formation: "Management", derniereInteraction: "2024-01-07", montant: 4100, tags: ["actif", "groupe"], avatar: "MF", entreprise: "EdTech Co", progression: 48 },
];

// ============================================================
// HELPERS
// ============================================================

const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bg: string; dot: string }> = {
  vip: { label: "VIP", color: "text-amber-300", bg: "bg-amber-400/10 border border-amber-400/30", dot: "bg-amber-400" },
  actif: { label: "Actif", color: "text-emerald-400", bg: "bg-emerald-400/10 border border-emerald-400/30", dot: "bg-emerald-400" },
  prospect: { label: "Prospect", color: "text-blue-400", bg: "bg-blue-400/10 border border-blue-400/30", dot: "bg-blue-400" },
  inactif: { label: "Inactif", color: "text-slate-400", bg: "bg-slate-400/10 border border-slate-400/30", dot: "bg-slate-400" },
  suspendu: { label: "Suspendu", color: "text-red-400", bg: "bg-red-400/10 border border-red-400/30", dot: "bg-red-400" },
};

const FORMATION_ICONS: Record<Formation, string> = {
  "Marketing Digital": "📊",
  "Leadership": "🎯",
  "Data Science": "🔬",
  "Finance": "💹",
  "IA & Tech": "🤖",
  "Management": "🏛️",
};

const formatMontant = (n: number) =>
  n === 0 ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const scoreColor = (s: number) => {
  if (s >= 85) return "text-amber-400";
  if (s >= 65) return "text-emerald-400";
  if (s >= 40) return "text-blue-400";
  return "text-red-400";
};

const scoreBarColor = (s: number) => {
  if (s >= 85) return "bg-gradient-to-r from-amber-500 to-amber-300";
  if (s >= 65) return "bg-gradient-to-r from-emerald-500 to-emerald-300";
  if (s >= 40) return "bg-gradient-to-r from-blue-500 to-blue-300";
  return "bg-gradient-to-r from-red-500 to-red-300";
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const GoldAccent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`text-[#c8a96e] ${className}`}>{children}</span>
);

const Badge = ({ label, variant = "default" }: { label: string; variant?: "default" | "gold" | "outline" }) => {
  const styles = {
    default: "bg-white/5 text-slate-300 border border-white/10",
    gold: "bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/30",
    outline: "bg-transparent text-slate-400 border border-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
};

const Avatar = ({ initials, score }: { initials: string; score: number }) => {
  const ringColor = score >= 85 ? "ring-amber-400/60" : score >= 65 ? "ring-emerald-400/60" : score >= 40 ? "ring-blue-400/60" : "ring-red-400/60";
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#c8a96e]/20 to-[#c8a96e]/5 flex items-center justify-center text-sm font-bold text-[#c8a96e] ring-2 ${ringColor} shrink-0`}>
      {initials}
    </div>
  );
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
    </div>
    <span className={`text-xs font-bold w-8 text-right ${scoreColor(score)}`}>{score}</span>
  </div>
);

const ProgressBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className