import Link from "next/link";
import { FONCTIONS } from "./fonctions";

export const metadata = {
  title: "Mr. Comptable — Logiciel de comptabilité pour cabinets",
  description:
    "Tenue, déclarations, liasse fiscale et lecture des factures électroniques. Sans engagement.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// LE MENU DEROULANT DES FONCTIONNALITES vit dans ./fonctions.ts, partage
// par toutes les pages de la vitrine. Chaque entree mene a SA PROPRE PAGE,
// jamais a une ancre : une page par sujet se positionne sur chaque recherche.

const CE_QUE_FAIT: any[] = [
  {
    titre: "La tenue",
    texte:
      "Saisie, journaux, grand livre, balance. Lettrage des comptes de tiers, rapprochement bancaire avec détection des doublons, écritures de paie. Verrouillage des périodes closes.",
  },
  {
    titre: "Les pièces",
    texte:
      "Vous déposez la facture, elle se lit et se comptabilise. Les factures électroniques au format Factur-X sont lues dans leur fichier structuré : les montants ne sont pas interprétés, ils sont lus. Le compte d'imputation est proposé d'après vos écritures passées.",
  },
  {
    titre: "La relance des justificatifs",
    texte:
      "Chaque mois, la plateforme repère les écritures sans pièce et écrit elle-même au client, avec la liste des factures attendues et un lien pour les déposer. Vous ne courez plus après les justificatifs : ils arrivent.",
  },
  {
    titre: "Le CRM du cabinet",
    texte:
      "Chaque client sur une ligne : ses pièces manquantes, ses opérations bancaires sans justificatif, ses impayés, et ce qu'il vous doit. Sept motifs de relance, par courriel ou par SMS, préparés par la plateforme et relus par vous.",
  },
  {
    titre: "Vos honoraires",
    texte:
      "Devis, factures, avoirs et règlements, avec Factur-X embarqué et toutes les mentions légales. Les honoraires mensuels se facturent seuls à la date prévue, en brouillon à relire ou en envoi automatique.",
  },
  {
    titre: "La trésorerie",
    texte:
      "Douze semaines devant chaque dossier, calculées depuis les écritures. Le certain d'un côté, l'estimé de l'autre, et le creux signalé avant qu'il n'arrive.",
  },
  {
    titre: "Les déclarations",
    texte:
      "TVA, liasse fiscale, impôt sur les sociétés. La télétransmission à la DGFiP se fait depuis le dossier, sans ressaisie, et les accusés de réception remontent dans votre interface.",
  },
  {
    titre: "Les états",
    texte:
      "Export FEC réglementaire, révision, clôture. Immobilisations avec plan d'amortissement, sorties et cessions. Provisions avec dotation et reprise.",
  },
  {
    titre: "Le cabinet",
    texte:
      "Chaque dossier est cloisonné. Les droits se règlent collaborateur par collaborateur : saisir, valider, clôturer, déclarer, tenir le plan comptable, déposer des pièces.",
  },
  {
    titre: "La traçabilité",
    texte:
      "Chaque modification est enregistrée : qui, quand, la valeur avant et la valeur après. C'est ce que l'administration demandera, et c'est écrit sans que personne ait à y penser.",
  },
  {
    titre: "L'inaltérabilité",
    texte:
      "Une écriture validée ne se supprime pas : elle se contre-passe, et la trace des deux demeure. Les factures émises portent une numérotation continue que la base elle-même garantit, sans rupture ni doublon possible.",
  },
];

export default function AccueilComptable() {
  const section: any = {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px",
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

  const boutonPale: any = {
    display: "inline-block",
    background: "transparent",
    color: OR,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "16px",
    border: "1px solid rgba(200,169,110,0.4)",
  };

  const lienMenu: any = { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" };
  const lienPied: any = { color: OR, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* En-tête. Le menu deroulant est en CSS pur — details et summary —
          pour que la page reste servie par le serveur.

          🚨 PLUS DE LIEN « ADMIN » SUR LA VITRINE — 23/08. Il etait montre a
          TOUT visiteur, cookie ou pas : un expert-comptable venu du
          communique LinkedIn le voyait en premier. L administrateur tape
          /admin a la main ; la session fait le reste. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0" }}>
        <div style={{ ...section, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <span style={{ color: OR, fontSize: "21px", fontWeight: "bold" }}>Mr. Comptable</span>

          <nav style={{ display: "flex", gap: "22px", alignItems: "center", flexWrap: "wrap" }}>
            <a href="#offre" style={lienMenu}>L'offre</a>

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

      {/* Promesse */}
      <section style={{ ...section, paddingTop: "80px", paddingBottom: "70px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 18px" }}>
          LOGICIEL DE COMPTABILITÉ POUR CABINET
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: "1.25", margin: "0 0 22px", maxWidth: "760px" }}>
          Toute la comptabilité de vos dossiers, sans le prix des grands éditeurs
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", lineHeight: "1.75", maxWidth: "680px", margin: "0 0 36px" }}>
          Tenue, déclarations, liasse fiscale et lecture des factures électroniques.
          Un seul prix, sans module en supplément, sans engagement de durée.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
          <Link href="/comptable/contact" style={boutonPale}>Recevoir le tarif</Link>
        </div>
      </section>

      {/* Ce que fait le logiciel */}
      <section id="offre" style={{ ...section, paddingTop: "20px", paddingBottom: "70px" }}>
        <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          CE QUE VOUS AVEZ
        </h2>
        <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "34px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "18px" }}>
          {CE_QUE_FAIT.map((b) => (
            <div key={b.titre} style={carte}>
              <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>{b.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
                {b.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Le temps rendu. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
            CE QUE VOUS NE FEREZ PLUS
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Réclamer les justificatifs un par un, dossier par dossier, tous les mois.
            La plateforme repère les écritures sans pièce, écrit au client, lui donne
            la liste et le lien pour déposer. Vous relisez, vous ne relancez plus.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Ressaisir une facture. Vous la déposez, elle se lit. Au format Factur-X,
            les montants sont repris du fichier structuré, sans lecture visuelle donc
            sans écart possible.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: 0, maxWidth: "760px" }}>
            Recopier une liasse dans un autre portail. La télétransmission part du
            dossier, et l'accusé de réception y revient.
          </p>
        </div>
      </section>

      {/* Facture électronique */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            FACTURE ÉLECTRONIQUE
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Au 1<sup>er</sup> septembre 2026, toute entreprise assujettie à la TVA doit être
            en mesure de recevoir des factures électroniques. Une facture électronique
            n'est ni un PDF envoyé par courriel ni un document scanné : c'est un fichier
            structuré, que la machine lit sans l'interpréter.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Mr. Comptable lit ces fichiers. Quand une facture arrive au format Factur-X,
            le fournisseur, la date, la référence, le HT, la TVA et le TTC sont repris
            tels qu'ils y figurent — sans lecture visuelle, donc sans écart possible.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.75", margin: "0 0 18px", maxWidth: "760px" }}>
            Mr. Comptable est une solution compatible au sens de la réforme, et non une
            plateforme agréée. Le transport des factures est assuré par une plateforme
            agréée, à laquelle nous nous raccordons.
          </p>
          <Link href="/comptable/facture-electronique" style={{ color: OR, fontSize: "15px", textDecoration: "none", borderBottom: "1px solid rgba(200,169,110,0.4)" }}>
            Tout ce qu'il faut savoir sur la facture électronique →
          </Link>
        </div>
      </section>

      {/* LE TARIF NE S AFFICHE PLUS ICI. */}
      <section id="tarif" style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          LE TARIF
        </h2>
        <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "34px" }} />

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Un abonnement au cabinet, quel que soit le nombre de collaborateurs, et une
            ligne par dossier réellement travaillé dans le mois. Un dossier créé mais sans
            aucune écriture n'est pas facturé, et le décompte est fait par la plateforme :
            vous n'avez rien à déclarer.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 24px", maxWidth: "760px" }}>
            Tout est compris : la tenue, les déclarations, la télétransmission, la lecture
            des pièces, la relance des justificatifs et l'assistance. Aucun module en
            supplément, aucun engagement de durée. Nous vous adressons le tarif après un
            échange de quinze minutes.
          </p>
          <Link href="/comptable/contact" style={bouton}>Recevoir le tarif</Link>
        </div>
      </section>

      {/* Appel */}
      <section style={{ ...section, paddingBottom: "90px" }}>
        <div style={{ ...carte, textAlign: "center", padding: "44px 26px" }}>
          <h2 style={{ fontSize: "27px", margin: "0 0 14px" }}>Ouvrez un dossier et jugez sur pièce</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 28px" }}>
            L'espace s'ouvre en une minute. Vous n'avez pas de mot de passe à retenir :
            vous recevez un lien de connexion par courriel.
          </p>
          <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
        </div>
      </section>

      {/* Pied */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "34px 0" }}>
        <div style={section}>
          <p style={{ color: OR, fontSize: "17px", margin: "0 0 8px" }}>Mr. Comptable</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Une marque d'AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801,
            États-Unis<br />
            contact@mrcomptable.fr · mrcomptable.fr
          </p>

          <p style={{ margin: "20px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {FONCTIONS.map((f) => (
              <Link key={f.href} href={f.href} style={lienPied}>{f.nom}</Link>
            ))}
          </p>

          <p style={{ margin: "16px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/comptable/blog" style={lienPied}>Blog</Link>
            <Link href="/comptable/contact" style={lienPied}>Contact</Link>
            <Link href="/comptable/cgv" style={lienPied}>
              Conditions générales de vente
            </Link>
            <Link href="/comptable/mentions" style={lienPied}>
              Mentions légales
            </Link>
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "14px", marginBottom: 0 }}>
            Prix hors taxes. Prestataire établi hors Union européenne : la TVA est
            autoliquidée par le preneur assujetti.
          </p>
        </div>
      </footer>

    </div>
  );
}
