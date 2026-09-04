// ══════════════════════════════════════════════════════════════════════════
// MYSTERLLC — LES SEPT ETATS COUVERTS — 04/09.
//
// 🚨🚨 CETTE LISTE DOIT CORRESPONDRE EXACTEMENT AUX REGLES EN BASE.
// Annoncer un Etat sans regle dans `compliance_rules` donnerait un client
// suivi pour le federal mais SANS AUCUNE ECHEANCE D ETAT, en silence.
// Verifier avant d en ajouter un :
//   select distinct etat_requis from compliance_rules where actif;
//
// 🚨 « SUIVI », JAMAIS « NOUS PROPOSONS UNE LLC ». MysterLLC ne constitue
// aucune societe.
//
// 🚨 LE ROYAUME-UNI N EST PAS UN ETAT AMERICAIN et a ete retire le 04/09.
// Une Ltd britannique n est PAS une LLC. NE PAS LE REMETTRE.
//
// ⚠️ LES MONTANTS ET LES DATES CI-DESSOUS SONT CEUX DES REGLES EN BASE AU
// 04/09, chacune sourcee sur le site officiel de son Etat. Ils changent :
// le seuil texan est revise chaque annee, la dispense de frais du Montana
// EXPIRE FIN 2027 et doit etre reverifiee avant le 01/01/2028.
// TOUTE MODIFICATION EN BASE DOIT ETRE REPORTEE ICI.
//
// ⛔ NE PAS SE PRESENTER COMME UN CONSEIL JURIDIQUE OU FISCAL.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata = {
  title: "Les sept États suivis — MysterLLC",
  description:
    "Wyoming, Delaware, Nouveau-Mexique, Nevada, Floride, Texas, Montana : chacun avec ses dates, ses montants et ses pénalités propres.",
  alternates: {
    canonical: SITE + "/etats",
  },
  openGraph: {
    title: "Les sept États suivis — MysterLLC",
    description:
      "Sept États suivis avec leurs règles propres, sourcées sur les sites officiels.",
    url: SITE + "/etats",
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

const LES_ETATS = [
  {
    titre: "Wyoming",
    texte:
      "Rapport annuel au mois anniversaire, 60 USD. Agent enregistré à renouveler. Source : sos.wyo.gov.",
  },
  {
    titre: "Delaware",
    texte:
      "Taxe annuelle de 300 USD au 1er juin, due même sans activité, avec pénalité de 200 USD et intérêts. Aucun rapport annuel n'est exigé des LLC, contrairement au Wyoming. Source : corp.delaware.gov.",
  },
  {
    titre: "Nouveau-Mexique",
    texte:
      "L'agent enregistré est la seule obligation récurrente. L'État n'exige ni rapport annuel ni bisannuel des LLC, et aucune taxe de franchise en régime transparent. Source : sos.nm.gov.",
  },
  {
    titre: "Nevada",
    texte:
      "Liste annuelle à 150 USD et licence d'État à 200 USD, dues ensemble au dernier jour du mois anniversaire. Le coût réel est de 350 USD par an : beaucoup cherchent un rapport annuel, trouvent la liste, et croient en avoir fini à 150. Source : nvsos.gov.",
  },
  {
    titre: "Floride",
    texte:
      "Rapport annuel au 1er mai, 138,75 USD. Pénalité de 400 USD dès le 2 mai, sans abattement possible. Dépôt en ligne uniquement. Source : dos.fl.gov.",
  },
  {
    titre: "Texas",
    texte:
      "Rapport public d'information au 15 mai, avec pénalité de 50 USD même sur un rapport à zéro dollar. C'est le seul des sept où l'oubli fait tomber la protection de responsabilité des dirigeants. Source : comptroller.texas.gov.",
  },
  {
    titre: "Montana",
    texte:
      "Rapport annuel au 15 avril, en ligne uniquement. Le montant est à zéro : la Secrétaire d'État a renoncé aux frais quatre années consécutives, jusqu'en 2027. En retard, 35 USD, sans extension possible. Source : sosmt.gov.",
  },
];

export default function PageEtatsMysterLLC() {
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
          LES ÉTATS
        </p>
        <h1 style={{ fontSize: "36px", lineHeight: "1.25",
          margin: "0 0 22px" }}>
          Sept États suivis, chacun avec ses règles
        </h1>
        <p style={{ ...P, fontSize: "18px",
          color: "rgba(255,255,255,0.8)" }}>
          Wyoming, Delaware, Nouveau-Mexique, Nevada, Floride, Texas, Montana. Chacun a ses dates, ses montants et ses pénalités — et elles n&apos;ont rien à voir entre elles.
        </p>

        <h2 style={H2}>Les sept États, et ce qu&apos;ils demandent</h2>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "16px", margin: "0 0 10px" }}>
          {LES_ETATS.map(function (b) {
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

        <h2 style={H2}>Pourquoi sept, et pas deux</h2>
        <p style={P}>
          Le Wyoming et le Delaware sont les deux États les plus connus, et
          beaucoup d&apos;outils s&apos;arrêtent là. Un portefeuille réel
          contient pourtant des sociétés du Nevada, de Floride ou du Texas,
          dont les règles n&apos;ont rien à voir : dates différentes,
          montants différents, et surtout pénalités sans rapport entre elles.
        </p>

        <h2 style={H2}>Ce qui change d&apos;un État à l&apos;autre</h2>
        <p style={P}>
          Le Delaware n&apos;exige aucun rapport annuel de ses LLC, mais une
          taxe de 300 USD due même sans activité. Le Nevada demande deux
          choses le même jour, dans une seule transaction, pour 350 USD. Le
          Montana ne demande rien financièrement — jusqu&apos;à fin 2027.
        </p>
        <p style={P}>
          Le Texas est un cas à part : y oublier un formulaire à zéro dollar
          fait perdre le droit d&apos;exercer et expose les dirigeants
          personnellement. C&apos;est la seule échéance des sept dont
          l&apos;oubli coûte autre chose que de l&apos;argent.
        </p>

        <h2 style={H2}>Les dates viennent des sites officiels</h2>
        <p style={P}>
          Chaque règle porte le lien vers la page officielle de son État et
          la date à laquelle nous l&apos;avons vérifiée. Elles peuvent
          évoluer : le seuil texan est révisé chaque année, la dispense de
          frais du Montana expire fin 2027. Le lien vous permet de contrôler.
        </p>
        <p style={P}>
          Une société constituée dans un autre État peut être déclarée : le
          suivi fédéral fonctionne normalement, puisqu&apos;il ne dépend pas
          de l&apos;État. Mais les obligations propres à cet État
          n&apos;apparaîtront pas, et l&apos;outil vous le dit au moment où
          vous le sélectionnez.
        </p>

        {/* ---- APPEL ---- Vers la page de contact du domaine, jamais un
            lien mailto : sur un appareil sans messagerie configuree, un
            mailto ne fait rien du tout, et le visiteur repart. */}
        <div style={{ ...CARTE, textAlign: "center", marginTop: "44px",
          borderColor: "rgba(200,169,110,0.45)" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Voir vos sociétés dans l&apos;agenda
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px",
            lineHeight: "1.8", margin: "0 0 24px" }}>
            Une présentation d&apos;une heure. Nous déclarons une de vos sociétés et regardons les échéances de son État.
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
