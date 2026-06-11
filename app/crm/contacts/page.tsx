export default async function ContactsPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, nom, email, statut, score, derniere_interaction")
    .order("score", { ascending: false });

  const contactList = contacts || [];

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#e8e8f0",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0d0d1a 0%, #0a0a14 50%, #050508 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
    padding: "24px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: "0",
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "42px",
    height: "42px",
    background: "linear-gradient(135deg, #c8a96e, #e8c97e, #a07840)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "900",
    color: "#050508",
    boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.3px",
  };

  const logoSubStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.6)",
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    marginTop: "2px",
  };

  const headerNavStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const navItemStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "rgba(200, 169, 110, 0.7)",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid transparent",
  };

  const navItemActiveStyle: React.CSSProperties = {
    ...navItemStyle,
    backgroundColor: "rgba(200, 169, 110, 0.1)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    color: "#c8a96e",
    fontWeight: "600",
  };

  const mainContentStyle: React.CSSProperties = {
    padding: "40px",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const pageTitleSectionStyle: React.CSSProperties = {
    marginBottom: "32px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
  };

  const pageTitleAccentStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const pageSubtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(232, 232, 240, 0.5)",
    marginTop: "6px",
    fontWeight: "400",
  };

  const statsRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  };

  const statCardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.15)",
    borderRadius: "16px",
    padding: "20px 24px",
    position: "relative",
    overflow: "hidden",
  };

  const statCardAccentStyle: React.CSSProperties = {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "2px",
    background: "linear-gradient(90deg, #c8a96e, #e8c97e, transparent)",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.6)",
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    fontWeight: "600",
    marginBottom: "8px",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1",
  };

  const statChangeStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#4ade80",
    marginTop: "6px",
    fontWeight: "500",
  };

  const toolbarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
  };

  const searchContainerStyle: React.CSSProperties = {
    flex: "1",
    minWidth: "280px",
    position: "relative",
  };

  const searchIconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(200, 169, 110, 0.5)",
    fontSize: "16px",
    pointerEvents: "none",
  };

  const searchInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px 11px 42px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "10px",
    color: "#e8e8f0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

  const filterSelectStyle: React.CSSProperties = {
    padding: "11px 16px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "10px",
    color: "#e8e8f0",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    minWidth: "140px",
  };

  const addButtonStyle: React.CSSProperties = {
    padding: "11px 22px",
    background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
    border: "none",
    borderRadius: "10px",
    color: "#050508",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap" as const,
    boxShadow: "0 4px 20px rgba(200, 169, 110, 0.3)",
    letterSpacing: "0.3px",
  };

  const tableContainerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.15)",
    borderRadius: "20px",
    overflow: "hidden",
  };

  const tableHeaderBarStyle: React.CSSProperties = {
    padding: "20px 28px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(200, 169, 110, 0.03)",
  };

  const tableHeaderTitleStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const tableBadgeStyle: React.CSSProperties = {
    fontSize: "11px",
    padding: "3px 10px",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "20px",
    color: "#c8a96e",
    fontWeight: "600",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse" as const,
  };

  const theadStyle: React.CSSProperties = {
    backgroundColor: "rgba(0,0,0,0.2)",
  };

  const thStyle: React.CSSProperties = {
    padding: "14px 20px",
    textAlign: "left" as const,
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(200, 169, 110, 0.6)",
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.08)",
    whiteSpace: "nowrap" as const,
  };

  const tdStyle: React.CSSProperties = {
    padding: "16px 20px",
    fontSize: "13px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  const tdLastStyle: React.CSSProperties = {
    ...tdStyle,
    borderBottom: "none",
  };

  const avatarStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #c8a96e33, #e8c97e22)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "#c8a96e",
    flexShrink: 0,
  };

  const nameCellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const nameTextStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: "1.2",
  };

  const emailTextStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(232, 232, 240, 0.4)",
    marginTop: "2px",
  };

  const getStatutStyle = (statut: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      textTransform: "uppercase" as const,
    };
    if (statut === "client") {
      return { ...base, backgroundColor: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.3)", color: "#4ade80" };
    }
    if (statut === "prospect") {
      return { ...base, backgroundColor: "rgba(200, 169, 110, 0.1)", border: "1px solid rgba(200, 169, 110, 0.3)", color: "#c8a96e" };
    }
    if (statut === "lead") {
      return { ...base, backgroundColor: "rgba(96, 165, 250, 0.1)", border: "1px solid rgba(96, 165, 250, 0.3)", color: "#60a5fa" };
    }
    if (statut === "inactif") {
      return { ...base, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,240,0.4)" };
    }
    return { ...base, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,240,0.5)" };
  };

  const getStatutDot = (statut: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      flexShrink: 0,
    };
    if (statut === "client") return { ...base, backgroundColor: "#4ade80" };
    if (statut === "prospect") return { ...base, backgroundColor: "#c8a96e" };
    if (statut === "lead") return { ...base, backgroundColor: "#60a5fa" };
    return { ...base, backgroundColor: "rgba(232,232,240,0.3)" };
  };

  const scoreBarContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const scoreBarBgStyle: React.
}