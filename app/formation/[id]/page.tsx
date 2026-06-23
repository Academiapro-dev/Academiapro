"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import LMSSection from "../../../components/LMSSection";
import LMSSophrologie from "../../../components/LMSSophrologie";

function nettoyer(texte) {
  if (!texte) return "";
  return texte.replace(/#{1,6}\s/g, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/---/g, "").trim();
}

export default function FormationPage({ params }) {
  const { t, langue } = useTranslation();
  const td = (cle) => t(cle);
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSoumis, setLeadSoumis] = useState(false);
  const [leadForm, setLeadForm] = useState({ prenom: "", email: "", tel_mobile: "", tel_fixe: "" });
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    fetch("/api/formation/" + params.id + "?lang=" + langue)
      .then(r => r.json())
      .then(data => { setFormation(data); setPdfUrl(data.pdf_url || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, langue]);

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

  const labels = {
    fr: { support: "Support de cours", support_sub: "Document complet 300+ pages", voir: "Voir le support" },
    en: { support: "Course Materials", support_sub: "Complete document 300+ pages", voir: "View materials" },
    ar: { support: "مواد الدورة", support_sub: "300+ صفحة", voir: "عرض المواد" },
    es: { support: "Material del curso", support_sub: "300+ paginas", voir: "Ver material" },
    pt: { support: "Material do curso", support_sub: "300+ paginas", voir: "Ver material" },
    de: { support: "Kursmaterial", support_sub: "300+ Seiten", voir: "Material ansehen" },
  };
  const lb = labels[langue] || labels.fr;


  async function soumettreProspect() {
    if (!leadForm.email || !leadForm.prenom) return;
    setLeadLoading(true);
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          data: {
            nom: leadForm.prenom,
            email: leadForm.email,
            telephone: leadForm.tel_mobile || leadForm.tel_fixe,
            source: "page_formation",
            statut: "prospect",
            formation_interesse: formation?.titre || "",
            domaine: formation?.domaine || "",
            notes: "Tel mobile: " + (leadForm.tel_mobile || "non renseigne") + " | Tel fixe: " + (leadForm.tel_fixe || "non renseigne"),
          }
        }),
      });
      // Envoyer email de bienvenue
      await fetch("/api/emailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generer",
          type: "bienvenue",
          contexte: { prenom: leadForm.prenom, email: leadForm.email, formation: formation?.titre || "" },
          envoyer: true,
        }),
      });
      setLeadSoumis(true);
      setShowLeadForm(false);
      localStorage.setItem("apprenant_email", leadForm.email);
      localStorage.setItem("apprenant_prenom", leadForm.prenom);
    } catch {}
    setLeadLoading(false);
  }

  async function soumettreProspect() {
    if (!leadForm.email || !leadForm.prenom) return;
    setLeadLoading(true);
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          data: {
            nom: leadForm.prenom,
            email: leadForm.email,
            telephone: leadForm.tel_mobile || leadForm.tel_fixe,
            source: "page_formation",
            statut: "prospect",
            formation_interesse: formation?.titre || "",
            domaine: formation?.domaine || "",
            notes: "Mobile: " + (leadForm.tel_mobile || "nd") + " | Fixe: " + (leadForm.tel_fixe || "nd"),
          }
        }),
      });
      await fetch("/api/emailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generer",
          type: "bienvenue",
          contexte: { prenom: leadForm.prenom, email: leadForm.email, formation: formation?.titre || "" },
          envoyer: true,
        }),
      });
      setLeadSoumis(true);
      setShowLeadForm(false);
      localStorage.setItem("apprenant_email", leadForm.email);
      localStorage.setItem("apprenant_prenom", leadForm.prenom);
    } catch {}
    setLeadLoading(false);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} - {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{formation.titre}</h1>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          {formation.duree && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{formation.duree}</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{t("formation.niveau")} {formation.niveau}</span>}
          {formation.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{formation.prix}€</span>}
        </div>
      </div>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "40px" }}>
          {[{ icon: "📚", label: t("formation.elearning"), desc: t("formation.elearning_sub") }, { icon: "🤖", label: t("formation.coach"), desc: t("formation.coach_sub") }, { icon: "🎥", label: t("formation.classe"), desc: t("formation.classe_sub") }].map(item => (
            <div key={item.label} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        {formation.description && <div style={{ marginBottom: "35px" }}><h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Description</h2><p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer(formation.description)}</p></div>}
        {formation.objectifs && <div style={{ marginBottom: "35px" }}><h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("formation.objectifs")}</h2><p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer(formation.objectifs)}</p></div>}
        {formation.prerequis && <div style={{ marginBottom: "35px" }}><h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("formation.prerequis")}</h2><p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer(formation.prerequis)}</p></div>}
        {formation.public_cible && <div style={{ marginBottom: "35px" }}><h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{t("formation.public_cible")}</h2><p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{nettoyer(formation.public_cible)}</p></div>}
        {pdfUrl && (
          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "3px" }}>📄 {lb.support}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{lb.support_sub}</div>
            </div>
            <a href={pdfUrl} target="_blank" style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>{lb.voir}</a>
          </div>
        )}
        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <a href={"/lms/" + params.id.toUpperCase()} style={{ flex: 1, display: "block", background: "#c8a96e", color: "#050508", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>{t("formation.coach_btn")}</a>
          <a href="/classe-virtuelle" style={{ flex: 1, display: "block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center", border: "1px solid rgba(200,169,110,0.3)" }}>{t("formation.classe_btn")}</a>
        </div>
        {!leadSoumis ? (
          <div style={{ background: "linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.05))", border: "2px solid rgba(200,169,110,0.4)", borderRadius: "16px", padding: "30px", marginBottom: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎁</div>
            <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", marginBottom: "8px" }}>Accedez aux 2 premiers modules gratuitement</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>Laissez vos coordonnees et decouvrez la formation</p>
            {!showLeadForm ? (
              <button onClick={() => setShowLeadForm(true)}
                style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "10px", padding: "14px 35px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                Je veux acceder gratuitement →
              </button>
            ) : (
              <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" placeholder={langue === "en" ? "Your first name *" : langue === "de" ? "Ihr Vorname *" : langue === "he" ? "שם פרטי *" : langue === "ar" ? "الاسم الأول *" : "Votre prenom *"} value={leadForm.prenom} onChange={e => setLeadForm(p => ({ ...p, prenom: e.target.value }))}
                  style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="email" placeholder={langue === "en" ? "Your email *" : langue === "de" ? "Ihre E-Mail *" : langue === "he" ? "אימייל *" : langue === "ar" ? "البريد الإلكتروني *" : "Votre email *"} value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
                  style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="tel" placeholder={langue === "en" ? "Mobile phone" : langue === "de" ? "Handynummer" : langue === "he" ? "טלפון נייד" : langue === "ar" ? "هاتف محمول" : "Telephone mobile"} value={leadForm.tel_mobile} onChange={e => setLeadForm(p => ({ ...p, tel_mobile: e.target.value }))}
                  style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <input type="tel" placeholder={langue === "en" ? "Home / office phone" : langue === "de" ? "Festnetz / Büro" : langue === "he" ? "טלפון קווי / משרד" : langue === "ar" ? "هاتف ثابت / مكتب" : "Telephone fixe / bureau"} value={leadForm.tel_fixe} onChange={e => setLeadForm(p => ({ ...p, tel_fixe: e.target.value }))}
                  style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px" }} />
                <button onClick={soumettreProspect} disabled={leadLoading || !leadForm.email || !leadForm.prenom}
                  style={{ background: leadForm.email && leadForm.prenom ? "#c8a96e" : "rgba(200,169,110,0.3)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", fontSize: "15px", cursor: leadForm.email && leadForm.prenom ? "pointer" : "not-allowed" }}>
                  {leadLoading ? "Enregistrement..." : {langue === "en" ? "Access now →" : langue === "de" ? "Jetzt zugreifen →" : langue === "he" ? "גישה עכשיו →" : langue === "ar" ? "الوصول الآن →" : "Acceder maintenant →"}}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <p style={{ color: "#00e676", fontWeight: "bold", fontSize: "16px", margin: 0 }}>Bienvenue ! Vos coordonnees ont ete enregistrees.</p>
          </div>
        )}
        {params.id.toUpperCase() === "F030" ? <LMSSophrologie langue={langue} /> : <LMSSection code={params.id.toUpperCase()} langue={langue} />}
      </div>
    </div>
  );
}
