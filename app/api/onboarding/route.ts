// app/api/onboarding/sauvegarder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface ProfilApprenant {
  userId: string;
  informationsPersonnelles: {
    prenom: string;
    nom: string;
    email: string;
    age: number;
    localisation: string;
    profession: string;
    niveauEtudes: string;
  };
  objectifsProfessionnels: {
    objectifPrincipal: string;
    domaineVise: string;
    delaiObjectif: string;
    motivations: string[];
    defisActuels: string[];
  };
  styleApprentissage: {
    stylePreferentiel: "visuel" | "auditif" | "kinesthesique" | "lecture";
    rythmePrefere: "intensif" | "regulier" | "flexible";
    disponibiliteHebdomadaire: number;
    niveauAutonomie: "debutant" | "intermediaire" | "avance";
    preferenceInteraction: "solo" | "groupe" | "mixte";
  };
  competencesActuelles: {
    domaines: string[];
    niveauGlobal: "debutant" | "intermediaire" | "avance" | "expert";
    certificationsObtenues: string[];
    experienceAnnees: number;
  };
  sante: {
    objectifsBienEtre: string[];
    niveauStress: number;
    problematiquesPrincipales: string[];
    experienceTherapeutique: boolean;
    preferenceSeance: "individuelle" | "groupe";
  };
  preferences: {
    budgetMensuel: "starter" | "professional" | "enterprise";
    formatPreference: "elearning" | "live" | "hybride";
    languePreference: string;
    dispositifsAccessibilite: string[];
  };
}

interface FormationRecommandee {
  id: string;
  titre: string;
  description: string;
  domaine: string;
  duree: string;
  niveau: string;
  format: string;
  scoreCompatibilite: number;
  raisonsRecommandation: string[];
  competencesAcquises: string[];
  prerequis: string[];
  prix: string;
}

interface SeanceTherapeutique {
  specialite: string;
  description: string;
  approche: string;
  beneficesAttendus: string[];
  frequenceRecommandee: string;
  formatRecommande: string;
  raisonsRecommandation: string;
}

interface ConfigurationDashboard {
  widgets: string[];
  prioritesAffichage: string[];
  alertes: string[];
  goalsTracking: string[];
  couleurTheme: string;
  modeAffichage: string;
}

interface ConfigurationAgentTuteur {
  tonalite: string;
  styleExplication: string;
  niveauDetail: string;
  frequenceRelance: string;
  typeEncouragement: string;
  adaptationsSpeciales: string[];
  focusThematiques: string[];
}

interface Recommandations {
  formations: FormationRecommandee[];
  seanceTherapeutique: SeanceTherapeutique;
  formatAccompagnement: {
    recommandation: "E-Learning Premium" | "Live Coaching" | "Hybride Premium";
    justification: string;
    avantagesPersonnalises: string[];
  };
  configurationDashboard: ConfigurationDashboard;
  configurationAgentTuteur: ConfigurationAgentTuteur;
  messagePersonnalise: string;
  prochainePetape: string[];
  scoreEngagement: number;
}

// ============================================================
// CATALOGUE FORMATIONS (Base de données simulée)
// ============================================================

const CATALOGUE_FORMATIONS = [
  {
    id: "form-001",
    titre: "Développement Leadership & Management",
    domaine: "Management",
    duree: "8 semaines",
    niveau: "intermediaire",
    format: "hybride",
    competencesAcquises: ["Leadership situationnel", "Gestion d'équipe", "Communication assertive"],
    prerequis: ["Expérience équipe 2 ans"],
    prix: "497€",
  },
  {
    id: "form-002",
    titre: "Intelligence Artificielle Appliquée aux Métiers",
    domaine: "Technologies",
    duree: "12 semaines",
    niveau: "debutant",
    format: "elearning",
    competencesAcquises: ["Prompt Engineering", "Automatisation IA", "Analyse données"],
    prerequis: ["Bases informatique"],
    prix: "697€",
  },
  {
    id: "form-003",
    titre: "Entrepreneuriat & Création d'Entreprise",
    domaine: "Entrepreneuriat",
    duree: "10 semaines",
    niveau: "debutant",
    format: "live",
    competencesAcquises: ["Business Plan", "Financement", "Marketing digital", "Juridique"],
    prerequis: ["Aucun"],
    prix: "897€",
  },
  {
    id: "form-004",
    titre: "Marketing Digital & Growth Hacking",
    domaine: "Marketing",
    duree: "6 semaines",
    niveau: "intermediaire",
    format: "elearning",
    competencesAcquises: ["SEO/SEA", "Social Media", "Email Marketing", "Analytics"],
    prerequis: ["Notions marketing"],
    prix: "397€",
  },
  {
    id: "form-005",
    titre: "Communication Professionnelle & Prise de Parole",
    domaine: "Communication",
    duree: "4 semaines",
    niveau: "debutant",
    format: "live",
    competencesAcquises: ["Expression orale", "Storytelling", "Négociation", "Présentation"],
    prerequis: ["Aucun"],
    prix: "297€",
  },
  {
    id: "form-006",
    titre: "Finance & Gestion pour Non-Financiers",
    domaine: "Finance",
    duree: "6 semaines",
    niveau: "debutant",
    format: "elearning",
    competencesAcquises: ["Lecture bilans", "Budget prévisionnel", "Tableaux de bord financiers"],
    prerequis: ["Aucun"],
    prix: "347€",
  },
  {
    id: "form-007",
    titre: "Développement Personnel & Intelligence Émotionnelle",
    domaine: "Soft Skills",
    duree: "8 semaines",
    niveau: "tous niveaux",
    format: "hybride",
    competencesAcquises: ["Gestion émotions", "Empathie", "Résilience", "Confiance en soi"],
    prerequis: ["Aucun"],
    prix: "497€",
  },
  {
    id: "form-008",
    titre: "Cybersécurité & Protection des Données",
    domaine: "Technologies",
    duree: "10 semaines",
    niveau: "intermediaire",
    format: "elearning",
    competencesAcquises: ["RGPD", "Sécurité réseau", "Gestion des risques cyber"],
    prerequis: ["Bases IT"],
    prix: "597€",
  },
  {
    id: "form-009",
    titre: "Coaching & Accompagnement Professionnel",
    domaine: "Coaching",
    duree: "16 semaines",
    niveau: "avance",
    format: "live",
    competencesAcquises: ["Méthodes coaching", "PNL", "Écoute active", "Certification ICF"],
    prerequis: ["Expérience relationnelle"],
    prix: "1497€",
  },
  {
    id: "form-010",
    titre: "Data Science & Analyse Décisionnelle",
    domaine: "Data",
    duree: "14 semaines",
    niveau: "intermediaire",
    format: "elearning",
    competencesAcquises: ["Python", "Visualisation données", "Machine Learning bases"],
    prerequis: ["Logique mathématique"],
    prix: "797€",
  },
];

const SPECIALITES_THERAPEUTIQUES = [
  "Gestion du stress et burn-out",
  "Développement de la confiance en soi",
  "Gestion de l'anxiété professionnelle",
  "Accompagnement transition de carrière",
  "Thérapie de couple et relations",
  "Gestion du deuil et perte",
  "Troubles du sommeil et récupération",
  "Procrastination et motivation",
  "Gestion des conflits interpersonnels",
  "Accompagnement dépression légère",
];

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

async function analyserProfilAvecClaude(profil: ProfilApprenant): Promise<Recommandations> {
  const catalogueFormate = CATALOGUE_FORMATIONS.map((f) => ({
    id: f.id,
    titre: f.titre,
    domaine: f.domaine,
    duree: f.duree,
    niveau: f.niveau,
    format: f.format,
    competences: f.competencesAcquises.join(", "),
    prix: f.prix,
  }));

  const prompt = `Tu es AcadémIA Pro, un expert en orientation pédagogique et accompagnement thérapeutique.

## PROFIL APPRENANT À ANALYSER

**Informations personnelles:**
- Nom: ${profil.informationsPersonnelles.prenom} ${profil.informationsPersonnelles.nom}
- Âge: ${profil.informationsPersonnelles.age} ans
- Profession: ${profil.informationsPersonnelles.profession}
- Niveau études: ${profil.informationsPersonnelles.niveauEtudes}
- Localisation: ${profil.informationsPersonnelles.localisation}

**Objectifs professionnels:**
- Objectif principal: ${profil.objectifsProfessionnels.objectifPrincipal}
- Domaine visé: ${profil.objectifsProfessionnels.domaineVise}
- Délai: ${profil.objectifsProfessionnels.delaiObjectif}
- Motivations: ${profil.objectifsProfessionnels.motivations.join(", ")}
- Défis actuels: ${profil.objectifsProfessionnels.defisActuels.join(", ")}

**Style d'apprentissage:**
- Style préférentiel: ${profil.styleApprentissage.stylePreferentiel}
- Rythme: ${profil.styleApprentissage.rythmePrefere}
- Disponibilité hebdomadaire: ${profil.styleApprentissage.disponibiliteHebdomadaire}h/semaine
- Niveau