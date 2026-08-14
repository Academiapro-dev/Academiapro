import Link from "next/link";

export const metadata = {
  title: "Facture électronique : ce que change la réforme pour les cabinets — Mr. Comptable",
  description:
    "Factur-X, plateformes agréées, calendrier de la réforme et lecture automatique des factures. Ce qu'un cabinet doit mettre en place, et ce que Mr. Comptable fait à sa place.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// UNE PAGE PAR FONCTIONNALITE, JAMAIS UNE ANCRE.
//
// Dix ancres sur la page d accueil se positionnent comme UNE SEULE adresse
// pour un moteur de recherche. Une page qui ne parle que de facture
// electronique se positionne sur « facture electronique cabinet comptable ».
// C est la seule facon de gagner du trafic sans acheter de liens.
//
// NE JAMAIS NOMMER LE PRESTATAIRE. Mr. Comptable est une solution
// compatible au sens de la reforme, pas une plateforme agreee. Nommer le
// partenaire sur une page publique nous engagerait sur son agrement.
//
// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION.

export default function PageFactureElectronique() {
  const section: any = {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px 28px",
    marginBottom: "18px",
  };

  const bouton: any = {
    display: "inline-block",
    background: OR,
    color: NOIR,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
  };

  const H2: any = {
    color: OR,
    fontSize: "22px",
    margin: "44px 0 16px",
  };

  const P: any = {
    color: "rgba(255,255,255,0.75)",
    fontSize: "16.5px",
    lineHeight: "1.85",
    margin: "0 0 16px",
  };

  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <Link href="/comptable" style={{ color: OR, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Comptable
          </Link>
          <nav style={{ display: "flex", gap: "22px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/comptable" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>L'offre</Link>
            <Link href="/comptable/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Blog</Link>
            <Link href="/comptable/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Contact</Link>
            <Link href="/comptable/inscription" style={{ ...bouton, padding: "11px 22px", fontSize: "15px" }}>Ouvrir mon espace</Link>
          </nav>
        </div>
      </header>

      <article style={{ ...section, paddingTop: "60px", paddingBottom: "80px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          FONCTIONNALITÉ
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          La facture électronique, sans ressaisie et sans écart
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Une facture électronique n'est ni un PDF envoyé par courriel, ni un document
          scanné. C'est un fichier structuré, que la machine lit sans avoir à
          l'interpréter. Cette distinction est toute la réforme, et c'est aussi ce qui
          fait gagner du temps à un cabinet.
        </p>

        <h2 style={H2}>Ce que la réforme impose, et quand</h2>
        <p style={P}>
          Au 1<sup>er</sup> septembre 2026, toute entreprise assujettie à la TVA doit être
          en mesure de <strong>recevoir</strong> des factures électroniques. L'obligation
          d'émettre arrive ensuite, selon la taille de l'entreprise.
        </p>
        <p style={P}>
          Concrètement, pour un cabinet, cela signifie que vos clients recevront des
          fichiers structurés là où ils recevaient des PDF. Si votre logiciel ne sait pas
          les lire, vous ressaisirez ce qu'une machine aurait pu reprendre sans erreur.
        </p>

        <h2 style={H2}>Ce que Mr. Comptable fait de ces fichiers</h2>
        <p style={P}>
          Quand une facture arrive au format Factur-X, le fournisseur, la date, la
          référence, le montant hors taxes, la TVA et le total sont repris tels qu'ils
          figurent dans le fichier. Aucune lecture visuelle, donc aucun écart possible
          entre ce qui est écrit et ce qui est comptabilisé.
        </p>
        <p style={P}>
          Quand la facture arrive en PDF simple — ce qui restera courant longtemps — elle
          est lue visuellement, avec un indice de confiance affiché champ par champ. Vous
          voyez immédiatement ce qui a été lu avec certitude et ce qui mérite un regard.
        </p>
        <p style={P}>
          Dans les deux cas, le compte d'imputation est proposé d'après vos écritures
          passées sur ce fournisseur. Vous validez, ou vous corrigez une fois — et la
          correction sert la fois suivante.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            UN DÉTAIL QUI COMPTE
          </h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Un même fichier ne peut pas être déposé deux fois sur un dossier. Son empreinte
            est vérifiée avant l'envoi : le doublon est refusé au moment du dépôt, pas
            découvert trois mois plus tard en révision.
          </p>
        </div>

        <h2 style={H2}>Notre position dans le dispositif</h2>
        <p style={P}>
          Mr. Comptable est une solution compatible au sens de la réforme, et non une
          plateforme agréée. Le transport des factures — leur émission vers l'annuaire,
          leur réception, les statuts obligatoires — est assuré par une plateforme agréée
          à laquelle nous nous raccordons.
        </p>
        <p style={P}>
          Cette distinction est importante et nous la disons franchement : vous restez
          libre de votre plateforme, et Mr. Comptable lit ce qui en sort.
        </p>

        <h2 style={H2}>Ce que vous n'aurez plus à faire</h2>
        <p style={P}>
          Ressaisir une facture reçue. Vérifier à la main qu'un montant lu correspond au
          montant écrit. Retrouver quel compte vous aviez utilisé la dernière fois pour ce
          fournisseur. Découvrir un doublon en fin d'exercice.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Voyez-le sur vos propres factures</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Déposez une facture Factur-X et une facture PDF, et comparez ce qui est lu.
            L'espace s'ouvre en une minute.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
            <Link href="/comptable/contact" style={{ ...bouton, background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.4)" }}>
              Recevoir le tarif
            </Link>
          </div>
        </div>
      </article>

      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "34px 0" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
          <p style={{ color: OR, fontSize: "17px", margin: "0 0 8px" }}>Mr. Comptable</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Une marque d'AcadéMIA Pro LLC · contact@mrcomptable.fr · mrcomptable.fr
          </p>
          <p style={{ margin: "16px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/comptable" style={lienPied}>L'offre</Link>
            <Link href="/comptable/blog" style={lienPied}>Blog</Link>
            <Link href="/comptable/contact" style={lienPied}>Contact</Link>
            <Link href="/comptable/cgv" style={lienPied}>Conditions générales de vente</Link>
            <Link href="/comptable/mentions" style={lienPied}>Mentions légales</Link>
          </p>
        </div>
      </footer>

    </div>
  );
}
