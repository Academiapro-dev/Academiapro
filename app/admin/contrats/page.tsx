"use client";
import { useState, useEffect } from "react";

export default function PageContrats() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState("tous");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/contrats");
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

  const LIEN: any = {
    color: "#c8a96e",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid rgba(200,169,110,0.35)",
    padding: "7px 15px",
    borderRadius: "20px",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
  }

  function jour(v: any) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  const ETATS: any = {
    signe: { nom: "Signe", couleur: "#4caf50" },
    en_attente: { nom: "En attente de signature", couleur: "#e8a33d" },
    sans_bon: { nom: "Aucun bon edite", couleur: "rgba(255,255,255,0.4)" },
  };

  const lignes = d
    ? d.lignes.filter(function (l: any) {
        if (filtre === "tous") return true;
        if (filtre === "relancer") return l.etat === "en_attente" && l.jours_attente >= 10;
        return l.etat === filtre;
      })
    : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          ENGAGEMENTS SIGNES
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Mes contrats</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Qui a signe, qui fait attendre, et depuis combien de temps
        </p>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture des contrats...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.signes}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Signe(s)</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.en_attente > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.en_attente}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>En attente</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0, border: d.a_relancer > 0 ? "1px solid rgba(232,131,106,0.5)" : CARTE.border }}>
                <p style={{ color: d.a_relancer > 0 ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.a_relancer}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A relancer</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.contrats_propres}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Mes propres contrats
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
              {[
                ["tous", "Tous · " + d.total],
                ["relancer", "A relancer · " + d.a_relancer],
                ["en_attente", "En attente · " + d.en_attente],
                ["signe", "Signes · " + d.signes],
                ["sans_bon", "Sans bon · " + d.sans_bon],
              ].map(function (f: any) {
                const actif = filtre === f[0];
                return (
                  <button
                    key={f[0]}
                    onClick={() => setFiltre(f[0])}
                    style={{ padding: "9px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
                  >
                    {f[1]}
                  </button>
                );
              })}
            </div>

            {d.a_relancer > 0 && filtre === "tous" && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.a_relancer} bon(s) de commande attendent depuis dix jours ou plus. Un contrat
                  qui traine est une affaire qui refroidit : un appel vaut mieux qu un troisieme
                  email.
                </p>
              </div>
            )}

            {lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun contrat dans cette categorie.
                </p>
              </div>
            ) : (
              lignes.map(function (l: any) {
                const e = ETATS[l.etat] || ETATS.sans_bon;
                const urgent = l.etat === "en_attente" && l.jours_attente >= 10;
                return (
                  <div key={l.id} style={{ ...CARTE, border: urgent ? "1px solid rgba(232,131,106,0.5)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>
                          {l.raison_sociale}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {l.email_contact}
                          {l.abonnement > 0 ? " · " + euros(l.abonnement) + "/mois" : ""}
                          {l.reference ? " · " + l.reference : ""}
                        </p>
                      </div>
                      <span style={{ color: e.couleur, fontSize: "13.5px", fontWeight: "bold" }}>
                        {e.nom}
                      </span>
                    </div>

                    {l.etat === "signe" && l.signataire && (
                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 4px", lineHeight: "1.7" }}>
                          Signe le {jour(l.signe_le)} par{" "}
                          <strong>{l.signataire.nom || l.signataire.email}</strong>
                          {l.signataire.qualite ? ", " + l.signataire.qualite : ""}
                        </p>
                        <p style={{ color: l.signataire.code_verifie ? "#4caf50" : "#e8a33d", fontSize: "13px", margin: 0 }}>
                          {l.signataire.code_verifie
                            ? "Identite du signataire verifiee par code envoye a son adresse"
                            : "Signature sans verification par code — force probante moindre"}
                        </p>
                      </div>
                    )}

                    {l.etat === "en_attente" && (
                      <p style={{ color: urgent ? "#e8836a" : "rgba(255,255,255,0.6)", fontSize: "14px", margin: "12px 0 0", lineHeight: "1.7" }}>
                        Bon edite le {jour(l.emis_le)} — sans reponse depuis{" "}
                        <strong>{l.jours_attente} jour(s)</strong>.
                      </p>
                    )}

                    {l.etat === "sans_bon" && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "12px 0 0", lineHeight: "1.7" }}>
                        Ce client n a pas encore de bon de commande. Rien ne le lie a vous par
                        ecrit.
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                      <a href="/admin/bon-commande" style={LIEN}>
                        {l.etat === "sans_bon" ? "Editer son bon →" : "Rediter son bon →"}
                      </a>
                      <a href={"/organisme/documents?tenant=" + l.tenant_id} style={LIEN}>
                        Ses documents →
                      </a>
                      <a href={"/organisme/signatures?tenant=" + l.tenant_id} style={LIEN}>
                        Son dossier de preuve →
                      </a>
                      {l.pieces_coffre > 0 && (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", alignSelf: "center" }}>
                          {l.pieces_coffre} piece(s) au coffre
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
                Un client sans bon de commande signe n est lie a vous par aucun ecrit : ni le
                tarif, ni la date de fin du lancement, ni la part sur le catalogue ne seraient
                opposables en cas de desaccord.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
                La mention de verification par code indique que le signataire a prouve controler
                l adresse a laquelle le lien a ete envoye. C est ce qui distingue une signature
                defendable d un simple clic.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
