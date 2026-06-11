import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM - AcadémIA Pro",
  description: "Votre CRM",
};

export default function CRMPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>CRM</h1>
      <p>Votre espace CRM.</p>
    </div>
  );
}
