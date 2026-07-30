"use client";
import { useState, useEffect } from "react";

const LIBELLE_TYPE: any = {
  theorie: "Cours",
  pratique: "Pratique",
  evaluation: "Evaluation",
};

export default function PageEditeurCours({ params }: { params: { id: string } }) {
  const coursId = params.id;

  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});
  const [formulaire, setFormulaire] = useState(false);

  const [titre, setTitre] = useState("");
  const [chapitre, setChapitre] = useState("1");
  const [chapitreTitre, setChapitreTitre] = useState("");
  const [type, setType] = useState("theorie");

  useEffect(function () {
    charger();
  }, []);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/module?cours=" + coursId + suffixe("&"));
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const ch of data.chapitres || []) {
          for (const m of ch.modules || []) {
            b[m.id] = { titre: m.titre, contenu: m.contenu || "" };
          }
        }
        setBrouillon(b);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (titre.trim().length < 3) {
      setErreur("Donnez un titre au module.");
      return;
    }
    setOccupe("ajout");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/module" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cours_id: coursId,
          titre: titre,
          chapitre: chapitre,
          chapitre_titre: chapitreTitre,
          type: type,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Module ajoute.");
        setTitre(""); setChapitreTitre("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Ajout impossible.");
      }
    } catch (e: any) {
      setErreur("Ajout impossible : " + String(e));
    }
    setOccupe("");
  }

  async function enregistrer(id: string) {
    setOccupe("enr-" + id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/module" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          titre: brouillon[id] ? brouillon[id].titre : undefined,
          contenu: brouillon[id] ? brouillon[id].contenu : undefined,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Module enregistre.");
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function changerType(id: string, t: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/module" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, type: t }),
      });
      const data = await r.json();
      if (data.ok) await charger();
      else setErreur(data.erreur || "Modification impossible.");
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  async function supprimer(id: string, t: string) {
    setMessage("");
    setErreur("");
    try {
      const s = suffixe("&");
      const r = await fetch("/api/organisme/module?id=" + id + s, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(t + " supprime.");
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
    padding: "20px 24px",
    marginBottom: "14px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
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

  function champ(id: string, cle: string) {
    return (brouillon[id] && brouillon[id][cle]) !== undefined ? brouillon[id][cle] : "";
  }

  function poser(id: string, cle: string, v: string) {
    setBrouillon({ ...brouillon, [id]: { ...(brouillon[id] || {}), [cle]: v } });
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href={"/organisme/cours" + suffixe("?")} style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour a mes formations
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          {d && d.cours ? d.cours.code : ""} · REDACTION
        </p>
        <h1 style={{ color: "#fff", fontSize: "27px", margin: "0 0 6px" }}>
          {d && d.cours ? d.cours.titre : "Formation"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {d ? d.total : 0} module(s) · {d ? d.rediges : 0} redige(s)
          {d && d.cours && d.cours.publie ? " · publiee" : " · brouillon"}
        </p>

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", margin: "22px 0" }}
        >
          {formulaire ? "Annuler" : "Ajouter un module"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 100px" }}>
                <span style={LIBELLE}>Chapitre</span>
                <input value={chapitre} onChange={(e) => setChapitre(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <span style={LIBELLE}>Titre du chapitre</span>
                <input value={chapitreTitre} onChange={(e) => setChapitreTitre(e.target.value)} placeholder="Fondements" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} style={CHAMP}>
                  {(d && d.types ? d.types : ["theorie"]).map(function (t: string) {
                    return <option key={t} value={t}>{LIBELLE_TYPE[t] || t}</option>;
                  })}
                </select>
              </div>
            </div>

            <span style={LIBELLE}>Titre du module</span>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} style={CHAMP} />

            <button
              onClick={ajouter}
              disabled={occupe === "ajout"}
              style={{ background: occupe === "ajout" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "ajout" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "ajout" ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.chapitres.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucun module. Ajoutez-en un pour commencer a rediger. Un module est considere
              comme redige au-dela de deux cents signes.
            </p>
          </div>
        ) : (
          d.chapitres.map(function (ch: any) {
            return (
              <div key={ch.numero} style={{ marginBottom: "26px" }}>
                <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 12px" }}>
                  Chapitre {ch.numero} · {ch.titre}
                </h2>

                {ch.modules.map(function (m: any) {
                  const estOuvert = ouvert[m.id] === true;
                  return (
                    <div key={m.id} style={{ ...CARTE, border: "1px solid " + (m.redige ? "rgba(76,175,80,0.35)" : "rgba(232,163,61,0.4)") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ flex: "1 1 240px" }}>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 3px" }}>
                            {ch.numero}.{m.numero} · {LIBELLE_TYPE[m.type] || m.type}
                          </p>
                          <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{m.titre}</h3>
                        </div>
                        <span style={{ color: m.redige ? "#4caf50" : "#e8a33d", fontSize: "13px", fontWeight: "bold" }}>
                          {m.redige ? m.signes.toLocaleString("fr-FR") + " signes" : "a rediger"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setOuvert({ ...ouvert, [m.id]: !estOuvert })}
                          style={{ ...BOUTON, background: estOuvert ? "none" : "#c8a96e", color: estOuvert ? "#c8a96e" : "#050508", border: estOuvert ? "1px solid rgba(200,169,110,0.45)" : "none", fontWeight: estOuvert ? "normal" : "bold" }}
                        >
                          {estOuvert ? "Fermer" : m.redige ? "Modifier" : "Rediger"}
                        </button>

                        <select
                          value={m.type}
                          onChange={(e) => changerType(m.id, e.target.value)}
                          style={{ padding: "7px 11px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13px", fontFamily: "Georgia,serif", border: "1px solid rgba(200,169,110,0.3)" }}
                        >
                          {(d.types || []).map(function (t: string) {
                            return <option key={t} value={t}>{LIBELLE_TYPE[t] || t}</option>;
                          })}
                        </select>

                        <button
                          onClick={() => supprimer(m.id, m.titre)}
                          style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                        >
                          Supprimer
                        </button>
                      </div>

                      {estOuvert && (
                        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <span style={LIBELLE}>Titre du module</span>
                          <input
                            value={champ(m.id, "titre")}
                            onChange={(e) => poser(m.id, "titre", e.target.value)}
                            style={CHAMP}
                          />

                          <span style={LIBELLE}>Contenu du module</span>
                          <textarea
                            value={champ(m.id, "contenu")}
                            onChange={(e) => poser(m.id, "contenu", e.target.value)}
                            rows={18}
                            placeholder={"Ecrivez votre cours ici.\n\nUn titre commence par ## et un sous-titre par ###.\nUne puce commence par un tiret.\n\nLe lecteur du LMS paginera automatiquement."}
                            style={{ ...CHAMP, fontSize: "15px", lineHeight: "1.8" }}
                          />

                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-4px 0 12px" }}>
                            {String(champ(m.id, "contenu")).length.toLocaleString("fr-FR")} signes ·
                            {" "}un module est considere comme redige au-dela de deux cents
                          </p>

                          <button
                            onClick={() => enregistrer(m.id)}
                            disabled={occupe === "enr-" + m.id}
                            style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                          >
                            {occupe === "enr-" + m.id ? "Enregistrement..." : "Enregistrer ce module"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
