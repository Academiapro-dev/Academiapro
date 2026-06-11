import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starter Pack - AcadémIA Pro",
  description: "Notre starter pack",
};

export default function StarterPackPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Starter Pack</h1>
      <p>Démarrez avec notre pack.</p>
    </div>
  );
}
