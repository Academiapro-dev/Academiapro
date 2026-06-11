import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts - AcadémIA Pro",
  description: "Vos contacts",
};

export default function ContactsPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Contacts</h1>
      <p>Liste de vos contacts.</p>
    </div>
  );
}
