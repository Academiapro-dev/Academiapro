export default function GamificationPage() {
  const userData = {
    name: "Alexandre Martin",
    avatar: "AM",
    level: 12,
    currentXP: 3450,
    nextLevelXP: 4000,
    totalXP: 18450,
    streak: 14,
    rank: 3,
    weeklyProgress: 680,
    weeklyGoal: 1000,
  };

  const badges = [
    {
      id: 1,
      name: "Premier Module",
      description: "Complété votre premier module",
      icon: "🎯",
      earned: true,
      earnedDate: "15 Jan 2024",
      xpReward: 100,
      rarity: "Commun",
    },
    {
      id: 2,
      name: "Première Certification",
      description: "Obtenu votre première certification",
      icon: "🏆",
      earned: true,
      earnedDate: "28 Jan 2024",
      xpReward: 500,
      rarity: "Rare",
    },
    {
      id: 3,
      name: "Streak 7 Jours",
      description: "7 jours consécutifs d'apprentissage",
      icon: "🔥",
      earned: true,
      earnedDate: "02 Fév 2024",
      xpReward: 250,
      rarity: "Peu commun",
    },
    {
      id: 4,
      name: "Expert IA",
      description: "Maîtrisé les fondamentaux de l'IA",
      icon: "🤖",
      earned: true,
      earnedDate: "10 Fév 2024",
      xpReward: 1000,
      rarity: "Épique",
    },
    {
      id: 5,
      name: "Master",
      description: "Atteint le niveau maximum dans une discipline",
      icon: "👑",
      earned: false,
      earnedDate: null,
      xpReward: 2500,
      rarity: "Légendaire",
    },
    {
      id: 6,
      name: "Collaborateur",
      description: "Participé à 10 projets en équipe",
      icon: "🤝",
      earned: false,
      earnedDate: null,
      xpReward: 300,
      rarity: "Commun",
    },
  ];

  const leaderboard = [
    { rank: 1, name: "Sophie Chen", avatar: "SC", xp: 24500, level: 18, streak: 32, trend: "up" },
    { rank: 2, name: "Marcus Dubois", avatar: "MD", xp: 21200, level: 16, streak: 21, trend: "up" },
    { rank: 3, name: "Alexandre Martin", avatar: "AM", xp: 18450, level: 12, streak: 14, trend: "same", isUser: true },
    { rank: 4, name: "Emma Lefebvre", avatar: "EL", xp: 17800, level: 11, streak: 8, trend: "down" },
    { rank: 5, name: "Lucas Bernard", avatar: "LB", xp: 15600, level: 10, streak: 5, trend: "up" },
    { rank: 6, name: "Jade Moreau", avatar: "JM", xp: 14200, level: 9, streak: 19, trend: "down" },
    { rank: 7, name: "Noah Petit", avatar: "NP", xp: 12900, level: 8, streak: 3, trend: "up" },
  ];

  const weeklyDays = [
    { day: "Lun", xp: 120, active: true },
    { day: "Mar", xp: 180, active: true },
    { day: "Mer", xp: 95, active: true },
    { day: "Jeu", xp: 150, active: true },
    { day: "Ven", xp: 135, active: true },
    { day: "Sam", xp: 0, active: false },
    { day: "Dim", xp: 0, active: false },
  ];

  const weeklyMaxXP = Math.max(...weeklyDays.map((d) => d.xp));

  const challenges = [
    {
      id: 1,
      title: "Sprint IA",
      description: "Complétez 5 modules d'intelligence artificielle cette semaine",
      xpReward: 500,
      progress: 3,
      total: 5,
      deadline: "3 jours",
      difficulty: "Intermédiaire",
      icon: "⚡",
      color: "#c8a96e",
    },
    {
      id: 2,
      title: "Défi Streak",
      description: "Maintenez votre streak pendant 7 jours consécutifs",
      xpReward: 300,
      progress: 5,
      total: 7,
      deadline: "2 jours",
      difficulty: "Facile",
      icon: "🔥",
      color: "#ff6b6b",
    },
    {
      id: 3,
      title: "Quiz Master",
      description: "Obtenez 90% ou plus sur 3 quiz différents",
      xpReward: 400,
      progress: 1,
      total: 3,
      deadline: "5 jours",
      difficulty: "Difficile",
      icon: "🎓",
      color: "#6bcb77",
    },
    {
      id: 4,
      title: "Explorateur",
      description: "Visitez 4 nouvelles catégories de cours",
      xpReward: 200,
      progress: 4,
      total: 4,
      deadline: "1 jour",
      difficulty: "Facile",
      icon: "🗺️",
      color: "#4d9de0",
      completed: true,
    },
  ];

  const rarityColors: Record<string, string> = {
    Commun: "#9ca3af",
    "Peu commun": "#6bcb77",
    Rare: "#4d9de0",
    Épique: "#a855f7",
    Légendaire: "#c8a96e",
  };

  const xpPercentage = Math.round((userData.currentXP / userData.nextLevelXP) * 100);
  const weeklyPercentage = Math.round((userData.weeklyProgress / userData.weeklyGoal) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "rgba(5, 5, 8, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "70px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "900",
                color: "#050508",
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px" }}>
                AcadémIA
                <span style={{ color: "#c8a96e", marginLeft: "2px" }}>Pro</span>
              </div>
              <div style={{ fontSize: "10px", color: "#c8a96e", letterSpacing: "2px", textTransform: "uppercase" }}>
                Gamification
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🔥</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#ff6b6b" }}>{userData.streak} jours</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#c8a96e", fontWeight: "600" }}>
                {userData.totalXP.toLocaleString()} XP
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "800",
                color: "#050508",
                cursor: "pointer",
              }}
            >
              {userData.avatar}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "90px 24px 40px" }}>
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(5,5,8,0) 60%)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "24px",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-60px",
                right: "-60px",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #c8a96e, #a07840)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "900",
                    color: "#050508",
                    border: "3px solid rgba(200,169,110,0.4)",
                  }}
                >
                  {userData.avatar}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#050508",
                    border: "2px solid #050508",
                  }}
                >
                  Niv.{userData.level}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#ffffff" }}>
                    {userData.name}
                  </h1>
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
                      border: "1px solid rgba(200,169,110,0.4)",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#c8a96e",
                    }}
                  >
                    #{userData.rank} Classement
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "16px" }}>
                  Apprenant Expert · {userData.totalXP.toLocaleString()} XP total
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      Niveau {userData.level} → {userData.level + 1}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#c8a96e" }}>
                      {userData.currentXP.toLocaleString()} / {userData.nextLevelXP.toLocaleString()} XP
                    </span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${xpPercentage}%`,
                        background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                        borderRadius: "10px",
                        transition: "width 1s ease",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>
                    {xpPercentage}% vers le niveau suivant · encore {userData.nextLevelXP -