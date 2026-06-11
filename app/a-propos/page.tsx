import { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos - AcadémIA Pro",
  description: "Qui sommes nous",
};

export default function AProposPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>À propos</h1>
      <p>AcadémIA Pro, centre de formation 100% IA.</p>
    </div>
  );
}
