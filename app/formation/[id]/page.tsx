import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Formation ${params.id} — AcadémIA Pro`,
    description: "Formation professionnelle AcadémIA Pro",
  };
}

async function getFormation(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/formations?code=eq.${id}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
}

export default async function FormationPage({ params }: { params: { id: string } }) {
  const formation = await getFormation(params.id);

  if (!formation) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e" }}>Formation non trouvee</h1>
        <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} · {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{formation.titre}</h1>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          {formation.duree && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{formation.duree}</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>Niveau {formation.niveau}</span>}
          {formation.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{formation.prix}€</span>}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "40px" }}>
          {[
            { icon: "📚", label: "E-Learning", desc: "Asynchrone · A votre rythme" },
            { icon: "🤖", label: "Coach IA 24h/24", desc: "Questions par chat · Immediat" },
            { icon: "🎥", label: "Classe Virtuelle", desc: "Live · Mardis et Jeudis 20h" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "3px" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {formation.description && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Description</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.description}</p>
          </div>
        )}

        {formation.objectifs && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Objectifs</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.objectifs}</p>
          </div>
        )}

        {formation.prerequis && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Prerequis</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.prerequis}</p>
          </div>
        )}

        {formation.public_cible && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>Public cible</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.public_cible}</p>
          </div>
        )}

        {formation.programme && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>Programme complet</h2>
            {Array.isArray(formation.programme) && formation.programme.map((ch: any) => (
              <div key={ch.chapitre} style={{ marginBottom: "20px", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "14px 20px" }}>
                  <h3 style={{ color: "#fff", margin: 0, fontFamily: "Georgia,serif" }}>Chapitre {ch.chapitre} — {ch.titre}</h3>
                </div>
                <div style={{ padding: "15px 20px" }}>
                  {ch.modules && ch.modules.map((mod: any) => (
                    <div key={mod.module} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "space-between" }}>
                      <span>Module {mod.module} — {mod.titre}</span>
                      {mod.duree && <span style={{ color: "#c8a96e", fontSize: "13px" }}>{mod.duree}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "25px", marginBottom: "30px" }}>
          <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginTop: 0 }}>Votre Coach IA vous attend</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
            Posez vos questions sur cette formation directement a votre coach IA personnel — disponible 24h/24 · 7j/7.
          </p>
          <a
            href="/dashboard"
            style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", marginRight: "10px" }}
          >
            Acceder au Coach IA
          </a>
          <a
            href="/classe-virtuelle"
            style={{ display: "inline-block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", border: "1px solid rgba(200,169,110,0.3)" }}
          >
            Rejoindre une Classe Live
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: "50px", padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
          <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", marginBottom: "10px" }}>Pret a commencer ?</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
            Acces immediat · Agent IA 24h/24 · Garantie 30 jours
          </p>
          <a
            href="/inscription"
            style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "18px" }}
          >
            Acheter — {formation.prix}€
          </a>
        </div>
      </div>
    </div>
  );
}
