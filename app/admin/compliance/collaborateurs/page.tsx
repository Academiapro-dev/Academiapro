"use client";
import { useState, useEffect } from "react";

const DROITS = [
  ["peut_saisir", "Saisir des ecritures"],
  ["peut_valider", "Valider et lettrer"],
  ["peut_deposer_pieces", "Deposer des pieces"],
  ["peut_gerer_plan", "Gerer le plan comptable"],
  ["peut_declarer", "Etablir les declarations"],
  ["peut_cloturer", "Cloturer un exercice"],
];

export default function PageCollaborateurs() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});

  const [f, setF] = useState<any>({ email: "", nom: "", role: "collaborateur", dossiers: [] });

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/collaborateurs");
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function envoyer(corps: any, quoi: string) {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/collaborateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setF({ email: "", nom: "", role: "collaborateur", dossiers: [] });
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function Case({ actif, onClick, texte }: any) {
    return (
      <div
        onClick={onClick}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", background: actif ? "rgba(200,169,110,0.14)" : "rgba(255,255,255,0.03)", border: actif ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.1)", marginBottom: "8px" }}
      >
        <span style={{ width: "19px", height: "19px", flexShrink: 0, borderRadius: "5px", background: actif ? "#c8a96e" : "transparent", border: actif ? "2px solid #c8a96e" : "2px solid #777", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px" }}>
          {actif ? "✓" : ""}
        </span>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>{texte}</span>
      </div>
    );
  }

  function basculerDossier(id: string) {
    const l = (f.dossiers || []).slice();
    const i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1);
    else l.push(id);
    setF({ ...f, dossiers: l });
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Collaborateurs</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Qui a le droit de faire quoi, et sur quels dossiers
        </p>

        <div style={{ ...CARTE, marginTop: "22px", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.35)" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
            Ces droits sont appliques par le logiciel lui-meme, et non simplement affiches ici.
            Un collaborateur ne peut ni ecrire ni meme consulter un dossier qui ne lui est pas
            confie, et chaque geste reserve — cloture, declaration, plan comptable — lui est
            refuse s il ne porte pas le droit correspondant. Un associe garde tout.
          </p>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ ...BOUTON, background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? BOUTON.border : "none", fontWeight: "bold", padding: "11px 22px", fontSize: "14px", marginBottom: "16px" }}
        >
          {formulaire ? "Annuler" : "Ajouter un collaborateur"}
        </button>

        {formulaire && d && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={LIBELLE}>Adresse email</span>
                <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="marie@cabinet.fr" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Nom</span>
                <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Marie Dupont" style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Role</span>
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} style={CHAMP}>
              {d.roles.map(function (r: any) {
                return <option key={r.code} value={r.code}>{r.nom}</option>;
              })}
            </select>

            {d.dossiers.length > 0 && (
              <>
                <span style={LIBELLE}>Dossiers autorises — aucun coche signifie tous</span>
                <div style={{ marginBottom: "12px" }}>
                  {d.dossiers.map(function (s: any) {
                    return (
                      <Case
                        key={s.id}
                        actif={(f.dossiers || []).indexOf(s.id) >= 0}
                        onClick={() => basculerDossier(s.id)}
                        texte={s.raison_sociale + " (" + s.code + ")"}
                      />
                    );
                  })}
                </div>
              </>
            )}

            <button
              onClick={() => envoyer(f, "creation")}
              disabled={occupe !== "" || f.email.indexOf("@") < 1}
              style={{ background: occupe !== "" || f.email.indexOf("@") < 1 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Enregistrement..." : "Ajouter"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Le role pose des droits de depart, que vous pourrez ensuite regler un par un sur
              la fiche du collaborateur.
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p></div>
        ) : !d ? null : d.collaborateurs.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun collaborateur enregistre.
            </p>
          </div>
        ) : (
          d.collaborateurs.map(function (c: any) {
            const estOuvert = ouvert[c.id] === true;
            return (
              <div key={c.id} style={{ ...CARTE, opacity: c.actif ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 240px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                      {c.role_nom}
                      {c.tous_dossiers ? " · tous les dossiers" : " · " + c.nb_dossiers + " dossier(s)"}
                      {!c.actif ? " · DESACTIVE" : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>{c.nom || c.email}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                      {c.email}
                    </p>
                  </div>
                  <button onClick={() => setOuvert({ ...ouvert, [c.id]: !estOuvert })} style={BOUTON}>
                    {estOuvert ? "Fermer" : "Ses droits"}
                  </button>
                </div>

                {estOuvert && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {DROITS.map(function (dr: any) {
                      return (
                        <Case
                          key={dr[0]}
                          actif={c[dr[0]] === true}
                          onClick={() => envoyer({ email: c.email, nom: c.nom, role: c.role, dossiers: c.dossiers, ...{ [dr[0]]: !c[dr[0]] } }, c.id)}
                          texte={dr[1]}
                        />
                      );
                    })}

                    <button
                      onClick={() => envoyer({ email: c.email, nom: c.nom, role: c.role, dossiers: c.dossiers, actif: !c.actif }, c.id)}
                      disabled={occupe !== ""}
                      style={{ ...BOUTON, color: c.actif ? "#e8836a" : "#4caf50", borderColor: "rgba(255,255,255,0.2)", marginTop: "8px" }}
                    >
                      {c.actif ? "Desactiver" : "Reactiver"}
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
