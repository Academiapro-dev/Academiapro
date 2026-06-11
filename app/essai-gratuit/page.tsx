import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Essai Gratuit - AcadémIA Pro",
  description: "Essai gratuit",
};

export default function EssaiGratuitPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Essai Gratuit</h1>
      <p>Essayez gratuitement.</p>
    </div>
  );
}
