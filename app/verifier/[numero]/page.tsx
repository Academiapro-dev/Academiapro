import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification - AcadémIA Pro",
  description: "Vérifier certificat",
};

export default function VerifierPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Vérification</h1>
      <p>Vérification du certificat.</p>
    </div>
  );
}
