import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue - AcadémIA Pro",
  description: "Nos formations",
};

export default function CataloguePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Catalogue</h1>
      <p>Découvrez nos 131 formations.</p>
    </div>
  );
}
