import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function VerifierPage({ params }: { params: { numero: string } }) {
  const { data: certif } = await supabase
    .from("certificats_delivres")
    .select("*")
    .eq("certif_id", params.numero)
    .single();

  const estValide = !!certif;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 24px" }}>VERIFICATION CERTIFICAT / CERTIFICATE VERIFICATION</p>
        {estValide ? (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ color: "#22c55e", fontSize: "28px", margin: "0 0 6px" }}>Certificat Authentique</h1>
            <p style={{ color: "rgba(34,197,94,0.8)", fontSize: "15px", margin: "0 0 16px" }}>Authentic Certificate</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", margin: "0 0 8px" }}>Numero / Number : {params.numero}</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: "0 0 4px", fontWeight: "bold" }}>{certif.nom}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 4px" }}>{certif.formation_titre}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0" }}>Delivre le / Issued on {new Date(certif.date_obtention).toLocaleDateString("fr-FR")}</p>
          </div>
        ) : (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ color: "#ef4444", fontSize: "28px", margin: "0 0 6px" }}>Certificat Non Reconnu</h1>
            <p style={{ color: "rgba(239,68,68,0.8)", fontSize: "15px", margin: "0 0 16px" }}>Certificate Not Recognized</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0" }}>Ce numero n est pas dans notre base. / This number is not in our database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
