"use client";

import { useState } from "react";
import { Check, X, Star, Shield, ChevronDown, ChevronUp, Zap, Video, Headphones, BookOpen } from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface FAQItem {
  question: string;
  answer: string;
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

// ============================================================
// DATA
// ============================================================
const formationTiers: PricingTier[] = [
  {
    name: "E-Learning",
    price: "Nous contacter",
    description: "Apprenez à votre rythme avec nos modules interactifs en ligne",
    features: [
      "Accès aux modules vidéo",
      "Ressources téléchargeables",
      "Quiz d'évaluation",
      "Certificat de complétion",
      "Support par email",
      "Accès 6 mois",
    ],
  },
  {
    name: "Premium 24h/7",
    price: "Nous contacter",
    description: "Un accompagnement premium disponible à toute heure",
    highlighted: true,
    badge: "Populaire",
    features: [
      "Tout E-Learning inclus",
      "Accès illimité 24h/24 7j/7",
      "Coaching personnalisé",
      "Sessions de groupe live",
      "Support prioritaire",
      "Accès à vie",
      "Mises à jour incluses",
      "Communauté privée",
    ],
  },
  {
    name: "Live Avatar",
    price: "Nous contacter",
    description: "Expérience immersive avec avatar IA en temps réel",
    features: [
      "Tout Premium inclus",
      "Avatar IA personnalisé",
      "Sessions 1-to-1 illimitées",
      "Simulation interactive",
      "Feedback temps réel",
      "Accès à vie",
      "Mises à jour prioritaires",
      "Accès bêta nouvelles fonctions",
    ],
  },
];

const formationFeatures = [
  { feature: "Modules vidéo", elearning: true, premium: true, avatar: true },
  { feature: "Ressources PDF", elearning: true, premium: true, avatar: true },
  { feature: "Quiz interactifs", elearning: true, premium: true, avatar: true },
  { feature: "Certificat", elearning: true, premium: true, avatar: true },
  { feature: "Support email", elearning: true, premium: true, avatar: true },
  { feature: "Accès 24h/7", elearning: false, premium: true, avatar: true },
  { feature: "Coaching personnalisé", elearning: false, premium: true, avatar: true },
  { feature: "Sessions live", elearning: false, premium: true, avatar: true },
  { feature: "Avatar IA", elearning: false, premium: false, avatar: true },
  { feature: "Simulation temps réel", elearning: false, premium: false, avatar: true },
  { feature: "Feedback instantané", elearning: false, premium: false, avatar: true },
  { feature: "Accès bêta", elearning: false, premium: false, avatar: true },
];

const visioSeances = [
  { name: "Découverte", price: 29, duration: "30 min", description: "Première prise de contact et évaluation initiale" },
  { name: "Standard", price: 59, duration: "60 min", description: "Séance thérapeutique complète", popular: false },
  { name: "Expert", price: 79, duration: "90 min", description: "Séance approfondie avec suivi personnalisé" },
];

const visioPacks = [
  { name: "Pack 5 séances", price: 249, savings: "46 €", unit: "49,80 €/séance" },
  { name: "Pack 10 séances", price: 449, savings: "141 €", unit: "44,90 €/séance" },
];

const visioAbonnements = [
  { name: "Starter", price: 35, description: "1 séance/mois", features: ["1 séance visio Standard", "Suivi par messagerie", "Ressources en ligne"] },
  { name: "Bien-être", price: 79, description: "2 séances/mois", badge: "BEST-SELLER", features: ["2 séances visio Standard", "Suivi prioritaire", "Ressources premium", "Bilan mensuel"] },
  { name: "Intensif", price: 129, description: "4 séances/mois", features: ["4 séances visio Standard", "Suivi dédié", "Ressources illimitées", "Bilan hebdomadaire", "Accès communauté VIP"] },
];

const audioSeances = [
  { name: "Découverte", price: 19, duration: "20 min", description: "Introduction audio guidée" },
  { name: "Standard", price: 39, duration: "45 min", description: "Séance audio thérapeutique complète" },
  { name: "Expert", price: 55, duration: "70 min", description: "Séance audio premium et approfondie" },
];

const audioPacks = [
  { name: "Pack 5 séances", price: 169, savings: "26 €", unit: "33,80 €/séance" },
  { name: "Pack 10 séances", price: 299, savings: "91 €", unit: "29,90 €/séance" },
];

const audioAbonnements = [
  { name: "Starter", price: 25, description: "2 séances audio/mois", features: ["2 séances audio Standard", "Suivi par messagerie", "Bibliothèque audio"] },
  { name: "Bien-être", price: 55, description: "4 séances audio/mois", badge: "BEST-SELLER", features: ["4 séances audio Standard", "Suivi prioritaire", "Bibliothèque premium", "Méditations guidées"] },
  { name: "Intensif", price: 89, description: "8 séances audio/mois", features: ["8 séances audio Standard", "Suivi dédié", "Accès illimité bibliothèque", "Séances personnalisées", "Support VIP"] },
];

const faqItems: FAQItem[] = [
  {
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, virement bancaire et Apple Pay / Google Pay. Toutes les transactions sont sécurisées par cryptage SSL.",
  },
  {
    question: "Comment fonctionne la garantie 30 jours ?",
    answer: "Si vous n'êtes pas satisfait dans les 30 premiers jours suivant votre achat, nous vous remboursons intégralement et sans question. Il vous suffit de contacter notre service client par email ou via votre espace personnel.",
  },
  {
    question: "Puis-je changer de formule d'abonnement en cours de route ?",
    answer: "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. En cas d'upgrade, la différence est calculée au prorata. En cas de downgrade, le nouveau tarif s'applique au prochain cycle de facturation.",
  },
  {
    question: "Les séances ont-elles une date d'expiration ?",
    answer: "Les séances achetées à l'unité sont valables 12 mois après la date d'achat. Les packs de 5 ou 10 séances sont valables 18 mois. Les abonnements sont renouvelés mensuellement et les séances non utilisées sont reportées le mois suivant (dans la limite de 2 mois).",
  },
  {
    question: "Est-ce que je peux offrir des séances en cadeau ?",
    answer: "Absolument ! Nous proposons des cartes cadeaux pour toutes nos offres. Vous pouvez les commander directement depuis votre espace client ou en contactant notre équipe. Les cartes cadeaux sont valables 24 mois.",
  },
  {
    question: "Y a-t-il des tarifs réduits (étudiants, demandeurs d'emploi) ?",
    answer: "Oui, nous proposons une réduction de 20 % pour les étudiants et les demandeurs d'emploi sur présentation d'un justificatif. Contactez notre service client pour bénéficier de ce tarif préférentiel.",
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel, section 'Mes abonnements'. L'annulation prend effet à la fin du cycle de facturation en cours. Aucun remboursement partiel n'est effectué pour les jours restants, sauf dans le cadre de la garantie 30 jours.",
  },
];

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "rgba(200, 169, 110, 0.15)", border: "1px solid rgba(200, 169, 110, 0.3)" }}>
        <span style={{ color: "#c8a96e" }}>{icon}</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h2>
      {subtitle && <p className="text-gray-400 text-lg max-w-2xl mx-auto">{subtitle}</p>}
      <div className="mt-4 mx-auto w-24 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #c8a96e, transparent)" }} />
    </div>
  );
}

function GoldBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: "#c8a96e", color: "#050508" }}>
      {text}
    </span>
  );
}

function CheckIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="w-5 h-5 mx-auto" style={{ color: "#c8a96e" }} />
  ) : (
    <X className="w-5 h-5 mx-auto text-gray-600" />
  );
}

// ============================================================
// SECTION 1 — FORMATIONS
// ============================================================
function FormationsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          icon={<BookOpen className="w-6 h-6" />}
          title="Formations AcadémIA Pro"
          subtitle="Trois niveaux d'apprentissage adaptés à vos