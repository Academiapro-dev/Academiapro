// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LES FORMULAIRES — 04/09, REECRITE LE 24/09.
//
// 🆕 24/09 — LA PAGE ETAIT EN RETARD SUR LE PRODUIT. Elle disait « vous
// deposez vous-meme », « nous ne transmettons rien a l administration »,
// alors que depuis septembre le 1120 et le 5472 partent a l IRS par fax une
// fois signes, et que le 3916 se prepare et se signe dans l outil. La video
// des declarations annuelles, filmee le 24/09, montrait l inverse de la page.
//
// CE QUE LA PAGE PORTE DESORMAIS : la video en haut, puis la synthese etape
// par etape, chaque etape renvoyant au chapitre de la video.
//
// 🚨 REGLE DE JACQUES (23/09) : SUR LE SITE, ON NE PARLE QUE DE CE QUE L OUTIL
// FAIT. Aucune rubrique « ce qu il ne fait pas ».
// ⛔ CE QUI RESTE INTERDIT : les promesses fausses — garantir l acceptation
// d un depot, se presenter comme un conseil juridique ou fiscal.
// ⚠️ LE BOI SE DEPOSE EN LIGNE SUR LE SITE DU FinCEN : l outil prepare la
// fiche. C est un fait, il se dit tel quel.
// ⚠️ TOUTE NOUVELLE PAGE PUBLIQUE DE mysterllc.com DOIT ENTRER DANS
// PAGES_PUBLIQUES_MYSTERLLC (components/NavBar.tsx) — celle-ci existe
// depuis le 04/09.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Les formulaires — MysterLLC",
  description:
    "Les formulaires officiels pré-remplis depuis la fiche de la société, signés électroniquement, et le 1120 avec le 5472 transmis à l'IRS par fax.",
  alternates: {
    canonical: SITE + "/formulaires",
  },
  openGraph: {
    title: "Les formulaires — MysterLLC",
    description:
      "Form 5472, 1120 pro forma, 7004 et formulaire 3916 : pré-remplis, signés, transmis. La vidéo de A à Z.",
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

// 🆕 24/09 — LA VIDEO DES DECLARATIONS ANNUELLES, non repertoriee sur YouTube.
// Lecteur youtube-nocookie ; laisser l identifiant vide masque le lecteur.
const VIDEO_YOUTUBE = "ESdhG4n4syk";

// Les etapes de la video, avec l instant de leur chapitre (en secondes).
const LES_ETAPES = [
  {
    t: 0,
    titre: "La fiche annuelle",
    texte:
      "Ce que l'outil sait déjà se remplit seul : nom, État et date de constitution, EIN, adresse. Vous saisissez une fois l'identité du membre, l'activité et l'actif de fin d'exercice. Cette seule fiche remplit le 5472, le 1120, le 7004 et le 3916.",
  },
  {
    t: 282,
    titre: "La facture scannée",
    texte:
      "Vous prenez la facture en photo : fournisseur, montant, date et catégorie se remplissent seuls. Marquée « avance personnelle », elle alimente le compte courant d'associé, qui est le montant déclaré au 5472.",
  },
  {
    t: 377,
    titre: "Le 5472 et le 1120",
    texte:
      "Générés en un clic sur les formulaires officiels de l'IRS, avec les avances de l'année et l'identité du membre.",
  },
  {
    t: 459,
    titre: "L'accusé de lecture et la signature",
    texte:
      "Le titulaire reçoit par courriel une attestation en français, suivie des deux formulaires. Il signe au doigt, confirme avec un code reçu par courriel, et sa signature est reportée sur la ligne « Signature of officer » du 1120, avec la date du jour.",
  },
  {
    t: 706,
    titre: "Le dépôt transmis à l'IRS",
    texte:
      "Une fois signés, le 1120 et le 5472 partent à l'IRS par fax, au numéro de l'instruction officielle. L'accusé de transmission est archivé au coffre de la société.",
  },
  {
    t: 817,
    titre: "Le 3916, pour un résident fiscal français",
    texte:
      "Le compte bancaire de la société s'enregistre une fois. Le formulaire n° 3916 sort pré-rempli, avec la fiche de préparation de la déclaration de revenus, envoyée par courriel.",
  },
  {
    t: 953,
    titre: "Les formulaires de l'exercice",
    texte:
      "Chaque formulaire reste consultable, avec sa version signée et son certificat de signature.",
  },
  {
    t: 1103,
    titre: "La signature du 3916",
    texte:
      "Même règle que pour le 1120 : une attestation, le formulaire joint à la suite, et la signature reportée sur sa ligne « Signature(s) », avec « Fait à …, le … ». Le document signé reste au coffre.",
  },
];

function minutes(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

const LES_FORMULAIRES = [
  {
    titre: "Form 5472 et 1120 pro forma",
    texte:
      "Pré-remplis, signés, puis transmis à l'IRS par fax. Dus au 15 avril : leur dépôt tardif ou omis expose à une pénalité de 25 000 USD par société et par an, qu'il y ait eu activité ou non.",
  },
  {
    titre: "Form 7004",
    texte:
      "L'extension de délai, accordée automatiquement pour six mois, à déposer avant l'échéance du 15 avril.",
  },
  {
    titre: "Formulaire 3916",
    texte:
      "Pour le membre résident fiscal français : le compte de la société déclaré, pré-rempli et signé, avec la fiche de préparation de la déclaration de revenus.",
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
      "La déclaration personnelle du membre, quand elle est due, suivie et rappelée à son échéance.",
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
          Pré-remplis, signés, transmis.
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Les formulaires officiels sortent remplis depuis la fiche de chaque société. Vous les relisez et vous les signez ; le 1120 et le 5472 partent à l&apos;IRS par fax, et l&apos;accusé de transmission est archivé.
        </p>

        {/* ---- 🆕 24/09 — LA VIDEO ---- 4:3, le format du tournage. */}
        {VIDEO_YOUTUBE && (
          <div style={{ position: "relative", width: "100%",
            aspectRatio: "4 / 3", borderRadius: "14px", overflow: "hidden",
            border: "1px solid rgba(200,169,110,0.35)", background: "#000",
            margin: "10px 0 8px" }}>
            <iframe
              src={"https://www.youtube-nocookie.com/embed/" + VIDEO_YOUTUBE + "?rel=0"}
              title="MysterLLC — les déclarations annuelles de A à Z"
              style={{ position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px",
          margin: "0 0 10px" }}>
          Les déclarations annuelles d&apos;une LLC, de A à Z : 21 minutes, en huit chapitres.
        </p>

        {/* ---- LA SYNTHESE, ETAPE PAR ETAPE ---- chaque etape ouvre la
            video a son chapitre. */}
        <h2 style={H2}>Étape par étape</h2>
        <div style={{ display: "grid", gap: "14px", margin: "0 0 10px" }}>
          {LES_ETAPES.map(function (e, i) {
            return (
              <div key={e.titre} style={CARTE}>
                <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px",
                  margin: "0 0 8px" }}>
                  ÉTAPE {i + 1}
                  {VIDEO_YOUTUBE && (
                    <>
                      {"  ·  "}
                      <a href={"https://www.youtube.com/watch?v=" + VIDEO_YOUTUBE + "&t=" + e.t + "s"}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: OR, textDecoration: "none" }}>
                        voir à {minutes(e.t)}
                      </a>
                    </>
                  )}
                </p>
                <h3 style={{ color: "#fff", fontSize: "18px",
                  margin: "0 0 10px", lineHeight: "1.4" }}>
                  {e.titre}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.7)",
                  fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  {e.texte}
                </p>
              </div>
            );
          })}
        </div>

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

        <h2 style={H2}>Ce que cela évite</h2>
        <p style={P}>
          Recopier chaque année les mêmes informations sur les mêmes
          formulaires, en espérant n&apos;avoir inversé aucun chiffre. L&apos;erreur de saisie sur un EIN ne se voit pas au
          moment où on la fait ; elle se voit quand l&apos;administration
          répond.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Une question sur votre société ?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Écrivez-nous : nous vous répondons sur votre situation. La création d&apos;une LLC, pas à pas, est aussi en vidéo sur la page{" "}
            <a href={SITE + "/comment-ca-marche"} style={{ color: OR }}>Comment ça marche</a>.
          </p>
          <a href={SITE + "/contact"}
            style={{ display: "inline-block",
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: FOND, padding: "15px 34px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Nous écrire
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
