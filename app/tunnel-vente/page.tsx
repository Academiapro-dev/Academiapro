import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offre Spéciale - AcadémIA Pro",
  description: "Offre limitée",
};

export default function TunnelVentePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Offre Spéciale</h1>
      <p>Offre spéciale limitée.</p>
    </div>
  );
}
