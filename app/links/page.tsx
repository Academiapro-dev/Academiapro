"use client";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  titre: "AcadémIA Pro",
  sousTitre: "263 formations certifiantes · Agent IA 24h/24",
  liens: [
    { titre: "Voir les 263 formations", url: "/formations", badge: "CATALOGUE" },
    { titre: "Reserver une seance", url: "/seances", badge: "SEANCE" },
    { titre: "E-book gratuit", url: "/lead-magnets/ebook", badge: "GRATUIT" },
    { titre: "Starter Pack 47euro", url: "/starter-pack", badge: "OFFRE" },
    { titre: "Pack IA Complet 2690euro", url: "/packs", badge: "BEST-SELLER" },
    { titre: "Rejoindre la communaute", url: "/communaute", badge: "GRATUIT" },
    { titre: "Webinaire gratuit", url: "/lead-magnets/webinaire", badge: "LIVE" },
    { titre: "Mini-cours 3 jours", url: "/lead-magnets/mini-cours", badge: "GRATUIT" },
  ],
};

export default function LinksPage() {
  const { txt } = useTraductionAuto(FR);
  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto",
        textAlign: "center" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{ width: "80px", height: "80px",
            background:
              "linear-gradient(135deg, #c8a96e, #a07840)",
            borderRadius: "50%", margin: "0 auto 16px",
            display: "flex", alignItems: "center",
            justifyContent: "center" }}>
            <span style={{ fontSize: "32px" }}>A</span>
          </div>
          <h1 style={{ color: "#c8a96e", fontSize: "24px",
            margin: "0 0 8px" }}>{txt.titre}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)",
            fontSize: "14px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>
        <div style={{ display: "flex",
          flexDirection: "column", gap: "12px" }}>
          {txt.liens.map((lien) => (
            <a key={lien.url} href={lien.url}
              style={{ display: "flex",
                justifyContent: "space-between",
                alignItems: "center", background: "#1a1a2e",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "12px", padding: "16px 20px",
                textDecoration: "none", color: "#fff" }}>
              <span style={{ fontSize: "15px" }}>
                {lien.titre}
              </span>
              <span style={{ background: "#c8a96e",
                color: "#050508", padding: "3px 10px",
                borderRadius: "10px", fontSize: "10px",
                fontWeight: "bold" }}>{lien.badge}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
