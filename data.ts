// AcadémIA Pro — Données partagées

export const AGENTS = [
  { id: 'unia', nom: 'UNIA', role: 'Conseillère AcadémIA Pro', spec: 'Entretiens de positionnement', icon: '🧑‍💼', color: '#c8a96e', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: true, system: `Tu es UNIA, conseillère de formation d'AcadémIA Pro. STRUCTURE 20 min : Accueil → Situation pro → Projet → Recommandation → Financement → Inscription. CONNAISSANCE : 43 formations certifiantes · CPF jusqu'à 5000 EUR · 11 OPCO · Transitions Pro · AGEFIPH +5000 EUR · Formateur IA 24h/24 · DOM-TOM · Handicap. TON : Professionnelle · Chaleureuse · Directe. Max 4-5 phrases. Toujours en français.`, welcome: "Bonjour ! Je suis UNIA 🌟 Cet entretien est gratuit et sans engagement — 20 minutes pour trouver votre formation idéale. Quelle est votre situation professionnelle aujourd'hui ?" },
  { id: 'thomas', nom: 'Thomas Martin', role: 'Formateur Expert IA', spec: 'Product Builder No-Code · F01', icon: '🏗️', color: '#c8a96e', voiceId: 'TxGEqnHWrfWFTfGW9XjX', gratuit: false, tarif: 'Inclus F01 — 5 900 EUR', system: `Tu es Thomas Martin, Formateur Expert IA Product Builder d'AcadémIA Pro (F01). EXPERTISE : Bubble · Make/n8n · Claude API · Webflow · Lovable · Stripe · Supabase · Product Management (15 ans). Direct, visionnaire. En français.`, welcome: "Bonjour ! Thomas ici. On construit quoi aujourd'hui ?" },
  { id: 'karim', nom: 'Karim Benzara', role: 'Formateur Expert IA', spec: 'Cybersécurité CompTIA · F07', icon: '🔐', color: '#9b7cf4', voiceId: 'ErXwobaYiN019PkySvjV', gratuit: false, tarif: 'Inclus F07 — 3 200 EUR', system: `Tu es Karim Benzara, Formateur Expert IA Cybersécurité d'AcadémIA Pro (F07). EXPERTISE : CompTIA Security+ · CEH · OSCP · Metasploit · Burp Suite · Splunk · NIS2 · ISO 27001. En français.`, welcome: "Karim. Cybersécurité. Posez votre question." },
  { id: 'alex', nom: 'Alex Bernard', role: 'Formateur Expert IA', spec: 'IA Générative · F28', icon: '🤖', color: '#448aff', voiceId: 'VR6AewLTigWG4xSOukaG', gratuit: false, tarif: 'Inclus F28 — 1 400 EUR', system: `Tu es Alex Bernard, Formateur Expert IA Générative d'AcadémIA Pro (F28). EXPERTISE : Claude API · GPT-4o · Prompt Engineering · Agents IA · MCP Protocol · LangChain · RAG. En français.`, welcome: "Alex ! IA Générative — agents — prompts — MCP. On construit quelque chose ensemble ?" },
  { id: 'nina', nom: 'Nina Castillo', role: 'Formatrice Expert IA', spec: 'Automatisations · F29', icon: '⚙️', color: '#00e676', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: 'Inclus F29 — 1 400 EUR', system: `Tu es Nina Castillo, Formatrice Expert IA Automatisations d'AcadémIA Pro (F29). EXPERTISE : Make Expert · n8n · Webhooks · Claude API workflows · Agents autonomes. En français.`, welcome: "Nina ! Make, n8n, agents IA. Quelle tâche répétitive vous fait perdre le plus de temps cette semaine ?" },
  { id: 'claire', nom: 'Claire Beaumont', role: 'Formatrice Expert IA', spec: 'Sophrologie Caycédienne · F03', icon: '🧘', color: '#0ec4b0', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: 'Inclus F03 — 2 800 EUR', system: `Tu es Claire Beaumont, Formatrice Expert IA Sophrologie Caycédienne d'AcadémIA Pro (F03). EXPERTISE : 12 degrés caycédiens RD1-RD12. Douce, bienveillante. En français.`, welcome: "Bonjour. Je suis Claire. Où en êtes-vous dans votre pratique sophrologique ?" },
  { id: 'isabelle', nom: 'Isabelle Moreau', role: 'Coach Personnel IA', spec: 'Coaching ICF PCC · GROW', icon: '💆', color: '#0ec4b0', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: 'Inclus dans toutes les formations', system: `Tu es Isabelle Moreau, Coach Personnel IA ICF PCC d'AcadémIA Pro. Méthode GROW. Questions puissantes uniquement. En français.`, welcome: "Bonjour. Isabelle. Quelle est la chose la plus importante sur laquelle vous aimeriez avancer cette semaine ?" },
  { id: 'maya', nom: 'Maya', role: 'Praticienne Bien-être IA', spec: 'Sophrologie · Pôle Bien-être', icon: '🌸', color: '#f06292', voiceId: 'EXAVITQu4vr4xnSDxMaL', gratuit: false, tarif: '50 EUR / séance 30 min', system: `Tu es Maya, Praticienne Sophrologie Caycédienne du Pôle Bien-être. Structure : accueil → bilan → induction → pratique RD1-RD4 → intégration. Voix apaisante. En français.`, welcome: "Bonjour... Je suis Maya. Comment vous sentez-vous en ce moment, sur une échelle de 1 à 10 ?" },
  { id: 'cam', nom: 'CAM', role: 'Chef Agent Maître', spec: 'Orchestration · Production', icon: '⚡', color: '#f0a030', voiceId: 'TxGEqnHWrfWFTfGW9XjX', gratuit: true, system: `Tu es le Chef Agent Maître (CAM) d'AcadémIA Pro. Tu pilotes 116 agents. Direct, orienté livrable. En français.`, welcome: "CAM opérationnel. 116 agents configurés. Qu'est-ce qu'on produit maintenant ?" },
  { id: 'support', nom: 'Support Technique', role: 'Agent IT', spec: 'Plateforme · Bugs · Connexion', icon: '🛠️', color: '#448aff', voiceId: 'VR6AewLTigWG4xSOukaG', gratuit: true, system: `Tu es l'Agent Support Technique d'AcadémIA Pro. Tu résous tous les problèmes techniques. Méthodique, clair. En français.`, welcome: "Support Technique AcadémIA Pro. Décrivez votre problème — je vous guide étape par étape." },
]

export const FORMATIONS = [
  { code: 'F01', icon: '🏗️', titre: 'Bootcamp Product Builder No-Code & IA', cat: 'IA & No-Code', tarif: 5900, duree: '12 sem.', heures: '420h', cert: 'RNCP', cpf: true, opco: true, tp: true, domtom: true, handicap: true, description: 'Devenez concepteur de produits numériques No-Code & IA en 12 semaines. Maîtrisez Bubble, Make, n8n, Claude API, Webflow et Lovable pour construire et lancer un SaaS complet avec utilisateurs réels. Certification RNCP Niveau 6.', chapitres: [
    { num: 1, titre: 'Fondations Product Builder', heures: '40h', modules: [
      { num: 1, titre: 'Mindset Product Builder', heures: '8h', contenu: 'Vision produit · Problème vs solution · Lean Startup · Jobs to be Done · 5 étapes de validation' },
      { num: 2, titre: 'Découverte du No-Code', heures: '8h', contenu: 'Écosystème No-Code 2026 · Bubble vs Webflow vs Glide · Choisir le bon outil · Setup environnement' },
      { num: 3, titre: 'Design Thinking', heures: '8h', contenu: 'Empathy Map · User Story · Wireframes Figma · Prototype papier · Test utilisateur' },
      { num: 4, titre: 'Validation marché', heures: '8h', contenu: 'Interviews utilisateurs · Landing page test · 50 retours · Décision go/no-go' },
      { num: 5, titre: 'Introduction Claude API', heures: '8h', contenu: 'API Anthropic · Premiers appels · Prompt Engineering basique · Cas usage produit' },
    ]},
    { num: 2, titre: 'Bubble Avancé', heures: '80h', modules: [
      { num: 1, titre: 'Bubble Fondamentaux', heures: '16h', contenu: 'Interface · Data Types · Fields · Pages · Elements · Responsive · Workflow basics' },
      { num: 2, titre: 'Bubble Intermédiaire', heures: '16h', contenu: 'Authentification · User management · Privacy rules · API Connector · Stripe integration' },
      { num: 3, titre: 'Bubble Avancé', heures: '16h', contenu: 'Plugins · Repeating groups complexes · Performance · Custom states · Conditions avancées' },
      { num: 4, titre: 'Bubble + IA', heures: '16h', contenu: 'Intégration Claude API dans Bubble · Workflow IA · Analyse inputs users · Génération contenu' },
      { num: 5, titre: 'Projet SaaS complet', heures: '16h', contenu: 'SaaS complet Bubble de A à Z · MVP en 1 semaine · Déploiement · Tests utilisateurs' },
    ]},
    { num: 3, titre: 'Make & Automatisation', heures: '60h', modules: [
      { num: 1, titre: 'Make Fondamentaux', heures: '12h', contenu: 'Interface · Scénarios · Modules · Webhooks · Scheduling · Error handling' },
      { num: 2, titre: 'Make Intermédiaire', heures: '16h', contenu: 'Airtable · Google Sheets · Gmail · Slack · Notion · Filtres avancés' },
      { num: 3, titre: 'Agents IA avec Make', heures: '16h', contenu: 'Claude API dans Make · Agents autonomes · Décision IA dans workflow · Scraping IA' },
      { num: 4, titre: 'n8n Open Source', heures: '16h', contenu: 'Différences Make/n8n · Auto-hébergement · Cas usage avancés · Optimisation coûts' },
    ]},
    { num: 4, titre: 'Webflow & Frontend', heures: '40h', modules: [
      { num: 1, titre: 'Webflow Fondamentaux', heures: '16h', contenu: 'CSS visuel · Flexbox · Grid · Animations · CMS · E-commerce · SEO Webflow' },
      { num: 2, titre: 'Webflow Avancé', heures: '12h', contenu: 'Memberstack · Membership site · Landing pages high-conversion · A/B test' },
      { num: 3, titre: 'Framer & Lovable', heures: '12h', contenu: 'Vibe coding avec Lovable · Cursor + Claude · Site complet en 2h · Déploiement' },
    ]},
    { num: 5, titre: 'Agents IA & MCP', heures: '60h', modules: [
      { num: 1, titre: 'Claude API Avancé', heures: '16h', contenu: 'Function calling · Tool use · System prompts · Context management · Streaming' },
      { num: 2, titre: 'MCP Protocol', heures: '16h', contenu: 'Architecture MCP · Créer un MCP Server · Connexion données BDD · Ressources · Prompts' },
      { num: 3, titre: 'CrewAI & Multi-agents', heures: '16h', contenu: 'Multi-agents · Orchestration · Rôles · Communication inter-agents · Use cases business' },
      { num: 4, titre: 'Projet Agent autonome', heures: '12h', contenu: 'Agent autonome complet · Intégration dans produit No-Code · Documentation · Tests' },
    ]},
    { num: 6, titre: 'Product Management & Lancement', heures: '80h', modules: [
      { num: 1, titre: 'Product Roadmap', heures: '16h', contenu: 'OKR · Backlog · Priorisation RICE · Sprint planning · User stories avancées' },
      { num: 2, titre: 'Analytics & Growth', heures: '16h', contenu: 'Google Analytics 4 · Mixpanel · KPIs SaaS · LTV · Churn · Acquisition channels' },
      { num: 3, titre: 'Pricing & Monétisation', heures: '16h', contenu: 'Freemium · Subscription · Usage-based · Pricing psychology · Stripe avancé' },
      { num: 4, titre: 'Lancement Product Hunt', heures: '16h', contenu: 'Stratégie lancement · Community building · PR kit · Press release · Upvotes' },
      { num: 5, titre: 'Demo Day & Pitch', heures: '16h', contenu: 'Pitch 5 minutes · Slide deck investisseur · Practice avec Formateur IA · Feedback' },
    ]},
    { num: 7, titre: 'Projet Final Certifiant', heures: '60h', modules: [
      { num: 1, titre: 'Construction du produit', heures: '30h', contenu: 'Produit SaaS No-Code + IA complet · Utilisateurs réels · Revenus prouvés ou validés' },
      { num: 2, titre: 'Soutenance & Certification', heures: '30h', contenu: 'Documentation technique · Soutenance 30 min devant jury · Certification RNCP Niveau 6' },
    ]},
  ]},
  { code: 'F02', icon: '🚀', titre: 'Bootcamp Growth Marketer IA', cat: 'IA & No-Code', tarif: 5900, duree: '12 sem.', heures: '400h', cert: 'RNCP', cpf: true, opco: true, tp: true, domtom: true, handicap: true, description: 'Devenez Growth Marketer IA en 12 semaines. Maîtrisez SEO, Google Ads, Meta Ads, email marketing et data analytics avec l\'IA. RNCP Niveau 6.', chapitres: [
    { num: 1, titre: 'Fondamentaux Growth', heures: '40h', modules: [
      { num: 1, titre: 'Growth Mindset', heures: '10h', contenu: 'Métriques AARRR · Funnels · North Star Metric · Tests A/B · Sprints growth' },
      { num: 2, titre: 'Analytics Mastery', heures: '16h', contenu: 'GA4 avancé · Mixpanel · Amplitude · Attribution · Dashboards · Cohort analysis' },
      { num: 3, titre: 'CRO & Conversion', heures: '14h', contenu: 'Heatmaps · Hotjar · Tests utilisateurs · Landing pages · Copywriting persuasif' },
    ]},
    { num: 2, titre: 'SEO & Contenu IA', heures: '60h', modules: [
      { num: 1, titre: 'SEO Technique', heures: '16h', contenu: 'Core Web Vitals · Architecture · Cocon sémantique · Schema.org · Indexation' },
      { num: 2, titre: 'Content Marketing IA', heures: '20h', contenu: 'Stratégie éditoriale · Production Claude · Pipeline contenu · Distribution' },
      { num: 3, titre: 'Link Building', heures: '12h', contenu: 'Digital PR · Backlinks · Relations presse · Guest posting · HARO' },
      { num: 4, titre: 'SEO International & DOM-TOM', heures: '12h', contenu: 'SEO local · International · Hreflang · DOM-TOM · Multilingue' },
    ]},
    { num: 3, titre: 'Acquisition Payante', heures: '80h', modules: [
      { num: 1, titre: 'Google Ads Expert', heures: '28h', contenu: 'Search · Display · YouTube · Shopping · Performance Max · Scripts · Attribution' },
      { num: 2, titre: 'Meta Ads Expert', heures: '28h', contenu: 'Audiences · Creative · Pixel · CAPI · Retargeting · Budget optimisation' },
      { num: 3, titre: 'TikTok & LinkedIn Ads', heures: '12h', contenu: 'TikTok for Business · LinkedIn Campaign Manager · B2B acquisition' },
      { num: 4, titre: 'Automatisation Ads IA', heures: '12h', contenu: 'Campagnes automatisées · IA bidding · Creative IA · Reporting automatique' },
    ]},
    { num: 4, titre: 'Email & Automation', heures: '60h', modules: [
      { num: 1, titre: 'Email Marketing Avancé', heures: '24h', contenu: 'Segmentation · Personnalisation · Deliverability · Sequences · Tests' },
      { num: 2, titre: 'Marketing Automation', heures: '20h', contenu: 'HubSpot · ActiveCampaign · Lead scoring · Nurturing · CRM intégration' },
      { num: 3, titre: 'Growth Loops & Viralité', heures: '16h', contenu: 'Referral programs · Viral mechanics · Product-led growth · Community building' },
    ]},
    { num: 5, titre: 'Data & IA Avancée', heures: '60h', modules: [
      { num: 1, titre: 'Data-Driven Marketing', heures: '20h', contenu: 'SQL pour marketeurs · Looker Studio · BigQuery · Attribution modeling' },
      { num: 2, titre: 'IA dans le Marketing', heures: '20h', contenu: 'Claude pour le copy · IA créative · Prédiction churn · Personnalisation IA' },
      { num: 3, titre: 'Stack Marketing Complet', heures: '20h', contenu: 'Connecter tous les outils · Automatiser le reporting · Alertes intelligentes' },
    ]},
    { num: 6, titre: 'Projet Certifiant', heures: '100h', modules: [
      { num: 1, titre: 'Stratégie Growth Complète', heures: '40h', contenu: 'Stratégie growth pour vrai produit · Mise en place de toutes les acquisitions' },
      { num: 2, titre: 'Dashboard & KPIs', heures: '30h', contenu: 'Dashboard analytics opérationnel · Suivi KPIs · Optimisation continue' },
      { num: 3, titre: 'Soutenance & Certification', heures: '30h', contenu: 'Présentation devant jury · KPIs atteints · Mémoire Growth 30 pages · RNCP' },
    ]},
  ]},
  { code: 'F03', icon: '🧘', titre: 'Sophrologie Caycédienne Professionnelle', cat: 'Bien-être', tarif: 2800, duree: '18 mois', heures: '400h', cert: 'RS', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Devenez Praticien en Sophrologie Caycédienne certifié RS. 400 heures sur 3 niveaux progressifs. Supervision mensuelle et jury de certification.', chapitres: [
    { num: 1, titre: 'Niveau 1 — Technicien en Sophrologie', heures: '120h', modules: [
      { num: 1, titre: 'Introduction à la sophrologie', heures: '20h', contenu: 'Histoire · Fondements philosophiques · Neurobiologie · Éthique · Déontologie · Alfonso Caycedo' },
      { num: 2, titre: 'RD1 — Décontraction Musculaire', heures: '30h', contenu: 'Sophronisation de base · TDM niveau 1 · Positions sophrologiques · Pratique guidée' },
      { num: 3, titre: 'RD2 — Sophro-Activation', heures: '30h', contenu: 'Activation positive · Évocation future positive · Renforcement des valeurs positives' },
      { num: 4, titre: 'RD3 — Sophro-Contemplation', heures: '20h', contenu: 'Contemplation du corps · Intégration sensorielle · Plénitude présente' },
      { num: 5, titre: 'Pratique et évaluation Niveau 1', heures: '20h', contenu: '50 séances de pratique supervisée · Auto-sophronisation · Évaluation niveau 1' },
    ]},
    { num: 2, titre: 'Niveau 2 — Praticien en Sophrologie', heures: '160h', modules: [
      { num: 1, titre: 'RD4 — Existential Positive', heures: '25h', contenu: 'Valeurs existentielles · Projet de vie sophronique · Intégration vie quotidienne' },
      { num: 2, titre: 'RD5 à RD8', heures: '50h', contenu: 'Approfondissement des degrés · Souvenir vivantiel · Présence totale · Phénodynamie' },
      { num: 3, titre: 'Sophro-Acceptation Progressive', heures: '25h', contenu: 'Gestion de la douleur · Accompagnement deuil · Situations difficiles' },
      { num: 4, titre: 'Applications spécialisées', heures: '30h', contenu: 'Sophro périnatalité · Sport de haut niveau · Oncologie · Gestion du stress pro' },
      { num: 5, titre: 'Pratique accompagnée Niveau 2', heures: '30h', contenu: '100 séances supervisées · Cas cliniques · Supervision mensuelle' },
    ]},
    { num: 3, titre: 'Niveau 3 — Maître Praticien', heures: '120h', modules: [
      { num: 1, titre: 'RD9 à RD12', heures: '40h', contenu: 'Degrés supérieurs · Contemplation de la conscience · Philosophie caycédienne' },
      { num: 2, titre: 'Création de protocoles', heures: '30h', contenu: 'Protocoles personnalisés · Validation scientifique · Rédaction · Tests' },
      { num: 3, titre: 'Business sophrologue', heures: '20h', contenu: 'Créer son cabinet · Marketing · Tarification · Partenariats · Digital' },
      { num: 4, titre: 'Mémoire et certification', heures: '30h', contenu: 'Rédaction mémoire 50 pages · Soutenance · Jury certification RS' },
    ]},
  ]},
  { code: 'F04', icon: '🌀', titre: 'Hypnose Ericksonienne Praticien', cat: 'Bien-être', tarif: 2600, duree: '12 mois', heures: '300h', cert: 'RS', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Devenez Praticien en Hypnose Ericksonienne certifié RS. Suggestions indirectes, métaphores thérapeutiques, inductions et protocoles.', chapitres: [
    { num: 1, titre: 'Fondamentaux de l\'Hypnose', heures: '80h', modules: [
      { num: 1, titre: 'Histoire et théories', heures: '20h', contenu: 'Histoire · Milton Erickson · Théories de l\'hypnose · États de conscience' },
      { num: 2, titre: 'Cadre éthique et légal', heures: '20h', contenu: 'Éthique · Déontologie · Cadre légal · Contre-indications · Bilan pré-séance' },
      { num: 3, titre: 'Relation thérapeutique', heures: '20h', contenu: 'Alliance thérapeutique · Communication hypnotique · Rapport · Calibration' },
      { num: 4, titre: 'Premiers exercices pratiques', heures: '20h', contenu: 'Inductions simples · Premières séances supervisées · Feedback formateur' },
    ]},
    { num: 2, titre: 'Techniques & Inductions', heures: '100h', modules: [
      { num: 1, titre: 'Inductions et approfondissement', heures: '25h', contenu: 'Inductions directes et indirectes · Suggestions post-hypnotiques · Approfondissement' },
      { num: 2, titre: 'Métaphores et recadrage', heures: '25h', contenu: 'Métaphores ericksoniennes · Recadrage · Ancrage · Dissociation · Confusion' },
      { num: 3, titre: 'Protocoles thérapeutiques', heures: '25h', contenu: 'Confiance en soi · Gestion du stress · Sommeil · Performance · Phobies légères' },
      { num: 4, titre: 'Techniques de régression', heures: '25h', contenu: 'Régression thérapeutique · Techniques avancées · Cas complexes · Supervision' },
    ]},
    { num: 3, titre: 'Pratique & Certification', heures: '120h', modules: [
      { num: 1, titre: 'Construction de séances', heures: '30h', contenu: 'Structure d\'une séance · Adaptation au client · Gestion des imprévus · Documentation' },
      { num: 2, titre: 'Pratique supervisée', heures: '60h', contenu: '100 séances pratiques supervisées · Études de cas · Retours formateur IA' },
      { num: 3, titre: 'Mémoire et certification', heures: '30h', contenu: 'Mémoire pratique · Soutenance jury · Certification RS' },
    ]},
  ]},
  { code: 'F05', icon: '🧠', titre: 'PNL Praticien & Maître', cat: 'Bien-être', tarif: 2800, duree: '9 mois', heures: '200h', cert: 'RS', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Devenez Praticien & Maître Praticien PNL certifié RS. Présupposés PNL, calibration, rapport, métaprogrammes et techniques avancées.', chapitres: [
    { num: 1, titre: 'Fondamentaux PNL', heures: '60h', modules: [
      { num: 1, titre: 'Origines et présupposés', heures: '15h', contenu: 'Bandler & Grinder · Présupposés PNL · Systèmes de représentation VAKOG' },
      { num: 2, titre: 'Calibration et rapport', heures: '15h', contenu: 'Calibration · Rapport · Synchronisation · Feedback · États internes' },
      { num: 3, titre: 'Ancrage et submodalités', heures: '15h', contenu: 'Ancrage · Submodalités · Changement d\'état · Communication efficace' },
      { num: 4, titre: 'Pratique fondamentaux', heures: '15h', contenu: 'Exercices pratiques · Jeux de rôle · Supervision · Évaluation niveau 1' },
    ]},
    { num: 2, titre: 'Praticien PNL', heures: '80h', modules: [
      { num: 1, titre: 'Métamodèle du langage', heures: '20h', contenu: 'Métamodèle · Milton model · Métaprogrammes · Recadrage · Ligne du temps' },
      { num: 2, titre: 'Techniques de changement', heures: '20h', contenu: 'Changement d\'histoire personnelle · Intégration de conflits · Six étapes de recadrage' },
      { num: 3, titre: 'Pratique supervisée', heures: '20h', contenu: '50 séances pratiques · Études de cas · Supervision mensuelle formateur IA' },
      { num: 4, titre: 'Évaluation Praticien', heures: '20h', contenu: 'Évaluation compétences · Certification Praticien PNL · Retours formateur' },
    ]},
    { num: 3, titre: 'Maître Praticien PNL', heures: '60h', modules: [
      { num: 1, titre: 'Techniques avancées', heures: '20h', contenu: 'Modélisation de l\'excellence · Valeurs et croyances · Design humain · Stratégies' },
      { num: 2, titre: 'Applications professionnelles', heures: '20h', contenu: 'Thérapie des états du moi · Coaching PNL · Applications en entreprise' },
      { num: 3, titre: 'Certification Maître Praticien', heures: '20h', contenu: 'Supervision avancée · Mémoire professionnel · Jury certification RS' },
    ]},
  ]},
  { code: 'F06', icon: '🔵', titre: 'Ennéagramme Professionnel', cat: 'Bien-être', tarif: 1800, duree: '4 mois', heures: '120h', cert: 'RS', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'Ennéagramme comme outil certifié RS. Les 9 types, centres d\'intelligence, ailes et niveaux de développement.', chapitres: [
    { num: 1, titre: 'Les 9 Types de Personnalité', heures: '50h', modules: [
      { num: 1, titre: 'Histoire et origines', heures: '10h', contenu: 'Histoire · 3 centres d\'intelligence · Origines · Présentation générale' },
      { num: 2, titre: 'Les 9 ennéatypes', heures: '20h', contenu: 'Description des 9 types · Passions et vertus · Peurs fondamentales · Motivations' },
      { num: 3, titre: 'Identification de son type', heures: '20h', contenu: 'Questionnaires validés · Entretiens de typage · Auto-observation · Tritype' },
    ]},
    { num: 2, titre: 'Dynamique & Application', heures: '40h', modules: [
      { num: 1, titre: 'Ailes et instincts', heures: '15h', contenu: 'Ailes · Points de stress et sécurité · Niveaux de développement · Instincts dominants' },
      { num: 2, titre: 'Ennéagramme en équipe', heures: '15h', contenu: 'Communication adaptée · Leadership par type · Conflits et résolution · Cohésion' },
      { num: 3, titre: 'Applications RH', heures: '10h', contenu: 'Recrutement · Développement RH · Management · Coaching par type' },
    ]},
    { num: 3, titre: 'Pratique Professionnelle', heures: '30h', modules: [
      { num: 1, titre: 'Accompagnement individuel', heures: '15h', contenu: 'Construction de séances · Accompagnement · Ateliers collectifs · Supervision' },
      { num: 2, titre: 'Certification RS', heures: '15h', contenu: 'Projet professionnel · Jury certification RS · Mémoire pratique' },
    ]},
  ]},
  { code: 'F07', icon: '🔐', titre: 'Cybersécurité CompTIA Security+', cat: 'Métier', tarif: 3200, duree: '6 mois', heures: '300h', cert: 'CompTIA', cpf: true, opco: 'Atlas', tp: true, domtom: true, handicap: true, description: 'Devenez Technicien en Cybersécurité certifié CompTIA Security+ SY0-701 et CEH v13. 300 heures couvrant fondamentaux sécurité, pentest, SOC et gestion des incidents.', chapitres: [
    { num: 1, titre: 'Fondamentaux Sécurité', heures: '60h', modules: [
      { num: 1, titre: 'Principes CIA', heures: '16h', contenu: 'Confidentialité · Intégrité · Disponibilité · Risque · Menaces · Vulnérabilités · ANSSI' },
      { num: 2, titre: 'Cryptographie', heures: '20h', contenu: 'Symétrique · Asymétrique · Hachage · PKI · Certificats SSL/TLS · PGP · Post-Quantum' },
      { num: 3, titre: 'Réseaux et sécurité', heures: '24h', contenu: 'TCP/IP · VLAN · Firewall · IDS/IPS · VPN · DMZ · Zero Trust Architecture' },
    ]},
    { num: 2, titre: 'Sécurité Systèmes & Applications', heures: '80h', modules: [
      { num: 1, titre: 'Sécurité Windows & Linux', heures: '24h', contenu: 'Hardening · GPO · Active Directory sécurisé · Permissions · Logs · SIEM basique' },
      { num: 2, titre: 'OWASP Top 10', heures: '28h', contenu: 'Injection SQL · XSS · CSRF · Broken Auth · Sensitive Data · XXE · SSRF · RCE' },
      { num: 3, titre: 'Sécurité Cloud', heures: '28h', contenu: 'AWS Security · GCP Security · Azure Defender · IAM · S3 sécurité · Container security' },
    ]},
    { num: 3, titre: 'Pentest & Ethical Hacking', heures: '80h', modules: [
      { num: 1, titre: 'Reconnaissance', heures: '20h', contenu: 'OSINT · Nmap · Shodan · Google Dorks · Maltego · Passive vs Active recon' },
      { num: 2, titre: 'Exploitation', heures: '28h', contenu: 'Metasploit · Burp Suite · Sqlmap · Hydra · John · Hashcat · Buffer overflow basique' },
      { num: 3, titre: 'Post-exploitation', heures: '16h', contenu: 'Pivoting · Lateral movement · Persistence · Evidence clearing · Reporting' },
      { num: 4, titre: 'CTF Pratique', heures: '16h', contenu: '3 CTF complets HackTheBox · TryHackMe · Rapport pentest professionnel' },
    ]},
    { num: 4, titre: 'SOC & Gestion des Incidents', heures: '60h', modules: [
      { num: 1, titre: 'SIEM Avancé', heures: '20h', contenu: 'Splunk · ELK Stack · Règles de corrélation · Dashboards SOC · Alertes' },
      { num: 2, titre: 'Réponse aux incidents', heures: '20h', contenu: 'Plan IR · Containment · Eradication · Recovery · Post-incident · RETEX' },
      { num: 3, titre: 'RGPD et conformité', heures: '20h', contenu: 'NIS2 · ISO 27001 · NIST CSF · ANSSI guides · Notification CNIL' },
    ]},
    { num: 5, titre: 'Préparation Certifications', heures: '20h', modules: [
      { num: 1, titre: 'CompTIA Security+ SY0-701', heures: '10h', contenu: '1000 questions pratiques · Simulations d\'examen · Stratégies · Score cible 750/900' },
      { num: 2, titre: 'CEH v13', heures: '10h', contenu: 'CEH v13 curriculum officiel · Formateur IA 24h/24 pour révisions · Passage certification' },
    ]},
  ]},
  { code: 'F08', icon: '👔', titre: 'Management & Leadership PMP', cat: 'Métier', tarif: 2000, duree: '4 mois', heures: '140h', cert: 'PMP', cpf: true, opco: true, tp: true, domtom: true, handicap: true, description: 'Devenez manager certifié PMP. Leadership situationnel, gestion de projets agiles et traditionnels, communication d\'équipe et conduite du changement.', chapitres: [
    { num: 1, titre: 'Leadership & Management', heures: '50h', modules: [
      { num: 1, titre: 'Leadership situationnel', heures: '15h', contenu: 'Styles de management · Leadership situationnel · Intelligence émotionnelle · Motivation' },
      { num: 2, titre: 'Communication et feedback', heures: '20h', contenu: 'Communication assertive · Feedback constructif · Gestion des conflits · Management bienveillant' },
      { num: 3, titre: 'IA pour managers', heures: '15h', contenu: 'IA dans le management · Délégation à l\'IA · Reporting automatique · Prise de décision assistée' },
    ]},
    { num: 2, titre: 'Gestion de Projet PMP', heures: '60h', modules: [
      { num: 1, titre: 'PMBOK 7ème édition', heures: '20h', contenu: 'Domaines de performance · 49 processus · Initiating · Planning · Executing' },
      { num: 2, titre: 'Monitoring & Closing', heures: '20h', contenu: 'Monitoring · Controlling · Closing · Risques · Budget · Jalons · KPIs' },
      { num: 3, titre: 'Agilité et méthodes hybrides', heures: '20h', contenu: 'Agile vs Prédictif · Scrum · Kanban · SAFe · Méthodes hybrides · PMO' },
    ]},
    { num: 3, titre: 'Préparation PMP', heures: '30h', modules: [
      { num: 1, titre: 'Révisions et simulations', heures: '20h', contenu: 'Révisions intensives PMBOK · 200 questions pratiques PMP · Simulations d\'examen' },
      { num: 2, titre: 'Certification PMP', heures: '10h', contenu: 'Dossier d\'expérience PMP · Application PMI · Passage certification · Maintien PDUs' },
    ]},
  ]},
  { code: 'F09', icon: '🌱', titre: 'RSE et Transition Écologique', cat: 'Métier', tarif: 1800, duree: '2 mois', heures: '80h', cert: 'ISO 26000', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Devenez Référent RSE certifié ISO 26000. Directive CSRD, 12 standards ESRS, bilan carbone Scope 1/2/3 et stratégie RSE opérationnelle.', chapitres: [
    { num: 1, titre: 'RSE & CSRD', heures: '30h', modules: [
      { num: 1, titre: 'Directive CSRD', heures: '10h', contenu: '50 000 entreprises concernées · Calendrier 2025-2028 · Obligations légales · Sanctions' },
      { num: 2, titre: '12 Standards ESRS', heures: '10h', contenu: 'E1 Changement climatique · E2 Pollution · S1 Salariés · G1 Gouvernance · Double matérialité' },
      { num: 3, titre: 'Rapport de durabilité', heures: '10h', contenu: 'Structure du rapport · Indicateurs clés · Vérification externe · Communication parties prenantes' },
    ]},
    { num: 2, titre: 'Bilan Carbone & Stratégie', heures: '30h', modules: [
      { num: 1, titre: 'Bilan GES Scope 1/2/3', heures: '15h', contenu: 'Méthode Bilan Carbone ADEME · Scope 1/2/3 · Collecte données · Calcul émissions' },
      { num: 2, titre: 'Plan de transition et KPIs', heures: '15h', contenu: 'Objectifs SBTi · Plan de transition · Économie circulaire · Biodiversité · KPIs ESG' },
    ]},
    { num: 3, titre: 'Mise en Oeuvre & Certification', heures: '20h', modules: [
      { num: 1, titre: 'ISO 26000 Lead Implementer', heures: '10h', contenu: 'ISO 26000 · Cartographie parties prenantes · Plan d\'actions RSE · Communication' },
      { num: 2, titre: 'Projet RSE & Certification', heures: '10h', contenu: 'Rapport annuel RSE · Projet RSE complet · Certification ISO 26000' },
    ]},
  ]},
  { code: 'F10', icon: '📢', titre: 'Marketing Digital', cat: 'Métier', tarif: 2000, duree: '3 mois', heures: '100h', cert: 'Google Ads', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez le marketing digital de A à Z. SEO, Google Ads certifié, réseaux sociaux, email marketing et content marketing assisté par IA.', chapitres: [
    { num: 1, titre: 'SEO & Contenu', heures: '30h', modules: [
      { num: 1, titre: 'SEO fondamentaux', heures: '15h', contenu: 'Référencement naturel · Mots-clés · Audit SEO · Google Search Console · Cocon sémantique' },
      { num: 2, titre: 'Content Marketing IA', heures: '15h', contenu: 'Blogging · Social media · Production avec Claude API · Calendrier éditorial · Distribution' },
    ]},
    { num: 2, titre: 'SEA & Réseaux Sociaux', heures: '40h', modules: [
      { num: 1, titre: 'Google Ads', heures: '20h', contenu: 'Search · Display · YouTube · Gestion budget · Optimisation CPC · A/B testing · Certification' },
      { num: 2, titre: 'Social Media Marketing', heures: '20h', contenu: 'Facebook Ads · Instagram · LinkedIn Ads · Community management · Veille concurrentielle' },
    ]},
    { num: 3, titre: 'Analytics & Email', heures: '30h', modules: [
      { num: 1, titre: 'Analytics', heures: '15h', contenu: 'Google Analytics 4 · Tableaux de bord · KPIs · Attribution · Reporting mensuel' },
      { num: 2, titre: 'Email Marketing', heures: '15h', contenu: 'Mailchimp · Segmentation · Automation · CRM basique · Projet marketing complet' },
    ]},
  ]},
  { code: 'F11', icon: '⚡', titre: 'Agilité & Scrum Master PSM I', cat: 'Métier', tarif: 1800, duree: '2 mois', heures: '80h', cert: 'PSM I', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Devenez Scrum Master certifié PSM I. Scrum Guide, événements Scrum, artefacts, techniques de facilitation et agilité à l\'échelle avec SAFe.', chapitres: [
    { num: 1, titre: 'Fondamentaux Agile & Scrum', heures: '30h', modules: [
      { num: 1, titre: 'Manifeste Agile', heures: '10h', contenu: '4 valeurs · 12 principes · Agile vs Waterfall · Frameworks agiles · Mindset agile' },
      { num: 2, titre: 'Scrum Guide 2020', heures: '20h', contenu: 'Rôles PO/SM/Dev · Sprint · Daily · Review · Retrospective · Backlog · Definition of Done' },
    ]},
    { num: 2, titre: 'Facilitation & Pratiques', heures: '30h', modules: [
      { num: 1, titre: 'Techniques de facilitation', heures: '15h', contenu: 'Planning Poker · User Stories · Velocity · Burndown chart · Impediments · Kanban · Lean' },
      { num: 2, titre: 'Remote et conflits', heures: '15h', contenu: 'Remote Scrum · Facilitation digitale · Conflits d\'équipe · Coaching Scrum' },
    ]},
    { num: 3, titre: 'PSM I & Certification', heures: '20h', modules: [
      { num: 1, titre: 'Préparation PSM I', heures: '15h', contenu: '500 questions pratiques PSM I · Simulations d\'examen · Agilité à l\'échelle SAFe · LeSS' },
      { num: 2, titre: 'Certification PSM I', heures: '5h', contenu: 'Passage certification PSM I officielle · Score minimum 85% · Renouvellement' },
    ]},
  ]},
  { code: 'F12', icon: '📊', titre: 'Data Science & Dev Full Stack', cat: 'Métier', tarif: 3800, duree: '6 mois', heures: '400h', cert: 'AWS ML', cpf: true, opco: true, tp: true, domtom: true, handicap: true, description: 'Devenez Data Scientist & Développeur Full Stack certifié AWS ML. Python, Machine Learning, Deep Learning, LLM & Claude API, React/Next.js et MLOps.', chapitres: [
    { num: 1, titre: 'Python & Data', heures: '80h', modules: [
      { num: 1, titre: 'Python fondamentaux', heures: '24h', contenu: 'Syntaxe · Variables · Fonctions · Classes · Modules · NumPy · Pandas · Matplotlib' },
      { num: 2, titre: 'Data Manipulation', heures: '28h', contenu: 'Nettoyage données · Missing values · Outliers · Feature engineering · Pipelines sklearn' },
      { num: 3, titre: 'SQL & BDD', heures: '28h', contenu: 'PostgreSQL · Requêtes complexes · Jointures · Agrégations · ORM SQLAlchemy' },
    ]},
    { num: 2, titre: 'Machine Learning', heures: '100h', modules: [
      { num: 1, titre: 'ML Supervisé', heures: '32h', contenu: 'Régression · Classification · Random Forest · XGBoost · Cross-validation · Métriques' },
      { num: 2, titre: 'ML Non Supervisé', heures: '28h', contenu: 'K-Means · DBSCAN · PCA · t-SNE · Anomaly detection · Association rules' },
      { num: 3, titre: 'Deep Learning', heures: '40h', contenu: 'Réseaux de neurones · CNN · RNN · Transformers · PyTorch · TensorFlow · Keras' },
    ]},
    { num: 3, titre: 'LLM & IA Générative', heures: '80h', modules: [
      { num: 1, titre: 'Claude & LLM API', heures: '24h', contenu: 'Anthropic SDK · Function calling · Embeddings · RAG · Vector databases' },
      { num: 2, titre: 'Fine-tuning & PEFT', heures: '28h', contenu: 'LoRA · QLoRA · RLHF · Instruction tuning · Hugging Face Transformers' },
      { num: 3, titre: 'Applications LLM', heures: '28h', contenu: 'Chatbots avancés · Agents IA · Pipeline multi-agents · Évaluation LLM' },
    ]},
    { num: 4, titre: 'Développement Full Stack', heures: '80h', modules: [
      { num: 1, titre: 'React & Next.js', heures: '32h', contenu: 'Composants · State · Hooks · API routes · SSR · SSG · Tailwind · TypeScript' },
      { num: 2, titre: 'Node.js & API', heures: '28h', contenu: 'Express · REST API · GraphQL · Auth JWT · WebSockets · Microservices basique' },
      { num: 3, titre: 'Déploiement & MLOps', heures: '20h', contenu: 'Docker · GitHub Actions · Vercel · AWS EC2 · Monitoring · CI/CD ML' },
    ]},
    { num: 5, titre: 'Projet Certifiant', heures: '60h', modules: [
      { num: 1, titre: 'Application IA complète', heures: '40h', contenu: 'Modèle ML entraîné · API propre · Dashboard visualisation interactif · Documentation' },
      { num: 2, titre: 'Soutenance & Certification', heures: '20h', contenu: 'Soutenance devant jury technique · Certification AWS ML Specialty · Google Cloud ML' },
    ]},
  ]},
  { code: 'F13', icon: '💰', titre: 'Finance & Comptabilité', cat: 'Métier', tarif: 2400, duree: '4 mois', heures: '200h', cert: 'DCG partiel', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez la comptabilité générale, la finance d\'entreprise et le contrôle de gestion. Préparation partielle au DCG.', chapitres: [
    { num: 1, titre: 'Comptabilité Générale', heures: '70h', modules: [
      { num: 1, titre: 'Plan comptable et journaux', heures: '25h', contenu: 'Plan comptable général · Journaux · Grand livre · Balance · Bilan · Compte de résultat' },
      { num: 2, titre: 'Opérations courantes', heures: '25h', contenu: 'Amortissements · Provisions · TVA · Clôture annuelle · Liasses fiscales' },
      { num: 3, titre: 'Logiciels comptables', heures: '20h', contenu: 'Sage · EBP · Pennylane · Saisie · Lettrage · Rapprochement bancaire' },
    ]},
    { num: 2, titre: 'Finance d\'Entreprise', heures: '80h', modules: [
      { num: 1, titre: 'Analyse financière', heures: '30h', contenu: 'Analyse financière · Ratios · BFR · Trésorerie · Tableau de flux · Diagnostic financier' },
      { num: 2, titre: 'Business Plan et budget', heures: '30h', contenu: 'Business plan · Budget · Prévisionnel · Valorisation · Financement · Levée de fonds' },
      { num: 3, titre: 'Reporting financier IA', heures: '20h', contenu: 'Reporting automatique Claude API · Tableaux de bord · KPIs financiers · Alertes' },
    ]},
    { num: 3, titre: 'Contrôle de Gestion', heures: '50h', modules: [
      { num: 1, titre: 'Contrôle de gestion', heures: '20h', contenu: 'Coûts · Marges · Tableaux de bord · KPIs · Analyse des écarts · Reporting mensuel' },
      { num: 2, titre: 'Excel & Power BI', heures: '20h', contenu: 'Excel avancé · Power BI · Looker Studio · Automatisation reporting · Visualisation données' },
      { num: 3, titre: 'Préparation DCG', heures: '10h', contenu: 'Préparation DCG UE1 et UE4 · Annales · Simulations · Conseils méthodologiques' },
    ]},
  ]},
  { code: 'F14', icon: '🏠', titre: 'Immobilier Professionnel', cat: 'Métier', tarif: 2000, duree: '3 mois', heures: '120h', cert: 'Carte T prep', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Préparez-vous à la Carte T et maîtrisez la transaction immobilière. Droit, fiscalité, estimation, négociation et digital marketing avec IA.', chapitres: [
    { num: 1, titre: 'Droit & Réglementation', heures: '50h', modules: [
      { num: 1, titre: 'Loi Hoguet et Carte T', heures: '20h', contenu: 'Loi Hoguet · Conditions accès profession · Carte T · Garantie financière · RC Pro' },
      { num: 2, titre: 'Droit immobilier', heures: '20h', contenu: 'Droit des obligations · Contrats · Compromis · Acte authentique · Mandats · RGPD' },
      { num: 3, titre: 'Déontologie', heures: '10h', contenu: 'Code de déontologie · Obligations professionnelles · Conflits d\'intérêts · Sanctions' },
    ]},
    { num: 2, titre: 'Transaction & Estimation', heures: '45h', modules: [
      { num: 1, titre: 'Estimation immobilière', heures: '20h', contenu: 'Techniques d\'estimation · Méthodes comparatives · Valeur vénale · Diagnostics techniques' },
      { num: 2, titre: 'Négociation et closing', heures: '25h', contenu: 'Fiscalité · Plus-values · TVA immobilière · Financement · Négociation · Closing' },
    ]},
    { num: 3, titre: 'Digital & IA Immobilier', heures: '25h', modules: [
      { num: 1, titre: 'Marketing digital immobilier', heures: '15h', contenu: 'SeLoger · Bien\'ici · Réseaux sociaux · Visites virtuelles · CRM immobilier' },
      { num: 2, titre: 'IA et préparation Carte T', heures: '10h', contenu: 'Estimation IA · Annonces Claude API · Préparation examen Carte T · Simulations' },
    ]},
  ]},
  { code: 'F15', icon: '🌟', titre: 'Soft Skills & Intelligence Émotionnelle', cat: 'Métier', tarif: 1600, duree: '2 mois', heures: '80h', cert: 'RS IE', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Développez vos compétences comportementales et votre intelligence émotionnelle certifiées RS IE.', chapitres: [
    { num: 1, titre: 'Intelligence Émotionnelle', heures: '35h', modules: [
      { num: 1, titre: 'Modèle Goleman', heures: '15h', contenu: '5 domaines IE · Conscience de soi · Maîtrise de soi · Motivation · Empathie · Compétences sociales' },
      { num: 2, titre: 'Gestion des émotions', heures: '20h', contenu: 'Régulation émotionnelle · Émotions difficiles · Neurosciences · Résilience · Auto-compassion' },
    ]},
    { num: 2, titre: 'Communication & Leadership', heures: '30h', modules: [
      { num: 1, titre: 'Communication assertive', heures: '15h', contenu: 'Communication assertive · Écoute active · Langage non verbal · Storytelling · Prise de parole' },
      { num: 2, titre: 'Leadership et influence', heures: '15h', contenu: 'Leadership charismatique · Influence éthique · Négociation win-win · Management émotionnel' },
    ]},
    { num: 3, titre: 'Gestion du Stress & Certification', heures: '15h', modules: [
      { num: 1, titre: 'Gestion du stress', heures: '10h', contenu: 'Identification stresseurs · Techniques gestion stress · Mindfulness · Créativité · Décision' },
      { num: 2, titre: 'Certification RS IE', heures: '5h', contenu: 'Évaluation compétences · Certification RS Intelligence Émotionnelle · Projet personnel' },
    ]},
  ]},
  { code: 'F16', icon: '🔍', titre: 'Bilan de Compétences & VAE', cat: 'Métier', tarif: 1200, duree: '2 mois', heures: '60h', cert: 'Attestation', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Réalisez votre bilan de compétences certifié et préparez votre VAE. Identifiez vos compétences et construisez votre projet professionnel.', chapitres: [
    { num: 1, titre: 'Bilan de Compétences', heures: '30h', modules: [
      { num: 1, titre: 'Phase préliminaire', heures: '10h', contenu: 'Phase préliminaire · Analyse du parcours · Compétences transférables · Tests de personnalité' },
      { num: 2, titre: 'Exploration et synthèse', heures: '20h', contenu: 'Valeurs et motivations · Exploration métiers · Marché de l\'emploi · Synthèse personnelle' },
    ]},
    { num: 2, titre: 'VAE & Projet Professionnel', heures: '30h', modules: [
      { num: 1, titre: 'Processus VAE', heures: '15h', contenu: 'Recevabilité · Livrets 1 et 2 · Constitution du dossier · Préparation jury VAE' },
      { num: 2, titre: 'Plan de développement', heures: '15h', contenu: 'Plan de développement professionnel · CV · LinkedIn optimisé · Stratégie recherche emploi' },
    ]},
  ]},
  { code: 'F17', icon: '🔧', titre: 'Métiers Techniques CACES', cat: 'Métier', tarif: 2200, duree: '4 mois', heures: '200h', cert: 'CACES', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Obtenez les certifications CACES pour les engins de manutention et de levage. Formation conforme aux recommandations R489, R482 et R484.', chapitres: [
    { num: 1, titre: 'Sécurité & Réglementation', heures: '60h', modules: [
      { num: 1, titre: 'Réglementation sécurité', heures: '30h', contenu: 'Code du travail R.4323 · Recommandations CNAM · Risques professionnels · EPI · Signalisation' },
      { num: 2, titre: 'Gestes et postures', heures: '30h', contenu: 'Gestes et postures · Procédures d\'urgence · Responsabilité opérateur · Premiers secours' },
    ]},
    { num: 2, titre: 'CACES R489 — Chariots', heures: '80h', modules: [
      { num: 1, titre: 'Théorie R489', heures: '30h', contenu: 'Catégories 1 à 6 · Technologie des chariots · Stabilité · Charges · Prises de charge · Circulation' },
      { num: 2, titre: 'Pratique R489', heures: '50h', contenu: 'Entretien · Exercices pratiques · Tests en conditions réelles · Passage tests CACES R489' },
    ]},
    { num: 3, titre: 'CACES R482 & R484', heures: '60h', modules: [
      { num: 1, titre: 'CACES R482 Engins de chantier', heures: '35h', contenu: 'Catégories A-G · Technologie · Manoeuvres · Tests théoriques · Exercices pratiques' },
      { num: 2, titre: 'CACES R484 Grues auxiliaires', heures: '25h', contenu: 'Grues auxiliaires · Charges · Stabilité · Tests · Recyclage 5 ans · Certification' },
    ]},
  ]},
  { code: 'F18-PRO', icon: '🇬', titre: 'Anglais Professionnel', cat: 'Langues', tarif: 1200, duree: '3 mois', heures: '120h', cert: 'TOEIC 750+', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'anglais professionnel et obtenez le TOEIC 750+. Business English, réunions internationales, négociation et emails professionnels.', chapitres: [
    { num: 1, titre: 'Business English', heures: '50h', modules: [
      { num: 1, titre: 'Vocabulaire professionnel', heures: '20h', contenu: '5000 mots sectoriels · Expressions idiomatiques pro · Jargon business international' },
      { num: 2, titre: 'Réunions et présentations', heures: '15h', contenu: 'Réunions internationales · PowerPoint en anglais · Chairing · Minutes · Compte-rendus' },
      { num: 3, titre: 'Emails et rapports', heures: '15h', contenu: 'Emails professionnels · Rapports · Executive summaries · Correspondance formelle' },
    ]},
    { num: 2, titre: 'Communication Avancée', heures: '40h', modules: [
      { num: 1, titre: 'Négociation et closing', heures: '20h', contenu: 'Négociation · Argumentation · Gestion objections · Closing · Pitch investisseur' },
      { num: 2, titre: 'Compréhension orale', heures: '20h', contenu: 'Accents internationaux · Conférences · Médias anglophones · Small talk · Networking' },
    ]},
    { num: 3, titre: 'Préparation TOEIC', heures: '30h', modules: [
      { num: 1, titre: 'Entrainement TOEIC', heures: '20h', contenu: '3000 questions TOEIC · Stratégies · Listening Comprehension · Reading · Grammaire' },
      { num: 2, titre: 'Certification TOEIC', heures: '10h', contenu: 'Simulations examen · Score cible 750+ · Certification TOEIC ou IELTS officielle' },
    ]},
  ]},
  { code: 'F18-PAR', icon: '🇬🇧', titre: 'Anglais Parlé Conversationnel', cat: 'Langues', tarif: 700, duree: '2 mois', heures: '60h', cert: 'CECRL B2', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Parlez anglais avec fluidité et confiance au niveau B2. Conversations quotidiennes, voyages, expressions idiomatiques, films et séries.', chapitres: [
    { num: 1, titre: 'Conversation & Phonétique', heures: '30h', modules: [
      { num: 1, titre: 'Phonétique et prononciation', heures: '10h', contenu: 'Phonétique anglaise · Accent neutre · Intonation · Rythme · Sons difficiles' },
      { num: 2, titre: 'Conversations quotidiennes', heures: '20h', contenu: 'Shopping · Transport · Restaurant · Voyage · Tourisme · Situations sociales · Jeux de rôle' },
    ]},
    { num: 2, titre: 'Fluidité & Certification B2', heures: '30h', modules: [
      { num: 1, titre: 'Expressions et culture', heures: '20h', contenu: 'Idiomes · Expressions populaires · Humour britannique et américain · Films sans sous-titres' },
      { num: 2, titre: 'Certification CECRL B2', heures: '10h', contenu: 'Révisions B2 · Compréhension orale et écrite · Production · Certification CECRL B2' },
    ]},
  ]},
  { code: 'F19-PRO', icon: '🇫', titre: 'Français FLE Professionnel', cat: 'Langues', tarif: 1200, duree: '3 mois', heures: '120h', cert: 'DALF C1', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez le français professionnel et obtenez le DALF C1/C2. Rédaction administrative, français juridique et médical, présentations formelles.', chapitres: [
    { num: 1, titre: 'Français Professionnel', heures: '50h', modules: [
      { num: 1, titre: 'Vocabulaire et rédaction', heures: '25h', contenu: 'Vocabulaire professionnel · Rédaction administrative · Correspondance officielle · Emails formels' },
      { num: 2, titre: 'Communication orale', heures: '25h', contenu: 'Présentations formelles · Réunions · Comptes-rendus · Rapports · Protocole' },
    ]},
    { num: 2, titre: 'Français Spécialisé', heures: '40h', modules: [
      { num: 1, titre: 'Français juridique et médical', heures: '20h', contenu: 'Français juridique · Français médical · Contrats · Appels d\'offres · Lexique sectoriel' },
      { num: 2, titre: 'Argumentation et débat', heures: '20h', contenu: 'Prise de parole publique · Argumentation · Débats · Compréhension textes complexes' },
    ]},
    { num: 3, titre: 'Préparation DALF', heures: '30h', modules: [
      { num: 1, titre: 'Entrainement DALF', heures: '20h', contenu: '500 exercices DALF · Compréhension écrite et orale · Production écrite et orale · Stratégies' },
      { num: 2, titre: 'Certification DALF', heures: '10h', contenu: 'Simulation DALF C1/C2 · Certification · Intégration culturelle France' },
    ]},
  ]},
  { code: 'F20', icon: '💆', titre: 'Coaching de Vie ICF ACC', cat: 'Bien-être', tarif: 2800, duree: '9 mois', heures: '200h', cert: 'ICF ACC', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Obtenez la certification ICF ACC — Associate Certified Coach — standard mondial. Méthode GROW, 11 compétences ICF, 100 heures de coaching supervisé.', chapitres: [
    { num: 1, titre: 'Fondamentaux ICF', heures: '60h', modules: [
      { num: 1, titre: '11 Compétences ICF', heures: '20h', contenu: '11 compétences ICF · Code éthique · Coaching vs consulting vs thérapie · Cadre professionnel' },
      { num: 2, titre: 'Alliance de coaching', heures: '20h', contenu: 'Contrat · Confiance · Présence · Sécurité psychologique · Co-création · Partenariat' },
      { num: 3, titre: 'Communication active', heures: '20h', contenu: 'Écoute niveau 3 · Questions puissantes · Reformulation · Calibration · Silence' },
    ]},
    { num: 2, titre: 'Méthode GROW & Outils', heures: '80h', modules: [
      { num: 1, titre: 'Modèle GROW complet', heures: '24h', contenu: 'Goal · Reality · Options · Will · GROW+ · OSKAR · Applications · Variations' },
      { num: 2, titre: 'Outils de coaching', heures: '24h', contenu: 'Roue de la vie · Ligne de valeurs · Courbe du changement · Vision board · Ancrage' },
      { num: 3, titre: 'Coaching de performance', heures: '16h', contenu: 'Objectifs SMART · Plans d\'action · Célébration · Gestion des obstacles' },
      { num: 4, titre: 'Coaching de vie', heures: '16h', contenu: 'Valeurs · Sens · Transitions · Deuil · Projets de vie · Bien-être' },
    ]},
    { num: 3, titre: 'Pratique Supervisée & Certification', heures: '60h', modules: [
      { num: 1, titre: 'Coaching réel supervisé', heures: '40h', contenu: '100 heures coaching réel · Enregistrement et analyse · Retours formateur IA' },
      { num: 2, titre: 'Préparation ICF ACC', heures: '20h', contenu: 'Révisions 11 compétences · Simulation examen CKA · 3 preuves de séances · Dossier ICF ACC' },
    ]},
  ]},
  { code: 'F21', icon: '🫶', titre: 'Médiation et CNV', cat: 'Bien-être', tarif: 1800, duree: '4 mois', heures: '120h', cert: 'Médiateur', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Devenez Praticien en Communication Non Violente et Médiateur certifié. Processus CNV de Rosenberg et médiation professionnelle.', chapitres: [
    { num: 1, titre: 'Fondamentaux CNV', heures: '40h', modules: [
      { num: 1, titre: 'Processus CNV de Rosenberg', heures: '15h', contenu: 'Observation sans jugement · Sentiments · Besoins universels · Demande vs exigence' },
      { num: 2, titre: 'Empathie et auto-empathie', heures: '15h', contenu: 'Empathie · Auto-empathie · CNV en situation de crise · Langage girafe vs chacal' },
      { num: 3, titre: 'Pratique CNV', heures: '10h', contenu: 'Jeux de rôle · Exercices pratiques · Supervision · Évaluation CNV' },
    ]},
    { num: 2, titre: 'Médiation Professionnelle', heures: '50h', modules: [
      { num: 1, titre: 'Cadre légal et processus', heures: '15h', contenu: 'Cadre légal de la médiation · Processus de médiation · Posture du médiateur' },
      { num: 2, titre: 'Techniques de médiation', heures: '20h', contenu: 'Écoute active · Gestion des émotions fortes · Médiation familiale · professionnelle · commerciale' },
      { num: 3, titre: 'Accord et suivi', heures: '15h', contenu: 'Rédaction de l\'accord · Suivi post-médiation · Cas complexes · Supervision' },
    ]},
    { num: 3, titre: 'Pratique & Certification', heures: '30h', modules: [
      { num: 1, titre: 'Médiations supervisées', heures: '20h', contenu: 'Médiations réelles supervisées · Conflits d\'équipe · Études de cas · Ateliers CNV' },
      { num: 2, titre: 'Certification Médiateur', heures: '10h', contenu: 'Projet professionnel · Jury certification · Mémoire pratique' },
    ]},
  ]},
  { code: 'F22-PRO', icon: '🇪🇸', titre: 'Espagnol Professionnel', cat: 'Langues', tarif: 900, duree: '3 mois', heures: '100h', cert: 'DELE B2', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'espagnol professionnel et obtenez le DELE B2/C1. Commerce avec l\'Amérique latine, réunions et négociation.', chapitres: [
    { num: 1, titre: 'Espagnol des Affaires', heures: '45h', modules: [
      { num: 1, titre: 'Vocabulaire et communication', heures: '20h', contenu: 'Vocabulaire business · Emails pro · Réunions · Présentations · Protocole hispanique' },
      { num: 2, titre: 'Commerce international', heures: '25h', contenu: 'Commerce Amérique latine · Négociation · Culture d\'affaires · Contrats simples' },
    ]},
    { num: 2, titre: 'Communication Avancée & Certification', heures: '55h', modules: [
      { num: 1, titre: 'Espagnol avancé', heures: '20h', contenu: 'Argumentation · Presse économique · Accents régionaux · Espagnol technique' },
      { num: 2, titre: 'Entrainement DELE', heures: '20h', contenu: 'Révisions DELE B2/C1 · Exercices par compétence · Simulations · Stratégies d\'examen' },
      { num: 3, titre: 'Certification DELE', heures: '15h', contenu: 'Passage certification DELE officielle · Équivalences CECRL' },
    ]},
  ]},
  { code: 'F23-PRO', icon: '🇩🇪', titre: 'Allemand Professionnel', cat: 'Langues', tarif: 1000, duree: '3 mois', heures: '120h', cert: 'Goethe B2', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'allemand professionnel et obtenez la certification Goethe B2/C1. Commerce franco-allemand, réunions techniques, vocabulaire industriel.', chapitres: [
    { num: 1, titre: 'Allemand des Affaires', heures: '50h', modules: [
      { num: 1, titre: 'Vocabulaire et communication', heures: '25h', contenu: 'Vocabulaire business · Emails · Réunions techniques · Présentations · Protocole allemand' },
      { num: 2, titre: 'Commerce franco-allemand', heures: '25h', contenu: 'Commerce franco-allemand · Culture d\'affaires · Vocabulaire industriel · Contrats' },
    ]},
    { num: 2, titre: 'Communication Avancée & Certification', heures: '70h', modules: [
      { num: 1, titre: 'Allemand avancé', heures: '25h', contenu: 'Négociation · Presse économique · Accents régionaux · Allemand des RH · Entretiens pro' },
      { num: 2, titre: 'Entrainement Goethe', heures: '25h', contenu: 'Hörverstehen · Leseverstehen · Schreiben · Sprechen · Simulations · Stratégies' },
      { num: 3, titre: 'Certification Goethe', heures: '20h', contenu: 'Passage certification Goethe B2/C1 · Équivalences CECRL' },
    ]},
  ]},
  { code: 'F24-PRO', icon: '🇨🇳', titre: 'Mandarin Professionnel', cat: 'Langues', tarif: 1100, duree: '5 mois', heures: '160h', cert: 'HSK 4/5', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez le mandarin professionnel et obtenez le HSK 4/5/6. Mandarin des affaires, protocole chinois, négociation avec partenaires.', chapitres: [
    { num: 1, titre: 'Fondamentaux Mandarin', heures: '60h', modules: [
      { num: 1, titre: 'Pinyin et caractères', heures: '20h', contenu: 'Pinyin · Tons · Caractères simplifiés · Ecriture · Prononciation · Sons difficiles' },
      { num: 2, titre: 'Grammaire et vocabulaire', heures: '20h', contenu: 'Grammaire de base · Vocabulaire essentiel · Structures de phrases · Conversations' },
      { num: 3, titre: 'Culture chinoise', heures: '20h', contenu: 'Culture chinoise · Etiquette sociale · Guanxi · Protocole · Contexte historique' },
    ]},
    { num: 2, titre: 'Mandarin des Affaires', heures: '60h', modules: [
      { num: 1, titre: 'Vocabulaire business', heures: '25h', contenu: 'Vocabulaire business · Protocole et etiquette · Négociation · Correspondance professionnelle' },
      { num: 2, titre: 'Communication professionnelle', heures: '35h', contenu: 'Réunions · Présentations · WeChat professionnel · Documents officiels · Partenariats' },
    ]},
    { num: 3, titre: 'Certification HSK', heures: '40h', modules: [
      { num: 1, titre: 'Préparation HSK', heures: '25h', contenu: 'Vocabulaire HSK · Exercices écoute · Lecture · Ecriture · Stratégies d\'examen' },
      { num: 2, titre: 'Certification HSK', heures: '15h', contenu: 'Simulations · Certification HSK 4/5/6 officielle · Equivalences CECRL' },
    ]},
  ]},
  { code: 'F25-PRO', icon: '🇸🇦', titre: 'Arabe Professionnel', cat: 'Langues', tarif: 1000, duree: '4 mois', heures: '140h', cert: 'CIPLE B1', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'arabe standard moderne des affaires et obtenez la certification CIPLE. Commerce avec les pays arabes, correspondance officielle.', chapitres: [
    { num: 1, titre: 'Arabe Standard Moderne', heures: '60h', modules: [
      { num: 1, titre: 'Alphabet et bases', heures: '25h', contenu: 'Alphabet arabe · Ecriture et prononciation · Grammaire fondamentale · Vocabulaire essentiel' },
      { num: 2, titre: 'Compréhension', heures: '35h', contenu: 'Arabe standard vs dialectes · Ecoute presse arabe · Al Jazeera · Lecture documents officiels' },
    ]},
    { num: 2, titre: 'Arabe des Affaires', heures: '50h', modules: [
      { num: 1, titre: 'Vocabulaire business', heures: '25h', contenu: 'Vocabulaire business · Commerce pays arabes · Correspondance officielle · Contrats en arabe' },
      { num: 2, titre: 'Protocole et culture', heures: '25h', contenu: 'Protocole et culture d\'affaires · Réunions · Négociation · Golfe Persique vs Maghreb' },
    ]},
    { num: 3, titre: 'Certification CIPLE', heures: '30h', modules: [
      { num: 1, titre: 'Préparation et certification', heures: '30h', contenu: 'Révisions CIPLE/CECRL · Compréhension · Production · Simulations · Certification officielle' },
    ]},
  ]},
  { code: 'F26-PRO', icon: '🇮🇱', titre: 'Hébreu Professionnel', cat: 'Langues', tarif: 900, duree: '3 mois', heures: '100h', cert: 'Ulpan avancé', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'hébreu professionnel et obtenez la certification Ulpan avancé. Hébreu commercial, vocabulaire tech et startup.', chapitres: [
    { num: 1, titre: 'Hébreu Fondamentaux', heures: '40h', modules: [
      { num: 1, titre: 'Alphabet et bases', heures: '20h', contenu: 'Alphabet hébreu · Ecriture et prononciation · Grammaire · Vocabulaire essentiel' },
      { num: 2, titre: 'Culture israélienne', heures: '20h', contenu: 'Hébreu moderne · Culture israélienne · Contexte historique · Vie quotidienne' },
    ]},
    { num: 2, titre: 'Hébreu Professionnel & Certification', heures: '60h', modules: [
      { num: 1, titre: 'Vocabulaire professionnel', heures: '25h', contenu: 'Vocabulaire commercial · Startup Nation · Tech vocabulary · Correspondance professionnelle' },
      { num: 2, titre: 'Communication business', heures: '20h', contenu: 'Réunions · Partenariats franco-israéliens · Protocole business Israël · Hébreu écrit et oral' },
      { num: 3, titre: 'Certification Ulpan', heures: '15h', contenu: 'Préparation Ulpan avancé · Simulations · Certification · Vie quotidienne en Israël' },
    ]},
  ]},
  { code: 'F27', icon: '🌙', titre: 'Hypnothérapie Clinique', cat: 'Bien-être', tarif: 3200, duree: '12 mois', heures: '300h', cert: 'Certifié', cpf: true, opco: 'AFDAS', tp: false, domtom: true, handicap: true, description: 'Devenez Hypnothérapeute Clinique certifié. Accompagnement thérapeutique des blocages légers, phobies, anxiété et tabac. Supervision clinique mensuelle.', chapitres: [
    { num: 1, titre: 'Fondamentaux Hypnothérapie Clinique', heures: '80h', modules: [
      { num: 1, titre: 'Neurobiologie de l\'hypnose', heures: '20h', contenu: 'Neurobiologie · Etats de conscience modifiés · Différences hypnose Ericksonienne et clinique' },
      { num: 2, titre: 'Evaluation clinique', heures: '20h', contenu: 'Bilan psychologique · Contre-indications · Ethique clinique · Cadre légal strict' },
      { num: 3, titre: 'Protocoles d\'induction clinique', heures: '20h', contenu: 'Inductions cliniques · Approfondissement · Suggestions thérapeutiques · Documentation' },
      { num: 4, titre: 'Premières séances cliniques', heures: '20h', contenu: 'Premières séances supervisées · Feedback clinique · Ajustements protocoles' },
    ]},
    { num: 2, titre: 'Protocoles Cliniques', heures: '120h', modules: [
      { num: 1, titre: 'Phobies et anxiété', heures: '30h', contenu: 'Phobies légères · Anxiété · Attaques de panique · Protocoles spécifiques' },
      { num: 2, titre: 'Addictions comportementales', heures: '30h', contenu: 'Tabac · Addictions légères · TCA légers · Protocoles arrêt tabac' },
      { num: 3, titre: 'Douleur et sommeil', heures: '30h', contenu: 'Gestion douleur chronique · Troubles du sommeil · Préparation chirurgicale · EMDR hypnotique' },
      { num: 4, titre: 'Régression et trauma léger', heures: '30h', contenu: 'Régression thérapeutique · Traumas légers · Blocages de performance · Supervision clinique' },
    ]},
    { num: 3, titre: 'Pratique Clinique Supervisée', heures: '100h', modules: [
      { num: 1, titre: 'Séances cliniques supervisées', heures: '60h', contenu: '150 séances supervisées · Supervision clinique mensuelle · Etudes de cas complexes' },
      { num: 2, titre: 'Documentation et certification', heures: '40h', contenu: 'Rédaction de rapports · Coordination professionnels de santé · Mémoire clinique 80 pages · Jury' },
    ]},
  ]},
  { code: 'F28', icon: '🤖', titre: 'IA Générative Professionnelle', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez l\'IA générative dans votre métier en 80 heures. Claude API, GPT-4o, Prompt Engineering avancé, agents IA et MCP Protocol.', chapitres: [
    { num: 1, titre: 'Fondamentaux LLM', heures: '16h', modules: [
      { num: 1, titre: 'Comprendre les LLM', heures: '4h', contenu: 'Transformers · Tokens · Context window · Temperature · Top-p · Hallucinations' },
      { num: 2, titre: 'Panorama des modèles 2026', heures: '4h', contenu: 'Claude · GPT-4o · Gemini · Mistral · Llama · Comparatif · Cas d\'usage' },
      { num: 3, titre: 'Ethique et limites', heures: '4h', contenu: 'Biais · RGPD · Propriété intellectuelle · Fake news · Usage responsable' },
      { num: 4, titre: 'Setup et accès', heures: '4h', contenu: 'Création comptes · APIs · Interfaces · Coûts · Comparatif prix/performance' },
    ]},
    { num: 2, titre: 'Prompt Engineering Avancé', heures: '20h', modules: [
      { num: 1, titre: 'Prompts de base', heures: '4h', contenu: 'Zero-shot · Few-shot · Rôles · Instructions claires · Format sortie' },
      { num: 2, titre: 'Chain of Thought', heures: '4h', contenu: 'CoT · Tree of Thought · ReAct · Auto-consistency · Méta-prompts' },
      { num: 3, titre: 'Prompts métier', heures: '6h', contenu: 'Prompts RH · Marketing · Finance · Juridique · Code · Analyse · Stratégie' },
      { num: 4, titre: 'Optimisation et évaluation', heures: '6h', contenu: 'A/B test prompts · Métriques · Itération · Prompt libraries · Versioning' },
    ]},
    { num: 3, titre: 'IA dans son Métier', heures: '24h', modules: [
      { num: 1, titre: 'IA pour la rédaction', heures: '6h', contenu: 'Emails · Rapports · Présentations · Posts LinkedIn · Articles · Reformulation' },
      { num: 2, titre: 'IA pour l\'analyse', heures: '6h', contenu: 'Analyse de données · Synthèse documents · Recherche · Veille automatisée' },
      { num: 3, titre: 'IA pour le code', heures: '6h', contenu: 'GitHub Copilot · Cursor · Claude Code · Debug · Refactoring · Tests auto' },
      { num: 4, titre: 'AI Operating System', heures: '6h', contenu: 'Stack IA personnelle · Workflows · Templates · Knowledge base · Routines' },
    ]},
    { num: 4, titre: 'Agents IA Avancés', heures: '20h', modules: [
      { num: 1, titre: 'Function Calling', heures: '5h', contenu: 'Tools API Claude · Connecter des APIs externes · Structurer les outputs' },
      { num: 2, titre: 'MCP Protocol', heures: '5h', contenu: 'Model Context Protocol · Créer un serveur MCP · Connexion données réelles' },
      { num: 3, titre: 'Projet agent personnel', heures: '10h', contenu: 'Agent autonome pour son métier · Test · Itération · Documentation · Certification RS' },
    ]},
  ]},
  { code: 'F29', icon: '⚙️', titre: 'Automatisations & Agents IA', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Automatisez 10 heures de travail par semaine en 2 mois. Make Expert, n8n open source, agents autonomes et Claude API dans les workflows.', chapitres: [
    { num: 1, titre: 'Make Fondamentaux', heures: '20h', modules: [
      { num: 1, titre: 'Introduction Make', heures: '4h', contenu: 'Interface · Scénarios · Modules · Connexions · Exécution · Logs · Erreurs' },
      { num: 2, titre: 'Intégrations essentielles', heures: '6h', contenu: 'Gmail · Google Sheets · Airtable · Slack · Notion · Calendrier · Drive' },
      { num: 3, titre: 'Filtres et routeurs', heures: '5h', contenu: 'Conditions · If/Else · Routeur · Agrégateur · Iterator · Array functions' },
      { num: 4, titre: 'Webhooks', heures: '5h', contenu: 'Webhook entrant/sortant · Ecoute événements · Déclencheurs personnalisés' },
    ]},
    { num: 2, titre: 'Make Avancé', heures: '20h', modules: [
      { num: 1, titre: 'Make + IA', heures: '6h', contenu: 'Claude API dans Make · Génération contenu · Analyse données · Décisions IA' },
      { num: 2, titre: 'Automatisations marketing', heures: '6h', contenu: 'Lead nurturing · Newsletter auto · Social media posting · CRM sync' },
      { num: 3, titre: 'Automatisations business', heures: '8h', contenu: 'Facturation · Onboarding client · Reporting · Alertes · Tableaux de bord' },
    ]},
    { num: 3, titre: 'n8n Open Source', heures: '20h', modules: [
      { num: 1, titre: 'n8n vs Make', heures: '4h', contenu: 'Différences · Cas d\'usage · Self-hosting · Coûts · Migration Make vers n8n' },
      { num: 2, titre: 'n8n Avancé', heures: '8h', contenu: 'Custom nodes · Code node · Expressions · Variables · HTTP requests · Auth' },
      { num: 3, titre: 'Agents n8n', heures: '8h', contenu: 'AI Agent node · Mémoire · Outils · Chat trigger · Long-running workflows' },
    ]},
    { num: 4, titre: 'Agents Autonomes', heures: '20h', modules: [
      { num: 1, titre: 'Architecture agents', heures: '6h', contenu: 'ReAct · Planning · Memory · Tools · Multi-agents · Orchestration' },
      { num: 2, titre: 'Alternatives et comparatif', heures: '4h', contenu: 'Comparatif Make/n8n/Zapier/Activepieces · Choisir son stack' },
      { num: 3, titre: 'Projet final automatisation', heures: '10h', contenu: 'Automatiser un processus métier réel · ROI calculé · Documentation · Certification' },
    ]},
  ]},
  { code: 'F30', icon: '🔍', titre: 'SEO & Acquisition Organique', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez le SEO technique et le content marketing assisté par IA pour générer un trafic organique durable.', chapitres: [
    { num: 1, titre: 'SEO Technique', heures: '24h', modules: [
      { num: 1, titre: 'Fondamentaux SEO', heures: '8h', contenu: 'Core Web Vitals · Architecture site · Cocon sémantique · Schema.org · Indexation' },
      { num: 2, titre: 'Audit et outils', heures: '8h', contenu: 'Crawl budget · Search Console · Semrush · Screaming Frog · Audit complet' },
      { num: 3, titre: 'SEO avancé', heures: '8h', contenu: 'E-E-A-T · Contenu IA et Google · Featured snippets · Core algorithm updates' },
    ]},
    { num: 2, titre: 'Content Marketing IA', heures: '28h', modules: [
      { num: 1, titre: 'Stratégie éditoriale', heures: '8h', contenu: 'Recherche mots-clés · Intention de recherche · Calendrier éditorial · Clusters' },
      { num: 2, titre: 'Production avec Claude API', heures: '12h', contenu: 'Pipeline contenu automatisé · Optimisation Surfer SEO · Brief IA · Révision humaine' },
      { num: 3, titre: 'Distribution et republication', heures: '8h', contenu: 'Distribution multicanal · Republication · Mise à jour contenu · Mesure impact' },
    ]},
    { num: 3, titre: 'Link Building & Mesure', heures: '28h', modules: [
      { num: 1, titre: 'Link Building', heures: '12h', contenu: 'Digital PR · Backlinks qualitatifs · Relations presse · Guest posting · HARO' },
      { num: 2, titre: 'SEO Local & International', heures: '8h', contenu: 'Hreflang · SEO local · Google Business Profile · DOM-TOM · Netlinking local' },
      { num: 3, titre: 'Mesure et reporting', heures: '8h', contenu: 'GA4 avancé · Attribution · Reporting automatique · Projet SEO avec résultats mesurables' },
    ]},
  ]},
  { code: 'F31', icon: '📣', titre: 'Acquisition Google & Meta Ads', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'Google+Meta', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Devenez expert en acquisition payante Google Ads et Meta Ads. Search, Display, YouTube, Performance Max, audiences Meta, CAPI, retargeting.', chapitres: [
    { num: 1, titre: 'Google Ads Expert', heures: '32h', modules: [
      { num: 1, titre: 'Google Search & Display', heures: '12h', contenu: 'Search · Display · Quality Score · Extensions · Enchères · Attribution' },
      { num: 2, titre: 'YouTube & Shopping', heures: '10h', contenu: 'YouTube Ads · Shopping · Performance Max · Scripts automatisation' },
      { num: 3, titre: 'Optimisation & Reporting', heures: '10h', contenu: 'Smart Bidding · Optimisation créas · Reporting automatique IA · Certification Google' },
    ]},
    { num: 2, titre: 'Meta Ads Expert', heures: '28h', modules: [
      { num: 1, titre: 'Audiences & Ciblage', heures: '10h', contenu: 'Audiences · Lookalike · Pixel Meta · CAPI server-side · Retargeting avancé' },
      { num: 2, titre: 'Creative & Budget', heures: '10h', contenu: 'Creative testing · Budget optimisation · TikTok for Business · LinkedIn Ads' },
      { num: 3, titre: 'Certification Meta Blueprint', heures: '8h', contenu: 'Révisions · Simulations · Certification Meta Blueprint officielle' },
    ]},
    { num: 3, titre: 'Automatisation & Mesure', heures: '20h', modules: [
      { num: 1, titre: 'Campagnes automatisées IA', heures: '10h', contenu: 'Bidding algorithmique · Creative IA · Attribution cross-canal · ROAS optimisation' },
      { num: 2, titre: 'Analytics & Budget', heures: '10h', contenu: 'GA4 · Looker Studio · Budget planning · Rapport de performance mensuel' },
    ]},
  ]},
  { code: 'F32', icon: '💻', titre: 'Développement Applications IA', cat: 'IA & No-Code', tarif: 1400, duree: '2 mois', heures: '80h', cert: 'RS', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Développez des applications IA complètes avec Claude API, LangChain, RAG et agents autonomes. Next.js, Supabase, Vercel.', chapitres: [
    { num: 1, titre: 'Claude API & LLM', heures: '24h', modules: [
      { num: 1, titre: 'Anthropic SDK', heures: '8h', contenu: 'Anthropic SDK · System prompts · Function calling · Tool use · Streaming' },
      { num: 2, titre: 'Embeddings & Vector DB', heures: '8h', contenu: 'Context management · Embeddings · Vector databases · Pinecone · Supabase pgvector' },
      { num: 3, titre: 'Architecture LLM', heures: '8h', contenu: 'Chunking · Retrieval strategies · Evaluation LLM · Optimisation coûts API' },
    ]},
    { num: 2, titre: 'RAG & Agents', heures: '28h', modules: [
      { num: 1, titre: 'RAG Architecture', heures: '10h', contenu: 'RAG pipeline · LangChain · LlamaIndex · Retrieval strategies · Hybrid search' },
      { num: 2, titre: 'Agents autonomes', heures: '10h', contenu: 'ReAct · Memory · Multi-agents · MCP Protocol · Orchestration agents' },
      { num: 3, titre: 'Evaluation & Optimisation', heures: '8h', contenu: 'Evaluation LLM · Benchmarks · Optimisation latence · Réduction coûts' },
    ]},
    { num: 3, titre: 'Application Production', heures: '28h', modules: [
      { num: 1, titre: 'Next.js + Claude API', heures: '10h', contenu: 'Interface chat · Streaming UI · App router · Server actions · TypeScript' },
      { num: 2, titre: 'Backend & Base de données', heures: '10h', contenu: 'Supabase auth · PostgreSQL · Stripe paiements · API REST · WebSockets' },
      { num: 3, titre: 'Déploiement & Monitoring', heures: '8h', contenu: 'Vercel · CI/CD · Monitoring · Alertes · Optimisation · Projet application complète' },
    ]},
  ]},
  { code: 'F33', icon: '📋', titre: 'Gestion de Projet IA', cat: 'IA & No-Code', tarif: 1200, duree: '2 mois', heures: '60h', cert: 'RS', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Pilotez des projets IA de A à Z. Méthodologies agiles adaptées à l\'IA, gestion des risques, évaluation des modèles, conformité IA Act.', chapitres: [
    { num: 1, titre: 'Fondamentaux Projet IA', heures: '20h', modules: [
      { num: 1, titre: 'Spécificités projets IA', heures: '8h', contenu: 'IA vs IT classique · Evaluation feasibility · Choix modèles · Build vs buy vs fine-tune' },
      { num: 2, titre: 'Planification', heures: '12h', contenu: 'Budget · Equipe · Roadmap · OKR · Backlog IA · Definition of Done IA' },
    ]},
    { num: 2, titre: 'Méthodes & Outils', heures: '24h', modules: [
      { num: 1, titre: 'Agile adapté IA', heures: '8h', contenu: 'Sprints · Gestion des données · MLOps basics · Notion · Linear · Jira' },
      { num: 2, titre: 'Gestion des risques', heures: '8h', contenu: 'Risques IA · Biais · Dépendances · Plan de contingence · Communication' },
      { num: 3, titre: 'Reporting automatique', heures: '8h', contenu: 'Tableaux de bord · KPIs IA · Reporting parties prenantes · Alertes automatiques' },
    ]},
    { num: 3, titre: 'Gouvernance & Conformité', heures: '16h', modules: [
      { num: 1, titre: 'IA Act & Ethique', heures: '8h', contenu: 'IA Act européen · Ethique IA · Biais · RGPD et IA · Documentation technique' },
      { num: 2, titre: 'Projet certifiant', heures: '8h', contenu: 'Audit modèles · Communication parties prenantes · Plan projet IA complet · Certification RS' },
    ]},
  ]},
  { code: 'F34', icon: '🫧', titre: 'Bubble No-Code App Builder', cat: 'Outils', tarif: 1200, duree: '1 mois', heures: '35h', cert: 'Bubble', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Bubble et obtenez la certification Bubble Certified Developer. Design system, data types, workflows, Stripe, API Connector et déploiement.', chapitres: [
    { num: 1, titre: 'Bubble Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Interface et design', heures: '8h', contenu: 'Design system · Pages · Responsive · Composants réutilisables · Styles · Thèmes' },
      { num: 2, titre: 'Data et workflows', heures: '7h', contenu: 'Data types · Champs · Relations · Options sets · Workflows · Actions · Déclencheurs' },
    ]},
    { num: 2, titre: 'Bubble Avancé & Certification', heures: '20h', modules: [
      { num: 1, titre: 'Intégrations', heures: '10h', contenu: 'API Connector · Claude API · Stripe · Abonnements · Webhooks · Plugins · Privacy rules · Sécurité' },
      { num: 2, titre: 'Déploiement et certification', heures: '10h', contenu: 'Déploiement · Domaine custom · Cloudflare · SSL · Performance · Certification Bubble' },
    ]},
  ]},
  { code: 'F35', icon: '🌐', titre: 'Webflow Web Design', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Webflow', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Créez des sites web professionnels avec Webflow sans coder. CSS visuel, animations, CMS, e-commerce. Certification Webflow Expert.', chapitres: [
    { num: 1, titre: 'Webflow Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Design et layout', heures: '8h', contenu: 'Interface Webflow · CSS visuel · Flexbox · Grid · Responsive · Styles · Classes' },
      { num: 2, titre: 'Animations et interactions', heures: '7h', contenu: 'Animations · Interactions · Scroll effects · Hover states · Transitions' },
    ]},
    { num: 2, titre: 'Webflow Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'CMS et E-commerce', heures: '8h', contenu: 'CMS collections · Blog · Dynamic content · E-commerce · Formulaires · Memberstack' },
      { num: 2, titre: 'SEO et certification', heures: '7h', contenu: 'SEO Webflow · Déploiement · Domaine · Performance · Certification Webflow Expert' },
    ]},
  ]},
  { code: 'F36', icon: '⚡', titre: 'Make Automatisation', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'Make Expert', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Make et obtenez la certification Make Expert. Scénarios, webhooks, intégrations, Claude API, automatisation marketing et business.', chapitres: [
    { num: 1, titre: 'Make Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Interface et scénarios', heures: '8h', contenu: 'Interface Make · Scénarios · Modules · Connexions · Filtres · Routeurs · Agrégateurs' },
      { num: 2, titre: 'Intégrations essentielles', heures: '7h', contenu: 'Gmail · Sheets · Airtable · Slack · Notion · Webhooks entrant/sortant · Scheduling' },
    ]},
    { num: 2, titre: 'Make Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'Make + IA', heures: '8h', contenu: 'Claude API dans Make · Agents IA · Génération contenu · Analyse données · Marketing automation' },
      { num: 2, titre: 'Certification Make Expert', heures: '7h', contenu: 'Reporting auto · Facturation · Onboarding · Projet Make complet · Certification Make Expert' },
    ]},
  ]},
  { code: 'F37', icon: '🔧', titre: 'n8n Open Source', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'n8n Certified', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez n8n open source et obtenez la certification n8n. Self-hosting, custom nodes, AI Agent node, workflows complexes.', chapitres: [
    { num: 1, titre: 'n8n Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Installation et interface', heures: '8h', contenu: 'Installation n8n · Self-hosting Docker · Interface · Nodes · Expressions · Variables' },
      { num: 2, titre: 'Workflows et intégrations', heures: '7h', contenu: 'HTTP requests · Authentication · Custom nodes · Code node · Comparatif Make vs n8n' },
    ]},
    { num: 2, titre: 'n8n Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'Agents IA avec n8n', heures: '8h', contenu: 'AI Agent node · Mémoire agents · Chat trigger · Long-running workflows · Migration Make vers n8n' },
      { num: 2, titre: 'Certification n8n', heures: '7h', contenu: 'Projet n8n complet · Documentation · Certification n8n Certified officielle' },
    ]},
  ]},
  { code: 'F38', icon: '📋', titre: 'Airtable', cat: 'Outils', tarif: 900, duree: '1 mois', heures: '25h', cert: 'Airtable Builder', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Airtable comme base de données no-code et obtenez la certification Airtable Builder.', chapitres: [
    { num: 1, titre: 'Airtable Fondamentaux', heures: '12h', modules: [
      { num: 1, titre: 'Bases et tables', heures: '6h', contenu: 'Structure bases et tables · Types de champs · Relations · Vues grille · Galerie · Kanban · Calendrier' },
      { num: 2, titre: 'Formules et automatisations', heures: '6h', contenu: 'Formules avancées · Lookup · Rollup · Automatisations natives · Interfaces · Blocks' },
    ]},
    { num: 2, titre: 'Airtable Avancé & Certification', heures: '13h', modules: [
      { num: 1, titre: 'Intégrations', heures: '7h', contenu: 'API Airtable · Intégration Make · Zapier · Webhooks · Connexion Claude API · Synchronisation' },
      { num: 2, titre: 'Certification Airtable Builder', heures: '6h', contenu: 'Projet Airtable complet · Documentation · Certification Airtable Builder officielle' },
    ]},
  ]},
  { code: 'F39', icon: '📓', titre: 'Notion & IA', cat: 'Outils', tarif: 900, duree: '1 mois', heures: '25h', cert: 'Notion', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Notion comme système de gestion de la connaissance augmentée par l\'IA.', chapitres: [
    { num: 1, titre: 'Notion Fondamentaux', heures: '12h', modules: [
      { num: 1, titre: 'Structure et bases de données', heures: '6h', contenu: 'Pages et blocs · Bases de données · Propriétés · Vues · Filtres · Relations · Rollups' },
      { num: 2, titre: 'Templates et formules', heures: '6h', contenu: 'Formules Notion · Templates avancés · Second Brain · Système de productivité personnel' },
    ]},
    { num: 2, titre: 'Notion IA & Certification', heures: '13h', modules: [
      { num: 1, titre: 'Notion AI et intégrations', heures: '7h', contenu: 'Notion AI · Génération contenu · Résumés · Intégration Make · API Notion · Automatisations' },
      { num: 2, titre: 'Certification Notion', heures: '6h', contenu: 'Projet Notion complet · Documentation · Certification Notion officielle' },
    ]},
  ]},
  { code: 'F40', icon: '🎨', titre: 'Figma UI/UX Design', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Figma Pro', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Figma pour le design UI/UX et obtenez la certification Figma Professional.', chapitres: [
    { num: 1, titre: 'Figma Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Interface et design', heures: '8h', contenu: 'Interface Figma · Frames · Auto-layout · Variables · Styles · Design tokens · Grilles' },
      { num: 2, titre: 'Composants et design system', heures: '7h', contenu: 'Composants · Variantes · Design system · Bibliothèques · Handoff développeurs' },
    ]},
    { num: 2, titre: 'Figma Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'Prototypage et Figma AI', heures: '8h', contenu: 'Prototypage interactif · Animations · Figma AI · Génération designs · FigJam · Collaboration' },
      { num: 2, titre: 'Certification Figma Professional', heures: '7h', contenu: 'Projet UI/UX complet · Documentation · Certification Figma Professional officielle' },
    ]},
  ]},
  { code: 'F41', icon: '✨', titre: 'Lovable Vibe Coding IA', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '25h', cert: 'RS', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Créez des applications web complètes avec Lovable en langage naturel. Vibe coding avec IA, déploiement instantané, Supabase.', chapitres: [
    { num: 1, titre: 'Lovable Fondamentaux', heures: '12h', modules: [
      { num: 1, titre: 'Interface et génération', heures: '6h', contenu: 'Interface Lovable · Prompts de génération · Composants React générés · Correction et itération' },
      { num: 2, titre: 'Connexions et base de données', heures: '6h', contenu: 'Connexion Supabase · Authentication · Base de données · RLS · Variables d\'environnement' },
    ]},
    { num: 2, titre: 'Lovable Avancé & Certification', heures: '13h', modules: [
      { num: 1, titre: 'Intégrations et déploiement', heures: '7h', contenu: 'Stripe paiements · API externes · Déploiement · Domaine custom · GitHub sync · Lovable vs Cursor vs Bolt' },
      { num: 2, titre: 'Certification RS Vibe Coding', heures: '6h', contenu: 'Projet application complète · Documentation · Certification RS Vibe Coding officielle' },
    ]},
  ]},
  { code: 'F42', icon: '🖼️', titre: 'Framer Web Design', cat: 'Outils', tarif: 1100, duree: '1 mois', heures: '30h', cert: 'Framer Expert', cpf: true, opco: false, tp: false, domtom: true, handicap: true, description: 'Créez des sites web premium avec Framer et obtenez la certification Framer Expert. Animations avancées, CMS, composants React natifs.', chapitres: [
    { num: 1, titre: 'Framer Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Interface et design', heures: '8h', contenu: 'Interface Framer · Canvas · Frames · Stack · Grids · Responsive · Styles · Thèmes' },
      { num: 2, titre: 'Animations avancées', heures: '7h', contenu: 'Animations et transitions · Scroll interactions · Hover effects · Micro-interactions · Motion' },
    ]},
    { num: 2, titre: 'Framer Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'CMS et composants React', heures: '8h', contenu: 'CMS Framer · Collections · Composants React · Override · Localization · SEO · Performance' },
      { num: 2, titre: 'Certification Framer Expert', heures: '7h', contenu: 'Déploiement · Framer AI · Génération de sections · Projet complet · Certification Framer Expert' },
    ]},
  ]},
  { code: 'F43', icon: '💻', titre: 'Cursor Code Assisté IA', cat: 'Outils', tarif: 1000, duree: '1 mois', heures: '30h', cert: 'RS Dev IA', cpf: true, opco: true, tp: false, domtom: true, handicap: true, description: 'Maîtrisez Cursor comme environnement de développement assisté par IA. Chat, Composer, Agent mode, Next.js full-stack, Supabase et Vercel.', chapitres: [
    { num: 1, titre: 'Cursor Fondamentaux', heures: '15h', modules: [
      { num: 1, titre: 'Interface et modes', heures: '8h', contenu: 'Interface Cursor · Chat · Composer · Agent mode · Rules · Prompting efficace pour le code' },
      { num: 2, titre: 'Développement assisté', heures: '7h', contenu: 'Contexte et exemples · Refactoring assisté · Debug avec l\'IA · Tests · Documentation auto' },
    ]},
    { num: 2, titre: 'Cursor Avancé & Certification', heures: '15h', modules: [
      { num: 1, titre: 'Full Stack avec Cursor', heures: '8h', contenu: 'Next.js app router · Server actions · API routes · Supabase · RLS · Auth · Vercel · CI/CD' },
      { num: 2, titre: 'Certification RS Dev IA', heures: '7h', contenu: 'Cursor vs GitHub Copilot vs Claude Code · Projet full stack complet · Certification RS Dev IA' },
    ]},
  ]},
]

export const PRATICIENS_BIENETRE = [
  { id: 'maya', nom: 'Maya', spec: 'Sophrologie Caycédienne', tarif: 50, icon: '🧘', dispo: 'Maintenant', color: '#0ec4b0' },
  { id: 'eric', nom: 'Eric', spec: 'Hypnose Ericksonienne', tarif: 50, icon: '🌀', dispo: 'Dans 30 min', color: '#9b7cf4' },
  { id: 'jade', nom: 'Jade', spec: 'Coach de Vie ICF', tarif: 50, icon: '💚', dispo: 'Maintenant', color: '#4caf50' },
  { id: 'maxime', nom: 'Maxime', spec: 'Executive Coach MCC', tarif: 65, icon: '🎯', dispo: '15h00', color: '#c8a96e' },
  { id: 'leila', nom: 'Leila', spec: 'CNV & Médiation', tarif: 50, icon: '🫶', dispo: 'Demain', color: '#0ec4b0' },
  { id: 'hugo', nom: 'Hugo', spec: 'Nutrition & Bien-être', tarif: 50, icon: '🥗', dispo: 'Maintenant', color: '#8bc34a' },
  { id: 'sarah', nom: 'Sarah', spec: 'Mindfulness & Equilibre', tarif: 50, icon: '🌙', dispo: '20h00', color: '#448aff' },
  { id: 'david', nom: 'David', spec: 'Hypnothérapie Clinique', tarif: 65, icon: '🧠', dispo: 'Sur RDV', color: '#9b7cf4' },
]

export const STATS = {
  formations: 43,
  agents: 116,
  latence: '<2s',
  abandon: '<15%',
  certifications: 'RS · RNCP · CompTIA · ICF',
  financement: 'CPF · OPCO · Transitions Pro · France Travail',
}

