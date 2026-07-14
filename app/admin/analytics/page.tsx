"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    inscrits: 0,
    formations: 0,
    seances: 0,
    certificats: 0,
    visites: 0,
  });
  const [listeAttente, setListeAttente] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { chargerStats(); }, []);

  async function chargerStats() {
    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    try {
      const [inscrits, formations, certificats] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/liste_attente?select=*&order=created_at.desc`, { cache: "no-store",  headers: h }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/formations?select=code,titre,prix&limit=10&order=created_at.desc`, { cache: "no-store",  headers: h }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/analytics?select=*&order=created_at.desc&limit=50`, { cache: "no-store",  headers: h }).then(r => r.json()),
      ]);
      setListeAttente(Array.isArray(inscrits) ? inscrits : []);
      setStats({
        inscrits: Array.isArray(inscrits) ? inscrits.length : 0,
        formations: 235,
        seances: 0,
        certificats: 0,
        visites: Array.isArray(certificats) ? certificats.length : 0,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const INTERETS_COUNT = listeAttente.reduce((acc: any, item) => {
    if (item.interet) acc[item.interet] = (acc[item.interet] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>📊 Analytics AcadémIA Pro</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>Tableau de bord en temps réel</p>
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px", marginBottom: "35px" }}>
          {[
            { label: "Liste Attente", valeur: stats.inscrits, icon: "👥", color: "#22c55e", desc: "Inscrits prioritaires" },
            { label: "Formations", valeur: stats.formations, icon: "🎓", color: "#c8a96e", desc: "Catalogue actif" },
            { label: "Certificats", valeur: stats.certificats, icon: "🏆", color: "#D4AF37", desc: "Délivrés" },
            { label: "Séances IA", valeur: stats.seances, icon: "💆", color: "#3b82f6", desc: "Thérapeutiques" },
            { label: "CA Prévisionnel", valeur: "0€", icon: "💰", color: "#f59e0b", desc: "En attente Stripe" },
            { label: "Taux Conversion", valeur: "0%", icon: "📈", color: "#8b5cf6", desc: "Visiteurs → Inscrits" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: item.color, fontSize: "24px", fontWeight: "bold" }}>{loading ? "..." : item.valeur}</div>
              <div style={{ color: "#fff", fontSize: "13px", fontWeight: "bold", marginTop: "3px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0, marginBottom: "20px" }}>
              👥 Liste Attente — {listeAttente.length} inscrits
            </h2>
            {listeAttente.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)" }}>Aucun inscrit pour le moment</p>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {listeAttente.map((item, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: "14px", fontWeight: "bold" }}>{item.nom}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{item.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#c8a96e", fontSize: "11px" }}>{item.interet}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
                        {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0, marginBottom: "20px" }}>
              🎯 Intérêts des Inscrits
            </h2>
            {Object.keys(INTERETS_COUNT).length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)" }}>Aucune donnée pour le moment</p>
            ) : (
              Object.entries(INTERETS_COUNT)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([interet, count]: any) => (
                  <div key={interet} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{interet}</span>
                      <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold" }}>{count}</span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                      <div style={{ height: "100%", background: "#c8a96e", borderRadius: "3px", width: `${(count / listeAttente.length) * 100}%` }} />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", marginBottom: "25px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0, marginBottom: "20px" }}>
            🚀 Roadmap Lancement
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
            {[
              { etape: "Micro-entreprise URSSAF", statut: "En cours", color: "#f59e0b", icon: "⏳" },
              { etape: "Stripe paiements", statut: "En attente SIRET", color: "#666", icon: "💳" },
              { etape: "Domaine academiapro.fr", statut: "En attente", color: "#666", icon: "🌐" },
              { etape: "HeyGen avatar", statut: "En attente", color: "#666", icon: "🤖" },
              { etape: "Daily.co visio", statut: "En attente", color: "#666", icon: "🎥" },
              { etape: "Lancement officiel", statut: "Bientot", color: "#22c55e", icon: "🚀" },
            ].map(item => (
              <div key={item.etape} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${item.color}40`, borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                <div style={{ fontSize: "25px", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ color: "#fff", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>{item.etape}</div>
                <div style={{ color: item.color, fontSize: "11px", fontWeight: "bold" }}>{item.statut}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
          <h3 style={{ color: "#c8a96e", marginTop: 0 }}>📧 Contacter la Liste Attente</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "15px", fontSize: "14px" }}>
            {listeAttente.length} personnes attendent le lancement — envoyez-leur une mise a jour !
          </p>
          <button
            onClick={() => alert("Fonctionnalité email masse disponible après lancement Stripe")}
            style={{ padding: "12px 30px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            Envoyer un email a tous les inscrits
          </button>
        </div>

      </div>
    </div>
  );
}
