export default async function ClasseVirtuellePage() {

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: sessions } = await supabase
    .from("virtual_sessions")
    .select("*")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(10);

  const { data: participants } = await supabase
    .from("session_participants")
    .select("id, name, avatar_url, status")
    .eq("status", "online")
    .limit(20);

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, content, sender_name, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const sessionsData = sessions || [
    {
      id: "1",
      title: "Mathématiques Avancées - Calcul Intégral",
      instructor: "Prof. Martin Dubois",
      scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      duration_minutes: 90,
      subject: "Mathématiques",
      level: "Terminale",
      max_participants: 30,
      current_participants: 18,
      status: "upcoming",
      room_id: "math-001"
    },
    {
      id: "2",
      title: "Physique Quantique - Introduction",
      instructor: "Prof. Sophie Laurent",
      scheduled_at: new Date(Date.now() + 7200000).toISOString(),
      duration_minutes: 60,
      subject: "Physique",
      level: "Terminale",
      max_participants: 25,
      current_participants: 12,
      status: "upcoming",
      room_id: "phys-002"
    },
    {
      id: "3",
      title: "Littérature Française - Baudelaire",
      instructor: "Prof. Claire Moreau",
      scheduled_at: new Date(Date.now() + 10800000).toISOString(),
      duration_minutes: 75,
      subject: "Français",
      level: "Première",
      max_participants: 20,
      current_participants: 9,
      status: "upcoming",
      room_id: "fr-003"
    },
    {
      id: "4",
      title: "Algorithmique et Structures de Données",
      instructor: "Prof. Ahmed Benali",
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 120,
      subject: "Informatique",
      level: "BTS",
      max_participants: 15,
      current_participants: 7,
      status: "upcoming",
      room_id: "info-004"
    },
    {
      id: "5",
      title: "Histoire - Seconde Guerre Mondiale",
      instructor: "Prof. Jean Petit",
      scheduled_at: new Date(Date.now() + 172800000).toISOString(),
      duration_minutes: 60,
      subject: "Histoire",
      level: "Première",
      max_participants: 35,
      current_participants: 22,
      status: "upcoming",
      room_id: "hist-005"
    }
  ];

  const participantsData = participants || [
    { id: "p1", name: "Emma Rousseau", avatar_url: "", status: "online" },
    { id: "p2", name: "Lucas Bernard", avatar_url: "", status: "online" },
    { id: "p3", name: "Chloé Martin", avatar_url: "", status: "online" },
    { id: "p4", name: "Nathan Leroy", avatar_url: "", status: "online" },
    { id: "p5", name: "Léa Dupont", avatar_url: "", status: "online" },
    { id: "p6", name: "Hugo Simon", avatar_url: "", status: "online" },
    { id: "p7", name: "Inès Thomas", avatar_url: "", status: "online" },
    { id: "p8", name: "Maxime Garcia", avatar_url: "", status: "online" }
  ];

  const messagesData = (messages || [
    { id: "m1", content: "Bonjour à tous ! Prêts pour le cours ?", sender_name: "Prof. Martin", created_at: new Date(Date.now() - 300000).toISOString() },
    { id: "m2", content: "Oui, j'ai une question sur le chapitre 3", sender_name: "Emma R.", created_at: new Date(Date.now() - 240000).toISOString() },
    { id: "m3", content: "On peut partager les notes du dernier cours ?", sender_name: "Lucas B.", created_at: new Date(Date.now() - 180000).toISOString() },
    { id: "m4", content: "Les slides seront disponibles après la session", sender_name: "Prof. Martin", created_at: new Date(Date.now() - 120000).toISOString() },
    { id: "m5", content: "Super merci ! 🎯", sender_name: "Chloé M.", created_at: new Date(Date.now() - 60000).toISOString() }
  ]).reverse();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeUntil = (isoString: string) => {
    const diff = new Date(isoString).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `Dans ${Math.floor(hours / 24)}j`;
    if (hours > 0) return `Dans ${hours}h${minutes}m`;
    return `Dans ${minutes}min`;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      "Mathématiques": "#c8a96e",
      "Physique": "#7eb8c8",
      "Français": "#c87eb8",
      "Informatique": "#7ec88a",
      "Histoire": "#c89a7e"
    };
    return colors[subject] || "#c8a96e";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#e8e0d0"
    }}>

      <div style={{
        background: "linear-gradient(180deg, #0a0a12 0%, #050508 100%)",
        borderBottom: "1px solid rgba(200,169,110,0.15)",
        padding: "0 40px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px"
            }}>
              🎓
            </div>
            <div>
              <div style={{
                fontSize: "18px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #c8a96e, #e8c88a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                AcadémIA Pro
              </div>
              <div style={{ fontSize: "11px", color: "rgba(200,169,110,0.6)", marginTop: "-2px" }}>
                Classe Virtuelle
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["Tableau de bord", "Cours", "Classe Virtuelle", "Ressources", "Progrès"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: item === "Classe Virtuelle" ? "#c8a96e" : "rgba(232,224,208,0.6)",
                  background: item === "Classe Virtuelle" ? "rgba(200,169,110,0.1)" : "transparent",
                  cursor: "pointer",
                  fontWeight: item === "Classe Virtuelle" ? "600" : "400"
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(126,200,138,0.1)",
              border: "1px solid rgba(126,200,138,0.2)",
              borderRadius: "20px",
              fontSize: "12px",
              color: "#7ec88a"
            }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#7ec88a",
                boxShadow: "0 0 6px #7ec88a"
              }} />
              En ligne
            </div>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "#050508"
            }}>
              EA
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "40px 40px 0"
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "40px"
        }}>
          <div>
            <div style={{
              fontSize: "13px",
              color: "rgba(200,169,110,0.7)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "8px"
            }}>
              Espace d'apprentissage immersif
            </div>
            <h1 style={{
              fontSize: "38px",
              fontWeight: "800",
              margin: 0,
              background: "linear-gradient(135deg, #e8e0d0 30%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1
            }}>
              Classe Virtuelle
            </h1>
            <p style={{
              fontSize: "15px",
              color: "rgba(232,224,208,0.5)",
              marginTop: "8px"
            }}>
              {sessionsData.length} sessions programmées · {participantsData.length} étudiants connectés
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "10px",
              color: "#c8a96e",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              📅 Calendrier
            </button>
            <button style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              border: "none",
              borderRadius: "10px",
              color: "#050508",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              🎥 Créer une session
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "40px"
        }}>
          {[
            { label: "Sessions aujourd'hui", value: "3", icon: "📚", trend: "+1", color: "#c8a96e" },
            { label: "Étudiants actifs", value: participantsData.length.toString(), icon: "👥", trend: "+5", color: "#7ec88a" },
            { label: "Heures de cours", value: "12.5h", icon: "⏱️", trend: "cette semaine", color: "#7eb8c8" },
            { label: "Taux présence", value: "94%", icon: "📊", trend: "+3%", color: "#c87eb8" }
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(200,169,110,0.12)",
              borderRadius: "16px",
}}}}