import React from "react";

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

interface Article {
  slug: string;
  titre: string;
  date: string;
  categorie: string;
  auteur: string;
  contenu: string[];
  tempsLecture: number;
}

interface ArticleSimilaire {
  slug: string;
  titre: string;
  categorie: string;
  date: string;
}

const articlesData: Record<string, Article> = {
  "introduction-intelligence-artificielle": {
    slug: "introduction-intelligence-artificielle",
    titre: "Introduction à l'Intelligence Artificielle en 2024",
    date: "15 janvier 2024",
    categorie: "Intelligence Artificielle",
    auteur: "Dr. Sarah Moreau",
    tempsLecture: 8,
    contenu: [
      "L'intelligence artificielle représente aujourd'hui l'une des révolutions technologiques les plus profondes de notre époque. En 2024, nous assistons à une accélération sans précédent des capacités des systèmes d'IA, transformant radicalement notre façon de travailler, de créer et d'innover.",
      "Les modèles de langage de grande taille (LLM) comme GPT-4, Claude ou Gemini ont démontré des capacités remarquables dans la compréhension et la génération de texte, ouvrant de nouvelles perspectives pour les développeurs, les créateurs de contenu et les entrepreneurs.",
      "La démocratisation de l'IA constitue un phénomène majeur : des outils autrefois réservés aux grandes entreprises technologiques sont désormais accessibles à tous. Cette accessibilité créé des opportunités extraordinaires pour les professionnels qui souhaitent intégrer ces technologies dans leurs pratiques quotidiennes.",
      "Maîtriser les fondamentaux de l'IA n'est plus une option pour les professionnels d'aujourd'hui, c'est une nécessité stratégique. Comprendre comment fonctionnent ces systèmes, leurs capacités et leurs limites permet de les utiliser efficacement et de manière éthique.",
      "La formation continue dans ce domaine est essentielle. Les technologies évoluent à une vitesse vertigineuse, et seule une approche structurée et progressive de l'apprentissage permet de rester compétitif dans cet environnement en constante mutation.",
    ],
  },
  "prompt-engineering-techniques": {
    slug: "prompt-engineering-techniques",
    titre: "Techniques Avancées de Prompt Engineering",
    date: "22 janvier 2024",
    categorie: "Prompt Engineering",
    auteur: "Marc Dubois",
    tempsLecture: 12,
    contenu: [
      "Le prompt engineering est devenu une compétence fondamentale pour quiconque souhaite exploiter pleinement le potentiel des modèles d'intelligence artificielle. La façon dont vous formulez vos instructions détermine directement la qualité et la pertinence des réponses obtenues.",
      "Les techniques de chain-of-thought prompting permettent d'amener les modèles d'IA à raisonner étape par étape, produisant des résultats bien plus précis et fiables pour les problèmes complexes. Cette approche simule le processus de réflexion humain.",
      "Le few-shot learning constitue une autre technique puissante : en fournissant quelques exemples dans votre prompt, vous guidez le modèle vers le format et le style de réponse que vous attendez, sans nécessiter de réentraînement coûteux.",
      "La structuration des prompts avec des rôles définis, des contextes clairs et des contraintes précises améliore significativement la cohérence des outputs. Un prompt bien construit est comparable à une specification fonctionnelle claire pour un développeur.",
      "Maîtriser ces techniques transforme votre productivité. Les professionnels formés au prompt engineering avancé rapportent des gains de temps considérables et une qualité de travail nettement supérieure dans leurs interactions quotidiennes avec les outils d'IA.",
    ],
  },
  "ia-generative-business": {
    slug: "ia-generative-business",
    titre: "L'IA Générative au Service de Votre Business",
    date: "30 janvier 2024",
    categorie: "Business & IA",
    auteur: "Claire Fontaine",
    tempsLecture: 10,
    contenu: [
      "L'IA générative redéfinit les règles du jeu dans le monde des affaires. Des startups aux grandes entreprises, les organisations qui intègrent intelligemment ces outils dans leurs processus gagnent un avantage compétitif décisif sur leurs concurrents.",
      "La création de contenu est l'un des domaines où l'impact est le plus immédiat : articles de blog, posts sur les réseaux sociaux, emails marketing, descriptions produits... Les équipes augmentées par l'IA produisent plus vite et maintiennent une cohérence de marque remarquable.",
      "Au-delà du contenu, l'IA générative révolutionne le service client, l'analyse de données, le développement produit et même la prise de décision stratégique. Les entreprises les plus innovantes utilisent ces outils pour identifier des opportunités de marché invisibles à l'œil humain.",
      "L'intégration de l'IA dans vos workflows ne doit pas être perçue comme un remplacement des talents humains, mais comme une amplification de leurs capacités. Les équipes qui collaborent efficacement avec l'IA deviennent exponentiellement plus productives.",
      "Investir dans la formation de vos équipes à l'utilisation stratégique de l'IA est aujourd'hui l'un des retours sur investissement les plus élevés disponibles pour une entreprise. Chaque heure investie en formation se traduit par des dizaines d'heures économisées.",
    ],
  },
};

const articlesSimilairesData: ArticleSimilaire[] = [
  {
    slug: "introduction-intelligence-artificielle",
    titre: "Introduction à l'Intelligence Artificielle en 2024",
    categorie: "Intelligence Artificielle",
    date: "15 janvier 2024",
  },
  {
    slug: "prompt-engineering-techniques",
    titre: "Techniques Avancées de Prompt Engineering",
    categorie: "Prompt Engineering",
    date: "22 janvier 2024",
  },
  {
    slug: "ia-generative-business",
    titre: "L'IA Générative au Service de Votre Business",
    categorie: "Business & IA",
    date: "30 janvier 2024",
  },
];

const AvatarIA: React.FC<{ nom: string }> = ({ nom }) => {
  const initiales = nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "700",
        color: "#050508",
        flexShrink: 0,
        position: "relative",
        boxShadow: "0 0 20px rgba(200, 169, 110, 0.4)",
      }}
    >
      {initiales}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          right: "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#c8a96e",
          border: "2px solid #050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#050508",
          }}
        />
      </div>
    </div>
  );
};

const BadgeCategorie: React.FC<{ categorie: string }> = ({ categorie }) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 16px",
      background: "rgba(200, 169, 110, 0.15)",
      border: "1px solid rgba(200, 169, 110, 0.4)",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#c8a96e",
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
    }}
  >
    {categorie}
  </span>
);

const ArticleSimilaireCard: React.FC<{
  article: ArticleSimilaire;
  estActuel: boolean;
}> = ({ article, estActuel }) => (
  <a
    href={"/blog/" + article.slug}
    style={{
      display: "block",
      padding: "20px",
      background: estActuel
        ? "rgba(200, 169, 110, 0.1)"
        : "rgba(255, 255, 255, 0.02)",
      border: estActuel
        ? "1px solid rgba(200, 169, 110, 0.5)"
        : "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "12px",
      textDecoration: "none",
      transition: "all 0.3s ease",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      if (!estActuel) {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(200, 169, 110, 0.07)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "rgba(200, 169, 110, 0.3)";
      }
    }}
    onMouseLeave={(e) => {
      if (!estActuel) {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(255, 255, 255, 0.02)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "rgba(255, 255, 255, 0.06)";
      }
    }}
  >
    <div
      style={{
        fontSize: "10px",
        fontWeight: "600",
        color: "#c8a96e",
        letterSpacing: "1px",
        textTransform: "uppercase" as const,
        marginBottom: "8px",
      }}
    >
      {article.categorie}
    </div>
    <div
      style={{
        fontSize: "14px",
        fontWeight: "600",
        color: estActuel ? "#c8a96e" : "#f0e6d0",
        lineHeight: "1.4",
        marginBottom: "8px",
      }}
    >
      {article.titre}
    </div>
    <div
      style={{
        fontSize: "12px",
        color: "rgba(255, 255, 255, 0.35)",
      }}
    >
      {article.date}
    </div>
  </a>
);

const CTAFormation: React.FC = () => (
  <div
    style={{
      background: "linear-gradient(135deg, rgba(200, 169, 110, 0.12) 0%, rgba(200, 169, 110, 0.05) 100%)",
      border: "1px solid rgba(200, 169, 110, 0.3)",
      borderRadius: "20px",
      padding: "40px",
      textAlign: "center" as const,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "-60px",
        right: "-60px",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px auto",
        fontSize: "24px",
        boxShadow: "0 0 30px rgba(200, 169, 110, 0.3)",
      }}
    >
      🎓
    </div>
    <h3
      style={{
        fontSize: "22px",
        fontWeight: "700",
        color: "#f0e6d0",
        marginBottom: "12px",
        lineHeight: "1.3",
        margin: "0 0 12px 0",
      }}
    >
      Maîtrisez l'IA comme un Expert
    </h3>
    <p
      style={{
        fontSize: "15px",
        color: "rgba(240, 230, 208, 0.65)",
        lineHeight: "1.6",
        marginBottom: "28px",
        maxWidth: "400px",
        margin: "0 auto 28px auto",
      }}
    >
      Rejoignez notre formation complète sur l'IA et transformez votre
      productivité professionnelle dès aujourd'hui.
    </p>
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: "12px",
        alignItems: "center",
      }}
    >
      <a
        href="/formation"
        style={{
          display: "inline-block",
          padding: "14px 36px",
          background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: "700",
          color: "#050508",
          textDecoration: "none",
          letterSpacing: "0.5px",
          boxShadow: "0 4px 20px rgba(200, 169, 110, 0.35)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 8px 30px rgba(200, 169, 110, 0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 4px 20px rgba(200, 169, 110, 0.35)";
        }}
      >
        Découvrir la Formation →
      </a>
      <div
        style={{