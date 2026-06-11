export default async function VerifierPage({ params }: { params: { numero: string } }) {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: certificat, error } = await supabase
    .from("certificats")
    .select("*")
    .eq("numero", params.numero)
    .single();

  const trouve = !error && certificat !== null;

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#e8e0d0",
      padding: "0",
      margin: "0",
    } as React.CSSProperties,

    header: {
      borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
      padding: "24px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(200, 169, 110, 0.03)",
    } as React.CSSProperties,

    logoZone: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    } as React.CSSProperties,

    logoIcon: {
      width: "42px",
      height: "42px",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      fontWeight: "800",
      color: "#050508",
    } as React.CSSProperties,

    logoText: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#c8a96e",
      letterSpacing: "-0.3px",
    } as React.CSSProperties,

    logoSub: {
      fontSize: "11px",
      color: "rgba(200, 169, 110, 0.6)",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      marginTop: "2px",
    } as React.CSSProperties,

    headerRight: {
      fontSize: "13px",
      color: "rgba(200, 169, 110, 0.5)",
      letterSpacing: "1px",
    } as React.CSSProperties,

    main: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "60px 24px",
    } as React.CSSProperties,

    verificationLabel: {
      fontSize: "12px",
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
      color: "rgba(200, 169, 110, 0.5)",
      textAlign: "center" as const,
      marginBottom: "16px",
    } as React.CSSProperties,

    title: {
      fontSize: "32px",
      fontWeight: "700",
      textAlign: "center" as const,
      color: "#c8a96e",
      marginBottom: "8px",
      letterSpacing: "-0.5px",
    } as React.CSSProperties,

    numeroRef: {
      fontSize: "14px",
      textAlign: "center" as const,
      color: "rgba(200, 169, 110, 0.4)",
      marginBottom: "48px",
      fontFamily: "monospace",
      letterSpacing: "1px",
    } as React.CSSProperties,

    cardWrapper: {
      position: "relative" as const,
      marginBottom: "40px",
    } as React.CSSProperties,

    cardGlow: {
      position: "absolute" as const,
      top: "-1px",
      left: "-1px",
      right: "-1px",
      bottom: "-1px",
      borderRadius: "17px",
      background: trouve
        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.1) 100%)"
        : "linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(185, 28, 28, 0.1) 100%)",
      zIndex: 0,
    } as React.CSSProperties,

    card: {
      position: "relative" as const,
      zIndex: 1,
      backgroundColor: "#0d0d14",
      borderRadius: "16px",
      border: trouve
        ? "1px solid rgba(34, 197, 94, 0.3)"
        : "1px solid rgba(239, 68, 68, 0.3)",
      padding: "40px",
      overflow: "hidden" as const,
    } as React.CSSProperties,

    cardTopStripe: {
      position: "absolute" as const,
      top: "0",
      left: "0",
      right: "0",
      height: "3px",
      background: trouve
        ? "linear-gradient(90deg, #22c55e, #16a34a, #22c55e)"
        : "linear-gradient(90deg, #ef4444, #b91c1c, #ef4444)",
    } as React.CSSProperties,

    badgeRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "32px",
    } as React.CSSProperties,

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 24px",
      borderRadius: "50px",
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      backgroundColor: trouve
        ? "rgba(34, 197, 94, 0.12)"
        : "rgba(239, 68, 68, 0.12)",
      border: trouve
        ? "1px solid rgba(34, 197, 94, 0.5)"
        : "1px solid rgba(239, 68, 68, 0.5)",
      color: trouve ? "#4ade80" : "#f87171",
    } as React.CSSProperties,

    badgeDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: trouve ? "#22c55e" : "#ef4444",
      boxShadow: trouve
        ? "0 0 8px #22c55e"
        : "0 0 8px #ef4444",
    } as React.CSSProperties,

    checkIcon: {
      fontSize: "18px",
    } as React.CSSProperties,

    divider: {
      border: "none",
      borderTop: "1px solid rgba(200, 169, 110, 0.08)",
      margin: "28px 0",
    } as React.CSSProperties,

    infoGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    } as React.CSSProperties,

    infoBlock: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "6px",
    } as React.CSSProperties,

    infoBlockFull: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "6px",
      gridColumn: "1 / -1",
    } as React.CSSProperties,

    infoLabel: {
      fontSize: "11px",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      color: "rgba(200, 169, 110, 0.45)",
      fontWeight: "600",
    } as React.CSSProperties,

    infoValue: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#f0e8d8",
      letterSpacing: "-0.2px",
    } as React.CSSProperties,

    infoValueSm: {
      fontSize: "15px",
      fontWeight: "500",
      color: "#e0d8c8",
    } as React.CSSProperties,

    mentionBadge: {
      display: "inline-block",
      padding: "4px 14px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "1px",
      backgroundColor: "rgba(200, 169, 110, 0.12)",
      border: "1px solid rgba(200, 169, 110, 0.3)",
      color: "#c8a96e",
    } as React.CSSProperties,

    notFoundContent: {
      textAlign: "center" as const,
      padding: "20px 0",
    } as React.CSSProperties,

    notFoundTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#f87171",
      marginBottom: "12px",
    } as React.CSSProperties,

    notFoundText: {
      fontSize: "15px",
      color: "rgba(232, 224, 208, 0.5)",
      lineHeight: "1.7",
      maxWidth: "420px",
      margin: "0 auto",
    } as React.CSSProperties,

    watermark: {
      position: "absolute" as const,
      right: "32px",
      bottom: "24px",
      fontSize: "80px",
      opacity: 0.03,
      userSelect: "none" as const,
      fontWeight: "900",
      color: trouve ? "#22c55e" : "#ef4444",
      lineHeight: "1",
    } as React.CSSProperties,

    employeurSection: {
      backgroundColor: "#0a0a10",
      border: "1px solid rgba(200, 169, 110, 0.08)",
      borderRadius: "16px",
      padding: "40px",
      marginBottom: "40px",
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: "11px",
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
      color: "rgba(200, 169, 110, 0.45)",
      marginBottom: "20px",
      fontWeight: "600",
    } as React.CSSProperties,

    employeurTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#c8a96e",
      marginBottom: "12px",
    } as React.CSSProperties,

    employeurText: {
      fontSize: "15px",
      color: "rgba(232, 224, 208, 0.6)",
      lineHeight: "1.8",
      marginBottom: "24px",
    } as React.CSSProperties,

    stepsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    } as React.CSSProperties,

    stepCard: {
      backgroundColor: "rgba(200, 169, 110, 0.04)",
      border: "1px solid rgba(200, 169, 110, 0.1)",
      borderRadius: "10px",
      padding: "20px",
    } as React.CSSProperties,

    stepNumber: {
      fontSize: "28px",
      fontWeight: "800",
      color: "rgba(200, 169, 110, 0.15)",
      lineHeight: "1",
      marginBottom: "8px",
    } as React.CSSProperties,

    stepTitle: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#c8a96e",
      marginBottom: "6px",
    } as React.CSSProperties,

    stepText: {
      fontSize: "12px",
      color: "rgba(232, 224, 208, 0.45)",
      lineHeight: "1.6",
    } as React.CSSProperties,

    alertBox: {
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
      backgroundColor: "rgba(200, 169, 110, 0.05)",
      border: "1px solid rgba(200, 169, 110, 0.15)",
      borderRadius: "10px",
      padding: "16px 20px",
    } as React.CSSProperties,

    alertIcon: {
      fontSize: "18px",
      marginTop: "1px",
      flexShrink: 0,
    } as React.CSSProperties,

    alertText: {
      fontSize: "13px",
      color: "rgba(232, 224, 208, 0.55)",
      lineHeight: "1.7",
    } as React.CSSProperties,

    alertEmail: {
      color: "#c8a96e",
      fontWeight: "600",
      textDecoration: "none",
    } as React.CSSProperties,

    footer: {
      borderTop: "1px solid rgba(200, 169, 110, 0.08)",
      padding: "24px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    } as React.CSSProperties,

    footerLeft: {
      fontSize: "13px",
      color: "rgba(200, 169, 110, 0.35)",
    } as React.CSSProperties,

    footerRight: {
      fontSize: "12px",
      color: "rgba(200, 169, 110, 0.25)",
      fontFamily: "monospace",
    } as React.CSSProperties,
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const verificationDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoZone}>
          <div style={styles.logoIcon}>A</div>
          <div>
            <div style={styles.logoText}>AcadémIA Pro</div>
            <div style={styles.logoSub}>Plateforme de certification</div>
          </div>
        </div>
        <div style={styles.headerRight}>SYSTÈME DE VÉRIFICATION</div>
      </header>

      <main style={styles.main}>
        <div style={styles.verificationLabel}>Vérification officielle</div>
        <h1 style={styles.title}>Authentification de Certificat</h1>
        <div style={styles.numeroRef}>
          Référence : {params.numero}
        </div>

        <div style={styles.cardWrapper}>
          <div style={styles.cardGlow} />
          <div style={styles.card}>
            <div style={styles.cardTopStripe} />
            <div style
}