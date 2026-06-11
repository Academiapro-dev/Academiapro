"use client";
import React from "react";
import { useState } from "react";

interface Certificate {
  id: string;
  studentName: string;
  course: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "revoked" | "expired";
  credentialId: string;
  score: number;
}

const mockCertificates: Certificate[] = [
  {
    id: "1",
    studentName: "Sophie Martin",
    course: "Intelligence Artificielle Avancée",
    issueDate: "2024-01-15",
    expiryDate: "2026-01-15",
    status: "active",
    credentialId: "ACAD-2024-001",
    score: 94,
  },
  {
    id: "2",
    studentName: "Thomas Dubois",
    course: "Machine Learning Fondamentaux",
    issueDate: "2024-02-20",
    expiryDate: "2026-02-20",
    status: "active",
    credentialId: "ACAD-2024-002",
    score: 87,
  },
  {
    id: "3",
    studentName: "Amelia Bernard",
    course: "Deep Learning & Réseaux Neuronaux",
    issueDate: "2023-11-10",
    expiryDate: "2025-11-10",
    status: "revoked",
    credentialId: "ACAD-2023-089",
    score: 78,
  },
  {
    id: "4",
    studentName: "Lucas Petit",
    course: "NLP & Traitement du Langage",
    issueDate: "2023-08-05",
    expiryDate: "2024-08-05",
    status: "expired",
    credentialId: "ACAD-2023-045",
    score: 91,
  },
  {
    id: "5",
    studentName: "Chloé Moreau",
    course: "Computer Vision Appliquée",
    issueDate: "2024-03-01",
    expiryDate: "2026-03-01",
    status: "active",
    credentialId: "ACAD-2024-018",
    score: 96,
  },
  {
    id: "6",
    studentName: "Nathan Leroy",
    course: "IA Éthique & Gouvernance",
    issueDate: "2024-03-15",
    expiryDate: "2026-03-15",
    status: "active",
    credentialId: "ACAD-2024-022",
    score: 83,
  },
];

export default function AdminCertificatsPage() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [newCert, setNewCert] = useState({ studentName: "", course: "", score: "" });
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredCerts = certificates.filter((c) => {
    const matchSearch =
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.credentialId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: certificates.length,
    active: certificates.filter((c) => c.status === "active").length,
    revoked: certificates.filter((c) => c.status === "revoked").length,
    expired: certificates.filter((c) => c.status === "expired").length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCerts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCerts.map((c) => c.id));
    }
  };

  const revokeSelected = () => {
    setCertificates((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id) && c.status === "active"
          ? { ...c, status: "revoked" as const }
          : c
      )
    );
    setSelectedIds([]);
    showNotification("Certificats révoqués avec succès");
  };

  const revokeSingle = (id: string) => {
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id && c.status === "active" ? { ...c, status: "revoked" as const } : c
      )
    );
    showNotification("Certificat révoqué");
  };

  const generateCertificate = () => {
    if (!newCert.studentName || !newCert.course) return;
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);
    const newEntry: Certificate = {
      id: String(certificates.length + 1),
      studentName: newCert.studentName,
      course: newCert.course,
      issueDate: now.toISOString().split("T")[0],
      expiryDate: expiry.toISOString().split("T")[0],
      status: "active",
      credentialId: "ACAD-2024-0" + String(certificates.length + 30),
      score: parseInt(newCert.score) || 85,
    };
    setCertificates((prev) => [newEntry, ...prev]);
    setNewCert({ studentName: "", course: "", score: "" });
    setShowGenerateModal(false);
    showNotification("Nouveau certificat généré avec succès");
  };

  const statusColor = (status: string) => {
    if (status === "active") return "#4ade80";
    if (status === "revoked") return "#f87171";
    return "#facc15";
  };

  const statusLabel = (status: string) => {
    if (status === "active") return "Actif";
    if (status === "revoked") return "Révoqué";
    return "Expiré";
  };

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#050508",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: "#e8e0d0",
    padding: "0",
    margin: "0",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #0a0a12 100%)",
    borderBottom: "1px solid #c8a96e30",
    padding: "24px 40px",
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
    width: "42px",
    height: "42px",
    background: "linear-gradient(135deg, #c8a96e, #a07840)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  };

  const headerBadgeStyle: React.CSSProperties = {
    background: "#c8a96e15",
    border: "1px solid #c8a96e40",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "13px",
    color: "#c8a96e",
    fontWeight: "500",
  };

  const mainStyle: React.CSSProperties = {
    padding: "32px 40px",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#e8e0d0",
    marginBottom: "8px",
  };

  const pageDescStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "32px",
  };

  const statsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "32px",
  };

  const statCardStyle = (accent: string): React.CSSProperties => ({
    background: "linear-gradient(135deg, #0d0d18, #111120)",
    border: "1px solid #1a1a2e",
    borderRadius: "16px",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  });

  const statAccentLineStyle = (color: string): React.CSSProperties => ({
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "2px",
    background: color,
  });

  const statNumberStyle: React.CSSProperties = {
    fontSize: "36px",
    fontWeight: "800",
    color: "#c8a96e",
    lineHeight: "1",
    marginBottom: "8px",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#888",
    fontWeight: "500",
  };

  const statIconStyle: React.CSSProperties = {
    position: "absolute",
    right: "20px",
    top: "50%",
    fontSize: "32px",
    opacity: "0.15",
    transform: "translateY(-50%)",
  };

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    alignItems: "center",
    flexWrap: "wrap",
  };

  const searchStyle: React.CSSProperties = {
    flex: "1",
    minWidth: "240px",
    background: "#0d0d18",
    border: "1px solid #1e1e35",
    borderRadius: "10px",
    padding: "10px 16px",
    color: "#e8e0d0",
    fontSize: "14px",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    background: "#0d0d18",
    border: "1px solid #1e1e35",
    borderRadius: "10px",
    padding: "10px 16px",
    color: "#e8e0d0",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  };

  const btnPrimaryStyle = (hovered: boolean): React.CSSProperties => ({
    background: hovered
      ? "linear-gradient(135deg, #d4b87e, #c8a96e)"
      : "linear-gradient(135deg, #c8a96e, #a07840)",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    color: "#050508",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    transform: hovered ? "translateY(-1px)" : "translateY(0)",
  });

  const btnDangerStyle = (hovered: boolean): React.CSSProperties => ({
    background: hovered ? "#ef4444" : "#dc262620",
    border: "1px solid #dc2626",
    borderRadius: "10px",
    padding: "10px 20px",
    color: hovered ? "#fff" : "#f87171",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  });

  const btnSecondaryStyle = (hovered: boolean): React.CSSProperties => ({
    background: hovered ? "#1e1e35" : "transparent",
    border: "1px solid #2a2a45",
    borderRadius: "10px",
    padding: "10px 20px",
    color: "#c8a96e",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  });

  const tableContainerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0d0d18, #0a0a14)",
    border: "1px solid #1a1a2e",
    borderRadius: "16px",
    overflow: "hidden",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle: React.CSSProperties = {
    background: "#0a0a12",
    padding: "14px 18px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "#c8a96e",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #1a1a2e",
  };

  const tdStyle: React.CSSProperties = {
    padding: "16px 18px",
    fontSize: "13px",
    color: "#ccc",
    borderBottom: "1px solid #12121f",
    verticalAlign: "middle",
  };

  const trStyle = (hovered: boolean): React.CSSProperties => ({
    background: hovered ? "#0f0f1e" : "transparent",
    transition: "background 0.15