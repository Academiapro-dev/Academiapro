"use client";
import { useState } from "react";

export default function CRMContactsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [contacts, setContacts] = useState([
    { id: 1, name: "Alice Martin", email: "alice.martin@email.com", status: "actif", score: 92 },
    { id: 2, name: "Bruno Leclerc", email: "bruno.leclerc@email.com", status: "inactif", score: 45 },
    { id: 3, name: "Clara Dupont", email: "clara.dupont@email.com", status: "prospect", score: 67 },
    { id: 4, name: "David Moreau", email: "david.moreau@email.com", status: "actif", score: 88 },
    { id: 5, name: "Eva Rousseau", email: "eva.rousseau@email.com", status: "prospect", score: 54 },
    { id: 6, name: "Franck Bernard", email: "franck.bernard@email.com", status: "actif", score: 76 },
    { id: 7, name: "Grace Petit", email: "grace.petit@email.com", status: "inactif", score: 31 },
    { id: 8, name: "Hugo Simon", email: "hugo.simon@email.com", status: "actif", score: 95 },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStatus, setNewStatus] = useState("prospect");
  const [newScore, setNewScore] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState("");

  const filtered = contacts.filter(function(c) {
    const matchSearch =
      c.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
      c.email.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleAdd() {
    if (!newName || !newEmail) return;
    const scoreNum = parseInt(newScore, 10);
    setContacts([
      ...contacts,
      {
        id: Date.now(),
        name: newName,
        email: newEmail,
        status: newStatus,
        score: isNaN(scoreNum) ? 50 : Math.min(100, Math.max(0, scoreNum)),
      },
    ]);
    setNewName("");
    setNewEmail("");
    setNewStatus("prospect");
    setNewScore("");
    setShowModal(false);
  }

  function getStatusColor(status) {
    if (status === "actif") return "#4ade80";
    if (status === "inactif") return "#f87171";
    return "#c8a96e";
  }

  function getStatusBg(status) {
    if (status === "actif") return "rgba(74,222,128,0.12)";
    if (status === "inactif") return "rgba(248,113,113,0.12)";
    return "rgba(200,169,110,0.12)";
  }

  function getScoreColor(score) {
    if (score >= 80) return "#4ade80";
    if (score >= 50) return "#c8a96e";
    return "#f87171";
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: "0",
      margin: "0",
    }}>

      <div style={{
        background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0) 60%)",
        borderBottom: "1px solid rgba(200,169,110,0.15)",
        padding: "32px 48px 28px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "6px",
          }}>
            <div style={{
              width: "38px",
              height: "38px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}>
              👥
            </div>
            <h1 style={{
              color: "#c8a96e",
              fontSize: "26px",
              fontWeight: "700",
              margin: "0",
              letterSpacing: "0.5px",
            }}>
              CRM Contacts
            </h1>
          </div>
          <p style={{
            color: "rgba(200,169,110,0.5)",
            margin: "0",
            fontSize: "14px",
            paddingLeft: "52px",
          }}>
            {contacts.length} contacts enregistrés
          </p>
        </div>

        <button
          onClick={function() { setShowModal(true); }}
          onMouseEnter={function() { setHoveredBtn("add"); }}
          onMouseLeave={function() { setHoveredBtn(""); }}
          style={{
            background: hoveredBtn === "add"
              ? "linear-gradient(135deg, #d4b87a, #b08840)"
              : "linear-gradient(135deg, #c8a96e, #a07840)",
            color: "#050508",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            boxShadow: hoveredBtn === "add"
              ? "0 6px 24px rgba(200,169,110,0.35)"
              : "0 4px 16px rgba(200,169,110,0.2)",
            transform: hoveredBtn === "add" ? "translateY(-1px)" : "translateY(0)",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: "1" }}>+</span>
          Ajouter un contact
        </button>
      </div>

      <div style={{
        padding: "28px 48px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <div style={{
          position: "relative",
          flex: "1",
          minWidth: "220px",
          maxWidth: "420px",
        }}>
          <span style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "16px",
            opacity: "0.5",
          }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            style={{
              width: "100%",
              padding: "11px 14px 11px 42px",
              background: "rgba(200,169,110,0.06)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "10px",
              color: "#f0e6d0",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "actif", "inactif", "prospect"].map(function(s) {
            const isActive = filterStatus === s;
            const label = s === "all" ? "Tous" : s.charAt(0).toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                onClick={function() { setFilterStatus(s); }}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: isActive
                    ? "1px solid rgba(200,169,110,0.6)"
                    : "1px solid rgba(200,169,110,0.15)",
                  background: isActive
                    ? "rgba(200,169,110,0.15)"
                    : "rgba(200,169,110,0.04)",
                  color: isActive ? "#c8a96e" : "rgba(200,169,110,0.5)",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{
          marginLeft: "auto",
          color: "rgba(200,169,110,0.4)",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}>
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{
        padding: "0 48px 48px 48px",
      }}>
        <div style={{
          background: "rgba(200,169,110,0.03)",
          border: "1px solid rgba(200,169,110,0.1)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
          }}>
            <thead>
              <tr style={{
                background: "rgba(200,169,110,0.07)",
                borderBottom: "1px solid rgba(200,169,110,0.15)",
              }}>
                <th style={{
                  padding: "14px 24px",
                  textAlign: "left",
                  color: "rgba(200,169,110,0.6)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}>
                  Nom
                </th>
                <th style={{
                  padding: "14px 24px",
                  textAlign: "left",
                  color: "rgba(200,169,110,0.6)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}>
                  Email
                </th>
                <th style={{
                  padding: "14px 24px",
                  textAlign: "left",
                  color: "rgba(200,169,110,0.6)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}>
                  Statut
                </th>
                <th style={{
                  padding: "14px 24px",
                  textAlign: "left",
                  color: "rgba(200,169,110,0.6)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}>
                  Score
                </th>
                <th style={{
                  padding: "14px 24px",
                  textAlign: "right",
                  color: "rgba(200,169,110,0.6)",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{
                    padding: "60px 24px",
                    textAlign: "center",
                    color: "rgba(200,169,110,0.3)",
                    fontSize: "15px",
                  }}>
                    Aucun contact trouvé
                  </td>
                </tr>
              )}
              {filtered.map(function(contact, idx) {
                const isHovered = hoveredRow === contact.id;
                return (
                  <tr
                    key={contact.id}
                    onMouseEnter={function() { setHoveredRow(contact.id); }}
                    onMouseLeave={function() { setHoveredRow(null); }}
                    style={{
                      borderBottom: idx < filtered.length - 1
                        ? "1px solid rgba(200,169,110,0.07)"
                        : "none",
                      background: isHovered
                        ? "rgba(200,169,110,0.05)"
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, rgba(200,169,110,0.25), rgba(200,169,110,0.1))",
                          border: "1px solid rgba(200,169,110,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#c8a96e",
                          fontSize: "13px",
                          fontWeight: "700",
                          flexShrink: "0",
                        }}>
                          {contact.name.charAt(0)}
                        </div>
                        <span style={{
                          color: "#f0e6d0",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}>
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        color: "rgba(240,230,208,0.6)",
                        fontSize: "14px",
                      }}>
                        {contact.email}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: getStatusBg(contact.status),
                        color: getStatusColor(contact.status),
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "1px solid",
                        borderColor: getStatusColor(contact.status) + "33