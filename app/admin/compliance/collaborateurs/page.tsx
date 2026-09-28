"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════
// 🆕 28/09 — LES DROITS DE PAIE ET LA CARTE BLANCHE
//
// Deux groupes de droits : la comptabilite (inchangee) et la paie (quatre
// droits : fiche et contrat, preparer, emettre, deposer). Puis, pour qui a
// le droit d emettre, la CARTE BLANCHE dossier par dossier : sans elle, ses
// bulletins passent par la validation d un associe ; avec elle, il emet
// seul. L associe l a d office.
// ⚠️ UN CLIC = UN DROIT : la route garde les autres tels quels (elle les
// remettait aux valeurs du role jusqu au 28/09).
// ⚠️ L ECRAN EST OUVERT A L ADMINISTRATEUR ET AUX ASSOCIES : la route le
// verifie, l ecran ne protege rien.
// 🆕 28/09 — L ACCES : ajouter un collaborateur lui ouvre son acces et lui
// envoie une invitation ; « Envoyer l'invitation » le fait pour une fiche
// deja enregistree. Et le JOURNAL du cabinet se lit en bas de l ecran.
// ═══════════════════════════════════════════════════════════════════════

const DROITS_COMPTA = [
  ["peut_saisir", "Saisir des écritures"],
  ["peut_valider", "Valider et lettrer"],
  ["peut_deposer_pieces", "Déposer des pièces"],
  ["peut_gerer_plan", "Gérer le plan comptable"],
  ["peut_declarer", "Établir les déclarations"],
  ["peut_cloturer", "Clôturer un exercice"],
];

const DROITS_PAIE = [
  ["peut_paie_preparer", "Préparer la paie (éléments du mois, congés, arrêts, calcul, brouillon)"],
  ["peut_paie_contrats", "Modifier la fiche et le contrat des salariés (salaire, horaire, taux de prélèvement)"],
  ["peut_paie_emettre", "Émettre les bulletins et les documents de fin de contrat"],
  ["peut_dsn_deposer", "Déposer les déclarations sociales"],
];

export default function PageCollaborateurs() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [journal, setJournal] = useState<any[] | null>(null);

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
        if (quoi === "creation") {
          setF({ email: "", nom: "", role: "collaborateur", dossiers: [] });
          setFormulaire(false);
        }
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
  const GROUPE: any = { color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "14px 0 8px" };

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

  // La carte blanche d un collaborateur sur un dossier : on bascule ce
  // dossier dans sa liste, et on n envoie que cette liste.
  function basculerCarteBlanche(c: any, id: string) {
    const l = (c.paie_carte_blanche || []).slice();
    const i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1);
    else l.push(id);
    envoyer({ email: c.email, paie_carte_blanche: l }, c.id);
  }

  async function chargerJournal() {
    setOccupe("journal"); setErreur("");
    try {
      const r = await fetch("/api/compliance/collaborateurs?journal=1");
      const data = await r.json();
      if (data.ok) setJournal(data.journal || []);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setOccupe("");
  }

  function quand(v: any): string {
    const d = new Date(String(v || ""));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }

  function nomDossier(id: string): string {
    const s = ((d && d.dossiers) || []).filter(function (x: any) { return x.id === id; })[0];
    return s ? s.raison_sociale + " (" + s.code + ")" : id;
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          LE CABINET
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Collaborateurs</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Qui a le droit de faire quoi, et sur quels dossiers
        </p>

        <div style={{ ...CARTE, marginTop: "22px", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.35)" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
            Ces droits sont appliqués par le logiciel lui-même, et non simplement affichés ici.
            Un collaborateur ne peut ni écrire ni même consulter un dossier qui ne lui est pas
            confié, et chaque geste réservé — clôture, déclaration, plan comptable, émission d&apos;un
            bulletin de paie — lui est refusé s&apos;il ne porte pas le droit correspondant. Un associé
            garde tout.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "10px 0 0", lineHeight: "1.8" }}>
            <b style={{ color: "#c8a96e" }}>La carte blanche</b> s&apos;accorde dossier par dossier à qui peut
            émettre les bulletins. Sans elle, ses bulletins passent d&apos;abord par la validation d&apos;un
            associé ; avec elle, il émet seul. Le suivi de ses corrections, dans l&apos;écran de paie,
            aide à décider quand la donner.
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
                <span style={LIBELLE}>Adresse électronique</span>
                <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="adresse@exemple.fr" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Nom</span>
                <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Prénom Nom" style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Rôle</span>
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} style={CHAMP}>
              {d.roles.map(function (r: any) {
                return <option key={r.code} value={r.code}>{r.nom}</option>;
              })}
            </select>

            {d.dossiers.length > 0 && (
              <>
                <span style={LIBELLE}>Dossiers autorisés — aucun coché signifie tous</span>
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
              {occupe === "creation" ? "Enregistrement…" : "Ajouter"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Le rôle pose des droits de départ, que vous pourrez ensuite régler un par un sur
              la fiche du collaborateur. Un associé a tous les droits et la carte blanche ; un
              collaborateur ou un assistant prépare la paie, sans l&apos;émettre.
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture…</p></div>
        ) : !d ? null : d.collaborateurs.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun collaborateur enregistré.
            </p>
          </div>
        ) : (
          d.collaborateurs.map(function (c: any) {
            const estOuvert = ouvert[c.id] === true;
            const dossiersPossibles = (c.dossiers && c.dossiers.length > 0)
              ? c.dossiers : (d.dossiers || []).map(function (s: any) { return s.id; });
            return (
              <div key={c.id} style={{ ...CARTE, opacity: c.actif ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 240px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                      {c.role_nom}
                      {c.tous_dossiers ? " · tous les dossiers" : " · " + c.nb_dossiers + " dossier(s)"}
                      {c.role === "associe" ? " · carte blanche d'office"
                        : (c.paie_carte_blanche || []).length > 0 ? " · carte blanche sur " + c.paie_carte_blanche.length + " dossier(s)" : ""}
                      {!c.actif ? " · DÉSACTIVÉ" : ""}
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
                    <p style={GROUPE}>COMPTABILITÉ</p>
                    {DROITS_COMPTA.map(function (dr: any) {
                      return (
                        <Case
                          key={dr[0]}
                          actif={c[dr[0]] === true}
                          onClick={() => envoyer({ email: c.email, [dr[0]]: !c[dr[0]] }, c.id)}
                          texte={dr[1]}
                        />
                      );
                    })}

                    <p style={GROUPE}>PAIE</p>
                    {DROITS_PAIE.map(function (dr: any) {
                      return (
                        <Case
                          key={dr[0]}
                          actif={c[dr[0]] === true}
                          onClick={() => envoyer({ email: c.email, [dr[0]]: !c[dr[0]] }, c.id)}
                          texte={dr[1]}
                        />
                      );
                    })}

                    {c.peut_paie_emettre === true && c.role !== "associe" && (
                      <>
                        <p style={GROUPE}>CARTE BLANCHE — ÉMET SANS VALIDATION</p>
                        {dossiersPossibles.length === 0 ? (
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Aucun dossier confié.</p>
                        ) : dossiersPossibles.map(function (id: string) {
                          return (
                            <Case
                              key={"cb" + id}
                              actif={(c.paie_carte_blanche || []).indexOf(id) >= 0}
                              onClick={() => basculerCarteBlanche(c, id)}
                              texte={nomDossier(id)}
                            />
                          );
                        })}
                      </>
                    )}
                    {c.role === "associe" && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1.6 }}>
                        Un associé a la carte blanche d&apos;office sur tous les dossiers du cabinet.
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                      {c.actif && (
                        <button
                          onClick={() => envoyer({ email: c.email, inviter: true }, c.id)}
                          disabled={occupe !== ""}
                          style={BOUTON}
                        >
                          {occupe === c.id ? "…" : "Envoyer l'invitation"}
                        </button>
                      )}
                      <button
                        onClick={() => envoyer({ email: c.email, actif: !c.actif }, c.id)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, color: c.actif ? "#e8836a" : "#4caf50", borderColor: "rgba(255,255,255,0.2)" }}
                      >
                        {c.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "8px 0 0", lineHeight: 1.6 }}>
                      L&apos;invitation ouvre son accès à l&apos;espace du cabinet et lui explique comment se connecter.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 🆕 28/09 — LE JOURNAL DU CABINET : qui a fait quoi, et quand. */}
        {d && (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px" }}>
              <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: 0 }}>JOURNAL DU CABINET</p>
              <button onClick={chargerJournal} disabled={occupe !== ""} style={BOUTON}>
                {occupe === "journal" ? "…" : journal ? "Actualiser" : "Voir le journal"}
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "8px 0 0", lineHeight: 1.6 }}>
              Les 300 derniers gestes de paie, de DSN et d&apos;équipe : qui, quand, sur quel dossier.
            </p>
            {journal && journal.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: 0 }}>Aucun geste enregistré.</p>
            )}
            {journal && journal.map(function (l: any, i: number) {
              return (
                <div key={i} style={{ padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", lineHeight: 1.6 }}>
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>{quand(l.quand)}</span>
                  {" · "}<span style={{ color: "#fff" }}>{l.qui}</span>
                  {" "}<span style={{ color: "rgba(255,255,255,0.8)" }}>{l.libelle}</span>
                  {l.dossier ? <span style={{ color: "#c8a96e" }}>{" — " + l.dossier}</span> : null}
                  {l.detail ? <span style={{ color: "rgba(255,255,255,0.5)" }}>{" — " + l.detail}</span> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
