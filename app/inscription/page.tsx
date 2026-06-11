// app/inscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "auth" | "profile" | "formation" | "niveau" | "paiement";

interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  avatar?: string;
}

interface Formation {
  id: string;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  emoji: string;
  categorie: string;
}

interface NiveauAccompagnement {
  id: "elearning" | "premium" | "avatar";
  label: string;
  description: string;
  prix: number;
  badge: string;
  features: string[];
  couleur: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const FORMATIONS: Formation[] = [
  {
    id: "dev-web",
    titre: "Développement Web Full Stack",
    description: "React, Next.js, Node.js, bases de données",
    duree: "6 mois",
    niveau: "Débutant → Expert",
    emoji: "💻",
    categorie: "Tech",
  },
  {
    id: "ia-ml",
    titre: "Intelligence Artificielle & ML",
    description: "Python, TensorFlow, LLMs, Prompt Engineering",
    duree: "4 mois",
    niveau: "Intermédiaire",
    emoji: "🤖",
    categorie: "Tech",
  },
  {
    id: "design-ux",
    titre: "Design UX/UI Professionnel",
    description: "Figma, Design System, Prototypage",
    duree: "3 mois",
    niveau: "Tous niveaux",
    emoji: "🎨",
    categorie: "Design",
  },
  {
    id: "data-analytics",
    titre: "Data Science & Analytics",
    description: "Python, SQL, Tableau, Machine Learning",
    duree: "5 mois",
    niveau: "Débutant → Avancé",
    emoji: "📊",
    categorie: "Data",
  },
  {
    id: "cybersecurite",
    titre: "Cybersécurité & Ethical Hacking",
    description: "Pentest, OSCP, CTF, Sécurité réseau",
    duree: "4 mois",
    niveau: "Intermédiaire",
    emoji: "🔐",
    categorie: "Sécurité",
  },
  {
    id: "marketing-digital",
    titre: "Marketing Digital & Growth",
    description: "SEO, Ads, Email Marketing, Analytics",
    duree: "2 mois",
    niveau: "Tous niveaux",
    emoji: "📈",
    categorie: "Business",
  },
];

const NIVEAUX: NiveauAccompagnement[] = [
  {
    id: "elearning",
    label: "E-Learning",
    description: "Apprenez à votre rythme",
    prix: 49,
    badge: "Essentiel",
    features: [
      "Accès illimité aux cours",
      "Exercices pratiques",
      "Certificat de réussite",
      "Forum communautaire",
      "Mises à jour incluses",
    ],
    couleur: "from-slate-700 to-slate-600",
  },
  {
    id: "premium",
    label: "Premium 24/7",
    description: "Accompagnement IA personnalisé",
    prix: 149,
    badge: "Populaire",
    features: [
      "Tout E-Learning inclus",
      "IA Coach disponible 24/7",
      "Sessions live hebdomadaires",
      "Correction personnalisée",
      "Mentorat par experts",
      "Accès réseau Alumni",
    ],
    couleur: "from-amber-700 to-amber-600",
  },
  {
    id: "avatar",
    label: "Live Avatar",
    description: "Professeur IA en temps réel",
    prix: 299,
    badge: "Premium",
    features: [
      "Tout Premium inclus",
      "Avatar IA interactif",
      "Sessions illimitées",
      "Roadmap 100% personnalisée",
      "Simulation d'entretien",
      "Garantie emploi 6 mois",
      "Accès événements VIP",
    ],
    couleur: "from-purple-700 to-purple-600",
  },
];

// ─── Stripe Payment Form ───────────────────────────────────────────────────────

function StripePaymentForm({
  montant,
  formation,
  niveau,
  userProfile,
  onSuccess,
}: {
  montant: number;
  formation: Formation | null;
  niveau: NiveauAccompagnement | null;
  userProfile: UserProfile;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paiementMode, setPaiementMode] = useState<"cb" | "3x">("cb");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      // Créer PaymentIntent via API
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: montant * 100,
          email: userProfile.email,
          formation: formation?.id,
          niveau: niveau?.id,
          mode: paiementMode,
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        setError(apiError);
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${userProfile.prenom} ${userProfile.nom}`,
              email: userProfile.email,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Erreur de paiement");
      } else if (paymentIntent?.status === "succeeded") {
        // Envoyer email de confirmation
        await fetch("/api/email/confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userProfile.email,
            prenom: userProfile.prenom,
            formation: formation?.titre,
            niveau: niveau?.label,
            montant,
          }),
        });
        onSuccess();
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }

    setLoading(false);
  };

  const montant3x = Math.ceil((montant * 1.015) / 3);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode paiement */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaiementMode("cb")}
          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
            paiementMode === "cb"
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-white/10 text-gray-400 hover:border-white/20"
          }`}
        >
          💳 Paiement comptant
        </button>
        <button
          type="button"
          onClick={() => setPaiementMode("3x")}
          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
            paiementMode === "3x"
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-white/10 text-gray-400 hover:border-white/20"
          }`}
        >
          🔄 3x sans frais
        </button>
      </div>

      {paiementMode === "3x" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-emerald-400 text-sm font-medium">
            ✨ 3 mensualités de {montant3x}€/mois — Sans frais
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Total : {montant3x * 3}€ · Frais de dossier : 0€
          </p>
        </div>
      )}

      {/* Wallets */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 px-4 bg-black border border-white/10 rounded-xl text-white text-sm font-medium hover:border-white/25 transition-all duration-200 group"
          onClick={() => {
            // Apple Pay via Stripe Payment Request Button
          }}
        >
          <span className="text-lg"></span>
          <span>Apple Pay</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium hover:border-white/25 transition-all duration-200"
          onClick={() => {
            // Google Pay via Stripe Payment Request Button
          }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M12 11.4v2.4h3.84c-.16 1-.62 1.84-1.32 2.4l2.14 1.66c1.24-1.14 1.96-2.82 1.96-4.82 0-.46-.04-.9-.12-1.32H12z"
              fill="#4285F4"
            />
            <path
              d="M5.84 14.32C5.6 13.7 5.46 13.02 5.46 12.3s.14-1.4.38-2.02L3.72 8.62C3.14 9.78 2.82