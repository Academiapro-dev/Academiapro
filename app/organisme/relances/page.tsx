"use client";
import { useState, useEffect } from "react";

export default function PageRelances() {
  const [d, setD] = useState<any>(null);
  const [jours, setJours] = useState(15);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger(15);
  }, []);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger(j: number) {
    setChargement(true);
    setErreur("");
    setJours(j);
    try {
      const r = await fetch("/api/organisme/relancer?jours=" + j + suffixe("&"));
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function relancer(id?: string) {
    setOccupe(id || "tous");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/relancer" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id: id, jours: jours } : { jours: jours }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message || "Relance envoy\u00e9e.");
        await charger(jours);
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
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
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  function couleurJours(n: number) {
    if (n >= 30) return "#e8836a";
    if (n >= 15) return "#e8a33d";
    return "rgba(255,255,255,0.6)";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au tableau de bord"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          {"SUIVI DE L'ASSIDUIT\u00c9"}
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>{"Qui a d\u00e9croch\u00e9"}</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {"Indicateur 11 \u00b7 un stagiaire relanc\u00e9 \u00e0 temps est un abandon \u00e9vit\u00e9"}
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "24px 0 18px" }}>
          {[7, 15, 30].map(function (j) {
            const actif = jours === j;
            return (
              <button
                key={j}
                onClick={() => charger(j)}
                style={{ padding: "9px 18px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {"Inactifs depuis " + j + " jours"}
              </button>
            );
          })}
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>{"Lecture de l'activit\u00e9..."}</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.nombre > 0 ? "#e8a33d" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.nombre}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>{"\u00c0 relancer"}</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.jamais_commence}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  {"N'ont jamais commenc\u00e9"}
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.insistants > 0 ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.insistants}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  {"D\u00e9j\u00e0 relanc\u00e9s 2 fois"}
                </p>
              </div>
            </div>

            {d.insistants > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.insistants}{" stagiaire(s) ont d\u00e9j\u00e0 re\u00e7u deux relances sans revenir. Un email de plus ne changera rien : appelez-les, ou consignez l'abandon. C'est ce que l'auditeur attend de voir, plut\u00f4t qu'une relance de plus rest\u00e9e sans r\u00e9ponse."}
                </p>
              </div>
            )}

            {d.nombre === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.65)", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
                  {"Personne \u00e0 relancer sur ce seuil. Soit vos stagiaires avancent, soit ils ont \u00e9t\u00e9 relanc\u00e9s il y a moins de sept jours \u2014 dans ce cas ils r\u00e9appara\u00eetront ensuite."}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => relancer()}
                  disabled={occupe !== ""}
                  style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: occupe !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", marginBottom: "18px" }}
                >
                  {occupe === "tous" ? "Envoi en cours..." : "Relancer les " + d.nombre + " stagiaire(s)"}
                </button>

                {d.candidats.map(function (c: any) {
                  return (
                    <div key={c.id} style={{ ...CARTE, border: "1px solid " + (c.relances >= 2 ? "rgba(232,131,106,0.45)" : CARTE.border) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                        <div style={{ flex: "1 1 240px" }}>
                          <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
                            {c.nom || c.email}
                          </h3>
                          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                            {c.email}
                            {c.formation_code ? " \u00b7 " + c.formation_code : ""}
                            {c.relances > 0 ? " \u00b7 " + c.relances + " relance(s) d\u00e9j\u00e0" : ""}
                          </p>
                          <p style={{ color: couleurJours(c.jours_inactif), fontSize: "13px", margin: "5px 0 0", fontWeight: "bold" }}>
                            {c.jamais_commence
                              ? "Jamais commenc\u00e9 \u00b7 inscrit depuis " + c.jours_inactif + " jours"
                              : "Inactif depuis " + c.jours_inactif + " jours"}
                          </p>
                        </div>

                        <button
                          onClick={() => relancer(c.id)}
                          disabled={occupe !== ""}
                          style={BOUTON}
                        >
                          {occupe === c.id ? "Envoi..." : "Relancer"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
