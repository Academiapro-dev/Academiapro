import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGV - AcadémIA Pro",
  description: "Conditions générales",
};

export default function CGVPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>CGV</h1>
      <p>Conditions générales de vente.</p>
    </div>
  );
}
