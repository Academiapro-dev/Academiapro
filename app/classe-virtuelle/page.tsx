"use client";
import { useState } from "react";

export default function ClasseVirtuelle() {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, auteur: "Sophie M.", texte: "Bonjour tout le monde !", heure: "09:01", avatar: "S" },
    { id: 2, auteur: "Marc D.", texte: "Prêt pour le cours !", heure: "09:02", avatar: "M" },
    { id: 3, auteur: "Léa R.", texte: "La session commence dans 2 min ?", heure: "09:03", avatar: "L" },
    { id: 4, auteur: "Formateur", texte: "Oui, on commence maintenant. Bienvenue à tous !", heure: "09:05", avatar: "F" },
  ]);
  const [sessionActive, setSessionActive] = useState(null);
  const [onglet, setOnglet] = useState("calendrier");

  const sessions = [
    { id: 1, titre: "Introduction au Design UX", date: "Lundi 16 Juin", heure: "09h00 - 11h00", duree: "2h", participants: 18, statut: "live", couleur: "#c8a96e" },
    { id: 2, titre: "Typographie & Hiérarchie", date: "Mercredi 18 Juin", heure: "14h00 - 16h00", duree: "2h", participants: 12, statut: "upcoming", couleur: "#7e6aaa" },
    { id: 3, titre: "Couleurs & Accessibilité", date: "Vendredi 20 Juin", heure: "10h00 - 12h00", duree: "2h", participants: 15, statut: "upcoming", couleur: "#4a9e8a" },
    { id: 4, titre: "Prototypage Figma", date: "Lundi 23 Juin", heure: "09h00 - 12h00", duree: "3h", participants: 20, statut: "upcoming", couleur: "#c8a96e" },
    { id: 5, titre: "Tests Utilisateurs", date: "Jeudi 26 Juin", heure: "15h00 - 17h00", duree: "2h", participants: 14, statut: "terminee", couleur: "#555" },
    { id: 6, titre: "Présentation Finale", date: "Vendredi 27 Juin", heure: "10h00 - 13h00", duree: "3h", participants: 22, statut: "terminee", couleur: "#555" },
  ];

  const participants = [
    { nom: "Sophie M.", avatar: "S", statut: "actif", role: "étudiant" },
    { nom: "Marc D.", avatar: "M", statut: "actif", role: "étudiant" },
    { nom: "Léa R.", avatar: "L", statut: "actif", role: "étudiant" },
    { nom: "Alex K.", avatar: "A", statut: "absent", role: "étudiant" },
    { nom: "Nina P.", avatar: "N", statut: "actif", role: "étudiant" },
    { nom: "Tom B.", avatar: "T", statut: "actif", role: "étudiant" },
    { nom: "Formateur", avatar: "F", statut: "actif", role: "formateur" },
  ];

  function envoyerMessage() {
    if (messageInput.trim() === "") return;
    const nouveau = {
      id: messages.length + 1,
      auteur: "Vous",
      texte: messageInput,
      heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      avatar: "V",
    };
    setMessages([...messages, nouveau]);
    setMessageInput("");
  }

  function rejoindre(session) {
    if (session.statut === "terminee") return;
    setSessionActive(session);
    setOnglet("chat");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Segoe UI', sans-serif", color: "#e8e0d4" }}>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #1a1a2e", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", background: "#07070f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #c8a96e, #a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎓</div>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#c8a96e", letterSpacing: "0.5px" }}>EduClasse</span>
          <span style={{ fontSize: "12px", color: "#555", marginLeft: "4px" }}>Plateforme Virtuelle</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}></div>
            <span style={{ fontSize: "13px", color: "#888" }}>1 session live</span>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #a07840)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#050508" }}>V</div>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>

        {/* SIDEBAR GAUCHE */}
        <div style={{ width: "260px", borderRight: "1px solid #1a1a2e", background: "#07070f", display: "flex", flexDirection: "column", flexShrink: "0" }}>
          <div style={{ padding: "24px 20px 16px" }}>
            <p style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 16px" }}>Navigation</p>
            {[
              { id: "calendrier", label: "Calendrier", icon: "📅" },
              { id: "chat", label: "Chat & Session", icon: "💬" },
              { id: "participants", label: "Participants", icon: "👥" },
            ].map(function(item) {
              return (
                <button
                  key={item.id}
                  onClick={function() { setOnglet(item.id); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", marginBottom: "4px", background: onglet === item.id ? "rgba(200,169,110,0.12)" : "transparent", color: onglet === item.id ? "#c8a96e" : "#666", fontWeight: onglet === item.id ? "600" : "400", fontSize: "14px", transition: "all 0.2s", textAlign: "left" }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.label}
                  {item.id === "chat" && sessionActive && (
                    <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}></div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "0 20px 16px", borderTop: "1px solid #111", marginTop: "8px", paddingTop: "20px" }}>
            <p style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px" }}>Progression</p>
            <div style={{ background: "#0d0d1a", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#888" }}>Sessions complétées</span>
                <span style={{ fontSize: "12px", color: "#c8a96e", fontWeight: "600" }}>2/6</span>
              </div>
              <div style={{ height: "6px", background: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "33%", background: "linear-gradient(90deg, #c8a96e, #a07840)", borderRadius: "3px" }}></div>
              </div>
              <p style={{ fontSize: "11px", color: "#555", margin: "8px 0 0" }}>33% du cours terminé</p>
            </div>
          </div>

          <div style={{ padding: "0 20px", marginTop: "4px" }}>
            <p style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 12px" }}>Prochain cours</p>
            <div style={{ background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "10px", padding: "12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "#c8a96e" }}>Typographie</p>
              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#888" }}>Mercredi 18 Juin</p>
              <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>14h00 — 2 jours</p>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div style={{ flex: "1", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* === ONGLET CALENDRIER === */}
          {onglet === "calendrier" && (
            <div style={{ flex: "1", overflowY: "auto", padding: "32px 40px" }}>
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: "700", color: "#e8e0d4" }}>Calendrier des Sessions</h1>
                <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Formation Design UX — Juin 2025</p>
              </div>

              {/* LEGENDE */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
                {[
                  { label: "En direct", color: "#4ade80", dot: true },
                  { label: "À venir", color: "#c8a96e", dot: true },
                  { label: "Terminée", color: "#333", dot: true },
                ].map(function(item) {
                  return (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }}></div>
                      <span style={{ fontSize: "12px", color: "#666" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* GRID SESSIONS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {sessions.map(function(session) {
                  const isLive = session.statut === "live";
                  const isTerminee = session.statut === "terminee";
                  return (
                    <div
                      key={session.id}
                      style={{ background: isTerminee ? "#0a0a12" : "linear-gradient(135deg, #0d0d1a 0%, #0f0f1e 100%)", border: isLive ? "1px solid rgba(74,222,128,0.3)" : isTerminee ? "1px solid #111" : "1px solid #1a1a2e", borderRadius: "16px", padding: "22px", position: "relative", overflow: "hidden", transition: "all 0.3s" }}
                    >
                      {/* ACCENT BAR */}
                      <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "3px", background: isTerminee ? "#1a1a2e" : isLive ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, " + session.couleur + ", #a07840)", borderRadius: "16px 16px 0 0" }}></div>

                      {/* BADGE STATUT */}
                      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
                        {isLive && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "20px", padding: "3px 10px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}></div>
                            <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: "600" }}>LIVE</span>
                          </div>
                        )}
                        {session.statut === "upcoming" && (
                          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "20px", padding: "3px 10px" }}>
                            <span style={{ fontSize: "11px", color: "#c8a96e", fontWeight: "600" }}>À VENIR</span>
                          </div>
                        )}
                        {isTerminee && (
                          <div style={{ background