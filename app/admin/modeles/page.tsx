"use client";
import { useState, useEffect } from "react";

export default function PageModeles() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});
  const [valeurs, setValeurs] = useState<any>({});
  const [resultat, setResultat] = useState<any>(null);
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [tenant, setTenant] = useState("");

  useEffect(function () {
    charger();
    chargerClients();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/modeles");
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function chargerClients() {
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) setOrganismes(data.organismes || []);
    } catch (e) {}
  }

  async function installer() {
    setOccupe("installer");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/modeles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "installer" }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
      } else {
        setErreur(data.erreur || "Installation impossible.");
      }
    } catch (e: any) {
      setErreur("Installation impossible : " + String(e));
    }
    setOccupe("");
  }

  async function generer(m: any, forcer: boolean) {
    setOccupe("generer-" + m.id);
    setMessage("");
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/admin/contrat-generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modele_id: m.id,
          valeurs: valeurs[m.id] || {},
          tenant_id: tenant || null,
          forcer: forcer,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setResultat(data);
        setMessage(data.message);
      } else {
        setErreur(data.erreur || "Generation impossible.");
      }
    } catch (e: any) {
      setErreur("Generation impossible : " + String(e));
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
    padding: "11px 13px",
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
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  function poser(id: string, cle: string, v: string) {
    setValeurs({ ...valeurs, [id]: { ...(valeurs[id] || {}), [cle]: v } });
  }

  function valeur(id: string, cle: string) {
    return (valeurs[id] && valeurs[id][cle]) || "";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/contrats" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux contrats
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CONTRATS PRE-ETABLIS
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Mes modeles</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Remplissez, generez, faites signer — sans rien rediger
        </p>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {resultat && (
          <div style={{ ...CARTE, border: "2px solid rgba(76,175,80,0.5)", marginTop: "18px" }}>
            <p style={{ color: "#4caf50", fontSize: "17px", fontWeight: "bold", margin: "0 0 10px" }}>
              Contrat {resultat.reference} genere
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 12px", lineHeight: "1.75" }}>
              Envoyez ce lien a {resultat.signataire}. Un code de verification lui sera demande
              avant signature.
            </p>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
              <p style={{ color: "#c8a96e", fontSize: "13.5px", margin: 0, fontFamily: "monospace", wordBreak: "break-all" }}>
                {resultat.lien_signature}
              </p>
            </div>
            <a href="/admin/coffre" style={BOUTON}>Voir au coffre →</a>
          </div>
        )}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement des modeles...</p>
          </div>
        ) : !d ? null : (
          <>
            {d.a_installer > 0 && (
              <div style={{ ...CARTE, marginTop: "24px", border: "1px solid rgba(200,169,110,0.5)" }}>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", margin: "0 0 14px", lineHeight: "1.75" }}>
                  {d.a_installer} modele(s) sont disponibles et pas encore installes : partenariat
                  de distribution, accord de confidentialite, sous-traitance de formation,
                  prestation avec cession des droits.
                </p>
                <button
                  onClick={installer}
                  disabled={occupe !== ""}
                  style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                >
                  {occupe === "installer" ? "Installation..." : "Installer les modeles"}
                </button>
              </div>
            )}

            {d.total > 0 && (
              <div style={{ ...CARTE, marginTop: "20px" }}>
                <span style={LIBELLE}>Rattacher a un client (facultatif)</span>
                <select value={tenant} onChange={(e) => setTenant(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
                  <option value="">Aucun — contrat propre a l editeur</option>
                  {organismes.map(function (o) {
                    return (
                      <option key={o.tenant_id} value={o.tenant_id}>
                        {o.raison_sociale}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {d.modeles.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucun modele. Installez ceux qui vous sont proposes ci-dessus.
                </p>
              </div>
            ) : (
              d.modeles.map(function (m: any) {
                const estOuvert = ouvert[m.id] === true;
                const apercu = ouvert["texte-" + m.id] === true;
                return (
                  <div key={m.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 280px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                          {m.code} · {m.categorie}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{m.titre}</h3>
                        {m.description && (
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0, lineHeight: "1.7" }}>
                            {m.description}
                          </p>
                        )}
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                        {(m.champs || []).length} champ(s)
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                      <button
                        onClick={() => setOuvert({ ...ouvert, [m.id]: !estOuvert })}
                        style={estOuvert ? BOUTON : { ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                      >
                        {estOuvert ? "Fermer" : "Etablir ce contrat"}
                      </button>
                      <button
                        onClick={() => setOuvert({ ...ouvert, ["texte-" + m.id]: !apercu })}
                        style={BOUTON}
                      >
                        {apercu ? "Masquer le texte" : "Lire le texte"}
                      </button>
                    </div>

                    {apercu && (
                      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "16px 18px", marginTop: "14px", maxHeight: "340px", overflowY: "auto" }}>
                        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "13.5px", margin: 0, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                          {m.corps}
                        </p>
                      </div>
                    )}

                    {estOuvert && (
                      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {(m.champs || []).map(function (c: any) {
                          return (
                            <div key={c.cle}>
                              <span style={LIBELLE}>{c.libelle || c.cle}</span>
                              <input
                                value={valeur(m.id, c.cle)}
                                onChange={(e) => poser(m.id, c.cle, e.target.value)}
                                style={CHAMP}
                              />
                            </div>
                          );
                        })}

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => generer(m, false)}
                            disabled={occupe !== ""}
                            style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                          >
                            {occupe === "generer-" + m.id ? "Generation..." : "Generer le contrat"}
                          </button>
                          <button
                            onClick={() => generer(m, true)}
                            disabled={occupe !== ""}
                            style={BOUTON}
                          >
                            Generer malgre les champs vides
                          </button>
                        </div>

                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                          Le contrat est archive au coffre des sa generation, avec son empreinte.
                          Vous recevrez un lien de signature a transmettre.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)", marginTop: "20px" }}>
              <p style={{ color: "#e8a33d", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
                Ces modeles sont des projets. Faites-les relire par un professionnel du droit
                avant de les opposer a un cocontractant, comme vos conditions generales.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
