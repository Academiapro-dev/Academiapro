"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// CREATION DE LLC A→Z — LE CHEMIN — 09/09.
// Un seul chemin d etapes, un seul bouton pour l etape suivante, chaque
// etape avec sa date et sa preuve. L attente de l IRS est une etape comme
// les autres. Routes : /api/compliance/creation (dossier), ss4/generate,
// ss4/transmettre, document-a-signer (chaine existante).
// ══════════════════════════════════════════════════════════════════════════
const OR = "#0a3d2e";
const CHAMP: any = { width: "100%", padding: 10, fontSize: 15, marginTop: 4, marginBottom: 14, border: "1px solid #ccc", borderRadius: 4, background: "#fff", color: "#1a1a1a", boxSizing: "border-box" };
const LIB: any = { display: "block", fontWeight: 600, fontSize: 14 };
const BOUTON: any = { background: OR, color: "#fff", border: "none", padding: "14px 24px", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 600 };
const SECOND: any = { ...BOUTON, background: "#fff", color: OR, border: "1px solid " + OR, fontSize: 14, padding: "10px 18px" };

const ACTIVITES = [["other", "Autre (préciser)"], ["finance", "Finance et assurance"], ["real_estate", "Immobilier"], ["retail", "Commerce de détail"], ["wholesale_other", "Commerce de gros"], ["construction", "Construction"], ["manufacturing", "Fabrication"], ["transport", "Transport et entreposage"], ["accommodation", "Hébergement et restauration"], ["health", "Santé et action sociale"], ["rental", "Location"]];

export default function PageCreation() {
  const [d, setD] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [occupe, setOccupe] = useState("");
  const [f, setF] = useState<any>({});
  const [saisie, setSaisie] = useState<any>({});
  const entite = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("entite_id") || "" : "";

  useEffect(function () { charger(); }, []);

  async function charger() {
    try {
      const r = await fetch("/api/compliance/creation" + (entite ? "?entite_id=" + entite : ""));
      const data = await r.json();
      if (data.success) {
        setD(data);
        const c = data.creation || {};
        setF({ responsable_nom: c.responsable_nom || "", nom_commercial: c.nom_commercial || "", comte_etat: c.comte_etat || "", nb_membres: String(c.nb_membres || 1), type_activite: c.type_activite || "", activite_code: c.activite_code || "other", activite_libelle: c.activite_libelle || "", date_debut: c.date_debut || "", mois_cloture: c.mois_cloture || "December", telephone: c.telephone || "" });
        // L etat du SS-4 (signature detectee en base).
        const r2 = await fetch("/api/compliance/ss4/transmettre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "etat", entite_id: data.entite.id }) });
        const e2 = await r2.json();
        if (e2.success && e2.statut !== c.statut) charger();
      } else setMsg("Erreur : " + (data.error || "inconnue"));
    } catch (e: any) { setMsg("Erreur : " + String(e)); }
  }

  async function poster(url: string, corps: any, apres?: (x: any) => void) {
    setOccupe(url + (corps.action || "")); setMsg("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entite_id: d.entite.id, ...corps }) });
      const data = await r.json();
      if (data.success) { if (data.message) setMsg(data.message); if (apres) apres(data); await charger(); }
      else setMsg("Erreur : " + (data.error || "inconnue"));
    } catch (e: any) { setMsg("Erreur : " + String(e)); }
    setOccupe("");
  }

  async function preparerEtSigner() {
    setOccupe("prep"); setMsg("");
    try {
      const r1 = await fetch("/api/compliance/ss4/transmettre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preparer", entite_id: d.entite.id }) });
      const d1 = await r1.json();
      if (!d1.success) { setMsg("Erreur : " + (d1.error || "inconnue")); setOccupe(""); return; }
      if (!d1.pret) { setMsg("Erreur : renseignez l'adresse de contact de la société (Ma société) : c'est elle qui signe."); setOccupe(""); return; }
      const r2 = await fetch("/api/compliance/document-a-signer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d1.document_a_signer) });
      const d2 = await r2.json();
      if (!d2.success || !d2.reference) { setMsg("Erreur à la création de l'accusé : " + (d2.error || "inconnue")); setOccupe(""); return; }
      const r3 = await fetch("/api/compliance/ss4/transmettre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lier", entite_id: d.entite.id, reference: d2.reference }) });
      const d3 = await r3.json();
      if (!d3.success) { setMsg("Erreur : " + (d3.error || "inconnue")); setOccupe(""); return; }
      const em = d2.email || {};
      setMsg("Accusé " + d2.reference + " envoyé à " + d1.document_a_signer.signataire_email + (em.envoye === true ? "." : " — ATTENTION : le courriel n'est pas parti. Lien : " + (d2.lien || "")));
      await charger();
    } catch (e: any) { setMsg("Erreur : " + String(e)); }
    setOccupe("");
  }

  if (!d) return <div style={{ fontFamily: "Georgia, serif", padding: 32, background: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>{msg || "Chargement…"}</div>;
  const c = d.creation || {};
  const st = c.statut || "agent_a_choisir";
  const idx = d.etape_index;

  function bouton() {
    if (st === "agent_a_choisir") return null;
    if (st === "statuts_a_deposer") return null;
    if (st === "ss4_a_generer") return <button onClick={() => poster("/api/compliance/ss4/generate", {})} disabled={occupe !== "" || !f.responsable_nom} style={{ ...BOUTON, opacity: !f.responsable_nom ? 0.5 : 1 }}>{occupe ? "…" : "3. Générer le SS-4"}</button>;
    if (st === "ss4_genere") return <button onClick={preparerEtSigner} disabled={occupe !== ""} style={BOUTON}>{occupe ? "…" : "4. Préparer l'accusé et faire signer"}</button>;
    if (st === "ss4_accuse_envoye") return <button onClick={() => charger()} style={BOUTON}>5. Vérifier la signature</button>;
    if (st === "ss4_signe") return <button onClick={() => poster("/api/compliance/ss4/transmettre", { action: "transmettre" })} disabled={occupe !== ""} style={BOUTON}>{occupe ? "…" : "6. Transmettre le SS-4 à l'IRS"}</button>;
    if (st === "ss4_transmis") return <span style={{ color: "#b26a00", fontWeight: 600 }}>En attente de l'IRS — SS-4 faxé le {c.ss4_transmis_le ? new Date(c.ss4_transmis_le).toLocaleDateString("fr-FR") : ""} (fax {c.ss4_fax_id}). L'EIN revient par fax sous quelques jours ouvrés.</span>;
    return null;
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fff", color: "#1a1a1a", minHeight: "100vh", colorScheme: "light" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: 32 }}>
        <a href="/admin/compliance" style={{ color: OR, fontSize: 14 }}>← Tableau de bord</a>
        <h1 style={{ color: OR, borderBottom: "3px solid " + OR, paddingBottom: 10 }}>Création de {d.entite.legal_name || d.entite.label}</h1>
        {msg && <p style={{ color: msg.indexOf("Erreur") === 0 || msg.indexOf("ATTENTION") >= 0 ? "#c62828" : OR, fontWeight: 600 }}>{msg}</p>}

        {/* LE CHEMIN */}
        <div style={{ margin: "20px 0 28px" }}>
          {d.etapes.map(function (e: any, i: number) {
            const fait = i < idx, encours = i === idx;
            return (
              <div key={e.code} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderLeft: "3px solid " + (fait ? OR : encours ? "#b26a00" : "#ddd"), paddingLeft: 14, opacity: fait || encours ? 1 : 0.55 }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: fait ? OR : encours ? "#b26a00" : "#ddd", color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{fait ? "✓" : i + 1}</span>
                <div><strong>{e.nom}</strong><span style={{ color: "#666", fontSize: 13 }}> — {e.detail}</span></div>
              </div>
            );
          })}
        </div>

        {/* ETAPE 1 : AGENT */}
        {st === "agent_a_choisir" && (
          <div style={{ border: "2px solid " + OR, borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <h2 style={{ color: OR, fontSize: 18, marginTop: 0 }}>1. L'agent enregistré</h2>
            <p style={{ fontSize: 14, color: "#555" }}>Obligatoire dans l'État de constitution, avec une adresse physique. Il reçoit les documents officiels de la société ; nous les rangeons au coffre.</p>
            {d.agents.length > 0 ? d.agents.map(function (a: any) {
              return <button key={a.id} onClick={() => poster("/api/compliance/creation", { action: "agent", agent_prestataire: a.prestataire })} disabled={occupe !== ""} style={{ ...SECOND, display: "block", width: "100%", textAlign: "left", marginBottom: 8 }}>{a.prestataire} — {a.etat}{a.commentaire ? " · " + a.commentaire : ""}</button>;
            }) : <p style={{ fontSize: 14 }}>Aucun agent partenaire enregistré pour l'État {d.entite.formation_state || "—"}. Saisissez celui que vous avez retenu :</p>}
            <span style={LIB}>Agent retenu</span>
            <input value={saisie.agent || ""} onChange={(e) => setSaisie({ ...saisie, agent: e.target.value })} placeholder="Nom du prestataire" style={CHAMP} />
            <button onClick={() => poster("/api/compliance/creation", { action: "agent", agent_prestataire: saisie.agent })} disabled={occupe !== "" || !saisie.agent} style={BOUTON}>1. Agent choisi</button>
          </div>
        )}

        {/* ETAPE 2 : STATUTS */}
        {st === "statuts_a_deposer" && (
          <div style={{ border: "2px solid " + OR, borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <h2 style={{ color: OR, fontSize: 18, marginTop: 0 }}>2. Les statuts (Articles of Organization)</h2>
            <p style={{ fontSize: 14, color: "#555" }}>Le dépôt se fait sur le site de l'État, en ligne, avec une carte bancaire ; la société est active dès le paiement. Reportez ici le numéro et la date que l'État vous donne.</p>
            <span style={LIB}>Numéro d'immatriculation attribué par l'État</span>
            <input value={saisie.num || ""} onChange={(e) => setSaisie({ ...saisie, num: e.target.value })} style={CHAMP} />
            <span style={LIB}>Date du dépôt</span>
            <input type="date" value={saisie.date || ""} onChange={(e) => setSaisie({ ...saisie, date: e.target.value })} style={CHAMP} />
            <button onClick={() => poster("/api/compliance/creation", { action: "statuts", statuts_numero: saisie.num, statuts_deposes_le: saisie.date })} disabled={occupe !== "" || !saisie.num} style={BOUTON}>2. Statuts déposés</button>
          </div>
        )}

        {/* ETAPES 3 A 7 : LE SS-4 */}
        {["ss4_a_generer", "ss4_genere", "ss4_accuse_envoye", "ss4_signe", "ss4_transmis"].indexOf(st) >= 0 && (
          <div style={{ border: "2px solid " + OR, borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <h2 style={{ color: OR, fontSize: 18, marginTop: 0 }}>Le numéro fiscal (EIN) — formulaire SS-4</h2>
            {st === "ss4_a_generer" && (
              <>
                <p style={{ fontSize: 14, color: "#555" }}>Ce que le formulaire demande en plus de la fiche société. Le responsable est le membre ; sans numéro de sécurité sociale américain, le formulaire portera « Foreign ».</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "2 1 240px" }}><span style={LIB}>Nom du responsable (membre)</span><input value={f.responsable_nom} onChange={(e) => setF({ ...f, responsable_nom: e.target.value })} style={CHAMP} /></div>
                  <div style={{ flex: "1 1 120px" }}><span style={LIB}>Membres</span><input value={f.nb_membres} onChange={(e) => setF({ ...f, nb_membres: e.target.value })} style={CHAMP} /></div>
                  <div style={{ flex: "2 1 200px" }}><span style={LIB}>Téléphone (indicatif inclus)</span><input value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="+33 6…" style={CHAMP} /></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px" }}><span style={LIB}>Activité principale</span><select value={f.activite_code} onChange={(e) => setF({ ...f, activite_code: e.target.value })} style={CHAMP}>{ACTIVITES.map(function (a) { return <option key={a[0]} value={a[0]}>{a[1]}</option>; })}</select></div>
                  <div style={{ flex: "2 1 300px" }}><span style={LIB}>Ce que fait la société (en anglais, une ligne)</span><input value={f.activite_libelle} onChange={(e) => setF({ ...f, activite_libelle: e.target.value })} placeholder="Online training platform" style={CHAMP} /></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}><span style={LIB}>Comté et État du siège</span><input value={f.comte_etat} onChange={(e) => setF({ ...f, comte_etat: e.target.value })} placeholder="Sheridan, WY" style={CHAMP} /></div>
                  <div style={{ flex: "1 1 160px" }}><span style={LIB}>Début d'activité</span><input type="date" value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} style={CHAMP} /></div>
                  <div style={{ flex: "1 1 140px" }}><span style={LIB}>Clôture (mois)</span><input value={f.mois_cloture} onChange={(e) => setF({ ...f, mois_cloture: e.target.value })} style={CHAMP} /></div>
                </div>
                <button onClick={() => poster("/api/compliance/creation", { action: "champs", ...f })} disabled={occupe !== ""} style={{ ...SECOND, marginRight: 10 }}>Enregistrer</button>
                {bouton()}
              </>
            )}
            {st !== "ss4_a_generer" && (
              <p style={{ fontSize: 14 }}>
                SS-4 généré{c.ss4_genere_le ? " le " + new Date(c.ss4_genere_le).toLocaleDateString("fr-FR") : ""}.
                {c.ss4_reference_accuse ? " Accusé " + c.ss4_reference_accuse + "." : ""}
              </p>
            )}
            {st !== "ss4_a_generer" && bouton()}
            {st === "ss4_transmis" && (
              <div style={{ marginTop: 16, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                <span style={LIB}>EIN reçu de l'IRS (saisie de secours, 9 chiffres)</span>
                <input value={saisie.ein || ""} onChange={(e) => setSaisie({ ...saisie, ein: e.target.value })} placeholder="12-3456789" style={CHAMP} />
                <button onClick={() => poster("/api/compliance/creation", { action: "ein", ein: saisie.ein })} disabled={occupe !== "" || !saisie.ein} style={SECOND}>7. EIN reçu</button>
              </div>
            )}
          </div>
        )}

        {/* ETAPE 8 : OPERATING AGREEMENT */}
        {st === "oa_a_signer" && (
          <div style={{ border: "2px solid " + OR, borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <h2 style={{ color: OR, fontSize: 18, marginTop: 0 }}>8. L'Operating Agreement</h2>
            <p style={{ fontSize: 14, color: "#555" }}>EIN : <strong>{c.ein}</strong>. Le pacte de la société se prépare depuis les Documents à signer (type « convention ») ; reportez ici la référence SIG-… une fois signé.</p>
            <input value={saisie.oa || ""} onChange={(e) => setSaisie({ ...saisie, oa: e.target.value })} placeholder="SIG-…" style={CHAMP} />
            <button onClick={() => poster("/api/compliance/creation", { action: "oa", oa_reference: saisie.oa })} disabled={occupe !== "" || !saisie.oa} style={BOUTON}>8. Operating Agreement signé</button>
          </div>
        )}

        {/* ETAPE 9 : BANQUE */}
        {st === "banque" && (
          <div style={{ border: "2px solid " + OR, borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <h2 style={{ color: OR, fontSize: 18, marginTop: 0 }}>9. Le compte bancaire</h2>
            <p style={{ fontSize: 14, color: "#555" }}>Pièces à préparer : statuts déposés, lettre d'EIN, pièce d'identité du membre, justificatif d'adresse, Operating Agreement signé. Nous suivons l'ouverture avec vous jusqu'au compte actif.</p>
            <span style={LIB}>Établissement</span>
            <input value={saisie.banque || ""} onChange={(e) => setSaisie({ ...saisie, banque: e.target.value })} style={CHAMP} />
            <span style={LIB}>Date d'ouverture</span>
            <input type="date" value={saisie.bdate || ""} onChange={(e) => setSaisie({ ...saisie, bdate: e.target.value })} style={CHAMP} />
            <button onClick={() => poster("/api/compliance/creation", { action: "banque", banque_etablissement: saisie.banque, banque_ouverte_le: saisie.bdate })} disabled={occupe !== "" || !saisie.banque} style={BOUTON}>9. Compte ouvert</button>
          </div>
        )}

        {st === "active" && (
          <div style={{ background: "#f0f5f2", borderLeft: "4px solid " + OR, padding: 16 }}>
            <strong>Société active.</strong> EIN {c.ein} · agent {c.agent_prestataire} · banque {c.banque_etablissement}. Les échéances sont suivies depuis le tableau de bord.
          </div>
        )}
        {st === "ein_recu" && <button onClick={() => poster("/api/compliance/creation", { action: "champs" })} style={BOUTON}>Continuer</button>}
      </div>
    </div>
  );
}
