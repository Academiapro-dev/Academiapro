import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Cours - AcadémIA Pro",
  description: "Mini cours gratuit",
};

export default function MiniCoursPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Mini Cours</h1>
      <p>Accédez au mini cours.</p>
    </div>
  );
}
