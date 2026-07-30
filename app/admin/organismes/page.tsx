"use client";
import { useState, useEffect } from "react";

export default function PageOrganismes() {
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [fiche, setFiche] = useState<any>({});

  const [raison, setRaison] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [siret, setSiret] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [telephone, setTelephone] = useState("");
  const [qualiopi, setQualiopi] = useState(false);
  const [certificateur, setCertificateur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) {
        setOrganismes(data.organismes || []);
        const f: any = {};
        for (const o of data.organismes || []) {
          f[o.id] = {
            abonnement: o.abonnement_mensuel !== null && o.abonnement_mensuel !== undefined ? String(o.abonnement_mensuel) : "",
            taux: o.taux_prelevement !== null && o.taux_prelevement !== undefined ? String(o.taux_prelevement) : "",
            lancement: o.lancement_jusqu_au || "",
            telephone: o.telephone || "",
            siret: o.siret || "",
            numero_da: o.numero_da || "",
            adresse: o.adresse || "",
            certificateur: o.certificateur || "",
            notes: o.notes || "",
          };
        }
        setFiche(f);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (!raison.trim() || !emailContact.trim()) return;
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raison_sociale: raison,
          email_contact: emailContact,
          siret: siret,
          numero_da: numeroDa,
          telephone: telephone,
          qualiopi: qualiopi,
          certificateur: certificateur,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Organisme cree. Identifiant : " + (data.organisme?.tenant_id || ""));
        setRaison(""); setEmailContact(""); setSiret(""); setNumeroDa("");
        setTelephone(""); setQualiopi(false); setCertificateur("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Creation impossible.");
      }
    } catch (e: any) {
      setErreur("Creation impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Fiche enregistree.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
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
    padding: "22px 26px",
    marginBottom: "18px",
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

  const LIEN: any = {
    color: "#c8a96e",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid rgba(200,169,110,0.35)",
    padding: "6px 14px",
    borderRadius: "20px",
  };

  function champ(id: string, cle: string) {
    return (fiche[id] && fiche[id][cle]) || "";
  }

  function poser(id: string, cle: string, valeur: string) {
    setFiche({ ...fiche, [id]: { ...(fiche[id] || {}), [cle]: valeur } });
  }

  const actifs = organismes.filter(function (o) { return o.statut === "actif"; }).length;
  const totalStagiaires = organismes.reduce(function (s: number, o: any) { return s + (o.stagiaires || 0); }, 0);

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          CLIENTS DU PACK
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Organismes de formation</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {organismes.length} organisme(s) · {actifs} actif(s) · {totalStagiaires} stagiaire(s)
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "24px 0" }}>
          <a href="/admin/facturation" style={{ ...LIEN, fontSize: "15px", padding: "12px 24px" }}>
            Facturation du mois →
          </a>
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
          >
            {formulaire ? "Annuler" : "Ouvrir un compte client"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 16px" }}>Nouveau client</h2>

            <span style={LIBELLE}>Raison sociale</span>
            <input value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Formation Conseil SARL" style={CHAMP} />

            <span style={LIBELLE}>Email de contact</span>
            <input value={emailContact} onChange={(e) => setEmailContact(e.target.value)} placeholder="direction@exemple.fr" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>SIRET</span>
                <input value={siret} onChange={(e) => setSiret(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Numero de declaration</span>
                <input value={numeroDa} onChange={(e) => setNumeroDa(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Telephone</span>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />

            <div
              onClick={() => setQualiopi(!qualiopi)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: qualiopi ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: qualiopi ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "12px" }}
            >
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: qualiopi ? "#c8a96e" : "transparent", border: qualiopi ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {qualiopi ? "✓" : ""}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>Deja certifie Qualiopi</span>
            </div>

            {qualiopi && (
              <>
                <span style={LIBELLE}>Certificateur</span>
                <input value={certificateur} onChange={(e) => setCertificateur(e.target.value)} placeholder="AFNOR, ICPF..." style={CHAMP} />
              </>
            )}

            <button
              onClick={creer}
              disabled={occupe || !raison.trim() || !emailContact.trim()}
              style={{ background: occupe || !raison.trim() || !emailContact.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !raison.trim() || !emailContact.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Creation..." : "Ouvrir le compte"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold", wordBreak: "break-all" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p></div>
        ) : organismes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun organisme client pour le moment.
            </p>
          </div>
        ) : (
          organismes.map(function (o) {
            const estOuvert = ouvert[o.id] === true;
            const sansContrat = o.abonnement_mensuel === null || o.abonnement_mensuel === undefined;
            return (
              <div key={o.id} style={{ ...CARTE, border: sansContrat ? "1px solid rgba(232,163,61,0.45)" : CARTE.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px" }}>{o.raison_sociale}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 4px" }}>{o.email_contact}</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {o.abonnement_mensuel ? o.abonnement_mensuel + " EUR/mois" : "abonnement non fixe"}
                      {" · prelevement " + (o.taux_prelevement !== null && o.taux_prelevement !== undefined ? o.taux_prelevement : 20) + " %"}
                      {o.lancement_jusqu_au ? " · lancement jusqu au " + new Date(o.lancement_jusqu_au).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 2px" }}>{o.stagiaires}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                      stagiaire(s) · {o.formations_ouvertes} formation(s)
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "16px", flexWrap: "wrap" }}>
                  <span style={{ background: o.statut === "actif" ? "rgba(76,175,80,0.18)" : "rgba(232,131,106,0.18)", color: o.statut === "actif" ? "#4caf50" : "#e8836a", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                    {o.statut}
                  </span>

                  {o.qualiopi && (
                    <span style={{ background: "rgba(200,169,110,0.18)", color: "#c8a96e", padding: "6px 14px", borderRadius: "20px", fontSize: "13px" }}>
                      Qualiopi{o.certificateur ? " · " + o.certificateur : ""}
                    </span>
                  )}

                  <button
                    onClick={() => setOuvert({ ...ouvert, [o.id]: !estOuvert })}
                    style={{ ...LIEN, background: "none", cursor: "pointer", fontFamily: "Georgia,serif" }}
                  >
                    {estOuvert ? "Fermer la fiche" : "Sa fiche"}
                  </button>

                  <a href={"/organisme/catalogue?tenant=" + o.tenant_id} style={LIEN}>Son catalogue</a>
                  <a href={"/organisme/stagiaires?tenant=" + o.tenant_id} style={LIEN}>Ses stagiaires</a>
                  <a href={"/organisme/bilan?tenant=" + o.tenant_id} style={LIEN}>Son bilan</a>

                  <button
                    onClick={() => modifier(o.id, { statut: o.statut === "actif" ? "suspendu" : "actif" })}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                  >
                    {o.statut === "actif" ? "Suspendre" : "Reactiver"}
                  </button>
                </div>

                {estOuvert && (
                  <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <h4 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 14px" }}>
                      Termes du contrat
                    </h4>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 150px" }}>
                        <span style={LIBELLE}>Abonnement mensuel (EUR)</span>
                        <input value={champ(o.id, "abonnement")} onChange={(e) => poser(o.id, "abonnement", e.target.value)} placeholder="500" style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 120px" }}>
                        <span style={LIBELLE}>Prelevement (%)</span>
                        <input value={champ(o.id, "taux")} onChange={(e) => poser(o.id, "taux", e.target.value)} placeholder="20" style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 160px" }}>
                        <span style={LIBELLE}>Tarif de lancement jusqu au</span>
                        <input type="date" value={champ(o.id, "lancement")} onChange={(e) => poser(o.id, "lancement", e.target.value)} style={CHAMP} />
                      </div>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-4px 0 14px", lineHeight: "1.6" }}>
                      Tant que cette date n est pas passee, l abonnement est facture de moitie.
                      Au-dela, le montant plein s applique de plein droit.
                    </p>

                    <h4 style={{ color: "#c8a96e", fontSize: "15px", margin: "18px 0 14px" }}>
                      Coordonnees
                    </h4>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>SIRET</span>
                        <input value={champ(o.id, "siret")} onChange={(e) => poser(o.id, "siret", e.target.value)} style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Numero de declaration</span>
                        <input value={champ(o.id, "numero_da")} onChange={(e) => poser(o.id, "numero_da", e.target.value)} style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Telephone</span>
                        <input value={champ(o.id, "telephone")} onChange={(e) => poser(o.id, "telephone", e.target.value)} style={CHAMP} />
                      </div>
                    </div>

                    <span style={LIBELLE}>Adresse</span>
                    <input value={champ(o.id, "adresse")} onChange={(e) => poser(o.id, "adresse", e.target.value)} style={CHAMP} />

                    <span style={LIBELLE}>Certificateur</span>
                    <input value={champ(o.id, "certificateur")} onChange={(e) => poser(o.id, "certificateur", e.target.value)} placeholder="AFNOR, ICPF..." style={CHAMP} />

                    <span style={LIBELLE}>Notes internes</span>
                    <textarea value={champ(o.id, "notes")} onChange={(e) => poser(o.id, "notes", e.target.value)} rows={3} style={CHAMP} />

                    <button
                      onClick={() => modifier(o.id, {
                        abonnement_mensuel: champ(o.id, "abonnement"),
                        taux_prelevement: champ(o.id, "taux"),
                        lancement_jusqu_au: champ(o.id, "lancement") || null,
                        siret: champ(o.id, "siret"),
                        numero_da: champ(o.id, "numero_da"),
                        telephone: champ(o.id, "telephone"),
                        adresse: champ(o.id, "adresse"),
                        certificateur: champ(o.id, "certificateur"),
                        notes: champ(o.id, "notes"),
                      })}
                      style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                    >
                      Enregistrer la fiche
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
