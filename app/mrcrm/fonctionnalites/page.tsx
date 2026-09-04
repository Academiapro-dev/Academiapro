// ══════════════════════════════════════════════════════════════════════════
// MR CRM — LA PAGE D ENSEMBLE DES FONCTIONS — 04/09.
//
// 🚨🚨 CETTE PAGE NE DECRIT QUE CE QUI EXISTE, ET C EST LA REGLE QUI A ETE
// PRISE EN DEFAUT SUR LA VITRINE.
//
// LA VITRINE, ECRITE LE 03/09, ANNONCE TROIS CHOSES QUI N EXISTENT PAS :
// les appels avec journal, les SMS, et les courriels rattaches a la fiche.
// Verifie dans le code le 04/09 : le numero est un lien `tel:` qui compose
// sur le telephone, l adresse un lien `mailto:` qui ouvre la messagerie.
// Rien ne revient sur la fiche, et il n y a pas de journal.
//
// ⚠️ NE PAS LES REINTRODUIRE ICI tant que la telephonie n est pas
// construite. La decision du 04/09 est de ne l ouvrir qu au premier client
// qui coche l option.
//
// CE QUI EXISTE ET QUI EST DECRIT SUR CES PAGES :
//   - les fiches et la recherche
//   - les relances, redigees ou automatiques
//   - les etapes de vente et l analyse des pertes
//   - la signature electronique
//
// ⚠️ `pret` PASSE A true QUAND LA PAGE EST CREEE ET DEPLOYEE, jamais avant.
// Une carte sans lien reste lisible ; un lien vers une page absente rend
// « page introuvable » a un prospect.
// 🆕 LES QUATRE PAGES SONT CREEES : les quatre cartes sont cliquables.
//
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique non verifiee,
// aucun temoignage.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrcrm.fr, le middleware reecrit
// tout chemin non reserve vers /mrcrm.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Les fonctions — Mr CRM | Savoir qui rappeler, et quoi lui dire",
  description:
    "Fiches et recherche, relances rédigées ou automatiques, étapes de vente, analyse des pertes, signature électronique.",
  alternates: {
    canonical: SITE + "/fonctionnalites",
  },
  openGraph: {
    title: "Les fonctions de Mr CRM",
    description:
      "Ce que l'outil tient à la place de celui qui suit ses clients, fonction par fonction.",
    url: SITE + "/fonctionnalites",
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

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "26px 28px",
  display: "block",
  textDecoration: "none",
  color: "#fff",
};

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

// LES FONCTIONS, DANS L ORDRE OU ON LES RENCONTRE : on constitue une liste,
// on relance, on suit ce que cela donne, on signe.
const PAGES = [
  {
    titre: "Vos contacts, au même endroit",
    chemin: "/contacts",
    pret: true,
    texte:
      "Chaque personne porte sa fiche : coordonnées, origine, notes, et l'historique de ce que vous lui avez écrit. Vous cherchez par nom, par adresse ou par étape, et vous retrouvez ce que vous cherchez.",
  },
  {
    titre: "Qui relancer, et avec quels mots",
    chemin: "/relances",
    pret: true,
    texte:
      "L'outil vous dit qui attend une réponse et depuis combien de temps. Une relance vous est proposée, que vous relisez avant qu'elle parte. Vous pouvez aussi armer la relance automatique fiche par fiche.",
  },
  {
    titre: "Où en sont vos affaires",
    chemin: "/suivi-des-ventes",
    pret: true,
    texte:
      "Prospect, contacté, intéressé, client, perdu. Vous voyez ce qui avance et ce qui dort. Chaque perte porte son motif, et les motifs se regroupent : vous savez pourquoi vous perdez.",
  },
  {
    titre: "Signer en ligne",
    chemin: "/signature-electronique",
    pret: true,
    texte:
      "Devis et contrats se signent en ligne. Chaque signature produit un dossier de preuve horodaté et une ligne au registre.",
  },
];

export default function PageFonctionsMrCRM() {
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

      <main style={{ ...SECTION, paddingTop: "70px", paddingBottom: "70px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 14px" }}>
          MR CRM — LES FONCTIONS
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 20px", maxWidth: "780px" }}>
          Ce que l&apos;outil tient à votre place
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "17px",
          lineHeight: "1.8", maxWidth: "740px", margin: "0 0 44px" }}>
          Vos contacts, vos relances et vos affaires en cours au même
          endroit, pour que rien ne dépende de ce dont vous vous souvenez.
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
                <a key={b.titre} href={SITE + b.chemin} style={CARTE}>
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

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "40px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>
            Voir l&apos;outil
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres contacts. Nous
            suivons ensemble un client du premier échange au document signé.
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
