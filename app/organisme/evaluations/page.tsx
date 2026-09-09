"use client";
import { useState, useEffect } from "react";

export default function PageEvaluations() {
  const [d, setD] = useState<any>(null);
  const [moment, setMoment] = useState("chaud");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // ══════════════════════════════════════════════════════════════════════
  // LE REGISTRE D AMELIORATION CONTINUE — 09/09 (indicateur 32).
  //
  // Les evaluations disaient ce que pensent les stagiaires ; rien ne
  // disait ce que l organisme EN A FAIT. Un auditeur demande les deux.
  // Chaque ligne relie un constat a une decision, un responsable, une
  // echeance et un statut. Une decision ne s efface pas : elle se marque
  // faite ou abandonnee. Route : /api/organisme/ameliorations.
  // ══════════════════════════════════════════════════════════════════════
  const [ameliorations, setAmeliorations] = useState<any[]>([]);
  const [ouvertes, setOuvertes] = useState(0);
  const [formSource, setFormSource] = useState("evaluation");
  const [formConstat, setFormConstat] = useState("");
  const [formDecision, setFormDecision] = useState("");
  const [formResponsable, setFormResponsable] = useState("");
  const [formEcheance, setFormEcheance] = useState("");
  const [formFormation, setFormFormation] = useState("");
  const [occupeAmelio, setOccupeAmelio] = useState("");
  const [messageAmelio, setMessageAmelio] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/evaluation" + suffixe());
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    await chargerAmeliorations();
    setChargement(false);
  }

  async function chargerAmeliorations() {
    try {
      const r = await fetch("/api/organisme/ameliorations" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setAmeliorations(data.ameliorations || []);
        setOuvertes(data.ouvertes || 0);
      }
    } catch (e) {
      // Le registre est un complement : son absence n empeche pas de lire
      // les evaluations.
    }
  }

  // Pre-remplir le constat depuis un retour de stagiaire : c est le geste
  // qui relie l indicateur 30 au 32.
  function decidezDepuis(e: any) {
    const morceaux: string[] = [];
    if (e.points_ameliorer) morceaux.push(e.points_ameliorer);
    if (e.commentaire_libre) morceaux.push(e.commentaire_libre);
    setFormSource("evaluation");
    setFormFormation(e.formation_code || "");
    setFormConstat((morceaux.join(" — ") || "Retour de " + e.stagiaire_email).slice(0, 2000));
    setMessageAmelio("");
    try {
      const cible = document.getElementById("registre-ameliorations");
      if (cible) cible.scrollIntoView({ behavior: "smooth" });
    } catch (x) {}
  }

  async function enregistrerDecision() {
    if (!formConstat.trim() || !formDecision.trim()) return;
    setOccupeAmelio("nouvelle");
    setMessageAmelio("");
    try {
      const r = await fetch("/api/organisme/ameliorations" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: formSource,
          formation_code: formFormation,
          constat: formConstat,
          decision: formDecision,
          responsable: formResponsable,
          echeance: formEcheance,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessageAmelio("Décision enregistrée au registre.");
        setFormConstat("");
        setFormDecision("");
        setFormResponsable("");
        setFormEcheance("");
        setFormFormation("");
        await chargerAmeliorations();
      } else {
        setMessageAmelio("Erreur : " + (data.erreur || "inconnue"));
      }
    } catch (e: any) {
      setMessageAmelio("Erreur : " + String(e));
    }
    setOccupeAmelio("");
  }

  async function changerStatutDecision(id: string, statut: string) {
    setOccupeAmelio(id);
    setMessageAmelio("");
    try {
      const r = await fetch("/api/organisme/ameliorations" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, statut: statut }),
      });
      const data = await r.json();
      if (data.ok) await chargerAmeliorations();
      else setMessageAmelio("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessageAmelio("Erreur : " + String(e));
    }
    setOccupeAmelio("");
  }

  const LIBELLE_SOURCE: any = { evaluation: "Évaluation", reclamation: "Réclamation", audit: "Audit", autre: "Autre" };
  const LIBELLE_STATUT_AMELIO: any = { a_faire: "À faire", en_cours: "En cours", fait: "Fait", abandonne: "Abandonné" };
  const CHAMP_A: any = { width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE_A: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "6px" };

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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  function couleurNote(n: any) {
    if (n === null || n === undefined) return "rgba(255,255,255,0.35)";
    if (n >= 4) return "#4caf50";
    if (n >= 3) return "#e8a33d";
    return "#e8836a";
  }

  const s = d ? (moment === "chaud" ? d.chaud : d.froid) : null;
  const liste = d ? (d.evaluations || []).filter(function (e: any) { return e.moment === moment; }) : [];

  // 🚨 LE TAUX DE RETOUR SE CALCULE PAR MOMENT, PAS UNE FOIS POUR TOUTES.
  //
  // LE DEFAUT, CORRIGE LE 03/09 : la page affichait `d.taux_retour`, un
  // chiffre unique renvoye par la route. En passant de « À chaud » a
  // « À froid », le pourcentage ne bougeait pas alors que le libelle en
  // dessous, lui, changeait. On lisait donc « 100 % · 0 sur 1 » : cent pour
  // cent de retour, et zero reponse, sur le meme carreau.
  //
  // Le taux est desormais celui du moment affiche : les reponses de ce
  // moment rapportees aux inscrits. Sans inscrit, il vaut null et la carte
  // ecrit un tiret — JAMAIS ZERO POUR CENT NI CENT POUR CENT PAR DEFAUT.
  //
  // ⚠️ `d.taux_retour` N'EST PLUS LU. Si la route venait a le corriger de
  // son cote, ne pas rebrancher l'affichage dessus sans verifier qu'il est
  // bien ventile par moment.
  const inscrits = d && typeof d.inscrits === "number" ? d.inscrits : 0;
  const reponses = s && typeof s.nombre === "number" ? s.nombre : 0;
  const tauxRetour = inscrits > 0 ? Math.round((reponses / inscrits) * 100) : null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          APPRÉCIATIONS DES STAGIAIRES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Évaluations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateurs 30 et 32 du référentiel national qualité
        </p>

        <div style={{ display: "flex", gap: "10px", margin: "24px 0 20px" }}>
          {[["chaud", "À chaud"], ["froid", "À froid"]].map(function (m) {
            const actif = moment === m[0];
            return (
              <button
                key={m[0]}
                onClick={() => setMoment(m[0])}
                style={{ padding: "11px 22px", borderRadius: "8px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {m[1]}
              </button>
            );
          })}
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: couleurNote(s.globale), fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {s.globale !== null ? s.globale + "/5" : "—"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Satisfaction globale</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {tauxRetour !== null ? tauxRetour + " %" : "—"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Taux de retour · {reponses} sur {inscrits}
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {s.recommanderaient}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Recommanderaient</p>
              </div>
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 14px" }}>Par critère</h2>
              {[
                ["Contenu", s.contenu],
                ["Accompagnement et corrections", s.accompagnement],
                ["Plateforme", s.plateforme],
              ].map(function (x: any) {
                return (
                  <div key={x[0]} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px" }}>{x[0]}</span>
                    <span style={{ color: couleurNote(x[1]), fontSize: "15px", fontWeight: "bold" }}>
                      {x[1] !== null ? x[1] + "/5" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {tauxRetour !== null && tauxRetour < 50 && reponses > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                  Votre taux de retour {moment === "chaud" ? "à chaud" : "à froid"} est de{" "}
                  {tauxRetour} %. Un auditeur ne se contente pas d&apos;une moyenne flatteuse : il
                  regarde combien de stagiaires ont répondu. Relancez ceux qui n&apos;ont pas
                  encore donné leur avis.
                </p>
              </div>
            )}

            {tauxRetour !== null && reponses === 0 && inscrits > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
                <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                  Aucun de vos {inscrits} stagiaire(s) n&apos;a répondu au questionnaire{" "}
                  {moment === "chaud" ? "à chaud" : "à froid"}. Les indicateurs 30 et 32 se
                  démontrent par les réponses reçues, pas par l&apos;envoi du questionnaire.
                </p>
              </div>
            )}

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
              Ce que disent vos stagiaires
            </h2>

            {liste.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune évaluation {moment === "chaud" ? "à chaud" : "à froid"} pour le moment.
                </p>
              </div>
            ) : (
              liste.map(function (e: any) {
                return (
                  <div key={e.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", wordBreak: "break-all" }}>
                        {e.stagiaire_email}{e.formation_code ? " · " + e.formation_code : ""}
                      </span>
                      <span style={{ color: couleurNote(e.note_globale), fontSize: "16px", fontWeight: "bold" }}>
                        {e.note_globale}/5
                        {e.recommanderait === true ? " · recommande" : e.recommanderait === false ? " · ne recommande pas" : ""}
                      </span>
                    </div>

                    {[
                      ["Ce qui a servi", e.points_forts],
                      ["À améliorer", e.points_ameliorer],
                      ["Objectifs atteints", e.objectifs_atteints],
                      ["Mis en pratique", e.mise_en_pratique],
                      ["Autre", e.commentaire_libre],
                    ].filter(function (x: any) { return x[1]; }).map(function (x: any) {
                      return (
                        <div key={x[0]} style={{ marginBottom: "10px" }}>
                          <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>{x[0]}</p>
                          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                            {x[1]}
                          </p>
                        </div>
                      );
                    })}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 }}>
                        {new Date(e.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      <button
                        onClick={() => decidezDepuis(e)}
                        style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                      >
                        En tirer une décision
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* ══════════════════════════════════════════════════════════
                LE REGISTRE D AMELIORATION CONTINUE — 09/09 (indicateur 32).
                Ce que l organisme a decide a partir des retours. C est ce
                qu un auditeur lit apres les evaluations.
                ══════════════════════════════════════════════════════════ */}
            <h2 id="registre-ameliorations" style={{ color: "#c8a96e", fontSize: "18px", margin: "34px 0 6px" }}>
              Ce que vous en avez fait
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 14px", lineHeight: "1.6" }}>
              Indicateur 32 : les retours produisent des décisions, et le registre les garde.
              {ouvertes > 0 ? " " + ouvertes + " décision(s) en cours." : ""}
            </p>

            <div style={CARTE}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Enregistrer une décision</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE_A}>Déclenchée par</span>
                  <select value={formSource} onChange={(e) => setFormSource(e.target.value)} style={CHAMP_A}>
                    {["evaluation", "reclamation", "audit", "autre"].map(function (x) {
                      return <option key={x} value={x}>{LIBELLE_SOURCE[x]}</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE_A}>Formation (code, facultatif)</span>
                  <input value={formFormation} onChange={(e) => setFormFormation(e.target.value)} placeholder="F028" style={CHAMP_A} />
                </div>
              </div>
              <span style={LIBELLE_A}>Le constat</span>
              <textarea value={formConstat} onChange={(e) => setFormConstat(e.target.value)} rows={2} placeholder="Ce que les retours disent" style={CHAMP_A} />
              <span style={LIBELLE_A}>La décision</span>
              <textarea value={formDecision} onChange={(e) => setFormDecision(e.target.value)} rows={2} placeholder="Ce que vous changez" style={CHAMP_A} />
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <span style={LIBELLE_A}>Qui s&apos;en charge</span>
                  <input value={formResponsable} onChange={(e) => setFormResponsable(e.target.value)} placeholder="Nom" style={CHAMP_A} />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE_A}>Pour quand</span>
                  <input type="date" value={formEcheance} onChange={(e) => setFormEcheance(e.target.value)} style={{ ...CHAMP_A, colorScheme: "dark" }} />
                </div>
              </div>
              <button
                onClick={enregistrerDecision}
                disabled={occupeAmelio !== "" || !formConstat.trim() || !formDecision.trim()}
                style={{ background: occupeAmelio !== "" || !formConstat.trim() || !formDecision.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupeAmelio !== "" || !formConstat.trim() || !formDecision.trim() ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                {occupeAmelio === "nouvelle" ? "Enregistrement…" : "Enregistrer au registre"}
              </button>
              {messageAmelio && (
                <p style={{ color: messageAmelio.indexOf("Erreur") === 0 ? "#e8836a" : "#4caf50", fontSize: "14px", margin: "12px 0 0" }}>{messageAmelio}</p>
              )}
            </div>

            {ameliorations.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune décision enregistrée. Le registre reste vide tant que rien n&apos;y est écrit — un auditeur le verra tel quel.
                </p>
              </div>
            ) : (
              ameliorations.map(function (a: any) {
                const clos = a.statut === "fait" || a.statut === "abandonne";
                return (
                  <div key={a.id} style={{ ...CARTE, opacity: clos ? 0.7 : 1, border: a.statut === "fait" ? "1px solid rgba(76,175,80,0.35)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
                        {LIBELLE_SOURCE[a.source] || a.source}
                        {a.formation_code ? " · " + a.formation_code : ""}
                        {" · "}{new Date(a.created_at).toLocaleDateString("fr-FR")}
                        {a.responsable ? " · " + a.responsable : ""}
                        {a.echeance ? " · pour le " + new Date(a.echeance).toLocaleDateString("fr-FR") : ""}
                      </span>
                      <span style={{ color: a.statut === "fait" ? "#4caf50" : a.statut === "abandonne" ? "rgba(255,255,255,0.4)" : "#e8a33d", fontSize: "13px", fontWeight: "bold" }}>
                        {LIBELLE_STATUT_AMELIO[a.statut] || a.statut}
                        {a.fait_le ? " le " + new Date(a.fait_le).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>Constat</p>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", margin: "0 0 10px", lineHeight: "1.7" }}>{a.constat}</p>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>Décision</p>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", margin: "0 0 10px", lineHeight: "1.7" }}>{a.decision}</p>
                    {!clos && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {a.statut === "a_faire" && (
                          <button onClick={() => changerStatutDecision(a.id, "en_cours")} disabled={occupeAmelio !== ""} style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}>
                            En cours
                          </button>
                        )}
                        <button onClick={() => changerStatutDecision(a.id, "fait")} disabled={occupeAmelio !== ""} style={{ background: "none", border: "1px solid rgba(76,175,80,0.45)", color: "#4caf50", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}>
                          Marquer fait
                        </button>
                        <button onClick={() => changerStatutDecision(a.id, "abandonne")} disabled={occupeAmelio !== ""} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", padding: "7px 10px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}>
                          Abandonner
                        </button>
                      </div>
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
