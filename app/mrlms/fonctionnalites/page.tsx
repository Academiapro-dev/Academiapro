// ══════════════════════════════════════════════════════════════════════════
// MR LMS — LA PAGE D ENSEMBLE DES FONCTIONS — 04/09.
//
// POURQUOI CETTE PAGE EXISTE. Le site n avait que deux pages : la vitrine
// et le blog. Un organisme qui compare deux plateformes cherche le detail
// de ce que chacune fait, fonction par fonction. Une vitrine unique qui
// resume tout en six cartes ne se compare pas, et ne se trouve pas dans un
// moteur de recherche : chaque fonction a ses propres mots, donc sa propre
// page.
//
// CETTE PAGE EST LE SOMMAIRE. Elle dit ce que la plateforme fait, et
// renvoie vers la page detaillee de chaque fonction. Les pages detaillees
// sont ajoutees une a une ; TOUT LIEN POSE ICI DOIT CORRESPONDRE A UNE PAGE
// QUI EXISTE — un lien mort sur une page de vitrine coute plus qu un lien
// manquant.
//
// ⚠️ LES LIENS DE CETTE LISTE SONT DECOMMENTES AU FUR ET A MESURE. La
// constante PAGES ci-dessous porte un champ `pret` : tant qu il est faux,
// la carte s affiche sans lien. Rien ne casse, rien ne ment.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms : un lien relatif /contact devient
// /mrlms/contact, qui n existe pas. Les pages legales et le contact vivent
// sur academiapro.fr.
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
// ⚠️ LE SUJET DE CHAQUE PHRASE EST L ORGANISME : ses formations, ses
// stagiaires, son bilan. Ne jamais attribuer la conception a l editeur.
// 🚨 AUCUN PRIX, aucun concurrent nomme, aucune statistique, aucun
// temoignage, aucune promesse que le devis ne tiendrait pas.
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
  title: "Les fonctions — Mr LMS | La plateforme de formation des organismes",
  description:
    "Parcours et modules, suivi des stagiaires, évaluations à chaud et à froid, réclamations, signature électronique, bilan pédagogique et financier.",
  alternates: {
    canonical: SITE + "/fonctionnalites",
  },
  openGraph: {
    title: "Les fonctions de Mr LMS",
    description:
      "Ce que la plateforme tient à la place d'un organisme de formation, fonction par fonction.",
    url: SITE + "/fonctionnalites",
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

// LES FONCTIONS, DANS L ORDRE OU UN ORGANISME LES RENCONTRE : il inscrit,
// il forme, il evalue, il repond, il signe, il declare.
//
// ⚠️ `pret` PASSE A true QUAND LA PAGE EST CREEE ET DEPLOYEE, jamais avant.
// Une carte sans lien reste lisible ; un lien vers une page absente rend
// « page introuvable » a un prospect.
const PAGES = [
  {
    titre: "Vos parcours et vos modules",
    chemin: "/parcours",
    pret: false,
    texte:
      "Vos contenus sont importés lors de la mise en place. Chaque formation se déroule en modules, avec des questionnaires corrigés erreur par erreur et une progression que vous consultez à tout moment.",
  },
  {
    titre: "Le suivi de vos stagiaires",
    chemin: "/stagiaires",
    pret: false,
    texte:
      "Chaque inscription porte son statut, son financeur et son dispositif dès le départ. Les présences et les heures suivies se consignent au fil des séances, sans ressaisie.",
  },
  {
    titre: "Les évaluations, à chaud et à froid",
    chemin: "/evaluations",
    pret: false,
    texte:
      "Les questionnaires partent, les réponses reviennent, les moyennes se calculent. Le taux de retour est affiché tel qu'il est : c'est lui qu'un auditeur regarde, avant la note.",
  },
  {
    titre: "Le registre des réclamations",
    chemin: "/reclamations",
    pret: false,
    texte:
      "Chaque réclamation est enregistrée avec sa réponse et l'action corrective décidée. Le registre se tient à mesure que vous répondez, sans document à rouvrir.",
  },
  {
    titre: "La signature électronique",
    chemin: "/signature-electronique",
    pret: false,
    texte:
      "Conventions, devis et attestations de fin de formation se signent en ligne. Chaque signature produit un dossier de preuve horodaté et une ligne au registre.",
  },
  {
    titre: "Le bilan pédagogique et financier",
    chemin: "/bilan-pedagogique-et-financier",
    pret: false,
    texte:
      "Vos chiffres sont rangés selon les cadres du formulaire, à partir des données saisies dans l'année, et exportables en PDF. La télédéclaration reste effectuée par vos soins.",
  },
  {
    titre: "Votre nom, vos couleurs",
    chemin: "/marque-blanche",
    pret: false,
    texte:
      "En option, l'espace, les documents et les courriels adressés à vos stagiaires portent le nom et les couleurs de votre organisme. Vous fixez vos prix de vente.",
  },
  {
    titre: "Élargir votre catalogue",
    chemin: "/catalogue",
    pret: false,
    texte:
      "En option, vous retenez des formations du catalogue AcadéMIA et les proposez sous votre nom, à vos prix, aux côtés des vôtres.",
  },
];

export default function PageFonctionsMrLMS() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Identique a la vitrine et au blog. */}
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
          MR LMS — LES FONCTIONS
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 20px", maxWidth: "780px" }}>
          Ce que la plateforme tient à votre place
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "17px",
          lineHeight: "1.8", maxWidth: "740px", margin: "0 0 44px" }}>
          De la première inscription au bilan de fin d&apos;année, chaque
          fonction produit les éléments que vous devrez présenter un jour —
          à un auditeur, à un financeur, à un stagiaire.
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
            Voir la plateforme
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres cas. Nous
            parcourons ensemble un parcours complet, du premier inscrit au
            bilan.
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
