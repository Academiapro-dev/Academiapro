"use client";
import { useState, useEffect, useRef } from "react";

const DOCUMENTS = [
  {
    id: "inpi",
    nom: "Depot marque INPI France",
    flag: "🇫🇷",
    delai: "Des que possible — etablit la date de priorite internationale",
    cout: "~270 EUR pour 3 classes",
    lien_officiel: "https://www.inpi.fr/proteger-vos-creations/marque",
    lien_formulaire: "https://www.inpi.fr/proteger-vos-creations/marque/depot",
    etapes: [
      { num: 1, titre: "Verifier la disponibilite", detail: "Recherche d anteriorite gratuite sur bases-marques.inpi.fr", lien: "https://bases-marques.inpi.fr", seul: true },
      { num: 2, titre: "Choisir les classes Nice", detail: "Classe 41 : Formation en ligne. Classe 42 : Services IA. Classe 35 : Marketing.", seul: true },
      { num: 3, titre: "Creer un compte INPI", detail: "Inscription gratuite sur inpi.fr", lien: "https://www.inpi.fr/mon-compte", seul: true },
      { num: 4, titre: "Deposer la marque en ligne", detail: "Depot electronique sur inpi.fr — joindre logo AcademiA Pro", lien: "https://www.inpi.fr/proteger-vos-creations/marque/depot", seul: true },
      { num: 5, titre: "Payer les taxes INPI", detail: "190 EUR + 40 EUR par classe. Total 3 classes = 270 EUR.", seul: true },
      { num: 6, titre: "Attendre examen INPI", detail: "Delai 5 a 6 mois. Valable 10 ans renouvelable.", seul: true },
    ]
  },
  {
    id: "uspto",
    nom: "Depot marque USPTO USA",
    flag: "🇺🇸",
    delai: "Dans les 6 mois apres INPI",
    cout: "~350 USD par classe — 1050 USD pour 3 classes",
    lien_officiel: "https://www.uspto.gov/trademarks",
    lien_formulaire: "https://teas.uspto.gov",
    etapes: [
      { num: 1, titre: "Recherche TESS", detail: "Verifier disponibilite — gratuit", lien: "https://tmsearch.uspto.gov", seul: true },
      { num: 2, titre: "Preparer le specimen", detail: "Capture ecran academiapro.fr montrant la marque", seul: true },
      { num: 3, titre: "Deposer via TEAS Plus", detail: "Formulaire TEAS Plus en ligne", lien: "https://teas.uspto.gov", seul: true },
      { num: 4, titre: "Payer les taxes USPTO", detail: "350 USD par classe", seul: true },
      { num: 5, titre: "Suivi examen", detail: "Delai 8 a 12 mois.", seul: false },
    ]
  },
  {
    id: "israel",
    nom: "Depot marque Israel",
    flag: "🇮🇱",
    delai: "Dans les 6 mois apres INPI",
    cout: "~300 USD par classe",
    lien_officiel: "https://www.gov.il/en/departments/the_patent_office",
    lien_formulaire: "https://www.gov.il/en/service/trademark_application",
    etapes: [
      { num: 1, titre: "Recherche anteriorite Israel", detail: "Base de donnees Office des Brevets israelien", lien: "https://trademark.justice.gov.il", seul: true },
      { num: 2, titre: "Deposer en ligne", detail: "Portail gouvernemental israelien en anglais", lien: "https://www.gov.il/en/service/trademark_application", seul: true },
      { num: 3, titre: "Payer les taxes", detail: "Environ 1200 ILS (~300 USD) par classe", seul: true },
      { num: 4, titre: "Examen et publication", detail: "Delai 6 a 12 mois. Opposition 3 mois.", seul: false },
    ]
  },
  {
    id: "madrid",
    nom: "Systeme de Madrid OMPI",
    flag: "🌍",
    delai: "Apres depot INPI",
    cout: "~950 CHF base + 100-200 EUR par pays",
    lien_officiel: "https://www.wipo.int/madrid/fr",
    lien_formulaire: "https://www.wipo.int/madrid/fr/filing",
    etapes: [
      { num: 1, titre: "Conditions requises", detail: "Avoir un depot INPI France valide", seul: true },
      { num: 2, titre: "Choisir les pays", detail: "Recommande : USA, Israel, Allemagne, Espagne, Portugal, UAE, Canada", seul: true },
      { num: 3, titre: "Deposer via INPI", detail: "L INPI transmet a l OMPI Geneve", lien: "https://www.inpi.fr/proteger-vos-creations/marque/extension-internationale", seul: true },
      { num: 4, titre: "Payer taxes OMPI", detail: "653 CHF + supplement par pays", seul: true },
      { num: 5, titre: "Gestion centralisee", detail: "Un seul renouvellement tous les 10 ans", seul: true },
    ]
  },
  {
    id: "operating",
    nom: "Operating Agreement LLC Wyoming",
    flag: "🇺🇸",
    delai: "A la creation de la LLC",
    cout: "Gratuit seul — 300-500 USD avocat",
    lien_officiel: "https://sos.wyo.gov/Forms/Business/LLC/",
    lien_formulaire: "https://sos.wyo.gov/Forms/Business/LLC/LLCOperatingAgreement.pdf",
    etapes: [
      { num: 1, titre: "Identifier les parties", detail: "Nom LLC + votre nom comme Managing Member unique 100%", seul: true },
      { num: 2, titre: "Definir l objet social", detail: "Online education platform, AI-powered training, SaaS — AcademiA Pro", seul: true },
      { num: 3, titre: "Clause protection IP", detail: "Tous droits IP appartiennent a la LLC Wyoming Holding", seul: true },
      { num: 4, titre: "Clause Holding", detail: "LLC Wyoming = societe mere detenant 100% filiale israelienne", seul: true },
      { num: 5, titre: "Repartition benefices", detail: "100% au Managing Member unique", seul: true },
      { num: 6, titre: "Signature", detail: "Signer et dater — apostille si usage international", seul: false },
    ]
  },
  {
    id: "cgv",
    nom: "CGV et Mentions legales",
    flag: "🌍",
    delai: "Avant ouverture commerciale",
    cout: "Gratuit seul — 500-1500 EUR avocat",
    lien_officiel: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23455",
    lien_formulaire: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23455",
    etapes: [
      { num: 1, titre: "Mentions legales", detail: "Nom LLC + adresse Registered Agent + email + EIN + hebergeur Vercel", seul: true },
      { num: 2, titre: "CGV formations en ligne", detail: "Prix, Stripe, retractation 14 jours, remboursement 30 jours", seul: true },
      { num: 3, titre: "Politique confidentialite RGPD", detail: "Donnees collectees, finalite, duree, droits utilisateurs", seul: true },
      { num: 4, titre: "Cookies CNIL", detail: "Bandeau cookies conforme — consentement explicite", seul: true },
    ]
  },
  {
    id: "exit",
    nom: "Exit juridique France",
    flag: "🇫🇷",
    delai: "Avant depart en Israel",
    cout: "Variable",
    lien_officiel: "https://www.impots.gouv.fr/international-particulier/partir-vivre-a-letranger",
    lien_formulaire: "https://www.impots.gouv.fr/formulaire/2074-etd/declaration-des-plus-values",
    etapes: [
      { num: 1, titre: "Informer centre des impots", detail: "Declaration de depart — changement adresse fiscale vers Israel", seul: true },
      { num: 2, titre: "Cloturer residence fiscale France", detail: "Date officielle = installation effective en Israel", seul: true },
      { num: 3, titre: "Exit Tax si applicable", detail: "Formulaire 2074-ETD si titres > 800 000 EUR", seul: true },
      { num: 4, titre: "Radiation Securite Sociale", detail: "Informer CPAM du depart", seul: true },
    ]
  },
];

const ACTIONS_PRIORITAIRES = [
  {
    id: "llc",
    titre: "Creer ma LLC Wyoming",
    sous_titre: "Via Doola — Tout inclus non-resident",
    flag: "🇺🇸",
    cout: "~297 USD tout compris",
    delai: "24-48h",
    lien: "https://www.doola.com/llc/wyoming/",
    couleur: "#c8a96e",
    guide: "Guide creation LLC Wyoming via Doola pour mon profil : non-resident US sans SSN, single-member LLC, AcademiA Pro plateforme formation IA, Holding internationale France-Israel-USA."
  },
  {
    id: "wise",
    titre: "Ouvrir mon compte Wise Business",
    sous_titre: "Compte principal multi-devises EUR USD ILS",
    flag: "💳",
    cout: "Gratuit a l ouverture",
    delai: "1-3 jours",
    lien: "https://wise.com/fr/business",
    couleur: "#00b9ff",
    guide: "Guide ouverture compte Wise Business pour LLC Wyoming : documents requis, devises EUR USD ILS, IBAN europeen, compte USD Stripe, frais 0.4%."
  },
  {
    id: "stripe",
    titre: "Configurer Stripe",
    sous_titre: "Connecte a Wise Business — Paiements AcademiA Pro",
    flag: "💜",
    cout: "Gratuit + 1.4% par transaction EU",
    delai: "1-2 jours",
    lien: "https://dashboard.stripe.com/register",
    couleur: "#635bff",
    guide: "Guide configuration Stripe pour LLC Wyoming connecte a Wise Business : flux paiement AcademiA Pro, webhooks LMS, tarifs 1.4% + 0.25 EUR."
  },
];

export default function MrJuridiquePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contexte, setContexte] = useState("international");
  const [onglet, setOnglet] = useState("chat");
  const [docActif, setDocActif] = useState(null);
  const [envoyant, setEnvoyant] = useState(false);
  const [envoiOk, setEnvoiOk] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [fichierLoading, setFichierLoading] = useState(false);
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

  async function analyserFichier(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFichierLoading(true);
    const noms = files.map((f) => f.name).join(", ");
    setHistorique(prev => [...prev, { role: "user", text: "📎 " + files.length + " document(s) joint(s) : " + noms }]);
    try {
      const fichiersB64 = await Promise.all(files.map((file) => new Promise((resolve) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ base64: ev.target.result.split(",")[1], mediaType, nom: file.name });
        reader.readAsDataURL(file);
      })));
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyse ces " + files.length + " document(s) et donne moi une analyse juridique experte complete en tant que Maitre Pierre Duval.",
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

  async function lancerAction(action) {
    setActionLoading(action.id);
    setOnglet("chat");
    setHistorique(prev => [...prev, { role: "user", text: action.guide }]);
    try {
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: action.guide, contexte: "international", historique: [] }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setActionLoading("");
    window.open(action.lien, "_blank");
  }

  async function envoyer(msg) {
    const m = msg || message;
    if (!m || !m.trim()) return;
    if (!msg) setMessage("");
    setHistorique(prev => [...prev, { role: "user", text: m }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", {
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
    const q = "Genere ma checklist juridique complete : LLC Wyoming Holding + INPI France + Protection marque internationale + Exit France + Installation Israel Olim + Filiale israelienne. Profil : resident France depart Israel 6 mois, AcademiA Pro plateforme formation IA clients internationaux.";
    setHistorique(prev => [...prev, { role: "user", text: "Checklist juridique complete LLC Wyoming + INPI + Exit France + Israel" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, contexte: "international", historique: [] }) });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch { setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]); }
    setLoading(false);
  }

  async function guideINPI() {
    setOnglet("chat");
    const q = "Guide detaille depot marque AcademiA Pro a l INPI France : etapes, classes Nice, cout, delais, strategie extension USA et Israel.";
    setHistorique(prev => [...prev, { role: "user", text: "Guide depot marque INPI France + extension internationale" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, contexte: "france", historique: [] }) });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch { setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]); }
    setLoading(false);
  }

  async function guideInternational() {
    setOnglet("chat");
    const q = "Guide protection marque AcademiA Pro : USPTO USA, Office Brevets Israel, Systeme Madrid OMPI. Strategie pour entrepreneur franco-israelien avec LLC Wyoming.";
    setHistorique(prev => [...prev, { role: "user", text: "Guide protection marque internationale : USPTO + Israel + Madrid OMPI" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, contexte: "international", historique: [] }) });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch { setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]); }
    setLoading(false);
  }

  async function envoyerAvocat() {
    setEnvoyant(true);
    try {
      const resume = historique.map(h => (h.role === "user" ? "QUESTION: " : "REPONSE Maitre Duval: ") + h.text).join(" | ");
      await fetch("/api/emailing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "envoyer_direct",
          to: "contact@academiapro.fr",
          subject: "Dossier juridique LLC Wyoming + INPI + Israel — AcademiA Pro",
          html: "<h2>Dossier Juridique International</h2><p><strong>AcademiA Pro</strong></p><hr/><h3>Analyse Maitre Pierre Duval</h3><pre style=\"white-space:pre-wrap;font-family:Arial;font-size:13px\">" + resume + "</pre><hr/><p style=\"color:#666;font-size:12px\">Genere par AcademiA Pro — " + new Date().toLocaleDateString("fr-FR") + "</p>",
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
          <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 6px" }}>⚖️ Maitre Pierre Duval</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>Avocat et Juriste — France · Israel · USA · LLC Wyoming · Protection IP · Droit International</p>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {[{ id: "chat", label: "💬 Consultation" }, { id: "documents", label: "📁 Documents officiels" }].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: onglet === o.id ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: onglet === o.id ? "bold" : "normal" }}>
              {o.label}
            </button>
          ))}
        </div>

        {onglet === "chat" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
              <button onClick={genererChecklist} disabled={loading}
                style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                ⚖ Checklist juridique complete
              </button>
              <button onClick={guideINPI} disabled={loading}
                style={{ background: "rgba(200,169,110,0.3)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                🇫🇷 Guide depot marque INPI France
              </button>
              <button onClick={guideInternational} disabled={loading}
                style={{ background: "rgba(200,169,110,0.3)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                🌍 Etendre protection internationale
              </button>
              <button onClick={envoyerAvocat} disabled={envoyant || historique.length === 0}
                style={{ background: envoiOk ? "#00c800" : "rgba(255,255,255,0.05)", color: envoiOk ? "#fff" : "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                {envoiOk ? "✅ Envoye !" : envoyant ? "⏳ Envoi..." : "📧 Envoyer a mon avocat"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              {["france", "israel", "international"].map(c => (
                <button key={c} onClick={() => setContexte(c)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", background: contexte === c ? "#c8a96e" : "rgba(255,255,255,0.05)", color: contexte === c ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: contexte === c ? "bold" : "normal", fontSize: "13px" }}>
                  {c === "france" ? "🇫🇷 France" : c === "israel" ? "🇮🇱 Israel" : "🌍 International"}
                </button>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "15px", maxHeight: "500px" }}>
                {historique.length === 0 && (
                  <div style={{ textAlign: "center", paddingTop: "60px" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)" }}>Bonjour. Je suis Maitre Pierre Duval.</p>
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Posez votre question ou joignez un document PDF, JPEG ou PNG.</p>
                  </div>
                )}
                {historique.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "10px", maxWidth: "90%", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {msg.role === "agent" && <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "6px", fontWeight: "bold" }}>⚖️ Maitre Pierre Duval</div>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {(loading || fichierLoading) && (
                  <div style={{ display: "flex" }}>
                    <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "10px", color: "#c8a96e", fontSize: "13px" }}>
                      {fichierLoading ? "📎 Analyse du document en cours..." : "⚖️ Analyse juridique en cours..."}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  ref={fileInputRef}
                  type="file" multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={analyserFichier}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading || fichierLoading}
                  title="Joindre un document PDF, JPEG ou PNG"
                  style={{ padding: "12px", background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>
                  📎
                </button>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && envoyer()}
                  placeholder="Posez votre question juridique ou joignez un document..."
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
                <button onClick={() => envoyer()} disabled={loading}
                  style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Envoyer
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", margin: "8px 0 0", textAlign: "center" }}>
                📎 Formats acceptes : PDF · JPEG · PNG — Analyse directe par Maitre Duval
              </p>
            </div>
          </>
        )}

        {onglet === "documents" && (
          <div>
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px", fontSize: "16px" }}>🚀 Actions prioritaires — Lancer votre structure</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {ACTIONS_PRIORITAIRES.map(a => (
                  <div key={a.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px" }}>{a.flag} {a.titre}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{a.sous_titre}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px", marginBottom: "12px" }}>
                      <div style={{ background: "rgba(0,200,0,0.1)", padding: "4px 10px", borderRadius: "4px" }}>
                        <span style={{ color: "#00c800", fontSize: "11px" }}>💰 {a.cout}</span>
                      </div>
                      <div style={{ background: "rgba(255,165,0,0.1)", padding: "4px 10px", borderRadius: "4px" }}>
                        <span style={{ color: "#ffa500", fontSize: "11px" }}>⏱ {a.delai}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                      <a href={a.lien} target="_blank"
                        style={{ display: "block", textAlign: "center", background: "#c8a96e", color: "#050508", borderRadius: "8px", padding: "10px", fontWeight: "bold", fontSize: "12px", textDecoration: "none" }}>
                        🚀 Ouvrir {a.titre}
                      </a>
                      <button onClick={() => lancerAction(a)} disabled={actionLoading === a.id}
                        style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "8px", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>
                        {actionLoading === a.id ? "⏳ Preparation..." : "📋 Documents a preparer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(200,169,110,0.2)", marginTop: "20px", paddingTop: "20px" }}>
                <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px", fontSize: "16px" }}>📁 Documents juridiques officiels</h3>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {DOCUMENTS.map(d => (
                <div key={d.id} onClick={() => setDocActif(docActif?.id === d.id ? null : d)}
                  style={{ background: docActif?.id === d.id ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid " + (docActif?.id === d.id ? "#c8a96e" : "rgba(200,169,110,0.2)"), borderRadius: "10px", padding: "15px", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{d.flag}</div>
                  <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "12px" }}>{d.nom}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>{d.cout}</div>
                </div>
              ))}
            </div>

            {docActif && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 4px" }}>{docActif.flag} {docActif.nom}</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>Cout : {docActif.cout}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <a href={docActif.lien_officiel} target="_blank"
                      style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "12px", border: "1px solid rgba(200,169,110,0.3)" }}>
                      🔗 Site officiel
                    </a>
                    <a href={docActif.lien_formulaire} target="_blank"
                      style={{ background: "#c8a96e", color: "#050508", padding: "10px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "12px" }}>
                      📥 Acceder au formulaire
                    </a>
                  </div>
                </div>
                <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
                  <div style={{ color: "#ffa500", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>⏰ Delai recommande</div>
                  <div style={{ color: "#fff", fontSize: "13px" }}>{docActif.delai}</div>
                </div>
                <h3 style={{ color: "#c8a96e", marginBottom: "15px", fontSize: "16px" }}>📋 Guide etape par etape</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {docActif.etapes.map((e, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "15px", display: "flex", gap: "15px" }}>
                      <div style={{ background: "#c8a96e", color: "#050508", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>{e.num}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>{e.titre}</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.6" }}>{e.detail}</div>
                        <div style={{ marginTop: "6px", display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ background: e.seul ? "rgba(0,200,0,0.1)" : "rgba(255,165,0,0.1)", color: e.seul ? "#00c800" : "#ffa500", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                            {e.seul ? "✅ Faisable seul" : "⚠️ Conseiller recommande"}
                          </span>
                          {e.lien && <a href={e.lien} target="_blank" style={{ color: "#c8a96e", fontSize: "11px", textDecoration: "none" }}>🔗 Lien direct →</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button onClick={() => { envoyer("Analyse detaillee pour " + docActif.nom + " — LLC Wyoming Holding, AcademiA Pro, resident France depart Israel 6 mois."); setOnglet("chat"); }}
                    style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                    ⚖️ Demander analyse detaillee a Maitre Duval
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
