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

// Les QUESTIONS SEULES. On coupe avant le corrige, mais uniquement sur une
// LIGNE qui commence par Corrige : le mot apparait aussi dans la phrase
// d introduction (« vous disposez du corrige »), et couper la supprimait tout.
function questionsSeules(contenu) {
  const t = String(contenu || "");
  const debut = t.search(/^#{1,6}\s*QCM/im);
  if (debut < 0) return "";

  let zone = t.slice(debut);
  const suite = zone.slice(20).search(/^#{1,6}\s+/m);
  if (suite > 0) zone = zone.slice(0, suite + 20);

  const lignes = zone.split("\n");
  const gardees = [];
  for (const ligne of lignes) {
    const l = ligne.trim().replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "");
    if (/^corrig[eé]\b/i.test(l) || /^r[eé]ponses?\s+(correctes?|attendues?)\b/i.test(l)) break;
    gardees.push(ligne);
  }

  return gardees.join("\n").trim();
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
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [langue, setLangue] = useState("fr");
  const [formateurDyn, setFormateurDyn] = useState("");
  const [coachDyn, setCoachDyn] = useState("");
  const [pageModule, setPageModule] = useState(0);

  const [mesReponses, setMesReponses] = useState("");
  const [correction, setCorrection] = useState(null);
  const [correctionEnCours, setCorrectionEnCours] = useState(false);
  const [seuil, setSeuil] = useState(14);

  const chapitre = chapitres[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const totalModules = chapitres.reduce((acc, ch) => acc + (ch.modules?.length || 0), 0);
  const modulesValides = Object.values(progression).filter(v => v === "valide").length;
  const progressionPct = totalModules > 0 ? Math.round((modulesValides / totalModules) * 100) : 0;
  const cle = chapitreActif + "_" + moduleActif;
  const moduleValide = progression[cle] === "valide";
  const pages = decouperEnPages(contenu);
  const totalPages = pages.length;
  const pageCourante = pages[pageModule] || pages[0] || "";
  const texteQCM = questionsSeules(contenu);

  useEffect(() => {
    const lang = localStorage.getItem("langue") || "fr";
    setLangue(lang);
    chargerFormation(lang);
    chargerProgression();
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
      if (data2.chapitres && data2.chapitres.length > 0) setChapitres(data2.chapitres);
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

  async function chargerCopie(ch_num, mod_num) {
    setCorrection(null);
    setMesReponses("");
    try {
      const r = await fetch("/api/qcm-correcteur?formation_code=" + code + "&module_cle=" + ch_num + "_" + mod_num);
      const data = await r.json();
      if (data.ok) {
        if (data.seuil) setSeuil(data.seuil);
        if (data.copie) {
          setMesReponses(data.copie.reponses || "");
          if (data.copie.statut === "corrigee") {
            setCorrection({ note: data.copie.note, retour: data.copie.retour, valide: data.copie.note >= (data.seuil || 14) });
          }
        }
      }
    } catch {}
  }

  async function chargerModule(ch_num, mod_num) {
    if (chapitres.length === 0) return;
    setLoading(true);
    setContenu("");
    setPageModule(0);
    chargerCopie(ch_num, mod_num);
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

  async function faireCorriger() {
    if (mesReponses.trim().length < 10) return;
    setCorrectionEnCours(true);
    setAvertissement("");
    try {
      const r = await fetch("/api/qcm-correcteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: code, module_cle: cle, reponses: mesReponses, langue }),
      });
      const data = await r.json();
      if (data.ok) {
        setCorrection({ note: data.note, retour: data.retour, valide: data.valide });
        if (data.seuil) setSeuil(data.seuil);
        if (data.valide) await chargerProgression();
      } else {
        setAvertissement(data.erreur || "Correction impossible.");
      }
    } catch (e) {
      setAvertissement("Correction impossible : " + String(e));
    }
    setCorrectionEnCours(false);
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

  function moduleSuivant() {
    const nm = moduleActif + 1;
    if (nm <= (chapitre?.modules.length || 0)) { setModuleActif(nm); setOnglet("cours"); }
    else if (chapitreActif < chapitres.length) { setChapitreActif(c => c + 1); setModuleActif(1); setOnglet("cours"); }
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

  const CARTE_BLANCHE = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "36px 40px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    marginBottom: "20px",
  };

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
            <div style={{ ...CARTE_BLANCHE, padding: "40px 45px", minHeight: "400px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "15px" }}>⚡</div>
                  <div style={{ color: "#c8a96e", fontSize: "16px" }}>Chargement du module...</div>
                </div>
              ) : contenu ? (
                <div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                      <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                      <button onClick={() => setPageModule(p => Math.min(totalPages - 1, p + 1))} disabled={pageModule === totalPages - 1} style={styleNav(pageModule < totalPages - 1)}>Suivant →</button>
                    </div>
                  )}

                  {pageCourante.split("\n").filter(l => l.trim()).map((ligne, i) => {
                    const l = ligne.trim();
                    if (/^#{1,6}\s/.test(l)) {
                      const texte = l.replace(/^#{1,6}\s+/, "");
                      const niveau = (l.match(/^(#{1,6})/) || ["", ""])[1].length;
                      if (niveau <= 2) return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", margin: "20px 0 10px" }}>{texte}</h2>;
                      return <h3 key={i} style={{ color: "#333", fontSize: "18px", margin: "15px 0 8px", fontWeight: "bold" }}>{texte}</h3>;
                    }
                    if (l === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
                    if (l.startsWith("> ")) return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "18px" }}>{propre(l.replace(/^> /, ""))}</blockquote>;
                    if (/^[-*]\s+/.test(l)) return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.8", margin: "0 0 10px 22px" }}>• {propre(l.replace(/^[-*]\s+/, ""))}</p>;
                    return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.85", marginBottom: "16px", textAlign: "justify" }}>{propre(l)}</p>;
                  })}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", padding: "15px 0", borderTop: "1px solid #eee" }}>
                    <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                    <span style={{ color: "#999", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                    {pageModule < totalPages - 1 ? (
                      <button onClick={() => setPageModule(p => p + 1)} style={styleNav(true)}>Suivant →</button>
                    ) : (
                      <button onClick={() => setOnglet("qcm")} style={styleNav(true)}>Passer au QCM →</button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>Selectionnez un module</div>
              )}
            </div>
          )}

          {onglet === "qcm" && (
            <div>
              {loading ? (
                <div style={CARTE_BLANCHE}>
                  <p style={{ color: "#666", margin: 0 }}>Chargement du module...</p>
                </div>
              ) : !texteQCM ? (
                <div style={CARTE_BLANCHE}>
                  <p style={{ color: "#666", margin: 0, fontSize: "17px" }}>
                    Ce module n a pas encore de questionnaire. Il apparaitra une fois le module produit.
                  </p>
                </div>
              ) : (
                <>
                  <div style={CARTE_BLANCHE}>
                    {texteQCM.split("\n").filter(l => l.trim()).map((ligne, i) => {
                      const l = ligne.trim();
                      if (/^#{1,6}\s/.test(l)) return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "21px", margin: "0 0 16px" }}>{l.replace(/^#{1,6}\s+/, "")}</h2>;
                      if (/^[A-D]\s*[).\-–:]/.test(l)) return <p key={i} style={{ color: "#1a1a1a", fontSize: "17px", lineHeight: "1.6", margin: "0 0 6px 26px" }}>{propre(l)}</p>;
                      if (/^[-*]\s+/.test(l)) return <p key={i} style={{ color: "#1a1a1a", fontSize: "17px", lineHeight: "1.7", margin: "0 0 8px 22px" }}>• {propre(l.replace(/^[-*]\s+/, ""))}</p>;
                      if (/^(?:Question\s*)?Q?\s*\d{1,2}\s*[.)\-–:]/.test(l)) return <p key={i} style={{ color: "#1a1a1a", fontSize: "17px", lineHeight: "1.7", margin: "20px 0 10px", fontWeight: "bold" }}>{propre(l)}</p>;
                      return <p key={i} style={{ color: "#1a1a1a", fontSize: "17px", lineHeight: "1.75", marginBottom: "12px" }}>{propre(l)}</p>;
                    })}
                  </div>

                  <div style={CARTE_BLANCHE}>
                    <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 8px", fontSize: "19px" }}>Vos reponses</h3>
                    <p style={{ color: "#555", fontSize: "15px", marginTop: 0, lineHeight: "1.6" }}>
                      Ecrivez vos reponses comme vous le souhaitez, par exemple « 1 : B, 2 : C ». Vous pouvez
                      justifier une reponse si vous le voulez : le correcteur en tiendra compte.
                    </p>

                    <textarea
                      value={mesReponses}
                      onChange={(e) => setMesReponses(e.target.value)}
                      rows={9}
                      placeholder={"1 : B\n2 : C\n3 : A, parce que..."}
                      disabled={correctionEnCours}
                      style={{ width: "100%", padding: "16px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", color: "#1a1a1a", fontSize: "17px", lineHeight: "1.7", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "16px" }}
                    />

                    <button
                      onClick={faireCorriger}
                      disabled={correctionEnCours || mesReponses.trim().length < 10}
                      style={{ background: correctionEnCours || mesReponses.trim().length < 10 ? "#e3d9c2" : "#c8a96e", color: correctionEnCours || mesReponses.trim().length < 10 ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: correctionEnCours ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", width: "100%", fontFamily: "Georgia,serif" }}
                    >
                      {correctionEnCours ? "Le correcteur lit vos reponses..." : correction ? "Faire corriger a nouveau" : "Faire corriger mes reponses"}
                    </button>

                    <p style={{ color: "#888", fontSize: "14px", marginTop: "12px", marginBottom: 0 }}>
                      Il faut {seuil} sur 20 pour valider ce module. Vous pouvez recommencer autant de fois que necessaire.
                    </p>
                  </div>

                  {correction && (
                    <div style={{ ...CARTE_BLANCHE, padding: "30px 36px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px", paddingBottom: "16px", borderBottom: "1px solid #eee" }}>
                        <span style={{ fontSize: "34px", fontWeight: "bold", color: correction.valide ? "#2e7d32" : "#c62828", fontFamily: "Georgia,serif" }}>
                          {correction.note}/20
                        </span>
                        <span style={{ color: correction.valide ? "#2e7d32" : "#a06a2c", fontSize: "16px", fontWeight: "bold" }}>
                          {correction.valide ? "Module valide" : "Pas encore acquis"}
                        </span>
                      </div>

                      <div style={{ whiteSpace: "pre-wrap", color: "#1a1a1a", fontSize: "17px", lineHeight: "1.8", fontFamily: "Georgia,serif" }}>
                        {propre(correction.retour)}
                      </div>

                      {correction.valide && (
                        <button onClick={moduleSuivant} style={{ marginTop: "24px", background: "#c8a96e", color: "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif" }}>
                          Module suivant →
                        </button>
                      )}
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
