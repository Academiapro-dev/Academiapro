"use client";
import { useState, useEffect } from "react";

const ETAPES = [
  { cle: "prospect", nom: "Prospects", couleur: "rgba(255,255,255,0.5)" },
  { cle: "contacte", nom: "Contactes", couleur: "#e8a33d" },
  { cle: "interesse", nom: "Interesses", couleur: "#c8a96e" },
  { cle: "client", nom: "Clients", couleur: "#4caf50" },
  { cle: "perdu", nom: "Perdus", couleur: "rgba(255,255,255,0.3)" },
];

export default function PageProspects() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [etape, setEtape] = useState("prospect");
  const [ouvert, setOuvert] = useState<any>({});
  const [prix, setPrix] = useState<any>({});

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
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prospects" }),
      });
      const data = await r.json();
      if (Array.isArray(data)) setProspects(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function changerStatut(p: any, statut: string) {
    setOccupe(p.email + statut);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          data: { email: p.email, nom: p.nom, statut: statut },
        }),
      });
      const data = await r.json();
      if (data.succes) {
        setMessage("Statut mis a jour.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
  }

  async function inscrire(p: any) {
    setOccupe("inscrire" + p.email);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/convertir" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: p.email,
          formation_code: p.formation_interesse,
          prix_vente: prix[p.email] || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setOuvert({ ...ouvert, [p.email]: false });
        await charger();
      } else {
        setErreur(data.erreur || "Inscription impossible.");
      }
    } catch (e: any) {
      setErreur("Inscription impossible : " + String(e));
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
    padding: "18px 22px",
    marginBottom: "14px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "6px 13px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12.5px",
    fontFamily: "Georgia,serif",
  };

  const CHAMP: any = {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
    width: "130px",
  };

  function couleurScore(s: number) {
    if (s >= 60) return "#4caf50";
    if (s >= 35) return "#e8a33d";
    return "rgba(255,255,255,0.45)";
  }

  const compte: any = {};
  for (const e of ETAPES) {
    compte[e.cle] = prospects.filter(function (p) { return (p.statut || "prospect") === e.cle; }).length;
  }

  const affiches = prospects.filter(function (p) {
    return (p.statut || "prospect") === etape;
  });

  const clients = compte["client"] || 0;
  const total = prospects.length;
  const conversion = total > 0 ? Math.round((clients / total) * 100) : 0;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          SUIVI COMMERCIAL
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Mes prospects</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {total} fiche(s) · {clients} devenu(s) client(s) · {conversion} % de conversion
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "24px 0 18px" }}>
          {ETAPES.map(function (e) {
            const actif = etape === e.cle;
            return (
              <button
                key={e.cle}
                onClick={() => setEtape(e.cle)}
                style={{ padding: "9px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {e.nom} · {compte[e.cle]}
              </button>
            );
          })}
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : affiches.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
              Aucune fiche a cette etape. Les demandes venues de votre page publique arrivent
              directement ici.
            </p>
          </div>
        ) : (
          affiches.map(function (p) {
            const estOuvert = ouvert[p.email] === true;
            return (
              <div key={p.email} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
                      {p.nom || p.email}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                      {p.email}
                      {p.telephone ? " · " + p.telephone : ""}
                      {p.formation_interesse ? " · " + p.formation_interesse : ""}
                      {p.source ? " · " + p.source : ""}
                    </p>
                  </div>
                  <p style={{ color: couleurScore(p.score || 0), fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                    {p.score || 0}
                  </p>
                </div>

                {p.notes && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                    {p.notes}
                  </p>
                )}

                <div style={{ display: "flex", gap: "7px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  {ETAPES.filter(function (e) { return e.cle !== (p.statut || "prospect"); }).map(function (e) {
                    return (
                      <button
                        key={e.cle}
                        onClick={() => changerStatut(p, e.cle)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, color: e.couleur, borderColor: "rgba(255,255,255,0.18)" }}
                      >
                        → {e.nom}
                      </button>
                    );
                  })}

                  {(p.statut || "prospect") !== "client" && (
                    <button
                      onClick={() => setOuvert({ ...ouvert, [p.email]: !estOuvert })}
                      style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                    >
                      {estOuvert ? "Annuler" : "Inscrire au registre"}
                    </button>
                  )}
                </div>

                {estOuvert && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#c8a96e", fontSize: "13px" }}>Prix de vente</span>
                    <input
                      value={prix[p.email] || ""}
                      onChange={(e) => setPrix({ ...prix, [p.email]: e.target.value })}
                      placeholder="1500"
                      style={CHAMP}
                    />
                    <button
                      onClick={() => inscrire(p)}
                      disabled={occupe !== ""}
                      style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
                    >
                      {occupe === "inscrire" + p.email ? "Inscription..." : "Confirmer l inscription"}
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
                      {p.formation_interesse ? "sur " + p.formation_interesse : "sans formation precisee"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
