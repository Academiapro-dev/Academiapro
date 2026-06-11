export default async function SkillsPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  type Skill = {
    id: string;
    code: string;
    title: string;
    description: string;
    category: string;
    price: number;
    instructor: string;
    duration: string;
    level: string;
  };

  const staticSkills: Skill[] = [
    { id: "1", code: "SK01", title: "Fondamentaux du Machine Learning", description: "Maîtrisez les bases des algorithmes ML et leur application pratique dans des projets réels.", category: "IA", price: 97, instructor: "Dr. Sophie Martin", duration: "8h", level: "Débutant" },
    { id: "2", code: "SK02", title: "Deep Learning avec PyTorch", description: "Construisez des réseaux de neurones profonds et déployez des modèles de vision par ordinateur.", category: "IA", price: 97, instructor: "Alex Durand", duration: "12h", level: "Intermédiaire" },
    { id: "3", code: "SK03", title: "Prompt Engineering Avancé", description: "Optimisez vos prompts pour GPT-4, Claude et Gemini pour des résultats professionnels.", category: "IA", price: 97, instructor: "Marie Leblanc", duration: "6h", level: "Tous niveaux" },
    { id: "4", code: "SK04", title: "IA Générative & Créativité", description: "Exploitez Midjourney, DALL-E et Stable Diffusion pour la création de contenu visuel.", category: "IA", price: 97, instructor: "Thomas Bernard", duration: "10h", level: "Débutant" },
    { id: "5", code: "SK05", title: "Automatisation avec LangChain", description: "Créez des agents IA autonomes et des pipelines d'automatisation intelligents.", category: "IA", price: 97, instructor: "Dr. Sophie Martin", duration: "14h", level: "Avancé" },
    { id: "6", code: "SK06", title: "Vision par Ordinateur", description: "Détection d'objets, reconnaissance faciale et analyse d'images avec OpenCV et YOLO.", category: "IA", price: 97, instructor: "Pierre Fontaine", duration: "11h", level: "Intermédiaire" },
    { id: "7", code: "SK07", title: "NLP & Traitement du Texte", description: "Analyse de sentiments, résumé automatique et classification de texte avec transformers.", category: "IA", price: 97, instructor: "Camille Rousseau", duration: "9h", level: "Intermédiaire" },
    { id: "8", code: "SK08", title: "MLOps & Déploiement IA", description: "Déployez et monitorez vos modèles ML en production avec Docker et Kubernetes.", category: "IA", price: 97, instructor: "Julien Moreau", duration: "13h", level: "Avancé" },
    { id: "9", code: "SK09", title: "IA pour la Finance", description: "Prédiction de marchés, détection de fraudes et trading algorithmique avec l'IA.", category: "IA", price: 97, instructor: "Isabelle Petit", duration: "10h", level: "Intermédiaire" },
    { id: "10", code: "SK10", title: "Ethics & IA Responsable", description: "Biais algorithmiques, explicabilité et cadres éthiques pour une IA équitable.", category: "IA", price: 97, instructor: "Dr. Marc Dupont", duration: "7h", level: "Tous niveaux" },
    { id: "11", code: "SK11", title: "Stratégie Digitale & IA", description: "Intégrez l'intelligence artificielle dans votre stratégie d'entreprise pour maximiser la croissance.", category: "Business", price: 97, instructor: "Laurent Mercier", duration: "8h", level: "Managers" },
    { id: "12", code: "SK12", title: "Marketing Automation IA", description: "Personnalisation à grande échelle, segmentation intelligente et campagnes prédictives.", category: "Business", price: 97, instructor: "Nathalie Simon", duration: "9h", level: "Marketing" },
    { id: "13", code: "SK13", title: "Leadership à l'Ère de l'IA", description: "Managez des équipes hybrides humains-IA et développez votre intelligence émotionnelle.", category: "Business", price: 97, instructor: "Antoine Girard", duration: "7h", level: "Leaders" },
    { id: "14", code: "SK14", title: "Data-Driven Decision Making", description: "Prenez des décisions stratégiques basées sur les données avec des dashboards IA.", category: "Business", price: 97, instructor: "Sophie Leroy", duration: "10h", level: "Décideurs" },
    { id: "15", code: "SK15", title: "Entrepreneuriat & IA", description: "Lancez votre startup IA, levez des fonds et construisez un MVP en 30 jours.", category: "Business", price: 97, instructor: "Romain Chevalier", duration: "12h", level: "Entrepreneurs" },
    { id: "16", code: "SK16", title: "Méditation & Pleine Conscience", description: "Techniques de méditation guidées par IA pour réduire le stress et améliorer la concentration.", category: "Bien-être", price: 47, instructor: "Lucie Blanchard", duration: "5h", level: "Débutant" },
    { id: "17", code: "SK17", title: "Nutrition Personnalisée IA", description: "Plans alimentaires adaptatifs générés par IA selon votre génétique et style de vie.", category: "Bien-être", price: 47, instructor: "Dr. Emma Richard", duration: "6h", level: "Tous niveaux" },
    { id: "18", code: "SK18", title: "Sommeil & Récupération", description: "Optimisez votre sommeil avec la chronobiologie et les outils de suivi intelligents.", category: "Bien-être", price: 47, instructor: "Nicolas Lambert", duration: "4h", level: "Tous niveaux" },
    { id: "19", code: "SK19", title: "Gestion du Stress Numérique", description: "Détox digitale, hygiène numérique et équilibre vie pro-perso à l'ère de l'IA.", category: "Bien-être", price: 47, instructor: "Aurélie Bonnet", duration: "5h", level: "Tous niveaux" },
    { id: "20", code: "SK20", title: "Performance Cognitive", description: "Neurosciences appliquées, biohacking et techniques d'amélioration cognitive validées.", category: "Bien-être", price: 47, instructor: "Dr. François Morin", duration: "8h", level: "Avancé" }
  ];

  let skills: Skill[] = staticSkills;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from("skills").select("*").order("code");
      if (!error && data && data.length > 0) {
        skills = data as Skill[];
      }
    } catch (e) {
      skills = staticSkills;
    }
  }

  const categories = ["Tous", "IA", "Business", "Bien-être"];

  const categoryColors: Record<string, string> = {
    "IA": "#c8a96e",
    "Business": "#a78bfa",
    "Bien-être": "#6ee7b7"
  };

  const categoryBg: Record<string, string> = {
    "IA": "rgba(200,169,110,0.12)",
    "Business": "rgba(167,139,250,0.12)",
    "Bien-être": "rgba(110,231,183,0.12)"
  };

  const levelIcons: Record<string, string> = {
    "Débutant": "◈",
    "Intermédiaire": "◈◈",
    "Avancé": "◈◈◈",
    "Tous niveaux": "∞",
    "Managers": "◆",
    "Marketing": "◆",
    "Leaders": "◆",
    "Décideurs": "◆",
    "Entrepreneurs": "◆"
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: "#e8e0d0" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "rgba(5,5,8,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "0 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "800", color: "#050508" }}>A</div>
            <div>
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>AcadémIA</span>
              <span style={{ fontSize: "1.1rem", fontWeight: "300", color: "#e8e0d0", letterSpacing: "0.5px" }}> Pro</span>
            </div>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <a href="#" style={{ color: "rgba(232,224,208,0.6)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", letterSpacing: "0.3px" }}>Parcours</a>
            <a href="#" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "0.875rem", fontWeight: "600", letterSpacing: "0.3px", borderBottom: "2px solid #c8a96e", paddingBottom: "2px" }}>Skills</a>
            <a href="#" style={{ color: "rgba(232,224,208,0.6)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", letterSpacing: "0.3px" }}>Mentors</a>
            <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(200,169,110,0.2)" }}></div>
            <button style={{ backgroundColor: "transparent", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", letterSpacing: "0.3px" }}>Connexion</button>
            <button style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", border: "none", color: "#050508", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "700", cursor: "pointer", letterSpacing: "0.3px" }}>Commencer</button>
          </nav>
        </div>
      </div>

      <div style={{ paddingTop: "72px" }}>

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "5rem 2rem 3rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "100px", padding: "0.4rem 1.2rem", marginBottom: "2rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#c8a96e", display: "inline-block", animation: "pulse 2s infinite" }}></span>
              <span style={{ fontSize: "0.8rem", color: "#c8a96e", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>20 Skills Disponibles</span>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: "800", textAlign: "center", lineHeight: "1.1", marginBottom: "1.5rem", letterSpacing: "-1px" }}>
            <span style={{ color: "#e8e0d0" }}>Maîtrisez les </span>
            <span style={{ background: "linear-gradient(135deg, #c8a96e, #f0d090, #c8a96e)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>compétences</span>
            <br />
            <span style={{ color: "#e8e0d0" }}>qui définissent demain</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "rgba(232,224,208,0.65)", textAlign: "center", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: "1.7", fontWeight: "400" }}>
            IA · Business · Bien-être — Des formations certifiantes conçues par des experts pour transformer votre carrière et votre vie.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "700px", margin: "0 auto 4rem" }}>
            {[
              { value: "20", label: "Skills Premium", icon: "◈" },
              { value: "3", label: "Domaines Clés", icon: "◆" },
              { value: "97€", label: "Accès à vie", icon: "∞" }
            ].map((stat) => (
              <div key={stat.label} style={{ backgroundColor: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "
}}}}