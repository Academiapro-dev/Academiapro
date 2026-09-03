"use client";
import { useEffect, useState } from "react";

// LA PAGE DE VENTE DU PACK — LA PLUS IMPORTANTE DU SITE.
//
// C est celle qu Eric ouvrira, et celle qui porte l argument unique :
// LE CONTENU. Digiforma et Dendreo vendent l outil, jamais les formations.
//
// 🚨🚨 LA STRATEGIE, ARRETEE PAR JACQUES LE 16/08 AU SOIR — NE PAS LA
// REOUVRIR, ET NE RIEN REMETTRE DE CE QUI SUIT.
//
// ACADEMIA PRO DEVIENT LE CATALOGUE, elle ne vend pas un outil de
// fabrication. Ses mots : « les formations que nous generons deviennent
// automatiquement notre propriete, sinon comment aurions-nous construit
// 310 formations qui font partie de notre catalogue ». Aujourd hui 331,
// demain 500, apres-demain 1 000.
//
// 🚨 LE NOMBRE DE FORMATIONS NE S ECRIT PLUS DANS CETTE PAGE — 03/09.
// Il etait fige a 331 alors que le catalogue en compte 560 depuis le 24/08,
// et le tableau de bord en annoncait 310 : trois chiffres pour la meme
// chose, lus par le prospect avant qu il nous appelle. La page interroge
// desormais /api/formations/compte, qui compte les formations ACTIVES en
// base. Une formation ajoutee, et la page suit.
//
// ⚠️ TANT QUE LE COMPTE N EST PAS REVENU (ou s il echoue), LA PHRASE
// S ECRIT SANS NOMBRE : « Des formations pretes a vendre ». Mieux vaut pas
// de chiffre qu un chiffre faux ou un zero.
//
// LE MODELE EST CELUI DE LA SOUS-TRAITANCE DE CONTENU, et c est la pratique
// du metier : l organisme vend l action, porte sa certification et sa
// responsabilite, et SOUS-TRAITE LE CONTENU. Un organisme qui veut produire
// ses propres formations DEVIENT UN CONCURRENT, pas un client.
//
// CE QUI A ETE RETIRE DE CETTE PAGE LE 16/08 AU SOIR, ET NE DOIT PAS
// REVENIR SOUS UNE AUTRE FORME :
//   - la puce « Vos propres formations, creees et publiees sans limite » ;
//   - le paragraphe qui expliquait comment les creer chapitre par chapitre ;
//   - un paragraphe de production sur mesure ou le client commandait, VALIDAIT
//     avant publication, et ou la formation « apparaissait dans SON
//     catalogue ». Jacques l a refuse trois fois : « ce passage me derange ».
//     La validation et le possessif donnaient au client un droit de regard et
//     une propriete sur le contenu — l inverse exact de la strategie.
//
// CE QUI LE REMPLACE, ET C EST SA FORMULATION : dire simplement que la
// plateforme produit d autres parcours qui enrichiront le catalogue le moment
// venu. RIEN DE PLUS. Pas de commande, pas de delai, pas de validation, pas
// de prix. Le sur-mesure se negocie de vive voix, pas sur la page de vente.
//
// TROIS CORRECTIONS DU 16/08 AU MATIN, MAINTENUES.
//
// (1) LES ACCENTS SONT RETABLIS. L ASCII ne concerne que le code ; tout
// texte lu par un client s ecrit en francais.
//
// (2) LE TABLEAU BLANC PARTAGE EST RETIRE, deux fois. Il avait ete demande,
// jamais constate a l ecran. Une fonction qu on souhaite n est pas une
// fonction qu on vend, et une demonstration la demasque en dix secondes.
//
// (3) « LES 21 DOCUMENTS ADMINISTRATIFS » PERD SON CHIFFRE. Vingt-et-un est
// le nombre de briques de Mr. Qualiopi, produit vendu a part. Un chiffre
// precis sur une page de vente oblige a le tenir et vieillit a chaque ajout.
//
// CE QUI A ETE VERIFIE ET RESTE : evaluations, reclamations, formateurs,
// veille, SOUS-TRAITANCE, ameliorations, signatures, positionnements,
// dossiers de financement. Toutes ces tables existent et portent des lignes.
//
// AUCUN PRIX ICI. Decision du 14 aout : le tarif se donne apres un echange,
// comme chez MyUnisoft et Pennylane. Le prix devient la raison de laisser
// ses coordonnees, et chaque consultation produit un prospect.

const FOND = "#050508";
const OR = "#c8a96e";

const CADRE: any = {
  minHeight: "100vh",
  background: FOND,
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "50px 20px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "26px 30px",
  marginBottom: "18px",
};

const H2: any = {
  color: OR,
  fontSize: "21px",
  margin: "0 0 14px",
};

const P: any = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0 0 12px",
};

const PUCE: any = {
  color: "rgba(255,255,255,0.78)",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0 0 9px",
};

export default function PagePack() {
  // null = pas encore connu (ou lecture impossible) : la page ecrit alors
  // ses phrases sans nombre, jamais un zero.
  const [nb, setNb] = useState<number | null>(null);

  useEffect(function () {
    let vivant = true;
    fetch("/api/formations/compte", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (vivant && d && d.ok && d.formations) setNb(d.formations); })
      .catch(function () {});
    return function () { vivant = false; };
  }, []);

  // « 560 » a l affichage, avec l espace insecable des milliers.
  const chiffre = nb === null ? null : nb.toLocaleString("fr-FR");

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          POUR LES ORGANISMES DE FORMATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "34px", lineHeight: "1.3", margin: "0 0 16px" }}>
          {chiffre ? chiffre + " formations prêtes à vendre," : "Des formations prêtes à vendre,"}<br />et tout l&apos;administratif qui va avec
        </h1>
        <p style={{ ...P, fontSize: "18px" }}>
          Les logiciels de gestion vous donnent un outil. Nous vous donnons le contenu :
          {chiffre ? " " + chiffre + " formations" : " des formations"} à distance, rédigées et
          corrigées, que vous proposez à vos stagiaires dès demain sous votre nom. Avec la
          plateforme, les documents obligatoires et votre bilan pédagogique préparé.
        </p>

        <div style={{ ...CARTE, border: "2px solid " + OR, marginTop: "36px" }}>
          <h2 style={{ ...H2, fontSize: "18px", margin: "0 0 14px" }}>Ce que comprend le pack</h2>

          <p style={PUCE}><span style={{ color: OR }}>·</span> {chiffre ? "Les " + chiffre + " formations du catalogue, à vos prix" : "Les formations du catalogue, à vos prix"}</p>
          {/* 🚨 « STAGIAIRES ILLIMITES » RETIRE LE 03/09. La grille tarifaire
              arretee le meme jour facture le stagiaire actif (49 / 39 / 29 €
              par mois selon le volume) : la promesse contredisait le devis,
              et c est exactement la ligne qu un prospect releve. */}
          <p style={PUCE}><span style={{ color: OR }}>·</span> Facturation au stagiaire actif, dégressive selon le volume</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Correction des questionnaires par IA, erreur par erreur</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Classes virtuelles avec présences horodatées</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Vos documents administratifs, à votre en-tête</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Signature électronique et archivage</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Suivi commercial et page publique</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Bilan pédagogique et financier préparé, cadre par cadre</p>

          <div style={{ borderTop: "1px solid rgba(200,169,110,0.25)", marginTop: "20px", paddingTop: "18px" }}>
            <p style={{ ...P, fontSize: "15.5px", margin: "0 0 16px" }}>
              Le tarif dépend de votre volume de stagiaires et des options que vous retenez.
              Nous vous l'adressons après un échange de quinze minutes, avec le détail de ce
              qui est compris et de ce qui ne l'est pas.
            </p>
            <a
              href="mailto:contact@academiapro.fr?subject=Tarif%20du%20pack%20organisme&body=Bonjour%2C%0A%0AJe%20souhaite%20recevoir%20le%20tarif%20du%20pack%20organisme.%0A%0AOrganisme%20%3A%20%0ANumero%20de%20declaration%20d%20activite%20%3A%20%0ANombre%20de%20stagiaires%20par%20an%20%3A%20%0ATelephone%20%3A%20%0A%0AMerci."
              style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 34px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}
            >
              Recevoir le tarif
            </a>
          </div>
        </div>

        <div style={CARTE}>
          <h2 style={H2}>Ce que vous faites avec la plateforme</h2>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "8px" }}>Classes en direct</p>
          <p style={P}>
            Réunissez vos stagiaires en visioconférence. Les entrées et les sorties sont
            horodatées et conservées : vous gardez une trace d'assiduité pour vos formations
            synchrones.
          </p>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>
            Vos documents, signés électroniquement
          </p>
          <p style={P}>
            Programme, devis, convention, convocation, livret d'accueil, attestations : produits à
            votre en-tête, en un clic. Vos conventions et devis se signent en ligne, le document
            est archivé et son empreinte conservée.
          </p>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>
            Tout ce qu'un auditeur demande
          </p>
          <p style={P}>
            Évaluations à chaud et à froid avec leur taux de retour, registre des réclamations et
            de leurs actions correctives, dossiers de vos formateurs, registres de veille, suivi
            de la sous-traitance avec ses contrats, plan d'amélioration continue. Et votre bilan
            pédagogique prérempli, cadre par cadre.
          </p>

          {/* LE CATALOGUE QUI S ENRICHIT — FORMULATION DE JACQUES, MOT POUR MOT :
              « la plateforme AcadeMIA Pro est en train de produire d autres
              parcours de formation qui viendront enrichir le catalogue
              ulterieurement, le moment venu. C EST TOUT. »
              Ne rien ajouter ici : ni delai, ni commande, ni validation, ni
              prix. Toute precision supplementaire rouvre la porte que cette
              page vient de fermer. */}
          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>
            Un catalogue qui s'enrichit
          </p>
          <p style={{ ...P, margin: 0 }}>
            La plateforme produit en continu de nouveaux parcours de formation, qui viendront
            enrichir le catalogue et vous seront ouverts le moment venu.
          </p>
        </div>

        {/* CE QUE NOUS FAISONS, CE QUE NOUS NE FAISONS PAS.
            Le fond a ete dicte par Jacques le 14 aout et ne bouge pas.
            MAINTENU : l habilitation par un certificateur ne s achete pas,
            elle depend de ses criteres. Ecrire qu une redevance suffit
            serait une promesse dont nous porterions la responsabilite.
            CORRIGE LE 16/08 : « les standards les plus exigeants » etait
            une affirmation de qualite inverifiable. Le fait vaut mieux que
            le superlatif.
            AJOUTE LE 16/08 AU SOIR : la propriete des contenus. Elle doit se
            lire ici, pas se decouvrir a la signature du bon de commande. */}
        <div style={{ ...CARTE, background: "rgba(255,255,255,0.015)" }}>
          <h2 style={{ ...H2, fontSize: "19px" }}>Ce que nous faisons, ce que nous ne faisons pas</h2>

          <p style={P}>
            Nos formations sont structurées chapitre par chapitre, avec une évaluation à la fin
            de chaque module et une correction expliquée erreur par erreur. L'objectif est
            simple — que le stagiaire arrive au bout, et qu'il en sorte avec quelque chose
            d'utilisable dès le lendemain.
          </p>

          <p style={P}>
            Nos formateurs sont des agents d'intelligence artificielle, disponibles à toute
            heure, qui répondent à la question du stagiaire au moment où il se la pose. Tout est
            mis en place pour qu'il réussisse sa formation. Un organisme qui reprend notre
            catalogue et préfère y adjoindre ses propres formateurs en présentiel reste libre de
            le faire : c'est son choix, pas le nôtre. Le nôtre est de proposer l'excellence avec
            les outils technologiques de dernière génération.
          </p>

          <p style={P}>
            Les formations du catalogue restent notre propriété. Vous les diffusez à vos
            stagiaires et les vendez sous votre nom pendant toute la durée de notre accord, à vos
            prix. Vos marques, votre logo et vos éléments vous restent acquis : nous ne les
            utilisons que pour habiller la plateforme et vos documents à vos couleurs.
          </p>

          <p style={P}>
            Nous avons choisi de ne pas enregistrer ces formations au Répertoire national des
            certifications professionnelles ni au répertoire spécifique. Nous ne délivrons donc
            aucune certification reconnue par l'État, et nos formations ne sont pas directement
            éligibles au compte personnel de formation.
          </p>

          <p style={P}>
            Un organisme certifié Qualiopi qui souhaite aller plus loin peut se rapprocher d'un
            certificateur pour être habilité à délivrer l'une de ses certifications enregistrées.
            L'habilitation dépend des critères propres à chaque certificateur, et donne
            généralement lieu à une redevance par candidat. C'est une démarche possible, que
            nous n'assurons pas à votre place.
          </p>

          <p style={{ ...P, margin: 0 }}>
            Pour les entreprises, la voie est plus directe encore : un organisme certifié
            Qualiopi peut proposer ces formations dans le cadre d'un financement OPCO, sans
            passer par une certification enregistrée.
          </p>
        </div>

        <div style={{ textAlign: "center", margin: "40px 0 20px" }}>
          <a
            href="mailto:contact@academiapro.fr?subject=Pack%20organismes%20de%20formation"
            style={{ display: "inline-block", background: OR, color: FOND, padding: "17px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "17px" }}
          >
            Demander une démonstration
          </a>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "16px" }}>
            contact@academiapro.fr — réponse dans la journée
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>
          <a href="/pack/cgv" style={{ color: "rgba(255,255,255,0.45)" }}>Conditions générales de vente</a>
        </p>
      </div>
    </div>
  );
}
