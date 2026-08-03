"use client";
import { useState, useEffect } from "react";

const MON_EMAIL = "contact@academiapro.fr";
const MEMOIRE_CLIENT = "modeles-dernier-client";

export default function PageModeles() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});
  const [valeurs, setValeurs] = useState<any>({});
  const [variantes, setVariantes] = useState<any>({});
  const [resultat, setResultat] = useState<any>(null);
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [tenant, setTenant] = useState("");
  const [envoyes, setEnvoyes] = useState<any>({});
  const [copie, setCopie] = useState("");

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

  // Le client choisi est retenu d une generation a l autre : l oublier fait
  // repartir le contrat sans rattachement, ce que la base refuse.
  async function chargerClients() {
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) {
        const liste = data.organismes || [];
        setOrganismes(liste);

        let retenu = "";
        try {
          retenu = window.sessionStorage.getItem(MEMOIRE_CLIENT) || "";
        } catch (e) {}

        const existe = liste.some(function (o: any) { return o.tenant_id === retenu; });
        if (retenu && existe) {
          setTenant(retenu);
        } else if (liste.length === 1) {
          setTenant(liste[0].tenant_id);
        }
      }
    } catch (e) {}
  }

  function choisirClient(valeur: string) {
    setTenant(valeur);
    try {
      window.sessionStorage.setItem(MEMOIRE_CLIENT, valeur);
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
    setEnvoyes({});
    try {
      const liste = (variantes[m.id] || []).filter(function (v: any) {
        return v && String(v.libelle || "").trim();
      });

      const r = await fetch("/api/admin/contrat-generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modele_id: m.id,
          valeurs: valeurs[m.id] || {},
          variantes: liste.length > 0 ? liste : undefined,
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

  // Copier le lien ne suffit pas : le signataire exterieur n a pas de session.
  // Seul l email de faire-signer porte le lien magique qui le connecte.
  async function envoyerASigner(reference: string, email: string) {
    setOccupe("envoi-" + reference);
    setErreur("");
    try {
      const url = tenant
        ? "/api/organisme/faire-signer?tenant=" + encodeURIComponent(tenant)
        : "/api/organisme/faire-signer";

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_reference: reference, email: email }),
      });
      const data = await r.json();
      if (data.ok) {
        setEnvoyes({ ...envoyes, [reference]: data.destinataire });
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  async function copier(texte: string, reference: string) {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(reference);
      setTimeout(function () { setCopie(""); }, 2500);
    } catch (e) {
      setErreur("Copie impossible. Selectionnez le lien a la main.");
    }
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

  const BOUTON_PALE: any = {
    background: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.45)",
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

  // A l ouverture d un modele, l email du signataire est deja le mien : c est
  // le cas le plus frequent, et le retaper a chaque fois n apporte rien.
  function ouvrirModele(m: any, estOuvert: boolean) {
    setOuvert({ ...ouvert, [m.id]: !estOuvert });

    if (estOuvert) return;

    const aUnEmail = (m.champs || []).some(function (c: any) { return c.cle === "email"; });
    if (!aUnEmail) return;
    if (valeurs[m.id] && valeurs[m.id].email) return;

    setValeurs({ ...valeurs, [m.id]: { ...(valeurs[m.id] || {}), email: MON_EMAIL } });
  }

  function ajouterVariante(id: string) {
    const liste = (variantes[id] || []).slice();
    if (liste.length >= 5) return;
    liste.push({ libelle: "", valeurs: {} });
    setVariantes({ ...variantes, [id]: liste });
  }

  function poserVariante(id: string, i: number, cle: string, v: string) {
    const liste = (variantes[id] || []).slice();
    if (!liste[i]) return;
    if (cle === "libelle") liste[i] = { ...liste[i], libelle: v };
    else liste[i] = { ...liste[i], valeurs: { ...(liste[i].valeurs || {}), [cle]: v } };
    setVariantes({ ...variantes, [id]: liste });
  }

  function retirerVariante(id: string, i: number) {
    const liste = (variantes[id] || []).slice();
    liste.splice(i, 1);
    setVariantes({ ...variantes, [id]: liste });
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
              {resultat.contrats.length > 1
                ? resultat.contrats.length + " versions preparees"
                : "Contrat " + resultat.contrats[0].reference + " genere"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 14px", lineHeight: "1.75" }}>
              {resultat.contrats.length > 1
                ? "Envoyez a " + resultat.signataire + " la version retenue. Des que l une est"
                  + " signee, les autres cessent d etre signables."
                : "Envoyez le document a " + resultat.signataire + ". Il recevra un lien qui le"
                  + " connecte, puis un code de verification avant signature."}
            </p>

            {resultat.contrats.map(function (c: any) {
              const envoye = envoyes[c.reference];
              return (
                <div key={c.reference} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
                  {c.libelle && (
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 5px", fontWeight: "bold" }}>
                      {c.libelle}
                    </p>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "0 0 12px", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {c.lien_signature}
                  </p>

                  {envoye ? (
                    <p style={{ color: "#4caf50", fontSize: "14px", margin: 0 }}>
                      Envoye a {envoye}. Le lien de connexion est valable trente jours.
                    </p>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => envoyerASigner(c.reference, resultat.signataire)}
                        disabled={occupe !== ""}
                        style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia,serif" }}
                      >
                        {occupe === "envoi-" + c.reference
                          ? "Envoi..."
                          : "Envoyer a signer"}
                      </button>
                      <button
                        onClick={() => copier(c.lien_signature, c.reference)}
                        style={BOUTON}
                      >
                        {copie === c.reference ? "Lien copie" : "Copier le lien"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "10px 0 14px", lineHeight: "1.7" }}>
              Le lien copie ne connecte personne : il ne sert que pour vous, deja identifie.
              Un signataire exterieur doit recevoir l email.
            </p>

            <a href="/admin/coffre" style={{ ...BOUTON, display: "inline-block", textDecoration: "none" }}>
              Voir au coffre →
            </a>
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
                  {d.a_installer} modele(s) a installer ou a mettre a jour.
                </p>
                <button
                  onClick={installer}
                  disabled={occupe !== ""}
                  style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                >
                  {occupe === "installer" ? "Installation..." : "Mettre les modeles a jour"}
                </button>
              </div>
            )}

            {d.total > 0 && (
              <div style={{ ...CARTE, marginTop: "20px" }}>
                <span style={LIBELLE}>Rattacher a un client</span>
                <select value={tenant} onChange={(e) => choisirClient(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
                  <option value="">Aucun — contrat propre a l editeur</option>
                  {organismes.map(function (o) {
                    return (
                      <option key={o.tenant_id} value={o.tenant_id}>
                        {o.raison_sociale}
                      </option>
                    );
                  })}
                </select>
                {!tenant && (
                  <p style={{ color: "#e8a33d", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7" }}>
                    Sans rattachement, la generation sera refusee. Choisissez AcadeMIA Pro LLC
                    pour vos propres contrats.
                  </p>
                )}
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
                const mesVariantes = variantes[m.id] || [];
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
                        onClick={() => ouvrirModele(m, estOuvert)}
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

                        <div style={{ background: "rgba(200,169,110,0.06)", borderRadius: "10px", padding: "16px 18px", marginBottom: "16px" }}>
                          <p style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold", margin: "0 0 6px" }}>
                            Preparer plusieurs versions de negociation
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.75" }}>
                            Facultatif. Donnez un nom a chaque version et ne changez que ce qui
                            differe — le reste est repris des champs ci-dessus. Des que l une est
                            signee, les autres cessent d etre signables.
                          </p>

                          {mesVariantes.map(function (v: any, i: number) {
                            return (
                              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "12px 14px", marginBottom: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                                  <span style={{ color: "#c8a96e", fontSize: "13px" }}>
                                    Version {i + 1}
                                  </span>
                                  <button
                                    onClick={() => retirerVariante(m.id, i)}
                                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px" }}
                                  >
                                    Retirer
                                  </button>
                                </div>

                                <input
                                  value={v.libelle || ""}
                                  onChange={(e) => poserVariante(m.id, i, "libelle", e.target.value)}
                                  placeholder="Nom de la version — par exemple : 50 pour cent"
                                  style={CHAMP}
                                />

                                {(m.champs || []).map(function (c: any) {
                                  return (
                                    <div key={c.cle}>
                                      <span style={{ ...LIBELLE, fontSize: "12px" }}>
                                        {c.libelle || c.cle} — laisser vide pour reprendre la valeur commune
                                      </span>
                                      <input
                                        value={(v.valeurs && v.valeurs[c.cle]) || ""}
                                        onChange={(e) => poserVariante(m.id, i, c.cle, e.target.value)}
                                        style={{ ...CHAMP, marginBottom: "8px" }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}

                          <button
                            onClick={() => ajouterVariante(m.id)}
                            disabled={mesVariantes.length >= 5}
                            style={BOUTON}
                          >
                            {mesVariantes.length === 0
                              ? "Ajouter une version"
                              : "Ajouter une autre version"}
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            onClick={() => generer(m, false)}
                            disabled={occupe !== ""}
                            style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                          >
                            {occupe === "generer-" + m.id
                              ? "Generation..."
                              : mesVariantes.length > 0
                                ? "Generer les " + mesVariantes.length + " version(s)"
                                : "Generer le contrat"}
                          </button>
                          <button
                            onClick={() => generer(m, true)}
                            disabled={occupe !== ""}
                            style={BOUTON_PALE}
                          >
                            Generer malgre les champs vides
                          </button>
                        </div>

                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                          Chaque contrat est archive au coffre des sa generation, avec son
                          empreinte. Generer malgre les champs vides produit un document
                          incomplet, portant la mention A COMPLETER : reserve a la preparation.
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
