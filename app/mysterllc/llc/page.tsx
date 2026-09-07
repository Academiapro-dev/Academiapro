import type { Metadata } from "next";
import Formulaire from "./Formulaire";

// ---------------------------------------------------------------------------
// LA LANDING PAGE LLC — 07/09.
//
// A QUOI ELLE SERT. Elle recoit le trafic d une publicite courte. Celui qui
// arrive ici n a rien vu du site, ne connait pas la marque, et n a pas
// cherche : il a vu passer trente secondes de video.
//
// 🚨 AUCUN LIEN DE SORTIE. Pas de menu, pas de pied de page navigable, pas
// de banniere cliquable. Un visiteur venu d une publicite qui part explorer
// le site ne revient pas au formulaire. ⛔ NE PAS Y AJOUTER LA NAVIGATION
// DES AUTRES PAGES MYSTERLLC — c est le seul point qui distingue cette page
// de la vitrine.
//
// 🚨 ELLE PARLE AUX DEUX PUBLICS A LA FOIS. Celui qui possede une LLC et
// celui qui hesite a en creer une. C est l angle trouve par Jacques le
// 07/09 : « si j avais su que j aurais un logiciel qui me proposerait
// toutes ces facilites, ça m aurait donne plus de serenite avant de me
// decider ». Ce qui bloque avant la creation est exactement ce qui pese
// apres — les obligations qu on ne connait pas encore.
//
// 🚨 LA CIBLE NE SE SIGNALE PAS. Jacques, le 07/09 : « quelqu un qui
// possede une LLC reste tres discret, il n aime pas qu on lui dise qu il a
// fait ça pour ne pas payer les impots ». C est pour cela que la publicite
// fonctionne la ou le courriel echoue : elle ne designe personne, elle est
// vue par tous, et seul celui qui se reconnait clique.
// ⛔ NE JAMAIS ECRIRE « optimisation », « discretion », « anonymat », ni
// aucun mot qui laisse entendre que la LLC sert a echapper a l impot.
//
// ⚠️ AUCUN PRIX. La tarification depend du portefeuille, et l ancrer ici
// ferait perdre l information que le prospect donne en decrivant son
// besoin. Rien ne change par rapport a la vitrine.
//
// ⚠️ AUCUN TEMOIGNAGE, AUCUN CHIFFRE DE CLIENTELE, AUCUNE STATISTIQUE. Les
// seuls montants cites sont ceux des textes officiels, deja presents sur la
// vitrine et sourcés dans `compliance_rules`.
//
// ⛔ NE JAMAIS ECRIRE QUE LA PLATEFORME DEPOSE. Elle prepare, le membre
// relit, signe et depose — ou le fait deposer par qui il veut. Aucun texte
// americain n impose de passer par un professionnel.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const NUIT = "#050508";
const BANNIERE = "/IMG_4723.jpeg";

// 🚨 AVEC www. mysterllc.com redirige vers www.mysterllc.com : une adresse
// sans www repond par une redirection, ce que Search Console refuse
// d indexer.
const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

export const metadata: Metadata = {
  title: "LLC américaine : les échéances que personne ne vous dit",
  description:
    "Le calendrier des obligations d'une LLC détenue depuis la France : "
    + "Form 5472, rapport d'État, CERFA 3916. Recevez le récapitulatif "
    + "correspondant à votre État.",
  openGraph: {
    title: "LLC américaine : les échéances que personne ne vous dit",
    description:
      "Le calendrier des obligations d'une LLC détenue depuis la France.",
    url: SITE + "/llc",
    siteName: "MysterLLC",
    images: [{ url: SITE + BANNIERE, width: 1200, height: 300 }],
    locale: "fr_FR",
    type: "website",
  },
  alternates: { canonical: SITE + "/llc" },
};

// LES TROIS OUBLIS QUI COUTENT LE PLUS CHER.
//
// ⚠️ CES MONTANTS SONT CEUX DES TEXTES OFFICIELS, repris de
// `compliance_rules` qui porte pour chacun sa `source_url` et sa date de
// verification. ⛔ NE JAMAIS EN AJOUTER UN SANS LA SOURCE.
const OUBLIS = [
  {
    titre: "Form 5472",
    montant: "25 000 USD",
    texte:
      "Dû au 15 avril, accompagné d'un 1120 pro forma. La pénalité est "
      + "par société et par an, et elle s'applique que la société ait eu "
      + "une activité ou non.",
  },
  {
    titre: "Le rapport de votre État",
    montant: "jusqu'à la dissolution",
    texte:
      "Chaque État a sa date, son montant et sa sanction. Au Texas, l'oubli "
      + "fait tomber la protection de responsabilité ; en Floride, la "
      + "pénalité tombe dès le lendemain, sans abattement.",
  },
  {
    titre: "CERFA 3916",
    montant: "1 500 € par compte",
    texte:
      "Un résident fiscal français déclare chaque compte détenu à "
      + "l'étranger, y compris celui de sa LLC. L'amende est annuelle, et "
      + "le délai de reprise de l'administration passe à dix ans.",
  },
];

// CE QUE L OUTIL FAIT, DIT EN TROIS GESTES.
//
// ⚠️ CHAQUE PHRASE DECRIT UNE FONCTION QUI EXISTE. Une promesse de vitrine
// doit survivre a l ouverture de l outil.
const GESTES = [
  {
    titre: "Vous voyez tout ce qui arrive",
    texte:
      "L'agenda se remplit à partir de l'État de constitution, de la date "
      + "et de la résidence du membre. Vous ne cherchez pas ce qui vous "
      + "concerne : c'est déjà trié par date.",
  },
  {
    titre: "Les formulaires sortent pré-remplis",
    texte:
      "Les PDF officiels de l'IRS, remplis depuis la fiche de la société. "
      + "Vous relisez, vous signez, et vous les déposez vous-même — ou vous "
      + "les confiez à qui vous voulez.",
  },
  {
    titre: "Vous êtes prévenu avant",
    texte:
      "Cinq paliers de rappel, de soixante jours à la veille. Rien ne part "
      + "sans que vous l'ayez armé, société par société.",
  },
];

export default function LandingLLC() {
  const section = {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "62px 24px",
  } as any;

  const h2 = {
    color: "#fff",
    fontFamily: "Georgia,serif",
    fontSize: "1.75rem",
    lineHeight: "1.3",
    marginBottom: "14px",
  } as any;

  const chapo = {
    color: "rgba(255,255,255,0.55)",
    fontSize: "15px",
    lineHeight: "1.85",
    marginBottom: "34px",
  } as any;

  const carte = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "24px",
  } as any;

  return (
    <div style={{ backgroundColor: NUIT, minHeight: "100vh", color: "#fff" }}>

      {/* ---- L EN-TETE ---- LA BANNIERE SEULE, SANS LIEN.
          🚨 ELLE N EST PAS CLIQUABLE, ET C EST VOULU. Sur la vitrine elle
          ramene a l accueil ; ici elle ferait sortir le visiteur de la
          page avant qu il ait lu la premiere ligne. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000", padding: "10px 24px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", lineHeight: 0 }}>
          <img
            src={BANNIERE}
            alt="MysterLLC"
            style={{ width: "420px", maxWidth: "70vw", height: "auto",
              display: "block", margin: "-4px", clipPath: "inset(4px)" }}
          />
        </div>
      </header>

      {/* ---- LA PROMESSE ---- */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)",
        padding: "68px 24px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto",
          textAlign: "center" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
            marginBottom: "18px" }}>
            VOUS AVEZ UNE LLC, OU VOUS Y PENSEZ
          </p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif",
            fontSize: "2.35rem", lineHeight: "1.28", marginBottom: "22px" }}>
            Une LLC, ce n&apos;est pas la créer<br />qui est difficile.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16.5px",
            lineHeight: "1.85", maxWidth: "620px", margin: "0 auto" }}>
            C&apos;est tout ce qui vient après. Des obligations américaines
            qui tombent à des dates différentes selon l&apos;État, une
            déclaration française que beaucoup découvrent trop tard, et des
            pénalités qui ne regardent pas votre chiffre d&apos;affaires.
            Dites-nous où vous en êtes : nous vous envoyons le calendrier
            qui vous concerne.
          </p>
        </div>
      </div>

      {/* ---- CE QUI COUTE CHER ---- */}
      <div style={section}>
        <h2 style={h2}>Trois oublis, et ce qu&apos;ils coûtent</h2>
        <p style={chapo}>
          Ces montants ne sont pas des estimations : ce sont ceux des textes
          officiels. Chacun est rattaché dans l&apos;outil à sa source et à
          la date où elle a été vérifiée.
        </p>
        <div style={{ display: "grid", gap: "16px" }}>
          {OUBLIS.map(function (o) {
            return (
              <div key={o.titre} style={carte}>
                <div style={{ display: "flex",
                  justifyContent: "space-between", alignItems: "baseline",
                  gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <strong style={{ color: OR, fontSize: "16px" }}>
                    {o.titre}
                  </strong>
                  <span style={{ color: "rgba(255,255,255,0.4)",
                    fontSize: "13px" }}>
                    {o.montant}
                  </span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)",
                  fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
                  {o.texte}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- CELUI QUI HESITE ---- 
           🚨 CETTE SECTION EST L ANGLE DE JACQUES, ET ELLE EST LA RAISON
           D ETRE DE LA PAGE. Elle s adresse a celui qui n a pas encore de
           LLC : ce qui le retient n est pas le cout de la creation, c est
           de ne pas savoir ce qui l attend ensuite. */}
      <div style={{ background: "rgba(255,255,255,0.02)" }}>
        <div style={section}>
          <h2 style={h2}>Si vous hésitez encore</h2>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "15.5px",
            lineHeight: "1.9", margin: 0 }}>
            Ce qui fait reculer n&apos;est presque jamais le prix de la
            création. C&apos;est de se dire qu&apos;une fois la société
            constituée, on dépendra de quelqu&apos;un pour des démarches
            qu&apos;on ne comprend pas, dans un pays dont on ne connaît pas
            les règles, avec des sanctions dont on ignore l&apos;existence.
            <br /><br />
            Savoir d&apos;avance ce qui vous attend, et voir que cela tient
            sur un écran, change la nature de la décision. C&apos;est ce que
            contient le récapitulatif : rien à vendre, seulement ce qui
            s&apos;appliquera à vous.
          </p>
        </div>
      </div>

      {/* ---- CE QUE FAIT L OUTIL ---- */}
      <div style={section}>
        <h2 style={h2}>Ce que fait MysterLLC</h2>
        <p style={chapo}>
          Trois gestes, et rien qui se fasse dans votre dos.
        </p>
        <div style={{ display: "grid", gap: "16px" }}>
          {GESTES.map(function (g, i) {
            return (
              <div key={g.titre} style={{ ...carte, display: "flex",
                gap: "18px", alignItems: "flex-start" }}>
                <div style={{ color: OR, fontFamily: "Georgia,serif",
                  fontSize: "24px", lineHeight: 1, flexShrink: 0,
                  opacity: 0.7 }}>
                  {i + 1}
                </div>
                <div>
                  <strong style={{ color: "#fff", fontSize: "15.5px",
                    display: "block", marginBottom: "7px" }}>
                    {g.titre}
                  </strong>
                  <p style={{ color: "rgba(255,255,255,0.6)",
                    fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
                    {g.texte}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- LE FORMULAIRE ---- LE SEUL GESTE POSSIBLE SUR CETTE PAGE. */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)",
        padding: "68px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ ...h2, textAlign: "center" }}>
            Recevez votre récapitulatif
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px",
            lineHeight: "1.85", marginBottom: "30px", textAlign: "center" }}>
            Les échéances qui s&apos;appliquent à votre situation, avec leurs
            dates et ce qu&apos;elles engagent. Un seul courriel, pas de
            rendez-vous à prendre.
          </p>
          <Formulaire />
        </div>
      </div>

      {/* ---- PIED DE PAGE ---- MINIMAL.
          ⚠️ LES MENTIONS LEGALES SONT LE SEUL LIEN SORTANT DE LA PAGE, et
          elles sont obligatoires. Tout autre lien ferait fuir le visiteur
          avant le formulaire. */}
      <footer style={{ background: "#000", padding: "30px 24px",
        borderTop: "1px solid rgba(200,169,110,0.15)" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto",
          color: "rgba(255,255,255,0.4)", fontSize: "13px",
          lineHeight: "1.8", textAlign: "center" }}>
          <p style={{ margin: "0 0 6px" }}>
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={LEGAL + "/mentions-legales"}
              style={{ color: OR_PALE, textDecoration: "none" }}>
              Mentions légales
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}
