"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function formatReponse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/#{3} (.+)/g, "<h4 style=\"color:#c8a96e;margin:12px 0 6px;\">$1</h4>")
    .replace(/#{2} (.+)/g, "<h3 style=\"color:#c8a96e;margin:15px 0 8px;\">$1</h3>")
    .replace(/# (.+)/g, "<h2 style=\"color:#c8a96e;margin:18px 0 10px;\">$1</h2>")
    .replace(/^- (.+)/gm, "<li style=\"margin:4px 0;\">$1</li>")
    .replace(/---/g, "<hr style=\"border-color:rgba(200,169,110,0.2);margin:10px 0;\">")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

const DOCUMENTS_TYPES = [
  { id: "cgv", label: "CGV - Conditions Générales de Vente", prompt: "Génère des CGV complètes et conformes au droit français pour AcadémIA Pro, plateforme de formation professionnelle et bien-être 100% IA. Inclus : objet - prix - paiement - accès - propriété intellectuelle - garantie 30 jours - responsabilité - données personnelles - droit applicable." },
  { id: "mentions", label: "Mentions Légales", prompt: "Génère des mentions légales complètes pour academiapro.fr. Inclus : éditeur - hébergeur Vercel - directeur publication Jacques Lalou - données personnelles RGPD - cookies - propriété intellectuelle." },
  { id: "nda", label: "NDA - Accord de Confidentialité", prompt: "Génère un NDA professionnel en droit français pour AcadémIA Pro avec Jacques Lalou. Inclus : définition informations confidentielles - obligations - durée 5 ans - exceptions - sanctions." },
  { id: "rgpd", label: "Politique de Confidentialité RGPD", prompt: "Génère une politique de confidentialité RGPD complète pour AcadémIA Pro. Inclus : données collectées - finalités - base légale - durée conservation - droits utilisateurs - DPO - cookies - transferts." },
  { id: "contrat_prestataire", label: "Contrat Prestataire", prompt: "Génère un contrat de prestation de services en droit français pour AcadémIA Pro avec un prestataire externe. Inclus : objet - missions - tarifs - délais - propriété intellectuelle - confidentialité - résiliation." },
  { id: "reglement", label: "Règlement Intérieur Formation", prompt: "Génère un règlement intérieur de centre de formation conforme au droit français pour AcadémIA Pro. Inclus : objet - accès formations - comportement - droits stagiaires - sanctions - réclamations." },
];



function FiscalChat() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  async function envoyer() {
    if (!msg.trim()) return;
    const userMsg = msg;
    setMsg("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    const res = await fetch("/api/admin/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        agent: { prompt: "Tu es un expert en optimisation fiscale française specialise dans les startups numeriques et plateformes IA. Tu conseilles Jacques Lalou fondateur d AcadémIA Pro. Tu donnes des conseils fiscaux precis et chiffres. Tu rappelles de consulter un expert-comptable pour les decisions importantes." },
        historique: chat
      }),
    });
    const data = await res.json();
    setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    setLoading(false);
  }

  return (
    <div>
      <div style={{ minHeight: "150px", maxHeight: "250px", overflowY: "auto", marginBottom: "10px" }}>
        {chat.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Posez une question sur l optimisation fiscale...</p>}
        {chat.map((m, i) => (
          <div key={i} style={{ marginBottom: "10px", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ background: m.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: m.role === "user" ? "#050508" : "#fff", padding: "10px 14px", borderRadius: "10px", maxWidth: "85%", fontSize: "13px", lineHeight: "1.6" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <p style={{ color: "#c8a96e", fontSize: "13px" }}>Analyse fiscale en cours...</p>}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input type="text" placeholder="Ex: Comment réduire mes charges ?" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyer()}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13px" }} />
        <button onClick={envoyer} disabled={loading} style={{ padding: "10px 16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          Envoyer
        </button>

        {onglet === "fiscal" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "10px" }}>
              💰 Agent Optimisation Fiscale
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Conseils personnalisés pour optimiser la fiscalité d AcadémIA Pro
            </p>

            <div style={{ display: "grid", gap: "15px", marginBottom: "30px" }}>
              {[
                {
                  titre: "Micro-entreprise vs SASU - Quel régime choisir ?",
                  description: "Analyse comparative selon votre CA prévisionnel",
                  prompt: "En tant qu expert en optimisation fiscale française, analyse pour Jacques Lalou fondateur d AcadémIA Pro : quand passer de micro-entreprise à SASU ? Inclus les seuils de CA, avantages fiscaux de chaque structure, cotisations sociales, optimisation rémunération gérant, dividendes, charges déductibles. Donne des exemples chiffrés pour un CA de 50000€ - 100000€ - 200000€."
                },
                {
                  titre: "Charges Déductibles AcadémIA Pro",
                  description: "Toutes les charges déductibles pour votre activité",
                  prompt: "Liste exhaustive des charges déductibles fiscalement pour AcadémIA Pro, plateforme IA de formation et bien-être. Inclus : abonnements API Claude - HeyGen - ElevenLabs - Daily.co - Vercel - Supabase - Resend - OVH - matériel iPad - domaines - formations - frais bancaires - honoraires - marketing. Précise les règles de déductibilité et les justificatifs nécessaires."
                },
                {
                  titre: "Holding LLC + SAS - Optimisation Structurelle",
                  description: "Stratégie holding pour maximiser les économies fiscales",
                  prompt: "Explique à Jacques Lalou la stratégie optimale d une structure Holding LLC américaine + SAS française pour AcadémIA Pro. Inclus : avantages fiscaux - dividendes - optimisation IS - protection patrimoine - coûts de mise en place - délais - risques - quand mettre en place cette structure selon le CA."
                },
                {
                  titre: "TVA - Stratégie et Anticipation",
                  description: "Préparer le passage à la TVA au bon moment",
                  prompt: "Conseille Jacques Lalou sur la gestion de la TVA pour AcadémIA Pro. Inclus : seuils de franchise 2026 - moment optimal pour opter volontairement - TVA sur formations exonérées - TVA sur thérapie - récupération TVA sur achats - impact sur les prix affichés - stratégie prix HT vs TTC."
                },
                {
                  titre: "Plan d Épargne et Protection Sociale",
                  description: "Optimiser sa protection sociale en tant que fondateur",
                  prompt: "Conseille Jacques Lalou fondateur d AcadémIA Pro sur l optimisation de sa protection sociale et épargne. Inclus : PER - Madelin - complémentaire santé - prévoyance - retraite complémentaire - cotisations TNS - optimisation revenus - arbitrage salaire vs dividendes en SASU."
                },
                {
                  titre: "Rapport Fiscal Annuel Personnalisé",
                  description: "Bilan fiscal complet et recommandations",
                  prompt: "Génère un rapport fiscal annuel personnalisé pour AcadémIA Pro de Jacques Lalou. Structure : situation fiscale actuelle - optimisations réalisées - optimisations à mettre en place - économies potentielles estimées - planning fiscal sur 3 ans - recommandations prioritaires. Adapte à une micro-entreprise en phase de lancement avec ambition de scaling."
                },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div>
                    <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{item.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{item.description}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setOnglet("generation");
                      setDocSelectionne({ label: item.titre });
                      setGenerationLoading(true);
                      setDocGenere("");
                      const res = await fetch("/api/admin/agent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: item.prompt,
                          agent: { prompt: "Tu es un expert en optimisation fiscale française avec 20 ans d experience specialise dans les startups et plateformes numeriques. Tu conseilles Jacques Lalou fondateur d AcadémIA Pro. Tu donnes des conseils fiscaux precis chiffres et actionables conformes au droit fiscal francais en vigueur. Tu rappelles de consulter un expert-comptable pour les decisions importantes." },
                          historique: []
                        }),
                      });
                      const data = await res.json();
                      setDocGenere(data.reply || "");
                      await fetch(`${SUPABASE_URL}/rest/v1/documents_juridiques`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
                        body: JSON.stringify({ type: "fiscal", titre: item.titre, contenu: data.reply, statut: "genere" }),
                      });
                      chargerDocuments();
                      setGenerationLoading(false);
                    }}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", minWidth: "100px" }}
                  >
                    Analyser
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>💡 Conseil Fiscal Rapide</h3>
              <div>
              <div style={{ minHeight: "150px", maxHeight: "250px", overflowY: "auto", marginBottom: "10px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
                  Utilisez l onglet Conseil IA pour poser vos questions fiscales.
                </p>
              </div>
              <button
                onClick={() => setOnglet("conseil")}
                style={{ width: "100%", padding: "10px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Aller au Conseil IA
              </button>
            </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function InpiDossierBouton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("contact@academiapro.fr");

  async function genererEtEnvoyer() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/inpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "Dossier envoyé ✅");
    } catch (e) {
      setMessage("Erreur - réessayez");
    }
    setLoading(false);
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", marginBottom: "10px", textAlign: "center", fontSize: "14px", boxSizing: "border-box" as any }}
      />
      <button
        onClick={genererEtEnvoyer}
        disabled={loading}
        style={{ width: "100%", padding: "14px", background: "#050508", color: "#c8a96e", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "⏳ Génération en cours (2-3 min)..." : "📧 Générer et Envoyer par Email"}
      </button>
      {message && <p style={{ color: "#fff", marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}

export default function MrJuridiquePage() {
  const [onglet, setOnglet] = useState("conseil");
  const [documents, setDocuments] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [docSelectionne, setDocSelectionne] = useState<any>(null);
  const [docGenere, setDocGenere] = useState("");
  const [generationLoading, setGenerationLoading] = useState(false);

  useEffect(() => { chargerDocuments(); }, []);

  async function chargerDocuments() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/documents_juridiques?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
  }

  async function genererDocument(doc: any) {
    setGenerationLoading(true);
    setDocGenere("");
    const res = await fetch("/api/admin/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: doc.prompt,
        agent: {
          prompt: "Tu es Mr Juridique, juriste d entreprise senior avec 20 ans d experience en droit francais des affaires specialise dans les plateformes numeriques et la formation professionnelle. Tu generes des documents juridiques complets et conformes au droit francais en vigueur. Tes documents sont professionnels et directement utilisables."
        },
        historique: []
      }),
    });
    const data = await res.json();
    const contenu = data.reply || "";
    setDocGenere(contenu);

    // Sauvegarder dans Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/documents_juridiques`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify({ type: doc.id, titre: doc.label, contenu, statut: "genere" }),
    });
    chargerDocuments();
    setGenerationLoading(false);
  }

  async function envoyerMessage() {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    const res = await fetch("/api/admin/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        agent: {
          prompt: "Tu es Mr Juridique, juriste d entreprise senior avec 20 ans d experience en droit francais des affaires. Tu conseilles Jacques Lalou, fondateur d AcadémIA Pro, plateforme de formation et bien-etre 100% IA. Tu maitrises le droit des societes, les contrats, CGV, RGPD, INPI, droit de la formation professionnelle. Tu donnes des conseils pratiques et precis adaptes a AcadémIA Pro. Tu structures tes reponses clairement."
        },
        historique: chat
      }),
    });
    const data = await res.json();
    setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    setLoading(false);
  }

  function imprimerDocument() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docSelectionne?.label}</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;line-height:1.8;}
      h1,h2,h3{color:#c8a96e;} hr{border-color:#c8a96e;}</style></head><body>
      <h1>${docSelectionne?.label}</h1>
      <p style="color:#666;">AcadémIA Pro - Jacques Lalou - ${new Date().toLocaleDateString("fr-FR")}</p>
      <hr/>
      ${docGenere.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/# (.+)/g,"<h2>$1</h2>").replace(/\n/g,"<br/>")}
      </body></html>`);
      win.document.close();
      win.print();
    }
  }

  const onglets = [
    { id: "conseil", label: "💬 Conseil IA" },
    { id: "generation", label: "📄 Générer Documents" },
    { id: "bibliotheque", label: "📚 Bibliothèque" },
    { id: "upload", label: "📎 Upload Documents" },
    { id: "inpi", label: "🏛️ Protection Marque INPI" },
    { id: "fiscal", label: "💰 Optimisation Fiscale" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>⚖️ Mr Juridique</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>Juriste d Entreprise Senior - AcadémIA Pro</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "1000px", margin: "0 auto" }}>

        {onglet === "conseil" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>💬 Conseil Juridique</h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "500px", overflowY: "auto", marginBottom: "15px" }}>
              {chat.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                  Bonjour Jacques. Je suis Mr Juridique. Posez votre question juridique.
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={msg.role === "agent" ? { __html: formatReponse(msg.text) } : undefined}
                  >
                    {msg.role === "user" ? msg.text : undefined}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>Mr Juridique analyse...</div>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Ex: Comment protéger ma marque AcadémIA Pro ?" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyerMessage()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
              <button onClick={envoyerMessage} disabled={loading} style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Envoyer
              </button>
            </div>
          </div>
        )}

        {onglet === "generation" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>📄 Générer Documents Juridiques</h2>
            {docGenere ? (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                  <button onClick={() => setDocGenere("")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>← Retour</button>
                  <button onClick={imprimerDocument} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Imprimer / PDF</button>
                </div>
                <div style={{ background: "#fff", borderRadius: "12px", padding: "30px", color: "#1a1a1a" }}>
                  <h2 style={{ color: "#c8a96e" }}>{docSelectionne?.label}</h2>
                  <p style={{ color: "#666", fontSize: "13px" }}>AcadémIA Pro - Jacques Lalou - {new Date().toLocaleDateString("fr-FR")}</p>
                  <hr style={{ borderColor: "#c8a96e" }} />
                  <div dangerouslySetInnerHTML={{ __html: formatReponse(docGenere) }} style={{ lineHeight: "1.8" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {DOCUMENTS_TYPES.map(doc => (
                  <div key={doc.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif" }}>{doc.label}</h3>
                    </div>
                    <button
                      onClick={() => { setDocSelectionne(doc); genererDocument(doc); }}
                      disabled={generationLoading}
                      style={{ padding: "10px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {generationLoading && docSelectionne?.id === doc.id ? "Génération..." : "Générer"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === "bibliotheque" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>📚 Bibliothèque Juridique ({documents.length})</h2>
            {documents.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>
                Aucun document généré pour l instant. Allez dans Générer Documents.
              </p>
            ) : (
              documents.map(d => (
                <div key={d.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif" }}>{d.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => { setDocSelectionne({ label: d.titre }); setDocGenere(d.contenu); setOnglet("generation"); }}
                    style={{ padding: "8px 16px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Voir / Imprimer
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {onglet === "upload" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>📎 Upload Documents Juridiques</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>Contrats reçus - Statuts - Courriers officiels - Documents INPI</p>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <input type="file" accept="image/*,.pdf" style={{ color: "#fff", width: "100%", marginBottom: "15px" }} />
              <input type="text" placeholder="Description du document" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "15px", boxSizing: "border-box" as any }} />
              <button style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                📤 Uploader
              </button>
            </div>
          </div>
        )}


        {onglet === "inpi" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "10px" }}>
              🏛️ Protection Marque INPI
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Mr Juridique prépare votre dossier de dépôt de marque AcadémIA Pro
            </p>


            <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", borderRadius: "12px", padding: "25px", marginBottom: "25px", textAlign: "center" }}>
              <h3 style={{ color: "#fff", margin: "0 0 10px", fontFamily: "Georgia,serif" }}>
                🚀 Générer et Envoyer le Dossier Complet
              </h3>
              <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "15px", fontSize: "14px" }}>
                Mr Juridique génère les 4 documents - les compile - les envoie par email
              </p>
              <InpiDossierBouton />
            </div>
            <div style={{ display: "grid", gap: "15px", marginBottom: "30px" }}>
              {[
                {
                  titre: "Analyse et Classes INPI",
                  description: "Identifier les bonnes classes pour AcadémIA Pro",
                  prompt: "En tant que Mr Juridique expert en propriété intellectuelle, analyse la marque AcadémIA Pro et détermine les classes INPI à déposer. AcadémIA Pro est une plateforme de formation professionnelle 100% IA et de bien-être thérapeutique. Liste les classes pertinentes avec leur numéro, description et justification. Inclus le coût estimé du dépôt et les délais."
                },
                {
                  titre: "Description de la Marque",
                  description: "Rédiger la description officielle pour l INPI",
                  prompt: "Rédige la description officielle de la marque AcadémIA Pro pour un dépôt INPI. La marque désigne une plateforme de formation professionnelle en ligne 100% intelligence artificielle et de séances thérapeutiques avec avatars IA. Inclus : dénomination - nature de la marque - liste précise des produits et services par classe - caractère distinctif."
                },
                {
                  titre: "Guide Dépôt INPI Étape par Étape",
                  description: "Procédure complète pour déposer sur inpi.fr",
                  prompt: "Explique à Jacques Lalou fondateur d AcadémIA Pro comment déposer sa marque sur inpi.fr étape par étape. Inclus : création compte INPI - remplissage formulaire - choix classes - paiement - délais - que faire après le dépôt - comment surveiller les oppositions - renouvellement tous les 10 ans."
                },
                {
                  titre: "NDA Protection Avant Dépôt",
                  description: "Accord de confidentialité pour protéger avant le dépôt",
                  prompt: "Génère un NDA spécifique pour protéger la marque et le concept AcadémIA Pro avant le dépôt INPI. Inclus : définition du concept protégé - obligations de confidentialité - durée - sanctions - droit applicable français."
                },
                {
                  titre: "Surveillance et Défense de Marque",
                  description: "Comment surveiller et défendre AcadémIA Pro",
                  prompt: "Explique à Jacques Lalou comment surveiller sa marque AcadémIA Pro après le dépôt INPI et comment la défendre en cas de contrefaçon. Inclus : outils de surveillance - délai opposition 2 mois - mise en demeure - procédures judiciaires - dommages et intérêts - coûts estimés."
                },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div>
                    <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif" }}>{item.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{item.description}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setOnglet("generation");
                      setDocSelectionne({ label: item.titre });
                      setGenerationLoading(true);
                      setDocGenere("");
                      const res = await fetch("/api/admin/agent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: item.prompt,
                          agent: { prompt: "Tu es Mr Juridique, juriste expert en propriété intellectuelle et droit des affaires français avec 20 ans d experience. Tu conseilles Jacques Lalou fondateur d AcadémIA Pro. Tu donnes des conseils précis et pratiques conformes au droit français en vigueur." },
                          historique: []
                        }),
                      });
                      const data = await res.json();
                      setDocGenere(data.reply || "");
                      await fetch(`${SUPABASE_URL}/rest/v1/documents_juridiques`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
                        body: JSON.stringify({ type: "inpi", titre: item.titre, contenu: data.reply, statut: "genere" }),
                      });
                      chargerDocuments();
                      setGenerationLoading(false);
                    }}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", minWidth: "100px" }}
                  >
                    Générer
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>💡 Informations Clés INPI</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {[
                  { label: "Coût dépôt", valeur: "190€ / classe" },
                  { label: "Durée protection", valeur: "10 ans renouvelable" },
                  { label: "Délai traitement", valeur: "6 mois environ" },
                  { label: "Classes recommandées", valeur: "41 - 42 - 44" },
                  { label: "Délai opposition", valeur: "2 mois après publication" },
                  { label: "Site officiel", valeur: "inpi.fr" },
                ].map(item => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{item.label}</div>
                    <div style={{ color: "#c8a96e", fontWeight: "bold", marginTop: "3px" }}>{item.valeur}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: 0, marginTop: "15px" }}>
                ⚠️ Le dépôt final se fait sur inpi.fr - Mr Juridique prépare votre dossier complet
              </p>
            </div>
          </div>
        )}


        {onglet === "fiscal" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "10px" }}>
              💰 Agent Optimisation Fiscale
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Conseils personnalisés pour optimiser la fiscalité d AcadémIA Pro
            </p>

            <div style={{ display: "grid", gap: "15px", marginBottom: "30px" }}>
              {[
                {
                  titre: "Micro-entreprise vs SASU - Quel régime choisir ?",
                  description: "Analyse comparative selon votre CA prévisionnel",
                  prompt: "En tant qu expert en optimisation fiscale française, analyse pour Jacques Lalou fondateur d AcadémIA Pro : quand passer de micro-entreprise à SASU ? Inclus les seuils de CA, avantages fiscaux de chaque structure, cotisations sociales, optimisation rémunération gérant, dividendes, charges déductibles. Donne des exemples chiffrés pour un CA de 50000€ - 100000€ - 200000€."
                },
                {
                  titre: "Charges Déductibles AcadémIA Pro",
                  description: "Toutes les charges déductibles pour votre activité",
                  prompt: "Liste exhaustive des charges déductibles fiscalement pour AcadémIA Pro, plateforme IA de formation et bien-être. Inclus : abonnements API Claude - HeyGen - ElevenLabs - Daily.co - Vercel - Supabase - Resend - OVH - matériel iPad - domaines - formations - frais bancaires - honoraires - marketing. Précise les règles de déductibilité et les justificatifs nécessaires."
                },
                {
                  titre: "Holding LLC + SAS - Optimisation Structurelle",
                  description: "Stratégie holding pour maximiser les économies fiscales",
                  prompt: "Explique à Jacques Lalou la stratégie optimale d une structure Holding LLC américaine + SAS française pour AcadémIA Pro. Inclus : avantages fiscaux - dividendes - optimisation IS - protection patrimoine - coûts de mise en place - délais - risques - quand mettre en place cette structure selon le CA."
                },
                {
                  titre: "TVA - Stratégie et Anticipation",
                  description: "Préparer le passage à la TVA au bon moment",
                  prompt: "Conseille Jacques Lalou sur la gestion de la TVA pour AcadémIA Pro. Inclus : seuils de franchise 2026 - moment optimal pour opter volontairement - TVA sur formations exonérées - TVA sur thérapie - récupération TVA sur achats - impact sur les prix affichés - stratégie prix HT vs TTC."
                },
                {
                  titre: "Plan d Épargne et Protection Sociale",
                  description: "Optimiser sa protection sociale en tant que fondateur",
                  prompt: "Conseille Jacques Lalou fondateur d AcadémIA Pro sur l optimisation de sa protection sociale et épargne. Inclus : PER - Madelin - complémentaire santé - prévoyance - retraite complémentaire - cotisations TNS - optimisation revenus - arbitrage salaire vs dividendes en SASU."
                },
                {
                  titre: "Rapport Fiscal Annuel Personnalisé",
                  description: "Bilan fiscal complet et recommandations",
                  prompt: "Génère un rapport fiscal annuel personnalisé pour AcadémIA Pro de Jacques Lalou. Structure : situation fiscale actuelle - optimisations réalisées - optimisations à mettre en place - économies potentielles estimées - planning fiscal sur 3 ans - recommandations prioritaires. Adapte à une micro-entreprise en phase de lancement avec ambition de scaling."
                },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div>
                    <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{item.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{item.description}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setOnglet("generation");
                      setDocSelectionne({ label: item.titre });
                      setGenerationLoading(true);
                      setDocGenere("");
                      const res = await fetch("/api/admin/agent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: item.prompt,
                          agent: { prompt: "Tu es un expert en optimisation fiscale française avec 20 ans d experience specialise dans les startups et plateformes numeriques. Tu conseilles Jacques Lalou fondateur d AcadémIA Pro. Tu donnes des conseils fiscaux precis chiffres et actionables conformes au droit fiscal francais en vigueur. Tu rappelles de consulter un expert-comptable pour les decisions importantes." },
                          historique: []
                        }),
                      });
                      const data = await res.json();
                      setDocGenere(data.reply || "");
                      await fetch(`${SUPABASE_URL}/rest/v1/documents_juridiques`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
                        body: JSON.stringify({ type: "fiscal", titre: item.titre, contenu: data.reply, statut: "genere" }),
                      });
                      chargerDocuments();
                      setGenerationLoading(false);
                    }}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", minWidth: "100px" }}
                  >
                    Analyser
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>💡 Conseil Fiscal Rapide</h3>
              <div>
              <div style={{ minHeight: "150px", maxHeight: "250px", overflowY: "auto", marginBottom: "10px" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
                  Utilisez l onglet Conseil IA pour poser vos questions fiscales.
                </p>
              </div>
              <button
                onClick={() => setOnglet("conseil")}
                style={{ width: "100%", padding: "10px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Aller au Conseil IA
              </button>
            </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
