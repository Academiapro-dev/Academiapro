import { createClient } from "@supabase/supabase-js";

export default async function FormationPage({ params }: { params: { id: string } }) {
  let formation: any = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("formations")
      .select("*")
      .eq("code", params.id.toUpperCase())
      .single();
    if (data) formation = data;
  } catch (e) {}

  if (!formation) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e" }}>Formation non trouvee</h1>
        <a href="/formations" style={{ color: "#c8a96e", textDecoration: "none" }}>Retour au catalogue</a>
      </div>
    );
  }

  const programme = formation.programme || [];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #0d0d14, #1a1a2e)", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "60px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <a href="/formations" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "13px" }}>← Retour au catalogue</a>
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>{formation.code}</span>
                <span style={{ background: "rgba(200,169,110,0.1)", color: "#c8a96e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>{formation.domaine}</span>
                <span style={{ background: "rgba(200,169,110,0.1)", color: "#c8a96e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>{formation.niveau}</span>
              </div>
              <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 16px", lineHeight: "1.3" }}>{formation.titre}</h1>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", margin: "0 0 24px", lineHeight: "1.7" }}>{formation.description || "Formation certifiante AcadémIA Pro avec agent IA tuteur 24h/24."}</p>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0" }}>{formation.nb_chapitres || 5}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0" }}>Chapitres</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0" }}>{formation.nb_modules || 20}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0" }}>Modules</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0" }}>{formation.duree}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0" }}>Duree</p>
                </div>
              </div>
            </div>

            {/* CARTE ACHAT */}
            <div style={{ background: "#050508", borderRadius: "16px", padding: "32px", border: "2px solid #c8a96e", minWidth: "260px" }}>
              <p style={{ color: "#fff", fontSize: "40px", fontWeight: "bold", margin: "0 0 4px" }}>{formation.prix}€</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 24px" }}>Paiement 3x sans frais disponible</p>
              <a href="#" style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "bold", textAlign: "center", textDecoration: "none", marginBottom: "12px" }}>
                Acheter maintenant
              </a>
              <a href="/essai-gratuit" style={{ display: "block", background: "transparent", color: "#c8a96e", border: "1px solid #c8a96e", borderRadius: "10px", padding: "12px", fontSize: "14px", textAlign: "center", textDecoration: "none", marginBottom: "20px" }}>
                Essai gratuit
              </a>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>✅ Certification AcadémIA Pro</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>✅ Agent IA tuteur 24h/24</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>✅ Acces a vie</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0" }}>✅ Garantie 30 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 20px" }}>

        {/* OBJECTIFS */}
        {formation.objectifs && (
          <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "32px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "32px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "22px", margin: "0 0 16px" }}>Objectifs de la formation</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.8", margin: "0" }}>{formation.objectifs}</p>
          </div>
        )}

        {/* INFOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
          {formation.public_cible && (
            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.2)" }}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Public cible</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7", margin: "0" }}>{formation.public_cible}</p>
            </div>
          )}
          {formation.prerequis && (
            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.2)" }}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Prerequis</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7", margin: "0" }}>{formation.prerequis}</p>
            </div>
          )}
        </div>

        {/* PROGRAMME */}
        {programme.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 24px" }}>Programme complet</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {programme.map((chapitre: any) => (
                <div key={chapitre.chapitre} style={{ background: "#1a1a2e", borderRadius: "12px", border: "1px solid rgba(200,169,110,0.2)", overflow: "hidden" }}>
                  <div style={{ background: "rgba(200,169,110,0.1)", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ background: "#c8a96e", color: "#050508", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", flexShrink: 0 }}>{chapitre.chapitre}</span>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0", fontWeight: "bold" }}>{chapitre.titre}</h3>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginLeft: "auto" }}>{chapitre.modules?.length || 0} modules</span>
                  </div>
                  <div style={{ padding: "16px 24px" }}>
                    {chapitre.modules?.map((module: any) => (
                      <div key={module.module} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ color: "rgba(200,169,110,0.5)", fontSize: "12px", minWidth: "20px" }}>{chapitre.chapitre}.{module.module}</span>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{module.titre}</span>
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{module.duree}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA BAS */}
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "40px", border: "1px solid #c8a96e", textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 8px" }}>Pret a commencer ?</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 24px" }}>Acces immediat · Agent IA 24h/24 · Garantie 30 jours</p>
          <a href="#" style={{ display: "inline-block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "10px", padding: "16px 40px", fontSize: "16px", fontWeight: "bold", textDecoration: "none" }}>
            Acheter {formation.titre} — {formation.prix}€
          </a>
        </div>

      </div>
    </div>
  );
}
