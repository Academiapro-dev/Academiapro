// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — L AGENDA DES ECHEANCES — 04/09.
//
// 🚨 LES DATES ET LES MONTANTS SONT SOURCES. Chaque regle porte son
// `source_url` et son `verifie_le` en base, remontes par
// /api/compliance/agenda et affiches par le bouton « Details » de chaque
// ligne. C est ce qui distingue l outil d une liste recopiee : le prospect
// peut controler.
//
// ⚠️ `verifie_le` DOIT ETRE MIS A JOUR A CHAQUE RE-VERIFICATION. Une date
// figee qui vieillit est pire qu aucune date. Ne pas promettre ici une
// frequence de mise a jour qu on ne tiendrait pas.
//
// ⛔ NE JAMAIS ECRIRE QUE L OUTIL DEPOSE A LA PLACE DU CLIENT, ni qu il
// garantit la conformite. Il montre, il prepare, il rappelle. Le depot et
// la responsabilite restent au dirigeant, et c est dit franchement.
//
// ⛔ NE PAS SE PRESENTER COMME UN CONSEIL JURIDIQUE OU FISCAL.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "L'agenda des échéances — MysterLLC",
  description:
    "Toutes les échéances de vos sociétés sur un écran, classées par date, avec leur montant, leur pénalité et le lien vers la source officielle.",
  alternates: {
    canonical: SITE + "/agenda",
  },
  openGraph: {
    title: "L'agenda des échéances — MysterLLC",
    description:
      "Ce qui tombe en premier se lit en premier — quelle que soit la société concernée.",
    url: SITE + "/agenda",
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

const CE_QUE_PORTE_UNE_LIGNE = [
  {
    titre: "Sa date",
    texte:
      "Le jour où l'obligation est due. Les échéances sont classées par date et non par société : ce qui tombe en premier se lit en premier.",
  },
  {
    titre: "Son montant",
    texte:
      "Ce que coûte le dépôt, quand il a un coût. Le Montana est à zéro jusqu'à fin 2027, le Nevada à 350 USD pour deux obligations dues ensemble.",
  },
  {
    titre: "Sa pénalité",
    texte:
      "Ce que coûte l'oubli. C'est souvent sans rapport avec le montant du dépôt : 138,75 USD en Floride, 400 USD de pénalité dès le lendemain.",
  },
  {
    titre: "Sa source officielle",
    texte:
      "Un lien vers le site de l'État ou de l'IRS, et la date à laquelle la règle a été vérifiée. Vous pouvez contrôler ce qu'on vous affiche.",
  },
];

export default function PageAgendaMysterLLC() {
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
          L'AGENDA
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Ce qui tombe en premier se lit en premier
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Toutes les échéances de vos sociétés sur un seul écran, classées par date. Chaque ligne porte son montant, sa pénalité et le lien vers la source officielle.
        </p>

        <h2 style={H2}>Ce que porte chaque ligne</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {CE_QUE_PORTE_UNE_LIGNE.map(function (b) {
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

        <h2 style={H2}>Classé par date, pas par société</h2>
        <p style={P}>
          Un portefeuille de dix sociétés produit une trentaine
          d&apos;échéances par an. Rangées par société, il faut ouvrir dix
          fiches pour savoir ce qui tombe cette semaine. Rangées par date,
          la réponse est en haut de l&apos;écran.
        </p>

        <h2 style={H2}>Pourquoi la source est affichée</h2>
        <p style={P}>
          Les règles changent. Le seuil texan est révisé chaque année, la
          dispense de frais du Montana expire fin 2027, une disposition
          d&apos;abattement floridienne a été abrogée en 2010 et traîne
          encore dans beaucoup de mémentos.
        </p>
        <p style={P}>
          Chaque ligne porte donc le lien vers la page officielle et la date
          à laquelle nous l&apos;avons vérifiée. Vous n&apos;avez pas à nous
          croire sur parole.
        </p>

        <h2 style={H2}>Ce qui reste à votre charge</h2>
        <p style={P}>
          Le dépôt. L&apos;outil montre, prépare et rappelle ; c&apos;est vous
          qui déposez et qui signez. Il ne remplace pas un professionnel du
          droit ou du chiffre, et nous préférons l&apos;écrire ici plutôt que
          de vous le laisser découvrir.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir l&apos;agenda sur vos propres sociétés
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous déclarons une de vos sociétés et regardons l&apos;agenda qui en sort.
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
