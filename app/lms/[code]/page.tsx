"use client";
import { useState, useEffect } from "react";
import Guide from "../../../components/Guide";

const CARACTERES_PAR_PAGE = 2500;
const MOTS_MIN_SYNTHESE = 80;

const AGENTS_DOMAINE = {
  "IA": { formateur: "Alex Bernard", coach: "Isabelle Moreau" },
  "Business": { formateur: "Thomas Martin", coach: "Isabelle Moreau" },
  "Marketing": { formateur: "Nina Castillo", coach: "Isabelle Moreau" },
  "Langues": { formateur: "Sofia Durand", coach: "Isabelle Moreau" },
  "Bien-etre": { formateur: "Claire Beaumont", coach: "Maya" },
  "Tech": { formateur: "Karim Benzara", coach: "Isabelle Moreau" },
  "Design": { formateur: "Lucas Petit", coach: "Isabelle Moreau" },
  "Finance": { formateur: "Emma Lefebvre", coach: "Isabelle Moreau" },
  "Droit": { formateur: "Antoine Moreau", coach: "Isabelle Moreau" },
  "Outils": { formateur: "Thomas Martin", coach: "Isabelle Moreau" },
  "Psychologie": { formateur: "Claire Beaumont", coach: "Maya" },
  "Securite": { formateur: "Karim Benzara", coach: "Isabelle Moreau" },
  "Ressources humaines": { formateur: "Emma Lefebvre", coach: "Isabelle Moreau" },
  "Savoirs de base": { formateur: "Sofia Durand", coach: "Maya" },
};

function propre(t) {
  return String(t || "").replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function sections(contenu) {
  return String(contenu || "").split(/\n(?=#{1,6}\s)/);
}

// LE COURS SANS LE QCM : le stagiaire ne doit pas pouvoir lire le corrige
// avant de repondre. C est l agent qui donnera les reponses, apres la note.
function coursSansQCM(contenu) {
  return sections(contenu)
    .filter(function (s) {
      const premiere = propre(s.split("\n")[0]).replace(/^#{1,6}\s*/, "");
      return !/^QCM\b/i.test(premiere);
    })
    .join("\n");
}

function zoneQCM(contenu) {
  const trouvee = sections(contenu).find(function (s) {
    const premiere = propre(s.split("\n")[0]).replace(/^#{1,6}\s*/, "");
    return /^QCM\b/i.test(premiere);
  });
  return trouvee || "";
}

// On n analyse QUE les questions et leurs options. Les bonnes reponses
// restent cote serveur, entre les mains de l agent correcteur.
function analyserQuestions(zone) {
  const questions = [];
  let courante = null;
  let dansCorrige = false;

  for (const brute of String(zone || "").split("\n")) {
    const l = propre(brute).replace(/^#{1,6}\s*/, "");
    if (!l || l === "---") continue;

    if (/^corrig[eé]\b/i.test(l) || /^r[eé]ponses?\s+(correctes?|attendues?)\b/i.test(l)) {
      dansCorrige = true;
    }
    if (dansCorrige) continue;

    const titre = l.match(/^(?:Question|Q)\s*(\d{1,2})\s*[.):\-–]?\s*(.*)$/i);
    const option = l.match(/^([A-D])\s*[).\-–:]\s*(.+)$/);

    if (option && courante) {
      courante.options.push({ lettre: option[1], texte: option[2] });
      continue;
    }

    if (titre) {
      if (courante && courante.options.length >= 2) questions.push(courante);
      courante = { numero: parseInt(titre[1], 10), enonce: titre[2] || "", options: [] };
      continue;
    }

    if (courante && courante.options.length === 0) {
      courante.enonce = courante.enonce ? courante.enonce + " " + l : l;
    }
  }

  if (courante && courante.options.length >= 2) questions.push(courante);
  return questions;
}

// 🖥️🖥️ LE DECOUPAGE EN BLOCS — corrige le 18/08, puis A NOUVEAU le meme
// jour apres essai reel sur la formation Excel.
//
// LE DEFAUT D'ORIGINE. La page decoupait le contenu LIGNE PAR LIGNE. Un
// schema d'interface faisant vingt a trente lignes de HTML, le stagiaire
// voyait trente lignes de code brut. Ses mots : « il faut etre
// informaticien pour lire cette page ».
//
// 🚨 LE DEFAUT DE MA PREMIERE CORRECTION, vu sur les pages 3, 4 et 5 de
// F007 : je comptais les balises ouvrantes et fermantes pour savoir ou
// s'arrete un bloc. Or LE GENERATEUR ECRIT DES COMMENTAIRES HTML —
// « <!-- Ligne 4 : cellule active --> ». Mon compteur ne les voyait pas,
// croyait le bloc referme, et le coupait en plein milieu : la premiere
// moitie s'affichait correctement, la seconde en code brut.
//
// COMMENT ON REPARE MAINTENANT, et c'est plus robuste : on ne compte plus
// rien. On repere l'OUVERTURE d'un bloc, puis on cherche SA FERMETURE la
// plus tardive dans les lignes qui suivent. Les commentaires, l'indentation
// et les balises imbriquees ne changent plus rien.
//
// 🚨 SECOND DEFAUT VU SUR LA PAGE 5 : les TABLEAUX EN MARKDOWN, ecrits avec
// des barres verticales, s'affichaient ligne par ligne — « | Onglet |
// Contenu principal | » puis « |---|---| ». Ils sont desormais rendus comme
// de vrais tableaux.
//
// ⚠️ POURQUOI LE HTML BRUT EST SANS DANGER ICI. Il vient de NOTRE
// generateur, jamais d'un utilisateur. On nettoie malgre tout script,
// iframe, object et gestionnaires d'evenements : si un contenu venait un
// jour d'ailleurs, la page resterait sure.
const BALISES_BLOC = ["div", "table", "figure", "section", "pre", "ul", "ol"];

function ouvertureBloc(ligne) {
  const t = ligne.trim();
  for (const b of BALISES_BLOC) {
    if (new RegExp("^<" + b + "\\b", "i").test(t)) return b;
  }
  return null;
}

// Une ligne de tableau markdown : commence et finit par une barre.
function estLigneTableau(ligne) {
  const t = ligne.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 2;
}

// La ligne de separation d'un tableau markdown : |---|---|
function estSeparateurTableau(ligne) {
  return /^\|[\s:|-]+\|$/.test(ligne.trim());
}

function cellulesDe(ligne) {
  return ligne.trim().slice(1, -1).split("|").map(function (c) { return propre(c); });
}

function htmlSur(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

// Transforme un texte en blocs : ligne de texte, schema HTML, ou tableau.
function enBlocs(texte) {
  const lignes = String(texte || "").split("\n");
  const blocs = [];
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];
    const balise = ouvertureBloc(ligne);

    // ---- UN SCHEMA HTML ----
    if (balise) {
      const fermeture = new RegExp("</" + balise + ">", "i");
      let dernier = -1;
      const limite = Math.min(lignes.length, i + 150);

      // On cherche LA DERNIERE fermeture de cette balise dans la fenetre :
      // un tableau contient des <table> imbriques ou des commentaires, et
      // s'arreter a la premiere fermeture couperait le bloc en deux.
      for (let j = i; j < limite; j = j + 1) {
        if (fermeture.test(lignes[j])) dernier = j;
        // Une ligne vide suivie d'un texte normal signale la fin du schema.
        if (dernier >= 0 && j > dernier && !lignes[j].trim().startsWith("<") && lignes[j].trim()) break;
      }

      if (dernier >= 0) {
        blocs.push({ type: "html", contenu: lignes.slice(i, dernier + 1).join("\n") });
        i = dernier + 1;
        continue;
      }
      // Bloc jamais referme : on le passe en texte plutot que d'avaler la
      // suite du cours.
    }

    // ---- UN TABLEAU MARKDOWN ----
    if (estLigneTableau(ligne)) {
      const rangs = [];
      let j = i;
      while (j < lignes.length && estLigneTableau(lignes[j])) {
        if (!estSeparateurTableau(lignes[j])) rangs.push(cellulesDe(lignes[j]));
        j = j + 1;
      }
      if (rangs.length >= 2) {
        blocs.push({ type: "tableau", rangs: rangs, contenu: lignes.slice(i, j).join("\n") });
        i = j;
        continue;
      }
    }

    if (ligne.trim()) blocs.push({ type: "texte", contenu: ligne });
    i = i + 1;
  }

  return blocs;
}

export default function LMSPage({ params }) {
  const code = params.code?.toUpperCase();
  const [formation, setFormation] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFormation, setLoadingFormation] = useState(true);
  const [onglet, setOnglet] = useState("cours");
  const [progression, setProgression] = useState({});
  const [avertissement, setAvertissement] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [langue, setLangue] = useState("fr");
  const [formateurDyn, setFormateurDyn] = useState("");
  const [coachDyn, setCoachDyn] = useState("");
  const [pageModule, setPageModule] = useState(0);

  const [choix, setChoix] = useState({});
  const [synthese, setSynthese] = useState("");
  const [correction, setCorrection] = useState(null);
  const [correctionEnCours, setCorrectionEnCours] = useState(false);
  const [seuil, setSeuil] = useState(14);

  const chapitre = chapitres[chapitreActif - 1];
  const module = chapitre?.modules[moduleActif - 1];
  const totalModules = chapitres.reduce((acc, ch) => acc + (ch.modules?.length || 0), 0);
  const modulesValides = Object.values(progression).filter(v => v === "valide").length;
  const progressionPct = totalModules > 0 ? Math.round((modulesValides / totalModules) * 100) : 0;
  const cle = chapitreActif + "_" + moduleActif;
  const moduleValide = progression[cle] === "valide";

  const texteCours = coursSansQCM(contenu);

  // 🖥️ Un schema ou un tableau n'est JAMAIS coupe entre deux pages.
  const pages = (function () {
    const blocs = enBlocs(texteCours).filter(function (b) {
      return b.type !== "texte" || (b.contenu.trim() && b.contenu.trim() !== "---");
    });

    const resultat = [];
    let courant = [];
    let taille = 0;

    for (const bloc of blocs) {
      courant.push(bloc);
      taille = taille + bloc.contenu.length;

      const estTitre = bloc.type === "texte" && /^#{1,6}\s/.test(bloc.contenu.trim());
      if (taille >= CARACTERES_PAR_PAGE && !estTitre) {
        resultat.push(courant);
        courant = [];
        taille = 0;
      }
    }

    if (courant.length > 0) resultat.push(courant);
    return resultat.length > 0 ? resultat : [blocs];
  })();

  const totalPages = pages.length;
  const blocsPage = pages[pageModule] || pages[0] || [];

  const questions = analyserQuestions(zoneQCM(contenu));
  const repondues = questions.filter(q => choix[q.numero]).length;
  const motsSynthese = synthese.split(/\s+/).filter(Boolean).length;
  const pretAcorriger =
    questions.length > 0 && repondues === questions.length && motsSynthese >= MOTS_MIN_SYNTHESE;

  useEffect(() => {
    const lang = localStorage.getItem("langue") || "fr";
    setLangue(lang);
    chargerFormation(lang);
    chargerProgression();
  }, [code]);

  useEffect(() => {
    if (chapitres.length > 0) chargerModule(chapitreActif, moduleActif);
  }, [chapitreActif, moduleActif, langue, chapitres.length]);

  async function chargerFormation(lang) {
    try {
      const r = await fetch("/api/formation/" + code + "?lang=" + lang);
      const data = await r.json();
      if (!data.error) setFormation(data);

      const r2 = await fetch("/api/lms-structure/" + code + "?lang=" + lang);
      const data2 = await r2.json();
      if (data2.chapitres && data2.chapitres.length > 0) setChapitres(data2.chapitres);
      if (data2.formateur) setFormateurDyn(data2.formateur);
      if (data2.coach) setCoachDyn(data2.coach);
    } catch {}
    setLoadingFormation(false);
  }

  async function chargerProgression() {
    try {
      const r = await fetch("/api/progression?formation_code=" + code);
      const data = await r.json();
      if (data.success) {
        setProgression(data.progression || {});
        setAvertissement("");
      } else if (r.status === 401) {
        setProgression({});
        setAvertissement("Connectez-vous pour que votre progression soit enregistrée.");
      }
    } catch {
      setAvertissement("Progression indisponible pour le moment.");
    }
  }

  // L ASSIDUITE S ECRIT, ELLE NE SE DEDUIT PAS.
  async function enregistrerValidation(module_cle, score) {
    try {
      const r = await fetch("/api/progression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_code: code,
          module_cle: module_cle,
          score: score,
        }),
      });
      const data = await r.json();
      if (!data.success) {
        setAvertissement(
          "Votre note est enregistrée, mais votre progression n'a pas pu être sauvegardée : " +
          (data.error || "raison inconnue")
        );
        return false;
      }
      return true;
    } catch (e) {
      setAvertissement("Progression non sauvegardée : " + String(e));
      return false;
    }
  }

  async function chargerCopie(ch_num, mod_num) {
    setCorrection(null);
    setChoix({});
    setSynthese("");
    try {
      const r = await fetch("/api/qcm-correcteur?formation_code=" + code + "&module_cle=" + ch_num + "_" + mod_num);
      const data = await r.json();
      if (data.ok) {
        if (data.seuil) setSeuil(data.seuil);
        if (data.copie && data.copie.statut === "corrigee") {
          setCorrection({
            note: data.copie.note,
            retour: data.copie.retour,
            valide: data.copie.note >= (data.seuil || 14),
          });
        }
      }
    } catch {}
  }

  async function chargerModule(ch_num, mod_num) {
    if (chapitres.length === 0) return;
    setLoading(true);
    setContenu("");
    setPageModule(0);
    chargerCopie(ch_num, mod_num);
    try {
      const r = await fetch("/api/lms-sophrologie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: code, chapitre_num: ch_num, module_num: mod_num, langue }),
      });
      const data = await r.json();
      if (data.succes) setContenu(data.contenu);
    } catch {}
    setLoading(false);
  }

  async function faireCorriger() {
    if (!pretAcorriger) return;
    setCorrectionEnCours(true);
    setAvertissement("");

    const lignes = questions.map(function (q) {
      return "Question " + q.numero + " : " + (choix[q.numero] || "sans reponse");
    });

    const copie =
      "REPONSES COCHEES\n" + lignes.join("\n") +
      "\n\nNOTE DE SYNTHESE DU STAGIAIRE\n" + synthese.trim();

    try {
      const r = await fetch("/api/qcm-correcteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_code: code, module_cle: cle, reponses: copie, langue }),
      });
      const data = await r.json();
      if (data.ok) {
        setCorrection({ note: data.note, retour: data.retour, valide: data.valide });
        if (data.seuil) setSeuil(data.seuil);
        if (data.valide) {
          await enregistrerValidation(cle, data.note);
          await chargerProgression();
        }
      } else {
        setAvertissement(data.erreur || "Correction impossible.");
      }
    } catch (e) {
      setAvertissement("Correction impossible : " + String(e));
    }
    setCorrectionEnCours(false);
  }

  // L assistant lit LE MODULE EN COURS et repond en s appuyant dessus.
  async function envoyerChat() {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch("/api/organisme/tuteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          chapitre: chapitreActif,
          module: moduleActif,
          langue: langue,
          message: msg,
          historique: chatHistory,
        }),
      });
      const data = await r.json();
      setChatHistory(prev => [
        ...prev,
        { role: "agent", text: data.ok ? data.reponse : (data.erreur || "Réponse impossible.") },
      ]);
    } catch {
      setChatHistory(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setChatLoading(false);
  }

  function moduleSuivant() {
    const nm = moduleActif + 1;
    if (nm <= (chapitre?.modules.length || 0)) { setModuleActif(nm); setOnglet("cours"); }
    else if (chapitreActif < chapitres.length) { setChapitreActif(c => c + 1); setModuleActif(1); setOnglet("cours"); }
  }

  const domaine = formation?.domaine || "Business";
  const agents = AGENTS_DOMAINE[domaine] || AGENTS_DOMAINE["Business"];

  if (loadingFormation) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement…</p>
    </div>
  );

  if (chapitres.length === 0) return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>Formation en préparation</h1>
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Le contenu de cette formation est en cours de génération.</p>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
    </div>
  );

  const styleNav = (actif) => ({
    background: actif ? "#c8a96e" : "#eee",
    color: actif ? "#050508" : "#999",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: actif ? "pointer" : "default",
    fontWeight: "bold",
  });

  const CARTE = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "36px 40px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    marginBottom: "20px",
  };

  // Le rendu d'un bloc : schema, tableau, ou ligne de texte.
  function rendreBloc(bloc, i) {
    if (bloc.type === "html") {
      return (
        <div
          key={i}
          style={{ margin: "22px 0", overflowX: "auto" }}
          dangerouslySetInnerHTML={{ __html: htmlSur(bloc.contenu) }}
        />
      );
    }

    if (bloc.type === "tableau") {
      const [entete, ...corps] = bloc.rangs;
      return (
        <div key={i} style={{ margin: "22px 0", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "16px" }}>
            <thead>
              <tr>
                {entete.map(function (c, k) {
                  return (
                    <th key={k} style={{ border: "1px solid #ddd", padding: "10px 12px", background: "#f4efe4", color: "#7a5f2a", textAlign: "left", fontWeight: "bold" }}>
                      {c}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {corps.map(function (rang, k) {
                return (
                  <tr key={k} style={{ background: k % 2 === 0 ? "#fff" : "#fafafa" }}>
                    {rang.map(function (c, m) {
                      return (
                        <td key={m} style={{ border: "1px solid #ddd", padding: "10px 12px", color: "#1a1a1a", lineHeight: "1.6" }}>
                          {c}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    const l = bloc.contenu.trim();

    if (/^#{1,6}\s/.test(l)) {
      const texte = l.replace(/^#{1,6}\s+/, "");
      const niveau = (l.match(/^(#{1,6})/) || ["", ""])[1].length;
      if (niveau <= 2) return <h2 key={i} style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", margin: "20px 0 10px" }}>{texte}</h2>;
      return <h3 key={i} style={{ color: "#333", fontSize: "18px", margin: "15px 0 8px", fontWeight: "bold" }}>{texte}</h3>;
    }
    if (l === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
    if (l.startsWith("> ")) return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "18px" }}>{propre(l.replace(/^> /, ""))}</blockquote>;
    if (/^[-*]\s+/.test(l)) return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.8", margin: "0 0 10px 22px" }}>• {propre(l.replace(/^[-*]\s+/, ""))}</p>;
    return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.85", marginBottom: "16px", textAlign: "justify" }}>{propre(l)}</p>;
  }

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "20px 30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 2px" }}>AcadémIA Pro · LMS · {domaine}</p>
            <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "20px", margin: "0 0 2px" }}>{formation?.titre || code}</h1>
            <p style={{ color: "rgba(200,169,110,0.7)", fontSize: "11px", margin: 0 }}>Formateur : {formateurDyn || agents.formateur}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 4px" }}>Progression</p>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", width: "200px" }}>
              <div style={{ background: "#c8a96e", borderRadius: "10px", height: "8px", width: progressionPct + "%" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "4px 0 0" }}>{modulesValides}/{totalModules} modules · {progressionPct}%</p>
          </div>
        </div>
      </div>

      {avertissement && (
        <div style={{ maxWidth: "1200px", margin: "16px auto 0", padding: "12px 18px", background: "rgba(200,120,0,0.12)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "8px", color: "#e8c887", fontSize: "13px" }}>
          {avertissement}
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "15px", height: "fit-content" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 15px", fontSize: "14px" }}>Programme</h3>
          {chapitres.map((ch) => (
            <div key={ch.numero} style={{ marginBottom: "10px" }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", margin: "0 0 5px" }}>Ch.{ch.numero} {ch.titre}</p>
              {(ch.modules || []).map((mod) => {
                const k = ch.numero + "_" + mod.numero;
                const valide = progression[k] === "valide";
                const actif = chapitreActif === ch.numero && moduleActif === mod.numero;
                const typeIcon = mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝";
                return (
                  <div key={mod.numero} onClick={() => { setChapitreActif(ch.numero); setModuleActif(mod.numero); setOnglet("cours"); }}
                    style={{ padding: "8px 10px", marginBottom: "4px", borderRadius: "6px", cursor: "pointer", background: actif ? "rgba(200,169,110,0.2)" : "transparent", border: actif ? "1px solid rgba(200,169,110,0.4)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{valide ? "✅" : "⭕"}</span>
                    <span style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.6)", fontSize: "11px" }}>{typeIcon} {ch.numero}.{mod.numero} {mod.titre}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div>
          {/* L ecran que verra le plus grand nombre : chaque stagiaire de
              chaque organisme client y passe. */}
          <Guide ecran="lms.parcours" />

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[{ id: "cours", label: "📖 Cours" }, { id: "qcm", label: "✅ QCM" }, { id: "chat", label: "🤖 Coach IA" }].map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: onglet === o.id ? "#050508" : "rgba(255,255,255,0.6)", fontWeight: onglet === o.id ? "bold" : "normal" }}>
                {o.label}
              </button>
            ))}
          </div>

          {module && (
            <div style={{ marginBottom: "15px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 4px" }}>Chapitre {chapitreActif} · Module {moduleActif}</p>
              <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: 0, fontSize: "18px" }}>{module.titre}</h2>
              {moduleValide && <span style={{ background: "rgba(0,200,0,0.2)", color: "#00c800", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>✅ Module validé</span>}
            </div>
          )}

          {onglet === "cours" && (
            <div style={{ ...CARTE, padding: "40px 45px", minHeight: "400px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "15px" }}>⚡</div>
                  <div style={{ color: "#c8a96e", fontSize: "16px" }}>Chargement du module…</div>
                </div>
              ) : texteCours ? (
                <div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                      <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                      <button onClick={() => setPageModule(p => Math.min(totalPages - 1, p + 1))} disabled={pageModule === totalPages - 1} style={styleNav(pageModule < totalPages - 1)}>Suivant →</button>
                    </div>
                  )}

                  {blocsPage.map(rendreBloc)}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", padding: "15px 0", borderTop: "1px solid #eee" }}>
                    <button onClick={() => setPageModule(p => Math.max(0, p - 1))} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                    <span style={{ color: "#999", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                    {pageModule < totalPages - 1 ? (
                      <button onClick={() => setPageModule(p => p + 1)} style={styleNav(true)}>Suivant →</button>
                    ) : (
                      <button onClick={() => setOnglet("qcm")} style={styleNav(true)}>Passer au QCM →</button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>Sélectionnez un module</div>
              )}
            </div>
          )}

          {onglet === "qcm" && (
            <div>
              {loading ? (
                <div style={CARTE}><p style={{ color: "#666", margin: 0 }}>Chargement du module…</p></div>
              ) : questions.length === 0 ? (
                <div style={CARTE}>
                  <p style={{ color: "#666", margin: 0, fontSize: "17px" }}>
                    Ce module n'a pas encore de questionnaire.
                  </p>
                </div>
              ) : (
                <>
                  <div style={CARTE}>
                    <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "21px", margin: "0 0 8px" }}>Questionnaire du module</h2>
                    <p style={{ color: "#555", fontSize: "15px", marginTop: 0, lineHeight: "1.6" }}>
                      Cochez une réponse par question. Les bonnes réponses vous seront données et
                      expliquées par votre correcteur, après votre note.
                    </p>

                    {questions.map(function (q) {
                      return (
                        <div key={q.numero} style={{ marginTop: "26px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
                          <p style={{ color: "#1a1a1a", fontSize: "17px", lineHeight: "1.7", fontWeight: "bold", margin: "0 0 12px" }}>
                            {q.numero}. {q.enonce}
                          </p>
                          {q.options.map(function (o) {
                            const coche = choix[q.numero] === o.lettre;
                            return (
                              <div
                                key={o.lettre}
                                onClick={() => setChoix({ ...choix, [q.numero]: o.lettre })}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  padding: "12px 14px",
                                  margin: "0 0 8px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  background: coche ? "rgba(200,169,110,0.16)" : "#fafafa",
                                  border: coche ? "2px solid #c8a96e" : "1px solid #e2e2e2",
                                }}
                              >
                                <span style={{
                                  flexShrink: 0,
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "50%",
                                  border: coche ? "2px solid #c8a96e" : "2px solid #bbb",
                                  background: coche ? "#c8a96e" : "#fff",
                                  color: coche ? "#050508" : "#888",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                }}>
                                  {o.lettre}
                                </span>
                                <span style={{ color: "#1a1a1a", fontSize: "16px", lineHeight: "1.6" }}>{o.texte}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    <p style={{ color: repondues === questions.length ? "#2e7d32" : "#a06a2c", fontSize: "15px", marginTop: "22px", marginBottom: 0, fontWeight: "bold" }}>
                      {repondues} réponse(s) sur {questions.length}
                    </p>
                  </div>

                  <div style={CARTE}>
                    <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "21px", margin: "0 0 8px" }}>Votre note de synthèse</h2>
                    <p style={{ color: "#555", fontSize: "15px", marginTop: 0, lineHeight: "1.6" }}>
                      Avec vos mots, sans recopier le cours : les notions clés de ce module, la méthode
                      retenue, et une situation où vous comptez l'appliquer. Votre correcteur en tient
                      compte dans la note, autant que vos réponses.
                    </p>

                    <textarea
                      value={synthese}
                      onChange={(e) => setSynthese(e.target.value)}
                      rows={9}
                      placeholder="Ce que j'ai retenu de ce module…"
                      disabled={correctionEnCours}
                      style={{ width: "100%", padding: "16px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", color: "#1a1a1a", fontSize: "17px", lineHeight: "1.7", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" }}
                    />

                    <p style={{ color: motsSynthese >= MOTS_MIN_SYNTHESE ? "#2e7d32" : "#a06a2c", fontSize: "14px", margin: "0 0 16px" }}>
                      {motsSynthese} mots {motsSynthese >= MOTS_MIN_SYNTHESE ? "" : "— minimum " + MOTS_MIN_SYNTHESE}
                    </p>

                    <button
                      onClick={faireCorriger}
                      disabled={correctionEnCours || !pretAcorriger}
                      style={{ background: correctionEnCours || !pretAcorriger ? "#e3d9c2" : "#c8a96e", color: correctionEnCours || !pretAcorriger ? "#8a8a8a" : "#050508", padding: "16px 30px", borderRadius: "8px", border: "none", cursor: correctionEnCours || !pretAcorriger ? "default" : "pointer", fontWeight: "bold", fontSize: "17px", width: "100%", fontFamily: "Georgia,serif" }}
                    >
                      {correctionEnCours ? "Votre correcteur lit votre copie…" : correction ? "Faire corriger à nouveau" : "Faire corriger ma copie"}
                    </button>

                    <p style={{ color: "#888", fontSize: "14px", marginTop: "12px", marginBottom: 0 }}>
                      Il faut {seuil} sur 20 pour valider ce module. Vous pouvez recommencer autant de fois que nécessaire.
                    </p>
                  </div>

                  {correction && (
                    <div style={{ ...CARTE, padding: "30px 36px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px", paddingBottom: "16px", borderBottom: "1px solid #eee" }}>
                        <span style={{ fontSize: "36px", fontWeight: "bold", color: correction.valide ? "#2e7d32" : "#c62828", fontFamily: "Georgia,serif" }}>
                          {correction.note}/20
                        </span>
                        <span style={{ color: correction.valide ? "#2e7d32" : "#a06a2c", fontSize: "16px", fontWeight: "bold" }}>
                          {correction.valide ? "Module validé" : "Pas encore acquis"}
                        </span>
                      </div>

                      <div style={{ whiteSpace: "pre-wrap", color: "#1a1a1a", fontSize: "17px", lineHeight: "1.8", fontFamily: "Georgia,serif" }}>
                        {propre(correction.retour)}
                      </div>

                      {correction.valide && (
                        <button onClick={moduleSuivant} style={{ marginTop: "24px", background: "#c8a96e", color: "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif" }}>
                          Module suivant →
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {onglet === "chat" && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px" }}>
              <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", margin: "0 0 6px" }}>Coach IA — {coachDyn || agents.coach}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 16px", lineHeight: "1.7" }}>
                Vos questions sur le module {chapitreActif}.{moduleActif} que vous lisez. Le coach
                s'appuie sur son contenu, et vous dira si la réponse se trouve ailleurs dans la
                formation. Il ne donne jamais les réponses du questionnaire.
              </p>
              <div style={{ minHeight: "300px", maxHeight: "400px", overflowY: "auto", marginBottom: "15px" }}>
                {chatHistory.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "80px" }}>Une notion vous échappe ? Demandez.</p>}
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "#050508" : "#fff", padding: "12px 15px", borderRadius: "10px", maxWidth: "82%", fontSize: "14.5px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{propre(msg.text)}</div>
                  </div>
                ))}
                {chatLoading && <p style={{ color: "#c8a96e", textAlign: "center" }}>Le coach relit votre module…</p>}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && !chatLoading && envoyerChat()} placeholder="Posez votre question…"
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }} />
                <button onClick={envoyerChat} disabled={chatLoading} style={{ padding: "10px 20px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Envoyer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
