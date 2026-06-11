import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline - AcadémIA Pro",
  description: "Votre pipeline",
};

export default function PipelinePage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Pipeline</h1>
      <p>Votre pipeline commercial.</p>
    </div>
  );
}
