import { createClient } from "@supabase/supabase-js";

export default async function CataloguePage() {
  let formations: any[] = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("formations")
      .select("*")
      .eq("actif", true)
      .order("code", { ascending: true });
    if (data && data.length > 0) formations = data;
  } catch (e) {}

  if (formations.length === 0) {
    formations = [
      { code: "F128", titre: "Expert Claude et IA Generative", prix: 690, domaine: "IA", duree: "40h" },
      { code: "F129", titre: "No-Code et Automatisation IA", prix: 790, domaine: "IA", duree: "45h" },
      { code: "F130", titre: "Apps Natives avec IA", prix: 990, domaine: "IA", duree: "60h" },
      { code: "F131", titre: "Marketing Digital x IA", prix: 890, domaine: "Marketing", duree: "50h" },
      { code: "F001", titre: "Management et Leadership", prix: 490, domaine: "Business", duree: "30h" },
      { code: "F002", titre: "Communication Professionnelle", prix: 390, domaine: "Business", duree: "25h" },
    ];
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 12px" }}>{formations.length} Formations Certifiantes</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0" }}>Certification AcadémIA Pro · Paiement 3x · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {formations.map((f: any) => (
            <div key={f.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "11px" }}>{f.code}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{f.domaine}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.4" }}>{f.titre}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{f.prix}€</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{f.duree}</span>
              </div>
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>Voir la formation</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}