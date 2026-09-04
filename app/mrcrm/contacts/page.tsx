// ══════════════════════════════════════════════════════════════════════════
// MR CRM — VOS CONTACTS — 04/09.
//
// 🚨 CE QUI EST ECRIT ICI A ETE VERIFIE DANS LE CODE. La fiche porte
// coordonnees, origine, notes, statut et historique des relances. La
// recherche fonctionne sur le nom et l adresse ; les fiches se saisissent
// a la main ou s importent depuis une liste.
//
// ⛔ NE PAS ECRIRE QUE LES APPELS, LES SMS OU LES COURRIELS SE RATTACHENT A
// LA FICHE. Verifie le 04/09 : le numero est un lien `tel:` qui compose sur
// le telephone, l adresse un lien `mailto:` qui ouvre la messagerie. Rien
// ne revient dans l outil, et il n y a pas de journal.
//
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique, aucun
// temoignage. Pas d « illimite ».
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrcrm.fr, le middleware reecrit
// tout chemin non reserve vers /mrcrm.
// ══════════════════════════════════════════════════════════════════════════
const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Vos contacts — Mr CRM",
  description:
    "Chaque personne porte sa fiche : coordonnées, origine, notes et historique. Recherche, import de liste, saisie à la main.",
  alternates: {
    canonical: SITE + "/contacts",
  },
  openGraph: {
    title: "Vos contacts — Mr CRM",
    description:
      "Une fiche par personne, avec ce qui a été dit et ce qui reste à faire.",
    url: SITE + "/contacts",
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

const CE_QUE_PORTE = [
  {
    titre: "Ses coordonnées",
    texte:
      "Nom, adresse de courriel, téléphone. L'adresse ouvre votre messagerie, le numéro compose sur votre téléphone : vous restez maître de vos outils d'envoi.",
  },
  {
    titre: "D'où elle vient",
    texte:
      "Formulaire du site, import de liste, saisie à la main, conversation en ligne. Savoir d'où vient un contact change la façon de lui écrire.",
  },
  {
    titre: "Où elle en est",
    texte:
      "Prospect, contacté, intéressé, client ou perdu. L'étape se change d'un geste et se retrouve dans le suivi.",
  },
  {
    titre: "Ce que vous lui avez écrit",
    texte:
      "Les relances envoyées, leur date et leur nombre. Vous voyez si vous avez déjà écrit, et quand, avant de recommencer.",
  },
  {
    titre: "Vos notes",
    texte:
      "Ce que vous voulez retenir, dans vos mots. C'est souvent la ligne la plus utile de la fiche.",
  },
  {
    titre: "Si la relance est armée",
    texte:
      "Chaque fiche porte un interrupteur : relance automatique armée ou désarmée. Vous décidez fiche par fiche.",
  },
];

export default function PageContactsMrCRM() {
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
          VOS CONTACTS
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Une fiche par personne, et tout y est
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Coordonnées, origine, étape, notes, historique de ce que vous avez
          écrit. Vous ouvrez une fiche et vous savez où vous en êtes, sans
          chercher dans vos courriels.
        </p>

        <h2 style={H2}>Ce que porte une fiche</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {CE_QUE_PORTE.map(function (b) {
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

        <h2 style={H2}>Retrouver quelqu&apos;un</h2>
        <p style={P}>
          La recherche porte sur le nom et l&apos;adresse de courriel. Vous
          filtrez aussi par étape, pour ne voir que les intéressés ou que
          les clients. La liste s&apos;affiche en colonnes quand vous en avez
          beaucoup, en fiches détaillées quand vous voulez lire.
        </p>

        <h2 style={H2}>Constituer votre liste</h2>
        <p style={P}>
          Vous saisissez une fiche à la main, ou vous importez une liste. À
          l&apos;import, les doublons et les adresses invalides sont écartés
          et vous sont montrés : vous voyez ce qui n&apos;est pas entré, et
          pourquoi.
        </p>
        <p style={P}>
          Une liste importée n&apos;entre pas dans les relances en nombre.
          Cette séparation est volontaire : on n&apos;écrit pas à cent
          personnes qu&apos;on vient d&apos;ajouter sans les avoir regardées.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir une fiche en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres contacts. Nous ouvrons une fiche et suivons ce qu&apos;elle devient.
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
