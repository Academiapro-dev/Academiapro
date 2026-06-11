import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Séance - AcadémIA Pro",
  description: "Votre séance",
};

export default function SeanceSpecialitePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Séance</h1>
      <p>Séance thérapeutique.</p>
    </div>
  );
}
