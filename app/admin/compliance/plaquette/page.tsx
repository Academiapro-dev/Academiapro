"use client";
import { useState, useEffect } from "react";

// LA PLAQUETTE — 09/09. Apercu des totaux a l ecran, PDF telechargeable :
// page de garde, bilan, compte de resultat, SIG. Voir la route.
export default function PagePlaquette() {
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
          if (p) setDossier(p); else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () { if (dossier) charger(); }, [dossier]);

  async function charger() {
    setChargement(true); setErreur(""); setD(null);
    try {
      const r = await fetch("/api/compliance/plaquette?societe_id=" + dossier + "&apercu=1");
      const data = await r.json();
      if (data.ok) setD(data); else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  function euros(n: any) { return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €"; }
  function ligne(l: any, i: number) {
    if (Math.abs(Number(l.montant) || 0) < 0.005) return null;
    return (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
        <span style={{ color: "rgba(255,255,255,0.8)" }}>{l.libelle}</span><span style={{ color: "#c8a96e" }}>{euros(l.montant)}</span>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>← Retour aux outils</a>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>CLÔTURE</p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Plaquette des comptes annuels</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>Bilan, compte de résultat et soldes intermédiaires de gestion, présentés au nom du cabinet</p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) { return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>; })}
          </select>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}
        {chargement && <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Calcul…</p></div>}

        {d && (
          <>
            <div style={{ ...CARTE, border: "2px solid #c8a96e" }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale} · exercice du {new Date(d.exercice.debut).toLocaleDateString("fr-FR")} au {new Date(d.exercice.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.resultat >= 0 ? "#4caf50" : "#e8836a", fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>
                {d.resultat >= 0 ? "Bénéfice" : "Perte"} : {euros(Math.abs(d.resultat))}
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                Chiffre d&apos;affaires {euros(d.sig.chiffre_affaires)} · total bilan {euros(d.total_actif)}
                {d.gestion_ouverte ? " · exercice non clôturé, résultat calculé" : ""}
                {!d.equilibre ? " · ATTENTION : actif et passif ne sont pas égaux" : ""}
              </p>
              <a href={"/api/compliance/plaquette?societe_id=" + dossier} style={{ display: "inline-block", marginTop: "14px", background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}>
                Télécharger la plaquette (PDF)
              </a>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ ...CARTE, flex: "1 1 300px" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Actif</h3>
                {d.actif.map(ligne)}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontWeight: "bold", fontSize: "14px" }}><span>Total actif</span><span style={{ color: "#c8a96e" }}>{euros(d.total_actif)}</span></div>
              </div>
              <div style={{ ...CARTE, flex: "1 1 300px" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Passif</h3>
                {d.passif.map(ligne)}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontWeight: "bold", fontSize: "14px" }}><span>Total passif</span><span style={{ color: "#c8a96e" }}>{euros(d.total_passif)}</span></div>
              </div>
            </div>

            <div style={CARTE}>
              <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Compte de résultat</h3>
              {d.compte_resultat.map(ligne)}
            </div>

            <div style={CARTE}>
              <h3 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 10px" }}>Soldes intermédiaires de gestion</h3>
              {[["Chiffre d'affaires", d.sig.chiffre_affaires], ["Valeur ajoutée", d.sig.valeur_ajoutee], ["Excédent brut d'exploitation", d.sig.ebe], ["Résultat d'exploitation", d.sig.resultat_exploitation], ["Résultat net", d.sig.resultat_net]].map(function (x: any, i: number) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>{x[0]}</span><span style={{ color: Number(x[1]) >= 0 ? "#c8a96e" : "#e8836a" }}>{euros(x[1])}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
