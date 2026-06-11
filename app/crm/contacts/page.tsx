export default function ContactsPage() {
  const [contacts, setContacts] = React.useState([
    {
      id: 1,
      nom: "Sophie Marchand",
      email: "sophie.marchand@gmail.com",
      metier: "Directrice Marketing",
      score: 92,
      statut: "chaud",
      derniereInteraction: "2024-01-15",
    },
    {
      id: 2,
      nom: "Thomas Dubois",
      email: "thomas.dubois@startup.fr",
      metier: "CEO",
      score: 78,
      statut: "client",
      derniereInteraction: "2024-01-10",
    },
    {
      id: 3,
      nom: "Marie Laurent",
      email: "marie.laurent@edu.fr",
      metier: "Formatrice",
      score: 45,
      statut: "tiede",
      derniereInteraction: "2024-01-08",
    },
    {
      id: 4,
      nom: "Julien Bernard",
      email: "julien.bernard@corp.com",
      metier: "Responsable RH",
      score: 23,
      statut: "froid",
      derniereInteraction: "2023-12-20",
    },
    {
      id: 5,
      nom: "Clara Petit",
      email: "clara.petit@agence.fr",
      metier: "Chef de Projet",
      score: 67,
      statut: "lead",
      derniereInteraction: "2024-01-12",
    },
    {
      id: 6,
      nom: "Antoine Moreau",
      email: "antoine.moreau@tech.io",
      metier: "Développeur Full Stack",
      score: 88,
      statut: "chaud",
      derniereInteraction: "2024-01-14",
    },
    {
      id: 7,
      nom: "Isabelle Roux",
      email: "isabelle.roux@conseil.fr",
      metier: "Consultante",
      score: 95,
      statut: "client",
      derniereInteraction: "2024-01-16",
    },
    {
      id: 8,
      nom: "Nicolas Blanc",
      email: "nicolas.blanc@media.fr",
      metier: "Journaliste",
      score: 34,
      statut: "froid",
      derniereInteraction: "2023-12-15",
    },
  ]);

  const [recherche, setRecherche] = React.useState("");
  const [filtreStatut, setFiltreStatut] = React.useState("tous");
  const [filtreScore, setFiltreScore] = React.useState("tous");
  const [filtreDate, setFiltreDate] = React.useState("tous");
  const [triColonne, setTriColonne] = React.useState("nom");
  const [triDirection, setTriDirection] = React.useState("asc");
  const [showModal, setShowModal] = React.useState(false);
  const [hoveredRow, setHoveredRow] = React.useState(null);
  const [hoveredBtn, setHoveredBtn] = React.useState(null);
  const [notification, setNotification] = React.useState(null);
  const [newContact, setNewContact] = React.useState({
    nom: "",
    email: "",
    metier: "",
    score: 50,
    statut: "lead",
    derniereInteraction: new Date().toISOString().split("T")[0],
  });
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const statutConfig = {
    lead: { label: "Lead", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
    chaud: { label: "Chaud", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    tiede: { label: "Tiède", color: "#eab308", bg: "rgba(234,179,8,0.15)" },
    froid: { label: "Froid", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    client: { label: "Client", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#c8a96e";
    if (score >= 40) return "#eab308";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Moyen";
    return "Faible";
  };

  const filteredContacts = React.useMemo(() => {
    let result = [...contacts];

    if (recherche) {
      const q = recherche.toLowerCase();
      result = result.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.metier.toLowerCase().includes(q)
      );
    }

    if (filtreStatut !== "tous") {
      result = result.filter((c) => c.statut === filtreStatut);
    }

    if (filtreScore !== "tous") {
      if (filtreScore === "excellent") result = result.filter((c) => c.score >= 80);
      else if (filtreScore === "bon") result = result.filter((c) => c.score >= 60 && c.score < 80);
      else if (filtreScore === "moyen") result = result.filter((c) => c.score >= 40 && c.score < 60);
      else if (filtreScore === "faible") result = result.filter((c) => c.score < 40);
    }

    if (filtreDate !== "tous") {
      const now = new Date();
      result = result.filter((c) => {
        const d = new Date(c.derniereInteraction);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        if (filtreDate === "7j") return diff <= 7;
        if (filtreDate === "30j") return diff <= 30;
        if (filtreDate === "90j") return diff <= 90;
        return true;
      });
    }

    result.sort((a, b) => {
      let valA = a[triColonne];
      let valB = b[triColonne];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return triDirection === "asc" ? -1 : 1;
      if (valA > valB) return triDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, recherche, filtreStatut, filtreScore, filtreDate, triColonne, triDirection]);

  const handleTri = (colonne) => {
    if (triColonne === colonne) {
      setTriDirection(triDirection === "asc" ? "desc" : "asc");
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
  };

  const exportCSV = () => {
    const headers = ["Nom", "Email", "Métier", "Score", "Statut", "Dernière Interaction"];
    const rows = filteredContacts.map((c) => [
      c.nom,
      c.email,
      c.metier,
      c.score,
      c.statut,
      c.derniereInteraction,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_academia_pro.csv";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Export CSV réussi !", "success");
  };

  const handleAjouterContact = () => {
    if (!newContact.nom || !newContact.email) {
      showNotification("Nom et email requis", "error");
      return;
    }
    const contact = { ...newContact, id: Date.now(), score: Number(newContact.score) };
    setContacts([contact, ...contacts]);
    setShowModal(false);
    setNewContact({
      nom: "",
      email: "",
      metier: "",
      score: 50,
      statut: "lead",
      derniereInteraction: new Date().toISOString().split("T")[0],
    });
    showNotification("Contact ajouté avec succès !", "success");
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    showNotification("Contact supprimé", "success");
  };

  const toggleSelectContact = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const deleteSelected = () => {
    setContacts(contacts.filter((c) => !selectedContacts.includes(c.id)));
    setSelectedContacts([]);
    showNotification(`${selectedContacts.length} contact(s) supprimé(s)`, "success");
  };

  const stats = React.useMemo(() => {
    return {
      total: contacts.length,
      clients: contacts.filter((c) => c.statut === "client").length,
      chauds: contacts.filter((c) => c.statut === "chaud").length,
      scoresMoyen: Math.round(contacts.reduce((s, c) => s + c.score, 0) / contacts.length),
    };
  }, [contacts]);

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#e2e8f0",
    padding: "0",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
    borderBottom: "1px solid rgba(200,169,110,0.2)",
    padding: "24px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  };

  const logoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const logoIconStyle = {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#050508",
  };

  const logoTextStyle = {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const navStyle = {
    display: "flex",
    gap: "8px",
  };

  const navItemStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#94a3b8",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const navItemActiveStyle = {
    ...navItemStyle,
    background: "rgba(200,169,110,0.15)",
    color: "#c8a96e",
  };

  const mainStyle = {
    padding: "32px 40px",
    maxWidth: "1600px",
    margin: "0 auto",
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "28px",
  };

  const statCardStyle = {
    background: "linear-gradient(135deg, #0d0d15 0%, #111118 100%)",
    border: "1px solid rgba(200,169,110,0.15)",
    borderRadius: "16px",
    padding: "20px 24px",
    position: "relative",
    overflow: "hidden",
  };

  const statCardAccentStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, #c8a96e, transparent)",
  };

  const toolbarStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const searchContainerStyle = {
    position: "relative",
    flex: "1",
    minWidth: "220px",
  };

  const searchInputStyle = {
    width: "100%",
    padding: "10px 16px 10px 40px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  };

  const selectStyle = {
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    minWidth: "130px",
  };

  const btnPrimaryStyle = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #c8a96e, #