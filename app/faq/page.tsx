import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - AcadémIA Pro",
  description: "Questions fréquentes",
};

export default function FAQPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>FAQ</h1>
      <p>Questions fréquentes à venir.</p>
    </div>
  );
}
