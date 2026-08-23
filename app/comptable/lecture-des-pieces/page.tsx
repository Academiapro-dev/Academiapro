import Link from "next/link";

export const metadata = {
  title: "Lecture automatique des pièces comptables — Mr. Comptable",
  description:
    "Déposez la facture, elle se lit et se comptabilise. Indice de confiance champ par champ, imputation proposée d'après vos écritures passées, doublons refusés au dépôt.",
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
  { nom: "Devis et factures", href: "/comptable/facturation" },
  { nom: "Facturation récurrente", href: "/comptable/facturation-recurrente" },
  { nom: "Prévisionnel de trésorerie", href: "/comptable/tresorerie" },
];


// CE QUI EST ECRIT ICI EST EPROUVE, rien d autre. Le depot de pieces a ete
// refait le 13 aout : lecture enchainee au depot, formulaire sans exemples
// fantomes, empreinte SHA-256 verifiee AVANT l envoi au coffre. Les indices
// de confiance annonces sont ceux qui ont ete constates.
//
// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION.

export default function PageLectureDesPieces() {
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
          Vous déposez la facture, elle se lit
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Pas de second clic, pas d'écran intermédiaire. Le fichier arrive, la lecture
          s'enchaîne, et les champs vous sont présentés remplis — avec, en face de chacun,
          le degré de certitude avec lequel il a été lu.
        </p>

        <h2 style={H2}>Ce qui est lu, et comment</h2>
        <p style={P}>
          Le fournisseur, la date, la référence, le montant hors taxes, la TVA et le total.
          Sur un fichier structuré, ces valeurs sont reprises telles quelles : elles ne
          sont pas interprétées, elles sont lues. Sur un PDF ordinaire, la lecture est
          visuelle, et l'indice de confiance dépasse couramment 97 %.
        </p>
        <p style={P}>
          Cet indice s'affiche champ par champ. Vous savez immédiatement lequel mérite un
          regard, au lieu de tout relire par précaution.
        </p>

        <h2 style={H2}>L'imputation proposée</h2>
        <p style={P}>
          Le compte est suggéré d'après vos écritures passées sur ce fournisseur. Si vous
          le corrigez, la correction sert la fois suivante : le logiciel apprend vos
          habitudes de cabinet, pas celles d'un plan comptable théorique.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            LE DOUBLON EST REFUSÉ AU DÉPÔT
          </h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            L'empreinte du fichier est vérifiée avant l'envoi au coffre. Une pièce déjà
            présente sur le dossier est écartée sur-le-champ, avec le nom de celle qui
            existe déjà. Vous ne découvrez pas le doublon en révision.
          </p>
        </div>

        <h2 style={H2}>Le formulaire ne vous ment pas</h2>
        <p style={P}>
          Un champ vide est vide. Aucune valeur d'exemple en gris clair qu'on prendrait
          pour une saisie — c'est une source d'erreur que nous avons supprimée : un
          « 22,90 » affiché à titre d'exemple finit toujours par être validé par
          quelqu'un.
        </p>

        <h2 style={H2}>Où la pièce est conservée</h2>
        <p style={P}>
          Chaque document est archivé, rattaché à son écriture et à son dossier. Il se
          retrouve depuis l'écriture, et l'écriture se retrouve depuis le document. C'est
          ce qu'un auditeur demandera, et ce que votre client vous redemandera trois ans
          plus tard.
        </p>

        <h2 style={H2}>Ce que vous n'aurez plus à faire</h2>
        <p style={P}>
          Ressaisir un montant. Relire une facture entière pour vérifier un seul champ.
          Chercher quel compte vous aviez utilisé la dernière fois. Retrouver une pièce
          dans un dossier partagé.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Déposez une facture et jugez</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Prenez la moins lisible de vos factures fournisseur. C'est le meilleur essai
            possible. L'espace s'ouvre en une minute.
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
