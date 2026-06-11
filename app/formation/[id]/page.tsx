export default async function FormationPage({ params }: { params: { id: string } }) {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const staticFormation = {
    id: params.id,
    titre: "Maîtrisez l'Intelligence Artificielle Générative",
    description:
      "Formation complète pour transformer votre expertise métier grâce à l'IA. De la compréhension des fondamentaux aux cas d'usage avancés, devenez un acteur incontournable de la révolution IA dans votre secteur. Cette formation intensive vous donne toutes les clés pour automatiser, créer et innover.",
    prix_solo: 497,
    prix_accompagne: 997,
    prix_elite: 1997,
    duree: "12 semaines",
    niveau: "Intermédiaire à Avancé",
    nb_apprenants: 2847,
    note: 4.9,
    chapitres: [
      {
        numero: 1,
        titre: "Fondamentaux de l'IA Générative",
        duree: "3h 20min",
        lecons: 8,
        description: "Comprendre les LLMs, diffusion models et architectures transformer",
      },
      {
        numero: 2,
        titre: "Prompt Engineering Avancé",
        duree: "4h 15min",
        lecons: 12,
        description: "Techniques chain-of-thought, few-shot learning et optimisation des prompts",
      },
      {
        numero: 3,
        titre: "Automatisation avec l'IA",
        duree: "5h 00min",
        lecons: 14,
        description: "Construire des workflows automatisés avec GPT-4, Claude et Gemini",
      },
      {
        numero: 4,
        titre: "Création de Contenu IA",
        duree: "3h 45min",
        lecons: 10,
        description: "Images, vidéos, textes et audio générés par IA pour votre business",
      },
      {
        numero: 5,
        titre: "IA dans votre Métier",
        duree: "4h 30min",
        lecons: 11,
        description: "Applications sectorielles : marketing, finance, RH, juridique, santé",
      },
      {
        numero: 6,
        titre: "Éthique et Gouvernance IA",
        duree: "2h 10min",
        lecons: 6,
        description: "Cadre légal RGPD, biais algorithmiques et déploiement responsable",
      },
      {
        numero: 7,
        titre: "Projet Final Certifiant",
        duree: "6h 00min",
        lecons: 5,
        description: "Réalisez un projet complet validé par notre jury d'experts AcadémIA",
      },
    ],
    competences: [
      "Maîtriser les outils IA du marché",
      "Automatiser 80% de vos tâches répétitives",
      "Créer du contenu haute qualité en 10x moins de temps",
      "Construire des agents IA personnalisés",
      "Analyser et interpréter des données complexes",
      "Déployer des solutions IA en production",
    ],
  };

  let formation = staticFormation;
  let sourceData = "statique";

  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("formations")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        formation = { ...staticFormation, ...data };
        sourceData = "supabase";
      }
    }
  } catch (err) {
    sourceData = "statique";
  }

  const styles = {
    page: {
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#ffffff",
    } as React.CSSProperties,

    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 24px",
    } as React.CSSProperties,

    nav: {
      borderBottom: "1px solid rgba(200,169,110,0.2)",
      padding: "16px 0",
      backgroundColor: "rgba(5,5,8,0.95)",
      position: "sticky" as const,
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(20px)",
    } as React.CSSProperties,

    navInner: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    } as React.CSSProperties,

    logo: {
      fontSize: "22px",
      fontWeight: "800",
      color: "#c8a96e",
      letterSpacing: "-0.5px",
    } as React.CSSProperties,

    logoSpan: {
      color: "#ffffff",
      fontWeight: "400",
    } as React.CSSProperties,

    navBadge: {
      backgroundColor: "rgba(200,169,110,0.1)",
      border: "1px solid rgba(200,169,110,0.3)",
      borderRadius: "20px",
      padding: "6px 16px",
      fontSize: "12px",
      color: "#c8a96e",
      fontWeight: "600",
    } as React.CSSProperties,

    heroSection: {
      padding: "80px 0 60px",
      background:
        "radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.08) 0%, transparent 70%)",
    } as React.CSSProperties,

    categoryBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "rgba(200,169,110,0.1)",
      border: "1px solid rgba(200,169,110,0.4)",
      borderRadius: "20px",
      padding: "8px 18px",
      fontSize: "13px",
      color: "#c8a96e",
      fontWeight: "600",
      marginBottom: "24px",
    } as React.CSSProperties,

    heroTitle: {
      fontSize: "clamp(32px, 5vw, 58px)",
      fontWeight: "800",
      lineHeight: "1.1",
      marginBottom: "24px",
      letterSpacing: "-1px",
    } as React.CSSProperties,

    titleGold: {
      color: "#c8a96e",
      display: "block",
    } as React.CSSProperties,

    heroDescription: {
      fontSize: "18px",
      color: "rgba(255,255,255,0.7)",
      lineHeight: "1.7",
      maxWidth: "700px",
      marginBottom: "40px",
    } as React.CSSProperties,

    statsRow: {
      display: "flex",
      gap: "32px",
      flexWrap: "wrap" as const,
      marginBottom: "40px",
    } as React.CSSProperties,

    statItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "rgba(255,255,255,0.7)",
    } as React.CSSProperties,

    statIcon: {
      color: "#c8a96e",
      fontSize: "16px",
    } as React.CSSProperties,

    statValue: {
      color: "#ffffff",
      fontWeight: "700",
    } as React.CSSProperties,

    starsRow: {
      display: "flex",
      gap: "4px",
      marginBottom: "40px",
      alignItems: "center",
    } as React.CSSProperties,

    star: {
      color: "#c8a96e",
      fontSize: "20px",
    } as React.CSSProperties,

    starText: {
      marginLeft: "8px",
      color: "rgba(255,255,255,0.6)",
      fontSize: "14px",
    } as React.CSSProperties,

    mainGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 400px",
      gap: "60px",
      alignItems: "start",
      padding: "0 0 80px",
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: "24px",
      paddingBottom: "12px",
      borderBottom: "2px solid rgba(200,169,110,0.3)",
    } as React.CSSProperties,

    programSection: {
      marginBottom: "60px",
    } as React.CSSProperties,

    chapterCard: {
      backgroundColor: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "20px 24px",
      marginBottom: "12px",
      transition: "border-color 0.2s",
      cursor: "pointer",
    } as React.CSSProperties,

    chapterHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    } as React.CSSProperties,

    chapterNumber: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      backgroundColor: "rgba(200,169,110,0.1)",
      border: "1px solid rgba(200,169,110,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "800",
      color: "#c8a96e",
      flexShrink: 0,
    } as React.CSSProperties,

    chapterInfo: {
      flex: 1,
    } as React.CSSProperties,

    chapterTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#ffffff",
      marginBottom: "4px",
    } as React.CSSProperties,

    chapterDesc: {
      fontSize: "13px",
      color: "rgba(255,255,255,0.5)",
      lineHeight: "1.4",
    } as React.CSSProperties,

    chapterMeta: {
      display: "flex",
      gap: "12px",
      marginTop: "10px",
    } as React.CSSProperties,

    chapterTag: {
      backgroundColor: "rgba(200,169,110,0.08)",
      border: "1px solid rgba(200,169,110,0.2)",
      borderRadius: "8px",
      padding: "3px 10px",
      fontSize: "11px",
      color: "rgba(200,169,110,0.8)",
      fontWeight: "600",
    } as React.CSSProperties,

    skillsSection: {
      marginBottom: "60px",
    } as React.CSSProperties,

    skillsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
    } as React.CSSProperties,

    skillItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 16px",
      backgroundColor: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "10px",
      fontSize: "14px",
      color: "rgba(255,255,255,0.8)",
    } as React.CSSProperties,

    checkIcon: {
      color: "#c8a96e",
      fontSize: "16px",
      fontWeight: "800",
      flexShrink: 0,
    } as React.CSSProperties,

    certSection: {
      background:
        "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(200,169,110,0.03) 100%)",
      border: "1px solid rgba(200,169,110,0.3)",
      borderRadius: "16px",
      padding: "32px",
      marginBottom: "60px",
    } as React.CSSProperties,

    certHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "16px",
    } as React.CSSProperties,

    certIcon: {
      width: "56px",
      height: "56px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #c8a96e, #8b6914)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
    } as React.CSSProperties,

    certTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#c8a96e",
      marginBottom: "4px",
    } as React.CSSProperties,

    certSubtitle: {
      fontSize: "13px",
      color: "rgba(255,255,255,0.5)",
    } as React.CSSProperties,

    certText: {
      fontSize: "15px",
      color: "rgba(255,255,255,0.7)",
      lineHeight: "1.6",
      marginBottom: "20px",
    } as React.CSSProperties,

    certFeatures: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
    } as React.CSSProperties,

    certFeature: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "rgba(200,169,110,0.9)",
      fontWeight: "500",
    } as React.CSSProperties,

    stickyCard: {
      position: "sticky" as const,
      top: "90px",
    } as React.CSSProperties,

    pricingCard: {
      backgroundColor: "rgba(10,10,18,0.95)",
      border: "1px solid rgba(200,169,110,0.3)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,169,110,0.1)",
    } as React.CSSProperties,

    pricingHeader: {
      background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))",
      borderBottom: "1px solid rgba(200,169,110,0.2)",
      padding: "24px",
      textAlign: "center" as const