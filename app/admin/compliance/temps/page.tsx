"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LES TEMPS PASSES — 09/09 (Mr Comptable).
// Saisie rapide (dossier, tache, minutes, facturable), totaux du mois par
// dossier et par collaborateur. Saisis, jamais calcules.
// ══════════════════════════════════════════════════════════════════════════
const LIBELLE_TACHE: any = {
  saisie: "Saisie", lettrage: "Lettrage", revision: "Révision", tva: "TVA", social: "Social",
  liasse: "Liasse", conseil: "Conseil", rendez_vous: "Rendez-vous", administratif: "Administratif", autre: "Autre",
};

function heures(m: number): string {
  const h = Math.floor(m / 60), r = m % 60;
  return h + " h " + (r < 10 ? "0" : "") + r;
}

export default function PageTemps() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));
  const [filtreDossier, setFiltreDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  const [dossier, setDossier] = useState("");
  const [tache, setTache] = useState("saisie");
  const [minutes, setMinutes] = useState("30");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [facturable, setFacturable] = useState(true);
  const [commentaire, setCommentaire] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () { charger(); }, [mois, filtreDossier]);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/compliance/temps?mois=" + mois + (filtreDossier ? "&societe_id=" + filtreDossier : ""));
      const data = await r.json();
      if (data.ok) setD(data); else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
  }

  async function ajouter() {
    if (!dossier || !minutes) return;
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/temps", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, tache, minutes, date, facturable, commentaire }),
      });
      const data = await r.json();
      if (data.ok) { setCommentaire(""); await charger(); }
      else setErreur(data.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe(false);
  }

  async function retirer(id: string) {
    if (!confirm("Retirer cette ligne de temps ?")) return;
    try {
      const r = await fetch("/api/compliance/temps?id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) await charger(); else setErreur(data.erreur || "Suppression impossible.");
    } catch (e: any) { setErreur(String(e)); }
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "#c8a96e", color: "#050508", border: "none", padding: "13px 26px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>← Retour aux outils</a>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>LE CABINET</p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Temps passés</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>Ce que chaque dossier coûte en temps, par collaborateur et par mois</p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Noter un temps</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 220px" }}>
              <span style={LIBELLE}>Dossier</span>
              <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
                <option value="">— choisir —</option>
                {societes.map(function (s) { return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>; })}
              </select>
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <span style={LIBELLE}>Tâche</span>
              <select value={tache} onChange={(e) => setTache(e.target.value)} style={CHAMP}>
                {Object.keys(LIBELLE_TACHE).map(function (k) { return <option key={k} value={k}>{LIBELLE_TACHE[k]}</option>; })}
              </select>
            </div>
            <div style={{ flex: "1 1 100px" }}>
              <span style={LIBELLE}>Minutes</span>
              <input value={minutes} onChange={(e) => setMinutes(e.target.value)} style={CHAMP} />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <span style={LIBELLE}>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...CHAMP, colorScheme: "dark" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Commentaire (facultatif)" style={{ ...CHAMP, flex: "1 1 300px", width: "auto", marginBottom: 0 }} />
            <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", cursor: "pointer" }}>
              <input type="checkbox" checked={facturable} onChange={(e) => setFacturable(e.target.checked)} /> Facturable
            </label>
            <button onClick={ajouter} disabled={occupe || !dossier} style={{ ...BOUTON, opacity: !dossier ? 0.5 : 1 }}>{occupe ? "…" : "Noter"}</button>
          </div>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "8px 0 16px" }}>
          <div>
            <span style={LIBELLE}>Mois</span>
            <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} style={{ ...CHAMP, width: "180px", colorScheme: "dark" }} />
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <span style={LIBELLE}>Dossier</span>
            <select value={filtreDossier} onChange={(e) => setFiltreDossier(e.target.value)} style={CHAMP}>
              <option value="">Tous mes dossiers</option>
              {societes.map(function (s) { return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>; })}
            </select>
          </div>
        </div>

        {d && (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{heures(d.total_minutes)}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Total du mois</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{heures(d.facturable_minutes)}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Facturable</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ ...CARTE, flex: "1 1 300px" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Par dossier</h3>
                {d.par_dossier.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "14px" }}>Rien ce mois-ci.</p> :
                  d.par_dossier.map(function (x: any) {
                    return (
                      <div key={x.societe_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{x.nom}</span>
                        <span style={{ color: "#c8a96e" }}>{heures(x.minutes)}</span>
                      </div>
                    );
                  })}
              </div>
              <div style={{ ...CARTE, flex: "1 1 300px" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Par collaborateur</h3>
                {d.par_collaborateur.map(function (x: any) {
                  return (
                    <div key={x.collaborateur} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)", wordBreak: "break-all" }}>{x.collaborateur}</span>
                      <span style={{ color: "#c8a96e" }}>{heures(x.minutes)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "22px 0 12px" }}>Le détail</h2>
            {d.lignes.length === 0 ? (
              <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Aucun temps noté sur ce mois.</p></div>
            ) : (
              d.lignes.map(function (l: any) {
                return (
                  <div key={l.id} style={{ ...CARTE, padding: "12px 20px", marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", flex: "1 1 320px" }}>
                      {new Date(l.date).toLocaleDateString("fr-FR")} · <strong>{l.dossier}</strong> · {LIBELLE_TACHE[l.tache] || l.tache}
                      {l.commentaire ? " — " + l.commentaire : ""}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}> · {l.collaborateur}</span>
                    </span>
                    <span style={{ color: l.facturable ? "#4caf50" : "rgba(255,255,255,0.5)", fontSize: "14px", whiteSpace: "nowrap" }}>
                      {heures(Number(l.minutes) || 0)}{l.facturable ? "" : " · non facturable"}
                    </span>
                    {l.collaborateur === d.moi && (
                      <button onClick={() => retirer(l.id)} style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px" }}>Retirer</button>
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
