export default async function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .single();

  const { data: similarArticles } = await supabase
    .from("articles")
    .select("id, title, slug, category, created_at")
    .neq("slug", params.slug)
    .limit(3);

  const displayArticle = article || {
    id: "demo",
    title: "Comment l'IA Révolutionne l'Apprentissage Académique en 2025",
    slug: "ia-apprentissage-academique-2025",
    category: "Intelligence Artificielle",
    content: `
      L'intelligence artificielle transforme profondément la manière dont les étudiants apprennent et progressent dans leur cursus académique. AcadémIA Pro se positionne à l'avant-garde de cette révolution pédagogique.

      Aujourd'hui, les algorithmes d'apprentissage adaptatif permettent de personnaliser chaque parcours éducatif selon le rythme, les forces et les lacunes de chaque apprenant. Finis les cours magistraux uniformes : place à une pédagogie sur mesure, augmentée par la data et l'IA.

      Les études montrent que les étudiants utilisant des plateformes IA comme AcadémIA Pro améliorent leurs résultats de 40% en moyenne sur une période de 3 mois. La rétention de l'information est multipliée par 2,5 grâce aux techniques de répétition espacée pilotées par l'IA.

      Notre moteur d'IA analyse en temps réel les patterns d'apprentissage, identifie les zones de difficulté et propose automatiquement des ressources complémentaires ciblées. Cette approche data-driven révolutionne l'efficacité pédagogique.

      Les formateurs partenaires d'AcadémIA Pro témoignent d'une réduction de 60% du temps consacré aux tâches répétitives, leur permettant de se concentrer sur ce qui compte vraiment : l'accompagnement humain et la transmission de passion.

      L'avenir de l'éducation est hybride, intelligent et personnalisé. AcadémIA Pro est votre partenaire pour naviguer dans cette transformation et en faire un levier de réussite extraordinaire.
    `,
    author: "AcadémIA Pro",
    created_at: new Date().toISOString(),
    formation_slug: "formation-ia-academique",
    formation_title: "Formation IA & Pédagogie Avancée",
  };

  const staticSimilar = [
    {
      id: "s1",
      title: "5 Techniques IA pour Mémoriser 10x Plus Vite",
      slug: "techniques-ia-memorisation",
      category: "Méthodes d'apprentissage",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "s2",
      title: "Prompt Engineering pour Étudiants : Guide Complet",
      slug: "prompt-engineering-etudiants",
      category: "Intelligence Artificielle",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "s3",
      title: "AcadémIA Pro vs ChatGPT : Lequel Choisir pour Étudier ?",
      slug: "academia-vs-chatgpt-etudes",
      category: "Comparatifs",
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ];

  const displaySimilar =
    similarArticles && similarArticles.length > 0
      ? similarArticles
      : staticSimilar;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const paragraphs = displayArticle.content
    ? displayArticle.content
        .split("\n\n")
        .filter((p: string) => p.trim() !== "")
    : [];

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#e8e8f0",
      }}
    >
      {/* HEADER NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "rgba(5, 5, 8, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #f0d080)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              color: "#050508",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #c8a96e, #f0d080)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AcadémIA Pro
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a
            href="/blog"
            style={{
              color: "#c8a96e",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            ← Blog
          </a>
          <a
            href="/formations"
            style={{
              backgroundColor: "#c8a96e",
              color: "#050508",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "700",
              padding: "8px 20px",
              borderRadius: "8px",
            }}
          >
            Formations
          </a>
        </div>
      </nav>

      {/* HERO ARTICLE */}
      <div
        style={{
          paddingTop: "104px",
          paddingBottom: "60px",
          padding: "104px 24px 60px",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        {/* BADGE CATÉGORIE */}
        <div style={{ marginBottom: "24px", marginTop: "40px" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200, 169, 110, 0.12)",
              border: "1px solid rgba(200, 169, 110, 0.35)",
              color: "#c8a96e",
              fontSize: "12px",
              fontWeight: "700",
              padding: "6px 16px",
              borderRadius: "100px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {displayArticle.category || "Article"}
          </span>
        </div>

        {/* TITRE */}
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: "800",
            lineHeight: "1.15",
            color: "#f0ece4",
            marginBottom: "28px",
            letterSpacing: "-0.02em",
          }}
        >
          {displayArticle.title}
        </h1>

        {/* AUTEUR & DATE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingBottom: "32px",
            borderBottom: "1px solid rgba(200, 169, 110, 0.12)",
            marginBottom: "48px",
          }}
        >
          {/* AVATAR IA */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e 0%, #8b6914 50%, #c8a96e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(200, 169, 110, 0.35)",
              position: "relative",
            }}
          >
            🤖
            <div
              style={{
                position: "absolute",
                bottom: "1px",
                right: "1px",
                width: "14px",
                height: "14px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                border: "2px solid #050508",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#f0ece4",
                marginBottom: "3px",
              }}
            >
              {displayArticle.author || "Avatar IA AcadémIA Pro"}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(200, 169, 110, 0.7)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✦ Intelligence Artificielle AcadémIA</span>
              <span style={{ color: "rgba(200, 169, 110, 0.3)" }}>•</span>
              <span>
                {displayArticle.created_at
                  ? formatDate(displayArticle.created_at)
                  : ""}
              </span>
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            <button
              style={{
                backgroundColor: "rgba(200, 169, 110, 0.08)",
                border: "1px solid rgba(200, 169, 110, 0.2)",
                color: "#c8a96e",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              Partager
            </button>
          </div>
        </div>

        {/* CONTENU ARTICLE */}
        <article>
          {paragraphs.map((paragraph: string, index: number) => (
            <p
              key={index}
              style={{
                fontSize: "17px",
                lineHeight: "1.85",
                color: "rgba(232, 232, 240, 0.85)",
                marginBottom: "28px",
                letterSpacing: "0.01em",
              }}
            >
              {paragraph.trim()}
            </p>
          ))}
        </article>

        {/* TAGS / SHARE */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "32px",
            borderTop: "1px solid rgba(200, 169, 110, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["IA", "Apprentissage", "Pédagogie", "Innovation"].map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: "rgba(200, 169, 110, 0.07)",
                  border: "1px solid rgba(200, 169, 110, 0.2)",
                  color: "rgba(200, 169, 110, 0.8)",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "5px 12px",
                  borderRadius: "6px",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
          <div
            style={{ fontSize: "13px", color: "rgba(232, 232, 240, 0.4)" }}
          >
            Généré par AcadémIA Pro
          </div>
        </div>
      </div>

      {/* CTA FORMATION */}
      <div
        style={{
          margin: "0 auto 80px",
          maxWidth: "860px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(200, 169, 110, 0.08) 0%, rgba(200, 169, 110, 0.03) 100%)",
            border: "1px solid rgba(200, 169, 110, 0.25)",
            borderRadius: "20px",
            padding: "48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Décoration fond */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #c8a96e, #8b6914)",
              fontSize: "28px",
              marginBottom: "24px",
              boxShadow: "0 8px 32px rgba(200, 169, 110, 0.3)",
            }}
          >