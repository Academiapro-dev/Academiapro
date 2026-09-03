import React from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import NavBar from "../components/NavBar";
import CookieBanner from "../components/CookieBanner";

// ══════════════════════════════════════════════════════════════════════════
// LES METADONNEES SUIVENT LE DOMAINE — CORRIGE LE 03/09.
//
// LE DEFAUT : ce fichier est partage par les trois domaines. Il portait le
// titre « AcadémIA Pro — 560 formations professionnelles à distance » EN
// DUR. Un gestionnaire de LLC ouvrant mysterllc.com voyait donc « AcadémIA
// Pro » dans son onglet, et un cabinet comptable la meme chose sur
// mrcomptable.fr. Le titre est ce qui s inscrit dans l historique, dans les
// favoris, dans le resultat de recherche et sous chaque lien partage : la
// marque se perdait a l endroit meme ou elle devait tenir.
//
// LA CORRECTION lit l en-tete `host` de la requete. Pas de lecture en base,
// pas d appel reseau : l information est deja dans la requete.
//
// ⚠️ CE FICHIER DEVIENT DYNAMIQUE. `headers()` empeche le rendu statique
// des pages qui heritent de ce layout. C est le prix a payer pour que
// Google et LinkedIn voient la bonne marque : un script cote navigateur
// aurait corrige l onglet, mais les moteurs auraient continue d indexer
// mysterllc.com sous le nom AcadémIA Pro.
//
// 🚨 LE NOMBRE DE FORMATIONS RESTE EN DUR (560 au 03/09). Les metadonnees
// ne lisent pas la base. QUAND DES FORMATIONS SONT AJOUTEES, CHANGER ICI.
// C est le seul endroit qui reste.
// ══════════════════════════════════════════════════════════════════════════

const MARQUES: any = {
  mysterllc: {
    nom: "MysterLLC",
    titre: "MysterLLC — L'administratif de votre LLC : préparé, daté, rappelé",
    description:
      "Suivi des obligations administratives et fiscales de votre LLC américaine : échéances, documents préparés, rappels avant chaque date.",
    descriptionCourte:
      "L'administratif de votre LLC : préparé, daté, rappelé",
    url: "https://www.mysterllc.com",
    image: "/og-mysterllc.png",
  },
  mrcomptable: {
    nom: "Mr. Comptable",
    titre: "Mr. Comptable — Logiciel comptable pour cabinets d'expertise comptable",
    description:
      "Tenue, révision, TVA, télétransmissions et espaces clients dans un seul outil, pour les cabinets d'expertise comptable.",
    descriptionCourte:
      "Logiciel comptable pour cabinets d'expertise comptable",
    url: "https://mrcomptable.fr",
    image: "/og-mrcomptable.png",
  },
  academia: {
    nom: "AcadémIA Pro",
    titre: "AcadémIA Pro — 560 formations professionnelles à distance",
    description:
      "560 formations professionnelles avec attestation AcadémIA Pro · Agent IA tuteur 24h/24 · Séances d'accompagnement · Classes virtuelles live",
    descriptionCourte:
      "Plateforme de formation professionnelle — 560 formations sur quinze domaines",
    url: "https://academiapro.fr",
    image: "/og-academia.png",
  },
};

// 🚨 LES TROIS IMAGES OUVERTES — public/og-academia.png (24/08),
// public/og-mrcomptable.png et public/og-mysterllc.png (03/09).
//
// Sans elles, le Post Inspector de LinkedIn repondait « No image found » et
// la carte partait sans visuel : beaucoup moins visible dans le fil. Toutes
// trois font 1200 x 630, le format attendu par LinkedIn, Facebook et X.
//
// ⚠️ LINKEDIN GARDE L IMAGE EN CACHE. Apres tout changement, repasser l URL
// dans https://www.linkedin.com/post-inspector/ — sinon la carte continue
// d afficher l ancienne pendant des jours.
//
// ⚠️ VERIFIER QUE LE FICHIER EXISTE AVANT D EN AJOUTER UN QUATRIEME : une
// carte pointant vers une image absente part vide, ce qui est pire que pas
// d image du tout.

function marqueDe(hote: string) {
  const h = (hote || "").toLowerCase();
  if (h.indexOf("mysterllc.com") >= 0) return MARQUES.mysterllc;
  if (h.indexOf("mrcomptable.fr") >= 0) return MARQUES.mrcomptable;
  return MARQUES.academia;
}

export async function generateMetadata(): Promise<Metadata> {
  const entetes = await headers();
  const hote = entetes.get("host") || "";
  const m = marqueDe(hote);

  const ouverte: any = {
    title: m.nom,
    description: m.descriptionCourte,
    type: "website",
    locale: "fr_FR",
    url: m.url,
    siteName: m.nom,
  };

  const oiseau: any = {
    card: m.image ? "summary_large_image" : "summary",
    title: m.nom,
    description: m.descriptionCourte,
  };

  if (m.image) {
    ouverte.images = [
      { url: m.image, width: 1200, height: 630, alt: m.titre },
    ];
    oiseau.images = [m.image];
  }

  return {
    // SANS metadataBase, AUCUNE CANONIQUE NE PEUT SE RESOUDRE.
    //
    // Google signalait seize pages « en double sans URL canonique
    // selectionnee » : le site n en emettait aucune. Cette base permet aux
    // pages de declarer la leur en chemin relatif. Elle suit desormais le
    // domaine : une canonique relative resolue sur academiapro.fr depuis
    // mysterllc.com aurait designe le mauvais site.
    //
    // AUCUNE CANONIQUE ICI. Une canonique posee dans le layout racine serait
    // HERITEE par toutes les pages qui n en declarent pas : /tarifs,
    // /catalogue et les tunnels se declareraient page d accueil. Chaque page
    // indexable declare la sienne, ou n en declare aucune.
    metadataBase: new URL(m.url),
    title: m.titre,
    description: m.description,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: m.nom,
    },
    openGraph: ouverte,
    twitter: oiseau,
    // PROPRIETE DE mrcomptable.fr AUPRES DE GOOGLE.
    //
    // Les domaines partagent ce layout, donc ce meme <head>. Google ignore
    // cette balise sur academiapro.fr, deja verifie autrement ; elle ne vaut
    // que pour mrcomptable.fr. A NE PAS SUPPRIMER : le retrait ferait perdre
    // la propriete de la seconde marque. Elle reste servie sur TOUS les
    // domaines — la restreindre a mrcomptable.fr ferait dependre la
    // verification d une condition de plus, sans rien gagner.
    verification: {
      google: "4UmansIXLAyeM2GO9WTWdkFssDOALRNiVGLPK8TKP1w",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#c8a96e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const entetes = await headers();
  const hote = entetes.get("host") || "";
  const m = marqueDe(hote);

  // LE SCHEMA.ORG SUIT LA MEME MARQUE QUE LE TITRE. Il decrivait
  // « AcadémIA Pro » sur les trois domaines : Google lisait donc une
  // organisation de formation sur la page d un logiciel de conformite.
  // Le lien LinkedIn n est pose que pour AcadéMIA Pro : c est la seule page
  // dont l adresse est verifiee.
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": m.nom,
    "url": m.url,
    "description": m.descriptionCourte,
  };

  if (m === MARQUES.academia) {
    schema.logo = "https://academiapro.fr/icon-192.png";
    schema.sameAs = ["https://www.linkedin.com/company/academiapro-fr"];
  }

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
