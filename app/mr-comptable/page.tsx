"use client";
import { useState, useEffect, useRef } from "react";

const FORMULAIRES = [
  {
    id: "form5472",
    nom: "Form 5472",
    titre: "Information Return of a 25% Foreign-Owned U.S. Corporation",
    flag: "🇺🇸",
    obligatoire: true,
    delai: "15 avril (ou 15 octobre avec extension)",
    sanction: "25 000 $ par formulaire manquant",
    lien: "https://www.irs.gov/forms-pubs/about-form-5472",
    cases: [
      { case: "Ligne 1a", en: "Name of reporting corporation", fr: "Nom de votre LLC Wyoming" },
      { case: "Ligne 1b", en: "EIN", fr: "Votre numero fiscal federal (obtenu aupres IRS)" },
      { case: "Ligne 1c", en: "Address", fr: "Adresse de votre Registered Agent Wyoming" },
      { case: "Ligne 2a", en: "Name of foreign related party", fr: "Votre nom complet (vous etes l associe etranger)" },
      { case: "Ligne 2b", en: "Country of incorporation", fr: "France (FR)" },
      { case: "Ligne 3", en: "Principal business activity", fr: "Online education platform - Formation en ligne" },
      { case: "Partie IV", en: "Reportable transactions", fr: "Transactions entre vous et la LLC : apports capital, retraits, prets" },
      { case: "Signature", en: "Signature of officer", fr: "Votre signature + date + titre : Managing Member" },
    ]
  },
  {
    id: "form1120",
    nom: "Form 1120",
    titre: "U.S. Corporation Income Tax Return",
    flag: "🇺🇸",
    obligatoire: true,
    delai: "15 avril (ou 15 octobre avec extension Form 7004)",
    sanction: "Penalites de retard + interets",
    lien: "https://www.irs.gov/forms-pubs/about-form-1120",
    cases: [
      { case: "Case A", en: "Consolidated return", fr: "Laisser vide - pas de groupe consolide" },
      { case: "Case B", en: "Personal holding company", fr: "Laisser vide" },
      { case: "Ligne 1", en: "Gross receipts or sales", fr: "Vos revenus totaux - si clients hors USA : inscrire 0 ou montant reel" },
      { case: "Ligne 11", en: "Total income", fr: "Total de vos revenus" },
      { case: "Ligne 30", en: "Taxable income", fr: "Si No ECI (revenus hors USA) : position 0" },
      { case: "Schedule K", en: "Other information", fr: "Cocher case 4b : Non-US shareholders" },
      { case: "Signature", en: "Signature", fr: "Votre signature + Managing Member + date" },
    ]
  },
  {
    id: "annualreport",
    nom: "Annual Report Wyoming",
    titre: "Wyoming Annual Report - Secretary of State",
    flag: "🏔️",
    obligatoire: true,
    delai: "1er anniversaire de creation puis chaque annee",
    sanction: "Dissolution administrative de la LLC",
    lien: "https://sos.wyo.gov/Forms/Business/LLC/LLCAnnualReport.pdf",
    cases: [
      { case: "LLC Name", en: "Name of LLC", fr: "Nom exact de votre LLC tel qu enregistre" },
      { case: "Registered Agent", en: "Registered Agent name and address", fr: "Nom et adresse de votre agent enregistre Wyoming" },
      { case: "Principal Office", en: "Principal office address", fr: "Adresse principale - peut etre celle de l agent enregistre" },
      { case: "Members/Managers", en: "List of members or managers", fr: "Votre nom complet + adresse + Managing Member" },
      { case: "Payment", en: "Filing fee", fr: "60 $ par carte ou cheque Wyoming Secretary of State" },
    ]
  },
  {
    id: "fbar",
    nom: "FBAR FinCEN 114",
    titre: "Report of Foreign Bank and Financial Accounts",
    flag: "🇺🇸",
    obligatoire: true,
    delai: "15 avril - extension automatique jusqu au 15 octobre",
    sanction: "10 000 $ par violation non intentionnelle",
    lien: "https://bsaefiling.fincen.treas.gov/NoRegFBARFiler.html",
    cases: [
      { case: "Part I", en: "Filer information", fr: "Vos informations personnelles : nom, adresse, SSN ou ITIN" },
      { case: "Part II", en: "Foreign financial accounts", fr: "Comptes etrangers si solde total depasse 10 000 $ dans l annee" },
      { case: "Account number", en: "Account number", fr: "Numero de compte bancaire etranger (France, Israel)" },
      { case: "Maximum value", en: "Maximum account value", fr: "Valeur maximale du compte pendant l annee en USD" },
      { case: "Financial institution", en: "Name and address", fr: "Nom et adresse de votre banque etrangere" },
    ]
  },
  {
    id: "exittax",
    nom: "Form 2074-ETD",
    titre: "Exit Tax France - Declaration Plus-Values Latentes",
    flag: "🇫🇷",
    obligatoire: true,
    delai: "Annee du depart fiscal de France",
    sanction: "Redressement fiscal + penalites 40%",
    lien: "https://www.impots.gouv.fr/formulaire/2074-etd/declaration-des-plus-values-et-moins-values-de-cession-de-titres",
    cases: [
      { case: "Cadre 1", en: "N/A", fr: "Votre identite et adresse en France" },
      { case: "Cadre 2", en: "N/A", fr: "Date de transfert de domicile fiscal hors de France" },
      { case: "Cadre 3", en: "N/A", fr: "Pays d accueil : Israel" },
      { case: "Cadre 4", en: "N/A", fr: "Valeur des titres detenus au jour du depart" },
      { case: "Cadre 5", en: "N/A", fr: "Plus-values latentes : valeur actuelle moins prix d acquisition" },
      { case: "Option", en: "N/A", fr: "Sursis de paiement possible si depart vers Israel (convention)" },
    ]
  },
];

export default function MrComptablePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fichierLoading, setFichierLoading] = useState(false);
  const [contexte, setContexte] = useState("international");
  const [onglet, setOnglet] = useState("chat");
  const [formulaireActif, setFormulaireActif] = useState(null);
  const [envoyant, setEnvoyant] = useState(false);
  const [memoireOk, setMemoireOk] = useState(false);
  const [memoireLoading, setMemoireLoading] = useState(false);
  const [panelOuvert, setPanelOuvert] = useState(false);
  const [sessionsMem, setSessionsMem] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [envoiOk, setEnvoiOk] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const sbUser = document.cookie.split("; ").find(r => r.startsWith("sb_user="));
      if (sbUser) {
        const user = JSON.parse(decodeURIComponent(sbUser.split("=")[1]));
        if (user.email === "contact@academiapro.fr") setIsAdmin(true);
      }
    } catch {}
    setChecking(false);
  }, []);

  async function sauvegarderMemoire() {
    setMemoireLoading(true);
    try {
      await fetch("/api/memory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "comptable",
          session_id: "comptable_" + Date.now(),
          session_label: "Session comptable",
          conversation: historique.map(m => ({ ...m, content: m.text || m.content || "" })),
          context_summary: "",
          key_decisions: []
        }),
      });
      setMemoireOk(true);
      setTimeout(() => setMemoireOk(false), 2000);
    } catch {}
    setMemoireLoading(false);
  }

  async function ouvrirRestauration() {
    setPanelOuvert(true);
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/memory/load?agent_id=comptable");
      const data = await res.json();
      setSessionsMem(data.success ? data.data : []);
    } catch { setSessionsMem([]); }
    setSessionsLoading(false);
  }

  function restaurerSession(conv) {
    const normalises = conv.map(m => ({
      role: m.role === "assistant" ? "agent" : m.role,
      text: m.content || m.text || "",
      content: m.content || m.text || ""
    }));
    setHistorique(normalises);
    setPanelOuvert(false);
  }


  async function analyserFichier(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFichierLoading(true);
    const noms = files.map((f) => f.name).join(", ");
    setHistorique(prev => [...prev, { role: "user", text: "📎 " + files.length + " document(s) joint(s) : " + noms }]);
    try {
      const fichiersB64 = await Promise.all(files.map((file) => new Promise((resolve) => {
        const ext = files.map(f => f.name).join(", ").split(".").pop().toLowerCase();
        const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ base64: ev.target.result.split(",")[1], mediaType, nom: files.map(f => f.name).join(", ") });
        reader.readAsDataURL(file);
      })));
      const r = await fetch("/api/mr-comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyse ces " + files.length + " document(s) comptables ou fiscaux et donne moi une analyse experte complete en tant que Prof. Henri Mercier.",
          contexte,
          historique,
          fichiers: fichiersB64
        }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur d analyse." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur lors de l analyse des documents." }]);
    }
    setFichierLoading(false);
    e.target.value = "";
  }

  async function envoyer(msg) {
    const m = msg || message;
    if (!m || !m.trim()) return;
    if (!msg) setMessage("");
    setHistorique(prev => [...prev, { role: "user", text: m }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: m, contexte, historique }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  async function genererChecklist() {
    setOnglet("chat");
    setContexte("international");
    const question = "Genere ma checklist annuelle complete LLC Wyoming : resident France depart Israel 6 mois, single-member non-resident US, AcademiA Pro plateforme formation IA, revenus hors USA. Formulaire exact, date limite, cases a remplir, cout, CPA obligatoire ou non.";
    setHistorique(prev => [...prev, { role: "user", text: "Checklist complete LLC Wyoming Israel pour mon profil AcademiA Pro" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-comptable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question, contexte: "international", historique: [] }) });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch { setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]); }
    setLoading(false);
  }

  async function envoyerExpert() {
    setEnvoyant(true);
    try {
      const resume = historique.map(h => (h.role === "user" ? "QUESTION: " : "REPONSE Prof. Mercier: ") + h.text).join(" | ");
      await fetch("/api/emailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "envoyer_direct",
          to: "contact@academiapro.fr",
          subject: "Dossier fiscal LLC Wyoming Israel — AcademiA Pro",
          html: "<h2>Dossier Fiscal International</h2><p><strong>AcademiA Pro</strong></p><hr/><h3>Analyse Prof. Henri Mercier</h3><pre style=\"white-space:pre-wrap;font-family:Arial;font-size:13px\">" + resume + "</pre><hr/><p style=\"color:#666;font-size:12px\">Genere par AcademiA Pro — " + new Date().toLocaleDateString("fr-FR") + "</p>",
        }),
      });
      setEnvoiOk(true);
      setTimeout(() => setEnvoiOk(false), 4000);
    } catch {}
    setEnvoyant(false);
  }

  if (checking) return <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#c8a96e" }}>Verification...</p></div>;
  if (!isAdmin) return <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><p style={{ color: "#ff4444" }}>Acces restreint</p><a href="/login" style={{ color: "#c8a96e" }}>Se connecter</a></div></div>;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>AcademiA Pro · Admin</p>
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>📊 Prof. Henri Mercier</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Expert Comptable et Fiscaliste — France · Israel · USA · LLC Wyoming</p>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {[{ id: "chat", label: "💬 Consultation" }, { id: "formulaires", label: "📋 Formulaires officiels" }].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: onglet === o.id ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: onglet === o.id ? "bold" : "normal" }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === "chat" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <button onClick={genererChecklist} disabled={loading}
                style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                📋 Checklist complete LLC Wyoming Israel
              </button>
              <button onClick={envoyerExpert} disabled={envoyant || historique.length === 0}
                style={{ background: envoiOk ? "#00c800" : "rgba(200,169,110,0.3)", color: envoiOk ? "#fff" : "#c8a96e", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                {envoiOk ? "✅ Envoye !" : envoyant ? "⏳ Envoi..." : "📧 Envoyer a mon expert-comptable"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              {["france", "israel", "international"].map(c => (
                <button key={c} onClick={() => setContexte(c)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", background: contexte === c ? "#c8a96e" : "rgba(255,255,255,0.05)", color: contexte === c ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: contexte === c ? "bold" : "normal", fontSize: "13px" }}>
                  {c === "france" ? "🇫 France" : c === "israel" ? "🇮🇱 Israel" : "🌍 International"}
                </button>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "15px", maxHeight: "500px" }}>
                {historique.length === 0 && (
                  <div style={{ textAlign: "center", paddingTop: "60px" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)" }}>Bonjour. Je suis le Professeur Henri Mercier.</p>
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Posez votre question ou joignez un document PDF, JPEG ou PNG.</p>
                  </div>
                )}
                {historique.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "10px", maxWidth: "90%", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {msg.role === "agent" && <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "6px", fontWeight: "bold" }}>📊 Prof. Henri Mercier</div>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {(loading || fichierLoading) && (
                  <div style={{ display: "flex" }}>
                    <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "10px", color: "#c8a96e", fontSize: "13px" }}>
                      {fichierLoading ? "📎 Analyse du document en cours..." : "📊 Analyse comptable en cours..."}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={analyserFichier} style={{ display: "none" }}  multiple/ multiple>
                <button onClick={() => fileInputRef.current.click()} disabled={loading || fichierLoading}
                  title="Joindre PDF, JPEG ou PNG"
                  style={{ padding: "12px", background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>
                  📎
                </button>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && envoyer()}
                  placeholder="Posez votre question comptable ou joignez un document..."
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
                <button onClick={() => envoyer()} disabled={loading}
                  style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Envoyer
                </button>
            <button onClick={sauvegarderMemoire} disabled={memoireLoading}
              style={{ background: memoireOk ? "#22c55e" : "rgba(139,92,246,0.2)", color: memoireOk ? "#fff" : "#a78bfa", border: "1px solid " + (memoireOk ? "#22c55e" : "rgba(139,92,246,0.4)"), borderRadius: "6px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
              {memoireOk ? "✅ Sauvegardé !" : memoireLoading ? "⏳..." : "💾 Sauvegarder"}
            </button>
            <button onClick={ouvrirRestauration}
              style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
              📂 Restaurer
            </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", margin: "8px 0 0", textAlign: "center" }}>
                📎 Formats acceptes : PDF · JPEG · PNG — Analyse directe par Prof. Mercier
              </p>
            </div>
          </>
        )}

        {onglet === "formulaires" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {FORMULAIRES.map(f => (
                <div key={f.id} onClick={() => setFormulaireActif(formulaireActif?.id === f.id ? null : f)}
                  style={{ background: formulaireActif?.id === f.id ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid " + (formulaireActif?.id === f.id ? "#c8a96e" : "rgba(200,169,110,0.2)"), borderRadius: "10px", padding: "15px", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{f.flag}</div>
                  <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{f.nom}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>{f.obligatoire ? "✅ Obligatoire" : "⚠️ Conditionnel"}</div>
                </div>
              ))}
            </div>

            {formulaireActif && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 4px" }}>{formulaireActif.flag} {formulaireActif.nom}</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{formulaireActif.titre}</p>
                  </div>
                  <a href={formulaireActif.lien} target="_blank"
                    style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>
                    📥 Telecharger le formulaire officiel
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ color: "#ff6b6b", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>⚠️ Date limite</div>
                    <div style={{ color: "#fff", fontSize: "13px" }}>{formulaireActif.delai}</div>
                  </div>
                  <div style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ color: "#ff6b6b", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>💥 Sanction</div>
                    <div style={{ color: "#fff", fontSize: "13px" }}>{formulaireActif.sanction}</div>
                  </div>
                </div>
                <h3 style={{ color: "#c8a96e", marginBottom: "15px", fontSize: "16px" }}>📝 Guide de remplissage en francais</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(200,169,110,0.15)" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#c8a96e", fontSize: "12px", border: "1px solid rgba(200,169,110,0.2)", whiteSpace: "nowrap" }}>Case</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#c8a96e", fontSize: "12px", border: "1px solid rgba(200,169,110,0.2)" }}>Intitule officiel</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#c8a96e", fontSize: "12px", border: "1px solid rgba(200,169,110,0.2)" }}>Que remplir pour votre profil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulaireActif.cases.map((c, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                          <td style={{ padding: "10px 12px", color: "#c8a96e", fontSize: "12px", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap" }}>{c.case}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>{c.en}</td>
                          <td style={{ padding: "10px 12px", color: "#fff", fontSize: "13px", border: "1px solid rgba(255,255,255,0.05)" }}>{c.fr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button onClick={() => { envoyer("Explique-moi le " + formulaireActif.nom + " en detail pour mon profil : LLC Wyoming single-member, non-resident US, revenus hors USA, AcademiA Pro."); setOnglet("chat"); }}
                    style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                    📊 Demander une analyse detaillee a Prof. Mercier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {panelOuvert && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setPanelOuvert(false)} />
          <div style={{ position: "relative", background: "#111827", border: "1px solid #374151", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #374151" }}>
              <h2 style={{ color: "#fff", margin: 0, fontSize: "18px" }}>🧠 Restaurer une session</h2>
              <button onClick={() => setPanelOuvert(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "24px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px" }}>
              {sessionsLoading ? (
                <p style={{ color: "#9ca3af", textAlign: "center" }}>Chargement...</p>
              ) : sessionsMem.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center" }}>Aucune session sauvegardée</p>
              ) : sessionsMem.slice(0, 10).map((s, i) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "10px", border: "1px solid " + (i === 0 ? "rgba(139,92,246,0.5)" : "#374151"), background: i === 0 ? "rgba(139,92,246,0.1)" : "rgba(31,41,55,0.5)", marginBottom: "8px" }}>
                  <div>
                    {i === 0 && <span style={{ fontSize: "10px", background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: "20px", marginRight: "8px" }}>Dernière</span>}
                    <span style={{ color: "#fff", fontSize: "13px" }}>{s.session_label}</span>
                    <p style={{ color: "#9ca3af", fontSize: "11px", margin: "4px 0 0" }}>🕐 {new Date(s.updated_at).toLocaleString("fr-FR")} · {s.conversation?.length || 0} messages</p>
                  </div>
                  <button onClick={() => restaurerSession(s.conversation || [])}
                    style={{ padding: "6px 12px", background: "#374151", color: "#d1d5db", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    ↩️ Restaurer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
