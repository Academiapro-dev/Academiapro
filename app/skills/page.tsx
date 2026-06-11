import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compétences - AcadémIA Pro",
  description: "Vos compétences",
};

export default function SkillsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Compétences</h1>
      <p>Vos compétences acquises.</p>
    </div>
  );
}
