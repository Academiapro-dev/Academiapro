import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ebook - AcadémIA Pro",
  description: "Notre ebook",
};

export default function EbookPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Ebook</h1>
      <p>Téléchargez notre ebook.</p>
    </div>
  );
}
