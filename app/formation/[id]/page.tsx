import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formation - AcadémIA Pro",
  description: "Détail formation",
};

export default function FormationPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Formation</h1>
      <p>Contenu de la formation.</p>
    </div>
  );
}
