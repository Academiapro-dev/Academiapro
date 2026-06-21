"use client";
import { useState, useEffect } from "react";

export default function LMSSection({ code }: { code: string }) {
  const [lms, setLms] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lms/${code}`)
      .then(r => r.json())
      .then(data => { setLms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code]);

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#c8a96e" }}>
      Chargement du contenu...
    </div>
  );

  if (!lms || lms.error) return null;

  const c = lms.contenu;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "24px", marginBottom: "30px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🎓</div>
        <div>
          <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{c.formateur}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6" }}>{c.intro}</div>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "18px", marginBottom: "16px" }}>Compétences acquises</h2>
        <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
          {c.points?.split("\n").filter((p: string) => p.trim()).map((point: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "8px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color: "#c8a96e", fontWeight: "bold", flexShrink: 0 }}>✓</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>{point.replace(/^[-•*\d.]\s*/, "")}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "rgba(14,196,176,0.08)", border: "1px solid rgba(14,196,176,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "30px", display: "flex", gap: "15px", alignItems: "flex-start" }}>
        <div style={{ fontSize: "28px", flexShrink: 0 }}>💆</div>
        <div>
          <div style={{ color: "#0ec4b0", fontWeight: "bold", fontSize: "14px", marginBottom: "6px" }}>{c.coach} — Coach Personnel</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: "1.7", fontStyle: "italic" }}>"{c.coaching}"</div>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "18px", marginBottom: "16px" }}>Auto-évaluation</h2>
        <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "12px" }}>Seuil de validation : <span style={{ color: "#c8a96e", fontWeight: "bold" }}>70%</span></div>
          {c.qcm?.split("\n").filter((q: string) => q.trim()).map((ligne: string, i: number) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: ligne.startsWith("Q:") ? "#c8a96e" : "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6", fontWeight: ligne.startsWith("Q:") ? "bold" : "normal" }}>
              {ligne}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d1a)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "30px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
        <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", marginBottom: "8px" }}>Prêt à commencer ?</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>Accès immédiat · Formateur IA 24h/24</p>
        <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "14px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
          S'inscrire maintenant
        </a>
      </div>
    </div>
  );
}

