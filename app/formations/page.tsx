import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formations - AcadémIA Pro",
  description: "Toutes les formations",
};

export default function FormationsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Formations</h1>
      <p>Toutes nos formations.</p>
    </div>
  );
}
