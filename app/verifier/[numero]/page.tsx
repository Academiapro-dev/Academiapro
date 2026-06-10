```tsx
// app/verifier/[certificatId]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import CertificatVerification from "@/components/CertificatVerification";

interface PageProps {
  params: { certificatId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Vérification Certificat ${params.certificatId} — AcadémIA Pro`,
    description: "Vérifiez l'authenticité d'un certificat AcadémIA Pro",
    robots: "noindex, nofollow",
  };
}

export default function VerifierPage({ params }: PageProps) {
  return <CertificatVerification certificatId={params.certificatId} />;
}
```

```tsx
// components/CertificatVerification.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Shield,
  Award,
  Calendar,
  User,
  BookOpen,
  Hash,
  Star,
  AlertTriangle,
  Mail,
  ExternalLink,
  Loader2,
  Building2,
  ChevronRight,
  Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CertificatData {
  valide: boolean;
  id: string;
  apprenant: {
    prenom: string;
    nom: string;
  };
  formation: {
    titre: string;
    code: string;
    domaine: string;
  };
  dateObtention: string;
  mention: "Passable" | "Assez Bien" | "Bien" | "Très Bien" | "Félicitations du Jury";
  score: number;
  scoreMax: number;
  expert: {
    prenom: string;
    nom: string;
    titre: string;
  };
  emetteur: string;
}

// ─── Mock API ──────────────────────────────────────────────────────────────────

async function fetchCertificat(id: string): Promise<CertificatData | null> {
  await new Promise((r) => setTimeout(r, 1400));

  const mockData: Record<string, CertificatData> = {
    "AP-2847-2026-0391": {
      valide: true,
      id: "AP-2847-2026-0391",
      apprenant: { prenom: "Sophie", nom: "Marchand" },
      formation: {
        titre: "Intelligence Artificielle Appliquée aux Métiers du Droit",
        code: "IA-DROIT-ADV-03",
        domaine: "Intelligence Artificielle & Droit",
      },
      dateObtention: "2026-03-14",
      mention: "Très Bien",
      score: 91,
      scoreMax: 100,
      expert: { prenom: "Dr. Antoine", nom: "Ferreira", titre: "Expert IA & LegalTech" },
      emetteur: "AcadémIA Pro",
    },
    "AP-1203-2026-0712": {
      valide: true,
      id: "AP-1203-2026-0712",
      apprenant: { prenom: "Karim", nom: "Benali" },
      formation: {
        titre: "Prompt Engineering & LLMs pour Professionnels",
        code: "PE-LLM-PRO-07",
        domaine: "Ingénierie des Prompts",
      },
      dateObtention: "2026-01-28",
      mention: "Félicitations du Jury",
      score: 98,
      scoreMax: 100,
      expert: { prenom: "Isabelle", nom: "Chaumont", titre: "Senior AI Trainer" },
      emetteur: "AcadémIA Pro",
    },
  };

  const normalized = id.toUpperCase();
  return mockData[normalized] ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMentionColor(mention: string): string {
  const map: Record<string, string> = {
    "Passable": "text-zinc-400 border-zinc-600",
    "Assez Bien": "text-blue-400 border-blue-700",
    "Bien": "text-sky-400 border-sky-700",
    "Très Bien": "text-emerald-400 border-emerald-700",
    "Félicitations du Jury": "text-[#c8a96e] border-[#c8a96e]",
  };
  return map[mention] ?? "text-zinc-400 border-zinc-600";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-[#c8a96e]";
  if (score >= 75) return "text-emerald-400";
  if (score >= 60) return "text-sky-400";
  return "text-zinc-400";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoAcademia({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  const iconSizes = { sm: 20, md: 28, lg: 40 };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #a07840 100%)",
          padding: size === "lg" ? "10px" : size === "md" ? "7px" : "5px",
        }}
      >
        <Award
          size={iconSizes[size]}
          className="text-[#050508]"
          strokeWidth={2.2}
        />
      </div>
      <div>
        <span
          className={`font-black tracking-tight ${sizes[size]}`}
          style={{ color: "#c8a96e" }}
        >
          Académ
        </span>
        <span
          className={`font-black tracking-tight ${sizes[size]} text-white`}
        >
          IA
        </span>
        <span
          className={`font-light tracking-widest text-zinc-400 block`}
          style={{ fontSize: size === "lg" ? "0.65rem" : "0.55rem", letterSpacing: "0.25em" }}
        >
          PRO
        </span>
      </div>
    </div>
  );
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="rotate-[-90deg]">
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="8"
        />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c8a96e" />
            <stop offset="100%" stopColor="#e8c98e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-black ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-[10px] text-zinc-500 font-medium">/{max}</span>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-white/5 last:border-0">
      <div
        className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
        style={{ background: "rgba(200, 169, 110, 0.12)" }}
      >
        <Icon size={14} style={{ color: "#c8a96e" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-semibold leading-snug break-words ${
            highlight ? "text-[#c8a96e]" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Valid Certificate View ────────────────────────────────────────────────────

function CertificatValide({ data }: { data: CertificatData }) {
  const mentionClass = getMentionColor(data.mention);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fadeIn">

      {/* Badge Valide */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #0a2218 0%, #0d2b1e 50%, #081a12 100%)",
          border: "1px solid rgba(52, 211, 153, 0.3)",
          boxShadow: "0 0 40px rgba(52, 211, 153, 0.08), inset 0 1px 0 rgba(52, 211, 153, 0.1)",
        }}
      >
        {/* Glow bg */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(52, 211, 153, 0.08)" }}
        />

        <div className="relative flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
            }}
          >
            <CheckCircle size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
                ✓ Certificat authentique
              </span>
            </div>
            <p className="text-white font-black text-xl leading-tight">
              Ce certificat est valide
            </p>
            <p className="text-zinc-400 text-sm mt-0.5">
              Vérifié par les serveurs AcadémIA Pro
            </p>
          </div>
        </div>
      </div>

      {/* Card Principale */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#0c0c14",
          border: "1px solid rgba(200, 169, 110, 0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header doré */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(200,169,110,0.15) 0%, rgba(200,169,110,0.05) 100%)",
            borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          }}
        >
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(200,169,110,0.08)" }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <LogoAcademia size="md" />
            <div
              className="text-right px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(200,169,110,0.1)",
                border: "1px solid rgba(200,169,110,0.2)",
              }}
            >
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">N° Certificat</p>
              <p className="text-[#c8a96e] font-mono font-bold text-sm">{data.id}</p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6">

          {/* Apprenant + Score */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                Certifié décerné à
              </p>
              <h2 className="text-white font-black text-2xl leading-tight">
                {data.apprenant.prenom}{" "}
                <span style={{ color: "#c8a96e" }}>{data.apprenant.nom}</span>
              </h2>
              <div
                className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border text-xs font-semibold ${mentionClass}`}
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <Star size={11} />
                {data.mention}
              </div>
            </div>
            <ScoreRing score={data