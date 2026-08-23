import Link from "next/link";

export const metadata = {
  title: "Relance automatique des justificatifs manquants — Mr. Comptable",
  description:
    "La plateforme repère les écritures sans pièce, écrit au client avec la liste des factures attendues et un lien pour les déposer. Vous relisez, vous ne relancez plus.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// LE MENU DES FONCTIONNALITES VIT SUR CHAQUE PAGE, PAS SEULEMENT SUR
// L ACCUEIL. Sans lui, un lecteur arrive sur une fonctionnalite et ne peut
// plus passer a la suivante sans revenir en arriere.
//
// 🚨 MEME LISTE SUR TOUTES LES PAGES DE app/comptable. Une entree ajoutee
// ici doit l etre partout, sinon la page nouvelle reste introuvable.
const FONCTIONS = [
  { nom: "Facture électronique", href: "/comptable/facture-electronique" },
  { nom: "Rapprochement bancaire", href: "/comptable/rapprochement-bancaire" },
  { nom: "Lecture des pièces", href: "/comptable/lecture-des-pieces" },
  { nom: "Tenue et révision", href: "/comptable/tenue" },
  { nom: "Déclarations et liasse", href: "/comptable/declarations" },
  { nom: "Relance des justificatifs", href: "/comptable/relance-justificatifs" },
  { nom: "CRM et relances", href: "/comptable/crm" },
  { nom: "Facturation récurrente", href: "/comptable/facturation-recurrente" },
  { nom: "Prévisionnel de trésorerie", href: "/comptable/tresorerie" },
];

// C EST LA FONCTION QUI PARLE LE PLUS AU METIER. Un cabinet ne cherche pas
// « logiciel de comptabilite » quand il en a assez : il cherche comment ne
// plus courir apres les justificatifs. La page se tient donc du cote de la
// corvee, pas du cote de la fonction.
//
// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION.

export default function PageRelanceJustificatifs() {
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

  const lienMenu: any = { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" };

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
            <Link href="/comptable" style={lienMenu}>L'offre</Link>

            <details style={{ position: "relative" }}>
              <summary style={{ ...lienMenu, cursor: "pointer", listStyle: "none" }}>
                Fonctionnalités ▾
              </summary>
              <div style={{
                position: "absolute",
                top: "26px",
                left: 0,
                background: "#0d0d16",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "10px",
                padding: "10px 0",
                minWidth: "250px",
                zIndex: 100,
              }}>
                {FONCTIONS.map((f) => (
                  <Link
                    key={f.href}
                    href={f.href}
                    style={{ display: "block", padding: "9px 20px", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14.5px", whiteSpace: "nowrap" }}
                  >
                    {f.nom}
                  </Link>
                ))}
              </div>
            </details>

            <Link href="/comptable/blog" style={lienMenu}>Blog</Link>
            <Link href="/comptable/contact" style={lienMenu}>Contact</Link>
            <Link href="/comptable/inscription" style={{ ...bouton, padding: "11px 22px", fontSize: "15px" }}>Ouvrir mon espace</Link>
          </nav>
        </div>
      </header>

      <article style={{ ...section, paddingTop: "60px", paddingBottom: "80px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          FONCTIONNALITÉ
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          Vous ne courez plus après les justificatifs : ils arrivent
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          C'est la corvée que personne ne facture et que tout le monde subit. Chaque mois,
          la même liste, les mêmes clients, les mêmes relances écrites à la main. La
          plateforme s'en charge.
        </p>

        <h2 style={H2}>Ce qui se passe, sans que vous fassiez rien</h2>
        <p style={P}>
          Chaque mois, les écritures sans pièce sont repérées, dossier par dossier. La
          plateforme écrit au client concerné, avec la liste exacte des factures attendues
          — fournisseur, date, montant — et un lien pour les déposer.
        </p>
        <p style={P}>
          Le client dépose depuis son téléphone ou son ordinateur, sans avoir de compte à
          créer ni de mot de passe à retenir. La pièce arrive rattachée à la bonne
          écriture, dans le bon dossier.
        </p>

        <h2 style={H2}>Vous relisez, vous ne relancez plus</h2>
        <p style={P}>
          Votre travail change de nature : au lieu d'écrire dix courriels, vous regardez ce
          qui est rentré et ce qui manque encore. La liste des manquants se tient toute
          seule, et elle est juste, parce qu'elle vient des écritures.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            CE QUE VOTRE CLIENT REÇOIT
          </h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Un message clair, à l'en-tête de votre cabinet, qui dit précisément quelles
            pièces manquent et pourquoi elles sont nécessaires. Pas une relance
            automatique anonyme : une demande précise à laquelle il peut répondre en deux
            minutes.
          </p>
        </div>

        <h2 style={H2}>Le dépôt du client</h2>
        <p style={P}>
          Le fichier déposé est lu immédiatement : fournisseur, date, montants. Il ne peut
          pas être déposé deux fois — l'empreinte est vérifiée avant l'envoi, et le doublon
          est refusé sur-le-champ.
        </p>
        <p style={P}>
          Votre client ne voit que son propre espace : ni vos écritures, ni les dossiers
          des autres.
        </p>

        <h2 style={H2}>Ce que cela vaut en fin d'exercice</h2>
        <p style={P}>
          Une révision où les pièces sont là. Pas de dernière semaine passée à réclamer
          douze mois de justificatifs, pas de charge refusée faute de facture, pas de
          discussion pénible avec un client qui ne se souvient plus.
        </p>

        <h2 style={H2}>Ce que vous n'aurez plus à faire</h2>
        <p style={P}>
          Écrire la même relance chaque mois. Tenir la liste des manquants dans un tableur.
          Rattacher à la main une pièce reçue par courriel. Découvrir en décembre ce qui
          manquait en février.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Essayez sur votre dossier le plus pénible</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Celui dont vous n'obtenez jamais les pièces. C'est le meilleur essai possible.
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
          <p style={{ margin: "20px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {FONCTIONS.map((f) => (
              <Link key={f.href} href={f.href} style={lienPied}>{f.nom}</Link>
            ))}
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
