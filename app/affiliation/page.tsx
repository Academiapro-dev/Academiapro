"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function AffiliationPage() {
  const [onglet, setOnglet] = useState("presentation");
  const [form, setForm] = useState({ nom: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [affilies, setAffilies] = useState<any[]>([]);

  useEffect(() => {
    if (onglet === "admin") chargerAffilies();
  }, [onglet]);

  async function chargerAffilies() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/affilies?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    setAffilies(Array.isArray(data) ? data : []);
  }

  async function sinscrire() {
    if (!form.nom || !form.email) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      const code = "AFF-" + form.nom.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) + "-" + Date.now().toString(36).toUpperCase().slice(-4);
      const res = await fetch("/api/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code_affiliation: code }),
      });
      const data = await res.json();
      if (data.success) {
        setSucces({ ...form, code });
      } else {
        setErreur(data.message || "Erreur inscription");
      }
    } catch (e) {
      setErreur("Erreur connexion");
    }
    setLoading(false);
  }

  const onglets = [
    { id: "presentation", label: "Programme" },
    { id: "inscription", label: "Rejoindre" },
    { id: "admin", label: "Admin Affilies" },
  ];

  const AVANTAGES = [
    { icon: "💰", titre: "20% de commission", desc: "Sur chaque vente generee par votre lien unique" },
    { icon: "🔗", titre: "Lien unique", desc: "Un lien personnalise trackable en temps reel" },
    { icon: "📊", titre: "Tableau de bord", desc: "Suivi de vos clics · ventes · gains en direct" },
    { icon: "💳", titre: "Paiement mensuel", desc: "Virement automatique chaque mois via Stripe" },
    { icon: "🎓", titre: "Formation offerte", desc: "Une formation AcadémIA Pro offerte a l inscription" },
    { icon: "🚀", titre: "Support dedie", desc: "Accompagnement et materiels marketing fournis" },
  ];

  const EXEMPLES = [
    { ventes: 5, formation: "Formation 490€", gains: 490 },
    { ventes: 10, formation: "Formation 690€", gains: 1380 },
    { ventes: 20, formation: "Pack IA 990€", gains: 3960 },
  ];

  if (succes) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "550px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            Bienvenue dans le programme !
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "25px" }}>
            {succes.nom}, votre compte affilie est cree avec succes.
          </p>
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "25px", marginBottom: "25px" }}>
            <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Votre lien d affiliation</h3>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px", marginBottom: "10px", fontFamily: "monospace", color: "#fff", fontSize: "13px", wordBreak: "break-all" }}>
              academiapro.vercel.app/?ref={succes.code}
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "3px" }}>Votre code</div>
              <div style={{ color: "#D4AF37", fontWeight: "bold", fontSize: "18px", letterSpacing: "2px" }}>{succes.code}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "25px" }}>
            {[
              { label: "Commission", valeur: "20%" },
              { label: "Clics", valeur: "0" },
              { label: "Gains", valeur: "0€" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "18px" }}>{item.valeur}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <a href="/" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            Retour a l accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "4px", marginBottom: "15px" }}>PROGRAMME PARTENAIRE</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "15px" }}>
          Gagnez avec AcadémIA Pro
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "0 auto 25px" }}>
          Recommandez AcadémIA Pro et gagnez 20% de commission sur chaque vente. Revenus passifs · Paiement mensuel.
        </p>
        <div style={{ display: "inline-flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>20% de commission</span>
          <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>Paiement mensuel</span>
          <span style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>Formation offerte</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", justifyContent: "center" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>

        {onglet === "presentation" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "30px" }}>
              Pourquoi rejoindre notre programme ?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "50px" }}>
              {AVANTAGES.map((av, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
                  <div style={{ fontSize: "35px", marginBottom: "12px" }}>{av.icon}</div>
                  <h3 style={{ color: "#c8a96e", margin: "0 0 8px", fontFamily: "Georgia,serif" }}>{av.titre}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>{av.desc}</p>
                </div>
              ))}
            </div>

            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "25px" }}>
              Combien pouvez-vous gagner ?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "15px", marginBottom: "40px" }}>
              {EXEMPLES.map((ex, i) => (
                <div key={i} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "5px" }}>{ex.ventes} ventes de {ex.formation}</div>
                  <div style={{ color: "#D4AF37", fontSize: "28px", fontWeight: "bold" }}>{ex.gains}€</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "3px" }}>de gains</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => setOnglet("inscription")}
                style={{ padding: "16px 40px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "18px", cursor: "pointer" }}>
                Rejoindre le programme
              </button>
            </div>
          </div>
        )}

        {onglet === "inscription" && (
          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "25px" }}>
              Devenir Affilie AcadémIA Pro
            </h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "35px" }}>
              {erreur && (
                <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                  {erreur}
                </div>
              )}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre nom complet</label>
                <input type="text" placeholder="Prenom Nom" value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
              </div>
              <div style={{ marginBottom: "25px" }}>
                <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre email</label>
                <input type="email" placeholder="vous@exemple.fr" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
              </div>
              <button onClick={sinscrire} disabled={loading}
                style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                {loading ? "Creation en cours..." : "Creer mon compte affilie"}
              </button>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "15px" }}>
                Gratuit · Formation offerte · Commission 20% · Paiement mensuel
              </p>
            </div>
          </div>
        )}

        {onglet === "admin" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              Affilies ({affilies.length})
            </h2>
            {affilies.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun affilie pour le moment</p>
            ) : (
              affilies.map(af => (
                <div key={af.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ color: "#fff", margin: "0 0 4px", fontFamily: "Georgia,serif" }}>{af.nom}</h3>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{af.email}</div>
                    <div style={{ color: "#c8a96e", fontSize: "12px", fontFamily: "monospace", marginTop: "3px" }}>{af.code_affiliation}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "15px", textAlign: "center" }}>
                    {[
                      { label: "Clics", valeur: af.total_clics },
                      { label: "Ventes", valeur: af.total_ventes },
                      { label: "Gains", valeur: `${af.total_gains}€` },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "16px" }}>{item.valeur}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
