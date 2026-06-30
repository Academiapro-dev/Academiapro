"use client";
import { useState, useEffect } from "react";

const FORMATEUR_MAP: Record<string, string> = {
  "intelligence-artificielle": "lucas-martin",
  "developpement": "lucas-martin",
  "python": "lucas-martin",
  "javascript": "lucas-martin",
  "react": "lucas-martin",
  "finance": "henri-mercier",
  "comptabilite": "henri-mercier",
  "trading": "henri-mercier",
  "bourse": "henri-mercier",
  "marketing": "sophie-leblanc",
  "seo": "sophie-leblanc",
  "reseaux-sociaux": "sophie-leblanc",
  "anglais": "sophie-marchand",
  "espagnol": "sophie-marchand",
  "allemand": "sophie-marchand",
  "francais": "sophie-marchand",
  "arabe": "sophie-marchand",
  "hebreu": "sophie-marchand",
  "chinois": "sophie-marchand",
  "design": "clara-vidal",
  "photoshop": "clara-vidal",
  "illustrator": "clara-vidal",
  "management": "alain-rousseau",
  "entrepreneuriat": "alain-rousseau",
  "leadership": "alain-rousseau",
  "immobilier": "thomas-berger",
  "patrimoine": "thomas-berger",
  "cybersecurite": "eleonore-petit",
  "blockchain": "eleonore-petit",
  "ressources-humaines": "nadia-benali",
  "droit": "nadia-benali",
  "developpement-personnel": "julien-castex",
  "coaching": "julien-castex",
  "bien-etre": "nathalie-ledoux",
  "nutrition": "nathalie-ledoux",
  "sophrologie": "isabelle-morin",
  "hypnose": "sophie-laurent",
  "emdr": "marc-fontaine",
  "pnl": "pierre-renaud",
  "psychanalyse": "laurent-benamou",
  "hebreu-biblique": "rav-isaac-goldstein",
  "torah": "rav-isaac-goldstein",
  "talmud": "rav-isaac-goldstein",
};

export default function SessionVisioFormationPage({ params }: { params: { id: string } }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [titre, setTitre] = useState("Votre formateur");

  useEffect(() => {
    async function chargerSession() {
      try {
        const slug = params.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let formateur = "lucas-martin";
        for (const [cle, val] of Object.entries(FORMATEUR_MAP)) {
          if (slug.includes(cle)) { formateur = val; break; }
        }
        const res = await fetch("/api/visio/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ therapeute: formateur }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setEmbedUrl(data.url);
        } else {
          setErreur("Impossible de demarrer la session visio. Veuillez reessayer.");
        }
      } catch (e) {
        setErreur("Erreur de connexion. Veuillez reessayer.");
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
            <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 4px" }}>SESSION FORMATEUR EN COURS</p>
            <h1 style={{ fontSize: "22px", margin: "0" }}>Votre formateur IA</h1>
          </div>
          <a href={"/formation/" + params.id} style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textDecoration: "none" }}>← Retour</a>
        </div>
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ color: "#c8a96e", fontSize: "16px" }}>Connexion a votre formateur...</p>
          </div>
        )}
        {erreur && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "12px" }}>
            <p style={{ color: "#e74c3c", fontSize: "15px" }}>{erreur}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "bold", cursor: "pointer" }}>Reessayer</button>
          </div>
        )}
        {embedUrl && (
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(200,169,110,0.3)" }}>
            <iframe src={embedUrl} allow="microphone; camera" title="Session Formateur" style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }} />
          </div>
        )}
        {embedUrl && (
          <div style={{ marginTop: "16px", background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0" }}>Session securisee · Formateur IA expert · Disponible 24h/24</p>
          </div>
        )}
      </div>
    </div>
  );
}