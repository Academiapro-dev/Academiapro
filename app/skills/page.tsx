"use client";
import { useEffect, useState } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FR = {
  surTitre: "ACADEMIAPRO",
  titre: "Les Ateliers AcadémIA Pro",
  sousTitre: "Compétences ciblées · Format court · Applicables immediatement",
  badge: "ATELIER",
  bouton: "Acheter cet atelier",
  chargement: "Chargement des ateliers...",
  erreur: "Les ateliers n ont pas pu etre charges. Reessayez dans un instant.",
  descriptions: [
    { code: "SK01", desc: "IA · Rediger plus vite et mieux avec l IA" },
    { code: "SK02", desc: "IA · Traiter sa boite mail sans y passer la journee" },
    { code: "SK03", desc: "IA · Midjourney, DALL-E, Canva IA" },
    { code: "SK04", desc: "IA · Explorer ses donnees avec Excel et l IA" },
    { code: "SK05", desc: "IA · Un premier agent conversationnel, sans coder" },
    { code: "SK06", desc: "IA · 50 modeles de prompts professionnels" },
    { code: "SK07", desc: "IA · No-Code · 10 automatisations pretes a l emploi" },
    { code: "SK08", desc: "IA · Construire une page de vente de A a Z" },
    { code: "SK09", desc: "IA · Publier, prospecter et suivre sur LinkedIn" },
    { code: "SK10", desc: "IA · Assembler son premier agent en quelques heures" },
    { code: "SK11", desc: "Business · Clarifier son offre et son positionnement" },
    { code: "SK12", desc: "Business · Structurer un pitch convaincant" },
    { code: "SK13", desc: "Business · Une methode de prospection quotidienne" },
    { code: "SK14", desc: "Business · Preparer et mener son entretien salarial" },
    { code: "SK15", desc: "Business · Organiser sa semaine avec l IA" },
    { code: "SK16", desc: "Bien-etre · 10 minutes par jour" },
    { code: "SK17", desc: "Bien-etre · Techniques de regulation du stress" },
    { code: "SK18", desc: "Bien-etre · Un protocole de sommeil sur 7 jours" },
    { code: "SK19", desc: "Bien-etre · Exercices pratiques d affirmation" },
    { code: "SK20", desc: "Bien-etre · Retrouver de l energie au quotidien" },
  ],
};

export default function SkillsPage() {
  const { txt } = useTraductionAuto(FR);
  const [ateliers, setAteliers] = useState<any[]>([]);
  const [etat, setEtat] = useState("chargement");

  useEffect(() => {
    fetch("/api/ateliers")
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          setAteliers(d.ateliers || []);
          setEtat("ok");
        } else {
          setEtat("erreur");
        }
      })
      .catch(() => setEtat("erreur"));
  }, []);

  const descriptionDe = (code: string) => {
    const t = (txt.descriptions || []).find((d: any) => d.code === code);
    return t ? t.desc : "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508",
      color: "#fff", fontFamily: "Georgia, serif",
      padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px",
            letterSpacing: "3px", margin: "0 0 12px" }}>
            {txt.surTitre}
          </p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>
            {txt.titre}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>
            {txt.sousTitre}
          </p>
        </div>

        {etat === "chargement" && (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            {txt.chargement}
          </p>
        )}
        {etat === "erreur" && (
          <p style={{ textAlign: "center", color: "#ff6b6b" }}>{txt.erreur}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns:
          "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {ateliers.map((item) => (
            <div key={item.code} style={{
              background: "#1a1a2e", borderRadius: "12px", padding: "24px",
              border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{item.code}</span>
                <span style={{ background: "#c8a96e", color: "#050508",
                  padding: "2px 8px", borderRadius: "10px", fontSize: "10px",
                  fontWeight: "bold" }}>{txt.badge}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 8px",
                lineHeight: "1.4" }}>{item.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px",
                margin: "0 0 16px" }}>{descriptionDe(item.code)}</p>
              <div style={{ marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>
                  {item.prix} €
                </span>
              </div>
              <a href={"/api/checkout?formation=" + item.code}
                style={{ display: "block",
                  background: "linear-gradient(135deg, #c8a96e, #a07840)",
                  color: "#050508", borderRadius: "8px", padding: "10px",
                  fontSize: "13px", fontWeight: "bold", textAlign: "center",
                  textDecoration: "none" }}>{txt.bouton}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
