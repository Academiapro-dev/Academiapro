"use client";
import Link from "next/link";

export default function TarifsPage() {
  const DOMAINES = [
    {
      nom: "🧠 Intelligence Artificielle",
      formations: [
        { titre: "Bootcamp IA Builder — Maîtrisez l'IA de A à Z", niveau: "Tous niveaux", prix: 4200 },
        { titre: "Bootcamp Product Builder No-Code et IA", niveau: "Expert", prix: 4200 },
        { titre: "Bootcamp Développeur Full Stack IA", niveau: "Avancé", prix: 4200 },
        { titre: "Bootcamp Data Scientist", niveau: "Avancé", prix: 4200 },
        { titre: "Formations IA", niveau: "Débutant → Expert", prix: 990 },
      ]
    },
    {
      nom: "🌍 Langues",
      formations: [
        { titre: "Niveau Débutant (A1-A2)", niveau: "Débutant", prix: 1090 },
        { titre: "Niveau Intermédiaire (B1-B2)", niveau: "Intermédiaire", prix: 1190 },
        { titre: "Niveau Avancé (C1-C2)", niveau: "Avancé", prix: 1290 },
        { titre: "Certifications pro (TOEIC, DALF...)", niveau: "Expert", prix: 1397 },
        { titre: "Pack complet A1→C2", niveau: "Tous niveaux", prix: 2190 },
      ]
    },
    {
      nom: "🧘 Bien-être & Thérapeutiques",
      formations: [
        { titre: "Sophrologie Caycédienne Professionnelle", niveau: "Expert", prix: 1697 },
        { titre: "Hypnose Ericksonienne Praticien", niveau: "Avancé", prix: 1697 },
        { titre: "PNL Praticien et Maître", niveau: "Expert", prix: 1697 },
        { titre: "Coaching de Vie ICF ACC", niveau: "Expert", prix: 1697 },
        { titre: "EMDR, TCC, Art-thérapie...", niveau: "Expert", prix: 1697 },
      ]
    },
    {
      nom: "💼 Business & Management",
      formations: [
        { titre: "Bootcamp Entrepreneur Digital", niveau: "Intermédiaire", prix: 4200 },
        { titre: "Management et Leadership PMP", niveau: "Avancé", prix: 1697 },
        { titre: "Négociation Avancée Harvard", niveau: "Avancé", prix: 1697 },
        { titre: "Formations Business", niveau: "Débutant → Avancé", prix: 1090 },
      ]
    },
    {
      nom: "💻 Tech & Développement",
      formations: [
        { titre: "Data Science et Dev Full Stack", niveau: "Expert", prix: 2697 },
        { titre: "Cybersécurité Red Team / CompTIA", niveau: "Avancé", prix: 2197 },
        { titre: "Blockchain et Smart Contracts", niveau: "Expert", prix: 1697 },
        { titre: "Swift iOS / Kotlin Android", niveau: "Avancé", prix: 1397 },
        { titre: "Formations Tech", niveau: "Débutant → Expert", prix: 1090 },
      ]
    },
    {
      nom: "📊 Finance",
      formations: [
        { titre: "Finance et Comptabilité DCG", niveau: "Avancé", prix: 1697 },
        { titre: "Private Equity et Capital Risque", niveau: "Expert", prix: 1697 },
        { titre: "Trading Options et Produits Dérivés", niveau: "Expert", prix: 1697 },
        { titre: "Immobilier Professionnel Carte T", niveau: "Intermédiaire", prix: 1497 },
        { titre: "Formations Finance", niveau: "Débutant → Expert", prix: 1090 },
      ]
    },
    {
      nom: "📣 Marketing",
      formations: [
        { titre: "Bootcamp Growth Marketer IA", niveau: "Expert", prix: 4200 },
        { titre: "Marketing Digital Certifié", niveau: "Intermédiaire", prix: 1397 },
        { titre: "Growth Hacking et Acquisition Virale", niveau: "Avancé", prix: 1397 },
        { titre: "Formations Marketing", niveau: "Débutant → Avancé", prix: 990 },
      ]
    },
  ];

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 30px", textAlign: "center", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "3px", margin: "0 0 12px" }}>TARIFS</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "36px", margin: "0 0 16px" }}>Des formations premium<br/>à prix accessible</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 16px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          267 formations disponibles · Agent IA 24h/24 · Manuel PDF inclus
        </p>
        <p style={{ color: "rgba(200,169,110,0.8)", fontSize: "14px", margin: "0 0 10px", maxWidth: "650px", marginLeft: "auto", marginRight: "auto" }}>
          ✦ Accompagnement 100% individuel — LMS interactif 24h/24 + 45 min audio hebdomadaires dediees
        </p>
        <p style={{ color: "rgba(139,164,217,0.8)", fontSize: "12px", margin: "0 0 30px", maxWidth: "650px", marginLeft: "auto", marginRight: "auto" }}>
          🎥 2 seances hebdomadaires incluses (45min + 20min). Nos tarifs couvrent les infrastructures necessaires : des 5 stagiaires inscrits, la seance de 20min evolue en Visio interactive, sans supplement
        </p>
        <div style={{ display: "inline-block", background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "30px", padding: "10px 24px" }}>
          <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold" }}>🎯 Offre Fondateur — 100 premiers clients : -10% à vie</span>
        </div>
      </div>

      {/* Grille formations */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px 60px" }}>
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
                      {Math.round(f.prix * 0.9).toLocaleString("fr-FR")}€
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textDecoration: "line-through" }}>
                      Prix normal : {f.prix.toLocaleString("fr-FR")}€
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
          <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>Rejoignez les 100 premiers fondateurs et bénéficiez de -10% à vie</p>
          <Link href="/formations" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Voir les formations →
          </Link>
        </div>
      </div>
    </div>
  );
}
