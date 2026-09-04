// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LES RELANCES — 04/09.
//
// 🚨 « RIEN NE PART SANS VOTRE ACCORD, SOCIETE PAR SOCIETE ». C est ecrit
// sur la vitrine depuis le 31/08 et c est vrai dans le code : les relances
// s arment societe par societe, jamais globalement.
//
// ⚠️ CINQ PALIERS, DE SOIXANTE JOURS A LA VEILLE. Ne pas inventer d autres
// delais : ce sont ceux de l outil.
//
// ⛔ NE PAS PROMETTRE QU UNE RELANCE EMPECHE UN OUBLI. Elle previent ; c est
// le dirigeant qui depose. Une promesse de resultat sur ce point serait
// invendable devant un client qui a quand meme oublie.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Les relances — MysterLLC",
  description:
    "Cinq paliers, de soixante jours à la veille de l'échéance. Armés société par société, jamais globalement.",
  alternates: {
    canonical: SITE + "/relances",
  },
  openGraph: {
    title: "Les relances — MysterLLC",
    description:
      "Être prévenu avant, et décider soi-même de ce qui se déclenche.",
    url: SITE + "/relances",
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

const LES_PALIERS = [
  {
    titre: "Soixante jours avant",
    texte:
      "Le temps de rassembler ce qui manque : un chiffre, une signature, une pièce que quelqu'un d'autre doit fournir.",
  },
  {
    titre: "Trente jours avant",
    texte:
      "Le rappel qui compte pour les obligations qui demandent une préparation, comme le Form 5472.",
  },
  {
    titre: "Quinze jours avant",
    texte:
      "Il reste de la marge, mais plus beaucoup pour un envoi papier ou une signature à obtenir.",
  },
  {
    titre: "Sept jours avant",
    texte:
      "Le rappel de la dernière semaine, quand le dépôt se fait en ligne et prend quelques minutes.",
  },
  {
    titre: "La veille",
    texte:
      "Le dernier filet, pour ce qui se dépose le jour même.",
  },
];

export default function PageRelancesMysterLLC() {
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

      <main style={{ ...ETROIT, paddingTop: "70px", paddingBottom: "70px" }}>
        <a href={SITE + "/fonctionnalites"}
          style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          &larr; Toutes les fonctions
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "26px 0 14px" }}>
          LES RELANCES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Prévenu avant, et vous décidez
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Cinq paliers, de soixante jours à la veille. Vous les armez société par société : rien ne part sans votre accord.
        </p>

        <h2 style={H2}>Les cinq paliers</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LES_PALIERS.map(function (b) {
            return (
              <div key={b.titre} style={CARTE}>
                <h3 style={{ color: "#fff", fontSize: "17px",
                  margin: "0 0 10px", lineHeight: "1.4" }}>
                  {b.titre}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)",
                  fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {b.texte}
                </p>
              </div>
            );
          })}
        </div>

        <h2 style={H2}>Armés société par société</h2>
        <p style={P}>
          Vous décidez, pour chaque société, si les relances partent ou non.
          Un client qui gère lui-même ses dépôts n&apos;a pas besoin d&apos;être
          rappelé cinq fois ; un portefeuille de vingt sociétés, si.
        </p>
        <p style={P}>
          Ce réglage n&apos;est pas global, et c&apos;est volontaire : armer
          d&apos;un coup toutes les relances de tout le monde produit des
          messages qu&apos;on finit par ne plus lire.
        </p>

        <h2 style={H2}>Ce qu&apos;une relance ne fait pas</h2>
        <p style={P}>
          Elle prévient. Elle ne dépose pas, elle ne signe pas, et elle ne
          garantit pas qu&apos;une échéance sera tenue. Un rappel arrivé à
          temps et laissé de côté reste un oubli.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir les relances en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres sociétés. Nous armons une relance et regardons ce qu&apos;elle produit.
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
