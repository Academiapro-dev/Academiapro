import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liens - AcadémIA Pro",
  description: "Nos liens",
};

export default function LinksPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Liens</h1>
      <p>Tous nos liens utiles.</p>
    </div>
  );
}
