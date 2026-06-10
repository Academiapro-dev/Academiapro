"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Brain,
  Target,
  Heart,
  Zap,
  Award,
  Users,
  BookOpen,
  Layers,
  Bot,
  Star,
  Shield,
  TrendingUp,
  Clock,
  Globe,
  ChevronDown,
} from "lucide-react";

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Gold Divider ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c8a96e]" />
      <div className="w-2 h-2 rotate-45 bg-[#c8a96e]" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c8a96e]" />
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-16">
      <span className="inline-block text-xs font-semibold tracking-[0.3em] text-[#c8a96e] uppercase mb-4">
        {label}
      </span>
      <GoldDivider />
      <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-4 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/50 text-lg max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    heroRef.current?.nextElementSibling?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#050508", fontFamily: "system-ui, sans-serif" }}
    >
      {/* ── Noise texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <div
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,169,110,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#c8a96e]/5 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-[#c8a96e]/[0.03] z-0" />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c8a96e]/30 bg-[#c8a96e]/5 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] animate-pulse" />
            <span className="text-[#c8a96e] text-xs font-semibold tracking-widest uppercase">
              À propos d'AcadémIA Pro
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl md:text-7xl font-black text-white leading-none mb-6"
          >
            L'excellence
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%)",
              }}
            >
              réinventée
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed mb-12"
          >
            Nous croyons que chaque professionnel mérite une formation de
            premier ordre. L'IA est notre levier pour rendre cela possible, pour
            tous.
          </motion.p>

          {/* Scroll hint */}
          <motion.button
            onClick={scrollDown}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-2 mx-auto text-white/30 hover:text-[#c8a96e] transition-colors group"
          >
            <span className="text-xs tracking-widest uppercase">
              Découvrir
            </span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </motion.button>
        </div>
      </div>

      {/* ════════════════════════════════════
          STATS BAR
      ════════════════════════════════════ */}
      <div className="relative z-10 border-y border-white/5">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.03), transparent)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              value: 127,
              suffix: "",
              label: "Formations",
              icon: BookOpen,
            },
            {
              value: 14,
              suffix: "",
              label: "Spécialités",
              icon: Layers,
            },
            {
              value: 24,
              suffix: "h/24",
              label: "Agents IA dédiés",
              icon: Bot,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-center gap-6"
            >
              <div className="w-12 h-12 rounded-xl border border-[#c8a96e]/20 bg-[#c8a96e]/5 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5 text-[#c8a96e]" />
              </div>
              <div>
                <div className="text-4xl font-black text-white leading-none">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/40 text-sm mt-1 font-medium">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          VISION & MISSION
      ════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid md:grid-cols-2 gap-8">