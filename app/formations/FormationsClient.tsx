"use client";
import { useState, useMemo } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  surTitre: "ACADEMIAPRO",
  formationsDisponibles: "formations disponibles",
  recherche: "Rechercher une formation...",
  reinitialiser: "Reinitialiser",
  aucun: "Aucune formation trouvee",
  precedent: "Precedent",
  suivant: "Suivant",
  voir: "Voir la formation",
};

const DOMAINES = ["Tous", "IA", "Business", "Marketing", "Langues", "Bien-etre", "Securite", "Tech", "Design", "Finance", "Droit", "Outils"];
const NIVEAUX = ["Tous", "Debutant", "Intermediaire", "Avance", "Expert", "Tous niveaux"];
const PAR_PAGE = 20;

const COULEURS: Record<string, string> = {
  "IA": "#c8a96e",
  "Business": "#4a9eff",
  "Marketing": "#f97316",
  "Langues": "#22c55e",
  "Bien-etre": "#a855f7",
  "Securite": "#ef4444",
  "Tech": "#06b6d4",
  "Design": "#ec4899",
  "Finance": "#eab308",
  "Droit": "#64748b",
  "Outils": "#94a3b8",
};

export default function FormationsClient({ formations }: { formations: any[] }) {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [niveau, setNiveau] = useState("Tous");
  const [page, setPage] = useState(1);

  const filtrees = useMemo(() => {
    return formations.filter((f) => {
      const matchR = f.titre.toLowerCase().includes(recherche.toLowerCase()) || f.code.toLowerCase().includes(recherche.toLowerCase());
      const matchD = domaine === "Tous" || f.domaine === domaine;
      const matchN = niveau === "Tous" || f.niveau === niveau;
      return matchR && matchD && matchN;
    });
  }, [recherche, domaine, niveau, formations]);

  const totalPages = Math.ceil(filtrees.length / PAR_PAGE);
  const paginees = filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const reset = () => {
    setRecherche("");
    setDomaine("Tous");
    setNiveau("Tous");
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "#0d0d14", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>{filtrees.length} Formations</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0" }}>Certificat AcadeMIA Pro - Retractation 14 jours</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "1px solid rgba(200,169,110,0.2)" }}>
          <input
            type="text"
            placeholder={txtT.recherche}
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />

          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>DOMAINE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {DOMAINES.map((d) => (
                <button key={d} onClick={() => { setDomaine(d); setPage(1); }} style={{ background: domaine === d ? "#c8a96e" : "#050508", color: domaine === d ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", cursor: "pointer", fontWeight: domaine === d ? "bold" : "normal" }}>{d}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>NIVEAU</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {NIVEAUX.map((n) => (
                  <button key={n} onClick={() => { setNiveau(n); setPage(1); }} style={{ background: niveau === n ? "#c8a96e" : "#050508", color: niveau === n ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", cursor: "pointer", fontWeight: niveau === n ? "bold" : "normal" }}>{n}</button>
                ))}
              </div>
            </div>
            {(recherche || domaine !== "Tous" || niveau !== "Tous") && (
              <button onClick={reset} style={{ background: "transparent", color: "#c8a96e", border: "1px solid #c8a96e", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer" }}>{txtT.reinitialiser}</button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {paginees.map((f: any) => (
            <a key={f.code} href={"/formation/" + f.code.toLowerCase()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a2e", borderRadius: "10px", padding: "16px 20px", border: "1px solid rgba(200,169,110,0.15)", textDecoration: "none", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", minWidth: "48px" }}>{f.code}</span>
                <span style={{ color: "#fff", fontSize: "15px", flex: 1 }}>{f.titre}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ background: (COULEURS[f.domaine] || "#c8a96e") + "22", color: COULEURS[f.domaine] || "#c8a96e", padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>{f.domaine}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", minWidth: "60px", textAlign: "right" }}>{f.duree}</span>
                <span style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "bold", minWidth: "70px", textAlign: "right" }}>{f.prix} €</span>
                <span style={{ color: "#c8a96e", fontSize: "18px" }}>&rsaquo;</span>
              </div>
            </a>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: page === 1 ? "#1a1a2e" : "#c8a96e", color: page === 1 ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === 1 ? "default" : "pointer", fontWeight: "bold" }}>{txtT.precedent}</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ background: page === p ? "#c8a96e" : "#1a1a2e", color: page === p ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: page === p ? "bold" : "normal" }}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: page === totalPages ? "#1a1a2e" : "#c8a96e", color: page === totalPages ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === totalPages ? "default" : "pointer", fontWeight: "bold" }}>{txtT.suivant}</button>
          </div>
        )}

        {filtrees.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Aucune formation trouvee.</p>
            <button onClick={reset} style={{ marginTop: "16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>Voir toutes les formations</button>
          </div>
        )}
      </div>
    </div>
  );
}
