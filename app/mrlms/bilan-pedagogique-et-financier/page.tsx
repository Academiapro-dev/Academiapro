// ══════════════════════════════════════════════════════════════════════════
// MR LMS — LE BILAN PEDAGOGIQUE ET FINANCIER — 04/09.
//
// CE QUE CETTE PAGE VEND. La corvee de janvier, faite au fil de l annee.
// C est l argument le plus fort du produit aupres d un organisme : tout
// le monde connait la semaine passee a reconstituer des chiffres a partir
// de courriels et de feuilles de presence.
//
// 🚨 DEUX REGLES DE CALCUL A NE PAS TRAHIR ICI — corrigees le 03/09.
//
// 1. LES HEURES NE SONT PAS LA DUREE THEORIQUE. heures = duree x modules
//    valides / modules au plan. Un stagiaire ayant valide 2 modules sur 80
//    faisait declarer 120 heures au lieu de 3.
// 2. UNE ANNEE DE BILAN EST UNE ANNEE D ACTIVITE. Les PRODUITS suivent la
//    date d inscription, les HEURES suivent les modules valides DANS
//    L ANNEE, et une inscription figure au bilan si elle remplit l une OU
//    l autre condition.
//
// 🚨 LA TELEDECLARATION RESTE FAITE PAR L ORGANISME. Ne jamais laisser
// croire que la plateforme depose le bilan a sa place. On produit les
// chiffres et un PDF ; l organisme declare.
//
// ⛔ NE JAMAIS PROMETTRE UN RESULTAT D AUDIT ni la conformite. C est
// l organisme qui est audite, pas la plateforme.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique non verifiee.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = LEGAL + "/contact";

export const metadata = {
  title: "Le bilan pédagogique et financier — Mr LMS",
  description:
    "Vos chiffres rangés selon les cadres du formulaire, à partir des données saisies dans l'année, et exportables en PDF.",
  alternates: {
    canonical: SITE + "/bilan-pedagogique-et-financier",
  },
  openGraph: {
    title: "Le bilan pédagogique et financier — Mr LMS",
    description:
      "La corvée de janvier, faite au fil de l'année : heures réellement suivies, stagiaires, financeurs.",
    url: SITE + "/bilan-pedagogique-et-financier",
    siteName: "Mr LMS",
    locale: "fr_FR",
    type: "website",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// 🚨 DOUBLE EXTENSION REELLE ET VOULUE. Le code pointe sur le nom reel.
const BANNIERE = "/mrlms-banniere.jpeg.png";

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

// CE QUE LE BILAN REPREND. Chaque bloc correspond a une donnee que la
// plateforme calcule reellement.
const CE_QUE_REPREND = [
  {
    titre: "Vos stagiaires de l'année",
    texte:
      "Les personnes inscrites dans l'année, et celles inscrites avant qui ont continué à suivre des modules pendant l'année. Les deux cas comptent, et pour la bonne raison.",
  },
  {
    titre: "Les heures réellement suivies",
    texte:
      "Calculées à partir des modules validés, pas de la durée annoncée du parcours. Un stagiaire qui a suivi deux modules sur quatre-vingts ne fait pas déclarer la durée entière de la formation.",
  },
  {
    titre: "Les statuts et les financeurs",
    texte:
      "Renseignés à l'inscription, ils se retrouvent rangés dans les cadres du formulaire sans être ressaisis en fin d'année.",
  },
  {
    titre: "Vos produits",
    texte:
      "Ce qui a été facturé, rattaché aux inscriptions concernées. Les produits suivent la date d'inscription, les heures suivent les modules validés dans l'année.",
  },
];

export default function PageBilanMrLMS() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Identique aux autres pages du site. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="Mr LMS"
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
          LE BILAN PÉDAGOGIQUE ET FINANCIER
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Le travail de janvier, fait au fil de l&apos;année
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Vos chiffres sont rangés selon les cadres du formulaire, à partir
          des données saisies pendant l&apos;année, et exportables en PDF.
          Il n&apos;y a rien à reconstituer.
        </p>

        <h2 style={H2}>Ce que le bilan reprend</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {CE_QUE_REPREND.map(function (b) {
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

        <h2 style={H2}>Pourquoi les heures comptées sont plus basses</h2>
        <p style={P}>
          Beaucoup de tableurs déclarent la durée annoncée d&apos;une
          formation dès qu&apos;une personne y est inscrite. Une personne qui
          abandonne au deuxième module d&apos;un parcours de quatre-vingts
          fait alors gonfler le total de dizaines d&apos;heures qui
          n&apos;ont jamais été suivies.
        </p>
        <p style={P}>
          Ici, les heures se calculent sur les modules réellement validés.
          Le chiffre est plus bas, et il est le vôtre : c&apos;est celui que
          vous pourrez expliquer, ligne par ligne, si on vous le demande.
        </p>

        <h2 style={H2}>Une année d&apos;activité, pas une année d&apos;inscriptions</h2>
        <p style={P}>
          Une personne inscrite en novembre qui suit ses modules en février
          relève des deux années : de la première pour son inscription, de la
          seconde pour les heures qu&apos;elle y a suivies. Le bilan la
          retient dans une année dès qu&apos;elle remplit l&apos;une ou
          l&apos;autre condition, plutôt que de la faire disparaître d&apos;un
          côté ou de l&apos;autre.
        </p>

        <h2 style={H2}>Ce qui reste à votre charge</h2>
        <p style={P}>
          La télédéclaration. La plateforme produit les chiffres et le PDF ;
          c&apos;est vous qui déposez le bilan, comme vous le faites
          aujourd&apos;hui. Nous ne déclarons rien à votre place, et nous
          préférons le dire ici plutôt que vous le laisser découvrir.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir le bilan sur vos propres chiffres
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous partons d&apos;une de vos
            sessions et remontons jusqu&apos;aux cadres du formulaire.
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
            Mr LMS — une solution ACADÉMIA PRO LLC
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
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE,
              textDecoration: "none" }}>CGV</a>
            {"  ·  "}
            <a href={CONTACT} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
