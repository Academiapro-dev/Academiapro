import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Certificats - AcadémIA Pro",
  description: "Vos certificats",
};

export default function MesCertificatsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Mes Certificats</h1>
      <p>Vos certificats obtenus.</p>
    </div>
  );
}
