"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function formatReponse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/#{3} (.+)/g, "<h4 style=\"color:#c8a96e;margin:12px 0 6px;\">$1</h4>")
    .replace(/#{2} (.+)/g, "<h3 style=\"color:#c8a96e;margin:15px 0 8px;\">$1</h3>")
    .replace(/# (.+)/g, "<h2 style=\"color:#c8a96e;margin:18px 0 10px;\">$1</h2>")
    .replace(/^- (.+)/gm, "<li style=\"margin:4px 0;\">$1</li>")
    .replace(/---/g, "<hr style=\"border-color:rgba(200,169,110,0.2);margin:10px 0;\">")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

async function callAgent(message: string, systemPrompt: string, historique: any[] = []) {
  const res = await fetch("/api/admin/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      agent: { prompt: systemPrompt },
      historique
    }),
  });
  const data = await res.json();
  return data.reply || "";
}

async function sauvegarder(table: string, payload: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload),
  });
}

const SYSTEM_QUALIOPI = "Tu es Mr Qualiopi, expert en certification professionnelle et qualite de la formation avec 20 ans d experience. Tu conseilles Jacques Lalou fondateur d AcadémIA Pro, plateforme de formation 100% IA. Tu maitrises le referentiel Qualiopi, les 7 criteres, le depot RS et RNCP aupres de France Competences, les exigences des organismes certificateurs. Tu donnes des conseils precis et actionables conformes a la reglementation francaise de la formation professionnelle 2024-2026.";

const SYSTEM_CERTIFICATEUR = "Tu es Mr Certificateur, expert en creation et depot de certifications professionnelles aupres de France Competences avec 20 ans d experience. Tu maitrises le Repertoire Specifique RS, le RNCP, les referentiels de certification, les blocs de competences, les modalites d evaluation, les jurys. Tu aides Jacques Lalou a faire d AcadémIA Pro un organisme certificateur reconnu par l Etat. Tu donnes des conseils precis et des documents complets prets a soumettre.";

export default function MrQualiopi() {
  const [onglet, setOnglet] = useState("dashboard");
  const [documents, setDocuments] = useState<any[]>([]);
  const [indicateurs, setIndicateurs] = useState<any[]>([]);
  const [dossierCert, setDossierCert] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [docGenere, setDocGenere] = useState("");
  const [docTitre, setDocTitre] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [message, setMessage] = useState("");
  const [agentActif, setAgentActif] = useState("qualiopi");
  const [newIndicateur, setNewIndicateur] = useState({
    periode: "", taux_satisfaction: "", taux_completion: "",
    nb_stagiaires: "", nb_formations: "", observations: ""
  });

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [d, i, c] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/documents_qualiopi?select=*&order=created_at.desc`, { headers: h }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/indicateurs_qualite?select=*&order=created_at.desc`, { headers: h }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/dossier_certificateur?select=*&order=created_at.desc`, { headers: h }).then(r => r.json()),
    ]);
    setDocuments(Array.isArray(d) ? d : []);
    setIndicateurs(Array.isArray(i) ? i : []);
    setDossierCert(Array.isArray(c) ? c : []);
  }

  async function generer(titre: string, prompt: string, type: string, systeme: string) {
    setLoading(true);
    setDocGenere("");
    setDocTitre(titre);
    const contenu = await callAgent(prompt, systeme);
    setDocGenere(contenu);
    await sauvegarder("documents_qualiopi", { type, titre, contenu, categorie: type, statut: "genere" });
    chargerDonnees();
    setLoading(false);
  }

  async function envoyerMessage() {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    const systeme = agentActif === "qualiopi" ? SYSTEM_QUALIOPI : SYSTEM_CERTIFICATEUR;
    const reponse = await callAgent(userMsg, systeme, chat);
    setChat(prev => [...prev, { role: "agent", text: reponse }]);
    setLoading(false);
  }

  async function ajouterIndicateur() {
    await sauvegarder("indicateurs_qualite", {
      ...newIndicateur,
      taux_satisfaction: parseFloat(newIndicateur.taux_satisfaction) || 0,
      taux_completion: parseFloat(newIndicateur.taux_completion) || 0,
      nb_stagiaires: parseInt(newIndicateur.nb_stagiaires) || 0,
      nb_formations: parseInt(newIndicateur.nb_formations) || 0,
    });
    setNewIndicateur({ periode: "", taux_satisfaction: "", taux_completion: "", nb_stagiaires: "", nb_formations: "", observations: "" });
    chargerDonnees();
    alert("Indicateurs enregistres");
  }

  function imprimer() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${docTitre}</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;line-height:1.8;}
      h1,h2,h3,h4{color:#c8a96e;} hr{border-color:#c8a96e;} strong{color:#050508;}</style>
      </head><body>
      <h1>${docTitre}</h1>
      <p style="color:#666;">AcadémIA Pro - Jacques Lalou - ${new Date().toLocaleDateString("fr-FR")}</p>
      <hr/>
      ${formatReponse(docGenere)}
      </body></html>`);
      win.document.close();
      win.print();
    }
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "certificateur", label: "🏆 Mr Certificateur" },
    { id: "audit", label: "🔍 Audit Qualiopi" },
    { id: "documents", label: "📄 Documents Qualite" },
    { id: "indicateurs", label: "📈 Indicateurs" },
    { id: "bibliotheque", label: "📚 Bibliotheque" },
    { id: "conseil", label: "💬 Conseil IA" },
    { id: "auditeur", label: "🕵️ Preparation Auditeur" },
  ];

  const DOCS_QUALITE = [
    { titre: "Reglement Interieur Formation", type: "reglement", prompt: "Genere un reglement interieur complet et conforme au droit francais pour AcadémIA Pro, centre de formation 100% IA. Inclus : objet, acces aux formations, comportement apprenants, droits et obligations, sanctions, reclamations, acces handicap, lutte harcelement." },
    { titre: "Livret Accueil Stagiaire", type: "livret", prompt: "Genere un livret d accueil stagiaire complet pour AcadémIA Pro. Inclus : presentation plateforme, modalites acces, programme formations, evaluations, certification AcadémIA Pro, contacts, reclamations, droits stagiaires, accessibilite." },
    { titre: "Programme de Formation Type", type: "programme", prompt: "Genere un programme de formation type conforme Qualiopi pour AcadémIA Pro. Inclus : intitule, objectifs pedagogiques, competences visees, public cible, prerequis, duree, modalites, contenu detaille par module, evaluation, certification, tarif, accessibilite PMR." },
    { titre: "Fiche Emargement Numerique", type: "emargement", prompt: "Genere une fiche d emargement numerique conforme pour AcadémIA Pro. Inclus : formation, stagiaire, dates, modules, signature electronique, validation formateur, archivage." },
    { titre: "Questionnaire Satisfaction Stagiaire", type: "satisfaction", prompt: "Genere un questionnaire de satisfaction stagiaire complet conforme Qualiopi pour AcadémIA Pro. 20 questions sur : contenu formation, qualite pedagogique, adequation objectifs, materiel, agent tuteur IA, recommandation, points amelioration. Inclus echelle notation et commentaires." },
    { titre: "Bilan Pedagogique et Financier", type: "bilan", prompt: "Genere un modele de bilan pedagogique et financier annuel conforme Qualiopi pour AcadémIA Pro. Inclus : nombre stagiaires, formations dispensees, heures formation, taux satisfaction, taux completion, CA formation, charges, resultat, perspectives, plan amelioration." },
    { titre: "Procedure Reclamation", type: "reclamation", prompt: "Genere une procedure de reclamation et de traitement des insatisfactions conforme Qualiopi pour AcadémIA Pro. Inclus : canaux reclamation, delais traitement, responsable, suivi, reponse stagiaire, archivage, amelioration continue." },
    { titre: "Plan Amelioration Continue", type: "amelioration", prompt: "Genere un plan d amelioration continue conforme au critere 7 Qualiopi pour AcadémIA Pro. Inclus : analyse indicateurs, ecarts identifies, actions correctives, responsables, delais, suivi efficacite, revue annuelle." },
  ];

  const DOCS_CERTIFICATEUR = [
    { titre: "Fiche Descriptive RS - AcadémIA Pro", type: "rs_fiche", prompt: "Genere la fiche descriptive complete pour deposer une certification au Repertoire Specifique RS aupres de France Competences pour AcadémIA Pro. Certification : Expert IA et Automatisation Professionnelle. Inclus : intitule exact, code NSF, niveau, objectifs, competences certifiees, modalites evaluation, jury, conditions acces, debouches professionnels, equivalences." },
    { titre: "Referentiel de Certification", type: "rs_referentiel", prompt: "Genere le referentiel de certification complet pour la certification Expert IA et Automatisation Professionnelle d AcadémIA Pro a deposer au RS France Competences. Inclus : blocs de competences detailles, descripteurs de chaque bloc, modalites evaluation par bloc, criteres validation, conditions jury." },
    { titre: "Referentiel d Evaluation", type: "rs_evaluation", prompt: "Genere le referentiel d evaluation complet pour la certification Expert IA et Automatisation Professionnelle d AcadémIA Pro. Inclus : modalites evaluation par competence, grilles evaluation, criteres reussite, composition jury, conditions deroulement epreuves, taux reussite minimal." },
    { titre: "Dossier Candidature France Competences", type: "rs_dossier", prompt: "Genere le dossier de candidature complet pour soumettre la certification AcadémIA Pro Expert IA et Automatisation Professionnelle a France Competences. Inclus : presentation organisme, justification pertinence certification, preuves activite, partenaires professionnels, modalites acces VAE, accessibilite handicap, plan surveillance qualite." },
    { titre: "Guide Soumission France Competences", type: "rs_guide", prompt: "Explique etape par etape comment soumettre une demande d enregistrement au Repertoire Specifique RS aupres de France Competences pour AcadémIA Pro. Inclus : creation compte SI Carif-Oref, telechargement dossier, documents requis, delais instruction 6-12 mois, suivi dossier, reponse aux questions de France Competences." },
    { titre: "Partenariats Professionnels Requis", type: "rs_partenaires", prompt: "Explique a Jacques Lalou fondateur d AcadémIA Pro quels partenariats professionnels sont necessaires pour valider une certification RS aupres de France Competences. Inclus : types de partenaires requis, lettres d engagement, conventions, preuves implication milieu professionnel, secteur IA et formation." },
  ];

  if (docGenere) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", padding: "20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setDocGenere("")} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
              Retour
            </button>
            <button onClick={imprimer} style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Imprimer / PDF
            </button>
          </div>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "30px", color: "#1a1a1a" }}>
            <h2 style={{ color: "#c8a96e" }}>{docTitre}</h2>
            <p style={{ color: "#666", fontSize: "13px" }}>AcadémIA Pro - Jacques Lalou - {new Date().toLocaleDateString("fr-FR")}</p>
            <hr style={{ borderColor: "#c8a96e" }} />
            <div dangerouslySetInnerHTML={{ __html: formatReponse(docGenere) }} style={{ lineHeight: "1.8" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 40px" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0 }}>🎓 Mr Qualiopi</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0" }}>Expert Certification et Qualite Formation - AcadémIA Pro</p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "30px 20px", maxWidth: "1000px", margin: "0 auto" }}>

        {onglet === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
              {[
                { label: "Documents Qualite", valeur: documents.filter(d => d.categorie !== "rs_fiche" && d.categorie !== "rs_referentiel" && d.categorie !== "rs_evaluation" && d.categorie !== "rs_dossier" && d.categorie !== "rs_guide" && d.categorie !== "rs_partenaires" && d.categorie !== "rs_guide").length.toString(), icon: "📄", color: "#c8a96e" },
                { label: "Dossier Certificateur", valeur: documents.filter(d => d.type?.startsWith("rs_")).length.toString(), icon: "🏆", color: "#22c55e" },
                { label: "Periodes Indicateurs", valeur: indicateurs.length.toString(), icon: "📈", color: "#3b82f6" },
                { label: "Taux Satisfaction Moy.", valeur: indicateurs.length > 0 ? (indicateurs.reduce((s, i) => s + (i.taux_satisfaction || 0), 0) / indicateurs.length).toFixed(1) + "%" : "N/A", icon: "⭐", color: "#f59e0b" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: "22px", fontWeight: "bold" }}>{item.valeur}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Roadmap Certification</h3>
                {[
                  { etape: "1. Certification Maison", statut: "✅ Active", color: "#22c55e" },
                  { etape: "2. Depot RS France Competences", statut: "En preparation", color: "#f59e0b" },
                  { etape: "3. Validation RS", statut: "6-12 mois", color: "#666" },
                  { etape: "4. Certification Qualiopi", statut: "Apres RS", color: "#666" },
                  { etape: "5. Acces CPF et OPCO", statut: "Phase finale", color: "#666" },
                ].map(r => (
                  <div key={r.etape} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{r.etape}</span>
                    <span style={{ color: r.color, fontSize: "12px", fontWeight: "bold" }}>{r.statut}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ color: "#22c55e", marginTop: 0 }}>7 Criteres Qualiopi</h3>
                {[
                  "1. Information stagiaires",
                  "2. Identification objectifs",
                  "3. Adaptation formation",
                  "4. Adequation ressources",
                  "5. Qualification formateurs",
                  "6. Investissement veille",
                  "7. Recueil satisfaction",
                ].map((c, i) => (
                  <div key={i} style={{ padding: "5px 0", fontSize: "13px", color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {onglet === "certificateur" && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", borderRadius: "12px", padding: "25px", marginBottom: "25px", textAlign: "center" }}>
              <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", margin: "0 0 10px" }}>
                🏆 Mr Certificateur - Bras Droit de Mr Qualiopi
              </h2>
              <p style={{ color: "rgba(255,255,255,0.85)", margin: 0, fontSize: "14px" }}>
                Prepare le dossier RS complet pour que AcadémIA Pro devienne organisme certificateur reconnu par l Etat
              </p>
            </div>
            <div style={{ display: "grid", gap: "15px" }}>
              {DOCS_CERTIFICATEUR.map((doc, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div>
                    <h3 style={{ color: "#22c55e", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{doc.titre}</h3>
                  </div>
                  <button
                    onClick={() => generer(doc.titre, doc.prompt, doc.type, SYSTEM_CERTIFICATEUR)}
                    disabled={loading}
                    style={{ padding: "10px 18px", background: "#22c55e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", minWidth: "100px" }}
                  >
                    {loading && docTitre === doc.titre ? "Generation..." : "Generer"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === "audit" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              🔍 Audit Qualiopi Blanc
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "25px" }}>
              Mr Qualiopi simule un audit officiel et evalue la conformite d AcadémIA Pro
            </p>
            <div style={{ display: "grid", gap: "15px" }}>
              {[
                { titre: "Audit Complet 7 Criteres", prompt: "Simule un audit Qualiopi complet pour AcadémIA Pro, plateforme de formation 100% IA. Evalue les 7 criteres du referentiel national qualite. Pour chaque critere : description exigence, evaluation conformite AcadémIA Pro, score 0-10, preuves demandees, points forts, points ameliorer, recommandations. Score global et verdict." },
                { titre: "Critere 1 - Information Stagiaires", prompt: "Audite le critere 1 Qualiopi pour AcadémIA Pro : information du public sur les prestations de formation. Evalue : page catalogue, fiches formations, tarifs, prerequis, modalites, accessibilite PMR, delais reponse. Score et recommandations." },
                { titre: "Critere 3 - Adaptation Formation", prompt: "Audite le critere 3 Qualiopi pour AcadémIA Pro : adaptation de la formation aux stagiaires. Evalue : positionnement initial, adaptation parcours, suivi progression, agent tuteur IA 24h/24, evaluations intermediaires, accompagnement. Score et recommandations." },
                { titre: "Critere 7 - Recueil Satisfaction", prompt: "Audite le critere 7 Qualiopi pour AcadémIA Pro : recueil satisfaction et amelioration continue. Evalue : questionnaire satisfaction, indicateurs taux completion, taux satisfaction, analyse resultats, plan amelioration, suivi. Score et recommandations." },
                { titre: "Rapport d Audit Final", prompt: "Genere un rapport d audit final complet pour AcadémIA Pro en vue d une demande Qualiopi. Inclus : synthese conformite par critere, points forts, non-conformites majeures et mineures, plan d actions correctives avec delais, score global de conformite, verdict eligibilite Qualiopi." },
              ].map((doc, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <h3 style={{ color: "#c8a96e", margin: 0, fontFamily: "Georgia,serif", fontSize: "15px" }}>{doc.titre}</h3>
                  <button
                    onClick={() => generer(doc.titre, doc.prompt, "audit", SYSTEM_QUALIOPI)}
                    disabled={loading}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {loading && docTitre === doc.titre ? "Audit..." : "Auditer"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === "documents" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              📄 Documents Qualite Obligatoires
            </h2>
            <div style={{ display: "grid", gap: "15px" }}>
              {DOCS_QUALITE.map((doc, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <h3 style={{ color: "#c8a96e", margin: 0, fontFamily: "Georgia,serif", fontSize: "15px" }}>{doc.titre}</h3>
                  <button
                    onClick={() => generer(doc.titre, doc.prompt, doc.type, SYSTEM_QUALIOPI)}
                    disabled={loading}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {loading && docTitre === doc.titre ? "Generation..." : "Generer"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === "indicateurs" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              📈 Indicateurs Qualite
            </h2>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", marginBottom: "30px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>Saisir les Indicateurs</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {[
                  { label: "Periode", key: "periode", placeholder: "T1 2026" },
                  { label: "Taux Satisfaction (%)", key: "taux_satisfaction", placeholder: "95" },
                  { label: "Taux Completion (%)", key: "taux_completion", placeholder: "85" },
                  { label: "Nb Stagiaires", key: "nb_stagiaires", placeholder: "50" },
                  { label: "Nb Formations", key: "nb_formations", placeholder: "10" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(newIndicateur as any)[f.key]}
                      onChange={e => setNewIndicateur(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Observations</label>
                  <input type="text" placeholder="Observations de la periode" value={newIndicateur.observations}
                    onChange={e => setNewIndicateur(p => ({ ...p, observations: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any }} />
                </div>
              </div>
              <button onClick={ajouterIndicateur} style={{ width: "100%", padding: "12px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "15px" }}>
                Enregistrer les Indicateurs
              </button>
            </div>
            <h3 style={{ color: "#c8a96e" }}>Historique ({indicateurs.length} periodes)</h3>
            {indicateurs.map(ind => (
              <div key={ind.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", padding: "15px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{ind.periode}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{new Date(ind.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
                  {[
                    { label: "Satisfaction", valeur: `${ind.taux_satisfaction}%`, color: "#22c55e" },
                    { label: "Completion", valeur: `${ind.taux_completion}%`, color: "#3b82f6" },
                    { label: "Stagiaires", valeur: ind.nb_stagiaires, color: "#c8a96e" },
                    { label: "Formations", valeur: ind.nb_formations, color: "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div style={{ color: item.color, fontWeight: "bold", fontSize: "18px" }}>{item.valeur}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === "bibliotheque" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "20px" }}>
              📚 Bibliotheque ({documents.length} documents)
            </h2>
            {documents.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>
                Aucun document genere. Commencez par Mr Certificateur ou Documents Qualite.
              </p>
            ) : (
              documents.map(d => (
                <div key={d.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ color: d.type?.startsWith("rs_") ? "#22c55e" : "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "14px" }}>{d.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
                      {d.type?.startsWith("rs_") ? "🏆 Certificateur" : "📄 Qualite"} - {new Date(d.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    onClick={() => { setDocTitre(d.titre); setDocGenere(d.contenu); }}
                    style={{ padding: "8px 16px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Voir
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {onglet === "conseil" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
              💬 Conseil IA
            </h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button onClick={() => setAgentActif("qualiopi")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: agentActif === "qualiopi" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: agentActif === "qualiopi" ? "#050508" : "#fff", cursor: "pointer", fontWeight: "bold" }}>
                Mr Qualiopi
              </button>
              <button onClick={() => setAgentActif("certificateur")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: agentActif === "certificateur" ? "#22c55e" : "rgba(255,255,255,0.08)", color: agentActif === "certificateur" ? "#050508" : "#fff", cursor: "pointer", fontWeight: "bold" }}>
                Mr Certificateur
              </button>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "500px", overflowY: "auto", marginBottom: "15px" }}>
              {chat.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                  Posez votre question a {agentActif === "qualiopi" ? "Mr Qualiopi" : "Mr Certificateur"}
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 16px", borderRadius: "12px", maxWidth: "80%", lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={msg.role === "agent" ? { __html: formatReponse(msg.text) } : undefined}
                  >
                    {msg.role === "user" ? msg.text : undefined}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#c8a96e", textAlign: "center" }}>
                {agentActif === "qualiopi" ? "Mr Qualiopi" : "Mr Certificateur"} analyse...
              </div>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Posez votre question..." value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && envoyerMessage()}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
              <button onClick={envoyerMessage} disabled={loading} style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Envoyer
              </button>
            </div>
          </div>
        )}


        {onglet === "auditeur" && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#1a1a2e,#050508)", border: "2px solid #c8a96e", borderRadius: "12px", padding: "25px", marginBottom: "25px", textAlign: "center" }}>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 10px" }}>
                🕵️ Simulation Audit Qualiopi
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: "14px" }}>
                Mr Qualiopi joue le role de l auditeur officiel et evalue votre preparation
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
              {[
                { label: "Score Conformite", valeur: documents.length > 0 ? "En cours..." : "0%", icon: "🎯", color: "#c8a96e" },
                { label: "Documents Prepares", valeur: documents.length.toString(), icon: "📄", color: "#22c55e" },
                { label: "Indicateurs Saisis", valeur: indicateurs.length.toString(), icon: "📈", color: "#3b82f6" },
                { label: "Statut Audit", valeur: documents.length >= 5 ? "Pret" : "En preparation", icon: "⚡", color: documents.length >= 5 ? "#22c55e" : "#f59e0b" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: "22px", fontWeight: "bold" }}>{item.valeur}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "5px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: "15px", marginBottom: "30px" }}>
              {[
                {
                  titre: "Simulation Audit Complet — 7 Criteres",
                  description: "Mr Qualiopi pose les vraies questions d un auditeur officiel",
                  prompt: `Tu es un auditeur Qualiopi certifie mandaté par un organisme de certification officiel. Tu realises un audit de AcadémIA Pro, plateforme de formation 100% IA fondee par Jacques Lalou. 

Conduire un audit complet sur les 7 criteres du Referentiel National Qualite. Pour chaque critere :
1. Pose 3 questions precises comme un vrai auditeur
2. Indique les preuves que tu demandes
3. Evalue la conformite probable d AcadémIA Pro
4. Donne un score de 0 a 10
5. Identifie les points de vigilance

Termine par un score global et un verdict : CONFORME / NON CONFORME / CONFORME AVEC RESERVES`,
                },
                {
                  titre: "Questions Critere 1 — Information Stagiaires",
                  description: "Simulation questions auditeur sur l information du public",
                  prompt: "Tu es un auditeur Qualiopi officiel. Pose 10 questions precises sur le critere 1 du referentiel Qualiopi pour AcadémIA Pro : information des publics sur les prestations. Inclus les preuves demandees et le niveau d exigence. Evalue la conformite probable et donne des recommandations.",
                },
                {
                  titre: "Questions Critere 2 — Identification Objectifs",
                  description: "Simulation questions sur l identification des objectifs",
                  prompt: "Tu es un auditeur Qualiopi officiel. Pose 10 questions precises sur le critere 2 pour AcadémIA Pro : identification et analyse des besoins des beneficiaires. Inclus preuves demandees et evaluation conformite.",
                },
                {
                  titre: "Questions Critere 3 — Adaptation Formation",
                  description: "Simulation questions sur l adaptation de la formation",
                  prompt: "Tu es un auditeur Qualiopi officiel. Pose 10 questions precises sur le critere 3 pour AcadémIA Pro : adaptation aux publics beneficiaires. Evalue l agent tuteur IA 24h/24, le suivi progression, les evaluations intermediaires. Inclus preuves et conformite.",
                },
                {
                  titre: "Questions Critere 6 — Veille et Innovation",
                  description: "Simulation questions sur la veille pedagogique et sectorielle",
                  prompt: "Tu es un auditeur Qualiopi officiel. Pose 10 questions precises sur le critere 6 pour AcadémIA Pro : investissement dans les evolutions pedagogiques et technologiques. Comment AcadémIA Pro fait sa veille IA, formation, reglementation ? Inclus preuves et conformite.",
                },
                {
                  titre: "Questions Critere 7 — Recueil Satisfaction",
                  description: "Simulation questions sur le recueil de satisfaction",
                  prompt: "Tu es un auditeur Qualiopi officiel. Pose 10 questions precises sur le critere 7 pour AcadémIA Pro : recueil des appréciations et des réclamations, mesure de la satisfaction. Inclus : questionnaire satisfaction, indicateurs taux completion, analyse resultats, plan amelioration. Preuves et conformite.",
                },
                {
                  titre: "Checklist Preuves par Critere",
                  description: "Liste complete des preuves a avoir pour l auditeur",
                  prompt: "Genere la checklist complete des preuves documentaires qu un auditeur Qualiopi demandera a AcadémIA Pro. Pour chacun des 7 criteres : liste precise des documents requis, format acceptable, frequence mise a jour, niveau de detail attendu. Indique le statut probable d AcadémIA Pro pour chaque preuve.",
                },
                {
                  titre: "Rapport Preparation Audit Final",
                  description: "Bilan complet de votre preparation avant le vrai audit",
                  prompt: `Genere un rapport complet de preparation a l audit Qualiopi pour AcadémIA Pro de Jacques Lalou.

Inclus :
- Synthese preparation par critere avec score
- Documents prepares vs documents manquants
- Points forts d AcadémIA Pro face a Qualiopi
- Risques de non-conformite a corriger en priorite
- Plan d actions 30-60-90 jours avant audit
- Estimation probabilite d obtention Qualiopi
- Recommandations finales de Mr Qualiopi

Indicateurs disponibles : ${indicateurs.length} periodes enregistrees
Documents prepares : ${documents.length} documents generes`,
                },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                  <div>
                    <h3 style={{ color: "#c8a96e", margin: "0 0 5px", fontFamily: "Georgia,serif", fontSize: "15px" }}>{item.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>{item.description}</p>
                  </div>
                  <button
                    onClick={() => generer(item.titre, item.prompt, "audit_simulation", SYSTEM_QUALIOPI)}
                    disabled={loading}
                    style={{ padding: "10px 18px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", minWidth: "110px" }}
                  >
                    {loading && docTitre === item.titre ? "Simulation..." : "Simuler"}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ color: "#c8a96e", marginTop: 0 }}>📋 Indicateurs Qualiopi Obligatoires</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Taux de satisfaction global", cible: "> 80%", valeur: indicateurs.length > 0 ? indicateurs[0].taux_satisfaction + "%" : "Non renseigne" },
                  { label: "Taux de completion formations", cible: "> 70%", valeur: indicateurs.length > 0 ? indicateurs[0].taux_completion + "%" : "Non renseigne" },
                  { label: "Taux d insertion pro (si applicable)", cible: "> 50%", valeur: "Non applicable" },
                  { label: "Taux de rupture contrat", cible: "< 20%", valeur: "Non renseigne" },
                  { label: "Nb reclamations traitees", cible: "100%", valeur: "Non renseigne" },
                  { label: "Nb evaluations realisees", cible: "100%", valeur: indicateurs.length > 0 ? indicateurs.length + " periodes" : "Non renseigne" },
                ].map(ind => (
                  <div key={ind.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "3px" }}>{ind.label}</div>
                    <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "15px" }}>{ind.valeur}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Cible : {ind.cible}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setOnglet("indicateurs")}
                style={{ width: "100%", padding: "10px", background: "rgba(200,169,110,0.2)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", cursor: "pointer", marginTop: "15px", fontWeight: "bold" }}
              >
                Mettre a jour les indicateurs
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
