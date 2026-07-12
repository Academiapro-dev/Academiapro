"use client";
import { useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  surTitre: "ACADEMIAPRO",
  titre: "Bon retour parmi nous",
  connectez: "Connectez-vous a votre espace",
  votreEmail: "Votre email",
  votreMotDePasse: "Votre mot de passe",
  motDePasseOublie: "Mot de passe oublie ?",
  bouton: "Se connecter",
  connexionEnCours: "Connexion...",
  pasDeCompte: "Pas encore de compte ? ",
  sInscrire: "S inscrire",
  resetTitre: "Reinitialisation du mot de passe",
  emailEnvoye: "Email envoye ! Verifiez votre boite mail.",
  retourConnexion: "Retour a la connexion",
  envoyerLien: "Envoyer le lien de reinitialisation",
  envoiEnCours: "Envoi...",
  erreurIdentifiants: "Email ou mot de passe incorrect",
  erreurEnvoi: "Erreur lors de l envoi",
  erreurConnexion: "Erreur de connexion",
};

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
        setError(data.message || txtT.erreurIdentifiants);
      }
    } catch (e) {
      setError(txtT.erreurConnexion);
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
        setError(data.message || txtT.erreurEnvoi);
      }
    } catch {
      setError(txtT.erreurConnexion);
    }
    setResetLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>
          AcademIA Pro
        </h1>
        <p style={{ color: "#fff", textAlign: "center", fontFamily: "Georgia,serif", fontSize: "18px", marginBottom: "8px" }}>{txtT.titre}</p>

        {!resetMode ? (
          <>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px" }}>
              {txtT.connectez}
            </p>
            {error && (
              <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                {error}
              </div>
            )}
            <input
              type="email"
              placeholder={txtT.votreEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "15px", boxSizing: "border-box" }}
            />
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={txtT.votreMotDePasse}
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
                {txtT.motDePasseOublie}
              </button>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              {loading ? txtT.connexionEnCours : txtT.bouton}
            </button>
            <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "20px", fontSize: "13px" }}>{txtT.pasDeCompte}<a href="/inscription" style={{ color: "#c8a96e" }}>{txtT.sInscrire}</a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px" }}>
              {txtT.resetTitre}
            </p>
            {resetSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>📧</div>
                <p style={{ color: "#00e676", marginBottom: "20px" }}>{txtT.emailEnvoye}</p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }}
                  style={{ color: "#c8a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  {txtT.retourConnexion}
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
                  placeholder={txtT.votreEmail}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "20px", boxSizing: "border-box" }}
                />
                <button onClick={handleReset} disabled={resetLoading}
                  style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "15px" }}>
                  {resetLoading ? txtT.envoiEnCours : txtT.envoyerLien}
                </button>
                <div style={{ textAlign: "center" }}>
                  <button onClick={() => { setResetMode(false); setError(""); }}
                    style={{ color: "#c8a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "13px" }}>
                    {txtT.retourConnexion}
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
