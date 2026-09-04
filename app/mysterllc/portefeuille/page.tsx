// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LE PORTEFEUILLE — 04/09.
//
// 🚨 « SUIVI », JAMAIS « NOUS PROPOSONS UNE LLC ». MysterLLC ne constitue
// aucune societe : il suit les obligations d une LLC deja constituee.
// Ecrire autre chose ferait croire a un service de creation, et le prospect
// serait decu des le premier echange.
//
// 🚨 LE ROYAUME-UNI N EST PAS UN ETAT AMERICAIN. Une Ltd britannique n est
// PAS une LLC : ni Form 5472, ni registered agent, ni rapport d Etat. Il a
// ete retire de la liste des Etats le 04/09 apres avoir donne un suivi
// entierement faux. NE PAS LE REMETTRE, ici ni ailleurs.
//
// ⚠️ CALIFORNIE, NEW YORK ET « AUTRE ETAT » sont selectionnables mais NON
// COUVERTS : le federal est suivi normalement — il ne depend pas de
// l Etat — mais le rapport annuel et la taxe de franchise de ces Etats
// n apparaissent pas. Le dire ici, comme l ecran le dit.
//
// 🚨 AUCUN PRIX. Il se fixe au vu de la taille du portefeuille.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Le portefeuille — MysterLLC",
  description:
    "Déclarez une société, l'outil en déduit les obligations qui s'appliquent — et seulement celles-là.",
  alternates: {
    canonical: SITE + "/portefeuille",
  },
  openGraph: {
    title: "Le portefeuille — MysterLLC",
    description:
      "Une fiche par société : État, date de constitution, résidence du membre, EIN.",
    url: SITE + "/portefeuille",
    siteName: "MysterLLC",
    locale: "fr_FR",
    type: "website",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// La banniere large 4:1, fond noir, deposee dans public/ le 31/08.
// ⚠️ VERIFIER LE NOM REEL AVANT DE LE CHANGER : le fichier s appelle
// IMG_4723.jpeg, il n a pas ete renomme.
const BANNIERE = "/IMG_4723.jpeg";

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const ETROIT: any = {
  maxWidth: "780px",
  margin: "0 auto",
  padding: "0 24px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "26px 28px",
};

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const P: any = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "16px",
  lineHeight: "1.9",
  margin: "0 0 18px",
};

const H2: any = {
  color: OR,
  fontSize: "23px",
  lineHeight: "1.4",
  margin: "44px 0 16px",
};

const CE_QUE_PORTE = [
  {
    titre: "Son État de constitution",
    texte:
      "C'est lui qui détermine le rapport annuel, la taxe de franchise et l'agent enregistré. Sept États sont couverts avec leurs règles propres.",
  },
  {
    titre: "Sa date de constitution",
    texte:
      "Elle fixe le mois anniversaire, dont dépendent plusieurs échéances d'État, et la date de dépôt BOI.",
  },
  {
    titre: "La résidence de son membre",
    texte:
      "Elle décide si le Form 5472 s'applique, et si une déclaration personnelle est due.",
  },
  {
    titre: "Son EIN",
    texte:
      "Le numéro d'identification fiscale, repris sur les formulaires que l'outil prépare.",
  },
  {
    titre: "Son agent enregistré",
    texte:
      "Son renouvellement est une obligation récurrente dans chacun des sept États couverts. Son oubli mène à la perte du bon standing.",
  },
  {
    titre: "Ce qui en découle",
    texte:
      "À partir de ces éléments, l'outil crée les échéances qui s'appliquent à cette société — et seulement celles-là.",
  },
];

export default function PagePortefeuilleMysterLLC() {
  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- LE MEME SUR TOUTES LES PAGES DU SITE.
          🚨 LA VITRINE N EN AVAIT AUCUN jusqu au 04/09 : la banniere etait
          centree, sans un seul lien. Un visiteur arrive sur la page, lit,
          et ne peut aller nulle part. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="MysterLLC"
              style={{ width: "520px", maxWidth: "58vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/etats"} style={LIEN_ENTETE}>États</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={SITE + "/contact"} style={LIEN_ENTETE}>Contact</a>
            <a href="/connexion" style={{ color: OR,
              border: "1px solid rgba(200,169,110,0.45)",
              padding: "9px 18px", borderRadius: "8px",
              textDecoration: "none", fontSize: "14px",
              whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      <main style={{ ...ETROIT, paddingTop: "70px", paddingBottom: "70px" }}>
        <a href={SITE + "/fonctionnalites"}
          style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          &larr; Toutes les fonctions
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "26px 0 14px" }}>
          LE PORTEFEUILLE
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Une fiche par société, et ce qui en découle
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          État de constitution, date, résidence du membre, EIN. À partir de ces quatre éléments, l&apos;outil détermine les obligations qui s&apos;appliquent à cette société.
        </p>

        <h2 style={H2}>Ce que porte une société</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {CE_QUE_PORTE.map(function (b) {
            return (
              <div key={b.titre} style={CARTE}>
                <h3 style={{ color: "#fff", fontSize: "17px",
                  margin: "0 0 10px", lineHeight: "1.4" }}>
                  {b.titre}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)",
                  fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                  {b.texte}
                </p>
              </div>
            );
          })}
        </div>

        <h2 style={H2}>Ce que l&apos;outil en déduit</h2>
        <p style={P}>
          Une LLC du Nevada n&apos;a pas les mêmes obligations qu&apos;une LLC
          du Delaware, et une LLC détenue par un non-résident n&apos;a pas
          les mêmes qu&apos;une autre. Plutôt que de vous présenter une liste
          générale où vous chercheriez ce qui vous concerne, l&apos;outil ne
          crée que les échéances qui s&apos;appliquent à cette société-là.
        </p>

        <h2 style={H2}>Les États couverts, et les autres</h2>
        <p style={P}>
          Sept États sont suivis avec leurs règles propres : Wyoming,
          Delaware, Nouveau-Mexique, Nevada, Floride, Texas, Montana. Pour
          eux, le rapport annuel, la taxe de franchise et leurs pénalités
          sont connus, datés et sourcés.
        </p>
        <p style={P}>
          Vous pouvez déclarer une société constituée ailleurs — en
          Californie, à New York, ou dans un autre État. Le suivi fédéral
          fonctionne normalement, puisqu&apos;il ne dépend pas de l&apos;État.
          Mais les obligations propres à cet État n&apos;apparaîtront pas, et
          l&apos;outil vous le dit au moment où vous le sélectionnez plutôt
          que de vous laisser le découvrir.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir votre portefeuille en situation
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure, sur vos propres sociétés. Nous en déclarons une et regardons ce que l&apos;outil en déduit.
          </p>
          <a href={SITE + "/contact"}
            style={{ display: "inline-block",
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: FOND, padding: "15px 34px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Demander une présentation
          </a>
        </div>
      </main>

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu : un
          lien relatif serait reecrit par le middleware vers /mysterllc/... */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/etats"} style={{ color: OR_PALE,
              textDecoration: "none" }}>États</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={SITE + "/contact"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
