// ══════════════════════════════════════════════════════════════════════════
// LA VITRINE DE MR CRM — 03/09.
//
// CIBLE : les particuliers ET les entreprises. Une seule page, centree sur
// le besoin commun — savoir qui rappeler et quoi lui dire — plutot que deux
// entrees qui obligeraient le visiteur a se ranger dans une case avant
// meme d avoir compris ce qu on lui propose.
//
// 🚨 AUCUN PRIX SUR CETTE PAGE. Le tarif se donne apres l echange, jamais
// avant. La grille vit dans la table `tarifs` (produit = 'crm') et n est
// lue que par le devis.
//
// 🚨 AUCUNE PROMESSE QUE LE DEVIS NE TIENDRAIT PAS. Pas de « illimite »,
// pas de statistique, pas de temoignage, aucun concurrent nomme.
//
// ⚠️ LA TELEPHONIE N EST PROPOSEE QU AUX CLIENTS EUROPEENS. Regle du
// 03/09 : les appels partent toujours d un numero europeen. Hors EEA, la
// minute coute sept fois plus cher et l option ne doit pas apparaitre au
// devis. La vitrine reste donc prudente sur ce point : elle decrit la
// fonction sans promettre une couverture mondiale.
//
// La barre generale s efface sur cette page (components/NavBar.tsx) : elle
// porte son propre en-tete, comme les vitrines Mr LMS et MysterLLC.
//


export const metadata = {
  title: "Mr CRM — Savoir qui rappeler, et quoi lui dire",
  description:
    "Vos contacts, vos relances et vos échanges au même endroit : appels, SMS, courriels, documents signés. Pour les indépendants comme pour les équipes.",
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

const CADRE: any = {
  minHeight: "100vh",
  background: FOND,
  color: "#fff",
  fontFamily: "Georgia, serif",
};

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "26px 28px",
};

const BOUTON: any = {
  display: "inline-block",
  background: "linear-gradient(135deg,#c8a96e,#a07840)",
  color: FOND,
  padding: "15px 34px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "16px",
};

const BOUTON_CLAIR: any = {
  ...BOUTON,
  background: "transparent",
  color: OR,
  border: "1px solid rgba(200,169,110,0.5)",
};

// CE QUE FAIT L OUTIL. Chaque bloc part d un moment de la journee de
// celui qui vend, pas d une fonctionnalite.
const CE_QUI_EST_FAIT = [
  {
    titre: "Qui rappeler aujourd'hui",
    texte:
      "Chaque contact porte sa prochaine échéance. Vous ouvrez l'outil, vous voyez qui attend une réponse et depuis quand. Rien ne se perd entre deux carnets.",
  },
  {
    titre: "Et quoi lui dire",
    texte:
      "L'historique complet est sur la fiche : ce qui a été dit au dernier appel, ce qui a été promis, ce qui a été envoyé. Vous reprenez la conversation là où elle s'est arrêtée.",
  },
  {
    titre: "Appels et SMS depuis la fiche",
    texte:
      "Vous appelez d'un clic, le numéro composé et la durée s'inscrivent au journal. Les SMS partent du même endroit et reviennent au même endroit.",
  },
  {
    titre: "Vos courriels rattachés",
    texte:
      "Les échanges se rangent sur la fiche du contact. Vous cherchez une réponse reçue il y a trois mois sans quitter l'outil.",
  },
  {
    titre: "Devis et contrats signés en ligne",
    texte:
      "Un document part à signer depuis la fiche et y revient signé, avec un dossier de preuve horodaté et une ligne au registre.",
  },
  {
    titre: "Ce que vous avez vendu",
    texte:
      "Vos affaires en cours, celles qui ont abouti, celles qui dorment. De quoi savoir où passer votre temps la semaine prochaine.",
  },
];

export default function PageMrCRM() {
  return (
    <div style={CADRE}>
      {/* ---- EN-TETE ---- */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", background: "#000" }}>
        <div style={{ ...SECTION, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", gap: "16px" }}>
          <img
            src="/mrcrm-banniere.png"
            alt="Mr CRM"
            style={{ width: "560px", maxWidth: "62vw", height: "auto", display: "block", margin: "-4px", clipPath: "inset(4px)" }}
          />
          <a href="/connexion" style={{ color: OR, border: "1px solid rgba(200,169,110,0.45)", padding: "9px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap", flexShrink: 0 }}>
            Se connecter
          </a>
        </div>
      </header>

      {/* ---- ACCROCHE ---- */}
      <section style={{ ...SECTION, paddingTop: "70px", paddingBottom: "50px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 14px" }}>
          POUR LES INDÉPENDANTS ET LES ÉQUIPES
        </p>
        <h1 style={{ fontSize: "40px", lineHeight: "1.25", margin: "0 0 20px", color: "#fff" }}>
          Savoir qui rappeler, et quoi lui dire
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "18px", lineHeight: "1.8", margin: "0 0 32px", maxWidth: "760px" }}>
          Vos contacts, vos échanges et vos relances au même endroit. Appels, SMS,
          courriels et documents signés se rangent tout seuls sur la bonne fiche,
          pour que rien ne dépende de ce dont vous vous souvenez.
        </p>
        <a href="/contact" style={BOUTON}>Demander une présentation</a>
      </section>

      {/* ---- CE QUI EST FAIT ---- */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 26px" }}>
          Ce que l&apos;outil tient à votre place
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
          {CE_QUI_EST_FAIT.map(function (b) {
            return (
              <div key={b.titre} style={CARTE}>
                <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 10px" }}>{b.titre}</h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {b.texte}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- SEUL OU A PLUSIEURS ---- */}
      {/* La cible est double, mais la page reste unique : on ne fait pas
          choisir un camp au visiteur avant qu il ait compris l outil. Ce
          bloc dit simplement que les deux cas existent. */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <div style={{ ...CARTE, borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 14px" }}>
            Seul, ou à plusieurs
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 12px" }}>
            Le même outil sert un indépendant qui suit ses propres clients et une
            équipe qui se partage un portefeuille. Chacun voit ce qui le concerne ;
            l&apos;historique d&apos;un contact reste entier, quel que soit celui qui
            l&apos;a appelé.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
            Vous ajoutez des utilisateurs quand votre équipe grandit, sans changer
            d&apos;outil ni reprendre vos données.
          </p>
        </div>
      </section>

      {/* ---- LES OPTIONS A L USAGE ---- */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <div style={{ ...CARTE, borderColor: "rgba(200,169,110,0.45)" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>
            À L&apos;USAGE
          </p>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 14px" }}>
            Appels, SMS et signatures
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 12px" }}>
            La téléphonie, les SMS et la signature électronique se paient à
            l&apos;usage, en plus de l&apos;abonnement. Vous ne payez que ce que vous
            consommez, et vous voyez le détail sur votre facture.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
            Chaque signature produit un dossier de preuve horodaté : identité
            vérifiée par courriel, code à six chiffres, tracé manuscrit, consentement
            scellé. Il s&apos;agit d&apos;une signature électronique simple, intégrée à
            l&apos;outil. Pour un acte exigeant une signature qualifiée, recourez à un
            prestataire agréé.
          </p>
        </div>
      </section>

      {/* ---- COMMENT CA SE PASSE ---- */}
      <section style={{ ...SECTION, paddingBottom: "50px" }}>
        <h2 style={{ color: OR, fontSize: "24px", margin: "0 0 20px" }}>
          Comment cela se passe
        </h2>
        <div style={CARTE}>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "16px", lineHeight: "1.9", margin: "0 0 14px" }}>
            Nous regardons ensemble comment vous suivez vos clients aujourd&apos;hui.
            Vous recevez un devis. À la signature, votre espace est ouvert et vos
            contacts y sont importés.
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.9", margin: 0 }}>
            Sans engagement de durée. Vos données — contacts, historique, documents —
            vous appartiennent et vous sont restituées sur demande, dans un format
            exploitable.
          </p>
        </div>
      </section>

      {/* ---- APPEL ---- */}
      <section style={{ ...SECTION, paddingBottom: "80px" }}>
        <div style={{ ...CARTE, textAlign: "center", borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "26px", margin: "0 0 12px" }}>
            Voir l&apos;outil
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres contacts. Nous suivons
            ensemble un client du premier appel au document signé.
          </p>
          <a href="/contact" style={BOUTON}>Demander une présentation</a>
          <a href="/connexion" style={{ ...BOUTON_CLAIR, marginLeft: "12px" }}>
            J&apos;ai déjà un compte
          </a>
        </div>
      </section>

      {/* ---- PIED ---- */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr CRM — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href="/mentions-legales" style={{ color: OR_PALE, textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href="/cgv" style={{ color: OR_PALE, textDecoration: "none" }}>CGV</a>
            {"  ·  "}
            <a href="/politique-confidentialite" style={{ color: OR_PALE, textDecoration: "none" }}>Confidentialité</a>
            {"  ·  "}
            <a href="/contact" style={{ color: OR_PALE, textDecoration: "none" }}>Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
