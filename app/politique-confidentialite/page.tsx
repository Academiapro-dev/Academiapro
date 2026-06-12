"use client";
import { useState } from "react";

export default function PolitiqueConfidentialite() {
  const [cookiesAcceptes, setCookiesAcceptes] = useState(false);
  const [sectionOuverte, setSectionOuverte] = useState("");

  function toggleSection(section) {
    setSectionOuverte(sectionOuverte === section ? "" : section);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "Georgia, serif", color: "#c8a96e", padding: "0", margin: "0" }}>

      <div style={{ background: "linear-gradient(180deg, #0a0a12 0%, #050508 100%)", borderBottom: "1px solid #c8a96e", padding: "60px 20px 40px 20px", textAlign: "center" }}>
        <div style={{ display: "inline-block", border: "1px solid #c8a96e", padding: "4px 16px", fontSize: "11px", letterSpacing: "4px", color: "#c8a96e", marginBottom: "24px", textTransform: "uppercase" }}>
          Conformité RGPD
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: "300", color: "#ffffff", letterSpacing: "2px", margin: "0 0 16px 0", lineHeight: "1.2" }}>
          Politique de Confidentialité
        </h1>
        <p style={{ color: "#8a7a5a", fontSize: "14px", letterSpacing: "1px", margin: "0 0 8px 0" }}>
          AcademiaPro — Protection de vos données personnelles
        </p>
        <p style={{ color: "#5a5040", fontSize: "12px", margin: "0" }}>
          Dernière mise à jour : 1er janvier 2025 — Version 3.2
        </p>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "60px 20px" }}>

        <div style={{ backgroundColor: "#0d0d18", border: "1px solid #c8a96e", borderLeft: "4px solid #c8a96e", padding: "24px 28px", marginBottom: "48px", borderRadius: "2px" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", lineHeight: "1.8", color: "#c8a96e", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
            Résumé exécutif
          </p>
          <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.9", color: "#a09070" }}>
            AcademiaPro s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679). Cette politique décrit de manière transparente quelles données nous collectons, pourquoi nous les utilisons, comment nous les protégeons et quels droits vous exercez à tout moment sur vos informations.
          </p>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <button
            onClick={() => toggleSection("responsable")}
            style={{ width: "100%", backgroundColor: sectionOuverte === "responsable" ? "#0d0d18" : "#080810", border: "1px solid #c8a96e", color: "#c8a96e", padding: "20px 28px", textAlign: "left", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia, serif", letterSpacing: "1px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background-color 0.2s" }}
          >
            <span>01. Responsable du Traitement</span>
            <span style={{ fontSize: "20px", fontWeight: "300", color: "#c8a96e" }}>
              {sectionOuverte === "responsable" ? "−" : "+"}
            </span>
          </button>
          {sectionOuverte === "responsable" && (
            <div style={{ backgroundColor: "#0a0a14", border: "1px solid #c8a96e", borderTop: "none", padding: "28px", lineHeight: "1.9" }}>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#a09070" }}>
                Le responsable du traitement de vos données personnelles est :
              </p>
              <div style={{ backgroundColor: "#050508", border: "1px solid #2a2520", padding: "20px", borderRadius: "2px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#c8a96e", fontWeight: "600" }}>AcademiaPro SAS</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#7a6a4a" }}>12 Avenue des Lumières, 75008 Paris, France</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#7a6a4a" }}>SIRET : 123 456 789 00012</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#7a6a4a" }}>Email DPO : <span style={{ color: "#c8a96e" }}>privacy@academiapro.fr</span></p>
                <p style={{ margin: "0", fontSize: "13px", color: "#7a6a4a" }}>Téléphone : +33 (0)1 23 45 67 89</p>
              </div>
              <p style={{ margin: "0", fontSize: "13px", color: "#6a5a3a", fontStyle: "italic" }}>
                Notre Délégué à la Protection des Données (DPO) est disponible pour toute question relative au traitement de vos informations personnelles.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <button
            onClick={() => toggleSection("collecte")}
            style={{ width: "100%", backgroundColor: sectionOuverte === "collecte" ? "#0d0d18" : "#080810", border: "1px solid #c8a96e", color: "#c8a96e", padding: "20px 28px", textAlign: "left", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia, serif", letterSpacing: "1px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>02. Données Collectées</span>
            <span style={{ fontSize: "20px", fontWeight: "300", color: "#c8a96e" }}>
              {sectionOuverte === "collecte" ? "−" : "+"}
            </span>
          </button>
          {sectionOuverte === "collecte" && (
            <div style={{ backgroundColor: "#0a0a14", border: "1px solid #c8a96e", borderTop: "none", padding: "28px", lineHeight: "1.9" }}>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#a09070" }}>
                Nous collectons uniquement les données strictement nécessaires à la fourniture de nos services. Voici les catégories de données traitées :
              </p>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#c8a96e", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Données d'identification
                </p>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#7a6a4a", fontSize: "13px", lineHeight: "2" }}>
                  <li>Nom, prénom, titre professionnel</li>
                  <li>Adresse email professionnelle et personnelle</li>
                  <li>Numéro de téléphone</li>
                  <li>Photographie de profil (optionnel)</li>
                </ul>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#c8a96e", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Données de navigation
                </p>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#7a6a4a", fontSize: "13px", lineHeight: "2" }}>
                  <li>Adresse IP et localisation approximative</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées, durée et horodatage des sessions</li>
                  <li>Données de cookies (voir section dédiée)</li>
                </ul>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#c8a96e", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Données transactionnelles
                </p>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#7a6a4a", fontSize: "13px", lineHeight: "2" }}>
                  <li>Historique des achats et abonnements</li>
                  <li>Données de facturation (jamais les numéros de carte complets)</li>
                  <li>Préférences de formation et parcours pédagogiques</li>
                </ul>
              </div>

              <div style={{ backgroundColor: "#050508", border: "1px solid #2a2520", padding: "16px", borderRadius: "2px" }}>
                <p style={{ margin: "0", fontSize: "13px", color: "#6a5a3a", fontStyle: "italic" }}>
                  ⚠️ Nous ne collectons jamais de données sensibles au sens de l'article 9 du RGPD (origines ethniques, convictions religieuses, données de santé, etc.) sans consentement explicite préalable.
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <button
            onClick={() => toggleSection("finalites")}
            style={{ width: "100%", backgroundColor: sectionOuverte === "finalites" ? "#0d0d18" : "#080810", border: "1px solid #c8a96e", color: "#c8a96e", padding: "20px 28px", textAlign: "left", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia, serif", letterSpacing: "1px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>03. Finalités du Traitement</span>
            <span style={{ fontSize: "20px", fontWeight: "300", color: "#c8a96e" }}>
              {sectionOuverte === "finalites" ? "−" : "+"}
            </span>
          </button>
          {sectionOuverte === "finalites" && (
            <div style={{ backgroundColor: "#0a0a14", border: "1px solid #c8a96e", borderTop: "none", padding: "28px", lineHeight: "1.9" }}>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#a09070" }}>
                Chaque traitement de données repose sur une base légale identifiée. Conformément à l'article 6 du RGPD, nous utilisons vos données aux fins suivantes :
              </p>

              <div style={{ display: "grid", gap: "16px" }}>

                <div style={{ backgroundColor: "#050508", border: "1px solid #1a1a28", borderLeft: "3px solid #c8a96e", padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <p style={{ margin: "0", fontSize: "13px", color: "#c8a96e", fontWeight: "600" }}>Exécution du contrat</p>
                    <span style={{ backgroundColor: "#1a2010", border: "1px solid #4a6a20", color: "#8aba40", fontSize: "10px", padding: "2px 8px", letterSpacing: "1px" }}>Obligatoire</span>
                  </div>
                  <p style={{ margin: "0", fontSize: "13px", color: "#6a5a3a" }}>Création et gestion de votre compte, accès aux formations, délivrance des certifications, support technique et pédagogique.</p>
                </div>

                <div style={{ backgroundColor: "#050508", border: "1px solid #1a1a28", borderLeft: "3px solid #c8a96e", padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <p style={{ margin: "0", fontSize: "13px", color: "#c8a96e", fontWeight: "600" }}>Obligation légale</p>
                    <span style={{ backgroundColor: "#1a2010", border: "1px solid #4a6a20", color: "#8aba40", fontSize: "10px", padding: "2px 8px", letterSpacing: "1px" }}>Obligatoire</span>
                  </div>
                  <p style={{ margin: "0", fontSize: "13px", color: "#6a5a3a" }}>Comptabilité, facturation, déclarations fiscales, conservation des justificatifs légaux pendant 10 ans.</p>
                </div>

                <div style={{ backgroundColor: "#050508", border: "1px solid #1a1a28", borderLeft: "3px solid #8a6a2a", padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <p style={{ margin: "0", fontSize: "13px", color: "#c8a96e", fontWeight: "600" }}>Intérêt légitime</p>
                    <span style={{ backgroundColor: "#201a10", border: "1px solid #6a4a10", color: "#c8802a", fontSize: "10px", padding: "2px 8px", letterSpacing: "1px" }}>Révocable</span>
                  </div>
                  <p style={{ margin: "0", fontSize: "13px", color: "#6a5a3a" }}>Amélioration de nos services, analyses statistiques anonymisées, sécurisation de la plateforme, prévention de la fraude.</p>
                </div>

                <div style={{ backgroundColor: "#050