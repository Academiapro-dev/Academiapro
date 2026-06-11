export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { domain?: string; level?: string; support?: string; page?: string };
}) {
  const { createClient } = await import("@supabase/supabase-js");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const ITEMS_PER_PAGE = 12;

  const currentPage = parseInt(searchParams.page || "1", 10);
  const selectedDomain = searchParams.domain || "";
  const selectedLevel = searchParams.level || "";
  const selectedSupport = searchParams.support || "";

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  type Formation = {
    id: string;
    title: string;
    description: string;
    domain: string;
    level: string;
    support: string;
    duration: string;
    price: number;
    image_url: string;
    instructor: string;
    rating: number;
    students_count: number;
  };

  let formations: Formation[] = [];
  let totalCount = 0;
  let hasError = false;

  const staticFallback: Formation[] = [
    {
      id: "1",
      title: "Intelligence Artificielle Fondamentaux",
      description: "Maîtrisez les bases de l'IA moderne avec des projets pratiques et des études de cas réels.",
      domain: "Intelligence Artificielle",
      level: "Débutant",
      support: "Vidéo",
      duration: "24h",
      price: 299,
      image_url: "",
      instructor: "Dr. Sarah Chen",
      rating: 4.8,
      students_count: 1240,
    },
    {
      id: "2",
      title: "Machine Learning Avancé",
      description: "Plongez dans les algorithmes avancés de ML et déployez vos propres modèles en production.",
      domain: "Intelligence Artificielle",
      level: "Avancé",
      support: "Vidéo",
      duration: "40h",
      price: 499,
      image_url: "",
      instructor: "Prof. Marc Dubois",
      rating: 4.9,
      students_count: 876,
    },
    {
      id: "3",
      title: "Data Science avec Python",
      description: "Analysez des données massives et créez des visualisations percutantes avec Python et Pandas.",
      domain: "Data Science",
      level: "Intermédiaire",
      support: "Hybride",
      duration: "32h",
      price: 399,
      image_url: "",
      instructor: "Emma Leroy",
      rating: 4.7,
      students_count: 2100,
    },
    {
      id: "4",
      title: "Prompt Engineering Masterclass",
      description: "Devenez expert en rédaction de prompts pour ChatGPT, Claude et tous les LLMs majeurs.",
      domain: "IA Générative",
      level: "Débutant",
      support: "Texte",
      duration: "12h",
      price: 149,
      image_url: "",
      instructor: "Lucas Martin",
      rating: 4.6,
      students_count: 3500,
    },
    {
      id: "5",
      title: "Deep Learning avec TensorFlow",
      description: "Construisez des réseaux de neurones complexes pour la vision par ordinateur et le NLP.",
      domain: "Intelligence Artificielle",
      level: "Avancé",
      support: "Vidéo",
      duration: "56h",
      price: 599,
      image_url: "",
      instructor: "Dr. Aisha Patel",
      rating: 4.9,
      students_count: 654,
    },
    {
      id: "6",
      title: "Business Analytics & BI",
      description: "Transformez vos données business en insights stratégiques avec Power BI et Tableau.",
      domain: "Data Science",
      level: "Intermédiaire",
      support: "Hybride",
      duration: "28h",
      price: 349,
      image_url: "",
      instructor: "Pierre Fontaine",
      rating: 4.5,
      students_count: 1890,
    },
    {
      id: "7",
      title: "NLP et Traitement du Langage",
      description: "Créez des chatbots intelligents et des systèmes d'analyse de sentiment de pointe.",
      domain: "IA Générative",
      level: "Avancé",
      support: "Vidéo",
      duration: "44h",
      price: 549,
      image_url: "",
      instructor: "Dr. Marie Rousseau",
      rating: 4.8,
      students_count: 432,
    },
    {
      id: "8",
      title: "Cloud AI avec AWS & Azure",
      description: "Déployez des solutions IA scalables sur les plateformes cloud leaders du marché.",
      domain: "Cloud & IA",
      level: "Intermédiaire",
      support: "Vidéo",
      duration: "36h",
      price: 449,
      image_url: "",
      instructor: "Thomas Bernard",
      rating: 4.7,
      students_count: 987,
    },
    {
      id: "9",
      title: "Python pour la Data",
      description: "Apprenez Python from scratch avec un focus complet sur la manipulation et l'analyse de données.",
      domain: "Data Science",
      level: "Débutant",
      support: "Texte",
      duration: "20h",
      price: 199,
      image_url: "",
      instructor: "Camille Dupont",
      rating: 4.6,
      students_count: 4200,
    },
    {
      id: "10",
      title: "Éthique et IA Responsable",
      description: "Naviguez les enjeux éthiques de l'IA et construisez des systèmes équitables et transparents.",
      domain: "IA & Société",
      level: "Intermédiaire",
      support: "Hybride",
      duration: "16h",
      price: 249,
      image_url: "",
      instructor: "Prof. Julie Moreau",
      rating: 4.8,
      students_count: 1120,
    },
    {
      id: "11",
      title: "Computer Vision Pratique",
      description: "Détection d'objets, reconnaissance faciale et analyse d'images avec OpenCV et PyTorch.",
      domain: "Intelligence Artificielle",
      level: "Avancé",
      support: "Vidéo",
      duration: "48h",
      price: 579,
      image_url: "",
      instructor: "Dr. Nicolas Petit",
      rating: 4.9,
      students_count: 321,
    },
    {
      id: "12",
      title: "Automatisation avec l'IA",
      description: "Automatisez vos workflows métier grâce à l'IA et gagnez des heures chaque semaine.",
      domain: "IA Générative",
      level: "Débutant",
      support: "Texte",
      duration: "10h",
      price: 129,
      image_url: "",
      instructor: "Sophie Lambert",
      rating: 4.5,
      students_count: 5600,
    },
  ];

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let countQuery = supabase
      .from("formations")
      .select("*", { count: "exact", head: true });

    if (selectedDomain) countQuery = countQuery.eq("domain", selectedDomain);
    if (selectedLevel) countQuery = countQuery.eq("level", selectedLevel);
    if (selectedSupport) countQuery = countQuery.eq("support", selectedSupport);

    const { count } = await countQuery;
    totalCount = count || 0;

    let dataQuery = supabase
      .from("formations")
      .select("*")
      .range(offset, offset + ITEMS_PER_PAGE - 1)
      .order("created_at", { ascending: false });

    if (selectedDomain) dataQuery = dataQuery.eq("domain", selectedDomain);
    if (selectedLevel) dataQuery = dataQuery.eq("level", selectedLevel);
    if (selectedSupport) dataQuery = dataQuery.eq("support", selectedSupport);

    const { data, error } = await dataQuery;

    if (error) throw error;

    formations = (data as Formation[]) || [];
  } catch (err) {
    hasError = true;
    const filtered = staticFallback.filter((f) => {
      const domainMatch = !selectedDomain || f.domain === selectedDomain;
      const levelMatch = !selectedLevel || f.level === selectedLevel;
      const supportMatch = !selectedSupport || f.support === selectedSupport;
      return domainMatch && levelMatch && supportMatch;
    });
    totalCount = filtered.length;
    formations = filtered.slice(offset, offset + ITEMS_PER_PAGE);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const domains = [
    "Intelligence Artificielle",
    "Data Science",
    "IA Générative",
    "Cloud & IA",
    "IA & Société",
  ];

  const levels = ["Débutant", "Intermédiaire", "Avancé"];
  const supports = ["Vidéo", "Texte", "Hybride"];

  const buildUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams();
    if (selectedDomain) base.set("domain", selectedDomain);
    if (selectedLevel) base.set("level", selectedLevel);
    if (selectedSupport) base.set("support", selectedSupport);
    if (currentPage > 1) base.set("page", String(currentPage));
    Object.entries(params).forEach(([k, v]) => {
      if (v) base.set(k, v);
      else base.delete(k);
    });
    const str = base.toString();
    return str ? "/catalogue?" + str : "/catalogue";
  };

  const getLevelColor = (level: string) => {
    if (level === "Débutant") return "#4ade80";
    if (level === "Intermédiaire") return "#fb923c";
    if (level === "Avancé") return "#f87171";
    return "#c8a96e";
  };

  const getSupportIcon = (support: string) => {
    if (support === "Vidéo") return "▶";
    if (support === "Texte") return "📄";
    if (support === "Hybride") return "⚡";
    return "◆";
  };

  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "½" : "") + "☆".repeat(5 - Math.ceil(rating));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#e8e8f0",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(5, 5, 8, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          padding: "0 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#050508",
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #c8a96e, #e8c882)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AcadémIA Pro
            </span>
          </div>

          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {["Accueil", "Catalogue", "Parcours", "Instructeurs"].map((item) => (
              <a
                key={item}
                href={item === "Catalogue" ? "/catalogue" : "#"}
                style={{
                  color: item === "Catalogue" ? "#c8a96e" : "rgba(232,232,240,0.7)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: item === "Catalogue" ? "600" : "400",
                  borderBottom: item === "Catalogue" ? "2px solid #c8a96e" : "2px solid transparent",
                  paddingBottom: "2px",
                  transition: "color 0.2s",
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              style={{
                background: "transparent",
                border: "1px solid rgba(200,169,110,0.4)",
                color: "#c8a96e",
                padding: "8px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
            >
              Connexion
            </button>
            <button
              style={{
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                border: "none",
                color: "#050508",
                padding: "8px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "700",
              }}
            >
              S'inscrire
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        style={{
          position: "relative
}}}