import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique - AcadémIA Pro",
  description: "Confidentialité",
};

export default function PolitiquePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Politique</h1>
      <p>Politique de confidentialité.</p>
    </div>
  );
}
