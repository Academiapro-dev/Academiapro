import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Séances - AcadémIA Pro",
  description: "Vos séances",
};

export default function MonEspaceSeancesPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Mes Séances</h1>
      <p>Vos séances passées.</p>
    </div>
  );
}
