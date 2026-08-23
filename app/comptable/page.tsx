import Link from "next/link";

export const metadata = {
  title: "Mr. Comptable — Logiciel de comptabilité pour cabinets",
  description:
    "Tenue, déclarations, liasse fiscale et lecture des factures électroniques. Sans engagement.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// LE MENU DEROULANT DES FONCTIONNALITES.
//
// Chaque entree mene a SA PROPRE PAGE, jamais a une ancre. Une ancre ramene
// a la meme page pour Google : dix ancres se positionnent comme une seule
// adresse. Une page par sujet se positionne sur chaque recherche.
//
// 🚨 MEME LISTE SUR TOUTES LES PAGES DE app/comptable. Une entree ajoutee
// ici doit l etre partout, sinon la page nouvelle reste introuvable.
const FONCTIONS = [
  { nom: "Facture électronique", href: "/comptable/facture-electronique" },
  { nom: "Rapprochement bancaire", href: "/comptable/rapprochement-bancaire" },
  { nom: "Lecture des pièces", href: "/comptable/lecture-des-pieces" },
  { nom: "Tenue et révision", href: "/comptable/tenue" },
  { nom: "Déclarations et liasse", href: "/comptable/declarations" },
  { nom: "Relance des justificatifs", href: "/comptable/relance-justificatifs" },
  { nom: "CRM et relances", href: "/comptable/crm" },
  { nom: "Facturation récurrente", href: "/comptable/facturation-recurrente" },
  { nom: "Prévisionnel de trésorerie", href: "/comptable/tresorerie" },
];

const CE_QUE_FAIT: any[] = [
  {
    titre: "La tenue",
    texte:
      "Saisie, journaux, grand livre, balance. Lettrage des comptes de tiers, rapprochement bancaire avec détection des doublons, écritures de paie. Verrouillage des périodes closes.",
  },
  {
    titre: "Les pièces",
    texte:
      "Vous déposez la facture, elle se lit et se comptabilise. Les factures électroniques au format Factur-X sont lues dans leur fichier structuré : les montants ne sont pas interprétés, ils sont lus. Le compte d'imputation est proposé d'après vos écritures passées.",
  },
  {
    titre: "La relance des justificatifs",
    texte:
      "Chaque mois, la plateforme repère les écritures sans pièce et écrit elle-même au client, avec la liste des factures attendues et un lien pour les déposer. Vous ne courez plus après les justificatifs : ils arrivent.",
  },
  {
    titre: "Le CRM du cabinet",
    texte:
      "Chaque client sur une ligne : ses pièces manquantes, ses opérations bancaires sans justificatif, ses impayés, et ce qu'il vous doit. Sept motifs de relance, par courriel ou par SMS, préparés par la plateforme et relus par vous.",
  },
  {
    titre: "Vos honoraires",
    texte:
      "Devis, factures, avoirs et règlements, avec Factur-X embarqué et toutes les mentions légales. Les honoraires mensuels se facturent seuls à la date prévue, en brouillon à relire ou en envoi automatique.",
  },
  {
    titre: "La trésorerie",
    texte:
      "Douze semaines devant chaque dossier, calculées depuis les écritures. Le certain d'un côté, l'estimé de l'autre, et le creux signalé avant qu'il n'arrive.",
  },
  {
    titre: "Les déclarations",
    texte:
      "TVA, liasse fiscale, impôt sur les sociétés. La télétransmission à la DGFiP se fait depuis le dossier, sans ressaisie, et les accusés de réception remontent dans votre interface.",
  },
  {
    titre: "Les états",
    texte:
      "Export FEC réglementaire, révision, clôture. Immobilisations avec plan d'amortissement, sorties et cessions. Provisions avec dotation et reprise.",
  },
  {
    titre: "Le cabinet",
    texte:
      "Chaque dossier est cloisonné. Les droits se règlent collaborateur par collaborateur : saisir, valider, clôturer, déclarer, tenir le plan comptable, déposer des pièces.",
  },
  {
    titre: "La traçabilité",
    texte:
      "Chaque modification est enregistrée : qui, quand, la valeur avant et la valeur après. C'est ce que l'administration demandera, et c'est écrit sans que personne ait à y penser.",
  },
  {
    titre: "L'inaltérabilité",
    texte:
      "Une écriture validée ne se supprime pas : elle se contre-passe, et la trace des deux demeure. Les factures émises portent une numérotation continue que la base elle-même garantit, sans rupture ni doublon possible.",
  },
];

export default function AccueilComptable() {
  const section: any = {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px",
  };

  const bouton: any = {
    display: "inline-block",
    background: OR,
    color: NOIR,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
  };

  const boutonPale: any = {
    display: "inline-block",
    background: "transparent",
    color: OR,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "16px",
    border: "1px solid rgba(200,169,110,0.4)",
  };

  const lienMenu: any = { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" };
  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* En-tête. Le menu deroulant est en CSS pur — details et summary —
          pour que la page reste servie par le serveur.

          🚨 PLUS DE LIEN « ADMIN » SUR LA VITRINE — 23/08. Il etait montre a
          TOUT visiteur, cookie ou pas : un expert-comptable venu du
          communique LinkedIn le voyait en prem
