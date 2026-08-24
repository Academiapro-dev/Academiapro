import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import CookieBanner from "../components/CookieBanner";

export const metadata: Metadata = {
  // SANS metadataBase, AUCUNE CANONIQUE NE PEUT SE RESOUDRE.
  //
  // Google signalait seize pages « en double sans URL canonique
  // selectionnee » : le site n en emettait aucune. Cette base permet aux
  // pages de declarer la leur en chemin relatif.
  //
  // AUCUNE CANONIQUE ICI. Une canonique posee dans le layout racine serait
  // HERITEE par toutes les pages qui n en declarent pas : /tarifs, /catalogue
  // et les tunnels se declareraient page d accueil. Chaque page indexable
  // declare la sienne, ou n en declare aucune.
  metadataBase: new URL("https://academiapro.fr"),
  // 🚨 24/08 — LA METHODE DE FABRICATION NE SE MET PAS EN VITRINE.
  //
  // Ce fichier annoncait « Formation Professionnelle par l IA » en titre et
  // « Plateforme de formation professionnelle 100% IA » en description
  // ouverte. Cette derniere est celle que LinkedIn affiche sous chaque lien
  // partage : elle apparaissait en pied de chaque publication.
  //
  // Ce qu on vend, c est un catalogue et une plateforme. Comment il est
  // produit ne regarde pas le prospect, et l afficher donne prise a ceux
  // qui contestent la place de la machine dans la pedagogie.
  //
  // L AGENT IA TUTEUR RESTE ANNONCE : c est un service rendu au stagiaire,
  // pas une methode de production. Decision de Jacques le 24/08.
  //
  // Le nombre de formations etait reste a 331 : il est de 560 au 24/08.
  title: "AcadémIA Pro — 560 formations professionnelles à distance",
  description: "560 formations professionnelles avec attestation AcadémIA Pro · Agent IA tuteur 24h/24 · Séances d'accompagnement · Classes virtuelles live",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AcadémIA Pro" },
  // 🚨 L IMAGE OUVERTE — ajoutee le 24/08.
  //
  // Sans elle, le Post Inspector de LinkedIn repondait « No image found » et
  // la carte partait sans visuel : beaucoup moins visible dans le fil.
  // Le fichier vit dans public/og-academia.png, 1200 x 630, le format
  // attendu par LinkedIn, Facebook et X.
  //
  // ATTENTION : LinkedIn garde l image en cache. Apres tout changement,
  // repasser l URL dans https://www.linkedin.com/post-inspector/
  openGraph: {
    title: "AcadémIA Pro",
    description: "Plateforme de formation professionnelle — 560 formations sur quinze domaines",
    type: "website",
    locale: "fr_FR",
    url: "https://academiapro.fr",
    siteName: "AcadémIA Pro",
    images: [
      {
        url: "/og-academia.png",
        width: 1200,
        height: 630,
        alt: "AcadémIA Pro — 560 formations professionnelles à distance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AcadémIA Pro",
    description: "Plateforme de formation professionnelle — 560 formations sur quinze domaines",
    images: ["/og-academia.png"],
  },
  // PROPRIETE DE mrcomptable.fr AUPRES DE GOOGLE.
  //
  // Les deux domaines partagent ce layout, donc ce meme <head>. Google
  // ignore cette balise sur academiapro.fr, deja verifie autrement ; elle ne
  // vaut que pour mrcomptable.fr. A NE PAS SUPPRIMER : le retrait ferait
  // perdre la propriete de la seconde marque.
  verification: {
    google: "4UmansIXLAyeM2GO9WTWdkFssDOALRNiVGLPK8TKP1w",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#c8a96e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Acad\u00e9mIA Pro",
            "url": "https://academiapro.fr",
            "logo": "https://academiapro.fr/icon-192.png",
            "description": "Plateforme de formation professionnelle \u2014 560 formations sur quinze domaines, avec attestation de fin de formation.",
            "sameAs": ["https://www.linkedin.com/company/academiapro-fr"]
          }) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var lang = localStorage.getItem("langue") || "fr";
              var rtl = lang === "he" || lang === "ar";
              document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
              document.documentElement.setAttribute("lang", lang);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body style={{ margin: 0, background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>
        <NavBar />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
