import Link from "next/link";

export const metadata = {
  title: "TVA, liasse fiscale et télétransmission DGFiP — Mr. Comptable",
  description:
    "Déclarations de TVA, liasse fiscale et impôt sur les sociétés télétransmis depuis le dossier, sans ressaisie. Les accusés de réception remontent dans votre interface.",
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

// CE QUI EST ECRIT ICI EST EPROUVE. La teletransmission fonctionne : la
// liasse a ete creee et ouverte le 13 aout, entreprise pre-remplie, session
// ouverte sans ecran d inscription.
//
// NE JAMAIS NOMMER LE PARTENAIRE DE TELETRANSMISSION sur une page publique.
// La relation peut changer, la page resterait.
//
// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION.

export default function PageDeclarations() {
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
          Les déclarations partent du dossier, pas d'un autre portail
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          TVA, liasse fiscale, impôt sur les sociétés. La déclaration se construit sur vos
          écritures, se télétransmet depuis le dossier, et l'accusé de réception y revient.
          Aucune recopie dans une autre interface.
        </p>

        <h2 style={H2}>La TVA</h2>
        <p style={P}>
          La déclaration se prépare à partir des comptes de TVA du dossier, période par
          période. Vous voyez d'où vient chaque montant avant de valider — la déclaration
          n'est pas une boîte noire, c'est le reflet de vos écritures.
        </p>

        <h2 style={H2}>La liasse fiscale</h2>
        <p style={P}>
          La liasse se construit sur la balance de clôture. Les tableaux se remplissent
          seuls, et ce qui demande un arbitrage vous est présenté plutôt que deviné.
        </p>
        <p style={P}>
          La télétransmission part du dossier. Elle est assurée par un partenaire habilité
          auprès de l'administration, auquel nous nous raccordons : votre liasse arrive à
          la DGFiP sans que vous ayez à ouvrir un autre portail ni à ressaisir quoi que ce
          soit.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            LES REJETS SONT LISIBLES
          </h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Quand une déclaration est rejetée, le motif s'affiche en français, pas sous
            forme de code. Vous savez ce qui bloque et où corriger, sans avoir à
            interpréter un message technique.
          </p>
        </div>

        <h2 style={H2}>Les accusés de réception</h2>
        <p style={P}>
          Chaque envoi laisse sa trace dans le dossier : la date, le contenu transmis, le
          statut et l'accusé. Quand un client vous demandera si sa liasse est bien partie,
          la réponse sera dans son dossier.
        </p>

        <h2 style={H2}>L'impôt sur les sociétés</h2>
        <p style={P}>
          Le calcul s'appuie sur le résultat comptable et les retraitements que vous
          saisissez. Les acomptes et le solde suivent le même chemin que la liasse.
        </p>

        <h2 style={H2}>Ce que vous n'aurez plus à faire</h2>
        <p style={P}>
          Ouvrir un second logiciel pour télétransmettre. Recopier une liasse d'un outil
          dans un autre. Chercher un accusé de réception dans une boîte de messagerie.
          Décoder un message de rejet écrit pour une machine.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Voyez le chemin complet</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            De la balance à l'accusé de réception, sur un dossier d'essai.
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
