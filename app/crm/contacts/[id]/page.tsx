export default function ContactPage({ params }: { params: { id: string } }) {
  const contact = {
    id: params.id,
    nom: "Sophie Marchand",
    email: "sophie.marchand@email.com",
    telephone: "+33 6 12 34 56 78",
    avatar: "SM",
    statut: "Client Premium",
    score: 87,
    dateCreation: "15 janvier 2024",
    derniereActivite: "Il y a 2 heures",
    formations: [
      { id: 1, titre: "Marketing Digital Avancé", prix: 890, date: "12 Jan 2024", statut: "Terminé", progression: 100 },
      { id: 2, titre: "Leadership & Management", prix: 1200, date: "03 Mar 2024", statut: "En cours", progression: 65 },
      { id: 3, titre: "Intelligence Artificielle", prix: 1500, date: "20 Avr 2024", statut: "Inscrit", progression: 0 },
    ],
    seances: [
      { id: 1, titre: "Coaching individuel - Stratégie", date: "18 Avr 2024", heure: "14h00", duree: "1h", coach: "Marc Dubois", statut: "Confirmé" },
      { id: 2, titre: "Session groupe - IA", date: "22 Avr 2024", heure: "10h00", duree: "2h", coach: "Julie Martin", statut: "En attente" },
      { id: 3, titre: "Coaching individuel - Leadership", date: "10 Avr 2024", heure: "16h00", duree: "1h", coach: "Marc Dubois", statut: "Terminé" },
    ],
    historique: [
      { id: 1, type: "email", message: "Envoi devis formation IA", date: "20 Avr 2024", heure: "09:32", auteur: "Admin" },
      { id: 2, type: "appel", message: "Appel de suivi - satisfaction formation Marketing", date: "18 Avr 2024", heure: "14:15", auteur: "Marc D." },
      { id: 3, type: "achat", message: "Achat formation Intelligence Artificielle (1500€)", date: "15 Avr 2024", heure: "11:08", auteur: "Système" },
      { id: 4, type: "note", message: "Contact très engagé, potentiel upsell formation Leadership+", date: "12 Avr 2024", heure: "16:45", auteur: "Julie M." },
      { id: 5, type: "email", message: "Newsletter avril ouverte (3 clics)", date: "08 Avr 2024", heure: "08:21", auteur: "Système" },
    ],
    notes: "Sophie est une cliente très active et engagée. Intéressée par les certifications professionnelles. Budget annuel estimé autour de 5000€. Préfère les sessions en matinée. Travaille dans une PME tech à Lyon.",
    tags: ["Premium", "Tech", "Lyon", "Certification"],
    valeurTotale: 3590,
  };

  const scoreColor = contact.score >= 80 ? "#4ade80" : contact.score >= 60 ? "#c8a96e" : "#f87171";

  const statutColor = (s: string) => {
    if (s === "Terminé") return "#4ade80";
    if (s === "En cours") return "#c8a96e";
    if (s === "Inscrit") return "#60a5fa";
    if (s === "Confirmé") return "#4ade80";
    if (s === "En attente") return "#c8a96e";
    return "#94a3b8";
  };

  const typeIcon = (t: string) => {
    if (t === "email") return "✉";
    if (t === "appel") return "☎";
    if (t === "achat") return "💳";
    if (t === "note") return "📝";
    return "•";
  };

  const typeColor = (t: string) => {
    if (t === "email") return "#60a5fa";
    if (t === "appel") return "#4ade80";
    if (t === "achat") return "#c8a96e";
    if (t === "note") return "#a78bfa";
    return "#94a3b8";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif", padding: "0" }}>

      <div style={{ background: "linear-gradient(180deg, #0d0d14 0%, #050508 100%)", borderBottom: "1px solid #1a1a2e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "#050508" }}>A</div>
          <span style={{ fontSize: "18px", fontWeight: "700", background: "linear-gradient(135deg, #c8a96e, #e8c98e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AcadémIA Pro</span>
          <span style={{ color: "#334155", margin: "0 8px" }}>›</span>
          <span style={{ color: "#64748b", fontSize: "14px" }}>CRM</span>
          <span style={{ color: "#334155", margin: "0 8px" }}>›</span>
          <span style={{ color: "#e2e8f0", fontSize: "14px" }}>{contact.nom}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ padding: "8px 16px", backgroundColor: "transparent", border: "1px solid #1e293b", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>← Retour</button>
          <button style={{ padding: "8px 20px", background: "linear-gradient(135deg, #c8a96e, #a07840)", border: "none", borderRadius: "8px", color: "#050508", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>✏ Modifier</button>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ background: "linear-gradient(135deg, #0d0d18 0%, #0a0a14 100%)", border: "1px solid #1a1a2e", borderRadius: "20px", padding: "32px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)", borderRadius: "50%", transform: "translate(50px, -100px)" }}></div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #c8a96e, #a07840)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800", color: "#050508", flexShrink: 0, boxShadow: "0 8px 32px rgba(200,169,110,0.3)" }}>{contact.avatar}</div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#f1f5f9" }}>{contact.nom}</h1>
                <span style={{ padding: "4px 12px", background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>{contact.statut}</span>
              </div>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>✉ {contact.email}</span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>☎ {contact.telephone}</span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>📅 Depuis le {contact.dateCreation}</span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>⏱ {contact.derniereActivite}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {contact.tags.map((tag, i) => (
                  <span key={i} style={{ padding: "3px 10px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "11px", color: "#94a3b8" }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", padding: "20px 28px", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#c8a96e", lineHeight: 1 }}>{contact.valeurTotale.toLocaleString()}€</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Valeur totale</div>
              </div>
              <div style={{ textAlign: "center", padding: "20px 28px", background: contact.score >= 80 ? "rgba(74,222,128,0.08)" : "rgba(200,169,110,0.08)", border: `1px solid ${scoreColor}33`, borderRadius: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: scoreColor, lineHeight: 1 }}>{contact.score}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Score CRM</div>
                <div style={{ width: "80px", height: "4px", backgroundColor: "#1e293b", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
                  <div style={{ width: `${contact.score}%`, height: "100%", backgroundColor: scoreColor, borderRadius: "2px", transition: "width 1s ease" }}></div>
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "20px 28px", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#60a5fa", lineHeight: 1 }}>{contact.formations.length}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Formations</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

          <div style={{ background: "linear-gradient(135deg, #0d0d18 0%, #0a0a14 100%)", border: "1px solid #1a1a2e", borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#f1f5f9" }}>🎓 Formations achetées</h2>
              <span style={{ padding: "4px 10px", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#64748b" }}>{contact.formations.length} formations</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {contact.formations.map((f) => (
                <div key={f.id} style={{ padding: "16px", backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: "12px", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0", marginBottom: "4px" }}>{f.titre}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>📅 {f.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#c8a96e" }}>{f.prix}€</div>
                      <span style={{ padding: "2px 8px", backgroundColor: `${statutColor(f.statut)}22`, border: `1px solid ${statutColor(f.statut)}44`, borderRadius: "8px", fontSize: "11px", color: statutColor(f.statut) }}>{f.statut}</span>
                    </div>
                  </div>
                  {f.progression > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Progression</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{f.progression}%