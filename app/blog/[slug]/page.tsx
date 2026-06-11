import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - AcadémIA Pro",
  description: "Articles et conseils sur la formation et l'IA",
};

export default function BlogSlugPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Article</h1>
      <p>Contenu de l article à venir.</p>
    </div>
  );
}
