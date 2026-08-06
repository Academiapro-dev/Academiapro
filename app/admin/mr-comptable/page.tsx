"use client";
import { useState, useEffect } from "react";

function euros(m: number, devise?: string) {
  const n = Number(m) || 0;
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + (devise === "USD" ? "USD" : "€");
}

function UploadDocument({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ categorie: "", description: "", montant: "", date: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [analyse, setAnalyse] = useState("");

  const CATEGORIES = [
    "Abonnements logiciels", "API et services cloud", "Marketing et publicité",
    "Formation et documentation", "Matériel informatique", "Frais bancaires",
    "Téléphone et internet", "Frais de déplacement", "Carburant",
    "Repas et restaurants", "Honoraires experts", "Autres",
  ];

  async function uploadDocument() {
    if (!file) { setMessage("Sélectionnez un fichier"); return; }
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
        setMessage("✅ Document déposé et enregistré.");
        if (data.analyse) setAnalyse(data.analyse);
        setFile(null);
        setForm({ categorie: "", description: "", montant: "", date: "" });
        onSuccess();
      } else {
        setMessage("❌ Erreur au dépôt.");
      }
    } catch (e) {
      setMessage("❌ Erreur de connexion.");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "8px" }}>
          📄 Sélectionner un document (photo · PDF · image)
        </label>
        <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={{ color: "#fff", width: "100%" }} />
        {file && <p style={{ color: "#c8a96e", fontSize: "12px", marginTop: "5px" }}>✅ {file.name}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
        <div>
          <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Catégorie</label>
          <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
            <option value="">Choisir…</option>
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
          <input type="text" placeholder="Ex : abonnement Claude" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
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
        {loading ? "Dépôt en cours…" : "📤 Déposer et enregistrer"}
      </button>
      {message && <p style={{ color: message.includes("✅") ? "#22c55e" : "#ef4444", marginTop: "10px", textAlign: "center" }}>{message}</p>}
      {analyse && (
        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "15px", marginTop: "15px" }}>
          <p style={{ color: "#c8a96e", fontWeight: "bold", marginTop: 0 }}>🤖 Analyse de Mr. Comptable</p>
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
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string, text: string }[]>([]);

  useEffect(() => { chargerDonnees(); }, []);

  // Lecture cote serveur : la cle publique ne voit rien, la securite de la
  // base la bloque. C etait la cause des zeros affiches partout.
  async function chargerDonnees() {
    setErreur("");
    try {
      const r = await fetch("/api/admin/compta-lecture", { cache: "no-store" });
      const d = await r.json();
      if (!d.ok) { setErreur(d.erreur || "Lecture impossible."); return; }
      setFactures(d.factures || []);
      setDepenses(d.depenses || []);
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  const totalFactures = factures.reduce((s, f) => s + (Number(f.montant_ttc) || Number(f.montant) || 0), 0);
  const totalDepenses = depenses.reduce((s, d) => s + (Number(d.montant_ttc) || 0), 0);
  const totalTva = depenses.reduce((s, d) => s + (Number(d.montant_tva) || 0), 0);
  const resultatNet = totalFactures - totalDepenses;
  const avances = depenses.filter(d => d.avance_perso && !d.rembourse).reduce((s, d) => s + (Number(d.montant_ttc) || 0), 0);

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
          prompt: `Tu es Mr Comptable, expert-comptable senior pour AcadémIA Pro.
Produits enregistres : ${euros(totalFactures)}
Depenses enregistrees : ${euros(totalDepenses)}
TVA figurant sur les depenses : ${euros(totalTva)}
Resultat : ${euros(resultatNet)}
Avances personnelles non remboursees : ${euros(avances)}
Nombre de factures : ${factures.length} - Nombre de depenses : ${depenses.length}
Tu donnes des conseils precis fondes sur ces chiffres reels. Tu rappelles que la LLC est une societe americaine, pas une micro-entreprise francaise.`
        },
        historique: chat
      }),
    });
    const data = await res.json();
    setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    setLoading(false);
  }

  const onglets = [
    { id: "dashboard", label: "📊 Tableau de bord" },
    { id: "depenses", label: "💸 Dépenses" },
    { id: "bilan", label: "📋 Compte de résultat" },
    { id: "conseil", label: "💬 Conseil" },
    { id: "documents", label: "📎 Déposer un justificatif" },
  ];

  const CARTE: any = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" };

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>📊 Mr. Comptable</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>Lecture de la comptabilité · AcadémIA Pro</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "1000px", margin: "0 auto" }}>

        {erreur && <p style={{ color: "#ef4444" }}>{erreur}</p>}

        {onglet === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
              {[
                { label: "Produits", valeur: euros(totalFactures), icon: "💰", color: "#22c55e" },
                { label: "Dépenses", valeur: euros(totalDepenses), icon: "💸", color: "#ef4444" },
                { label: "Résultat", valeur: euros(resultatNet), icon: "📈", color: resultatNet >= 0 ? "#22c55e" : "#ef4444" },
                { label: "TVA sur les dépenses", valeur: euros(totalTva), icon: "🧾", color: "#f59e0b" },
                { label: "Avances non remboursées", valeur: euros(avances), icon: "🤝", color: "#c8a96e" },
                { label: "Dépenses enregistrées", valeur: String(depenses.length), icon: "📝", color: "#c8a96e" },
              ].map(item => (
                <div key={item.label} style={CARTE}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: "20px", fontWeight: "bold" }}>{item.valeur}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Où saisir</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                Cet écran est en lecture seule. La saisie des dépenses se fait sur{" "}
                <a href="/admin/comptabilite" style={{ color: "#c8a96e" }}>Dépenses et justificatifs</a>, et
                l'émission des factures sur <a href="/admin/facturation" style={{ color: "#c8a96e" }}>Facturation</a>.
              </p>
            </div>
          </div>
        )}

        {onglet === "depenses" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Dépenses ({depenses.length})</h2>
            {depenses.length === 0 && <p style={{ color: "rgba(255,255,255,0.5)" }}>Aucune dépense enregistrée.</p>}
            {depenses.map(d => (
              <div key={d.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div>
                  <div style={{ color: "#c8a96e", fontWeight: "bold" }}>{d.fournisseur} · {d.categorie}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{d.description}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                    {d.date_depense ? new Date(d.date_depense).toLocaleDateString("fr-FR") : "—"}
                    {Number(d.montant_tva) > 0 ? " · TVA " + euros(d.montant_tva, d.devise) : " · sans TVA"}
                    {d.avance_perso && !d.rembourse ? " · avance non remboursée" : ""}
                  </div>
                </div>
                <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "18px", whiteSpace: "nowrap" }}>
                  −{euros(d.montant_ttc, d.devise)}
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === "bilan" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Compte de résultat</h2>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "30px", color: "#1a1a1a" }}>
              <h2 style={{ color: "#c8a96e", textAlign: "center", borderBottom: "2px solid #c8a96e", paddingBottom: "10px" }}>
                AcadémIA Pro LLC — Compte de résultat
              </h2>
              <p style={{ textAlign: "center", color: "#666" }}>Exercice {new Date().getFullYear()}</p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                  <tr style={{ background: "#050508", color: "#fff" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>Poste</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#f0fdf4" }}>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>PRODUITS</td><td></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", paddingLeft: "20px" }}>Chiffre d'affaires</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>{euros(totalFactures)}</td>
                  </tr>
                  <tr style={{ background: "#fef2f2" }}>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>CHARGES</td><td></td>
                  </tr>
                  {Object.entries(depenses.reduce((acc: any, d) => { const c = d.categorie || "Autres"; acc[c] = (acc[c] || 0) + (Number(d.montant_ttc) || 0); return acc; }, {})).map(([cat, mont]: any) => (
                    <tr key={cat}>
                      <td style={{ padding: "10px", paddingLeft: "20px" }}>{cat}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#dc2626" }}>−{euros(mont)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f8f4ee", fontWeight: "bold", fontSize: "16px" }}>
                    <td style={{ padding: "12px" }}>RÉSULTAT</td>
                    <td style={{ padding: "12px", textAlign: "right", color: resultatNet >= 0 ? "#16a34a" : "#dc2626" }}>{euros(resultatNet)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "20px", padding: "15px", background: "#f8f4ee", borderRadius: "8px", fontSize: "13px", color: "#666" }}>
                <p style={{ margin: "0 0 6px" }}><strong>Note :</strong> document indicatif, produit à partir des écritures saisies.</p>
                <p style={{ margin: 0 }}>La liasse officielle se produit depuis Mr. Comptable — module comptabilité française.</p>
              </div>
            </div>
            <button onClick={() => window.print()} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "15px" }}>
              Imprimer ou exporter en PDF
            </button>
          </div>
        )}

        {onglet === "conseil" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>💬 Conseil</h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "450px", overflowY: "auto", marginBottom: "15px" }}>
              {chat.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                  Posez une question — il connaît vos chiffres en temps réel.
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>Analyse en cours…</div>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Ex : quel est mon résultat ce trimestre ?" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyerMessage()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
              <button onClick={envoyerMessage} disabled={loading} style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Envoyer
              </button>
            </div>
          </div>
        )}

        {onglet === "documents" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>📎 Déposer un justificatif</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Factures fournisseurs · tickets · frais · justificatifs
            </p>
            <UploadDocument onSuccess={chargerDonnees} />
          </div>
        )}

      </div>
    </div>
  );
}
