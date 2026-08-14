import Link from "next/link";

export const metadata = {
  title: "Contact — Mr. Comptable",
  description:
    "Recevoir le tarif de Mr. Comptable, poser une question ou demander une démonstration. Réponse dans la journée.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// LA PAGE DE CONTACT DE MR. COMPTABLE.
//
// C est elle qui recoit le bouton « Recevoir le tarif » depuis la vitrine.
// Le tarif ne s affiche plus publiquement : cette page est donc le seul
// chemin vers lui, et chaque demande produit un prospect qualifie.
//
// LE LIEN MAILTO PLUTOT QU UN FORMULAIRE : un formulaire suppose une route,
// une table et une confirmation. Le courriel part de la messagerie du
// cabinet, arrive dans une boite qu on releve, et porte deja l adresse de
// reponse. On construira le formulaire quand le volume le justifiera.
//
// VOUVOIEMENT ET VOCABULAIRE COMPTABLE : Mr. Comptable ne tutoie jamais et
// ne parle jamais de formation.
const SUJETS = [
  {
    titre: "Recevoir le tarif",
    texte:
      "Un abonnement au cabinet et une ligne par dossier travaillé. Nous vous adressons le détail après un échange de quinze minutes, avec ce qui est compris et ce qui ne l'est pas.",
    objet: "Tarif Mr. Comptable",
    corps:
      "Bonjour,\n\nJe souhaite recevoir le tarif de Mr. Comptable.\n\n"
      + "Cabinet : \nNombre de collaborateurs : \nNombre de dossiers : \n"
      + "Logiciel actuel : \nTéléphone : \n\nMerci.",
  },
  {
    titre: "Demander une démonstration",
    texte:
      "Une heure, sur vos propres dossiers si vous le souhaitez. Nous montrons la tenue, le dépôt d'une pièce, le rapprochement bancaire et la télétransmission.",
    objet: "Démonstration Mr. Comptable",
    corps:
      "Bonjour,\n\nJe souhaite une démonstration de Mr. Comptable.\n\n"
      + "Cabinet : \nTéléphone : \nDisponibilités : \n\nMerci.",
  },
  {
    titre: "Reprendre un historique",
    texte:
      "Vous changez de logiciel et craignez de perdre vos écritures. Dites-nous d'où vous venez : nous vous indiquons ce qui se reprend et comment.",
    objet: "Reprise d'historique",
    corps:
      "Bonjour,\n\nJe souhaite savoir comment reprendre l'historique de mes dossiers.\n\n"
      + "Cabinet : \nLogiciel actuel : \nNombre de dossiers : \nTéléphone : \n\nMerci.",
  },
  {
    titre: "Une question précise",
    texte:
      "Sur une fonction, sur la facture électronique, sur la conformité de vos obligations. Nous répondons dans la journée.",
    objet: "Question — Mr. Comptable",
    corps: "Bonjour,\n\n",
  },
];

function lien(objet: string, corps: string) {
  return "mailto:contact@mrcomptable.fr?subject="
    + encodeURIComponent(objet)
    + "&body="
    + encodeURIComponent(corps);
}

export default function ContactComptable() {
  const section: any = {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px",
  };

  const bouton: any = {
    display: "inline-block",
    background: OR,
    color: NOIR,
    padding: "13px 26px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "15px",
  };

  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0" }}>
        <div style={{ ...section, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <Link href="/comptable" style={{ color: OR, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Comptable
          </Link>
          <nav style={{ display: "flex", gap: "22px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/comptable" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>L'offre</Link>
            <Link href="/comptable/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Blog</Link>
            <Link href="/connexion" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Se connecter</Link>
            <Link href="/comptable/inscription" style={{ ...bouton, padding: "11px 22px" }}>Ouvrir mon espace</Link>
          </nav>
        </div>
      </header>

      <section style={{ ...section, paddingTop: "70px", paddingBottom: "50px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          NOUS ÉCRIRE
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 20px", maxWidth: "720px" }}>
          Une adresse, une réponse dans la journée
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "17px", lineHeight: "1.8", maxWidth: "700px", margin: 0 }}>
          Choisissez ce qui vous amène : votre message part déjà rédigé, il ne vous
          reste qu'à compléter et à envoyer.
        </p>
      </section>

      <section style={{ ...section, paddingBottom: "60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
          {SUJETS.map((s) => (
            <div key={s.titre} style={carte}>
              <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 12px" }}>{s.titre}</h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.75", margin: "0 0 22px" }}>
                {s.texte}
              </p>
              <a href={lien(s.objet, s.corps)} style={bouton}>{s.titre}</a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...section, paddingBottom: "90px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "32px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
            NOS COORDONNÉES
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.85", margin: 0 }}>
            <a href="mailto:contact@mrcomptable.fr" style={{ color: OR, textDecoration: "none" }}>
              contact@mrcomptable.fr
            </a>
            <br />
            AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801, États-Unis
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14.5px", lineHeight: "1.8", margin: "16px 0 0" }}>
            Nous répondons aux messages reçus en semaine dans la journée. Si votre
            demande concerne un dossier en cours, précisez sa raison sociale : nous
            gagnerons un échange.
          </p>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "34px 0" }}>
        <div style={section}>
          <p style={{ color: OR, fontSize: "17px", margin: "0 0 8px" }}>Mr. Comptable</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Une marque d'AcadéMIA Pro LLC · contact@mrcomptable.fr · mrcomptable.fr
          </p>
          <p style={{ margin: "16px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/comptable" style={lienPied}>L'offre</Link>
            <Link href="/comptable/blog" style={lienPied}>Blog</Link>
            <Link href="/comptable/cgv" style={lienPied}>Conditions générales de vente</Link>
            <Link href="/comptable/mentions" style={lienPied}>Mentions légales</Link>
          </p>
        </div>
      </footer>

    </div>
  );
}
