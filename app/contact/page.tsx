export default function ContactPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#ffffff",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              ✦
            </div>
            <span
              style={{
                fontSize: "22px",
                fontWeight: "700",
                background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.5px",
              }}
            >
              AcadémIA Pro
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: "800",
              margin: "0 0 16px 0",
              lineHeight: "1.2",
              letterSpacing: "-0.5px",
            }}
          >
            Contactez{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              notre équipe
            </span>
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#9999aa",
              margin: "0 0 8px 0",
              lineHeight: "1.6",
            }}
          >
            Une question, une suggestion ou un partenariat ?
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#666677",
              margin: "0",
            }}
          >
            Réponse garantie sous 24h — Agent IA disponible 24h/24
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "40px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { icon: "📧", label: "contact@academiapro.fr" },
            { icon: "⏱", label: "Réponse sous 24h" },
            { icon: "🤖", label: "IA disponible 24h/24" },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#0d0d14",
                border: "1px solid #1e1e2e",
                borderRadius: "100px",
                padding: "8px 16px",
                fontSize: "13px",
                color: "#aaaabb",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: "#0a0a12",
            border: "1px solid #1a1a28",
            borderRadius: "24px",
            padding: "clamp(24px, 5vw, 48px)",
            boxShadow: "0 0 80px rgba(200, 169, 110, 0.04), 0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                htmlFor="nom"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#c8a96e",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Nom
              </label>
              <input
                id="nom"
                type="text"
                placeholder="Dupont"
                style={{
                  backgroundColor: "#0f0f1a",
                  border: "1px solid #1e1e30",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c8a96e";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,110,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1e1e30";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                htmlFor="prenom"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#c8a96e",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Prénom
              </label>
              <input
                id="prenom"
                type="text"
                placeholder="Marie"
                style={{
                  backgroundColor: "#0f0f1a",
                  border: "1px solid #1e1e30",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c8a96e";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,110,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1e1e30";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#c8a96e",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              placeholder="marie.dupont@exemple.fr"
              style={{
                backgroundColor: "#0f0f1a",
                border: "1px solid #1e1e30",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#c8a96e";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,110,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#1e1e30";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            <label
              htmlFor="sujet"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#c8a96e",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Sujet
            </label>
            <select
              id="sujet"
              style={{
                backgroundColor: "#0f0f1a",
                border: "1px solid #1e1e30",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                appearance: "none",
                cursor: "pointer",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c8a96e' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#c8a96e";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,110,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#1e1e30";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="" style={{ backgroundColor: "#0f0f1a" }}>
                Sélectionnez un sujet
              </option>
              <option value="information" style={{ backgroundColor: "#0f0f1a" }}>
                Demande d&apos;information
              </option>
              <option value="support" style={{ backgroundColor: "#0f0f1a" }}>
                Support technique
              </option>
              <option value="partenariat" style={{ backgroundColor: "#0f0f1a" }}>
                Partenariat
              </option>
              <option value="tarifs" style={{ backgroundColor: "#0f0f1a" }}>
                Tarifs & abonnements
              </option>
              <option value="autre" style={{ backgroundColor: "#0f0f1a" }}>
                Autre
              </option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
            <label
              htmlFor="message"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#c8a96e",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Message
            </label>
            <textarea
              id="message"
              placeholder="Décrivez votre demande en détail..."
              rows={6}
              style={{
                backgroundColor: "#0f0f1a",
                border: "1px solid #1e1e30",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                lineHeight: "1.6",
                fontFamily: "inherit",
                minHeight: "140px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#c8a96e";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,110,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#1e1e30";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px 32px",
              background: "linear-gradient(135deg, #c8a96e, #b8934e)",
              border: "none",
              borderRadius: "14px",
              color: "#050508",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "opacity 0.2s, transform 0.2s",
              boxShadow: "0 8px 30px rgba(200, 169, 110, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(200, 169, 110, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(200, 169, 110, 0.25)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>Envoyer le message</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "