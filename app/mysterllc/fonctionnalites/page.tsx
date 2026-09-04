// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LA PAGE D ENSEMBLE DES FONCTIONS — 04/09.
//
// POURQUOI ELLE EXISTE. Le site n avait qu une page : la vitrine, sans
// aucun menu et sans un seul lien dans son en-tete. Un visiteur arrivait,
// lisait, et ne pouvait aller nulle part — pas meme ecrire, les deux
// boutons ouvrant un lien `mailto:` qui ne fait rien sur un appareil sans
// messagerie configuree.
//
// 🚨 « SUIVI », JAMAIS « NOUS PROPOSONS UNE LLC ». MysterLLC ne constitue
// aucune societe : il suit les obligations d une LLC deja constituee.
//
// ⛔ NE PAS SE PRESENTER COMME UN CONSEIL JURIDIQUE OU FISCAL. L outil
// montre, prepare et rappelle ; le depot et la responsabilite restent au
// dirigeant.
//
// ⚠️ `pret` PASSE A true QUAND LA PAGE EST CREEE ET DEPLOYEE, jamais avant.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Les fonctions — MysterLLC",
  description:
    "Portefeuille, agenda des échéances, formulaires pré-remplis, relances armées société par société, signature électronique.",
  alternates: {
    canonical: SITE + "/fonctionnalites",
  },
  openGraph: {
    title: "Les fonctions — MysterLLC",
    description:
      "Ce que l'outil tient à la place de celui qui gère des LLC — fonction par fonction.",
    url: SITE + "/fonctionnalites",
    siteName: "MysterLLC",
    locale: "fr_FR",
    type: "website",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// La banniere large 4:1, fond noir, deposee dans public/ le 31/08.
// ⚠️ VERIFIER LE NOM REEL AVANT DE LE CHANGER : le fichier s appelle
// IMG_4723.jpeg, il n a pas ete renomme.
const BANNIERE = "/IMG_4723.jpeg";

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const ETROIT: any = {
  maxWidth: "780px",
  margin: "0 auto",
  padding: "0 24px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "26px 28px",
};

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const P: any = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "16px",
  lineHeight: "1.9",
  margin: "0 0 18px",
};

const H2: any = {
  color: OR,
  fontSize: "23px",
  lineHeight: "1.4",
  margin: "44px 0 16px",
};

const PAGES = [
  {
    titre: "Votre portefeuille",
    chemin: "/portefeuille",
    pret: true,
    texte:
      "Une fiche par société : État, date de constitution, résidence du membre, EIN. L'outil en déduit les obligations qui s'appliquent — et seulement celles-là.",
  },
  {
    titre: "L'agenda des échéances",
    chemin: "/agenda",
    pret: true,
    texte:
      "Toutes les échéances de vos sociétés sur un écran, classées par date. Chaque ligne porte son montant, sa pénalité et le lien vers la source officielle.",
  },
  {
    titre: "Les formulaires",
    chemin: "/formulaires",
    pret: true,
    texte:
      "Les PDF officiels sortent pré-remplis depuis la fiche de la société. Vous relisez, vous signez, vous déposez.",
  },
  {
    titre: "Les relances",
    chemin: "/relances",
    pret: true,
    texte:
      "Cinq paliers, de soixante jours à la veille. Vous les armez société par société : rien ne part sans votre accord.",
  },
  {
    titre: "Les sept États",
    chemin: "/etats",
    pret: true,
    texte:
      "Wyoming, Delaware, Nouveau-Mexique, Nevada, Floride, Texas, Montana. Chacun avec ses dates, ses montants et ses pénalités propres.",
  },
  {
    titre: "La signature électronique",
    chemin: "/signature-electronique",
    pret: true,
    texte:
      "Mandats et documents signés en ligne. Chaque signature produit un dossier de preuve horodaté et une ligne au registre.",
  },
];

export default function PageFonctionsMysterLLC() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- LE MEME SUR TOUTES LES PAGES DU SITE.
          🚨 LA VITRINE N EN AVAIT AUCUN jusqu au 04/09 : la banniere etait
          centree, sans un seul lien. Un visiteur arrive sur la page, lit,
          et ne peut aller nulle part. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="MysterLLC"
              style={{ width: "520px", maxWidth: "58vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/etats"} style={LIEN_ENTETE}>États</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={SITE + "/contact"} style={LIEN_ENTETE}>Contact</a>
            <a href="/connexion" style={{ color: OR,
              border: "1px solid rgba(200,169,110,0.45)",
              padding: "9px 18px", borderRadius: "8px",
              textDecoration: "none", fontSize: "14px",
              whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      <main style={{ ...SECTION, paddingTop: "70px", paddingBottom: "70px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 14px" }}>
          MYSTERLLC — LES FONCTIONS
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 20px", maxWidth: "780px" }}>
          Rien ne vous échappe, rien ne se fait sans vous
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "17px",
          lineHeight: "1.8", maxWidth: "740px", margin: "0 0 44px" }}>
          Chaque LLC porte ses propres obligations américaines, à des dates
          différentes selon son État et la résidence de son membre. Voici
          comment l&apos;outil les tient.
        </p>

        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px" }}>
          {PAGES.map(function (b) {
            const contenu = (
              <>
                <h2 style={{ color: "#fff", fontSize: "19px",
                  margin: "0 0 10px", lineHeight: "1.4" }}>
                  {b.titre}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.65)",
                  fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {b.texte}
                </p>
                {b.pret && (
                  <p style={{ color: OR, fontSize: "14px",
                    fontWeight: "bold", margin: "16px 0 0" }}>
                    En savoir plus &rarr;
                  </p>
                )}
              </>
            );
            if (b.pret) {
              return (
                <a key={b.titre} href={SITE + b.chemin}
                  style={{ ...CARTE, display: "block",
                    textDecoration: "none", color: "#fff" }}>
                  {contenu}
                </a>
              );
            }
            return (
              <div key={b.titre} style={CARTE}>
                {contenu}
              </div>
            );
          })}
        </div>

        <h2 style={H2}>Ce que l&apos;outil ne fait pas</h2>
        <p style={P}>
          Il ne constitue aucune société, ne dépose rien à votre place et ne
          remplace pas un professionnel du droit ou du chiffre. Il montre ce
          qui arrive, prépare les documents et vous prévient avant
          l&apos;échéance. Vous relisez, vous signez, vous déposez.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir l&apos;outil sur vos propres sociétés
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous déclarons une de vos sociétés et déroulons ce qui en sort — agenda, formulaires, relances.
          </p>
          <a href={SITE + "/contact"}
            style={{ display: "inline-block",
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: FOND, padding: "15px 34px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Demander une présentation
          </a>
        </div>
      </main>

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu : un
          lien relatif serait reecrit par le middleware vers /mysterllc/... */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/etats"} style={{ color: OR_PALE,
              textDecoration: "none" }}>États</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={SITE + "/contact"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
