export default async function ContactPage({ params }: { params: { id: string } }) {

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: formations } = await supabase
    .from("formations")
    .select("*")
    .eq("contact_id", params.id);

  const { data: seances } = await supabase
    .from("seances")
    .select("*")
    .eq("contact_id", params.id)
    .order("date", { ascending: false });

  const { data: historique } = await supabase
    .from("historique")
    .select("*")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false });

  if (contactError || !contact) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>404</div>
          <p style={{ color: "#c8a96e", fontSize: "18px", fontFamily: "system-ui, sans-serif" }}>
            Contact introuvable
          </p>
        </div>
      </div>
    );
  }

  const score: number = contact.score ?? 0;

  const scoreColor =
    score >= 80
      ? "#4ade80"
      : score >= 50
      ? "#c8a96e"
      : "#f87171";

  const scoreLabel =
    score >= 80
      ? "Excellent"
      : score >= 50
      ? "Moyen"
      : "Faible";

  const initials: string = (contact.nom ?? "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#e8e0d5",
    padding: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #0d0c14 0%, #050508 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e, #f0d080)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px",
  };

  const breadcrumbStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(200, 169, 110, 0.6)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px",
  };

  const heroSectionStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(200, 169, 110, 0.06) 0%, rgba(13, 12, 20, 0.8) 100%)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "20px",
    padding: "40px",
    marginBottom: "32px",
    display: "flex",
    alignItems: "flex-start",
    gap: "32px",
    position: "relative",
    overflow: "hidden",
  };

  const heroGlowStyle: React.CSSProperties = {
    position: "absolute",
    top: "-60px",
    right: "-60px",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(200, 169, 110, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  const avatarStyle: React.CSSProperties = {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c8a96e, #8a6a30)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
    color: "#050508",
    flexShrink: "0" as const,
    boxShadow: "0 0 0 3px rgba(200, 169, 110, 0.3), 0 8px 32px rgba(200, 169, 110, 0.2)",
  };

  const contactInfoStyle: React.CSSProperties = {
    flex: "1",
  };

  const contactNameStyle: React.CSSProperties = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#f0e6d3",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  };

  const contactEmailStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "#c8a96e",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const tagsContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
  };

  const tagStyle = (bg: string, color: string): React.CSSProperties => ({
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: bg,
    color: color,
    border: "1px solid rgba(200, 169, 110, 0.2)",
    letterSpacing: "0.3px",
  });

  const scoreCardStyle: React.CSSProperties = {
    background: "rgba(5, 5, 8, 0.6)",
    border: "1px solid rgba(200, 169, 110, 0.15)",
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center",
    minWidth: "140px",
    flexShrink: "0" as const,
  };

  const scoreValueStyle: React.CSSProperties = {
    fontSize: "48px",
    fontWeight: "800",
    color: scoreColor,
    lineHeight: "1",
    marginBottom: "4px",
  };

  const scoreLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: scoreColor,
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginBottom: "12px",
  };

  const scoreBarBgStyle: React.CSSProperties = {
    width: "100%",
    height: "6px",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: "3px",
    overflow: "hidden",
  };

  const scoreBarFillStyle: React.CSSProperties = {
    height: "100%",
    width: `${score}%`,
    backgroundColor: scoreColor,
    borderRadius: "3px",
    transition: "width 0.5s ease",
    boxShadow: `0 0 8px ${scoreColor}80`,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "rgba(13, 12, 20, 0.7)",
    border: "1px solid rgba(200, 169, 110, 0.12)",
    borderRadius: "16px",
    padding: "28px",
    backdropFilter: "blur(10px)",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "700",
    color: "#c8a96e",
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const dividerStyle: React.CSSProperties = {
    flex: "1",
    height: "1px",
    background: "linear-gradient(90deg, rgba(200, 169, 110, 0.3) 0%, transparent 100%)",
  };

  const formationItemStyle: React.CSSProperties = {
    padding: "16px",
    background: "rgba(200, 169, 110, 0.04)",
    border: "1px solid rgba(200, 169, 110, 0.1)",
    borderRadius: "12px",
    marginBottom: "12px",
    transition: "border-color 0.2s ease",
  };

  const formationTitleStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: "600",
    color: "#f0e6d3",
    marginBottom: "6px",
  };

  const formationMetaStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "rgba(200, 169, 110, 0.7)",
  };

  const seanceRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  const seanceDateStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#c8a96e",
    fontWeight: "600",
    minWidth: "100px",
  };

  const seanceTitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#e8e0d5",
    flex: "1",
    padding: "0 16px",
  };

  const badgeStyle = (status: string): React.CSSProperties => {
    const statusMap: Record<string, { bg: string; color: string }> = {
      termine: { bg: "rgba(74, 222, 128, 0.1)", color: "#4ade80" },
      "en-cours": { bg: "rgba(200, 169, 110, 0.1)", color: "#c8a96e" },
      annule: { bg: "rgba(248, 113, 113, 0.1)", color: "#f87171" },
      planifie: { bg: "rgba(96, 165, 250, 0.1)", color: "#60a5fa" },
    };
    const s = statusMap[status] ?? { bg: "rgba(200, 169, 110, 0.1)", color: "#c8a96e" };
    return {
      padding: "3px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      backgroundColor: s.bg,
      color: s.color,
      textTransform: "capitalize" as const,
    };
  };

  const histItemStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    alignItems: "flex-start",
  };

  const histDotStyle = (type: string): React.CSSProperties => {
    const colors: Record<string, string> = {
      inscription: "#4ade80",
      paiement: "#c8a96e",
      message: "#60a5fa",
      connexion: "#a78bfa",
      default: "#6b7280",
    };
    return {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: colors[type] ?? colors.default,
      flexShrink: "0" as const,
      marginTop: "6px",
      boxShadow: `0 0 6px ${colors[type] ?? colors.default}80`,
    };
  };

  const histContentStyle: React.CSSProperties = {
    flex: "1",
  };

  const histActionStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#e8e0d5",
    marginBottom: "2px",
  };

  const histDateStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.5)",
  };

  const noteCardStyle: React.CSSProperties = {
    background: "rgba(200, 169, 110, 0.03)",
    border: "1px solid rgba(200, 169, 110, 0.1)",
    borderLeft: "3px solid #c8a96e",
    borderRadius: "0 12px 12px 0",
    padding: "16px",
    marginBottom: "12px",
  };

  const noteTextStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#d4c9b8",
    lineHeight: "1.6",
    marginBottom: "8px",
  };

  const noteDateStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(200, 169, 110, 0.5)",
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "32px 16px",
    color: "rgba(200, 169, 110, 0.4)",
    fontSize: "14px",
  };

  const infoRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
}}