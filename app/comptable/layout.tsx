import React from "react";
import type { Metadata } from "next";

// LAYOUT PROPRE A MR. COMPTABLE — cree le 24/08.
//
// POURQUOI IL EXISTE. Un seul deploiement sert academiapro.fr et
// mrcomptable.fr, et le dossier app/comptable n avait aucun layout : il
// heritait donc des metadonnees du layout racine, ecrites pour AcadeMIA Pro.
// Un lien vers une page de la vitrine comptable partait sur LinkedIn avec le
// titre, la description et l image d AcadeMIA.
//
// CE QU IL FAIT. Il ne redefinit NI <html> NI <body> : un layout enfant ne
// rend que ses enfants, la structure du document reste celle de la racine.
// Il ne remplace que les metadonnees, pour les dix pages de la vitrine.
//
// CE QU IL NE FAIT PAS. Il ne couvre PAS l adresse racine
// https://mrcomptable.fr : celle-ci passe par le layout racine, qui reste
// aux couleurs d AcadeMIA. Corriger cela suppose de faire dependre les
// metadonnees de l en-tete host, chantier a part.
//
// ATTENTION AU CACHE : apres toute modification, repasser l adresse dans
// https://www.linkedin.com/post-inspector/

export const metadata: Metadata = {
  title: "Mr. Comptable — Logiciel de comptabilité pour cabinets",
  description: "Tenue, révision, déclarations et liasse fiscale, lecture des factures électroniques, relance des justificatifs et des honoraires, prévisionnel de trésorerie sur douze semaines.",
  openGraph: {
    title: "Mr. Comptable",
    description: "Logiciel de comptabilité pour cabinets — tenue, déclarations, facturation, trésorerie et relance des justificatifs",
    type: "website",
    locale: "fr_FR",
    url: "https://mrcomptable.fr",
    siteName: "Mr. Comptable",
    images: [
      {
        url: "/og-mrcomptable.png",
        width: 1200,
        height: 630,
        alt: "Mr. Comptable — logiciel de comptabilité pour cabinets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr. Comptable",
    description: "Logiciel de comptabilité pour cabinets — tenue, déclarations, facturation, trésorerie et relance des justificatifs",
    images: ["/og-mrcomptable.png"],
  },
};

export default function LayoutComptable({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
