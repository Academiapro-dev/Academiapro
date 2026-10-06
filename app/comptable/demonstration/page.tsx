import Link from "next/link";
import Script from "next/script";

export const metadata = {
  title: "Démonstration : un mois de paie, du dossier à la DSN — Mr. Comptable",
  description:
    "La paie d'un mois complet en vidéo : le dossier, l'embauche, une prime, un arrêt maladie, le calcul du bulletin, les contrôles, la confirmation du client, l'émission et la déclaration sociale nominative.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// ═══════════════════════════════════════════════════════════════════════
// 🆕 06/10/2026 — LA PAGE DE DEMONSTRATION DE MR. COMPTABLE
//
// C EST L ADRESSE QUI S ENVOIE AUX PROSPECTS : https://mrcomptable.fr/demonstration
// (le middleware sert ce fichier, app/comptable/demonstration, sous ce chemin).
//
// 🚨 DEUX ENVOIS ATTENDENT CETTE PAGE POUR PARTIR TOUT SEULS. Chacun la lit
// avant d ecrire, et cherche dans son contenu l adresse d un lecteur YouTube
// (« youtube-nocookie.com/embed/<identifiant> ») :
//   · la vague 3 de la campagne des avocats (app/api/campagne-avocats) ;
//   · le message LinkedIn « Mr Comptable » (app/api/admin/linkedin).
// TANT QUE `VIDEO_PAIE` EST VIDE, le lecteur n est pas affiche : la page
// existe, mais ces deux envois continuent d attendre. C est voulu.
//
// LES VIDEOS. Hebergees sur YouTube, en « non repertoriee ». Chaque constante
// porte l IDENTIFIANT de la video (ce qui suit « youtu.be/ »), pas son adresse.
//   VIDEO_PAIE          la paie et la DSN (en ligne le 06/10/2026)
//   VIDEO_COMPTABILITE  toute la comptabilite — VIDE tant qu elle n est pas
//                       tournee : son bloc ne s affiche pas, et la page n en
//                       dit rien (on ne parle que de ce qui existe).
//
// ⚠️ LES REPERES (`t`, en secondes) SONT CEUX DES CHAPITRES DE LA VIDEO DE LA
// PAIE. Si la video est remontee, les reprendre.
//
// ⚠️ CETTE PAGE EST INSCRITE DANS components/NavBar.tsx
// (PAGES_PUBLIQUES_COMPTABLE) : sans cela, la barre de travail du cabinet
// s afficherait par-dessus son en-tete, meme pour un visiteur sans compte.
//
// VOUVOIEMENT, VOCABULAIRE DE LA PAIE, AUCUN PRIX, AUCUNE DATE. Jamais
// « conforme », « agree », « certifie » ni « DSN deposee » : la video montre
// une DSN GENEREE et CONTROLEE.
// ═══════════════════════════════════════════════════════════════════════
const VIDEO_PAIE: string = "CNdSXDYsEhY";
const VIDEO_COMPTABILITE: string = "";

// ═══════════════════════════════════════════════════════════════════════
// 🆕 06/10/2026 — LE LECTEUR SANS SOUS-TITRES
//
// CONSTATE LE 06/10 : YouTube fabrique des sous-titres automatiques (« paye »,
// « M. Comptable »…) et le lecteur integre les affichait d office. Dans
// YouTube Studio, « Depublier » n existe plus sur la ligne des sous-titres
// automatiques, et la corbeille n a rien supprime depuis l iPad.
// La page demande donc elle-meme au lecteur de ne pas les afficher, de DEUX
// facons (aucune des deux n est une garantie de YouTube) :
//   1. dans l adresse du lecteur : cc_load_policy=3 (REGLAGES_LECTEUR) ;
//   2. par l interface de programmation du lecteur (SANS_SOUS_TITRES) : des
//      que le lecteur est pret, puis a chaque changement d etat, la page vide
//      la piste de sous-titres et decharge le module des sous-titres.
// Si YouTube change son lecteur, le pire qui arrive est le retour des
// sous-titres : la video, elle, se lit toujours.
//
// ⚠️ Le petit programme charge https://www.youtube.com/iframe_api des
// l ouverture de la page (le lecteur, lui, reste sur youtube-nocookie.com).
// ⚠️ NE PAS RETIRER « /embed/<identifiant> » DE L ADRESSE DU LECTEUR : c est
// ce que cherchent la campagne des avocats et l ecran LinkedIn.
// ═══════════════════════════════════════════════════════════════════════
const REGLAGES_LECTEUR = "?rel=0&cc_load_policy=3&enablejsapi=1";

const SANS_SOUS_TITRES = `
(function () {
  if (window.__mcSansSousTitres) return;
  window.__mcSansSousTitres = true;

  function couper(lecteur) {
    if (!lecteur) return;
    var maintenant = Date.now();
    if (lecteur.__mcDernier && maintenant - lecteur.__mcDernier < 200) return;
    lecteur.__mcDernier = maintenant;
    try { lecteur.setOption("captions", "track", {}); } catch (e) {}
    try { lecteur.unloadModule("captions"); } catch (e) {}
    try { lecteur.unloadModule("cc"); } catch (e) {}
  }

  function sousTitresCharges(lecteur) {
    try {
      var modules = lecteur.getOptions() || [];
      return modules.indexOf("captions") >= 0 || modules.indexOf("cc") >= 0;
    } catch (e) {
      return false;
    }
  }

  function couperEtRecouper(lecteur) {
    couper(lecteur);
    setTimeout(function () { couper(lecteur); }, 700);
    setTimeout(function () { couper(lecteur); }, 2500);
  }

  function brancher() {
    if (!window.YT || !window.YT.Player) return;
    var cadres = document.querySelectorAll("iframe[data-sans-sous-titres]");
    for (var i = 0; i < cadres.length; i++) {
      var cadre = cadres[i];
      if (cadre.getAttribute("data-branche")) continue;
      cadre.setAttribute("data-branche", "1");
      try {
        var adresse = cadre.getAttribute("src") || "";
        if (adresse.indexOf("origin=") < 0) {
          cadre.setAttribute("src", adresse + "&origin=" + encodeURIComponent(window.location.origin));
        }
        new window.YT.Player(cadre, {
          events: {
            onReady: function (e) { couperEtRecouper(e.target); },
            onStateChange: function (e) { couperEtRecouper(e.target); },
            onApiChange: function (e) { if (sousTitresCharges(e.target)) couperEtRecouper(e.target); }
          }
        });
      } catch (e) {}
    }
  }

  var ancien = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof ancien === "function") { try { ancien(); } catch (e) {} }
    brancher();
  };

  if (!document.getElementById("api-lecteur-youtube")) {
    var s = document.createElement("script");
    s.id = "api-lecteur-youtube";
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  }

  setInterval(brancher, 1500);
})();
`;

// 🚨 MEME LISTE SUR TOUTES LES PAGES DE app/comptable.
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

// LES ETAPES DE LA VIDEO DE LA PAIE, dans l ordre ou elle les montre.
const ETAPES = [
  {
    t: 29,
    titre: "Le dossier de la société",
    texte:
      "Sa raison sociale, sa forme, son exercice, puis son identité d'employeur : le SIRET, le code APE, l'adresse, la convention collective. Le SIREN se déduit du SIRET, et la clé de contrôle du SIRET est vérifiée dès l'enregistrement.",
  },
  {
    t: 57,
    titre: "Les réglages, une fois pour toutes",
    texte:
      "L'URSSAF de rattachement, choisie par région, et le compte sur lequel elle prélève. Le taux accident du travail notifié par la caisse, avec son code risque : mal saisi, il est refusé. La complémentaire santé. Ces réglages servent à chaque bulletin et à chaque DSN.",
  },
  {
    t: 92,
    titre: "L'embauche : un CDI, une apprentie",
    texte:
      "Le numéro de sécurité sociale, la date de naissance, l'adresse : la DSN les exige, le logiciel les demande dès l'embauche. Pour une apprentie, le salaire reste vide : le barème légal s'applique tout seul, selon l'âge et l'année du contrat. Un chiffre en trop ou une clé fausse dans le numéro de sécurité sociale, et l'enregistrement est refusé.",
  },
  {
    t: 173,
    titre: "Le mois : une prime, un arrêt maladie",
    texte:
      "On saisit seulement ce qui sort de l'ordinaire. Pour l'arrêt : le dernier jour travaillé, et la subrogation quand l'employeur maintient le salaire. Le même signalement sert au bulletin et à la déclaration de l'arrêt.",
  },
  {
    t: 206,
    titre: "Le calcul, avant de sortir le document",
    texte:
      "La retenue pour l'absence, le maintien de salaire, les indemnités journalières en déduction, le plafonnement au net habituel. Puis les cotisations, la réduction générale des cotisations patronales, le net social et le prélèvement à la source. Chaque ligne se lit avant l'émission.",
  },
  {
    t: 253,
    titre: "Les contrôles : vert, orange ou rouge",
    texte:
      "Chaque bulletin reçoit un feu. Un arrêt de travail sans avis d'arrêt joint : le bulletin est rouge et ne peut pas être émis. Un bandeau dit toujours la prochaine étape. On joint l'avis, et le bulletin passe au vert.",
  },
  {
    t: 290,
    titre: "Le client confirme",
    texte:
      "Le cabinet lui envoie le récapitulatif du mois : ses salariés, leurs absences, leurs primes, les montants. Il le lit sur une page simple, sans compte à créer, et confirme d'un geste, ou signale une erreur. Tant qu'il n'a pas confirmé, l'émission reste bloquée.",
  },
  {
    t: 325,
    titre: "L'émission et le PDF",
    texte:
      "Les bulletins prêts s'émettent en une fois. Le bulletin définitif est numéroté, et son PDF est prêt à être remis au salarié.",
  },
  {
    t: 339,
    titre: "La DSN du mois",
    texte:
      "Elle se génère à partir des bulletins émis, d'un seul geste. Avant tout dépôt, le fichier passe dans dsn-val, l'outil de contrôle officiel : celui de cette démonstration y est passé sans aucune anomalie. Le dépôt se fait ensuite depuis le même écran.",
  },
];

function minutes(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

export default function PageDemonstration() {
  const section: any = {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "22px 26px",
    marginBottom: "14px",
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
    margin: "44px 0 18px",
  };

  const P: any = {
    color: "rgba(255,255,255,0.75)",
    fontSize: "16.5px",
    lineHeight: "1.85",
    margin: "0 0 16px",
  };

  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  const cadreVideo: any = {
    ...carte,
    padding: 0,
    overflow: "hidden",
    marginBottom: "14px",
  };

  // Le format des prises d ecran de la video : 1440 x 932.
  const formatVideo: any = {
    position: "relative",
    width: "100%",
    aspectRatio: "1440 / 932",
    background: "#000",
  };

  const lecteur: any = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 };

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

            <Link href="/comptable/demonstration" style={{ ...lienMenu, color: OR }}>Démonstration</Link>
            <Link href="/comptable/blog" style={lienMenu}>Blog</Link>
            <Link href="/comptable/contact" style={lienMenu}>Contact</Link>
            <Link href="/comptable/inscription" style={{ ...bouton, padding: "11px 22px", fontSize: "15px" }}>Ouvrir mon espace</Link>
          </nav>
        </div>
      </header>

      <article style={{ ...section, paddingTop: "60px", paddingBottom: "80px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          DÉMONSTRATION
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          Un mois de paie, du dossier à la DSN
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)", marginBottom: "30px" }}>
          La paie d'un mois complet, sur une société de démonstration : l'ouverture
          du dossier, l'embauche, les événements du mois, le calcul du bulletin, les
          contrôles, la confirmation du client, l'émission et la déclaration sociale
          nominative. Tout se fait dans un seul outil.
        </p>

        {/* ---- LA VIDEO DE LA PAIE ---- Masquee tant que VIDEO_PAIE est vide.
            Lecteur youtube-nocookie, sans sous-titres (voir SANS_SOUS_TITRES). */}
        {VIDEO_PAIE && (
          <div style={cadreVideo}>
            <div style={formatVideo}>
              <iframe
                src={"https://www.youtube-nocookie.com/embed/" + VIDEO_PAIE + REGLAGES_LECTEUR}
                data-sans-sous-titres="1"
                title="Mr Comptable — un mois de paie, du dossier à la DSN"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={lecteur}
              />
            </div>
          </div>
        )}
        {VIDEO_PAIE && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 10px" }}>
            Six minutes et demie, écran par écran. Ce qui suit résume chaque étape,
            avec le moment où la vidéo la montre.
          </p>
        )}

        {(VIDEO_PAIE || VIDEO_COMPTABILITE) && (
          <Script id="lecteur-sans-sous-titres" strategy="afterInteractive">
            {SANS_SOUS_TITRES}
          </Script>
        )}

        <h2 style={H2}>Les étapes, une à une</h2>

        {ETAPES.map((e, i) => (
          <div key={e.t} style={carte}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "18.5px", margin: 0, color: "#fff" }}>
                <span style={{ color: OR, marginRight: "10px" }}>{i + 1}.</span>
                {e.titre}
              </h3>
              {VIDEO_PAIE && (
                <a
                  href={"https://youtu.be/" + VIDEO_PAIE + "?t=" + e.t}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: OR, fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  voir à {minutes(e.t)}
                </a>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "16px", lineHeight: "1.8", margin: 0 }}>
              {e.texte}
            </p>
          </div>
        ))}

        {/* ---- LA VIDEO DE LA COMPTABILITE ---- Rien ne s affiche tant que
            VIDEO_COMPTABILITE est vide. */}
        {VIDEO_COMPTABILITE && (
          <div>
            <h2 style={H2}>La comptabilité, de la pièce à la liasse</h2>
            <div style={cadreVideo}>
              <div style={formatVideo}>
                <iframe
                  src={"https://www.youtube-nocookie.com/embed/" + VIDEO_COMPTABILITE + REGLAGES_LECTEUR}
                  data-sans-sous-titres="1"
                  title="Mr Comptable — la comptabilité, de la pièce à la liasse"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={lecteur}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Voyez-le sur l'un de vos dossiers</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Ouvrez votre espace et faites la paie d'un premier mois, ou écrivez-nous :
            nous fixerons un échange téléphonique.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
            <Link href="/comptable/contact" style={{ ...bouton, background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.4)" }}>
              Nous écrire
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
            <Link href="/comptable/demonstration" style={lienPied}>Démonstration</Link>
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
