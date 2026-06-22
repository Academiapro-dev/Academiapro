"use client";
import { useState, useEffect } from "react";

const CHAPITRES = [
  { numero: 1, titre_fr: "Fondements Théoriques et Scientifiques", titre_en: "Theoretical and Scientific Foundations", titre_ar: "الأسس النظرية والعلمية", titre_es: "Fundamentos Teóricos y Científicos", titre_pt: "Fundamentos Teóricos e Científicos", titre_de: "Theoretische und Wissenschaftliche Grundlagen", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }
  ]},
  { numero: 2, titre_fr: "Les 12 Degrés Caycédiens — RD1 à RD4", titre_en: "The 12 Caycedian Degrees — RD1 to RD4", titre_ar: "الدرجات الـ 12 الكايسيدية", titre_es: "Los 12 Grados Caycedianos", titre_pt: "Os 12 Graus Caycedianos", titre_de: "Die 12 Caycedischen Grade", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "theorie" }, { numero: 4, type: "pratique" }
  ]},
  { numero: 3, titre_fr: "Les Degrés Supérieurs — RD5 à RD12", titre_en: "Advanced Degrees — RD5 to RD12", titre_ar: "الدرجات المتقدمة", titre_es: "Grados Superiores — RD5 a RD12", titre_pt: "Graus Superiores — RD5 a RD12", titre_de: "Höhere Grade — RD5 bis RD12", modules: [
    { numero: 1, type: "theorie" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }
  ]},
  { numero: 4, titre_fr: "Applications Professionnelles", titre_en: "Professional Applications", titre_ar: "التطبيقات المهنية", titre_es: "Aplicaciones Profesionales", titre_pt: "Aplicações Profissionais", titre_de: "Professionelle Anwendungen", modules: [
    { numero: 1, type: "pratique" }, { numero: 2, type: "pratique" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }
  ]},
  { numero: 5, titre_fr: "Pratique Professionnelle et Certification", titre_en: "Professional Practice and Certification", titre_ar: "الممارسة المهنية والشهادة", titre_es: "Práctica Profesional y Certificación", titre_pt: "Prática Profissional e Certificação", titre_de: "Professionelle Praxis und Zertifizierung", modules: [
    { numero: 1, type: "pratique" }, { numero: 2, type: "theorie" }, { numero: 3, type: "pratique" }, { numero: 4, type: "evaluation" }
  ]},
];

const LABELS: Record<string, any> = {
  fr: { programme: "PROGRAMME", chargement: "Génération du contenu complet en cours...", depuis_cache: "✓ Contenu chargé", genere: "✓ Contenu généré", theorie: "Théorie", pratique: "Pratique", evaluation: "Évaluation", chapitre: "Chapitre", inscrire: "S'inscrire maintenant", pret: "Prêt à devenir sophrologue certifié ?", acces: "Accès immédiat · Claire Beaumont 24h/24 · Certification incluse" },
  en: { programme: "CURRICULUM", chargement: "Generating complete content...", depuis_cache: "✓ Content loaded", genere: "✓ Content generated", theorie: "Theory", pratique: "Practice", evaluation: "Assessment", chapitre: "Chapter", inscrire: "Enroll now", pret: "Ready to become a certified sophrologist?", acces: "Immediate access · Claire Beaumont 24/7 · Certification included" },
  ar: { programme: "البرنامج", chargement: "جاري توليد المحتوى...", depuis_cache: "✓ تم تحميل المحتوى", genere: "✓ تم توليد المحتوى", theorie: "نظري", pratique: "تطبيقي", evaluation: "تقييم", chapitre: "الفصل", inscrire: "سجل الآن", pret: "هل أنت مستعد؟", acces: "وصول فوري · كلير بومون 24/7" },
  es: { programme: "PROGRAMA", chargement: "Generando contenido completo...", depuis_cache: "✓ Contenido cargado", genere: "✓ Contenido generado", theorie: "Teoría", pratique: "Práctica", evaluation: "Evaluación", chapitre: "Capítulo", inscrire: "Inscribirse ahora", pret: "¿Listo para certificarte?", acces: "Acceso inmediato · Claire Beaumont 24/7 · Certificación incluida" },
  pt: { programme: "PROGRAMA", chargement: "Gerando conteúdo completo...", depuis_cache: "✓ Conteúdo carregado", genere: "✓ Conteúdo gerado", theorie: "Teoria", pratique: "Prática", evaluation: "Avaliação", chapitre: "Capítulo", inscrire: "Inscrever-se agora", pret: "Pronto para se certificar?", acces: "Acesso imediato · Claire Beaumont 24/7 · Certificação incluída" },
  de: { programme: "LEHRPLAN", chargement: "Vollständiger Inhalt wird generiert...", depuis_cache: "✓ Inhalt geladen", genere: "✓ Inhalt generiert", theorie: "Theorie", pratique: "Praxis", evaluation: "Bewertung", chapitre: "Kapitel", inscrire: "Jetzt einschreiben", pret: "Bereit für die Zertifizierung?", acces: "Sofortiger Zugang · Claire Beaumont 24/7 · Zertifizierung inklusive" },
};

function getTitre(ch: any, langue: string): string {
  return ch[`titre_${langue}`] || ch.titre_fr;
}

function getTypeIcon(type: string): string {
  if (type === "theorie") return "📖";
  if (type === "pratique") return "🛠️";
  return "📝";
}

export default function LMSSophrologie({ langue = "fr" }: { langue?: string }) {
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState("");

  const lb = LABELS[langue] || LABELS.fr;
  const chapitre = CHAPITRES[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];

  useEffect(() => {
    charger(chapitreActif, moduleActif);
  }, [chapitreActif, moduleActif, langue]);

  async function charger(ch_num: number, mod_num: number) {
    setLoading(true);
    setContenu("");
    setStatut(lb.chargement);
    try {
      const r = await fetch("/api/lms/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: "F030", chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) {
        setContenu(data.contenu);
        setStatut(data.depuis_cache ? lb.depuis_cache : lb.genere);
      } else {
        setStatut("Erreur: " + (data.erreur || "inconnue"));
      }
    } catch {
      setStatut("Erreur reseau");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>

      <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "24px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🧘</div>
        <div>
          <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>Claire Beaumont</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Formatrice Expert · Sophrologie Caycédienne · AcadéMIA Pro</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "25px" }}>
        {[
          { label: "Chapitres", value: "5", icon: "📚" },
          { label: "Modules", value: "20", icon: "📋" },
          { label: "400h", value: "Pro", icon: "⭐" },
        ].map(item => (
          <div key={item.label} style={{ background: "#1a1a2e", borderRadius: "10px", padding: "15px", textAlign: "center", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>{item.icon}</div>
            <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "18px" }}>{item.value}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "16px", marginBottom: "12px", letterSpacing: "1px" }}>{lb.programme}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {CHAPITRES.map((ch) => (
            <button key={ch.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(1); }}
              style={{ textAlign: "left", padding: "14px 18px", borderRadius: "10px", border: `1px solid ${chapitreActif === ch.numero ? "#c8a96e" : "rgba(200,169,110,0.2)"}`, background: chapitreActif === ch.numero ? "rgba(200,169,110,0.15)" : "#1a1a2e", color: chapitreActif === ch.numero ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer" }}>
              <span style={{ fontWeight: "bold", marginRight: "10px" }}>{lb.chapitre} {ch.numero}</span>
              {getTitre(ch, langue)}
              <span style={{ float: "right", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{ch.modules.length} modules</span>
            </button>
          ))}
        </div>
      </div>

      {chapitre && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
            {chapitre.modules.map((mod) => (
              <button key={mod.numero} onClick={() => setModuleActif(mod.numero)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.15)"}`, background: moduleActif === mod.numero ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === mod.numero ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "13px" }}>
                {getTypeIcon(mod.type)} {lb[mod.type]} {mod.numero}
              </button>
            ))}
          </div>

          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "25px", border: "1px solid rgba(200,169,110,0.2)", minHeight: "300px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "32px", marginBottom: "15px" }}>⚡</div>
                <div style={{ color: "#c8a96e", fontSize: "15px", marginBottom: "8px" }}>{statut}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Claude génère le contenu professionnel complet...</div>
              </div>
            ) : contenu ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid rgba(200,169,110,0.2)" }}>
                  <div style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold" }}>
                    {getTypeIcon(module?.type || "")} {lb.chapitre} {chapitreActif} · Module {moduleActif}
                  </div>
                  <div style={{ color: "#00e676", fontSize: "11px" }}>{statut}</div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: "1.9", whiteSpace: "pre-wrap" }}>
                  {contenu}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)" }}>
                Sélectionnez un module
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d1a)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "30px", textAlign: "center", marginTop: "30px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
        <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", marginBottom: "8px" }}>{lb.pret}</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>{lb.acces}</p>
        <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "14px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
          {lb.inscrire}
        </a>
      </div>

    </div>
  );
}

