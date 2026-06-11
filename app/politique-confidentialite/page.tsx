import React from "react";

const PrivacyPolicy: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: "#050508",
    minHeight: "100vh",
    fontFamily: "'Georgia', serif",
    color: "#c8a96e",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#050508",
    borderBottom: "1px solid #c8a96e",
    padding: "40px 0",
    textAlign: "center",
    position: "sticky",
    top: "0",
    zIndex: 100,
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#c8a96e",
    letterSpacing: "4px",
    textTransform: "uppercase",
    margin: "0",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "60px 40px 100px 40px",
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: "38px",
    fontWeight: "300",
    color: "#c8a96e",
    textAlign: "center",
    letterSpacing: "6px",
    textTransform: "uppercase",
    marginBottom: "12px",
    marginTop: "0",
  };

  const subtitleStyle: React.CSSProperties = {
    textAlign: "center",
    color: "rgba(200, 169, 110, 0.6)",
    fontSize: "13px",
    letterSpacing: "2px",
    marginBottom: "70px",
    textTransform: "uppercase",
  };

  const dividerStyle: React.CSSProperties = {
    width: "60px",
    height: "1px",
    backgroundColor: "#c8a96e",
    margin: "0 auto 70px auto",
    opacity: 0.5,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "60px",
  };

  const sectionNumberStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.4)",
    letterSpacing: "4px",
    textTransform: "uppercase",
    marginBottom: "10px",
    display: "block",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "600",
    color: "#c8a96e",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "24px",
    marginTop: "0",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
  };

  const paragraphStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.8)",
    lineHeight: "1.9",
    fontSize: "15px",
    marginBottom: "16px",
    marginTop: "0",
  };

  const tableContainerStyle: React.CSSProperties = {
    overflowX: "auto",
    marginBottom: "24px",
    borderRadius: "4px",
    border: "1px solid rgba(200, 169, 110, 0.2)",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.08)",
    color: "#c8a96e",
    padding: "14px 18px",
    textAlign: "left",
    fontWeight: "600",
    letterSpacing: "1px",
    fontSize: "12px",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 18px",
    color: "rgba(200, 169, 110, 0.75)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
    verticalAlign: "top",
    lineHeight: "1.7",
  };

  const listStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.8)",
    lineHeight: "1.9",
    fontSize: "15px",
    paddingLeft: "20px",
    marginBottom: "16px",
    marginTop: "0",
  };

  const listItemStyle: React.CSSProperties = {
    marginBottom: "8px",
  };

  const highlightBoxStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.05)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderLeft: "3px solid #c8a96e",
    borderRadius: "4px",
    padding: "20px 24px",
    marginBottom: "24px",
  };

  const contactCardStyle: React.CSSProperties = {
    backgroundColor: "rgba(200, 169, 110, 0.04)",
    border: "1px solid rgba(200, 169, 110, 0.25)",
    borderRadius: "6px",
    padding: "28px 32px",
    marginTop: "16px",
  };

  const contactLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "rgba(200, 169, 110, 0.5)",
    marginBottom: "6px",
    display: "block",
  };

  const contactValueStyle: React.CSSProperties = {
    fontSize: "15px",
    color: "#c8a96e",
    marginBottom: "20px",
    display: "block",
  };

  const emailLinkStyle: React.CSSProperties = {
    color: "#c8a96e",
    textDecoration: "none",
    borderBottom: "1px solid rgba(200, 169, 110, 0.4)",
    paddingBottom: "2px",
    transition: "border-color 0.2s",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    color: "#c8a96e",
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: "2px",
    marginRight: "8px",
    marginBottom: "8px",
  };

  const footerStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "40px",
    textAlign: "center",
    backgroundColor: "#050508",
  };

  const footerTextStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.4)",
    fontSize: "12px",
    letterSpacing: "2px",
    margin: "0",
  };

  const updateDateStyle: React.CSSProperties = {
    textAlign: "center",
    color: "rgba(200, 169, 110, 0.4)",
    fontSize: "12px",
    letterSpacing: "2px",
    marginBottom: "70px",
    textTransform: "uppercase",
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <p style={logoTextStyle}>Academia Pro</p>
      </header>

      <main style={mainStyle}>
        <h1 style={pageTitleStyle}>Politique de Confidentialité</h1>
        <p style={subtitleStyle}>Règlement Général sur la Protection des Données</p>
        <div style={dividerStyle}></div>

        <p style={updateDateStyle}>Dernière mise à jour : Janvier 2025</p>

        <div style={highlightBoxStyle}>
          <p style={{ ...paragraphStyle, marginBottom: "0" }}>
            Academia Pro s'engage à protéger vos données personnelles conformément au
            Règlement Général sur la Protection des Données (RGPD) — Règlement (UE) 2016/679 du
            Parlement européen et du Conseil du 27 avril 2016 — ainsi qu'à la loi française
            Informatique et Libertés du 6 janvier 1978 modifiée.
          </p>
        </div>

        {/* Section 1 - Responsable du traitement */}
        <section style={sectionStyle}>
          <span style={sectionNumberStyle}>Article 01</span>
          <h2 style={sectionTitleStyle}>Responsable du Traitement</h2>
          <p style={paragraphStyle}>
            Le responsable du traitement de vos données personnelles est :
          </p>
          <div style={contactCardStyle}>
            <span style={contactLabelStyle}>Société</span>
            <span style={contactValueStyle}>Academia Pro SAS</span>

            <span style={contactLabelStyle}>Siège social</span>
            <span style={contactValueStyle}>12 avenue des Champs-Élysées, 75008 Paris, France</span>

            <span style={contactLabelStyle}>SIRET</span>
            <span style={contactValueStyle}>123 456 789 00012</span>

            <span style={contactLabelStyle}>Délégué à la Protection des Données (DPO)</span>
            <span style={{ ...contactValueStyle, marginBottom: "0" }}>
              <a href="mailto:privacy@academiapro.fr" style={emailLinkStyle}>
                privacy@academiapro.fr
              </a>
            </span>
          </div>
        </section>

        {/* Section 2 - Données collectées */}
        <section style={sectionStyle}>
          <span style={sectionNumberStyle}>Article 02</span>
          <h2 style={sectionTitleStyle}>Données Personnelles Collectées</h2>
          <p style={paragraphStyle}>
            Dans le cadre de nos services, Academia Pro est susceptible de collecter
            les catégories de données personnelles suivantes :
          </p>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Catégorie</th>
                  <th style={thStyle}>Données concernées</th>
                  <th style={thStyle}>Caractère</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Identification</td>
                  <td style={tdStyle}>Nom, prénom, date de naissance, nationalité</td>
                  <td style={tdStyle}><span style={badgeStyle}>Obligatoire</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Contact</td>
                  <td style={tdStyle}>Adresse email, numéro de téléphone, adresse postale</td>
                  <td style={tdStyle}><span style={badgeStyle}>Obligatoire</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Données académiques</td>
                  <td style={tdStyle}>Diplômes, parcours scolaire, bulletins, résultats d'évaluation</td>
                  <td style={tdStyle}><span style={badgeStyle}>Obligatoire</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Données de connexion</td>
                  <td style={tdStyle}>Adresse IP, identifiants, logs d'activité, historique de navigation</td>
                  <td style={tdStyle}><span style={badgeStyle}>Automatique</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Données financières</td>
                  <td style={tdStyle}>Informations de paiement (tokenisées), historique des transactions</td>
                  <td style={tdStyle}><span style={badgeStyle}>Selon service</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Préférences</td>
                  <td style={tdStyle}>Centres d'intérêt, objectifs d'apprentissage, paramètres utilisateur</td>
                  <td style={tdStyle}><span style={badgeStyle}>Facultatif</span></td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, borderBottom: "none" }}>Données sensibles</td>
                  <td style={{ ...tdStyle, borderBottom: "none" }}>Situation de handicap (uniquement avec consentement explicite)</td>
                  <td style={{ ...tdStyle, borderBottom: "none" }}><span style={badgeStyle}>Consentement</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={paragraphStyle}>
            Academia Pro ne collecte pas de données relatives à l'origine raciale ou ethnique,
            aux opinions politiques, aux convictions religieuses ou philosophiques, ni aux données
            génétiques ou biométriques, sauf obligation légale expresse.
          </p>
        </section>

        {/* Section 3 - Finalités */}
        <section style={sectionStyle}>
          <span style={sectionNumberStyle}>Article 03</span>
          <h2 style={sectionTitleStyle}>Finalités du Traitement</h2>
          <p style={paragraphStyle}>
            Vos données personnelles sont traitées pour les finalités suivantes :
          </p>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Finalité</th>
                  <th style={thStyle}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><strong style={{ color: "#c8a96e" }}>Gestion des comptes</strong></td>
                  <td style={tdStyle}>Création, administration et sécurisation des comptes utilisateurs sur la plateforme Academia Pro</td>
                </tr>
                <tr>
                  <td style={tdStyle}><strong style={{ color: "#c8a96e" }}>Fourniture des services</strong></td>
                  <td style={tdStyle}>Accès aux formations, cours en ligne, ressources pédagogiques et outils d'apprentissage</td>
                </tr>
                <tr>
                  <td style={tdStyle}><strong style={{ color: "#c8a96e" }}>Suivi pédagogique</strong></td>
                  <td style={tdStyle}>Évaluation des progrès, personnalisation du parcours d'apprentissage et recommandations adaptées</td>
                </tr>
                <tr>
                  <td style={tdStyle}><strong style={{ color: