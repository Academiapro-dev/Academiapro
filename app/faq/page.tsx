"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "FAQ",
  titre: "Questions Frequentes",
  sousTitre: "Toutes les reponses sur AcademIA Pro",
  autreQuestion: "Une autre question ?",
  equipe: "Nous vous repondons dans les meilleurs delais",
  contacter: "Nous contacter",
  questions: [
    { q: "Comment acceder aux formations ?", r: "Apres achat · vous recevez un email avec vos acces. Connectez-vous sur academiapro.fr et retrouvez vos formations dans Mon Espace." },
    { q: "Combien de temps ai-je acces ?", r: "Acces a vie sur toutes les formations achetees. Mises a jour incluses gratuitement." },
    { q: "Comment obtenir mon attestation ?", r: "Completez tous les modules et obtenez un score minimum de 70% aux quiz. Votre attestation est generee automatiquement. Il s agit d un document interne a AcademIA Pro · sans valeur legale externe · qui n est enregistre ni au RNCP ni au repertoire specifique." },
    { q: "Comment reserver une seance ?", r: "Dans Mon Espace · cliquez sur Reserver une seance · choisissez votre specialite · format et creneau. Confirmation immediate." },
    { q: "Quels moyens de paiement ?", r: "Carte bancaire · paiement en une fois ou en 4 mensualites. Facture disponible dans votre espace." },
    { q: "Puis-je me retracter apres l achat ?", r: "Vous disposez de 14 jours calendaires pour vous retracter · tant que vous n avez accede a aucun contenu. Ecrivez a contact@academiapro.fr avec l objet Retractation. Les modalites completes figurent sur la page Droit de retractation." },
    { q: "Mes formations sont-elles eligibles au CPF ?", r: "Non. AcademIA Pro n est pas certifiee Qualiopi et ses formations ne sont enregistrees ni au RNCP ni au repertoire specifique. Elles ne sont donc eligibles ni au CPF ni a un financement OPCO. La souscription se fait sur fonds propres." },
    { q: "L agent IA est-il vraiment disponible 24h/24 ?", r: "Oui · votre agent IA personnel repond a toutes heures · memorise votre historique et s adapte a votre niveau. L integralite des contenus et des corrections est produite par intelligence artificielle · aucun formateur humain n intervient." },
    { q: "Puis-je acceder depuis mobile ?", r: "Oui · AcademIA Pro est entierement responsive et disponible en PWA installable sur votre telephone." },
    { q: "Comment fonctionne le paiement en 4 mensualites ?", r: "Le montant de la formation est reparti en quatre echeances mensuelles egales · prelevees automatiquement. L acces a la formation est ouvert des la premiere echeance." },
    { q: "Puis-je offrir une formation ?", r: "Oui · contactez-nous a contact@academiapro.fr pour offrir une formation. Nous vous envoyons un bon cadeau personnalise." },
  ],
};

export default function FaqPage() {
  const { txt } = useTraductionAuto(FR);
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FR.questions.map(function(item) {
          return { "@type": "Question", "name": item.q,
                   "acceptedAnswer": { "@type": "Answer", "text": item.r } };
        })
      }) }} />
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>{txt.surTitre}</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>{txt.sousTitre}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {txt.questions.map((item, i) => (
            <div key={i} style={{ background: "#1a1a2e", borderRadius: "12px", border: "1px solid rgba(200,169,110,0.3)", overflow: "hidden" }}>
              <button
                onClick={() => setOuvert(ouvert === i ? null : i)}
                style={{ width: "100%", background: "transparent", border: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ color: "#fff", fontSize: "15px", fontWeight: "500" }}>{item.q}</span>
                <span style={{ color: "#c8a96e", fontSize: "20px", marginLeft: "16px" }}>{ouvert === i ? "−" : "+"}</span>
              </button>
              {ouvert === i && (
                <div style={{ padding: "0 24px 20px", borderTop: "1px solid rgba(200,169,110,0.2)" }}>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7", margin: "16px 0 0" }}>{item.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "48px", padding: "32px", background: "#1a1a2e", borderRadius: "16px", border: "1px solid #c8a96e", textAlign: "center" }}>
          <p style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 8px" }}>{txt.autreQuestion}</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 16px" }}>{txt.equipe}</p>
          <a href="/contact" style={{ display: "inline-block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "12px 28px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>{txt.contacter}</a>
        </div>
      </div>
    </div>
  );
}
