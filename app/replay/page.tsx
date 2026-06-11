import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Replay - AcadémIA Pro",
  description: "Vos replays",
};

export default function ReplayPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif" }}>Replay</h1>
      <p>Revoyez vos sessions.</p>
    </div>
  );
}
