import Link from "next/link";

export const metadata = {
  title: "Prévisionnel de trésorerie sur douze semaines — Mr. Comptable",
  description:
    "Douze semaines de trésorerie, calculées depuis les écritures. Le certain d'un côté, l'estimé de l'autre, et le creux repéré à l'avance. Pour chaque dossier client.",
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

export default function PageTresorerie() {
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
          Douze semaines devant vous, et le creux repéré avant qu'il n'arrive
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Le prévisionnel de trésorerie ne demande aucune saisie : il se calcule depuis
          les écritures du dossier, au moment où vous l'ouvrez.
        </p>

        <h2 style={H2}>Le certain d'un côté, l'estimé de l'autre</h2>
        <p style={P}>
          Certain : les factures émises avec leur échéance, les créances et les dettes
          comptabilisées, la TVA à décaisser. Estimé : les charges récurrentes, calculées
          sur la moyenne des six derniers mois — loyers, assurances, honoraires, salaires,
          charges sociales. La courbe distingue les deux ; vous savez toujours ce qui est
          acquis et ce qui est projeté.
        </p>

        <h2 style={H2}>Le creux</h2>
        <p style={P}>
          C'est la semaine où la trésorerie passe au plus bas. Il est signalé en premier,
          parce que c'est la seule information que le dirigeant veut vraiment : quand, et
          de combien. Vous pouvez l'appeler avant, pas après.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>SEMAINE PAR SEMAINE</h3>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            La courbe est cliquable. Chaque semaine s'ouvre sur son détail : les
            encaissements attendus, les décaissements prévus, et d'où vient chaque ligne.
          </p>
        </div>

        <h2 style={H2}>Ce que cela change pour vos clients</h2>
        <p style={P}>
          Un rendez-vous de conseil qui s'appuie sur des chiffres, pas sur une impression.
          Et une mission de plus que vous pouvez proposer sans un outil supplémentaire.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Ouvrez-le sur votre client le plus tendu</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Celui qui vous appelle quand c'est déjà trop tard. L'espace s'ouvre en une minute.
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
