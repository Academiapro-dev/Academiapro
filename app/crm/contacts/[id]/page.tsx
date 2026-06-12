export default function ContactPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/crm/contacts" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "14px" }}>Retour aux contacts</a>
        <div style={{ marginTop: "32px", marginBottom: "32px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>FICHE CONTACT</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0" }}>Contact #{params.id}</h1>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {[
            { titre: "Informations", desc: "Nom email telephone metier" },
            { titre: "Statut", desc: "Lead Prospect Client VIP" },
            { titre: "Formations", desc: "Formations achetees et en cours" },
            { titre: "Seances", desc: "Historique des seances therapeutiques" },
            { titre: "Score", desc: "Score de qualification par agent IA" },
            { titre: "Notes", desc: "Notes et historique interactions" },
          ].map((item) => (
            <div key={item.titre} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 8px" }}>{item.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}