export default function AcademiaCRMDashboard() {
  const kpiData = [
    { label: "Total Contacts", value: "2,847", icon: "👥", color: "#c8a96e", change: "+12%" },
    { label: "Leads", value: "342", icon: "🎯", color: "#e8c987", change: "+8%" },
    { label: "Prospects", value: "189", icon: "🔍", color: "#c8a96e", change: "+15%" },
    { label: "Clients", value: "94", icon: "🏆", color: "#d4af37", change: "+5%" },
    { label: "CA Pipeline", value: "€847K", icon: "💰", color: "#c8a96e", change: "+23%" },
  ];

  const pipelineStages = [
    {
      stage: "Lead",
      count: 45,
      color: "#6e7fd4",
      deals: [
        { name: "Université Paris XI", value: "€12K", contact: "Marie Dupont" },
        { name: "École Centrale Lyon", value: "€8K", contact: "Jean Martin" },
        { name: "INSA Toulouse", value: "€15K", contact: "Sophie Bernard" },
      ],
    },
    {
      stage: "Qualification",
      count: 32,
      color: "#7dd4c8",
      deals: [
        { name: "HEC Paris", value: "€45K", contact: "Pierre Leroy" },
        { name: "Sciences Po", value: "€32K", contact: "Claire Moreau" },
        { name: "ESSEC Business", value: "€28K", contact: "Antoine Petit" },
      ],
    },
    {
      stage: "Proposition",
      count: 28,
      color: "#c8a96e",
      deals: [
        { name: "Polytechnique", value: "€78K", contact: "Lucas Dubois" },
        { name: "CentraleSupélec", value: "€56K", contact: "Emma Rousseau" },
        { name: "ENPC", value: "€34K", contact: "Hugo Blanc" },
      ],
    },
    {
      stage: "Négociation",
      count: 15,
      color: "#d4887a",
      deals: [
        { name: "Dauphine Paris", value: "€92K", contact: "Isabelle Garnier" },
        { name: "Paris-Sorbonne", value: "€67K", contact: "Thomas Faure" },
      ],
    },
    {
      stage: "Gagné",
      count: 8,
      color: "#7dc87d",
      deals: [
        { name: "EPFL Lausanne", value: "€125K", contact: "Nathalie Simon" },
        { name: "Grenoble INP", value: "€89K", contact: "Romain Laurent" },
      ],
    },
    {
      stage: "Perdu",
      count: 12,
      color: "#c87d7d",
      deals: [
        { name: "Université Bordeaux", value: "€23K", contact: "Céline Mercier" },
        { name: "Université Nantes", value: "€18K", contact: "David Girard" },
      ],
    },
  ];

  const recentActivities = [
    { type: "email", icon: "📧", text: "Email envoyé à HEC Paris", time: "Il y a 5 min", contact: "Pierre Leroy", color: "#c8a96e" },
    { type: "call", icon: "📞", text: "Appel avec Polytechnique", time: "Il y a 23 min", contact: "Lucas Dubois", color: "#7dd4c8" },
    { type: "meeting", icon: "🤝", text: "RDV confirmé Sciences Po", time: "Il y a 1h", contact: "Claire Moreau", color: "#d4af37" },
    { type: "proposal", icon: "📄", text: "Proposition envoyée CentraleSupélec", time: "Il y a 2h", contact: "Emma Rousseau", color: "#c8a96e" },
    { type: "won", icon: "🏆", text: "Contrat signé EPFL Lausanne", time: "Il y a 3h", contact: "Nathalie Simon", color: "#7dc87d" },
    { type: "note", icon: "📝", text: "Note ajoutée Dauphine Paris", time: "Il y a 4h", contact: "Isabelle Garnier", color: "#9d8fd4" },
  ];

  const tasks = [
    { title: "Préparer démo pour Polytechnique", priority: "haute", due: "Aujourd'hui 14h00", done: false, tag: "Demo" },
    { title: "Relire contrat EPFL", priority: "haute", due: "Aujourd'hui 16h00", done: false, tag: "Contrat" },
    { title: "Appeler Pierre Leroy HEC", priority: "moyenne", due: "Demain 09h00", done: false, tag: "Appel" },
    { title: "Envoyer plaquette INSA", priority: "basse", due: "Demain 11h00", done: true, tag: "Email" },
    { title: "Suivre proposition Sciences Po", priority: "moyenne", due: "Jeu 15 Nov", done: false, tag: "Suivi" },
    { title: "Réunion interne pipeline Q4", priority: "haute", due: "Ven 16 Nov", done: false, tag: "Réunion" },
  ];

  const relances = [
    { contact: "Jean Martin", company: "École Centrale Lyon", lastContact: "Il y a 7 jours", score: 85, action: "Email de suivi", urgent: true },
    { contact: "Antoine Petit", company: "ESSEC Business", lastContact: "Il y a 5 jours", score: 72, action: "Appel téléphonique", urgent: true },
    { contact: "Hugo Blanc", company: "ENPC", lastContact: "Il y a 4 jours", score: 68, action: "Envoyer proposition", urgent: false },
    { contact: "Thomas Faure", company: "Paris-Sorbonne", lastContact: "Il y a 3 jours", score: 91, action: "Négociation finale", urgent: false },
    { contact: "Romain Laurent", company: "Grenoble INP", lastContact: "Il y a 6 jours", score: 78, action: "Signature contrat", urgent: true },
  ];

  const priorityColors: Record<string, string> = {
    haute: "#e8524a",
    moyenne: "#c8a96e",
    basse: "#7dc87d",
  };

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a12 0%, #050508 50%, #080810 100%)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
            maxWidth: "1600px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #c8a96e, #d4af37)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 4px 20px rgba(200, 169, 110, 0.4)",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  background: "linear-gradient(90deg, #c8a96e, #e8d5a3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "#6b6b8a", marginTop: "-2px" }}>CRM Intelligence</div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "4px" }}>
            {["Dashboard", "Contacts", "Pipeline", "Rapports", "Paramètres"].map((item, i) => (
              <button
                key={item}
                style={{
                  background: i === 0 ? "rgba(200, 169, 110, 0.15)" : "transparent",
                  border: i === 0 ? "1px solid rgba(200, 169, 110, 0.3)" : "1px solid transparent",
                  color: i === 0 ? "#c8a96e" : "#8888aa",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: i === 0 ? "600" : "400",
                  transition: "all 0.2s",
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                position: "relative",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                borderRadius: "10px",
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#6b6b8a" }}>🔍</span>
              <span style={{ fontSize: "13px", color: "#44445a" }}>Rechercher...</span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid rgba(200, 169, 110, 0.15)",
                position: "relative",
              }}
            >
              🔔
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  background: "#e8524a",
                  borderRadius: "50%",
                  border: "1.5px solid #050508",
                }}
              />
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #c8a96e, #d4af37)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#050508",
                cursor: "pointer",
              }}
            >
              AL
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "28px 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "700",
                margin: "0 0 4px 0",
                background: "linear-gradient(90deg, #ffffff, #c8c8e0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tableau de bord
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b6b8a" }}>
              Lundi 13 Novembre 2024 · Période: Q4 2024
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(200, 169, 110, 0.2)",
                color: "#c8a96e",
                padding: "9px 18px",
                borderRadius: "9px",
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Exporter
            </button>
            <button
              style={{
                background: "linear-gradient(135deg, #c8a96e, #d4af37)",
                border: "none",
                color: "#050508",
                padding: "9px 18px",
                borderRadius: "9px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ➕ Nouveau Contact
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {kpiData.map((kpi, index) => (
            <div
              key={index}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(200, 169, 110, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px