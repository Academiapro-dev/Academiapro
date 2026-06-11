// app/garantie/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Sophie M.",
    role: "Étudiante en Master",
    avatar: "SM",
    content:
      "J'ai demandé un remboursement après 2 semaines car la formation ne correspondait pas à mon niveau. Remboursement reçu en 4 jours, sans aucune question. Service impeccable.",
    rating: 5,
    date: "Il y a 2 mois",
  },
  {
    name: "Thomas R.",
    role: "Lycéen Terminale",
    avatar: "TR",
    content:
      "La garantie est réelle ! J'ai testé par curiosité et effectivement tout s'est passé exactement comme promis. Au final j'ai gardé la formation tellement elle est bien.",
    rating: 5,
    date: "Il y a 1 mois",
  },
  {
    name: "Camille D.",
    role: "Étudiante BTS",
    avatar: "CD",
    content:
      "Processus de remboursement ultra simple. Un email, une réponse en 24h, virement reçu 3 jours après. AcadémIA tient vraiment ses promesses.",
    rating: 5,
    date: "Il y a 3 semaines",
  },
];

const faqItems = [
  {
    question: "Qui peut bénéficier de la garantie remboursement ?",
    answer:
      "Tout étudiant ayant souscrit à une formation AcadémIA Pro peut bénéficier de cette garantie, à condition d'avoir accédé à moins de 50% du contenu total de la formation dans les 30 jours suivant l'achat.",
  },
  {
    question: "Comment calculer les 50% de contenu consulté ?",
    answer:
      "Le pourcentage est calculé automatiquement par notre plateforme en fonction des modules et leçons que vous avez ouverts. Vous pouvez consulter votre progression à tout moment dans votre espace personnel.",
  },
  {
    question: "Quel est le délai exact pour demander un remboursement ?",
    answer:
      "Vous disposez exactement de 30 jours calendaires à partir de la date d'achat pour soumettre votre demande. Passé ce délai, la garantie ne s'applique plus.",
  },
  {
    question: "Dois-je fournir une justification pour ma demande ?",
    answer:
      "Non, absolument aucune justification n'est requise. Votre satisfaction est notre priorité et nous respectons votre décision sans poser de questions.",
  },
  {
    question: "Sur quel compte est effectué le remboursement ?",
    answer:
      "Le remboursement est effectué sur le moyen de paiement utilisé lors de l'achat (carte bancaire, PayPal, virement). Le délai de crédit dépend de votre banque mais ne dépasse généralement pas 5 jours ouvrés.",
  },
  {
    question: "La garantie s'applique-t-elle aux abonnements mensuels ?",
    answer:
      "La garantie s'applique uniquement au premier paiement d'un abonnement ou à un achat unique. Les renouvellements mensuels suivants ne sont pas couverts par la garantie 30 jours.",
  },
  {
    question: "Que se passe-t-il si j'ai utilisé un code promo ?",
    answer:
      "La garantie s'applique pleinement même si vous avez bénéficié d'une réduction. Vous serez remboursé du montant réellement payé.",
  },
];

const steps = [
  {
    step: "01",
    title: "Demande en 1 clic",
    description:
      "Cliquez sur le bouton de remboursement dans votre espace client ou en bas de cette page.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Traitement sous 48h",
    description:
      "Notre équipe vérifie votre éligibilité et confirme votre remboursement par email sous 48 heures.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Virement sous 5 jours",
    description:
      "Le montant intégral est reversé sur votre compte bancaire dans un délai maximum de 5 jours ouvrés.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function GarantiePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isConnected] = useState(true); // Simulate connected user
  const [refundRequested, setRefundRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefundRequest = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setRefundRequested(true);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c8a96e]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#c8a96e]/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(200,169,110,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,169,110,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10">
        {/* ─── HERO SECTION ─── */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge garantie */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-[#c8a96e]/20 blur-xl scale-150" />
                <div className="relative flex flex-col items-center justify-center w-48 h-48 rounded-full border-4 border-[#c8a96e] bg-gradient-to-br from-[#c8a96e]/10 to-[#c8a96e]/5 shadow-[0_0_60px_rgba(200,169,110,0.3)]">
                  <div className="text-[#c8a96e] mb-1">
                    <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-[#c8a96e] font-black text-2xl leading-none">30</span>
                  <span className="text-[#c8a96e] font-bold text-xs uppercase tracking-widest">JOURS</span>
                  <div className="mt-1 px-3 py-0.5 bg-[#c8a96e] rounded-full">
                    <span className="text-[#050508] font-black text-[10px] uppercase tracking-wider">GARANTI</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Big badge banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#c8a96e]/20 via-[#c8a96e]/10 to-[#c8a96e]/20 border border-[#c8a96e]/40 rounded-full px-6 py-3 mb-8 shadow-[0_0_30px_rgba(200,169,110,0.15)]"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a96e] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c8a96e]" />
              </span>
              <span className="text-[#c8a96e] font-bold uppercase tracking-widest text-sm">
                GARANTIE