export default async function VerificationCertificat({ params }: { params: { numero: string } }) {
  const numero = params.numero;

  type CertificatData = {
    valide: boolean;
    nomApprenant?: string;
    formation?: string;
    date?: string;
    mention?: string;
  };

  async function getCertificat(num: string): Promise<CertificatData> {
    const certificatsValides: Record<string, CertificatData> = {
      "ACA-2024-001": {
        valide: true,
        nomApprenant: "Marie Dupont",
        formation: "Intelligence Artificielle Avancée",
        date: "15 mars 2024",
        mention: "Très Bien",
      },
      "ACA-2024-002": {
        valide: true,
        nomApprenant: "Jean-Pierre Martin",
        formation: "Machine Learning & Data Science",
        date: "22 avril 2024",
        mention: "Excellent",
      },
      "ACA-2024-003": {
        valide: true,
        nomApprenant: "Sophie Lefebvre",
        formation: "Prompt Engineering Professionnel",
        date: "10 mai 2024",
        mention: "Bien",
      },
    };

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (certificatsValides[num]) {
      return certificatsValides[num];
    }

    return { valide: false };
  }

  const certificat = await getCertificat(numero);

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      padding: "40px 20px",
    },
    header: {
      textAlign: "center" as const,
      marginBottom: "50px",
      width: "100%",
      maxWidth: "800px",
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    logoIcon: {
      width: "48px",
      height: "48px",
      background: "linear-gradient(135deg, #c8a96e, #e8d5a3)",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
    },
    logoText: {
      fontSize: "28px",
      fontWeight: "800" as const,
      color: "#c8a96e",
      letterSpacing: "0.02em",
    },
    logoPro: {
      fontSize: "12px",
      color: "#e8d5a3",
      background: "rgba(200,169,110,0.15)",
      border: "1px solid rgba(200,169,110,0.3)",
      padding: "2px 8px",
      borderRadius: "20px",
      verticalAlign: "super",
      marginLeft: "4px",
    },
    headerSubtitle: {
      color: "rgba(200,169,110,0.6)",
      fontSize: "14px",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
    },
    divider: {
      width: "80px",
      height: "2px",
      background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
      margin: "20px auto",
    },
    card: {
      width: "100%",
      maxWidth: "720px",
      background: "linear-gradient(145deg, #0d0d14, #0a0a10)",
      border: "1px solid rgba(200,169,110,0.2)",
      borderRadius: "24px",
      padding: "48px",
      boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(200,169,110,0.05)",
      position: "relative" as const,
      overflow: "hidden" as const,
    },
    cardGlow: {
      position: "absolute" as const,
      top: "-100px",
      right: "-100px",
      width: "300px",
      height: "300px",
      background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)",
      pointerEvents: "none" as const,
    },
    badgeValide: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(34,197,94,0.1)",
      border: "1px solid rgba(34,197,94,0.3)",
      color: "#22c55e",
      padding: "8px 20px",
      borderRadius: "50px",
      fontSize: "13px",
      fontWeight: "600" as const,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      marginBottom: "32px",
    },
    badgeInvalide: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#ef4444",
      padding: "8px 20px",
      borderRadius: "50px",
      fontSize: "13px",
      fontWeight: "600" as const,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
      marginBottom: "32px",
    },
    dot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      display: "inline-block",
    },
    dotGreen: {
      backgroundColor: "#22c55e",
      boxShadow: "0 0 8px #22c55e",
    },
    dotRed: {
      backgroundColor: "#ef4444",
      boxShadow: "0 0 8px #ef4444",
    },
    certificatTitle: {
      fontSize: "32px",
      fontWeight: "800" as const,
      color: "#ffffff",
      marginBottom: "8px",
      lineHeight: "1.2",
    },
    certificatSubtitle: {
      color: "rgba(200,169,110,0.7)",
      fontSize: "15px",
      marginBottom: "40px",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "32px",
    },
    infoCard: {
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(200,169,110,0.1)",
      borderRadius: "14px",
      padding: "20px 24px",
    },
    infoLabel: {
      color: "rgba(200,169,110,0.6)",
      fontSize: "11px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      marginBottom: "8px",
      fontWeight: "600" as const,
    },
    infoValue: {
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "600" as const,
      lineHeight: "1.4",
    },
    mentionValue: {
      color: "#c8a96e",
      fontSize: "18px",
      fontWeight: "700" as const,
    },
    numeroSection: {
      background: "rgba(200,169,110,0.05)",
      border: "1px solid rgba(200,169,110,0.15)",
      borderRadius: "12px",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
    },
    numeroLabel: {
      color: "rgba(200,169,110,0.6)",
      fontSize: "12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
    },
    numeroValue: {
      color: "#c8a96e",
      fontSize: "15px",
      fontWeight: "700" as const,
      letterSpacing: "0.05em",
      fontFamily: "monospace",
    },
    sealContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "32px",
      paddingTop: "24px",
      borderTop: "1px solid rgba(200,169,110,0.1)",
    },
    seal: {
      width: "52px",
      height: "52px",
      background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
      border: "2px solid rgba(200,169,110,0.4)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
    },
    sealText: {
      flex: 1,
    },
    sealTitle: {
      color: "#c8a96e",
      fontSize: "13px",
      fontWeight: "700" as const,
      marginBottom: "2px",
    },
    sealDesc: {
      color: "rgba(255,255,255,0.4)",
      fontSize: "11px",
    },
    invalidCard: {
      textAlign: "center" as const,
      padding: "20px 0",
    },
    invalidIcon: {
      fontSize: "64px",
      marginBottom: "24px",
      display: "block",
    },
    invalidTitle: {
      fontSize: "28px",
      fontWeight: "800" as const,
      color: "#ef4444",
      marginBottom: "12px",
    },
    invalidDesc: {
      color: "rgba(255,255,255,0.5)",
      fontSize: "15px",
      lineHeight: "1.7",
      marginBottom: "8px",
    },
    invalidNumero: {
      display: "inline-block",
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.2)",
      color: "rgba(239,68,68,0.8)",
      padding: "6px 16px",
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "13px",
      marginTop: "16px",
      marginBottom: "24px",
    },
    warningBox: {
      background: "rgba(239,68,68,0.05)",
      border: "1px solid rgba(239,68,68,0.15)",
      borderRadius: "12px",
      padding: "16px 20px",
      marginTop: "16px",
    },
    warningText: {
      color: "rgba(239,68,68,0.7)",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    employeurSection: {
      width: "100%",
      maxWidth: "720px",
      marginTop: "40px",
    },
    employeurCard: {
      background: "linear-gradient(145deg, #0d0d14, #0a0a10)",
      border: "1px solid rgba(200,169,110,0.15)",
      borderRadius: "20px",
      padding: "40px 48px",
      display: "flex",
      alignItems: "flex-start",
      gap: "24px",
    },
    employeurIcon: {
      width: "56px",
      height: "56px",
      background: "rgba(200,169,110,0.1)",
      border: "1px solid rgba(200,169,110,0.2)",
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "26px",
      flexShrink: 0,
    },
    employeurContent: {
      flex: 1,
    },
    employeurTitle: {
      color: "#c8a96e",
      fontSize: "11px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      fontWeight: "700" as const,
      marginBottom: "8px",
    },
    employeurHeading: {
      color: "#ffffff",
      fontSize: "20px",
      fontWeight: "700" as const,
      marginBottom: "12px",
    },
    employeurText: {
      color: "rgba(255,255,255,0.45)",
      fontSize: "14px",
      lineHeight: "1.7",
      marginBottom: "20px",
    },
    link: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "linear-gradient(135deg, #c8a96e, #a8894e)",
      color: "#050508",
      padding: "11px 24px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "700" as const,
      textDecoration: "none",
      letterSpacing: "0.02em",
    },
    footer: {
      marginTop: "48px",
      textAlign: "center" as const,
      color: "rgba(255,255,255,0.2)",
      fontSize: "12px",
      lineHeight: "1.8",
    },
    footerGold: {
      color: "rgba(200,169,110,0.4)",
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <span>🎓</span>
          </div>
          <div>
            <span style={styles.logoText}>
              AcadémIA
              <span style={styles.logoPro}>PRO</span>
            </span>
          </div>
        </div>
        <p style={styles.headerSubtitle}>Système de vérification des certifications</p>
        <div style={styles.divider}></div>
      </header>

      <main style={{ width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
        <div style={styles.card}>
          <div style={styles.cardGlow}></div>

          {certificat.valide ? (
            <div>
              <div style={styles.badgeValide}>
                <span style={{ ...styles.dot, ...styles.dotGreen }}></span>
                Certificat Authentique
              </div>

              <h1 style={styles.certificatTitle}>Certification Vérifiée</h1>
              <p style={styles.certificatSubtitle}>
                Ce certificat a été délivré par AcadémIA Pro et son authenticité est confirmée.
              </p>

              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Titulaire du