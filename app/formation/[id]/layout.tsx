import type { Metadata } from "next";

// LA CANONIQUE DES TROIS CENT TRENTE ET UNE FICHES.
//
// La page de la fiche est un composant CLIENT : Next.js y ignore
// silencieusement l export `metadata`, donc aucune canonique n en sortait.
// Ce layout, lui, est un composant serveur : il declare la canonique de
// chaque fiche a partir de son code, et laisse la page inchangee.
//
// Le code est normalise en majuscules : /formation/f001 et /formation/F001
// designent la meme page, et sans cela Google y verrait deux pages en double.

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const code = String(params.id || "").toUpperCase();
  return {
    alternates: { canonical: "/formation/" + code },
  };
}

export default function LayoutFormation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
