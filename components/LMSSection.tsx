"use client";
import { useState, useEffect } from "react";

function nettoyer(texte: string): string {
  if (!texte) return "";
  return texte
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/---/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function LMSSection({ code, langue = "fr" }: { code: string; langue?: string }) {
  const [lms, setLms] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chapitreActif, setChapitreActif] = useState(0);
  const [moduleActif, setModuleActif] = useState(0);

  useEffect(() => {
    fetch(`/api/lms/${code}`)
      .then(r => r.json())
      .then(data => { setLms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code]);

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#c8a96e" }}>
      Chargement de la formation...
    </div>
  );

  if (!lms || lms.error) return null;

  const c = lms.contenu;
  const isV6 = c?.v === "6";

  const labels: Record<string, Record<string, string>> = {
    fr: { programme: "PROGRAMME", competences: "Compétences acquises", examen: "EXAMEN BLANC", biblio: "BIBLIOGRAPHIE", coach_label: "Coach Personnel", cta_titre: "Prêt à commencer ?", cta_sub: "Accès immédiat · Formateur IA 24h/24 · Certification incluse", cta_btn: "S'inscrire maintenant", chargement: "Chargement de la formation..." },
    en: { programme: "CURRICULUM", competences: "Skills acquired", examen: "MOCK EXAM", biblio: "BIBLIOGRAPHY", coach_label: "Personal Coach", cta_titre: "Ready to start?", cta_sub: "Immediate access · AI Trainer 24/7 · Certification included", cta_btn: "Enroll now", chargement: "Loading..." },
    ar: { programme: "البرنامج", competences: "المهارات المكتسبة", examen: "امتحان تجريبي", biblio: "المراجع", coach_label: "المدرب الشخصي", cta_titre: "هل أنت مستعد للبدء؟", cta_sub: "وصول فوري · مدرب ذكاء اصطناعي 24/7", cta_btn: "سجل الآن", chargement: "جار التحميل..." },
    es: { programme: "PROGRAMA", competences: "Competencias adquiridas", examen: "EXAMEN DE PRÁCTICA", biblio: "BIBLIOGRAFÍA", coach_label: "Coach Personal", cta_titre: "¿Listo para empezar?", cta_sub: "Acceso inmediato · Formador IA 24/7 · Certificación incluida", cta_btn: "Inscribirse ahora", chargement: "Cargando..." },
    pt: { programme: "PROGRAMA", competences: "Competências adquiridas", examen: "EXAME PRÁTICO", biblio: "BIBLIOGRAFIA", coach_label: "Coach Pessoal", cta_titre: "Pronto para começar?", cta_sub: "Acesso imediato · Formador IA 24/7 · Certificação incluída", cta_btn: "Inscrever-se agora", chargement: "Carregando..." },
    de: { programme: "LEHRPLAN", competences: "Erworbene Kompetenzen", examen: "PROBEPRÜFUNG", biblio: "BIBLIOGRAFIE", coach_label: "Persönlicher Coach", cta_titre: "Bereit anzufangen?", cta_sub: "Sofortiger Zugang · KI-Trainer 24/7 · Zertifizierung inklusive", cta_btn: "Jetzt einschreiben", chargement: "Wird geladen..." },
  };
  const lb = labels[langue] || labels.fr;

  if (!isV6) return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
        <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "15px", marginBottom: "8px" }}>🎓 {c.formateur}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7" }}>{nettoyer(c.intro || c.introduction)}</div>
      </div>
      <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
        <h3 style={{ color: "#c8a96e", marginTop: 0, fontSize: "15px" }}>{lb.competences}</h3>
        {nettoyer(c.points || "").split("\n").filter((p: string) => p.trim()).map((point: string, i: number) => (
          <div key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "#c8a96e" }}>✓</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{point.replace(/^[-•*\d.]\s*/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const chapitres = c.chapitres || [];
  const chapitre = chapitres[chapitreActif];
  const module = chapitre?.modules?.[moduleActif];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 60px" }}>

      <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "24px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#c8a96e,#a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🎓</div>
        <div>
          <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{c.formateur}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.6" }}>{nettoyer(c.introduction)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "25px" }}>
        {[
          { label: lb.programme.toLowerCase(), value: chapitres.length, icon: "📚" },
          { label: "modules", value: chapitres.reduce((s: number, ch: any) => s + (ch.modules?.length || 0), 0), icon: "📋" },
          { label: c.niveau || "Pro", value: "⭐", icon: "⭐" },
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
          {chapitres.map((ch: any, i: number) => (
            <button key={i} onClick={() => { setChapitreActif(i); setModuleActif(0); }}
              style={{ textAlign: "left", padding: "14px 18px", borderRadius: "10px", border: `1px solid ${chapitreActif === i ? "#c8a96e" : "rgba(200,169,110,0.2)"}`, background: chapitreActif === i ? "rgba(200,169,110,0.15)" : "#1a1a2e", color: chapitreActif === i ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer" }}>
              <span style={{ fontWeight: "bold", marginRight: "10px" }}>Ch.{ch.numero}</span>
              {nettoyer(ch.titre)}
              <span style={{ float: "right", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{ch.modules?.length || 0} modules</span>
            </button>
          ))}
        </div>
      </div>

      {chapitre && (
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "15px", marginBottom: "12px" }}>
            Ch.{chapitre.numero} — {nettoyer(chapitre.titre)}
          </h3>
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap" }}>
            {chapitre.modules?.map((mod: any, i: number) => (
              <button key={i} onClick={() => setModuleActif(i)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${moduleActif === i ? "#c8a96e" : "rgba(255,255,255,0.15)"}`, background: moduleActif === i ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)", color: moduleActif === i ? "#c8a96e" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "13px" }}>
                {mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝"} {nettoyer(mod.titre)}
              </button>
            ))}
          </div>

          {module && (
            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "25px", border: "1px solid rgba(200,169,110,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h4 style={{ color: "#c8a96e", margin: 0, fontSize: "15px" }}>
                  {module.type === "theorie" ? "📖" : module.type === "pratique" ? "🛠️" : "📝"} {nettoyer(module.titre)}
                </h4>
                {module.duree && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{module.duree}</span>}
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                {nettoyer(module.contenu)}
              </div>
            </div>
          )}
        </div>
      )}

      {c.coaching && (
        <div style={{ background: "rgba(14,196,176,0.08)", border: "1px solid rgba(14,196,176,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px", display: "flex", gap: "15px" }}>
          <div style={{ fontSize: "28px", flexShrink: 0 }}>💆</div>
          <div>
            <div style={{ color: "#0ec4b0", fontWeight: "bold", fontSize: "14px", marginBottom: "6px" }}>{c.coach} — {lb.coach_label}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", lineHeight: "1.7", fontStyle: "italic" }}>"{nettoyer(c.coaching)}"</div>
          </div>
        </div>
      )}

      {c.examen_blanc && (
        <div style={{ marginBottom: "25px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "16px", marginBottom: "12px", letterSpacing: "1px" }}>{lb.examen}</h2>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{nettoyer(c.examen_blanc)}</div>
          </div>
        </div>
      )}

      {c.bibliographie && (
        <div style={{ marginBottom: "25px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "16px", marginBottom: "12px", letterSpacing: "1px" }}>{lb.biblio}</h2>
          <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.2)" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{nettoyer(c.bibliographie)}</div>
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d1a)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "30px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
        <h3 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", marginBottom: "8px" }}>{lb.cta_titre}</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>{lb.cta_sub}</p>
        <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "14px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
          {lb.cta_btn}
        </a>
      </div>

    </div>
  );
}
