// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LES FORMULAIRES — 04/09.
//
// 🚨 « PRE-REMPLIS », JAMAIS « REMPLIS » NI « DEPOSES ». L outil remplit les
// PDF officiels depuis la fiche de la societe ; le dirigeant relit, signe et
// depose. C est la promesse centrale de la marque — « rien ne se fait sans
// vous » — et elle serait trahie par un mot de trop.
//
// ⛔ NE JAMAIS ECRIRE QUE L OUTIL TELEDECLARE, TRANSMET A L IRS, ou
// GARANTIT L ACCEPTATION D UN DEPOT.
//
// ⚠️ LE BOI SE DEPOSE EN LIGNE SUR LE SITE DU FinCEN : l outil prepare la
// fiche, il ne depose pas. Ne pas laisser croire l inverse.
//
// ⛔ NE PAS SE PRESENTER COMME UN CONSEIL JURIDIQUE OU FISCAL.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Les formulaires — MysterLLC",
  description:
    "Les PDF officiels de l'IRS, pré-remplis depuis la fiche de la société. Vous relisez, vous signez, vous déposez.",
  alternates: {
    canonical: SITE + "/formulaires",
  },
  openGraph: {
    title: "Les formulaires — MysterLLC",
    description:
      "Form 5472, 1120 pro forma, 7004, W-8BEN-E : préparés, jamais déposés à votre place.",
    url: SITE + "/formulaires",
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

const LES_FORMULAIRES = [
  {
    titre: "Form 5472 et 1120 pro forma",
    texte:
      "Dus au 15 avril. Leur dépôt tardif ou omis expose à une pénalité de 25 000 USD par société et par an, qu'il y ait eu activité ou non.",
  },
  {
    titre: "Form 7004",
    texte:
      "L'extension de délai, accordée automatiquement pour six mois. Déposée après l'échéance, elle ne vaut plus rien.",
  },
  {
    titre: "W-8BEN-E",
    texte:
      "Demandé par le payeur américain. Sans lui, une retenue à la source de 30 % s'applique sur les paiements de source américaine.",
  },
  {
    titre: "Fiche BOI FinCEN",
    texte:
      "La déclaration des bénéficiaires effectifs. L'outil prépare la fiche ; le dépôt se fait en ligne sur le site du FinCEN.",
  },
  {
    titre: "1040-NR",
    texte:
      "La déclaration personnelle du membre, quand elle est due. Suivie et rappelée, elle reste préparée par vos soins.",
  },
  {
    titre: "Les rapports d'État",
    texte:
      "Selon l'État de constitution : rapport annuel, liste annuelle, licence d'État. Chacun avec sa date et son montant propres.",
  },
];

export default function PageFormulairesMysterLLC() {
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
          LES FORMULAIRES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Pré-remplis. Vous relisez, vous signez, vous déposez.
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Les PDF officiels sortent remplis depuis la fiche de chaque société. Nous ne déposons rien à votre place — et c&apos;est ce qui vous laisse la main.
        </p>

        <h2 style={H2}>Ce que l&apos;outil prépare</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LES_FORMULAIRES.map(function (b) {
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

        <h2 style={H2}>Pré-remplis, pas déposés</h2>
        <p style={P}>
          Les PDF sont ceux de l&apos;administration, remplis avec ce que
          porte la fiche de la société : raison sociale, EIN, adresse,
          identité du membre. Vous les ouvrez, vous les relisez, vous les
          signez, vous les déposez.
        </p>
        <p style={P}>
          Nous ne déposons rien à votre place et nous ne transmettons rien à
          l&apos;administration. C&apos;est une limite, et c&apos;est aussi
          la raison pour laquelle vous gardez la main : personne ne signe en
          votre nom un document que vous n&apos;avez pas lu.
        </p>

        <h2 style={H2}>Ce que cela évite</h2>
        <p style={P}>
          Recopier chaque année les mêmes informations sur les mêmes
          formulaires, pour dix sociétés, en espérant n&apos;avoir inversé
          aucun chiffre. L&apos;erreur de saisie sur un EIN ne se voit pas au
          moment où on la fait ; elle se voit quand l&apos;administration
          répond.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir un formulaire sortir
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous déclarons une société et nous ouvrons le Form 5472 qu&apos;elle produit.
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
