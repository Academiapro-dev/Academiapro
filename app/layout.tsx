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
  title: "AcadémIA Pro — Formation Professionnelle par l IA",
  description: "331 formations professionnelles avec attestation AcadémIA Pro · Agent IA tuteur 24h/24 · Séances d'accompagnement · Classes virtuelles live",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AcadémIA Pro" },
  openGraph: { title: "AcadémIA Pro", description: "Plateforme de formation professionnelle 100% IA", type: "website", locale: "fr_FR" },
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
            "description": "Plateforme de formation professionnelle propuls\u00e9e par l'IA \u2014 331 formations avec attestation de fin de formation.",
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
