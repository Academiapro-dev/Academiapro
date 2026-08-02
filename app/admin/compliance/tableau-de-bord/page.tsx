"use client";
import { useState, useEffect } from "react";

export default function PageTableauDeBord() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    (async function () {
      setChargement(true);
      try {
        const r = await fetch("/api/compliance/tableau-de-bord");
        const data = await r.json();
        if (data.ok) setD(data);
        else setErreur(data.erreur || "Lecture impossible.");
      } catch (e: any) {
        setErreur("Lecture impossible : " + String(e));
      }
      setChargement(false);
    })();
  }, []);

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const LIEN: any = { color: "#c8a96e", fontSize: "12.5px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.35)", padding: "6px 13px", borderRadius: "20px" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  function Compteur({ valeur, texte, couleur }: any) {
    return (
      <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0, border: valeur > 0 && couleur ? "1px solid " + couleur + "80" : CARTE.border }}>
        <p style={{ color: valeur > 0 && couleur ? couleur : "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
          {valeur}
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>{texte}</p>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Les dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Ce qui vous attend</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Tous vos dossiers, classes par ce qui reclame votre attention
        </p>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Analyse des dossiers...</p>
          </div>
        ) : !d ? null : d.total === 0 ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun dossier actif. Ouvrez-en un pour commencer.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <Compteur valeur={d.total} texte="Dossier(s)" />
              <Compteur valeur={d.desequilibres} texte="Desequilibre(s)" couleur="#e8836a" />
              <Compteur valeur={d.tva_a_liquider} texte="TVA a liquider" couleur="#e8a33d" />
              <Compteur valeur={d.banque_a_rapprocher} texte="Banque a rapprocher" couleur="#e8a33d" />
              <Compteur valeur={d.dormants} texte="Dossier(s) dormant(s)" couleur="#c8a96e" />
            </div>

            {d.alertes === 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15.5px", margin: 0, lineHeight: "1.8" }}>
                  Rien ne reclame votre attention. Les {d.total} dossier(s) sont equilibres, la
                  banque est rapprochee et la TVA du mois est traitee.
                </p>
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.75" }}>
                {d.alertes} dossier(s) demandent une intervention, du plus urgent au moins urgent.
              </p>
            )}

            {d.dossiers.map(function (s: any) {
              const q = "?societe_id=" + s.id;
              const grave = !s.equilibre && s.lignes > 0;

              // Le pays vient de la fiche du dossier. Un SIREN ne se reclame
              // qu a une societe francaise, et l en-tete doit dire la meme
              // chose que la liste des motifs juste en dessous.
              const francais = s.francais !== undefined
                ? s.francais === true
                : String(s.pays || "FR").toUpperCase() === "FR";

              const bordure = grave
                ? "1px solid rgba(232,131,106,0.55)"
                : s.priorite >= 20
                  ? "1px solid rgba(232,163,61,0.45)"
                  : s.priorite > 0
                    ? CARTE.border
                    : "1px solid rgba(76,175,80,0.3)";

              return (
                <div key={s.id} style={{ ...CARTE, border: bordure }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ flex: "1 1 280px" }}>
                      <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                        {s.code}
                        {!francais ? " · " + String(s.pays || "").toUpperCase() : ""}
                        {s.siren
                          ? " · SIREN " + s.siren
                          : (francais ? " · SIREN manquant" : "")}
                        {s.derniere_ecriture
                          ? " · derniere ecriture le " + new Date(s.derniere_ecriture).toLocaleDateString("fr-FR")
                          : " · aucune ecriture"}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.raison_sociale}</h3>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                        {s.lignes} ligne(s) d ecriture
                        {s.provisions > 0 ? " · " + euros(s.provisions) + " provisionnes" : ""}
                        {s.tva_due > 0 ? " · TVA du mois " + euros(s.tva_due) : ""}
                      </p>
                    </div>
                    {s.priorite === 0 && (
                      <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "bold" }}>A jour</span>
                    )}
                  </div>

                  {s.raisons.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      {s.raisons.map(function (r: string, i: number) {
                        return (
                          <p key={i} style={{ color: i === 0 && grave ? "#e8836a" : "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.7" }}>
                            · {r}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "14px" }}>
                    <a href={"/admin/compliance/revision" + q} style={LIEN}>Reviser</a>
                    {!s.equilibre && s.lignes > 0 && (
                      <a href={"/admin/compliance/balance" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Chercher l ecart
                      </a>
                    )}
                    {s.releves_ouverts > 0 && (
                      <a href={"/admin/compliance/rapprochement" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Rapprocher
                      </a>
                    )}
                    {s.tva_a_liquider && (
                      <a href={"/admin/compliance/tva" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Liquider la TVA
                      </a>
                    )}
                    {s.ecritures_sans_piece > 0 && (
                      <a href={"/admin/compliance/pieces" + q} style={LIEN}>Justifier</a>
                    )}
                    <a href={"/admin/compliance/saisie" + q} style={LIEN}>Saisir</a>
                  </div>
                </div>
              );
            })}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                L ordre suit l urgence comptable : un desequilibre passe avant une TVA, une TVA
                avant un rapprochement, un rapprochement avant une piece manquante. Un dossier
                dormant remonte aussi, parce qu un client qu on oublie est un client qui part.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
