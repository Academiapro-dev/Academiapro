"use client";
import React from "react";

const INDICATEURS = [
  { titre: "CA Total", sous: "Chiffre d'affaires cumulé", valeur: "0 euro" },
  { titre: "Apprenants", sous: "Total apprenants inscrits", valeur: "0" },
  { titre: "Formations vendues", sous: "Ce mois", valeur: "0" },
  { titre: "Séances réservées", sous: "Ce mois", valeur: "0" },
  { titre: "Certificats délivrés", sous: "Total", valeur: "0" },
  { titre: "Leads pipeline", sous: "CRM · prospects actifs", valeur: "0" },
];

const GROUPES = [
  {
    titre: "Catalogue et formation",
    liens: [
      { nom: "Modules et formations", href: "/admin/module" },
      { nom: "Sessions", href: "/admin/sessions" },
      { nom: "Certificats", href: "/admin/certificats" },
      { nom: "Téléchargements", href: "/admin/telechargements" },
      { nom: "Gamification", href: "/admin/gamification" },
      { nom: "Remotivation", href: "/admin/remotivation" },
      { nom: "Cam", href: "/admin/cam" },
    ],
  },
  {
    titre: "Commercial",
    liens: [
      { nom: "CRM et prospects", href: "/admin/crm" },
      { nom: "Organismes clients", href: "/admin/organismes" },
      { nom: "Contrats", href: "/admin/contrats" },
      { nom: "Bons de commande", href: "/admin/bon-commande" },
      { nom: "Modèles de documents", href: "/admin/modeles" },
      { nom: "Coffre", href: "/admin/coffre" },
      { nom: "Agent commercial", href: "/admin/agent-commercial" },
      { nom: "Agents", href: "/admin/agents" },
    ],
  },
  {
    titre: "Facturation",
    liens: [
      { nom: "Facturation", href: "/admin/facturation" },
      { nom: "Holding", href: "/admin/holding" },
    ],
  },
  {
    titre: "Comptabilité",
    liens: [
      { nom: "Dépenses et justificatifs", href: "/admin/comptabilite" },
      { nom: "Comptabilité", href: "/admin/comptabilite" },
      { nom: "Mr. Comptable", href: "/admin/mr-comptable" },
    ],
  },
  {
    titre: "Conformité et juridique",
    liens: [
      { nom: "Compliance", href: "/admin/compliance" },
      { nom: "Mr. Juridique", href: "/admin/mr-juridique" },
    ],
  },
  {
    titre: "Qualiopi",
    liens: [
      { nom: "Qualiopi", href: "/admin/qualiopi" },
      { nom: "Mr. Qualiopi", href: "/admin/mr-qualiopi" },
    ],
  },
  {
    titre: "Communication",
    liens: [
      { nom: "Marketing", href: "/admin/marketing" },
      { nom: "Emailing", href: "/admin/emailing" },
      { nom: "Emails", href: "/admin/emails" },
      { nom: "Réseaux sociaux", href: "/admin/reseaux-sociaux" },
      { nom: "Blog", href: "/admin/blog" },
    ],
  },
  {
    titre: "Technique",
    liens: [
      { nom: "Analyses", href: "/admin/analytics" },
      { nom: "Diagnostic", href: "/admin/diagnostic" },
      { nom: "Usage de l'IA", href: "/admin/usage-ia" },
      { nom: "Domaines", href: "/admin/domaines" },
    ],
  },
];

export default function AdminPage() {
  const carte = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid rgba(200,169,110,0.3)",
  };

  const bouton = {
    display: "block",
    background: "#12121f",
    border: "1px solid rgba(200,169,110,0.35)",
    borderRadius: "10px",
    padding: "16px 18px",
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ADMIN ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Admin AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>Vue globale · CA · Apprenants · Formations · Séances</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {INDICATEURS.map((i) => (
            <div key={i.titre} style={carte}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>{i.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>{i.sous}</p>
              <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>{i.valeur}</p>
            </div>
          ))}
        </div>

        {GROUPES.map((g) => (
          <div key={g.titre} style={{ marginTop: "48px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 6px" }}>{g.titre}</h2>
            <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "20px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {g.liens.map((l) => (
                <a key={l.nom} href={l.href} style={bouton}>{l.nom}</a>
              ))}
            </div>
          </div>
        ))}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "48px", textAlign: "center" }}>
          Les six indicateurs ci-dessus sont encore fixes : ils ne sont pas calculés depuis les données.
        </p>

      </div>
    </div>
  );
}
