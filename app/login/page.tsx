"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Email ou mot de passe incorrect");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "30px" }}>
          AcadémIA Pro
        </h1>
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
        <input
          type="password"
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "20px", boxSizing: "border-box" }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          Pas encore de compte ? <a href="/inscription" style={{ color: "#c8a96e" }}>S'inscrire</a>
        </p>
      </div>
    </div>
  );
}
