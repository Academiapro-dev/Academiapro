"use client";
import { useState } from "react";

export default function FAQPage() {
  const [openItem, setOpenItem] = useState(null);

  const categories = [
    {
      id: "formations",
      label: "Formations",
      icon: "🎓",
      questions: [
        {
          id: "f1",
          question: "Quels types de formations proposez-vous ?",
          answer: "Nous proposons des formations en coaching sportif, nutrition, préparation mentale et développement personnel. Chaque programme est conçu pour répondre à vos objectifs spécifiques, que vous soyez débutant ou athlète confirmé."
        },
        {
          id: "f2",
          question: "Quelle est la durée des formations ?",
          answer: "Les formations varient de 4 semaines à 6 mois selon le programme choisi. Nos formations intensives durent généralement 8 semaines avec des sessions quotidiennes, tandis que nos programmes longue durée s'étalent sur 3 à 6 mois."
        },
        {
          id: "f3",
          question: "Les formations sont-elles certifiantes ?",
          answer: "Oui, toutes nos formations délivrent une attestation de réussite reconnue par nos partenaires professionnels. Certains programmes donnent accès à des certifications officielles selon votre domaine de spécialisation."
        }
      ]
    },
    {
      id: "seances",
      label: "Séances",
      icon: "⚡",
      questions: [
        {
          id: "s1",
          question: "Comment se déroule une séance individuelle ?",
          answer: "Chaque séance individuelle commence par un bilan de votre état physique et mental du jour. Nous adaptons ensuite le programme en temps réel selon vos capacités. La séance dure entre 60 et 90 minutes et se termine par un débriefing personnalisé."
        },
        {
          id: "s2",
          question: "Peut-on faire des séances en groupe ?",
          answer: "Absolument. Nous organisons des séances en petit groupe de 4 à 8 personnes pour maintenir un suivi personnalisé tout en bénéficiant de la dynamique collective. Les séances de groupe sont idéales pour booster la motivation et partager des expériences."
        },
        {
          id: "s3",
          question: "Les séances sont-elles disponibles en ligne ?",
          answer: "Oui, nous proposons des séances 100% en ligne via visioconférence. Ces séances en ligne offrent la même qualité de suivi qu'en présentiel avec la flexibilité de vous entraîner depuis chez vous ou n'importe où dans le monde."
        },
        {
          id: "s4",
          question: "Combien de séances par semaine recommandez-vous ?",
          answer: "Pour des résultats optimaux, nous recommandons 3 à 4 séances par semaine pour les débutants et 5 à 6 séances pour les profils avancés. Cependant, tout dépend de vos objectifs, de votre emploi du temps et de votre niveau de récupération."
        }
      ]
    },
    {
      id: "packs",
      label: "Packs",
      icon: "🏆",
      questions: [
        {
          id: "p1",
          question: "Quels packs sont disponibles ?",
          answer: "Nous proposons trois packs principaux : le Pack Découverte (5 séances), le Pack Essentiel (10 séances + bilan mensuel) et le Pack Premium (20 séances + suivi nutritionnel + accès illimité aux formations en ligne). Chaque pack peut être personnalisé selon vos besoins."
        },
        {
          id: "p2",
          question: "Les packs ont-ils une date d'expiration ?",
          answer: "Oui, les packs ont une validité définie : 2 mois pour le Pack Découverte, 4 mois pour le Pack Essentiel et 6 mois pour le Pack Premium. En cas de blessure ou d'empêchement majeur, nous pouvons prolonger la validité sur présentation d'un justificatif."
        },
        {
          id: "p3",
          question: "Peut-on partager un pack avec quelqu'un d'autre ?",
          answer: "Les packs individuels sont nominatifs et ne peuvent pas être partagés. Cependant, nous proposons des packs duo et familiaux spécialement conçus pour être utilisés à deux ou en famille avec des tarifs avantageux."
        }
      ]
    },
    {
      id: "technique",
      label: "Technique",
      icon: "🔧",
      questions: [
        {
          id: "t1",
          question: "Quel équipement est nécessaire pour les séances en ligne ?",
          answer: "Pour les séances en ligne, vous avez besoin d'une connexion internet stable, d'un ordinateur, tablette ou smartphone avec caméra et micro, et d'un espace suffisant pour vous exercer. Pour certaines séances, un tapis de sport, des haltères légers ou des élastiques de résistance peuvent être utiles."
        },
        {
          id: "t2",
          question: "Quelle plateforme utilisez-vous pour les séances virtuelles ?",
          answer: "Nous utilisons Zoom et Google Meet pour les séances en visioconférence. Un lien de connexion vous est envoyé par email 24 heures avant chaque séance. Notre application mobile propriétaire est également disponible pour accéder à vos programmes et suivre vos progrès."
        },
        {
          id: "t3",
          question: "Comment accéder à mon espace personnel ?",
          answer: "Votre espace personnel est accessible depuis notre site web ou notre application mobile. Vous y trouverez votre planning de séances, vos programmes d'entraînement, vos statistiques de progression, les ressources de vos formations et l'historique de vos paiements."
        }
      ]
    },
    {
      id: "paiement",
      label: "Paiement",
      icon: "💳",
      questions: [
        {
          id: "pay1",
          question: "Quels modes de paiement acceptez-vous ?",
          answer: "Nous acceptons les paiements par carte bancaire (Visa, Mastercard, American Express), virement bancaire, PayPal et Apple Pay / Google Pay. Tous les paiements en ligne sont sécurisés via un protocole SSL et traités par des prestataires certifiés PCI DSS."
        },
        {
          id: "pay2",
          question: "Le paiement en plusieurs fois est-il possible ?",
          answer: "Oui, nous proposons le paiement en 3 ou 6 fois sans frais pour tous les packs et formations d'un montant supérieur à 200€. Il vous suffit de sélectionner cette option lors du paiement. Un accord de paiement échelonné sera établi et signé électroniquement."
        },
        {
          id: "pay3",
          question: "Quelle est votre politique de remboursement ?",
          answer: "Nous offrons un remboursement intégral dans les 14 jours suivant l'achat si aucune séance n'a été utilisée. Au-delà, les séances non utilisées peuvent être remboursées au prorata. Les formations numériques sont remboursables dans les 7 jours si moins de 20% du contenu a été consulté."
        },
        {
          id: "pay4",
          question: "Puis-je bénéficier de financement ou d'aides ?",
          answer: "Certaines de nos formations peuvent être éligibles au CPF (Compte Personnel de Formation) ou à des dispositifs de financement OPCO selon votre statut professionnel. Contactez-nous pour vérifier votre éligibilité et nous vous accompagnerons dans les démarches administratives."
        }
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState("formations");

  const currentCategory = categories.find(function(cat) { return cat.id === activeCategory; });

  function handleToggle(id) {
    setOpenItem(openItem === id ? null : id);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#f0e6d3", paddingBottom: "80px" }}>

      <div style={{ background: "linear-gradient(135deg, #0d0d14 0%, #1a1508 50%, #050508 100%)", borderBottom: "1px solid #c8a96e33", paddingTop: "80px", paddingBottom: "60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", width: "300px", height: "300px", background: "radial-gradient(circle, #c8a96e15 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}></div>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg, #c8a96e22, #c8a96e11)", border: "1px solid #c8a96e44", borderRadius: "30px", padding: "6px 20px", fontSize: "12px", letterSpacing: "3px", color: "#c8a96e", textTransform: "uppercase", marginBottom: "24px" }}>
          Centre d'aide
        </div>
        <h1 style={{ fontSize: "52px", fontWeight: "800", margin: "0 0 16px 0", background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 50%, #e8c98e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: "1.1" }}>
          Questions Fréquentes
        </h1>
        <p style={{ fontSize: "18px", color: "#9a8a7a", maxWidth: "540px", margin: "0 auto", lineHeight: "1.7" }}>
          Retrouvez toutes les réponses à vos questions et commencez votre transformation en toute confiance
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>

        <div style={{ display: "flex", gap: "10px", marginTop: "48px", marginBottom: "40px", overflowX: "auto", paddingBottom: "8px" }}>
          {categories.map(function(cat) {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={function() { setActiveCategory(cat.id); setOpenItem(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 22px",
                  borderRadius: "50px",
                  border: isActive ? "1px solid #c8a96e" : "1px solid #2a2520",
                  background: isActive ? "linear-gradient(135deg, #c8a96e22, #c8a96e11)" : "#0d0d11",
                  color: isActive ? "#c8a96e" : "#6a5a4a",
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.25s ease",
                  letterSpacing: "0.5px"
                }}
              >
                <span style={{ fontSize: "16px" }}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>{currentCategory.icon}</span>
          <div>
            <h2 style={{ margin: "0", fontSize: "24px", fontWeight: "700", color: "#f0e6d3" }}>{currentCategory.label}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6a5a4a" }}>{currentCategory.questions.length} questions</p>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, #c8a96e33, transparent)", marginBottom: "32px" }}></div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentCategory.questions.map(function(item, index) {
            const isOpen = openItem === item.id;
            return (
              <div
                key={item.id}
                style={{
                  border: isOpen ? "1px solid #c8a96e55" : "1px solid #1e1a16",
                  borderRadius: "16px",
                  background: isOpen ? "linear-gradient(135deg, #0f0e0a, #12100a)" : "#09090d",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  boxShadow: isOpen ? "0 8px 32px #c8a96e10" : "none"
                }}
              >
                <button
                  onClick={function() { handleToggle(item.id); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "24px 28px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1" }}>
                    <div style={{
                      minWidth: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isOpen ? "linear-gradient(135deg, #c8a96e33, #c8a96e11)" : "#141418",
                      border: isOpen ? "1px solid #c8a96e44" : "1px solid #2a2520",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: isOpen ? "#c8a96e" : "#4a3a2a"
                    }}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: isOpen ? "#f0e6d3" : "#b0a090", lineHeight: "1.4" }}>
                      {item.question}
                    </span>
                  </div>
                  <div style={{
                    minWidth