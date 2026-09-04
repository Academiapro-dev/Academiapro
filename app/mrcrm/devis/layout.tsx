// ══════════════════════════════════════════════════════════════════════════
// LE DEVIS MR CRM N EST PAS INDEXE — 04/09.
//
// POURQUOI CE FICHIER EXISTE. La page de devis (page.tsx, a cote) est un
// composant client : elle porte "use client" en premiere ligne, et Next.js
// interdit d y exporter `metadata`. La balise robots vit donc ici, dans un
// layout que Next.js applique a toutes les pages du dossier /mrcrm/devis.
//
// POURQUOI noindex. La page affiche des prix et n a de sens qu avec un
// jeton envoye apres l echange. La doctrine interdit un tarif en vitrine :
// une page de devis indexee par Google serait exactement cela. Elle n est
// d ailleurs pas declaree dans app/sitemap.ts.
//
// `follow: false` : Google ne suit pas non plus les liens qui en partent.
//
// ⚠️ NE RIEN AJOUTER D AUTRE ICI. Ce layout ne rend que ses enfants ; tout
// habillage (en-tete, pied) reste dans page.tsx, qui porte le sien.
// ══════════════════════════════════════════════════════════════════════════

export const metadata = {
  robots: { index: false, follow: false },
};

export default function LayoutDevisMrCRM({ children }: any) {
  return children;
}
