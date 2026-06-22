"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import LMSSection from "../../../components/LMSSection";
import LMSSophrologie from "../../../components/LMSSophrologie";

function nettoyer_markdown(texte) {
  if (!texte) return "";
  return texte
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function FormationPage({ params }) {
  const { t, langue } = useTranslation("formation");
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetch("/api/formation/" + params.id + "?lang=" + langue)
      .then(r => r.json())
      .then(data => { setFormation(data); setPdfUrl(data.pdf_url || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, langue]);

  if (loading) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</div>
    </div>
  );

  if (!formation || formation.error) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>Formation non trouvee</h1>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  const labels = {
    fr: { support: "Support de cours", support_sub: "Document complet 300+ pages", voir: "Voir le support" },
    en: { support: "Course Materials", support_sub: "Complete document 300+ pages", voir: "View materials" },
    ar: { support: "مواد الدورة", support_sub: "300+ صفحة", voir: "عرض المواد" },
    es: { support: "Material del curso", support_sub: "300+ paginas", voir: "Ver material" },
    pt: { support: "Material do curso", support_sub: "300+ paginas", voir: "Ver material" },
    de: { support: "Kursmaterial", support_sub: "300+ Seiten", voir: "Material ansehen" },
  };
  const lb = labels[langue] || labels.fr;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} - {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{formation.titre}</h1>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          {formation.duree && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{formation.duree}</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{t("niveau")} {formation.niveau}</span>}
          {formation.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{formation.prix}€</span>}
        </div>
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "40px" }}>
          {[
            { icon: "📚", label: t("elearning"), desc: t("elearning_sub") },
            { icon: "🤖", label: t("coach"), desc: t("coach_sub") },
            { icon: "🎥", label: t("classe"), desc: t("classe_sub") },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        {formation.description && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Description</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer_markdown(formation.description)}</p>
          </div>
        )}
        {formation.objectifs && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("objectifs")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer_markdown(formation.objectifs)}</p>
          </div>
        )}
        {formation.prerequis && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("prerequis")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer_markdown(formation.prerequis)}</p>
          </div>
        )}
        {formation.public_cible && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("public_cible")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer_markdown(formation.public_cible)}</p>
          </div>
        )}
        {pdfUrl && (
          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "3px" }}>📄 {lb.support}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{lb.support_sub}</div>
            </div>
            <a href={pdfUrl} target="_blank" style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>{lb.voir}</a>
          </div>
        )}
        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <a href="/dashboard" style={{ flex: 1, display: "block", background: "#c8a96e", color: "#050508", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>{t("coach_btn")}</a>
          <a href="/classe-virtuelle" style={{ flex: 1, display: "block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center", border: "1px solid rgba(200,169,110,0.3)" }}>{t("classe_btn")}</a>
        </div>
        {params.id.toUpperCase() === "F030"
          ? <LMSSophrologie langue={langue} />
          : <LMSSection code={params.id.toUpperCase()} langue={langue} />
        }
      </div>
    </div>
  );
}
