import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs - AcadémIA Pro",
  description: "Nos tarifs",
};

export default function TarifsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Tarifs</h1>
      <p>Découvrez nos offres.</p>
    </div>
  );
}
