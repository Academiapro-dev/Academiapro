"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LE PORTEFEUILLE — 14/09.
//
// Les biens de l agence : ce qui est en vente, ce qui est sous compromis,
// ce qui est parti. Et ce qui manque pour qu une annonce soit conforme.
//
// 🚨 CE N EST PAS UN OUTIL DE DIFFUSION et l ecran ne le laisse pas croire.
// Aucune API publique SeLoger ou Leboncoin n existe ; la passerelle coute
// 3 000 a 8 000 EUR. Mesure du 14/09, decision de Jacques : on ne depense
// pas. ⛔ NE JAMAIS ECRIRE « publier » NI « diffuser » SUR CET ECRAN.
//
// 🚨 LE PRIX HORS HONORAIRES N EST PAS SAISISSABLE. Il s affiche, calcule
// par la route. Un champ de plus, c est un jour ou les deux prix se
// contredisent sur la meme annonce.
//
// ⚠️ LE DPE PERIME EST DIT EN ROUGE, en haut. Un diagnostic de plus de dix
// ans dans une annonce, c est l agence qui repond — pas nous, mais elle
// doit le voir sans avoir a y penser.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" };
const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };
const ETIQ: any = { display: "block", fontSize: "12.5px", color: "rgba(255,255,255,0.55)", marginBottom: "2px" };

const LIB_STATUT: any = {
  disponible: "Disponible", sous_offre: "Sous offre", sous_compromis: "Sous compromis",
  vendu: "Vendu", loue: "Loué", retire: "Retiré",
};
const LIB_TYPE: any = {
  appartement: "Appartement", maison: "Maison", terrain: "Terrain", local: "Local",
  immeuble: "Immeuble", parking: "Parking", autre: "Autre",
};

function euros(n: any) {
  if (n === null || n === undefined || n === "") return "—";
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

const VIDE: any = {
  reference: "", transaction: "vente", type_bien: "appartement", statut: "disponible",
  adresse: "", code_postal: "", ville: "", secteur: "",
  surface_habitable: "", surface_terrain: "", pieces: "", chambres: "", etage: "", annee_construction: "",
  description: "", dpe_lettre: "", ges_lettre: "", dpe_le: "",
  prix: "", honoraires_taux: "", honoraires_montant: "", honoraires_charge: "acquereur",
  loyer_charges: "", depot_garantie: "", meuble: false,
  copropriete: false, charges_mensuelles: "", lots_copropriete: "", taxe_fonciere: "",
  proprietaire_id: "",
};

export default function PageBiens() {
  const [biens, setBiens] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [dpePerimes, setDpePerimes] = useState(0);
  const [fermes, setFermes] = useState(false);

  const [formulaire, setFormulaire] = useState<any>(null);
  const [proprietaire, setProprietaire] = useState<any>(null);
  const [nomProprio, setNomProprio] = useState("");

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const f = p.get("fiche") || "";
    const n = p.get("nom") || "";
    if (f) {
      setNomProprio(n);
      setFormulaire({ ...VIDE, proprietaire_id: f });
    }
    charger(false);
  }, []);

  async function charger(avecFermes: boolean) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/biens" + (avecFermes ? "?fermes=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setBiens(d.biens || []);
        setTotal(d.total_portefeuille || 0);
        setDpePerimes(d.dpe_perimes || 0);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function ouvrir(id: string) {
    setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/biens?bien=" + encodeURIComponent(id), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        const b: any = { ...VIDE };
        for (const k of Object.keys(VIDE)) {
          if (d.bien[k] !== null && d.bien[k] !== undefined) b[k] = d.bien[k];
        }
        b.id = d.bien.id;
        b.proprietaire_id = d.bien.proprietaire_id || "";
        setFormulaire(b);
        setProprietaire(d.proprietaire || null);
        setNomProprio(d.proprietaire ? (d.proprietaire.nom || d.proprietaire.organisme || "") : "");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
  }

  function maj(champ: string, valeur: any) {
    setFormulaire({ ...formulaire, [champ]: valeur });
  }

  async function enregistrer() {
    if (!formulaire) return;
    setOccupe("enr"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/biens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formulaire, action: formulaire.id ? "modifier" : "creer" }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message);
        await charger(fermes);
        if (d.bien) await ouvrir(d.bien.id);
      } else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe("");
  }

  async function changerStatut(statut: string) {
    if (!formulaire || !formulaire.id) return;
    setOccupe("st"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/biens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "statut", id: formulaire.id, statut: statut }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message);
        maj("statut", statut);
        const doitVoir = ["vendu", "loue", "retire"].indexOf(statut) >= 0;
        if (doitVoir && !fermes) setFermes(true);
        await charger(doitVoir ? true : fermes);
      } else setErreur(d.erreur || "Action impossible.");
    } catch (e: any) { setErreur("Action impossible : " + String(e)); }
    setOccupe("");
  }

  async function supprimer() {
    if (!formulaire || !formulaire.id) return;
    if (!confirm("Supprimer ce bien définitivement ?")) return;
    setOccupe("sup"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/biens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "supprimer", id: formulaire.id }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); setFormulaire(null); await charger(fermes); }
      else setErreur(d.erreur || "Suppression impossible.");
    } catch (e: any) { setErreur("Suppression impossible : " + String(e)); }
    setOccupe("");
  }

  // Ce que l annonce dira, calcule pendant la saisie. Le meme calcul que la
  // route, pour que rien ne surprenne a l enregistrement.
  const prixSaisi = Number(String(formulaire ? formulaire.prix : "").replace(",", ".")) || 0;
  const tauxSaisi = Number(String(formulaire ? formulaire.honoraires_taux : "").replace(",", ".")) || 0;
  const montantSaisi = Number(String(formulaire ? formulaire.honoraires_montant : "").replace(",", ".")) || 0;
  const hono = tauxSaisi > 0 ? Math.round(prixSaisi * (tauxSaisi / 100)) : montantSaisi;
  const horsHono = formulaire && formulaire.honoraires_charge === "acquereur" ? prixSaisi - hono : prixSaisi;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>PORTEFEUILLE</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes biens</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Chaque bien porte ce qu&apos;une annonce doit dire : le prix, la part des honoraires
          et qui les paie, le diagnostic.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {/* ---- LES COMPTEURS ---- */}
        {!chargement && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "18px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(total)}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>de portefeuille en cours</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0, borderColor: dpePerimes > 0 ? "rgba(232,131,106,0.5)" : CARTE.border }}>
              <p style={{ color: dpePerimes > 0 ? ROUGE : "rgba(255,255,255,0.5)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{dpePerimes}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>diagnostic(s) de plus de dix ans</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
          {!formulaire && (
            <button onClick={() => { setFormulaire({ ...VIDE }); setProprietaire(null); setNomProprio(""); }} style={BOUTON}>
              Ajouter un bien
            </button>
          )}
          <button onClick={() => { const v = !fermes; setFermes(v); charger(v); }} style={SECOND}>
            {fermes ? "Masquer les biens sortis" : "Voir aussi les biens vendus, loués ou retirés"}
          </button>
        </div>

        {/* ---- LE FORMULAIRE ---- */}
        {formulaire && (
          <div style={{ ...CARTE, borderColor: OR }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>
                {formulaire.id ? "Modifier le bien" : "Nouveau bien"}
              </h2>
              <button onClick={() => setFormulaire(null)} style={SECOND}>Fermer</button>
            </div>

            {nomProprio && (
              <p style={{ color: OR, fontSize: "13.5px", margin: "0 0 12px" }}>
                Propriétaire : {nomProprio}
                {proprietaire && proprietaire.telephone ? " · " + proprietaire.telephone : ""}
              </p>
            )}

            <h3 style={{ color: OR, fontSize: "15px", margin: "18px 0 10px" }}>Ce que c&apos;est</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 150px" }}>
                <span style={ETIQ}>Référence</span>
                <input value={formulaire.reference} onChange={(e) => maj("reference", e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 160px" }}>
                <span style={ETIQ}>Vente ou location</span>
                <select value={formulaire.transaction} onChange={(e) => maj("transaction", e.target.value)} style={CHAMP}>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                </select>
              </div>
              <div style={{ flex: "0 1 170px" }}>
                <span style={ETIQ}>Type de bien</span>
                <select value={formulaire.type_bien} onChange={(e) => maj("type_bien", e.target.value)} style={CHAMP}>
                  {Object.keys(LIB_TYPE).map(function (t) {
                    return <option key={t} value={t}>{LIB_TYPE[t]}</option>;
                  })}
                </select>
              </div>
            </div>

            <h3 style={{ color: OR, fontSize: "15px", margin: "12px 0 10px" }}>Où</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "2 1 260px" }}>
                <span style={ETIQ}>Adresse</span>
                <input value={formulaire.adresse} onChange={(e) => maj("adresse", e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 120px" }}>
                <span style={ETIQ}>Code postal</span>
                <input value={formulaire.code_postal} onChange={(e) => maj("code_postal", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 170px" }}>
                <span style={ETIQ}>Ville</span>
                <input value={formulaire.ville} onChange={(e) => maj("ville", e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <span style={ETIQ}>Secteur</span>
                <input value={formulaire.secteur} onChange={(e) => maj("secteur", e.target.value)} style={CHAMP} />
              </div>
            </div>

            <h3 style={{ color: OR, fontSize: "15px", margin: "12px 0 10px" }}>Les mesures</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 140px" }}>
                <span style={ETIQ}>Surface (m²)</span>
                <input value={formulaire.surface_habitable} onChange={(e) => maj("surface_habitable", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 140px" }}>
                <span style={ETIQ}>Terrain (m²)</span>
                <input value={formulaire.surface_terrain} onChange={(e) => maj("surface_terrain", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 100px" }}>
                <span style={ETIQ}>Pièces</span>
                <input value={formulaire.pieces} onChange={(e) => maj("pieces", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 110px" }}>
                <span style={ETIQ}>Chambres</span>
                <input value={formulaire.chambres} onChange={(e) => maj("chambres", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 100px" }}>
                <span style={ETIQ}>Étage</span>
                <input value={formulaire.etage} onChange={(e) => maj("etage", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 130px" }}>
                <span style={ETIQ}>Construit en</span>
                <input value={formulaire.annee_construction} onChange={(e) => maj("annee_construction", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
            </div>

            <h3 style={{ color: OR, fontSize: "15px", margin: "12px 0 10px" }}>Le diagnostic</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 10px", lineHeight: 1.7 }}>
              Obligatoire dans toute annonce. Un diagnostic vaut dix ans.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 110px" }}>
                <span style={ETIQ}>DPE</span>
                <select value={formulaire.dpe_lettre} onChange={(e) => maj("dpe_lettre", e.target.value)} style={CHAMP}>
                  <option value="">—</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map(function (l) { return <option key={l} value={l}>{l}</option>; })}
                </select>
              </div>
              <div style={{ flex: "0 1 110px" }}>
                <span style={ETIQ}>GES</span>
                <select value={formulaire.ges_lettre} onChange={(e) => maj("ges_lettre", e.target.value)} style={CHAMP}>
                  <option value="">—</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map(function (l) { return <option key={l} value={l}>{l}</option>; })}
                </select>
              </div>
              <div style={{ flex: "0 1 180px" }}>
                <span style={ETIQ}>Établi le</span>
                <input type="date" value={formulaire.dpe_le} onChange={(e) => maj("dpe_le", e.target.value)} style={CHAMP} />
              </div>
            </div>

            <h3 style={{ color: OR, fontSize: "15px", margin: "12px 0 10px" }}>Le prix</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 170px" }}>
                <span style={ETIQ}>
                  {formulaire.transaction === "location" ? "Loyer mensuel (€)" : "Prix affiché (€)"}
                </span>
                <input value={formulaire.prix} onChange={(e) => maj("prix", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 140px" }}>
                <span style={ETIQ}>Honoraires (%)</span>
                <input value={formulaire.honoraires_taux} onChange={(e) => maj("honoraires_taux", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 160px" }}>
                <span style={ETIQ}>ou en euros</span>
                <input value={formulaire.honoraires_montant} onChange={(e) => maj("honoraires_montant", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 190px" }}>
                <span style={ETIQ}>À la charge de</span>
                <select value={formulaire.honoraires_charge} onChange={(e) => maj("honoraires_charge", e.target.value)} style={CHAMP}>
                  <option value="acquereur">L&apos;acquéreur</option>
                  <option value="vendeur">Le vendeur</option>
                </select>
              </div>
            </div>

            <p style={{ color: "#fff", fontSize: "15px", margin: "4px 0 14px" }}>
              Ce que l&apos;annonce dira : <span style={{ color: OR, fontWeight: "bold" }}>{euros(prixSaisi)}</span>
              {hono > 0 ? (
                <>
                  {" "}dont <span style={{ color: OR }}>{euros(hono)}</span> d&apos;honoraires à la charge{" "}
                  {formulaire.honoraires_charge === "acquereur" ? "de l'acquéreur" : "du vendeur"}
                  {formulaire.honoraires_charge === "acquereur" ? " · soit " + euros(horsHono) + " hors honoraires" : ""}
                </>
              ) : " · honoraires non renseignés"}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 170px" }}>
                <span style={ETIQ}>Charges mensuelles (€)</span>
                <input value={formulaire.charges_mensuelles} onChange={(e) => maj("charges_mensuelles", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={ETIQ}>Taxe foncière (€)</span>
                <input value={formulaire.taxe_fonciere} onChange={(e) => maj("taxe_fonciere", e.target.value)} inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={ETIQ}>Lots de copropriété</span>
                <input value={formulaire.lots_copropriete} onChange={(e) => maj("lots_copropriete", e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 14px", fontSize: "14px" }}>
              <input type="checkbox" checked={formulaire.copropriete === true} onChange={(e) => maj("copropriete", e.target.checked)} style={{ width: 17, height: 17 }} />
              <span>Le bien est en copropriété</span>
            </label>

            <span style={ETIQ}>Description</span>
            <textarea value={formulaire.description} onChange={(e) => maj("description", e.target.value)} rows={4} style={{ ...CHAMP, resize: "vertical" }} />

            <button onClick={enregistrer} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "enr" ? "Enregistrement…" : "Enregistrer le bien"}
            </button>

            {formulaire.id && (
              <>
                <h3 style={{ color: OR, fontSize: "15px", margin: "24px 0 10px" }}>Où en est ce bien ?</h3>
                <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                  {Object.keys(LIB_STATUT).map(function (s) {
                    const courant = formulaire.statut === s;
                    return (
                      <button
                        key={s}
                        onClick={() => changerStatut(s)}
                        disabled={occupe !== "" || courant}
                        style={{
                          ...SECOND,
                          background: courant ? "rgba(200,169,110,0.18)" : "none",
                          opacity: courant ? 0.55 : 1,
                          cursor: courant ? "default" : "pointer",
                        }}
                      >
                        {LIB_STATUT[s]}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={supprimer}
                  disabled={occupe !== ""}
                  style={{ ...SECOND, marginTop: "16px", borderColor: "rgba(232,131,106,0.45)", color: ROUGE }}
                >
                  Supprimer ce bien
                </button>
              </>
            )}
          </div>
        )}

        {/* ---- LA LISTE ---- */}
        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : biens.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucun bien au portefeuille. Ajoutez le premier ci-dessus — ou partez d&apos;une
              fiche dans <a href="/organisme/crm" style={{ color: OR }}>Mon CRM</a> pour que le
              propriétaire soit déjà rempli.
            </p>
          </div>
        ) : (
          biens.map(function (b: any) {
            return (
              <div
                key={b.id}
                onClick={() => ouvrir(b.id)}
                style={{
                  ...CARTE, cursor: "pointer", marginBottom: "10px",
                  borderColor: b.dpe_expire ? "rgba(232,131,106,0.45)" : CARTE.border,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 280px" }}>
                    <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px", fontWeight: "bold" }}>
                      {LIB_TYPE[b.type_bien] || b.type_bien}
                      {b.surface_habitable ? " · " + b.surface_habitable + " m²" : ""}
                      {b.pieces ? " · " + b.pieces + " pièces" : ""}
                      {b.ville ? " · " + b.ville : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                      {b.reference ? "Réf. " + b.reference + " · " : ""}
                      {LIB_STATUT[b.statut] || b.statut}
                      {b.proprietaire ? " · " + b.proprietaire : ""}
                      {b.dpe_lettre ? " · DPE " + b.dpe_lettre : " · sans DPE"}
                    </p>
                    {b.dpe_expire && (
                      <p style={{ color: ROUGE, fontSize: "12.5px", margin: "5px 0 0" }}>
                        Diagnostic de plus de dix ans — à refaire avant toute annonce.
                      </p>
                    )}
                  </div>
                  <p style={{ color: OR, fontSize: "17px", margin: 0, fontWeight: "bold", whiteSpace: "nowrap" }}>
                    {euros(b.prix)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
