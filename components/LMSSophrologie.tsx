"use client";
import { useState, useEffect, useRef } from "react";

const CHAPITRES = [
  { numero: 1, titre_fr: "Fondements Theoriques et Scientifiques", titre_en: "Theoretical and Scientific Foundations", titre_ar: "الاسس النظرية والعلمية", titre_es: "Fundamentos Teoricos", titre_pt: "Fundamentos Teoricos", titre_de: "Theoretische Grundlagen", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }]},
  { numero: 2, titre_fr: "Les 12 Degres Caycediens RD1 a RD4", titre_en: "The 12 Caycedian Degrees RD1 to RD4", titre_ar: "الدرجات الكايسيدية", titre_es: "Los 12 Grados Caycedianos", titre_pt: "Os 12 Graus Caycedianos", titre_de: "Die 12 Caycedischen Grade", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "theorie" }, { numero: 4, type: "pratique" }]},
  { numero: 3, titre_fr: "Les Degres Superieurs RD5 a RD12", titre_en: "Advanced Degrees RD5 to RD12", titre_ar: "الدرجات المتقدمة", titre_es: "Grados Superiores", titre_pt: "Graus Superiores", titre_de: "Hoehere Grade", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }]},
  { numero: 4, titre_fr: "Applications Professionnelles", titre_en: "Professional Applications", titre_ar: "التطبيقات المهنية", titre_es: "Aplicaciones Profesionales", titre_pt: "Aplicacoes Profissionais", titre_de: "Professionelle Anwendungen", modules: [
    { numero: 1, type: "pratique" }, { numero: 2, type: "pratique" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }]},
  { numero: 5, titre_fr: "Pratique Professionnelle et Certification", titre_en: "Professional Practice and Certification", titre_ar: "الممارسة المهنية", titre_es: "Practica Profesional", titre_pt: "Pratica Profissional", titre_de: "Professionelle Praxis", modules: [
    { numero: 1, type: "pratique" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }]},
];

const LABELS = {
  fr: { programme: "PROGRAMME", chargement: "Generation du contenu en cours...", theorie: "Theorie", pratique: "Pratique", evaluation: "Evaluation", chapitre: "Chapitre", module: "Module", inscrire: "S inscrire maintenant", pret: "Pret a devenir sophrologue certifie ?", acces: "Acces immediat Claire Beaumont 24h/24", page: "Page", sur: "sur" },
  en: { programme: "CURRICULUM", chargement: "Generating content...", theorie: "Theory", pratique: "Practice", evaluation: "Assessment", chapitre: "Chapter", module: "Module", inscrire: "Enroll now", pret: "Ready to become certified?", acces: "Immediate access Claire Beaumont 24/7", page: "Page", sur: "of" },
  ar: { programme: "البرنامج", chargement: "جاري التوليد...", theorie: "نظري", pratique: "تطبيقي", evaluation: "تقييم", chapitre: "الفصل", module: "الوحدة", inscrire: "سجل الان", pret: "هل انت مستعد؟", acces: "وصول فوري", page: "صفحة", sur: "من" },
  es: { programme: "PROGRAMA", chargement: "Generando...", theorie: "Teoria", pratique: "Practica", evaluation: "Evaluacion", chapitre: "Capitulo", module: "Modulo", inscrire: "Inscribirse", pret: "Listo?", acces: "Acceso inmediato", page: "Pagina", sur: "de" },
  pt: { programme: "PROGRAMA", chargement: "Gerando...", theorie: "Teoria", pratique: "Pratica", evaluation: "Avaliacao", chapitre: "Capitulo", module: "Modulo", inscrire: "Inscrever-se", pret: "Pronto?", acces: "Acesso imediato", page: "Pagina", sur: "de" },
  de: { programme: "LEHRPLAN", chargement: "Wird generiert...", theorie: "Theorie", pratique: "Praxis", evaluation: "Bewertung", chapitre: "Kapitel", module: "Modul", inscrire: "Einschreiben", pret: "Bereit?", acces: "Sofortiger Zugang", page: "Seite", sur: "von" },
};

const MOTS_PAR_PAGE = 300;

function getTitre(ch, langue) { return ch["titre_" + langue] || ch.titre_fr; }
function getTypeIcon(type) { if (type === "theorie") return "📖"; if (type === "pratique") return "🛠️"; return "📝"; }
function getTypeLabel(type, lb) { if (type === "theorie") return lb.theorie; if (type === "pratique") return lb.pratique; return lb.evaluation; }

function preparerPages(texte) {
  if (!texte) return [];
  const paragraphes = texte.split("\n").filter(l => l.trim());
  const pages = [];
  let pageCourante = [];
  let motsCourants = 0;
  for (const para of paragraphes) {
    const mots = para.split(" ").length;
    if (motsCourants + mots > MOTS_PAR_PAGE && pageCourante.length > 0) {
      pages.push(pageCourante);
      pageCourante = [para];
      motsCourants = mots;
    } else {
      pageCourante.push(para);
      motsCourants += mots;
    }
  }
  if (pageCourante.length > 0) pages.push(pageCourante);
  return pages;
}

function formaterLigne(ligne) {
  if (ligne.startsWith("### ")) return { type: "h3", texte: ligne.replace(/^### /, "") };
  if (ligne.startsWith("## ")) return { type: "h2", texte: ligne.replace(/^## /, "") };
  if (ligne.startsWith("# ")) return { type: "h1", texte: ligne.replace(/^# /, "") };
  if (ligne === "---") return { type: "separateur" };
  if (ligne.startsWith("> ")) return { type: "citation", texte: ligne.replace(/^> /, "").replace(/\*\*(.+?)\*\*/g, "$1") };
  return { type: "para", texte: ligne.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1") };
}

function PageContenu({ lignes }) {
  return (
    <div>
      {lignes.map((ligne, i) => {
        const el = formaterLigne(ligne);
        if (el.type === "h1") return <h2 key={i} style={{ color: "#1a1a2e", fontFamily: "Georgia,serif", fontSize: "24px", marginTop: "20px", marginBottom: "12px", borderBottom: "2px solid #c8a96e", paddingBottom: "8px" }}>{el.texte}</h2>;
        if (el.type === "h2") return <h3 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", marginTop: "18px", marginBottom: "10px" }}>{el.texte}</h3>;
        if (el.type === "h3") return <h4 key={i} style={{ color: "#333", fontSize: "20px", marginTop: "15px", marginBottom: "8px", fontWeight: "bold" }}>{el.texte}</h4>;
        if (el.type === "separateur") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
        if (el.type === "citation") return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "22px", lineHeight: "1.8" }}>{el.texte}</blockquote>;
        return <p key={i} style={{ color: "#1a1a1a", fontSize: "22px", lineHeight: "2.0", marginBottom: "18px", textAlign: "justify" }}>{el.texte}</p>;
      })}
    </div>
  );
}

function jouerSonPage() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    src.buffer = buf;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {}
}

export default function LMSSophrologie({ langue = "fr" }) {
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageActuelle, setPageActuelle] = useState(0);
  const [anim, setAnim] = useState("");
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const lb = LABELS[langue] || LABELS.fr;
  const chapitre = CHAPITRES[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const pages = preparerPages(contenu);
  const totalPages = pages.length;

  useEffect(() => { charger(chapitreActif, moduleActif); }, [chapitreActif, moduleActif, langue]);

  async function charger(ch_num, mod_num) {
    setLoading(true); setContenu(""); setPageActuelle(0);
    try {
      const r = await fetch("/api/lms/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: "F030", chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) setContenu(data.contenu);
    } catch {}
    setLoading(false);
  }

  function tournerPage(direction) {
    if (direction === "suivante" && pageActuelle < totalPages - 1) {
      jouerSonPage();
      setAnim("flip-left");
      setTimeout(() => { setPageActuelle(p => p + 1); setAnim(""); }, 300);
    } else if (direction === "precedente" && pageActuelle > 0) {
      jouerSonPage();
      setAnim("flip-right");
      setTimeout(() => { setPageActuelle(p => p - 1); setAnim(""); }, 300);
    }
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) tournerPage("suivante");
      else tournerPage("precedente");
    }
  }

  const animStyle = anim === "flip-left"
    ? { transform: "perspective(1200px) rotateY(-25deg) scaleX(0.85)", opacity: 0.3, transition: "all 0.3s ease" }
    : anim === "flip-right"
    ? { transform: "perspective(1200px) rotateY(25deg) scaleX(0.85)", opacity: 0.3, transition: "all 0.3s ease" }
    : { transform: "perspective(1200px) rotateY(0deg) scaleX(1)", opacity: 1, transition: "all 0.3s ease" };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>

      <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🧘</div>
        <div>
          <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "17px" }}>Claire Beaumont</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Formatrice Expert Sophrologie Caycedienne</div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "16px", marginBottom: "10px" }}>{lb.programme}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {CHAPITRES.map((ch) => (
            <button key={ch.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(1); setPageActuelle(0); }}
              style={{ textAlign: "left", padding: "12px 16px", borderRadius: "8px", border: "1px solid " + (chapitreActif === ch.numero ? "#c8a96e" : "rgba(200,169,110,0.2)"), background: chapitreActif === ch.numero ? "rgba(200,169,110,0.15)" : "#1a1a2e", color: chapitreActif === ch.numero ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "15px" }}>
              <span style={{ fontWeight: "bold", marginRight: "8px" }}>{lb.chapitre} {ch.numero}</span>{getTitre(ch, langue)}
              <span style={{ float: "right", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{ch.modules.length} mod.</span>
            </button>
          ))}
        </div>
      </div>

      {chapitre && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            {chapitre.modules.map((mod) => (
              <button key={mod.numero} onClick={() => { setModuleActif(mod.numero); setPageActuelle(0); }}
                style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid " + (moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.15)"), background: moduleActif === mod.numero ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "center", minWidth: "100px" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{lb.module} {mod.numero}</div>
                <div style={{ fontSize: "12px", marginTop: "3px", opacity: 0.8 }}>{getTypeIcon(mod.type)} {getTypeLabel(mod.type, lb)}</div>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "60px 40px", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", minHeight: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>⚡</div>
              <div style={{ color: "#c8a96e", fontSize: "18px", marginBottom: "10px" }}>{lb.chargement}</div>
              <div style={{ color: "#666", fontSize: "15px" }}>Claire Beaumont redige votre manuel...</div>
            </div>
          ) : contenu && pages.length > 0 ? (
            <div>
              <div
                style={{ ...animStyle, background: "#fff", borderRadius: "12px", padding: "50px 45px", boxShadow: "0 8px 40px rgba(0,0,0,0.4), 4px 0 15px rgba(0,0,0,0.1)", minHeight: "500px", position: "relative", cursor: "grab", userSelect: "none" }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <div style={{ borderBottom: "2px solid #c8a96e", marginBottom: "30px", paddingBottom: "15px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" }}>
                    ACADEMIAPRO · SOPHROLOGIE · {lb.chapitre.toUpperCase()} {chapitreActif} · {lb.module.toUpperCase()} {moduleActif}
                  </div>
                </div>

                <PageContenu lignes={pages[pageActuelle] || []} />

                <div style={{ borderTop: "1px solid #ddd", marginTop: "30px", paddingTop: "15px", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
                  <span style={{ color: "#aaa", fontSize: "13px" }}>← Glisser pour tourner →</span>
                  <span style={{ color: "#999", fontSize: "14px", fontStyle: "italic" }}>{lb.page} {pageActuelle + 1} {lb.sur} {totalPages}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                <button onClick={() => tournerPage("precedente")} disabled={pageActuelle === 0}
                  style={{ padding: "14px 28px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: pageActuelle === 0 ? "rgba(255,255,255,0.03)" : "rgba(200,169,110,0.15)", color: pageActuelle === 0 ? "rgba(255,255,255,0.15)" : "#c8a96e", cursor: pageActuelle === 0 ? "not-allowed" : "pointer", fontSize: "22px" }}>
                  ←
                </button>

                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                    const idx = totalPages <= 9 ? i : Math.max(0, Math.min(pageActuelle - 4, totalPages - 9)) + i;
                    return <button key={idx} onClick={() => { jouerSonPage(); setPageActuelle(idx); }} style={{ width: idx === pageActuelle ? "14px" : "10px", height: idx === pageActuelle ? "14px" : "10px", borderRadius: "50%", border: "none", background: idx === pageActuelle ? "#c8a96e" : "rgba(200,169,110,0.3)", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />;
                  })}
                </div>

                <button onClick={() => tournerPage("suivante")} disabled={pageActuelle === totalPages - 1}
                  style={{ padding: "14px 28px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: pageActuelle === totalPages - 1 ? "rgba(255,255,255,0.03)" : "rgba(200,169,110,0.15)", color: pageActuelle === totalPages - 1 ? "rgba(255,255,255,0.15)" : "#c8a96e", cursor: pageActuelle === totalPages - 1 ? "not-allowed" : "pointer", fontSize: "22px" }}>
                  →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d1a)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "30px", textAlign: "center", marginTop: "30px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
        <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "22px", marginBottom: "8px" }}>{lb.pret}</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", marginBottom: "20px" }}>{lb.acces}</p>
        <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 44px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "17px" }}>{lb.inscrire}</a>
      </div>
    </div>
  );
}
