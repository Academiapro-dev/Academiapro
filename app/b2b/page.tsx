"use client";
import { useState, useEffect } from "react";

export default function B2BPage() {
  const [onglet, setOnglet] = useState("presentation");
  const [form, setForm] = useState({
    nom_entreprise: "", contact_nom: "", contact_email: "",
    secteur: "", nb_employes: "", besoins: ""
  });
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [prospects, setProspects] = useState<any[]>([]);

  useEffect(() => {
    if (onglet === "admin") chargerProspects();
  }, [onglet]);

  async function chargerProspects() {
    const res = await fetch("/api/b2b");
    const data = await res.json();
    setProspects(Array.isArray(data) ? data : []);
  }

  async function envoyerDevis() {
    if (!form.nom_entreprise || !form.contact_email) {
      setErreur("Nom entreprise et email requis");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSucces(true);
      } else {
        setErreur(data.message || "Erreur envoi");
      }
    } catch (e) {
      setErreur("Erreur connexion");
    }
    setLoading(false);
  }

  const SECTEURS = [
    "Technologie / IA", "Finance / Banque", "Sante / Pharma",
    "Education / Formation", "Retail / E-commerce", "Industrie / Manufacturing",
    "Conseil / Cabinet", "Immobilier", "Media / Communication", "Autre"
  ];

  const NB_EMPLOYES = ["1-10", "11-50", "51-200", "201-500", "500+"];

  const OFFRES = [
    {
      nom: "Starter B2B",
      prix: "2 900€/an",
      desc: "Jusqu a 10 collaborateurs",
      features: [
        "Acces 50 formations au choix",
        "Agent IA tuteur partage",
        "Tableau de bord RH basique",
        "Support email",
        "Certificats AcadémIA Pro",
      ],
      color: "#3b82f6",
      icon: "🏢"
    },
    {
      nom: "Business B2B",
      prix: "7 900€/an",
      desc: "Jusqu a 50 collaborateurs",
      features: [
        "Acces 235 formations completes",
        "Agent IA tuteur dedie par equipe",
        "Tableau de bord RH avance",
        "Classes virtuelles prioritaires",
        "Support dedie · Onboarding inclus",
        "Rapport progression mensuel",
        "Certificats personnalises",
      ],
      color: "#c8a96e",
      icon: "🏭",
      recommande: true
    },
    {
      nom: "Enterprise B2B",
      prix: "Sur devis",
      desc: "Collaborateurs illimites",
      features: [
        "Acces illimite tout le catalogue",
        "Agent IA tuteur exclusif par service",
        "LMS integre a votre SI",
        "Formation sur mesure",
        "Compte manager dedie",
        "SLA garanti 99.9%",
        "OPCO et CPF facilites",
        "Qualiopi · Bilan competences",
      ],
      color: "#22c55e",
      icon: "🌐"
    },
  ];

  const AVANTAGES = [
    { icon: "💰", titre: "ROI immediat", desc: "Vos equipes montent en competences IA en 30 jours" },
    { icon: "📊", titre: "Tableau de bord RH", desc: "Suivi progression · certifications · engagement" },
    { icon: "🤖", titre: "Agent IA dedie", desc: "Un tuteur IA disponible 24h/24 pour chaque equipe" },
    { icon: "🏆", titre: "Certification reconnue", desc: "Certification AcadémIA Pro valorisable sur LinkedIn" },
    { icon: "📱", titre: "100% digital", desc: "Acces mobile · PWA · Sans installation" },
    { icon: "🔒", titre: "Securite enterprise", desc: "RGPD conforme · Donnees hebergees en Europe" },
  ];

  if (succes) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "550px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            Demande recue !
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8", marginBottom: "25px" }}>
            {form.contact_nom} · nous avons bien recu votre demande pour <strong style={{ color: "#c8a96e" }}>{form.nom_entreprise}</strong>.
            Notre equipe vous contacte sous 24h avec un devis personnalise.
          </p>
          <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "25px" }}>
            <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Prochaines etapes</h3>
            {["Appel de decouverte 30 min", "Devis personnalise sous 24h", "Demo de la plateforme", "Onboarding de vos equipes"].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: "#22c55e", fontWeight: "bold" }}>{i + 1}.</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{step}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 30px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            Retour a l accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "70px 40px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "4px", marginBottom: "15px" }}>SOLUTIONS ENTREPRISES</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.5rem", marginBottom: "15px" }}>
          AcadémIA Pro pour vos Equipes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "600px", margin: "0 auto 25px", fontSize: "16px" }}>
          Formez vos collaborateurs avec l IA · Tableaux de bord RH · Certifications reconnues · Support dedie
        </p>
        <div style={{ display: "inline-flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>235 formations</span>
          <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>Dashboard RH</span>
          <span style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6", padding: "6px 16px", borderRadius: "20px", fontSize: "13px" }}>RGPD conforme</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", justifyContent: "center" }}>
        {[
          { id: "presentation", label: "Pourquoi nous" },
          { id: "offres", label: "Nos Offres" },
          { id: "contact", label: "Demander un Devis" },
          { id: "admin", label: "Admin Prospects" },
        ].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>

        {onglet === "presentation" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "30px" }}>
              Pourquoi choisir AcadémIA Pro pour vos equipes ?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "50px" }}>
              {AVANTAGES.map((av, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
                  <div style={{ fontSize: "35px", marginBottom: "12px" }}>{av.icon}</div>
                  <h3 style={{ color: "#c8a96e", margin: "0 0 8px", fontFamily: "Georgia,serif" }}>{av.titre}</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>{av.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setOnglet("offres")}
                style={{ padding: "14px 35px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                Voir nos offres entreprises
              </button>
            </div>
          </div>
        )}

        {onglet === "offres" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "30px" }}>
              Nos Offres B2B
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "40px" }}>
              {OFFRES.map((offre, i) => (
                <div key={i} style={{ background: offre.recommande ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.03)", border: `2px solid ${offre.recommande ? offre.color : "rgba(255,255,255,0.1)"}`, borderRadius: "16px", padding: "30px", position: "relative" }}>
                  {offre.recommande && (
                    <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#c8a96e", color: "#050508", padding: "4px 16px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                      RECOMMANDE
                    </div>
                  )}
                  <div style={{ fontSize: "35px", marginBottom: "12px" }}>{offre.icon}</div>
                  <h3 style={{ color: offre.color, fontFamily: "Georgia,serif", margin: "0 0 5px" }}>{offre.nom}</h3>
                  <div style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "10px 0 5px" }}>{offre.prix}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "20px" }}>{offre.desc}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "25px" }}>
                    {offre.features.map((f, j) => (
                      <div key={j} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: offre.color, fontSize: "14px" }}>✓</span>
                        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOnglet("contact")}
                    style={{ width: "100%", padding: "12px", background: offre.recommande ? offre.color : "rgba(255,255,255,0.1)", color: offre.recommande ? "#050508" : "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Demander un devis
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === "contact" && (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "25px" }}>
              Demander un Devis
            </h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px", padding: "35px" }}>
              {erreur && (
                <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "10px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center" }}>
                  {erreur}
                </div>
              )}
              <div style={{ display: "grid", gap: "18px" }}>
                {[
                  { label: "Nom de l entreprise", key: "nom_entreprise", placeholder: "Acme Corp" },
                  { label: "Votre nom", key: "contact_nom", placeholder: "Prenom Nom" },
                  { label: "Email professionnel", key: "contact_email", placeholder: "vous@entreprise.fr" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                  </div>
                ))}
                <div>
                  <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Secteur d activite</label>
                  <select value={form.secteur} onChange={e => setForm(p => ({ ...p, secteur: e.target.value }))}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
                    <option value="">Choisir...</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Nombre de collaborateurs</label>
                  <select value={form.nb_employes} onChange={e => setForm(p => ({ ...p, nb_employes: e.target.value }))}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", boxSizing: "border-box" as any }}>
                    <option value="">Choisir...</option>
                    {NB_EMPLOYES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Vos besoins en formation</label>
                  <textarea value={form.besoins} onChange={e => setForm(p => ({ ...p, besoins: e.target.value }))} rows={4}
                    placeholder="Quelles competences souhaitez-vous developper chez vos equipes ?"
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any, resize: "vertical" }} />
                </div>
              </div>
              <button onClick={envoyerDevis} disabled={loading}
                style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "20px" }}>
                {loading ? "Envoi en cours..." : "Envoyer ma demande de devis"}
              </button>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "15px" }}>
                Reponse garantie sous 24h · Appel decouverte offert
              </p>
            </div>
          </div>
        )}

        {onglet === "admin" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              Prospects B2B ({prospects.length})
            </h2>
            {prospects.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>Aucun prospect pour le moment</p>
            ) : (
              prospects.map(p => (
                <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <h3 style={{ color: "#c8a96e", margin: "0 0 3px", fontFamily: "Georgia,serif" }}>{p.nom_entreprise}</h3>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{p.contact_nom} · {p.contact_email}</div>
                    </div>
                    <span style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", height: "fit-content" }}>
                      {p.statut}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "15px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                    <span>{p.secteur}</span>
                    <span>·</span>
                    <span>{p.nb_employes} employes</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {p.besoins && (
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "10px", marginBottom: 0 }}>{p.besoins}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
