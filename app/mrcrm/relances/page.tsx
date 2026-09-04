// ══════════════════════════════════════════════════════════════════════════
// MR CRM — LES RELANCES — 04/09.
//
// 🚨 CE QUI EST ECRIT ICI A ETE VERIFIE DANS LE CODE. La campagne du jour
// ecarte les desinscrits ; une relance est redigee et proposee A LA
// RELECTURE avant tout envoi ; la relance automatique s arme fiche par
// fiche ; le nombre de relances deja envoyees est porte par la fiche.
//
// ⛔ NE PAS ECRIRE QUE LES RELANCES PARTENT PAR SMS. Il n y a pas de SMS
// dans l outil.
//
// 🚨 UNE RELANCE EN NOMBRE NE SE DECLENCHE PAS A L AVEUGLE : c est une
// regle du code, elle merite d etre dite au prospect.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrcrm.fr, le middleware reecrit
// tout chemin non reserve vers /mrcrm.
// ══════════════════════════════════════════════════════════════════════════
const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Les relances — Mr CRM",
  description:
    "Qui attend une réponse et depuis quand, une relance rédigée que vous relisez avant l'envoi, et la relance automatique armée fiche par fiche.",
  alternates: {
    canonical: SITE + "/relances",
  },
  openGraph: {
    title: "Les relances — Mr CRM",
    description:
      "Savoir qui rappeler aujourd'hui, et ne pas écrire deux fois la même chose.",
    url: SITE + "/relances",
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

const LA_RELANCE = [
  {
    titre: "La liste du jour",
    texte:
      "Ceux qui attendent une réponse, et depuis combien de temps. Sont écartés ceux qui se sont désinscrits et ceux dont la fiche est close.",
  },
  {
    titre: "Une relance proposée",
    texte:
      "Un texte vous est proposé à partir de ce que porte la fiche. Vous le relisez, vous le corrigez, et vous décidez de l'envoyer.",
  },
  {
    titre: "La relance automatique",
    texte:
      "Elle s'arme fiche par fiche, jamais globalement. Une fiche armée est signalée dans la liste : vous savez à tout moment lesquelles partent seules.",
  },
  {
    titre: "Ce qui est déjà parti",
    texte:
      "Chaque fiche porte la date de la dernière relance et leur nombre. Vous ne réécrivez pas à quelqu'un que vous avez relancé avant-hier.",
  },
];

export default function PageRelancesMrCRM() {
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
          LES RELANCES
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Savoir qui rappeler aujourd&apos;hui
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Vous ouvrez l&apos;outil, vous voyez qui attend une réponse et depuis quand. Une relance vous est proposée ; vous la relisez avant qu&apos;elle parte.
        </p>

        <h2 style={H2}>Comment cela se passe</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LA_RELANCE.map(function (b) {
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

        <h2 style={H2}>Rien ne part sans que vous l&apos;ayez lu</h2>
        <p style={P}>
          Avant un envoi en nombre, la liste des destinataires vous est
          montrée, avec pour chacun le nombre de relances déjà reçues. Vous
          voyez qui va recevoir quoi avant que cela parte.
        </p>
        <p style={P}>
          C&apos;est une règle de construction, pas une option : une relance
          en nombre ne se déclenche pas à l&apos;aveugle. Un envoi de trop à
          la mauvaise personne coûte plus qu&apos;un envoi manqué.
        </p>

        <h2 style={H2}>Ceux qu&apos;on ne relance pas</h2>
        <p style={P}>
          Les personnes désinscrites sont écartées, définitivement. Les
          fiches closes — client gagné, affaire perdue — sortent des
          relances : on ne relance pas quelqu&apos;un dont l&apos;histoire est
          terminée.
        </p>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir vos relances en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres contacts. Nous partons de votre liste du jour.
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
