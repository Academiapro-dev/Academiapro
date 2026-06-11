export default async function CrmPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  const safeContacts = contacts || [];

  const totalContacts = safeContacts.length;
  const leads = safeContacts.filter((c) => c.status === "lead").length;
  const prospects = safeContacts.filter((c) => c.status === "prospect").length;
  const clients = safeContacts.filter((c) => c.status === "client").length;
  const caPipeline = safeContacts.reduce(
    (acc: number, c) => acc + (Number(c.deal_value) || 0),
    0
  );

  const pipelineColumns = [
    {
      id: "lead",
      label: "Leads",
      color: "#6b7280",
      accent: "#9ca3af",
      items: safeContacts.filter((c) => c.status === "lead"),
    },
    {
      id: "prospect",
      label: "Prospects",
      color: "#92400e",
      accent: "#d97706",
      items: safeContacts.filter((c) => c.status === "prospect"),
    },
    {
      id: "negotiation",
      label: "Négociation",
      color: "#1e3a5f",
      accent: "#3b82f6",
      items: safeContacts.filter((c) => c.status === "negotiation"),
    },
    {
      id: "client",
      label: "Clients",
      color: "#14532d",
      accent: "#22c55e",
      items: safeContacts.filter((c) => c.status === "client"),
    },
  ];

  const recentActivity = safeContacts.slice(0, 8);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> =
      {
        lead: { bg: "#1f2937", color: "#9ca3af", label: "Lead" },
        prospect: { bg: "#451a03", color: "#f59e0b", label: "Prospect" },
        negotiation: { bg: "#1e3a5f", color: "#60a5fa", label: "Négociation" },
        client: { bg: "#052e16", color: "#4ade80", label: "Client" },
      };
    return (
      styles[status] || { bg: "#1f2937", color: "#6b7280", label: status }
    );
  };

  const kpis = [
    {
      label: "Total Contacts",
      value: totalContacts,
      icon: "👥",
      color: "#c8a96e",
      subLabel: "dans la base",
      trend: "+12%",
    },
    {
      label: "Leads",
      value: leads,
      icon: "🎯",
      color: "#9ca3af",
      subLabel: "à qualifier",
      trend: "+5%",
    },
    {
      label: "Prospects",
      value: prospects,
      icon: "🔍",
      color: "#f59e0b",
      subLabel: "en cours",
      trend: "+18%",
    },
    {
      label: "Clients",
      value: clients,
      icon: "✅",
      color: "#4ade80",
      subLabel: "actifs",
      trend: "+8%",
    },
    {
      label: "CA Pipeline",
      value: formatCurrency(caPipeline),
      icon: "💰",
      color: "#c8a96e",
      subLabel: "potentiel",
      trend: "+24%",
      isLarge: true,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#f0ede8",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0) 60%)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #a8834e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 4px 16px rgba(200,169,110,0.3)",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  letterSpacing: "-0.3px",
                  color: "#f0ede8",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "#c8a96e", opacity: 0.8 }}>
                CRM Dashboard
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <nav style={{ display: "flex", gap: "4px" }}>
              {["Dashboard", "Contacts", "Pipeline", "Rapports"].map(
                (item, i) => (
                  <button
                    key={item}
                    style={{
                      background: i === 0 ? "rgba(200,169,110,0.12)" : "none",
                      border:
                        i === 0
                          ? "1px solid rgba(200,169,110,0.25)"
                          : "1px solid transparent",
                      color: i === 0 ? "#c8a96e" : "#9ca3af",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: i === 0 ? "600" : "400",
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            </nav>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #a8834e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              A
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: "1600px", margin: "0 auto", padding: "32px 32px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "#c8a96e",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Vue d'ensemble
            </div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                margin: 0,
                color: "#f0ede8",
              }}
            >
              CRM Pipeline
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              {error
                ? "⚠️ Erreur de connexion Supabase — données simulées"
                : `Dernière sync : ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#9ca3af",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Exporter
            </button>
            <button
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #a8834e 100%)",
                border: "none",
                color: "#050508",
                padding: "9px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 16px rgba(200,169,110,0.25)",
              }}
            >
              + Nouveau contact
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {kpis.map((kpi, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, ${kpi.color}, transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: `rgba(${kpi.color === "#c8a96e" ? "200,169,110" : kpi.color === "#4ade80" ? "74,222,128" : kpi.color === "#f59e0b" ? "245,158,11" : "156,163,175"},0.1)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  {kpi.icon}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#4ade80",
                    background: "rgba(74,222,128,0.1)",
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {kpi.trend}
                </span>
              </div>
              <div
                style={{
                  fontSize: kpi.isLarge ? "20px" : "26px",
                  fontWeight: "800",
                  color: kpi.color,
                  letterSpacing: kpi.isLarge ? "-0.5px" : "-1px",
                  marginBottom: "2px",
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#d1cdc7" }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                {kpi.subLabel}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "24px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    margin: 0,
                    color: "#f0ede8",
                  }}
                >
                  Pipeline Kanban
                </h2>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "4px 0 0",
                  }}
                >
                  {totalContacts} contacts répartis en {pipelineColumns.length}{" "}