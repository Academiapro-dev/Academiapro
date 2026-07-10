"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "20 Skills AcadémIA Pro",
  sousTitre: "Compétences clés · Certifiantes · Applicables immediatement",
  badge: "SKILL",
  voir: "Voir",
  items: [
    { code: "SK01", titre: "Ecrire avec Claude", prix: "97euro", desc: "IA · Maitrisez la redaction avec IA" },
    { code: "SK02", titre: "Automatiser ses emails", prix: "97euro", desc: "IA · Gain de temps quotidien" },
    { code: "SK03", titre: "Creer des visuels IA", prix: "97euro", desc: "IA · Midjourney · DALL-E · Canva IA" },
    { code: "SK04", titre: "Analyser des donnees", prix: "97euro", desc: "IA · Excel · Python · Claude" },
    { code: "SK05", titre: "Creer un chatbot 24h", prix: "97euro", desc: "IA · Sans coder en moins de 2h" },
    { code: "SK06", titre: "Prompts parfaits", prix: "97euro", desc: "IA · 50 templates professionnels" },
    { code: "SK07", titre: "Automatiser avec Make", prix: "97euro", desc: "IA · No-Code · 10 workflows" },
    { code: "SK08", titre: "Landing page IA", prix: "97euro", desc: "IA · Convertissante en 1 heure" },
    { code: "SK09", titre: "LinkedIn avec IA", prix: "97euro", desc: "IA · Prospecter · Publier · Convertir" },
    { code: "SK10", titre: "Agent IA simple", prix: "97euro", desc: "IA · Votre premier agent en 3h" },
    { code: "SK11", titre: "Offre irresistible", prix: "97euro", desc: "Business · Positionnement · Prix" },
    { code: "SK12", titre: "Pitch en 30 minutes", prix: "97euro", desc: "Business · Convaincre investisseurs" },
    { code: "SK13", titre: "Prospecter LinkedIn", prix: "97euro", desc: "Business · 10 clients en 30 jours" },
    { code: "SK14", titre: "Negocier son salaire", prix: "97euro", desc: "Business · +20% garantis" },
    { code: "SK15", titre: "Gerer son temps avec IA", prix: "97euro", desc: "Business · Productivite maximale" },
    { code: "SK16", titre: "Meditation quotidienne", prix: "47euro", desc: "Bien-etre · 10 minutes par jour" },
    { code: "SK17", titre: "Gerer son stress", prix: "47euro", desc: "Bien-etre · Techniques validees" },
    { code: "SK18", titre: "Mieux dormir", prix: "47euro", desc: "Bien-etre · Protocole en 7 jours" },
    { code: "SK19", titre: "Confiance en soi", prix: "47euro", desc: "Bien-etre · Exercices pratiques" },
    { code: "SK20", titre: "Booster son energie", prix: "47euro", desc: "Bien-etre · Methode naturelle" },
  ],
};

export default function SkillsPage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center",
          marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "36px",
            margin: "0 0 12px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "15px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns:
          "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px" }}>
          {txt.items.map((item) => (
            <div key={item.code} style={{
              background: "#1a1a2e", borderRadius: "12px",
              padding: "24px",
              border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e",
                  fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e",
                  color: "#050508", padding: "2px 8px",
                  borderRadius: "10px", fontSize: "10px",
                  fontWeight: "bold" }}>{txt.badge}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px",
                margin: "0 0 8px", lineHeight: "1.4" }}>
                {item.titre}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)",
                fontSize: "12px", margin: "0 0 16px" }}>
                {item.desc}
              </p>
              <div style={{ display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e",
                  fontSize: "22px", fontWeight: "bold" }}>
                  {item.prix}
                </span>
              </div>
              <a href="#" style={{ display: "block",
                background:
                  "linear-gradient(135deg, #c8a96e, #a07840)",
                color: "#050508", borderRadius: "8px",
                padding: "10px", fontSize: "13px",
                fontWeight: "bold", textAlign: "center",
                textDecoration: "none" }}>{txt.voir}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
