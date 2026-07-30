"use client";
import { useState, useEffect } from "react";

export default function PageStagiaires() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [saisie, setSaisie] = useState("");
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires");
      const data = await r.json();
      if (data.ok) {
        setApprenants(data.apprenants || []);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (!saisie.trim()) return;
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: saisie }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.ajoutes + " stagiaire(s) inscrit(s).");
        setSaisie("");
        await charger();
      } else {
        setErreur(data.erreur || "Inscription impossible.");
      }
    } catch (e: any) {
      setErreur("Inscription impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function retirer(id: string, email: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires?id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(email + " a ete retire du registre.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "24px 28px",
    marginBottom: "22px",
  };

  const commences = apprenants.filter(function (a) { return (a.modules_valides || 0) > 0; }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          REGISTRE DES STAGIAIRES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes stagiaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {apprenants.length} inscrit(s) · {commences} ont commence
        </p>

        <div style={{ ...CARTE, marginTop: "28px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 8px" }}>Inscrire des stagiaires</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
            Collez leurs adresses email, separees par des virgules, des espaces ou des
            retours a la ligne. Vous pouvez coller votre liste entiere d un coup.
          </p>

          <textarea
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            rows={6}
            placeholder={"marie.dupont@exemple.fr\npaul.martin@exemple.fr"}
            disabled={occupe}
            style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "16px", lineHeight: "1.7", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "14px" }}
          />

          <button
            onClick={ajouter}
            disabled={occupe || !saisie.trim()}
            style={{ background: occupe || !saisie.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !saisie.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe || !saisie.trim() ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif" }}
          >
            {occupe ? "Inscription..." : "Inscrire ces stagiaires"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "14px", marginBottom: 0 }}>
            Un stagiaire inscrit ici sera rattache a votre organisme des sa premiere connexion,
            et son avancement apparaitra dans votre tableau de bord.
          </p>
        </div>

        {message && (
          <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>
        )}
        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement du registre...</p>
          </div>
        ) : apprenants.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun stagiaire inscrit pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 90px", background: "rgba(200,169,110,0.12)", padding: "14px 18px", fontSize: "13px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Stagiaire</span>
              <span>Modules</span>
              <span>Inscrit le</span>
              <span></span>
            </div>

            {apprenants.map(function (a) {
              return (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 90px", padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>
                    {a.email}
                    {a.nom ? <span style={{ color: "rgba(255,255,255,0.45)" }}> — {a.nom}</span> : null}
                  </span>
                  <span style={{ color: (a.modules_valides || 0) > 0 ? "#4caf50" : "rgba(255,255,255,0.35)", fontWeight: "bold" }}>
                    {a.modules_valides || 0}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <button
                    onClick={() => retirer(a.id, a.email)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "14px", padding: 0, textAlign: "left" }}
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
