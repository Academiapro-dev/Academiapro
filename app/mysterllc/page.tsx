import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// LA VITRINE MYSTERLLC — 31/08.
//
// A QUI ELLE PARLE. Pas au proprietaire d une LLC, mais a CELUI QUI EN GERE
// PLUSIEURS pour le compte d autrui : le prestataire qui cree des societes
// pour des expatries, ouvre leurs comptes bancaires, domicilie leurs
// adresses. Son probleme n est pas de comprendre le Form 5472 — il le
// connait — c est de ne jamais en oublier un sur un portefeuille qui
// grossit.
//
// ⚠️ CE QUI N EST PAS ECRIT ICI, ET POURQUOI. Aucun chiffre invente, aucun
// temoignage, aucune mention de clients existants : le produit sort
// aujourd hui. Chaque phrase a ete relue du point de vue de quelqu un qui
// cherche une raison de ne pas signer.
//
// ⚠️ LE PRIX N EST PAS AFFICHE. Il se fixe au vu de la taille du
// portefeuille, et l ancrer d avance ferait perdre l information que le
// prospect donne lui-meme en decrivant son besoin.
//
// ⚠️ LE CRM EST ANNONCE AU FUTUR, SANS DATE. Decision de Jacques du 31/08.
// « Prochainement » n engage sur aucun mois ; une date tenue serait une
// dette de plus.
//
// LE MIDDLEWARE sert cette page sur la racine de mysterllc.com. La NavBar
// s efface ici : la banniere du logo tient lieu d en-tete.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const NUIT = "#050508";
const BANNIERE = "/IMG_4723.jpeg";

export const metadata: Metadata = {
  title: "MysterLLC — vos LLC en règle, sans y penser",
  description:
    "Le suivi des obligations américaines pour les gestionnaires de LLC : "
    + "portefeuille, agenda des échéances, formulaires IRS pré-remplis et "
    + "relances automatiques.",
  // ⚠️ LES IMAGES OPEN GRAPH SONT REPETEES AU NIVEAU DE LA PAGE. Une
  // declaration openGraph au niveau page remplace ENTIEREMENT celle du
  // layout parent : ne pas les redonner ici laisserait les partages sans
  // aperçu.
  openGraph: {
    title: "MysterLLC — vos LLC en règle, sans y penser",
    description:
      "Le suivi des obligations américaines pour les gestionnaires de LLC.",
    url: "https://mysterllc.com",
    siteName: "MysterLLC",
    images: [{ url: "https://mysterllc.com" + BANNIERE, width: 1200, height: 300 }],
    locale: "fr_FR",
    type: "website",
  },
  alternates: { canonical: "https://mysterllc.com" },
};

// Une obligation suivie par l outil. Le libelle dit CE QUI EST EN JEU, pas
// seulement le nom du formulaire : c est l enjeu qui fait agir.
const OBLIGATIONS = [
  {
    nom: "Form 5472 + 1120 pro forma",
    quand: "15 avril",
    enjeu:
      "25 000 USD par société et par an en cas de dépôt tardif ou omis — "
      + "que la société ait eu une activité ou non.",
  },
  {
    nom: "Form 7004",
    quand: "avant le 15 avril",
    enjeu:
      "Six mois de délai supplémentaire, accordés automatiquement. Déposé "
      + "après l'échéance, il ne vaut plus rien.",
  },
  {
    nom: "BOI FinCEN",
    quand: "selon la date de constitution",
    enjeu:
      "Déclaration des bénéficiaires effectifs, à déposer en ligne. "
      + "L'outil prépare la fiche, vous déposez.",
  },
  {
    nom: "Annual Report",
    quand: "date anniversaire",
    enjeu:
      "Propre à l'État de constitution. Son oubli répété mène à la "
      + "dissolution administrative de la société.",
  },
  {
    nom: "W-8BEN-E",
    quand: "à la demande du payeur",
    enjeu:
      "Sans lui, une retenue à la source de 30 % s'applique sur les "
      + "paiements de source américaine.",
  },
  {
    nom: "1040-NR",
    quand: "15 avril ou 15 juin",
    enjeu:
      "Déclaration personnelle du membre lorsqu'elle est due. Suivie et "
      + "relancée, elle reste préparée par vous.",
  },
];

const ETAPES = [
  {
    titre: "Vous déclarez la société",
    texte:
      "État de constitution, date, résidence du membre, EIN. L'outil en "
      + "déduit les obligations qui s'appliquent — et seulement celles-là.",
  },
  {
    titre: "L'agenda se remplit tout seul",
    texte:
      "Toutes les échéances du portefeuille sur un seul écran, classées par "
      + "date et non par société. Ce qui tombe en premier se lit en premier.",
  },
  {
    titre: "Les formulaires sortent pré-remplis",
    texte:
      "Les PDF officiels de l'IRS, remplis depuis la fiche de la société. "
      + "Vous relisez, vous signez, vous déposez.",
  },
  {
    titre: "Les relances partent si vous les armez",
    texte:
      "Cinq paliers, de soixante jours à la veille. Rien ne part sans votre "
      + "accord, société par société.",
  },
];

export default function VitrineMysterLLC() {
  const section = {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "70px 24px",
  } as any;

  const h2 = {
    color: "#fff",
    fontFamily: "Georgia,serif",
    fontSize: "1.9rem",
    marginBottom: "12px",
  } as any;

  const chapo = {
    color: "rgba(255,255,255,0.55)",
    fontSize: "15px",
    lineHeight: "1.8",
    marginBottom: "38px",
    maxWidth: "680px",
  } as any;

  const carte = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px",
  } as any;

  return (
    <div style={{ backgroundColor: NUIT, minHeight: "100vh", color: "#fff" }}>

      {/* ---- EN-TETE : LA BANNIERE TIENT LIEU DE LOGO ET DE TITRE ---- */}
      <header style={{ background: "#000", padding: "0 24px", textAlign: "center" }}>
        <img
          src={BANNIERE}
          alt="MysterLLC — vos LLC en règle, sans y penser"
          style={{ width: "760px", maxWidth: "100%", height: "auto", display: "inline-block" }}
        />
      </header>

      {/* ---- LA PROMESSE ---- */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", marginBottom: "18px" }}>
          POUR LES GESTIONNAIRES DE LLC
        </p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.6rem", lineHeight: "1.25", marginBottom: "22px" }}>
          Vous gérez leurs sociétés.<br />Nous surveillons leurs échéances.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: "1.85", maxWidth: "660px", margin: "0 auto 34px" }}>
          Chaque LLC que vous administrez porte ses propres obligations
          américaines, à des dates différentes, selon son État et la
          résidence de son membre. MysterLLC les tient à jour pour tout
          votre portefeuille, et prépare les formulaires.
        </p>
        <a
          href="mailto:contact@mysterllc.com?subject=MysterLLC%20—%20demande%20de%20présentation"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#c8a96e,#a07840)",
            color: NUIT,
            padding: "15px 38px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Demander une présentation
        </a>
      </div>

      {/* ---- LE PROBLEME, DIT SANS DETOUR ---- */}
      <div style={section}>
        <h2 style={h2}>Une échéance oubliée coûte plus cher que tout le reste</h2>
        <p style={chapo}>
          Le Form 5472 est dû au 15 avril. Son dépôt tardif ou omis expose à
          une pénalité de 25 000 USD par société et par an — elle n'est pas
          proportionnelle au chiffre d'affaires : une société sans activité
          la paie comme une autre. Sur dix sociétés, l'oubli d'une seule
          suffit.
        </p>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.9", margin: 0 }}>
            Le problème n'est pas de connaître ces obligations : vous les
            connaissez. Le problème est qu'elles se multiplient par le nombre
            de sociétés, tombent à des dates différentes, et qu'un tableur ne
            prévient personne.
          </p>
        </div>
      </div>

      {/* ---- CE QUI EST SUIVI ---- */}
      <div style={{ background: "rgba(255,255,255,0.02)" }}>
        <div style={section}>
          <h2 style={h2}>Ce que l'outil suit</h2>
          <p style={chapo}>
            Les obligations s'appliquent selon la situation de chaque société.
            Une LLC du Delaware à membre expatrié ne verra jamais d'échéance
            fiscale française ; une société du Wyoming verra son Annual
            Report, les autres non.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "18px" }}>
            {OBLIGATIONS.map((o) => (
              <div key={o.nom} style={carte}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                  <strong style={{ color: OR, fontSize: "15.5px" }}>{o.nom}</strong>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", whiteSpace: "nowrap" }}>{o.quand}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                  {o.enjeu}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- COMMENT CA MARCHE ---- */}
      <div style={section}>
        <h2 style={h2}>Comment cela se passe</h2>
        <p style={chapo}>
          Quatre gestes, dont trois se font une seule fois par société.
        </p>
        <div style={{ display: "grid", gap: "16px" }}>
          {ETAPES.map((e, i) => (
            <div key={e.titre} style={{ ...carte, display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ color: OR, fontFamily: "Georgia,serif", fontSize: "26px", lineHeight: 1, flexShrink: 0, opacity: 0.7 }}>
                {i + 1}
              </div>
              <div>
                <strong style={{ color: "#fff", fontSize: "16px", display: "block", marginBottom: "7px" }}>
                  {e.titre}
                </strong>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
                  {e.texte}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- CE QUI EST DIT FRANCHEMENT ---- */}
      <div style={{ background: "rgba(255,255,255,0.02)" }}>
        <div style={section}>
          <h2 style={h2}>Ce que l'outil ne fait pas</h2>
          <p style={chapo}>
            Autant le dire tout de suite : la limite fait partie de l'offre.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "18px" }}>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Il ne dépose rien à votre place
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                Les formulaires sortent pré-remplis ; la relecture, la
                signature et le dépôt restent les vôtres. C'est vous qui
                engagez votre responsabilité, pas un automate.
              </p>
            </div>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Il ne remplit pas le W-8BEN-E
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                Son remplissage dépend d'un statut FATCA que l'outil ne
                connaît pas. Un formulaire à moitié faux, signé sous peine de
                parjure, serait pire qu'un formulaire vierge : vous recevez
                une fiche de préparation.
              </p>
            </div>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Il n'est pas un conseil fiscal
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                MysterLLC suit des échéances et prépare des documents. La
                qualification d'une situation particulière relève de votre
                jugement ou de celui d'un CPA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- CE QUI ARRIVE ---- */}
      <div style={section}>
        <h2 style={h2}>Prochainement</h2>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.35)" }}>
          <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
            Un CRM intégré
          </strong>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "14.5px", lineHeight: "1.85", margin: 0 }}>
            Le suivi de vos échanges avec chaque client rattaché à sa société :
            relances commerciales, historique, pièces reçues. Il rejoindra le
            portefeuille et l'agenda dans une prochaine version.
          </p>
        </div>
      </div>

      {/* ---- LE CONTACT ---- */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "18px" }}>
          Parlons de votre portefeuille
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15.5px", lineHeight: "1.85", maxWidth: "600px", margin: "0 auto 32px" }}>
          La tarification dépend du nombre de sociétés suivies. Écrivez-nous
          en indiquant combien vous en gérez : nous vous répondons avec une
          proposition et une présentation de l'outil.
        </p>
        <a
          href="mailto:contact@mysterllc.com?subject=MysterLLC%20—%20demande%20de%20présentation"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#c8a96e,#a07840)",
            color: NUIT,
            padding: "15px 38px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "22px",
          }}
        >
          contact@mysterllc.com
        </a>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>
          Déjà client ? <a href="/connexion" style={{ color: OR }}>Accéder à votre espace</a>
        </p>
      </div>

      {/* ---- PIED DE PAGE ---- */}
      <footer style={{ background: "#000", padding: "34px 24px", textAlign: "center", borderTop: "1px solid rgba(200,169,110,0.15)" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12.5px", lineHeight: "1.9", margin: 0 }}>
          MysterLLC est un service édité par ACADÉMIA PRO LLC — 30 N Gould St,
          Sheridan, WY 82801, États-Unis.<br />
          Les montants et échéances cités sont ceux en vigueur à la date de
          publication et ne constituent pas un conseil fiscal.
        </p>
      </footer>

    </div>
  );
}
