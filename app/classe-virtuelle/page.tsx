import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classe Virtuelle - AcadémIA Pro",
  description: "Nos classes",
};

export default function ClasseVirtuelleListPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Classe Virtuelle</h1>
      <p>Rejoignez une classe virtuelle.</p>
    </div>
  );
}
