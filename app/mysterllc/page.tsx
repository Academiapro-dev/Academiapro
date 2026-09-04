import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// LA VITRINE MYSTERLLC — 31/08.
//
// A QUI ELLE PARLE — DEUX PUBLICS DEPUIS LE 01/09.
//
// LE PREMIER : celui qui gere PLUSIEURS LLC pour le compte d autrui. Le
// prestataire qui cree des societes pour des expatries, ouvre leurs comptes
// bancaires, domicilie leurs adresses. Son probleme n est pas de comprendre
// le Form 5472 — il le connait — c est de ne jamais en oublier un sur un
// portefeuille qui grossit.
//
// LE SECOND, AJOUTE LE 01/09 : le dirigeant qui possede SA PROPRE LLC, ou
// qui hesite a en creer une.
//
// 🚨 CE QUI LE RETIENT N EST PAS LE COUT, C EST LA DEPENDANCE. Analyse de
// Jacques, qui l a vecue lui-meme en creant sa societe : « ce qui est
// important pour un chef d entreprise, c est de ne pas avoir le sentiment
// d etre sous l emprise d une structure qui fait pour lui des choses que
// lui-meme ne maitrise pas ».
//
// CE QUE CA CHANGE DANS LE DISCOURS. La page disait « on suit vos
// echeances » — un argument de delegation. Elle dit maintenant « rien ne
// vous echappe » — un argument de maitrise. Le calendrier visible, les
// formulaires qu on relit avant de signer, la responsabilite qui reste
// explicitement celle du dirigeant : ce ne sont pas des limites, ce sont
// LES RAISONS D ACHETER.
//
// ⚠️ NE PAS REBASCULER VERS « ON S OCCUPE DE TOUT ». C est ce que promet
// une boite noire, et c est precisement ce qui fait hesiter.
//
// ⚠️ CE QUI N EST PAS ECRIT ICI, ET POURQUOI. Aucun chiffre invente, aucun
// temoignage, aucune mention de clients existants : le produit sort
// aujourd hui. Chaque phrase a ete relue du point de vue de quelqu un qui
// cherche une raison de ne pas signer.
//
// ⚠️ LE PRIX N EST PAS AFFICHE. Il se fixe au vu de la taille du
// portefeuille, et l ancrer d avance ferait perdre l information que le
// prospect donne lui-meme en decrivant son besoin.
//
// ⚠️ LE CRM EST ANNONCE AU FUTUR, SANS DATE. Decision de Jacques du 31/08.
// « Prochainement » n engage sur aucun mois ; une date tenue serait une
// dette de plus.
//
// LE MIDDLEWARE sert cette page sur la racine de mysterllc.com. La NavBar
// s efface ici : la page porte son propre en-tete.
//
// 🚨🚨 DEUX DEFAUTS GRAVES CORRIGES LE 04/09.
//
// 1. AUCUN MENU. La banniere etait centree, seule, sans un lien. Le site
//    n avait qu une page et le visiteur ne pouvait aller nulle part.
//
// 2. LES DEUX BOUTONS OUVRAIENT UN `mailto:`. Sur un appareil sans
//    messagerie configuree, un lien mailto NE FAIT RIEN DU TOUT : le
//    visiteur clique, rien ne se passe, il repart. Ils pointent desormais
//    sur app/mysterllc/contact/page.tsx, un vrai formulaire.
//    ⛔ NE JAMAIS REMETTRE DE `mailto:` COMME SEUL MOYEN DE CONTACT.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const NUIT = "#050508";
const BANNIERE = "/IMG_4723.jpeg";

// 🆕 LE SITE ET SES PAGES — 04/09.
//
// 🚨 AVEC www. mysterllc.com redirige vers www.mysterllc.com : une adresse
// sans www repond par une redirection, ce que Search Console refuse
// d indexer. La canonique de cette page, plus bas, portait encore l adresse
// sans www — c est corrige.
const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

export const metadata: Metadata = {
  title: "MysterLLC — vos LLC en règle, sans y penser",
  description:
    "Le suivi des obligations américaines pour les gestionnaires de LLC : "
    + "portefeuille, agenda des échéances, formulaires IRS pré-remplis et "
    + "relances automatiques.",
  // ⚠️ LES IMAGES OPEN GRAPH SONT REPETEES AU NIVEAU DE LA PAGE. Une
  // declaration openGraph au niveau page remplace ENTIEREMENT celle du
  // layout parent : ne pas les redonner ici laisserait les partages sans
  // aperçu.
  openGraph: {
    title: "MysterLLC — vos LLC en règle, sans y penser",
    description:
      "Le suivi des obligations américaines pour les gestionnaires de LLC.",
    url: SITE,
    siteName: "MysterLLC",
    images: [{ url: SITE + BANNIERE, width: 1200, height: 300 }],
    locale: "fr_FR",
    type: "website",
  },
  alternates: { canonical: SITE },
};

// Une obligation suivie par l outil. Le libelle dit CE QUI EST EN JEU, pas
// seulement le nom du formulaire : c est l enjeu qui fait agir.
const OBLIGATIONS = [
  {
    nom: "Form 5472 + 1120 pro forma",
    quand: "15 avril",
    enjeu:
      "25 000 USD par société et par an en cas de dépôt tardif ou omis — "
      + "que la société ait eu une activité ou non.",
  },
  {
    nom: "Form 7004",
    quand: "avant le 15 avril",
    enjeu:
      "Six mois de délai supplémentaire, accordés automatiquement. Déposé "
      + "après l'échéance, il ne vaut plus rien.",
  },
  {
    nom: "BOI FinCEN",
    quand: "selon la date de constitution",
    enjeu:
      "Déclaration des bénéficiaires effectifs, à déposer en ligne. "
      + "L'outil prépare la fiche, vous déposez.",
  },
  {
    nom: "Annual Report",
    quand: "date anniversaire",
    enjeu:
      "Propre à l'État de constitution. Son oubli répété mène à la "
      + "dissolution administrative de la société.",
  },
  {
    nom: "W-8BEN-E",
    quand: "à la demande du payeur",
    enjeu:
      "Sans lui, une retenue à la source de 30 % s'applique sur les "
      + "paiements de source américaine.",
  },
  {
    nom: "1040-NR",
    quand: "15 avril ou 15 juin",
    enjeu:
      "Déclaration personnelle du membre lorsqu'elle est due. Suivie et "
      + "relancée, elle reste préparée par vous.",
  },
];

const ETAPES = [
  {
    titre: "Vous déclarez la société",
    texte:
      "État de constitution, date, résidence du membre, EIN. L'outil en "
      + "déduit les obligations qui s'appliquent — et seulement celles-là.",
  },
  {
    titre: "L'agenda se remplit tout seul",
    texte:
      "Toutes les échéances du portefeuille sur un seul écran, classées par "
      + "date et non par société. Ce qui tombe en premier se lit en premier.",
  },
  {
    titre: "Les formulaires sortent pré-remplis",
    texte:
      "Les PDF officiels de l'IRS, remplis depuis la fiche de la société. "
      + "Vous relisez, vous signez, vous déposez.",
  },
  {
    titre: "Les relances partent si vous les armez",
    texte:
      "Cinq paliers, de soixante jours à la veille. Rien ne part sans votre "
      + "accord, société par société.",
  },
];

// 🆕 LES SEPT ETATS COUVERTS — 04/09.
//
// 🚨 « SUIVI », JAMAIS « NOUS PROPOSONS UNE LLC ». MysterLLC ne constitue
// aucune societe : il suit les obligations d une LLC deja constituee.
// Ecrire « nous proposons une LLC dans sept Etats » ferait croire a un
// service de creation, et le prospect serait decu des le premier echange.
//
// POURQUOI L ANNONCER. La plupart des outils de suivi ne couvrent que le
// Wyoming et le Delaware. Sept Etats, chacun avec ses dates, ses montants
// et ses penalites propres, est une raison de choisir celui-ci — et rien
// sur la page ne le disait.
//
// ⚠️ CETTE LISTE DOIT CORRESPONDRE EXACTEMENT AUX REGLES PRESENTES DANS
// `compliance_rules`. Annoncer un Etat sans regle en base donnerait un
// client suivi pour le federal mais SANS AUCUNE ECHEANCE D ETAT, en
// silence. Verifier en base avant d en ajouter un ici :
//   select distinct etat_requis from compliance_rules where actif;
const ETATS_COUVERTS = [
  { code: "WY", nom: "Wyoming", note: "Rapport annuel au mois anniversaire" },
  { code: "DE", nom: "Delaware", note: "Taxe annuelle au 1er juin, sans rapport" },
  { code: "NM", nom: "Nouveau-Mexique", note: "Ni rapport annuel ni taxe de franchise" },
  { code: "NV", nom: "Nevada", note: "Liste annuelle et licence d'État, ensemble" },
  { code: "FL", nom: "Floride", note: "Rapport annuel au 1er mai, en ligne uniquement" },
  { code: "TX", nom: "Texas", note: "Rapport public au 15 mai, même sans taxe due" },
  { code: "MT", nom: "Montana", note: "Rapport annuel au 15 avril" },
];

export default function VitrineMysterLLC() {
  const section = {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "70px 24px",
  } as any;

  const h2 = {
    color: "#fff",
    fontFamily: "Georgia,serif",
    fontSize: "1.9rem",
    marginBottom: "12px",
  } as any;

  const chapo = {
    color: "rgba(255,255,255,0.55)",
    fontSize: "15px",
    lineHeight: "1.8",
    marginBottom: "38px",
    maxWidth: "680px",
  } as any;

  const carte = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px",
  } as any;

  return (
    <div style={{ backgroundColor: NUIT, minHeight: "100vh", color: "#fff" }}>

      {/* ---- EN-TETE ---- LE MEME SUR TOUTES LES PAGES DU SITE.
          🚨 IL N Y AVAIT AUCUN MENU jusqu au 04/09 : la banniere etait
          centree, seule, sans un seul lien. Un visiteur arrivait, lisait, et
          ne pouvait aller nulle part. Le site n avait d ailleurs qu une page.
          ⚠️ TOUTE PAGE PUBLIQUE DE MYSTERLLC PORTE CES CINQ ENTREES. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0, flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="MysterLLC — vos LLC en règle, sans y penser"
              style={{ width: "520px", maxWidth: "58vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/etats"} style={LIEN_ENTETE}>États</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={SITE + "/contact"} style={LIEN_ENTETE}>Contact</a>
            <a href="/connexion" style={{ color: OR,
              border: "1px solid rgba(200,169,110,0.45)", padding: "9px 18px",
              borderRadius: "8px", textDecoration: "none", fontSize: "14px",
              whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      {/* ---- LA PROMESSE ---- */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", marginBottom: "18px" }}>
          POUR CEUX QUI GÈRENT DES LLC — ET POUR CEUX QUI EN POSSÈDENT UNE
        </p>
        {/* 🚨 LE TITRE DIT LA MAITRISE, PAS LA SURVEILLANCE — 01/09.
            L ancien titre, « Nous surveillons leurs echeances », promettait
            de faire a la place. C etait exactement ce qui fait hesiter : le
            dirigeant ne veut pas deleguer ce qu il ne maitrise pas, il veut
            comprendre ce qui l attend. */}
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.6rem", lineHeight: "1.25", marginBottom: "22px" }}>
          Rien ne vous échappe,<br />rien ne se fait sans vous.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: "1.85", maxWidth: "660px", margin: "0 auto 34px" }}>
          Chaque LLC porte ses propres obligations américaines, à des dates
          différentes selon son État et la résidence de son membre.
          MysterLLC vous les montre toutes, prépare les formulaires
          officiels, et vous prévient avant l&apos;échéance. Vous relisez,
          vous signez, vous déposez.
        </p>
        <a
          href={SITE + "/contact"}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#c8a96e,#a07840)",
            color: NUIT,
            padding: "15px 38px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Demander une présentation
        </a>
      </div>

      {/* ---- LE PROBLEME, DIT SANS DETOUR ---- */}
      <div style={section}>
        <h2 style={h2}>Une échéance oubliée coûte plus cher que tout le reste</h2>
        <p style={chapo}>
          Le Form 5472 est dû au 15 avril. Son dépôt tardif ou omis expose à
          une pénalité de 25 000 USD par société et par an — elle n'est pas
          proportionnelle au chiffre d'affaires : une société sans activité
          la paie comme une autre. Sur dix sociétés, l'oubli d'une seule
          suffit.
        </p>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.9", margin: 0 }}>
            Le problème n'est pas de connaître ces obligations : vous les
            connaissez. Le problème est qu'elles se multiplient par le nombre
            de sociétés, tombent à des dates différentes, et qu'un tableur ne
            prévient personne.
          </p>
        </div>
      </div>

      {/* ---- LA MAITRISE, ARGUMENT CENTRAL — 01/09 ----
           🚨 CETTE SECTION EST NEE D UNE OBSERVATION DE JACQUES, qui a cree
           sa propre LLC : ce qui retient les dirigeants n est pas le cout ni
           la complexite, c est LA PEUR DE DEPENDRE d une structure qui fait
           pour eux ce qu ils ne maitrisent pas.
           ⚠️ ELLE EST PLACEE AVANT « ce que l outil suit ». La liste des
           formulaires vient apres : elle prouve la promesse, elle ne la
           porte pas. */}
      <div style={section}>
        <h2 style={h2}>Une société qu&apos;on ne maîtrise pas devient une inquiétude</h2>
        <p style={chapo}>
          Beaucoup renoncent à créer leur LLC — ou vivent mal celle
          qu&apos;ils ont — pour une raison qui n&apos;a rien à voir avec la
          fiscalité : la crainte de se retrouver lié à un prestataire, sans
          rien comprendre de ce qui se passe, et sans pouvoir en changer.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "18px" }}>
          <div style={carte}>
            <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
              Vous voyez ce qui arrive
            </strong>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
              Toutes les échéances de vos sociétés sur un écran, avec leur
              date et ce qu&apos;elles engagent. Rien n&apos;est caché dans
              un dossier que vous ne consultez jamais.
            </p>
          </div>
          <div style={carte}>
            <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
              Vous relisez avant de signer
            </strong>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
              Les formulaires officiels sortent pré-remplis, pas déposés.
              Vous voyez ce qui part à l&apos;administration, et vous le
              signez en connaissance de cause.
            </p>
          </div>
          <div style={carte}>
            <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
              Vous restez libre de partir
            </strong>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
              Vos données vous appartiennent et s&apos;exportent. Un outil
              qu&apos;on ne peut pas quitter n&apos;est pas un outil,
              c&apos;est une dépendance de plus.
            </p>
          </div>
        </div>
      </div>

      {/* ---- CE QUI EST SUIVI ---- */}
      <div style={{ background: "rgba(255,255,255,0.02)" }}>
        <div style={section}>
          <h2 style={h2}>Ce que l'outil suit</h2>
          <p style={chapo}>
            Les obligations s'appliquent selon la situation de chaque société.
            Une LLC du Delaware à membre expatrié ne verra jamais d'échéance
            fiscale française ; une société du Nouveau-Mexique n'aura aucun
            rapport d'État à déposer, parce que cet État n'en exige pas.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "18px" }}>
            {OBLIGATIONS.map((o) => (
              <div key={o.nom} style={carte}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                  <strong style={{ color: OR, fontSize: "15.5px" }}>{o.nom}</strong>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", whiteSpace: "nowrap" }}>{o.quand}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                  {o.enjeu}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- LES ETATS COUVERTS ---- */}
      {/* 🚨 PLACEE APRES LA LISTE DES OBLIGATIONS, ET AVANT « comment cela
          se passe ». Le prospect vient de lire ce qui est suivi ; la
          question suivante est « et pour MON Etat ? ». */}
      <div style={section}>
        <h2 style={h2}>Sept États suivis, chacun avec ses règles</h2>
        <p style={chapo}>
          Les obligations d&apos;État ne se ressemblent pas d&apos;un État à
          l&apos;autre : ni les dates, ni les montants, ni ce qui arrive en cas
          d&apos;oubli. Chaque règle est reprise du site officiel de
          l&apos;administration concernée, avec la date à laquelle elle a été
          vérifiée — vous pouvez la contrôler depuis l&apos;outil.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px" }}>
          {ETATS_COUVERTS.map((e) => (
            <div key={e.code} style={{ ...carte, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "7px" }}>
                <strong style={{ color: OR, fontSize: "15.5px" }}>{e.nom}</strong>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{e.code}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", lineHeight: "1.7", margin: 0 }}>
                {e.note}
              </p>
            </div>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", lineHeight: "1.8", marginTop: "22px", maxWidth: "680px" }}>
          Une société constituée dans un autre État reste suivie pour ses
          obligations fédérales ; ses échéances d&apos;État ne sont pas encore
          couvertes. Dites-nous lequel vous intéresse.
        </p>
      </div>

      {/* ---- COMMENT CA MARCHE ---- */}
      <div style={section}>
        <h2 style={h2}>Comment cela se passe</h2>
        <p style={chapo}>
          Quatre gestes, dont trois se font une seule fois par société.
        </p>
        <div style={{ display: "grid", gap: "16px" }}>
          {ETAPES.map((e, i) => (
            <div key={e.titre} style={{ ...carte, display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{ color: OR, fontFamily: "Georgia,serif", fontSize: "26px", lineHeight: 1, flexShrink: 0, opacity: 0.7 }}>
                {i + 1}
              </div>
              <div>
                <strong style={{ color: "#fff", fontSize: "16px", display: "block", marginBottom: "7px" }}>
                  {e.titre}
                </strong>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
                  {e.texte}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- CE QUI EST DIT FRANCHEMENT ---- */}
      <div style={{ background: "rgba(255,255,255,0.02)" }}>
        <div style={section}>
          {/* 🚨 LE CADRAGE A ETE INVERSE LE 01/09, SANS CHANGER LE FOND.
              Ces trois limites etaient presentees comme des aveux : « la
              limite fait partie de l offre ». Ce sont en realite LES
              RAISONS D ACHETER — c est parce que l outil ne depose rien
              tout seul que le dirigeant garde la main. Le contenu est
              identique, le titre dit maintenant ce qu il vaut. */}
          <h2 style={h2}>Ce que l&apos;outil vous laisse</h2>
          <p style={chapo}>
            Trois choses qu&apos;il ne fera jamais à votre place — et
            c&apos;est précisément ce qui vous garde maître de vos sociétés.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: "18px" }}>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Le dépôt reste le vôtre
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                Les formulaires sortent pré-remplis ; la relecture, la
                signature et le dépôt restent les vôtres. C'est vous qui
                engagez votre responsabilité, pas un automate.
              </p>
            </div>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Le W-8BEN-E attend votre statut
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                Son remplissage dépend d'un statut FATCA que l'outil ne
                connaît pas. Un formulaire à moitié faux, signé sous peine de
                parjure, serait pire qu'un formulaire vierge : vous recevez
                une fiche de préparation.
              </p>
            </div>
            <div style={carte}>
              <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
                Le jugement reste le vôtre
              </strong>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>
                MysterLLC suit des échéances et prépare des documents. La
                qualification d'une situation particulière relève de votre
                jugement ou de celui d'un CPA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- CE QUI ARRIVE ---- */}
      <div style={section}>
        <h2 style={h2}>Prochainement</h2>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.35)" }}>
          <strong style={{ color: OR, fontSize: "15.5px", display: "block", marginBottom: "10px" }}>
            Un CRM intégré
          </strong>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "14.5px", lineHeight: "1.85", margin: 0 }}>
            Le suivi de vos échanges avec chaque client rattaché à sa société :
            relances commerciales, historique, pièces reçues. Il rejoindra le
            portefeuille et l'agenda dans une prochaine version.
          </p>
        </div>
      </div>

      {/* ---- LE CONTACT ---- */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "18px" }}>
          Parlons de votre portefeuille
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15.5px", lineHeight: "1.85", maxWidth: "600px", margin: "0 auto 32px" }}>
          La tarification dépend du nombre de sociétés suivies. Écrivez-nous
          en indiquant combien vous en gérez : nous vous répondons avec une
          proposition et une présentation de l'outil.
        </p>
        <a
          href={SITE + "/contact"}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#c8a96e,#a07840)",
            color: NUIT,
            padding: "15px 38px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "22px",
          }}
        >
          contact@mysterllc.com
        </a>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>
          Déjà client ? <a href="/connexion" style={{ color: OR }}>Accéder à votre espace</a>
        </p>
      </div>

      {/* ---- PIED DE PAGE ---- */}
      <footer style={{ background: "#000", padding: "34px 24px", borderTop: "1px solid rgba(200,169,110,0.15)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.8", textAlign: "center" }}>
          <p style={{ margin: "0 0 6px" }}>
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE, textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/etats"} style={{ color: OR_PALE, textDecoration: "none" }}>États</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE, textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={SITE + "/contact"} style={{ color: OR_PALE, textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE, textDecoration: "none" }}>Mentions légales</a>
          </p>
        </div>
      </footer>

    </div>
  );
}
