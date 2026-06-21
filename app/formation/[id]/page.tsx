"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import LMSSection from "../../../components/LMSSection";

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
            </div>
          ))}
        </div>

        {formation.description && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Description</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.description}</p>
          </div>
        )}

        {formation.objectifs && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("objectifs")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.objectifs}</p>
          </div>
        )}

        {formation.prerequis && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("prerequis")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.prerequis}</p>
          </div>
        )}

        {formation.public_cible && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("public_cible")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.public_cible}</p>
          </div>
        )}

        {formation.programme && Array.isArray(formation.programme) && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>{t("programme")}</h2>
            {formation.programme.map((ch: any, i: number) => (
              <div key={i} style={{ marginBottom: "15px", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "12px 20px" }}>
                  <h3 style={{ color: "#fff", margin: 0, fontFamily: "Georgia,serif", fontSize: "15px" }}>
                    {ch.chapitre} — {ch.titre}
                  </h3>
                </div>
                {ch.modules && (
                  <div style={{ padding: "10px 20px" }}>
                    {ch.modules.map((mod: any, j: number) => (
                      <div key={j} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                        <span>{mod.module} — {mod.titre}</span>
                        {mod.duree && <span style={{ color: "#c8a96e" }}>{mod.duree}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pdfUrl && (
          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "3px" }}>📄 Support de cours</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Document complet · Français · 300+ pages</div>
            </div>
            <a href={pdfUrl} target="_blank"
              style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>
              Voir le support
            </a>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <a href="/dashboard" style={{ flex: 1, display: "block", background: "#c8a96e", color: "#050508", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>
            {t("coach_btn")}
          </a>
          <a href="/classe-virtuelle" style={{ flex: 1, display: "block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center", border: "1px solid rgba(200,169,110,0.3)" }}>
            {t("classe_btn")}
          </a>
        </div>

        <LMSSection code={params.id.toUpperCase()} />

      </div>
    </div>
  );
}
