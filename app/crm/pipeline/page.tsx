export default function PipelineCRM() {
  const columns = [
    {
      id: "lead",
      label: "Lead",
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.08)",
      borderColor: "rgba(59,130,246,0.3)",
    },
    {
      id: "qualification",
      label: "Qualification",
      color: "#8b5cf6",
      bgColor: "rgba(139,92,246,0.08)",
      borderColor: "rgba(139,92,246,0.3)",
    },
    {
      id: "proposition",
      label: "Proposition",
      color: "#c8a96e",
      bgColor: "rgba(200,169,110,0.08)",
      borderColor: "rgba(200,169,110,0.3)",
    },
    {
      id: "negociation",
      label: "Négociation",
      color: "#f97316",
      bgColor: "rgba(249,115,22,0.08)",
      borderColor: "rgba(249,115,22,0.3)",
    },
    {
      id: "gagne",
      label: "Gagné",
      color: "#22c55e",
      bgColor: "rgba(34,197,94,0.08)",
      borderColor: "rgba(34,197,94,0.3)",
    },
    {
      id: "perdu",
      label: "Perdu",
      color: "#ef4444",
      bgColor: "rgba(239,68,68,0.08)",
      borderColor: "rgba(239,68,68,0.3)",
    },
  ];

  const prospects = [
    {
      id: 1,
      nom: "Sophie Martin",
      formation: "MBA Digital",
      montant: 8500,
      probabilite: 15,
      jours: 2,
      colonne: "lead",
      avatar: "SM",
    },
    {
      id: 2,
      nom: "Thomas Dubois",
      formation: "Master IA",
      montant: 12000,
      probabilite: 20,
      jours: 5,
      colonne: "lead",
      avatar: "TD",
    },
    {
      id: 3,
      nom: "Camille Rousseau",
      formation: "BTS Commerce",
      montant: 4200,
      probabilite: 25,
      jours: 1,
      colonne: "lead",
      avatar: "CR",
    },
    {
      id: 4,
      nom: "Alexandre Petit",
      formation: "Master Finance",
      montant: 11000,
      probabilite: 40,
      jours: 8,
      colonne: "qualification",
      avatar: "AP",
    },
    {
      id: 5,
      nom: "Marie Lefevre",
      formation: "Licence Pro RH",
      montant: 5800,
      probabilite: 45,
      jours: 12,
      colonne: "qualification",
      avatar: "ML",
    },
    {
      id: 6,
      nom: "Nicolas Bernard",
      formation: "MBA Marketing",
      montant: 9200,
      probabilite: 50,
      jours: 6,
      colonne: "qualification",
      avatar: "NB",
    },
    {
      id: 7,
      nom: "Isabelle Moreau",
      formation: "Master Data Science",
      montant: 13500,
      probabilite: 65,
      jours: 14,
      colonne: "proposition",
      avatar: "IM",
    },
    {
      id: 8,
      nom: "Julien Simon",
      formation: "DU Entrepreneuriat",
      montant: 6700,
      probabilite: 60,
      jours: 9,
      colonne: "proposition",
      avatar: "JS",
    },
    {
      id: 9,
      nom: "Lucie Fontaine",
      formation: "Master Cybersécurité",
      montant: 14200,
      probabilite: 70,
      jours: 3,
      colonne: "proposition",
      avatar: "LF",
    },
    {
      id: 10,
      nom: "Pierre Garnier",
      formation: "MBA Santé",
      montant: 10500,
      probabilite: 80,
      jours: 18,
      colonne: "negociation",
      avatar: "PG",
    },
    {
      id: 11,
      nom: "Emma Durand",
      formation: "Master Droit des Affaires",
      montant: 9800,
      probabilite: 85,
      jours: 21,
      colonne: "negociation",
      avatar: "ED",
    },
    {
      id: 12,
      nom: "Antoine Mercier",
      formation: "Executive MBA",
      montant: 18000,
      probabilite: 90,
      jours: 7,
      colonne: "negociation",
      avatar: "AM",
    },
    {
      id: 13,
      nom: "Clara Bonnet",
      formation: "Master Communication",
      montant: 7600,
      probabilite: 100,
      jours: 30,
      colonne: "gagne",
      avatar: "CB",
    },
    {
      id: 14,
      nom: "Romain Chevalier",
      formation: "MBA Tech",
      montant: 15000,
      probabilite: 100,
      jours: 25,
      colonne: "gagne",
      avatar: "RC",
    },
    {
      id: 15,
      nom: "Manon Girard",
      formation: "Licence Pro Logistique",
      montant: 4500,
      probabilite: 0,
      jours: 45,
      colonne: "perdu",
      avatar: "MG",
    },
    {
      id: 16,
      nom: "Hugo Lambert",
      formation: "Master Audit",
      montant: 8900,
      probabilite: 0,
      jours: 38,
      colonne: "perdu",
      avatar: "HL",
    },
  ];

  const getColumnProspects = (colonneId: string) =>
    prospects.filter((p) => p.colonne === colonneId);

  const getColumnTotal = (colonneId: string) =>
    getColumnProspects(colonneId).reduce((sum, p) => sum + p.montant, 0);

  const totalPipeline = prospects.reduce((sum, p) => sum + p.montant, 0);
  const totalGagne = prospects
    .filter((p) => p.colonne === "gagne")
    .reduce((sum, p) => sum + p.montant, 0);
  const totalNegociation = prospects
    .filter((p) => p.colonne === "negociation")
    .reduce((sum, p) => sum + p.montant, 0);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(montant);

  const getProbabiliteColor = (prob: number) => {
    if (prob >= 80) return "#22c55e";
    if (prob >= 60) return "#c8a96e";
    if (prob >= 40) return "#f97316";
    return "#ef4444";
  };

  const getJoursColor = (jours: number) => {
    if (jours <= 7) return "#22c55e";
    if (jours <= 14) return "#c8a96e";
    if (jours <= 21) return "#f97316";
    return "#ef4444";
  };

  const getAvatarBg = (colonne: string) => {
    const col = columns.find((c) => c.id === colonne);
    return col ? col.color : "#c8a96e";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#e2e8f0",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(200,169,110,0.05) 0%, transparent 50%)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1800px",
            margin: "0 auto",
            padding: "24px 0",
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
                background:
                  "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 4px 20px rgba(200,169,110,0.3)",
              }}
            >
              🎓
            </div>
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  background:
                    "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                AcadémIA Pro
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(200,169,110,0.6)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                Pipeline CRM
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: "12px",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(200,169,110,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Pipeline Total
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#c8a96e",
                }}
              >
                {formatMontant(totalPipeline)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "12px",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(34,197,94,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Revenus Gagnés
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#22c55e",
                }}
              >
                {formatMontant(totalGagne)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "12px",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(249,115,22,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                En Négociation
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#f97316",
                }}
              >
                {formatMontant(totalNegociation)}
              </div>
            </div>

            <div
              style={{
                background: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: "12px",
                padding: "12px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(200,169,110,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Prospects Actifs
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#c8a96e",
                }}
              >
                {
                  prospects.filter(
                    (p) => p.colonne !== "gagne" && p.colonne !== "perdu"
                  ).length
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1800px",
          margin: "0 auto",
          padding: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#f1f5f9",
                margin: "0 0 4px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Pipeline Commercial
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(200,169,110,0.6)",
                margin: 0,
              }}
            >
              {prospects.length} prospects · Mis à jour aujourd'hui
            </p