export default function ContactPage({ params }: { params: { id: string } }) {
  const [contact, setContact] = React.useState<{
    id: string;
    nom: string;
    email: string;
    telephone: string;
    metier: string;
    score: number;
    statut: string;
    historique: Array<{ date: string; type: string; description: string }>;
    formations: Array<{ titre: string; date: string; montant: number }>;
    notes: string;
  }>({
    id: params.id,
    nom: "Sophie Marchand",
    email: "sophie.marchand@exemple.fr",
    telephone: "+33 6 12 34 56 78",
    metier: "Directrice Marketing",
    score: 87,
    statut: "Prospect chaud",
    historique: [
      { date: "2024-01-15", type: "Email", description: "Envoi brochure formation IA" },
      { date: "2024-01-20", type: "Appel", description: "Appel de découverte 25 min" },
      { date: "2024-02-01", type: "Réunion", description: "Démonstration plateforme" },
      { date: "2024-02-10", type: "Email", description: "Suivi proposition commerciale" },
    ],
    formations: [
      { titre: "IA Fondamentaux", date: "2023-11-01", montant: 490 },
      { titre: "Prompt Engineering Pro", date: "2024-01-05", montant: 790 },
    ],
    notes: "Cliente très intéressée par les formations avancées. Souhaite un devis groupe pour son équipe de 8 personnes. Rappeler en mars pour closing.",
  });

  const [noteInput, setNoteInput] = React.useState("");
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showCallModal, setShowCallModal] = React.useState(false);
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailBody, setEmailBody] = React.useState("");
  const [callNote, setCallNote] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("apercu");
  const [notification, setNotification] = React.useState<string | null>(null);
  const [statutDropdown, setStatutDropdown] = React.useState(false);

  const statuts = ["Nouveau lead", "Prospect froid", "Prospect chaud", "Négociation", "Client actif", "Client inactif", "Perdu"];

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setContact(prev => ({
      ...prev,
      historique: [{ date: today, type: "Note", description: noteInput }, ...prev.historique],
      notes: noteInput + "\n\n---\n\n" + prev.notes,
    }));
    setNoteInput("");
    setShowNoteModal(false);
    showNotif("Note ajoutée avec succès");
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setContact(prev => ({
      ...prev,
      historique: [{ date: today, type: "Email", description: emailSubject }, ...prev.historique],
    }));
    setEmailSubject("");
    setEmailBody("");
    setShowEmailModal(false);
    showNotif("Email envoyé à " + contact.email);
  };

  const handleLogCall = () => {
    const today = new Date().toISOString().split("T")[0];
    setContact(prev => ({
      ...prev,
      historique: [{ date: today, type: "Appel", description: callNote || "Appel téléphonique" }, ...prev.historique],
    }));
    setCallNote("");
    setShowCallModal(false);
    showNotif("Appel enregistré");
  };

  const handleChangeStatut = (newStatut: string) => {
    setContact(prev => ({ ...prev, statut: newStatut }));
    setStatutDropdown(false);
    showNotif("Statut mis à jour : " + newStatut);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#4ade80";
    if (score >= 50) return "#c8a96e";
    return "#f87171";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Email": return "✉";
      case "Appel": return "📞";
      case "Réunion": return "🤝";
      case "Note": return "📝";
      default: return "•";
    }
  };

  const totalFormations = contact.formations.reduce((acc, f) => acc + f.montant, 0);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: "#0d0d14",
    border: "1px solid #c8a96e40",
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#050508",
    border: "1px solid #c8a96e30",
    borderRadius: "8px",
    color: "#f0e6d3",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const btnPrimaryStyle: React.CSSProperties = {
    backgroundColor: "#c8a96e",
    color: "#050508",
    border: "none",
    borderRadius: "8px",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.2s",
  };

  const btnSecondaryStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    color: "#9ca3af",
    border: "1px solid #ffffff15",
    borderRadius: "8px",
    padding: "10px 22px",
    fontSize: "14px",
    cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050508", fontFamily: "'Inter', system-ui, sans-serif", color: "#f0e6d3" }}>

      {notification && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          backgroundColor: "#c8a96e",
          color: "#050508",
          padding: "12px 20px",
          borderRadius: "10px",
          fontWeight: "700",
          fontSize: "14px",
          zIndex: 2000,
          boxShadow: "0 8px 24px rgba(200,169,110,0.4)",
          animation: "fadeIn 0.3s ease",
        }}>
          ✓ {notification}
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}>
            <span style={{ cursor: "pointer", color: "#c8a96e" }}>CRM AcadémIA Pro</span>
            <span>/</span>
            <span style={{ cursor: "pointer", color: "#c8a96e" }}>Contacts</span>
            <span>/</span>
            <span>{contact.nom}</span>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #0d0d14 0%, #111118 100%)",
          border: "1px solid #c8a96e25",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: "0 4px 40px rgba(200,169,110,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #8b6914)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "800",
                color: "#050508",
                flexShrink: 0,
                boxShadow: "0 4px 20px rgba(200,169,110,0.3)",
              }}>
                {contact.nom.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#f0e6d3", margin: "0 0 4px 0" }}>{contact.nom}</h1>
                <p style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 6px 0", fontWeight: "500" }}>{contact.metier}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{
                    backgroundColor: "#c8a96e18",
                    border: "1px solid #c8a96e40",
                    color: "#c8a96e",
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}>
                    {contact.statut}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>ID: {params.id}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

              <button
                onClick={() => setShowEmailModal(true)}
                style={{
                  ...btnPrimaryStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 18px",
                }}
              >
                <span>✉</span> Email
              </button>

              <button
                onClick={() => setShowCallModal(true)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #c8a96e50",
                  color: "#c8a96e",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>📞</span> Appeler
              </button>

              <button
                onClick={() => setShowNoteModal(true)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ffffff15",
                  color: "#9ca3af",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>📝</span> Note
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setStatutDropdown(!statutDropdown)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #ffffff15",
                    color: "#9ca3af",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  ⚡ Statut ▾
                </button>
                {statutDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "#0d0d14",
                    border: "1px solid #c8a96e30",
                    borderRadius: "12px",
                    padding: "8px",
                    zIndex: 100,
                    minWidth: "180px",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  }}>
                    {statuts.map(s => (
                      <button
                        key={s}
                        onClick={() => handleChangeStatut(s)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          backgroundColor: contact.statut === s ? "#c8a96e18" : "transparent",
                          border: "none",
                          color: contact.statut === s ? "#c8a96e" : "#d1d5db",
                          padding: "9px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: contact.statut === s ? "700" : "400",
                        }}
                      >
                        {contact.statut === s ? "✓ " : ""}{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "28px",
            paddingTop: "24px",
            borderTop: "1px solid #ffffff08",
          }}>
            {[
              { label: "Email", value: contact.email, icon: "✉" },
              { label: "Téléphone", value: contact.telephone, icon: "📞" },
              { label: "Métier", value: contact.metier, icon: "💼"