"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import LMSSophrologie from "../../../components/LMSSophrologie";
import LMSSection from "../../../components/LMSSection";

const LM = {
  fr: { coach_btn: "Acceder a ma formation", classe_btn: "Rejoindre une Classe Live", objectifs: "Objectifs", prerequis: "Prerequis", public_cible: "Public cible", programme: "Programme complet", pret: "Pret a commencer ?", acces: "Acces immediat · Agent IA 24h/24 · Garantie 30 jours", acheter: "Acheter", niveau: "Niveau", elearning: "E-Learning", elearning_sub: "Asynchrone · A votre rythme", coach: "Coach IA 24h/24", coach_sub: "Questions par chat · Immediat", classe: "Classe Virtuelle", classe_sub: "Live · Mardis et Jeudis 20h", titre: "Accedez aux 2 premiers modules gratuitement", sub: "Laissez vos coordonnees et decouvrez la formation", btn: "Je veux acceder gratuitement", prenom: "Votre prenom *", email: "Votre email *", mobile: "Telephone mobile", fixe: "Telephone fixe / bureau", acceder: "Acceder maintenant", merci: "Bienvenue ! Vos coordonnees ont ete enregistrees.", support: "Support de cours", support_sub: "Document complet · 300+ pages", voir: "Voir le support" },
  en: { coach_btn: "Access my training", classe_btn: "Join a Live Class", objectifs: "Objectives", prerequis: "Prerequisites", public_cible: "Target audience", programme: "Full program", pret: "Ready to start?", acces: "Immediate access · AI Agent 24/7 · 30-day guarantee", acheter: "Buy now", niveau: "Level", elearning: "E-Learning", elearning_sub: "Asynchronous · At your own pace", coach: "AI Coach 24/7", coach_sub: "Chat questions · Instant", classe: "Virtual Class", classe_sub: "Live · Tuesdays and Thursdays 8pm", titre: "Access the first 2 modules for free", sub: "Leave your details and discover the training", btn: "I want free access", prenom: "Your first name *", email: "Your email *", mobile: "Mobile phone", fixe: "Home / office phone", acceder: "Access now", merci: "Welcome! Your details have been saved.", support: "Course materials", support_sub: "Complete document · 300+ pages", voir: "View materials" },
  es: { coach_btn: "Acceder a mi formacion", classe_btn: "Unirse a una Clase", objectifs: "Objetivos", prerequis: "Requisitos", public_cible: "Publico objetivo", programme: "Programa completo", pret: "Listo para empezar?", acces: "Acceso inmediato · Agente IA 24/7 · Garantia 30 dias", acheter: "Comprar", niveau: "Nivel", elearning: "E-Learning", elearning_sub: "Asincrono · A su ritmo", coach: "Coach IA 24/7", coach_sub: "Preguntas por chat", classe: "Clase Virtual", classe_sub: "En vivo · Martes y Jueves 20h", titre: "Accede a los 2 primeros modulos gratis", sub: "Deja tus datos y descubre la formacion", btn: "Quiero acceso gratuito", prenom: "Tu nombre *", email: "Tu email *", mobile: "Telefono movil", fixe: "Telefono fijo / oficina", acceder: "Acceder ahora", merci: "Bienvenido! Tus datos han sido guardados.", support: "Material del curso", support_sub: "Documento completo · 300+ paginas", voir: "Ver material" },
  pt: { coach_btn: "Acessar minha formacao", classe_btn: "Entrar em Aula ao Vivo", objectifs: "Objetivos", prerequis: "Pre-requisitos", public_cible: "Publico-alvo", programme: "Programa completo", pret: "Pronto para comecar?", acces: "Acesso imediato · Agente IA 24/7 · Garantia 30 dias", acheter: "Comprar", niveau: "Nivel", elearning: "E-Learning", elearning_sub: "Assincrono · No seu ritmo", coach: "Coach IA 24/7", coach_sub: "Perguntas por chat", classe: "Aula Virtual", classe_sub: "Ao vivo · Tercas e quintas 20h", titre: "Acesse os 2 primeiros modulos gratuitamente", sub: "Deixe seus dados e descubra a formacao", btn: "Quero acesso gratuito", prenom: "Seu nome *", email: "Seu email *", mobile: "Telefone celular", fixe: "Telefone fixo / escritorio", acceder: "Acessar agora", merci: "Bem-vindo! Seus dados foram salvos.", support: "Material do curso", support_sub: "Documento completo · 300+ paginas", voir: "Ver material" },
  de: { coach_btn: "Zu meiner Ausbildung", classe_btn: "Live-Klasse beitreten", objectifs: "Ziele", prerequis: "Voraussetzungen", public_cible: "Zielgruppe", programme: "Vollstandiges Programm", pret: "Bereit anzufangen?", acces: "Sofortiger Zugang · KI-Agent 24/7 · 30-Tage-Garantie", acheter: "Kaufen", niveau: "Niveau", elearning: "E-Learning", elearning_sub: "Asynchron · In Ihrem Tempo", coach: "KI-Coach 24/7", coach_sub: "Chat-Fragen · Sofort", classe: "Virtueller Kurs", classe_sub: "Live · Di und Do 20 Uhr", titre: "Zugang zu den ersten 2 Modulen kostenlos", sub: "Hinterlassen Sie Ihre Daten und entdecken Sie den Kurs", btn: "Ich mochte kostenlosen Zugang", prenom: "Ihr Vorname *", email: "Ihre E-Mail *", mobile: "Handynummer", fixe: "Festnetz / Buro", acceder: "Jetzt zugreifen", merci: "Willkommen! Ihre Daten wurden gespeichert.", support: "Kursmaterialien", support_sub: "Vollstandiges Dokument · 300+ Seiten", voir: "Materialien ansehen" },
  ar: { coach_btn: "الوصول الى تدريبي", classe_btn: "الانضمام الى فصل مباشر", objectifs: "الاهداف", prerequis: "المتطلبات", public_cible: "الجمهور المستهدف", programme: "البرنامج الكامل", pret: "مستعد للبدء؟", acces: "وصول فوري · وكيل ذكاء اصطناعي 24/7 · ضمان 30 يوم", acheter: "شراء", niveau: "المستوى", elearning: "التعلم الالكتروني", elearning_sub: "غير متزامن", coach: "مدرب ذكاء اصطناعي", coach_sub: "اسئلة عبر الدردشة", classe: "الفصل الافتراضي", classe_sub: "مباشر · الثلاثاء والخميس", titre: "احصل على الوحدتين الاوليين مجانا", sub: "اترك بياناتك واكتشف التدريب", btn: "اريد الوصول المجاني", prenom: "الاسم الاول *", email: "البريد الالكتروني *", mobile: "هاتف محمول", fixe: "هاتف ثابت / مكتب", acceder: "الوصول الان", merci: "مرحبا! تم حفظ بياناتك.", support: "مواد الدورة", support_sub: "وثيقة كاملة · 300+ صفحة", voir: "عرض المواد" },
  he: { titre: "קבל גישה ל-2 המודולים הראשונים בחינם", sub: "השאר פרטים וגלה את הקורס", btn: "אני רוצה גישה חינמית", prenom: "שם פרטי *", email: "אימייל *", mobile: "טלפון נייד", fixe: "טלפון קווי / משרד", acceder: "גישה עכשיו", merci: "ברוך הבא! הפרטים שלך נשמרו.", support: "חומרי הקורס", support_sub: "מסמך מלא · 300+ עמודים", voir: "צפה בחומרים" },
};

export default function FormationPage({ params }) {
  const { t, langue } = useTranslation();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSoumis, setLeadSoumis] = useState(false);
  const [leadForm, setLeadForm] = useState({ prenom: "", email: "", tel_mobile: "", tel_fixe: "" });
  const [leadLoading, setLeadLoading] = useState(false);

  const lm = LM[langue] || LM.fr;

  useEffect(() => {
    const lang = localStorage.getItem("langue") || "fr";
    fetch("/api/formation/" + params.id + "?lang=" + lang)
      .then(r => r.json())
      .then(data => { setFormation(data); setPdfUrl(data.pdf_url || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, langue]);

  async function soumettreProspect() {
    if (!leadForm.email || !leadForm.prenom) return;
    setLeadLoading(true);
    try {
      await fetch("/api/crm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", data: { nom: leadForm.prenom, email: leadForm.email, telephone: leadForm.tel_mobile || leadForm.tel_fixe, source: "page_formation", statut: "prospect", formation_interesse: formation?.titre || "", notes: "Mobile: " + (leadForm.tel_mobile || "nd") + " | Fixe: " + (leadForm.tel_fixe || "nd") } }),
      });
      await fetch("/api/emailing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generer", type: "bienvenue", contexte: { prenom: leadForm.prenom, email: leadForm.email, formation: formation?.titre || "" }, envoyer: true }),
      });
      setLeadSoumis(true);
      setShowLeadForm(false);
      localStorage.setItem("apprenant_email", leadForm.email);
      localStorage.setItem("apprenant_prenom", leadForm.prenom);
    } catch {}
    setLeadLoading(false);
  }

  if (loading) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</div>
    </div>
  );

  if (!formation || formation.error) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>Formation non trouvee</h1>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} · {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{formation.titre}</h1>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          {formation.duree && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{formation.duree}</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{lm.niveau} {formation.niveau}</span>}
          {formation.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{formation.prix}€</span>}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "40px" }}>
          {[
            { icon: "📚", label: t("formation.elearning"), desc: t("formation.elearning_sub") },
            { icon: "🤖", label: t("formation.coach"), desc: t("formation.coach_sub") },
            { icon: "🎥", label: t("formation.classe"), desc: t("formation.classe_sub") },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {formation.description && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Description</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.description}</p>
          </div>
        )}

        {formation.objectifs && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{lm.objectifs}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.objectifs}</p>
          </div>
        )}

        {formation.prerequis && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{lm.prerequis}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.prerequis}</p>
          </div>
        )}

        {formation.public_cible && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{lm.public_cible}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.public_cible}</p>
          </div>
        )}

        {formation.programme && Array.isArray(formation.programme) && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>{lm.programme}</h2>
            {formation.programme.map((ch, i) => (
              <div key={i} style={{ marginBottom: "15px", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "12px 20px" }}>
                  <h3 style={{ color: "#fff", margin: 0, fontFamily: "Georgia,serif", fontSize: "15px" }}>{ch.chapitre} — {ch.titre}</h3>
                </div>
                {ch.modules && (
                  <div style={{ padding: "10px 20px" }}>
                    {ch.modules.map((mod, j) => (
                      <div key={j} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                        <span>{mod.module} — {mod.titre}</span>
                        {mod.duree && <span style={{ color: "#c8a96e" }}>{mod.duree}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pdfUrl && (
          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "3px" }}>📄 {lm.support}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{lm.support_sub}</div>
            </div>
            <a href={pdfUrl} target="_blank" style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>{lm.voir}</a>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <a href={"/lms/" + params.id.toUpperCase()} style={{ flex: 1, display: "block", background: "#c8a96e", color: "#050508", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>
            {lm.coach_btn}
          </a>
          <a href="/classe-virtuelle" style={{ flex: 1, display: "block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center", border: "1px solid rgba(200,169,110,0.3)" }}>
            {lm.classe_btn}
          </a>
        </div>

        {!leadSoumis ? (
          <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "2px solid rgba(200,169,110,0.4)", borderRadius: "16px", padding: "30px", marginBottom: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎁</div>
            <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", marginBottom: "8px" }}>{lm.titre}</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>{lm.sub}</p>
            {!showLeadForm ? (
              <button onClick={() => setShowLeadForm(true)} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "10px", padding: "14px 35px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                {lm.btn} →
              </button>
            ) : (
              <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" placeholder={lm.prenom} value={leadForm.prenom} onChange={e => setLeadForm(p => ({ ...p, prenom: e.target.value }))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="email" placeholder={lm.email} value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="tel" placeholder={lm.mobile} value={leadForm.tel_mobile} onChange={e => setLeadForm(p => ({ ...p, tel_mobile: e.target.value }))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="tel" placeholder={lm.fixe} value={leadForm.tel_fixe} onChange={e => setLeadForm(p => ({ ...p, tel_fixe: e.target.value }))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <button onClick={soumettreProspect} disabled={leadLoading || !leadForm.email || !leadForm.prenom} style={{ background: leadForm.email && leadForm.prenom ? "#c8a96e" : "rgba(200,169,110,0.3)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", fontSize: "15px", cursor: leadForm.email && leadForm.prenom ? "pointer" : "not-allowed" }}>
                  {leadLoading ? "..." : lm.acceder + " →"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <p style={{ color: "#00e676", fontWeight: "bold", fontSize: "16px", margin: 0 }}>{lm.merci}</p>
          </div>
        )}

        {params.id.toUpperCase() === "F030"
          ? <LMSSophrologie langue={langue} />
          : <LMSSection code={params.id.toUpperCase()} langue={langue} />
        }

        <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", marginTop: "30px" }}>
          <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", marginBottom: "10px" }}>{lm.pret}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>{lm.acces}</p>
          <a href="/inscription" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "18px" }}>
            {lm.acheter} — {formation.prix}€
          </a>
        </div>

      </div>
    </div>
  );
}
