"use client";
import { useState, useEffect } from "react";

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
      { num: 1, titre: "Verifier la disponibilite", detail: "Recherche d anteriorite gratuite sur bases-marques.inpi.fr — verifier qu AcademiA Pro n est pas deja depose", lien: "https://bases-marques.inpi.fr", seul: true },
      { num: 2, titre: "Choisir les classes Nice", detail: "Classe 41 : Formation et education en ligne. Classe 42 : Services technologiques et logiciels IA. Classe 35 : Marketing et publicite.", seul: true },
      { num: 3, titre: "Creer un compte INPI", detail: "Inscription gratuite sur inpi.fr pour deposer en ligne", lien: "https://www.inpi.fr/mon-compte", seul: true },
      { num: 4, titre: "Deposer la marque en ligne", detail: "Depot electronique sur inpi.fr — joindre logo AcademiA Pro + liste des classes choisies", lien: "https://www.inpi.fr/proteger-vos-creations/marque/depot", seul: true },
      { num: 5, titre: "Payer les taxes INPI", detail: "190 EUR + 40 EUR par classe supplementaire. Total 3 classes = 270 EUR environ.", seul: true },
      { num: 6, titre: "Attendre examen INPI", detail: "Delai 5 a 6 mois. Pas d opposition = enregistrement definitif valable 10 ans renouvelable.", seul: true },
    ]
  },
  {
    id: "uspto",
    nom: "Depot marque USPTO USA",
    flag: "🇺🇸",
    delai: "Dans les 6 mois apres INPI pour beneficier de la priorite",
    cout: "~350 USD par classe — 1050 USD pour 3 classes",
    lien_officiel: "https://www.uspto.gov/trademarks",
    lien_formulaire: "https://teas.uspto.gov",
    etapes: [
      { num: 1, titre: "Recherche TESS", detail: "Verifier disponibilite sur Trademark Electronic Search System — gratuit", lien: "https://tmsearch.uspto.gov", seul: true },
      { num: 2, titre: "Preparer le specimen", detail: "Capture ecran du site academiapro.fr montrant la marque en usage commercial", seul: true },
      { num: 3, titre: "Deposer via TEAS Plus", detail: "Formulaire en ligne TEAS Plus — moins cher que TEAS Standard. Baser sur priorite Paris Convention si INPI depose avant.", lien: "https://teas.uspto.gov", seul: true },
      { num: 4, titre: "Payer les taxes USPTO", detail: "350 USD par classe via carte bancaire internationale sur le portail USPTO", seul: true },
      { num: 5, titre: "Suivi examen", detail: "Delai 8 a 12 mois. Possible action office (refus provisoire) a repondre sous 3 mois.", seul: false },
    ]
  },
  {
    id: "israel",
    nom: "Depot marque Israel",
    flag: "🇮🇱",
    delai: "Dans les 6 mois apres INPI pour priorite Paris Convention",
    cout: "~300 USD par classe",
    lien_officiel: "https://www.gov.il/en/departments/the_patent_office",
    lien_formulaire: "https://www.gov.il/en/service/trademark_application",
    etapes: [
      { num: 1, titre: "Recherche anteriorite Israel", detail: "Recherche gratuite sur la base de donnees de l Office des Brevets et Marques israelien", lien: "https://trademark.justice.gov.il", seul: true },
      { num: 2, titre: "Deposer en ligne", detail: "Depot electronique sur le portail gouvernemental israelien — possible en anglais", lien: "https://www.gov.il/en/service/trademark_application", seul: true },
      { num: 3, titre: "Payer les taxes", detail: "Environ 1200 ILS (~300 USD) par classe — paiement en ligne", seul: true },
      { num: 4, titre: "Examen et publication", detail: "Delai 6 a 12 mois. Publication dans le Journal Officiel israelien — periode d opposition 3 mois.", seul: false },
    ]
  },
  {
    id: "madrid",
    nom: "Systeme de Madrid OMPI",
    flag: "🌍",
    delai: "Apres depot INPI — extension internationale en une seule demarche",
    cout: "~950 CHF base + 100-200 EUR par pays designe",
    lien_officiel: "https://www.wipo.int/madrid/fr",
    lien_formulaire: "https://www.wipo.int/madrid/fr/filing",
    etapes: [
      { num: 1, titre: "Conditions requises", detail: "Avoir un depot ou enregistrement de base dans un pays membre (INPI France). Etre ressortissant ou resident d un pays membre.", seul: true },
      { num: 2, titre: "Choisir les pays", detail: "Jusqu a 130 pays possibles. Recommande : USA, Israel, Allemagne, Espagne, Portugal, Maroc, UAE, Canada", seul: true },
      { num: 3, titre: "Deposer via INPI", detail: "Depot international via votre office national (INPI France) qui transmet a l OMPI Geneve", lien: "https://www.inpi.fr/proteger-vos-creations/marque/extension-internationale", seul: true },
      { num: 4, titre: "Payer les taxes OMPI", detail: "Taxe de base 653 CHF + supplement individuel par pays. Paiement en CHF via virement OMPI.", seul: true },
      { num: 5, titre: "Gestion centralisee", detail: "Un seul renouvellement tous les 10 ans pour tous les pays — enorme simplification administrative", seul: true },
    ]
  },
  {
    id: "operating",
    nom: "Operating Agreement LLC Wyoming",
    flag: "🇺🇸",
    delai: "A signer a la creation de la LLC",
    cout: "Gratuit si redige seul — 300-500 USD si avocat",
    lien_officiel: "https://sos.wyo.gov/Forms/Business/LLC/",
    lien_formulaire: "https://sos.wyo.gov/Forms/Business/LLC/LLCOperatingAgreement.pdf",
    etapes: [
      { num: 1, titre: "Identifier les parties", detail: "Nom exact LLC + votre nom complet comme Managing Member unique et associe a 100%", seul: true },
      { num: 2, titre: "Definir l objet social", detail: "Online education platform, AI-powered training services, SaaS — AcademiA Pro", seul: true },
      { num: 3, titre: "Clause protection IP", detail: "Tous droits de propriete intellectuelle (marque, logiciels, contenus, algorithmes IA) appartiennent a la LLC Wyoming en tant que Holding", seul: true },
      { num: 4, titre: "Clause Holding", detail: "La LLC Wyoming est la societe mere — elle detient 100% de la filiale israelienne a terme", seul: true },
      { num: 5, titre: "Repartition benefices", detail: "100% des benefices au Managing Member unique", seul: true },
      { num: 6, titre: "Signature", detail: "Signer et dater — conserver l original — apostille si requis pour usage international", seul: false },
    ]
  },
  {
    id: "cgv",
    nom: "CGV et Mentions legales",
    flag: "🌍",
    delai: "Avant ouverture commerciale",
    cout: "Gratuit si redige seul — 500-1500 EUR si avocat",
    lien_officiel: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23455",
    lien_formulaire: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23455",
    etapes: [
      { num: 1, titre: "Mentions legales", detail: "Nom LLC + adresse Registered Agent + email + EIN + responsable publication + hebergeur Vercel", seul: true },
      { num: 2, titre: "CGV formations en ligne", detail: "Prix, paiement Stripe, droit retractation 14 jours droit francais, remboursement 30 jours garantie", seul: true },
      { num: 3, titre: "Politique confidentialite RGPD", detail: "Donnees collectees, finalite, duree conservation, droits utilisateurs, contact DPO", seul: true },
      { num: 4, titre: "Cookies CNIL", detail: "Bandeau cookies conforme — consentement explicite — liste des traceurs utilises", seul: true },
    ]
  },
  {
    id: "exit",
    nom: "Exit juridique France",
    flag: "🇫🇷",
    delai: "Avant depart effectif en Israel",
    cout: "Variable",
    lien_officiel: "https://www.impots.gouv.fr/international-particulier/partir-vivre-a-letranger",
    lien_formulaire: "https://www.impots.gouv.fr/formulaire/2074-etd/declaration-des-plus-values",
    etapes: [
      { num: 1, titre: "Informer centre des impots", detail: "Declaration de depart — changement d adresse fiscale vers Israel", seul: true },
      { num: 2, titre: "Cloturer residence fiscale France", detail: "Date officielle = date installation effective en Israel", seul: true },
      { num: 3, titre: "Exit Tax si applicable", detail: "Formulaire 2074-ETD si titres societes plus de 800 000 EUR ou 50% du capital", seul: true },
      { num: 4, titre: "Radiation Securite Sociale", detail: "Informer CPAM du depart — fin de droits en France", seul: true },
    ]
  },
];


  const ACTIONS_PRIORITAIRES = [
    {
      id: "llc",
      titre: "Creer ma LLC Wyoming",
      sous_titre: "Via Northwest Registered Agent",
      flag: "🇺🇸",
      cout: "~140 USD tout compris",
      delai: "24-48h",
      lien: "https://www.northwestregisteredagent.com/llc/wyoming",
      couleur: "#c8a96e",
      guide: "Guide creation LLC Wyoming via Northwest Registered Agent pour mon profil exact : non-resident US, single-member LLC, activite plateforme formation en ligne AcademiA Pro, objectif Holding internationale. Donne moi : 1) Les informations exactes a entrer sur le formulaire Northwest 2) Le nom recommande pour la LLC 3) L adresse a utiliser 4) Les options a cocher ou decocher 5) Ce qui se passe apres la creation 6) Cout exact et ce qui est inclus"
    },
    {
      id: "wise",
      titre: "Ouvrir mon compte Wise Business",
      sous_titre: "Compte multi-devises EUR USD ILS",
      flag: "💳",
      cout: "Gratuit a l ouverture",
      delai: "1-3 jours",
      lien: "https://wise.com/fr/business",
      couleur: "#00b9ff",
      guide: "Guide ouverture compte Wise Business pour ma LLC Wyoming : documents requis pour non-resident US avec LLC Wyoming, devises a activer EUR USD ILS, IBAN europeen, comment recevoir les paiements Stripe et les virements clients internationaux, frais de change, carte Wise Business, limites et avantages pour un entrepreneur franco-israelien."
    },
    {
      id: "stripe",
      titre: "Configurer Stripe",
      sous_titre: "Paiements en ligne AcademiA Pro",
      flag: "💳",
      cout: "Gratuit + 1.4% par transaction EU",
      delai: "1-2 jours",
      lien: "https://dashboard.stripe.com/register",
      couleur: "#635bff",
      guide: "Guide configuration Stripe pour ma LLC Wyoming : documents requis pour ouvrir un compte Stripe en tant que LLC Wyoming non-resident US, comment connecter Wise Business comme compte bancaire, configuration pour AcademiA Pro plateforme de formation en ligne, webhooks pour generation automatique LMS a l achat, tarifs exacts pour clients europeens et internationaux, conformite PCI DSS."
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
    setHistorique(prev => [...prev, { role: "user", text: "Checklist juridique complete LLC Wyoming Holding + INPI + Exit France + Israel" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, contexte: "international", historique: [] }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]);
    }
    setLoading(false);
  }

  async function guideINPI() {
    setOnglet("chat");
    const q = "Guide detaille depot marque AcademiA Pro a l INPI France : etapes exactes, documents a preparer, classes Nice recommandees pour une plateforme IA de formation en ligne, cout exact, delais, et conseils pour maximiser les chances d enregistrement. Inclure aussi la strategie pour etendre ensuite aux USA et Israel.";
    setHistorique(prev => [...prev, { role: "user", text: "Guide complet depot marque AcademiA Pro INPI France + strategie extension internationale" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, contexte: "france", historique: [] }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]);
    }
    setLoading(false);
  }

  async function guideInternational() {
    setOnglet("chat");
    const q = "Guide complet protection marque AcademiA Pro internationale : USPTO USA (procedure, cout, delais pour non-resident), Office des Brevets Israel (procedure en anglais, cout), Systeme de Madrid OMPI (avantages, cout, pays recommandes). Quelle strategie adopter pour un entrepreneur franco-israelien avec LLC Wyoming ?";
    setHistorique(prev => [...prev, { role: "user", text: "Guide protection marque internationale AcademiA Pro : USPTO USA + Israel + Systeme Madrid OMPI" }]);
    setLoading(true);
    try {
      const r = await fetch("/api/mr-juridique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, contexte: "international", historique: [] }),
      });
      const data = await r.json();
      setHistorique(prev => [...prev, { role: "agent", text: data.reply || "Erreur." }]);
    } catch {
      setHistorique(prev => [...prev, { role: "agent", text: "Erreur." }]);
    }
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
          subject: "Dossier juridique LLC Wyoming + INPI + Israel — Jacques Lalou — AcademiA Pro",
          html: "<h2>Dossier Juridique International</h2><p><strong>Jacques Lalou — AcademiA Pro</strong></p><p>Resident France, depart Israel 6 mois, LLC Wyoming Holding, AcademiA Pro</p><hr/><h3>Analyse Maitre Pierre Duval</h3><pre style='white-space:pre-wrap;font-family:Arial;font-size:13px'>" + resume + "</pre><hr/><p style='color:#666;font-size:12px'>Genere par AcademiA Pro — " + new Date().toLocaleDateString("fr-FR") + "</p>",
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
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Utilisez les boutons ci-dessus ou posez votre question directement.</p>
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
                {loading && <div style={{ display: "flex" }}><div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "10px", color: "#c8a96e", fontSize: "13px" }}>⚖️ Analyse juridique en cours...</div></div>}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && envoyer()}
                  placeholder="Posez votre question juridique..."
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
                <button onClick={() => envoyer()} disabled={loading}
                  style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Envoyer
                </button>
              </div>
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
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => lancerAction(a)} disabled={actionLoading === a.id}
                        style={{ flex: 1, background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                        {actionLoading === a.id ? "⏳ Guide en cours..." : "⚖️ Guide + Ouvrir"}
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
                  <button onClick={() => { envoyer("Analyse detaillee pour " + docActif.nom + " pour mon profil : LLC Wyoming Holding, AcademiA Pro plateforme IA formation, resident France depart Israel 6 mois. Donne moi les points cles, risques, et recommandations specifiques."); setOnglet("chat"); }}
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