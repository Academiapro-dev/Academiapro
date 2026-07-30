"use client";
import { useState, useEffect } from "react";

export default function PageCatalogueOrganisme() {
  const [formations, setFormations] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [admin, setAdmin] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [codes, setCodes] = useState("");
  const [prixEnCours, setPrixEnCours] = useState<any>({});

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setFormations(data.formations || []);
        setDisponibles(data.disponibles || []);
        setAdmin(data.admin === true);
        const p: any = {};
        for (const f of data.formations || []) {
          p[f.id] = f.prix_vente_public !== null && f.prix_vente_public !== undefined
            ? String(f.prix_vente_public)
            : "";
        }
        setPrixEnCours(p);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ouvrir(tout: boolean) {
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tout ? { tout: true } : { codes: codes }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.ouvertes + " formation(s) ouverte(s) a cet organisme.");
        setCodes("");
        await charger();
      } else {
        setErreur(data.erreur || "Ouverture impossible.");
      }
    } catch (e: any) {
      setErreur("Ouverture impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function enregistrerPrix(id: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, prix_vente_public: prixEnCours[id] }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Prix enregistre.");
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
  }

  async function retirer(id: string, code: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/catalogue" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(code + " retiree du catalogue de cet organisme.");
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const CHAMP: any = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    width: "140px",
  };

  const totalStagiaires = formations.reduce(function (s: number, f: any) {
    return s + (f.stagiaires || 0);
  }, 0);

  const sansPrix = formations.filter(function (f: any) {
    return f.prix_vente_public === null || f.prix_vente_public === undefined;
  }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FORMATIONS OUVERTES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mon catalogue</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {formations.length} formation(s) · {totalStagiaires} stagiaire(s) inscrit(s)
          {sansPrix > 0 ? " · " + sansPrix + " sans prix de vente" : ""}
        </p>

        {admin && (
          <div style={{ ...CARTE, marginTop: "26px", border: "1px solid rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 8px" }}>Ouvrir des formations</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
              Reserve a l editeur. {disponibles.length} formation(s) encore fermee(s) a cet organisme.
            </p>

            <input
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              placeholder="F028 F030 F327"
              style={{ ...CHAMP, width: "100%", marginBottom: "12px" }}
            />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => ouvrir(false)}
                disabled={occupe || !codes.trim()}
                style={{ background: occupe || !codes.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !codes.trim() ? "#8a8a8a" : "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: occupe || !codes.trim() ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                {occupe ? "..." : "Ouvrir ces codes"}
              </button>

              <button
                onClick={() => ouvrir(true)}
                disabled={occupe}
                style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "12px 24px", borderRadius: "8px", cursor: occupe ? "default" : "pointer", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                Ouvrir tout le catalogue
              </button>
            </div>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : formations.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune formation ouverte pour le moment.
            </p>
          </div>
        ) : (
          formations.map(function (f) {
            return (
              <div key={f.id} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                      {f.formation_code}{f.domaine ? " · " + f.domaine : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{f.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {f.duree ? f.duree + " h" : ""}
                      {f.prix_academia ? " · prix public AcadeMIA : " + Number(f.prix_academia).toLocaleString("fr-FR") + " EUR" : ""}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: (f.stagiaires || 0) > 0 ? "#4caf50" : "rgba(255,255,255,0.3)", fontSize: "20px", fontWeight: "bold" }}>
                      {f.stagiaires || 0}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> inscrit(s)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>Votre prix de vente</span>

                  <input
                    value={prixEnCours[f.id] || ""}
                    onChange={(e) => setPrixEnCours({ ...prixEnCours, [f.id]: e.target.value })}
                    placeholder="1500"
                    style={{ ...CHAMP, border: prixEnCours[f.id] ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(232,131,106,0.5)" }}
                  />

                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>EUR</span>

                  <button
                    onClick={() => enregistrerPrix(f.id)}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    Enregistrer
                  </button>

                  {admin && (
                    <button
                      onClick={() => retirer(f.id, f.formation_code)}
                      style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
