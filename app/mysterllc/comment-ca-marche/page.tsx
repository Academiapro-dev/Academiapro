// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — COMMENT CA MARCHE — 23/09.
//
// POURQUOI ELLE EXISTE. La video de demonstration (25 minutes, le parcours
// complet de la creation d une LLC, tournee le 23/09) et sa synthese ecrite,
// etape par etape. C est la page qu on envoie a un prospect ou a un
// partenaire, et celle que la carte « La creation de votre LLC » de la page
// des fonctions ouvre.
//
// 🚨 ON NE PARLE QUE DE CE QUE L OUTIL FAIT. Regle de Jacques du 23/09 :
// « pas la peine d etre negatif ». Aucune rubrique « ce qu il ne fait pas ».
// La responsabilite du contenu declare figure dans chaque accuse que le
// client signe : elle n a pas a etre sur la vitrine.
//
// ⛔ AUCUN PRIX, AUCUNE COMMISSION, AUCUN NOM DE CLIENT, AUCUN TEMOIGNAGE.
// ⛔ AUCUNE PROMESSE SUR LA BANQUE : l ouverture d un compte se decide chez
// l etablissement, dossier par dossier.
//
// LA VIDEO. Hebergee sur YouTube. `VIDEO_YOUTUBE` porte son identifiant
// (les onze caracteres apres « v= » ou apres « youtu.be/ »). Vide, le bloc
// video ne s affiche pas et la page reste complete sans lui.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

// L identifiant YouTube de la video, en ligne depuis le 24/09 (non
// repertoriee) : https://youtu.be/VBw9hQ2XR5M
const VIDEO_YOUTUBE = "VBw9hQ2XR5M";

export const metadata = {
  title: "Comment ça marche — MysterLLC",
  description:
    "La création d'une LLC américaine en onze étapes, puis le suivi de ses obligations chaque année : la vidéo du parcours complet et sa synthèse.",
  alternates: {
    canonical: SITE + "/comment-ca-marche",
  },
  openGraph: {
    title: "Comment ça marche — MysterLLC",
    description:
      "De l'agent enregistré à la société active, puis chaque échéance de l'année : le parcours complet, en vidéo.",
    url: SITE + "/comment-ca-marche",
    siteName: "MysterLLC",
    locale: "fr_FR",
    type: "website",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// La banniere large 4:1, la meme que sur toutes les pages du site.
const BANNIERE = "/IMG_4723.jpeg";

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "22px 26px",
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
  margin: "52px 0 16px",
};

// LES ONZE ETAPES — dans l ordre et sous les noms du parcours de l outil.
const ETAPES = [
  {
    titre: "L'agent enregistré",
    texte:
      "Toute LLC désigne un agent dans son État : c'est l'adresse officielle où l'administration lui écrit. Vous le choisissez parmi les agents proposés.",
  },
  {
    titre: "Les statuts",
    texte:
      "Les Articles of Organization sont déposés auprès de l'État. La date et le numéro de dépôt sont conservés dans votre dossier.",
  },
  {
    titre: "La demande d'EIN",
    texte:
      "Le formulaire SS-4 de l'IRS, qui attribue à la société son numéro fiscal, est prérempli à partir de vos informations.",
  },
  {
    titre: "L'accusé à signer",
    texte:
      "Vous recevez par courriel un document à signer : votre attestation, suivie du SS-4 complet. Vous voyez exactement ce qui sera envoyé.",
  },
  {
    titre: "La signature",
    texte:
      "Vous lisez le document, tracez votre signature au doigt ou au stylet, et la validez avec un code reçu par courriel.",
  },
  {
    titre: "La transmission",
    texte:
      "Le SS-4 est transmis par fax à l'IRS, votre signature portée sur la ligne prévue du formulaire.",
  },
  {
    titre: "L'attente de l'IRS",
    texte: "L'IRS répond par fax, en principe sous quelques jours ouvrés.",
  },
  {
    titre: "L'EIN reçu",
    texte:
      "Le numéro est enregistré dans votre dossier et repris dans tous les documents qui suivent.",
  },
  {
    titre: "L'Operating Agreement",
    texte:
      "Le pacte de votre société, en anglais, est rédigé à partir de vos informations, puis signé en ligne comme le SS-4.",
  },
  {
    titre: "Le compte bancaire",
    texte:
      "Vous réunissez les pièces demandées. Des établissements comme Mercury ou Airwallex ouvrent couramment des comptes aux LLC détenues par des non-résidents, après examen de chaque dossier.",
  },
  {
    titre: "La société active",
    texte: "Vos échéances sont générées. Le suivi commence.",
  },
];

// LE SUIVI DE CHAQUE ANNEE.
// ⚠️ LES MONTANTS SONT CEUX DES TEXTES OFFICIELS, deja presents sur la
// vitrine et sources dans `compliance_rules`. Ne jamais en ajouter un sans
// sa source.
const SUIVI = [
  {
    titre: "Le Form 5472 et le 1120 pro forma",
    texte:
      "À déposer auprès de l'IRS, en principe avant le 15 avril ; l'omission est sanctionnée de 25 000 dollars par société et par an. Les deux formulaires sont préparés à partir des dépenses enregistrées, joints à un accusé de lecture, signés en ligne, puis transmis par fax.",
  },
  {
    titre: "Le Form 7004",
    texte:
      "Il accorde six mois de plus pour le dépôt, s'il est déposé avant l'échéance.",
  },
  {
    titre: "Le rapport annuel de l'État",
    texte:
      "Chaque État a ses règles : un rapport à date anniversaire, une taxe annuelle, ou aucune obligation. L'outil les déduit de l'État de votre société. Sept États sont suivis : Wyoming, Delaware, Nouveau-Mexique, Nevada, Floride, Texas et Montana.",
  },
  {
    titre: "Les autres obligations américaines",
    texte:
      "Le statut BOI auprès du FinCEN est suivi. Le W-8BEN-E est préparé quand un payeur le demande. La déclaration 1040-NR est signalée lorsqu'elle s'applique à votre situation.",
  },
  {
    titre: "Côté France",
    texte:
      "Le formulaire 3916, qui déclare les comptes détenus à l'étranger, est préparé. Les échéances françaises figurent dans le même agenda que les américaines.",
  },
];

export default function PageCommentCaMarche() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- LE MEME SUR TOUTES LES PAGES DU SITE. */}
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

      <main style={{ ...SECTION, paddingTop: "70px", paddingBottom: "70px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 14px" }}>
          MYSTERLLC — COMMENT ÇA MARCHE
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 20px", maxWidth: "780px" }}>
          De la création de votre LLC à chaque échéance de l&apos;année
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "17px",
          lineHeight: "1.8", maxWidth: "740px", margin: "0 0 40px" }}>
          MysterLLC accompagne la création et la vie administrative d&apos;une
          LLC américaine détenue depuis la France. Chaque document est préparé
          à partir de vos informations, signé en ligne, puis transmis. Chaque
          obligation — fédérale, d&apos;État ou française — apparaît dans un
          seul agenda, avec sa date.
        </p>

        {/* ---- LA VIDEO ---- Masquee tant que VIDEO_YOUTUBE est vide.
            youtube-nocookie : aucun cookie depose avant la lecture. */}
        {VIDEO_YOUTUBE && (
          <div style={{ ...CARTE, padding: "0", overflow: "hidden",
            marginBottom: "18px" }}>
            <div style={{ position: "relative", width: "100%",
              aspectRatio: "4 / 3", background: "#000" }}>
              <iframe
                src={"https://www.youtube-nocookie.com/embed/" + VIDEO_YOUTUBE + "?rel=0"}
                title="MysterLLC — la création d'une LLC de A à Z"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%",
                  height: "100%", border: 0 }}
              />
            </div>
          </div>
        )}
        {VIDEO_YOUTUBE && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px",
            margin: "0 0 10px" }}>
            Le parcours complet, écran par écran — 25 minutes. Ce qui suit le
            résume. La suite, les déclarations de chaque année, est aussi en
            vidéo :{" "}
            <a href={SITE + "/formulaires"} style={{ color: OR }}>
              les déclarations annuelles de A à Z
            </a>.
          </p>
        )}

        {/* ---- LA CREATION ---- */}
        <h2 style={H2}>La création, en onze étapes</h2>
        <p style={P}>
          Vous renseignez votre société une seule fois. Le chemin se déroule
          ensuite de lui-même, et chaque étape se coche quand elle est
          accomplie.
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          {ETAPES.map(function (e, i) {
            return (
              <div key={e.titre} style={{ ...CARTE, display: "flex",
                gap: "18px", alignItems: "flex-start" }}>
                <div style={{ color: OR, fontSize: "22px", lineHeight: 1.2,
                  minWidth: "28px", opacity: 0.8 }}>
                  {i + 1}
                </div>
                <div>
                  <strong style={{ color: "#fff", fontSize: "16px",
                    display: "block", marginBottom: "6px" }}>
                    {e.titre}
                  </strong>
                  <p style={{ color: "rgba(255,255,255,0.65)",
                    fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                    {e.texte}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- LES DOCUMENTS SIGNES ---- */}
        <h2 style={H2}>Vos documents signés</h2>
        <p style={P}>
          À tout moment, un bouton « Voir le document signé » vous montre le
          document tel que vous l&apos;avez signé, votre signature à sa place,
          suivi d&apos;un certificat de signature : date et heure, code
          vérifié, empreinte numérique du document. La signature est une
          signature électronique simple au sens du règlement européen eIDAS :
          elle est opposable entre les parties.
        </p>

        {/* ---- LE SUIVI ---- */}
        <h2 style={H2}>Le suivi, chaque année</h2>
        <p style={P}>
          Une LLC détenue par un non-résident a des obligations annuelles.
          MysterLLC les prépare et vous les rappelle.
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          {SUIVI.map(function (s) {
            return (
              <div key={s.titre} style={CARTE}>
                <strong style={{ color: "#fff", fontSize: "16px",
                  display: "block", marginBottom: "6px" }}>
                  {s.titre}
                </strong>
                <p style={{ color: "rgba(255,255,255,0.65)",
                  fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {s.texte}
                </p>
              </div>
            );
          })}
        </div>

        {/* ---- 🆕 24/09 — LA DEUXIEME VIDEO ---- Les declarations annuelles
            ont leur propre video, sur la page des formulaires. */}
        <a href={SITE + "/formulaires"}
          style={{ ...CARTE, display: "block", marginTop: "16px",
            textDecoration: "none", borderColor: "rgba(200,169,110,0.6)" }}>
          <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px",
            display: "block", marginBottom: "8px" }}>
            EN VIDÉO — 21 MINUTES
          </span>
          <strong style={{ color: "#fff", fontSize: "18px",
            display: "block", marginBottom: "8px" }}>
            Les déclarations annuelles de A à Z
          </strong>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px",
            lineHeight: "1.75", display: "block" }}>
            La fiche annuelle, la facture scannée, le 5472 et le 1120 signés et
            transmis à l&apos;IRS, puis le formulaire 3916 préparé et signé.
          </span>
          <span style={{ color: OR, fontSize: "15px", display: "block",
            marginTop: "10px" }}>
            Voir la vidéo &rarr;
          </span>
        </a>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "52px",
          borderColor: "rgba(200,169,110,0.45)", padding: "26px 28px" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir l&apos;outil sur votre propre société
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous déclarons votre société et
            déroulons ce qui en sort — parcours, agenda, formulaires.
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
            <a href={SITE + "/comment-ca-marche"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Comment ça marche</a>
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
