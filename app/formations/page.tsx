export default async function FormationsPage() {

  const { createClient } = await import("@supabase/supabase-js");

  type Formation = {
    id: number;
    titre: string;
    domaine: string;
    duree: string;
    niveau: string;
    prix: number;
    description: string;
    certification: boolean;
  };

  const staticFormations: Formation[] = [
    { id: 1, titre: "Intelligence Artificielle Fondamentaux", domaine: "IA & Machine Learning", duree: "40h", niveau: "Débutant", prix: 497, description: "Maîtrisez les bases de l'IA moderne", certification: true },
    { id: 2, titre: "Machine Learning Avancé", domaine: "IA & Machine Learning", duree: "60h", niveau: "Avancé", prix: 897, description: "Algorithmes ML approfondis et pratiques", certification: true },
    { id: 3, titre: "Deep Learning & Réseaux de Neurones", domaine: "IA & Machine Learning", duree: "55h", niveau: "Avancé", prix: 997, description: "Architectures neuronales de pointe", certification: true },
    { id: 4, titre: "Python pour la Data Science", domaine: "Data Science", duree: "35h", niveau: "Intermédiaire", prix: 397, description: "Python appliqué à l'analyse de données", certification: true },
    { id: 5, titre: "Data Visualisation avec Tableau", domaine: "Data Science", duree: "25h", niveau: "Débutant", prix: 297, description: "Créez des dashboards percutants", certification: true },
    { id: 6, titre: "SQL & Bases de Données Avancé", domaine: "Data Science", duree: "30h", niveau: "Intermédiaire", prix: 347, description: "Requêtes complexes et optimisation", certification: true },
    { id: 7, titre: "ChatGPT & Prompt Engineering", domaine: "IA Générative", duree: "20h", niveau: "Débutant", prix: 197, description: "Maîtrisez les LLMs et le prompt crafting", certification: true },
    { id: 8, titre: "Midjourney & DALL-E Création Visuelle", domaine: "IA Générative", duree: "15h", niveau: "Débutant", prix: 147, description: "Créez des visuels IA professionnels", certification: true },
    { id: 9, titre: "Automatisation No-Code avec Zapier", domaine: "Automatisation", duree: "22h", niveau: "Débutant", prix: 247, description: "Automatisez vos workflows sans coder", certification: true },
    { id: 10, titre: "Make (Integromat) Masterclass", domaine: "Automatisation", duree: "28h", niveau: "Intermédiaire", prix: 347, description: "Intégrations avancées et scénarios complexes", certification: true },
    { id: 11, titre: "React.js de Zéro à Expert", domaine: "Développement Web", duree: "70h", niveau: "Intermédiaire", prix: 797, description: "Framework React moderne et hooks", certification: true },
    { id: 12, titre: "Next.js & Full Stack Development", domaine: "Développement Web", duree: "65h", niveau: "Avancé", prix: 897, description: "Applications full stack performantes", certification: true },
    { id: 13, titre: "TypeScript Masterclass", domaine: "Développement Web", duree: "40h", niveau: "Intermédiaire", prix: 497, description: "TypeScript pour applications robustes", certification: true },
    { id: 14, titre: "Node.js Backend Development", domaine: "Développement Web", duree: "50h", niveau: "Intermédiaire", prix: 597, description: "APIs REST et microservices Node.js", certification: true },
    { id: 15, titre: "Vue.js 3 Composition API", domaine: "Développement Web", duree: "45h", niveau: "Intermédiaire", prix: 547, description: "Vue.js moderne et réactif", certification: true },
    { id: 16, titre: "Docker & Kubernetes DevOps", domaine: "DevOps & Cloud", duree: "55h", niveau: "Avancé", prix: 797, description: "Conteneurisation et orchestration", certification: true },
    { id: 17, titre: "AWS Cloud Practitioner", domaine: "DevOps & Cloud", duree: "50h", niveau: "Débutant", prix: 697, description: "Certification AWS Cloud Practitioner", certification: true },
    { id: 18, titre: "CI/CD avec GitHub Actions", domaine: "DevOps & Cloud", duree: "30h", niveau: "Intermédiaire", prix: 397, description: "Pipelines CI/CD modernes", certification: true },
    { id: 19, titre: "Cybersécurité Fondamentaux", domaine: "Cybersécurité", duree: "45h", niveau: "Débutant", prix: 547, description: "Bases de la sécurité informatique", certification: true },
    { id: 20, titre: "Ethical Hacking & Pentest", domaine: "Cybersécurité", duree: "60h", niveau: "Avancé", prix: 897, description: "Tests de pénétration professionnels", certification: true },
    { id: 21, titre: "Marketing Digital IA-Powered", domaine: "Marketing Digital", duree: "35h", niveau: "Débutant", prix: 397, description: "Marketing augmenté par l'IA", certification: true },
    { id: 22, titre: "SEO Technique Avancé", domaine: "Marketing Digital", duree: "30h", niveau: "Avancé", prix: 447, description: "Optimisation moteurs de recherche", certification: true },
    { id: 23, titre: "Google Ads Masterclass", domaine: "Marketing Digital", duree: "25h", niveau: "Intermédiaire", prix: 347, description: "Campagnes Google Ads rentables", certification: true },
    { id: 24, titre: "Social Media Marketing 2024", domaine: "Marketing Digital", duree: "20h", niveau: "Débutant", prix: 247, description: "Stratégies réseaux sociaux modernes", certification: true },
    { id: 25, titre: "Blockchain & Web3 Développement", domaine: "Blockchain", duree: "55h", niveau: "Avancé", prix: 897, description: "Smart contracts et DApps", certification: true },
    { id: 26, titre: "Solidity & Smart Contracts", domaine: "Blockchain", duree: "45h", niveau: "Avancé", prix: 797, description: "Développement Ethereum avancé", certification: true },
    { id: 27, titre: "UX/UI Design Fondamentaux", domaine: "Design", duree: "40h", niveau: "Débutant", prix: 447, description: "Principes du design centré utilisateur", certification: true },
    { id: 28, titre: "Figma Masterclass Pro", domaine: "Design", duree: "30h", niveau: "Intermédiaire", prix: 347, description: "Prototypage et design system Figma", certification: true },
    { id: 29, titre: "Motion Design After Effects", domaine: "Design", duree: "35h", niveau: "Intermédiaire", prix: 397, description: "Animation et motion graphics", certification: true },
    { id: 30, titre: "Product Management Digital", domaine: "Business & Management", duree: "40h", niveau: "Intermédiaire", prix: 597, description: "Gestion produit agile et data-driven", certification: true },
    { id: 31, titre: "Agile & Scrum Certification", domaine: "Business & Management", duree: "25h", niveau: "Débutant", prix: 347, description: "Méthodologies agiles professionnelles", certification: true },
    { id: 32, titre: "Leadership & Management IA", domaine: "Business & Management", duree: "30h", niveau: "Avancé", prix: 497, description: "Management à l'ère de l'IA", certification: true },
    { id: 33, titre: "Finance & Analyse Financière", domaine: "Finance", duree: "45h", niveau: "Intermédiaire", prix: 597, description: "Analyse financière et modélisation", certification: true },
    { id: 34, titre: "Excel & Power BI Avancé", domaine: "Data Science", duree: "35h", niveau: "Intermédiaire", prix: 397, description: "Business intelligence Microsoft", certification: true },
    { id: 35, titre: "TensorFlow & Keras Deep Learning", domaine: "IA & Machine Learning", duree: "50h", niveau: "Avancé", prix: 797, description: "Frameworks deep learning industriels", certification: true },
    { id: 36, titre: "PyTorch Neural Networks", domaine: "IA & Machine Learning", duree: "48h", niveau: "Avancé", prix: 797, description: "PyTorch pour la recherche et production", certification: true },
    { id: 37, titre: "NLP & Traitement du Langage", domaine: "IA & Machine Learning", duree: "45h", niveau: "Avancé", prix: 747, description: "Modèles de langage et NLP avancé", certification: true },
    { id: 38, titre: "Computer Vision & OpenCV", domaine: "IA & Machine Learning", duree: "42h", niveau: "Avancé", prix: 697, description: "Vision par ordinateur professionnelle", certification: true },
    { id: 39, titre: "Reinforcement Learning", domaine: "IA & Machine Learning", duree: "52h", niveau: "Expert", prix: 997, description: "Apprentissage par renforcement avancé", certification: true },
    { id: 40, titre: "MLOps & Déploiement Modèles", domaine: "IA & Machine Learning", duree: "38h", niveau: "Avancé", prix: 697, description: "ML en production et MLOps", certification: true },
    { id: 41, titre: "Hugging Face Transformers", domaine: "IA Générative", duree: "35h", niveau: "Avancé", prix: 647, description: "Transformers et fine-tuning LLMs", certification: true },
    { id: 42, titre: "Stable Diffusion & ControlNet", domaine: "IA Générative", duree: "28h", niveau: "Intermédiaire", prix: 397, description: "Génération d'images IA avancée", certification: true },
    { id: 43, titre: "LangChain & Agents IA", domaine: "IA Générative", duree: "32h", niveau: "Avancé", prix: 597, description: "Agents intelligents avec LangChain", certification: true },
    { id: 44, titre: "RAG & Vector Databases", domaine: "IA Générative", duree: "30h", niveau: "Avancé", prix: 547, description: "Retrieval Augmented Generation", certification: true },
    { id: 45, titre: "GPT-4 API & Fine-tuning", domaine: "IA Générative", duree: "25h", niveau: "Intermédiaire", prix: 447, description: "OpenAI API et personnalisation", certification: true },
    { id: 46, titre: "n8n Automatisation Avancée", domaine: "Automatisation", duree: "32h", niveau: "Intermédiaire", prix: 397, description: "Workflows n8n self-hosted", certification: true },
    { id: 47, titre: "Power Automate Microsoft", domaine: "Automatisation", duree: "28h", niveau: "Intermédiaire", prix: 347, description: "Automatisation écosystème Microsoft", certification: true },
    { id: 48, titre: "RPA avec UiPath", domaine: "Automatisation", duree: "45h", niveau: "Avancé", prix: 697, description: "Robotic Process Automation professionnel", certification: true },
    { id: 49, titre: "Airtable & No-Code Database", domaine: "Automatisation", duree: "20h", niveau: "Débutant", prix: 197, description: "Bases de données no-code avancées", certification: true },
    { id: 50, titre: "Angular 17 Enterprise", domaine: "Développement Web", duree: "60h", niveau: "Avancé", prix: 797, description: "Angular pour applications enterprise", certification: true },
    { id: 51, titre: "Svelte & SvelteKit", domaine: "Développement Web", duree: "38h", niveau: "Intermédiaire", prix: 497, description: "Framework Svelte moderne et rapide", certification: true },
    { id: 52, titre: "GraphQL & Apollo", domaine: "Développement Web", duree: "35h", niveau: "Intermédiaire", prix: 447, description: "APIs GraphQL professionnelles", certification: true },
    { id: 53, titre: "FastAPI Python Backend", domaine: "Développement Web", duree: "32h", niveau: "Intermédiaire", prix: 397, description: "APIs rapides avec FastAPI", certification: true },
    { id: 54, titre: "Django REST Framework", domaine: "Développement Web", duree: "45h", niveau: "Intermédiaire", prix: 547, description: "Backend Python Django avancé", certification: true },
    { id: 55, titre: "Flutter Mobile Development", domaine: "Développement Mobile", duree: "55h", niveau: "Intermédiaire", prix: 697, description: "Apps mobiles cross-platform Flutter", certification: true },
    { id: 56, titre: "React Native Masterclass", domaine: "Développement Mobile", duree: "50h", niveau: "Intermédiaire", prix: 647, description: "Mobile development avec React Native", certification: true },
    { id: 57, titre: "Swift iOS Development", domaine: "Développement Mobile", duree: "60h", niveau: "Intermédiaire", prix: 797, description: "Développement iOS natif Swift", certification: true },
    { id: 58, titre: "Kotlin Android Development", domaine: "Développement Mobile", duree: "55h", niveau: "Intermédiaire", prix: 697, description: "Développement Android natif Kotlin", certification: true },
    { id: 59, titre: "Azure Cloud Architecture", domaine: "DevOps & Cloud", duree: "60h", niveau: "Avancé", prix: 897, description: "Architecture cloud Microsoft Azure", certification: true },
    { id: 60, titre: "Google Cloud Platform", domaine: "DevOps & Cloud", duree: "55h", niveau: "Avancé", prix: 797, description: "Infrastructure GCP professionnelle", certification: true },
    { id: 61, titre: "Terraform Infrastructure as Code", domaine: "DevOps & Cloud",
}}