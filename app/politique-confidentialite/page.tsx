export default function PolitiqueConfidentialitePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>Politique de Confidentialite</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>RGPD · Protection de vos donnees personnelles</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Responsable du Traitement</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>AcadémIA Pro est responsable du traitement de vos donnees personnelles. Contact : privacy@academiapro.fr</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Donnees Collectees</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Nom · prenom · email · metier · progression formations · historique seances · donnees de paiement via Stripe.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Finalites du Traitement</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Gestion des acces formations · personnalisation par agent IA · facturation · communication commerciale avec consentement.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Base Legale</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Execution du contrat · interet legitime pour ameliorer nos services · consentement pour les communications marketing.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Duree de Conservation</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Donnees clients : duree du contrat + 3 ans. Donnees comptables : 10 ans. Cookies : 13 mois maximum.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Vos Droits</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Acces · rectification · suppression · portabilite · opposition. Exercez vos droits a privacy@academiapro.fr ou aupres de la CNIL.</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 16px" }}>Destinataires</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.8", margin: "0" }}>Supabase (hebergement donnees · Europe) · Stripe (paiement) · Resend (emails) · Vercel (hebergement site).</p>
        </div>
      </div>
    </div>
  );
}