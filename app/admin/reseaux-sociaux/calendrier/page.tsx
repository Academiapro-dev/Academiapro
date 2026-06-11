export default async function CalendrierPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const { data: publications, error } = await supabase
    .from("publications")
    .select("*")
    .gte("scheduled_date", startStr)
    .lte("scheduled_date", endStr)
    .order("scheduled_date", { ascending: true });

  const pubsByDay: Record<string, any[]> = {};

  if (publications && !error) {
    publications.forEach((pub: any) => {
      const day = pub.scheduled_date?.split("T")[0];
      if (day) {
        if (!pubsByDay[day]) pubsByDay[day] = [];
        pubsByDay[day].push(pub);
      }
    });
  }

  const platformColors: Record<string, string> = {
    linkedin: "#0077b5",
    instagram: "#e1306c",
    facebook: "#1877f2",
    tiktok: "#010101",
    youtube: "#ff0000",
  };

  const platformBg: Record<string, string> = {
    linkedin: "rgba(0,119,181,0.15)",
    instagram: "rgba(225,48,108,0.15)",
    facebook: "rgba(24,119,242,0.15)",
    tiktok: "rgba(1,1,1,0.4)",
    youtube: "rgba(255,0,0,0.15)",
  };

  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    published: { bg: "rgba(34,197,94,0.2)", color: "#22c55e", label: "Publié" },
    scheduled: { bg: "rgba(200,169,110,0.2)", color: "#c8a96e", label: "Planifié" },
    draft: { bg: "rgba(148,163,184,0.2)", color: "#94a3b8", label: "Brouillon" },
    pending: { bg: "rgba(251,191,36,0.2)", color: "#fbbf24", label: "En attente" },
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const daysInMonth = endDate.getDate();
  const firstDayOfWeek = (startDate.getDay() + 6) % 7;

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const totalPublications = publications?.length || 0;
  const publishedCount = publications?.filter((p: any) => p.status === "published").length || 0;
  const scheduledCount = publications?.filter((p: any) => p.status === "scheduled").length || 0;
  const draftCount = publications?.filter((p: any) => p.status === "draft").length || 0;

  const platformCounts: Record<string, number> = {};
  publications?.forEach((p: any) => {
    const pl = p.platform?.toLowerCase() || "autre";
    platformCounts[pl] = (platformCounts[pl] || 0) + 1;
  });

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase();
    if (p === "linkedin") return "in";
    if (p === "instagram") return "IG";
    if (p === "facebook") return "f";
    if (p === "tiktok") return "TK";
    if (p === "youtube") return "YT";
    return "●";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e2e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(200,169,110,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 4px 20px rgba(200,169,110,0.3)",
            }}
          >
            📅
          </div>
          <div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #c8a96e, #e8c97e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.3px",
              }}
            >
              AcadémIA Pro
            </div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>
              Calendrier Éditorial
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(200,169,110,0.3)",
              background: "rgba(200,169,110,0.05)",
              fontSize: "15px",
              fontWeight: "600",
              color: "#c8a96e",
              letterSpacing: "0.5px",
            }}
          >
            {monthNames[month]} {year}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "24px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Total Publications",
            value: totalPublications,
            icon: "📊",
            color: "#c8a96e",
            bg: "rgba(200,169,110,0.08)",
            border: "rgba(200,169,110,0.2)",
          },
          {
            label: "Publiés",
            value: publishedCount,
            icon: "✅",
            color: "#22c55e",
            bg: "rgba(34,197,94,0.08)",
            border: "rgba(34,197,94,0.2)",
          },
          {
            label: "Planifiés",
            value: scheduledCount,
            icon: "⏰",
            color: "#c8a96e",
            bg: "rgba(200,169,110,0.06)",
            border: "rgba(200,169,110,0.15)",
          },
          {
            label: "Brouillons",
            value: draftCount,
            icon: "📝",
            color: "#94a3b8",
            bg: "rgba(148,163,184,0.06)",
            border: "rgba(148,163,184,0.15)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: "700",
                  color: stat.color,
                  lineHeight: "1",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "4px",
                  fontWeight: "500",
                }}
              >
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(platformCounts).length > 0 && (
        <div
          style={{
            padding: "0 32px 20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b", marginRight: "4px", fontWeight: "500" }}>
            Plateformes :
          </span>
          {Object.entries(platformCounts).map(([platform, count]) => (
            <div
              key={platform}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: platformBg[platform] || "rgba(255,255,255,0.05)",
                border: `1px solid ${platformColors[platform] || "#555"}40`,
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: platformColors[platform] || "#888",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: platformColors[platform] || "#888",
                  textTransform: "capitalize",
                }}
              >
                {platform}
              </span>
              <span
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "0px 6px",
                  color: "#e2e8f0",
                  fontSize: "11px",
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "0 32px 32px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(200,169,110,0.12)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: "1px solid rgba(200,169,110,0.12)",
            }}
          >
            {dayNames.map((day, idx) => (
              <div
                key={day}
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: idx >= 5 ? "#c8a96e" : "#64748b",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  borderRight: idx < 6 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
            }}
          >
            {calendarCells.map((day, idx) => {
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const dateStr = day
                ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;

              const dayPubs = dateStr ? pubsByDay[dateStr] || [] : [];
              const colIndex = idx % 7;
              const isWeekend = colIndex === 5 || colIndex === 6;

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: "120px",
                    padding: "10px 8px",
                    borderRight: colIndex < 6 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    borderBottom:
                      idx < calendarCells.length - 7
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    background: isToday
                      ? "rgba(200,169,110,0.06)"
                      : isWeekend && day
                      ? "rgba(255,255,255,0.01)"
                      : "transparent",
                    position: "relative",
                    verticalAlign: "top",
                  }}
                >
                  {day && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: