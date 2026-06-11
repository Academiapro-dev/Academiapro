import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LMS - AcadémIA Pro",
  description: "Votre LMS",
};

export default function LMSPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>LMS</h1>
      <p>Votre espace de formation.</p>
    </div>
  );
}
