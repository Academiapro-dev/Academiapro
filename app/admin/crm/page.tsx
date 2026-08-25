"use client";
import { useState, useEffect } from "react";

// CET ECRAN EST CELUI DE L EDITEUR : il montre les prospects d AcadeMIA Pro,
// ceux qui arrivent par les tunnels publics et n ont aucun organisme
// rattache. Les prospects des organismes clients restent sur /organisme/crm.
//
// DEUX MOTS DIFFERENTS POUR DEUX METIERS. « Prospection » designe les quatre
// bases froides — 69 000 entreprises collectees puis enrichies, que l on
// travaille au volume. « Mes contacts » designe les gens qui ont leve la
// main sur le site, que l on travaille un par un.
//
// 🚨 L ECRAN LINKEDIN EST ACCESSIBLE D ICI — ajoute le 17/08.
//
// LE DEFAUT : /admin/linkedin n'etait atteignable qu'en tapant son adresse.
// Le tableau de bord affichait meme un bloc « Invitations LinkedIn » SANS
// AUCUN LIEN, et renvoyait vers « l'onglet Prospection » — qui n'est pas le
// bon endroit : c'est l'ecran dedie qui porte la file d'invitation, le mot
// pre-redige, le suivi des acceptations et l'ajout manuel de profils.
//
// Ses mots : « j'aimerais pouvoir le trouver tout seul, sinon ca voudrait
// dire qu'il y a un probleme au niveau de la simplicite d'utilisation ».
// Il a raison : un ecran qu'on ne trouve qu'en tapant son adresse est un
// ecran mal range. Le lien figure desormais dans l'en-tete, visible depuis
// tous les onglets, et dans le bloc du tableau de bord.
//
// 🔎 LA RECHERCHE GLOBALE — ajoutee le 24/08.
//
// LE DEFAUT : le champ de recherche ne cherchait que dans la base ouverte.
// Il fallait donc SAVOIR ou se trouvait un prospect avant de pouvoir le
// chercher — ce qui est exactement ce qu on ignore quand on cherche.
//
// Ses mots : « je n'ai pas un moteur de recherche global, ce qui m'oblige a
// chercher dans les colonnes ou se trouve tel ou tel prospect ».
//
// Le champ pose en tete de l onglet Prospection interroge les QUATRE bases
// d un coup et dit dans laquelle chaque resultat se trouve. Un clic sur une
// base ouvre le detail correspondant. La recherche par base reste en place :
// elle sert au travail au volume, celle-ci sert a retrouver quelqu un.
const PORTEE = "editeur";

const FILTRES = [
  { cle: "", nom: "Tout" },
  { cle: "a_envoyer", nom: "A envoyer" },
  { cle: "envoyes", nom: "Deja contactes" },
  { cle: "avec_email", nom: "Avec adresse" },
  { cle: "avec_telephone", nom: "Avec telephone" },
  { cle: "linkedin_a_faire", nom: "LinkedIn a faire" },
  { cle: "linkedin_invites", nom: "Deja invites" },
  { cle: "a_enrichir", nom: "A enrichir" },
  { cle: "desabonnes", nom: "Desabonnes" },
];

const LINKEDIN = ["linkedin_a_faire", "linkedin_invites"];

const MOTIFS_PERTE = [
  "Prix trop élevé",
  "A choisi un concurrent",
  "Projet abandonné",
  "Pas de budget",
  "Sans réponse",
  "Hors cible",
  "Mauvais moment",
  "Autre",
];

const SEPARATEUR = " — ";
const BASE_PAR_DEFAUT = "organismes";

export default function CRMPage() {
  const [stats, setStats] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });

  const [bases, setBases] = useState<any>(null);
  const [base, setBase] = useState(BASE_PAR_DEFAUT);
  const [filtre, setFiltre] = useState("");
  const [cherche, setCherche] = useState("");
  const [saisie, setSaisie] = useState("");
  const [page, setPage] = useState(0);
  const [chargeBases, setChargeBases] = useState(false);
  const [erreurBases, setErreurBases] = useState("");

  // LA RECHERCHE GLOBALE. Elle vit a part de la recherche par base : ses
  // resultats remplacent l affichage tant qu ils sont a l ecran.
  const [saisieGlobale, setSaisieGlobale] = useState("");
  const [globale, setGlobale] = useState<any>(null);
  const [chargeGlobale, setChargeGlobale] = useState(false);

  const [motifs, setMotifs] = useState<any>(null);
  const [fichePerdu, setFichePerdu] = useState("");
  const [motifChoisi, setMotifChoisi] = useState("");
  const [precision, setPrecision] = useState("");
  const [enCours, setEnCours] = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  const [masquerPerdus, setMasquerPerdus] = useState(true);

  // Le compteur LinkedIn des sept derniers jours.
  const [compteurIn, setCompteurIn] = useState<any>(null);
  const [ligneOccupee, setLigneOccupee] = useState<any>(null);

  useEffect(() => { charger(); }, []);

  useEffect(() => {
    if (onglet === "bases") chargerBases();
  }, [onglet, base, filtre, cherche, page]);

  async function charger() {
    const [s, p] = await Promise.all([
      fetch("/api/crm?portee=" + PORTEE).then(r => r.json()),
      fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prospects", portee: PORTEE }) }).then(r => r.json()),
    ]);
    setStats(s);
    setProspects(Array.isArray(p) ? p : []);
    chargerMotifs();
    chargerCompteurIn();
  }

  async function chargerMotifs() {
    try {
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "motifs_perte", portee: PORTEE }),
      });
      const d = await r.json();
      setMotifs(d && Array.isArray(d.motifs) ? d : null);
    } catch (e) {
      setMotifs(null);
    }
  }

  async function chargerCompteurIn() {
    try {
      const r = await fetch("/api/admin/linkedin", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setCompteurIn(d);
    } catch (e) {
      setCompteurIn(null);
    }
  }

  async function chargerBases() {
    setChargeBases(true);
    setErreurBases("");
    try {
      const q = new URLSearchParams();
      if (base) q.set("base", base);
      if (filtre) q.set("filtre", filtre);
      if (cherche) q.set("q", cherche);
      if (page) q.set("page", String(page));

      const r = await fetch("/api/admin/prospection?" + q.toString(), { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setBases(data);
      else setErreurBases(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreurBases("Lecture impossible : " + String(e));
    }
    setChargeBases(false);
  }

  // CHERCHER PARTOUT. Le terme part vers les quatre bases, et le resultat
  // dit dans laquelle chaque ligne se trouve.
  async function chercherPartout() {
    const terme = saisieGlobale.trim();
    if (terme.length < 2) {
      setErreurBases("Deux caractères au minimum.");
      return;
    }
    setChargeGlobale(true);
    setErreurBases("");
    try {
      const r = await fetch("/api/admin/prospection?global=" + encodeURIComponent(terme), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setGlobale(d);
      else {
        setGlobale(null);
        setErreurBases(d.erreur || "Recherche impossible.");
      }
    } catch (e: any) {
      setGlobale(null);
      setErreurBases("Recherche impossible : " + String(e));
    }
    setChargeGlobale(false);
  }

  function effacerGlobale() {
    setSaisieGlobale("");
    setGlobale(null);
    setErreurBases("");
  }

  // Ouvrir la base d un resultat global, en gardant le terme comme filtre
  // de recherche dans cette base.
  function ouvrirBase(cle: string, terme: string) {
    setBase(cle);
    setFiltre("");
    setSaisie(terme);
    setCherche(terme);
    setPage(0);
    setGlobale(null);
  }

  // INVITER SUR LINKEDIN — LE PROFIL S OUVRE, LA DATE S ENREGISTRE.
  //
  // Rien n est envoye automatiquement, et c est volontaire : l API de
  // LinkedIn ne permet pas d envoyer des invitations, et les outils qui
  // le font par le navigateur font restreindre puis supprimer le compte.
  //
  // L ouverture se fait AVANT l appel reseau : un window.open declenche
  // apres un await est bloque par le navigateur comme une fenetre
  // surgissante non sollicitee.
  async function inviter(l: any, cleBase?: string) {
    const url = lienLinkedin(l.linkedin);
    if (!url) return;
    try { window.open(url, "_blank", "noopener"); } catch (e) { }

    setLigneOccupee(l.id);
    setErreurBases("");
    try {
      const r = await fetch("/api/admin/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base: cleBase || base, id: l.id, statut: "invite" }),
      });
      const d = await r.json();
      if (d.ok) {
        setCompteurIn(d);
        if (globale) await chercherPartout();
        else await chargerBases();
      } else {
        setErreurBases(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreurBases("Enregistrement impossible : " + String(e));
    }
    setLigneOccupee(null);
  }

  // La reponse constatee, plus tard : accepte ou refuse. La date d envoi
  // est conservee, sans quoi le compteur de la semaine serait fausse.
  async function reponseIn(l: any, statut: string, cleBase?: string) {
    setLigneOccupee(l.id);
    setErreurBases("");
    try {
      const r = await fetch("/api/admin/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base: cleBase || base, id: l.id, statut: statut }),
      });
      const d = await r.json();
      if (d.ok) {
        if (globale) await chercherPartout();
        else await chargerBases();
      } else setErreurBases(d.erreur || "Enregistrement impossible.");
    } catch (e: any) {
      setErreurBases("Enregistrement impossible : " + String(e));
    }
    setLigneOccupee(null);
  }

  async function ajouterProspect() {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upsert", data: form, portee: PORTEE }) });
    const data = await r.json();
    setResultat(data);
    await charger();
    setLoading(false);
    setForm({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });
  }

  async function analyser(email: string) {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "analyser", email, portee: PORTEE }) });
    const data = await r.json();
    setResultat(data);
    setLoading(false);
  }

  async function relancer(email: string) {
    setLoading(true);
    const r = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "relance", email, portee: PORTEE }) });
    const data = await r.json();
    setResultat(data);
    setLoading(false);
  }

  async function marquerPerdu(email: string) {
    if (!motifChoisi) {
      setMessageErreur("Choisissez d abord un motif.");
      return;
    }
    setEnCours(email);
    setMessageErreur("");
    const texte = precision.trim() ? motifChoisi + SEPARATEUR + precision.trim() : motifChoisi;
    try {
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "perdu", email, motif: texte, portee: PORTEE }),
      });
      const d = await r.json();
      if (d.erreur) setMessageErreur(d.erreur);
      else {
        setFichePerdu("");
        setMotifChoisi("");
        setPrecision("");
        await charger();
      }
    } catch (e: any) {
      setMessageErreur("Enregistrement impossible : " + String(e));
    }
    setEnCours("");
  }

  async function rouvrir(email: string) {
    setEnCours(email);
    setMessageErreur("");
    try {
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rouvrir", email, portee: PORTEE }),
      });
      const d = await r.json();
      if (d.erreur) setMessageErreur(d.erreur);
      else await charger();
    } catch (e: any) {
      setMessageErreur("Réouverture impossible : " + String(e));
    }
    setEnCours("");
  }

  async function basculerRelanceAuto(email: string, actif: boolean) {
    setEnCours(email);
    setMessageErreur("");
    try {
      const r = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relance_auto", email, actif, portee: PORTEE }),
      });
      const d = await r.json();
      if (d.erreur) setMessageErreur(d.erreur);
      else await charger();
    } catch (e: any) {
      setMessageErreur("Enregistrement impossible : " + String(e));
    }
    setEnCours("");
  }

  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  // Le profil est stocke sans schema : « www.linkedin.com/in/x ». Tel quel
  // dans un href, le navigateur le prendrait pour un chemin relatif.
  function lienLinkedin(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  function nomLinkedin(v: string) {
    const t = String(v || "").trim().replace(/\/+$/, "");
    const m = t.split("/");
    return m[m.length - 1] || t;
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(d: any) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function motifsRegroupes() {
    if (!motifs || !Array.isArray(motifs.motifs)) return [];
    const compte: any = {};
    motifs.motifs.forEach(function (m: any) {
      const tete = String(m.motif || "").split(SEPARATEUR)[0].trim() || "Sans motif";
      compte[tete] = (compte[tete] || 0) + (Number(m.nombre) || 0);
    });
    return Object.keys(compte)
      .map(function (k) { return { motif: k, nombre: compte[k] }; })
      .sort(function (a, b) { return b.nombre - a.nombre; });
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "bases", label: "🗂 Prospection" },
    { id: "prospects", label: "👥 Mes contacts" },
    { id: "apprenants", label: "🎓 Apprenants" },
    { id: "ajouter", label: "➕ Ajouter" },
    { id: "resultat", label: "🤖 Résultat IA" },
  ];

  const LIEN: any = { color: "#c8a96e", textDecoration: "none" };
  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
  const CHAMP: any = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" };

  const TH: any = { position: "sticky", top: 0, background: "#12121f", color: "#c8a96e", fontSize: "11.5px", fontWeight: "bold", textAlign: "left", padding: "9px 10px", borderBottom: "2px solid rgba(200,169,110,0.35)", whiteSpace: "nowrap", zIndex: 2 };
  const TD: any = { padding: "7px 10px", fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.85)" };

  // Le bouton vers l'ecran LinkedIn, present dans l'en-tete quel que soit
  // l'onglet ouvert.
  const PORTE_IN: any = {
    background: "rgba(68,138,255,0.18)",
    border: "1px solid rgba(68,138,255,0.5)",
    color: "#448aff",
    padding: "9px 18px",
    borderRadius: "20px",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
    textDecoration: "none",
    whiteSpace: "nowrap",
    display: "inline-block",
  };

  const apprenants = prospects.filter(function (p: any) {
    return (p.progression || 0) > 0 || p.formation_active;
  });

  const perdus = prospects.filter(function (p: any) { return p.statut === "perdu"; });

  const listeProspects = masquerPerdus
    ? prospects.filter(function (p: any) { return p.statut !== "perdu"; })
    : prospects;

  const detail = bases && bases.detail ? bases.detail : null;
  const regroupes = motifsRegroupes();
  const totalMotifs = regroupes.reduce(function (s, m) { return s + m.nombre; }, 0);

  const filtresVisibles = FILTRES.filter(function (f) {
    if (LINKEDIN.indexOf(f.cle) < 0) return true;
    return detail ? !!detail.porte_linkedin : true;
  });

  const plafondAtteint = compteurIn ? (compteurIn.reste || 0) <= 0 : false;

  // Les bases qui ont au moins un resultat, pour n afficher que celles-la.
  const basesTrouvees = globale && Array.isArray(globale.bases)
    ? globale.bases.filter(function (b: any) { return (b.trouves || 0) > 0; })
    : [];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>🎯 Mon CRM</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
              AcadémIA Pro · ma prospection, mes contacts, mes apprenants
            </p>
          </div>

          {/* LA PORTE VERS L'ECRAN LINKEDIN, visible depuis tous les onglets. */}
          <a href="/admin/linkedin" style={PORTE_IN}>
            💼 Prospection LinkedIn
            {compteurIn && compteurIn.reste_jour !== undefined
              ? " · " + nombre(compteurIn.reste_jour) + " aujourd'hui"
              : ""}
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "25px 20px", maxWidth: onglet === "bases" ? "100%" : "980px", margin: "0 auto" }}>

        {messageErreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#e8836a", fontSize: "13px" }}>
            {messageErreur}
          </div>
        )}

        {onglet === "dashboard" && stats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "25px" }}>
              {[
                { label: "Total contacts", value: stats.total || 0, color: "#c8a96e" },
                { label: "Contacts chauds 🔥", value: stats.chauds || 0, color: "#ff6b35" },
                { label: "Clients ✅", value: stats.clients || 0, color: "#00e676" },
                { label: "Score moyen", value: `${stats.score_moyen || 0}%`, color: "#448aff" },
                { label: "Actifs", value: stats.prospects || 0, color: "#c8a96e" },
                { label: "Taux conversion", value: stats.total > 0 ? `${Math.round((stats.clients / stats.total) * 100)}%` : "0%", color: "#00e676" },
                { label: "Perdus ❌", value: stats.perdus || 0, color: "#e8836a" },
                { label: "Taux de perte", value: stats.total > 0 ? `${Math.round(((stats.perdus || 0) / stats.total) * 100)}%` : "0%", color: "#e8836a" },
                { label: "Relance auto armée", value: stats.relance_armee || 0, color: "#448aff" },
              ].map(item => (
                <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {compteurIn && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px", border: "1px solid rgba(68,138,255,0.3)" }}>
                <h3 style={{ color: "#448aff", marginTop: 0, marginBottom: "8px", fontSize: "14px" }}>INVITATIONS LINKEDIN</h3>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", margin: "0 0 4px" }}>
                  {nombre(compteurIn.semaine)} envoyée(s) ces sept derniers jours · {nombre(compteurIn.reste_semaine)} avant le plafond de {compteurIn.plafond_semaine}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 14px", lineHeight: "1.6" }}>
                  Les invitations partent à la main : LinkedIn restreint les comptes qui automatisent, et une réputation abîmée ne se répare pas.
                </p>
                <a href="/admin/linkedin" style={{ ...PORTE_IN, padding: "11px 22px", fontWeight: "bold" }}>
                  Ouvrir la prospection LinkedIn →
                </a>
              </div>
            )}

            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(232,131,106,0.25)" }}>
              <h3 style={{ color: "#e8836a", marginTop: 0, fontSize: "14px" }}>POURQUOI ILS DISENT NON</h3>
              {regroupes.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.7", margin: 0 }}>
                  Aucun contact perdu pour l'instant. Chaque fiche que vous marquez « Perdu » vient nourrir cette liste.
                </p>
              ) : (
                <div>
                  {regroupes.map(function (m) {
                    const part = totalMotifs > 0 ? Math.round((m.nombre / totalMotifs) * 100) : 0;
                    return (
                      <div key={m.motif} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>{m.motif}</span>
                          <span style={{ color: "#e8836a", fontWeight: "bold" }}>{m.nombre} · {part} %</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                          <div style={{ background: "#e8836a", height: "100%", width: part + "%" }} />
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px", marginBottom: 0, marginTop: "12px" }}>
                    {nombre(totalMotifs)} fiche(s) perdue(s).
                  </p>
                </div>
              )}
            </div>

            {stats.par_domaine && Object.keys(stats.par_domaine).length > 0 && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ color: "#c8a96e", marginTop: 0, fontSize: "14px" }}>PAR DOMAINE</h3>
                {Object.entries(stats.par_domaine).map(([domaine, count]: any) => (
                  <div key={domaine} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{domaine}</span>
                    <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{count}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={charger} style={{ width: "100%", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
              🔄 Rafraîchir
            </button>
          </div>
        )}

        {/* ---------- PROSPECTION ---------- */}
        {onglet === "bases" && (
          <div>
            {erreurBases && (
              <p style={{ color: "#e8836a", fontSize: "14px", lineHeight: "1.7" }}>{erreurBases}</p>
            )}

            {/* LA RECHERCHE GLOBALE — elle precede tout le reste, parce que
                c est la question la plus frequente : ou est cette entreprise ? */}
            <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.28)", borderRadius: "11px", padding: "14px 16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                  🔎 Chercher partout
                </span>
                <input
                  value={saisieGlobale}
                  onChange={(e) => setSaisieGlobale(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") chercherPartout(); }}
                  placeholder="Société, dirigeant, ville, adresse, téléphone, SIREN ou LinkedIn"
                  style={{ flex: "1 1 320px", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.35)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" }}
                />
                <button onClick={chercherPartout} disabled={chargeGlobale} style={{ ...BOUTON, padding: "11px 22px", fontWeight: "bold" }}>
                  {chargeGlobale ? "…" : "Chercher"}
                </button>
                {globale && (
                  <button onClick={effacerGlobale} style={{ ...BOUTON, padding: "11px 20px" }}>
                    Effacer
                  </button>
                )}
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px", margin: "9px 0 0", lineHeight: "1.6" }}>
                Cette recherche interroge les quatre bases à la fois et indique dans laquelle chaque résultat se trouve.
              </p>
            </div>

            {/* LES RESULTATS GLOBAUX, groupes par base. */}
            {globale && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 12px" }}>
                  {nombre(globale.total_trouve)} résultat(s) pour « {globale.terme} »
                  {basesTrouvees.length > 0
                    ? " dans " + basesTrouvees.length + " base(s)"
                    : ""}
                </p>

                {globale.total_trouve === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", lineHeight: "1.7" }}>
                    Rien trouvé dans les quatre bases. Essayez avec moins de mots — le nom de la société seul, ou celui du dirigeant.
                  </p>
                ) : (
                  basesTrouvees.map(function (b: any) {
                    return (
                      <div key={b.cle} style={{ marginBottom: "18px", border: "1px solid rgba(200,169,110,0.18)", borderRadius: "10px", background: "#12121f", overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "11px 15px", background: "rgba(200,169,110,0.08)", borderBottom: "1px solid rgba(200,169,110,0.18)" }}>
                          <span style={{ color: "#c8a96e", fontSize: "13.5px", fontWeight: "bold" }}>
                            {b.titre} · {nombre(b.trouves)} trouvé(s)
                          </span>
                          <button
                            onClick={() => ouvrirBase(b.cle, globale.terme)}
                            style={{ ...BOUTON, padding: "6px 15px", fontSize: "12px" }}
                          >
                            Ouvrir cette base →
                          </button>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1100px" }}>
                            <thead>
                              <tr>
                                <th style={TH}>Société</th>
                                <th style={TH}>Dirigeant</th>
                                <th style={TH}>Ville</th>
                                <th style={TH}>Adresse e-mail</th>
                                <th style={TH}>Téléphone</th>
                                {b.porte_linkedin && <th style={TH}>LinkedIn</th>}
                                <th style={TH}>État</th>
                                <th style={TH}>SIREN</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.lignes.map(function (l: any, i: number) {
                                const fond = l.desabonne
                                  ? "rgba(232,131,106,0.09)"
                                  : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)");
                                return (
                                  <tr key={b.cle + "-" + l.id} style={{ background: fond }}>
                                    <td style={{ ...TD, color: "#fff", fontWeight: "bold", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {l.raison_sociale || "—"}
                                    </td>
                                    <td style={TD}>
                                      {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                                    </td>
                                    <td style={TD}>{l.ville || "—"}</td>
                                    <td style={TD}>
                                      {l.email
                                        ? <a href={"mailto:" + l.email} style={LIEN}>{l.email}</a>
                                        : <span style={{ color: "rgba(255,255,255,0.25)" }}>{l.dropcontact_le ? "non trouvée" : "à enrichir"}</span>}
                                    </td>
                                    <td style={TD}>
                                      {l.telephone
                                        ? <a href={"tel:" + appelable(l.telephone)} style={LIEN}>{l.telephone}</a>
                                        : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                                    </td>
                                    {b.porte_linkedin && (
                                      <td style={{ ...TD, maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {l.linkedin
                                          ? <a href={lienLinkedin(l.linkedin)} target="_blank" rel="noreferrer" style={{ ...LIEN, color: "#448aff" }}>in/{nomLinkedin(l.linkedin)}</a>
                                          : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                                      </td>
                                    )}
                                    <td style={TD}>
                                      {l.desabonne ? (
                                        <span style={{ color: "#e8836a", fontWeight: "bold" }}>Désabonné</span>
                                      ) : l.statut === "envoye" ? (
                                        <span style={{ color: "#00e676" }}>Contacté</span>
                                      ) : l.statut === "enrichi" ? (
                                        <span style={{ color: "#c8a96e" }}>À envoyer</span>
                                      ) : (
                                        <span style={{ color: "rgba(255,255,255,0.35)" }}>{l.statut || "brut"}</span>
                                      )}
                                    </td>
                                    <td style={{ ...TD, color: "rgba(255,255,255,0.4)" }}>{l.siren || "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {b.trouves > b.lignes.length && (
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", padding: "10px 15px", margin: 0 }}>
                            {nombre(b.trouves - b.lignes.length)} autre(s) résultat(s) dans cette base — ouvrez-la pour tout voir.
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* LE RESUME DES QUATRE BASES — masque pendant une recherche globale. */}
            {!globale && bases && bases.resume && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "stretch" }}>
                {bases.resume.map(function (r: any) {
                  const actif = base === r.cle;
                  return (
                    <div
                      key={r.cle}
                      onClick={() => { setBase(r.cle); setFiltre(""); setCherche(""); setSaisie(""); setPage(0); }}
                      style={{
                        flex: "1 1 200px", cursor: "pointer", borderRadius: "9px", padding: "10px 13px",
                        background: actif ? "rgba(200,169,110,0.13)" : "#1a1a2e",
                        border: actif ? "2px solid #c8a96e" : "1px solid rgba(200,169,110,0.15)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.75)", fontSize: "13px", fontWeight: "bold" }}>{r.titre}</span>
                        <span style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}>{nombre(r.total)}</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11.5px", marginTop: "4px" }}>
                        {nombre(r.avec_email)} adresse(s) · {nombre(r.avec_telephone)} tél.
                        {r.porte_linkedin ? " · " + nombre(r.avec_linkedin) + " LinkedIn" : ""}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px", marginTop: "2px" }}>
                        {nombre(r.envoyes)} contacté(s)
                        {r.a_envoyer > 0 ? " · " + nombre(r.a_envoyer) + " à envoyer" : ""}
                        {r.porte_linkedin && r.linkedin_a_faire > 0 ? " · " + nombre(r.linkedin_a_faire) + " à inviter" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!globale && (
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", margin: "0 0 14px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                  {bases ? nombre(bases.total_general) + " entreprises dans les quatre bases" : "Chargement…"}
                </span>
                {compteurIn && (
                  <span style={{ color: plafondAtteint ? "#e8836a" : "#448aff", fontSize: "12px" }}>
                    LinkedIn cette semaine : {nombre(compteurIn.semaine)} / {compteurIn.plafond_semaine}
                    {plafondAtteint ? " — plafond atteint, attendez quelques jours" : " · " + nombre(compteurIn.reste_semaine) + " restantes"}
                  </span>
                )}
              </div>
            )}

            {!globale && detail && (
              <div>
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {filtresVisibles.map(function (f) {
                    const actif = filtre === f.cle;
                    return (
                      <button
                        key={f.cle || "tout"}
                        onClick={() => { setFiltre(f.cle); setPage(0); }}
                        style={{
                          ...BOUTON, padding: "6px 13px",
                          background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)",
                          color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                          border: actif ? "none" : BOUTON.border,
                          fontWeight: actif ? "bold" : "normal",
                        }}
                      >
                        {f.nom}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
                  <input
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setCherche(saisie.trim()); setPage(0); } }}
                    placeholder="Dans cette base : société, dirigeant, ville, e-mail, téléphone ou SIREN"
                    style={{ flex: "1 1 260px", padding: "10px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" }}
                  />
                  <button onClick={() => { setCherche(saisie.trim()); setPage(0); }} style={{ ...BOUTON, padding: "10px 20px" }}>
                    Chercher
                  </button>
                  {cherche && (
                    <button onClick={() => { setSaisie(""); setCherche(""); setPage(0); }} style={{ ...BOUTON, padding: "10px 20px" }}>
                      Effacer
                    </button>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
                    {nombre(detail.total_filtre)} ligne(s)
                    {detail.pages > 1 ? " · page " + (detail.page + 1) + "/" + detail.pages : ""}
                  </span>
                </div>

                {chargeBases ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Chargement…</p>
                ) : detail.lignes.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Aucune ligne pour ce filtre.</p>
                ) : (
                  <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", background: "#12121f" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1450px" }}>
                      <thead>
                        <tr>
                          <th style={TH}>Société</th>
                          <th style={TH}>Dirigeant</th>
                          <th style={TH}>Ville</th>
                          <th style={TH}>CP</th>
                          <th style={TH}>Adresse e-mail</th>
                          <th style={TH}>Téléphone</th>
                          {detail.porte_linkedin && <th style={TH}>LinkedIn</th>}
                          {detail.porte_linkedin && <th style={TH}>Invitation</th>}
                          <th style={TH}>SMS</th>
                          <th style={TH}>État</th>
                          <th style={TH}>Contacté le</th>
                          <th style={TH}>SIREN</th>
                          {detail.porte_vague && <th style={TH}>Vague</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lignes.map(function (l: any, i: number) {
                          const fond = l.desabonne
                            ? "rgba(232,131,106,0.09)"
                            : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)");
                          const occupee = ligneOccupee === l.id;
                          return (
                            <tr key={l.id} style={{ background: fond }}>
                              <td style={{ ...TD, color: "#fff", fontWeight: "bold", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {l.raison_sociale || "—"}
                              </td>
                              <td style={TD}>
                                {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                              </td>
                              <td style={TD}>{l.ville || "—"}</td>
                              <td style={{ ...TD, color: "rgba(255,255,255,0.45)" }}>{l.code_postal || ""}</td>
                              <td style={TD}>
                                {l.email
                                  ? <a href={"mailto:" + l.email} style={LIEN}>{l.email}</a>
                                  : <span style={{ color: "rgba(255,255,255,0.25)" }}>{l.dropcontact_le ? "non trouvée" : "à enrichir"}</span>}
                              </td>
                              <td style={TD}>
                                {l.telephone
                                  ? <a href={"tel:" + appelable(l.telephone)} style={LIEN}>{l.telephone}</a>
                                  : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                              </td>

                              {detail.porte_linkedin && (
                                <td style={{ ...TD, maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {l.linkedin
                                    ? <a href={lienLinkedin(l.linkedin)} target="_blank" rel="noreferrer" style={{ ...LIEN, color: "#448aff" }}>in/{nomLinkedin(l.linkedin)}</a>
                                    : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                                </td>
                              )}

                              {detail.porte_linkedin && (
                                <td style={TD}>
                                  {!l.linkedin ? (
                                    <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>
                                  ) : l.linkedin_le ? (
                                    <span>
                                      <span style={{ color: l.linkedin_statut === "accepte" ? "#00e676" : l.linkedin_statut === "refuse" ? "#e8836a" : "rgba(255,255,255,0.6)" }}>
                                        {l.linkedin_statut === "accepte" ? "Accepté" : l.linkedin_statut === "refuse" ? "Refusé" : "Invité"}
                                      </span>
                                      <span style={{ color: "rgba(255,255,255,0.35)" }}> {jolieDate(l.linkedin_le)}</span>
                                      {l.linkedin_statut !== "accepte" && (
                                        <button onClick={() => reponseIn(l, "accepte")} disabled={occupee}
                                          style={{ background: "none", border: "none", color: "#00e676", cursor: "pointer", fontSize: "12px", padding: "0 4px" }}>✓</button>
                                      )}
                                      {l.linkedin_statut !== "refuse" && (
                                        <button onClick={() => reponseIn(l, "refuse")} disabled={occupee}
                                          style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "12px", padding: "0 4px" }}>✕</button>
                                      )}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => inviter(l)}
                                      disabled={occupee || plafondAtteint}
                                      style={{
                                        background: plafondAtteint ? "rgba(255,255,255,0.05)" : "rgba(68,138,255,0.18)",
                                        color: plafondAtteint ? "rgba(255,255,255,0.3)" : "#448aff",
                                        border: "1px solid " + (plafondAtteint ? "rgba(255,255,255,0.12)" : "rgba(68,138,255,0.5)"),
                                        borderRadius: "14px", padding: "4px 12px", fontSize: "12px",
                                        fontFamily: "Georgia,serif", cursor: plafondAtteint ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      {occupee ? "…" : plafondAtteint ? "Plafond" : "Inviter"}
                                    </button>
                                  )}
                                </td>
                              )}

                              <td style={{ ...TD, color: l.sms_accepte_le ? "#00e676" : "rgba(255,255,255,0.25)" }}>
                                {l.sms_accepte_le ? "oui" : "non"}
                              </td>
                              <td style={TD}>
                                {l.desabonne ? (
                                  <span style={{ color: "#e8836a", fontWeight: "bold" }}>Désabonné</span>
                                ) : l.statut === "envoye" ? (
                                  <span style={{ color: "#00e676" }}>Contacté</span>
                                ) : l.statut === "enrichi" ? (
                                  <span style={{ color: "#c8a96e" }}>À envoyer</span>
                                ) : l.statut === "envoi_en_cours" ? (
                                  <span style={{ color: "#448aff" }}>En cours</span>
                                ) : l.statut === "echec" ? (
                                  <span style={{ color: "#e8836a" }}>Échec</span>
                                ) : (
                                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{l.statut || "brut"}</span>
                                )}
                              </td>
                              <td style={{ ...TD, color: "rgba(255,255,255,0.55)" }}>{jolieDate(l.envoye_le) || "—"}</td>
                              <td style={{ ...TD, color: "rgba(255,255,255,0.4)" }}>{l.siren || "—"}</td>
                              {detail.porte_vague && (
                                <td style={{ ...TD, color: "rgba(255,255,255,0.4)" }}>{l.vague || "—"}</td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {detail.pages > 1 && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
                    <button onClick={() => setPage(0)} disabled={page === 0} style={{ ...BOUTON, padding: "9px 16px", opacity: page === 0 ? 0.35 : 1 }}>⏮ Début</button>
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ ...BOUTON, padding: "9px 18px", opacity: page === 0 ? 0.35 : 1 }}>Précédent</button>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>{page + 1} / {detail.pages}</span>
                    <button onClick={() => setPage(page + 1)} disabled={page + 1 >= detail.pages} style={{ ...BOUTON, padding: "9px 18px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}>Suivant</button>
                    <button onClick={() => setPage(detail.pages - 1)} disabled={page + 1 >= detail.pages} style={{ ...BOUTON, padding: "9px 16px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}>Fin ⏭</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------- MES CONTACTS ET APPRENANTS ---------- */}
        {(onglet === "prospects" || onglet === "apprenants") && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: 0 }}>
                {onglet === "apprenants"
                  ? "APPRENANTS (" + apprenants.length + ")"
                  : "MES CONTACTS (" + listeProspects.length + ")"}
              </h2>

              {onglet === "prospects" && perdus.length > 0 && (
                <button
                  onClick={() => setMasquerPerdus(!masquerPerdus)}
                  style={{ ...BOUTON, color: masquerPerdus ? "rgba(255,255,255,0.5)" : "#e8836a", borderColor: masquerPerdus ? "rgba(200,169,110,0.3)" : "rgba(232,131,106,0.5)" }}
                >
                  {masquerPerdus ? "Afficher les " + perdus.length + " perdu(s)" : "Masquer les perdus"}
                </button>
              )}
            </div>

            {(onglet === "apprenants" ? apprenants : listeProspects).length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>
                {onglet === "apprenants"
                  ? "Aucun apprenant en cours. Un contact devient apprenant dès qu'il commence une formation."
                  : "Aucun contact — ajoutez le premier !"}
              </p>
            ) : (
              (onglet === "apprenants" ? apprenants : listeProspects).map(p => {
                const estPerdu = p.statut === "perdu";
                const occupe = enCours === p.email;
                return (
                  <div key={p.id} style={{ ...CARTE, opacity: estPerdu ? 0.75 : 1, border: estPerdu ? "1px solid rgba(232,131,106,0.35)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{p.nom || "Sans nom"}</span>
                      </div>
                      <div style={{ background: p.score >= 60 ? "#ff6b35" : "rgba(200,169,110,0.2)", color: p.score >= 60 ? "#fff" : "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                        {p.score}pts
                      </div>
                    </div>

                    {estPerdu && (
                      <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                        <div style={{ color: "#e8836a", fontSize: "12.5px", fontWeight: "bold", marginBottom: "3px" }}>
                          Perdu{p.perdu_le ? " le " + jolieDate(p.perdu_le) : ""}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12.5px", lineHeight: "1.6" }}>
                          {p.motif_perte || "Aucun motif enregistré"}
                        </div>
                        <button
                          onClick={() => rouvrir(p.email)}
                          disabled={occupe}
                          style={{ ...BOUTON, marginTop: "10px", fontSize: "12px", padding: "5px 13px" }}
                        >
                          {occupe ? "Réouverture…" : "Rouvrir cette fiche"}
                        </button>
                      </div>
                    )}

                    {p.email && (
                      <div style={{ fontSize: "12.5px", marginBottom: "3px", wordBreak: "break-all" }}>
                        ✉️ <a href={"mailto:" + p.email} style={LIEN}>{p.email}</a>
                      </div>
                    )}
                    {p.telephone && (
                      <div style={{ fontSize: "12.5px", marginBottom: "8px" }}>
                        ☎️ <a href={"tel:" + appelable(p.telephone)} style={LIEN}>{p.telephone}</a>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px" }}>
                          {p.sms_accepte_le ? " · SMS accepté" : " · pas de consentement SMS"}
                        </span>
                      </div>
                    )}

                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "10px" }}>
                      {p.formation_interesse && <span style={{ marginRight: "10px" }}>📚 {p.formation_interesse}</span>}
                      {p.domaine && <span style={{ marginRight: "10px" }}>🏷️ {p.domaine}</span>}
                      {p.source && <span>📍 {p.source}</span>}
                    </div>

                    {p.progression ? (
                      <div style={{ color: "#00e676", fontSize: "12.5px", marginBottom: "10px" }}>
                        🎓 {p.progression} % de sa formation · {p.modules_valides || 0} module(s) validé(s)
                        {p.formation_active ? " · " + p.formation_active : ""}
                      </div>
                    ) : null}

                    {p.notes && (
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "10px", lineHeight: "1.7" }}>{p.notes}</div>
                    )}

                    {p.desinscrit && (
                      <div style={{ color: "#e8836a", fontSize: "12.5px", marginBottom: "10px" }}>
                        Désinscrit — ne reçoit plus de messages
                      </div>
                    )}

                    {!estPerdu && (
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <button onClick={() => { analyser(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                          🤖 Analyser
                        </button>
                        <button onClick={() => { relancer(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                          📧 Relancer
                        </button>
                      </div>
                    )}

                    {!estPerdu && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => basculerRelanceAuto(p.email, !p.relance_auto)}
                          disabled={occupe}
                          style={{
                            flex: 1, minWidth: "150px",
                            background: p.relance_auto ? "rgba(68,138,255,0.18)" : "rgba(255,255,255,0.05)",
                            color: p.relance_auto ? "#448aff" : "rgba(255,255,255,0.5)",
                            border: p.relance_auto ? "1px solid rgba(68,138,255,0.5)" : "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: occupe ? "wait" : "pointer",
                          }}
                        >
                          {p.relance_auto ? "🔔 Relance auto armée" : "🔕 Relance auto désarmée"}
                        </button>

                        <button
                          onClick={() => { setFichePerdu(fichePerdu === p.email ? "" : p.email); setMotifChoisi(""); setPrecision(""); setMessageErreur(""); }}
                          disabled={occupe}
                          style={{ flex: 1, minWidth: "150px", background: "rgba(232,131,106,0.1)", color: "#e8836a", border: "1px solid rgba(232,131,106,0.35)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: occupe ? "wait" : "pointer" }}
                        >
                          ❌ Perdu
                        </button>
                      </div>
                    )}

                    {fichePerdu === p.email && !estPerdu && (
                      <div style={{ marginTop: "12px", padding: "14px", background: "rgba(232,131,106,0.07)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px" }}>
                        <label style={{ color: "#e8836a", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                          Pourquoi ce contact est-il perdu ?
                        </label>
                        <select value={motifChoisi} onChange={e => setMotifChoisi(e.target.value)} style={{ ...CHAMP, marginBottom: "10px" }}>
                          <option value="">Choisir un motif…</option>
                          {MOTIFS_PERTE.map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>

                        <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                          Précision (facultative)
                        </label>
                        <textarea
                          value={precision}
                          onChange={e => setPrecision(e.target.value)}
                          rows={2}
                          placeholder="Ce qu'il a dit exactement…"
                          style={{ ...CHAMP, marginBottom: "10px", resize: "vertical" }}
                        />

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => marquerPerdu(p.email)}
                            disabled={occupe || !motifChoisi}
                            style={{ flex: 1, minWidth: "140px", background: motifChoisi ? "#e8836a" : "rgba(232,131,106,0.3)", color: "#050508", border: "none", borderRadius: "6px", padding: "10px", fontSize: "12.5px", fontWeight: "bold", cursor: motifChoisi ? "pointer" : "not-allowed" }}
                          >
                            {occupe ? "Enregistrement…" : "Enregistrer la perte"}
                          </button>
                          <button
                            onClick={() => { setFichePerdu(""); setMotifChoisi(""); setPrecision(""); }}
                            style={{ ...BOUTON, flex: 1, minWidth: "110px", borderRadius: "6px", padding: "10px" }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {onglet === "ajouter" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>AJOUTER UN CONTACT</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Nom", key: "nom", placeholder: "Jean Dupont" },
                { label: "Email *", key: "email", placeholder: "jean@email.com" },
                { label: "Téléphone", key: "telephone", placeholder: "+33 6 00 00 00 00" },
                { label: "Formation intéressée", key: "formation_interesse", placeholder: "Relaxation dynamique" },
                { label: "Notes", key: "notes", placeholder: "A contacté via le chat..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Source</label>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff" }}>
                  <option value="formulaire">Formulaire</option>
                  <option value="chat">Chat IA</option>
                  <option value="webinaire">Webinaire</option>
                  <option value="referral">Recommandation</option>
                  <option value="publicite">Publicité</option>
                  <option value="reseaux_sociaux">Réseaux sociaux</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#c8a96e", fontSize: "12px", display: "block", marginBottom: "5px" }}>Domaine</label>
                <select value={form.domaine} onChange={e => setForm(p => ({ ...p, domaine: e.target.value }))}
                  style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff" }}>
                  <option value="">Choisir...</option>
                  {["Interim", "ESN", "Organisme de formation", "IA", "Business", "Marketing", "Langues", "Bien-etre", "Tech", "Design", "Finance", "Droit", "Outils"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button onClick={ajouterProspect} disabled={loading || !form.email}
                style={{ width: "100%", background: form.email ? "#c8a96e" : "rgba(200,169,110,0.3)", color: "#050508", border: "none", borderRadius: "8px", padding: "14px", fontWeight: "bold", cursor: form.email ? "pointer" : "not-allowed", fontSize: "15px" }}>
                {loading ? "Ajout en cours..." : "➕ Ajouter le contact"}
              </button>
              {resultat?.succes && <div style={{ color: "#00e676", textAlign: "center", fontSize: "13px" }}>✅ Contact ajouté — Score: {resultat.score}pts</div>}
            </div>
          </div>
        )}

        {onglet === "resultat" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>RÉSULTAT IA</h2>
            {loading && <div style={{ color: "#c8a96e", textAlign: "center", padding: "40px" }}>Agent CRM en action...</div>}
            {resultat && !loading && (
              <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid rgba(200,169,110,0.3)" }}>
                {resultat.analyse && (
                  <div>
                    <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>🤖 ANALYSE CAM</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.7", fontSize: "13px" }}>{resultat.analyse}</div>
                  </div>
                )}
                {resultat.email_relance && (
                  <div>
                    <div style={{ color: "#00e676", fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>📧 EMAIL DE RELANCE</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.7", fontSize: "13px", whiteSpace: "pre-wrap" }}>{resultat.email_relance}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
