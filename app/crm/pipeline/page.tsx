export default function PipelineCRM() {
  const [cards, setCards] = React.useState([
    {
      id: "1",
      name: "Sophie Martin",
      formation: "MBA Digital",
      commercial: "Alice Dupont",
      value: 12000,
      probability: 20,
      daysInStage: 3,
      stage: "Lead",
      email: "sophie.martin@email.com",
      phone: "06 12 34 56 78",
    },
    {
      id: "2",
      name: "Thomas Leblanc",
      formation: "Master Data Science",
      commercial: "Bob Bernard",
      value: 18500,
      probability: 45,
      daysInStage: 7,
      stage: "Qualifié",
      email: "thomas.leblanc@email.com",
      phone: "06 23 45 67 89",
    },
    {
      id: "3",
      name: "Camille Rousseau",
      formation: "Bootcamp Dev",
      commercial: "Alice Dupont",
      value: 8000,
      probability: 65,
      daysInStage: 12,
      stage: "Proposition",
      email: "camille.rousseau@email.com",
      phone: "06 34 56 78 90",
    },
    {
      id: "4",
      name: "Marc Fontaine",
      formation: "MBA Digital",
      commercial: "Claire Moreau",
      value: 22000,
      probability: 80,
      daysInStage: 5,
      stage: "Négociation",
      email: "marc.fontaine@email.com",
      phone: "06 45 67 89 01",
    },
    {
      id: "5",
      name: "Julie Petit",
      formation: "Master Data Science",
      commercial: "Bob Bernard",
      value: 15000,
      probability: 100,
      daysInStage: 2,
      stage: "Fermé",
      email: "julie.petit@email.com",
      phone: "06 56 78 90 12",
    },
    {
      id: "6",
      name: "Antoine Garnier",
      formation: "Bootcamp Dev",
      commercial: "Claire Moreau",
      value: 9500,
      probability: 30,
      daysInStage: 15,
      stage: "Lead",
      email: "antoine.garnier@email.com",
      phone: "06 67 89 01 23",
    },
    {
      id: "7",
      name: "Lucie Simon",
      formation: "MBA Digital",
      commercial: "Alice Dupont",
      value: 25000,
      probability: 70,
      daysInStage: 8,
      stage: "Négociation",
      email: "lucie.simon@email.com",
      phone: "06 78 90 12 34",
    },
    {
      id: "8",
      name: "Paul Durand",
      formation: "Master Data Science",
      commercial: "Claire Moreau",
      value: 16000,
      probability: 55,
      daysInStage: 4,
      stage: "Qualifié",
      email: "paul.durand@email.com",
      phone: "06 89 01 23 45",
    },
    {
      id: "9",
      name: "Emma Laurent",
      formation: "Bootcamp Dev",
      commercial: "Bob Bernard",
      value: 7500,
      probability: 85,
      daysInStage: 9,
      stage: "Proposition",
      email: "emma.laurent@email.com",
      phone: "06 90 12 34 56",
    },
    {
      id: "10",
      name: "Nicolas Bernard",
      formation: "MBA Digital",
      commercial: "Alice Dupont",
      value: 30000,
      probability: 100,
      daysInStage: 1,
      stage: "Fermé",
      email: "nicolas.bernard@email.com",
      phone: "06 01 23 45 67",
    },
  ]);

  const [filterFormation, setFilterFormation] = React.useState("Tous");
  const [filterCommercial, setFilterCommercial] = React.useState("Tous");
  const [filterMontant, setFilterMontant] = React.useState("Tous");
  const [draggedCardId, setDraggedCardId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<string | null>(null);
  const [selectedCard, setSelectedCard] = React.useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = React.useState<string | null>(null);

  const stages = ["Lead", "Qualifié", "Proposition", "Négociation", "Fermé"];

  const formations = ["Tous", "MBA Digital", "Master Data Science", "Bootcamp Dev"];
  const commerciaux = ["Tous", "Alice Dupont", "Bob Bernard", "Claire Moreau"];
  const montants = ["Tous", "< 10 000 €", "10 000 - 20 000 €", "> 20 000 €"];

  const getFilteredCards = () => {
    return cards.filter((card) => {
      const formationMatch = filterFormation === "Tous" || card.formation === filterFormation;
      const commercialMatch = filterCommercial === "Tous" || card.commercial === filterCommercial;
      let montantMatch = true;
      if (filterMontant === "< 10 000 €") montantMatch = card.value < 10000;
      else if (filterMontant === "10 000 - 20 000 €") montantMatch = card.value >= 10000 && card.value <= 20000;
      else if (filterMontant === "> 20 000 €") montantMatch = card.value > 20000;
      return formationMatch && commercialMatch && montantMatch;
    });
  };

  const getStageCards = (stage: string) => {
    return getFilteredCards().filter((card) => card.stage === stage);
  };

  const getStageTotal = (stage: string) => {
    return getStageCards(stage).reduce((sum, card) => sum + card.value, 0);
  };

  const getWeightedTotal = (stage: string) => {
    return getStageCards(stage).reduce((sum, card) => sum + (card.value * card.probability) / 100, 0);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (draggedCardId) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === draggedCardId
            ? { ...card, stage, daysInStage: 0 }
            : card
        )
      );
    }
    setDraggedCardId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverStage(null);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      Lead: "#6b7fd7",
      Qualifié: "#c8a96e",
      Proposition: "#7bc8a4",
      Négociation: "#e07b54",
      Fermé: "#a78bfa",
    };
    return colors[stage] || "#c8a96e";
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return "#7bc8a4";
    if (prob >= 50) return "#c8a96e";
    if (prob >= 30) return "#e07b54";
    return "#ef4444";
  };

  const getDaysColor = (days: number) => {
    if (days <= 5) return "#7bc8a4";
    if (days <= 10) return "#c8a96e";
    return "#e07b54";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  };

  const getTotalPipeline = () => {
    return getFilteredCards().reduce((sum, card) => sum + card.value, 0);
  };

  const getWeightedPipeline = () => {
    return getFilteredCards().reduce((sum, card) => sum + (card.value * card.probability) / 100, 0);
  };

  const getClosedRevenue = () => {
    return getFilteredCards()
      .filter((c) => c.stage === "Fermé")
      .reduce((sum, card) => sum + card.value, 0);
  };

  const selectedCardData = cards.find((c) => c.id === selectedCard);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e8e8f0",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a12 0%, #0d0d1a 50%, #080810 100%)",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "800",
                color: "#050508",
                boxShadow: "0 4px 15px rgba(200,169,110,0.3)",
              }}
            >
              A
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #c8a96e, #e8d5a8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              >
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "rgba(200,169,110,0.5)", letterSpacing: "0.5px", marginTop: "-2px" }}>
                CRM Pipeline
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["Dashboard", "Pipeline", "Prospects", "Rapports", "Paramètres"].map((item) => (
              <button
                key={item}
                style={{
                  background: item === "Pipeline" ? "rgba(200,169,110,0.12)" : "transparent",
                  border: item === "Pipeline" ? "1px solid rgba(200,169,110,0.25)" : "1px solid transparent",
                  color: item === "Pipeline" ? "#c8a96e" : "rgba(232,232,240,0.5)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: item === "Pipeline" ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#7bc8a4",
                boxShadow: "0 0 8px rgba(123,200,164,0.6)",
              }}
            />
            <div style={{ fontSize: "13px", color: "rgba(232,232,240,0.6)" }}>Alice Dupont</div>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                color: "#050508",
              }}
            >
              AD
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "#e8e8f0",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                Pipeline Commercial
              </h1>
              <p style={{ fontSize: "14px", color: "rgba(232,232,240,0.45)", margin: 0 }}>
                {getFilteredCards().length} prospects actifs · Mise à jour il y a 2 min
              </p>
            </div>
            <button
              style={{
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                border: "none",
                color: "#050508",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 15px rgba