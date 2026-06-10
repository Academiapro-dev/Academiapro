"use client";

import { useState } from "react";
import {
  FileText,
  CheckCircle,
  Send,
  AlertTriangle,
  Building2,
  TrendingUp,
  Calendar,
  Clock,
  Filter,
  Search,
  MessageSquare,
  FilePlus,
  BarChart3,
  UserCheck,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Landmark,
  Globe,
  CreditCard,
  Euro,
  Zap,
  Eye,
  Download,
  MoreHorizontal,
  X,
  ChevronDown,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface KPI {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: "signed" | "pending" | "sent" | "draft";
  recipient: string;
  date: string;
  size: string;
}

interface Deadline {
  id: string;
  title: string;
  entity: string;
  date: string;
  daysLeft: number;
  priority: "high" | "medium" | "low";
  type: string;
}

interface Invoice {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  description: string;
}

// ============================================================
// DATA
// ============================================================
const kpis: KPI[] = [
  {
    label: "Documents Générés",
    value: 247,
    change: "+12 ce mois",
    positive: true,
    icon: FileText,
    color: "#c8a96e",
  },
  {
    label: "Documents Signés",
    value: 189,
    change: "+8 cette semaine",
    positive: true,
    icon: CheckCircle,
    color: "#4ade80",
  },
  {
    label: "Documents Envoyés",
    value: 203,
    change: "+15 ce mois",
    positive: true,
    icon: Send,
    color: "#60a5fa",
  },
  {
    label: "Alertes Juridiques",
    value: 3,
    change: "-2 résolues",
    positive: true,
    icon: AlertTriangle,
    color: "#f87171",
  },
];

const documents: Document[] = [
  {
    id: "DOC-001",
    name: "Contrat de Prestation LLC → SAS",
    type: "Contrat",
    status: "signed",
    recipient: "SAS Mr Juridique France",
    date: "2024-01-15",
    size: "245 KB",
  },
  {
    id: "DOC-002",
    name: "NDA Partenariat IA",
    type: "Accord",
    status: "sent",
    recipient: "OpenAI Europe Ltd",
    date: "2024-01-14",
    size: "128 KB",
  },
  {
    id: "DOC-003",
    name: "Résolutions AG SAS Q1 2024",
    type: "PV AG",
    status: "pending",
    recipient: "Greffe Tribunal Commerce",
    date: "2024-01-13",
    size: "89 KB",
  },
  {
    id: "DOC-004",
    name: "Facture Interco #FC-2024-047",
    type: "Facture",
    status: "signed",
    recipient: "LLC Wyoming Holdings",
    date: "2024-01-12",
    size: "67 KB",
  },
  {
    id: "DOC-005",
    name: "Dépôt Marque INPI - AcadémIA",
    type: "PI",
    status: "draft",
    recipient: "INPI Paris",
    date: "2024-01-11",
    size: "312 KB",
  },
  {
    id: "DOC-006",
    name: "Convention de Trésorerie Holding",
    type: "Convention",
    status: "signed",
    recipient: "Jacques Martin (5%)",
    date: "2024-01-10",
    size: "156 KB",
  },
];

const deadlines: Deadline[] = [
  {
    id: "D-001",
    title: "Annual Report LLC Wyoming",
    entity: "LLC Wyoming",
    date: "2024-02-01",
    daysLeft: 7,
    priority: "high",
    type: "Compliance",
  },
  {
    id: "D-002",
    title: "Assemblée Générale SAS",
    entity: "SAS France",
    date: "2024-02-15",
    daysLeft: 21,
    priority: "high",
    type: "Gouvernance",
  },
  {
    id: "D-003",
    title: "Renouvellement NDA Partenaires",
    entity: "Holding",
    date: "2024-02-20",
    daysLeft: 26,
    priority: "medium",
    type: "Contrat",
  },
  {
    id: "D-004",
    title: "Dépôt INPI - AcadémIA Pro",
    entity: "SAS France",
    date: "2024-03-01",
    daysLeft: 35,
    priority: "medium",
    type: "Propriété Intellectuelle",
  },
  {
    id: "D-005",
    title: "Déclaration TVA Q4 2023",
    entity: "SAS France",
    date: "2024-01-31",
    daysLeft: 3,
    priority: "high",
    type: "Fiscal",
  },
  {
    id: "D-006",
    title: "Liasse Fiscale IS 2023",
    entity: "SAS France",
    date: "2024-05-15",
    daysLeft: 111,
    priority: "low",
    type: "Fiscal",
  },
];

const invoices: Invoice[] = [
  {
    id: "FC-2024-047",
    from: "LLC Wyoming",
    to: "SAS France",
    amount: 15000,
    status: "paid",
    date: "2024-01-12",
    description: "Services Management & IP Royalties",
  },
  {
    id: "FC-2024-046",
    from: "SAS France",
    to: "LLC Wyoming",
    amount: 3500,
    status: "pending",
    date: "2024-01-10",
    description: "Refacturation charges opérationnelles",
    },
  {
    id: "FC-2024-045",
    from: "LLC Wyoming",
    to: "SAS France",
    amount: 8750,
    status: "paid",
    date: "2024-01-05",
    description: "Licence logiciel AcadémIA Q1",
  },
  {
    id: "FC-2024-044",
    from: "SAS France",
    to: "LLC Wyoming",
    amount: 2200,
    status: "overdue",
    date: "2023-12-31",
    description: "Services administratifs décembre",
  },
];

// ============================================================
// HELPERS
// ============================================================
const statusConfig = {
  signed: {
    label: "Signé",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  pending: {
    label: "En attente",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  sent: {
    label: "Envoyé",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  draft: {
    label: "Brouillon",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
  paid: {
    label: "Payé",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  overdue: {
    label: "En retard",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

const priorityConfig = {
  high: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  low: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
function GoldBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, action, badge }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border flex flex-col"
      style={{ background: "linear-gradient(145deg, #0d0d14 0%, #080810 100%)", borderColor: "rgba(200,169,110,0.15)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(200,169,110,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.25)" }}>
            <Icon size={16} style={{ color: "#c8a96e" }} />
          </div>
          <span className="font-semibold text-white text-sm">{title}</span>
          {badge && <GoldBadge>{badge}</GoldBadge>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, sublabel, onClick, highlight }: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group text-left hover:scale-[1.02]"
      style={{
        background: highlight ? "linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.06))" : "rgba(255,255,255,0.03)",
        borderColor: highlight ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.07)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{ background: highlight ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)" }}>
        <Icon size={18} style={{ color: highlight ? "#c8a96e" : "#9ca3af" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{sublabel}</p>
      </div>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
    </button>
  );
}

// ============================================================
// MODAL
// ============================================================
function QuickActionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border p-6 z-10"
        style={{ background: "#0d0d14", borderColor: "rgba(200,169,110,0.3)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)" }}>
              <MessageSquare size={16} style={{ color: "#c8a96e" }} />
            </div>
            <div>
              <h3 className="text-white font-bold">Question Juridique</h3>
              <p className="text-gray-500 text-xs">AcadémIA Pro · Réponse instantanée</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider