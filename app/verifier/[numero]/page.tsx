import React, { useState, useEffect } from "react";

interface CertificateData {
  numero: string;
  nomFormation: string;
  date: string;
  mention: string;
  titulaire: string;
  valide: boolean;
}

interface Props {
  params: {
    numero: string;
  };
}

const certificatesDatabase: Record<string, CertificateData> = {
  "CERT-2024-001": {
    numero: "CERT-2024-001",
    nomFormation: "Développement Web Avancé",
    date: "15 Mars 2024",
    mention: "Très Bien",
    titulaire: "Jean Dupont",
    valide: true,
  },
  "CERT-2024-002": {
    numero: "CERT-2024-002",
    nomFormation: "Intelligence Artificielle Fondamentaux",
    date: "22 Juin 2024",
    mention: "Bien",
    titulaire: "Marie Martin",
    valide: true,
  },
  "CERT-2024-003": {
    numero: "CERT-2024-003",
    nomFormation: "Cybersécurité Professionnelle",
    date: "10 Septembre 2024",
    mention: "Excellent",
    titulaire: "Pierre Bernard",
    valide: true,
  },
};

export default function VerificationCertificat({ params }: Props) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const numero = params.numero;

  useEffect(() => {
    setLoading(true);
    setAnimationStep(0);

    const timer1 = setTimeout(() => {
      setAnimationStep(1);
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationStep(2);
    }, 1200);

    const timer3 = setTimeout(() => {
      const cert = certificatesDatabase[numero];
      if (cert) {
        setCertificate(cert);
        setFound(true);
      } else {
        setCertificate(null);
        setFound(false);
      }
      setLoading(false);
      setAnimationStep(3);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [numero]);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #050508 0%, #0d0d1a 50%, #050508 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  };

  const backgroundOrbStyle1: React.CSSProperties = {
    position: "absolute",
    top: "-200px",
    right: "-200px",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  const backgroundOrbStyle2: React.CSSProperties = {
    position: "absolute",
    bottom: "-200px",
    left: "-200px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(200, 169, 110, 0.05) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, #0e0e1c 0%, #12121f 100%)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "24px",
    padding: "48px",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(200, 169, 110, 0.05), inset 0 1px 0 rgba(200, 169, 110, 0.1)",
    position: "relative",
  };

  const cardTopAccentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "60%",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
  };

  const logoContainerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "32px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #c8a96e, #a8894e)",
    borderRadius: "16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    boxShadow: "0 8px 32px rgba(200, 169, 110, 0.3)",
  };

  const titleStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    margin: "0 0 4px 0",
    textTransform: "uppercase",
  };

  const subtitleStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.5)",
    fontSize: "13px",
    fontWeight: "400",
    letterSpacing: "0.15em",
    margin: 0,
    textTransform: "uppercase",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.2), transparent)",
    margin: "24px 0",
  };

  const numeroBadgeStyle: React.CSSProperties = {
    background: "rgba(200, 169, 110, 0.08)",
    border: "1px solid rgba(200, 169, 110, 0.2)",
    borderRadius: "12px",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  };

  const numeroLabelStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.6)",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  };

  const numeroValueStyle: React.CSSProperties = {
    color: "#c8a96e",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    fontFamily: "'Courier New', monospace",
  };

  const loadingContainerStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "24px 0",
  };

  const spinnerStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    border: "3px solid rgba(200, 169, 110, 0.1)",
    borderTop: "3px solid #c8a96e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  };

  const loadingStepStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0",
    opacity: active ? 1 : 0.3,
    transition: "opacity 0.5s ease",
  });

  const loadingDotStyle = (active: boolean): React.CSSProperties => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: active ? "#c8a96e" : "rgba(200, 169, 110, 0.3)",
    transition: "background 0.5s ease",
    flexShrink: 0,
  });

  const loadingTextStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.7)",
    fontSize: "14px",
    fontWeight: "500",
  };

  const resultContainerStyle: React.CSSProperties = {
    opacity: animationStep === 3 ? 1 : 0,
    transform: animationStep === 3 ? "translateY(0)" : "translateY(20px)",
    transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  const statusBannerStyle = (isValid: boolean): React.CSSProperties => ({
    background: isValid
      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.05) 100%)"
      : "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)",
    border: isValid
      ? "1px solid rgba(34, 197, 94, 0.3)"
      : "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "16px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  });

  const statusIconStyle = (isValid: boolean): React.CSSProperties => ({
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: isValid
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)",
    border: isValid
      ? "2px solid rgba(34, 197, 94, 0.4)"
      : "2px solid rgba(239, 68, 68, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "20px",
  });

  const statusTextContainerStyle: React.CSSProperties = {
    flex: 1,
  };

  const statusTitleStyle = (isValid: boolean): React.CSSProperties => ({
    color: isValid ? "#22c55e" : "#ef4444",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 2px 0",
    letterSpacing: "0.02em",
  });

  const statusDescStyle: React.CSSProperties = {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "13px",
    margin: 0,
  };

  const detailsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  };

  const detailCardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(200, 169, 110, 0.1)",
    borderRadius: "12px",
    padding: "16px",
  };

  const detailCardFullStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(200, 169, 110, 0.1)",
    borderRadius: "12px",
    padding: "16px",
    gridColumn: "1 / -1",
  };

  const detailLabelStyle: React.CSSProperties = {
    color: "rgba(200, 169, 110, 0.5)",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginBottom: "6px",
  };

  const detailValueStyle: React.CSSProperties = {
    color: "#e8e8e8",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.01em",
  };

  const mentionStyle = (mention: string): React.CSSProperties => {
    let color = "#c8a96e";
    if (mention === "Excellent" || mention === "Très Bien") {
      color = "#22c55e";
    } else if (mention === "Bien") {
      color = "#3b82f6";
    } else if (mention === "Assez Bien") {
      color = "#a855f7";
    }
    return {
      color: color,
      fontSize: "15px",
      fontWeight: "700",
    };
  };

  const notFoundContainerStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "16px 0",
  };

  const notFoundIconStyle: React.CSSProperties = {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.1)",
    border: "2px solid rgba(239, 68, 68, 0.3)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    fontSize: "28px",
  };

  const notFoundTitleStyle: React.CSSProperties = {
    color: "#ef4444",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 8px 0",
  };

  const notFoundTextStyle: React.CSSProperties = {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "14px",
    margin: "0 0 20px 0",
    lineHeight: "1.6",
  };

  const warningBoxStyle: React.CSSProperties = {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "left",
  };

  const warningTitleStyle: React.CSSProperties = {
    color: "rgba(239, 68, 68, 0.8)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "8px",
  };

  const warningItemStyle: React.CSSProperties = {
    color