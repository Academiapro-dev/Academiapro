"use client";
import { useState, useEffect } from "react";

export default function PageDiagnostic() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/diagnostic");
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
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
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const H2: any = {
    color: "#c8a96e",
    fontSize: "17px",
    margin: "0 0 14px",
  };

  function pastille(bon: boolean) {
    return (
      <span style={{ color: bon ? "#4caf50" : "#e8836a", fontWeight: "bold", fontSize: "15px" }}>
        {bon ? "✓" : "✕"}
      </span>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          VERIFICATION DU SOCLE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Diagnostic</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce que la base contient reellement, sans interpretation
        </p>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Verification en cours...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, marginTop: "24px", border: "2px solid " + (d.pret ? "rgba(76,175,80,0.6)" : "rgba(232,131,106,0.6)") }}>
              <p style={{ color: d.pret ? "#4caf50" : "#e8836a", fontSize: "21px", fontWeight: "bold", margin: "0 0 8px" }}>
                {d.pret ? "Socle complet" : "Il manque quelque chose"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                {d.resume.tables_verifiees} tables verifiees ·
                {" " + d.resume.tables_manquantes} table(s) absente(s) ·
                {" " + d.resume.colonnes_manquantes} colonne(s) manquante(s) ·
                {" " + d.resume.variables_manquantes} variable(s) absente(s) ·
                {" stockage " + (d.resume.stockage ? "en place" : "absent")}
              </p>
            </div>

            <div style={CARTE}>
              <h2 style={H2}>Variables d environnement</h2>
              {d.variables.map(function (v: any) {
                return (
                  <div key={v.nom} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "10px" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                      {v.role}
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}> · {v.nom}</span>
                    </span>
                    {pastille(v.presente)}
                  </div>
                );
              })}
            </div>

            <div style={CARTE}>
              <h2 style={H2}>Colonnes ajoutees en cours de route</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-6px 0 12px", lineHeight: "1.6" }}>
                Une seule manquante casse une chaine entiere, souvent sans message clair.
              </p>
              {d.colonnes.map(function (c: any, i: number) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "10px" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                      {c.role}
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                        {" "}· {c.table}.{c.colonne}
                      </span>
                    </span>
                    {pastille(c.presente)}
                  </div>
                );
              })}
            </div>

            <div style={CARTE}>
              <h2 style={H2}>Archivage des documents signes</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                  Espace de stockage {d.bucket.nom}
                </span>
                {pastille(d.bucket.existe)}
              </div>
              {d.bucket.erreur && (
                <p style={{ color: "#e8836a", fontSize: "13px", margin: "10px 0 0" }}>{d.bucket.erreur}</p>
              )}
            </div>

            <div style={CARTE}>
              <h2 style={H2}>Tables</h2>
              {d.tables.map(function (t: any) {
                return (
                  <div key={t.nom} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "10px" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                      {t.role}
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}> · {t.nom}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {t.existe && (
                        <span style={{ color: t.lignes ? "#c8a96e" : "rgba(255,255,255,0.35)", fontSize: "13px" }}>
                          {t.lignes === null ? "—" : t.lignes + " ligne(s)"}
                        </span>
                      )}
                      {pastille(t.existe)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
                Une table absente signale une requete SQL qui n a jamais ete passee. Une colonne
                absente, une modification oubliee. Dans les deux cas, la piece concernee ne
                fonctionnera pas, et souvent sans dire pourquoi — c est ce que cet ecran evite
                de chercher a l aveugle.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
