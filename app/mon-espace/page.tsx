import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Espace - AcadémIA Pro",
  description: "Votre espace",
};

export default function MonEspacePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Mon Espace</h1>
      <p>Votre espace personnel.</p>
    </div>
  );
}
