export default async function PipelinePage() {

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  const safeProspects = prospects || [];

  const columns = [
    { id: "lead", label: "Lead", color: "#7c6f5a", icon: "🎯" },
    { id: "qualification", label: "Qualification", color: "#8b7355", icon: "🔍" },
    { id: "proposition", label: "Proposition", color: "#9a7d3a", icon: "📋" },
    { id: "negociation", label: "Négociation", color: "#c8a96e", icon: "🤝" },
    { id: "gagne", label: "Gagné", color: "#5a8a5a", icon: "✅" },
    { id: "perdu", label: "Perdu", color: "#8a4a4a", icon: "❌" },
  ];

  const getProspectsForColumn = (columnId: string) => {
    return safeProspects.filter((p: any) => {
      const stage = (p.stage || p.status || p.etape || "lead").toLowerCase();
      return stage === columnId;
    });
  };

  const getTotalValue = (columnProspects: any[]) => {
    return columnProspects.reduce((sum: number, p: any) => {
      return sum + (parseFloat(p.value || p.valeur || p.montant || 0));
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + "k€";
    }
    return amount.toFixed(0) + "€";
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityColor = (priority: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "haute" || p === "high") return "#e05c5c";
    if (p === "moyenne" || p === "medium") return "#c8a96e";
    if (p === "basse" || p === "low") return "#5a8a5a";
    return "#6b6b7a";
  };

  const totalProspects = safeProspects.length;
  const totalGagne = getProspectsForColumn("gagne").length;
  const totalValue = getTotalValue(getProspectsForColumn("gagne"));
  const conversionRate = totalProspects > 0 ? ((totalGagne / totalProspects) * 100).toFixed(1) : "0";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e4dc",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d14 0%, #050508 50%, #0a0a10 100%)",
          borderBottom: "1px solid #1a1a2e",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1800px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 4px 20px rgba(200, 169, 110, 0.3)",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "0.5px",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "#6b6b7a", letterSpacing: "1px", textTransform: "uppercase" }}>
                Pipeline CRM
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                background: "#0d0d14",
                border: "1px solid #1a1a2e",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                color: "#a09880",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#c8a96e" }}>🔍</span>
              Rechercher un prospect...
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#050508",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 15px rgba(200, 169, 110, 0.25)",
              }}
            >
              <span>+</span> Nouveau Prospect
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1800px", margin: "0 auto", padding: "24px 32px" }}>
        {error && (
          <div
            style={{
              background: "rgba(139, 74, 74, 0.15)",
              border: "1px solid rgba(139, 74, 74, 0.4)",
              borderRadius: "10px",
              padding: "12px 20px",
              marginBottom: "20px",
              color: "#e05c5c",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ Erreur de connexion Supabase : {error.message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "Total Prospects", value: totalProspects.toString(), icon: "👥", sub: "dans le pipeline" },
            { label: "Opportunités Gagnées", value: totalGagne.toString(), icon: "🏆", sub: "ce cycle" },
            { label: "Valeur Gagnée", value: formatCurrency(totalValue), icon: "💰", sub: "revenus confirmés" },
            { label: "Taux de Conversion", value: conversionRate + "%", icon: "📈", sub: "lead → gagné" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(135deg, #0d0d14 0%, #111118 100%)",
                border: "1px solid #1a1a2e",
                borderRadius: "14px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, #c8a96e, transparent)",
                }}
              />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1,
                      marginBottom: "4px",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "#4a4a5a" }}>{stat.sub}</div>
                </div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(200, 169, 110, 0.1)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    border: "1px solid rgba(200, 169, 110, 0.15)",
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            minWidth: "1200px",
            alignItems: "flex-start",
          }}
        >
          {columns.map((column) => {
            const columnProspects = getProspectsForColumn(column.id);
            const columnValue = getTotalValue(columnProspects);

            return (
              <div
                key={column.id}
                style={{
                  flex: "1",
                  minWidth: "200px",
                  background: "linear-gradient(180deg, #0d0d14 0%, #0a0a10 100%)",
                  borderRadius: "16px",
                  border: "1px solid #1a1a2e",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid #1a1a2e",
                    background: "linear-gradient(135deg, #111118, #0d0d14)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      backgroundColor: column.color,
                      opacity: 0.8,
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>{column.icon}</span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#e8e4dc",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {column.label}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: column.color,
                        color: "#050508",
                        borderRadius: "12px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: "700",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {columnProspects.length}
                    </div>
                  </div>
                  {columnValue > 0 && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: column.color,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>💎</span>
                      <span style={{ fontWeight: "600" }}>{formatCurrency(columnValue)}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    minHeight: "400px",
                    flex: 1,
                  }}
                >
                  {columnProspects.length === 0 && (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px 16px",
                        color: "#2a2a3a",
                        gap: "8px",
                      }}
                    >
                      <div style={{ fontSize: "28px", opacity: 0.4 }}>{column.icon}</div>
                      <div style={{ fontSize: "11px", textAlign: "center", lineHeight: 1.5 }}>
                        Aucun prospect
                      </div>
                    </div>
                  )}

                  {columnProspects.map((prospect: any) => {
                    const name = prospect.name || prospect.nom || prospect.contact || "Prospect";
                    const company = prospect.company || prospect.entreprise || prospect.societe || "";
                    const value = parseFloat(prospect.value || prospect.valeur || prospect.montant || 0);
                    const priority = prospect.priority || prospect.priorite || "";
                    const email = prospect.email || "";
                    const source = prospect.source || "";
                    const createdAt = prospect.created_at ? new Date(prospect.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "";

                    return (
}}}}}