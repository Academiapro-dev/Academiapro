"use client";
import { useState } from "react";

export default function MaintenancePage() {
  const [lignes, setLignes] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);

  const dire = (t: string) => setLignes((l) => [...l, t]);

  async function lots(nom: string, base: string, pas: number, exec: boolean) {
    if (occupe) return;
    setOccupe(true);
    setLignes([nom + (exec ? " - EXECUTION" : " - simulation")]);
    let debut = 0;
    let total = 0;
    try {
      for (let i = 0; i < 200; i++) {
        const r = await fetch(base + "?debut=" + debut + "&taille=" + pas + (exec ? "&executer=oui" : ""));
        const brut = await r.text();
        let d: any = null;
        try { d = JSON.parse(brut); } catch (e) { d = null; }
        if (!d || d.ok !== true) { dire("Arret au lot " + debut + " : " + ((d && d.erreur) || "reponse illisible")); break; }
        if (!total) total = d.total_supports || 0;
        const ech = (d.echecs || []).length;
        dire("Lot " + d.lot + " : " + (d.a_modifier || 0) + " traites" + (ech ? " - " + ech + " ECHECS" : ""));
        if (ech) break;
        debut = debut + pas;
        if (total && debut >= total) { dire("TERMINE - " + total + " fichiers."); break; }
      }
    } catch (e: any) { dire("Interruption : " + String(e)); }
    setOccupe(false);
  }

  async function boucle(nom: string, url: string, max: number) {
    if (occupe) return;
    setOccupe(true);
    setLignes([nom]);
    let faits = 0;
    let ignores = 0;
    try {
      for (let i = 0; i < max; i++) {
        const r = await fetch(url);
        const brut = await r.text();
        let d: any = null;
        try { d = JSON.parse(brut); } catch (e) { d = null; }
        if (!d || d.ok !== true) { dire("Arret : " + ((d && d.erreur) || "reponse illisible")); break; }
        if (d.termine) { dire("TERMINE - " + faits + " traites, " + ignores + " ignores."); break; }
        if (d.ignore) { ignores++; dire(d.code + " - ignore - reste " + d.restants); }
        else { faits++; dire(d.code + " - " + (d.titre || "") + " - " + (d.nb_modules || d.taille || "") + " - reste " + d.restants); }
        if (d.restants === 0) { dire("TERMINE - " + faits + " traites, " + ignores + " ignores."); break; }
      }
    } catch (e: any) { dire("Interruption : " + String(e)); }
    setOccupe(false);
  }

  const st: any = {
    display: "block", width: "100%", padding: "14px", marginBottom: "10px",
    background: occupe ? "#3a3a4a" : "#c8a96e", color: occupe ? "#888" : "#050508",
    border: 0, borderRadius: "8px", fontSize: "15px", fontWeight: "bold", textAlign: "left",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", padding: "40px 20px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e" }}>Maintenance</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Restaurer d abord, nettoyer ensuite.</p>

        <button style={st} disabled={occupe} onClick={() => lots("Restauration", "/api/admin/restaurer-supports", 8, false)}>1 - Simuler la restauration</button>
        <button style={st} disabled={occupe} onClick={() => lots("Restauration", "/api/admin/restaurer-supports", 8, true)}>2 - Restaurer les originaux</button>
        <button style={st} disabled={occupe} onClick={() => lots("Nettoyage", "/api/admin/admin/nettoyer-supports", 10, true)}>3 - Executer le nettoyage</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Generation des supports", "/api/admin/generer-support", 300)}>4 - Generer les supports manquants</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Construction des plans", "/api/admin/construire-plans", 300)}>5 - Construire les plans</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Plans par IA", "/api/admin/generer-plans", 200)}>6 - Generer les plans manquants</button>
        <button style={st} disabled={occupe} onClick={() => lots("Audit", "/api/admin/audit-supports", 40, false)}>Relancer l inventaire</button>

        {lignes.length > 0 && (
          <div style={{ marginTop: "20px", background: "#12121e", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "10px", padding: "16px", fontFamily: "monospace", fontSize: "13px", maxHeight: "420px", overflowY: "auto" }}>
            {lignes.map((l, i) => (<div key={i} style={{ marginBottom: "4px" }}>{l}</div>))}
          </div>
        )}
      </div>
    </div>
  );
}
