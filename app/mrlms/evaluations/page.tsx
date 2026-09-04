// ══════════════════════════════════════════════════════════════════════════
// MR LMS — LES EVALUATIONS — 04/09.
//
// CE QUE CETTE PAGE VEND. Le taux de retour, pas la note. Un organisme
// certifie doit prouver qu il recueille l avis de ses stagiaires ET qu il
// en fait quelque chose. Une moyenne de 4,8 sur trois reponses ne prouve
// rien, et un auditeur le sait.
//
// ⚠️ LE TAUX DE RETOUR EST CALCULE PAR MOMENT — correction du 03/09. A
// chaud et a froid ne se melangent pas : un taux global masquerait qu on ne
// recoit rien a froid. `d.taux_retour` n est plus lu.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
//
// 🚨 NE JAMAIS PROMETTRE UN RESULTAT D AUDIT. On decrit ce que l outil
// produit ; on n ecrit jamais qu il fait obtenir ou conserver une
// certification. C est l organisme qui est audite, pas la plateforme.
//
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique non verifiee,
// aucun temoignage.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
// 🚨 LE CONTACT EST CELUI DE MR LMS — CORRIGE LE 04/09.
//
// Il pointait sur academiapro.fr/contact tant que la page de contact
// Mr LMS n existait pas. Elle existe depuis le 04/09
// (app/mrlms/contact/page.tsx) : le prospect reste desormais sur la marque
// ou il est arrive, et son message part avec « [Mr LMS] » en sujet.
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Les évaluations — Mr LMS",
  description:
    "Questionnaires à chaud et à froid, réponses collectées, taux de retour calculé pour chaque moment, et registre des réclamations.",
  alternates: {
    canonical: SITE + "/evaluations",
  },
  openGraph: {
    title: "Les évaluations — Mr LMS",
    description:
      "Recueillir l'avis de vos stagiaires, et pouvoir montrer ce que vous en avez fait.",
    url: SITE + "/evaluations",
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

const MOMENTS = [
  {
    titre: "À chaud, en fin de parcours",
    texte:
      "Le questionnaire part quand la formation se termine. Il porte sur le déroulement, les supports et l'animation, pendant que le stagiaire a encore tout en tête.",
  },
  {
    titre: "À froid, quelques mois après",
    texte:
      "Le second questionnaire porte sur ce qui a servi une fois de retour au travail. C'est le plus difficile à obtenir, et le plus regardé.",
  },
];

export default function PageEvaluationsMrLMS() {
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
          LES ÉVALUATIONS
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Le taux de retour, avant la note
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Les questionnaires partent, les réponses reviennent, les moyennes
          se calculent. Et le taux de retour est affiché tel qu&apos;il est :
          c&apos;est lui qu&apos;on vous demandera d&apos;expliquer, bien
          avant la moyenne.
        </p>

        <h2 style={H2}>Deux moments, deux mesures</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {MOMENTS.map(function (b) {
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
        <p style={{ ...P, marginTop: "18px" }}>
          Le taux de retour est calculé pour chacun de ces deux moments,
          séparément. Un taux unique mélangeant les deux masquerait
          justement ce qu&apos;il faut voir : que l&apos;on répond volontiers
          en fin de session, et beaucoup moins six mois plus tard.
        </p>

        <h2 style={H2}>Le registre des réclamations</h2>
        <p style={P}>
          Une réclamation s&apos;enregistre avec la réponse apportée et
          l&apos;action corrective décidée. Le registre se tient à mesure que
          vous répondez : il n&apos;y a pas de document séparé à rouvrir en
          fin d&apos;année, ni de fil de courriels à retrouver.
        </p>
        <p style={P}>
          C&apos;est la même logique que pour le reste de la plateforme : ce
          que vous faites au fil de l&apos;eau constitue ce que vous
          présenterez.
        </p>

        <h2 style={H2}>Ce que vous montrez, et ce que vous en faites</h2>
        <p style={P}>
          Les réponses restent consultables une par une, pas seulement en
          moyenne. Une remarque écrite par un stagiaire vaut souvent plus
          qu&apos;une note, et c&apos;est elle qui vous dit quoi changer à la
          prochaine session.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir vos évaluations en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres cas. Nous
            partons d&apos;une session terminée et remontons jusqu&apos;aux
            réponses reçues.
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
