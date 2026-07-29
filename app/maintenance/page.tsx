"use client";
import { useState } from "react";

export default function MaintenancePage() {
  const [lignes, setLignes] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [code, setCode] = useState("F030");
  const [module, setModule] = useState("ch1_mod1");

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

  async function completer() {
    if (occupe) return;
    const c = code.trim().toUpperCase();
    if (!c) return;
    setOccupe(true);
    setLignes(["Modules manquants de " + c]);
    try {
      for (let i = 0; i < 60; i++) {
        const r = await fetch("/api/admin/completer-manuel?code=" + c);
        const brut = await r.text();
        let d: any = null;
        try { d = JSON.parse(brut); } catch (e) { d = null; }
        if (!d || d.ok !== true) { dire("Arret : " + ((d && d.erreur) || "reponse illisible")); break; }
        if (d.termine) { dire("TERMINE - tous les modules sont produits."); break; }
        dire(d.module + " - " + d.section_produite + " (" + d.sections_faites + "/" + d.sections_totales + ") - " + d.caracteres + " car.");
      }
      const a = await fetch("/api/admin/assembler-manuel?code=" + c);
      const da = await a.json();
      if (da && da.ok) dire("Assemble : " + da.modules_presents + "/" + da.total_modules + " modules, " + da.taille + " caracteres.");
    } catch (e: any) { dire("Interruption : " + String(e)); }
    setOccupe(false);
  }

  // Refait UN module a la nouvelle norme, section par section.
  async function refaireModule() {
    if (occupe) return;
    const c = code.trim().toUpperCase();
    const m = module.trim().toLowerCase();
    if (!c || !m) return;
    setOccupe(true);
    setLignes(["Refonte de " + c + " / " + m]);
    try {
      for (let i = 0; i < 10; i++) {
        const suffixe = i === 0 ? "&reset=oui" : "";
        const debut = Date.now();
        const r = await fetch("/api/admin/completer-manuel?code=" + c + "&refaire=oui&cible=" + m + suffixe);
        const secondes = Math.round((Date.now() - debut) / 1000);
        const brut = await r.text();
        let d: any = null;
        try { d = JSON.parse(brut); } catch (e) { d = null; }
        if (!d || d.ok !== true) { dire("Arret : " + ((d && d.erreur) || "reponse illisible") + " (" + secondes + " s)"); break; }
        if (d.module_termine) {
          dire("TERMINE - " + d.caracteres + " caracteres, environ " + d.pages_estimees + " pages.");
          break;
        }
        dire(d.section_produite + " (" + d.sections_faites + "/" + d.sections_totales + ") - " + d.caracteres + " car. - " + secondes + " s");
      }
    } catch (e: any) { dire("Interruption : " + String(e)); }
    setOccupe(false);
  }

  // Produit l examen final, lot de cinq modules par appel.
  async function examen() {
    if (occupe) return;
    const c = code.trim().toUpperCase();
    if (!c) return;
    setOccupe(true);
    setLignes(["Examen final de " + c]);
    try {
      for (let i = 0; i < 20; i++) {
        const r = await fetch("/api/admin/completer-manuel?code=" + c + "&examen=oui&lot=" + i);
        const brut = await r.text();
        let d: any = null;
        try { d = JSON.parse(brut); } catch (e) { d = null; }
        if (!d || d.ok !== true) { dire("Arret : " + ((d && d.erreur) || "reponse illisible")); break; }
        if (d.termine) { dire("TERMINE."); break; }
        dire("Lot " + (d.lot + 1) + "/" + d.lots + " - " + d.modules_traites + " modules - " + d.caracteres + " car.");
        if (d.lot_suivant === null) { dire("TERMINE - examen complet."); break; }
      }
    } catch (e: any) { dire("Interruption : " + String(e)); }
    setOccupe(false);
  }

  const st: any = {
    display: "block", width: "100%", padding: "14px", marginBottom: "10px",
    background: occupe ? "#3a3a4a" : "#c8a96e", color: occupe ? "#888" : "#050508",
    border: 0, borderRadius: "8px", fontSize: "15px", fontWeight: "bold", textAlign: "left",
  };

  const champ: any = {
    padding: "13px", borderRadius: "8px", border: "1px solid #c8a96e",
    background: "#12121e", color: "#fff", fontSize: "15px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", padding: "40px 20px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e" }}>Maintenance</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Restaurer d abord, nettoyer ensuite.</p>

        <button style={st} disabled={occupe} onClick={() => lots("Restauration", "/api/admin/restaurer-supports", 8, false)}>1 - Simuler la restauration</button>
        <button style={st} disabled={occupe} onClick={() => lots("Restauration", "/api/admin/restaurer-supports", 8, true)}>2 - Restaurer les originaux</button>
        <button style={st} disabled={occupe} onClick={() => lots("Nettoyage", "/api/admin/nettoyer-supports", 10, true)}>3 - Executer le nettoyage</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Generation des supports", "/api/admin/generer-support", 300)}>4 - Generer les supports manquants</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Construction des plans", "/api/admin/construire-plans", 300)}>5 - Construire les plans</button>
        <button style={st} disabled={occupe} onClick={() => boucle("Plans par IA", "/api/admin/generer-plans", 200)}>6 - Generer les plans manquants</button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="F030" style={{ ...champ, width: "120px" }} />
          <button style={{ ...st, marginBottom: 0 }} disabled={occupe} onClick={completer}>7 - Completer et assembler le manuel</button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
          <input value={module} onChange={(e) => setModule(e.target.value)} placeholder="ch1_mod1" style={{ ...champ, width: "120px" }} />
          <button style={{ ...st, marginBottom: 0 }} disabled={occupe} onClick={refaireModule}>8 - Refaire ce module a la nouvelle norme</button>
        </div>

        <button style={st} disabled={occupe} onClick={examen}>9 - Produire l examen final</button>
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
