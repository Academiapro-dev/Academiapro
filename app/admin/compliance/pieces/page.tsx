"use client";
import { useState, useEffect } from "react";
import Guide from "../../../../components/Guide";

export default function PagePieces() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [vue, setVue] = useState("pieces");
  const [lectures, setLectures] = useState<any>({});

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
        setErreur(data.erreur || "Dépôt impossible.");
      }
    } catch (e: any) {
      setErreur("Dépôt impossible : " + String(e));
    }
    setOccupe("");
  }

  async function lire(p: any) {
    setOccupe("lire-" + p.id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/lire-facture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piece_id: p.id, societe_id: dossier }),
      });
      const data = await r.json();
      if (data.ok) {
        setLectures({ ...lectures, [p.id]: data });
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setOccupe("");
  }

  async function comptabiliser(p: any) {
    const l = lectures[p.id];
    if (!l) return;
    setOccupe("ecr-" + p.id);
    setMessage("");
    setErreur("");
    try {
      const ht = Number(l.lu.montant_ht) || 0;
      const tva = Number(l.lu.montant_tva) || 0;
      const ttc = Number(l.lu.montant_ttc) || 0;

      const lignes: any[] = [
        { compte: l.proposition.compte, debit: ht > 0 ? ht : ttc, credit: "" },
      ];
      if (tva > 0) lignes.push({ compte: "445660", debit: tva, credit: "" });
      lignes.push({ compte: "401000", debit: "", credit: ttc });

      const r = await fetch("/api/compliance/ecriture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: dossier,
          journal: "AC",
          date: l.lu.date || new Date().toISOString().slice(0, 10),
          piece_ref: l.lu.reference || p.nom,
          libelle: (l.lu.fournisseur || p.nom) + (l.lu.reference ? " - " + l.lu.reference : ""),
          lignes: lignes,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        await fetch("/api/compliance/pieces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: p.id, ecriture_num: data.ecriture_num }),
        });
        setMessage(data.message + " Pièce rattachée.");
        await charger();
      } else {
        setErreur(data.erreur || "Écriture impossible.");
      }
    } catch (e: any) {
      setErreur("Écriture impossible : " + String(e));
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
    setOccupe("o-" + id);
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
  const PLEIN: any = { ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" };

  function euros(n: any) {
    if (!n) return "";
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  const CHAMPS = [
    ["nom", "Nom de la pièce", "Facture OVH mars"],
    ["fournisseur", "Fournisseur", "OVH"],
    ["montant_ttc", "Montant TTC", "22,90"],
    ["reference", "Référence", "FR78399269"],
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Pièces justificatives</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 22px" }}>
          Déposez la facture, elle se lit et se comptabilise
        </p>

        <Guide ecran="comptable.pieces" />

        <div style={CARTE}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold", lineHeight: "1.7" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {dossier && d && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button onClick={() => setVue("pieces")} style={{ ...BOUTON, background: vue === "pieces" ? "#c8a96e" : "none", color: vue === "pieces" ? "#050508" : "#c8a96e", border: vue === "pieces" ? "none" : BOUTON.border, fontWeight: "bold", padding: "10px 18px" }}>
              Pièces · {d.total}
            </button>
            <button onClick={() => setVue("manquantes")} style={{ ...BOUTON, background: vue === "manquantes" ? "#c8a96e" : "none", color: vue === "manquantes" ? "#050508" : "#c8a96e", border: vue === "manquantes" ? "none" : BOUTON.border, fontWeight: "bold", padding: "10px 18px" }}>
              À justifier · {d.sans_piece}
            </button>
            <button onClick={() => setFormulaire(!formulaire)} style={{ ...BOUTON, padding: "10px 18px" }}>
              {formulaire ? "Annuler" : "Déposer une pièce"}
            </button>
          </div>
        )}

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Le fichier</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFichier(e.target.files && e.target.files[0])} style={{ ...CHAMP, fontSize: "14px" }} />

            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 12px", lineHeight: "1.7" }}>
              Les autres champs sont facultatifs : la lecture automatique les remplira.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {CHAMPS.map(function (c: any) {
                return (
                  <div key={c[0]} style={{ flex: "1 1 180px" }}>
                    <span style={LIBELLE}>{c[1]}</span>
                    <input value={f[c[0]]} onChange={(e) => setF({ ...f, [c[0]]: e.target.value })} placeholder={c[2]} style={CHAMP} />
                  </div>
                );
              })}
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Type de document</span>
                <select value={f.type_document} onChange={(e) => setF({ ...f, type_document: e.target.value })} style={CHAMP}>
                  {Object.keys(d && d.types ? d.types : { autre: "Autre" }).map(function (k) {
                    return <option key={k} value={k}>{d.types[k]}</option>;
                  })}
                </select>
              </div>
            </div>

            <button onClick={deposer} disabled={occupe !== "" || !fichier} style={{ ...PLEIN, padding: "14px 28px", borderRadius: "8px", fontSize: "15px", width: "100%" }}>
              {occupe === "depot" ? "Dépôt en cours…" : "Déposer la pièce"}
            </button>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture…</p></div>
        ) : !d ? null : vue === "manquantes" ? (
          d.ecritures_sans_piece.length === 0 ? (
            <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
              <p style={{ color: "#4caf50", margin: 0, fontSize: "15px", lineHeight: "1.8" }}>
                Toutes les écritures ont leur pièce.
              </p>
            </div>
          ) : (
            d.ecritures_sans_piece.map(function (e: any) {
              return (
                <div key={e.ecriture_num} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ flex: "1 1 260px" }}>
                      <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                        {e.ecriture_num} · {e.journal} · {new Date(e.date).toLocaleDateString("fr-FR")}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "15.5px", margin: 0 }}>{e.libelle}</h3>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>{euros(e.montant)}</span>
                  </div>

                  {d.pieces.filter(function (p: any) { return !p.ecriture_num; }).length > 0 && (
                    <select
                      onChange={(ev) => { if (ev.target.value) rattacher(ev.target.value, e.ecriture_num); }}
                      defaultValue=""
                      style={{ ...CHAMP, marginTop: "12px", marginBottom: 0 }}
                    >
                      <option value="">— rattacher une pièce déposée —</option>
                      {d.pieces.filter(function (p: any) { return !p.ecriture_num; }).map(function (p: any) {
                        return <option key={p.id} value={p.id}>{p.nom}{p.montant_ttc ? " · " + euros(p.montant_ttc) : ""}</option>;
                      })}
                    </select>
                  )}
                </div>
              );
            })
          )
        ) : d.pieces.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune pièce déposée sur ce dossier.
            </p>
          </div>
        ) : (
          d.pieces.map(function (p: any) {
            const l = lectures[p.id];
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
                      {p.ecriture_num ? "Rattachée à " + p.ecriture_num : "Non rattachée"}
                    </p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>{euros(p.montant_ttc)}</span>
                </div>

                {l && (
                  <div style={{ marginTop: "14px", padding: "14px 16px", borderRadius: "10px", background: l.coherent ? "rgba(76,175,80,0.08)" : "rgba(232,163,61,0.08)", border: "1px solid " + (l.coherent ? "rgba(76,175,80,0.35)" : "rgba(232,163,61,0.4)") }}>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.75" }}>
                      {l.lu.fournisseur || "Fournisseur non lu"}
                      {l.lu.date ? " · " + new Date(l.lu.date).toLocaleDateString("fr-FR") : ""}
                      {l.lu.reference ? " · " + l.lu.reference : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 6px" }}>
                      {euros(l.lu.montant_ht)} HT · {euros(l.lu.montant_tva)} de TVA ·{" "}
                      <strong>{euros(l.lu.montant_ttc)} TTC</strong>
                      {l.lu.confiance ? " · confiance " + l.lu.confiance + " %" : ""}
                    </p>
                    <p style={{ color: l.coherent ? "#4caf50" : "#e8a33d", fontSize: "13px", margin: "0 0 10px", lineHeight: "1.7" }}>
                      {l.coherent
                        ? "Compte proposé : " + l.proposition.compte + " — " + l.proposition.origine
                        : "Les montants ne tombent pas juste : vérifiez avant de saisir."}
                    </p>
                    {!p.ecriture_num && (
                      <button onClick={() => comptabiliser(p)} disabled={occupe !== ""} style={PLEIN}>
                        {occupe === "ecr-" + p.id ? "…" : "Comptabiliser"}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  <button onClick={() => ouvrir(p.id)} disabled={occupe !== ""} style={PLEIN}>
                    {occupe === "o-" + p.id ? "…" : "Ouvrir"}
                  </button>
                  {!p.ecriture_num && (
                    <button onClick={() => lire(p)} disabled={occupe !== ""} style={BOUTON}>
                      {occupe === "lire-" + p.id ? "Lecture…" : "Lire la facture"}
                    </button>
                  )}
                  {p.ecriture_num && (
                    <button onClick={() => rattacher(p.id, "")} disabled={occupe !== ""} style={BOUTON}>
                      Détacher
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
