export default async function LmsPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  type Formation = {
    id: string;
    titre: string;
    description: string;
    progression: number;
    modules_total: number;
    modules_completes: number;
    categorie: string;
    niveau: string;
    duree_heures: number;
    certificat_disponible: boolean;
    image_url: string | null;
  };

  type Module = {
    id: string;
    formation_id: string;
    titre: string;
    duree_minutes: number;
    complete: boolean;
    type: string;
    ordre: number;
  };

  type Quiz = {
    id: string;
    formation_id: string;
    titre: string;
    score: number | null;
    tentatives: number;
    score_minimum: number;
  };

  type Certificat = {
    id: string;
    formation_titre: string;
    date_obtention: string;
    score_final: number;
    code_verification: string;
  };

  let formations: Formation[] = [];
  let modules: Module[] = [];
  let quizzes: Quiz[] = [];
  let certificats: Certificat[] = [];
  let errorMessage = "";

  try {
    const { data: formationsData, error: formationsError } = await supabase
      .from("formations")
      .select("*")
      .eq("statut", "en_cours")
      .order("created_at", { ascending: false });

    if (formationsError) {
      errorMessage = formationsError.message;
    } else {
      formations = (formationsData as Formation[]) || [];
    }

    const { data: modulesData } = await supabase
      .from("modules")
      .select("*")
      .order("ordre", { ascending: true })
      .limit(20);

    modules = (modulesData as Module[]) || [];

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .limit(10);

    quizzes = (quizzesData as Quiz[]) || [];

    const { data: certificatsData } = await supabase
      .from("certificats")
      .select("*")
      .order("date_obtention", { ascending: false })
      .limit(10);

    certificats = (certificatsData as Certificat[]) || [];
  } catch (err) {
    errorMessage = "Erreur de connexion à Supabase";
    formations = [
      {
        id: "demo-1",
        titre: "Intelligence Artificielle Avancée",
        description: "Maîtrisez les algorithmes de machine learning et deep learning avec des projets concrets.",
        progression: 67,
        modules_total: 12,
        modules_completes: 8,
        categorie: "IA & ML",
        niveau: "Avancé",
        duree_heures: 48,
        certificat_disponible: false,
        image_url: null,
      },
      {
        id: "demo-2",
        titre: "Prompt Engineering Masterclass",
        description: "Devenez expert en conception de prompts pour optimiser vos interactions avec les LLMs.",
        progression: 35,
        modules_total: 8,
        modules_completes: 3,
        categorie: "Prompt Design",
        niveau: "Intermédiaire",
        duree_heures: 24,
        certificat_disponible: false,
        image_url: null,
      },
      {
        id: "demo-3",
        titre: "Data Science avec Python",
        description: "Analysez et visualisez des données massives grâce à pandas, numpy et matplotlib.",
        progression: 90,
        modules_total: 15,
        modules_completes: 14,
        categorie: "Data Science",
        niveau: "Intermédiaire",
        duree_heures: 60,
        certificat_disponible: true,
        image_url: null,
      },
    ];
    modules = [
      { id: "m1", formation_id: "demo-1", titre: "Introduction aux réseaux de neurones", duree_minutes: 45, complete: true, type: "video", ordre: 1 },
      { id: "m2", formation_id: "demo-1", titre: "Rétropropagation du gradient", duree_minutes: 60, complete: true, type: "video", ordre: 2 },
      { id: "m3", formation_id: "demo-1", titre: "Architectures CNN", duree_minutes: 90, complete: false, type: "cours", ordre: 3 },
      { id: "m4", formation_id: "demo-1", titre: "Transfer Learning", duree_minutes: 75, complete: false, type: "atelier", ordre: 4 },
      { id: "m5", formation_id: "demo-2", titre: "Fondamentaux du Prompt Engineering", duree_minutes: 30, complete: true, type: "video", ordre: 1 },
      { id: "m6", formation_id: "demo-2", titre: "Chain-of-Thought Prompting", duree_minutes: 45, complete: false, type: "cours", ordre: 2 },
    ];
    quizzes = [
      { id: "q1", formation_id: "demo-1", titre: "Quiz : Fondamentaux ML", score: 85, tentatives: 2, score_minimum: 70 },
      { id: "q2", formation_id: "demo-1", titre: "Quiz : Deep Learning", score: null, tentatives: 0, score_minimum: 75 },
      { id: "q3", formation_id: "demo-2", titre: "Quiz : Prompt Design", score: 92, tentatives: 1, score_minimum: 70 },
    ];
    certificats = [
      { id: "cert1", formation_titre: "Python pour Data Scientists", date_obtention: "2024-11-15", score_final: 94, code_verification: "ACAD-2024-PY94" },
      { id: "cert2", formation_titre: "Introduction au Machine Learning", date_obtention: "2024-09-03", score_final: 88, code_verification: "ACAD-2024-ML88" },
    ];
  }

  const colors = {
    bg: "#050508",
    bgCard: "#0a0a12",
    bgCardHover: "#0f0f1a",
    bgSection: "#07070f",
    accent: "#c8a96e",
    accentLight: "#e8c98e",
    accentDark: "#a8893e",
    accentBg: "rgba(200,169,110,0.08)",
    accentBorder: "rgba(200,169,110,0.2)",
    accentBorderStrong: "rgba(200,169,110,0.4)",
    text: "#f0f0f8",
    textMuted: "#8888aa",
    textLight: "#ccccdd",
    success: "#4ade80",
    successBg: "rgba(74,222,128,0.1)",
    warning: "#fbbf24",
    warningBg: "rgba(251,191,36,0.1)",
    error: "#f87171",
    errorBg: "rgba(248,113,113,0.1)",
    blue: "#60a5fa",
    blueBg: "rgba(96,165,250,0.1)",
    purple: "#a78bfa",
    purpleBg: "rgba(167,139,250,0.1)",
    border: "rgba(255,255,255,0.06)",
  };

  const globalStats = {
    formationsEnCours: formations.length,
    progressionMoyenne: formations.length > 0
      ? Math.round(formations.reduce((acc, f) => acc + f.progression, 0) / formations.length)
      : 0,
    modulesCompletes: modules.filter((m) => m.complete).length,
    certificatsObtenus: certificats.length,
  };

  const getProgressColor = (progression: number): string => {
    if (progression >= 80) return colors.success;
    if (progression >= 50) return colors.accent;
    return colors.blue;
  };

  const getNiveauColor = (niveau: string): string => {
    if (niveau === "Avancé") return colors.error;
    if (niveau === "Intermédiaire") return colors.warning;
    return colors.success;
  };

  const getTypeIcon = (type: string): string => {
    if (type === "video") return "▶";
    if (type === "atelier") return "⚙";
    if (type === "quiz") return "?";
    return "📄";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        lineHeight: "1.6",
      }}
    >
      {/* TOPBAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(5,5,8,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.accentBorder}`,
          padding: "0 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "#050508",
              }}
            >
              A
            </div>
            <div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                AcadémIA Pro
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: colors.textMuted,
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                LMS Intelligent
              </span>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 4 }}>
            {["Dashboard", "Formations", "Modules", "Quiz", "Certificats", "Agent IA"].map(
              (item, idx) => (
                <button
                  key={item}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: idx === 0 ? colors.accentBg : "transparent",
                    color: idx === 0 ? colors.accent : colors.textMuted,
                    fontSize: 13,
                    fontWeight: idx === 0 ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {item}
                </button>
              )
            )}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: colors.success,
                boxShadow: `0 0 8px ${colors.success}`,
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${colors.accentBg}, ${colors.accentBorder})`,
                border: `2px solid ${colors.accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: colors.accent,
              }}
            >
              U
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "32px 32px 64px",
        }}
      >
        {/* HERO HEADER */}
        <div
          style={{
            marginBottom: 40,
            padding: "40px 48px",
            borderRadius: 20,
            background: `linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(10,10,18,0.8) 60%, rgba(167,139,250,0.04) 100%)`,
            border: `1px solid ${colors.accentBorder}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  backgroundColor: colors.accentBg,
                  border: `1px solid ${colors.accentBorder}`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.accent,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 16,
}}}