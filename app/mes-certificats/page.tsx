export default async function MesCertificatsPage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: certificats, error } = await supabase
    .from("certificats")
    .select("*")
    .order("created_at", { ascending: false });

  const niveauConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: string; rank: number }
  > = {
    attestation: {
      label: "Attestation",
      color: "#a0aec0",
      bg: "rgba(160,174,192,0.1)",
      icon: "◈",
      rank: 1,
    },
    certificat: {
      label: "Certificat",
      color: "#c8a96e",
      bg: "rgba(200,169,110,0.1)",
      icon: "◆",
      rank: 2,
    },
    expert: {
      label: "Expert",
      color: "#e8c87e",
      bg: "rgba(232,200,126,0.12)",
      icon: "❋",
      rank: 3,
    },
    master: {
      label: "Master",
      color: "#f0d090",
      bg: "rgba(240,208,144,0.15)",
      icon: "✦",
      rank: 4,
    },
  };

  const mentionConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    passable: {
      label: "Passable",
      color: "#a0aec0",
      bg: "rgba(160,174,192,0.12)",
    },
    assez_bien: {
      label: "Assez Bien",
      color: "#68d391",
      bg: "rgba(104,211,145,0.12)",
    },
    bien: { label: "Bien", color: "#4fd1c7", bg: "rgba(79,209,199,0.12)" },
    tres_bien: {
      label: "Très Bien",
      color: "#c8a96e",
      bg: "rgba(200,169,110,0.12)",
    },
    excellent: {
      label: "Excellent",
      color: "#f0d090",
      bg: "rgba(240,208,144,0.15)",
    },
    felicitations: {
      label: "Félicitations",
      color: "#fbd38d",
      bg: "rgba(251,211,141,0.18)",
    },
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getLinkedInUrl = (cert: {
    formation?: string;
    niveau?: string;
    date_obtention?: string;
    id?: string;
  }) => {
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: cert.formation || "Formation AcadémIA Pro",
      organizationName: "AcadémIA Pro",
      issueYear: cert.date_obtention
        ? new Date(cert.date_obtention).getFullYear().toString()
        : new Date().getFullYear().toString(),
      issueMonth: cert.date_obtention
        ? (new Date(cert.date_obtention).getMonth() + 1).toString()
        : "1",
      certUrl: `https://academia.pro/certificats/${cert.id}`,
      certId: cert.id || "",
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  };

  const statsParNiveau = Object.keys(niveauConfig).map((key) => ({
    key,
    count: certificats
      ? certificats.filter(
          (c: { niveau?: string }) =>
            (c.niveau || "").toLowerCase() === key.toLowerCase()
        ).length
      : 0,
    ...niveauConfig[key],
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#e2e8f0",
        padding: "0",
        margin: "0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <div
          style={{
            marginBottom: "56px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                background:
                  "linear-gradient(135deg, rgba(200,169,110,0.25) 0%, rgba(200,169,110,0.08) 100%)",
                border: "1px solid rgba(200,169,110,0.4)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              🏆
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "3px",
                  textTransform: "uppercase" as const,
                  color: "#c8a96e",
                  marginBottom: "4px",
                }}
              >
                AcadémIA Pro
              </div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  margin: "0",
                  background: "linear-gradient(135deg, #f0d090 0%, #c8a96e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: "1.2",
                }}
              >
                Mes Certificats
              </h1>
            </div>
          </div>

          <p
            style={{
              fontSize: "15px",
              color: "#718096",
              margin: "0 0 0 68px",
              lineHeight: "1.6",
            }}
          >
            Retrouvez l&apos;ensemble de vos certifications, téléchargez vos PDFs
            et partagez vos accomplissements.
          </p>

          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,169,110,0.3) 30%, rgba(200,169,110,0.3) 70%, transparent 100%)",
              marginTop: "32px",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {statsParNiveau.map((stat) => (
            <div
              key={stat.key}
              style={{
                background: stat.bg,
                border: `1px solid ${stat.color}30`,
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center" as const,
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  marginBottom: "6px",
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: stat.color,
                  lineHeight: "1",
                  marginBottom: "4px",
                }}
              >
                {stat.count}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase" as const,
                  color: stat.color,
                  opacity: 0.8,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              background: "rgba(245,101,101,0.1)",
              border: "1px solid rgba(245,101,101,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fc8181",
                  marginBottom: "2px",
                }}
              >
                Erreur de chargement
              </div>
              <div style={{ fontSize: "13px", color: "#718096" }}>
                {error.message ||
                  "Impossible de charger vos certificats. Veuillez réessayer."}
              </div>
            </div>
          </div>
        )}

        {(!certificats || certificats.length === 0) && !error && (
          <div
            style={{
              textAlign: "center" as const,
              padding: "80px 40px",
              background: "rgba(200,169,110,0.04)",
              border: "1px dashed rgba(200,169,110,0.2)",
              borderRadius: "20px",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎓</div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#c8a96e",
                marginBottom: "10px",
              }}
            >
              Aucun certificat pour le moment
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#4a5568",
                maxWidth: "360px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Complétez vos premières formations pour obtenir vos certifications
              et les afficher ici.
            </p>
          </div>
        )}

        {certificats && certificats.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))",
              gap: "24px",
            }}
          >
            {certificats.map(
              (cert: {
                id: string;
                formation?: string;
                niveau?: string;
                mention?: string;
                date_obtention?: string;
                pdf_url?: string;
                description?: string;
                score?: number;
                duree_heures?: number;
              }) => {
                const niveauKey = (cert.niveau || "certificat").toLowerCase();
                const niveauInfo =
                  niveauConfig[niveauKey] || niveauConfig["certificat"];
                const mentionKey = (cert.mention || "").toLowerCase();
                const mentionInfo = mentionConfig[mentionKey] || null;
                const linkedInUrl = getLinkedInUrl(cert);

                return (
                  <div
                    key={cert.id}
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(15,15,22,0.95) 0%, rgba(8,8,14,0.98) 100%)",
                      border: `1px solid ${niveauInfo.color}25`,
                      borderRadius: "20px",
                      overflow: "hidden",
                      position: "relative" as const,
                      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${niveauInfo.color}10`,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute" as const,
                        top: "0",
                        left: "0",
                        right: "0",
                        height: "3px",
                        background: `linear-gradient(90deg, transparent 0%, ${niveauInfo.color} 50%, transparent 100%)`,
                      }}
                    />

                    <div
                      style={{
                        position: "absolute" as const,
                        top: "0",
                        right: "0",
                        width: "180px",
                        height: "180px",
                        background: `radial-gradient(circle at top right, ${niveauInfo.color}08 0%, transparent 70%)`,
                        pointerEvents: "none" as const,
                      }}
                    />

                    <div
                      style={{
                        padding: "28px 28px 0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "16px",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "10px",
                              flexWrap: "wrap" as const,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 10px",
                                background: niveauInfo.bg,
                                border: `1px solid ${niveauInfo.color}40`,
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "700",
                                letterSpacing: "1px",
                                textTransform: "uppercase" as const,
                                color: niveauInfo.color,
                              }}
                            >
                              <span>{niveauInfo.icon}</span>
                              {niveauInfo.label}
                            </span>

                            {mentionInfo && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 10px",
                                  background: mentionInfo.bg,
                                  border: `1px solid ${mentionInfo.color}40`,
                                  borderRadius: "20px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  letterSpacing
}}}}}}}