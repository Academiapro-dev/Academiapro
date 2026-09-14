"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LES RECHERCHES ET LE RAPPROCHEMENT — 14/09.
//
// CE QU ON OUVRE LE MATIN : qui appeler, et pour quel bien. C est la seule
// chose qu un CRM immobilier fait et qu un generaliste ne fait pas.
//
// 🚨 QUAND RIEN NE REMONTE, L ECRAN DIT POURQUOI. « Aucun bien » tout seul
// fait croire a une panne ; « 12 biens ecartes : 9 pour le secteur, 3 pour
// le budget » se comprend et se corrige. C est ce qui fait qu on revient
// sur cet ecran le lendemain.
//
// 🚨 UN CRITERE LAISSE VIDE N EXCLUT PERSONNE, et l ecran le dit sous les
// champs : quelqu un qui ne remplit que la ville doit voir tout ce qui s y
// trouve, pas une liste vide.
//
// ⚠️ « PROPOSE » RETIRE LE BIEN DE LA LISTE pour ce client. C est voulu :
// sans cela le meme bien reapparait chaque matin et l agent cesse de
// regarder. Le bouton « revoir ce qui a deja ete propose » les ramene.
//
// ⚠️ LE TELEPHONE EST AFFICHE A COTE DU NOM. Un ecran qui dit « appelez
// Dupont » sans son numero oblige a rouvrir une fiche : autant ne rien
// dire.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" };
const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
const ETIQ: any = { display: "block", fontSize: "12.5px", color: "rgba(255,255,255,0.55)", marginBottom: "2px" };

const LIB_TYPE: any = {
  appartement: "Appartement", maison: "Maison", terrain: "Terrain", local: "Local",
  immeuble: "Immeuble", parking: "Parking", autre: "Autre",
};
const TYPES = ["appartement", "maison", "terrain", "local", "immeuble", "parking", "autre"];

function euros(n: any) {
  if (n === null || n === undefined || n === "") return "—";
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

const VIDE: any = {
  intitule: "", transaction: "vente", types: [], villes: "", codes_postaux: "",
  budget_min: "", budget_max: "", surface_min: "", pieces_min: "", chambres_min: "",
  dpe_max: "", notes: "",
};

export default function PageRecherches() {
  const [recherches, setRecherches] = useState<any[]>([]);
  const [toutes, setToutes] = useState(false);

  const [formulaire, setFormulaire] = useState<any>(null);
  const [ficheId, setFicheId] = useState("");
  const [nomFiche, setNomFiche] = useState("");

  const [rappro, setRappro] = useState<any>(null);
  const [biens, setBiens] = useState<any[]>([]);
  const [ecartes, setEcartes] = useState<any>({});
  const [dejaProposes, setDejaProposes] = useState(0);
  const [revoir, setRevoir] = useState(false);

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const f = p.get("fiche") || "";
    const n = p.get("nom") || "";
    if (f) {
      setFicheId(f);
      setNomFiche(n);
      setFormulaire({ ...VIDE, intitule: n ? "Recherche — " + n : "" });
    }
    charger(false);
  }, []);

  async function charger(avecCloses: boolean) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/recherches" + (avecCloses ? "?tous=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setRecherches(d.recherches || []);
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function rapprocher(r: any, tous: boolean) {
    setErreur(""); setMessage("");
    setOccupe("rap");
    try {
      const rep = await fetch(
        "/api/organisme/recherches?rapprocher=" + encodeURIComponent(r.id) + (tous ? "&tous=1" : ""),
        { cache: "no-store" }
      );
      const d = await rep.json();
      if (d.ok) {
        setRappro(r);
        setBiens(d.biens || []);
        setEcartes(d.ecartes || {});
        setDejaProposes(d.deja_proposes || 0);
        setRevoir(tous);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setErreur(d.erreur || "Rapprochement impossible.");
    } catch (e: any) { setErreur("Rapprochement impossible : " + String(e)); }
    setOccupe("");
  }

  async function enregistrer() {
    if (!formulaire) return;
    setOccupe("enr"); setErreur(""); setMessage("");
    try {
      const rep = await fetch("/api/organisme/recherches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulaire,
          action: formulaire.id ? "modifier" : "creer",
          fiche_id: ficheId || undefined,
        }),
      });
      const d = await rep.json();
      if (d.ok) {
        setMessage(d.message);
        setFormulaire(null); setFicheId("");
        await charger(toutes);
        if (d.recherche) await rapprocher(d.recherche, false);
      } else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe("");
  }

  async function noter(bien: any, suite: string) {
    if (!rappro) return;
    let motif = "";
    if (suite === "ecarte") {
      const saisi = prompt("Pourquoi ce bien ne convient-il pas ?", "");
      if (saisi === null) return;
      motif = saisi;
    }
    setOccupe("n-" + bien.id); setErreur(""); setMessage("");
    try {
      const rep = await fetch("/api/organisme/recherches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "noter", recherche_id: rappro.id, bien_id: bien.id,
          suite: suite, motif: motif || undefined,
        }),
      });
      const d = await rep.json();
      if (d.ok) { setMessage(d.message); await rapprocher(rappro, revoir); }
      else setErreur(d.erreur || "Action impossible.");
    } catch (e: any) { setErreur("Action impossible : " + String(e)); }
    setOccupe("");
  }

  async function changerStatut(r: any, statut: string) {
    setOccupe("st"); setErreur(""); setMessage("");
    try {
      const rep = await fetch("/api/organisme/recherches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "statut", id: r.id, statut: statut }),
      });
      const d = await rep.json();
      if (d.ok) { setMessage(d.message); setRappro(null); await charger(toutes); }
      else setErreur(d.erreur || "Action impossible.");
    } catch (e: any) { setErreur("Action impossible : " + String(e)); }
    setOccupe("");
  }

  function maj(champ: string, valeur: any) {
    setFormulaire({ ...formulaire, [champ]: valeur });
  }

  function basculerType(t: string) {
    const actuels = Array.isArray(formulaire.types) ? formulaire.types : [];
    const dedans = actuels.indexOf(t) >= 0;
    maj("types", dedans ? actuels.filter(function (x: string) { return x !== t; }) : actuels.concat([t]));
  }

  const nomsEcartes = Object.keys(ecartes);
  const totalEcartes = nomsEcartes.reduce(function (s, k) { return s + ecartes[k]; }, 0);

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>RAPPROCHEMENT</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Qui cherche quoi</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Ce que cherchent vos acquéreurs, et ce que votre portefeuille peut leur proposer
          aujourd&apos;hui.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {/* ---- LE RAPPROCHEMENT ---- */}
        {rappro && (
          <div style={{ ...CARTE, borderColor: OR, marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 3px" }}>
                  {rappro.contact || "Ce contact"}
                  {rappro.telephone ? <span style={{ color: OR, fontSize: "15px", fontWeight: "normal" }}> · {rappro.telephone}</span> : null}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0 }}>
                  {rappro.intitule || "Recherche"} · {rappro.transaction === "location" ? "location" : "achat"}
                  {rappro.budget_max ? " · jusqu'à " + euros(rappro.budget_max) : ""}
                  {rappro.villes && rappro.villes.length > 0 ? " · " + rappro.villes.join(", ") : ""}
                </p>
              </div>
              <button onClick={() => setRappro(null)} style={SECOND}>Fermer</button>
            </div>

            {biens.length === 0 ? (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 8px" }}>
                  Rien à proposer à ce client aujourd&apos;hui.
                </p>
                {totalEcartes > 0 && (
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: 0, lineHeight: 1.8 }}>
                    {totalEcartes} bien(s) écarté(s) —{" "}
                    {nomsEcartes.map(function (k, i) {
                      return (i > 0 ? ", " : "") + ecartes[k] + " pour « " + k + " »";
                    }).join("")}
                    .
                  </p>
                )}
                {dejaProposes > 0 && !revoir && (
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: "6px 0 0" }}>
                    {dejaProposes} bien(s) lui ont déjà été proposés.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: OR, fontSize: "15px", margin: "0 0 12px", fontWeight: "bold" }}>
                  {biens.length} bien(s) à lui proposer
                </p>
                {biens.map(function (b: any) {
                  return (
                    <div key={b.id} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px", padding: "12px 14px", marginBottom: "9px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 260px" }}>
                          <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 3px", fontWeight: "bold" }}>
                            {LIB_TYPE[b.type_bien] || b.type_bien}
                            {b.surface_habitable ? " · " + b.surface_habitable + " m²" : ""}
                            {b.pieces ? " · " + b.pieces + " pièces" : ""}
                            {b.ville ? " · " + b.ville : ""}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: 0 }}>
                            {b.reference ? "Réf. " + b.reference + " · " : ""}
                            {b.dpe_lettre ? "DPE " + b.dpe_lettre : "sans DPE"}
                            {b.deja_vu ? " · déjà " + b.deja_vu : ""}
                          </p>
                        </div>
                        <p style={{ color: OR, fontSize: "16px", margin: 0, fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {euros(b.prix)}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                        <button onClick={() => noter(b, "propose")} disabled={occupe !== ""} style={SECOND}>Proposé</button>
                        <button onClick={() => noter(b, "visite")} disabled={occupe !== ""} style={SECOND}>Visite</button>
                        <button onClick={() => noter(b, "offre")} disabled={occupe !== ""} style={{ ...SECOND, borderColor: "rgba(76,175,80,0.5)", color: VERT }}>Offre</button>
                        <button onClick={() => noter(b, "ecarte")} disabled={occupe !== ""} style={{ ...SECOND, borderColor: "rgba(232,131,106,0.45)", color: ROUGE }}>Ne convient pas</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "14px" }}>
              <button onClick={() => rapprocher(rappro, !revoir)} disabled={occupe !== ""} style={SECOND}>
                {revoir ? "Masquer ce qui a déjà été proposé" : "Revoir ce qui a déjà été proposé"}
              </button>
              <button onClick={() => changerStatut(rappro, "satisfaite")} disabled={occupe !== ""} style={{ ...SECOND, borderColor: "rgba(76,175,80,0.5)", color: VERT }}>
                Il a trouvé
              </button>
              <button onClick={() => changerStatut(rappro, "abandonnee")} disabled={occupe !== ""} style={{ ...SECOND, borderColor: "rgba(232,131,106,0.45)", color: ROUGE }}>
                Abandonner cette recherche
              </button>
            </div>
          </div>
        )}

        {/* ---- LE FORMULAIRE ---- */}
        {formulaire && (
          <div style={{ ...CARTE, borderColor: OR, marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>
                {formulaire.id ? "Modifier la recherche" : "Nouvelle recherche"}
              </h2>
              <button onClick={() => { setFormulaire(null); setFicheId(""); }} style={SECOND}>Fermer</button>
            </div>
            {nomFiche && (
              <p style={{ color: OR, fontSize: "13.5px", margin: "0 0 12px" }}>Pour {nomFiche}</p>
            )}
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 14px", lineHeight: 1.7 }}>
              Tout critère laissé vide n&apos;exclut rien. Un acquéreur qui n&apos;a pas donné son
              budget verra tous les biens de son secteur.
            </p>

            <span style={ETIQ}>Intitulé</span>
            <input value={formulaire.intitule} onChange={(e) => maj("intitule", e.target.value)} placeholder="Résidence principale, investissement locatif…" style={CHAMP} />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 170px" }}>
                <span style={ETIQ}>Achat ou location</span>
                <select value={formulaire.transaction} onChange={(e) => maj("transaction", e.target.value)} style={CHAMP}>
                  <option value="vente">Achat</option>
                  <option value="location">Location</option>
                </select>
              </div>
            </div>

            <span style={ETIQ}>Types acceptés <span style={{ color: "rgba(255,255,255,0.35)" }}>(aucun coché = tous)</span></span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "4px 0 14px" }}>
              {TYPES.map(function (t) {
                const dedans = Array.isArray(formulaire.types) && formulaire.types.indexOf(t) >= 0;
                return (
                  <button
                    key={t}
                    onClick={() => basculerType(t)}
                    style={{ ...SECOND, background: dedans ? "rgba(200,169,110,0.2)" : "none" }}
                  >
                    {LIB_TYPE[t]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={ETIQ}>Villes <span style={{ color: "rgba(255,255,255,0.35)" }}>(séparées par des virgules)</span></span>
                <input value={formulaire.villes} onChange={(e) => maj("villes", e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={ETIQ}>ou codes postaux</span>
                <input value={formulaire.codes_postaux} onChange={(e) => maj("codes_postaux", e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 160px" }}>
                <span style={ETIQ}>Budget min (€)</span>
                <input value={formulaire.budget_min} onChange={(e) => maj("budget_min", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 160px" }}>
                <span style={ETIQ}>Budget max (€)</span>
                <input value={formulaire.budget_max} onChange={(e) => maj("budget_max", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={ETIQ}>Surface min (m²)</span>
                <input value={formulaire.surface_min} onChange={(e) => maj("surface_min", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 130px" }}>
                <span style={ETIQ}>Pièces min</span>
                <input value={formulaire.pieces_min} onChange={(e) => maj("pieces_min", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 140px" }}>
                <span style={ETIQ}>Chambres min</span>
                <input value={formulaire.chambres_min} onChange={(e) => maj("chambres_min", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 130px" }}>
                <span style={ETIQ}>DPE au pire</span>
                <select value={formulaire.dpe_max} onChange={(e) => maj("dpe_max", e.target.value)} style={CHAMP}>
                  <option value="">—</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map(function (l) { return <option key={l} value={l}>{l}</option>; })}
                </select>
              </div>
            </div>

            <span style={ETIQ}>Notes</span>
            <textarea value={formulaire.notes} onChange={(e) => maj("notes", e.target.value)} rows={3} style={{ ...CHAMP, resize: "vertical" }} />

            <button onClick={enregistrer} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "enr" ? "Enregistrement…" : "Enregistrer et rapprocher"}
            </button>
          </div>
        )}

        <button
          onClick={() => { const v = !toutes; setToutes(v); charger(v); }}
          style={{ ...SECOND, margin: "18px 0" }}
        >
          {toutes ? "Masquer les recherches closes" : "Voir aussi les recherches closes"}
        </button>

        {/* ---- LA LISTE ---- */}
        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : recherches.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucune recherche enregistrée. Ouvrez la fiche d&apos;un acquéreur dans{" "}
              <a href="/organisme/crm" style={{ color: OR }}>Mon CRM</a> et cliquez sur
              « Ce qu&apos;il cherche ».
            </p>
          </div>
        ) : (
          recherches.map(function (r: any) {
            return (
              <div key={r.id} style={{ ...CARTE, marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px", fontWeight: "bold" }}>
                      {r.contact || "Contact"}
                      {r.telephone ? <span style={{ color: OR, fontSize: "14px", fontWeight: "normal" }}> · {r.telephone}</span> : null}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0 }}>
                      {r.intitule || "Recherche"} · {r.transaction === "location" ? "location" : "achat"}
                      {r.statut !== "en_cours" ? " · " + (r.statut === "satisfaite" ? "a trouvé" : "abandonnée") : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "4px 0 0" }}>
                      {r.types && r.types.length > 0 ? r.types.map(function (t: string) { return LIB_TYPE[t] || t; }).join(", ") : "tous types"}
                      {r.villes && r.villes.length > 0 ? " · " + r.villes.join(", ") : ""}
                      {r.codes_postaux && r.codes_postaux.length > 0 ? " · " + r.codes_postaux.join(", ") : ""}
                      {r.budget_max ? " · jusqu'à " + euros(r.budget_max) : ""}
                      {r.surface_min ? " · " + r.surface_min + " m² min" : ""}
                      {r.pieces_min ? " · " + r.pieces_min + " pièces min" : ""}
                    </p>
                  </div>
                  {r.statut === "en_cours" && (
                    <button onClick={() => rapprocher(r, false)} disabled={occupe !== ""} style={BOUTON}>
                      {occupe === "rap" ? "…" : "Que puis-je lui proposer ?"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
