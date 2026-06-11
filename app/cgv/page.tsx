import React from "react";

const CGV: React.FC = () => {
  const styles = {
    page: {
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Georgia', serif",
      color: "#c8a96e",
      padding: "0",
      margin: "0",
    },
    header: {
      backgroundColor: "#050508",
      borderBottom: "2px solid #c8a96e",
      padding: "40px 60px",
      textAlign: "center" as const,
    },
    headerTitle: {
      fontSize: "32px",
      fontWeight: "700" as const,
      color: "#c8a96e",
      letterSpacing: "4px",
      textTransform: "uppercase" as const,
      margin: "0 0 10px 0",
    },
    headerSubtitle: {
      fontSize: "13px",
      color: "#8a6e3e",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      margin: "0",
    },
    goldDivider: {
      width: "80px",
      height: "2px",
      backgroundColor: "#c8a96e",
      margin: "20px auto",
    },
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "60px 40px",
    },
    updateBadge: {
      display: "inline-block",
      backgroundColor: "rgba(200,169,110,0.1)",
      border: "1px solid #c8a96e",
      color: "#c8a96e",
      fontSize: "12px",
      letterSpacing: "2px",
      padding: "6px 16px",
      marginBottom: "50px",
      textTransform: "uppercase" as const,
    },
    section: {
      marginBottom: "50px",
      borderLeft: "3px solid #c8a96e",
      paddingLeft: "28px",
    },
    sectionNumber: {
      fontSize: "11px",
      color: "#8a6e3e",
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
      marginBottom: "8px",
      display: "block",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "700" as const,
      color: "#c8a96e",
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      margin: "0 0 20px 0",
      borderBottom: "1px solid rgba(200,169,110,0.2)",
      paddingBottom: "12px",
    },
    paragraph: {
      fontSize: "15px",
      lineHeight: "1.9",
      color: "#b8956a",
      margin: "0 0 16px 0",
    },
    strong: {
      color: "#c8a96e",
      fontWeight: "700" as const,
    },
    infoBox: {
      backgroundColor: "rgba(200,169,110,0.06)",
      border: "1px solid rgba(200,169,110,0.25)",
      padding: "24px 28px",
      marginBottom: "20px",
    },
    infoBoxTitle: {
      fontSize: "13px",
      color: "#c8a96e",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      marginBottom: "14px",
      fontWeight: "700" as const,
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "8px 0",
      borderBottom: "1px solid rgba(200,169,110,0.1)",
    },
    infoLabel: {
      fontSize: "13px",
      color: "#8a6e3e",
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      minWidth: "180px",
    },
    infoValue: {
      fontSize: "14px",
      color: "#c8a96e",
      textAlign: "right" as const,
      flex: "1",
    },
    warningBox: {
      backgroundColor: "rgba(200,169,110,0.08)",
      border: "1px solid rgba(200,169,110,0.4)",
      padding: "20px 24px",
      marginBottom: "20px",
      borderLeft: "4px solid #c8a96e",
    },
    list: {
      margin: "12px 0",
      paddingLeft: "0",
      listStyle: "none",
    },
    listItem: {
      fontSize: "15px",
      lineHeight: "1.8",
      color: "#b8956a",
      padding: "5px 0 5px 20px",
      position: "relative" as const,
    },
    bulletDot: {
      position: "absolute" as const,
      left: "0",
      top: "10px",
      width: "6px",
      height: "6px",
      backgroundColor: "#c8a96e",
      borderRadius: "50%",
    },
    tableContainer: {
      overflowX: "auto" as const,
      marginBottom: "20px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
    },
    th: {
      backgroundColor: "rgba(200,169,110,0.15)",
      color: "#c8a96e",
      fontSize: "12px",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      padding: "14px 16px",
      textAlign: "left" as const,
      borderBottom: "2px solid rgba(200,169,110,0.3)",
    },
    td: {
      fontSize: "14px",
      color: "#b8956a",
      padding: "12px 16px",
      borderBottom: "1px solid rgba(200,169,110,0.1)",
      verticalAlign: "top" as const,
    },
    tdHighlight: {
      fontSize: "14px",
      color: "#c8a96e",
      padding: "12px 16px",
      borderBottom: "1px solid rgba(200,169,110,0.1)",
      verticalAlign: "top" as const,
      fontWeight: "700" as const,
    },
    link: {
      color: "#c8a96e",
      textDecoration: "underline",
    },
    contactBox: {
      backgroundColor: "rgba(200,169,110,0.06)",
      border: "1px solid #c8a96e",
      padding: "30px",
      textAlign: "center" as const,
      marginTop: "20px",
    },
    contactTitle: {
      fontSize: "16px",
      color: "#c8a96e",
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
      marginBottom: "16px",
      fontWeight: "700" as const,
    },
    contactEmail: {
      fontSize: "18px",
      color: "#c8a96e",
      fontWeight: "700" as const,
      letterSpacing: "1px",
    },
    footer: {
      backgroundColor: "#050508",
      borderTop: "1px solid rgba(200,169,110,0.3)",
      padding: "30px 40px",
      textAlign: "center" as const,
      marginTop: "60px",
    },
    footerText: {
      fontSize: "12px",
      color: "#5a4a2e",
      letterSpacing: "1px",
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <p style={styles.headerSubtitle}>Academia Pro</p>
        <div style={styles.goldDivider} />
        <h1 style={styles.headerTitle}>Conditions Générales de Vente</h1>
        <div style={styles.goldDivider} />
        <p style={styles.headerSubtitle}>Document contractuel — Droit français</p>
      </header>

      <div style={styles.container}>
        <span style={styles.updateBadge}>Dernière mise à jour : 1er janvier 2025</span>

        {/* ARTICLE 1 - IDENTIFICATION DU VENDEUR */}
        <div style={styles.section}>
          <span style={styles.sectionNumber}>Article 01</span>
          <h2 style={styles.sectionTitle}>Identification du Vendeur</h2>
          <p style={styles.paragraph}>
            Les présentes Conditions Générales de Vente (ci-après "CGV") régissent l'ensemble des transactions
            commerciales conclues entre la société Academia Pro et ses clients, conformément aux articles L.111-1
            et suivants du Code de la consommation ainsi qu'aux articles 1369-1 et suivants du Code civil.
          </p>
          <div style={styles.infoBox}>
            <p style={styles.infoBoxTitle}>Informations légales du vendeur</p>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Dénomination sociale</span>
              <span style={styles.infoValue}>Academia Pro</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Forme juridique</span>
              <span style={styles.infoValue}>Société par Actions Simplifiée (SAS)</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Capital social</span>
              <span style={styles.infoValue}>10 000 euros</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Siège social</span>
              <span style={styles.infoValue}>75000 Paris, France</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>SIREN</span>
              <span style={styles.infoValue}>En cours d'immatriculation</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Numéro TVA intracommunautaire</span>
              <span style={styles.infoValue}>FR XX XXXXXXXXX</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email de contact</span>
              <span style={styles.infoValue}>contact@academiapro.fr</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Activité principale</span>
              <span style={styles.infoValue}>Formation professionnelle et édition de contenus éducatifs</span>
            </div>
          </div>
          <p style={styles.paragraph}>
            Le présent document constitue le contrat conclu entre Academia Pro et tout acheteur (ci-après "le Client")
            souhaitant procéder à un achat via le site internet academiapro.fr. Toute commande implique l'acceptation
            pleine et entière des présentes CGV, qui prévalent sur tout autre document du Client.
          </p>
        </div>

        {/* ARTICLE 2 - CHAMP D'APPLICATION */}
        <div style={styles.section}>
          <span style={styles.sectionNumber}>Article 02</span>
          <h2 style={styles.sectionTitle}>Champ d'Application et Acceptation</h2>
          <p style={styles.paragraph}>
            Les présentes CGV s'appliquent à toutes les ventes de produits et services proposés par Academia Pro,
            notamment les formations en ligne, les programmes d'accompagnement, les ressources pédagogiques numériques,
            et tout autre produit ou service commercialisé sur la plateforme.
          </p>
          <p style={styles.paragraph}>
            En validant sa commande, le Client reconnaît avoir pris connaissance des présentes CGV et les accepter
            sans réserve. Cette acceptation est formalisée par le double clic prévu à l'article 1127-1 du Code civil.
            Academia Pro se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables sont
            celles en vigueur à la date de la commande.
          </p>
          <p style={styles.paragraph}>
            Les présentes CGV s'appliquent à tout Client consommateur au sens de l'article préliminaire du Code de
            la consommation, résidant en France métropolitaine, dans les DOM-TOM ainsi que dans l'Union Européenne.
            Pour les Clients professionnels, des Conditions Générales de Vente spécifiques peuvent être négociées
            sur demande auprès de contact@academiapro.fr.
          </p>
        </div>

        {/* ARTICLE 3 - PRODUITS ET SERVICES */}
        <div style={styles.section}>
          <span style={styles.sectionNumber}>Article 03</span>
          <h2 style={styles.sectionTitle}>Description des Produits et Services</h2>
          <p style={styles.paragraph}>
            Academia Pro propose les catégories de produits et services suivantes, dont les caractéristiques
            essentielles sont décrites sur chaque fiche produit conformément à l'article L.111-1 du Code de la
            consommation :
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.bulletDot} />
              <span style={styles.strong}>Formations en ligne (e-learning) :</span> accès à des contenus pédagogiques
              vidéo, audio, textuels, disponibles via un espace membre sécurisé. L'accès est personnel et incessible.
            </li>
            <li style={styles.listItem}>
              <span style={styles.bulletDot} />
              <span style={styles.strong}>Programmes d'accompagnement :</span> coaching individuel ou collectif,
              sessions en visioconférence, suivi personnalisé sur une durée déterminée.
            </li>
            <li style={styles.listItem}>
              <span style={styles.bulletDot} />
              <span style={styles.strong}>Ressources numériques :</span> ebooks, guides pratiques, templates,
              fichiers téléchargeables à usage personnel.
            </li>
            <li style={styles.listItem}>
              <span style={styles.bulletDot} />
              <span style={styles.strong}>Abonnements :</span> accès récurrent à des contenus mis à jour
              régulièrement, facturés mensuellement ou annuellement.
            </li>
          </ul>
          <p style={styles.paragraph}>
            Academia Pro s'engage à présenter ses produits avec la plus grande exactitude possible. Toutefois,
            si des erreurs ou omissions se produisent dans la présentation, elles ne sauraient engager la
            responsabilité de Academia Pro.
          </p>
        </div>

        {/* ARTICLE 4 - PRIX */}
        <div style={styles.section}>
          <span style={styles.sectionNumber}>Article 04</span>
          <h2 style={styles.sectionTitle}>Prix et Modalités de Paiement