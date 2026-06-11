import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - AcadémIA Pro",
  description: "Votre espace",
};

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Dashboard</h1>
      <p>Bienvenue sur votre dashboard.</p>
    </div>
  );
}
