"use client";
import { useState, useEffect } from "react";

// CET ECRAN EST CELUI DE L EDITEUR : il montre les prospects d AcadeMIA Pro,
// ceux qui arrivent par les tunnels publics et n ont aucun organisme
// rattache. Les prospects des organismes clients restent sur /organisme/crm.
//
// DEUX MOTS DIFFERENTS POUR DEUX METIERS. « Prospection » designe les quatre
// bases froides — 69 000 entreprises collectees puis enrichies, que l on
// travaille au volume. « Mes contacts » designe les gens qui ont leve la
// main sur le site, que l on travaille un par un. Les appeler tous les deux
// « prospects » obligeait a chercher lequel on regardait.
const PORTEE = "editeur";

const FILTRES = [
  { cle: "", nom: "Tout" },
  { cle: "a_envoyer", nom: "A envoyer" },
  { cle: "envoyes", nom: "Deja contactes" },
  { cle: "avec_email", nom: "Avec adresse" },
  { cle: "avec_telephone", nom: "Avec telephone" },
  { cle: "avec_linkedin", nom: "Avec LinkedIn" },
  { cle: "a_enrichir", nom: "A enrichir" },
  { cle: "desabonnes", nom: "Desabonnes" },
];

// LES MOTIFS DE PERTE SONT UNE LISTE, PAS UN CHAMP LIBRE.
//
// Un champ libre produit autant de formulations que de fiches, et le
// regroupement du Dashboard ne montre plus rien. La liste sert au comptage,
// la precision libre sert a la memoire. Les deux sont enregistres dans la
// meme colonne, separes par un tiret cadratin : le regroupement ne retient
// que ce qui precede le tiret.
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

// LA PREMIERE BASE S OUVRE SEULE. Un ecran qui demande de choisir avant de
// rien montrer fait perdre un clic a chaque visite, et donne l impression
// d une base vide alors qu elle contient 69 000 lignes.
const BASE_PAR_DEFAUT = "organismes";

export default function CRMPage() {
  const [stats, setStats] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });

  // Les quatre bases de prospection, servies par /api/admin/prospection.
  const [bases, setBases] = useState<any>(null);
  const [base, setBase] = useState(BASE_PAR_DEFAUT);
  const [filtre, setFiltre] = useState("");
  const [cherche, setCherche] = useState("");
  const [saisie, setSaisie] = useState("");
  const [page, setPage] = useState(0);
  const [chargeBases, setChargeBases] = useState(false);
  const [erreurBases, setErreurBases] = useState("");

  // Perte, relance automatique et regroupement des motifs.
  const [motifs, setMotifs] = useState<any>(null);
  const [fichePerdu, setFichePerdu] = useState("");
  const [motifChoisi, setMotifChoisi] = useState("");
  const [precision, setPrecision] = useState("");
  const [enCours, setEnCours] = useState("");
  const [messageErreur, setMessageErreur] = useState("");
  const [masquerPerdus, setMasquerPerdus] = useState(true);

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

  // MARQUER PERDU. Le motif de la liste et la precision libre partent dans
  // la meme colonne, separes par le tiret cadratin.
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

  // ARMER OU DESARMER LA RELANCE AUTOMATIQUE POUR CETTE FICHE.
  //
  // Armer ne declenche rien aujourd hui : le second verrou, dans la route
  // /api/cron/relance-crm, reste ferme. Ce reglage prepare le jour ou il
  // s ouvrira.
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

  // LE NUMERO DEVIENT UN APPEL. Sur iPad, tel: ouvre le combine et c est
  // l appareil qui compose : aucun cout, aucun fournisseur. La telephonie
  // facturee a la minute est un autre chantier.
  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  // LE PROFIL LINKEDIN EST STOCKE SANS SCHEMA : « www.linkedin.com/in/x ».
  // Tel quel dans un href, le navigateur le prendrait pour un chemin
  // relatif et resterait sur academiapro.fr.
  function lienLinkedin(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  // Ce qu on affiche du profil : l identifiant, pas l adresse complete.
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

  // REGROUPEMENT DES MOTIFS. La route renvoie le texte complet de chaque
  // motif ; on n en retient ici que la partie qui precede le tiret, sans
  // quoi chaque precision libre creerait sa propre ligne.
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

  // LE TABLEAU. En-tete figee, colonnes fixes, lignes serrees : c est ce qui
  // permet de lire trente societes d un coup d oeil au lieu de cinq.
  const TH: any = { position: "sticky", top: 0, background: "#12121f", color: "#c8a96e", fontSize: "11.5px", fontWeight: "bold", textAlign: "left", padding: "9px 10px", borderBottom: "2px solid rgba(200,169,110,0.35)", whiteSpace: "nowrap", zIndex: 2 };
  const TD: any = { padding: "7px 10px", fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.85)" };

  const apprenants = prospects.filter(function (p: any) {
    return (p.progression || 0) > 0 || p.formation_active;
  });

  const perdus = prospects.filter(function (p: any) { return p.statut === "perdu"; });
  const armes = prospects.filter(function (p: any) { return !!p.relance_auto; });

  // Les perdus restent lisibles a la demande : la route ne les ecarte pas
  // des lectures, contrairement a ce que laissait entendre son commentaire.
  const listeProspects = masquerPerdus
    ? prospects.filter(function (p: any) { return p.statut !== "perdu"; })
    : prospects;

  const detail = bases && bases.detail ? bases.detail : null;
  const regroupes = motifsRegroupes();
  const totalMotifs = regroupes.reduce(function (s, m) { return s + m.nombre; }, 0);

  // Le filtre LinkedIn n a de sens que sur une base qui porte la colonne.
  const filtresVisibles = FILTRES.filter(function (f) {
    if (f.cle !== "avec_linkedin") return true;
    return detail ? !!detail.porte_linkedin : true;
  });

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>🎯 Mon CRM</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
          AcadémIA Pro · ma prospection, mes contacts, mes apprenants
        </p>
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
                { label: "Relance auto armée", value: armes.length, color: "#448aff" },
              ].map(item => (
                <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* ---------- POURQUOI ILS DISENT NON ---------- */}
            <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(232,131,106,0.25)" }}>
              <h3 style={{ color: "#e8836a", marginTop: 0, fontSize: "14px" }}>POURQUOI ILS DISENT NON</h3>
              {regroupes.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.7", margin: 0 }}>
                  Aucun contact perdu pour l'instant. Chaque fiche que vous marquez « Perdu » vient nourrir cette liste : au bout de quelques semaines, c'est elle qui montre où l'offre bloque.
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
                    {nombre(totalMotifs)} fiche(s) perdue(s). Le détail écrit sur chaque fiche reste consultable dans l'onglet Mes contacts.
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

        {/* ---------- PROSPECTION : LES QUATRE BASES ---------- */}
        {onglet === "bases" && (
          <div>
            {erreurBases && (
              <p style={{ color: "#e8836a", fontSize: "14px", lineHeight: "1.7" }}>{erreurBases}</p>
            )}

            {/* Les quatre bases deviennent un selecteur compact : une pastille
                par base, la selection ouvre le tableau juste dessous. */}
            {bases && bases.resume && (
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
                        {r.desabonnes > 0 ? " · " + nombre(r.desabonnes) + " désab." : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 14px" }}>
              {bases ? nombre(bases.total_general) + " entreprises dans les quatre bases" : "Chargement…"}
            </p>

            {detail && (
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
                    placeholder="Nom, ville, adresse ou SIREN"
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
                    <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1300px" }}>
                      <thead>
                        <tr>
                          <th style={TH}>Société</th>
                          <th style={TH}>Dirigeant</th>
                          <th style={TH}>Ville</th>
                          <th style={TH}>CP</th>
                          <th style={TH}>Adresse e-mail</th>
                          <th style={TH}>Téléphone</th>
                          {detail.porte_linkedin && <th style={TH}>LinkedIn</th>}
                          <th style={TH}>SMS</th>
                          <th style={TH}>État</th>
                          <th style={TH}>Contacté le</th>
                          <th style={TH}>Enrichi le</th>
                          <th style={TH}>SIREN</th>
                          {detail.porte_vague && <th style={TH}>Vague</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lignes.map(function (l: any, i: number) {
                          const fond = l.desabonne
                            ? "rgba(232,131,106,0.09)"
                            : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)");
                          return (
                            <tr key={l.id} style={{ background: fond }}>
                              <td style={{ ...TD, color: "#fff", fontWeight: "bold", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                                <td style={{ ...TD, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {l.linkedin
                                    ? <a href={lienLinkedin(l.linkedin)} target="_blank" rel="noreferrer" style={{ ...LIEN, color: "#448aff" }}>in/{nomLinkedin(l.linkedin)}</a>
                                    : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
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
                              <td style={{ ...TD, color: "rgba(255,255,255,0.4)" }}>{jolieDate(l.dropcontact_le) || "—"}</td>
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
                    <button onClick={() => setPage(0)} disabled={page === 0} style={{ ...BOUTON, padding: "9px 16px", opacity: page === 0 ? 0.35 : 1 }}>
                      ⏮ Début
                    </button>
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ ...BOUTON, padding: "9px 18px", opacity: page === 0 ? 0.35 : 1 }}>
                      Précédent
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>
                      {page + 1} / {detail.pages}
                    </span>
                    <button onClick={() => setPage(page + 1)} disabled={page + 1 >= detail.pages} style={{ ...BOUTON, padding: "9px 18px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}>
                      Suivant
                    </button>
                    <button onClick={() => setPage(detail.pages - 1)} disabled={page + 1 >= detail.pages} style={{ ...BOUTON, padding: "9px 16px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}>
                      Fin ⏭
                    </button>
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

                    {/* ---------- RELANCE AUTOMATIQUE ET PERTE ---------- */}
                    {!estPerdu && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => basculerRelanceAuto(p.email, !p.relance_auto)}
                          disabled={occupe}
                          style={{
                            flex: 1,
                            minWidth: "150px",
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
                          {MOTIFS_PERTE.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
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

                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px", marginBottom: 0, marginTop: "10px", lineHeight: "1.6" }}>
                          La fiche passe en perdu, sort des relances automatiques, et le motif rejoint le bloc « Pourquoi ils disent non » du Dashboard.
                        </p>
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
                { label: "Formation intéressée", key: "formation_interesse", placeholder: "Sophrologie Caycédienne" },
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
