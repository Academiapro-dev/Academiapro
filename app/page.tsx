export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* HEADER */}
      <header style={{ background: "rgba(5,5,8,0.98)", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: "0", zIndex: "100" }}>
        <a href="/" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "20px", fontWeight: "bold" }}>AcadémIA Pro</a>
        <nav style={{ display: "flex", gap: "28px" }}>
          <a href="/formations" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Formations</a>
          <a href="/seances" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Seances</a>
          <a href="/packs" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Packs</a>
          <a href="/skills" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Skills</a>
          <a href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Blog</a>
          <a href="/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Contact</a>
        </nav>
        <a href="/login" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>Demarrer</a>
      </header>

      {/* HERO */}
      <section style={{ padding: "100px 40px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "4px", margin: "0 0 24px" }}>LA PLATEFORME DE FORMATION IA</p>
        <h1 style={{ fontSize: "52px", fontWeight: "bold", margin: "0 0 24px", lineHeight: "1.2" }}>Formez-vous avec votre agent IA personnel</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", margin: "0 0 40px", lineHeight: "1.7" }}>131 formations certifiantes · Agent IA tuteur 24h/24 · Seances therapeutiques · Certification AcadémIA Pro</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/formations" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", fontWeight: "bold" }}>Voir les formations</a>
          <a href="/lead-magnets/ebook" style={{ background: "transparent", color: "#c8a96e", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", border: "1px solid #c8a96e" }}>E-book gratuit</a>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#1a1a2e", padding: "60px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}>
          {[
            { nb: "131", label: "Formations certifiantes" },
            { nb: "20", label: "Skills pratiques" },
            { nb: "14", label: "Specialites therapeutiques" },
            { nb: "24/7", label: "Agent IA disponible" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ color: "#c8a96e", fontSize: "40px", fontWeight: "bold", margin: "0 0 8px" }}>{s.nb}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMATIONS */}
      <section style={{ padding: "80px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE</p>
          <h2 style={{ fontSize: "36px", margin: "0 0 12px" }}>Nos formations phares</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>Certification AcadémIA Pro · Paiement 3x sans frais · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { code: "F128", titre: "Expert Claude et IA Generative", prix: "690euro", cat: "IA" },
            { code: "F129", titre: "No-Code et Automatisation IA", prix: "790euro", cat: "IA" },
            { code: "F130", titre: "Apps Natives avec IA", prix: "990euro", cat: "IA" },
            { code: "F131", titre: "Marketing Digital x IA", prix: "890euro", cat: "Marketing" },
            { code: "F001", titre: "Management et Leadership", prix: "490euro", cat: "Business" },
            { code: "F003", titre: "Gestion du Stress et Bien-etre", prix: "390euro", cat: "Bien-etre" },
          ].map((f) => (
            <div key={f.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{f.code}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{f.cat}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px", lineHeight: "1.4" }}>{f.titre}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{f.prix}</span>
                <span style={{ background: "#050508", color: "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "11px" }}>Certifiant</span>
              </div>
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>Voir la formation</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/formations" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "15px", border: "1px solid #c8a96e", padding: "12px 32px", borderRadius: "8px" }}>Voir les 131 formations</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#050508", borderTop: "1px solid rgba(200,169,110,0.2)", padding: "60px 40px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 16px" }}>AcadémIA Pro</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.7", margin: "0" }}>La plateforme de formation propulsee par l IA. 131 formations certifiantes · Agent IA 24h/24.</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 16px" }}>Formations</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/formations" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Catalogue complet</a>
              <a href="/packs" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Nos packs</a>
              <a href="/skills" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Skills</a>
              <a href="/tarifs" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Tarifs</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 16px" }}>Seances</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/seances" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Toutes les specialites</a>
              <a href="/abonnements" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Abonnements</a>
              <a href="/classe-virtuelle" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Classes virtuelles</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 16px" }}>Ressources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/blog" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Blog</a>
              <a href="/faq" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>FAQ</a>
              <a href="/communaute" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Communaute</a>
              <a href="/a-propos" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>A propos</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 16px" }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/cgv" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>CGV</a>
              <a href="/politique-confidentialite" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Confidentialite</a>
              <a href="/mentions-legales" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Mentions legales</a>
              <a href="/garantie" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Garantie 30 jours</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(200,169,110,0.1)", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "0" }}>2026 AcadémIA Pro · Certification AcadémIA Pro · Tous droits reserves</p>
        </div>
      </footer>

    </div>
  );
}