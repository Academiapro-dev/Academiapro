export default function AcademiaProLMS() {
  const [activeTab, setActiveTab] = React.useState("formations");
  const [chatMessage, setChatMessage] = React.useState("");
  const [chatHistory, setChatHistory] = React.useState([
    {
      role: "assistant",
      message: "Bonjour ! Je suis votre tuteur IA AcadémIA Pro. Comment puis-je vous aider aujourd'hui ?",
      time: "10:30"
    },
    {
      role: "user",
      message: "Peux-tu m'expliquer les closures en JavaScript ?",
      time: "10:32"
    },
    {
      role: "assistant",
      message: "Bien sûr ! Une closure est une fonction qui capture les variables de son environnement lexical. Même après que la fonction externe a terminé son exécution, la fonction interne garde accès à ces variables. C'est très utile pour créer des données privées et des fonctions d'usine.",
      time: "10:32"
    }
  ]);
  const [quizActive, setQuizActive] = React.useState(false);
  const [quizAnswer, setQuizAnswer] = React.useState(null);
  const [selectedModule, setSelectedModule] = React.useState(null);

  const formations = [
    {
      id: 1,
      title: "Développement React Avancé",
      category: "Frontend",
      progress: 68,
      totalModules: 12,
      completedModules: 8,
      score: 87,
      color: "#c8a96e",
      instructor: "Dr. Marie Laurent",
      nextLesson: "Hooks Personnalisés",
      timeLeft: "4h 20min",
      modules: [
        { id: 1, title: "Introduction à React 18", completed: true, score: 95, duration: "45min", type: "video" },
        { id: 2, title: "useState et useEffect", completed: true, score: 88, duration: "60min", type: "video" },
        { id: 3, title: "Context API", completed: true, score: 92, duration: "50min", type: "video" },
        { id: 4, title: "useReducer avancé", completed: true, score: 78, duration: "55min", type: "video" },
        { id: 5, title: "Mémoisation", completed: true, score: 85, duration: "40min", type: "quiz" },
        { id: 6, title: "Portals et Refs", completed: true, score: 90, duration: "35min", type: "video" },
        { id: 7, title: "Patterns avancés", completed: true, score: 82, duration: "70min", type: "video" },
        { id: 8, title: "Performance", completed: true, score: 88, duration: "65min", type: "quiz" },
        { id: 9, title: "Hooks Personnalisés", completed: false, score: null, duration: "55min", type: "video" },
        { id: 10, title: "Testing avec React", completed: false, score: null, duration: "80min", type: "video" },
        { id: 11, title: "Server Components", completed: false, score: null, duration: "60min", type: "video" },
        { id: 12, title: "Projet Final", completed: false, score: null, duration: "120min", type: "project" }
      ]
    },
    {
      id: 2,
      title: "Node.js & API REST",
      category: "Backend",
      progress: 42,
      totalModules: 10,
      completedModules: 4,
      score: 74,
      color: "#9b8fd4",
      instructor: "Prof. Thomas Dubois",
      nextLesson: "Middleware Express",
      timeLeft: "8h 15min",
      modules: [
        { id: 1, title: "Fondamentaux Node.js", completed: true, score: 88, duration: "50min", type: "video" },
        { id: 2, title: "Modules et NPM", completed: true, score: 75, duration: "45min", type: "video" },
        { id: 3, title: "Express.js Setup", completed: true, score: 82, duration: "60min", type: "video" },
        { id: 4, title: "Routes et Contrôleurs", completed: true, score: 70, duration: "55min", type: "quiz" },
        { id: 5, title: "Middleware Express", completed: false, score: null, duration: "65min", type: "video" },
        { id: 6, title: "Base de données", completed: false, score: null, duration: "90min", type: "video" },
        { id: 7, title: "Authentification JWT", completed: false, score: null, duration: "75min", type: "video" },
        { id: 8, title: "Validation", completed: false, score: null, duration: "50min", type: "quiz" },
        { id: 9, title: "Déploiement", completed: false, score: null, duration: "60min", type: "video" },
        { id: 10, title: "Projet API", completed: false, score: null, duration: "150min", type: "project" }
      ]
    },
    {
      id: 3,
      title: "Python Data Science",
      category: "Data",
      progress: 91,
      totalModules: 8,
      completedModules: 7,
      score: 94,
      color: "#4da6ff",
      instructor: "Dr. Sophie Chen",
      nextLesson: "Déploiement ML",
      timeLeft: "1h 30min",
      modules: [
        { id: 1, title: "Python Avancé", completed: true, score: 96, duration: "60min", type: "video" },
        { id: 2, title: "NumPy & Pandas", completed: true, score: 94, duration: "75min", type: "video" },
        { id: 3, title: "Matplotlib", completed: true, score: 91, duration: "50min", type: "video" },
        { id: 4, title: "Scikit-learn", completed: true, score: 95, duration: "80min", type: "quiz" },
        { id: 5, title: "Réseaux de Neurones", completed: true, score: 93, duration: "90min", type: "video" },
        { id: 6, title: "NLP Basics", completed: true, score: 97, duration: "70min", type: "video" },
        { id: 7, title: "Computer Vision", completed: true, score: 90, duration: "85min", type: "quiz" },
        { id: 8, title: "Déploiement ML", completed: false, score: null, duration: "100min", type: "project" }
      ]
    }
  ];

  const quizQuestions = [
    {
      question: "Quel hook React est utilisé pour optimiser les fonctions coûteuses ?",
      options: ["useMemo", "useCallback", "useEffect", "useRef"],
      correct: 1,
      explanation: "useCallback mémoïse une fonction callback, évitant sa recréation à chaque rendu."
    },
    {
      question: "Quelle est la complexité temporelle d'une recherche dans un objet JavaScript ?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correct: 2,
      explanation: "Les objets JavaScript utilisent des tables de hachage, offrant une complexité O(1) en moyenne."
    },
    {
      question: "Qu'est-ce qu'une closure en JavaScript ?",
      options: [
        "Une fonction sans paramètres",
        "Une fonction qui accède aux variables de sa portée externe",
        "Une classe abstraite",
        "Un type de promesse"
      ],
      correct: 1,
      explanation: "Une closure permet à une fonction d'accéder aux variables de son environnement lexical."
    }
  ];

  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [quizScore, setQuizScore] = React.useState(0);
  const [quizCompleted, setQuizCompleted] = React.useState(false);

  const certificates = [
    {
      id: 1,
      title: "JavaScript Fondamentaux",
      issueDate: "15 Janvier 2024",
      grade: "Excellence",
      score: 96,
      verified: true,
      color: "#c8a96e"
    },
    {
      id: 2,
      title: "TypeScript Avancé",
      issueDate: "3 Mars 2024",
      grade: "Distinction",
      score: 89,
      verified: true,
      color: "#9b8fd4"
    },
    {
      id: 3,
      title: "CSS & Design Systems",
      issueDate: "22 Avril 2024",
      grade: "Mention Bien",
      score: 82,
      verified: true,
      color: "#4da6ff"
    }
  ];

  const liveSessions = [
    {
      id: 1,
      title: "Workshop React Server Components",
      instructor: "Dr. Marie Laurent",
      date: "Aujourd'hui",
      time: "18:00 - 19:30",
      participants: 47,
      maxParticipants: 50,
      live: true,
      topic: "React Avancé"
    },
    {
      id: 2,
      title: "Q&A Node.js Authentification",
      instructor: "Prof. Thomas Dubois",
      date: "Demain",
      time: "14:00 - 15:00",
      participants: 23,
      maxParticipants: 40,
      live: false,
      topic: "Backend"
    },
    {
      id: 3,
      title: "Masterclass Machine Learning",
      instructor: "Dr. Sophie Chen",
      date: "Vendredi 24 Jan",
      time: "10:00 - 12:00",
      participants: 31,
      maxParticipants: 60,
      live: false,
      topic: "Data Science"
    }
  ];

  const replays = [
    {
      id: 1,
      title: "Introduction aux Hooks React",
      instructor: "Dr. Marie Laurent",
      date: "12 Jan 2024",
      duration: "1h 45min",
      views: 1247,
      rating: 4.9
    },
    {
      id: 2,
      title: "Architecture Microservices",
      instructor: "Prof. Thomas Dubois",
      date: "8 Jan 2024",
      duration: "2h 10min",
      views: 892,
      rating: 4.7
    },
    {
      id: 3,
      title: "Deep Learning Pratique",
      instructor: "Dr. Sophie Chen",
      date: "5 Jan 2024",
      duration: "2h 30min",
      views: 2103,
      rating: 4.8
    }
  ];

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = {
      role: "user",
      message: chatMessage,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    const responses = [
      "Excellente question ! En React, les hooks suivent des règles strictes : ils ne peuvent être appelés qu'au niveau supérieur d'un composant fonctionnel, jamais dans des conditions ou des boucles.",
      "Voici un exemple concret : imagine une closure comme une sac à dos que la fonction emporte lors de sa création, contenant toutes les variables accessibles à ce moment-là.",
      "C'est un concept fondamental ! Pour mieux comprendre, je vous suggère de pratiquer avec les exercices du module 5 de votre formation React.",
      "Très bonne réflexion ! Cette approche est utilisée par des équipes comme celle de Facebook. Voulez-vous que je vous explique les cas d'usage pratiques ?",
      "Je vois que vous progressez bien dans votre formation ! Votre score moyen de 87% est excellent. Continuez sur cette lancée !"
    ];
    const assistantMsg = {
      role: "assistant",
      message: responses[Math.floor(Math.random() * responses.length)],
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    setChatHistory(prev => [...prev, userMsg, assistantMsg]);
    setChatMessage("");
  };

  const handleQuizAnswer = (answerIndex) => {
    setQuizAnswer(answerIndex);
    if (answerIndex === quizQuestions[currentQuestion].correct) {
      setQuizScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setQuizAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setQuizAnswer(null);
    setQuizActive(false);
  };

  const overallProgress = Math.round(formations.reduce((acc, f) => acc + f.progress, 0) / formations.length);
  const totalCertificates = certificates.length;
  const averageScore = Math.round(formations.reduce((acc, f) => acc + f.score, 0) / formations.length);

  return React.createElement("div", {
    style: {
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#e8e8f0"
    }
  },
    React.createElement("nav", {
      style: {
        backgroundColor: "#080810",
        borderBottom: "1px solid rgba(200,169,110,0.2)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)"
      }
    },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: "12px" }
      },
        React.createElement("div", {
          style: {
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #c8a96e, #a07840)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#050508"
          }
        }, "A"),
        React.createElement("div", null,
          React.createElement("span", {
            style: { fontSize: "18px", fontWeight: "700", color: "#c8a96e" }
          }, "Académ