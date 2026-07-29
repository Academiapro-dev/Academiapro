"use client";
import { useState, useEffect } from "react";

const CARACTERES_PAR_PAGE = 2500;

const AGENTS_DOMAINE = {
  "IA": { formateur: "Alex Bernard", coach: "Isabelle Moreau" },
  "Business": { formateur: "Thomas Martin", coach: "Isabelle Moreau" },
  "Marketing": { formateur: "Nina Castillo", coach: "Isabelle Moreau" },
  "Langues": { formateur: "Sofia Durand", coach: "Isabelle Moreau" },
  "Bien-etre": { formateur: "Claire Beaumont", coach: "Maya" },
  "Tech": { formateur: "Karim Benzara", coach: "Isabelle Moreau" },
  "Design": { formateur: "Lucas Petit", coach: "Isabelle Moreau" },
  "Finance": { formateur: "Emma Lefebvre", coach: "Isabelle Moreau" },
  "Droit": { formateur: "Antoine Moreau", coach: "Isabelle Moreau" },
  "Outils": { formateur: "Thomas Martin", coach: "Isabelle Moreau" },
  "Psychologie": { formateur: "Claire Beaumont", coach: "Maya" },
};

function propre(t) {
  return String(t || "").replace(/\*\*/g, "").replace(/`/g, "").trim();
}

// Decoupage par VOLUME : une page vaut environ 2 500 caracteres.
function decouperEnPages(contenu) {
  const lignes = String(contenu || "").split("\n").filter(l => l.trim() && l.trim() !== "---");
  const pages = [];
  let bloc = [];
  let taille = 0;

  for (const ligne of lignes) {
    bloc.push(ligne);
    taille = taille + ligne.length;
    const estTitre = /^#{1,6}\s/.test(ligne.trim());
    if (taille >= CARACTERES_PAR_PAGE && !estTitre) {
      pages.push(bloc.join("\n"));
      bloc = [];
      taille = 0;
    }
  }

  if (bloc.length > 0) pages.push(bloc.join("\n"));
  return pages.length > 0 ? pages : [String(contenu || "")];
}

// Extraction TOLERANTE : les modules ne redigent pas tous leur QCM
// de la meme facon. On accepte plusieurs numerotations et on cherche
// les bonnes reponses aussi bien en ligne que dans un bloc de corrige.
function extraireQCM(contenu) {
  const texte = String(contenu || "");
  if (!texte) return [];

  // On ne garde que la section QCM si elle est identifiee, pour ne pas
  // confondre les exercices avec des questions.
  let zone = texte;
  const debut = texte.search(/^#{1,6}\s*QCM/im);
  if (debut >= 0) {
    zone = texte.slice(debut);
    const suite = zone.slice(20).search(/^#{1,6}\s+/m);
    if (suite > 0) zone = zone.slice(0, suite + 20);
  }

  const lignes = zone.split("\n");
  const questions = [];
  let q = null;

  for (const brute of lignes) {
    const l = propre(brute);
    if (!l) continue;

    const debutQuestion = l.match(/^(?:Question\s*)?Q?\s*(\d{1,2})\s*[.)\-–:]\s*(.+)$/i);
    const option = l.match(/^([A-D])\s*[).\-–:]\s*(.+)$/);
    const reponse = l.match(/r[eé]ponse\s*(?:correcte)?\s*[:=]?\s*([A-D])\b/i);

    if (option && q) {
      q.options.push(option[1] + ") " + option[2]);
      continue;
    }

    if (reponse) {
      if (q && !q.bonneReponse) {
        q.bonneReponse = reponse[1];
        const reste = l.split(reponse[1]).slice(1).join(reponse[1]).replace(/^[\s\-–—.:]*/, "");
        if (reste) q.explication = reste;
      }
      continue;
    }

    if (debutQuestion && debutQuestion[2].length > 8) {
      if (q && q.options.length >= 2) questions.push(q);
      q = { numero: parseInt(debutQuestion[1], 10), question: debutQuestion[2], options: [], bonneReponse: "", explication: "" };
      continue;
    }

    // Ligne de corrige du type "3 : B" ou "3 - B" dans un bloc dedie.
    const corrige = l.match(/^(\d{1,2})\s*[).\-–:]\s*([A-D])\b\s*[-–—:]?\s*(.*)$/);
    if (corrige) {
      const cible = questions.find(x => x.numero === parseInt(corrige[1], 10));
      if (cible && !cible.bonneReponse) {
        cible.bonneReponse = corrige[2];
        if (corrige[3]) cible.explication = corrige[3];
      }
      continue;
    }
  }

  if (q && q.options.length >= 2) questions.push(q);

  // On ne garde que les questions reellement exploitables.
  return questions.filter(x => x.options.length >= 2 && x.bonneReponse);
}

export default function LMSPage({ params }) {
  const code = params.code?.toUpperCase();
  const [formation, setFormation] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFormation, setLoadingFormation] = useState(true);
  const [onglet, setOnglet] = useState("cours");
  const [progression, setProgression] = useState({});
  const [avertissement, setAvertissement] = useState("");
  const [qcmReponses, setQcmReponses] = useState({});
  const [qcmScore, setQcmScore] = useState(null);
  const [messageValidateur, setMessageValidateur] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [langue, setLangue] = useState("fr");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formateurDyn, setFormateurDyn] = useState("");
  const [coachDyn, setCoachDyn] = useState("");
  const [pageModule, setPageModule] = useState(0);

  const chapitre = chapitres[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const totalModules = chapitres.reduce((acc, ch) => acc + (ch.modules?.length || 0), 0);
  const modulesValides = Object.values(progression).filter(v => v === "valide").length;
  const progressionPct = totalModules > 0 ? Math.round((modulesValides / totalModules) * 100) : 0;
  const cle = chapitreActif + "_" + moduleActif;
  const moduleValide = progression[cle] === "valide";
  const questions = extraireQCM(contenu);
  const pages = decouperEnPages(contenu);
  const totalPages = pages.length;
  const pageCourante = pages[pageModule] || pages[0] || "";

  useEffect(() => {
    const lang = localStorage.getItem("langue") || "fr";
    setLangue(lang);
    chargerFormation(lang);
    chargerProgression();
    try {
      const sbUser = document.cookie.split("; ").find(r => r.startsWith("sb_user="));
      if (sbUser) {
        const user = JSON.parse(decodeURIComponent(sbUser.split("=")[1]));
        if (user.email === "contact@academiapro.fr") setIsAdmin(true);
      }
    } catch {}
  }, [code]);

  useEffect(() => {
    if (chapitres.length > 0) chargerModule(chapitreActif, moduleActif);
  }, [chapitreActif, moduleActif, langue, chapitres.length]);

  async function chargerFormation(lang) {
    try {
      const r = await fetch("/api/formation/" + code + "?lang=" + lang);
      const data = await r.json();
      if (!data.error) setFormation(data);

      const r2 = await fetch("/api/lms-structure/" + code + "?lang=" + lang);
      const data2 = await r2.json();
      if (data2.chapitres && data2.chapitres.length > 0) {
        setChapitres(data2.chapitres);
      }
      if (data2.formateur) setFormateurDyn(data2.formateur);
      if (data2.coach) setCoachDyn(data2.coach);
    } catch {}
    setLoadingFormation(false);
  }

  async function chargerProgression() {
    try {
      const r = await fetch("/api/progression?formation_code=" + code);
      const data = await r.json();
      if (data.success) {
        setProgression(data.progression || {});
        setAvertissement("");
      } else if (r.status === 401) {
        setProgression({});
        setAvertissement("Connectez-vous pour que votre progression soit enregistree.");
      }
    } catch {
      setAvertissement("Progression indisponible pour le moment.");
    }
  }

  async function chargerModule(ch_num, mod_num) {
    if (chapitres.length === 0) return;
    setLoading(true);
    setContenu("");
    setQcmScore(null);
    setQcmReponses({});
    setMessageValidateur("");
    setPageModule(0);
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

  async function validerQCM() {
    if (questions.length === 0) return;
    let score = 0;
    questions.forEach((q, i) => { if (qcmReponses[i] === q.bonneReponse) score++; });
    const pct = Math.round((score / questions.length) * 100);
    setQcmScore(pct);

    if (pct < 70) {
      setMessageValidateur("Score " + pct + "% — Recommencez pour valider (70% requis)");
      return;
    }

    setMessageValidateur("MODULE VALIDE ! Score " + pct + "%");

    try {
      const r = await fetch("/api/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: code, module_cle: cle, score: pct }),
      });
      const data = await r.json();

      if (!data.success) {
        setAvertissement(
          r.status === 401
            ? "Connectez-vous pour que cette validation soit conservee."
            : "Validation non enregistree : " + (data.error || "erreur inconnue")
        );
        setProgression(prev => ({ ...prev, [cle]: "valide" }));
        return;
      }

      await chargerProgression();

      if (data.email) {
        const valides = Object.values({ ...progression, [cle]: "valide" }).filter(v => v === "valide").length;
        fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "lms_update",
            email: data.email,
            data: {
              formation_code: code,
              modules_valides: valides,
              progression_pct: totalModules > 0 ? Math.round((valides / totalModules) * 100) : 0,
            },
          }),
        }).catch(() => {});
      }
    } catch (e) {
      setAvertissement("Validation non enregistree : " + String(e));
      setProgression(prev => ({ ...prev, [cle]: "valide" }));
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

  const domaine = formation?.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];

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

  const styleNav = (actif) => ({
    background: actif ? "#c8a96e" : "#eee",
    color: actif ? "#050508" : "#999",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: actif ? "pointer" : "default",
    fontWeight: "bold",
  });

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "20px 30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 2px" }}>AcadeMIA Pro · LMS · {domaine}</p>
            <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", margin: "0 0 2px" }}>{formation?.titre || code}</h1>
            <p style={{ color: "rgba(200,169,110,0.7)", fontSize: "11px", margin: 0 }}>Formateur : {formateurDyn || agents.formateur}</p>
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

      {avertissement && (
        <div style={{ maxWidth: "1200px", margin: "16px auto 0", padding: "12px 18px", background: "rgba(200,120,0,0.12)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "8px", color: "#e8c887", fontSize: "13px" }}>
          {avertissement}
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "15px", height: "fit-content" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px", fontSize: "14px" }}>Programme</h3>
          {chapitres.map((ch) => (
            <div key={ch.numero} style={{ marginBottom: "10px" }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", margin: "0 0 5px" }}>Ch.{ch.numero} {ch.titre}</p>
              {(ch.modules || []).map((mod) => {
                const k = ch.numero + "_" + mod.numero;
                const valide = progression[k] === "valide";
                const actif = chapitreActif === ch.numero && moduleActif === mod.numero;
                const typeIcon = mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝";
                return (
                  <div key={mod.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(mod.numero); setOnglet("cours"); }}
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
            {[{ id: "cours", label: "📖 Cours" }, { id: "qcm", label: "✅ QCM" }, { id: "chat", label: "🤖 Coach IA" }].map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
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
                  <div style={{ color: "#666", fontSize: "14px" }}>{formateurDyn || agents.formateur} redige votre module...</div>
                </div>
              ) : contenu ? (
                <div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                      <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>
                        ← Précédent
                      </button>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                      <button onClick={() => setPageModule(p => Math.min(totalPages - 1, p + 1))} disabled={pageModule === totalPages - 1} style={styleNav(pageModule < totalPages - 1)}>
                        Suivant →
                      </button>
                    </div>
                  )}

                  {pageCourante.split("\n").filter(l => l.trim()).map((ligne, i) => {
                    const l = ligne.trim();
                    if (/^#{1,6}\s/.test(l)) {
                      const texte = l.replace(/^#{1,6}\s+/, "");
                      const niveau = (l.match(/^(#{1,6})/) || ["", ""])[1].length;
                      if (niveau <= 2) return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", margin: "20px 0 10px", borderBottom: niveau === 1 ? "2px solid #c8a96e" : "none", paddingBottom: niveau === 1 ? "8px" : "0" }}>{texte}</h2>;
                      return <h3 key={i} style={{ color: "#333", fontSize: "18px", margin: "15px 0 8px", fontWeight: "bold" }}>{texte}</h3>;
                    }
                    if (l === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
                    if (l.startsWith("> ")) return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "18px" }}>{propre(l.replace(/^> /, ""))}</blockquote>;
                    if (/^[-*]\s+/.test(l)) {
                      return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.8", margin: "0 0 10px 22px" }}>• {propre(l.replace(/^[-*]\s+/, ""))}</p>;
                    }
                    return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.85", marginBottom: "16px", textAlign: "justify" }}>{propre(l)}</p>;
                  })}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", padding: "15px 0", borderTop: "1px solid #eee" }}>
                    <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>
                      ← Précédent
                    </button>
                    <span style={{ color: "#999", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                    {pageModule < totalPages - 1 ? (
                      <button onClick={() => setPageModule(p => p + 1)} style={styleNav(true)}>
                        Suivant →
                      </button>
                    ) : (
                      <button onClick={() => setOnglet("qcm")} style={styleNav(true)}>
                        Passer au QCM →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>Selectionnez un module</div>
              )}
            </div>
          )}

          {onglet === "qcm" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 20px" }}>QCM de ce module</h3>
              {loading ? (
                <p style={{ color: "#c8a96e" }}>Chargement du module...</p>
              ) : questions.length === 0 ? (
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "15px" }}>
                    Aucun QCM trouve dans ce module. Il sera disponible une fois le module produit a la nouvelle norme.
                  </p>
                  <button onClick={() => chargerModule(chapitreActif, moduleActif)} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", fontWeight: "bold" }}>
                    Recharger le module
                  </button>
                </div>
              ) : (
                <>
                  {questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <p style={{ color: "#fff", fontWeight: "bold", margin: "0 0 10px", fontSize: "15px" }}>Q{i + 1}. {q.question}</p>
                      {q.options.map((opt, oi) => {
                        const lettre = opt[0];
                        const selectionne = qcmReponses[i] === lettre;
                        const correct = qcmScore !== null && lettre === q.bonneReponse;
                        const incorrect = qcmScore !== null && selectionne && lettre !== q.bonneReponse;
                        return (
                          <div key={oi} onClick={() => { if (qcmScore === null) setQcmReponses({ ...qcmReponses, [i]: lettre }); }}
                            style={{ padding: "10px 12px", margin: "4px 0", borderRadius: "6px", cursor: qcmScore === null ? "pointer" : "default", background: correct ? "rgba(0,200,0,0.2)" : incorrect ? "rgba(200,0,0,0.2)" : selectionne ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", border: selectionne ? "1px solid #c8a96e" : "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
                            {opt}
                          </div>
                        );
                      })}
                      {qcmScore !== null && q.explication && <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "8px 0 0", fontStyle: "italic" }}>{q.explication}</p>}
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
                        {qcmScore >= 70 && (
                          <button onClick={() => {
                            const nm = moduleActif + 1;
                            if (nm <= (chapitre?.modules.length || 0)) { setModuleActif(nm); setOnglet("cours"); }
                            else if (chapitreActif < chapitres.length) { setChapitreActif(c => c + 1); setModuleActif(1); setOnglet("cours"); }
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
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px" }}>Coach IA — {coachDyn || agents.coach}</h3>
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
