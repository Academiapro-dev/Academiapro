"use client";
import { useState, useMemo } from "react";

const FORMATIONS_STATIQUES = [
  { code: "F001", titre: "Management et Leadership", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F002", titre: "Communication Professionnelle", domaine: "Business", niveau: "Debutant", prix: 390, duree: "25h" },
  { code: "F003", titre: "Gestion du Stress et Bien-etre", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F004", titre: "Anglais Professionnel A1-C2", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "80h" },
  { code: "F005", titre: "Comptabilite et Gestion", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "35h" },
  { code: "F006", titre: "Ressources Humaines", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F007", titre: "Excel et Google Sheets Avance", domaine: "Outils", niveau: "Debutant", prix: 290, duree: "20h" },
  { code: "F008", titre: "Marketing des Reseaux Sociaux", domaine: "Marketing", niveau: "Debutant", prix: 390, duree: "25h" },
  { code: "F009", titre: "Droit du Travail", domaine: "Droit", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F010", titre: "Marketing Digital", domaine: "Marketing", niveau: "Intermediaire", prix: 590, duree: "35h" },
  { code: "F011", titre: "SEO et Referencement Naturel", domaine: "Marketing", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F012", titre: "Gestion de Projet Agile", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F013", titre: "Python pour Debutants", domaine: "Tech", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F014", titre: "JavaScript Fondamentaux", domaine: "Tech", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F015", titre: "WordPress et Creation de Site", domaine: "Tech", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F016", titre: "Photoshop et Design Graphique", domaine: "Design", niveau: "Debutant", prix: 390, duree: "25h" },
  { code: "F017", titre: "Video Marketing et YouTube", domaine: "Marketing", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F018", titre: "Vente et Negociation", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F019", titre: "Finance Personnelle et Investissement", domaine: "Finance", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F020", titre: "Entrepreneuriat et Creation d Entreprise", domaine: "Business", niveau: "Debutant", prix: 590, duree: "35h" },
  { code: "F021", titre: "Espagnol Professionnel A1-B2", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "70h" },
  { code: "F022", titre: "Allemand Professionnel A1-B1", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "70h" },
  { code: "F023", titre: "Mandarin Debutant A1-A2", domaine: "Langues", niveau: "Debutant", prix: 590, duree: "60h" },
  { code: "F024", titre: "Italien Professionnel A1-B1", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "65h" },
  { code: "F025", titre: "Coaching et Developpement Personnel", domaine: "Bien-etre", niveau: "Debutant", prix: 490, duree: "25h" },
  { code: "F026", titre: "Meditation et Pleine Conscience", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F027", titre: "Nutrition et Bien-etre", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F028", titre: "Hypnose Ericksonienne Praticien", domaine: "Bien-etre", niveau: "Avance", prix: 890, duree: "50h" },
  { code: "F029", titre: "PNL Praticien et Maitre", domaine: "Bien-etre", niveau: "Avance", prix: 890, duree: "50h" },
  { code: "F030", titre: "Sophrologie Caycedienne", domaine: "Bien-etre", niveau: "Avance", prix: 890, duree: "50h" },
  { code: "F031", titre: "Data Analyse et Business Intelligence", domaine: "Tech", niveau: "Intermediaire", prix: 690, duree: "40h" },
  { code: "F032", titre: "Cybersecurite Fondamentaux", domaine: "Tech", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F033", titre: "Cloud Computing AWS", domaine: "Tech", niveau: "Intermediaire", prix: 690, duree: "40h" },
  { code: "F034", titre: "UX UI Design", domaine: "Design", niveau: "Intermediaire", prix: 590, duree: "35h" },
  { code: "F035", titre: "Illustrator et Design Vectoriel", domaine: "Design", niveau: "Intermediaire", prix: 390, duree: "25h" },
  { code: "F036", titre: "Premiere Pro et Montage Video", domaine: "Design", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F037", titre: "Podcast Creation et Production", domaine: "Marketing", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F038", titre: "Email Marketing et Automation", domaine: "Marketing", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F039", titre: "Google Ads et SEA", domaine: "Marketing", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F040", titre: "Meta Ads Facebook Instagram", domaine: "Marketing", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F041", titre: "Droit des Contrats", domaine: "Droit", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F042", titre: "Fiscalite des Entreprises", domaine: "Finance", niveau: "Avance", prix: 590, duree: "30h" },
  { code: "F043", titre: "Copywriting et Persuasion", domaine: "Marketing", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F044", titre: "Strategie d Entreprise", domaine: "Business", niveau: "Avance", prix: 690, duree: "35h" },
  { code: "F045", titre: "Intelligence Emotionnelle", domaine: "Bien-etre", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F046", titre: "Prise de Parole en Public", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F047", titre: "Productivite et Organisation", domaine: "Business", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F048", titre: "React et Next.js Fondamentaux", domaine: "Tech", niveau: "Intermediaire", prix: 690, duree: "45h" },
  { code: "F049", titre: "Node.js et API REST", domaine: "Tech", niveau: "Intermediaire", prix: 690, duree: "40h" },
  { code: "F050", titre: "Bases de Donnees SQL", domaine: "Tech", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F051", titre: "Bubble No-Code Avance", domaine: "Tech", niveau: "Avance", prix: 690, duree: "40h" },
  { code: "F052", titre: "Webflow et Sites Premium", domaine: "Tech", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F053", titre: "Make Integromat Automatisation", domaine: "Tech", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F054", titre: "Zapier et Automatisation Pro", domaine: "Tech", niveau: "Debutant", prix: 490, duree: "25h" },
  { code: "F055", titre: "Notion et Gestion de Projet", domaine: "Outils", niveau: "Debutant", prix: 290, duree: "15h" },
  { code: "F056", titre: "Figma et Prototypage", domaine: "Design", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F057", titre: "After Effects et Motion Design", domaine: "Design", niveau: "Avance", prix: 590, duree: "35h" },
  { code: "F058", titre: "Leadership Transformationnel", domaine: "Business", niveau: "Avance", prix: 690, duree: "35h" },
  { code: "F059", titre: "Gestion des Conflits", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F060", titre: "Recrutement et Talent Acquisition", domaine: "Business", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F061", titre: "E-commerce et Dropshipping", domaine: "Business", niveau: "Debutant", prix: 590, duree: "35h" },
  { code: "F062", titre: "Amazon FBA et Marketplace", domaine: "Business", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F063", titre: "Franchise et Developpement Commercial", domaine: "Business", niveau: "Avance", prix: 690, duree: "35h" },
  { code: "F064", titre: "Immobilier et Investissement", domaine: "Finance", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F065", titre: "Bourse et Trading", domaine: "Finance", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F066", titre: "Crypto et Blockchain", domaine: "Finance", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F067", titre: "Gestion de Patrimoine", domaine: "Finance", niveau: "Avance", prix: 690, duree: "35h" },
  { code: "F068", titre: "Assurance et Protection", domaine: "Finance", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F069", titre: "Arabe Professionnel A1-B1", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "65h" },
  { code: "F070", titre: "Portugais Professionnel A1-B1", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "65h" },
  { code: "F071", titre: "TOEIC Preparation", domaine: "Langues", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F072", titre: "TOEFL Preparation", domaine: "Langues", niveau: "Avance", prix: 590, duree: "35h" },
  { code: "F073", titre: "Burn-out Prevention et Recovery", domaine: "Bien-etre", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F074", titre: "Anxiete et Therapie Cognitive", domaine: "Bien-etre", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F075", titre: "Sommeil et Recuperation", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F076", titre: "Confiance en Soi et Estime", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F077", titre: "Relations et Communication Intime", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F078", titre: "Deuil et Transitions de Vie", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F079", titre: "Parentalite et Education", domaine: "Bien-etre", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F080", titre: "Equilibre Vie Pro Perso", domaine: "Bien-etre", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F081", titre: "Mindfulness et Performance", domaine: "Bien-etre", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F082", titre: "Addictions et Liberation", domaine: "Bien-etre", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F083", titre: "Phobies et Desensibilisation", domaine: "Bien-etre", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F084", titre: "Performance Mentale et Sport", domaine: "Bien-etre", niveau: "Intermediaire", prix: 490, duree: "25h" },
  { code: "F085", titre: "Tableau de Bord Power BI", domaine: "Tech", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F086", titre: "Machine Learning Python", domaine: "Tech", niveau: "Avance", prix: 790, duree: "50h" },
  { code: "F087", titre: "Docker et Containerisation", domaine: "Tech", niveau: "Avance", prix: 690, duree: "35h" },
  { code: "F088", titre: "Git et Gestion de Code", domaine: "Tech", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F089", titre: "DevOps et CI CD", domaine: "Tech", niveau: "Avance", prix: 790, duree: "45h" },
  { code: "F090", titre: "Shopify et E-commerce", domaine: "Tech", niveau: "Debutant", prix: 490, duree: "25h" },
  { code: "F091", titre: "Italien A1 Debutant", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F092", titre: "Italien A2 Elementaire", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F093", titre: "Italien B1 Intermediaire", domaine: "Langues", niveau: "Intermediaire", prix: 590, duree: "50h" },
  { code: "F094", titre: "Allemand A1 Debutant", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F095", titre: "Allemand A2 Elementaire", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "40h" },
  { code: "F096", titre: "Allemand B1 Intermediaire", domaine: "Langues", niveau: "Intermediaire", prix: 590, duree: "50h" },
  { code: "F097", titre: "Mandarin A1 Debutant", domaine: "Langues", niveau: "Debutant", prix: 590, duree: "60h" },
  { code: "F098", titre: "Mandarin A2 Elementaire", domaine: "Langues", niveau: "Debutant", prix: 590, duree: "60h" },
  { code: "F099", titre: "Mandarin B1 Intermediaire", domaine: "Langues", niveau: "Intermediaire", prix: 690, duree: "70h" },
  { code: "F100", titre: "Anglais des Affaires B2", domaine: "Langues", niveau: "Intermediaire", prix: 590, duree: "50h" },
  { code: "F101", titre: "Anglais Technique C1", domaine: "Langues", niveau: "Avance", prix: 690, duree: "60h" },
  { code: "F102", titre: "Presentation et Pitch en Anglais", domaine: "Langues", niveau: "Intermediaire", prix: 490, duree: "30h" },
  { code: "F103", titre: "Negociation en Anglais", domaine: "Langues", niveau: "Avance", prix: 590, duree: "35h" },
  { code: "F104", titre: "Espagnol des Affaires B2", domaine: "Langues", niveau: "Intermediaire", prix: 590, duree: "50h" },
  { code: "F105", titre: "Francais Langue Etrangere A1-B2", domaine: "Langues", niveau: "Tous niveaux", prix: 590, duree: "70h" },
  { code: "F106", titre: "Russe Debutant A1-A2", domaine: "Langues", niveau: "Debutant", prix: 590, duree: "60h" },
  { code: "F107", titre: "Japonais Debutant A1-A2", domaine: "Langues", niveau: "Debutant", prix: 590, duree: "60h" },
  { code: "F108", titre: "Neerlandais Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F109", titre: "Turc Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F110", titre: "Polonais Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F111", titre: "Roumain Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F112", titre: "Grec Moderne Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F113", titre: "Hebreux Moderne Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F114", titre: "Swahili Professionnel", domaine: "Langues", niveau: "Debutant", prix: 490, duree: "50h" },
  { code: "F115", titre: "Chat GPT et IA Generative Debutant", domaine: "IA", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F116", titre: "Midjourney et IA Visuelle", domaine: "IA", niveau: "Debutant", prix: 390, duree: "20h" },
  { code: "F117", titre: "Automatisation IA avec n8n", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F118", titre: "Agent IA avec LangChain", domaine: "IA", niveau: "Avance", prix: 790, duree: "45h" },
  { code: "F119", titre: "Fine-tuning et LLM", domaine: "IA", niveau: "Avance", prix: 890, duree: "50h" },
  { code: "F120", titre: "IA pour le Marketing", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F121", titre: "IA pour les RH", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F122", titre: "IA pour la Comptabilite", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F123", titre: "IA pour le Juridique", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F124", titre: "IA pour la Sante", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F125", titre: "IA pour l Education", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F126", titre: "IA pour la Logistique", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F127", titre: "IA pour l Immobilier", domaine: "IA", niveau: "Intermediaire", prix: 590, duree: "30h" },
  { code: "F128", titre: "Expert Claude et IA Generative", domaine: "IA", niveau: "Expert", prix: 690, duree: "40h" },
  { code: "F129", titre: "No-Code et Automatisation IA", domaine: "IA", niveau: "Intermediaire", prix: 790, duree: "45h" },
  { code: "F130", titre: "Apps Natives avec IA", domaine: "IA", niveau: "Avance", prix: 990, duree: "60h" },
  { code: "F131", titre: "Marketing Digital x IA", domaine: "IA", niveau: "Intermediaire", prix: 890, duree: "50h" },
];

const DOMAINES = ["Tous", "IA", "Business", "Marketing", "Langues", "Bien-etre", "Tech", "Design", "Finance", "Droit", "Outils"];
const NIVEAUX = ["Tous", "Debutant", "Intermediaire", "Avance", "Expert", "Tous niveaux"];
const PAR_PAGE = 20;

const COULEURS_DOMAINE: Record<string, string> = {
  "IA": "#c8a96e",
  "Business": "#4a9eff",
  "Marketing": "#f97316",
  "Langues": "#22c55e",
  "Bien-etre": "#a855f7",
  "Tech": "#06b6d4",
  "Design": "#ec4899",
  "Finance": "#eab308",
  "Droit": "#64748b",
  "Outils": "#94a3b8",
};

export default function CataloguePage() {
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [niveau, setNiveau] = useState("Tous");
  const [page, setPage] = useState(1);

  const formationsFiltrees = useMemo(() => {
    return FORMATIONS_STATIQUES.filter((f) => {
      const matchRecherche = f.titre.toLowerCase().includes(recherche.toLowerCase()) || f.code.toLowerCase().includes(recherche.toLowerCase());
      const matchDomaine = domaine === "Tous" || f.domaine === domaine;
      const matchNiveau = niveau === "Tous" || f.niveau === niveau;
      return matchRecherche && matchDomaine && matchNiveau;
    });
  }, [recherche, domaine, niveau]);

  const totalPages = Math.ceil(formationsFiltrees.length / PAR_PAGE);
  const formationsPage = formationsFiltrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const reset = () => { setRecherche(""); setDomaine("Tous"); setNiveau("Tous"); setPage(1); };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* HEADER */}
      <div style={{ background: "#0d0d14", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Nos {formationsFiltrees.length} Formations Certifiantes</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0" }}>Certification AcadémIA Pro · Paiement 3x sans frais · Garantie 30 jours</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>

        {/* FILTRES */}
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "1px solid rgba(200,169,110,0.2)" }}>

          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />

          {/* Filtres domaine */}
          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>DOMAINE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {DOMAINES.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDomaine(d); setPage(1); }}
                  style={{ background: domaine === d ? "#c8a96e" : "#050508", color: domaine === d ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", cursor: "pointer", fontWeight: domaine === d ? "bold" : "normal" }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres niveau */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>NIVEAU</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {NIVEAUX.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNiveau(n); setPage(1); }}
                    style={{ background: niveau === n ? "#c8a96e" : "#050508", color: niveau === n ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px", padding: "5px 14px", fontSize: "12px", cursor: "pointer", fontWeight: niveau === n ? "bold" : "normal" }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {(recherche || domaine !== "Tous" || niveau !== "Tous") && (
              <button onClick={reset} style={{ background: "transparent", color: "#c8a96e", border: "1px solid #c8a96e", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer" }}>
                Reinitialiser
              </button>
            )}
          </div>
        </div>

        {/* LISTE FORMATIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {formationsPage.map((f) => (
            <a
              key={f.code}
              href={"/formation/" + f.code.toLowerCase()}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a2e", borderRadius: "10px", padding: "16px 20px", border: "1px solid rgba(200,169,110,0.15)", textDecoration: "none", color: "#fff", transition: "border-color 0.2s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", minWidth: "48px" }}>{f.code}</span>
                <span style={{ color: "#fff", fontSize: "15px", flex: 1 }}>{f.titre}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ background: COULEURS_DOMAINE[f.domaine] + "22", color: COULEURS_DOMAINE[f.domaine] || "#c8a96e", padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>{f.domaine}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", minWidth: "80px", textAlign: "right" }}>{f.duree}</span>
                <span style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "bold", minWidth: "70px", textAlign: "right" }}>{f.prix}€</span>
                <span style={{ color: "#c8a96e", fontSize: "18px" }}>›</span>
              </div>
            </a>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: page === 1 ? "#1a1a2e" : "#c8a96e", color: page === 1 ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === 1 ? "default" : "pointer", fontWeight: "bold" }}
            >
              Precedent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ background: page === p ? "#c8a96e" : "#1a1a2e", color: page === p ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: page === p ? "bold" : "normal" }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: page === totalPages ? "#1a1a2e" : "#c8a96e", color: page === totalPages ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === totalPages ? "default" : "pointer", fontWeight: "bold" }}
            >
              Suivant
            </button>
          </div>
        )}

        {formationsFiltrees.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Aucune formation trouvee pour ces criteres.</p>
            <button onClick={reset} style={{ marginTop: "16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>Voir toutes les formations</button>
          </div>
        )}

      </div>
    </div>
  );
}
