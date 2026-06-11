export default async function MonEspacePage() {

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  const userId = session?.user?.id ?? null;

  const [
    formationsResult,
    progressionResult,
    certificationsResult,
    seancesResult,
    paiementsResult,
    profilResult,
  ] = await Promise.all([
    supabase
      .from("formations_achetees")
      .select("id, titre, description, date_achat, categorie, duree_heures, niveau")
      .eq("user_id", userId ?? ""),
    supabase
      .from("progression")
      .select("id, formation_id, formation_titre, pourcentage, derniere_activite, modules_completes, modules_total")
      .eq("user_id", userId ?? ""),
    supabase
      .from("certifications")
      .select("id, titre, date_obtention, score, formation_titre, badge_url, valide")
      .eq("user_id", userId ?? ""),
    supabase
      .from("seances")
      .select("id, titre, date_seance, duree_minutes, statut, coach_nom, type_seance, lien_visio")
      .eq("user_id", userId ?? "")
      .order("date_seance", { ascending: false }),
    supabase
      .from("paiements")
      .select("id, montant, devise, statut, date_paiement, methode, formation_titre, facture_url")
      .eq("user_id", userId ?? "")
      .order("date_paiement", { ascending: false }),
    supabase
      .from("profils")
      .select("id, prenom, nom, email, avatar_url, bio, niveau_global, points_xp, objectif, date_inscription")
      .eq("user_id", userId ?? "")
      .single(),
  ]);

  const formations = formationsResult.data ?? [];
  const progressions = progressionResult.data ?? [];
  const certifications = certificationsResult.data ?? [];
  const seances = seancesResult.data ?? [];
  const paiements = paiementsResult.data ?? [];
  const profil = profilResult.data ?? null;

  const couleurFond = "#050508";
  const couleurOr = "#c8a96e";
  const couleurOrClair = "#e8c87e";
  const couleurOrFonce = "#a07840";
  const couleurSurface = "#0d0d14";
  const couleurSurface2 = "#13131e";
  const couleurBord = "#1e1e2e";
  const couleurBordOr = "#c8a96e33";
  const couleurTexte = "#e8e8f0";
  const couleurTexteSecondaire = "#8888aa";
  const couleurSucces = "#4ade80";
  const couleurEchec = "#f87171";
  const couleurInfo = "#60a5fa";

  const styleContainer: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: couleurFond,
    color: couleurTexte,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "0",
    margin: "0",
  };

  const styleHeader: React.CSSProperties = {
    background: "linear-gradient(135deg, #0a0a12 0%, #10101a 50%, #0a0a12 100%)",
    borderBottom: `1px solid ${couleurBordOr}`,
    padding: "0 2rem",
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const styleHeaderInner: React.CSSProperties = {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "70px",
  };

  const styleLogoZone: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  };

  const styleLogoIcon: React.CSSProperties = {
    width: "38px",
    height: "38px",
    background: `linear-gradient(135deg, ${couleurOr}, ${couleurOrFonce})`,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#050508",
    boxShadow: `0 0 20px ${couleurOr}40`,
  };

  const styleLogoText: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "700",
    background: `linear-gradient(135deg, ${couleurOr}, ${couleurOrClair})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  };

  const styleLogoBadge: React.CSSProperties = {
    fontSize: "0.6rem",
    fontWeight: "700",
    color: couleurOr,
    border: `1px solid ${couleurOr}`,
    borderRadius: "4px",
    padding: "1px 5px",
    letterSpacing: "0.1em",
    marginLeft: "0.25rem",
  };

  const styleNavUser: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  };

  const styleAvatarHeader: React.CSSProperties = {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${couleurOr}40, ${couleurOrFonce}40)`,
    border: `2px solid ${couleurOr}60`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    color: couleurOr,
    overflow: "hidden",
  };

  const styleNomHeader: React.CSSProperties = {
    fontSize: "0.875rem",
    color: couleurTexte,
    fontWeight: "500",
  };

  const styleXpBadge: React.CSSProperties = {
    background: `${couleurOr}15`,
    border: `1px solid ${couleurOr}40`,
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "0.75rem",
    color: couleurOr,
    fontWeight: "600",
  };

  const styleMain: React.CSSProperties = {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem",
  };

  const styleHeroSection: React.CSSProperties = {
    background: `linear-gradient(135deg, ${couleurSurface} 0%, #0d0d1a 100%)`,
    border: `1px solid ${couleurBordOr}`,
    borderRadius: "20px",
    padding: "2.5rem",
    marginBottom: "2rem",
    position: "relative",
    overflow: "hidden",
  };

  const styleHeroBg: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    width: "300px",
    height: "300px",
    background: `radial-gradient(circle, ${couleurOr}08 0%, transparent 70%)`,
    pointerEvents: "none",
  };

  const styleHeroFlex: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    position: "relative",
    zIndex: 1,
  };

  const styleAvatarHero: React.CSSProperties = {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${couleurOr}30, ${couleurOrFonce}30)`,
    border: `3px solid ${couleurOr}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    color: couleurOr,
    flexShrink: 0,
    boxShadow: `0 0 30px ${couleurOr}30`,
    overflow: "hidden",
  };

  const styleHeroInfo: React.CSSProperties = {
    flex: 1,
  };

  const styleHeroNom: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: "700",
    color: couleurTexte,
    marginBottom: "0.35rem",
    lineHeight: 1.2,
  };

  const styleHeroBio: React.CSSProperties = {
    fontSize: "0.9rem",
    color: couleurTexteSecondaire,
    marginBottom: "1rem",
    lineHeight: 1.5,
  };

  const styleHeroStats: React.CSSProperties = {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap" as const,
  };

  const styleStatChip: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: `${couleurOr}10`,
    border: `1px solid ${couleurOr}30`,
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "0.8rem",
    color: couleurOr,
    fontWeight: "500",
  };

  const styleGridStats: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  };

  const styleStatCard: React.CSSProperties = {
    background: couleurSurface,
    border: `1px solid ${couleurBord}`,
    borderRadius: "14px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    position: "relative",
    overflow: "hidden",
  };

  const styleStatCardAccent: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: `linear-gradient(90deg, ${couleurOr}, ${couleurOrClair})`,
    borderRadius: "14px 14px 0 0",
  };

  const styleStatIcon: React.CSSProperties = {
    fontSize: "1.5rem",
    marginBottom: "0.25rem",
  };

  const styleStatValue: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: "700",
    color: couleurOr,
    lineHeight: 1,
  };

  const styleStatLabel: React.CSSProperties = {
    fontSize: "0.75rem",
    color: couleurTexteSecondaire,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: "600",
  };

  const styleSectionTitle: React.CSSProperties = {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: couleurTexte,
    marginBottom: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  };

  const styleTitleLine: React.CSSProperties = {
    height: "2px",
    flex: 1,
    background: `linear-gradient(90deg, ${couleurOr}40, transparent)`,
  };

  const styleSection: React.CSSProperties = {
    marginBottom: "2.5rem",
  };

  const styleGrid2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.25rem",
  };

  const styleCard: React.CSSProperties = {
    background: couleurSurface,
    border: `1px solid ${couleurBord}`,
    borderRadius: "16px",
    padding: "1.5rem",
    transition: "border-color 0.2s",
    position: "relative",
    overflow: "hidden",
  };

  const styleCardHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1rem",
    gap: "0.75rem",
  };

  const styleCardTitre: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: "600",
    color: couleurTexte,
    lineHeight: 1.3,
    flex: 1,
  };

  const styleBadgeNiveau: React.CSSProperties = {
    background: `${couleurOr}15`,
    color: couleurOr,
    border: `1px solid ${couleurOr}40`,
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "0.7rem",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    flexShrink: 0,
  };

  const styleCardMeta: React.CSSProperties = {
    fontSize: "0.8rem",
    color: couleurTexteSecondaire,
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  };

  const styleProgressBar: React.CSSProperties = {
    height: "6px",
    background: `${couleurOr}15`,
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "1rem",
  };

  const styleProgressFill = (pct: number): React.CSSProperties => ({
    height: "100%",
    width: `${Math.min(Math.max(pct, 0), 100)}%`,
    background: `linear-gradient(90deg, ${couleurOr}, ${couleurOrClair})`,
    borderRadius: "3px",
    transition: "width 0.5s ease",
    boxShadow: `0 0 8px ${couleurOr}60`,
  });

  const styleProgressLabel: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.5rem",
    fontSize: "0.75rem",
    color: couleurTexteSecondaire,
  };

  const styleCertifCard: React.CSSProperties = {
    background: `linear-gradient(135deg, ${couleurSurface} 0%, #10101c 100%)`,
    border: `1px
}}