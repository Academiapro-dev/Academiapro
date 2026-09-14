"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LES ECHEANCIERS — 14/09.
//
// CE QU ON OUVRE LE MATIN : ce qui est en retard, en haut, avec le
// montant. Le reste vient apres.
//
// ⚠️ POINTER UN REGLEMENT S ADDITIONNE. Le champ propose le SOLDE restant,
// mais un versement partiel s ajoute a ce qui est deja paye — jamais il ne
// l ecrase. C est le defaut du 06/08 sur les encaissements ; il ne se
// refait pas.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "12px 22px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

function euros(n: any) { return (Number(n) || 0).toFixed(2).replace(".", ",") + " €"; }
function jolie(d: any) {
  if (!d) return "—";
  try { return new Date(String(d) + (String(d).length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("fr-FR"); } catch (e) { return String(d); }
}

export default function PageEcheances() {
  const [lignes, setLignes] = useState<any[]>([]);
  const [enRetard, setEnRetard] = useState(0);
  const [aVenir, setAVenir] = useState(0);
  const [totalRetard, setTotalRetard] = useState(0);

  const [factures, setFactures] = useState<any[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [facture, setFacture] = useState("");
  const [nombre, setNombre] = useState("3");
  const [premiere, setPremiere] = useState("");
  const [tousLes, setTousLes] = useState("30");

  const [regle, setRegle] = useState("");
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("virement");

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const r = await fetch("/api/organisme/echeances");
      const d = await r.json();
      if (d.ok) {
        setLignes(d.echeances || []);
        setEnRetard(d.en_retard || 0);
        setAVenir(d.a_venir || 0);
        setTotalRetard(d.total_retard || 0);
      } else setErreur(d.erreur || "Lecture impossible.");

      // 🚨 LA ROUTE S APPELLE « facture », AU SINGULIER — 14/09.
      //
      // Un premier jet appelait /api/organisme/factures : la route n existe
      // pas, Next rendait une page d erreur en HTML, et la lecture du JSON
      // echouait sur « SyntaxError ». Toute la page affichait alors une
      // erreur, alors que seul le menu des factures manquait.
      // ⚠️ ELLE EST DANS SON PROPRE try : une facturation indisponible ne
      // doit pas empecher de voir ses echeances.
      try {
        const rf = await fetch("/api/organisme/facture");
        const df = await rf.json();
        const liste = df && (df.factures || df.lignes || df.donnees);
        if (Array.isArray(liste)) setFactures(liste);
        else if (Array.isArray(df)) setFactures(df);
      } catch (e) {}
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function creer() {
    setOccupe("creer"); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/echeances", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "creer", facture_id: facture, nombre: Number(nombre) || 3, premiere_le: premiere || undefined, tous_les_jours: Number(tousLes) || 30 }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); setOuvert(false); await charger(); }
      else setErreur(d.erreur || "Création impossible.");
    } catch (e: any) { setErreur("Création impossible : " + String(e)); }
    setOccupe("");
  }

  async function pointer(l: any) {
    setOccupe("regle-" + l.id); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/echeances", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regler", id: l.id, montant: montant ? montant : undefined, mode: mode }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); setRegle(""); setMontant(""); await charger(); }
      else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe("");
  }

  const retards = lignes.filter(function (l: any) { return l.en_retard; });
  const suite = lignes.filter(function (l: any) { return !l.en_retard; });

  function bloc(l: any) {
    const f = l.facture || {};
    return (
      <div key={l.id} style={{ ...CARTE, marginBottom: "10px", borderColor: l.en_retard ? "rgba(232,131,106,0.45)" : CARTE.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
              {f.destinataire_nom || "Client"}
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", marginLeft: "8px" }}>
                facture {f.numero || "—"} · échéance {l.rang}
              </span>
            </h3>
            <p style={{ color: l.en_retard ? ROUGE : "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0 }}>
              {euros(l.reste)} dû{l.en_retard ? " — en retard depuis le " : " le "}{jolie(l.due_le)}
              {Number(l.montant_regle) > 0 ? " · déjà réglé " + euros(l.montant_regle) : ""}
              {Number(l.relances) > 0 ? " · " + l.relances + " relance(s)" : ""}
            </p>
          </div>
          <button onClick={() => { setRegle(regle === l.id ? "" : l.id); setMontant(""); }} style={SECOND}>
            {regle === l.id ? "Fermer" : "Pointer un règlement"}
          </button>
        </div>

        {regle === l.id && (
          <div style={{ marginTop: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 9px", lineHeight: 1.7 }}>
              Laissez vide pour solder l&apos;échéance ({euros(l.reste)}). Un montant plus
              petit s&apos;ajoute à ce qui est déjà réglé, il ne le remplace pas.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "0 1 160px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Montant reçu</span>
                <input value={montant} onChange={(e) => setMontant(e.target.value)} placeholder={String(l.reste)} inputMode="decimal" style={{ ...CHAMP, marginBottom: 0 }} />
              </div>
              <div style={{ flex: "0 1 170px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Mode</span>
                <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                  <option value="carte">Carte</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <button onClick={() => pointer(l)} disabled={occupe !== ""} style={BOUTON}>
                {occupe === "regle-" + l.id ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>RÈGLEMENTS</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes échéances</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Qui doit quoi, à quelle date. Une facture peut se régler en plusieurs fois ; les
          retards sont relancés automatiquement.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {!chargement && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "20px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0, borderColor: enRetard > 0 ? "rgba(232,131,106,0.5)" : CARTE.border }}>
              <p style={{ color: enRetard > 0 ? ROUGE : "rgba(255,255,255,0.5)", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(totalRetard)}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                en retard · {enRetard} échéance(s)
              </p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{aVenir}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>à venir</p>
            </div>
          </div>
        )}

        {!ouvert && <button onClick={() => setOuvert(true)} style={{ ...BOUTON, marginBottom: "20px" }}>Créer un échéancier</button>}

        {ouvert && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 12px" }}>Découper une facture en plusieurs règlements</h2>
            <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)" }}>Quelle facture ?</span>
            <select value={facture} onChange={(e) => setFacture(e.target.value)} style={CHAMP}>
              <option value="">— choisir —</option>
              {factures.map(function (f: any) {
                return <option key={f.id} value={f.id}>{f.numero} · {f.destinataire_nom} · {euros(f.montant_ttc)}</option>;
              })}
            </select>
            {factures.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: "-4px 0 12px" }}>
                Aucune facture. <a href="/organisme/facturation" style={{ color: OR }}>En émettre une</a>.
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 140px" }}>
                <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)" }}>En combien de fois</span>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 180px" }}>
                <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)" }}>Première échéance</span>
                <input type="date" value={premiere} onChange={(e) => setPremiere(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)" }}>Tous les (jours)</span>
                <input value={tousLes} onChange={(e) => setTousLes(e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
            </div>

            <button onClick={creer} disabled={occupe !== "" || !facture} style={{ ...BOUTON, opacity: facture ? 1 : 0.5 }}>
              {occupe === "creer" ? "Création…" : "Créer l'échéancier"}
            </button>
            <button onClick={() => setOuvert(false)} style={{ ...SECOND, marginLeft: "12px" }}>Annuler</button>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "12px 0 0", lineHeight: 1.7 }}>
              Le montant se partage à parts égales ; la dernière échéance porte l&apos;arrondi,
              pour que le total fasse exactement la facture.
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : lignes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucune échéance en attente. Tout est réglé, ou aucun échéancier n&apos;a encore
              été créé.
            </p>
          </div>
        ) : (
          <>
            {retards.length > 0 && (
              <>
                <h2 style={{ color: ROUGE, fontSize: "18px", margin: "24px 0 12px" }}>En retard</h2>
                {retards.map(bloc)}
              </>
            )}
            {suite.length > 0 && (
              <>
                <h2 style={{ color: OR, fontSize: "18px", margin: "24px 0 12px" }}>À venir</h2>
                {suite.map(bloc)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
