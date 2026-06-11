import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales - AcadémIA Pro",
  description: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Mentions Légales</h1>
      <p>Mentions légales.</p>
    </div>
  );
}
