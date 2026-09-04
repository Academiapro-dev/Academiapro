// ══════════════════════════════════════════════════════════════════════════
// MR LMS — LE SUIVI DES STAGIAIRES — 04/09.
//
// CE QUE CETTE PAGE VEND. Pas une liste de fonctions : le fait qu un
// organisme puisse repondre, n importe quel jour, a la question « ou en est
// cette personne, et depuis quand ». C est ce qu on lui demandera en
// audit, et c est ce qu il cherche quand il compare deux plateformes.
//
// ⚠️ LE SUJET DE CHAQUE PHRASE EST L ORGANISME : ses stagiaires, ses
// sessions, son registre. Ne jamais attribuer la conception des formations
// a l editeur.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
//
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique non verifiee,
// aucun temoignage. Chaque phrase est relue du point de vue de quelqu un
// qui cherche une raison de ne pas signer.
//
// 🚨 CE QUI EST ECRIT ICI DOIT EXISTER DANS L OUTIL. La fin de parcours
// automatique (modules valides / modules au plan), les presences, le statut
// et le financeur portes par l inscription : tout cela tourne. Rien n est
// annonce au present qui ne soit pas construit.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = LEGAL + "/contact";

export const metadata = {
  title: "Le suivi des stagiaires — Mr LMS",
  description:
    "Inscriptions, statuts, financeurs, présences, progression et fin de parcours : savoir où en est chaque stagiaire, et depuis quand.",
  alternates: {
    canonical: SITE + "/stagiaires",
  },
  openGraph: {
    title: "Le suivi des stagiaires — Mr LMS",
    description:
      "Inscriptions, présences, progression et fin de parcours, dans un seul registre.",
    url: SITE + "/stagiaires",
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

// CE QUE PORTE UNE INSCRIPTION. Chaque ligne correspond a une donnee
// reellement saisie ou calculee dans l outil.
const CE_QUE_PORTE = [
  {
    titre: "Son statut et son financeur",
    texte:
      "Salarié, demandeur d'emploi, indépendant ; dispositif et financeur renseignés dès l'inscription. Ce sont les cases du bilan de fin d'année : les remplir au départ évite de les reconstituer en janvier.",
  },
  {
    titre: "Ses présences",
    texte:
      "Les présences se consignent au fil des séances. Elles restent attachées à la session et à la personne, consultables sans ressaisie.",
  },
  {
    titre: "Sa progression, module par module",
    texte:
      "Chaque module validé est daté. Vous voyez ce qui est fait, ce qui reste, et à quel moment la personne a décroché si elle a décroché.",
  },
  {
    titre: "Ses heures réellement suivies",
    texte:
      "Les heures sont calculées à partir des modules validés, pas de la durée théorique du parcours. Une personne qui a suivi deux modules sur quatre-vingts ne pèse pas la durée complète de la formation.",
  },
  {
    titre: "Sa fin de parcours",
    texte:
      "Le parcours se clôt automatiquement quand tous les modules du plan sont validés. Vous pouvez aussi déclarer une fin ou un abandon à la main, quand la réalité ne suit pas le plan.",
  },
  {
    titre: "Ses documents",
    texte:
      "Convention, attestation de fin de formation, évaluations : ce qui a été signé et ce qui a été rendu restent rattachés à la personne.",
  },
];

export default function PageStagiairesMrLMS() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Identique a la vitrine, au blog et aux autres
          pages de fonction. */}
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
          LE SUIVI DES STAGIAIRES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Savoir où en est chaque stagiaire, et depuis quand
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Un registre unique où chaque personne inscrite porte son statut,
          son financeur, ses présences, sa progression et ses documents.
          Ce que vous saisissez au fil des sessions est ce que vous
          présenterez en fin d&apos;année.
        </p>

        <h2 style={H2}>Ce que porte une inscription</h2>
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

        <h2 style={H2}>Une personne, une ligne</h2>
        <p style={P}>
          Une personne inscrite à trois parcours reste une personne. Elle
          apparaît une fois dans votre registre, avec ses trois parcours
          rattachés — pas trois fois, ce qui fausserait autant vos comptes
          que votre lecture.
        </p>

        <h2 style={H2}>Ce qui se calcule tout seul</h2>
        <p style={P}>
          La fin de parcours se déduit des modules validés : quand tous les
          modules du plan sont faits, le parcours est terminé, sans que
          personne ait à le déclarer. Les heures suivies se calculent de la
          même façon, à partir de ce qui a réellement été validé.
        </p>
        <p style={P}>
          Vous gardez la main : deux boutons permettent de déclarer une fin
          de parcours ou un abandon, pour les situations que le calcul ne
          voit pas — une personne qui arrête, une session interrompue.
        </p>

        <h2 style={H2}>Ce que cela vous évite</h2>
        <p style={P}>
          Reconstituer un registre en janvier à partir de courriels et de
          feuilles de présence. Les données du bilan pédagogique et
          financier sortent de ce que vous avez saisi au fil de l&apos;année,
          sans reprise.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir le registre sur vos propres cas
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous suivons ensemble un
            stagiaire de son inscription à son attestation de fin de
            formation.
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
