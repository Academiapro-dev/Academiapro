"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const BADGES_LISTE = [
  { id: "pioneer", icon: "🚀", nom: "Pionnier", desc: "Premier inscrit AcadémIA Pro", xp: 100, color: "#D4AF37" },
  { id: "first_formation", icon: "🎓", nom: "Premiere Formation", desc: "Premiere formation completee", xp: 200, color: "#22c55e" },
  { id: "streak_7", icon: "🔥", nom: "Semaine de Feu", desc: "7 jours de connexion consecutive", xp: 150, color: "#ef4444" },
  { id: "streak_30", icon: "⚡", nom: "Mois Eclair", desc: "30 jours de connexion consecutive", xp: 500, color: "#f59e0b" },
  { id: "expert_ia", icon: "🤖", nom: "Expert IA", desc: "Pack IA complet termine", xp: 1000, color: "#8b5cf6" },
  { id: "therapeute", icon: "💆", nom: "Bien-Etre", desc: "5 seances therapeutiques", xp: 300, color: "#3b82f6" },
  { id: "certifie", icon: "🏆", nom: "Certifie", desc: "Premier certificat obtenu", xp: 400, color: "#c8a96e" },
  { id: "polyglotte", icon: "🌍", nom: "Polyglotte", desc: "3 formations langues completees", xp: 600, color: "#22c55e" },
  { id: "assidu", icon: "📚", nom: "Assidu", desc: "10 formations completees", xp: 800, color: "#D4AF37" },
  { id: "master", icon: "👑", nom: "Master AcadémIA", desc: "20 formations completees", xp: 2000, color: "#D4AF37" },
];

const NIVEAUX = [
  { niveau: 1, nom: "Debutant", xp_min: 0, xp_max: 500, color: "#666" },
  { niveau: 2, nom: "Apprenti", xp_min: 500, xp_max: 1500, color: "#22c55e" },
  { niveau: 3, nom: "Praticien", xp_min: 1500, xp_max: 3000, color: "#3b82f6" },
  { niveau: 4, nom: "Expert", xp_min: 3000, xp_max: 6000, color: "#8b5cf6" },
  { niveau: 5, nom: "Master", xp_min: 6000, xp_max: 10000, color: "#D4AF37" },
  { niveau: 6, nom: "Grand Master", xp_min: 10000, xp_max: 999999, color: "#ef4444" },
];

export default function GamificationPage() {
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState("profil");
  const [classement, setClassement] = useState<any[]>([]);

  const EMAIL_TEST = "contact@academiapro.fr";

  useEffect(() => { chargerProfil(); }, []);

  async function chargerProfil() {
    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gamification?user_email=eq.${EMAIL_TEST}&select=*`,
      { headers: h }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setProfil(data[0]);
    } else {
      await creerProfil();
    }
    const classRes = await fetch(
      `${SUPABASE_URL}/rest/v1/gamification?select=*&order=xp.desc&limit=10`,
      { headers: h }
    );
    const classData = await classRes.json();
    setClassement(Array.isArray(classData) ? classData : []);
    setLoading(false);
  }

  async function creerProfil() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gamification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        user_email: EMAIL_TEST,
        xp: 250,
        niveau: 1,
        badges: ["pioneer", "certifie"],
        streak: 3,
        derniere_connexion: new Date().toISOString().split("T")[0],
        formations_completees: ["F128"],
      }),
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) setProfil(data[0]);
  }

  async function gagnerXP(montant: number, raison: string) {
    if (!profil) return;
    const nouvelXP = (profil.xp || 0) + montant;
    const nouveauNiveau = NIVEAUX.find(n => nouvelXP >= n.xp_min && nouvelXP < n.xp_max)?.niveau || 1;
    await fetch(`${SUPABASE_URL}/rest/v1/gamification?id=eq.${profil.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ xp: nouvelXP, niveau: nouveauNiveau }),
    });
    alert(`+${montant} XP pour : ${raison}`);
    chargerProfil();
  }

  const niveauActuel = profil ? (NIVEAUX.find(n => profil.xp >= n.xp_min && profil.xp < n.xp_max) || NIVEAUX[0]) : NIVEAUX[0];
  const prochainNiveau = NIVEAUX[niveauActuel.niveau] || niveauActuel;
  const progressPct = profil ? Math.min(100, ((profil.xp - niveauActuel.xp_min) / (prochainNiveau.xp_min - niveauActuel.xp_min)) * 100) : 0;
  const badgesDebloques = profil ? (Array.isArray(profil.badges) ? profil.badges : []) : [];

  const onglets = [
    { id: "profil", label: "👤 Mon Profil" },
    { id: "badges", label: "🏅 Badges" },
    { id: "classement", label: "🏆 Classement" },
    { id: "actions", label: "⚡ Gagner XP" },
  ];

  if (loading) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>⚡ Gamification AcadémIA Pro</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>XP · Badges · Niveaux · Classement</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "900px", margin: "0 auto" }}>

        {onglet === "profil" && profil && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#1a1a2e,#0d0d25)", border: "2px solid #c8a96e", borderRadius: "16px", padding: "30px", marginBottom: "25px", textAlign: "center" }}>
              <div style={{ fontSize: "60px", marginBottom: "10px" }}>
                {niveauActuel.niveau === 6 ? "👑" : niveauActuel.niveau === 5 ? "⭐" : niveauActuel.niveau === 4 ? "🔥" : niveauActuel.niveau === 3 ? "💎" : niveauActuel.niveau === 2 ? "🌟" : "🎯"}
              </div>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 5px" }}>{profil.user_email}</h2>
              <div style={{ color: niveauActuel.color, fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>
                Niveau {niveauActuel.niveau} — {niveauActuel.nom}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "15px", marginBottom: "25px" }}>
                {[
                  { label: "XP Total", valeur: profil.xp?.toLocaleString(), color: "#c8a96e" },
                  { label: "Streak", valeur: `${profil.streak} jours 🔥`, color: "#ef4444" },
                  { label: "Badges", valeur: badgesDebloques.length, color: "#D4AF37" },
                ].map(item => (
                  <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "15px" }}>
                    <div style={{ color: item.color, fontSize: "22px", fontWeight: "bold" }}>{item.valeur}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{niveauActuel.nom}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{prochainNiveau.nom}</span>
                </div>
                <div style={{ height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "5px" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${niveauActuel.color}, #c8a96e)`, borderRadius: "5px", width: `${progressPct}%`, transition: "width 0.5s" }} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "5px", textAlign: "right" }}>
                  {profil.xp} / {prochainNiveau.xp_min} XP
                </div>
              </div>
            </div>

            <h3 style={{ color: "#c8a96e", marginBottom: "15px" }}>Badges Débloqués</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {badgesDebloques.map((badgeId: string) => {
                const badge = BADGES_LISTE.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                  <div key={badgeId} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${badge.color}40`, borderRadius: "10px", padding: "12px 16px", textAlign: "center", minWidth: "80px" }}>
                    <div style={{ fontSize: "28px" }}>{badge.icon}</div>
                    <div style={{ color: badge.color, fontSize: "11px", fontWeight: "bold", marginTop: "5px" }}>{badge.nom}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {onglet === "badges" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>🏅 Tous les Badges</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
              {BADGES_LISTE.map(badge => {
                const debloque = badgesDebloques.includes(badge.id);
                return (
                  <div key={badge.id} style={{ background: debloque ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${debloque ? badge.color : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", padding: "20px", display: "flex", gap: "15px", alignItems: "center", opacity: debloque ? 1 : 0.5 }}>
                    <div style={{ fontSize: "40px", filter: debloque ? "none" : "grayscale(100%)" }}>{badge.icon}</div>
                    <div>
                      <div style={{ color: debloque ? badge.color : "rgba(255,255,255,0.4)", fontWeight: "bold", fontSize: "14px" }}>{badge.nom}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "3px 0" }}>{badge.desc}</div>
                      <div style={{ color: "#c8a96e", fontSize: "11px" }}>+{badge.xp} XP</div>
                    </div>
                    {debloque && <div style={{ marginLeft: "auto", color: "#22c55e", fontSize: "20px" }}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {onglet === "classement" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>🏆 Classement Global</h2>
            {classement.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun apprenant pour le moment</p>
            ) : (
              classement.map((user, i) => {
                const niv = NIVEAUX.find(n => user.xp >= n.xp_min && user.xp < n.xp_max) || NIVEAUX[0];
                return (
                  <div key={user.id} style={{ background: i === 0 ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "#D4AF37" : "rgba(200,169,110,0.2)"}`, borderRadius: "10px", padding: "15px 20px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ color: i === 0 ? "#D4AF37" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.4)", fontSize: "20px", fontWeight: "bold", minWidth: "30px" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: "bold" }}>{user.user_email}</div>
                      <div style={{ color: niv.color, fontSize: "12px" }}>Niveau {niv.niveau} — {niv.nom}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "18px" }}>{user.xp?.toLocaleString()} XP</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{Array.isArray(user.badges) ? user.badges.length : 0} badges</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {onglet === "actions" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "10px" }}>⚡ Gagner des XP</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px" }}>Actions qui rapportent des points</p>
            <div style={{ display: "grid", gap: "12px" }}>
              {[
                { action: "Completer un module de formation", xp: 50, icon: "📚" },
                { action: "Completer une formation entiere", xp: 200, icon: "🎓" },
                { action: "Obtenir un certificat", xp: 400, icon: "🏆" },
                { action: "Participer a une classe virtuelle", xp: 100, icon: "🎥" },
                { action: "Realiser une seance therapeutique", xp: 75, icon: "💆" },
                { action: "Connexion quotidienne", xp: 10, icon: "📅" },
                { action: "Partager un certificat LinkedIn", xp: 150, icon: "💼" },
                { action: "Recommander AcadémIA Pro", xp: 300, icon: "🤝" },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "25px" }}>{item.icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{item.action}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ color: "#c8a96e", fontWeight: "bold" }}>+{item.xp} XP</span>
                    <button
                      onClick={() => gagnerXP(item.xp, item.action)}
                      style={{ padding: "6px 14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                    >
                      Simuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
