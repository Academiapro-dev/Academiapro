import Link from "next/link";
import { FONCTIONS } from "./fonctions";

export const metadata = {
  title: "Mr. Comptable — Comptabilité, paie et déclarations, à partir de 0 €",
  description:
    "Tenue, TVA, liasse fiscale, factures électroniques, bulletins de paie et DSN. Pour une entreprise qui tient ses comptes comme pour un cabinet qui en tient cinquante. Tarifs affichés, sans engagement.",
  openGraph: {
    title: "Mr. Comptable — Comptabilité, paie et déclarations, à partir de 0 €",
    description:
      "Tenue, TVA, liasse fiscale, factures électroniques, bulletins de paie et DSN. Tarifs affichés, sans engagement.",
    url: "https://mrcomptable.fr",
    siteName: "Mr. Comptable",
    locale: "fr_FR",
    type: "website",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// LA VITRINE DE MR. COMPTABLE — REECRITE LE 18/09/2026
//
// 🚨 TROIS CHANGEMENTS DECIDES PAR JACQUES CE JOUR-LA, ET RIEN D AUTRE :
//
//   1. LA PAGE NE PARLE PLUS AUX SEULS CABINETS. Elle s adresse aussi aux
//      independants, aux TPE et aux PME qui tiennent leurs propres comptes.
//      Motif : les cabinets sont « presque une porte fermee a cause de nos
//      concurrents, car ils ont des idees precues sur les nouveaux ». Les
//      fonctions PROPRES AU CABINET restent, dans leur propre section : un
//      cabinet qui arrive doit toujours les trouver.
//
//   2. LA PAIE ET LA DSN ENTRENT DANS LA VITRINE. Elles n y figuraient pas
//      alors que les trois declarations passent dsn-val sans anomalie.
//
//   3. LES TARIFS S AFFICHENT DE NOUVEAU. Ils avaient ete retires ; ils
//      reviennent parce qu ils sont desormais competitifs et qu un prix
//      affiche est une arme face a un concurrent qui renvoie vers son
//      equipe commerciale.
//
// ⚠️ CE QUI N A PAS BOUGE, ET QU IL NE FAUT PAS DEFAIRE : la couleur OR,
// la police Georgia, le menu deroulant alimente par ./fonctions.ts (une
// page par sujet, jamais une ancre, pour le referencement), le domaine
// mrcomptable.fr, et l absence de tout lien « Admin » sur la vitrine
// (decision du 23/08 : il etait montre a TOUT visiteur).
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨🚨 CE QUE CETTE PAGE NE DIT PAS, ET POURQUOI
//
// ELLE NE DIT JAMAIS QUE NOUS TENONS LA COMPTABILITE DU CLIENT. En France,
// la tenue de comptabilite d autrui contre remuneration est RESERVEE AUX
// EXPERTS-COMPTABLES inscrits a l Ordre (ordonnance du 19 septembre 1945).
// Un logiciel qui permet a une entreprise de tenir SA PROPRE comptabilite
// est parfaitement legal — c est ce que font Pennylane, Indy ou macompta.
// ⛔ TOUJOURS ECRIRE « vous tenez », jamais « nous tenons ».
//
// ELLE NE DIT NI « AGREE », NI « CERTIFIE », NI « HOMOLOGUE », NI
// « CONFORME URSSAF ». Aucun de ces statuts n existe pour ce logiciel.
// dsn-val est un outil de CONTROLE que chacun peut telecharger, pas une
// homologation.
//
// ELLE NE PROMET PAS LE DEPOT AUTOMATIQUE DE LA DSN : aujourd hui le
// fichier se produit ici et se depose sur net-entreprises. C est ecrit.
// ═══════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const NOIR = "#050508";

// ── CE QUE TOUT LE MONDE A, entreprise comme cabinet ──────────────────
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
    titre: "Les bulletins de paie",
    texte:
      "CDI, CDD avec prime de précarité, contrat de mission avec indemnité de fin de mission. Heures supplémentaires, congés payés avec la méthode la plus favorable au salarié, réduction générale de cotisations calculée sur le cumul de l'année, montant net social.",
  },
  {
    titre: "Les déclarations sociales",
    texte:
      "La DSN mensuelle, le signalement de fin de contrat qui remplace l'attestation employeur, et le signalement d'arrêt de travail qui déclenche les indemnités journalières. Les trois se produisent depuis les bulletins, sans ressaisie.",
  },
  {
    titre: "Les déclarations fiscales",
    texte:
      "TVA, liasse fiscale, impôt sur les sociétés. La télétransmission à la DGFiP se fait depuis le dossier, sans ressaisie, et les accusés de réception remontent dans votre interface.",
  },
  {
    titre: "La trésorerie",
    texte:
      "Douze semaines devant vous, calculées depuis les écritures. Le certain d'un côté, l'estimé de l'autre, et le creux signalé avant qu'il n'arrive.",
  },
  {
    titre: "Les états",
    texte:
      "Export FEC réglementaire, révision, clôture. Immobilisations avec plan d'amortissement, sorties et cessions. Provisions avec dotation et reprise.",
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

// ── CE QUE LE CABINET A EN PLUS ───────────────────────────────────────
// Ces quatre fonctions existent et n ont pas de sens pour une entreprise
// qui ne tient que ses propres comptes. Les laisser dans la liste commune
// donnerait a un independant l impression que la page ne lui parle pas.
const POUR_LE_CABINET: any[] = [
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
    titre: "Les droits par collaborateur",
    texte:
      "Chaque dossier est cloisonné. Les droits se règlent collaborateur par collaborateur : saisir, valider, clôturer, déclarer, tenir le plan comptable, déposer des pièces.",
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

  // Une ligne de tarif. Le tableau est ecrit en clair plutot que calcule :
  // une page de vente doit pouvoir se relire sans executer le code.
  const ligneTarif: any = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "11px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    gap: "16px",
  };

  const nomTarif: any = { color: "rgba(255,255,255,0.8)", fontSize: "15.5px" };
  const sousTarif: any = {
    display: "block",
    color: "rgba(255,255,255,0.45)",
    fontSize: "13.5px",
    marginTop: "3px",
  };
  const prixTarif: any = {
    color: OR,
    fontSize: "17px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };

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
            <a href="#offre" style={lienMenu}>L&apos;offre</a>
            <a href="#tarifs" style={lienMenu}>Tarifs</a>

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

      {/* Promesse. Elle nomme les DEUX publics des la premiere phrase :
          un independant qui ne se reconnait pas dans la premiere ligne ne
          descend pas jusqu aux tarifs. */}
      <section style={{ ...section, paddingTop: "80px", paddingBottom: "70px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 18px" }}>
          COMPTABILITÉ, PAIE ET DÉCLARATIONS
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: "1.25", margin: "0 0 22px", maxWidth: "800px" }}>
          Vos comptes, votre paie et vos déclarations dans un seul outil
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", lineHeight: "1.75", maxWidth: "700px", margin: "0 0 36px" }}>
          Pour une entreprise qui tient ses propres comptes comme pour un cabinet
          qui en tient cinquante. Tenue, TVA, liasse fiscale, factures
          électroniques, bulletins de salaire et DSN. À partir de 0 € par mois,
          sans engagement de durée.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
          <a href="#tarifs" style={boutonPale}>Voir les tarifs</a>
        </div>
      </section>

      {/* Ce que le visiteur paie aujourd hui. Les chiffres sont des ordres
          de grandeur du marche, donnes comme tels. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
            CE QUE COÛTE LA PAIE AUJOURD&apos;HUI
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "790px" }}>
            Un cabinet facture couramment entre 20 et 35 € le bulletin de salaire.
            Pour trois salariés, cela représente entre 720 et 1 260 € par an, rien
            que pour les fiches de paie — avant la tenue, la TVA et la liasse.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: 0, maxWidth: "790px" }}>
            Et la déclaration sociale nominative tombe tous les mois : une erreur de
            structure et le fichier est rejeté, une erreur de calcul et l&apos;URSSAF
            redresse. C&apos;est précisément ce que Mr. Comptable prend en charge.
          </p>
        </div>
      </section>

      {/* Ce que fait le logiciel, pour tout le monde. */}
      <section id="offre" style={{ ...section, paddingBottom: "70px" }}>
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

      {/* 🚨 LA SEULE PREUVE QU ON PEUT AVANCER AUJOURD HUI, ET ELLE EST
          VERIFIABLE PAR LE VISITEUR LUI-MEME : dsn-val se telecharge
          librement sur net-entreprises.fr. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
            NOS DÉCLARATIONS PASSENT L&apos;OUTIL DE CONTRÔLE OFFICIEL
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "790px" }}>
            net-entreprises met à disposition dsn-val, l&apos;outil qui vérifie une
            déclaration sociale avant son dépôt. Nos trois déclarations — la DSN
            mensuelle, le signalement de fin de contrat et le signalement d&apos;arrêt
            de travail — y passent sans aucune anomalie.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px", lineHeight: "1.8", margin: 0, maxWidth: "790px" }}>
            Vous pouvez le vérifier vous-même : dsn-val se télécharge librement sur
            net-entreprises.fr, et vous pouvez y passer les fichiers que vous
            produisez ici.
          </p>
        </div>
      </section>

      {/* La section du cabinet. Elle vient APRES le commun : la vitrine
          s adresse d abord au plus grand nombre. */}
      <section id="cabinet" style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          SI VOUS ÊTES UN CABINET
        </h2>
        <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "22px" }} />
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 30px", maxWidth: "790px" }}>
          Tout ce qui précède, et quatre choses de plus qui n&apos;ont de sens que
          lorsqu&apos;on tient les comptes de dizaines de clients.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "18px" }}>
          {POUR_LE_CABINET.map((b) => (
            <div key={b.titre} style={carte}>
              <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>{b.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
                {b.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LES TARIFS ══
          Grille arretee le 18/09/2026. Tout y est ecrit, y compris ce qui
          se facture en plus : une page de vente qui cache un supplement se
          paie en litiges. */}
      <section id="tarifs" style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          LES TARIFS
        </h2>
        <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "34px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "18px", marginBottom: "22px" }}>

          <div style={carte}>
            <h3 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>Découverte</h3>
            <p style={{ color: OR, fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              0 € <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}>HT / mois</span>
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 18px" }}>
              Un utilisateur, un dossier
            </p>
            <p style={{ color: "rgba(255,255,255,0.68)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              La saisie des écritures, les journaux, le grand livre, la balance et
              l&apos;export du fichier des écritures comptables. Sans limite de durée.
            </p>
          </div>

          <div style={carte}>
            <h3 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>Essentiel</h3>
            <p style={{ color: OR, fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              19 € <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}>HT / mois</span>
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 18px" }}>
              Un utilisateur, un dossier
            </p>
            <p style={{ color: "rgba(255,255,255,0.68)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              Tout Découverte, plus la lecture automatique des factures, le
              rapprochement bancaire et la TVA. Cinquante pièces lues par mois.
            </p>
          </div>

          <div style={{ ...carte, borderColor: "rgba(200,169,110,0.5)" }}>
            <h3 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>Complet</h3>
            <p style={{ color: OR, fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              49 € <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}>HT / mois</span>
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 18px" }}>
              Un utilisateur, un dossier
            </p>
            <p style={{ color: "rgba(255,255,255,0.68)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              Tout Essentiel, plus la liasse fiscale, la clôture, la télétransmission
              à la DGFiP, la trésorerie et les états de révision.
            </p>
          </div>

        </div>

        {/* Les options. Elles sont AU MEME NIVEAU que les abonnements, pas
            en note de bas de page : c est la qu un client se sent trompe. */}
        <div style={{ ...carte, padding: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 20px" }}>
            LES OPTIONS, EN PLUS DE L&apos;ABONNEMENT
          </h3>

          <div style={ligneTarif}>
            <span style={nomTarif}>
              Dossier supplémentaire
              <span style={sousTarif}>
                Pour un cabinet, une holding ou un groupe qui tient plusieurs sociétés.
                Un dossier sans aucune écriture dans le mois n&apos;est pas facturé.
              </span>
            </span>
            <span style={prixTarif}>15 € / mois</span>
          </div>

          <div style={ligneTarif}>
            <span style={nomTarif}>
              Utilisateur supplémentaire
              <span style={sousTarif}>
                Chaque utilisateur ajoute cinquante pièces lues par mois
              </span>
            </span>
            <span style={prixTarif}>15 € / mois</span>
          </div>

          <div style={{ ...ligneTarif, borderBottom: "none" }}>
            <span style={nomTarif}>
              Paie et déclarations sociales
              <span style={sousTarif}>
                Abonnement, plus le prix de chaque bulletin ci-dessous
              </span>
            </span>
            <span style={prixTarif}>19 € / mois</span>
          </div>
        </div>

        {/* La grille des bulletins. Le plancher y est ecrit : sans lui, la
            facture baisserait quand le client embauche, et il le verrait. */}
        <div style={{ ...carte, padding: "30px", marginTop: "18px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 6px" }}>
            LE PRIX DU BULLETIN DE PAIE
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.7", margin: "0 0 18px" }}>
            Plus vous avez de salariés, moins le bulletin coûte cher.
          </p>

          <div style={ligneTarif}>
            <span style={nomTarif}>1 bulletin par mois</span>
            <span style={prixTarif}>12 €</span>
          </div>
          <div style={ligneTarif}>
            <span style={nomTarif}>de 2 à 5 bulletins</span>
            <span style={prixTarif}>9 €</span>
          </div>
          <div style={ligneTarif}>
            <span style={nomTarif}>de 6 à 10 bulletins</span>
            <span style={prixTarif}>7 €</span>
          </div>
          <div style={ligneTarif}>
            <span style={nomTarif}>de 11 à 20 bulletins</span>
            <span style={prixTarif}>5 €</span>
          </div>
          <div style={{ ...ligneTarif, borderBottom: "none" }}>
            <span style={nomTarif}>21 bulletins et plus</span>
            <span style={prixTarif}>3 €</span>
          </div>

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", lineHeight: "1.75", margin: "18px 0 0" }}>
            Le montant ne baisse jamais lorsque vous embauchez : au passage d&apos;un
            palier, vous ne payez pas moins qu&apos;au palier précédent.
          </p>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px", lineHeight: "1.8", margin: "16px 0 0" }}>
            Trois salariés reviennent ainsi à 46 € par mois : 19 € d&apos;abonnement et
            27 € de bulletins. Bulletins, DSN mensuelle et signalements compris.
          </p>
        </div>

        {/* 🚨 L OFFRE DE BIENVENUE. Elle est ecrite comme une REMISE qui
            s eteint, jamais comme un prix qui monte : le client doit savoir
            des la souscription ce qu il paiera au septieme mois. */}
        <div style={{ ...carte, background: "rgba(200,169,110,0.07)", borderColor: "rgba(200,169,110,0.35)", marginTop: "18px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 12px" }}>
            OFFRE DE BIENVENUE
          </h3>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.8", margin: 0, maxWidth: "790px" }}>
            Pour tout nouveau client, le dossier supplémentaire est à 10 € par mois
            au lieu de 15 € pendant les six premiers mois. Au septième mois, le tarif
            normal de 15 € s&apos;applique, sans autre changement.
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", lineHeight: "1.8", marginTop: "18px", maxWidth: "790px" }}>
          Tous les prix sont hors taxes et par mois. Sans engagement de durée : vous
          arrêtez quand vous voulez, vos données vous restent et s&apos;exportent. Le
          décompte des dossiers et des bulletins est fait par la plateforme, vous
          n&apos;avez rien à déclarer.
        </p>
      </section>

      {/* Facture électronique — section conservee telle quelle : sa
          formulation sur le statut de plateforme agreee est juste, et elle
          sert de modele au reste de la vitrine. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", padding: "34px" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            FACTURE ÉLECTRONIQUE
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Au 1<sup>er</sup> septembre 2026, toute entreprise assujettie à la TVA doit être
            en mesure de recevoir des factures électroniques. Une facture électronique
            n&apos;est ni un PDF envoyé par courriel ni un document scanné : c&apos;est un fichier
            structuré, que la machine lit sans l&apos;interpréter.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "760px" }}>
            Mr. Comptable lit ces fichiers. Quand une facture arrive au format Factur-X,
            le fournisseur, la date, la référence, le HT, la TVA et le TTC sont repris
            tels qu&apos;ils y figurent — sans lecture visuelle, donc sans écart possible.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.75", margin: "0 0 18px", maxWidth: "760px" }}>
            Mr. Comptable est une solution compatible au sens de la réforme, et non une
            plateforme agréée. Le transport des factures est assuré par une plateforme
            agréée, à laquelle nous nous raccordons.
          </p>
          <Link href="/comptable/facture-electronique" style={{ color: OR, fontSize: "15px", textDecoration: "none", borderBottom: "1px solid rgba(200,169,110,0.4)" }}>
            Tout ce qu&apos;il faut savoir sur la facture électronique →
          </Link>
        </div>
      </section>

      {/* 🚨 LA RESERVE. Elle devient indispensable maintenant que la vitrine
          s adresse a des ENTREPRISES et non plus aux seuls cabinets : un
          dirigeant doit comprendre que c est LUI qui tient ses comptes. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, background: "rgba(200,169,110,0.06)", borderColor: "rgba(200,169,110,0.3)" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            CE QUE NOUS NE SOMMES PAS
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "810px" }}>
            Mr. Comptable est un logiciel, pas un cabinet d&apos;expertise comptable. Nous
            ne tenons pas votre comptabilité et nous n&apos;attestons pas vos comptes :
            c&apos;est vous qui les tenez, avec notre outil. Seul un expert-comptable
            inscrit à l&apos;Ordre peut tenir la comptabilité d&apos;autrui et attester des
            comptes.
          </p>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "810px" }}>
            Nous ne sommes ni agréés, ni homologués, ni certifiés par une
            administration. Nos déclarations passent l&apos;outil de contrôle de
            net-entreprises, ce qui est vérifiable, mais ne constitue pas un label.
          </p>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.8", margin: 0, maxWidth: "810px" }}>
            Le dépôt de la déclaration sociale nominative se fait aujourd&apos;hui depuis
            votre compte net-entreprises : nous produisons le fichier, vous le
            déposez. Le dépôt automatique est en préparation.
          </p>
        </div>
      </section>

      {/* Appel */}
      <section style={{ ...section, paddingBottom: "90px" }}>
        <div style={{ ...carte, textAlign: "center", padding: "44px 26px" }}>
          <h2 style={{ fontSize: "27px", margin: "0 0 14px" }}>Commencez sans rien payer</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 28px" }}>
            L&apos;offre Découverte est gratuite et sans limite de durée. L&apos;espace s&apos;ouvre
            en une minute : vous n&apos;avez pas de mot de passe à retenir, vous recevez un
            lien de connexion par courriel.
          </p>
          <Link href="/comptable/inscription" style={bouton}>Ouvrir mon espace</Link>
        </div>
      </section>

      {/* Pied */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "34px 0" }}>
        <div style={section}>
          <p style={{ color: OR, fontSize: "17px", margin: "0 0 8px" }}>Mr. Comptable</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Une marque d&apos;AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801,
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
