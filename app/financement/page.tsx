import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financement - AcadémIA Pro",
  description: "Financer votre formation",
};

export default function FinancementPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Financement</h1>
      <p>Options de financement.</p>
    </div>
  );
}
