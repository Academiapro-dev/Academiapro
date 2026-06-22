"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import LMSSection from "../../../components/LMSSection";

function nettoyer_markdown(texte: string): string {
  if (!texte) return "";
  return texte
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function FormationPage({ params }: { params: { id: string } }) {
  const { t, langue } = useTranslation("formation");
  const [formation, setFormation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/formation/${params.id}?lang=${langue}`)
      .then(r => r.json())
      .then(data => {
        setFormation(data);
        setPdfUrl(data.pdf_url || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, langue]);

  if (loading) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</div>
    </div>
  );

  if (!formation || formation.error) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>Formation non trouvée</h1>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  const labels: Record<string, Record<string, string>> = {
    fr: { support: "Support de cours", support_sub: "Document complet · 300+ pages", voir: "Voir le support" },
    en: { support: "Course Materials", support_sub: "Complete document · 300+ pages", voir: "View materials" },
    ar: { support: "مواد الدورة", support_sub: "وثيقة كاملة · 300+ صفحة", voir: "عرض المواد" },
    es: { support: "Material del curso", support_sub: "Documento completo · 300+ páginas", voir: "Ver material" },
    pt: { support: "Material do curso", support_sub: "Documento completo · 300+ páginas", voir: "Ver material" },
    de: { support: "Kursmaterial", support_sub: "Vollständiges Dokument · 300+ Seiten", voir: "Material ansehen" },
  };
  const lb = labels[langue] || labels.fr;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} · {formation.domaine}</div>
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
