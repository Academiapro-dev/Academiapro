"use client";
import { useState, useEffect, useRef } from "react";

const CHAPITRES_F030 = [
  { numero: 1, titre: "Fondements Theoriques et Scientifiques", modules: [
    { numero: 1, titre: "Histoire et origines", type: "theorie" },
    { numero: 2, titre: "Neurobiologie et mecanismes", type: "theorie" },
    { numero: 3, titre: "Protocoles d induction", type: "pratique" },
    { numero: 4, titre: "Evaluation et QCM Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Les 12 Degres Caycediens RD1 a RD4", modules: [
    { numero: 1, titre: "RD1 Decontraction Musculaire", type: "theorie" },
    { numero: 2, titre: "RD2 Sophro-Activation Positive", type: "theorie" },
    { numero: 3, titre: "RD3 Sophro-Contemplation", type: "theorie" },
    { numero: 4, titre: "Pratique guidee et QCM RD1-RD4", type: "evaluation" },
  ]},
  { numero: 3, titre: "Les Degres Superieurs RD5 a RD12", modules: [
    { numero: 1, titre: "RD5 a RD8 Approfondissement", type: "theorie" },
    { numero: 2, titre: "RD9 a RD12 Contemplation", type: "theorie" },
    { numero: 3, titre: "Applications cliniques", type: "pratique" },
    { numero: 4, titre: "Cas cliniques et QCM", type: "evaluation" },
  ]},
  { numero: 4, titre: "Applications Professionnelles", modules: [
    { numero: 1, titre: "Sophrologie perinatale", type: "pratique" },
    { numero: 2, titre: "Sophrologie du sport", type: "pratique" },
    { numero: 3, titre: "Sophrologie oncologique", type: "pratique" },
    { numero: 4, titre: "Protocoles personnalises et QCM", type: "evaluation" },
  ]},
  { numero: 5, titre: "Pratique Professionnelle et Certification", modules: [
    { numero: 1, titre: "Construction cabinet sophrologie", type: "pratique" },
    { numero: 2, titre: "Ethique et cadre legal", type: "theorie" },
    { numero: 3, titre: "Supervision et memoire", type: "pratique" },
    { numero: 4, titre: "Examen blanc final 20 questions", type: "evaluation" },
  ]},
];

function extraireQCM(contenu) {
  if (!contenu) return [];
  const questions = [];
  const lignes = contenu.split("\n");
  let qActuelle = null;
  for (const ligne of lignes) {
    const l = ligne.trim();
    if (l.match(/^Q\d+\./)) {
      if (qActuelle) questions.push(qActuelle);
      qActuelle = { question: l.replace(/^Q\d+\./, "").trim(), options: [], bonneReponse: "", explication: "" };
    } else if (qActuelle && l.match(/^[A-D]\)/)) {
      qActuelle.options.push(l);
    } else if (qActuelle && l.startsWith("Reponse :")) {
      const parts = l.replace("Reponse :", "").trim().split(" - ");
      qActuelle.bonneReponse = parts[0]?.trim().replace(")", "");
      qActuelle.explication = parts.slice(1).join(" - ").trim();
    }
  }
  if (qActuelle) questions.push(qActuelle);
  return questions;
}

export default function LMSPage({ params }) {
  const code = params.code?.toUpperCase();
  const [formation, setFormation] = useState(null);
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFormation, setLoadingFormation] = useState(true);
  const [onglet, setOnglet] = useState("cours");
  const [progression, setProgression] = useState({});
  const [qcmReponses, setQcmReponses] = useState({});
  const [qcmScore, setQcmScore] = useState(null);
  const [messageValidateur, setMessageValidateur] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [langue, setLangue] = useState("fr");

  const chapitres = code === "F030" ? CHAPITRES_F030 : [];
  const chapitre = chapitres[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const totalModules = chapitres.reduce((acc, ch) => acc + ch.modules.length, 0);
  const modulesValides = Object.values(progression).filter(v => v === "valide").length;
  const progressionPct = totalModules > 0 ? Math.round((modulesValides / totalModules) * 100) : 0;
  const cle = chapitreActif + "_" + moduleActif;
  const moduleValide = progression[cle] === "valide";
  const questions = extraireQCM(contenu);

  useEffect(() => {
    const lang = localStorage.getItem("langue") || "fr";
    setLangue(lang);
    chargerFormation(lang);
    chargerProgression();
  }, [code]);

  useEffect(() => {
    if (chapitres.length > 0) chargerModule(chapitreActif, moduleActif);
  }, [chapitreActif, moduleActif, langue]);

  async function chargerFormation(lang) {
    try {
      const r = await fetch("/api/formation/" + code + "?lang=" + lang);
      const data = await r.json();
      if (!data.error) setFormation(data);
    } catch {}
    setLoadingFormation(false);
  }

  function chargerProgression() {
    try {
      const prog = localStorage.getItem("progression_" + code);
      if (prog) setProgression(JSON.parse(prog));
    } catch {}
  }

  function sauvegarderProgression(newProg) {
    setProgression(newProg);
    try { localStorage.setItem("progression_" + code, JSON.stringify(newProg)); } catch {}
  }

  async function chargerModule(ch_num, mod_num, garderOnglet = false) {
    setLoading(true);
    setContenu("");
    if (!garderOnglet) setOnglet("cours");
    setQcmScore(null);
    setQcmReponses({});
    setMessageValidateur("");
    try {
      const r = await fetch("/api/lms-sophrologie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: code, chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) setContenu(data.contenu);
    } catch {}
    setLoading(false);
  }

  function validerQCM() {
    if (questions.length === 0) return;
    let score = 0;
    questions.forEach((q, i) => { if (qcmReponses[i] === q.bonneReponse) score++; });
    const pct = Math.round((score / questions.length) * 100);
    setQcmScore(pct);
    if (pct >= 70) {
      setMessageValidateur("MODULE VALIDE ! Score " + pct + "%");
      const newProg = { ...progression, [cle]: "valide" };
      sauvegarderProgression(newProg);
      const modulesVal = Object.values(newProg).filter(v => v === "valide").length;
      const email = localStorage.getItem("apprenant_email") || "";
      if (email) {
        fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "lms_update", email, data: { formation_code: code, modules_valides: modulesVal, progression_pct: Math.round((modulesVal / totalModules) * 100) } }) });
      }
    } else {
      setMessageValidateur("Score " + pct + "% — Recommencez pour valider (70% requis)");
    }
  }

  async function envoyerChat() {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch("/api/agent-tuteur", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, formation_titre: formation?.titre || code, historique: chatHistory }) });
      const data = await r.json();
      setChatHistory(prev => [...prev, { role: "agent", text: data.reply || "" }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setChatLoading(false);
  }

  if (loadingFormation) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</p>
    </div>
  );

  if (chapitres.length === 0) return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>Formation en preparation</h1>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Le contenu de cette formation est en cours de generation.</p>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "20px 30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcadeMIA Pro · LMS</p>
            <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", margin: 0 }}>{formation?.titre || code}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>Progression</p>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", width: "200px" }}>
              <div style={{ background: "#c8a96e", borderRadius: "10px", height: "8px", width: progressionPct + "%" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "4px 0 0" }}>{modulesValides}/{totalModules} modules · {progressionPct}%</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "15px", height: "fit-content" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px", fontSize: "14px" }}>Programme</h3>
          {chapitres.map((ch) => (
            <div key={ch.numero} style={{ marginBottom: "10px" }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", margin: "0 0 5px" }}>Ch.{ch.numero} {ch.titre}</p>
              {ch.modules.map((mod) => {
                const k = ch.numero + "_" + mod.numero;
                const valide = progression[k] === "valide";
                const actif = chapitreActif === ch.numero && moduleActif === mod.numero;
                const typeIcon = mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝";
                return (
                  <div key={mod.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(mod.numero); }}
                    style={{ padding: "8px 10px", marginBottom: "4px", borderRadius: "6px", cursor: "pointer", background: actif ? "rgba(200,169,110,0.2)" : "transparent", border: actif ? "1px solid rgba(200,169,110,0.4)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{valide ? "✅" : "⭕"}</span>
                    <span style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.6)", fontSize: "11px" }}>{typeIcon} {ch.numero}.{mod.numero} {mod.titre}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[{ id: "cours", label: "📖 Cours" }, { id: "qcm", label: "✅ QCM" }, { id: "chat", label: "🤖 Coach IA" }]
              .filter(o => !(o.id === "cours" && module?.type === "evaluation"))
              .map(o => (
              <button key={o.id} onClick={() => {
                if (o.id === "qcm" && module?.type !== "evaluation") {
                  const modEval = chapitre?.modules.find(m => m.type === "evaluation");
                  if (modEval) {
                    setModuleActif(modEval.numero);
                    chargerModule(chapitreActif, modEval.numero, true);
                  }
                  setOnglet("qcm");
                } else {
                  setOnglet(o.id);
                }
              }}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: onglet === o.id ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: onglet === o.id ? "bold" : "normal" }}>
                {o.label}
              </button>
            ))}
          </div>

          {module && (
            <div style={{ marginBottom: "15px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 4px" }}>Chapitre {chapitreActif} · Module {moduleActif}</p>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0, fontSize: "18px" }}>{module.titre}</h2>
              {moduleValide && <span style={{ background: "rgba(0,200,0,0.2)", color: "#00c800", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>✅ Module valide</span>}
            </div>
          )}

          {onglet === "cours" && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "40px 45px", boxShadow: "0 4px 30px rgba(0,0,0,0.4)", minHeight: "400px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "15px" }}>⚡</div>
                  <div style={{ color: "#c8a96e", fontSize: "16px" }}>Generation du contenu en cours...</div>
                  <div style={{ color: "#666", fontSize: "14px" }}>Claire Beaumont redige votre module...</div>
                </div>
              ) : contenu ? (
                <div>
                  {contenu.split("\n").filter(l => l.trim()).map((ligne, i) => {
                    const l = ligne.trim();
                    if (/^#{1,6}\s/.test(l)) {
                      const texte = l.replace(/^#{1,6}\s+/, "");
                      const niveau = (l.match(/^(#{1,6})/)||["",""])[1].length;
                      if (niveau <= 2) return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", margin: "20px 0 10px", borderBottom: niveau === 1 ? "2px solid #c8a96e" : "none", paddingBottom: niveau === 1 ? "8px" : "0" }}>{texte}</h2>;
                      return <h3 key={i} style={{ color: "#333", fontSize: "18px", margin: "15px 0 8px", fontWeight: "bold" }}>{texte}</h3>;
                    }
                    if (l === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
                    if (l.startsWith("> ")) return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "20px" }}>{l.replace(/^> /, "").replace(/\*\*(.+?)\*\*/g, "$1")}</blockquote>;
                    const texte = l.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
                    return <p key={i} style={{ color: "#1a1a1a", fontSize: "20px", lineHeight: "2.0", marginBottom: "16px", textAlign: "justify" }}>{texte}</p>;
                  })}
                  <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <button onClick={() => setOnglet("qcm")} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "14px 30px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                      Passer au QCM →
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>Selectionnez un module</div>
              )}
            </div>
          )}

          {onglet === "qcm" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 20px" }}>QCM de Validation</h3>
              {loading ? (
                <p style={{ color: "#c8a96e" }}>Generation du QCM en cours...</p>
              ) : questions.length === 0 ? (
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "15px" }}>Le QCM sera disponible apres generation du module evaluation.</p>
                  <button onClick={() => chargerModule(chapitreActif, moduleActif, true)} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", fontWeight: "bold" }}>
                    Generer le QCM
                  </button>
                </div>
              ) : (
                <>
                  {questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <p style={{ color: "#fff", fontWeight: "bold", margin: "0 0 10px", fontSize: "14px" }}>Q{i + 1}. {q.question}</p>
                      {q.options.map((opt, oi) => {
                        const lettre = opt[0];
                        const selectionne = qcmReponses[i] === lettre;
                        const correct = qcmScore !== null && lettre === q.bonneReponse;
                        const incorrect = qcmScore !== null && selectionne && lettre !== q.bonneReponse;
                        return (
                          <div key={oi} onClick={() => { if (qcmScore === null) setQcmReponses({ ...qcmReponses, [i]: lettre }); }}
                            style={{ padding: "8px 12px", margin: "4px 0", borderRadius: "6px", cursor: qcmScore === null ? "pointer" : "default", background: correct ? "rgba(0,200,0,0.2)" : incorrect ? "rgba(200,0,0,0.2)" : selectionne ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", border: selectionne ? "1px solid #c8a96e" : "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
                            {opt}
                          </div>
                        );
                      })}
                      {qcmScore !== null && q.explication && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "8px 0 0", fontStyle: "italic" }}>{q.explication}</p>}
                    </div>
                  ))}
                  {qcmScore === null ? (
                    <button onClick={validerQCM} disabled={Object.keys(qcmReponses).length < questions.length}
                      style={{ background: Object.keys(qcmReponses).length < questions.length ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", width: "100%" }}>
                      Valider mes reponses
                    </button>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px", background: qcmScore >= 70 ? "rgba(0,200,0,0.1)" : "rgba(200,0,0,0.1)", borderRadius: "10px" }}>
                      <p style={{ color: qcmScore >= 70 ? "#00c800" : "#ff4444", fontSize: "24px", fontWeight: "bold" }}>{qcmScore}%</p>
                      <p style={{ color: "#fff", marginBottom: "15px" }}>{messageValidateur}</p>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button onClick={() => { setQcmScore(null); setQcmReponses({}); setMessageValidateur(""); }} style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "10px 20px", borderRadius: "8px", border: "1px solid #c8a96e", cursor: "pointer" }}>Recommencer</button>
                        {qcmScore >= 50 && (
                          <button onClick={() => {
                            const nm = moduleActif + 1;
                            if (nm <= (chapitre?.modules.length || 0)) setModuleActif(nm);
                            else if (chapitreActif < chapitres.length) { setChapitreActif(c => c + 1); setModuleActif(1); }
                          }} style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                            Module suivant →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {onglet === "chat" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px" }}>Coach IA — Claire Beaumont</h3>
              <div style={{ minHeight: "300px", maxHeight: "400px", overflowY: "auto", marginBottom: "15px" }}>
                {chatHistory.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "80px" }}>Posez une question sur votre formation...</p>}
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "10px 14px", borderRadius: "10px", maxWidth: "80%", fontSize: "14px", lineHeight: "1.6" }}>{msg.text}</div>
                  </div>
                ))}
                {chatLoading && <p style={{ color: "#c8a96e", textAlign: "center" }}>...</p>}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyerChat()} placeholder="Posez votre question..."
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
                <button onClick={envoyerChat} disabled={chatLoading} style={{ padding: "10px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Envoyer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
