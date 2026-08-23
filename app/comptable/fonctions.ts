// LE MENU DES FONCTIONNALITES DE MR. COMPTABLE — UN SEUL ENDROIT.
//
// Avant le 23/08, cette liste etait recopiee dans chaque page de
// app/comptable. Quatre pages ajoutees ce jour-la ont demande de rouvrir
// dix fichiers, et une page a ete oubliee dans le menu. Depuis, toutes les
// pages importent cette liste : une entree s ajoute ici, et nulle part
// ailleurs.
//
// 🚨 UNE PAGE AJOUTEE ICI DOIT AUSSI ETRE AJOUTEE :
//   - dans PAGES_PUBLIQUES_COMPTABLE de components/NavBar.tsx ;
//   - dans PAGES de app/api/sitemap-comptable/route.ts.

export const FONCTIONS = [
  { nom: "Facture électronique", href: "/comptable/facture-electronique" },
  { nom: "Rapprochement bancaire", href: "/comptable/rapprochement-bancaire" },
  { nom: "Lecture des pièces", href: "/comptable/lecture-des-pieces" },
  { nom: "Tenue et révision", href: "/comptable/tenue" },
  { nom: "Déclarations et liasse", href: "/comptable/declarations" },
  { nom: "Relance des justificatifs", href: "/comptable/relance-justificatifs" },
  { nom: "CRM et relances", href: "/comptable/crm" },
  { nom: "Devis et factures", href: "/comptable/facturation" },
  { nom: "Facturation récurrente", href: "/comptable/facturation-recurrente" },
  { nom: "Prévisionnel de trésorerie", href: "/comptable/tresorerie" },
];
