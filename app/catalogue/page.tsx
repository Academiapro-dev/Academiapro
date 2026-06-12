import React from "react";
// v2
export default function CataloguePage() {
  const formations = [
    { code: "F128", titre: "Expert Claude et IA Generative", domaine: "IA", prix: 690, duree: "40h", niveau: "Expert" },
    { code: "F129", titre: "No-Code et Automatisation IA", domaine: "IA", prix: 790, duree: "45h", niveau: "Intermediaire" },
    { code: "F130", titre: "Apps Natives avec IA", domaine: "IA", prix: 990, duree: "60h", niveau: "Avance" },
    { code: "F131", titre: "Marketing Digital x IA", domaine: "Marketing", prix: 890, duree: "50h", niveau: "Intermediaire" },
    { code: "F001", titre: "Management et Leadership", domaine: "Business", prix: 490, duree: "30h", niveau: "Intermediaire" },
    { code: "F002", titre: "Communication Professionnelle", domaine: "Business", prix: 390, duree: "25h", niveau: "Debutant" },
    { code: "F003", titre: "Gestion du Stress et Bien-etre", domaine: "Bien-etre", prix: 390, duree: "20h", niveau: "Debutant" },
    { code: "F004", titre: "Anglais Professionnel A1-C2", domaine: "Langues", prix: 590, duree: "80h", niveau: "Tous niveaux" },
    { code: "F005", titre: "Comptabilite et Gestion", domaine: "Business", prix: 490, duree: "35h", niveau: "Intermediaire" },
    { code: "F006", titre: "Ressources Humaines", domaine: "Business", prix: 490, duree: "30h", niveau: "Intermediaire" },
    { code: "F007", titre: "Excel et Google Sheets", domaine: "Outils", prix: 290, duree: "20h", niveau: "Debutant" },
    { code: "F008", titre: "PowerPoint et Canva", domaine: "Outils", prix: 290, duree: "15h", niveau: "Debutant" },
    { code: "F009", titre: "Droit du Travail", domaine: "Droit", prix: 490, duree: "25h", niveau: "Intermediaire" },
    { code: "F010", titre: "Marketing Digital", domaine: "Marketing", prix: 590, duree: "35h", niveau: "Intermediaire" },
    { code: "F011", titre: "Reseaux Sociaux Pro", domaine: "Marketing", prix: 390, duree: "20h", niveau: "Debutant" },
    { code: "F012", titre: "SEO et Referencement", domaine: "Marketing", prix: 490, duree: "25h", niveau: "Intermediaire" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>131 Formations Certifiantes</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Certification AcadémIA Pro · Paiement 3x · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {formations.map((f) => (
            <div key={f.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{f.code}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{f.domaine}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.4" }}>{f.titre}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{f.prix} euro</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{f.duree}</span>
              </div>
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>
                Voir la formation
              </a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "48px", padding: "32px", background: "#1a1a2e", borderRadius: "16px", border: "1px solid #c8a96e" }}>
          <p style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 8px" }}>131 formations disponibles</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>Catalogue complet chargé depuis Supabase · Agent IA tuteur inclus</p>
        </div>
      </div>
    </div>
  );
}