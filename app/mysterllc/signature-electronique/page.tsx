// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LA SIGNATURE ELECTRONIQUE — 04/09.
//
// 🚨🚨 LA PAGE LA PLUS SENSIBLE DU SITE. Une phrase de trop engage la
// responsabilite de l editeur devant un tribunal.
//
// DESCRIPTION FACTUELLE, AUCUNE QUALIFICATION JURIDIQUE, AUCUN CONCURRENT
// NOMME. On decrit ce que la fonction produit — identite verifiee par
// courriel, code a six chiffres, trace manuscrit horodate, consentement
// scelle, empreinte cryptographique, chainage au registre. On precise
// « signature electronique simple, integree a l outil ». On renvoie a un
// prestataire agree pour un acte exigeant une signature qualifiee.
//
// ⛔ NE JAMAIS ECRIRE « juridiquement defendable », « valeur legale »,
// « opposable », « conforme eIDAS » ni « certifie ».
//
// ⚠️ ATTENTION PARTICULIERE ICI : le module sert a faire signer des mandats
// et des documents entre un gestionnaire et SES clients. Ne rien laisser
// entendre sur la valeur de ces actes au regard du droit americain.
//
// ⛔ AUCUN PRIX, aucun lot compris : cela appartient au devis.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "La signature électronique — MysterLLC",
  description:
    "Faire signer un document en ligne : identité vérifiée, code à six chiffres, tracé horodaté, dossier de preuve et registre chaîné.",
  alternates: {
    canonical: SITE + "/signature-electronique",
  },
  openGraph: {
    title: "La signature électronique — MysterLLC",
    description:
      "Ce que produit chaque signature : un dossier de preuve horodaté et une ligne au registre.",
    url: SITE + "/signature-electronique",
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

const LE_CIRCUIT = [
  {
    titre: "1. Le document part",
    texte:
      "Vous choisissez le document et le destinataire. Un courriel part avec un lien qui n'ouvre que ce document-là.",
  },
  {
    titre: "2. Le signataire est identifié",
    texte:
      "L'adresse de courriel est vérifiée, puis un code à six chiffres est demandé. Sans ce code, la signature ne s'appose pas.",
  },
  {
    titre: "3. Il lit, puis il signe",
    texte:
      "Le document s'affiche en entier. La signature se trace au doigt ou à la souris, et l'heure est enregistrée.",
  },
  {
    titre: "4. Le consentement est scellé",
    texte:
      "Une empreinte cryptographique est calculée sur le document et sur les éléments de la signature. Toute modification ultérieure rend cette empreinte fausse.",
  },
  {
    titre: "5. La ligne rejoint le registre",
    texte:
      "Chaque signature s'inscrit au registre, chaînée à la précédente. Retirer ou modifier une ligne casse la chaîne, et cela se voit.",
  },
];

export default function PageSignatureMysterLLC() {
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
          LA SIGNATURE ÉLECTRONIQUE
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Faire signer, et garder la trace
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Mandats, lettres de mission et documents se signent en ligne. Chaque signature produit un dossier de preuve horodaté et une ligne au registre.
        </p>

        <h2 style={H2}>Comment cela se déroule</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LE_CIRCUIT.map(function (b) {
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

        <h2 style={H2}>Ce que contient le dossier de preuve</h2>
        <p style={P}>
          Le document signé, l&apos;adresse de courriel vérifiée, l&apos;heure
          de chaque étape, le tracé manuscrit, et l&apos;empreinte
          cryptographique calculée sur l&apos;ensemble. Ces éléments restent
          consultables depuis le registre, à tout moment.
        </p>

        <h2 style={H2}>Retrouver une signature</h2>
        <p style={P}>
          Le registre liste les documents envoyés, ceux qui attendent une
          signature et ceux qui sont signés. Vous ouvrez une ligne et vous
          voyez ce qui a été signé, par qui, et quand.
        </p>

        {/* ---- LE CADRE, DIT SANS DETOUR ----
            🚨 CE BLOC NE SE SUPPRIME PAS ET NE S ADOUCIT PAS. */}
        <div style={{ ...CARTE, marginTop: "40px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "21px",
            margin: "0 0 14px" }}>
            De quel type de signature s&apos;agit-il
          </h2>
          <p style={{ ...P, margin: "0 0 14px" }}>
            Il s&apos;agit d&apos;une signature électronique simple, intégrée
            à l&apos;outil. Elle convient aux documents que vous échangez
            couramment avec vos clients.
          </p>
          <p style={{ ...P, margin: 0, color: "rgba(255,255,255,0.55)",
            fontSize: "15px" }}>
            Pour un acte qui exige une signature électronique qualifiée,
            adressez-vous à un prestataire agréé. Nous vous le dirons plutôt
            que de vous laisser le découvrir.
          </p>
        </div>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir une signature de bout en bout
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous envoyons un document, nous le signons, et nous ouvrons le dossier de preuve qui en résulte.
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
