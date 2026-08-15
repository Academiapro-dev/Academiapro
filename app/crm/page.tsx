import Link from "next/link";

export const metadata = {
  title: "CRM pour organisme de formation — AcadéMIA Pro",
  description:
    "Suivez vos prospects étape par étape : score de complétude, analyse de chaque fiche, relance rédigée, motifs de perte. SMS et appels intégrés. Pour organismes de formation et centres d'appels.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// UNE PAGE VITRINE, PAS L OUTIL.
//
// L outil vit derriere la session, sur /admin/crm et /organisme/crm, et
// c est tres bien ainsi. Mais un moteur de recherche ne se connecte jamais :
// il ne voyait que /espace-prive, une page qui dit « reserve aux abonnes ».
// Personne ne pouvait donc trouver le CRM en cherchant « logiciel CRM
// organisme de formation ».
//
// CE QUI ETAIT ECRIT ICI AVANT N EXISTAIT PAS. L ancienne page annoncait un
// pipeline Kanban a six colonnes qu on fait glisser, un « LeadBot », un
// « CA pipeline » : aucune de ces fonctions n est dans le code. Une page qui
// promet plus que le produit se retourne contre nous a la demonstration.
//
// CORRECTIONS DU 15/08.
//
// (1) LE SCORE ETAIT DECRIT FAUX. La page annoncait une note calculee sur
// le comportement du prospect et son anciennete. Le code fait autre chose :
// il additionne des points selon la PRESENCE d une adresse, d un telephone,
// d une formation visee, d un domaine, et selon la source. C est un score de
// COMPLETUDE DE FICHE. L anciennete n entre nulle part dans le calcul.
//
// (2) « SANS CHANGER D ECRAN » laissait croire a un passage automatique du
// prospect au stagiaire. L inscription au registre demande un bouton et un
// prix de vente — c est simple, mais ce n est pas rien.
//
// (3) LES MOTIFS DE PERTE SONT AJOUTES. Livres le 14/08, ils n etaient pas
// decrits : la page perdait une fonction qu aucun concurrent ne met en avant.
//
// LE SMS ET LA TELEPHONIE SONT UNE DECISION DE JACQUES, PAS UNE OPTION.
// Un CRM sans canal de contact integre ne pese pas face a Digiforma ni a
// Dendreo — c est precisement ce qui ouvre le marche des centres d appels,
// que le tout-en-un de la formation n atteint pas.
//
// LE SMS AFFICHE SON PRIX, LA VOIX NON, et la difference n est pas un oubli :
// le SMS a un cout etabli (Brevo, 0,033 a 0,045 EUR le message) et un prix
// de revente arrete (0,12 EUR HT degressif jusqu a 0,08 EUR). La voix a son
// fournisseur choisi (Plivo) et son modele arrete — location du numero
// refacturee au client, marge sur les minutes — mais PAS son tarif : le prix
// d accroche affiche par les operateurs concerne les lignes FIXES et les
// appels d origine europeenne, alors que le trafic reel ira vers des MOBILES.
// L ecart est d un facteur deux a six. Le prix se fixera sur un mois de cout
// CONSTATE, pas sur une grille. On n ecrit pas un tarif qu on devra corriger.

export default function PageCRM() {
  const section: any = {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px 28px",
    marginBottom: "18px",
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

  const H2: any = { color: OR, fontSize: "22px", margin: "44px 0 16px" };

  const P: any = {
    color: "rgba(255,255,255,0.75)",
    fontSize: "16.5px",
    lineHeight: "1.85",
    margin: "0 0 16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <article style={{ ...section, paddingTop: "60px", paddingBottom: "80px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          NOS SOLUTIONS MÉTIER
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          Le CRM : savoir qui rappeler, et quoi lui dire
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Un prospect qui demande un devis et qu'on rappelle trois semaines plus tard
          est un prospect perdu. Le CRM tient la liste, la trie par intérêt, et écrit
          la relance à votre place.
        </p>

        <h2 style={H2}>Cinq étapes, une seule liste</h2>
        <p style={P}>
          Prospect, contacté, intéressé, client, perdu. Chaque fiche avance dans ce
          parcours, et vous voyez d'un coup d'œil où en est chacun. Les demandes venues
          de votre site y arrivent seules : formulaire, chat, page de vente.
        </p>

        <h2 style={H2}>Un score, pour savoir par où commencer</h2>
        <p style={P}>
          Chaque fiche porte une note sur cent, calculée sur ce que vous savez du
          prospect : adresse électronique, téléphone, formation qui l'intéresse,
          origine du contact. Plus la fiche est complète, plus le prospect est
          joignable — et c'est celui-là qu'on rappelle en premier.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            L'ANALYSE ET LA RELANCE
          </h3>
          <p style={{ ...P, margin: "0 0 12px", fontSize: "16px" }}>
            Sur une fiche, deux boutons. Le premier analyse le prospect : ce qu'on sait
            de lui, ce qui manque, ce qui bloque probablement.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Le second écrit la relance — un message qui tient compte de son parcours,
            pas un modèle générique. Vous relisez, vous corrigez, vous envoyez.
          </p>
        </div>

        <h2 style={H2}>Pourquoi vous perdez des affaires</h2>
        <p style={P}>
          Une affaire qui ne se fait pas se ferme avec son motif : prix trop élevé,
          concurrent choisi, projet abandonné, pas de budget. Le tableau de bord les
          regroupe par fréquence. Au bout de quelques semaines, ce classement vaut
          mieux qu'une étude de marché — il vient de vos propres clients.
        </p>

        <h2 style={H2}>Du prospect au stagiaire</h2>
        <p style={P}>
          Quand un prospect s'inscrit, sa fiche ne disparaît pas : vous l'inscrivez au
          registre depuis la fiche elle-même, et elle affiche ensuite sa progression et
          ses modules validés. Vous suivez la même personne du premier contact à son
          attestation.
        </p>

        <h2 style={H2}>Joindre vos prospects, depuis la fiche</h2>
        <p style={P}>
          <strong>L'envoi de SMS</strong> — répondre à un prospect, confirmer un
          rendez-vous, rappeler une échéance, sous le nom de votre organisme. Facturé
          à l'unité, sans abonnement : 0,12 € HT le message, dégressif jusqu'à 0,08 €
          selon le volume. Mise en service prochaine.
        </p>
        <p style={P}>
          <strong>Les appels depuis le navigateur</strong> — appeler sans quitter la
          fiche, avec la durée décomptée et l'historique conservé. Votre numéro vous
          est refacturé à prix coûtant, et vous ne payez que les minutes que vous
          consommez : pas d'abonnement, rien à payer les mois où vous n'appelez pas.
          En préparation.
        </p>

        <h2 style={H2}>Pour qui</h2>
        <p style={P}>
          Organismes de formation qui vendent leurs sessions. Centres d'appels et
          équipes commerciales qui travaillent au volume. Le CRM se prend seul, ou avec
          le catalogue et la plateforme d'apprentissage.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Voyez-le sur vos propres prospects</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Quinze minutes suffisent pour comprendre si l'outil vous convient.
            Nous vous adressons le tarif à l'issue de l'échange.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:contact@academiapro.fr?subject=Le%20CRM%20AcadeMIA%20Pro&body=Bonjour%2C%0A%0AJe%20souhaite%20une%20demonstration%20du%20CRM.%0A%0AOrganisme%20%3A%20%0ANombre%20de%20commerciaux%20%3A%20%0ATelephone%20%3A%20%0A%0AMerci."
              style={bouton}
            >
              Demander une démonstration
            </a>
            <Link
              href="/connexion"
              style={{ ...bouton, background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.4)" }}
            >
              Me connecter
            </Link>
          </div>
        </div>
      </article>

    </div>
  );
}
