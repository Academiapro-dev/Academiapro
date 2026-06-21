
"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

export default function LMSPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const [formation, setFormation] = useState<any>(null);
  const [lmsData, setLmsData] = useState<any>(null);
  const [moduleActif, setModuleActif] = useState<{ch: number, mod: number}>({ch: 0, mod: 0});
  const [progression, setProgression] = useState<any>({});
  const [qcmReponses, setQcmReponses] = useState<any>({});
  const [qcmScore, setQcmScore] = useState<number | null>(null);
  const [messageValidateur, setMessageValidateur] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [onglet, setOnglet] = useState<"cours" | "qcm" | "chat" | "examen">("cours");

  useEffect(() => {
    chargerFormation();
    chargerLMS();
    chargerProgression();
  }, [code]);

  async function chargerFormation() {
    try {
      const res = await fetch(
        SUPABASE_URL + "/rest/v1/formations?code=eq." + code + "&select=*",
        { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } }
      );
      const data = await res.json();
      if (data[0]) setFormation(data[0]);
    } catch {}
  }

  async function chargerLMS() {
    try {
      const res = await fetch(
        SUPABASE_URL + "/rest/v1/formations_lms?formation_code=eq." + code + "&select=*",
        { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } }
      );
      const data = await res.json();
      if (data[0]) setLmsData(data[0]);
    } catch {}
    setLoading(false);
  }

  async function chargerProgression() {
    try {
      const prog = localStorage.getItem("progression_" + code);
      if (prog) setProgression(JSON.parse(prog));
    } catch {}
  }

  function sauvegarderProgression(newProg: any) {
    setProgression(newProg);
    try {
      localStorage.setItem("progression_" + code, JSON.stringify(newProg));
    } catch {}
  }

  function extraireQCM(contenu: string) {
    const questions: any[] = [];
    const lignes = contenu.split("\n");
    let qActuelle: any = null;
    for (const ligne of lignes) {
      const l = ligne.trim();
      if (l.match(/^Q[0-9]+\./)) {
        if (qActuelle) questions.push(qActuelle);
        qActuelle = { question: l.replace(/^Q[0-9]+\./, "").trim(), options: [], bonneReponse: "", explication: "" };
      } else if (qActuelle && l.match(/^[A-D]\)/)) {
        qActuelle.options.push(l);
      } else if (qActuelle && l.startsWith("Bonne reponse :")) {
        qActuelle.bonneReponse = l.replace("Bonne reponse :", "").split("-")[0].trim();
        qActuelle.explication = l.includes("-") ? l.split("-").slice(1).join("-").trim() : "";
      }
    }
    if (qActuelle) questions.push(qActuelle);
    return questions.slice(0, 8);
  }

  function validerQCM(questions: any[]) {
    let score = 0;
    questions.forEach((q, i) => {
      if (qcmReponses[i] === q.bonneReponse) score++;
    });
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    setQcmScore(pct);
    const cle = moduleActif.ch + "_" + moduleActif.mod;
    if (pct >= 70) {
      setMessageValidateur("MODULE VALIDE ! Score " + pct + "%. Module suivant debloque.");
      const newProg = { ...progression, [cle]: "valide" };
      sauvegarderProgression(newProg);
    } else if (pct >= 50) {
      setMessageValidateur("Revisions recommandees. Score " + pct + "%. Vous pouvez continuer mais revoir les points faibles.");
    } else {
      setMessageValidateur("Module a refaire. Score " + pct + "%. Reprendre le cours depuis le debut.");
    }
  }

  async function envoyerChat() {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/agent-tuteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          formation_titre: formation?.titre || code,
          historique: chatHistory
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: "agent", text: data.reply || "" }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setChatLoading(false);
  }

  if (loading) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "18px" }}>Chargement de votre formation...</p>
    </div>
  );

  if (!lmsData) return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>Formation en preparation</h1>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>
        Le contenu de cette formation est en cours de generation.<br/>
        Vous recevrez un email des qu il sera disponible.
      </p>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  const chapitres = lmsData.contenu || [];
  const chapitreActif = chapitres[moduleActif.ch];
  const moduleActifData = chapitreActif?.modules?.[moduleActif.mod];
  const contenuModule = moduleActifData?.contenu || "";
  const questions = extraireQCM(contenuModule);
  const cle = moduleActif.ch + "_" + moduleActif.mod;
  const moduleValide = progression[cle] === "valide";

  const totalModules = chapitres.reduce((acc: number, ch: any) => acc + (ch.modules?.length || 0), 0);
  const modulesValides = Object.values(progression).filter(v => v === "valide").length;
  const progressionPct = totalModules > 0 ? Math.round((modulesValides / totalModules) * 100) : 0;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "20px 30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcadeMIA Pro · LMS</p>
            <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", margin: 0 }}>
              {formation?.titre || code}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>Progression globale</p>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", width: "200px" }}>
              <div style={{ background: "#c8a96e", borderRadius: "10px", height: "8px", width: progressionPct + "%" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "4px 0 0" }}>
              {modulesValides}/{totalModules} modules · {progressionPct}%
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>

        {/* Sidebar navigation */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "15px", height: "fit-content" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px", fontSize: "14px" }}>Programme</h3>
          {chapitres.map((ch: any, ci: number) => (
            <div key={ci} style={{ marginBottom: "10px" }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", margin: "0 0 5px" }}>
                Ch.{ci + 1} {ch.titre}
              </p>
              {ch.modules?.map((mod: any, mi: number) => {
                const k = ci + "_" + mi;
                const valide = progression[k] === "valide";
                const actif = moduleActif.ch === ci && moduleActif.mod === mi;
                return (
                  <div
                    key={mi}
                    onClick={() => { setModuleActif({ch: ci, mod: mi}); setOnglet("cours"); setQcmScore(null); setQcmReponses({}); setMessageValidateur(""); }}
                    style={{
                      padding: "8px 10px", marginBottom: "4px", borderRadius: "6px", cursor: "pointer",
                      background: actif ? "rgba(200,169,110,0.2)" : "transparent",
                      border: actif ? "1px solid rgba(200,169,110,0.4)" : "1px solid transparent",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{valide ? "✅" : "⭕"}</span>
                    <span style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                      {ci + 1}.{mi + 1} {mod.titre}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {lmsData.examen_blanc && (
            <div
              onClick={() => setOnglet("examen")}
              style={{ padding: "10px", marginTop: "10px", borderRadius: "6px", cursor: "pointer", background: onglet === "examen" ? "rgba(200,169,110,0.2)" : "transparent", border: "1px solid rgba(200,169,110,0.3)", textAlign: "center" }}
            >
              <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold" }}>🎯 Examen Blanc Final</span>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div>

          {/* Onglets */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[
              { id: "cours", label: "📖 Cours" },
              { id: "qcm", label: "✅ QCM" },
              { id: "chat", label: "🤖 Coach IA" },
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id as any)}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                  background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.05)",
                  color: onglet === o.id ? "#050508" : "rgba(255,255,255,0.6)",
                  fontWeight: onglet === o.id ? "bold" : "normal"
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Titre module */}
          {onglet !== "examen" && moduleActifData && (
            <div style={{ marginBottom: "15px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 4px" }}>
                Chapitre {moduleActif.ch + 1} · Module {moduleActif.mod + 1}
              </p>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0, fontSize: "18px" }}>
                {moduleActifData.titre}
              </h2>
              {moduleValide && (
                <span style={{ background: "rgba(0,200,0,0.2)", color: "#00c800", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
                  ✅ Module valide
                </span>
              )}
            </div>
          )}

          {/* ONGLET COURS */}
          {onglet === "cours" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", maxHeight: "600px", overflowY: "auto" }}>
              {contenuModule.split("\n").map((ligne: string, i: number) => {
                const l = ligne.trim();
                if (!l) return <br key={i} />;
                const isTitle = ["INTRODUCTION","CONTEXTE","THEORIE","PROTOCOLE","EXERCICES","ETUDES","CONTRE","RESSOURCES","POINTS CLES","PARTIE","OBJECTIFS","SYNTHESE"].some(x => l.toUpperCase().startsWith(x));
                return isTitle
                  ? <h3 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "20px 0 8px", fontSize: "14px" }}>{l}</h3>
                  : <p key={i} style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8", margin: "0 0 6px", fontSize: "13px" }}>{l}</p>;
              })}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  onClick={() => { setOnglet("qcm"); setQcmScore(null); setQcmReponses({}); setMessageValidateur(""); }}
                  style={{ background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
                >
                  Passer au QCM de validation →
                </button>
              </div>
            </div>
          )}

          {/* ONGLET QCM */}
          {onglet === "qcm" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 20px" }}>QCM de Validation — Agent Validateur</h3>
              {questions.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.5)" }}>QCM non disponible pour ce module.</p>
              ) : (
                <>
                  {questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.1)" }}>
                      <p style={{ color: "#fff", fontWeight: "bold", margin: "0 0 10px", fontSize: "13px" }}>
                        Q{i + 1}. {q.question}
                      </p>
                      {q.options.map((opt: string, oi: number) => {
                        const lettre = opt[0];
                        const selectionne = qcmReponses[i] === lettre;
                        const correct = qcmScore !== null && lettre === q.bonneReponse;
                        const incorrect = qcmScore !== null && selectionne && lettre !== q.bonneReponse;
                        return (
                          <div
                            key={oi}
                            onClick={() => { if (qcmScore === null) setQcmReponses({ ...qcmReponses, [i]: lettre }); }}
                            style={{
                              padding: "8px 12px", margin: "4px 0", borderRadius: "6px", cursor: qcmScore === null ? "pointer" : "default",
                              background: correct ? "rgba(0,200,0,0.2)" : incorrect ? "rgba(200,0,0,0.2)" : selectionne ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)",
                              border: selectionne ? "1px solid #c8a96e" : "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.8)", fontSize: "13px"
                            }}
                          >
                            {opt}
                          </div>
                        );
                      })}
                      {qcmScore !== null && (
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "8px 0 0", fontStyle: "italic" }}>
                          {q.explication}
                        </p>
                      )}
                    </div>
                  ))}

                  {qcmScore === null ? (
                    <button
                      onClick={() => validerQCM(questions)}
                      disabled={Object.keys(qcmReponses).length < questions.length}
                      style={{
                        background: Object.keys(qcmReponses).length < questions.length ? "rgba(200,169,110,0.3)" : "#c8a96e",
                        color: "#050508", padding: "12px 30px", borderRadius: "8px", border: "none",
                        cursor: Object.keys(qcmReponses).length < questions.length ? "not-allowed" : "pointer",
                        fontWeight: "bold", width: "100%"
                      }}
                    >
                      Valider mes reponses
                    </button>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px", background: qcmScore >= 70 ? "rgba(0,200,0,0.1)" : "rgba(200,0,0,0.1)", borderRadius: "10px", border: "1px solid " + (qcmScore >= 70 ? "rgba(0,200,0,0.3)" : "rgba(200,0,0,0.3)") }}>
                      <p style={{ color: qcmScore >= 70 ? "#00c800" : "#ff4444", fontSize: "24px", fontWeight: "bold", margin: "0 0 10px" }}>
                        {qcmScore}%
                      </p>
                      <p style={{ color: "#fff", margin: "0 0 15px", fontSize: "14px" }}>{messageValidateur}</p>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button
                          onClick={() => { setQcmScore(null); setQcmReponses({}); setMessageValidateur(""); }}
                          style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "10px 20px", borderRadius: "8px", border: "1px solid #c8a96e", cursor: "pointer" }}
                        >
                          Recommencer le QCM
                        </button>
                        {qcmScore >= 50 && (
                          <button
                            onClick={() => {
                              const newMod = moduleActif.mod + 1;
                              const newCh = moduleActif.ch;
                              if (newMod < chapitres[newCh]?.modules?.length) {
                                setModuleActif({ch: newCh, mod: newMod});
                              } else if (newCh + 1 < chapitres.length) {
                                setModuleActif({ch: newCh + 1, mod: 0});
                              }
                              setOnglet("cours"); setQcmScore(null); setQcmReponses({}); setMessageValidateur("");
                            }}
                            style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
                          >
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

          {/* ONGLET CHAT COACH IA */}
          {onglet === "chat" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px" }}>Coach IA — Disponible 24h/24</h3>
              <div style={{ minHeight: "300px", maxHeight: "400px", overflowY: "auto", marginBottom: "15px" }}>
                {chatHistory.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "80px" }}>
                    Posez une question sur votre formation...
                  </p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)",
                      color: msg.role === "user" ? "#050508" : "#fff",
                      padding: "10px 14px", borderRadius: "10px", maxWidth: "80%", fontSize: "13px", lineHeight: "1.6"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && <p style={{ color: "#c8a96e", textAlign: "center" }}>...</p>}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text" value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && envoyerChat()}
                  placeholder="Posez votre question..."
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <button onClick={envoyerChat} disabled={chatLoading}
                  style={{ padding: "10px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {/* ONGLET EXAMEN BLANC */}
          {onglet === "examen" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", maxHeight: "600px", overflowY: "auto" }}>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 20px" }}>Examen Blanc Final — Certification AcadeMIA Pro</h2>
              {progressionPct < 70 ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    Completez au moins 70% des modules avant de passer l examen blanc.<br/>
                    Progression actuelle : {progressionPct}%
                  </p>
                </div>
              ) : (
                lmsData.examen_blanc?.split("\n").map((ligne: string, i: number) => {
                  const l = ligne.trim();
                  if (!l) return <br key={i} />;
                  const isTitle = ["PARTIE","QCM","QUESTIONS","CAS","CORRIGE","BAREME","EXAMEN","INSTRUCTIONS"].some(x => l.toUpperCase().startsWith(x));
                  return isTitle
                    ? <h3 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "20px 0 8px" }}>{l}</h3>
                    : <p key={i} style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8", margin: "0 0 6px", fontSize: "13px" }}>{l}</p>;
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
