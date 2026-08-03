"use client";
import { useState, useEffect } from "react";

export default function PageCoffre() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [filtre, setFiltre] = useState("miennes");

  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("partenariat");
  const [contrepartie, setContrepartie] = useState("");
  const [reference, setReference] = useState("");
  const [signe, setSigne] = useState(true);
  const [signeLe, setSigneLe] = useState("");
  const [annees, setAnnees] = useState("10");
  const [notes, setNotes] = useState("");
  const [fichier, setFichier] = useState<any>(null);

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/coffre");
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function deposer() {
    if (!fichier) {
      setErreur("Choisissez un fichier.");
      return;
    }
    if (titre.trim().length < 3) {
      setErreur("Donnez un titre a ce document.");
      return;
    }
    setOccupe("depot");
    setMessage("");
    setErreur("");
    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      donnees.append("titre", titre);
      donnees.append("categorie", categorie);
      donnees.append("contrepartie", contrepartie);
      donnees.append("reference", reference);
      donnees.append("signe", signe ? "true" : "false");
      if (signeLe) donnees.append("signe_le", signeLe);
      donnees.append("annees", annees);
      donnees.append("notes", notes);

      const r = await fetch("/api/admin/coffre", { method: "POST", body: donnees });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setTitre(""); setContrepartie(""); setReference("");
        setNotes(""); setFichier(null); setSigneLe("");
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

  async function ouvrir(id: string) {
    setOccupe("ouvrir-" + id);
    setErreur("");
    try {
      const r = await fetch("/api/admin/coffre?piece=" + id);
      const data = await r.json();
      if (data.ok && data.url) {
        window.open(data.url, "_blank");
      } else {
        setErreur(data.erreur || "Ouverture impossible.");
      }
    } catch (e: any) {
      setErreur("Ouverture impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  function jour(v: any) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  function poids(o: any) {
    const n = Number(o) || 0;
    if (n > 1048576) return Math.round(n / 104857.6) / 10 + " Mo";
    return Math.round(n / 1024) + " Ko";
  }

  // Le certificat porte la preuve de signature. Il ne s affiche que sur une
  // piece signee et referencee, jamais sur la ligne de preuve elle-meme.
  function certificatPossible(p: any): boolean {
    if (!p.signe) return false;
    if (!p.reference) return false;
    if (String(p.reference).indexOf("-PREUVE") >= 0) return false;
    return true;
  }

  const pieces = d
    ? d.pieces.filter(function (p: any) {
        if (filtre === "miennes") return !p.tenant_id;
        if (filtre === "clients") return !!p.tenant_id;
        return true;
      })
    : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/contrats" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux contrats
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          ARCHIVAGE A VALEUR PROBANTE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Le coffre</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Tous vos contrats, leur empreinte et leur duree de conservation
        </p>

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", margin: "22px 0" }}
        >
          {formulaire ? "Annuler" : "Deposer un contrat"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Le fichier</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFichier(e.target.files && e.target.files[0])}
              style={{ ...CHAMP, fontSize: "14px" }}
            />

            <span style={LIBELLE}>Titre du document</span>
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Contrat de partenariat - Interim Conseil"
              style={CHAMP}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Categorie</span>
                <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={CHAMP}>
                  {Object.keys(d && d.categories ? d.categories : { autre: "Autre" }).map(function (k) {
                    return <option key={k} value={k}>{d.categories[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Avec qui</span>
                <input
                  value={contrepartie}
                  onChange={(e) => setContrepartie(e.target.value)}
                  placeholder="Nom de la contrepartie"
                  style={CHAMP}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Reference</span>
                <input value={reference} onChange={(e) => setReference(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Signe le (facultatif)</span>
                <input type="date" value={signeLe} onChange={(e) => setSigneLe(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Conserver (annees)</span>
                <input value={annees} onChange={(e) => setAnnees(e.target.value)} placeholder="10" style={CHAMP} />
              </div>
            </div>

            <div
              onClick={() => setSigne(!signe)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: signe ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: signe ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "14px" }}
            >
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: signe ? "#c8a96e" : "transparent", border: signe ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {signe ? "✓" : ""}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>
                Ce document est signe par toutes les parties
              </span>
            </div>

            <span style={LIBELLE}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={CHAMP} />

            <button
              onClick={deposer}
              disabled={occupe !== ""}
              style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "depot" ? "Depot en cours..." : "Deposer au coffre"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              L empreinte du fichier est calculee au depot. Elle prouvera plus tard que le
              document n a pas ete modifie depuis.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ouverture du coffre...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
              {[
                ["miennes", "Mes contrats · " + d.miennes],
                ["clients", "Contrats clients · " + d.clients],
                ["tous", "Tout le coffre · " + d.total],
              ].map(function (f: any) {
                const actif = filtre === f[0];
                return (
                  <button
                    key={f[0]}
                    onClick={() => setFiltre(f[0])}
                    style={{ padding: "9px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
                  >
                    {f[1]}
                  </button>
                );
              })}
            </div>

            {d.echues > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
                <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.echues} piece(s) ont depasse leur duree de conservation. Vous pouvez les
                  detruire — ou prolonger si un litige est en cours.
                </p>
              </div>
            )}

            {pieces.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
                  {filtre === "miennes"
                    ? "Aucun contrat depose. Commencez par votre contrat de partenariat, vos conditions d assurance ou vos accords fournisseurs."
                    : "Aucune piece dans cette categorie."}
                </p>
              </div>
            ) : (
              pieces.map(function (p: any) {
                return (
                  <div key={p.id} style={{ ...CARTE, border: p.echu ? "1px solid rgba(232,163,61,0.45)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                          {p.categorie_nom}
                          {p.organisme ? " · " + p.organisme : " · contrat propre"}
                          {p.reference ? " · " + p.reference : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{p.titre}</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {p.contrepartie ? p.contrepartie + " · " : ""}
                          Depose le {jour(p.created_at)}
                          {p.octets ? " · " + poids(p.octets) : ""}
                        </p>
                      </div>
                      <span style={{ color: p.signe ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: "bold" }}>
                        {p.signe ? "Signe" : "Non signe"}
                        {p.signe_le ? " le " + jour(p.signe_le) : ""}
                      </span>
                    </div>

                    {p.notes && (
                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: "10px 0 0", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                        {p.notes}
                      </p>
                    )}

                    {p.empreinte_sha256 && (
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11.5px", margin: "10px 0 0", fontFamily: "monospace", wordBreak: "break-all" }}>
                        {p.empreinte_sha256}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => ouvrir(p.id)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                      >
                        {occupe === "ouvrir-" + p.id ? "Ouverture..." : "Ouvrir le document"}
                      </button>

                      {certificatPossible(p) && (
                        <a
                          href={"/api/organisme/certificat?reference=" + encodeURIComponent(p.reference)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...BOUTON, display: "inline-block", textDecoration: "none" }}
                        >
                          Certificat de signature
                        </a>
                      )}

                      <span style={{ color: p.echu ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                        {p.conserver_jusqu_au
                          ? (p.echu ? "Conservation echue le " : "A conserver jusqu au ")
                            + jour(p.conserver_jusqu_au)
                          : "Sans duree fixee"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
                Le coffre est prive : aucun document n y est accessible par une adresse publique.
                Chaque ouverture passe par un lien signe valable une heure.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
                Les contrats signes par vos clients y arrivent automatiquement. Les votres se
                deposent a la main : contrat de partenariat, assurance, accords fournisseurs,
                documents de societe.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
