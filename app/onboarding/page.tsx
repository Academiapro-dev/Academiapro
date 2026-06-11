import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding - AcadémIA Pro",
  description: "Bienvenue",
};

export default function OnboardingPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Onboarding</h1>
      <p>Commencez votre parcours.</p>
    </div>
  );
}
