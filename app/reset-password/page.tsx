"use client";
import { useState, useEffect } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Récupérer le token depuis l URL (#access_token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const accessToken = params.get("access_token");
    if (accessToken) setToken(accessToken);
    else setError("Lien invalide ou expiré. Demandez un nouveau lien.");
  }, []);

  async function handleReset() {
    if (!password || password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Erreur lors de la mise à jour.");
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>AcadémIA Pro</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px" }}>Nouveau mot de passe</p>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "50px", marginBottom: "15px" }}>✅</div>
            <p style={{ color: "#00e676", marginBottom: "20px" }}>Mot de passe mis à jour !</p>
            <a href="/login" style={{ background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Se connecter
            </a>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                {error}
              </div>
            )}
            <div style={{ position: "relative", marginBottom: "15px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "12px", paddingRight: "45px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }}
              />
              <button onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "20px", boxSizing: "border-box" }}
            />
            <button onClick={handleReset} disabled={loading || !token}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              {loading ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}