```tsx
"use client";

import { useState, useMemo } from "react";

// ============================================================
// TYPES
// ============================================================
type Niveau = "Attestation" | "Certificat" | "Expert" | "Master";
type Mention = "Bien" | "Très Bien" | "Félicitations";
type StatutCertificat = "Valide" | "Révoqué" | "Suspendu";

interface Certificat {
  id: string;
  apprenant: string;
  email: string;
  formation: string;
  niveau: Niveau;
  mention: Mention;
  date: string;
  statut: StatutCertificat;
  qrScans: number;
  revenus: number;
}

interface Verification {
  id: string;
  certificatId: string;
  apprenant: string;
  formation: string;
  employeur: string;
  date: string;
  suspect: boolean;
  tentatives: number;
}

// ============================================================
// DONNÉES MOCK
// ============================================================
const CERTIFICATS_MOCK: Certificat[] = [
  { id: "ACAD-2024-001", apprenant: "Marie Dupont", email: "marie.dupont@email.com", formation: "Machine Learning Avancé", niveau: "Master", mention: "Félicitations", date: "2024-01-15", statut: "Valide", qrScans: 12, revenus: 890 },
  { id: "ACAD-2024-002", apprenant: "Thomas Martin", email: "thomas.martin@email.com", formation: "Python pour la Data Science", niveau: "Certificat", mention: "Très Bien", date: "2024-01-18", statut: "Valide", qrScans: 5, revenus: 450 },
  { id: "ACAD-2024-003", apprenant: "Sophie Bernard", email: "sophie.bernard@email.com", formation: "IA Générative & LLM", niveau: "Expert", mention: "Félicitations", date: "2024-01-20", statut: "Valide", qrScans: 8, revenus: 750 },
  { id: "ACAD-2024-004", apprenant: "Lucas Petit", email: "lucas.petit@email.com", formation: "Deep Learning", niveau: "Master", mention: "Très Bien", date: "2024-01-22", statut: "Valide", qrScans: 3, revenus: 890 },
  { id: "ACAD-2024-005", apprenant: "Emma Leroy", email: "emma.leroy@email.com", formation: "Data Visualization", niveau: "Attestation", mention: "Bien", date: "2024-01-25", statut: "Valide", qrScans: 2, revenus: 290 },
  { id: "ACAD-2024-006", apprenant: "Hugo Moreau", email: "hugo.moreau@email.com", formation: "NLP & Traitement du Texte", niveau: "Certificat", mention: "Bien", date: "2024-01-28", statut: "Révoqué", qrScans: 15, revenus: 450 },
  { id: "ACAD-2024-007", apprenant: "Camille Simon", email: "camille.simon@email.com", formation: "Machine Learning Avancé", niveau: "Expert", mention: "Félicitations", date: "2024-02-01", statut: "Valide", qrScans: 6, revenus: 750 },
  { id: "ACAD-2024-008", apprenant: "Nathan Dubois", email: "nathan.dubois@email.com", formation: "Vision par Ordinateur", niveau: "Master", mention: "Très Bien", date: "2024-02-03", statut: "Valide", qrScans: 4, revenus: 890 },
  { id: "ACAD-2024-009", apprenant: "Léa Roux", email: "lea.roux@email.com", formation: "Python pour la Data Science", niveau: "Attestation", mention: "Très Bien", date: "2024-02-05", statut: "Valide", qrScans: 1, revenus: 290 },
  { id: "ACAD-2024-010", apprenant: "Maxime Blanc", email: "maxime.blanc@email.com", formation: "IA Générative & LLM", niveau: "Certificat", mention: "Félicitations", date: "2024-02-08", statut: "Suspendu", qrScans: 9, revenus: 450 },
  { id: "ACAD-2024-011", apprenant: "Inès Garnier", email: "ines.garnier@email.com", formation: "Deep Learning", niveau: "Expert", mention: "Bien", date: "2024-02-10", statut: "Valide", qrScans: 7, revenus: 750 },
  { id: "ACAD-2024-012", apprenant: "Théo Faure", email: "theo.faure@email.com", formation: "Robotique & IA", niveau: "Master", mention: "Félicitations", date: "2024-02-12", statut: "Valide", qrScans: 11, revenus: 890 },
];

const VERIFICATIONS_MOCK: Verification[] = [
  { id: "VER-001", certificatId: "ACAD-2024-006", apprenant: "Hugo Moreau", formation: "NLP & Traitement du Texte", employeur: "TechCorp SA", date: "2024-02-10", suspect: true, tentatives: 8 },
  { id: "VER-002", certificatId: "ACAD-2024-001", apprenant: "Marie Dupont", formation: "Machine Learning Avancé", employeur: "DataAI Labs", date: "2024-02-11", suspect: false, tentatives: 1 },
  { id: "VER-003", certificatId: "ACAD-2024-010", apprenant: "Maxime Blanc", formation: "IA Générative & LLM", employeur: "StartupX", date: "2024-02-12", suspect: true, tentatives: 5 },
  { id: "VER-004", certificatId: "ACAD-2024-003", apprenant: "Sophie Bernard", formation: "IA Générative & LLM", employeur: "Google France", date: "2024-02-13", suspect: false, tentatives: 1 },
  { id: "VER-005", certificatId: "ACAD-2024-007", apprenant: "Camille Simon", formation: "Machine Learning Avancé", employeur: "Microsoft", date: "2024-02-14", suspect: false, tentatives: 2 },
];

const FORMATIONS_REVENUS = [
  { formation: "Machine Learning Avancé", certifiés: 28, revenus: 24920, croissance: 18 },
  { formation: "IA Générative & LLM", certifiés: 22, revenus: 16500, croissance: 34 },
  { formation: "Deep Learning", certifiés: 19, revenus: 14250, croissance: 12 },
  { formation: "Python pour la Data Science", certifiés: 35, revenus: 10150, croissance: 8 },
  { formation: "Vision par Ordinateur", certifiés: 15, revenus: 13350, croissance: 22 },
  { formation: "NLP & Traitement du Texte", certifiés: 18, revenus: 8100, croissance: -3 },
  { formation: "Robotique & IA", certifiés: 12, revenus: 10680, croissance: 45 },
  { formation: "Data Visualization", certifiés: 24, revenus: 6960, croissance: 5 },
];

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================
const GoldBadge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#c8a96e]/40 bg-[#c8a96e]/10 text-[#c8a96e] ${className}`}>
    {children}
  </span>
);

const NiveauBadge = ({ niveau }: { niveau: Niveau }) => {
  const styles: Record<Niveau, string> = {
    Attestation: "bg-slate-700/60 text-slate-300 border-slate-600/50",
    Certificat: "bg-blue-900/40 text-blue-300 border-blue-700/50",
    Expert: "bg-purple-900/40 text-purple-300 border-purple-700/50",
    Master: "bg-[#c8a96e]/10 text-[#c8a96e] border-[#c8a96e]/40",
  };
  const icons: Record<Niveau, string> = { Attestation: "📄", Certificat: "🎓", Expert: "⭐", Master: "👑" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[niveau]}`}>
      {icons[niveau]} {niveau}
    </span>
  );
};

const MentionBadge = ({ mention }: { mention: Mention }) => {
  const styles: Record<Mention, string> = {
    Bien: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
    "Très Bien": "bg-sky-900/30 text-sky-300 border-sky-700/40",
    Félicitations: "bg-amber-900/30 text-amber-300 border-amber-700/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[mention]}`}>
      {mention}
    </span>
  );
};

const StatutBadge = ({ statut }: { statut: StatutCertificat }) => {
  const styles: Record<StatutCertificat, string> = {
    Valide: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
    Révoqué: "bg-red-900/30 text-red-400 border-red-700/40",
    Suspendu: "bg-orange-900/30 text-orange-400 border-orange-700/40",
  };
  const dots: Record<StatutCertificat, string> = { Valide: "bg-emerald-400", Révoqué: "bg-red-400", Suspendu: "bg-orange-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[statut]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[statut]} animate-pulse`} />
      {statut}
    </span>
  );
};

const StatCard = ({
  label, value, sub, icon, trend, gold = false
}: {
  label: string; value: string | number; sub?: string; icon: string; trend?: number; gold?: boolean;
}) => (
  <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${gold ? "border-[#c8a96e]/40 bg-gradient-to-br from-[#c8a96e]/10 to-[#c8a96e]/5 hover:shadow-[#c8a96e]/10" : "border-white/5 bg-white/[0.03] hover:border-white/10"}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-xl ${gold ? "bg-[#c8a96e]/20" : "bg-white/5"}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className={`text-3xl font-bold mb-1 ${gold ? "text-[#c8a96e]" : "text-white"}`}>{value}</div>
    <div className="text-sm text-gray-400 font-medium">{label}</div>
    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    {gold && <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">🏆</div>}
  </div>
);

// ============================================================
// MODALES
// ============================================================
const ModalGenerer = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState({ apprenant: "", email: "", formation: "", niveau: "Certificat", mention: "Bien" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0f] border border-[#c8a96e]/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-[#c8a96e]/10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">🎓 Générer un certificat manuellement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {[["Nom de l'apprenant", "apprenant", "text"], ["Email", "email", "email"]].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#c8a96e]/50 transition-colors placeholder-gray-600"
                placeholder={`Ent