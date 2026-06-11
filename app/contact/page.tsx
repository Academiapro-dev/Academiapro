import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - AcadémIA Pro",
  description: "Contactez-nous",
};

export default function ContactPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Contact</h1>
      <p>Nous contacter.</p>
    </div>
  );
}
