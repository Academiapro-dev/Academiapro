// ══════════════════════════════════════════════════════════════════════════
// LA VITRINE DE MR LMS — 03/09.
//
// CE QUI SE VEND ICI : la plateforme de formation, vendue seule, a un
// organisme qui a deja ses formations. Le catalogue AcadéMIA et la marque
// blanche sont des OPTIONS, pas le produit.
//
// 🚨 AUCUN PRIX SUR CETTE PAGE. Le tarif se donne apres l echange, jamais
// avant : c est ce qui produit le prospect. La grille vit dans `lms_tarifs`
// et n est lue que par le devis.
//
// 🚨 AUCUNE PROMESSE QUE LE DEVIS NE TIENDRAIT PAS. Chaque phrase est
// relue du point de vue de quelqu un qui cherche une raison de ne pas
// signer. Pas de « illimite », pas de statistique, pas de temoignage, pas
// de comparaison avec un autre editeur.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
//
// ⚠️ NE JAMAIS ATTRIBUER LA CONCEPTION DES FORMATIONS A L EDITEUR. Le sujet
// de chaque phrase est l organisme : ce sont SES formations, SES stagiaires,
// SON bilan.
//
// La barre generale s efface sur cette page (components/NavBar.tsx) : la
// page porte son propre en-tete, comme les vitrines Mr Comptable et
// MysterLLC.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU — CORRIGE LE 04/09.
//
// LE DEFAUT, CONSTATE PAR JACQUES EN TEST REEL. Les boutons « Demander une
// presentation » et le pied pointaient sur /contact, /cgv, /mentions-legales,
// /politique-confidentialite. Sur mrlms.fr, le middleware reecrit tout
// chemin non reserve vers le dossier du produit : /contact devenait
// /mrlms/contact, qui n existe pas. Le premier bouton de la vitrine menait
// a « page introuvable ».
//
// CES PAGES EXISTENT SUR academiapro.fr, declarees dans son sitemap, et
// valent pour toutes les solutions de la maison. Elles sont donc appelees
// en absolu. Le jour ou Mr LMS aura sa propre page de contact, la
// constante CONTACT change ici et nulle part ailleurs.
//
// 🆕 LIEN « BLOG » DANS L EN-TETE ET LE PIED — 04/09. Le blog
// (app/mrlms/blog) existait sans qu aucun lien n y mene : un visiteur ne
// pouvait pas le trouver, et Google ne l aurait vu que par le sitemap.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = LEGAL + "/contact";

export const metadata = {
  title: "Mr LMS — Vos stagiaires, de l'inscription au bilan",
  description:
    "La plateforme de formation des organismes : inscriptions, parcours, présences, évaluations, signature électronique et bilan pédagogique et financier.",
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

const CADRE: any = {
  minHeight: "100vh",
  background: FOND,
  color: "#fff",
  fontFamily: "Georgia, serif",
};

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
};

const BOUTON: any = {
  display: "inline-block",
  background: "linear-gradient(135deg,#c8a96e,#a07840)",
  color: FOND,
  padding: "15px 34px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "16px",
};

const BOUTON_CLAIR: any = {
  ...BOUTON,
  background: "transparent",
  color: OR,
  border: "1px solid rgba(200,169,110,0.5)",
};

// CE QUE FAIT LA PLATEFORME. Chaque bloc dit une chose que l organisme
// devra prouver un jour — a un auditeur, a un financeur, a un stagiaire.
const CE_QUI_EST_FAIT = [
  {
    titre: "Vos formations, vos parcours",
    texte:
      "Vos contenus sont importés lors de la mise en place. Chaque formation se déroule en modules, avec des questionnaires corrigés erreur par erreur et un suivi de progression que vous consultez à tout moment.",
  },
  {
    titre: "Le suivi de vos stagiaires",
    texte:
      "Chaque inscription porte son statut, son financeur et son dispositif dès le départ. Les présences et les heures suivies se consignent au fil des séances, sans ressaisie.",
  },
  {
    titre: "Les évaluations, à chaud et à froid",
    texte:
      "Les questionnaires partent, les réponses reviennent, les moyennes se calculent. Le taux de retour est affiché tel qu'il est : c'est lui qu'un auditeur regarde, avant la note.",
  },
  {
    titre: "Les réclamations",
    texte:
      "Chaque réclamation est enregistrée avec sa réponse et l'action corrective décidée. Le registre se tient tout seul, à mesure que vous répondez.",
  },
  {
    titre: "La signature électronique",
    texte:
      "Conventions, devis et attestations de fin de formation se signent en ligne. Chaque signature produit un dossier de preuve horodaté et une ligne au registre.",
  },
  {
    titre: "Le bilan pédagogique et financier",
    texte:
      "Vos chiffres sont rangés selon les cadres du formulaire, à partir des données saisies dans l'année, et exportables en PDF. La télédéclaration reste effectuée par vos soins.",
  },
];

export default function PageMrLMS() {
  return (
    <div style={CADRE}>
      {/* ---- EN-TETE ---- */}
      {/* 🚨 LA BANNIERE EST AU FORMAT 4:1. A 380 px elle paraissait perdue
          dans une bande noire, decalee a gauche : la marque, qui est la
          premiere chose lue, y semblait accessoire. Elle occupe desormais
          la largeur disponible, plafonnee a 560 px pour ne pas se pixeliser,
          et l en-tete est aere. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", background: "#000" }}>
        <div style={{ ...SECTION, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", gap: "16px" }}>
          <img
            src="/mrlms-banniere.jpeg.png"
            alt="Mr LMS"
            style={{ width: "560px", maxWidth: "62vw", height: "auto", display: "block", margin: "-4px", clipPath: "inset(4px)" }}
          />
          <nav style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            {/* 🆕 « FONCTIONS » AJOUTE LE 04/09. Les huit pages de fonction
                existaient sans qu aucun lien n y mene : elles etaient
                deployees et invisibles. Un ecran livre sans son lien
                n existe pas pour le visiteur. */}
            <a href={SITE + "/fonctionnalites"} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Fonctions
            </a>
            <a href={SITE + "/blog"} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Blog
            </a>
            <a href={CONTACT} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Contact
            </a>
            <a href="/connexion" style={{ color: OR, border: "1px solid rgba(200,169,110,0.45)", padding: "9px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      {/* ---- ACCROCHE ---- */}
      <section style={{ ...SECTION, paddingTop: "70px", paddingBottom: "50px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 14px" }}>
          POUR LES ORGANISMES DE FORMATION
        </p>
        <h1 style={{ fontSize: "40px", lineHeight: "1.25", margin: "0 0 20px", color: "#fff" }}>
          Vos stagiaires, de l&apos;inscription au bilan
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "18px", lineHeight: "1.8", margin: "0 0 32px", maxWidth: "760px" }}>
          Un espace de formation en ligne où vos stagiaires suivent vos parcours,
          et qui produit au fil des sessions les éléments que vous devrez présenter :
          présences, évaluations, réclamations, documents signés, bilan pédagogique
          et financier.
        </p>
        <a href={CONTACT} style={BOUTON}>Demander une présentation</a>
      </section>

      {/* ---- CE QUI EST FAIT ---- */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 26px" }}>
          Ce que la plateforme tient à votre place
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
          {CE_QUI_EST_FAIT.map(function (b) {
            return (
              <div key={b.titre} style={CARTE}>
                <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 10px" }}>{b.titre}</h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {b.texte}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- LA MARQUE BLANCHE ---- */}
      {/* 🚨 DECISION DU 03/09 : LA MARQUE BLANCHE EST UNE OPTION. Sans elle,
          l espace porte la marque Mr LMS. Le dire ici, franchement, evite
          qu un prospect le decouvre a la lecture du devis — une promesse de
          vitrine doit survivre a cette lecture. */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <div style={{ ...CARTE, borderColor: "rgba(200,169,110,0.45)" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
            EN OPTION
          </p>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 14px" }}>
            Votre nom, vos couleurs
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 12px" }}>
            Avec l&apos;option marque blanche, l&apos;espace, les documents et les
            courriels adressés à vos stagiaires portent le nom et les couleurs de
            votre organisme. Vous fixez vos prix de vente. Le nom de l&apos;éditeur
            n&apos;apparaît pas pour eux.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
            Sans cette option, la plateforme fonctionne à l&apos;identique et vos
            stagiaires voient la marque Mr LMS.
          </p>
        </div>
      </section>

      {/* ---- LE CATALOGUE ---- */}
      {/* ⚠️ LE SUJET RESTE L ORGANISME. On ne dit jamais que l editeur a
          concu ces formations : on dit que l organisme les propose sous son
          nom et a ses prix. */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <div style={{ ...CARTE, borderColor: "rgba(200,169,110,0.45)" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
            EN OPTION
          </p>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 14px" }}>
            Élargir votre catalogue
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 12px" }}>
            Vous pouvez retenir des formations du catalogue AcadéMIA et les proposer
            sous votre nom, à vos prix, aux côtés des vôtres. Vous choisissez celles
            qui correspondent aux demandes que vous recevez et auxquelles vous ne
            répondez pas encore.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
            Cette option comprend la marque blanche et l&apos;accompagnement jusqu&apos;au
            bilan pédagogique et financier.
          </p>
        </div>
      </section>

      {/* ---- COMMENT CA SE PASSE ---- */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 20px" }}>
          Comment cela se passe
        </h2>
        <div style={CARTE}>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "16px", lineHeight: "1.9", margin: "0 0 14px" }}>
            Nous regardons ensemble votre activité et ce que vous attendez de la
            plateforme. Vous recevez un devis. À la signature, votre espace est mis
            en place et vos formations y sont importées.
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.9", margin: 0 }}>
            Sans engagement de durée. Vos données — stagiaires, résultats, documents —
            vous appartiennent et vous sont restituées sur demande, dans un format
            exploitable.
          </p>
        </div>
      </section>

      {/* ---- APPEL ---- */}
      <section style={{ ...SECTION, paddingBottom: "80px" }}>
        <div style={{ ...CARTE, textAlign: "center", borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "26px", margin: "0 0 12px" }}>
            Voir la plateforme
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres cas. Nous parcourons
            ensemble un parcours complet, du premier inscrit au bilan.
          </p>
          <a href={CONTACT} style={BOUTON}>Demander une présentation</a>
          <a href="/connexion" style={{ ...BOUTON_CLAIR, marginLeft: "12px" }}>
            J&apos;ai déjà un compte
          </a>
        </div>
      </section>

      {/* ---- PIED ---- */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr LMS — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE, textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE, textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE, textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE, textDecoration: "none" }}>CGV</a>
            {"  ·  "}
            <a href={LEGAL + "/politique-confidentialite"} style={{ color: OR_PALE, textDecoration: "none" }}>Confidentialité</a>
            {"  ·  "}
            <a href={CONTACT} style={{ color: OR_PALE, textDecoration: "none" }}>Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
