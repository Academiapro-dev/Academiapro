import Link from "next/link";

export const metadata = {
  title: "Tenue, révision et clôture pour cabinets — Mr. Comptable",
  description:
    "Saisie, journaux, grand livre, balance, lettrage, immobilisations et provisions. Export FEC, verrouillage des périodes closes et traçabilité complète des modifications.",
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

// L INALTERABILITE EST UN ARGUMENT DE CONFORMITE, pas une fonction parmi
// d autres : c est ce que l administration verifie. Elle merite d etre dite
// clairement, avec ce qu elle implique concretement.
//
// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION.

export default function PageTenue() {
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
          La tenue, de la saisie à la clôture
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Tout ce qu'un dossier réclame entre le premier janvier et le bilan, dans un seul
          outil : les journaux, le grand livre, la balance, le lettrage, les
          immobilisations, les provisions et la clôture.
        </p>

        <h2 style={H2}>La saisie et les journaux</h2>
        <p style={P}>
          Saisie au kilomètre ou pièce par pièce, dans les journaux que vous définissez.
          Le grand livre et la balance se tiennent seuls, à jour à la seconde. Les
          écritures de paie s'intègrent depuis votre outil de paie.
        </p>

        <h2 style={H2}>Le lettrage</h2>
        <p style={P}>
          Comptes clients et fournisseurs se lettrent depuis un écran unique. Les
          correspondances évidentes sont proposées, les partielles se traitent à la main
          en conservant la trace du reste dû. Ce qui n'est pas lettré est ce qu'il faut
          relancer — la liste se tient toute seule.
        </p>

        <h2 style={H2}>Les immobilisations et les provisions</h2>
        <p style={P}>
          Chaque immobilisation porte son plan d'amortissement, ses dotations et, le cas
          échéant, sa sortie ou sa cession avec le résultat qui en découle. Les provisions
          se dotent et se reprennent en gardant l'historique de chaque mouvement.
        </p>

        <h2 style={H2}>La révision et la clôture</h2>
        <p style={P}>
          Les périodes closes se verrouillent : plus aucune écriture ne peut y être
          ajoutée ni modifiée. L'export FEC réglementaire se produit depuis le dossier, au
          format attendu par l'administration.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            L'INALTÉRABILITÉ N'EST PAS UNE OPTION
          </h3>
          <p style={{ ...P, margin: "0 0 12px", fontSize: "16px" }}>
            Une écriture validée ne se supprime pas. Elle se contre-passe, et la trace des
            deux demeure. C'est la règle, et le logiciel ne vous laisse pas y déroger même
            si vous le souhaitiez.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Les factures que vous émettez portent une numérotation continue garantie par
            la base elle-même : ni rupture, ni doublon, quelles que soient les
            manipulations.
          </p>
        </div>

        <h2 style={H2}>Qui a fait quoi</h2>
        <p style={P}>
          Chaque modification est enregistrée : l'auteur, l'instant, la valeur avant et la
          valeur après. Personne n'a à y penser, et le jour où la question se pose, la
          réponse existe.
        </p>

        <h2 style={H2}>Les droits, collaborateur par collaborateur</h2>
        <p style={P}>
          Saisir, valider, clôturer, déclarer, tenir le plan comptable, déposer des
          pièces : chaque droit s'accorde séparément. Un stagiaire saisit sans pouvoir
          clôturer, un client dépose ses pièces sans voir vos écritures.
        </p>
        <p style={P}>
          Et chaque dossier est cloisonné : un collaborateur ne voit que les dossiers
          auxquels il est rattaché.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Ouvrez un dossier d'essai</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Saisissez quelques écritures, verrouillez une période, produisez un FEC.
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
