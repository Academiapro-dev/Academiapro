"use client";
import { useState, useEffect } from "react";

const VERDICTS: any = {
  sain: { texte: "Dossier sain", couleur: "#4caf50" },
  a_surveiller: { texte: "Quelques points a surveiller", couleur: "#c8a96e" },
  a_corriger: { texte: "Des corrections sont necessaires", couleur: "#e8a33d" },
  bloquant: { texte: "Anomalies bloquantes", couleur: "#e8836a" },
};

const GRAVITES: any = {
  grave: { texte: "Bloquant", couleur: "#e8836a" },
  moyen: { texte: "A corriger", couleur: "#e8a33d" },
  faible: { texte: "A surveiller", couleur: "#c8a96e" },
};

export default function PageRevision() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          const p = new URLSearchParams(window.location.search).get("societe_id");
          if (p) setDossier(p);
          else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () {
    if (dossier) charger();
  }, [dossier]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/revision?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const v = d ? (VERDICTS[d.verdict] || VERDICTS.a_surveiller) : null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Dossier de revision</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Les controles de coherence, avant de cloturer ou de declarer
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Controles en cours...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, border: "2px solid " + v.couleur }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale} · exercice du{" "}
                {new Date(d.exercice.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.exercice.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: v.couleur, fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>
                {v.texte}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.nb_lignes} ecriture(s) sur {d.nb_comptes} compte(s) ·{" "}
                {d.equilibre ? "balance equilibree a " + euros(d.debit) : "BALANCE DESEQUILIBREE"}
                <br />
                {d.total === 0
                  ? "Aucune anomalie relevee."
                  : d.graves + " bloquante(s), " + d.moyennes + " a corriger, " + d.faibles + " a surveiller."}
              </p>
            </div>

            {d.anomalies.length === 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.8" }}>
                  Les onze controles passent. Le dossier peut etre cloture ou declare en l etat.
                </p>
              </div>
            ) : (
              d.anomalies.map(function (a: any, i: number) {
                const g = GRAVITES[a.gravite] || GRAVITES.faible;
                return (
                  <div key={i} style={{ ...CARTE, borderLeft: "4px solid " + g.couleur }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{a.titre}</h3>
                      <span style={{ color: g.couleur, fontSize: "12.5px", fontWeight: "bold" }}>
                        {g.texte}
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "8px 0 0", lineHeight: "1.75" }}>
                      {a.detail}
                    </p>
                    <p style={{ color: "#c8a96e", fontSize: "13.5px", margin: "8px 0 0", lineHeight: "1.75" }}>
                      {a.geste}
                    </p>
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Ces controles ne remplacent pas le jugement de l expert-comptable : ils reperent
                ce qui se verifie mecaniquement. La qualification d une charge, l appreciation
                d une provision ou le rattachement d un produit restent son affaire.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
