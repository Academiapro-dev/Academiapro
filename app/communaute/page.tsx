import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communauté - AcadémIA Pro",
  description: "Notre communauté",
};

export default function CommunautePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Communauté</h1>
      <p>Rejoignez la communauté.</p>
    </div>
  );
}
