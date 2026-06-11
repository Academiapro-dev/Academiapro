export default function CatalogueSkills() {
  const categories = [
    {
      id: "ia",
      label: "Intelligence Artificielle",
      color: "#c8a96e",
      skills: [
        { id: "SK01", titre: "Ecrire avec Claude", prix: 97 },
        { id: "SK02", titre: "Automatiser emails", prix: 97 },
        { id: "SK03", titre: "Visuels IA", prix: 97 },
        { id: "SK04", titre: "Analyser données", prix: 97 },
        { id: "SK05", titre: "Chatbot 24h", prix: 97 },
        { id: "SK06", titre: "Prompts parfaits", prix: 97 },
        { id: "SK07", titre: "Make.com", prix: 97 },
        { id: "SK08", titre: "Landing page IA", prix: 97 },
        { id: "SK09", titre: "LinkedIn IA", prix: 97 },
        { id: "SK10", titre: "Agent IA simple", prix: 97 },
      ],
    },
    {
      id: "business",
      label: "Business",
      color: "#c8a96e",
      skills: [
        { id: "SK11", titre: "Offre irrésistible", prix: 97 },
        { id: "SK12", titre: "Pitch 30min", prix: 97 },
        { id: "SK13", titre: "Prospecter LinkedIn", prix: 97 },
        { id: "SK14", titre: "Négocier salaire", prix: 97 },
        { id: "SK15", titre: "Gérer temps IA", prix: 97 },
      ],
    },
    {
      id: "bienetre",
      label: "Bien-être",
      color: "#c8a96e",
      skills: [
        { id: "SK16", titre: "Méditation", prix: 47 },
        { id: "SK17", titre: "Stress", prix: 47 },
        { id: "SK18", titre: "Sommeil", prix: 47 },
        { id: "SK19", titre: "Confiance", prix: 47 },
        { id: "SK20", titre: "Energie", prix: 47 },
      ],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#050508",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#ffffff",
        padding: "0 0 80px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "80px 0 60px 0",
            borderBottom: "1px solid rgba(200,169,110,0.15)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "100px",
              padding: "6px 20px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                color: "#c8a96e",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              AcadémIA Pro
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: "800",
              margin: "0 0 20px 0",
              lineHeight: "1.15",
              letterSpacing: "-1px",
            }}
          >
            Catalogue{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Skills
            </span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "18px",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: "1.7",
            }}
          >
            20 compétences pour transformer votre carrière et votre quotidien.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "40px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "20", label: "Skills" },
              { value: "3", label: "Catégories" },
              { value: "47€", label: "À partir de" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#c8a96e",
                    lineHeight: "1",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {categories.map((cat, catIndex) => (
          <div
            key={cat.id}
            style={{
              marginTop: catIndex === 0 ? "72px" : "80px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "4px",
                  height: "32px",
                  backgroundColor: "#c8a96e",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    margin: "0",
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {cat.label}
                </h2>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {cat.skills.length} skills disponibles
                </p>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  backgroundColor: "rgba(200,169,110,0.08)",
                  border: "1px solid rgba(200,169,110,0.2)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                }}
              >
                <span
                  style={{
                    color: "#c8a96e",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {cat.skills[0].prix}€ / skill
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {cat.skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: "100px",
            background: "linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(200,169,110,0.03) 100%)",
            border: "1px solid rgba(200,169,110,0.2)",
            borderRadius: "20px",
            padding: "56px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "16px",
            }}
          >
            🎓
          </div>
          <h3
            style={{
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 12px 0",
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Accès à toutes les{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Skills
            </span>
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "16px",
              maxWidth: "460px",
              margin: "0 auto 32px auto",
              lineHeight: "1.7",
            }}
          >
            Débloquez les 20 compétences en une seule fois et économisez jusqu'à 50% sur le prix à l'unité.
          </p>
          <button
            style={{
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
              backgroundSize: "200% 200%",
              color: "#050508",
              border: "none",
              borderRadius: "12px",
              padding: "16px 40px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            Voir l'offre complète →
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillCard({
  skill,
}: {
  skill: { id: string; titre: string; prix: number };
}) {
  const categoryIcons: Record<string, string> = {
    SK01: "✍️",
    SK02: "📧",
    SK03: "🎨",
    SK04: "📊",
    SK05: "🤖",
    SK06: "💡",
    SK07: "⚙️",
    SK08: "🚀",
    SK09: "💼",
    SK10: "🧠",
    SK11: "💎",
    SK12: "🎯",
    SK13: "🔍",
    SK14: "💰",
    SK15: "⏱️",
    SK16: "🧘",
    SK17: "🌿",
    SK18: "🌙",
    SK19: "⭐",
    SK20: "⚡",
  };

  const icon = categoryIcons[skill.id] || "📌";

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "24px",
        transition: "all 0.25s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.backgroundColor = "rgba(200,169,110,0.06)";
        el.style.border = "1px solid rgba(200,169,110,0.3)";
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 12px 40px rgba(200,169,110,0.12)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.backgroundColor = "rgba(255,255,255,0.03)";
        el.style.border = "1px solid rgba(255,255,255,0.07)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              backgroundColor: "rgba(200,169,110,0.1)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "rgba(200,169,110,0.6)",
            letterSpacing: "1px",
            backgroundColor: "rgba(200,169,110,0.08)",
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {skill.id}
        </span>
      </div>

      <h3
        style={{
          fontSize: "15px",
          fontWeight: "600",
          margin: "0 0 16px 0",
          color: "#ffffff",
          lineHeight: "1.4",
        }}
      >
        {skill.titre}
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#c8a96e",
            letterSpacing: "-0.5px",
          }}
        >
          {skill.prix}€
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <span>Accéder</span>
          <span style={{ fontSize: "16px" }}>→</span>
        </div>
      </div>
    </div>
  );
}