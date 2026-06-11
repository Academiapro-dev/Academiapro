import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - AcadémIA Pro",
  description: "Connectez-vous",
};

export default function LoginPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Connexion</h1>
      <p>Connexion à votre compte.</p>
    </div>
  );
}
