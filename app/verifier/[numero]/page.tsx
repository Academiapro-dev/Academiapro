export default function VerifierPage({ params }: { params: { numero: string } }) {
  const estValide = params.numero && params.numero.length > 5;
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 24px" }}>VERIFICATION CERTIFICAT</p>
        {estValide ? (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ color: "#22c55e", fontSize: "28px", margin: "0 0 12px" }}>Certificat Authentique</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", margin: "0 0 8px" }}>Numéro : {params.numero}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0" }}>Ce certificat a ete delivre par AcadémIA Pro et est authentique.</p>
          </div>
        ) : (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ color: "#ef4444", fontSize: "28px", margin: "0 0 12px" }}>Certificat Non Reconnu</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0" }}>Ce numero de certificat n est pas dans notre base de donnees.</p>
          </div>
        )}
      </div>
    </div>
  );
}