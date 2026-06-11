import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garantie - AcadémIA Pro",
  description: "Garantie 30 jours",
};

export default function GarantiePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Garantie</h1>
      <p>Satisfait ou remboursé.</p>
    </div>
  );
}
