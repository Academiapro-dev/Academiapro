"use client";
import { useState, useEffect } from "react";

// CET ECRAN EST CELUI DE L EDITEUR : il montre les prospects d AcadeMIA Pro,
// ceux qui arrivent par les tunnels publics et n ont aucun organisme
// rattache. Les prospects des organismes clients restent sur /organisme/crm.
//
// LES SIX ONGLETS SONT UNE SEULE PORTE. Le 14 aout, le suivi commercial
// vivait a trois adresses qu il fallait retenir une par une. Les donnees ne
// fusionnent pas — la prospection de l editeur et celle d un client ne se
// croisent jamais — mais on n a plus a chercher ses outils a trois endroits.
const PORTEE = "editeur";

const FILTRES = [
  { cle: "", nom: "Tout" },
  { cle: "a_envoyer", nom: "A envoyer" },
  { cle: "envoyes", nom: "Deja contactes" },
  { cle: "avec_email", nom: "Avec adresse" },
  { cle: "avec_telephone", nom: "Avec telephone" },
  { cle: "a_enrichir", nom: "A enrichir" },
  { cle: "desabonnes", nom: "Desabonnes" },
];

export default function CRMPage() {
  const [stats, setStats] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [onglet, setOnglet] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", source: "formulaire", statut: "prospect", formation_interesse: "", domaine: "", notes: "" });

  // Les quatre bases de prospection, servies par /api/admin/prospection.
  const [bases, setBases] = useState<any>(null);
  const [base, setBase] = useState("");
  const [filtre, setFiltre] = useState("");
  const [cherche, setCherche] = useState("");
  const [saisie, setSaisie] = useState("");
  const [page, setPage] = useState(0);
  const [chargeBases, setChargeBases] = useState(false);
  const [erreurBases, setErreurBases] = useState("");

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

  // LE NUMERO DEVIENT UN APPEL. Sur iPad, tel: ouvre le combine et c est
  // l appareil qui compose : aucun cout, aucun fournisseur. La telephonie
  // facturee a la minute est un autre chantier.
  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  const onglets = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "bases", label: "🗂 Mes bases" },
    { id: "prospects", label: "👥 Prospects" },
    { id: "apprenants", label: "🎓 Apprenants" },
    { id: "ajouter", label: "➕ Ajouter" },
    { id: "resultat", label: "🤖 Résultat IA" },
  ];

  const LIEN: any = { color: "#c8a96e", textDecoration: "none", borderBottom: "1px dotted rgba(200,169,110,0.5)" };
  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };

  const apprenants = prospects.filter(function (p: any) {
    return (p.progression || 0) > 0 || p.formation_active;
  });

  const detail = bases && bases.detail ? bases.detail : null;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <h1 style={{ color: "#c8a96e", margin: 0, fontSize: "24px" }}>🎯 Mon CRM</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
          AcadémIA Pro · mes bases, mes prospects, mes apprenants
        </p>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: onglet === o.id ? "#c8a96e" : "rgba(255,255,255,0.08)", color: onglet === o.id ? "#050508" : "#fff", cursor: "pointer", whiteSpace: "nowrap", fontWeight: onglet === o.id ? "bold" : "normal" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "25px 20px", maxWidth: "980px", margin: "0 auto" }}>

        {onglet === "dashboard" && stats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "25px" }}>
              {[
                { label: "Total Prospects", value: stats.total || 0, color: "#c8a96e" },
                { label: "Prospects Chauds 🔥", value: stats.chauds || 0, color: "#ff6b35" },
                { label: "Clients ✅", value: stats.clients || 0, color: "#00e676" },
                { label: "Score Moyen", value: `${stats.score_moyen || 0}%`, color: "#448aff" },
                { label: "Actifs", value: stats.prospects || 0, color: "#c8a96e" },
                { label: "Taux Conversion", value: stats.total > 0 ? `${Math.round((stats.clients / stats.total) * 100)}%` : "0%", color: "#00e676" },
              ].map(item => (
                <div key={item.label} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: item.color }}>{item.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
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

        {/* ---------- MES BASES DE PROSPECTION ---------- */}
        {onglet === "bases" && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 16px" }}>
              {bases ? nombre(bases.total_general) + " prospects au total" : "Chargement…"}
            </p>

            {erreurBases && (
              <p style={{ color: "#e8836a", fontSize: "14px", lineHeight: "1.7" }}>{erreurBases}</p>
            )}

            {bases && bases.resume && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
                {bases.resume.map(function (r: any) {
                  const actif = base === r.cle;
                  return (
                    <div
                      key={r.cle}
                      onClick={() => { setBase(actif ? "" : r.cle); setFiltre(""); setCherche(""); setSaisie(""); setPage(0); }}
                      style={{
                        ...CARTE, flex: "1 1 220px", marginBottom: 0, cursor: "pointer",
                        border: actif ? "2px solid #c8a96e" : CARTE.border,
                        background: actif ? "rgba(200,169,110,0.08)" : CARTE.background,
                      }}
                    >
                      <div style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold", marginBottom: "3px" }}>{r.titre}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginBottom: "10px" }}>{r.cible}</div>
                      <div style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{nombre(r.total)}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12.5px", lineHeight: "1.6" }}>
                        {nombre(r.avec_email)} adresse(s) · {nombre(r.avec_telephone)} tél.
                      </div>
                      <div style={{ color: r.envoyes > 0 ? "#00e676" : "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.6" }}>
                        {nombre(r.envoyes)} contacté(s)
                        {r.a_envoyer > 0 ? " · " + nombre(r.a_envoyer) + " à envoyer" : ""}
                      </div>
                      {r.desabonnes > 0 && (
                        <div style={{ color: "#e8836a", fontSize: "12px", marginTop: "4px" }}>
                          {nombre(r.desabonnes)} désabonné(s)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!base && !chargeBases && (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "30px", fontSize: "14px" }}>
                Choisissez une base ci-dessus pour en parcourir le détail.
              </p>
            )}

            {detail && (
              <div>
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {FILTRES.map(function (f) {
                    const actif = filtre === f.cle;
                    return (
                      <button
                        key={f.cle || "tout"}
                        onClick={() => { setFiltre(f.cle); setPage(0); }}
                        style={{
                          ...BOUTON,
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

                <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <input
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setCherche(saisie.trim()); setPage(0); } }}
                    placeholder="Nom, ville ou SIREN"
                    style={{ flex: "1 1 260px", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif", boxSizing: "border-box" }}
                  />
                  <button onClick={() => { setCherche(saisie.trim()); setPage(0); }} style={{ ...BOUTON, padding: "11px 20px" }}>
                    Chercher
                  </button>
                  {cherche && (
                    <button onClick={() => { setSaisie(""); setCherche(""); setPage(0); }} style={{ ...BOUTON, padding: "11px 20px" }}>
                      Effacer
                    </button>
                  )}
                </div>

                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 12px" }}>
                  {nombre(detail.total_filtre)} ligne(s)
                  {detail.pages > 1 ? " · page " + (detail.page + 1) + " sur " + detail.pages : ""}
                </p>

                {chargeBases ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Chargement…</p>
                ) : detail.lignes.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Aucune ligne pour ce filtre.</p>
                ) : (
                  detail.lignes.map(function (l: any) {
                    return (
                      <div key={l.id} style={CARTE}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ flex: "1 1 280px" }}>
                            <div style={{ color: "#fff", fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>
                              {l.raison_sociale}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "6px" }}>
                              {l.ville || "ville inconnue"}
                              {l.code_postal ? " · " + l.code_postal : ""}
                              {l.siren ? " · SIREN " + l.siren : ""}
                              {detail.porte_vague && l.vague ? " · vague " + l.vague : ""}
                            </div>

                            {(l.dirigeant_prenom || l.dirigeant_nom) && (
                              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "4px" }}>
                                {l.dirigeant_prenom} {l.dirigeant_nom}
                              </div>
                            )}

                            {l.email && (
                              <div style={{ fontSize: "13px", marginBottom: "3px", wordBreak: "break-all" }}>
                                ✉️ <a href={"mailto:" + l.email} style={LIEN}>{l.email}</a>
                              </div>
                            )}
                            {l.telephone && (
                              <div style={{ fontSize: "13px", marginBottom: "3px" }}>
                                ☎️ <a href={"tel:" + appelable(l.telephone)} style={LIEN}>{l.telephone}</a>
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                                  {l.sms_accepte_le ? " · SMS accepté" : " · pas de consentement SMS"}
                                </span>
                              </div>
                            )}
                            {l.site_web && (
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", wordBreak: "break-all" }}>
                                {l.site_web}
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: "right", minWidth: "130px" }}>
                            {l.desabonne ? (
                              <div style={{ color: "#e8836a", fontSize: "12.5px", fontWeight: "bold" }}>Désabonné</div>
                            ) : l.statut === "envoye" ? (
                              <div style={{ color: "#00e676", fontSize: "12.5px", fontWeight: "bold" }}>
                                Contacté
                                {l.envoye_le && (
                                  <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: "normal", fontSize: "11.5px", marginTop: "2px" }}>
                                    le {new Date(l.envoye_le).toLocaleDateString("fr-FR")}
                                  </div>
                                )}
                              </div>
                            ) : l.email ? (
                              <div style={{ color: "#c8a96e", fontSize: "12.5px" }}>Joignable</div>
                            ) : (
                              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px" }}>
                                {l.dropcontact_le ? "Sans adresse" : "À enrichir"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {detail.pages > 1 && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "18px", flexWrap: "wrap" }}>
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ ...BOUTON, padding: "10px 20px", opacity: page === 0 ? 0.35 : 1 }}>
                      Précédent
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>
                      {page + 1} / {detail.pages}
                    </span>
                    <button onClick={() => setPage(page + 1)} disabled={page + 1 >= detail.pages} style={{ ...BOUTON, padding: "10px 20px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}>
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------- PROSPECTS ET APPRENANTS ---------- */}
        {(onglet === "prospects" || onglet === "apprenants") && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "15px" }}>
              {onglet === "apprenants"
                ? "APPRENANTS (" + apprenants.length + ")"
                : "PROSPECTS (" + prospects.length + ")"}
            </h2>

            {(onglet === "apprenants" ? apprenants : prospects).length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "50px" }}>
                {onglet === "apprenants"
                  ? "Aucun apprenant en cours. Un prospect devient apprenant dès qu'il commence une formation."
                  : "Aucun prospect — ajoutez le premier !"}
              </p>
            ) : (
              (onglet === "apprenants" ? apprenants : prospects).map(p => (
                <div key={p.id} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>{p.nom || "Sans nom"}</span>
                    </div>
                    <div style={{ background: p.score >= 60 ? "#ff6b35" : "rgba(200,169,110,0.2)", color: p.score >= 60 ? "#fff" : "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {p.score}pts
                    </div>
                  </div>

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

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { analyser(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                      🤖 Analyser
                    </button>
                    <button onClick={() => { relancer(p.email); setOnglet("resultat"); }} disabled={loading} style={{ flex: 1, background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "6px", padding: "8px", fontSize: "12px", cursor: "pointer" }}>
                      📧 Relancer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {onglet === "ajouter" && (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "16px", marginBottom: "20px" }}>AJOUTER UN PROSPECT</h2>
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
                {loading ? "Ajout en cours..." : "➕ Ajouter le prospect"}
              </button>
              {resultat?.succes && <div style={{ color: "#00e676", textAlign: "center", fontSize: "13px" }}>✅ Prospect ajouté — Score: {resultat.score}pts</div>}
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
