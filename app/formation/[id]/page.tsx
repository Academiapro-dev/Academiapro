"use client";
import { useState, useEffect } from "react";

const T: Record<string, Record<string, string>> = {
  fr: {
    elearning: "E-Learning", elearning_sub: "Asynchrone · A votre rythme",
    coach: "Coach IA 24h/24", coach_sub: "Questions par chat · Immediat",
    classe: "Classe Virtuelle", classe_sub: "Live · Mardis et Jeudis 20h",
    description: "Description", objectifs: "Objectifs", prerequis: "Prerequis",
    public_cible: "Public cible", programme: "Programme complet",
    acheter: "Acheter", acces: "Acces immediat · Agent IA 24h/24 · Garantie 30 jours",
    pret: "Pret a commencer ?", coach_btn: "Acceder au Coach IA",
    classe_btn: "Rejoindre une Classe Live", niveau: "Niveau",
  },
  en: {
    elearning: "E-Learning", elearning_sub: "Asynchronous · At your own pace",
    coach: "AI Coach 24/7", coach_sub: "Chat questions · Instant",
    classe: "Virtual Class", classe_sub: "Live · Tuesdays and Thursdays 8pm",
    description: "Description", objectifs: "Objectives", prerequis: "Prerequisites",
    public_cible: "Target audience", programme: "Full program",
    acheter: "Buy", acces: "Immediate access · AI Agent 24/7 · 30-day guarantee",
    pret: "Ready to start?", coach_btn: "Access AI Coach",
    classe_btn: "Join a Live Class", niveau: "Level",
  },
  es: {
    elearning: "E-Learning", elearning_sub: "Asincrono · A su ritmo",
    coach: "Coach IA 24h/24", coach_sub: "Preguntas por chat · Inmediato",
    classe: "Clase Virtual", classe_sub: "En vivo · Martes y Jueves 20h",
    description: "Descripcion", objectifs: "Objetivos", prerequis: "Requisitos",
    public_cible: "Publico objetivo", programme: "Programa completo",
    acheter: "Comprar", acces: "Acceso inmediato · Agente IA 24/7 · Garantia 30 dias",
    pret: "Listo para empezar?", coach_btn: "Acceder al Coach IA",
    classe_btn: "Unirse a una Clase", niveau: "Nivel",
  },
  ar: {
    elearning: "التعلم الإلكتروني", elearning_sub: "غير متزامن · بالسرعة الخاصة بك",
    coach: "مدرب AI 24/7", coach_sub: "اسئلة عبر الدردشة · فوري",
    classe: "الفصل الافتراضي", classe_sub: "مباشر · الثلاثاء والخميس 8م",
    description: "وصف", objectifs: "الاهداف", prerequis: "المتطلبات",
    public_cible: "الجمهور المستهدف", programme: "البرنامج الكامل",
    acheter: "شراء", acces: "وصول فوري · وكيل AI 24/7 · ضمان 30 يوم",
    pret: "مستعد للبدء؟", coach_btn: "الوصول الى المدرب",
    classe_btn: "الانضمام الى فصل", niveau: "المستوى",
  },
  he: {
    elearning: "למידה אלקטרונית", elearning_sub: "אסינכרוני · בקצב שלך",
    coach: "מדריך AI 24/7", coach_sub: "שאלות בצ'אט · מיידי",
    classe: "כיתה וירטואלית", classe_sub: "ישיר · שלישי וחמישי 20:00",
    description: "תיאור", objectifs: "מטרות", prerequis: "דרישות קדם",
    public_cible: "קהל יעד", programme: "תוכנית מלאה",
    acheter: "לקנות", acces: "גישה מיידית · סוכן AI 24/7 · ערובה 30 יום",
    pret: "מוכן להתחיל?", coach_btn: "גישה למדריך AI",
    classe_btn: "הצטרף לכיתה חיה", niveau: "רמה",
  },
};

async function getFormation(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/formations?code=eq.${id}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
}

function FormationClient({ formation, langueInit }: { formation: any; langueInit: string }) {
  const [langue, setLangue] = useState(langueInit);
  const [titreT, setTitreT] = useState(formation.titre);
  const [descT, setDescT] = useState(formation.description);
  const [objT, setObjT] = useState(formation.objectifs);

  const t = (cle: string) => T[langue]?.[cle] || T["fr"][cle] || cle;

  useEffect(() => {
    if (langue === "fr") {
      setTitreT(formation.titre);
      setDescT(formation.description);
      setObjT(formation.objectifs);
      return;
    }
    async function traduire() {
      const traduireTexte = async (texte: string) => {
        if (!texte) return texte;
        const cached = sessionStorage.getItem(`${langue}:${texte.slice(0,30)}`);
        if (cached) return cached;
        const res = await fetch("/api/traduire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texte, langue_cible: langue }),
        });
        const data = await res.json();
        const result = data.traduction || texte;
        sessionStorage.setItem(`${langue}:${texte.slice(0,30)}`, result);
        return result;
      };
      const [titre, desc, obj] = await Promise.all([
        traduireTexte(formation.titre),
        traduireTexte(formation.description || ""),
        traduireTexte(formation.objectifs || ""),
      ]);
      setTitreT(titre);
      setDescT(desc);
      setObjT(obj);
    }
    traduire();
  }, [langue, formation]);

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} · {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{titreT}</h1>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          {formation.duree && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{formation.duree}</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{t("niveau")} {formation.niveau}</span>}
          {formation.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{formation.prix}€</span>}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "40px" }}>
          {[
            { icon: "📚", label: t("elearning"), desc: t("elearning_sub") },
            { icon: "🤖", label: t("coach"), desc: t("coach_sub") },
            { icon: "🎥", label: t("classe"), desc: t("classe_sub") },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {descT && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("description")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{descT}</p>
          </div>
        )}

        {objT && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("objectifs")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{objT}</p>
          </div>
        )}

        {formation.prerequis && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("prerequis")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.prerequis}</p>
          </div>
        )}

        {formation.public_cible && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("public_cible")}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.public_cible}</p>
          </div>
        )}

        {formation.programme && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>{t("programme")}</h2>
            {Array.isArray(formation.programme) && formation.programme.map((ch: any) => (
              <div key={ch.chapitre} style={{ marginBottom: "20px", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "14px 20px" }}>
                  <h3 style={{ color: "#fff", margin: 0, fontFamily: "Georgia,serif" }}>
                    {ch.chapitre} — {ch.titre}
                  </h3>
                </div>
                <div style={{ padding: "15px 20px" }}>
                  {ch.modules && ch.modules.map((mod: any) => (
                    <div key={mod.module} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "space-between" }}>
                      <span>{mod.module} — {mod.titre}</span>
                      {mod.duree && <span style={{ color: "#c8a96e", fontSize: "13px" }}>{mod.duree}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "25px", marginBottom: "30px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>{t("coach")} — disponible maintenant</h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/dashboard" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none" }}>
              {t("coach_btn")}
            </a>
            <a href="/classe-virtuelle" style={{ display: "inline-block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", border: "1px solid rgba(200,169,110,0.3)" }}>
              {t("classe_btn")}
            </a>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "50px", padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
          <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", marginBottom: "10px" }}>{t("pret")}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>{t("acces")}</p>
          <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "18px" }}>
            {t("acheter")} — {formation.prix}€
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function FormationPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string } }) {
  const formation = await getFormation(params.id);
  const langueInit = searchParams.lang || "fr";

  if (!formation) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e" }}>Formation non trouvee</h1>
        <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
      </div>
    );
  }

  return <FormationClient formation={formation} langueInit={langueInit} />;
}
