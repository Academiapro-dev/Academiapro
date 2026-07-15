"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = "https://kpxrbwsbhmggoajtxzqn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHJid3NiaG1nZ29hanR4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM0NjIsImV4cCI6MjA5NjM0OTQ2Mn0.J45gFfkK7PHhpCFJ5ahRDbRSeGdG9YO1aa0rRZP_lks";
const MOT_DE_PASSE = "COMPTA2026";

const SB = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY };

function trimestreActuel() {
  const d = new Date();
  const t = Math.floor(d.getMonth() / 3) + 1;
  return d.getFullYear() + "-T" + t;
}

const ECHEANCES: any = {
  "T1": "30 avril", "T2": "31 juillet", "T3": "31 octobre", "T4": "31 janvier",
};

export default function ComptabilitePage() {
  const [autorise, setAutorise] = useState(false);
  const [mdp, setMdp] = useState("");
  const [onglet, setOnglet] = useState("apercu");
  const [trimestre, setTrimestre] = useState(trimestreActuel());
  const [factures, setFactures] = useState<any[]>([]);
  const [tva, setTva] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function ouvrirPDF(chemin: string) {
    try {
      const r = await fetch(SUPABASE_URL + "/storage/v1/object/sign/documents-comptables/" + chemin, {
        method: "POST",
        headers: { ...SB, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 300 })
      });
      const data = await r.json();
      if (data.signedURL) {
        window.open(SUPABASE_URL + "/storage/v1" + data.signedURL, "_blank");
      } else {
        alert("PDF indisponible");
      }
    } catch(e) { alert("Erreur ouverture PDF"); }
  }


  useEffect(() => {
    if (autorise) { charger(); }
  }, [autorise, trimestre]);

  async function charger() {
    setLoading(true);
    try {
      const rf = await fetch(SUPABASE_URL + "/rest/v1/factures?select=*&order=numero.desc", { headers: SB });
      setFactures(await rf.json());
      const rt = await fetch(SUPABASE_URL + "/rest/v1/tva_par_periode?trimestre=eq." + trimestre + "&select=*&order=pays", { headers: SB });
      setTva(await rt.json());
      const rd = await fetch(SUPABASE_URL + "/rest/v1/depenses?select=*&order=date_depense.desc", { headers: SB });
      setDepenses(await rd.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Calculs vue d'ensemble
  const facturesTrim = factures.filter(f => f.trimestre === trimestre);
  const caTotal = factures.reduce((s, f) => s + Number(f.montant_ttc || 0), 0);
  const tvaCollectee = tva.reduce((s, t) => s + Number(t.total_tva || 0), 0);
  const tvaUE = tva.filter(t => t.zone === "UE");
  const totalTvaADeclarer = tvaUE.reduce((s, t) => s + Number(t.total_tva || 0), 0);
  const totalDepenses = depenses.reduce((s, d) => s + Number(d.montant_ttc || 0), 0);

  // Alertes seuils (hors UE)
  const seuils: any = { GB: 85000, CA: 22000, AU: 50000, US: 100000 };
  const parPaysHorsUE: any = {};
  factures.filter(f => f.zone !== "UE").forEach(f => {
    parPaysHorsUE[f.client_pays] = (parPaysHorsUE[f.client_pays] || 0) + Number(f.montant_ttc || 0);
  });
  const alertes = Object.keys(parPaysHorsUE).filter(p => seuils[p] && parPaysHorsUE[p] > seuils[p] * 0.7);

  if (!autorise) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>Comptabilite</h1>
        <input type="password" placeholder="Mot de passe" value={mdp}
          onChange={e => setMdp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && mdp === MOT_DE_PASSE && setAutorise(true)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #c8a96e", background: "rgba(255,255,255,0.05)", color: "#fff", width: "250px" }} />
        <button onClick={() => mdp === MOT_DE_PASSE && setAutorise(true)}
          style={{ padding: "12px 30px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          Acceder
        </button>
      </div>
    );
  }

  const onglets = [
    ["apercu", "Vue d'ensemble"], ["tva", "TVA a declarer"],
    ["factures", "Factures"], ["depenses", "Depenses"],
    ["seuils", "Alertes seuils"], ["export", "Export trimestre"],
  ];

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px" };
  const th = { textAlign: "left" as const, padding: "8px", color: "#c8a96e", borderBottom: "1px solid rgba(200,169,110,0.2)" };
  const td = { padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", padding: "20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>Comptabilite LLC</h1>
          <select value={trimestre} onChange={e => setTrimestre(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid #c8a96e" }}>
            {["2026-T1","2026-T2","2026-T3","2026-T4"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {onglets.map(([id, label]) => (
            <button key={id} onClick={() => setOnglet(id)}
              style={{ padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                background: onglet === id ? "#c8a96e" : "rgba(255,255,255,0.05)",
                color: onglet === id ? "#050508" : "#fff", border: "none", fontWeight: onglet === id ? "bold" : "normal" }}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#c8a96e" }}>Chargement...</p>}

        {onglet === "apercu" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "15px" }}>
            <div style={card}><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>CA total (TTC)</p><h2 style={{ color: "#c8a96e", margin: "8px 0 0" }}>{caTotal.toFixed(2)} EUR</h2></div>
            <div style={card}><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>TVA collectee ({trimestre})</p><h2 style={{ color: "#c8a96e", margin: "8px 0 0" }}>{tvaCollectee.toFixed(2)} EUR</h2></div>
            <div style={card}><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Factures ({trimestre})</p><h2 style={{ color: "#c8a96e", margin: "8px 0 0" }}>{facturesTrim.length}</h2></div>
            <div style={card}><p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Total depenses</p><h2 style={{ color: "#c8a96e", margin: "8px 0 0" }}>{totalDepenses.toFixed(2)} EUR</h2></div>
          </div>
        )}

        {onglet === "tva" && (
          <div style={card}>
            <h3 style={{ color: "#c8a96e" }}>TVA a declarer - {trimestre}</h3>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Echeance : {ECHEANCES[trimestre.split("-")[1]] || "-"}</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead><tr><th style={th}>Pays</th><th style={th}>Base HT</th><th style={th}>TVA collectee</th><th style={th}>Nb factures</th></tr></thead>
              <tbody>
                {tvaUE.map((t, i) => (
                  <tr key={i}><td style={td}>{t.pays}</td><td style={td}>{Number(t.total_ht).toFixed(2)}</td><td style={td}>{Number(t.total_tva).toFixed(2)}</td><td style={td}>{t.nb_factures}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "15px", padding: "15px", background: "rgba(200,169,110,0.1)", borderRadius: "8px" }}>
              <strong style={{ color: "#c8a96e" }}>TOTAL TVA A REVERSER (UE) : {totalTvaADeclarer.toFixed(2)} EUR</strong>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "8px 0 0" }}>Montant a declarer via le guichet OSS. Le regime exact reste a confirmer par un fiscaliste.</p>
            </div>
          </div>
        )}

        {onglet === "factures" && (
          <div style={card}>
            <h3 style={{ color: "#c8a96e" }}>Factures</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Numero</th><th style={th}>Client</th><th style={th}>Pays</th><th style={th}>TTC</th><th style={th}>TVA</th><th style={th}>PDF</th></tr></thead>
              <tbody>
                {factures.map((f, i) => (
                  <tr key={i}>
                    <td style={td}>{f.numero}</td><td style={td}>{f.client_nom}</td><td style={td}>{f.client_pays}</td>
                    <td style={td}>{Number(f.montant_ttc).toFixed(2)}</td><td style={td}>{Number(f.montant_tva).toFixed(2)}</td>
                    <td style={td}>{f.pdf_url ? <span onClick={() => ouvrirPDF(f.pdf_url)} style={{ color: "#c8a96e", cursor: "pointer", textDecoration: "underline" }}>PDF</span> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === "depenses" && (
          <div style={card}>
            <h3 style={{ color: "#c8a96e" }}>Depenses</h3>
            {depenses.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)" }}>Aucune depense enregistree.</p> :
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Fournisseur</th><th style={th}>Categorie</th><th style={th}>TTC</th><th style={th}>Date</th></tr></thead>
              <tbody>
                {depenses.map((d, i) => (
                  <tr key={i}><td style={td}>{d.fournisseur}</td><td style={td}>{d.categorie}</td><td style={td}>{Number(d.montant_ttc).toFixed(2)}</td><td style={td}>{d.date_depense}</td></tr>
                ))}
              </tbody>
            </table>}
          </div>
        )}

        {onglet === "seuils" && (
          <div style={card}>
            <h3 style={{ color: "#c8a96e" }}>Alertes seuils (hors UE)</h3>
            {alertes.length === 0 ? <p style={{ color: "#22c55e" }}>Aucun seuil approche. Rien a signaler.</p> :
              alertes.map(p => (
                <div key={p} style={{ padding: "10px", background: "rgba(239,68,68,0.15)", borderRadius: "8px", marginBottom: "8px" }}>
                  <strong>{p}</strong> : {parPaysHorsUE[p].toFixed(2)} EUR (seuil {seuils[p]} EUR) - surveiller
                </div>
              ))
            }
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Seuils indicatifs a confirmer par un fiscaliste.</p>
          </div>
        )}

        {onglet === "export" && (
          <div style={card}>
            <h3 style={{ color: "#c8a96e" }}>Export {trimestre} (pour le fisc)</h3>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>{facturesTrim.length} factures sur ce trimestre. Total TVA UE : {totalTvaADeclarer.toFixed(2)} EUR.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead><tr><th style={th}>Numero</th><th style={th}>Client</th><th style={th}>Pays</th><th style={th}>HT</th><th style={th}>TVA</th><th style={th}>TTC</th><th style={th}>PDF</th></tr></thead>
              <tbody>
                {facturesTrim.map((f, i) => (
                  <tr key={i}>
                    <td style={td}>{f.numero}</td><td style={td}>{f.client_nom}</td><td style={td}>{f.client_pays}</td>
                    <td style={td}>{Number(f.montant_ht).toFixed(2)}</td><td style={td}>{Number(f.montant_tva).toFixed(2)}</td><td style={td}>{Number(f.montant_ttc).toFixed(2)}</td>
                    <td style={td}>{f.pdf_url ? <span onClick={() => ouvrirPDF(f.pdf_url)} style={{ color: "#c8a96e", cursor: "pointer", textDecoration: "underline" }}>PDF</span> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "10px" }}>Telechargez chaque PDF via les liens. L'export ZIP groupe sera ajoute ulterieurement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
