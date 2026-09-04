// ══════════════════════════════════════════════════════════════════════════
// MR LMS — LA SIGNATURE ELECTRONIQUE — 04/09.
//
// 🚨🚨 LA PAGE LA PLUS SENSIBLE DU SITE. Une phrase de trop ici engage la
// responsabilite de l editeur devant un tribunal.
//
// LA REGLE, SANS EXCEPTION : DESCRIPTION FACTUELLE, AUCUNE QUALIFICATION
// JURIDIQUE, AUCUN CONCURRENT NOMME. On decrit ce que la fonction PRODUIT —
// identite verifiee par courriel, code a six chiffres, trace manuscrit
// horodate, consentement scelle, empreinte cryptographique, chainage au
// registre. On precise « signature electronique simple, integree a la
// plateforme ». On renvoie a un prestataire agree pour un acte exigeant une
// signature qualifiee.
//
// ⛔ NE JAMAIS ECRIRE « juridiquement defendable ». Ni « valeur legale »,
// ni « opposable », ni « conforme eIDAS », ni « certifie ». Ces mots sont
// des affirmations de droit que nous ne sommes pas en position de faire.
//
// 🚨 LA SIGNATURE EST UN CADEAU, JAMAIS UN DU. Les lots compris avec la
// marque blanche ou le catalogue ne s annoncent JAMAIS sans le prix a
// cote — et le prix ne figure pas en vitrine. Donc AUCUNE MENTION DE LOT
// COMPRIS SUR CETTE PAGE : elle appartient au devis, ou les deux
// apparaissent ensemble.
// ⛔ NE PAS CHIFFRER LE CADEAU (« valeur 50 € »).
//
// ⚠️ « ATTESTATION DE FIN DE FORMATION », JAMAIS « CERTIFICATION ».
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU. Sur mrlms.fr, le middleware reecrit
// tout chemin non reserve vers /mrlms.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrlms.fr";
const LEGAL = "https://academiapro.fr";
const CONTACT = LEGAL + "/contact";

export const metadata = {
  title: "La signature électronique — Mr LMS",
  description:
    "Conventions, devis et attestations de fin de formation signés en ligne : identité vérifiée, code à six chiffres, tracé horodaté, dossier de preuve et registre.",
  alternates: {
    canonical: SITE + "/signature-electronique",
  },
  openGraph: {
    title: "La signature électronique — Mr LMS",
    description:
      "Ce que produit chaque signature : un dossier de preuve horodaté et une ligne au registre.",
    url: SITE + "/signature-electronique",
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

// LE CIRCUIT, DANS L ORDRE OU IL SE DEROULE. Chaque etape correspond a une
// etape reellement executee par le module de signature.
const CIRCUIT = [
  {
    rang: "1",
    titre: "Le document part",
    texte:
      "Vous choisissez le document et le destinataire. Un courriel part avec un lien qui n'ouvre que ce document-là.",
  },
  {
    rang: "2",
    titre: "Le signataire est identifié",
    texte:
      "L'adresse de courriel est vérifiée, puis un code à six chiffres est demandé. Sans ce code, la signature ne s'appose pas.",
  },
  {
    rang: "3",
    titre: "Il lit, puis il signe",
    texte:
      "Le document s'affiche en entier. La signature se trace au doigt ou à la souris, et l'heure est enregistrée.",
  },
  {
    rang: "4",
    titre: "Le consentement est scellé",
    texte:
      "Une empreinte cryptographique est calculée sur le document et sur les éléments de la signature. Toute modification ultérieure du document rend cette empreinte fausse.",
  },
  {
    rang: "5",
    titre: "La ligne rejoint le registre",
    texte:
      "Chaque signature s'inscrit au registre, chaînée à la précédente. Retirer ou modifier une ligne casse la chaîne, et cela se voit.",
  },
];

export default function PageSignatureMrLMS() {
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
          LA SIGNATURE ÉLECTRONIQUE
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Signer en ligne, et garder la trace
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Conventions, devis et attestations de fin de formation se signent
          depuis la plateforme. Chaque signature produit un dossier de preuve
          horodaté et une ligne au registre.
        </p>

        <h2 style={H2}>Comment cela se déroule</h2>
        <div style={{ display: "grid", gap: "12px", margin: "0 0 10px" }}>
          {CIRCUIT.map(function (e) {
            return (
              <div key={e.rang} style={{ ...CARTE, display: "flex",
                gap: "18px", alignItems: "flex-start" }}>
                <span style={{ color: OR, fontSize: "22px",
                  fontWeight: "bold", lineHeight: "1.2", flexShrink: 0,
                  minWidth: "24px" }}>
                  {e.rang}
                </span>
                <div>
                  <h3 style={{ color: "#fff", fontSize: "17px",
                    margin: "0 0 8px", lineHeight: "1.4" }}>
                    {e.titre}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.65)",
                    fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                    {e.texte}
                  </p>
                </div>
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

        {/* ---- LE CADRE, DIT SANS DETOUR ---- */}
        {/* 🚨 CE BLOC NE SE SUPPRIME PAS ET NE S ADOUCIT PAS. Il dit ce que
            la fonction est et ce qu elle n est pas. Un prospect qui
            decouvrirait cette limite apres avoir signe serait en droit de
            se retourner. */}
        <div style={{ ...CARTE, marginTop: "40px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "21px",
            margin: "0 0 14px" }}>
            De quel type de signature s&apos;agit-il
          </h2>
          <p style={{ ...P, margin: "0 0 14px" }}>
            Il s&apos;agit d&apos;une signature électronique simple, intégrée
            à la plateforme. Elle convient aux documents que vous échangez
            couramment avec vos stagiaires et vos financeurs.
          </p>
          <p style={{ ...P, margin: 0, color: "rgba(255,255,255,0.55)",
            fontSize: "15px" }}>
            Pour un acte qui exige une signature électronique qualifiée,
            adressez-vous à un prestataire agréé. Nous vous le dirons plutôt
            que de vous laisser le découvrir.
          </p>
        </div>

        {/* ---- APPEL ---- */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "20px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir une signature de bout en bout
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous envoyons un document, nous
            le signons, et nous ouvrons le dossier de preuve qui en résulte.
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
