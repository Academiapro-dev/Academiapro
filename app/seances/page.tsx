import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Séances - AcadémIA Pro",
  description: "Nos séances",
};

export default function SeancesPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Séances</h1>
      <p>Réservez une séance.</p>
    </div>
  );
}
