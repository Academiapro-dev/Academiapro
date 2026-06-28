"use client";
import { useState } from "react";
import Link from "next/link";

export default function TarifsPage() {
  const [onglet, setOnglet] = useState("solo");

  const DOMAINES = [
    {
      nom: "🧠 Intelligence Artificielle",
      formations: [
        { titre: "Bootcamp IA Builder — Maîtrisez l'IA de A à Z", niveau: "Tous niveaux", solo: 3500, avatar: 4900 },
        { titre: "Bootcamp Product Builder No-Code et IA", niveau: "Expert", solo: 3500, avatar: 4900 },
        { titre: "Bootcamp Développeur Full Stack IA", niveau: "Avancé", solo: 3500, avatar: 4900 },
        { titre: "Bootcamp Data Scientist", niveau: "Avancé", solo: 3500, avatar: 4900 },
        { titre: "Formations IA", niveau: "Débutant → Expert", solo: 290, avatar: 490 },
      ]
    },
    {
      nom: "🌍 Langues",
      formations: [
        { titre: "Niveau Débutant (A1-A2)", niveau: "Débutant", solo: 390, avatar: 590 },
        { titre: "Niveau Intermédiaire (B1-B2)", niveau: "Intermédiaire", solo: 490, avatar: 690 },
        { titre: "Niveau Avancé (C1-C2)", niveau: "Avancé", solo: 590, avatar: 790 },
        { titre: "Certifications pro (TOEIC, DALF...)", niveau: "Expert", solo: 697, avatar: 997 },
        { titre: "Pack complet A1→C2", niveau: "Tous niveaux", solo: 1490, avatar: 1990 },
      ]
    },
    {
      nom: "🧘 Bien-être & Thérapeutiques",
      formations: [
        { titre: "Sophrologie Caycédienne Professionnelle", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "Hypnose Ericksonienne Praticien", niveau: "Avancé", solo: 997, avatar: 1497 },
        { titre: "PNL Praticien et Maître", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "Coaching de Vie ICF ACC", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "EMDR, TCC, Art-thérapie...", niveau: "Expert", solo: 997, avatar: 1497 },
      ]
    },
    {
      nom: "💼 Business & Management",
      formations: [
        { titre: "Bootcamp Entrepreneur Digital", niveau: "Intermédiaire", solo: 3500, avatar: 4900 },
        { titre: "Management et Leadership PMP", niveau: "Avancé", solo: 997, avatar: 1497 },
        { titre: "Négociation Avancée Harvard", niveau: "Avancé", solo: 997, avatar: 1497 },
        { titre: "Formations Business", niveau: "Débutant → Avancé", solo: 390, avatar: 590 },
      ]
    },
    {
      nom: "💻 Tech & Développement",
      formations: [
        { titre: "Data Science et Dev Full Stack", niveau: "Expert", solo: 1997, avatar: 2997 },
        { titre: "Cybersécurité Red Team / CompTIA", niveau: "Avancé", solo: 1497, avatar: 2247 },
        { titre: "Blockchain et Smart Contracts", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "Swift iOS / Kotlin Android", niveau: "Avancé", solo: 697, avatar: 997 },
        { titre: "Formations Tech", niveau: "Débutant → Expert", solo: 390, avatar: 590 },
      ]
    },
    {
      nom: "📊 Finance",
      formations: [
        { titre: "Finance et Comptabilité DCG", niveau: "Avancé", solo: 997, avatar: 1497 },
        { titre: "Private Equity et Capital Risque", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "Trading Options et Produits Dérivés", niveau: "Expert", solo: 997, avatar: 1497 },
        { titre: "Immobilier Professionnel Carte T", niveau: "Intermédiaire", solo: 797, avatar: 1197 },
        { titre: "Formations Finance", niveau: "Débutant → Expert", solo: 390, avatar: 590 },
      ]
    },
    {
      nom: "📣 Marketing",
      formations: [
        { titre: "Bootcamp Growth Marketer IA", niveau: "Expert", solo: 3500, avatar: 4900 },
        { titre: "Marketing Digital Certifié", niveau: "Intermédiaire", solo: 697, avatar: 997 },
        { titre: "Growth Hacking et Acquisition Virale", niveau: "Avancé", solo: 697, avatar: 997 },
        { titre: "Formations Marketing", niveau: "Débutant → Avancé", solo: 290, avatar: 490 },
      ]
    },
  ];

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 30px", textAlign: "center", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "3px", margin: "0 0 12px" }}>TARIFS</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "36px", margin: "0 0 16px" }}>Des formations premium<br/>à prix accessible</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 30px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          265 formations disponibles · Agent IA 24h/24 · Manuel PDF inclus
        </p>
        <div style={{ display: "inline-block", background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "30px", padding: "10px 24px" }}>
          <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold" }}>🎯 Offre Fondateur — 100 premiers clients : -50% sur tout</span>
        </div>
      </div>

      {/* Toggle Solo / Avatar */}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px 20px", gap: "12px" }}>
        <button onClick={() => setOnglet("solo")}
          style={{ padding: "12px 20px", borderRadius: "10px", border: "2px solid " + (onglet === "solo" ? "#c8a96e" : "rgba(255,255,255,0.1)"), background: onglet === "solo" ? "#c8a96e" : "transparent", color: onglet === "solo" ? "#050508" : "#fff", fontWeight: "bold", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
          💬 Solo — Chat IA inclus
        </button>
        <button onClick={() => setOnglet("avatar")}
          style={{ padding: "12px 20px", borderRadius: "10px", border: "2px solid " + (onglet === "avatar" ? "#c8a96e" : "rgba(255,255,255,0.1)"), background: onglet === "avatar" ? "#c8a96e" : "transparent", color: onglet === "avatar" ? "#050508" : "#fff", fontWeight: "bold", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
          🤖 Avec Avatar IA — 2h/semaine live
        </button>
      </div>

      {onglet === "avatar" && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
            2 sessions live d'1h/semaine avec avatar IA · Chat interactif 24h/24 7j/7 inclus
          </p>
        </div>
      )}

      {/* Grille formations */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 20px 60px" }}>
        {DOMAINES.map((domaine, di) => (
          <div key={di} style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid rgba(200,169,110,0.2)" }}>
              {domaine.nom}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {domaine.formations.map((f, fi) => (
                <div key={fi} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "12px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>{f.titre}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{f.niveau}</div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: "16px" }}>
                    <div style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold" }}>
                      {(onglet === "solo" ? f.solo : f.avatar).toLocaleString("fr-FR")}€
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textDecoration: "line-through" }}>
                      Valeur réelle : {Math.round((onglet === "solo" ? f.solo : f.avatar) * 2).toLocaleString("fr-FR")}€
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "40px", padding: "40px", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 12px" }}>Prêt à commencer ?</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>Rejoignez les 100 premiers fondateurs et bénéficiez de -50% à vie</p>
          <Link href="/formations" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Voir les formations →
          </Link>
        </div>
      </div>
    </div>
  );
}
