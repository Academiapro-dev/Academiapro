export default function ArticlePage({ params }: { params: { slug: string } }) {
  const articles: Record<string, {
    title: string;
    date: string;
    category: string;
    content: string[];
    author: string;
    formation: string;
    formationSlug: string;
    readTime: string;
    tags: string[];
  }> = {
    "intelligence-artificielle-education": {
      title: "L'Intelligence Artificielle révolutionne l'éducation moderne",
      date: "15 janvier 2024",
      category: "Intelligence Artificielle",
      content: [
        "L'intelligence artificielle transforme profondément les méthodes pédagogiques contemporaines. Les algorithmes d'apprentissage adaptatif permettent désormais de personnaliser chaque parcours éducatif selon les besoins spécifiques de l'apprenant, créant une expérience unique et optimisée.",
        "Les plateformes éducatives intégrant l'IA analysent en temps réel les performances des étudiants, identifiant les lacunes et proposant des exercices ciblés. Cette approche data-driven représente une évolution majeure par rapport aux méthodes traditionnelles uniformisées.",
        "Les tuteurs virtuels alimentés par des modèles de langage avancés offrent une disponibilité 24h/24, répondant instantanément aux questions des apprenants. La qualité des réponses atteint désormais un niveau comparable à celui d'enseignants humains qualifiés.",
        "L'analyse prédictive permet d'anticiper les difficultés avant qu'elles ne deviennent problématiques. En détectant les signaux faibles dans les comportements d'apprentissage, les systèmes IA peuvent intervenir de manière proactive pour maintenir la motivation et la progression.",
        "Cette révolution pédagogique soulève également des questions éthiques importantes concernant la protection des données, l'équité d'accès et le rôle fondamental de l'enseignant humain dans le processus éducatif."
      ],
      author: "AcadémIA Pro",
      formation: "Maîtrisez l'IA pour l'Éducation",
      formationSlug: "ia-pour-education",
      readTime: "8 min",
      tags: ["IA", "Pédagogie", "Innovation", "EdTech"]
    },
    "prompt-engineering-maitrise": {
      title: "Maîtriser le Prompt Engineering pour maximiser vos résultats",
      date: "22 janvier 2024",
      category: "Prompt Engineering",
      content: [
        "Le prompt engineering est devenu une compétence fondamentale dans l'ère de l'intelligence artificielle générative. La capacité à formuler des instructions précises et efficaces détermine directement la qualité des outputs produits par les modèles de langage.",
        "Les techniques avancées comme le chain-of-thought prompting permettent d'améliorer significativement le raisonnement des LLMs sur des problèmes complexes. En guidant le modèle étape par étape, on obtient des résultats bien supérieurs aux approches directes.",
        "La structure d'un prompt optimal comprend généralement un contexte clair, une instruction précise, des exemples pertinents et des contraintes bien définies. Cette architecture en quatre composantes constitue la base de toute stratégie de prompting efficace.",
        "Les few-shot examples représentent l'un des outils les plus puissants du prompt engineer. En fournissant deux à cinq exemples illustratifs, on calibre le comportement du modèle et on réduit drastiquement la variance des outputs.",
        "L'itération constitue le cœur de la pratique du prompt engineering. Chaque interaction avec un LLM doit être analysée, documentée et affinée pour construire progressivement une bibliothèque de prompts performants adaptés à vos cas d'usage spécifiques."
      ],
      author: "AcadémIA Pro",
      formation: "Certification Prompt Engineering Expert",
      formationSlug: "prompt-engineering-expert",
      readTime: "12 min",
      tags: ["Prompts", "LLM", "ChatGPT", "Productivité"]
    },
    "avenir-travail-ia": {
      title: "L'avenir du travail à l'ère de l'IA générative",
      date: "8 février 2024",
      category: "Futur du Travail",
      content: [
        "L'avènement de l'IA générative remodèle fondamentalement le paysage professionnel mondial. Les métiers qui semblaient immunisés contre l'automatisation se retrouvent aujourd'hui profondément transformés par des outils capables de générer du texte, des images et du code.",
        "Contrairement aux révolutions industrielles précédentes, la transition actuelle touche simultanément les emplois cognitifs et créatifs. Les professionnels du droit, de la finance, du marketing et du développement logiciel doivent tous repenser leur proposition de valeur.",
        "Les compétences qui résistent à l'automatisation se cristallisent autour de l'intelligence émotionnelle, de la pensée critique contextuelle et de la capacité à orchestrer des systèmes IA complexes. L'humain devient chef d'orchestre plutôt qu'exécutant.",
        "Les organisations qui prospèrent dans ce nouvel environnement sont celles qui adoptent une approche d'augmentation plutôt que de substitution. L'humain augmenté par l'IA surpasse systématiquement l'IA seule dans les tâches à forte valeur ajoutée.",
        "La formation continue et l'adaptabilité deviennent les véritables actifs stratégiques des professionnels du 21ème siècle. Investir dans sa compréhension de l'IA n'est plus optionnel, c'est une nécessité de survie professionnelle."
      ],
      author: "AcadémIA Pro",
      formation: "Préparez-vous aux Métiers de Demain",
      formationSlug: "metiers-ia-futur",
      readTime: "10 min",
      tags: ["Carrière", "Automatisation", "Compétences", "Transformation"]
    }
  };

  const similarArticles = [
    {
      slug: "intelligence-artificielle-education",
      title: "L'IA révolutionne l'éducation moderne",
      category: "Intelligence Artificielle",
      date: "15 jan 2024",
      readTime: "8 min"
    },
    {
      slug: "prompt-engineering-maitrise",
      title: "Maîtriser le Prompt Engineering",
      category: "Prompt Engineering",
      date: "22 jan 2024",
      readTime: "12 min"
    },
    {
      slug: "avenir-travail-ia",
      title: "L'avenir du travail avec l'IA",
      category: "Futur du Travail",
      date: "8 fév 2024",
      readTime: "10 min"
    }
  ];

  const article = articles[params.slug] || articles["intelligence-artificielle-education"];
  const filteredSimilar = similarArticles.filter(a => a.slug !== params.slug).slice(0, 2);

  return (
    <div style={{
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#e8e8f0"
    }}>

      <nav style={{
        backgroundColor: "rgba(5, 5, 8, 0.95)",
        borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "800",
              color: "#050508"
            }}>A</div>
            <span style={{
              fontSize: "20px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #e8c878)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>AcadémIA Pro</span>
          </div>

          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            {["Blog", "Formations", "À propos", "Contact"].map(item => (
              <a key={item} href="#" style={{
                color: "#9090a8",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "500",
                transition: "color 0.2s"
              }}>{item}</a>
            ))}
            <a href="#formation" style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "700"
            }}>Commencer</a>
          </div>
        </div>
      </nav>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px 0"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          <a href="#" style={{ color: "#9090a8", textDecoration: "none", fontSize: "14px" }}>Accueil</a>
          <span style={{ color: "#4a4a60", fontSize: "14px" }}>›</span>
          <a href="#" style={{ color: "#9090a8", textDecoration: "none", fontSize: "14px" }}>Blog</a>
          <span style={{ color: "#4a4a60", fontSize: "14px" }}>›</span>
          <span style={{ color: "#c8a96e", fontSize: "14px" }}>{article.category}</span>
        </div>
      </div>

      <header style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 24px 60px"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(200, 169, 110, 0.12)",
          border: "1px solid rgba(200, 169, 110, 0.3)",
          borderRadius: "20px",
          padding: "6px 14px",
          marginBottom: "24px"
        }}>
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#c8a96e"
          }}></div>
          <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "600" }}>{article.category}</span>
        </div>

        <h1 style={{
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: "800",
          lineHeight: "1.2",
          marginBottom: "28px",
          maxWidth: "820px",
          background: "linear-gradient(135deg, #ffffff 0%, #c8c8e0 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>{article.title}</h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e, #6040c8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              border: "2px solid rgba(200, 169, 110, 0.4)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, rgba(200, 169, 110, 0.8), rgba(96, 64, 200, 0.8))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3" fill="white" fillOpacity="0.9"/>
                  <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <circle cx="18" cy="6" r="2" fill="#c8a96e"/>
                  <path d="M16 4l1 1 2-2" stroke="#050508" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#e8e8f0" }}>{article.author}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>IA Pédagogique Certifiée</p>
            </div>
          </div>

          <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(200, 169, 110, 0.2)" }}></div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9090a8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ color: