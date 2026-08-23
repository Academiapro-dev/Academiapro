import Link from "next/link";

export const metadata = {
  title: "Devis, factures et avoirs avec Factur-X — Mr. Comptable",
  description:
    "Établissez vos devis, émettez vos notes d'honoraires, suivez les règlements. PDF avec toutes les mentions légales et XML Factur-X embarqué. Numérotation à l'émission, aucune facture émise modifiable.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

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

// VOUVOIEMENT, VOCABULAIRE COMPTABLE, AUCUNE MENTION DE FORMATION, AUCUN PRIX.

export default function PageFacturation() {
  const section: any = { maxWidth: "820px", margin: "0 auto", padding: "0 24px" };
  const carte: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "14px", padding: "26px 28px", marginBottom: "18px" };
  const bouton: any = { display: "inline-block", background: OR, color: NOIR, padding: "15px 30px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" };
  const lienMenu: any = { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" };
  const H2: any = { color: OR, fontSize: "22px", margin: "44px 0 16px" };
  const P: any = { color: "rgba(255,255,255,0.75)", fontSize: "16.5px", lineHeight: "1.85", margin: "0 0 16px" };
  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <Link href="/comptable" style={{ color: OR, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>Mr. Comptable</Link>
          <nav style={{ display: "flex", gap: "22px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/comptable" style={lienMenu}>L'offre</Link>
            <details style={{ position: "relative" }}>
              <summary style={{ ...lienMenu, cursor: "pointer", listStyle: "none" }}>Fonctionnalités ▾</summary>
              <div style={{ position: "absolute", top: "26px", left: 0, background: "#0d0d16", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "10px 0", minWidth: "250px", zIndex: 100 }}>
                {FONCTIONS.map((f) => (
                  <Link key={f.href} href={f.href} style={{ display: "block", padding: "9px 20px", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14.5px", whiteSpace: "nowrap" }}>{f.nom}</Link>
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
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>FONCTIONNALITÉ</p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          Vos honoraires, du devis au règlement, sans quitter la plateforme
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Le cabinet qui tient la comptabilité des autres facture souvent la sienne avec un
          outil à part. Ici, vos devis, vos notes d'honoraires et vos avoirs vivent au même
          endroit que vos dossiers.
        </p>

        <h2 style={H2}>Du devis à la facture</h2>
        <p style={P}>
          Lignes détaillées avec quantité, prix unitaire, remise et TVA par ligne. Un devis
          accepté se convertit en facture en un geste. Un avoir reprend la facture en
          négatif. Les règlements s'enregistrent et le reste dû se suit facture par
          facture.
        </p>

        <h2 style={H2}>Un PDF complet, et lisible par les machines</h2>
        <p style={P}>
          Toutes les mentions légales y figurent, y compris les pénalités de retard et
          l'indemnité forfaitaire de 40 € pour frais de recouvrement, que beaucoup de
          logiciels oublient. Le fichier XML Factur-X est embarqué dans le PDF : votre
          facture est prête pour la facturation électronique.
        </p>
        <p style={P}>
          L'envoi au client part directement depuis la plateforme, avec la facture en pièce
          jointe.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>TROIS RÈGLES QUE LE LOGICIEL NE LAISSE PAS CONTOURNER</h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Le numéro ne s'attribue qu'à l'émission. Une facture émise ne se modifie plus.
            Un document numéroté ne se supprime jamais. Ce n'est pas un réglage : c'est le
            droit, appliqué par construction.
          </p>
        </div>

        <h2 style={H2}>Et les impayés vous reviennent</h2>
        <p style={P}>
          Une note d'honoraires non réglée apparaît sur la ligne du client dans le CRM,
          avec un motif de relance prêt à partir. Vous n'avez pas à tenir un tableau à
          côté.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Émettez votre prochaine note d'honoraires ici</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            L'espace s'ouvre en une minute.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
            <Link href="/comptable/contact" style={{ ...bouton, background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.4)" }}>Recevoir le tarif</Link>
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
            {FONCTIONS.map((f) => (<Link key={f.href} href={f.href} style={lienPied}>{f.nom}</Link>))}
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
