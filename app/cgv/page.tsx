"use client";
import { useState } from "react";

export default function CGVPage() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections = [
    {
      title: "1. Identification du vendeur",
      content: "La société ACADEMIA PRO, SAS au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 123 456 789, dont le siège social est situé au 12 rue de la Formation, 75001 Paris, France. Numéro de TVA intracommunautaire : FR12 123456789. Téléphone : +33 1 23 45 67 89. Email : contact@academiapro.fr. Directeur de la publication : Jean Dupont."
    },
    {
      title: "2. Objet et champ d'application",
      content: "Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les ventes de formations en ligne, contenus numériques et services éducatifs proposés par ACADEMIA PRO sur le site www.academiapro.fr. Elles sont conformes aux dispositions du Code de la consommation français, notamment les articles L.111-1 et suivants. Toute commande implique l'acceptation pleine et entière des présentes CGV."
    },
    {
      title: "3. Produits et services",
      content: "ACADEMIA PRO propose des formations en ligne, tutoriels vidéo, e-books, webinaires et programmes de coaching professionnel. Les caractéristiques essentielles de chaque produit sont décrites sur la page de présentation correspondante. Les photographies et visuels sont fournis à titre illustratif. En cas d'erreur manifeste, ACADEMIA PRO se réserve le droit de corriger le prix avant la confirmation de commande."
    },
    {
      title: "4. Prix",
      content: "Les prix sont indiqués en euros (€) toutes taxes comprises (TTC). Le taux de TVA applicable est celui en vigueur au jour de la commande (20 % pour les services numériques). ACADEMIA PRO se réserve le droit de modifier ses prix à tout moment. Les prix affichés lors de la validation de la commande sont les prix définitifs. Des offres promotionnelles peuvent être proposées pour une durée limitée, sous réserve des stocks ou places disponibles."
    },
    {
      title: "5. Modalités de commande",
      content: "La commande est passée en ligne via le site www.academiapro.fr. Le processus de commande comprend : (1) sélection du produit ou service, (2) création ou connexion au compte client, (3) vérification du récapitulatif de commande, (4) acceptation des CGV, (5) choix du mode de paiement, (6) confirmation et paiement. Un email de confirmation est envoyé à l'adresse fournie par le client dans un délai de 24 heures. ACADEMIA PRO se réserve le droit de refuser toute commande pour motif légitime."
    },
    {
      title: "6. Paiement",
      content: "Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express), PayPal ou virement bancaire. Les transactions sont sécurisées par le protocole SSL et le système 3D Secure. Le débit est effectué au moment de la validation de la commande. En cas de paiement en plusieurs fois, les modalités sont précisées lors de la commande. Tout incident de paiement peut entraîner la suspension de l'accès aux services commandés."
    },
    {
      title: "7. Livraison et accès aux contenus numériques",
      content: "Pour les contenus numériques (formations en ligne, e-books, vidéos) : l'accès est fourni immédiatement après confirmation du paiement via l'espace personnel du client sur www.academiapro.fr. Un email contenant les identifiants d'accès est envoyé dans un délai maximum de 24 heures ouvrées. Pour les formations physiques ou présentations, les modalités de livraison (lieu, date, délai) sont précisées sur la page produit. En cas de retard ou d'impossibilité de livraison, le client est informé dans les meilleurs délais."
    },
    {
      title: "8. Droit de rétractation",
      content: "Conformément aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose d'un délai de 14 jours calendaires à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à justifier de motifs. EXCEPTION : Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques dont l'exécution a commencé avec l'accord exprès du consommateur et la renonciation expresse à son droit de rétractation. Pour exercer ce droit, le client doit notifier sa décision à : contact@academiapro.fr en utilisant le formulaire de rétractation disponible en annexe ou par lettre recommandée avec accusé de réception. En cas de rétractation valide, ACADEMIA PRO remboursera l'intégralité des sommes versées dans un délai de 14 jours suivant la réception de la demande."
    },
    {
      title: "9. Formulaire de rétractation",
      content: "À l'attention de ACADEMIA PRO, 12 rue de la Formation, 75001 Paris — contact@academiapro.fr. Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*)/pour la prestation de services (*) ci-dessous : Commandé le (*)/reçu le (*) : ______. Nom du (des) consommateur(s) : ______. Adresse du (des) consommateur(s) : ______. Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) : ______. Date : ______. (*) Rayez la mention inutile."
    },
    {
      title: "10. Garanties légales",
      content: "Conformément aux articles L.217-4 et suivants du Code de la consommation, ACADEMIA PRO est tenu par la garantie légale de conformité pour les contenus numériques et les biens. Le client bénéficie également de la garantie contre les vices cachés prévue aux articles 1641 et suivants du Code civil. Pour tout défaut de conformité constaté, le client doit contacter contact@academiapro.fr en décrivant le problème. ACADEMIA PRO s'engage à apporter une solution dans un délai raisonnable."
    },
    {
      title: "11. Responsabilité",
      content: "ACADEMIA PRO s'engage à fournir ses services avec le plus grand soin et professionnalisme. Toutefois, sa responsabilité ne saurait être engagée en cas de force majeure, d'utilisation non conforme des services par le client, de faits imputables à un tiers, ou de dommages indirects résultant de l'utilisation des contenus. Les formations et contenus proposés ont une vocation éducative. Les résultats obtenus par les apprenants dépendent de leur propre investissement et ne peuvent être garantis. La responsabilité d'ACADEMIA PRO est limitée au montant de la commande concernée."
    },
    {
      title: "12. Propriété intellectuelle",
      content: "L'ensemble des contenus disponibles sur www.academiapro.fr (textes, images, vidéos, formations, logos, marques) sont la propriété exclusive d'ACADEMIA PRO ou de ses partenaires et sont protégés par le droit d'auteur et la propriété intellectuelle. Toute reproduction, diffusion, distribution ou utilisation commerciale sans autorisation préalable écrite est strictement interdite et pourra faire l'objet de poursuites judiciaires. L'accès aux formations est strictement personnel et non transférable."
    },
    {
      title: "13. Protection des données personnelles (RGPD)",
      content: "ACADEMIA PRO traite vos données personnelles en qualité de responsable de traitement, conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi Informatique et Libertés modifiée. Les données collectées (nom, prénom, email, adresse, données de paiement) sont utilisées pour : traiter vos commandes, gérer votre compte client, vous envoyer des informations relatives à vos formations, améliorer nos services. Vos données sont conservées pendant 3 ans à compter de la dernière commande. Elles ne sont jamais vendues à des tiers. Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition en contactant : contact@academiapro.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)."
    },
    {
      title: "14. Cookies",
      content: "Le site www.academiapro.fr utilise des cookies techniques nécessaires au bon fonctionnement du site, ainsi que des cookies analytiques et marketing soumis à votre consentement préalable. Vous pouvez gérer vos préférences en matière de cookies à tout moment via notre outil de gestion des consentements. Pour plus d'informations, consultez notre Politique de Confidentialité disponible sur le site."
    },
    {
      title: "15. Service client et réclamations",
      content: "Pour toute question, réclamation ou demande d'assistance, notre service client est disponible : Par email : contact@academiapro.fr (réponse sous 48h ouvrées). Par téléphone : +33 1 23 45 67 89 (du lundi au vendredi, 9h-18h). Par courrier : ACADEMIA PRO, Service Client, 12 rue de la Formation, 75001 Paris. En cas de litige non résolu amiablement, vous pouvez recourir gratuitement à la médiation de la consommation via le médiateur agréé : [Nom du médiateur], disponible sur [site du médiateur]."
    },
    {
      title: "16. Médiation et règlement des litiges",
      content: "Conformément à l'ordonnance n°2015-1033 du 20 août 2015 et au décret n°2015-1382 du 30 octobre 2015, en cas de litige non résolu amiablement, le client peut saisir gratuitement le médiateur de la consommation compétent. La plateforme européenne de règlement en ligne des litiges est accessible sur : https://ec.europa.eu/consumers/odr. Pour les litiges entre professionnels, le Tribunal de Commerce de Paris est seul compétent."
    },
    {
      title: "17. Droit applicable et juridiction",
      content: "Les présentes CGV sont soumises au droit français. En cas de litige concernant leur interprétation, leur exécution ou leur validité, et à défaut de résolution amiable, les tribunaux français seront seuls compétents. Pour les consommateurs résidant dans un autre État membre de l'Union Européenne, les dispositions impératives de protection des consommateurs de leur pays de résidence s'appliquent également."
    },
    {
      title: "18. Modification des CGV",
      content: "ACADEMIA PRO se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables sont celles en vigueur à la date de la commande. Les modifications entrent en vigueur dès leur publication sur le site. Il est conseillé au client de consulter régulièrement cette page. La poursuite de l'utilisation du site après modification des CGV vaut acceptation des nouvelles conditions."
    }
  ];

  return (
    <div style={{
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#e8e0d0",
      padding: "0"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #1a1408 50%, #0a0a12 100%)",
        borderBottom: "1px solid #c8a96e",
        padding: "60px 20px 50px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          background: "radial-gradient(ellipse at center top, rgba(200,169,110,0.08) 0%, transparent 70%)",
          pointerEvents: "none"
        }}></div>
        <div style={{
          display: "inline-block",
          borderTop: "1px solid #c8a96e",
          borderBottom: "1px solid #c8a96e",
          padding: "6px 40px",
          marginBottom: "20px",
          letterSpacing: "4px",
          fontSize: "11px",
          color: "#c8a96e",
          textTransform: "uppercase"
        }}>
          Academia Pro
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: "300",
          letterSpacing: "3px",
          color: "#f0e8d8",
          margin: "0 0 16px 0",
          textTransform: "uppercase"
        }}>
          Conditions Générales de Vente
        </h1>
        <p style={{
          color: "#c8a96e",
          fontSize: "14px",
          letterSpacing: "2px",
          margin: "0 0 8px 0"
        }}>
          Conformes au droit français et au RGPD
        </p>
        <p style={{
          color: "#8a7a6a",
          fontSize: "12px",
          margin: "0"
        }}>
          Dernière mise à jour : 1er janvier 2025
        </p>
      </div>

      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "50px 20px 80px 20px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(200,169,110,0.02) 100%)",
          border: "1px solid rgba(200,169,110,0.25)",
          borderRadius: "2px",
          padding: "28px 32px",
          marginBottom: "48px",
          position: "relative"
        }}>
          <div style={{
            position: "absolute",
            top: "0",
            left: "32px",
            width: "60px",
            height: "2px",
            backgroundColor: "#c8a96e"
          }}></div>
          <p style={{
            color: "#b8a898",
            lineHeight: "1.9",
            fontSize: "14px",
            margin: "0"