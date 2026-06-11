import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription - AcadémIA Pro",
  description: "Créez votre compte AcadémIA Pro",
};

export default function InscriptionPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Inscription</h1>
      <p>Créez votre compte pour accéder à nos formations.</p>
    </div>
  );
}
