"use client";
import { useState } from "react";

export default function CRMKanbanPage() {
  const [columns, setColumns] = useState({
    lead: {
      title: "Lead",
      color: "#c8a96e",
      cards: [
        { id: 1, name: "Acme Corp", value: "12 000 €", contact: "Jean Dupont", priority: "haute" },
        { id: 2, name: "TechStart SAS", value: "8 500 €", contact: "Marie Leroy", priority: "moyenne" },
        { id: 3, name: "Global Industries", value: "45 000 €", contact: "Pierre Martin", priority: "haute" },
      ],
    },
    qualification: {
      title: "Qualification",
      color: "#a78bfa",
      cards: [
        { id: 4, name: "Nexus Digital", value: "22 000 €", contact: "Sophie Bernard", priority: "haute" },
        { id: 5, name: "Retail Plus", value: "6 000 €", contact: "Luc Moreau", priority: "basse" },
      ],
    },
    proposition: {
      title: "Proposition",
      color: "#38bdf8",
      cards: [
        { id: 6, name: "Finance Pro", value: "78 000 €", contact: "Claire Petit", priority: "haute" },
        { id: 7, name: "MediGroup", value: "15 000 €", contact: "Antoine Roux", priority: "moyenne" },
        { id: 8, name: "LogiStack", value: "31 000 €", contact: "Emma Blanc", priority: "haute" },
      ],
    },
    negociation: {
      title: "Négociation",
      color: "#fb923c",
      cards: [
        { id: 9, name: "IndusTech", value: "95 000 €", contact: "Marc Girard", priority: "haute" },
        { id: 10, name: "DataVault", value: "42 000 €", contact: "Nathalie Simon", priority: "moyenne" },
      ],
    },
    gagne: {
      title: "Gagné",
      color: "#4ade80",
      cards: [
        { id: 11, name: "CloudNet", value: "110 000 €", contact: "Paul Durand", priority: "haute" },
        { id: 12, name: "SmartFactory", value: "67 000 €", contact: "Isabelle Morin", priority: "moyenne" },
      ],
    },
    perdu: {
      title: "Perdu",
      color: "#f87171",
      cards: [
        { id: 13, name: "OldSchool Co", value: "9 000 €", contact: "Georges Lambert", priority: "basse" },
      ],
    },
  });

  const [draggedCard, setDraggedCard] = useState(null);
  const [dragSourceCol, setDragSourceCol] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalCol, setModalCol] = useState(null);
  const [newCard, setNewCard] = useState({ name: "", value: "", contact: "", priority: "moyenne" });
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailCol, setDetailCol] = useState(null);

  const priorityColors = {
    haute: "#ef4444",
    moyenne: "#f59e0b",
    basse: "#6b7280",
  };

  const priorityBg = {
    haute: "rgba(239,68,68,0.15)",
    moyenne: "rgba(245,158,11,0.15)",
    basse: "rgba(107,114,128,0.15)",
  };

  function getTotalValue(cards) {
    return cards.reduce((acc, c) => {
      const num = parseFloat(c.value.replace(/[^0-9]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }

  function formatValue(num) {
    return num.toLocaleString("fr-FR") + " €";
  }

  function handleDragStart(card, colKey) {
    setDraggedCard(card);
    setDragSourceCol(colKey);
  }

  function handleDrop(targetColKey) {
    if (!draggedCard || dragSourceCol === targetColKey) {
      setDraggedCard(null);
      setDragSourceCol(null);
      setHoveredCol(null);
      return;
    }
    setColumns((prev) => {
      const updated = { ...prev };
      updated[dragSourceCol] = {
        ...updated[dragSourceCol],
        cards: updated[dragSourceCol].cards.filter((c) => c.id !== draggedCard.id),
      };
      updated[targetColKey] = {
        ...updated[targetColKey],
        cards: [...updated[targetColKey].cards, draggedCard],
      };
      return updated;
    });
    setDraggedCard(null);
    setDragSourceCol(null);
    setHoveredCol(null);
  }

  function handleAddCard(colKey) {
    setModalCol(colKey);
    setNewCard({ name: "", value: "", contact: "", priority: "moyenne" });
    setShowModal(true);
  }

  function handleSaveCard() {
    if (!newCard.name.trim()) return;
    const id = Date.now();
    const cardToAdd = {
      id,
      name: newCard.name,
      value: newCard.value || "0 €",
      contact: newCard.contact,
      priority: newCard.priority,
    };
    setColumns((prev) => ({
      ...prev,
      [modalCol]: {
        ...prev[modalCol],
        cards: [...prev[modalCol].cards, cardToAdd],
      },
    }));
    setShowModal(false);
  }

  function handleDeleteCard(colKey, cardId) {
    setColumns((prev) => ({
      ...prev,
      [colKey]: {
        ...prev[colKey],
        cards: prev[colKey].cards.filter((c) => c.id !== cardId),
      },
    }));
    setSelectedCard(null);
    setDetailCol(null);
  }

  function openDetail(card, colKey) {
    setSelectedCard(card);
    setDetailCol(colKey);
  }

  const totalGlobal = Object.values(columns).reduce((acc, col) => acc + getTotalValue(col.cards), 0);
  const totalGagne = getTotalValue(columns.gagne.cards);
  const totalPipeline = Object.entries(columns)
    .filter(([k]) => k !== "perdu" && k !== "gagne")
    .reduce((acc, [, col]) => acc + getTotalValue(col.cards), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#e2d9c8",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          padding: "32px 40px 24px 40px",
          borderBottom: "1px solid rgba(200,169,110,0.15)",
          background: "rgba(200,169,110,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                ◈
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #c8a96e, #e2d9c8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Pipeline CRM
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(200,169,110,0.6)" }}>
              Gérez vos opportunités commerciales — Vue Kanban
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: "12px",
                padding: "14px 20px",
                minWidth: "140px",
              }}
            >
              <div style={{ fontSize: "11px", color: "rgba(200,169,110,0.6)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Pipeline actif
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#38bdf8" }}>
                {formatValue(totalPipeline)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: "12px",
                padding: "14px 20px",
                minWidth: "140px",
              }}
            >
              <div style={{ fontSize: "11px", color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Gagné
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#4ade80" }}>
                {formatValue(totalGagne)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(200,169,110,0.05)",
                border: "1px solid rgba(200,169,110,0.12)",
                borderRadius: "12px",
                padding: "14px 20px",
                minWidth: "140px",
              }}
            >
              <div style={{ fontSize: "11px", color: "rgba(200,169,110,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Total deals
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#c8a96e" }}>
                {Object.values(columns).reduce((a, c) => a + c.cards.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "28px 40px",
          minWidth: "1100px",
          alignItems: "flex-start",
        }}
      >
        {Object.entries(columns).map(([colKey, col]) => (
          <div
            key={colKey}
            onDragOver={(e) => { e.preventDefault(); setHoveredCol(colKey); }}
            onDrop={() => handleDrop(colKey)}
            onDragLeave={() => { if (hoveredCol === colKey) setHoveredCol(null); }}
            style={{
              flex: "1",
              minWidth: "200px",
              maxWidth: "280px",
              borderRadius: "16px",
              background: hoveredCol === colKey
                ? "rgba(200,169,110,0.06)"
                : "rgba(255,255,255,0.02)",
              border: hoveredCol === colKey
                ? "2px solid rgba(200,169,110,0.4)"
                : "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.2s ease",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 16px 12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: col.color,
                      boxShadow: "0 0 8px " + col.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: col.color,
                      letterSpacing: "0.3px",
                      textTransform: "uppercase",
                    }}
                  >
                    {col.title}
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: "20px",
                    padding: "2px 9px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "rgba(226,217,200,0.7)",
                  }}
                >
                  {col.cards.length}
                </div>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "rgba(226,217,200,0.5)",
                }}
              >
                {formatValue(getTotalValue(col.cards))}
              </div>
            </div>

            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "80px" }}>
              {col.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card, colKey)}
                  onClick={() => openDetail(card, colKey)}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: hoveredCard === card.id
                      ? "rgba(200,169,110,0.09)"
                      : "rgba(255,255,255,0.035)",
                    border: hoveredCard === card.id
                      ? "1px solid rgba(200,169,110,0.3)"
                      : "1px solid rgba(255,255,255,0.07