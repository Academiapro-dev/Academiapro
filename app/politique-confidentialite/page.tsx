"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Politique de Confidentialite",
  sousTitre: "Conforme RGPD · Derniere mise a jour : juillet 2026",
  sections: [
    { titre: "Responsable du traitement",
      corps: "AcadémIA Pro LLC · 30 N Gould St STE R · Sheridan WY 82801 · Etats-Unis. La Societe exploite plusieurs plateformes et marques (AcadémIA Pro, HebrewPro AI, et toute autre plateforme actuelle ou future). Contact : contact@academiapro.fr" },
    { titre: "Donnees collectees",
      corps: "Donnees d identification (nom, prenom, email, pays de residence) · donnees de connexion (adresse IP, logs, navigateur) · donnees de paiement (traitees par Stripe, non stockees par nous) · donnees d usage (contenus consultes, progression) · donnees de conversation avec les agents IA (anonymisees et agregees pour l amelioration des modeles)." },
    { titre: "Finalites et bases legales",
      corps: "Gestion du compte et execution du contrat · traitement des paiements · delivrance des services · envoi de communications commerciales (consentement) · amelioration des systemes IA (interet legitime / consentement) · obligations comptables et fiscales (obligation legale) · prevention de la fraude (interet legitime)." },
    { titre: "Donnees sensibles",
      corps: "Nous ne collectons pas de donnees de sante au sens de l article 9 du RGPD. Vous etes invite a ne pas divulguer de donnees medicales dans vos interactions avec les agents IA." },
    { titre: "Transferts hors Union Europeenne",
      corps: "AcadémIA Pro LLC etant une societe de droit americain, des transferts de donnees vers les Etats-Unis sont effectues. Ces transferts sont encadres par les Clauses Contractuelles Types de la Commission Europeenne (Decision 2021/914) et, le cas echeant, par le cadre EU-U.S. Data Privacy Framework." },
    { titre: "Durees de conservation",
      corps: "Donnees de compte actif : duree d abonnement + 3 ans · donnees comptables et factures : 10 ans (obligation legale) · logs de connexion : 13 mois · transcriptions de seances : 12 mois · apres suppression de compte : purge sous 30 jours." },
    { titre: "Vos droits",
      corps: "Conformement aux articles 15 a 22 du RGPD, vous disposez d un droit d acces · de rectification · d effacement · de limitation · de portabilite · d opposition · de retrait du consentement. A exercer a contact@academiapro.fr, avec justificatif d identite. Reponse sous un mois. Reclamation possible aupres de la CNIL (www.cnil.fr)." },
    { titre: "Cookies",
      corps: "L utilisation de cookies est regie par notre gestion des preferences accessible via le bandeau de consentement. Vous pouvez a tout moment modifier vos choix." },
    { titre: "Contact",
      corps: "Pour toute question relative a vos donnees : contact@academiapro.fr" },
  ],
};

const carte = {
  background: "#1a1a2e", borderRadius: "16px",
  padding: "32px",
  border: "1px solid rgba(200,169,110,0.3)",
  marginBottom: "24px",
};

export default function PolitiqueConfidentialitePage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.5)",
            fontSize: "13px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        {txt.sections.map((section, i) => (
          <div key={i} style={carte}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px",
              margin: "0 0 14px" }}>{section.titre}</h2>
            <p style={{ color: "rgba(255,255,255,0.7)",
              fontSize: "14px", lineHeight: "1.8",
              margin: "0", whiteSpace: "pre-line" }}>
              {section.corps}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
