"use client";
import { useState, useEffect } from "react";

export default function PagePieces() {
  const [societes, setSocietes] = useState<any[]>([]); 
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [vue, setVue] = useState("manquantes");

  const [fichier, setFichier] = useState<any>(null);
  const [f, setF] = useState<any>({
    nom: "", type_document: "facture_achat", fournisseur: "",
    montant_ttc: "", date_piece: "", reference: "", ecriture_num: "",
  });

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
    try {
      const r = await fetch("/api/compliance/pieces?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function deposer() {
    if (!fichier) { setErreur("Choisissez un fichier."); return; }
    setOccupe("depot");
    setMessage("");
    setErreur("");
    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      donnees.append("societe_id", dossier);
      for (const k of Object.keys(f)) donnees.append(k, f[k]);

      const r = await fetch("/api/compliance/pieces", { method: "POST", body: donnees });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setFichier(null);
        setF({ ...f, nom: "", fournisseur: "", montant_ttc: "", reference: "", ecriture_num: "" });
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Depot impossible.");
      }
    } catch (e: any) {
      setErreur("Depot impossible : " + String(e));
    }
    setOccupe("");
  }

  async function rattacher(id: string, numero: string) {
    setOccupe(id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ecriture_num: numero }),
      });
      const data = await r.json();
      if (data.ok) { setMessage(data.message); await charger(); }
      else setErreur(data.erreur || "Rattachement impossible.");
    } catch (e: any) {
      setErreur("Rattachement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function ouvrir(id: string) {
    setOccupe(id);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/pieces?piece=" + id);
      const data = await r.json();
      if (data.ok && data.url) window.open(data.url, "_blank");
      else setErreur(data.erreur || "Ouverture impossible.");
    } catch (e: any) {
      setErreur("Ouverture impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    if (!n) return "";
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  const CHAMPS = [
    ["nom", "Nom de la piece", "Facture OVH mars"],
    ["fournisseur", "Fournisseur", "OVH"],
    ["montant_ttc", "Montant TTC", "22,90"],
    ["reference", "Reference", "FR78399269"],
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Pieces justificatives</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Chaque ecriture doit pouvoir montrer sa piece
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {dossier && d && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={() => setVue("manquantes")}
              style={{ ...BOUTON, background: vue === "manquantes" ? "#c8a96e" : "none", color: vue === "manquantes" ? "#050508" : "#c8a96e", border: vue === "manquantes" ? "none" : BOUTON.border, fontWeight: "bold", padding: "10px 18px" }}
            >
              A justifier · {d.sans_piece}
            </button>
            <button
              onClick={() => setVue("pieces")}
              style={{ ...BOUTON, background: vue === "pieces" ? "#c8a96e" : "none", color: vue === "pieces" ? "#050508" : "#c8a96e", border: vue === "pieces" ? "none" : BOUTON.border, fontWeight: "bold", padding: "10px 18px" }}
            >
              Pieces deposees · {d.total}
            </button>
            <button
              onClick={() => setFormulaire(!formulaire)}
              style={{ ...BOUTON, padding: "10px 18px" }}
            >
              {formulaire ? "Annuler" : "Deposer une piece"}
            </button>
          </div>
        )}

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Le fichier</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFichier(e.target.files && e.target.files[0])}
              style={{ ...CHAMP, fontSize: "14px" }}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {CHAMPS.map(function (c: any) {
                return (
                  <div key={c[0]} style={{ flex: "1 1 180px" }}>
                    <span style={LIBELLE}>{c[1]}</span>
                    <input value={f[c[0]]} onChange={(e) => setF({ ...f, [c[0]]: e.target.value })} placeholder={c[2]} style={CHAMP} />
                  </div>
                );
              })}
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Date de la piece</span>
                <input type="date" value={f.date_piece} onChange={(e) => setF({ ...f, date_piece: e.target.value })} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Type de document</span>
                <select value={f.type_document} onChange={(e) => setF({ ...f, type_document: e.target.value })} style={CHAMP}>
                  {Object.keys(d && d.types ? d.types : { autre: "Autre" }).map(function (k) {
                    return <option key={k} value={k}>{d.types[k]}</option>;
                  })}
                </select>
              </div>
            </div>

            <button
              onClick={deposer}
              disabled={occupe !== "" || !fichier}
              style={{ background: occupe !== "" || !fichier ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "depot" ? "Depot en cours..." : "Deposer la piece"}
            </button>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : vue === "manquantes" ? (
          d.ecritures_sans_piece.length === 0 ? (
            <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
              <p style={{ color: "#4caf50", margin: 0, fontSize: "15px", lineHeight: "1.8" }}>
                Toutes les ecritures ont leur piece. C est ce qu un controleur verifie en premier.
              </p>
            </div>
          ) : (
            d.ecritures_sans_piece.map(function (e: any) {
              return (
                <div key={e.ecriture_num} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ flex: "1 1 260px" }}>
                      <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                        {e.ecriture_num} · {e.journal} ·{" "}
                        {new Date(e.date).toLocaleDateString("fr-FR")}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "15.5px", margin: 0 }}>{e.libelle}</h3>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>{euros(e.montant)}</span>
                  </div>

                  {d.pieces.filter(function (p: any) { return !p.ecriture_num; }).length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px", alignItems: "center" }}>
                      <select
                        onChange={(ev) => { if (ev.target.value) rattacher(ev.target.value, e.ecriture_num); }}
                        defaultValue=""
                        style={{ ...CHAMP, flex: "1 1 260px", marginBottom: 0 }}
                      >
                        <option value="">— rattacher une piece deposee —</option>
                        {d.pieces.filter(function (p: any) { return !p.ecriture_num; }).map(function (p: any) {
                          return <option key={p.id} value={p.id}>{p.nom}{p.montant_ttc ? " · " + euros(p.montant_ttc) : ""}</option>;
                        })}
                      </select>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          d.pieces.length === 0 ? (
            <div style={CARTE}>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                Aucune piece deposee sur ce dossier.
              </p>
            </div>
          ) : (
            d.pieces.map(function (p: any) {
              return (
                <div key={p.id} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ flex: "1 1 260px" }}>
                      <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                        {d.types[p.type_document] || p.type_document}
                        {p.fournisseur ? " · " + p.fournisseur : ""}
                        {p.date_piece ? " · " + new Date(p.date_piece).toLocaleDateString("fr-FR") : ""}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "15.5px", margin: "0 0 4px" }}>{p.nom}</h3>
                      <p style={{ color: p.ecriture_num ? "#4caf50" : "#e8a33d", fontSize: "13px", margin: 0 }}>
                        {p.ecriture_num ? "Rattachee a " + p.ecriture_num : "Non rattachee"}
                      </p>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>{euros(p.montant_ttc)}</span>
                  </div>

                  {p.empreinte_sha256 && (
                    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "11px", margin: "8px 0 0", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {p.empreinte_sha256}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    <button onClick={() => ouvrir(p.id)} disabled={occupe !== ""} style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                      {occupe === p.id ? "..." : "Ouvrir"}
                    </button>
                    {p.ecriture_num && (
                      <button onClick={() => rattacher(p.id, "")} disabled={occupe !== ""} style={BOUTON}>
                        Detacher
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
