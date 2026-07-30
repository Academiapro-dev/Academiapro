"use client";
import { useState, useEffect } from "react";

export default function PageVeille() {
  const [d, setD] = useState<any>(null);
  const [domaine, setDomaine] = useState("legale");
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);

  const [titre, setTitre] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [retenu, setRetenu] = useState("");
  const [effet, setEffet] = useState("");

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
      const r = await fetch("/api/organisme/veille" + suffixe());
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (titre.trim().length < 3 || source.trim().length < 2) {
      setErreur("Indiquez au moins un titre et une source.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/veille" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domaine: domaine,
          titre: titre,
          source: source,
          date_consultation: date || undefined,
          ce_qui_est_retenu: retenu,
          effet_sur_prestations: effet,
          action_engagee: effet.trim().length > 0,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Entree ajoutee au registre de veille.");
        setTitre(""); setSource(""); setDate(""); setRetenu(""); setEffet("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Ajout impossible.");
      }
    } catch (e: any) {
      setErreur("Ajout impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function retirer(id: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/veille" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage("Entree retiree.");
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
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "14px",
    marginBottom: "6px",
  };

  const cles = d ? Object.keys(d.domaines || {}) : [];
  const etat = d && d.par_domaine ? d.par_domaine[domaine] : null;
  const entrees = d ? (d.entrees || []).filter(function (e: any) { return e.domaine === domaine; }) : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          REGISTRE DE VEILLE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Ma veille</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateurs 23 a 26 · {d ? d.vivantes : 0} veille(s) sur 4 jugee(s) active(s)
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "24px 0 20px" }}>
          {cles.map(function (k) {
            const actif = domaine === k;
            const e = d.par_domaine[k];
            return (
              <button
                key={k}
                onClick={() => { setDomaine(k); setFormulaire(false); }}
                style={{ padding: "10px 18px", borderRadius: "8px", border: e && !e.vivante ? "1px solid rgba(232,131,106,0.5)" : "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.65)", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {d.domaines[k].libelle}
                {e ? " (" + e.total + ")" : ""}
              </button>
            );
          })}
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}
        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d ? null : (
          <>
            {etat && (
              <div style={{ ...CARTE, border: "1px solid " + (etat.vivante ? "rgba(76,175,80,0.4)" : "rgba(232,131,106,0.5)") }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>
                      {etat.libelle}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                      Indicateur {etat.indicateur} · {etat.sur_un_an} entree(s) sur douze mois ·{" "}
                      {etat.avec_effet} avec un effet documente
                    </p>
                  </div>
                  <span style={{ color: etat.vivante ? "#4caf50" : "#e8836a", fontSize: "14px", fontWeight: "bold" }}>
                    {etat.vivante ? "Veille active" : "Veille insuffisante"}
                  </span>
                </div>

                {!etat.vivante && (
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: "14px 0 0", lineHeight: "1.7" }}>
                    Une veille est jugee active a partir de deux entrees sur douze mois, dont une
                    de moins de six mois. Un registre garni la veille de l audit ne trompe personne :
                    mieux vaut deux lignes par trimestre, avec ce qu elles ont change.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setFormulaire(!formulaire)}
              style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
            >
              {formulaire ? "Annuler" : "Ajouter une entree"}
            </button>

            {formulaire && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <span style={LIBELLE}>Ce que vous avez consulte</span>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Decret du 12 mars sur les modalites de financement" style={CHAMP} />

                <span style={LIBELLE}>Source</span>
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Legifrance, Centre Inffo, revue professionnelle..." style={CHAMP} />

                <span style={LIBELLE}>Date de consultation</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={CHAMP} />

                <span style={LIBELLE}>Ce que vous en retenez</span>
                <textarea value={retenu} onChange={(e) => setRetenu(e.target.value)} rows={3} style={CHAMP} />

                <span style={{ ...LIBELLE, color: "#e8a33d" }}>
                  Ce que cela change dans vos prestations
                </span>
                <textarea
                  value={effet}
                  onChange={(e) => setEffet(e.target.value)}
                  rows={3}
                  placeholder="C est cette case que l auditeur lit en premier : un texte lu sans consequence ne prouve rien."
                  style={{ ...CHAMP, border: "1px solid rgba(232,163,61,0.5)" }}
                />

                <button
                  onClick={ajouter}
                  disabled={occupe}
                  style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe ? "Ajout..." : "Ajouter au registre"}
                </button>
              </div>
            )}

            {entrees.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune entree dans ce domaine.
                </p>
              </div>
            ) : (
              entrees.map(function (e: any) {
                return (
                  <div key={e.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 4px" }}>{e.titre}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {e.source} · {new Date(e.date_consultation).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <button
                        onClick={() => retirer(e.id)}
                        style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                      >
                        Retirer
                      </button>
                    </div>

                    {e.ce_qui_est_retenu && (
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>Retenu</p>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                          {e.ce_qui_est_retenu}
                        </p>
                      </div>
                    )}

                    {e.effet_sur_prestations ? (
                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ color: "#4caf50", fontSize: "13px", margin: "0 0 3px" }}>
                          Effet sur les prestations
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                          {e.effet_sur_prestations}
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "#e8a33d", fontSize: "13px", margin: "12px 0 0" }}>
                        Aucun effet documente : cette entree ne prouve pas grand-chose.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
