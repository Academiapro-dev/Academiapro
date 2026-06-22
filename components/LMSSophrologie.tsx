"use client";
import { useState, useEffect } from "react";

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
  fr: { programme: "PROGRAMME", chargement: "Generation du contenu complet en cours...", depuis_cache: "Contenu charge", genere: "Contenu genere", theorie: "Theorie", pratique: "Pratique", evaluation: "Evaluation", chapitre: "Chapitre", inscrire: "S inscrire maintenant", pret: "Pret a devenir sophrologue certifie ?", acces: "Acces immediat Claire Beaumont 24h/24 Certification incluse" },
  en: { programme: "CURRICULUM", chargement: "Generating complete content...", depuis_cache: "Content loaded", genere: "Content generated", theorie: "Theory", pratique: "Practice", evaluation: "Assessment", chapitre: "Chapter", inscrire: "Enroll now", pret: "Ready to become a certified sophrologist?", acces: "Immediate access Claire Beaumont 24/7 Certification included" },
  ar: { programme: "البرنامج", chargement: "جاري توليد المحتوى", depuis_cache: "تم التحميل", genere: "تم التوليد", theorie: "نظري", pratique: "تطبيقي", evaluation: "تقييم", chapitre: "الفصل", inscrire: "سجل الان", pret: "هل انت مستعد؟", acces: "وصول فوري كلير بومون 24/7" },
  es: { programme: "PROGRAMA", chargement: "Generando contenido...", depuis_cache: "Contenido cargado", genere: "Contenido generado", theorie: "Teoria", pratique: "Practica", evaluation: "Evaluacion", chapitre: "Capitulo", inscrire: "Inscribirse ahora", pret: "Listo para certificarte?", acces: "Acceso inmediato Claire Beaumont 24/7" },
  pt: { programme: "PROGRAMA", chargement: "Gerando conteudo...", depuis_cache: "Conteudo carregado", genere: "Conteudo gerado", theorie: "Teoria", pratique: "Pratica", evaluation: "Avaliacao", chapitre: "Capitulo", inscrire: "Inscrever-se agora", pret: "Pronto para se certificar?", acces: "Acesso imediato Claire Beaumont 24/7" },
  de: { programme: "LEHRPLAN", chargement: "Inhalt wird generiert...", depuis_cache: "Inhalt geladen", genere: "Inhalt generiert", theorie: "Theorie", pratique: "Praxis", evaluation: "Bewertung", chapitre: "Kapitel", inscrire: "Jetzt einschreiben", pret: "Bereit fur die Zertifizierung?", acces: "Sofortiger Zugang Claire Beaumont 24/7" },
};

function getTitre(ch, langue) { return ch["titre_" + langue] || ch.titre_fr; }
function getTypeIcon(type) { if (type === "theorie") return "📖"; if (type === "pratique") return "🛠️"; return "📝"; }

function formaterContenu(texte) {
  if (!texte) return [];
  const lignes = texte.split("\n");
  const elements = [];
  let i = 0;
  while (i < lignes.length) {
    const ligne = lignes[i].trim();
    if (!ligne) { i++; continue; }
    if (ligne.startsWith("### ")) {
      elements.push({ type: "h3", texte: ligne.replace(/^### /, "") });
    } else if (ligne.startsWith("## ")) {
      elements.push({ type: "h2", texte: ligne.replace(/^## /, "") });
    } else if (ligne.startsWith("# ")) {
      elements.push({ type: "h1", texte: ligne.replace(/^# /, "") });
    } else if (ligne === "---") {
      elements.push({ type: "separateur" });
    } else if (ligne.startsWith("**") && ligne.endsWith("**")) {
      elements.push({ type: "gras", texte: ligne.replace(/\*\*/g, "") });
    } else if (ligne.startsWith("> ")) {
      elements.push({ type: "citation", texte: ligne.replace(/^> /, "") });
    } else {
      const texte_propre = ligne
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1");
      elements.push({ type: "paragraphe", texte: texte_propre });
    }
    i++;
  }
  return elements;
}

function AfficherContenu({ contenu }) {
  const elements = formaterContenu(contenu);
  return (
    <div>
      {elements.map((el, i) => {
        if (el.type === "h1") return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", marginTop: "30px", marginBottom: "12px", borderBottom: "1px solid rgba(200,169,110,0.3)", paddingBottom: "8px" }}>{el.texte}</h2>;
        if (el.type === "h2") return <h3 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "18px", marginTop: "25px", marginBottom: "10px" }}>{el.texte}</h3>;
        if (el.type === "h3") return <h4 key={i} style={{ color: "rgba(200,169,110,0.8)", fontSize: "16px", marginTop: "20px", marginBottom: "8px", fontWeight: "bold" }}>{el.texte}</h4>;
        if (el.type === "separateur") return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(200,169,110,0.2)", margin: "20px 0" }} />;
        if (el.type === "gras") return <p key={i} style={{ color: "#fff", fontSize: "16px", fontWeight: "bold", lineHeight: "1.8", marginBottom: "12px" }}>{el.texte}</p>;
        if (el.type === "citation") return <blockquote key={i} style={{ borderLeft: "3px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "rgba(255,255,255,0.75)", fontStyle: "italic", fontSize: "16px", lineHeight: "1.8" }}>{el.texte}</blockquote>;
        return <p key={i} style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", lineHeight: "1.9", marginBottom: "16px", textAlign: "justify" }}>{el.texte}</p>;
      })}
    </div>
  );
}

export default function LMSSophrologie({ langue = "fr" }) {
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState("");
  const lb = LABELS[langue] || LABELS.fr;
  const chapitre = CHAPITRES[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];

  useEffect(() => { charger(chapitreActif, moduleActif); }, [chapitreActif, moduleActif, langue]);

  async function charger(ch_num, mod_num) {
    setLoading(true); setContenu(""); setStatut(lb.chargement);
    try {
      const r = await fetch("/api/lms/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: "F030", chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) { setContenu(data.contenu); setStatut(data.depuis_cache ? lb.depuis_cache : lb.genere); }
      else { setStatut("Erreur: " + (data.erreur || "inconnue")); }
    } catch { setStatut("Erreur reseau"); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "24px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🧘</div>
        <div>
          <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "17px", marginBottom: "4px" }}>Claire Beaumont</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>Formatrice Expert Sophrologie Caycedienne AcadeMIA Pro</div>
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "17px", marginBottom: "12px" }}>{lb.programme}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {CHAPITRES.map((ch) => (
            <button key={ch.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(1); }}
              style={{ textAlign: "left", padding: "14px 18px", borderRadius: "10px", border: "1px solid " + (chapitreActif === ch.numero ? "#c8a96e" : "rgba(200,169,110,0.2)"), background: chapitreActif === ch.numero ? "rgba(200,169,110,0.15)" : "#1a1a2e", color: chapitreActif === ch.numero ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "15px" }}>
              <span style={{ fontWeight: "bold", marginRight: "10px" }}>{lb.chapitre} {ch.numero}</span>{getTitre(ch, langue)}
              <span style={{ float: "right", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{ch.modules.length} modules</span>
            </button>
          ))}
        </div>
      </div>
      {chapitre && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
            {chapitre.modules.map((mod) => (
              <button key={mod.numero} onClick={() => setModuleActif(mod.numero)}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid " + (moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.15)"), background: moduleActif === mod.numero ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "14px" }}>
                {getTypeIcon(mod.type)} {lb[mod.type]} {mod.numero}
              </button>
            ))}
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "30px", border: "1px solid rgba(200,169,110,0.2)", minHeight: "300px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "32px", marginBottom: "15px" }}>⚡</div>
                <div style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "8px" }}>{statut}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Claude genere le contenu professionnel complet 15 pages...</div>
              </div>
            ) : contenu ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px", paddingBottom: "15px", borderBottom: "1px solid rgba(200,169,110,0.2)" }}>
                  <div style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold" }}>{getTypeIcon(module?.type || "")} {lb.chapitre} {chapitreActif} · Module {moduleActif}</div>
                  <div style={{ color: "#00e676", fontSize: "13px" }}>{statut}</div>
                </div>
                <AfficherContenu contenu={contenu} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>Selectionnez un module</div>
            )}
          </div>
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
