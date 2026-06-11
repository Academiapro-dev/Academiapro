export default function CertificatsPage() {
  const [selectedCert, setSelectedCert] = React.useState<number | null>(null);
  const [showQR, setShowQR] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState<number | null>(null);

  const certifications = [
    {
      id: 1,
      level: "Master",
      levelIndex: 4,
      title: "Master IA Générative",
      description: "Maîtrise avancée des modèles génératifs et architectures transformer",
      date: "15 Mars 2024",
      score: 98,
      credentialId: "AIA-MST-2024-0047",
      color: "#c8a96e",
      badgeIcon: "◆",
      skills: ["GPT Architecture", "Fine-tuning", "RLHF", "Deployment", "Ethics"],
      verified: true,
    },
    {
      id: 2,
      level: "Expert",
      levelIndex: 3,
      title: "Expert Machine Learning",
      description: "Expertise approfondie en algorithmes ML et pipelines de données",
      date: "02 Janvier 2024",
      score: 94,
      credentialId: "AIA-EXP-2024-0128",
      color: "#a78bfa",
      badgeIcon: "★",
      skills: ["Supervised Learning", "Neural Networks", "MLOps", "AutoML"],
      verified: true,
    },
    {
      id: 3,
      level: "Certificat",
      levelIndex: 2,
      title: "Certificat Deep Learning",
      description: "Conception et entraînement de réseaux de neurones profonds",
      date: "18 Octobre 2023",
      score: 91,
      credentialId: "AIA-CERT-2023-0394",
      color: "#34d399",
      badgeIcon: "▲",
      skills: ["CNN", "RNN", "Transformers", "PyTorch"],
      verified: true,
    },
    {
      id: 4,
      level: "Attestation",
      levelIndex: 1,
      title: "Attestation Python IA",
      description: "Fondamentaux Python appliqués à l'intelligence artificielle",
      date: "05 Juillet 2023",
      score: 88,
      credentialId: "AIA-ATT-2023-0891",
      color: "#60a5fa",
      badgeIcon: "●",
      skills: ["NumPy", "Pandas", "Scikit-learn", "Matplotlib"],
      verified: true,
    },
  ];

  const nextCertification = {
    title: "Master Vision par Ordinateur",
    level: "Master",
    progress: 73,
    modulesCompleted: 11,
    totalModules: 15,
    estimatedDate: "Juin 2024",
    remainingModules: [
      { name: "Segmentation Sémantique", progress: 90 },
      { name: "Détection d'Objets 3D", progress: 45 },
      { name: "Video Understanding", progress: 20 },
      { name: "Projet Final", progress: 0 },
    ],
  };

  const levels = [
    { name: "Attestation", icon: "●", color: "#60a5fa", description: "Fondamentaux" },
    { name: "Certificat", icon: "▲", color: "#34d399", description: "Intermédiaire" },
    { name: "Expert", icon: "★", color: "#a78bfa", description: "Avancé" },
    { name: "Master", icon: "◆", color: "#c8a96e", description: "Excellence" },
  ];

  const handleDownloadPDF = (cert: typeof certifications[0]) => {
    const content = `ACADÉMIA PRO - CERTIFICAT OFFICIEL\n\n${cert.title}\nNiveau: ${cert.level}\nTitulaire: Alexandre Martin\nDate: ${cert.date}\nScore: ${cert.score}%\nID: ${cert.credentialId}\nVérification: https://academia.pro/verify/${cert.credentialId}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificat_${cert.credentialId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLinkedIn = (cert: typeof certifications[0]) => {
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.title)}&organizationName=AcadémIA+Pro&issueYear=2024&certUrl=https://academia.pro/verify/${cert.credentialId}&certId=${cert.credentialId}`;
    window.open(url, "_blank");
  };

  const handleCopyId = (id: number, credentialId: string) => {
    navigator.clipboard.writeText(`https://academia.pro/verify/${credentialId}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#ffffff",
      padding: "0",
      margin: "0",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
      }}>

        <div style={{
          marginBottom: "48px",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: "-20px",
            left: "-20px",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "8px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}>
              🎓
            </div>
            <div>
              <h1 style={{
                margin: "0",
                fontSize: "32px",
                fontWeight: "800",
                background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.5px",
              }}>
                Mes Certificats
              </h1>
              <p style={{
                margin: "2px 0 0 0",
                fontSize: "14px",
                color: "#6b7280",
                letterSpacing: "0.5px",
              }}>
                AcadémIA Pro · Parcours certifié
              </p>
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: "24px",
            marginTop: "32px",
            flexWrap: "wrap",
          }}>
            {[
              { label: "Certifications obtenues", value: "4", icon: "🏆" },
              { label: "Score moyen", value: "92.8%", icon: "📊" },
              { label: "Heures de formation", value: "847h", icon: "⏱️" },
              { label: "Niveau maximum", value: "Master", icon: "◆" },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: "1",
                minWidth: "140px",
                background: "linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(200,169,110,0.02) 100%)",
                border: "1px solid rgba(200,169,110,0.15)",
                borderRadius: "16px",
                padding: "20px",
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#c8a96e",
                  lineHeight: "1",
                  marginBottom: "4px",
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginBottom: "48px",
        }}>
          <h2 style={{
            margin: "0 0 24px 0",
            fontSize: "13px",
            fontWeight: "700",
            color: "#c8a96e",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Échelle de certification
          </h2>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: "24px",
              left: "48px",
              right: "48px",
              height: "2px",
              background: "linear-gradient(90deg, #60a5fa, #34d399, #a78bfa, #c8a96e)",
              zIndex: 0,
            }} />
            {levels.map((level, i) => (
              <div key={i} style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                position: "relative",
                zIndex: 1,
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${level.color}30, ${level.color}15)`,
                  border: `2px solid ${level.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: level.color,
                  fontWeight: "bold",
                  boxShadow: `0 0 20px ${level.color}30`,
                }}>
                  {level.icon}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: level.color,
                    marginBottom: "2px",
                  }}>
                    {level.name}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#6b7280",
                  }}>
                    {level.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "48px" }}>
          <h2 style={{
            margin: "0 0 24px 0",
            fontSize: "13px",
            fontWeight: "700",
            color: "#c8a96e",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Certifications obtenues
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))",
            gap: "20px",
          }}>
            {certifications.map((cert) => (
              <div
                key={cert.id}
                style={{
                  background: "linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(10,10,18,0.98) 100%)",
                  border: `1px solid ${cert.color}25`,
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                  boxShadow: selectedCert === cert.id ? `0 8px 40px ${cert.color}20` : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${cert.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = selectedCert === cert.id ? `0 8px 40px ${cert.color}20` : "none";
                }}
              >
                <div style={{
                  height: "4px",
                  background: `linear-gradient(90deg, ${cert.color}, ${cert.color}60)`,
                }} />

                <div style={{ padding: "24px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                  }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        background: `linear-gradient(135deg, ${cert.color}25, ${cert.color}10)`,
                        border: `1.5px solid ${cert.color}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        color: cert.color,
                        flexShrink: 0,
                        boxShadow: `0 4px 20px ${cert.color}15`,
                      }}>
                        {cert.badgeIcon}
                      </div>
                      <div>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: `${cert.color}15`,
                          border: `1px solid ${cert.color}30`,
                          borderRadius: "6px",
                          padding: "3px 10px",
                          marginBottom: "6px",
                        }}>
                          <span style={{
                            fontSize: "11px",