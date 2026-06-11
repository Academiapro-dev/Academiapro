import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamification - AcadémIA Pro",
  description: "Vos points",
};

export default function GamificationPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Gamification</h1>
      <p>Vos points et badges.</p>
    </div>
  );
}
