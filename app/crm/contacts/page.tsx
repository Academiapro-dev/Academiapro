import { useState } from "react";

const contacts = [
  { id: 1, nom: "Sophie Martin", email: "sophie.martin@email.com", statut: "Client", score: 92, derniere: "2024-01-15" },
  { id: 2, nom: "Thomas Dubois", email: "thomas.dubois@email.com", statut: "Prospect", score: 67, derniere: "2024-01-12" },
  { id: 3, nom: "Marie Leroy", email: "marie.leroy@email.com", statut: "Lead", score: 45, derniere: "2024-01-10" },
  { id: 4, nom: "Pierre Bernard", email: "pierre.bernard@email.com", statut: "Client", score: 88, derniere: "2024-01-14" },
  { id: 5, nom: "Julie Moreau", email: "julie.moreau@email.com", statut: "Inactif", score: 23, derniere: "2023-12-20" },
  { id: 6, nom: "Antoine Petit", email: "antoine.petit@email.com", statut: "Prospect", score: 71, derniere: "2024-01-13" },
  { id: 7, nom: "Claire Rousseau", email: "claire.rousseau@email.com", statut: "Client", score: 95, derniere: "2024-01-16" },
  { id: 8, nom: "Lucas Simon", email: "lucas.simon@email.com", statut: "Lead", score: 38, derniere: "2024-01-08" },
];

const statutColors: Record<string, { bg: string; color: string }> = {
  Client: { bg: "rgba(200, 169, 110, 0.2)", color: "#c8a96e" },
  Prospect: { bg: "rgba(100, 160, 255, 0.2)", color: "#64a0ff" },
  Lead: { bg: "rgba(160, 100, 255, 0.2)", color: "#a064ff" },
  Inactif: { bg: "rgba(120, 120, 140, 0.2)", color: "#78788c" },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#c8a96e" : score >= 50 ? "#64a0ff" : "#78788c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "60px", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: score + "%", height: "100%", borderRadius: "3px", background: color, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 600, color: color, minWidth: "28px" }}>{score}</span>
    </div>
  );
}

export default function CRM() {
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [tri, setTri] = useState<{ col: string; asc: boolean }>({ col: "nom", asc: true });
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [hoverAdd, setHoverAdd] = useState(false);

  const statuts = ["Tous", "Client", "Prospect", "Lead", "Inactif"];

  const filtered = contacts
    .filter((c) => {
      const matchSearch =
        c.nom.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchStatut = filtreStatut === "Tous" || c.statut === filtreStatut;
      return matchSearch && matchStatut;
    })
    .sort((a, b) => {
      const aVal = a[tri.col as keyof typeof a];
      const bVal = b[tri.col as keyof typeof b];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return tri.asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return tri.asc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  function handleTri(col: string) {
    setTri((prev) => ({ col, asc: prev.col === col ? !prev.asc : true }));
  }

  function SortIcon({ col }: { col: string }) {
    if (tri.col !== col) return <span style={{ color: "rgba(200,169,110,0.3)", fontSize: "10px", marginLeft: "4px" }}>↕</span>;
    return <span style={{ color: "#c8a96e", fontSize: "10px", marginLeft: "4px" }}>{tri.asc ? "↑" : "↓"}</span>;
  }

  const colStyle = (col: string): React.CSSProperties => ({
    padding: "14px 16px",
    textAlign: "left" as const,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "rgba(200,169,110,0.7)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    borderBottom: "1px solid rgba(200,169,110,0.15)",
    background: "transparent",
    userSelect: "none" as const,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Inter', -apple-system, sans-serif", padding: "40px 32px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              Contacts
              <span style={{ marginLeft: "12px", fontSize: "14px", fontWeight: 400, color: "rgba(200,169,110,0.6)" }}>CRM</span>
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
              {filtered.length} contact{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 20px",
              background: hoverAdd ? "#d4b87a" : "#c8a96e",
              color: "#050508",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
              letterSpacing: "0.01em",
              boxShadow: hoverAdd ? "0 0 24px rgba(200,169,110,0.4)" : "0 0 16px rgba(200,169,110,0.2)",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
            Ajouter contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total", value: contacts.length, color: "#c8a96e" },
          { label: "Clients", value: contacts.filter(c => c.statut === "Client").length, color: "#c8a96e" },
          { label: "Prospects", value: contacts.filter(c => c.statut === "Prospect").length, color: "#64a0ff" },
          { label: "Score moyen", value: Math.round(contacts.reduce((a, c) => a + c.score, 0) / contacts.length), color: "#a064ff" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(200,169,110,0.1)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "220px", maxWidth: "360px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(200,169,110,0.5)", fontSize: "15px", pointerEvents: "none" }}>⊙</span>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(200,169,110,0.15)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box" as const,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(200,169,110,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(200,169,110,0.15)"; }}
          />
        </div>

        {/* Statut filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {statuts.map((s) => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: filtreStatut === s ? "1px solid rgba(200,169,110,0.6)" : "1px solid rgba(255,255,255,0.08)",
                background: filtreStatut === s ? "rgba(200,169,110,0.12)" : "rgba(255,255,255,0.03)",
                color: filtreStatut === s ? "#c8a96e" : "rgba(255,255,255,0.5)",
                fontSize: "13px",
                fontWeight: filtreStatut === s ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(200,169,110,0.12)",
        borderRadius: "16px",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr>
                <th style={colStyle("nom")} onClick={() => handleTri("nom")}>
                  Nom <SortIcon col="nom" />
                </th>
                <th style={colStyle("email")} onClick={() => handleTri("email")}>
                  Email <SortIcon col="email" />
                </th>
                <th style={colStyle("statut")} onClick={() => handleTri("statut")}>
                  Statut <SortIcon col="statut" />
                </th>
                <th style={colStyle("score")} onClick={() => handleTri("score")}>
                  Score <SortIcon col="score" />
                </th>
                <th style={colStyle("derniere")} onClick={() => handleTri("derniere")}>
                  Dernière interaction <SortIcon col="derniere" />
                </th>
                <th style={{ ...colStyle("actions"), cursor: "default" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact, index) => (
                <tr
                  key={contact.id}
                  onMouseEnter={() => setHoverRow(contact.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{
                    background: hoverRow === contact.id ? "rgba(200,169,110,0.05)" : index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    transition: "background 0.15s",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Nom */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(200,169,110,0.15)",
                        border: "1px solid rgba(200,169,110,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#c8a96e",
                        flexShrink: 0,
                      }}>
                        {contact.nom.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#fff" }}>{contact.nom}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: