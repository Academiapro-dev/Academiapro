"use client";
import { useTraductionAuto } from "../../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Webinaire Gratuit",
  sousTitre: "Comment automatiser son business avec l IA en 7 jours · 60 minutes",
  champs: { prenom: "Prenom", email: "Email",
    metier: "Metier" },
  bouton: "Reserver ma place gratuitement",
  bas: "1er dimanche du mois a 20h · Places limitees · Replay disponible",
};

const champStyle = {
  width: "100%", background: "#050508",
  border: "1px solid rgba(200,169,110,0.3)",
  borderRadius: "8px", padding: "12px", color: "#fff",
  fontSize: "14px", boxSizing: "border-box" as const,
};
const labelStyle = {
  color: "#c8a96e", fontSize: "13px",
  display: "block" as const, marginBottom: "8px",
};

export default function WebinairePage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "32px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "15px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        <div style={{ background: "#1a1a2e",
          borderRadius: "16px", padding: "40px",
          border: "1px solid rgba(200,169,110,0.3)" }}>
          {[txt.champs.prenom, txt.champs.email,
            txt.champs.metier].map((libelle, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>{libelle}</label>
              <input type="text" style={champStyle} />
            </div>
          ))}
          <button style={{ width: "100%",
            background:
              "linear-gradient(135deg, #c8a96e, #a07840)",
            color: "#050508", border: "none",
            borderRadius: "8px", padding: "14px",
            fontSize: "15px", fontWeight: "bold",
            cursor: "pointer" }}>
            {txt.bouton}
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)",
            fontSize: "12px", textAlign: "center",
            marginTop: "16px" }}>
            {txt.bas}
          </p>
        </div>
      </div>
    </div>
  );
}
