import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webinaire - AcadémIA Pro",
  description: "Notre webinaire",
};

export default function WebinairePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Webinaire</h1>
      <p>Inscrivez-vous au webinaire.</p>
    </div>
  );
}
