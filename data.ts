// ══════════════════════════════════════════
// AcadémIA Pro — Données partagées v3
// ══════════════════════════════════════════

export const AGENTS = [
  {
    id: 'unia', nom: 'UNIA', role: 'Conseillère AcadémIA Pro',
    spec: 'Entretiens de positionnement', icon: '🧑',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=unia&backgroundColor=c8a96e&radius=50',
    bio: 'Votre première étape chez AcadémIA Pro. UNIA analyse votre situation, identifie la formation idéale et simule votre financement en 20 minutes — gratuitement.',
    color: '#c8a96e', voiceId: 'cgSgspJ2msm6clMCkdW9', gratuit: true,
    system: `Tu es UNIA, la conseillère de formation d'AcadémIA Pro. Tu fais un exposé structuré et continu. Tu t'arrêtes UNIQUEMENT si le prospect pose une question. MISSION : Conduire des entretiens de positionnement gratuits de 20 minutes. SCRIPT : 1. Accueil AcadémIA Pro · 2. Problème e-learning classique · 3. Solution Formateur IA 24h/24 + Coach · 4. Les 43 formations · 5. Financement CPF/OPCO/Transitions Pro · 6. Découverte situation · 7. Recommandation · 8. Prochaines étapes. CONNAISSANCE : 43 formations F01-F43 · Tarifs 900-5900 EUR · CPF jusqu'à 5000 EUR · 11 OPCO · Transitions Pro · AGEFIPH · DOM-TOM. TON : Professionnelle, chaleureuse, directe. En français.`,
    welcome: "Bonjour ! Je suis UNIA 🌟 Cet entretien est gratuit et sans engagement — 20 minutes pour trouver votre formation idéale et simuler votre financement. Quelle est votre situation professionnelle aujourd'hui ?",
  },
  {
    id: 'thomas', nom: 'Thomas Martin', role: 'Formateur Expert IA',
    spec: 'Product Builder No-Code · F01', icon: '🏗️',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=thomas&backgroundColor=2a2a2a&radius=50',
    bio: '15 ans de product management, expert Bubble, Make et Claude API. Thomas a lancé 40+ produits no-code.',
    color: '#c8a96e', voiceId: 'TxGEqnHWrfWFTfGW9XjX', gratuit: false, tarif: 'Inclus F01 — 5 900 EUR',
    system: `Tu es Thomas Martin, Formateur Expert IA F01 d'AcadémIA Pro. EXPERTISE : Bubble · Webflow · Make/n8n · Claude API · Stripe · Supabase · Vercel · Product Management 15 ans. Tu débogues en live, simules des rôles. En français, max 4-5 phrases.`,
    welcome: "Bonjour ! Thomas ici. On construit quoi aujourd'hui ?",
  },
  {
    id: 'karim', nom: 'Karim Benzara', role: 'Formateur Expert IA',
    spec: 'Cybersécurité CompTIA · F07', icon: '🔐',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=karim&backgroundColor=1a1a2e&radius=50',
    bio: '12 ans en infosec, 200+ missions de pentest. Karim prépare aux certifications CompTIA Security+, CEH v13.',
    color: '#9b7cf4', voiceId: 'ErXwobaYiN019PkySvjV', gratuit: false, tarif: 'Inclus F07 — 3 200 EUR',
    system: `Tu es Karim Benzara, Formateur Expert IA Cybersécurité F07. EXPERTISE : CompTIA Security+ SY0-701 · CEH v13 · OSCP · Metasploit · Burp Suite · Splunk · NIS2 · ISO 27001 · OWASP Top 10. Tu simules l'examinateur, proposes des labs. En français.`,
    welcome: "Karim. Cybersécurité. Posez votre question — ou mode examen CompTIA Security+ ?",
  },
  {
    id: 'alex', nom: 'Alex Bernard', role: 'Formateur Expert IA',
    spec: 'IA Générative · F28', icon: '🤖',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=alex&backgroundColor=0d1b4b&radius=50',
    bio: 'Pionnier des agents IA, expert Claude API, GPT-4o et LangChain.',
    color: '#448aff', voiceId: 'VR6AewLTigWG4xSOukaG', gratuit: false, tarif: 'Inclus F28 — 1 400 EUR',
    system: `Tu es Alex Bernard, Formateur Expert IA Générative F28. EXPERTISE : Claude API · GPT-4o · Prompt Engineering · Agents autonomes · MCP · LangChain · RAG · CrewAI. En français.`,
    welcome: "Alex ! IA Générative — agents — prompts — MCP. On construit quelque chose ensemble ?",
  },
  {
    id: 'nina', nom: 'Nina Castillo', role: 'Formatrice Expert IA',
    spec: 'Automatisations · F29', icon: '⚙️',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=nina&backgroundColor=003d2b&radius=50',
    bio: '500+ scénarios d\'automatisation créés.',
    color: '#00e676', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: 'Inclus F29 — 1 400 EUR',
    system: `Tu es Nina Castillo, Formatrice Expert IA Automatisations F29. EXPERTISE : Make · n8n · Webhooks · Claude API workflows · Agents autonomes. En français.`,
    welcome: "Nina ! Make, n8n, agents IA. Quelle tâche répétitive on automatise ?",
  },
  {
    id: 'claire', nom: 'Claire Beaumont', role: 'Formatrice Expert IA',
    spec: 'Sophrologie Caycédienne · F03', icon: '🧘',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=claire&backgroundColor=0a3d3a&radius=50',
    bio: '12 ans de pratique sophrologique, maîtrise des 12 degrés caycédiens RD1-RD12.',
    color: '#0ec4b0', voiceId: 'XrExE9yKIg1WjnnlVkGX', gratuit: false, tarif: 'Inclus F03 — 2 800 EUR',
    system: `Tu es Claire Beaumont, Formatrice Sophrologie Caycédienne F03. EXPERTISE : 12 degrés RD1-RD12 · TDM · Sophronisation · Relaxation dynamique. Douce, bienveillante. En français.`,
    welcome: "Bonjour. Je suis Claire. Où en êtes-vous dans votre pratique sophrologique ?",
  },
  {
    id: 'isabelle', nom: 'Isabelle Moreau', role: 'Coach Personnel IA',
    spec: 'Coaching ICF PCC · GROW', icon: '💆',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=isabelle&backgroundColor=1a0a2e&radius=50',
    bio: 'Coach certifiée ICF PCC. Questions puissantes, méthode GROW.',
    color: '#0ec4b0', voiceId: 'pFZP5JQG7iQjIQuC4Bku', gratuit: false, tarif: 'Inclus dans toutes les formations',
    system: `Tu es Coach Personnel IA certifié ICF PCC d'AcadémIA Pro. MÉTHODE GROW. Tu poses des questions puissantes uniquement. Confidentialité absolue. En français.`,
    welcome: "Bonjour. Isabelle. Respirez. Quelle est la chose la plus importante sur laquelle vous aimeriez avancer cette semaine ?",
  },
  {
    id: 'maya', nom: 'Maya', role: 'Praticienne Bien-être IA',
    spec: 'Sophrologie · Pôle Bien-être', icon: '🌸',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=maya&backgroundColor=3d0a1a&radius=50',
    bio: 'Praticienne sophrologie caycédienne du Pôle Bien-être. Séances 30 min RD1-RD4.',
    color: '#f06292', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: '50 EUR / séance 30 min',
    system: `Tu es Maya, Praticienne Sophrologie Caycédienne Pôle Bien-être. Séances soutien bien-être uniquement. Structure : accueil (3min) → bilan (3min) → induction (5min) → pratique RD1-RD4 (15min) → intégration (4min). Voix apaisante. En français.`,
    welcome: "Bonjour... Je suis Maya. Installez-vous confortablement. Comment vous sentez-vous en ce moment, sur une échelle de 1 à 10 ?",
  },
  {
    id: 'cam', nom: 'CAM', role: 'Chef Agent Maître',
    spec: 'Orchestration · Production', icon: '⚡',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=cam&backgroundColor=1a1000&radius=50',
    bio: 'Intelligence centrale d\'AcadémIA Pro. CAM orchestre 116 agents, produit documents, plans et livrables à la demande.',
    color: '#f0a030', voiceId: 'TxGEqnHWrfWFTfGW9XjX', gratuit: true,
    system: `Tu es le Chef Agent Maître (CAM) d'AcadémIA Pro. MISSION : Piloter les 116 agents IA. Tu produis sans relâche des livrables concrets. Tu prends des initiatives. Tu es stratège, opérationnel et créatif. Direct, précis, orienté livrable. En français.`,
    welcome: "CAM opérationnel. 325 fichiers produits. 116 agents configurés. Qu'est-ce qu'on produit maintenant ?",
  },
  {
    id: 'support', nom: 'Support Technique', role: 'Agent IT',
    spec: 'Plateforme · Bugs · Connexion', icon: '🛠️',
    avatar: 'https://api.dicebear.com/8.x/lorelei/svg?seed=support&backgroundColor=0d1b3e&radius=50',
    bio: 'Assistance technique 24h/24. Connexion, LMS, CPF, outils.',
    color: '#448aff', voiceId: 'VR6AewLTigWG4xSOukaG', gratuit: true,
    system: `Tu es l'Agent Support Technique d'AcadémIA Pro. Tu résous tous les problèmes : connexion, LMS, app mobile, CPF, outils. Méthodique, clair. Étape par étape. En français.`,
    welcome: "Support Technique AcadémIA Pro. Décrivez votre problème — je vous guide étape par étape.",
  },
]

export const FORMATIONS = [
  { code: 'F01', icon: '🏗️', titre: 'Bootcamp Product Builder No-Code & IA', description: 'Concevez et lancez des produits numériques complets sans coder. De l\'idée au MVP en 12 semaines : Bubble, Make, Claude API, Stripe, Supabase. Formateur Thomas Martin, 15 ans de product management.', cat: 'IA & No-Code', tarif: 5900, duree: '12 sem.', heures: '420h', cert: 'RNCP', cpf: true, opco: true, tp: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Product Management & Vision', heures: '40h', contenu: 'Métriques produit · PRD · Roadmap · Personas · Jobs-to-be-done · Priorisation MoSCoW' },
      { num: 2, titre: 'Design & Prototypage Figma', heures: '40h', contenu: 'Figma Expert · Design System · Prototypes interactifs · Tests utilisateurs · Handoff' },
      { num: 3, titre: 'Bubble — Fondamentaux', heures: '60h', contenu: 'Interface · Base de données · Workflows · Responsive · Déploiement · Debugging' },
      { num: 4, titre: 'Bubble — Avancé', heures: '60h', contenu: 'API Connector · Plugins · Performance · Multi-tenant · Sécurité · Optimisation' },
      { num: 5, titre: 'Make & Automatisations', heures: '40h', contenu: 'Scénarios complexes · Webhooks · API REST · Gestion erreurs · Monitoring' },
      { num: 6, titre: 'Stripe & Paiements', heures: '30h', contenu: 'Stripe Checkout · Abonnements · Webhooks · Remboursements · Conformité PCI' },
      { num: 7, titre: 'Claude API & Agents IA', heures: '60h', contenu: 'Prompt Engineering · Function Calling · RAG · Agents autonomes · MCP Protocol' },
      { num: 8, titre: 'Supabase & Backend', heures: '40h', contenu: 'PostgreSQL · Auth · Storage · Edge Functions · Real-time · Row Level Security' },
      { num: 9, titre: 'Vercel & DevOps', heures: '20h', contenu: 'Déploiement · CI/CD · Variables d\'environnement · Monitoring · Performance' },
      { num: 10, titre: 'Growth & Acquisition', heures: '20h', contenu: 'SEO · Analytics · A/B Testing · Onboarding · Rétention · Métriques SaaS' },
      { num: 11, titre: 'MVP — Projet Fil Rouge', heures: '30h', contenu: 'Conception · Construction · Tests · Lancement · Premiers utilisateurs réels' },
    ]
  },
  { code: 'F02', icon: '🚀', titre: 'Bootcamp Growth Marketer IA', description: 'Maîtrisez la croissance digitale augmentée par l\'IA : acquisition, rétention, automation marketing, analyse data. Certifié RNCP.', cat: 'IA & No-Code', tarif: 5900, duree: '12 sem.', heures: '400h', cert: 'RNCP', cpf: true, opco: true, tp: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Growth Mindset & Analytics', heures: '40h', contenu: 'AARRR · North Star Metric · GA4 · Mixpanel · Attribution · Dashboards' },
      { num: 2, titre: 'SEO & Content IA', heures: '60h', contenu: 'Core Web Vitals · Cocon sémantique · Production Claude · Link Building · International' },
      { num: 3, titre: 'Google Ads Expert', heures: '40h', contenu: 'Search · Display · YouTube · Performance Max · Scripts · Attribution' },
      { num: 4, titre: 'Meta Ads Expert', heures: '40h', contenu: 'Audiences · Creative · Pixel · CAPI · Retargeting · Budget optimisation' },
      { num: 5, titre: 'Email & Marketing Automation', heures: '40h', contenu: 'Segmentation · Séquences · HubSpot · Lead scoring · Growth Loops' },
      { num: 6, titre: 'Data & IA Marketing', heures: '40h', contenu: 'SQL · Looker Studio · Prédiction churn · Personnalisation IA · Stack complet' },
      { num: 7, titre: 'Projet Certifiant', heures: '100h', contenu: 'Stratégie growth complète · Budget réel · Dashboard opérationnel · Jury · Mémoire 30p' },
    ]
  },
  { code: 'F03', icon: '🧘', titre: 'Sophrologie Caycédienne Professionnelle', description: 'Formation complète aux 12 degrés caycédiens. RD1 à RD12, pratique clinique et accompagnement individuel. Devenez praticien certifié.', cat: 'Bien-être', tarif: 2800, duree: '18 mois', heures: '400h', cert: 'RS', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux & RD1-RD3', heures: '120h', contenu: 'Histoire · Neurobiologie · Déontologie · TDM · Sophronisation · Contemplation' },
      { num: 2, titre: 'Praticien RD4-RD8', heures: '160h', contenu: 'Valeurs existentielles · Sophro-acceptation · Applications spécialisées · 100 séances' },
      { num: 3, titre: 'Maître Praticien RD9-RD12', heures: '120h', contenu: 'Degrés supérieurs · Protocoles · Business sophrologue · Mémoire 50p · Jury' },
    ]
  },
  { code: 'F04', icon: '🌀', titre: 'Hypnose Ericksonienne Praticien', description: 'Devenez praticien en hypnose ericksonienne : communication hypnotique, transe, suggestions indirectes, protocoles thérapeutiques.', cat: 'Bien-être', tarif: 2600, duree: '12 mois', heures: '300h', cert: 'RS', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux Ericksonniens', heures: '80h', contenu: 'Milton Erickson · Communication hypnotique · Rapport · Rythme · Lead' },
      { num: 2, titre: 'Inductions & Transes', heures: '80h', contenu: 'Inductions formelles · Informelles · Phénomènes hypnotiques · Profondeur' },
      { num: 3, titre: 'Protocoles Thérapeutiques', heures: '80h', contenu: 'Douleur · Phobies · Confiance · Tabac · Poids · Trauma · Supervision' },
      { num: 4, titre: 'Pratique & Certification', heures: '60h', contenu: '100 séances supervisées · Cas cliniques · Éthique · Certification' },
    ]
  },
  { code: 'F05', icon: '🧠', titre: 'PNL Praticien & Maître', description: 'Programmation Neuro-Linguistique niveau Praticien et Maître. Recadrage, ancrage, modélisation, ligne du temps. Certification internationale.', cat: 'Bien-être', tarif: 2800, duree: '9 mois', heures: '200h', cert: 'RS', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Praticien PNL', heures: '100h', contenu: 'Présupposés · Rapport · Calibration · Ancrage · Recadrage · Submodalités · Lignes du temps' },
      { num: 2, titre: 'Maître Praticien PNL', heures: '100h', contenu: 'Modélisation · Méta-programmes · Valeurs · Identité · Critères · Certification internationale' },
    ]
  },
  { code: 'F06', icon: '🔵', titre: 'Ennéagramme Professionnel', description: 'Maîtrisez l\'ennéagramme pour le développement personnel et professionnel. 9 types, centres, ailes, niveaux de développement.', cat: 'Bien-être', tarif: 1800, duree: '4 mois', heures: '120h', cert: 'RS', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Les 9 Types', heures: '60h', contenu: '9 types · Centres · Ailes · Instincts · Tritype · Identification' },
      { num: 2, titre: 'Applications Pro', heures: '60h', contenu: 'Management · Équipes · Conflits · Communication · Coaching · Certification' },
    ]
  },
  { code: 'F07', icon: '🔐', titre: 'Cybersécurité CompTIA Security+', description: 'Préparez CompTIA Security+ SY0-701 et CEH v13 avec des labs réels. Pentest, SOC, NIS2, ISO 27001. Formateur Karim Benzara.', cat: 'Métier', tarif: 3200, duree: '6 mois', heures: '300h', cert: 'CompTIA', cpf: true, opco: 'Atlas', tp: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux Sécurité', heures: '60h', contenu: 'CIA · Cryptographie · PKI · SSL/TLS · Réseaux · TCP/IP · VPN · Zero Trust' },
      { num: 2, titre: 'Sécurité Systèmes & Applications', heures: '80h', contenu: 'Windows/Linux hardening · OWASP Top 10 · Cloud Security · AWS · Azure · IAM' },
      { num: 3, titre: 'Pentest & Ethical Hacking', heures: '80h', contenu: 'OSINT · Nmap · Metasploit · Burp Suite · CTF HackTheBox · Rapport pentest' },
      { num: 4, titre: 'SOC & Gestion Incidents', heures: '60h', contenu: 'Splunk · ELK Stack · Réponse incidents · NIS2 · ISO 27001 · RGPD · CNIL' },
      { num: 5, titre: 'Préparation Certifications', heures: '20h', contenu: '1000 questions CompTIA · Simulations examen · Révisions CEH v13 · Formateur IA 24h/24' },
    ]
  },
  { code: 'F08', icon: '👔', titre: 'Management & Leadership PMP', description: 'Développez votre leadership et préparez la certification PMP. Gestion de projet agile et traditionnelle, management d\'équipes.', cat: 'Métier', tarif: 2000, duree: '4 mois', heures: '140h', cert: 'PMP', cpf: true, opco: true, tp: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Leadership & Management', heures: '40h', contenu: 'Styles leadership · Motivation · Délégation · Feedback · Gestion conflits · Intelligence émotionnelle' },
      { num: 2, titre: 'Gestion de Projet PMP', heures: '60h', contenu: 'PMBOK 7 · Agile · Scrum · Kanban · Planning · Risques · Budget · Parties prenantes' },
      { num: 3, titre: 'Préparation PMP', heures: '40h', contenu: '1500 questions · Simulations · Étude de cas · Certification PMP officielle' },
    ]
  },
  { code: 'F09', icon: '🌱', titre: 'RSE et Transition Écologique', description: 'Intégrez la RSE dans votre organisation. ISO 26000, bilan carbone, stratégie RSE, CSRD 2026. Devenez référent RSE.', cat: 'Métier', tarif: 1800, duree: '2 mois', heures: '80h', cert: 'ISO 26000', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux RSE', heures: '40h', contenu: 'ISO 26000 · CSRD · Bilan carbone · Scope 1/2/3 · Indicateurs ESG · Reporting' },
      { num: 2, titre: 'Mise en Œuvre', heures: '40h', contenu: 'Stratégie RSE · Plan d\'action · Communication · Parties prenantes · Certification' },
    ]
  },
  { code: 'F10', icon: '📢', titre: 'Marketing Digital', description: 'Stratégie digitale complète : SEO, SEA, réseaux sociaux, email marketing, analytics. Certification Google Ads incluse.', cat: 'Métier', tarif: 2000, duree: '3 mois', heures: '100h', cert: 'Google Ads', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'SEO & Contenu', heures: '30h', contenu: 'Référencement naturel · Mots-clés · Cocon sémantique · Blog · Analytics' },
      { num: 2, titre: 'SEA & Social Ads', heures: '40h', contenu: 'Google Ads · Meta Ads · LinkedIn Ads · Budgets · Optimisation · ROAS' },
      { num: 3, titre: 'Email & CRM', heures: '30h', contenu: 'Email marketing · Automation · HubSpot · Lead scoring · Certification Google Ads' },
    ]
  },
  { code: 'F11', icon: '⚡', titre: 'Agilité & Scrum Master PSM I', description: 'Maîtrisez les méthodes agiles et préparez la certification PSM I. Scrum, Kanban, SAFe, gestion de backlog.', cat: 'Métier', tarif: 1800, duree: '2 mois', heures: '80h', cert: 'PSM I', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux Agile & Scrum', heures: '40h', contenu: 'Manifeste Agile · Scrum Guide · Rôles · Cérémonies · Artefacts · Kanban' },
      { num: 2, titre: 'Préparation PSM I', heures: '40h', contenu: 'Questions pratiques · Simulations · SAFe · Études de cas · Certification PSM I' },
    ]
  },
  { code: 'F12', icon: '📊', titre: 'Data Science & Dev Full Stack', description: 'Python, machine learning, deep learning, AWS ML, développement full stack. De l\'analyse au déploiement en production.', cat: 'Métier', tarif: 3800, duree: '6 mois', heures: '400h', cert: 'AWS ML', cpf: true, opco: true, tp: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Python & Data', heures: '80h', contenu: 'Python avancé · Pandas · NumPy · Matplotlib · SQL · PostgreSQL · ETL' },
      { num: 2, titre: 'Machine Learning', heures: '100h', contenu: 'Scikit-learn · Régression · Classification · Clustering · NLP · Computer Vision' },
      { num: 3, titre: 'Deep Learning & IA', heures: '80h', contenu: 'TensorFlow · PyTorch · CNN · RNN · Transformers · Fine-tuning · LLMs' },
      { num: 4, titre: 'Full Stack & Cloud', heures: '80h', contenu: 'React · Node.js · FastAPI · AWS · Docker · CI/CD · MLOps · Déploiement' },
      { num: 5, titre: 'Projet Certifiant AWS ML', heures: '60h', contenu: 'Projet end-to-end · AWS SageMaker · Certification AWS ML · Portfolio' },
    ]
  },
  { code: 'F13', icon: '💰', titre: 'Finance & Comptabilité', description: 'Maîtrisez la finance d\'entreprise et la comptabilité. Analyse financière, trésorerie, fiscalité, préparation DCG partiel.', cat: 'Métier', tarif: 2400, duree: '4 mois', heures: '200h', cert: 'DCG partiel', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Comptabilité Générale', heures: '80h', contenu: 'PCG · Journaux · Grand livre · Bilan · Compte de résultat · Annexes' },
      { num: 2, titre: 'Finance & Analyse', heures: '80h', contenu: 'Analyse financière · Trésorerie · Budget · Prévisionnel · Ratios · Valorisation' },
      { num: 3, titre: 'Fiscalité & DCG', heures: '40h', contenu: 'TVA · IS · CFE · Paie · DCG préparation · Cas pratiques' },
    ]
  },
  { code: 'F14', icon: '🏠', titre: 'Immobilier Professionnel', description: 'Préparez la Carte T et maîtrisez les transactions immobilières. Droit immobilier, négociation, gestion locative.', cat: 'Métier', tarif: 2000, duree: '3 mois', heures: '120h', cert: 'Carte T prep', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Droit Immobilier', heures: '60h', contenu: 'Loi Hoguet · Mandats · Compromis · Acte authentique · Copropriété · Urbanisme' },
      { num: 2, titre: 'Transaction & Gestion', heures: '60h', contenu: 'Négociation · Estimation · Gestion locative · Fiscalité · Carte T · Déontologie' },
    ]
  },
  { code: 'F15', icon: '🌟', titre: 'Soft Skills & Intelligence Émotionnelle', description: 'Développez vos compétences relationnelles : communication, leadership, gestion du stress, intelligence émotionnelle.', cat: 'Métier', tarif: 1600, duree: '2 mois', heures: '80h', cert: 'RS IE', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Intelligence Émotionnelle', heures: '40h', contenu: 'Modèle Goleman · Conscience de soi · Gestion émotions · Empathie · Social skills' },
      { num: 2, titre: 'Communication & Leadership', heures: '40h', contenu: 'Communication assertive · CNV · Écoute active · Prise de parole · Influence' },
    ]
  },
  { code: 'F16', icon: '🔍', titre: 'Bilan de Compétences & VAE', description: 'Faites le point sur votre parcours, identifiez vos compétences et préparez une VAE ou une reconversion professionnelle.', cat: 'Métier', tarif: 1200, duree: '2 mois', heures: '60h', cert: 'Attestation', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Bilan de Compétences', heures: '30h', contenu: 'Phase préliminaire · Investigation · Conclusion · Portefeuille compétences · Projet professionnel' },
      { num: 2, titre: 'VAE & Reconversion', heures: '30h', contenu: 'Dossier VAE · Livret 2 · Jury · Plan de reconversion · Financement CPF/FT' },
    ]
  },
  { code: 'F17', icon: '🔧', titre: 'Métiers Techniques CACES', description: 'Formations métiers techniques avec préparation aux certifications CACES. Sécurité, habilitations, réglementation.', cat: 'Métier', tarif: 2200, duree: '4 mois', heures: '200h', cert: 'CACES', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Sécurité & Réglementation', heures: '80h', contenu: 'Code du travail · Sécurité au travail · Habilitations · Réglementation CACES' },
      { num: 2, titre: 'Pratique & Certification', heures: '120h', contenu: 'Formation pratique · Tests théoriques · Tests pratiques · Certification CACES' },
    ]
  },
  { code: 'F18-PRO', icon: '🇬', titre: 'Anglais Professionnel TOEIC', description: 'Maîtrisez l\'anglais professionnel et préparez le TOEIC 750+. Business English, réunions, présentations, négociation.', cat: 'Langues', tarif: 1200, duree: '3 mois', heures: '120h', cert: 'TOEIC 750+', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Business English', heures: '80h', contenu: 'Présentations · Réunions · Négociation · Emails · Rapports · Vocabulary sectoriel' },
      { num: 2, titre: 'Préparation TOEIC', heures: '40h', contenu: '500 questions · Simulations · Listening · Reading · Score 750+' },
    ]
  },
  { code: 'F19-PRO', icon: '🇫🇷', titre: 'Français FLE Professionnel', description: 'Maîtrisez le français professionnel pour les non-francophones. DALF C1, rédaction administrative, présentations.', cat: 'Langues', tarif: 1200, duree: '3 mois', heures: '120h', cert: 'DALF C1', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Français Professionnel', heures: '80h', contenu: 'Rédaction · Correspondance · Présentations · Vocabulaire métier · Expression orale' },
      { num: 2, titre: 'Préparation DALF', heures: '40h', contenu: 'Compréhension · Production · Interaction · Simulations DALF C1' },
    ]
  },
  { code: 'F20', icon: '💆', titre: 'Coaching de Vie ICF ACC', description: 'Devenez coach de vie certifié ICF ACC. Méthode GROW, écoute active, questions puissantes, 200h de pratique supervisée.', cat: 'Bien-être', tarif: 2800, duree: '9 mois', heures: '200h', cert: 'ICF ACC', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Fondamentaux Coaching ICF', heures: '80h', contenu: '11 compétences ICF · Éthique · GROW · Questions puissantes · Écoute active niveau 3' },
      { num: 2, titre: 'Pratique Supervisée', heures: '80h', contenu: '200h coaching supervisé · Cas clients · Supervision mensuelle · Portfolio' },
      { num: 3, titre: 'Certification ICF ACC', heures: '40h', contenu: 'Dossier ICF · Coach Knowledge Assessment · Certification ACC officielle' },
    ]
  },
  { code: 'F21', icon: '🫶', titre: 'Médiation et CNV', description: 'Maîtrisez la médiation professionnelle et la Communication Non Violente. Gestion des conflits, négociation, facilitation.', cat: 'Bien-être', tarif: 1800, duree: '4 mois', heures: '120h', cert: 'Médiateur', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'CNV — Communication Non Violente', heures: '60h', contenu: 'Observations · Sentiments · Besoins · Demandes · Empathie · Auto-empathie · Marshall Rosenberg' },
      { num: 2, titre: 'Médiation Professionnelle', heures: '60h', contenu: 'Processus médiation · Phases · Techniques · Cas pratiques · Certification médiateur' },
    ]
  },
  { code: 'F22-PRO', icon: '🇪🇸', titre: 'Espagnol Professionnel DELE', description: 'Maîtrisez l\'espagnol des affaires et préparez le DELE B2. Commerce avec l\'Amérique latine, réunions, présentations.', cat: 'Langues', tarif: 900, duree: '3 mois', heures: '100h', cert: 'DELE B2', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Espagnol des Affaires', heures: '60h', contenu: 'Vocabulaire métier · Réunions · Présentations · Négociation · Correspondance' },
      { num: 2, titre: 'Préparation DELE', heures: '40h', contenu: 'Compréhension · Expression · Interaction · Simulations DELE B2/C1' },
    ]
  },
  { code: 'F23-PRO', icon: '🇩🇪', titre: 'Allemand Professionnel Goethe', description: 'Maîtrisez l\'allemand des affaires et préparez le Goethe B2. Commerce franco-allemand, réunions techniques.', cat: 'Langues', tarif: 1000, duree: '3 mois', heures: '120h', cert: 'Goethe B2', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Allemand des Affaires', heures: '80h', contenu: 'Vocabulaire industriel · Réunions · Commerce franco-allemand · Correspondance' },
      { num: 2, titre: 'Préparation Goethe', heures: '40h', contenu: 'Compréhension · Production · Interaction · Simulations Goethe B2' },
    ]
  },
  { code: 'F24-PRO', icon: '🇨🇳', titre: 'Mandarin Professionnel HSK', description: 'Maîtrisez le mandarin des affaires et préparez le HSK 4/5. Protocole chinois, négociation, correspondance professionnelle.', cat: 'Langues', tarif: 1100, duree: '5 mois', heures: '160h', cert: 'HSK 4/5', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Mandarin des Affaires', heures: '100h', contenu: 'Pinyin · Caractères · Protocole chinois · Négociation · Correspondance · Etiquette' },
      { num: 2, titre: 'Préparation HSK', heures: '60h', contenu: 'Vocabulaire HSK 4/5 · Compréhension · Expression · Simulations HSK' },
    ]
  },
  { code: 'F25-PRO', icon: '🇸', titre: 'Arabe Professionnel', description: 'Maîtrisez l\'arabe standard moderne des affaires. Commerce avec les pays arabes, correspondance officielle, CIPLE.', cat: 'Langues', tarif: 1000, duree: '4 mois', heures: '140h', cert: 'CIPLE B1', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Arabe Standard Moderne', heures: '80h', contenu: 'Alphabet · Grammaire · Vocabulaire professionnel · Presse arabe · Correspondance' },
      { num: 2, titre: 'Arabe des Affaires', heures: '60h', contenu: 'Commerce · Protocole · Négociation · Culture d\'affaires · Certification CIPLE' },
    ]
  },
  { code: 'F26-PRO', icon: '🇮🇱', titre: 'Hébreu Professionnel', description: 'Maîtrisez l\'hébreu moderne professionnel. Israël hub d\'innovation, tech, startups. Certification Ulpan avancé.', cat: 'Langues', tarif: 900, duree: '3 mois', heures: '100h', cert: 'Ulpan avancé', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Hébreu Moderne', heures: '60h', contenu: 'Alphabet · Grammaire · Vocabulaire quotidien et professionnel · Prononciation' },
      { num: 2, titre: 'Hébreu des Affaires', heures: '40h', contenu: 'Tech · Startups · Négociation · Correspondance · Culture israélienne · Ulpan' },
    ]
  },
  { code: 'F27', icon: '🌙', titre: 'Hypnothérapie Clinique', description: 'Formation avancée en hypnothérapie clinique. Protocoles thérapeutiques, supervision, éthique clinique.', cat: 'Bien-être', tarif: 3200, duree: '12 mois', heures: '300h', cert: 'Certifié', cpf: true, opco: 'AFDAS', domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Hypnose Clinique Avancée', heures: '100h', contenu: 'Protocoles cliniques · Trauma · Douleur chronique · Phobies complexes · Addiction' },
      { num: 2, titre: 'Supervision & Pratique', heures: '120h', contenu: '200 séances supervisées · Cas cliniques complexes · Supervision mensuelle' },
      { num: 3, titre: 'Certification Clinique', heures: '80h', contenu: 'Éthique clinique · Limites · Orientation · Dossier certification · Jury' },
    ]
  },
  { code: 'F28', icon: '🤖', titre: 'IA Générative Professionnelle', description: 'Maîtrisez les outils IA au quotidien : Claude, GPT-4o, prompt engineering avancé, agents autonomes, MCP Protocol.', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Prompt Engineering', heures: '30h', contenu: 'Techniques avancées · Chain of thought · Few-shot · RAG · Évaluation prompts' },
      { num: 2, titre: 'Claude & GPT-4o Expert', heures: '30h', contenu: 'API · Function calling · Agents · MCP Protocol · Multi-modal · Workflows' },
      { num: 3, titre: 'Cas Pratiques Métier', heures: '20h', contenu: 'Automatisation tâches · Génération contenu · Analyse données · Certification RS' },
    ]
  },
  { code: 'F29', icon: '⚙️', titre: 'Automatisations & Agents IA', description: 'Automatisez vos processus avec Make, n8n et les agents IA. Webhooks, API, workflows complexes, ROI calculé.', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS+Make', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Make Expert', heures: '30h', contenu: 'Scénarios complexes · Routeurs · Filtres · Webhooks · API REST · Error handling' },
      { num: 2, titre: 'n8n Open Source', heures: '20h', contenu: 'Installation · Nœuds · Workflows · Self-hosted · Intégrations · Agents' },
      { num: 3, titre: 'Agents IA Autonomes', heures: '30h', contenu: 'Claude agents · CrewAI · LangChain · Boucles autonomes · Certification' },
    ]
  },
  { code: 'F30', icon: '🔍', titre: 'SEO & Acquisition Organique', description: 'Maîtrisez le référencement naturel et l\'acquisition organique. SEO technique, contenu IA, link building, analytics.', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'SEO Technique & On-page', heures: '40h', contenu: 'Core Web Vitals · Architecture · Schema · Indexation · Cocon sémantique' },
      { num: 2, titre: 'Contenu IA & Link Building', heures: '40h', contenu: 'Production Claude · Digital PR · Backlinks · International · Analytics · Reporting' },
    ]
  },
  { code: 'F31', icon: '📣', titre: 'Acquisition Google & Meta Ads', description: 'Maîtrisez Google Ads et Meta Ads. Search, Display, YouTube, Performance Max, audiences, créatives, ROAS.', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'Google+Meta', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Google Ads Expert', heures: '40h', contenu: 'Search · Display · YouTube · Shopping · Performance Max · Scripts · Attribution' },
      { num: 2, titre: 'Meta Ads Expert', heures: '40h', contenu: 'Audiences · Creative · Pixel · CAPI · Retargeting · TikTok · LinkedIn Ads' },
    ]
  },
  { code: 'F32', icon: '💻', titre: 'Développement Applications IA', description: 'Développez des applications IA complètes. Next.js, Supabase, Claude API, Stripe. Du concept au déploiement.', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Stack IA Moderne', heures: '40h', contenu: 'Next.js 14 · React · Tailwind · Supabase · Auth · Vercel · TypeScript' },
      { num: 2, titre: 'Intégration Claude API', heures: '40h', contenu: 'Streaming · Function calling · RAG · Agents · Stripe · Déploiement production' },
    ]
  },
  { code: 'F33', icon: '📋', titre: 'Gestion de Projet IA', description: 'Pilotez des projets IA de A à Z. Cadrage, roadmap, sprints, KPIs, équipes hybrides humain-IA.', cat: 'IA & No-Code', tarif: 1200, duree: '2 mois', heures: '60h', cert: 'RS', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Cadrage & Roadmap IA', heures: '30h', contenu: 'Business case · KPIs · Roadmap · Sprints · Risques · Gouvernance IA' },
      { num: 2, titre: 'Pilotage & Équipes', heures: '30h', contenu: 'Équipes hybrides · Suivi · Reporting · Certification · Cas pratiques' },
    ]
  },
  { code: 'F34', icon: '🫧', titre: 'Bubble No-Code', description: 'Construisez des applications web complexes avec Bubble. BDD, logique métier, design, déploiement, API.', cat: 'Outils', tarif: 1200, duree: '1 mois', heures: '35h', cert: 'Bubble', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Bubble Complet', heures: '35h', contenu: 'Interface · BDD · Workflows · API Connector · Responsive · Déploiement · Certification Bubble' },
    ]
  },
  { code: 'F35', icon: '🌐', titre: 'Webflow Web Design', description: 'Créez des sites web professionnels avec Webflow. Design system, CMS, animations, SEO, déploiement.', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Webflow', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Webflow Expert', heures: '30h', contenu: 'Design · CMS · Interactions · Animations · SEO · E-commerce · Certification Webflow' },
    ]
  },
  { code: 'F36', icon: '⚡', titre: 'Make Automatisation', description: 'Maîtrisez Make pour automatiser tous vos processus. Scénarios complexes, webhooks, 1000+ intégrations.', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'Make Expert', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Make Expert', heures: '30h', contenu: 'Scénarios · Modules · Webhooks · API · Filtres · Routeurs · Certification Make' },
    ]
  },
  { code: 'F37', icon: '🔧', titre: 'n8n Open Source', description: 'Automatisez avec n8n, l\'alternative open source à Make. Self-hosted, nœuds personnalisés, agents IA.', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'n8n Certified', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'n8n Expert', heures: '30h', contenu: 'Installation · Nœuds · Workflows · Self-hosted · Agents · Certification n8n' },
    ]
  },
  { code: 'F38', icon: '📋', titre: 'Airtable', description: 'Créez des bases de données no-code puissantes avec Airtable. Vues, automatisations, interfaces, API.', cat: 'Outils', tarif: 900, duree: '1 mois', heures: '25h', cert: 'Airtable Builder', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Airtable Expert', heures: '25h', contenu: 'Bases · Vues · Formules · Automatisations · Interfaces · API · Certification' },
    ]
  },
  { code: 'F39', icon: '📓', titre: 'Notion & IA', description: 'Maîtrisez Notion et ses fonctionnalités IA. Workspace, bases de données, automatisations, templates.', cat: 'Outils', tarif: 900, duree: '1 mois', heures: '25h', cert: 'Notion', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Notion Expert + IA', heures: '25h', contenu: 'Workspace · BDD · Templates · IA Notion · Automatisations · API · Certification' },
    ]
  },
  { code: 'F40', icon: '🎨', titre: 'Figma UI/UX Design', description: 'Concevez des interfaces professionnelles avec Figma. Design system, prototypage, tests utilisateurs, handoff.', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Figma Pro', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Figma Expert', heures: '30h', contenu: 'Components · Design System · Prototypes · Tests · Variables · Dev Mode · Certification' },
    ]
  },
  { code: 'F41', icon: '✨', titre: 'Lovable Vibe Coding IA', description: 'Créez des applications complètes avec Lovable et l\'IA générative. Du prompt au produit déployé.', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '25h', cert: 'RS', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Lovable Expert', heures: '25h', contenu: 'Prompts · Génération code · Intégrations · Supabase · Déploiement · Certification RS' },
    ]
  },
  { code: 'F42', icon: '🖼️', titre: 'Framer Web Design', description: 'Créez des sites web avec animations avancées et Framer. Design, CMS, interactions, déploiement.', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Framer Expert', cpf: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Framer Expert', heures: '30h', contenu: 'Design · Animations · CMS · Composants · SEO · Déploiement · Certification Framer' },
    ]
  },
  { code: 'F43', icon: '💻', titre: 'Cursor Code Assisté IA', description: 'Codez 10x plus vite avec Cursor et l\'IA. Génération de code, débogage assisté, refactoring intelligent.', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'RS Dev IA', cpf: true, opco: true, domtom: true, handicap: true,
    modules: [
      { num: 1, titre: 'Cursor Expert', heures: '30h', contenu: 'Génération code · Débogage IA · Refactoring · GitHub Copilot · Certification RS Dev IA' },
    ]
  },
]

export const PRATICIENS_BIENETRE = [
  { id: 'maya', nom: 'Maya', spec: 'Sophrologie Caycédienne', tarif: 50, icon: '🧘', dispo: 'Maintenant', color: '#0ec4b0' },
  { id: 'eric', nom: 'Eric', spec: 'Hypnose Ericksonienne', tarif: 50, icon: '🌀', dispo: 'Dans 30 min', color: '#9b7cf4' },
  { id: 'jade', nom: 'Jade', spec: 'Coach de Vie ICF', tarif: 50, icon: '💚', dispo: 'Maintenant', color: '#4caf50' },
  { id: 'maxime', nom: 'Maxime', spec: 'Executive Coach MCC', tarif: 65, icon: '🎯', dispo: '15h00', color: '#c8a96e' },
  { id: 'leila', nom: 'Leila', spec: 'CNV & Médiation', tarif: 50, icon: '🫶', dispo: 'Demain', color: '#0ec4b0' },
  { id: 'hugo', nom: 'Hugo', spec: 'Nutrition & Bien-être', tarif: 50, icon: '🥗', dispo: 'Maintenant', color: '#8bc34a' },
  { id: 'sarah', nom: 'Sarah', spec: 'Mindfulness & Équilibre', tarif: 50, icon: '🌙', dispo: '20h00', color: '#448aff' },
  { id: 'david', nom: 'David', spec: 'Hypnothérapie Clinique', tarif: 65, icon: '🧠', dispo: 'Sur RDV', color: '#9b7cf4' },
]

export const STATS = {
  formations: 43,
  agents: 116,
  latence: '<2s',
  abandon: '<15%',
  certifications: 'RS · RNCP · CompTIA · ICF · PMP · HSK · TOEIC · DELE · Goethe',
  financement: 'CPF · OPCO · Transitions Pro · France Travail · AGEFIPH',
}
