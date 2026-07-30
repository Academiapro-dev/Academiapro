"use client";
import { useState, useEffect } from "react";

const LIBELLE_PAYEUR: any = {
  entreprise: "Entreprise (pour ses salaries)",
  opco: "OPCO",
  cpf: "CPF",
  pouvoirs_publics: "Pouvoirs publics",
  particulier: "Particulier (a ses frais)",
  organisme_formation: "Autre organisme de formation",
  fonds_propres: "Fonds propres de l organisme",
  non_renseigne: "Non renseigne",
};

export default function PageStagiaires() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [payeurs, setPayeurs] = useState<string[]>([]);
  const [parPayeur, setParPayeur] = useState<any>({});
  const [chiffre, setChiffre] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [saisie, setSaisie] = useState("");
  const [payeur, setPayeur] = useState("");
  const [formation, setFormation] = useState("");
  const [prix, setPrix] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function tenantDeUrl() {
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
      const r = await fetch("/api/organisme/stagiaires" + tenantDeUrl());
      const data = await r.json();
      if (data.ok) {
        setApprenants(data.apprenants || []);
        setPayeurs(data.payeurs || []);
        setParPayeur(data.par_payeur || {});
        setChiffre(data.chiffre_declare || 0);
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
      const r = await fetch("/api/organisme/stagiaires" + tenantDeUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: saisie,
          payeur: payeur,
          formation_code: formation,
          prix_vente: prix,
        }),
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

  async function changerPayeur(id: string, valeur: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires" + tenantDeUrl(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, payeur: valeur }),
      });
      const data = await r.json();
      if (data.ok) await charger();
      else setErreur(data.erreur || "Modification impossible.");
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  async function retirer(id: string, email: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = tenantDeUrl() ? tenantDeUrl() + "&" : "?";
      const r = await fetch("/api/organisme/stagiaires" + sep + "id=" + id, { method: "DELETE" });
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

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "16px",
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
          {apprenants.length} inscrit(s) · {commences} ont commence · {chiffre.toLocaleString("fr-FR")} EUR declares
        </p>

        <div style={{ ...CARTE, marginTop: "28px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 8px" }}>Inscrire des stagiaires</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
            Collez leurs adresses email, separees par des virgules, des espaces ou des
            retours a la ligne. Le financeur et le prix servent a votre bilan pedagogique
            et financier : renseignez-les des maintenant, vous ne les retrouverez pas dans un an.
          </p>

          <span style={LIBELLE}>Adresses email</span>
          <textarea
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            rows={5}
            placeholder={"marie.dupont@exemple.fr\npaul.martin@exemple.fr"}
            disabled={occupe}
            style={CHAMP}
          />

          <span style={LIBELLE}>Qui finance ces stagiaires ?</span>
          <select value={payeur} onChange={(e) => setPayeur(e.target.value)} style={CHAMP}>
            <option value="">— a preciser plus tard —</option>
            {payeurs.map(function (p) {
              return <option key={p} value={p}>{LIBELLE_PAYEUR[p] || p}</option>;
            })}
          </select>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>Formation (code)</span>
              <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="F028" style={CHAMP} />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>Prix de vente par stagiaire (EUR)</span>
              <input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="1500" style={CHAMP} />
            </div>
          </div>

          <button
            onClick={ajouter}
            disabled={occupe || !saisie.trim()}
            style={{ background: occupe || !saisie.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !saisie.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe || !saisie.trim() ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Inscription..." : "Inscrire ces stagiaires"}
          </button>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {Object.keys(parPayeur).length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 14px" }}>Ventilation des financements</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {Object.keys(parPayeur).map(function (p) {
                return (
                  <span key={p} style={{ background: p === "non_renseigne" ? "rgba(232,131,106,0.15)" : "rgba(200,169,110,0.15)", color: p === "non_renseigne" ? "#e8836a" : "#c8a96e", padding: "8px 16px", borderRadius: "20px", fontSize: "14px" }}>
                    {LIBELLE_PAYEUR[p] || p} : <strong>{parPayeur[p]}</strong>
                  </span>
                );
              })}
            </div>
          </div>
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
          apprenants.map(function (a) {
            return (
              <div key={a.id} style={{ ...CARTE, padding: "18px 22px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 4px", wordBreak: "break-all" }}>
                      {a.email}
                      {a.nom ? <span style={{ color: "rgba(255,255,255,0.45)" }}> — {a.nom}</span> : null}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {a.formation_code || "aucune formation"}
                      {a.prix_vente ? " · " + Number(a.prix_vente).toLocaleString("fr-FR") + " EUR" : ""}
                      {" · inscrit le " + (a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "—")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: (a.modules_valides || 0) > 0 ? "#4caf50" : "rgba(255,255,255,0.35)", fontSize: "20px", fontWeight: "bold" }}>
                      {a.modules_valides || 0}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> module(s)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <select
                    value={a.payeur || ""}
                    onChange={(e) => changerPayeur(a.id, e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: a.payeur ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(232,131,106,0.5)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif" }}
                  >
                    <option value="">Financeur a preciser</option>
                    {payeurs.map(function (p) {
                      return <option key={p} value={p}>{LIBELLE_PAYEUR[p] || p}</option>;
                    })}
                  </select>

                  <button
                    onClick={() => retirer(a.id, a.email)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "14px", padding: 0 }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
