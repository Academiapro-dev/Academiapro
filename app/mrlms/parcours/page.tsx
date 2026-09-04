// ══════════════════════════════════════════════════════════════════════════
// MR LMS — VOS PARCOURS ET VOS MODULES — 04/09.
//
// CE QUE CETTE PAGE VEND. Ce que le stagiaire voit quand il se connecte, et
// ce que l organisme en retire. Un organisme qui compare deux plateformes
// veut savoir comment son contenu entre, comment il se deroule, et ce qui
// reste apres.
//
// ⚠️ LE SUJET DE CHAQUE PHRASE EST L ORGANISME : SES formations, SES
// contenus. NE JAMAIS ATTRIBUER LA CONCEPTION DES FORMATIONS A L EDITEUR.
// Le catalogue AcadéMIA est une OPTION, traitee sur sa propre page.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
//
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique, aucun
// temoignage, aucune promesse que le devis ne tiendrait pas. Pas
// d « illimite ».
//
// 🚨 CE QUI EST ECRIT ICI DOIT EXISTER DANS L OUTIL : le decoupage en
// chapitres et modules, les questionnaires corriges, la progression datee
// module par module, l import des contenus a la mise en place, la classe
// virtuelle. Rien annonce au present qui ne soit pas construit.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = LEGAL + "/contact";

export const metadata = {
  title: "Vos parcours et vos modules — Mr LMS",
  description:
    "Vos contenus importés à la mise en place, déroulés en chapitres et modules, avec questionnaires corrigés et progression datée.",
  alternates: {
    canonical: SITE + "/parcours",
  },
  openGraph: {
    title: "Vos parcours et vos modules — Mr LMS",
    description:
      "Comment vos formations se déroulent en ligne, et ce qu'il en reste une fois la session terminée.",
    url: SITE + "/parcours",
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

// CE QUE VOIT LE STAGIAIRE. Chaque bloc decrit un element reellement
// present dans l espace de formation.
const COTE_STAGIAIRE = [
  {
    titre: "Un parcours découpé",
    texte:
      "La formation se déroule en chapitres, eux-mêmes découpés en modules. Le stagiaire sait où il en est et ce qu'il lui reste, sans avoir à le demander.",
  },
  {
    titre: "Des questionnaires corrigés",
    texte:
      "Chaque module se ferme sur un questionnaire. La correction est rendue erreur par erreur, pas seulement sous forme de note : le stagiaire voit ce qu'il a manqué, et pourquoi.",
  },
  {
    titre: "Une progression enregistrée",
    texte:
      "Chaque module validé est daté. Le stagiaire reprend là où il s'est arrêté, sur l'appareil qu'il a sous la main.",
  },
  {
    titre: "Des séances en direct",
    texte:
      "Quand votre formation en comporte, les séances en classe virtuelle se rattachent au parcours : les présences y sont consignées comme pour une séance en salle.",
  },
];

export default function PageParcoursMrLMS() {
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
          VOS PARCOURS ET VOS MODULES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Vos formations, en ligne, sans les réécrire
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Vos contenus sont importés lors de la mise en place et deviennent
          des parcours suivis en ligne. Vous gardez vos formations, vos
          intitulés et votre façon de les enseigner.
        </p>

        <h2 style={H2}>Ce que voit le stagiaire</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {COTE_STAGIAIRE.map(function (b) {
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

        <h2 style={H2}>Comment vos contenus entrent</h2>
        <p style={P}>
          L&apos;import fait partie de la mise en place : vos supports
          existants sont repris et découpés en chapitres et modules avec
          vous. Vous n&apos;avez pas à reconstruire vos formations dans un
          éditeur avant de pouvoir vous en servir.
        </p>
        <p style={P}>
          Une fois en ligne, vos parcours restent les vôtres. Vous les
          modifiez, vous en ajoutez, vous en retirez, sans repasser par
          nous.
        </p>

        <h2 style={H2}>Ce qu&apos;il en reste après</h2>
        <p style={P}>
          Chaque module validé laisse une trace datée. C&apos;est de là que
          viennent les heures réellement suivies, la clôture du parcours et
          les chiffres de votre bilan de fin d&apos;année. Un parcours suivi
          ne produit pas seulement un stagiaire formé : il produit ce que
          vous devrez présenter.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir un parcours complet
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres cas. Nous
            déroulons ensemble une de vos formations, du premier module à
            l&apos;attestation de fin de formation.
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
