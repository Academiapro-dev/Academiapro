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
  en: { programme: "CURRICULUM", chargement: "Generating content...", theorie: "Theory", pratique: "Practice", evaluation: "Assessment", chapitre: "Chapter", module: "Module", inscrire: "Enroll now", pret: "Ready to become certified?", acces: "Immediate access", page: "Page", sur: "of" },
  ar: { programme: "البرنامج", chargement: "جاري التوليد...", theorie: "نظري", pratique: "تطبيقي", evaluation: "تقييم", chapitre: "الفصل", module: "الوحدة", inscrire: "سجل الان", pret: "هل انت مستعد؟", acces: "وصول فوري", page: "صفحة", sur: "من" },
  es: { programme: "PROGRAMA", chargement: "Generando...", theorie: "Teoria", pratique: "Practica", evaluation: "Evaluacion", chapitre: "Capitulo", module: "Modulo", inscrire: "Inscribirse", pret: "Listo?", acces: "Acceso inmediato", page: "Pagina", sur: "de" },
  pt: { programme: "PROGRAMA", chargement: "Gerando...", theorie: "Teoria", pratique: "Pratica", evaluation: "Avaliacao", chapitre: "Capitulo", module: "Modulo", inscrire: "Inscrever-se", pret: "Pronto?", acces: "Acesso imediato", page: "Pagina", sur: "de" },
  de: { programme: "LEHRPLAN", chargement: "Wird generiert...", theorie: "Theorie", pratique: "Praxis", evaluation: "Bewertung", chapitre: "Kapitel", module: "Modul", inscrire: "Einschreiben", pret: "Bereit?", acces: "Sofortiger Zugang", page: "Seite", sur: "von" },
};

const MOTS_PAR_PAGE = 280;

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
  if (ligne === "---") return { type: "sep" };
  if (ligne.startsWith("> ")) return { type: "cit", texte: ligne.replace(/^> /, "").replace(/\*\*(.+?)\*\*/g, "$1") };
  return { type: "p", texte: ligne.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1") };
}

function PageContenu({ lignes }) {
  return (
    <div>
      {lignes.map((ligne, i) => {
        const el = formaterLigne(ligne);
        if (el.type === "h1") return <h2 key={i} style={{ color: "#1a1a2e", fontFamily: "Georgia,serif", fontSize: "24px", marginTop: "20px", marginBottom: "12px", borderBottom: "2px solid #c8a96e", paddingBottom: "8px" }}>{el.texte}</h2>;
        if (el.type === "h2") return <h3 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", marginTop: "18px", marginBottom: "10px" }}>{el.texte}</h3>;
        if (el.type === "h3") return <h4 key={i} style={{ color: "#333", fontSize: "20px", marginTop: "15px", marginBottom: "8px", fontWeight: "bold" }}>{el.texte}</h4>;
        if (el.type === "sep") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
        if (el.type === "cit") return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "21px", lineHeight: "1.8" }}>{el.texte}</blockquote>;
        return <p key={i} style={{ color: "#1a1a1a", fontSize: "22px", lineHeight: "2.0", marginBottom: "18px", textAlign: "justify" }}>{el.texte}</p>;
      })}
    </div>
  );
}

function jouerSon() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    for (let s = 0; s < 3; s++) {
      const delay = s * 0.04;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.025) * 0.3;
      }
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1500 + s * 500;
      f.Q.value = 1;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start(ctx.currentTime + delay);
    }
  } catch {}
}

export default function LMSSophrologie({ langue: langueProp = "fr" }) {
  const [langue, setLangue] = useState(langueProp);
  
  useEffect(() => {
    const saved = localStorage.getItem("langue") || langueProp || "fr";
    setLangue(saved);
  }, [langueProp]);
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageActuelle, setPageActuelle] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState("next");
  const [curlProgress, setCurlProgress] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const animRef = useRef<number | null>(null);

  const lb = LABELS[langue] || LABELS.fr;
  const chapitre = CHAPITRES[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const pages = preparerPages(contenu);
  const totalPages = pages.length;

  useEffect(() => { charger(chapitreActif, moduleActif); }, [chapitreActif, moduleActif, langue]);

  async function charger(ch_num, mod_num) {
    setLoading(true); setContenu(""); setPageActuelle(0);
    try {
      const r = await fetch("/api/lms-sophrologie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: "F030", chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) setContenu(data.contenu);
    } catch {}
    setLoading(false);
  }

  function allerPage(direction) {
    if (flipping) return;
    const next = direction === "next" ? pageActuelle + 1 : pageActuelle - 1;
    if (next < 0 || next >= totalPages) return;
    jouerSon();
    setFlipDir(direction);
    setFlipping(true);
    setCurlProgress(0);
    let progress = 0;
    const animate = () => {
      progress += 0.08;
      setCurlProgress(Math.min(progress, 1));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPageActuelle(next);
        setFlipping(false);
        setCurlProgress(0);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 60 && dy < 100) {
      allerPage(dx < 0 ? "next" : "prev");
    }
  }

  const curlAngle = flipping ? curlProgress * 180 : 0;
  const pageStyle = flipping && flipDir === "next" ? {
    transformOrigin: "right center",
    transform: `perspective(2000px) rotateY(${-curlAngle}deg)`,
    transition: "none",
  } : flipping && flipDir === "prev" ? {
    transformOrigin: "left center",
    transform: `perspective(2000px) rotateY(${curlAngle - 180}deg)`,
    transition: "none",
  } : {
    transformOrigin: "right center",
    transform: "perspective(2000px) rotateY(0deg)",
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px", direction: langue === "he" || langue === "ar" ? "rtl" : "ltr" }}>

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
                style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid " + (moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.15)"), background: moduleActif === mod.numero ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "center", minWidth: "110px" }}>
                <div style={{ fontWeight: "bold", fontSize: "15px" }}>{lb.module} {mod.numero}</div>
                <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>{getTypeIcon(mod.type)} {getTypeLabel(mod.type, lb)}</div>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ background: "#fff", borderRadius: "3px", padding: "60px 40px", textAlign: "center", boxShadow: "4px 4px 20px rgba(0,0,0,0.4)", minHeight: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>⚡</div>
              <div style={{ color: "#c8a96e", fontSize: "18px", marginBottom: "10px" }}>{lb.chargement}</div>
              <div style={{ color: "#666", fontSize: "15px" }}>Claire Beaumont redige votre manuel...</div>
            </div>
          ) : contenu && pages.length > 0 ? (
            <div>
              <div style={{ position: "relative", perspective: "2000px" }}>
                <div
                  style={{
                    ...pageStyle,
                    background: "linear-gradient(105deg, #faf6ee 0%, #fff 4%, #fff 96%, #f5f0e4 100%)",
                    borderRadius: "3px",
                    padding: "45px 50px 35px 55px",
                    boxShadow: flipping
                      ? "none"
                      : "3px 3px 15px rgba(0,0,0,0.3), 8px 5px 30px rgba(0,0,0,0.2), inset -2px 0 8px rgba(0,0,0,0.04)",
                    minHeight: "520px",
                    cursor: "grab",
                    borderLeft: "5px solid #c8b89a",
                    backfaceVisibility: "hidden",
                  }}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(transparent, transparent 41px, rgba(180,160,120,0.1) 41px, rgba(180,160,120,0.1) 42px)", pointerEvents: "none", borderRadius: "3px" }} />

                  <div style={{ borderBottom: "1px solid #d4c5a0", marginBottom: "25px", paddingBottom: "12px" }}>
                    <div style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "bold", letterSpacing: "2px" }}>
                      ACADEMIAPRO · SOPHROLOGIE · {lb.chapitre.toUpperCase()} {chapitreActif} · {lb.module.toUpperCase()} {moduleActif}
                    </div>
                  </div>

                  <PageContenu lignes={pages[pageActuelle] || []} />

                  <div style={{ borderTop: "1px solid #d4c5a0", marginTop: "25px", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#bbb", fontSize: "12px", fontStyle: "italic" }}>← Glisser pour tourner →</span>
                    <span style={{ color: "#999", fontSize: "13px", fontFamily: "Georgia,serif", fontStyle: "italic" }}>{lb.page} {pageActuelle + 1} {lb.sur} {totalPages}</span>
                  </div>

                  {pageActuelle < totalPages - 1 && (
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 0, height: 0,
                      borderStyle: "solid",
                      borderWidth: "0 0 30px 30px",
                      borderColor: "transparent transparent #d4c5a0 transparent",
                      cursor: "pointer",
                    }} onClick={() => allerPage("next")} />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                <button onClick={() => allerPage("prev")} disabled={pageActuelle === 0}
                  style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: pageActuelle === 0 ? "rgba(255,255,255,0.03)" : "rgba(200,169,110,0.15)", color: pageActuelle === 0 ? "rgba(255,255,255,0.15)" : "#c8a96e", cursor: pageActuelle === 0 ? "not-allowed" : "pointer", fontSize: "20px" }}>
                  ←
                </button>
                <div style={{ display: "flex", gap: "5px" }}>
                  {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                    const idx = totalPages <= 9 ? i : Math.max(0, Math.min(pageActuelle - 4, totalPages - 9)) + i;
                    return <button key={idx} onClick={() => { jouerSon(); setPageActuelle(idx); }} style={{ width: idx === pageActuelle ? "14px" : "9px", height: idx === pageActuelle ? "14px" : "9px", borderRadius: "50%", border: "none", background: idx === pageActuelle ? "#c8a96e" : "rgba(200,169,110,0.3)", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />;
                  })}
                </div>
                <button onClick={() => allerPage("next")} disabled={pageActuelle === totalPages - 1}
                  style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: pageActuelle === totalPages - 1 ? "rgba(255,255,255,0.03)" : "rgba(200,169,110,0.15)", color: pageActuelle === totalPages - 1 ? "rgba(255,255,255,0.15)" : "#c8a96e", cursor: pageActuelle === totalPages - 1 ? "not-allowed" : "pointer", fontSize: "20px" }}>
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
