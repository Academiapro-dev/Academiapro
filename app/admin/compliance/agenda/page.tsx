"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// L AGENDA — L ECRAN DU MATIN — 31/08.
//
// 🚨 CE QU IL DOIT REPONDRE EN TROIS SECONDES : qu est-ce qui brule ?
// Un gestionnaire qui suit des centaines de societes ouvre son logiciel
// pour cela, et pour rien d autre. Le tri est donc par DATE, jamais par
// societe : l ordre alphabetique n apprend rien.
//
// 🚨 L ARMEMENT DES RELANCES SE FAIT D ICI. Sans ce geste, relance_auto et
// email_contact ne se reglent qu en SQL — autant dire que la fonction
// n existe pas pour le client. Et une societe non armee ne declenche
// AUCUNE relance : c est precisement ce qu il achete, donc la colonne le
// signale en rouge.
//
// ⚠️ LE COURRIEL EST CELUI DU CLIENT FINAL, pas celui du gestionnaire :
// c est lui qui doit reunir les pieces et deposer.
// ---------------------------------------------------------------------------

const VERT = "#0a3d2e";
const ROUGE = "#c62828";
const AMBRE = "#8a6d2f";

function couleurDelai(jours: number, echue: boolean): string {
  if (echue) return ROUGE;
  if (jours <= 7) return ROUGE;
  if (jours <= 30) return AMBRE;
  return "#2e7d32";
}

export default function Agenda() {
  const [chargement, setChargement] = useState(true);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [resume, setResume] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [horizon, setHorizon] = useState(60);
  const [echues, setEchues] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // L armement se fait ligne par ligne, sans quitter l ecran.
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function charger(p: number, j: number, avecEchues: boolean) {
    setChargement(true);
    setErreur(null);
    try {
      const url = "/api/compliance/agenda?page=" + p + "&jours=" + j
        + (avecEchues ? "&echues=1" : "");
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setEcheances(d.echeances || []);
        setResume(d.resume || null);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setPage(d.page || 1);
      } else {
        setErreur(d.erreur || "Chargement impossible.");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger(1, 60, false);
  }, []);

  // Armer une societe : on renseigne l adresse du client et on active la
  // relance. Les deux vont ensemble — armer sans adresse ne produirait rien.
  async function armer(entiteId: string, adresse: string, actif: boolean) {
    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/entites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entiteId,
          email_contact: adresse.trim() || null,
          relance_auto: actif,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMsg(actif
          ? "Relances activées pour " + d.entite.label + "."
          : "Relances désactivées pour " + d.entite.label + ".");
        setOuvert(null);
        setEmail("");
        charger(page, horizon, echues);
      } else {
        setMsg("Erreur : " + (d.erreur || "inconnue"));
      }
    } catch (e: any) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  const styleBouton: any = {
    background: VERT,
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    marginRight: 8,
  };

  const styleBoutonClair: any = {
    ...styleBouton,
    background: "#ffffff",
    color: VERT,
    border: "1px solid " + VERT,
  };

  const styleCarteResume: any = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "14px 18px",
    textAlign: "center",
    minWidth: 120,
    flex: 1,
  };

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        <p style={{ marginTop: 0, marginBottom: 8 }}>
          <a href="/admin/compliance/entites" style={{ color: VERT, textDecoration: "none" }}>
            Portefeuille
          </a>
        </p>

        <h1 style={{ color: VERT, borderBottom: "3px solid " + VERT, paddingBottom: 10 }}>
          Échéances
        </h1>

        {/* LE RESUME : la seule question du matin. */}
        {resume && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ ...styleCarteResume, borderColor: resume.echues > 0 ? ROUGE : "#ddd" }}>
              <div style={{ fontSize: 28, color: resume.echues > 0 ? ROUGE : "#999" }}>
                {resume.echues}
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>échue{resume.echues > 1 ? "s" : ""}</div>
            </div>
            <div style={{ ...styleCarteResume, borderColor: resume.sous_7_jours > 0 ? ROUGE : "#ddd" }}>
              <div style={{ fontSize: 28, color: resume.sous_7_jours > 0 ? ROUGE : "#999" }}>
                {resume.sous_7_jours}
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>sous 7 jours</div>
            </div>
            <div style={{ ...styleCarteResume }}>
              <div style={{ fontSize: 28, color: AMBRE }}>{resume.sous_30_jours}</div>
              <div style={{ fontSize: 13, color: "#666" }}>sous 30 jours</div>
            </div>
            <div style={{ ...styleCarteResume, borderColor: resume.sans_relance_armee > 0 ? AMBRE : "#ddd" }}>
              <div style={{ fontSize: 28, color: resume.sans_relance_armee > 0 ? AMBRE : "#999" }}>
                {resume.sans_relance_armee}
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>sans relance</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "#666" }}>Horizon :</span>
          {[30, 60, 90, 365].map((j) => (
            <button
              key={j}
              onClick={() => { setHorizon(j); charger(1, j, echues); }}
              style={horizon === j ? styleBouton : styleBoutonClair}
            >
              {j === 365 ? "1 an" : j + " jours"}
            </button>
          ))}
          <button
            onClick={() => { const v = !echues; setEchues(v); charger(1, horizon, v); }}
            style={echues ? styleBouton : styleBoutonClair}
          >
            {echues ? "Échues affichées" : "Afficher les échues"}
          </button>
          <span style={{ marginLeft: "auto", color: "#666", fontSize: 14 }}>
            {total} échéance{total > 1 ? "s" : ""}
          </span>
        </div>

        {msg && (
          <p style={{ marginBottom: 16, color: msg.indexOf("Erreur") === 0 ? ROUGE : VERT }}>
            {msg}
          </p>
        )}

        {chargement && <p>Chargement…</p>}
        {erreur && <p style={{ color: ROUGE }}>Erreur : {erreur}</p>}

        {!chargement && !erreur && echeances.length === 0 && (
          <div style={{ background: "#f0f5f2", borderLeft: "4px solid " + VERT, padding: 16 }}>
            Aucune échéance dans cet horizon. Élargissez la période ou ajoutez des
            sociétés depuis le portefeuille.
          </div>
        )}

        {!chargement && echeances.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: VERT, color: "#ffffff" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Date</th>
                <th style={{ padding: 10, textAlign: "left" }}>Société</th>
                <th style={{ padding: 10, textAlign: "left" }}>Obligation</th>
                <th style={{ padding: 10 }}>Statut</th>
                <th style={{ padding: 10 }}>Relance</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {echeances.map((e: any) => (
                <>
                  <tr key={e.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                    <td style={{ padding: 10, color: couleurDelai(e.jours, e.echue), fontWeight: 600 }}>
                      {e.due_date}
                      <br />
                      <span style={{ fontSize: 13, fontWeight: 400 }}>
                        {e.echue ? "échue" : "J-" + e.jours}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <a
                        href={"/admin/compliance?entite=" + e.entite_id}
                        style={{ color: VERT, textDecoration: "none", fontWeight: 600 }}
                      >
                        {e.societe}
                      </a>
                      {e.etat && (
                        <><br /><span style={{ fontSize: 13, color: "#666" }}>{e.etat}</span></>
                      )}
                    </td>
                    <td style={{ padding: 10 }}>
                      {e.obligation}
                      {e.periode && (
                        <><br /><span style={{ fontSize: 13, color: "#666" }}>{e.periode}</span></>
                      )}
                    </td>
                    <td style={{ padding: 10, textAlign: "center", fontSize: 14 }}>
                      {e.statut === "a_venir" ? "À venir"
                        : e.statut === "prepare" ? "Préparé"
                        : e.statut === "depose" ? "Déposé"
                        : e.statut}
                    </td>
                    <td style={{ padding: 10, textAlign: "center", fontSize: 14 }}>
                      {e.relance_armee ? (
                        <span style={{ color: "#2e7d32" }}>armée</span>
                      ) : (
                        <span style={{ color: AMBRE }}>non armée</span>
                      )}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <button
                        onClick={() => {
                          if (ouvert === e.entite_id) {
                            setOuvert(null);
                          } else {
                            setOuvert(e.entite_id);
                            setEmail(e.email_contact || "");
                          }
                        }}
                        style={{ ...styleBoutonClair, marginRight: 0, padding: "6px 12px", fontSize: 13 }}
                      >
                        {ouvert === e.entite_id ? "Fermer" : "Relances"}
                      </button>
                    </td>
                  </tr>

                  {ouvert === e.entite_id && (
                    <tr key={e.id + "-armement"} style={{ background: "#f8f8f4" }}>
                      <td colSpan={6} style={{ padding: 16 }}>
                        <div style={{ fontSize: 14, color: "#555", marginBottom: 10 }}>
                          Adresse du client final — c&apos;est lui qui reçoit la relance,
                          à J-60, J-30, J-15, J-7 et J-1.
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            value={email}
                            onChange={(ev) => setEmail(ev.target.value)}
                            placeholder="client@exemple.com"
                            style={{
                              padding: 10,
                              fontSize: 15,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              background: "#ffffff",
                              color: "#1a1a1a",
                              minWidth: 260,
                            }}
                          />
                          <button
                            onClick={() => armer(e.entite_id, email, true)}
                            disabled={enCours || email.trim().indexOf("@") < 1}
                            style={{
                              ...styleBouton,
                              opacity: enCours || email.trim().indexOf("@") < 1 ? 0.5 : 1,
                            }}
                          >
                            {enCours ? "…" : "Activer les relances"}
                          </button>
                          {e.relance_armee && (
                            <button
                              onClick={() => armer(e.entite_id, email, false)}
                              disabled={enCours}
                              style={styleBoutonClair}
                            >
                              Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => charger(page - 1, horizon, echues)}
              disabled={page <= 1}
              style={{ ...styleBoutonClair, opacity: page <= 1 ? 0.4 : 1 }}
            >
              ← Précédent
            </button>
            <span style={{ color: "#666" }}>Page {page} sur {pages}</span>
            <button
              onClick={() => charger(page + 1, horizon, echues)}
              disabled={page >= pages}
              style={{ ...styleBoutonClair, opacity: page >= pages ? 0.4 : 1 }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
