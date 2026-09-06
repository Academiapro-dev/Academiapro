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
// 🚨🚨 LES APPELS, LES SMS ET LES COURRIELS RATTACHES ONT ETE RETIRES DE
// CETTE PAGE — 04/09.
//
// CE QU ELLE ANNONCAIT, ECRIT LE 03/09 : « vous appelez d un clic, le
// numero compose et la duree s inscrivent au journal », « les SMS partent
// du meme endroit », « les echanges se rangent sur la fiche du contact ».
//
// CE QUE LE CODE FAIT, VERIFIE LE 04/09 : le numero est un lien `tel:` qui
// compose sur le telephone, l adresse un lien `mailto:` qui ouvre la
// messagerie. Rien ne revient dans l outil. Il n y a ni journal d appels,
// ni SMS, ni courriels rattaches.
//
// 🆕🆕 LA TELEPHONIE EXISTE DEPUIS LE 06/09 — la mention revient.
//
// CE QUI A ETE CONSTRUIT : /api/organisme/appeler (lance l appel via
// Plivo), /api/organisme/appeler/repondre (met les deux en relation),
// /api/organisme/appeler/fin (recoit la duree et decompte le credit), et
// le bouton « Appeler » sur chaque fiche du CRM.
//
// 🚨 DEUX JAMBES, ET LA VITRINE DOIT LE DIRE. Le client n a pas de
// standard : SON telephone sonne d abord, il decroche, et le contact est
// appele. Ecrire « appelez d un clic » sans le dire ferait attendre autre
// chose que ce qui arrive.
//
// ⚠️ LE NUMERO AFFICHE CHEZ LE CONTACT EST CELUI DE L ORGANISME, pas celui
// de Plivo : c est ce qui fait qu on rappelle.
//
// ⚠️ LA TELEPHONIE N EST PAS COMPRISE DANS L ABONNEMENT : elle se paie a
// la minute, comme le dit le devis. La vitrine ne porte aucun prix — la
// regle n a pas change.
//
// 🚨 CE QU ON NE PEUT TOUJOURS PAS ECRIRE : « appels illimites », « standard
// telephonique », « votre numero professionnel inclus ». Le numero se
// regle a la mise en place, et chaque minute se decompte d un credit.
//
// ⚠️ HORS EUROPE, LES APPELS SONT REFUSES — meme regle que pour les SMS.
// Ne pas ecrire « appelez partout dans le monde ».
//
// 🆕🆕 LE JOURNAL D APPELS EXISTE DEPUIS LE 06/09 — la mention revient.
//
// Table `crm_appels`, route /api/organisme/appels, saisie sur chaque fiche
// du CRM : apres un appel, le client note comment il s est termine (a
// repondu, absent, a rappeler, ne veut pas), la duree et ce qui a ete dit.
// Deux filtres en decoulent : « A rappeler » et « Jamais appeles ».
//
// 🚨 CE QU ON PEUT ECRIRE, ET CE QU ON NE PEUT PAS. La fiche GARDE ce qui
// s est dit — c est vrai, et c est ce que dit la carte. Elle ne dit PAS
// que l appel part de l outil, ni que la duree se mesure toute seule : le
// numero reste un lien `tel:` qui compose sur le telephone, et c est le
// client qui note.
// ⛔ NE PAS ECRIRE « appelez d un clic », « la duree s inscrit au journal »
// ni « les appels se rangent tout seuls ». Ce serait a nouveau une
// promesse que l outil ne tient pas.
//
// 🚨🚨 DEUX PHRASES AVAIENT ETE OUBLIEES — corrigees le 04/09 au soir.
//
// Les six cartes avaient bien ete nettoyees le matin, mais PAS le
// PARAGRAPHE D ACCROCHE juste au-dessus, ni la DESCRIPTION des
// metadonnees. Les deux annoncaient encore « Appels, SMS, courriels et
// documents signes se rangent tout seuls sur la bonne fiche ». Jacques
// l a vu en ouvrant simplement la page.
//
// ⚠️ LA LECON : quand une promesse est retiree, elle se cherche DANS TOUT
// LE FICHIER — accroche, cartes, metadonnees, pied. Corriger le bloc
// evident et s arreter la laisse la promesse en haut de page, a l endroit
// que le visiteur lit en premier.
//
// ⚠️ QUAND LA TELEPHONIE EXISTERA : elle ne sera proposee qu aux clients
// europeens. Les appels partent toujours d un numero europeen ; hors EEA la
// minute coute sept fois plus cher et l option n apparait pas au devis.
//
// La barre generale s efface sur cette page (components/NavBar.tsx) : elle
// porte son propre en-tete, comme les vitrines Mr LMS et MysterLLC.
//
// 🚨 TOUT LIEN HORS VITRINE EST ABSOLU — CORRIGE LE 04/09.
//
// LE DEFAUT, CONSTATE PAR JACQUES EN TEST REEL SUR MR LMS, identique ici.
// Les boutons « Demander une presentation » et le pied pointaient sur
// /contact, /cgv, /mentions-legales, /politique-confidentialite. Sur
// mrcrm.fr, le middleware reecrit tout chemin non reserve vers le dossier
// du produit : /contact devenait /mrcrm/contact, qui n existe pas.
//
// CES PAGES EXISTENT SUR academiapro.fr, declarees dans son sitemap, et
// valent pour toutes les solutions de la maison. Elles sont donc appelees
// en absolu. Le jour ou Mr CRM aura sa propre page de contact, la
// constante CONTACT change ici et nulle part ailleurs.
//
// 🆕 LIEN « BLOG » DANS L EN-TETE ET LE PIED — 04/09. Le blog
// (app/mrcrm/blog) existait sans qu aucun lien n y mene.
// ══════════════════════════════════════════════════════════════════════════

const SITE = "https://www.mrcrm.fr";
const LEGAL = "https://academiapro.fr";
// 🚨 LE CONTACT EST CELUI DE MR CRM — CORRIGE LE 04/09.
//
// Il pointait sur academiapro.fr/contact tant que la page de contact
// Mr CRM n existait pas. Elle existe depuis le 04/09
// (app/mrcrm/contact/page.tsx) : le prospect reste desormais sur la marque
// ou il est arrive, et son message part avec « [Mr CRM] » en sujet.
const CONTACT = SITE + "/contact";


export const metadata = {
  title: "Mr CRM — Savoir qui rappeler, et quoi lui dire",
  description:
    "Vos contacts, vos relances et vos échanges au même endroit : historique, relances rédigées, documents signés. Pour les indépendants comme pour les équipes.",
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
    titre: "Ce qui s'est dit au téléphone",
    texte:
      "Après un appel, vous notez en deux gestes comment il s'est terminé et ce qui a été dit. La fiche s'en souvient : la prochaine fois que vous l'ouvrez, vous savez où vous en étiez.",
  },
  {
    titre: "Appeler depuis la fiche",
    texte:
      "Vous cliquez, votre téléphone sonne, et votre correspondant est appelé aussitôt — votre numéro s'affiche chez lui, pas un numéro inconnu. La durée s'inscrit au journal sans que vous ayez rien à noter.",
  },
  {
    titre: "Une relance vous est proposée",
    texte:
      "À partir de ce que porte la fiche, un texte de relance vous est proposé. Vous le relisez, vous le corrigez, et vous décidez de l'envoyer. Rien ne part sans que vous l'ayez lu.",
  },
  {
    titre: "La relance automatique, fiche par fiche",
    texte:
      "Vous armez la relance automatique sur les fiches que vous choisissez, jamais globalement. Une fiche armée est signalée dans la liste.",
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
          <nav style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            {/* 🆕 « FONCTIONS » AJOUTE LE 04/09, en meme temps que les
                quatre pages de fonction. */}
            <a href={SITE + "/fonctionnalites"} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Fonctions
            </a>
            <a href={SITE + "/blog"} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Blog
            </a>
            <a href={CONTACT} style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Contact
            </a>
            <a href="/connexion" style={{ color: OR, border: "1px solid rgba(200,169,110,0.45)", padding: "9px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      {/* ---- ACCROCHE ---- */}
      {/* 🚨 CETTE PHRASE ANNONCAIT ENCORE « Appels, SMS, courriels » alors
          que les cartes avaient ete corrigees. C est le premier texte que
          lit un visiteur : ce qu on y ecrit engage plus que le reste. */}
      <section style={{ ...SECTION, paddingTop: "70px", paddingBottom: "50px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 14px" }}>
          POUR LES INDÉPENDANTS ET LES ÉQUIPES
        </p>
        <h1 style={{ fontSize: "40px", lineHeight: "1.25", margin: "0 0 20px", color: "#fff" }}>
          Savoir qui rappeler, et quoi lui dire
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "18px", lineHeight: "1.8", margin: "0 0 32px", maxWidth: "760px" }}>
          Vos contacts, vos échanges et vos relances au même endroit. Ce qui a
          été dit au téléphone, ce qui a été promis, ce qui a été signé reste
          sur la bonne fiche, pour que rien ne dépende de ce dont vous vous
          souvenez.
        </p>
        <a href={CONTACT} style={BOUTON}>Demander une présentation</a>
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
            La signature électronique
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 12px" }}>
            La signature électronique se paie à l&apos;usage, en plus de
            l&apos;abonnement. Vous ne payez que ce que vous consommez, et
            vous voyez le détail sur votre facture.
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
            ensemble un client du premier échange au document signé.
          </p>
          <a href={CONTACT} style={BOUTON}>Demander une présentation</a>
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
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE, textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE, textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE, textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE, textDecoration: "none" }}>CGV</a>
            {"  ·  "}
            <a href={LEGAL + "/politique-confidentialite"} style={{ color: OR_PALE, textDecoration: "none" }}>Confidentialité</a>
            {"  ·  "}
            <a href={CONTACT} style={{ color: OR_PALE, textDecoration: "none" }}>Contact</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
