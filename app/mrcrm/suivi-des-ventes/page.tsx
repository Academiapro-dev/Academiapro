// ══════════════════════════════════════════════════════════════════════════
// MR CRM — LE SUIVI DES VENTES — 04/09.
//
// 🚨 CE QUI EST ECRIT ICI A ETE VERIFIE DANS LE CODE. Les cinq etapes sont
// celles de l outil : prospect, contacte, interesse, client, perdu. Les
// motifs de perte sont une LISTE FERMEE, avec une precision libre apres un
// tiret cadratin — le regroupement ne retient que ce qui precede le tiret.
//
// 🚨 POURQUOI LA LISTE FERMEE MERITE D ETRE EXPLIQUEE AU PROSPECT : un
// champ libre produit autant de formulations que de fiches, et le
// regroupement ne montre plus rien. C est un choix de conception, et il
// distingue l outil d un tableur.
//
// ⛔ AUCUN CHIFFRE, AUCUNE STATISTIQUE. Ne jamais ecrire combien de ventes
// l outil ferait gagner.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrcrm.fr, le middleware reecrit
// tout chemin non reserve vers /mrcrm.
// ══════════════════════════════════════════════════════════════════════════
const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Le suivi des ventes — Mr CRM",
  description:
    "Prospect, contacté, intéressé, client, perdu : voir ce qui avance, ce qui dort, et pourquoi vous perdez.",
  alternates: {
    canonical: SITE + "/suivi-des-ventes",
  },
  openGraph: {
    title: "Le suivi des ventes — Mr CRM",
    description:
      "Les affaires en cours, celles qui ont abouti, celles qui dorment — et le motif de chaque perte.",
    url: SITE + "/suivi-des-ventes",
    siteName: "Mr CRM",
    locale: "fr_FR",
    type: "website",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// ⚠️ SANS ESPACE NI DOUBLE EXTENSION. Verifier le nom reel dans public/.
const BANNIERE = "/mrcrm-banniere.png";

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

const LES_ETAPES = [
  {
    titre: "Prospect",
    texte:
      "La fiche existe, rien n'a encore été échangé. C'est le point de départ de tout le monde.",
  },
  {
    titre: "Contacté",
    texte:
      "Vous avez écrit. La date et le nombre d'envois restent sur la fiche.",
  },
  {
    titre: "Intéressé",
    texte:
      "La personne a répondu et la discussion est ouverte. C'est là que se joue le temps que vous investissez.",
  },
  {
    titre: "Client",
    texte:
      "L'affaire a abouti. La fiche sort des relances.",
  },
  {
    titre: "Perdu",
    texte:
      "L'affaire est close avec son motif. La fiche sort des relances, mais son motif rejoint votre analyse.",
  },
];

export default function PageSuiviVentesMrCRM() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Le meme sur toutes les pages du site. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="Mr CRM"
              style={{ width: "560px", maxWidth: "62vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={CONTACT} style={LIEN_ENTETE}>Contact</a>
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
          LE SUIVI DES VENTES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Ce qui avance, et ce qui dort
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Chaque fiche porte son étape. Vous voyez d&apos;un coup d&apos;œil où en sont vos affaires, et chaque perte enregistrée vous dit pourquoi.
        </p>

        <h2 style={H2}>Les cinq étapes</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LES_ETAPES.map(function (b) {
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

        <h2 style={H2}>Pourquoi vous perdez</h2>
        <p style={P}>
          Quand vous fermez une affaire perdue, vous choisissez un motif dans
          une liste : prix trop élevé, a choisi un concurrent, projet
          abandonné, pas de budget, sans réponse, hors cible, mauvais moment.
          Vous pouvez ajouter une précision dans vos mots.
        </p>
        <p style={P}>
          La liste fermée n&apos;est pas une contrainte pour rien : elle
          permet de regrouper. Un champ entièrement libre produit autant de
          formulations que de fiches, et l&apos;on ne peut plus rien compter.
          Ici, vous voyez ce qui revient le plus souvent — et c&apos;est
          rarement ce qu&apos;on croyait.
        </p>

        <h2 style={H2}>Ce que vous en faites</h2>
        <p style={P}>
          Les fiches se filtrent par étape. Vous regardez les intéressés
          quand vous cherchez où passer votre semaine, les perdus quand vous
          voulez comprendre, les clients quand vous préparez une relance de
          fidélisation.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir votre suivi en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres affaires. Nous regardons ensemble ce qui avance et ce qui dort.
          </p>
          <a href={CONTACT}
            style={{ display: "inline-block",
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: FOND, padding: "15px 34px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Demander une présentation
          </a>
        </div>
      </main>

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu. */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr CRM — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={CONTACT} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE,
              textDecoration: "none" }}>CGV</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
