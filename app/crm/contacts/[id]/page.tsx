"use client";
import { useState } from "react";

export default function ContactFiche({ params }) {
  const [activeTab, setActiveTab] = useState("profil");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([
    { id: 1, text: "Premier contact très positif, intéressé par la formation avancée.", date: "12 Jan 2025", auteur: "Marie L." },
    { id: 2, text: "A demandé un devis pour 3 séances supplémentaires.", date: "28 Jan 2025", auteur: "Jean P." }
  ]);

  const contact = {
    id: params?.id || "CTX-00142",
    nom: "Alexandre Fontaine",
    email: "alexandre.fontaine@email.com",
    telephone: "+33 6 45 78 12 34",
    entreprise: "TechVision SAS",
    poste: "Directeur Innovation",
    score: 87,
    statut: "Actif",
    dateCreation: "5 Octobre 2024",
    avatar: "AF"
  };

  const formations = [
    { id: 1, titre: "Leadership & Management", niveau: "Avancé", statut: "Terminé", date: "Nov 2024", duree: "3 jours", note: 9.2 },
    { id: 2, titre: "Communication Stratégique", niveau: "Intermédiaire", statut: "En cours", date: "Fév 2025", duree: "2 jours", note: null },
    { id: 3, titre: "Intelligence Émotionnelle", niveau: "Expert", statut: "Planifié", date: "Avr 2025", duree: "1 jour", note: null }
  ];

  const seances = [
    { id: 1, type: "Coaching individuel", coach: "Sophie Martin", date: "14 Jan 2025", heure: "10h00", duree: "1h30", statut: "Réalisé" },
    { id: 2, type: "Atelier groupe", coach: "Pierre Durand", date: "22 Jan 2025", heure: "14h00", duree: "3h00", statut: "Réalisé" },
    { id: 3, type: "Coaching individuel", coach: "Sophie Martin", date: "10 Fév 2025", heure: "09h30", duree: "1h30", statut: "Réalisé" },
    { id: 4, type: "Session bilan", coach: "Marie Leroy", date: "5 Mar 2025", heure: "11h00", duree: "1h00", statut: "Planifié" }
  ];

  const historique = [
    { id: 1, action: "Inscription formation Leadership", date: "5 Oct 2024", type: "formation" },
    { id: 2, action: "Premier paiement reçu — 1 200€", date: "6 Oct 2024", type: "paiement" },
    { id: 3, action: "Séance coaching #1 complétée", date: "14 Jan 2025", type: "seance" },
    { id: 4, action: "Score mis à jour : 72 → 87", date: "20 Jan 2025", type: "score" },
    { id: 5, action: "Nouveau devis envoyé par email", date: "28 Jan 2025", type: "email" },
    { id: 6, action: "Inscription formation Communication", date: "1 Fév 2025", type: "formation" }
  ];

  const scoreColor = contact.score >= 80 ? "#4ade80" : contact.score >= 60 ? "#c8a96e" : "#f87171";
  const scoreAngle = (contact.score / 100) * 360;

  const addNote = () => {
    if (note.trim() === "") return;
    const newNote = {
      id: notes.length + 1,
      text: note,
      date: "Aujourd'hui",
      auteur: "Vous"
    };
    setNotes([newNote, ...notes]);
    setNote("");
  };

  const statutFormationColor = (statut) => {
    if (statut === "Terminé") return "#4ade80";
    if (statut === "En cours") return "#c8a96e";
    return "#818cf8";
  };

  const statutSeanceColor = (statut) => {
    if (statut === "Réalisé") return "#4ade80";
    return "#c8a96e";
  };

  const historiqueIcon = (type) => {
    if (type === "formation") return "🎓";
    if (type === "paiement") return "💳";
    if (type === "seance") return "📅";
    if (type === "score") return "⭐";
    if (type === "email") return "📧";
    return "📌";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" }}>

      <div style={{ background: "linear-gradient(180deg, #0d0d14 0%, #050508 100%)", borderBottom: "1px solid #1a1a2e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c8a96e", boxShadow: "0 0 10px #c8a96e" }}></div>
          <span style={{ color: "#64748b", fontSize: "13px" }}>CRM</span>
          <span style={{ color: "#334155", fontSize: "13px" }}>/</span>
          <span style={{ color: "#64748b", fontSize: "13px" }}>Contacts</span>
          <span style={{ color: "#334155", fontSize: "13px" }}>/</span>
          <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "500" }}>{contact.nom}</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ padding: "8px 18px", backgroundColor: "transparent", border: "1px solid #1e293b", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>
            Modifier
          </button>
          <button style={{ padding: "8px 18px", background: "linear-gradient(135deg, #c8a96e, #b8943a)", border: "none", borderRadius: "8px", color: "#050508", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            + Séance
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ background: "linear-gradient(135deg, #0d0d14 0%, #0a0a12 100%)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #c8a96e, #8b6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800", color: "#050508", margin: "0 auto", boxShadow: "0 0 30px rgba(200,169,110,0.3)" }}>
                  {contact.avatar}
                </div>
                <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#4ade80", border: "2px solid #0d0d14" }}></div>
              </div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "#f1f5f9" }}>{contact.nom}</h2>
              <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#c8a96e", fontWeight: "500" }}>{contact.poste}</p>
              <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#64748b" }}>{contact.entreprise}</p>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div style={{ position: "relative", width: "90px", height: "90px" }}>
                  <svg viewBox="0 0 90 90" style={{ width: "90px", height: "90px", transform: "rotate(-90deg)" }}>
                    <circle cx="45" cy="45" r="38" fill="none" stroke="#1a1a2e" strokeWidth="8" />
                    <circle cx="45" cy="45" r="38" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={String(2 * 3.14159 * 38)} strokeDashoffset={String(2 * 3.14159 * 38 * (1 - contact.score / 100))} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 6px " + scoreColor + ")" }} />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: scoreColor, lineHeight: "1" }}>{contact.score}</div>
                    <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>SCORE</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#050508", borderRadius: "8px", padding: "6px 14px", display: "inline-block", border: "1px solid #16a34a" }}>
                <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: "600" }}>● {contact.statut}</span>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #0d0d14 0%, #0a0a12 100%)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 18px 0", fontSize: "13px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Coordonnées</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#0d1117", border: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: "0" }}>📧</div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Email</div>
                    <div style={{ fontSize: "13px", color: "#c8a96e", fontWeight: "500" }}>{contact.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#0d1117", border: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: "0" }}>📱</div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Téléphone</div>
                    <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{contact.telephone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#0d1117", border: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: "0" }}>🏢</div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Entreprise</div>
                    <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{contact.entreprise}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#0d1117", border: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: "0" }}>🗓</div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#475569", marginBottom: "2px" }}>Client depuis</div>
                    <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{contact.dateCreation}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #0d0d14 0%, #0a0a12 100%)", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Résumé activité</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#050508