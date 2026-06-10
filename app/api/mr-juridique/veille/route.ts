```typescript
// app/api/mr-juridique/veille/alertes/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AlerteJuridique {
  id: string;
  niveau: "URGENTE" | "IMPORTANTE" | "INFORMATION";
  domaine:
    | "FORMATION_PROFESSIONNELLE"
    | "FISCAL_FRANCE"
    | "FISCAL_INTERNATIONAL"
    | "DROIT_SOCIETES"
    | "PROPRIETE_INTELLECTUELLE";
  titre: string;
  description: string;
  impact: string;
  actionRequise: string | null;
  deadline: string | null;
  sources: string[];
  dateDetection: string;
  dateEffet: string | null;
  statut: "NOUVELLE" | "EN_COURS" | "TRAITEE";
  tags: string[];
}

interface AlertesResponse {
  success: boolean;
  timestamp: string;
  totalAlertes: number;
  urgentes: number;
  importantes: number;
  informations: number;
  alertes: AlerteJuridique[];
  prochaineSurveillance: string;
}

// Simulation base de données alertes juridiques
const alertesDatabase: AlerteJuridique[] = [
  {
    id: "ALT-2024-001",
    niveau: "URGENTE",
    domaine: "FORMATION_PROFESSIONNELLE",
    titre: "Modification critères Qualiopi - Audit de surveillance renforcé",
    description:
      "Le référentiel national qualité Qualiopi fait l'objet d'une révision des indicateurs 2 et 7 concernant les ressources pédagogiques numériques. Les organismes de formation utilisant des outils IA doivent documenter leurs processus avant le prochain audit.",
    impact:
      "Impact direct sur AcadémIA Pro : nécessité de documenter l'utilisation des outils IA dans les processus pédagogiques. Risque de non-conformité si non traité avant audit.",
    actionRequise:
      "Mettre à jour le dossier qualité Qualiopi pour intégrer la documentation des outils IA. Contacter l'auditeur certificateur pour information préventive.",
    deadline: "2024-03-15",
    sources: [
      "Journal Officiel n°2024-012",
      "Circulaire France Compétences FC-2024-003",
      "https://www.francecompetences.fr/qualiopi-evolution-2024",
    ],
    dateDetection: "2024-01-15T08:30:00Z",
    dateEffet: "2024-03-01T00:00:00Z",
    statut: "NOUVELLE",
    tags: ["Qualiopi", "IA", "audit", "certification", "ressources-numériques"],
  },
  {
    id: "ALT-2024-002",
    niveau: "URGENTE",
    domaine: "FISCAL_FRANCE",
    titre: "URSSAF - Nouvelle obligation déclarative cotisations dirigeants TNS",
    description:
      "Modification des modalités de déclaration des revenus des dirigeants de SAS assimilés salariés vs TNS. Nouvelle DSN obligatoire mensuelle pour les holdings animatrices avec impact sur les cotisations sociales.",
    impact:
      "Pour la structure holding AcadémIA Pro : requalification possible des rémunérations dirigeants. Potentiel redressement si déclarations non conformes au nouveau format.",
    actionRequise:
      "Consulter expert-comptable et avocat fiscaliste pour audit de conformité déclarations sociales. Vérifier statut social dirigeant dans structure holding.",
    deadline: "2024-02-28",
    sources: [
      "Décret 2024-089 du 12 janvier 2024",
      "Circulaire URSSAF 2024/01",
      "https://www.urssaf.fr/portail/home/actualites/2024-nouvelles-obligations.html",
    ],
    dateDetection: "2024-01-14T10:15:00Z",
    dateEffet: "2024-02-01T00:00:00Z",
    statut: "NOUVELLE",
    tags: ["URSSAF", "TNS", "holding", "DSN", "cotisations-sociales"],
  },
  {
    id: "ALT-2024-003",
    niveau: "URGENTE",
    domaine: "PROPRIETE_INTELLECTUELLE",
    titre:
      "Dépôt marque similaire 'AcademIA' - Classe 41 Formation professionnelle",
    description:
      "Détection d'une demande de dépôt de marque 'AcademIA Solutions' en classe 41 (services d'éducation et formation) et classe 42 (services informatiques) auprès de l'INPI. Dépôt effectué le 10/01/2024 - délai d'opposition : 2 mois.",
    impact:
      "Risque de confusion avec la marque AcadémIA Pro. Potentielle dilution de la marque et confusion dans le secteur formation professionnelle IA. Priorité absolue.",
    actionRequise:
      "URGENT : Mandater un cabinet spécialisé en propriété intellectuelle pour déposer une opposition auprès de l'INPI avant le 10/03/2024. Préparer dossier de preuves d'antériorité.",
    deadline: "2024-03-10",
    sources: [
      "Bulletin officiel INPI - Publication 2024/03",
      "INPI Dépôt n°24/001847",
      "https://data.inpi.fr/marques/FR24001847",
    ],
    dateDetection: "2024-01-16T14:00:00Z",
    dateEffet: "2024-03-10T23:59:59Z",
    statut: "NOUVELLE",
    tags: [
      "marque",
      "INPI",
      "opposition",
      "AcadémIA",
      "classe-41",
      "propriété-intellectuelle",
    ],
  },
  {
    id: "ALT-2024-004",
    niveau: "IMPORTANTE",
    domaine: "FISCAL_INTERNATIONAL",
    titre:
      "Convention fiscale France-USA - Nouveau protocole dividendes holdings",
    description:
      "Signature d'un protocole additionnel à la convention fiscale France-USA modifiant le régime de retenue à la source sur les dividendes versés par des filiales américaines (LLC/Corp) à des holdings françaises. Taux réduit sous conditions de participation.",
    impact:
      "Pour les structures avec LLC Wyoming : modification potentielle du traitement fiscal des remontées de profits. Opportunité d'optimisation si restructuration holdings avant entrée en vigueur.",
    actionRequise:
      "Analyser structure actuelle LLC Wyoming avec conseiller fiscal international. Étudier opportunité restructuration avant entrée en vigueur du protocole.",
    deadline: "2024-04-30",
    sources: [
      "Protocole additionnel convention France-USA signé 15/12/2023",
      "Bulletin Officiel des Finances Publiques BOI-INT-CVB-USA-2024",
      "https://www.irs.gov/pub/irs-trty/france-protocol-2023.pdf",
    ],
    dateDetection: "2024-01-10T09:00:00Z",
    dateEffet: "2024-07-01T00:00:00Z",
    statut: "EN_COURS",
    tags: [
      "convention-fiscale",
      "USA",
      "dividendes",
      "LLC",
      "holding",
      "retenue-source",
    ],
  },
  {
    id: "ALT-2024-005",
    niveau: "IMPORTANTE",
    domaine: "FORMATION_PROFESSIONNELLE",
    titre: "CPF - Modification reste à charge et nouvelles règles financement",
    description:
      "La loi de finances 2024 introduit une participation obligatoire du titulaire CPF (reste à charge de 100€ minimum) avec exceptions pour demandeurs d'emploi. Impact sur le modèle de vente des formations éligibles CPF.",
    impact:
      "Impact commercial direct sur AcadémIA Pro pour les formations certifiantes éligibles CPF. Nécessité d'adapter la stratégie commerciale et la communication sur les prix.",
    actionRequise:
      "Réviser stratégie tarifaire formations CPF. Mettre à jour supports commerciaux. Informer équipe commerciale des nouvelles conditions. Contacter OPCO partenaires.",
    deadline: "2024-04-01",
    sources: [
      "Loi de finances 2024 - Article 212",
      "Décret d'application 2024-099",
      "https://www.moncompteformation.gouv.fr/espace-public/nouvelles-regles-2024",
    ],
    dateDetection: "2024-01-05T11:30:00Z",
    dateEffet: "2024-05-02T00:00:00Z",
    statut: "EN_COURS",
    tags: ["CPF", "reste-à-charge", "financement", "certification", "OPCO"],
  },
  {
    id: "ALT-2024-006",
    niveau: "IMPORTANTE",
    domaine: "DROIT_SOCIETES",
    titre: "SAS - Nouvelles obligations registre des bénéficiaires effectifs",
    description:
      "Transposition directive européenne AML6 : renforcement des obligations déclaratives au Registre des Bénéficiaires Effectifs (RBE). Nouvelles informations requises pour les structures de holding avec participations croisées. Pénalités alourdies.",
    impact:
      "Pour la structure holding AcadémIA Pro : vérification nécessaire de la conformité du RBE actuel. Risque d'amende de 7 500€ par infraction si non mis à jour.",
    actionRequise:
      "Auditer déclaration RBE actuelle. Mettre à jour si nécessaire au greffe du tribunal de commerce. Documenter la chaîne de contrôle complète.",
    deadline: "2024-05-15",
    sources: [
      "Ordonnance 2023-1142 du 6 décembre 2023",
      "Décret 2024-015 du 8 janvier 2024",
      "https://www.infogreffe.fr/registre-beneficiaires-effectifs-2024",
    ],
    dateDetection: "2024-01-12T15:45:00Z",
    dateEffet: "2024-06-01T00:00:00Z",
    statut: "NOUVELLE",
    tags: ["RBE", "bénéficiaires-effectifs", "SAS", "holding", "compliance"],
  },
  {
    id: "ALT-2024-007",
    niveau: "INFORMATION",
    domaine: "FISCAL_INTERNATIONAL",
    titre:
      "Portugal NHR 2.0 - Nouveau régime fiscal résidents non habituels 2024",
    description:
      "Le Portugal remplace le régime NHR par le statut IFICI (Incentivo Fiscal à Investigação Científica e Inovação). Nouveau cadre pour les professionnels dans les secteurs technologie, IA, formation digitale. Taux préférentiel de 20% sur revenus de source portugaise.",
    impact:
      "Opportunité de planification fiscale pour les dirigeants d'AcadémIA Pro souhaitant optimiser leur résidence fiscale. Le secteur formation IA est éligible au nouveau statut IFICI.",
    actionRequise:
      "Étude d'opportunité avec conseiller fiscal international spécialisé Portugal. Comparaison NHR 2.0 vs Dubai vs autres juridictions.",
    deadline: null,
    sources: [
      "Lei n.º 82/2023 de 29 de dezembro",
      "Portaria 352/2023 Portugal",
      "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/IFICI",
    ],
    dateDetection: "2024-01-08T09:00:00Z",
    dateEffet: "2024-01-01T00:00:00Z",
    statut: "EN_COURS",
    tags: [
      "Portugal",
      "IFICI",
      "NHR",
      "résidence-fiscale",
      "optimisation",
      "technologie",
    ],
  },
  {
    id: "ALT-2024-008",
    niveau: "INFORMATION",
    domaine: "FISCAL_INTERNATIONAL",
    titre:
      "Dubai - Impôt sur les sociétés 9% : clarifications pour holdings et Free Zones",
    description:
      "L'administration fiscale des Émirats Arabes Unis publie de nouvelles clarifications sur l'application du Corporate Tax 9% pour les entités en Free Zone. Conditions du qualifying income pour maintenir l'exonération partielle.",
    impact:
      "Pour les structures avec présence à Dubai : vérification de l'éligibilité au statut Qualifying Free Zone Person (QFZP). Impact sur la stratégie de structuration internationale.",
    actionRequise:
      "Consulter Tax Agent agréé UAE pour audit de conformité si structure existante à Dubai. Mettre à jour la stratégie d'expansion internationale en conséquence.",
    deadline: null,
    sources: [
      "UAE Federal Tax Authority - Corporate Tax Guide CTGQFZP1 v1.0",
      "Cabinet Decision No. 55 of 2023",
      "https://tax.gov.ae/en/corporate.tax/free.zone.persons.aspx",
    ],
    dateDetection: "2024-01-09T16:20:00Z",
    dateEffet: "2023-06-01T00:00:00Z",
    statut: "EN_COURS",
    tags: [
      "Dubai",
      "UAE",
      "Corporate-Tax",
      "Free-Zone",
      "QFZP",
      "holding-international",
    ],
  },
  {
    id: "ALT-2024-009",
    niveau: "INFORMATION",
    domaine: "PROPRIETE_INTELLECTUELLE",
    titre:
      "Jurisprudence IA - Cour d'appel Paris : protection droits auteur contenus générés IA",
    description:
      "Arrêt important de la Cour d'appel de Paris du 05/01/2024 précisant les conditions de protection des contenus pédagogiques générés avec assistance IA. L'apport créatif humain doit être documenté pour bénéficier de la protection.",
    impact:
      "Pour les contenus de formation AcadémIA Pro : nécessité de documenter le processus créatif humain dans la production des modules IA. Protéger les contenus pédagogiques propriétaires.",
    actionRequise:
      "Mettre en place un processus de documentation de la création de contenus. Déposer une enveloppe Soleau pour les modules pédagogiques stratégiques. Réviser CGU.",
    deadline: null,
    sources: [
      "CA Paris, pôle 5, ch. 2, 5 janvier 2024