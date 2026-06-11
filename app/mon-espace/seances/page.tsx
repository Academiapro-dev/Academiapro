export default async function MonEspaceSeancesPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  const now = new Date().toISOString();

  const { data: prochainesSeances } = await supabase
    .from("seances")
    .select("*")
    .eq("user_id", userId)
    .gte("date_heure", now)
    .order("date_heure", { ascending: true });

  const { data: passeesSeances } = await supabase
    .from("seances")
    .select("*")
    .eq("user_id", userId)
    .lt("date_heure", now)
    .is("replay_url", null)
    .order("date_heure", { ascending: false });

  const { data: replaysSeances } = await supabase
    .from("seances")
    .select("*")
    .eq("user_id", userId)
    .lt("date_heure", now)
    .not("replay_url", "is", null)
    .order("date_heure", { ascending: false });

  const prochaines = prochainesSeances ?? [];
  const passees = passeesSeances ?? [];
  const replays = replaysSeances ?? [];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBadgeStyle = (statut: string) => {
    const base = {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      textTransform: "uppercase" as const,
    };
    if (statut === "confirme")
      return { ...base, background: "#0f3d2e", color: "#4ade80" };
    if (statut === "en_attente")
      return { ...base, background: "#3d2d0f", color: "#fbbf24" };
    if (statut === "annule")
      return { ...base, background: "#3d0f0f", color: "#f87171" };
    return { ...base, background: "#1a1a2e", color: "#c8a96e" };
  };

  const cardStyle = {
    background: "linear-gradient(135deg, #0d0d16 0%, #111120 100%)",
    border: "1px solid #1e1e35",
    borderRadius: "16px",
    padding: "20px 24px",
    marginBottom: "14px",
    position: "relative" as const,
    transition: "border-color 0.2s ease",
  };

  const sectionTitleStyle = {
    fontSize: "13px",
    fontWeight: "700",
    color: "#c8a96e",
    textTransform: "uppercase" as const,
    letterSpacing: "2px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const emptyStyle = {
    color: "#3a3a55",
    fontSize: "14px",
    fontStyle: "italic",
    padding: "20px 0",
    textAlign: "center" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#e8e8f0",
        padding: "0",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "48px",
            flexWrap: "wrap" as const,
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                🎓
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#c8a96e",
                  fontWeight: "700",
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                }}
              >
                AcadémIA Pro
              </span>
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#ffffff",
                margin: "0 0 6px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Mes Séances
            </h1>
            <p
              style={{
                color: "#5a5a7a",
                fontSize: "15px",
                margin: "0",
              }}
            >
              {user
                ? `Connecté en tant que ${user.email}`
                : "Espace personnel de formation"}
            </p>
          </div>

          <a
            href="/reserver"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
              color: "#050508",
              fontWeight: "800",
              fontSize: "14px",
              padding: "13px 24px",
              borderRadius: "12px",
              textDecoration: "none",
              letterSpacing: "0.3px",
              boxShadow: "0 4px 24px rgba(200,169,110,0.25)",
              whiteSpace: "nowrap" as const,
            }}
          >
            <span style={{ fontSize: "16px" }}>+</span>
            Réserver une séance
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {[
            {
              label: "Prochaines",
              count: prochaines.length,
              icon: "📅",
              color: "#4ade80",
            },
            {
              label: "Passées",
              count: passees.length,
              icon: "✅",
              color: "#94a3b8",
            },
            {
              label: "Replays",
              count: replays.length,
              icon: "🎬",
              color: "#c8a96e",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "linear-gradient(135deg, #0a0a14 0%, #0f0f1e 100%)",
                border: "1px solid #1a1a30",
                borderRadius: "14px",
                padding: "20px",
                textAlign: "center" as const,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: stat.color,
                  lineHeight: "1",
                  marginBottom: "4px",
                }}
              >
                {stat.count}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#4a4a6a",
                  fontWeight: "600",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <div style={sectionTitleStyle}>
            <span
              style={{
                width: "3px",
                height: "18px",
                background: "#4ade80",
                borderRadius: "2px",
                display: "inline-block",
              }}
            />
            📅 Prochaines séances
            <span
              style={{
                background: "#0f3d2e",
                color: "#4ade80",
                borderRadius: "20px",
                padding: "2px 8px",
                fontSize: "11px",
              }}
            >
              {prochaines.length}
            </span>
          </div>

          {prochaines.length === 0 ? (
            <div style={cardStyle}>
              <p style={emptyStyle}>Aucune séance à venir pour le moment.</p>
              <div style={{ textAlign: "center" as const, paddingBottom: "8px" }}>
                <a
                  href="/reserver"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#c8a96e",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                    border: "1px solid #2a2010",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#0d0a05",
                  }}
                >
                  Réserver ma première séance →
                </a>
              </div>
            </div>
          ) : (
            prochaines.map((seance: Record<string, string>) => (
              <div key={seance.id} style={cardStyle}>
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "4px",
                    height: "100%",
                    background: "linear-gradient(180deg, #4ade80, #22c55e)",
                    borderRadius: "16px 0 0 16px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap" as const,
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: "1" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#ffffff",
                          margin: "0",
                        }}
                      >
                        {seance.titre ?? "Séance de formation"}
                      </h3>
                      <span style={getBadgeStyle(seance.statut ?? "confirme")}>
                        {seance.statut ?? "confirmé"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#8888aa",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        🗓 {formatDate(seance.date_heure)}
                      </span>
                      {seance.duree && (
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#8888aa",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          ⏱ {seance.duree} min
                        </span>
                      )}
                      {seance.formateur && (
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#8888aa",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          👤 {seance.formateur}
                        </span>
                      )}
                    </div>
                    {seance.description && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#5a5a7a",
                          margin: "10px 0 0 0",
                          lineHeight: "1.5",
                        }}
                      >
                        {seance.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: "8px",
                      alignItems: "flex-end",
                    }}
                  >
                    {seance.lien_visio && (
                      <a
                        href={seance.lien_visio}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background:
                            "linear-gradient(135deg, #1a3a2a, #0f2a1a)",
                          color: "#4ade80",
                          border: "1px solid #1e4a2e",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        🎥 Rejoindre
                      </a>
                    )}
                    <a
                      href={"/seances/" + seance.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "transparent",
                        color: "#5a5a7a",
                        border: "1px solid #1a1a30",
                        borderRadius: "8px",
                        padding: "8px 14px",