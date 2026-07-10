"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";
const FRT = {
  surTitre: "ACADEMIAPRO",
  titre: "Bon retour parmi nous",
  email: "Adresse e-mail", motDePasse: "Mot de passe",
  bouton: "Se connecter",
  pasDeCompte: "Pas encore de compte ?",
  sInscrire: "Creer un compte gratuitement",
  motDePasseOublie: "Mot de passe oublie ?",
  sousTitre: "Accedez a vos formations et suivez votre progression" };

export default function LoginPage() {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("apprenant_email", email);
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Email ou mot de passe incorrect");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  }

  async function handleReset() {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSent(true);
      } else {
        setError(data.message || "Erreur lors de l envoi");
      }
    } catch {
      setError("Erreur de connexion");
    }
    setResetLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "30px" }}>
          AcadémIA Pro
        </h1>

        {!resetMode ? (
          <>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px" }}>
              Connectez-vous à votre espace
            </p>
            {error && (
              <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                {error}
              </div>
            )}
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "15px", boxSizing: "border-box" }}
            />
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "12px", paddingRight: "45px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "rgba(255,255,255,0.5)" }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <button onClick={() => { setResetMode(true); setError(""); }}
                style={{ background: "none", border: "none", color: "#c8a96e", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>
                Mot de passe oublié ?
              </button>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "20px", fontSize: "13px" }}>{txtT.pasDeCompte}<a href="/inscription" style={{ color: "#c8a96e" }}>S inscription</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px" }}>
              Réinitialisation du mot de passe
            </p>
            {resetSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>📧</div>
                <p style={{ color: "#00e676", marginBottom: "20px" }}>Email envoyé ! Vérifiez votre boîte mail.</p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }}
                  style={{ color: "#c8a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                    {error}
                  </div>
                )}
                <input
                  type="email"
                  placeholder="Votre email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "20px", boxSizing: "border-box" }}
                />
                <button onClick={handleReset} disabled={resetLoading}
                  style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "15px" }}>
                  {resetLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
                </button>
                <div style={{ textAlign: "center" }}>
                  <button onClick={() => { setResetMode(false); setError(""); }}
                    style={{ color: "#c8a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "13px" }}>
                    Retour à la connexion
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}