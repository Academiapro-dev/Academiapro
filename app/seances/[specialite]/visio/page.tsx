"use client";
import { useState, useEffect } from "react";

export default function SessionVisioPage({ params }: { params: { specialite: string } }) {
  const nomAffiche = params.specialite.replace(/-/g, " ");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    async function chargerSession() {
      try {
        const therapeute = params.specialite
          .replace(/sophrologie/i, "isabelle-morin")
          .replace(/hypnose/i, "sophie-laurent")
          .replace(/emdr/i, "marc-fontaine")
          .replace(/pnl/i, "pierre-renaud")
          .replace(/psychologie/i, "sarah-mizrahi")
          .replace(/constellation/i, "claire-fontaine")
          .replace(/psychanalyse/i, "laurent-benamou")
          .replace(/coaching/i, "alexandre-noir");

        const res = await fetch("/api/visio/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ therapeute }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setEmbedUrl(data.url);
        } else {
          setErreur("Impossible de démarrer la session visio. Veuillez réessayer.");
        }
      } catch (e) {
        setErreur("Erreur de connexion. Veuillez réessayer.");
      }
      setLoading(false);
    }
    chargerSession();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "30px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 4px" }}>SÉANCE VISIO EN COURS</p>
            <h1 style={{ fontSize: "22px", margin: "0", textTransform: "capitalize" }}>{nomAffiche}</h1>
          </div>
          <a href={"/seances/" + params.specialite} style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textDecoration: "none" }}>
            ← Retour
          </a>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ color: "#c8a96e", fontSize: "16px" }}>Connexion à votre thérapeute...</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "8px" }}>Préparation de la session visio interactive</p>
          </div>
        )}

        {erreur && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "12px" }}>
            <p style={{ color: "#e74c3c", fontSize: "15px" }}>{erreur}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "bold", cursor: "pointer" }}>
              Réessayer
            </button>
          </div>
        )}

        {embedUrl && (
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(200,169,110,0.3)" }}>
            <iframe
              src={embedUrl}
              allow="microphone; camera"
              title="Séance Visio Interactive"
              style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
            />
          </div>
        )}

        {embedUrl && (
          <div style={{ marginTop: "16px", background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0" }}>
              Session sécurisée · Confidentialité absolue · Durée : 5 minutes (plan actuel)
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
