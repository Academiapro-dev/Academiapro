export default function ReplaysPage() {
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<string>("all");
  const [selectedDate, setSelectedDate] = React.useState<string>("all");
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);
  const [hoveredFilter, setHoveredFilter] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<number | null>(null);

  const replays = [
    {
      id: 1,
      title: "Maîtriser les fonctions dérivées",
      specialty: "Mathématiques",
      date: "2024-01-15",
      duration: "1h 24min",
      teacher: "Prof. Martin",
      thumbnail: "M",
      availableAt: new Date("2024-01-15T20:00:00"),
      color: "#4f8ef7",
    },
    {
      id: 2,
      title: "La Révolution française en profondeur",
      specialty: "Histoire",
      date: "2024-01-14",
      duration: "58min",
      teacher: "Prof. Dubois",
      thumbnail: "H",
      availableAt: new Date("2024-01-14T18:00:00"),
      color: "#e87c3e",
    },
    {
      id: 3,
      title: "Chimie organique : alcanes et alcènes",
      specialty: "Chimie",
      date: "2024-01-13",
      duration: "1h 10min",
      teacher: "Prof. Laurent",
      thumbnail: "C",
      availableAt: new Date("2024-01-13T16:00:00"),
      color: "#5ec46e",
    },
    {
      id: 4,
      title: "Littérature et narration au XIXe siècle",
      specialty: "Français",
      date: "2024-01-12",
      duration: "1h 05min",
      teacher: "Prof. Bernard",
      thumbnail: "F",
      availableAt: new Date("2024-01-12T14:00:00"),
      color: "#c45ec4",
    },
    {
      id: 5,
      title: "Mécanique quantique : introduction",
      specialty: "Physique",
      date: "2024-01-11",
      duration: "1h 32min",
      teacher: "Prof. Moreau",
      thumbnail: "P",
      availableAt: new Date("2024-01-11T10:00:00"),
      color: "#f7c94f",
    },
    {
      id: 6,
      title: "Géopolitique mondiale contemporaine",
      specialty: "Histoire",
      date: "2024-01-10",
      duration: "45min",
      teacher: "Prof. Dubois",
      thumbnail: "H",
      availableAt: new Date("2024-01-10T12:00:00"),
      color: "#e87c3e",
    },
    {
      id: 7,
      title: "Intégrales et primitives avancées",
      specialty: "Mathématiques",
      date: "2024-01-09",
      duration: "1h 18min",
      teacher: "Prof. Martin",
      thumbnail: "M",
      availableAt: new Date("2024-01-09T20:00:00"),
      color: "#4f8ef7",
    },
    {
      id: 8,
      title: "Thermodynamique : principes fondamentaux",
      specialty: "Physique",
      date: "2024-01-08",
      duration: "1h 00min",
      teacher: "Prof. Moreau",
      thumbnail: "P",
      availableAt: new Date("2024-01-08T10:00:00"),
      color: "#f7c94f",
    },
  ];

  const specialties = ["all", ...Array.from(new Set(replays.map((r) => r.specialty)))];
  const dateRanges = [
    { value: "all", label: "Toutes les dates" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "older", label: "Plus ancien" },
  ];

  const now = new Date();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  const isAvailable = (availableAt: Date) => {
    return now.getTime() - availableAt.getTime() >= fortyEightHoursMs;
  };

  const getTimeUntilAvailable = (availableAt: Date) => {
    const targetTime = new Date(availableAt.getTime() + fortyEightHoursMs);
    const diff = targetTime.getTime() - now.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Disponible dans ${hours}h ${minutes}min`;
  };

  const filteredReplays = replays.filter((replay) => {
    const specialtyMatch = selectedSpecialty === "all" || replay.specialty === selectedSpecialty;
    const replayDate = new Date(replay.date);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let dateMatch = true;
    if (selectedDate === "week") {
      dateMatch = replayDate >= oneWeekAgo;
    } else if (selectedDate === "month") {
      dateMatch = replayDate >= oneMonthAgo && replayDate < oneWeekAgo;
    } else if (selectedDate === "older") {
      dateMatch = replayDate < oneMonthAgo;
    }

    return specialtyMatch && dateMatch;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#ffffff",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #0a0a12 0%, #050508 100%)",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    padding: "24px 48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
    color: "#050508",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const navBadgeStyle: React.CSSProperties = {
    background: "rgba(200, 169, 110, 0.12)",
    border: "1px solid rgba(200, 169, 110, 0.3)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "13px",
    color: "#c8a96e",
    fontWeight: "500",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "48px 48px",
  };

  const heroStyle: React.CSSProperties = {
    marginBottom: "48px",
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: "42px",
    fontWeight: "800",
    lineHeight: "1.1",
    marginBottom: "12px",
    color: "#ffffff",
  };

  const heroAccentStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const heroSubtitleStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "0",
  };

  const infoBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px",
    background: "rgba(200, 169, 110, 0.06)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "12px",
    padding: "14px 20px",
    maxWidth: "520px",
  };

  const infoIconStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    background: "rgba(200, 169, 110, 0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#c8a96e",
    flexShrink: 0,
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
  };

  const filtersContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    marginBottom: "40px",
    flexWrap: "wrap" as const,
    alignItems: "flex-end",
  };

  const filterGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };

  const selectStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 16px",
    color: "#ffffff",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
    minWidth: "180px",
    appearance: "none" as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c8a96e' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  };

  const statsBarStyle: React.CSSProperties = {
    display: "flex",
    gap: "24px",
    marginBottom: "32px",
  };

  const statItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#c8a96e",
    lineHeight: "1",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(255,255,255,0.4)",
  };

  const statDividerStyle: React.CSSProperties = {
    width: "1px",
    background: "rgba(255,255,255,0.08)",
    margin: "0 4px",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: "20px",
  };

  const getCardStyle = (id: number, available: boolean): React.CSSProperties => ({
    background: hoveredCard === id
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.03)",
    border: hoveredCard === id
      ? "1px solid rgba(200, 169, 110, 0.4)"
      : "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s ease",
    transform: hoveredCard === id ? "translateY(-3px)" : "translateY(0)",
    boxShadow: hoveredCard === id
      ? "0 16px 40px rgba(200, 169, 110, 0.08)"
      : "none",
    opacity: available ? 1 : 0.6,
  });

  const thumbnailStyle = (color: string): React.CSSProperties => ({
    height: "160px",
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  });

  const thumbnailLetterStyle = (color: string): React.CSSProperties => ({
    fontSize: "56px",
    fontWeight: "900",
    color: color,
    opacity: 0.3,
  });

  const thumbnailOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.1)",
  };

  const playIconContainerStyle = (available: boolean): React.CSSProperties => ({
    width: "52px",
    height: "52