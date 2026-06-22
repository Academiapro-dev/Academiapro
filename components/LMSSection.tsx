"use client";
import { useState, useEffect } from "react";

function nettoyer(texte) {
  if (!texte) return "";
  return texte
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/---/g, "")
    .trim();
}

export default function LMSSection({ code, langue = "fr" }) {
  const [lms, setLms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapitreActif, setChapitreActif] = useState(0);
  const [moduleActif, setModuleActif] = useState(0);

  useEffect(() => {
    fetch("/api/lms/" + code)
      .then(r => r.json())
      .then(data => { setLms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#c8a96e" }}>Chargement...</div>;
  if (!lms || lms.error) return null;

  const c = lms.contenu;
  const chapitres = c?.chapitres || [];
  const chapitre = chapitres[chapitreActif];
  const module = chapitre?.modules?.[moduleActif];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "8px" }}>🎓 {c.formateur}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7" }}>{nettoyer(c.introduction || c.intro || "")}</div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "15px", marginBottom: "12px" }}>PROGRAMME</h2>
        {chapitres.map((ch, i) => (
          <button key={i} onClick={() => { setChapitreActif(i); setModuleActif(0); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: "6px", borderRadius: "8px", border: chapitreActif === i ? "1px solid #c8a96e" : "1px solid rgba(200,169,110,0.2)", background: chapitreActif === i ? "rgba(200,169,110,0.15)" : "#1a1a2e", color: chapitreActif === i ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            Ch.{ch.numero} — {nettoyer(ch.titre)}
          </button>
        ))}
      </div>
      {chapitre && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {chapitre.modules?.map((mod, i) => (
              <button key={i} onClick={() => setModuleActif(i)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: moduleActif === i ? "1px solid #c8a96e" : "1px solid rgba(255,255,255,0.15)", background: moduleActif === i ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === i ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "13px" }}>
                {mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝"} {nettoyer(mod.titre)}
              </button>
            ))}
          </div>
          {module && (
            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
              <h4 style={{ color: "#c8a96e", margin: "0 0 12px" }}>{nettoyer(module.titre)}</h4>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{nettoyer(module.contenu)}</div>
            </div>
          )}
        </div>
      )}
      {c.coaching && (
        <div style={{ background: "rgba(14,196,176,0.08)", border: "1px solid rgba(14,196,176,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ color: "#0ec4b0", fontWeight: "bold", marginBottom: "6px" }}>💆 {c.coach}</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", fontStyle: "italic" }}>"{nettoyer(c.coaching)}"</div>
        </div>
      )}
      {c.examen_blanc && (
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "15px", marginBottom: "12px" }}>EXAMEN BLANC</h2>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{nettoyer(c.examen_blanc)}</div>
          </div>
        </div>
      )}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d1a)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "30px", textAlign: "center" }}>
        <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", marginBottom: "8px" }}>Pret a commencer ?</h3>
        <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "14px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          S inscrire maintenant
        </a>
      </div>
    </div>
  );
}
