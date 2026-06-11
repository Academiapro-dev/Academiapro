export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 100%)",
              marginBottom: "20px",
              boxShadow: "0 8px 32px rgba(200, 169, 110, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#050508",
              }}
            >
              A
            </span>
          </div>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "28px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Académ
            <span
              style={{
                color: "#c8a96e",
              }}
            >
              IA
            </span>{" "}
            Pro
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#8888a0",
              fontWeight: "400",
            }}
          >
            Connectez-vous à votre espace
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#0e0e16",
            borderRadius: "20px",
            padding: "36px",
            border: "1px solid rgba(200, 169, 110, 0.12)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "13px 20px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor: "#17171f",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(200, 169, 110, 0.4)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#1e1e2a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255, 255, 255, 0.1)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#17171f";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuer avec Google
            </button>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "13px 20px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor: "#17171f",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(200, 169, 110, 0.4)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#1e1e2a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255, 255, 255, 0.1)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#17171f";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuer avec Apple
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "#666680",
                fontWeight: "500",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              ou
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
              }}
            />
          </div>

          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                htmlFor="email"
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#aaaabc",
                  letterSpacing: "0.3px",
                }}
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                style={{
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: "#0a0a12",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(200, 169, 110, 0.6)";
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px rgba(200, 169, 110, 0.08)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    "none";
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#aaaabc",
                    letterSpacing: "0.3px",
                  }}
                >
                  Mot de passe
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: "12px",
                    color: "#c8a96e",
                    textDecoration: "none",
                    fontWeight: "500",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.opacity =
                      "0.75";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                style={{
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: "#0a0a12",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(200, 169, 110, 0.6)";
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    "0 0 0 3px rgba(200, 169, 110, 0.08)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                  (e.currentTarget as HTMLInputElement).style.boxShadow =
                    "none";
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "8px",
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #c8a96e 0%, #d4b97e 100%)",
                color: "#050508",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.3px",
                boxShadow: "0 4px 20px rgba(200, 169, 110, 0.25)",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 30px rgba(200, 169, 110, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 20px rgba(200, 169, 110, 0.25)";
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0px) scale(0.99)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px) scale(1)";
              }}
            >
              Se connecter
            </button>
          </form>

          <p
            style={{
              text
}}}