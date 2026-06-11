import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Séance Live - AcadémIA Pro",
  description: "Séance live",
};

export default function SeanceLivePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Séance Live</h1>
      <p>Séance live en cours.</p>
    </div>
  );
}
