import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abonnements - AcadémIA Pro",
  description: "Nos abonnements",
};

export default function AbonnementsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Abonnements</h1>
      <p>Choisissez votre abonnement.</p>
    </div>
  );
}
