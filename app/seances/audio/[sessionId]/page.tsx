import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Séance Audio - AcadémIA Pro",
  description: "Séance audio",
};

export default function SeanceAudioPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Séance Audio</h1>
      <p>Séance audio en cours.</p>
    </div>
  );
}
