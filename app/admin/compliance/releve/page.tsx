"use client";
import { useState, useEffect } from "react";
import Guide from "../../../../components/Guide";

// LA CONNEXION BANCAIRE S AJOUTE A L IMPORT, ELLE NE LE REMPLACE PAS.
//
// Toutes les banques ne sont pas couvertes par Plaid, et un cabinet doit
// pouvoir traiter un dossier meme sans connexion : le collage du releve reste
// donc en place. La connexion evite la saisie quand elle est possible.
const PLAID_SCRIPT = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

export default function PageReleve() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [contenu, setContenu] = useState("");
  const [compte, setCompte] = useState("512000");
  const [ouvert, setOuvert] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [rejets, setRejets] = useState<any[]>([]);

  const [banques, setBanques] = useState<any[]>([]);
  const [plaidPret, setPlaidPret] = useState(false);

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  // Le script de Plaid ouvre la fenetre de connexion. Il se charge une fois,
  // au premier affichage de l ecran.
  useEffect(function () {
    if (document.querySelector('script[src="' + PLAID_SCRIPT + '"]')) {
      setPlaidPret(true);
      return;
    }
    const balise = document.createElement("script");
    balise.src = PLAID_SCRIPT;
    balise.onload = function () { setPlaidPret(true); };
    document.body.appendChild(balise);
  }, []);

  useEffect(function () {
    if (dossier) {
      charger();
      chargerBanques();
    }
  }, [dossier]);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/compliance/releve?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  async function chargerBanques() {
    try {
      const r = await fetch("/api/compliance/plaid?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setBanques(data.banques || []);
    } catch (e) {}
  }

  // CONNECTER UNE BANQUE.
  //
  // Les identifiants bancaires du client ne transitent JAMAIS par nous :
  // la fenetre appartient a Plaid, qui nous renvoie seulement un jeton.
  async function connecterBanque() {
    setOccupe("connexion");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/plaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ouvrir", societe_id: dossier }),
      });
      const data = await r.json();

      if (!data.ok) {
        setErreur(data.erreur || "Connexion impossible.");
        setOccupe("");
        return;
      }

      const Plaid = (window as any).Plaid;
      if (!Plaid) {
        setErreur("La fenêtre de connexion n'a pas pu se charger. Rechargez la page.");
        setOccupe("");
        return;
      }

      const poignee = Plaid.create({
        token: data.link_token,
        onSuccess: async function (publicToken: string) {
          setOccupe("enregistrement");
          try {
            const r2 = await fetch("/api/compliance/plaid", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "enregistrer",
                societe_id: dossier,
                public_token: publicToken,
              }),
            });
            const data2 = await r2.json();
            if (data2.ok) {
              setMessage(data2.message);
              await chargerBanques();
            } else {
              setErreur(data2.erreur || "Enregistrement impossible.");
            }
          } catch (e: any) {
            setErreur("Enregistrement impossible : " + String(e));
          }
          setOccupe("");
        },
        onExit: function () { setOccupe(""); },
      });

      poignee.open();
    } catch (e: any) {
      setErreur("Connexion impossible : " + String(e));
      setOccupe("");
    }
  }

  async function synchroniser() {
    setOccupe("synchro");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/plaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "synchroniser", societe_id: dossier }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        await charger();
        await chargerBanques();
      } else {
        setErreur(data.erreur || "Synchronisation impossible.");
      }
    } catch (e: any) {
      setErreur("Synchronisation impossible : " + String(e));
    }
    setOccupe("");
  }

  async function importer() {
    if (contenu.trim().length < 10) {
      setErreur("Collez votre relevé.");
      return;
    }
    setOccupe("import");
    setMessage("");
    setErreur("");
    setRejets([]);
    try {
      const r = await fetch("/api/compliance/releve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: dossier, compte: compte, contenu: contenu }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setContenu("");
        setOuvert(false);
        if (data.rejets) setRejets(data.rejets);
        await charger();
      } else {
        setErreur(data.erreur || "Import impossible.");
        if (data.rejets) setRejets(data.rejets);
      }
    } catch (e: any) {
      setErreur("Import impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh", background: "#050508", color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "20px 24px", marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%", padding: "11px 13px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none", border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e", padding: "9px 18px", borderRadius: "20px",
    cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Relevés bancaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Connectez la banque, ou importez le relevé, puis rapprochez-le des écritures
        </p>

        <div style={{ marginTop: "18px" }}>
          <Guide ecran="comptable.releve" />
        </div>

        <div style={{ ...CARTE, marginTop: "18px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {dossier && (
          <>
            {/* LA BANQUE CONNECTEE PASSE DEVANT L IMPORT MANUEL : c est le
                geste que le cabinet fera tous les jours. */}
            <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.4)" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 6px" }}>
                Banque connectée
              </h2>

              {banques.length === 0 ? (
                <>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.75" }}>
                    Connectez la banque de ce dossier : les écritures arrivent ensuite d'elles-mêmes,
                    sans que personne n'ait à télécharger ni recopier un relevé. Les identifiants de
                    votre client ne passent jamais par nous.
                  </p>
                  <button
                    onClick={connecterBanque}
                    disabled={occupe !== "" || !plaidPret}
                    style={{ background: occupe !== "" || !plaidPret ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" || !plaidPret ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                  >
                    {occupe === "connexion" ? "Ouverture…"
                      : occupe === "enregistrement" ? "Enregistrement…"
                      : !plaidPret ? "Chargement…"
                      : "Connecter une banque"}
                  </button>
                </>
              ) : (
                <>
                  {banques.map(function (b: any) {
                    return (
                      <div key={b.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 3px" }}>
                          {b.institution_nom || "Banque"}
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                            {b.comptes && b.comptes.length ? " · " + b.comptes.length + " compte(s)" : ""}
                          </span>
                        </p>
                        <p style={{ color: b.erreur ? "#e8836a" : "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                          {b.erreur
                            ? b.erreur
                            : b.derniere_synchro
                            ? "Dernière relève le " + new Date(b.derniere_synchro).toLocaleString("fr-FR")
                            : "Jamais relevée"}
                        </p>
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                    <button
                      onClick={synchroniser}
                      disabled={occupe !== ""}
                      style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                    >
                      {occupe === "synchro" ? "Relève en cours…" : "Relever les écritures"}
                    </button>
                    <button
                      onClick={connecterBanque}
                      disabled={occupe !== "" || !plaidPret}
                      style={BOUTON}
                    >
                      Ajouter une banque
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={() => setOuvert(!ouvert)}
                style={BOUTON}
              >
                {ouvert ? "Annuler" : "Importer un relevé à la main"}
              </button>
              <a href={"/admin/compliance/rapprochement?societe_id=" + dossier} style={{ ...BOUTON, textDecoration: "none" }}>
                Rapprocher →
              </a>
            </div>

            {ouvert && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <span style={LIBELLE}>Compte bancaire</span>
                <input value={compte} onChange={(e) => setCompte(e.target.value)} placeholder="512000" style={CHAMP} />

                <span style={LIBELLE}>Ordre des colonnes</span>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px", fontFamily: "monospace", lineHeight: "1.7" }}>
                  date ; libellé ; montant ; [crédit] ; date de valeur ; référence ; solde
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.7" }}>
                  Le montant peut être signé dans une seule colonne, ou réparti en débit et crédit.
                  Les dates françaises et américaines sont acceptées, l'en-tête est ignorée.
                </p>

                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows={9}
                  placeholder={"12/03/2026 ; VIR SEPA CLIENT DUPONT ; 1200,00\n14/03/2026 ; PRLV LOYER MARS ; -850,00"}
                  style={{ ...CHAMP, fontFamily: "monospace", fontSize: "13.5px", lineHeight: "1.7" }}
                />

                <button
                  onClick={importer}
                  disabled={occupe !== "" || contenu.trim().length < 10}
                  style={{ background: occupe !== "" || contenu.trim().length < 10 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" || contenu.trim().length < 10 ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === "import" ? "Import en cours…" : "Importer"}
                </button>

                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
                  Une ligne déjà importée est écartée automatiquement : réimporter le même relevé
                  ne double jamais la trésorerie.
                </p>
              </div>
            )}

            {rejets.length > 0 && (
              <div style={CARTE}>
                <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 10px" }}>
                  {rejets.length} ligne(s) écartée(s)
                </h2>
                {rejets.map(function (r: any, i: number) {
                  return (
                    <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Ligne {r.ligne} · </span>{r.valeur}
                      </p>
                      <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "3px 0 0" }}>{r.motif}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {d && (
              <>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: "#c8a96e", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Ligne(s)</p>
                  </div>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: d.a_traiter > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>
                      {d.a_traiter}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>À rapprocher</p>
                  </div>
                  <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                    <p style={{ color: "#4caf50", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.rapprochees}</p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Rapprochée(s)</p>
                  </div>
                </div>

                {d.lignes.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                      Aucune ligne de relevé. Connectez la banque, ou importez-en un pour commencer.
                    </p>
                  </div>
                ) : (
                  <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr 0.9fr", background: "rgba(200,169,110,0.12)", padding: "12px 14px", fontSize: "12px", color: "#c8a96e", fontWeight: "bold" }}>
                      <span>Date</span><span>Libellé</span>
                      <span style={{ textAlign: "right" }}>Montant</span>
                      <span style={{ textAlign: "right" }}>État</span>
                    </div>
                    {d.lignes.map(function (l: any) {
                      return (
                        <div key={l.id} style={{ display: "grid", gridTemplateColumns: "0.9fr 2.4fr 1fr 0.9fr", padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", opacity: l.ignore ? 0.4 : 1 }}>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>
                            {new Date(l.operation_date).toLocaleDateString("fr-FR")}
                          </span>
                          <span>{l.libelle}</span>
                          <span style={{ textAlign: "right", color: Number(l.montant) < 0 ? "#e8836a" : "#4caf50" }}>
                            {euros(l.montant)}
                          </span>
                          <span style={{ textAlign: "right", fontSize: "12.5px", color: l.ecriture_num ? "#4caf50" : "rgba(255,255,255,0.4)" }}>
                            {l.ecriture_num ? l.ecriture_num : l.ignore ? "ignorée" : "à traiter"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
