import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - AcadémIA Pro",
  description: "Fiche contact",
};

export default function ContactIdPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Contact</h1>
      <p>Détail du contact.</p>
    </div>
  );
}
