"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const NOIR = "#050508";

// Chaque statut a sa couleur et son mot. Un comptable doit voir en un coup
// d oeil ce qui reclame son attention : un rejet passe avant tout le reste.
const STATUTS: any = {
  acceptee: { mot: "Acceptée", couleur: "#00e676" },
  rejetee: { mot: "Rejetée", couleur: "#e8836a" },
  transmise: { mot: "Transmise, en attente", couleur: OR },
  creee: { mot: "Créée, pas encore transmise", couleur: "rgba(255,255,255,0.6)" },
  envoyee: { mot: "Envoyée, sans retour", couleur: "rgba(255,255,255,0.5)" },
  inconnu: { mot: "Statut non reconnu", couleur: "#e8836a" },
};

export default function TeledecPage() {
  const [lignes, setLignes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/teledec/declarations", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setLignes(d.declarations || []);
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "14px",
  };

  function date(v: string) {
    if (!v) return "";
    return new Date(v).toLocaleString("fr-FR");
  }

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "26px 0 10px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 10px" }}>Télétransmissions</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.7", margin: "0 0 30px", maxWidth: "700px" }}>
          Les liasses envoyées à l'administration et leur réponse. Un accusé de réception
          vaut dépôt ; un rejet indique le formulaire et le champ à corriger.
        </p>

        <button
          onClick={charger}
          style={{ background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "10px 22px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "14px", marginBottom: "26px" }}
        >
          Rafraîchir
        </button>

        {chargement && (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Lecture en cours…</p>
        )}

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "14px" }}>{erreur}</p>
        )}

        {!chargement && !erreur && lignes.length === 0 && (
          <div style={carte}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
              Aucune télétransmission pour le moment. Les liasses envoyées depuis un dossier
              apparaîtront ici, avec la réponse de l'administration.
            </p>
          </div>
        )}

        {lignes.map(function (l: any) {
          const s = STATUTS[l.statut] || STATUTS.inconnu;
          const rejet = l.statut === "rejetee";

          return (
            <div key={l.id} style={{ ...carte, borderColor: rejet ? "rgba(232,131,106,0.5)" : "rgba(200,169,110,0.22)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                <span style={{ color: s.couleur, fontWeight: "bold", fontSize: "16px" }}>{s.mot}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                  envoyée le {date(l.envoyee_le)}
                </span>
              </div>

              {l.statut_libelle && (
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }}>
                  {l.statut_libelle}
                </p>
              )}

              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.8", margin: 0 }}>
                {l.siren ? "SIREN " + l.siren : ""}
                {l.formulaire ? " · " + l.formulaire : ""}
                {l.millesime ? " · exercice " + l.millesime : ""}
                {l.reference_dgfip ? " · réf. DGFiP " + l.reference_dgfip : ""}
                {l.repondu_le ? " · réponse le " + date(l.repondu_le) : ""}
              </p>

              {rejet && l.erreurs && (
                <div style={{ background: "rgba(232,131,106,0.08)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", padding: "14px", marginTop: "14px" }}>
                  <p style={{ color: "#e8836a", fontSize: "13px", fontWeight: "bold", margin: "0 0 8px" }}>
                    À corriger avant de renvoyer
                  </p>
                  <pre style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                    {JSON.stringify(l.erreurs, null, 2)}
                  </pre>
                </div>
              )}

              {l.pdf_chemin && (
                <p style={{ margin: "14px 0 0" }}>
                  <a
                    href={"/api/teledec/pdf?reference=" + encodeURIComponent(l.reference)}
                    style={{ color: OR, fontSize: "14px" }}
                  >
                    Ouvrir la liasse déposée
                  </a>
                </p>
              )}

            </div>
          );
        })}

      </div>
    </div>
  );
}
