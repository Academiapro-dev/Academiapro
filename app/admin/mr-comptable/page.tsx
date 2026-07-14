"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const CATEGORIES_DEPENSES = [
  "Abonnements logiciels",
  "API et services cloud",
  "Marketing et publicité",
  "Formation et documentation",
  "Matériel informatique",
  "Frais bancaires",
  "Téléphone et internet",
  "Frais de déplacement",
  "Honoraires experts",
  "Autres",
];

function formatMontant(m: number) {
  return m.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}


function UploadDocument({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ categorie: "", description: "", montant: "", date: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [analyse, setAnalyse] = useState("");

  const CATEGORIES = [
    "Abonnements logiciels", "API et services cloud", "Marketing et publicité",
    "Formation et documentation", "Matériel informatique", "Frais bancaires",
    "Téléphone et internet", "Frais de déplacement", "Carburant",
    "Repas et restaurants", "Honoraires experts", "Autres",
  ];

  async function uploadDocument() {
    if (!file) { setMessage("Sélectionnez un fichier"); return; }
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("categorie", form.categorie);
    fd.append("description", form.description || file.name);
    fd.append("montant", form.montant);
    fd.append("date", form.date);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Document uploadé et enregistré !");
        if (data.analyse) setAnalyse(data.analyse);
        setFile(null);
        setForm({ categorie: "", description: "", montant: "", date: "" });
        onSuccess();
      } else {
        setMessage("❌ Erreur upload");
      }
    } catch (e) {
      setMessage("❌ Erreur connexion");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>
          📄 Sélectionner un document (photo · PDF · image)
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ color: "#fff", width: "100%" }}
        />
        {file && <p style={{ color: "#c8a96e", fontSize: "12px", marginTop: "5px" }}>✅ {file.name}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
        <div>
          <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Catégorie</label>
          <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
            <option value="">Choisir...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Montant (€)</label>
          <input type="number" placeholder="0.00" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
        </div>
        <div>
          <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Description</label>
          <input type="text" placeholder="Ex: Frais carburant" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
        </div>
        <div>
          <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
        </div>
      </div>
      <button onClick={uploadDocument} disabled={loading || !file}
        style={{ width: "100%", padding: "12px", background: file ? "#c8a96e" : "rgba(200,169,110,0.3)", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: file ? "pointer" : "not-allowed" }}>
        {loading ? "Upload en cours..." : "📤 Uploader et enregistrer"}
      </button>
      {message && <p style={{ color: message.includes("✅") ? "#22c55e" : "#ef4444", marginTop: "10px", textAlign: "center" }}>{message}</p>}
      {analyse && (
        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "15px", marginTop: "15px" }}>
          <p style={{ color: "#c8a96e", fontWeight: "bold", marginTop: 0 }}>🤖 Analyse Mr Comptable :</p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{analyse}</p>
        </div>
      )}
    </div>
  );
}

export default function MrComptablePage() {
  const [onglet, setOnglet] = useState("dashboard");
  const [factures, setFactures] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);

  // Formulaires
  const [nouvelleDepense, setNouvelleDepense] = useState({ date: "", description: "", montant: "", categorie: "" });
  const [nouvelleFacture, setNouvelleFacture] = useState({ numero: "", client: "", description: "", montant: "" });
  const [factureHtml, setFactureHtml] = useState("");
  const [rapprochement, setRapprochement] = useState({ periode: "", date_debut: "", date_fin: "", solde_banque: "" });

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [f, d] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/factures?select=*&order=created_at.desc`, { cache: "no-store",  headers }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/depenses?select=*&order=created_at.desc`, { cache: "no-store",  headers }).then(r => r.json()),
    ]);
    setFactures(Array.isArray(f) ? f : []);
    setDepenses(Array.isArray(d) ? d : []);
  }

  const totalFactures = factures.reduce((s, f) => s + (parseFloat(f.montant) || 0), 0);
  const totalDepenses = depenses.reduce((s, d) => s + (parseFloat(d.montant) || 0), 0);
  const resultatNet = totalFactures - totalDepenses;
  const cotisationsURSSAF = totalFactures * 0.214;

  async function ajouterDepense() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/depenses`, { cache: "no-store", 
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify(nouvelleDepense),
    });
    if (res.ok) {
      setNouvelleDepense({ date: "", description: "", montant: "", categorie: "" });
      chargerDonnees();
      alert("Dépense enregistrée ✅");
    }
  }

  async function genererFacture() {
    const res = await fetch("/api/admin/facture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nouvelleFacture),
    });
    const data = await res.json();
    if (data.facture_html) {
      // Sauvegarder dans Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/factures`, { cache: "no-store", 
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({ ...nouvelleFacture, montant: parseFloat(nouvelleFacture.montant), statut: "emise", html: data.facture_html, date: new Date().toLocaleDateString("fr-FR") }),
      });
      setFactureHtml(data.facture_html);
      chargerDonnees();
    }
  }

  async function genererRapprochement() {
    const ecart = parseFloat(rapprochement.solde_banque) - resultatNet;
    const details = `Période : ${rapprochement.periode}\nSolde bancaire : ${rapprochement.solde_banque}€\nSolde comptable : ${resultatNet.toFixed(2)}€\nÉcart : ${ecart.toFixed(2)}€`;
    await fetch(`${SUPABASE_URL}/rest/v1/rapprochements`, { cache: "no-store", 
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify({ ...rapprochement, solde_comptable: resultatNet, ecart, statut: ecart === 0 ? "equilibre" : "ecart", details }),
    });
    alert(`Rapprochement enregistré ✅\nÉcart : ${ecart.toFixed(2)}€`);
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
          prompt: `Tu es Mr Comptable, expert-comptable senior pour AcadémIA Pro. 
CA total : ${formatMontant(totalFactures)}
Dépenses : ${formatMontant(totalDepenses)}
Résultat net : ${formatMontant(resultatNet)}
Cotisations URSSAF estimées : ${formatMontant(cotisationsURSSAF)}
Nombre de factures : ${factures.length}
Tu donnes des conseils précis basés sur ces chiffres réels.`
        },
        historique: chat
      }),
    });
    const data = await res.json();
    setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    setLoading(false);
  }

  if (factureHtml) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", padding: "20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setFactureHtml("")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Retour</button>
            <button onClick={() => { const w = window.open("","_blank"); w?.document.write(factureHtml); w?.document.close(); w?.print(); }} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Imprimer / PDF
            </button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: factureHtml }} style={{ background: "#fff", borderRadius: "12px", padding: "20px" }} />
        </div>
      </div>
    );
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "factures", label: "🧾 Factures" },
    { id: "depenses", label: "💸 Dépenses" },
    { id: "rapprochement", label: "🏦 Rapprochement" },
    { id: "bilan", label: "📋 Bilan" },
    { id: "conseil", label: "💬 Conseil IA" },
    { id: "documents", label: "📎 Documents" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>📊 Mr Comptable</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>Expert-Comptable Senior · AcadémIA Pro</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "1000px", margin: "0 auto" }}>

        {onglet === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
              {[
                { label: "Chiffre d Affaires", valeur: formatMontant(totalFactures), icon: "💰", color: "#22c55e" },
                { label: "Dépenses", valeur: formatMontant(totalDepenses), icon: "💸", color: "#ef4444" },
                { label: "Résultat Net", valeur: formatMontant(resultatNet), icon: "📈", color: resultatNet >= 0 ? "#22c55e" : "#ef4444" },
                { label: "URSSAF estimé", valeur: formatMontant(cotisationsURSSAF), icon: "🏛️", color: "#f59e0b" },
                { label: "Factures émises", valeur: factures.length.toString(), icon: "🧾", color: "#c8a96e" },
                { label: "Dépenses enreg.", valeur: depenses.length.toString(), icon: "📝", color: "#c8a96e" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: "20px", fontWeight: "bold" }}>{item.valeur}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>📅 Prochaines échéances URSSAF</h3>
              <p style={{ color: "rgba(255,255,255,0.7)" }}>Déclaration trimestrielle · Cotisations estimées : <strong style={{ color: "#c8a96e" }}>{formatMontant(cotisationsURSSAF)}</strong></p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Taux micro-entreprise services : 21,4% du CA</p>
            </div>
          </div>
        )}

        {onglet === "factures" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Nouvelle Facture</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              {[
                { label: "N° Facture", key: "numero", placeholder: "F2026-001" },
                { label: "Client", key: "client", placeholder: "Nom du client" },
                { label: "Description", key: "description", placeholder: "Formation Expert Claude" },
                { label: "Montant (€)", key: "montant", placeholder: "690" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(nouvelleFacture as any)[f.key]} onChange={e => setNouvelleFacture(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={genererFacture} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginBottom: "30px" }}>
              Générer la Facture PDF
            </button>
            <h3 style={{ color: "#c8a96e" }}>Historique ({factures.length})</h3>
            {factures.map(f => (
              <div key={f.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#c8a96e", fontWeight: "bold" }}>{f.numero}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{f.client} · {f.description}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{f.date}</div>
                </div>
                <div style={{ color: "#22c55e", fontWeight: "bold", fontSize: "18px" }}>{formatMontant(parseFloat(f.montant))}</div>
              </div>
            ))}
          </div>
        )}

        {onglet === "depenses" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Nouvelle Dépense</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Date</label>
                <input type="date" value={nouvelleDepense.date} onChange={e => setNouvelleDepense(p => ({ ...p, date: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Catégorie</label>
                <select value={nouvelleDepense.categorie} onChange={e => setNouvelleDepense(p => ({ ...p, categorie: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" }}>
                  <option value="">Choisir...</option>
                  {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Description</label>
                <input type="text" placeholder="Ex: Abonnement Claude API" value={nouvelleDepense.description} onChange={e => setNouvelleDepense(p => ({ ...p, description: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Montant (€)</label>
                <input type="number" placeholder="0.00" value={nouvelleDepense.montant} onChange={e => setNouvelleDepense(p => ({ ...p, montant: e.target.value }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }} />
              </div>
            </div>
            <button onClick={ajouterDepense} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginBottom: "30px" }}>
              Enregistrer la Dépense
            </button>
            <h3 style={{ color: "#c8a96e" }}>Historique ({depenses.length})</h3>
            {depenses.map(d => (
              <div key={d.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#c8a96e", fontWeight: "bold" }}>{d.categorie}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{d.description}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{d.date}</div>
                </div>
                <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "18px" }}>-{formatMontant(parseFloat(d.montant))}</div>
              </div>
            ))}
          </div>
        )}

        {onglet === "rapprochement" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Rapprochement Bancaire</h2>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Solde Comptable Actuel</h3>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: resultatNet >= 0 ? "#22c55e" : "#ef4444" }}>{formatMontant(resultatNet)}</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>CA {formatMontant(totalFactures)} - Dépenses {formatMontant(totalDepenses)}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              {[
                { label: "Période", key: "periode", placeholder: "T1 2026 · Janvier-Mars" },
                { label: "Solde bancaire (€)", key: "solde_banque", placeholder: "0.00" },
                { label: "Date début", key: "date_debut", placeholder: "01/01/2026" },
                { label: "Date fin", key: "date_fin", placeholder: "31/03/2026" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(rapprochement as any)[f.key]} onChange={e => setRapprochement(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={genererRapprochement} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Générer le Rapprochement
            </button>
          </div>
        )}

        {onglet === "bilan" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Bilan Annuel</h2>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "30px", color: "#1a1a1a" }}>
              <h2 style={{ color: "#c8a96e", textAlign: "center", borderBottom: "2px solid #c8a96e", paddingBottom: "10px" }}>
                AcadémIA Pro — Compte de Résultat
              </h2>
              <p style={{ textAlign: "center", color: "#666" }}>Période : {new Date().getFullYear()}</p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                  <tr style={{ background: "#050508", color: "#fff" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>Poste</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#f0fdf4" }}>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>PRODUITS</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", paddingLeft: "20px" }}>Chiffre d Affaires</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>{formatMontant(totalFactures)}</td>
                  </tr>
                  <tr style={{ background: "#fef2f2" }}>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>CHARGES</td>
                    <td></td>
                  </tr>
                  {Object.entries(depenses.reduce((acc: any, d) => { acc[d.categorie] = (acc[d.categorie] || 0) + parseFloat(d.montant); return acc; }, {})).map(([cat, mont]: any) => (
                    <tr key={cat}>
                      <td style={{ padding: "10px", paddingLeft: "20px" }}>{cat}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#dc2626" }}>-{formatMontant(mont)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: "10px", paddingLeft: "20px" }}>Cotisations URSSAF</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#dc2626" }}>-{formatMontant(cotisationsURSSAF)}</td>
                  </tr>
                  <tr style={{ background: "#f8f4ee", fontWeight: "bold", fontSize: "16px" }}>
                    <td style={{ padding: "12px" }}>RÉSULTAT NET</td>
                    <td style={{ padding: "12px", textAlign: "right", color: resultatNet >= 0 ? "#16a34a" : "#dc2626" }}>
                      {formatMontant(resultatNet - cotisationsURSSAF)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "20px", padding: "15px", background: "#f8f4ee", borderRadius: "8px", fontSize: "13px", color: "#666" }}>
                <p><strong>Note :</strong> Ce bilan est préparé par Mr Comptable IA à titre indicatif.</p>
                <p>Pour validation officielle, transmettez ce document à votre expert-comptable.</p>
              </div>
            </div>
            <button onClick={() => window.print()} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "15px" }}>
              Imprimer / Exporter PDF
            </button>
          </div>
        )}

        {onglet === "conseil" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>💬 Conseil Mr Comptable</h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "450px", overflowY: "auto", marginBottom: "15px" }}>
              {chat.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                  Posez une question à Mr Comptable — il connaît vos chiffres en temps réel.
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>Mr Comptable analyse...</div>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Ex: Quel est mon résultat ce trimestre ?" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyerMessage()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
              <button onClick={envoyerMessage} disabled={loading} style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Envoyer
              </button>
            </div>
          </div>
        )}


        {onglet === "documents" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              📎 Upload Documents Comptables
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Factures fournisseurs · Tickets · Frais · Justificatifs
            </p>
            <UploadDocument onSuccess={chargerDonnees} />
          </div>
        )}

      </div>
    </div>
  );
}
