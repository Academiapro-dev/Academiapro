```typescript
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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Formation {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  price: number;
  badge: string;
}

interface AccompagnementLevel {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: string;
  popular?: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  selectedFormation: string;
  selectedLevel: string;
  paymentMethod: "card" | "apple_pay" | "google_pay" | "installment";
  acceptTerms: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const formations: Formation[] = [
  {
    id: "ia-business",
    title: "IA & Business Intelligence",
    description: "Maîtrisez l'IA pour transformer votre entreprise",
    duration: "48h",
    level: "Intermédiaire",
    price: 1290,
    badge: "🔥 Best-seller",
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Avancé",
    description: "Devenez expert en communication avec les LLMs",
    duration: "24h",
    level: "Débutant",
    price: 690,
    badge: "⚡ Nouveau",
  },
  {
    id: "ml-pratique",
    title: "Machine Learning Pratique",
    description: "Construisez vos premiers modèles prédictifs",
    duration: "72h",
    level: "Avancé",
    price: 1890,
    badge: "🎯 Certifiant",
  },
  {
    id: "chatgpt-pro",
    title: "ChatGPT & LLMs Pro",
    description: "Automatisez votre workflow avec l'IA générative",
    duration: "16h",
    level: "Débutant",
    price: 490,
    badge: "💡 Populaire",
  },
  {
    id: "data-science",
    title: "Data Science Complète",
    description: "Du traitement des données à la visualisation avancée",
    duration: "96h",
    level: "Avancé",
    price: 2490,
    badge: "🏆 Expert",
  },
  {
    id: "ia-marketing",
    title: "IA pour le Marketing",
    description: "Révolutionnez vos campagnes avec l'intelligence artificielle",
    duration: "32h",
    level: "Intermédiaire",
    price: 890,
    badge: "📈 ROI garanti",
  },
];

const accompagnementLevels: AccompagnementLevel[] = [
  {
    id: "elearning",
    name: "E-Learning",
    description: "Apprenez à votre rythme",
    price: 0,
    icon: "🎓",
    features: [
      "Accès aux vidéos HD",
      "Exercices pratiques",
      "Forum communautaire",
      "Certificat de completion",
      "Mises à jour incluses",
    ],
  },
  {
    id: "premium",
    name: "Premium 24/7",
    description: "Support expert illimité",
    price: 299,
    icon: "⭐",
    popular: true,
    features: [
      "Tout E-Learning inclus",
      "Mentor dédié 24/7",
      "Sessions live hebdo",
      "Revue de code perso",
      "Accès prioritaire Discord",
      "Garantie satisfaction 30j",
    ],
  },
  {
    id: "live-avatar",
    name: "Live Avatar",
    description: "L'IA comme professeur personnel",
    price: 599,
    icon: "🤖",
    features: [
      "Tout Premium inclus",
      "Avatar IA personnalisé",
      "Sessions immersives VR",
      "Coaching IA adaptatif",
      "Simulation d'entretiens",
      "Placement professionnel",
      "Garantie emploi 6 mois",
    ],
  },
];

// ─── Payment Form Component ───────────────────────────────────────────────────

function PaymentForm({
  formData,
  totalPrice,
  onSuccess,
  isLoading,
  setIsLoading,
}: {
  formData: FormData;
  totalPrice: number;
  onSuccess: () => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string>("");

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    setIsLoading(true);
    setCardError("");

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice * 100,
          email: formData.email,
          metadata: {
            formation: formData.selectedFormation,
            level: formData.selectedLevel,
            firstName: formData.firstName,
            lastName: formData.lastName,
          },
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        setCardError(apiError);
        setIsLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
            },
          },
        }
      );

      if (error) {
        setCardError(error.message || "Erreur de paiement");
        setIsLoading(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            formation: formData.selectedFormation,
            level: formData.selectedLevel,
          }),
        });
        onSuccess();
      }
    } catch {
      setCardError("Une erreur inattendue s'est produite");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-gold-500/30 bg-neutral-900/80">
        <CardElement
          options={{
            style: {
              base: {
                color: "#f5f5f5",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                "::placeholder": { color: "#6b7280" },
                iconColor: "#D4AF37",
              },
              invalid: { color: "#ef4444", iconColor: "#ef4444" },
            },
          }}
        />
      </div>
      {cardError && (
        <p className="text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span> {cardError}
        </p>
      )}
      <button
        onClick={handlePayment}
        disabled={isLoading || !stripe}
        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-600 to-yellow-400 text-black hover:from-yellow-500 hover:to-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-yellow-900/30"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Traitement en cours...
          </>
        ) : (
          <>
            <span>🔒</span>
            Payer {totalPrice.toLocaleString("fr-FR")} € maintenant
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [authMethod, setAuthMethod] = useState<"oauth" | "email" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedFormation: "",
    selectedLevel: "",
    paymentMethod: "card",
    acceptTerms: false,
  });

  const selectedFormationData = formations.find(
    (f) => f.id === formData.selectedFormation
  );
  const selectedLevelData = accompagnementLevels.find(
    (l) => l.id === formData.selectedLevel
  );
  const totalPrice =
    (selectedFormationData?.price || 0) + (selectedLevelData?.price || 0);

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Simulate OAuth - replace with actual NextAuth signIn
      // await signIn("google", { callbackUrl: "/inscription?step=2" });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormData((prev) => ({