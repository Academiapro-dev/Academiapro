export default function MesSeances() {
  const [activeFilter, setActiveFilter] = React.useState<string>("tous");
  const [typeFilter, setTypeFilter] = React.useState<string>("tous");
  const [specialiteFilter, setSpecialiteFilter] = React.useState<string>("toutes");

  const seancesAVenir = [
    {
      id: 1,
      titre: "Stratégie Marketing Digital",
      expert: "Dr. Sophie Lemaire",
      date: "15 Jan 2025",
      heure: "14h00",
      duree: "60 min",
      type: "visio",
      specialite: "Marketing",
      statut: "confirmé",
      avatar: "SL",
    },
    {
      id: 2,
      titre: "Optimisation SEO Avancée",
      expert: "Marc Dupont",
      date: "18 Jan 2025",
      heure: "10h30",
      duree: "45 min",
      type: "audio",
      specialite: "SEO",
      statut: "en attente",
      avatar: "MD",
    },
    {
      id: 3,
      titre: "Leadership & Management",
      expert: "Claire Moreau",
      date: "22 Jan 2025",
      heure: "16h00",
      duree: "90 min",
      type: "visio",
      specialite: "Management",
      statut: "confirmé",
      avatar: "CM",
    },
  ];

  const seancesPassees = [
    {
      id: 4,
      titre: "Introduction à l'IA Générative",
      expert: "Thomas Bernard",
      date: "08 Jan 2025",
      heure: "11h00",
      duree: "60 min",
      type: "visio",
      specialite: "IA",
      note: 5,
      replay: true,
      avatar: "TB",
    },
    {
      id: 5,
      titre: "Comptabilité & Finance",
      expert: "Isabelle Roux",
      date: "03 Jan 2025",
      heure: "09h00",
      duree: "45 min",
      type: "audio",
      specialite: "Finance",
      note: 4,
      replay: false,
      avatar: "IR",
    },
    {
      id: 6,
      titre: "Growth Hacking Strategies",
      expert: "Nicolas Petit",
      date: "28 Dec 2024",
      heure: "15h30",
      duree: "75 min",
      type: "visio",
      specialite: "Marketing",
      note: 5,
      replay: true,
      avatar: "NP",
    },
    {
      id: 7,
      titre: "Négociation Commerciale",
      expert: "Dr. Sophie Lemaire",
      date: "20 Dec 2024",
      heure: "14h00",
      duree: "60 min",
      type: "visio",
      specialite: "Commercial",
      note: 4,
      replay: true,
      avatar: "SL",
    },
  ];

  const abonnements = [
    {
      id: 1,
      nom: "AcadémIA Pro",
      plan: "Annuel",
      seancesRestantes: 8,
      seancesTotal: 12,
      renouvellement: "15 Mars 2025",
      couleur: "#c8a96e",
    },
    {
      id: 2,
      nom: "Accès Replays",
      plan: "Mensuel",
      seancesRestantes: null,
      seancesTotal: null,
      renouvellement: "01 Fév 2025",
      couleur: "#7c6aae",
    },
  ];

  const specialites = ["toutes", "Marketing", "SEO", "Management", "IA", "Finance", "Commercial"];

  const filteredAVenir = seancesAVenir.filter((s) => {
    const typeOk = typeFilter === "tous" || s.type === typeFilter;
    const specOk = specialiteFilter === "toutes" || s.specialite === specialiteFilter;
    return typeOk && specOk;
  });

  const filteredPassees = seancesPassees.filter((s) => {
    const typeOk = typeFilter === "tous" || s.type === typeFilter;
    const specOk = specialiteFilter === "toutes" || s.specialite === specialiteFilter;
    const replayOk = activeFilter !== "replays" || s.replay === true;
    return typeOk && specOk && replayOk;
  });

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      React.createElement("span", {
        key: i,
        style: { color: i < note ? "#c8a96e" : "#2a2a3e", fontSize: "14px" }
      }, "★")
    ));
  };

  const getTypeIcon = (type: string) => {
    if (type === "visio") return "🎥";
    if (type === "audio") return "🎧";
    return "📱";
  };

  const getStatutStyle = (statut: string) => {
    if (statut === "confirmé") {
      return {
        background: "rgba(72, 199, 142, 0.15)",
        color: "#48c78e",
        border: "1px solid rgba(72, 199, 142, 0.3)",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        textTransform: "uppercase" as const,
      };
    }
    return {
      background: "rgba(255, 183, 77, 0.15)",
      color: "#ffb74d",
      border: "1px solid rgba(255, 183, 77, 0.3)",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.5px",
      textTransform: "uppercase" as const,
    };
  };

  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#e8e8f0",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(180deg, #0d0d1a 0%, #050508 100%)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
          padding: "0 40px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          },
        },
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "12px" } },
          React.createElement(
            "div",
            {
              style: {
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              },
            },
            "🎓"
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "20px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #c8a96e, #e8d5a3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              },
            },
            "AcadémIA Pro"
          )
        ),
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "20px" } },
          React.createElement(
            "span",
            { style: { color: "#888", fontSize: "13px" } },
            "Tableau de bord"
          ),
          React.createElement(
            "span",
            { style: { color: "#c8a96e", fontSize: "13px", fontWeight: "600" } },
            "Mes séances"
          ),
          React.createElement(
            "span",
            { style: { color: "#888", fontSize: "13px" } },
            "Experts"
          ),
          React.createElement(
            "div",
            {
              style: {
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#050508",
                cursor: "pointer",
              },
            },
            "JD"
          )
        )
      )
    ),
    React.createElement(
      "div",
      {
        style: {
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 40px 80px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "40px",
            flexWrap: "wrap" as const,
            gap: "20px",
          },
        },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h1",
            {
              style: {
                fontSize: "32px",
                fontWeight: "800",
                color: "#ffffff",
                margin: "0 0 8px 0",
                letterSpacing: "-1px",
              },
            },
            "Mes Séances"
          ),
          React.createElement(
            "p",
            { style: { color: "#666", margin: 0, fontSize: "15px" } },
            "Gérez vos formations personnalisées avec vos experts"
          )
        ),
        React.createElement(
          "button",
          {
            style: {
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              color: "#050508",
              border: "none",
              padding: "14px 28px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "0.3px",
              boxShadow: "0 4px 20px rgba(200, 169, 110, 0.3)",
            },
          },
          React.createElement("span", { style: { fontSize: "16px" } }, "+"),
          "Réserver une séance"
        )
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          },
        },
        abonnements.map((abo) =>
          React.createElement(
            "div",
            {
              key: abo.id,
              style: {
                background: "linear-gradient(135deg, #0d0d1a, #12121f)",
                border: `1px solid ${abo.couleur}30`,
                borderRadius: "16px",
                padding: "24px",
                position: "relative" as const,
                overflow: "hidden",
              },
            },
            React.createElement("div", {
              style: {
                position: "absolute" as const,
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, ${abo.couleur}, transparent)`,
              },
            }),
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                },
              },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  {
                    style: {
                      fontSize: "12px",
                      color: "#555",
                      textTransform: "uppercase" as const,
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    },
                  },
                  "Abonnement actif"
                ),
                React.createElement(
                  "div",
                  { style: { fontSize: "16px", fontWeight: "700", color: "#fff" } },
                  abo.nom
                )
              ),
              React.createElement(
                "span",
                {
                  style: {
                    background: `${abo.couleur}20`,
                    color: abo.couleur,
                    border: `1px solid ${abo.couleur}40`,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "600",
                  },
                },
                abo.plan
              )
            ),
            abo.seancesRestantes !== null &&
              React.createElement(
                "div",
                { style: { marginBottom: "12px" } },
                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    },
                  },
                  React.createElement(
                    "span",
                    { style: { fontSize: "13px", color: "#888" } },
                    "Séances restantes"
                  ),
                  React.createElement(
                    "span",
                    { style: { fontSize: "13px", color: "#fff", fontWeight: "600" } },
                    `${abo.seancesRestantes}/${abo.seancesTotal}`
                  )
                ),
                React.createElement(
                  "div",
                  {
                    style: {
                      height: "6px",
                      background: "#1a1a2e",
                      borderRadius: "3px",
                      overflow: "hidden",
                    },
                  },
                  React.createElement("div", {
                    style: {
                      height: "100%",
                      width: `${((abo.seancesRestantes ?? 0) / (abo.seancesTotal ?? 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${abo.couleur}, ${abo.couleur}80)`,
                      borderRadius: "3px",
                    },