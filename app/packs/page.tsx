import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packs - AcadémIA Pro",
  description: "Nos packs",
};

export default function PacksPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Packs</h1>
      <p>Découvrez nos packs.</p>
    </div>
  );
}
