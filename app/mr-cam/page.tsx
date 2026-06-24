"use client";
import { useState, useEffect, useRef } from "react";

export default function MrCamPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fichierLoading, setFichierLoading] = useState(false);
  const [domaine, setDomaine] = useState("general");
  const [envoiOk, setEnvoiOk] = useState(false);
  const [envoyant, setEnvoyant] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      const sbUser = document.cookie.split("; ").find(r => r.startsWith("sb_user="));
      if (sbUser) {
        const user = JSON.parse(decodeURIComponent(sbUser.split("=")[1]));
        if (user.email === "contact@academiapro.fr") setIsAdmin(true);
      }
    } catch {}
    setChecking(false);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historique, loading]);

  async function analyserFichier(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFichierLoading(true);
    const noms = files.map((f) => f.name).join(", ");

    async function compresser(file) {
      return new Promise((resolve) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext === "pdf") {
          const reader = new FileReader();
          reader.onload = (ev) => resolve({ base64: ev.target.result.split(",")[1], mediaType: "application/pdf", nom: file.name });
          reader.readAsDataURL(file);
          return;
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const MAX = 1024;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          const b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
          URL.revokeObjectURL(url);
          resolve({ base64: b64, mediaType: "image/jpeg", nom: file.name });
        };
        img.src = url;
      });
    }
    setHistorique(prev => [...prev, { role: "user", text: "📎 " + files.length + " document(s) joint(s) : " + noms }]);
    try {
      const fichiersB64 = await Promise.all(files.map(compresser));
      const r = await fetch("/api/mr-cam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyse ces " + files.length + " document(s) et donne moi une analyse complete selon ton expertise.",
          domaine,
          historique,
          fichiers: fichiersB64
        }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur lors de l analyse." }]);
    }
    setFichierLoading(false);
    e.target.value = "";
  }

  async function envoyer(msg) {
    const m = msg || message;
    if (!m || !m.trim()) return;
    if (!msg) setMessage("");
    setHistorique(prev => [...prev, { role: "user", text: m }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-cam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: m, domaine, historique }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  async function envoyerEmail() {
    setEnvoyant(true);
    try {
      const resume = historique.map(h => (h.role === "user" ? "JACQUES: " : "DR. MERCIER: ") + h.text).join("\n\n");
      await fetch("/api/emailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "envoyer_direct",
          to: "contact@academiapro.fr",
          subject: "Session CAM — " + new Date().toLocaleDateString("fr-FR"),
          html: "<h2>Session Dr. Alexandre Mercier — CAM</h2><pre style=\"white-space:pre-wrap;font-family:Arial;font-size:13px\">" + resume + "</pre>",
        }),
      });
      setEnvoiOk(true);
      setTimeout(() => setEnvoiOk(false), 4000);
    } catch {}
    setEnvoyant(false);
  }

  const DOMAINES = [
    { id: "general", label: "🧠 General" },
    { id: "code", label: "💻 Code" },
    { id: "python", label: "🐍 Python" },
    { id: "juridique", label: "⚖️ Juridique" },
    { id: "comptable", label: "📊 Comptable" },
    { id: "marketing", label: "📣 Marketing" },
    { id: "academiapro", label: "🎓 AcademiA Pro" },
  ];

  const ACTIONS_RAPIDES = [
    { label: "🚀 Status AcademiA Pro", msg: "Donne moi un bilan complet de l etat actuel d AcademiA Pro : ce qui est fait, ce qui reste a faire, les priorites absolues pour le lancement." },
    { label: "💻 Script Pythonista", msg: "J ai besoin d un script Pythonista pour iPad. Explique moi comment structurer le script et quelles sont les bonnes pratiques." },
    { label: "📊 Analyse financiere", msg: "Fais moi une analyse financiere complete pour AcademiA Pro : pricing optimal, revenus projetes, couts operationnels, seuil de rentabilite." },
    { label: "⚖️ Strategie juridique", msg: "Donne moi la strategie juridique optimale pour AcademiA Pro : LLC Wyoming + protection IP + exit France + installation Israel." },
    { label: "🎯 Plan lancement", msg: "Donne moi le plan de lancement optimal pour AcademiA Pro avec les etapes dans l ordre, les delais et les actions prioritaires." },
    { label: "🔧 Debug technique", msg: "J ai un probleme technique sur AcademiA Pro. Aide moi a diagnostiquer et resoudre." },
  ];

  if (checking) return <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#c8a96e" }}>Verification...</p></div>;
  if (!isAdmin) return <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><p style={{ color: "#ff4444" }}>Acces restreint</p><a href="/login" style={{ color: "#c8a96e" }}>Se connecter</a></div></div>;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcademiA Pro · Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>🤖 Dr. Alexandre Mercier — CAM</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Conseiller Assistant Maitre — Informatique · Python · Juridique · Comptable · Marketing · AcademiA Pro</p>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

        <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
          {DOMAINES.map(d => (
            <button key={d.id} onClick={() => setDomaine(d.id)}
              style={{ padding: "8px 14px", borderRadius: "20px", border: "none", cursor: "pointer", background: domaine === d.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: domaine === d.id ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: domaine === d.id ? "bold" : "normal", fontSize: "12px" }}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "15px" }}>
          {ACTIONS_RAPIDES.map((a, i) => (
            <button key={i} onClick={() => envoyer(a.msg)} disabled={loading}
              style={{ background: "rgba(200,169,110,0.1)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", padding: "10px", fontWeight: "bold", fontSize: "11px", cursor: "pointer", textAlign: "left" }}>
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "500px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "15px", maxHeight: "600px" }}>
            {historique.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: "80px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px", marginBottom: "8px" }}>Bonjour. Je suis Dr. Alexandre Mercier.</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Votre bras droit — informatique, juridique, comptable, marketing.</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Posez votre question ou joignez un document PDF, JPEG ou PNG.</p>
              </div>
            )}
            {historique.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "10px", maxWidth: "90%", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                  {msg.role === "agent" && <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "6px", fontWeight: "bold" }}>🤖 Dr. Alexandre Mercier</div>}
                  {msg.text}
                </div>
              </div>
            ))}
            {(loading || fichierLoading) && (
              <div style={{ display: "flex" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "10px", color: "#c8a96e", fontSize: "13px" }}>
                  {fichierLoading ? "📎 Analyse du document en cours..." : "🤖 Reflexion en cours..."}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={analyserFichier} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current.click()} disabled={loading || fichierLoading}
              title="Joindre PDF, JPEG ou PNG"
              style={{ padding: "12px", background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>
              📎
            </button>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && envoyer()}
              placeholder="Posez votre question a Dr. Mercier..."
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
            <button onClick={() => envoyer()} disabled={loading}
              style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              Envoyer
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", margin: 0 }}>
              📎 PDF · JPEG · PNG — Analyse directe par Dr. Mercier
            </p>
            <button onClick={envoyerEmail} disabled={envoyant || historique.length === 0}
              style={{ background: envoiOk ? "#00c800" : "rgba(255,255,255,0.05)", color: envoiOk ? "#fff" : "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", cursor: "pointer" }}>
              {envoiOk ? "✅ Envoye !" : envoyant ? "⏳..." : "📧 Sauvegarder session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
