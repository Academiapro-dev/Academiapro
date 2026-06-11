export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("tous");
  const [contacts, setContacts] = React.useState([
    {
      id: 1,
      nom: "Sophie Marchand",
      email: "sophie.marchand@email.com",
      formations: ["Python Avancé", "Machine Learning"],
      statut: "VIP",
      score: 98,
      derniereInteraction: "2024-01-15",
    },
    {
      id: 2,
      nom: "Thomas Dubois",
      email: "thomas.dubois@email.com",
      formations: ["JavaScript ES6"],
      statut: "client",
      score: 74,
      derniereInteraction: "2024-01-12",
    },
    {
      id: 3,
      nom: "Amélie Laurent",
      email: "amelie.laurent@email.com",
      formations: [],
      statut: "lead",
      score: 32,
      derniereInteraction: "2024-01-10",
    },
    {
      id: 4,
      nom: "Marc Fontaine",
      email: "marc.fontaine@email.com",
      formations: ["Data Science"],
      statut: "prospect",
      score: 55,
      derniereInteraction: "2024-01-08",
    },
    {
      id: 5,
      nom: "Isabelle Renard",
      email: "isabelle.renard@email.com",
      formations: ["React", "Next.js", "TypeScript"],
      statut: "VIP",
      score: 95,
      derniereInteraction: "2024-01-14",
    },
    {
      id: 6,
      nom: "Pierre Moreau",
      email: "pierre.moreau@email.com",
      formations: ["Python Avancé"],
      statut: "client",
      score: 68,
      derniereInteraction: "2024-01-11",
    },
    {
      id: 7,
      nom: "Claire Petit",
      email: "claire.petit@email.com",
      formations: [],
      statut: "lead",
      score: 18,
      derniereInteraction: "2024-01-06",
    },
    {
      id: 8,
      nom: "Antoine Bernard",
      email: "antoine.bernard@email.com",
      formations: ["Machine Learning"],
      statut: "prospect",
      score: 47,
      derniereInteraction: "2024-01-09",
    },
  ]);

  const [showModal, setShowModal] = React.useState(false);
  const [newContact, setNewContact] = React.useState({
    nom: "",
    email: "",
    formations: "",
    statut: "lead",
    score: 0,
  });
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = React.useState<string | null>(null);

  const statutColors: Record<string, { bg: string; color: string; border: string }> = {
    lead: { bg: "rgba(100, 116, 139, 0.2)", color: "#94a3b8", border: "rgba(100, 116, 139, 0.4)" },
    prospect: { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.35)" },
    client: { bg: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "rgba(34, 197, 94, 0.35)" },
    VIP: { bg: "rgba(200, 169, 110, 0.15)", color: "#c8a96e", border: "rgba(200, 169, 110, 0.4)" },
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#c8a96e";
    if (score >= 60) return "#4ade80";
    if (score >= 40) return "#60a5fa";
    return "#94a3b8";
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchSearch =
      contact.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = activeFilter === "tous" || contact.statut === activeFilter;
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const headers = ["Nom", "Email", "Formations", "Statut", "Score", "Dernière Interaction"];
    const rows = filteredContacts.map((c) => [
      c.nom,
      c.email,
      c.formations.join("; "),
      c.statut,
      c.score.toString(),
      c.derniereInteraction,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_academia_pro.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const addContact = () => {
    if (!newContact.nom || !newContact.email) return;
    const contact = {
      id: contacts.length + 1,
      nom: newContact.nom,
      email: newContact.email,
      formations: newContact.formations ? newContact.formations.split(",").map((f) => f.trim()) : [],
      statut: newContact.statut,
      score: Number(newContact.score),
      derniereInteraction: new Date().toISOString().split("T")[0],
    };
    setContacts([...contacts, contact]);
    setShowModal(false);
    setNewContact({ nom: "", email: "", formations: "", statut: "lead", score: 0 });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statsCounts = {
    tous: contacts.length,
    lead: contacts.filter((c) => c.statut === "lead").length,
    prospect: contacts.filter((c) => c.statut === "prospect").length,
    client: contacts.filter((c) => c.statut === "client").length,
    VIP: contacts.filter((c) => c.statut === "VIP").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e2e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(200, 169, 110, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(200, 169, 110, 0.03) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              ◈
            </div>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "#c8a96e",
                  opacity: 0.8,
                }}
              >
                AcadémIA Pro · CRM
              </span>
            </div>
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: "0 0 6px 0",
              background: "linear-gradient(135deg, #ffffff 0%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Gestion des Contacts
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            {contacts.length} contacts · {statsCounts.VIP} VIP · {statsCounts.client} clients actifs
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Contacts", value: statsCounts.tous, icon: "👥", color: "#c8a96e" },
            { label: "Clients Actifs", value: statsCounts.client, icon: "✅", color: "#4ade80" },
            { label: "Prospects", value: statsCounts.prospect, icon: "🎯", color: "#60a5fa" },
            { label: "Contacts VIP", value: statsCounts.VIP, icon: "⭐", color: "#c8a96e" },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "20px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "22px" }}>{stat.icon}</span>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: stat.color,
                    boxShadow: `0 0 8px ${stat.color}`,
                  }}
                />
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color, marginBottom: "4px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "16px",
                  pointerEvents: "none",
                }}
              >
                ⌕
              </span>
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 42px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(200, 169, 110, 0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["tous", "lead", "prospect", "client", "VIP"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: activeFilter === filter ? "1px solid rgba(200, 169, 110, 0.5)" : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: activeFilter === filter ? "rgba(200, 169, 110, 0.15)" : "rgba(255,255,255,0.03)",
                    color: activeFilter === filter ? "#c8a96e" : "#64748b",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>{filter}</span>
                  <span
                    style={{
                      backgroundColor: activeFilter === filter ? "rgba(200, 169, 110, 0.25)" : "rgba(255,255,255,0.08)",
                      color: activeFilter === filter ? "#c8a96e" : "#64748b",
                      borderRadius: "6px",
                      padding: "1px 7px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    {statsCounts[filter as keyof typeof statsCounts]}
                  </span>
                </button>