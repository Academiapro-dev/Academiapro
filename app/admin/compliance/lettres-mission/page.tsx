"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LES LETTRES DE MISSION — 09/09 (Mr Comptable).
//
// Un dossier, une mission, une lettre signee. La lettre est preparee depuis
// le modele (/api/compliance/lettre-mission), relue ici, puis envoyee a
// signer par la chaine existante (/api/compliance/document-a-signer) et
// rattachee a la mission. L etat « signee » est lu dans les signatures.
// ══════════════════════════════════════════════════════════════════════════
const LIBELLE_STATUT: any = {
  brouillon: { texte: "Brouillon", couleur: "rgba(255,255,255,0.45)" },
  envoyee: { texte: "Envoyée, en attente de signature", couleur: "#e8a33d" },
  signee: { texte: "Signée", couleur: "#4caf50" },
};

export default function PageLettresMission() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");

  const [typeMission, setTypeMission] = useState("tenue");
  const [prestations, setPrestations] = useState<string[]>(["tenue", "comptes", "liasse", "tva"]);
  const [honoraires, setHonoraires] = useState("");
  const [periodicite, setPeriodicite] = useState("mensuelle");
  const [dateDebut, setDateDebut] = useState("");
  const [dureeMois, setDureeMois] = useState("12");
  const [preavisMois, setPreavisMois] = useState("3");
  const [mentions, setMentions] = useState("");
  const [signataire, setSignataire] = useState("");
  const [apercu, setApercu] = useState<any>(null);

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          const p = new URLSearchParams(window.location.search).get("societe_id");
          if (p) setDossier(p);
          else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () {
    if (dossier) charger();
  }, [dossier]);

  async function charger() {
    setChargement(true);
    setErreur("");
    setApercu(null);
    try {
      const r = await fetch("/api/compliance/lettre-mission?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function basculer(p: string) {
    setPrestations(prestations.indexOf(p) >= 0 ? prestations.filter(function (x) { return x !== p; }) : prestations.concat([p]));
  }

  async function preparer() {
    setOccupe("preparer");
    setMessage("");
    setApercu(null);
    try {
      const r = await fetch("/api/compliance/lettre-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preparer", societe_id: dossier, type_mission: typeMission, prestations, honoraires,
          periodicite, date_debut: dateDebut || undefined, duree_mois: dureeMois, preavis_mois: preavisMois,
          mentions, signataire_email: signataire || undefined,
        }),
      });
      const data = await r.json();
      if (data.ok) setApercu(data);
      else setMessage("Erreur : " + (data.erreur || "inconnue"));
    } catch (e: any) {
      setMessage("Erreur : " + String(e));
    }
    setOccupe("");
  }

  async function envoyerASigner() {
    if (!apercu) return;
    setOccupe("envoyer");
    setMessage("");
    try {
      const r1 = await fetch("/api/compliance/document-a-signer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apercu.document_a_signer),
      });
      const d1 = await r1.json();
      if (!d1.success || !d1.reference) {
        setMessage("Erreur à la création du document : " + (d1.error || "inconnue"));
        setOccupe("");
        return;
      }
      const r2 = await fetch("/api/compliance/lettre-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lier", societe_id: dossier, mission_id: apercu.mission_id, reference: d1.reference }),
      });
      const d2 = await r2.json();
      if (!d2.ok) {
        setMessage("Document " + d1.reference + " créé mais non rattaché à la mission : " + (d2.erreur || "inconnue"));
        setOccupe("");
        return;
      }
      const em = d1.email || {};
      setMessage("Lettre " + d1.reference + " envoyée à " + apercu.document_a_signer.signataire_email + (em.envoye === true ? "." : " — ATTENTION : le courriel n'est pas parti (" + (em.raison || "cause inconnue") + "). Lien : " + (d1.lien || "")));
      setApercu(null);
      await charger();
    } catch (e: any) {
      setMessage("Erreur : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "#c8a96e", color: "#050508", border: "none", padding: "13px 26px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };
  const PETIT: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>← Retour aux dossiers</a>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>LE CABINET</p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Lettres de mission</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Depuis un modèle, relue, signée électroniquement par le client, rattachée au dossier
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) { return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>; })}
          </select>
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}
        {message && <p style={{ color: message.indexOf("Erreur") === 0 || message.indexOf("ATTENTION") >= 0 ? "#e8836a" : "#4caf50", fontSize: "15px" }}>{message}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : !d ? null : (
          <>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 12px" }}>Nouvelle lettre</h2>
            <div style={CARTE}>
              <span style={LIBELLE}>Nature de la mission</span>
              <select value={typeMission} onChange={(e) => setTypeMission(e.target.value)} style={CHAMP}>
                {Object.keys(d.types).map(function (k) { return <option key={k} value={k}>{d.types[k]}</option>; })}
              </select>

              <span style={LIBELLE}>Prestations comprises</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {Object.keys(d.prestations).map(function (k) {
                  const actif = prestations.indexOf(k) >= 0;
                  return (
                    <button key={k} onClick={() => basculer(k)} style={{ ...PETIT, background: actif ? "rgba(200,169,110,0.2)" : "none", borderColor: actif ? "#c8a96e" : "rgba(255,255,255,0.2)", color: actif ? "#c8a96e" : "rgba(255,255,255,0.5)" }}>
                      {d.prestations[k]}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE}>Honoraires HT</span>
                  <input value={honoraires} onChange={(e) => setHonoraires(e.target.value)} placeholder="250" style={CHAMP} />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE}>Périodicité</span>
                  <select value={periodicite} onChange={(e) => setPeriodicite(e.target.value)} style={CHAMP}>
                    <option value="mensuelle">par mois</option>
                    <option value="annuelle">par an</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <span style={LIBELLE}>Début de mission</span>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={{ ...CHAMP, colorScheme: "dark" }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <span style={LIBELLE}>Durée (mois)</span>
                  <input value={dureeMois} onChange={(e) => setDureeMois(e.target.value)} style={CHAMP} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <span style={LIBELLE}>Préavis (mois)</span>
                  <input value={preavisMois} onChange={(e) => setPreavisMois(e.target.value)} style={CHAMP} />
                </div>
              </div>

              <span style={LIBELLE}>Signataire (adresse du client — par défaut celle du dossier)</span>
              <input value={signataire} onChange={(e) => setSignataire(e.target.value)} placeholder="dirigeant@client.fr" style={CHAMP} />

              <span style={LIBELLE}>Dispositions particulières (facultatif)</span>
              <textarea value={mentions} onChange={(e) => setMentions(e.target.value)} rows={3} placeholder="Ce qui est propre à ce dossier" style={CHAMP} />

              <button onClick={preparer} disabled={occupe !== "" || !honoraires} style={{ ...BOUTON, opacity: !honoraires ? 0.5 : 1 }}>
                {occupe === "preparer" ? "Préparation…" : "Préparer la lettre"}
              </button>
            </div>

            {apercu && (
              <div style={{ ...CARTE, border: "2px solid #c8a96e" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>Relisez avant d&apos;envoyer</h3>
                <pre style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: "1.7", fontFamily: "Georgia,serif", margin: "0 0 16px" }}>
                  {apercu.corps}
                </pre>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 12px" }}>
                  Signataire : {apercu.document_a_signer.signataire_email}. Il recevra un lien, lira la lettre et signera avec un code par courriel.
                </p>
                <button onClick={envoyerASigner} disabled={occupe !== ""} style={BOUTON}>
                  {occupe === "envoyer" ? "Envoi…" : "Envoyer à signer"}
                </button>
              </div>
            )}

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 12px" }}>Lettres de ce dossier</h2>
            {d.missions.length === 0 ? (
              <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Aucune lettre de mission pour ce dossier.</p></div>
            ) : (
              d.missions.map(function (m: any) {
                const st = LIBELLE_STATUT[m.statut] || LIBELLE_STATUT.brouillon;
                return (
                  <div key={m.id} style={{ ...CARTE, borderLeft: "4px solid " + st.couleur }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ color: "#fff", fontSize: "15px" }}>
                        {d.types[m.type_mission] || m.type_mission} · à partir du {new Date(m.date_debut).toLocaleDateString("fr-FR")}
                      </span>
                      <span style={{ color: st.couleur, fontSize: "13px", fontWeight: "bold" }}>
                        {st.texte}{m.signee_le ? " le " + new Date(m.signee_le).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "6px 0 0" }}>
                      {(Number(m.honoraires) || 0).toLocaleString("fr-FR")} € HT {m.periodicite === "mensuelle" ? "par mois" : "par an"} · {(m.prestations || []).length} prestation(s) · signataire {m.signataire_email}
                      {m.reference_document ? " · " + m.reference_document : ""}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
