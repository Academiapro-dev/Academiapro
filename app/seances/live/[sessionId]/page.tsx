export default async function SeanceLivePage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: session, error: sessionError } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", params.sessionId)
    .single();

  if (sessionError || !session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#0d0d12",
            border: "1px solid #c8a96e",
            borderRadius: "16px",
            padding: "48px",
            textAlign: "center",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              color: "#c8a96e",
              fontSize: "22px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Session introuvable
          </h2>
          <p
            style={{
              color: "#6b6b80",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            La séance live demandée n&apos;existe pas ou a été supprimée. Veuillez
            vérifier l&apos;identifiant de session.
          </p>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "24px",
              backgroundColor: "#c8a96e",
              color: "#050508",
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  const { data: accessCheck, error: accessError } = await supabase
    .from("session_enrollments")
    .select("*")
    .eq("session_id", params.sessionId)
    .eq("learner_id", session.learner_id)
    .single();

  if (accessError || !accessCheck) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#0d0d12",
            border: "1px solid #c8a96e33",
            borderRadius: "16px",
            padding: "48px",
            textAlign: "center",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            🔒
          </div>
          <h2
            style={{
              color: "#c8a96e",
              fontSize: "22px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Accès refusé
          </h2>
          <p
            style={{
              color: "#6b6b80",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            Vous n&apos;êtes pas autorisé à rejoindre cette séance live. Veuillez
            contacter votre administrateur ou vous inscrire au programme.
          </p>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "24px",
              backgroundColor: "#c8a96e",
              color: "#050508",
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("session_messages")
    .select("*")
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: true })
    .limit(50);

  const chatMessages = messages || [];

  const startedAt = new Date(session.started_at || Date.now());
  const now = new Date();
  const durationMinutes = Math.floor(
    (now.getTime() - startedAt.getTime()) / 60000
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          backgroundColor: "#0a0a0f",
          borderBottom: "1px solid #c8a96e22",
          padding: "0 32px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🎓
          </div>
          <span
            style={{
              color: "#c8a96e",
              fontWeight: "800",
              fontSize: "18px",
              letterSpacing: "-0.3px",
            }}
          >
            AcadémIA Pro
          </span>
          <span
            style={{
              color: "#3a3a4a",
              fontSize: "18px",
            }}
          >
            /
          </span>
          <span
            style={{
              color: "#8888a0",
              fontSize: "14px",
            }}
          >
            Séance Live
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#0d0d12",
              border: "1px solid #c8a96e33",
              borderRadius: "8px",
              padding: "8px 16px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span
              style={{
                color: "#c8a96e",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              En direct
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#6b6b80",
              fontSize: "13px",
            }}
          >
            <span>⏱</span>
            <span>{durationMinutes} min</span>
          </div>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          padding: "32px",
          gap: "28px",
        }}
      >
        <aside
          style={{
            width: "300px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#0a0a0f",
              border: "1px solid #c8a96e22",
              borderRadius: "16px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                  border: "2px solid #c8a96e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "42px",
                  boxShadow: "0 0 32px #c8a96e22",
                }}
              >
                🤖
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  border: "2px solid #0a0a0f",
                  boxShadow: "0 0 8px #22c55e",
                }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  color: "#e8e8f0",
                  fontSize: "16px",
                  fontWeight: "700",
                  margin: "0 0 4px 0",
                }}
              >
                ARIA
              </h3>
              <p
                style={{
                  color: "#c8a96e",
                  fontSize: "12px",
                  fontWeight: "600",
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                IA Pédagogique
              </p>
              <p
                style={{
                  color: "#6b6b80",
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Votre tuteur personnel disponible 24h/24 pour vous accompagner
              </p>
            </div>

            <div
              style={{
                width: "100%",
                backgroundColor: "#050508",
                borderRadius: "10px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "3px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "3px",
                    height: "12px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "2px",
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    width: "3px",
                    height: "20px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "2px",
                  }}
                />
                <div
                  style={{
                    width: "3px",
                    height: "14px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "2px",
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    width: "3px",
                    height: "8px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "2px",
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    width: "3px",
                    height: "18px",
                    backgroundColor: "#c8a96e",
                    borderRadius: "2px",
                    opacity: 0.9,
                  }}
                />
              </div>
              <span
                style={{
                  color: "#8888a0",
                  fontSize: "12px",
                }}
              >
                ARIA écoute...
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#0a0a0f",
              border: "1px solid #c8a96e22",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <h4
              style={{
                color: "#c8a96e",
                fontSize: "12px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 16px 0",
              }}
            >
              Infos de session
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#6b6b80",
                    fontSize: "13px",
                  }}
                >
                  Sujet
                </span>
                <span
                  style={{
                    color: "#e8e8f0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {session.topic || "Général"}
                </span>
              </div>

              <div
                style={{
                  height: "1px",
                  backgroundColor: "#c8a96e11",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#6b6b80",
                    fontSize: "13px",
                  }}
                >
                  Niveau
                </span>
                <span
                  style={{
                    color: "#e8e8f0",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {session.level || "Intermédiaire"}
                </span>
              </div>

              <div
                style={{
                  height: "