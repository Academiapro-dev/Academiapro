"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════
// 🆕 06/10/2026 — L EQUIPE DE PRODUCTION
//
// L ecran de Jacques, au-dessus de tous les cabinets : ses preparateurs,
// les cabinets confies a chacun, la charge du mois et la part de bulletins
// renvoyes pour correction.
//
// CE QU IL FAIT :
//   · ajouter un preparateur a l equipe (adresse, nom, pays) ;
//   · l affecter a un cabinet : il y recoit deux droits, « fiche et
//     contrat » et « preparer la paie », rien d autre. Le cabinet garde
//     l emission et le depot, et peut regler ou couper cet acces depuis son
//     propre ecran des collaborateurs ;
//   · le retirer d un cabinet ;
//   · lire, mois par mois, ce qui reste a faire dans chaque cabinet et ce
//     que chacun a prepare.
// ⚠️ L ECRAN NE PROTEGE RIEN : la route /api/admin/production est reservee
// a l administrateur et le verifie a chaque appel.
// ═══════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const MOIS_NOMS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
  "septembre", "octobre", "novembre", "décembre"];

function moisEnLettres(m: string): string {
  const t = String(m || "");
  if (!/^\d{4}-\d{2}$/.test(t)) return t;
  return MOIS_NOMS[Number(t.slice(5, 7)) - 1] + " " + t.slice(0, 4);
}

function pluriel(n: number, un: string, plusieurs: string): string {
  return n + " " + (n > 1 ? plusieurs : un);
}

export default function PageProduction() {
  const [d, setD] = useState<any>(null);
  const [mois, setMois] = useState("");
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [f, setF] = useState<any>({ email: "", nom: "", pays: "" });
  const [ouvert, setOuvert] = useState<any>({});
  // L affectation en cours, par preparateur : le cabinet choisi et, s il y a
  // lieu, les dossiers auxquels on le limite.
  const [choix, setChoix] = useState<any>({});

  useEffect(function () { charger(""); }, []);

  async function charger(m: string) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/production" + (m ? "?mois=" + encodeURIComponent(m) : ""), { cache: "no-store" });
      const data = await r.json();
      if (data.ok) { setD(data); setMois(data.mois || m); }
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function envoyer(corps: any, quoi: string): Promise<boolean> {
    setOccupe(quoi);
    setMessage("");
    setErreur("");
    let ok = false;
    try {
      const r = await fetch("/api/admin/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        ok = true;
        await charger(mois);
        setMessage(data.message || "Enregistré.");
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
    return ok;
  }

  async function ajouterMembre() {
    const ok = await envoyer({ action: "membre", email: f.email, nom: f.nom, pays: f.pays }, "creation");
    if (ok) { setF({ email: "", nom: "", pays: "" }); setFormulaire(false); }
  }

  async function affecter(p: any) {
    const c = choix[p.email] || {};
    if (!c.tenant_id) { setErreur("Choisissez d'abord le cabinet à lui confier."); return; }
    const ok = await envoyer({ action: "affecter", email: p.email, tenant_id: c.tenant_id, dossiers: c.dossiers || [] }, p.email);
    if (ok) setChoix({ ...choix, [p.email]: {} });
  }

  function retirer(p: any, cab: any) {
    if (!confirm("Retirer à " + (p.nom || p.email) + " son accès à " + cab.nom + " ? Il ne pourra plus ouvrir ce cabinet.")) return;
    envoyer({ action: "retirer", email: p.email, tenant_id: cab.tenant_id }, p.email);
  }

  function basculerDossier(p: any, id: string) {
    const c = choix[p.email] || {};
    const l: string[] = (c.dossiers || []).slice();
    const i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    setChoix({ ...choix, [p.email]: { ...c, dossiers: l } });
  }

  function changerMois(pas: number) {
    if (!/^\d{4}-\d{2}$/.test(mois)) return;
    const t = new Date(Date.UTC(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1 + pas, 1));
    const m = t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0");
    setMois(m);
    charger(m);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: OR, fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif" };
  const PLEIN: any = { ...BOUTON, background: OR, color: "#050508", border: "none", padding: "11px 22px", fontSize: "14px" };
  const TITRE: any = { color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" };
  const GRIS: any = { color: "rgba(255,255,255,0.72)", fontSize: "13.5px", lineHeight: 1.7 };

  function Chiffre(props: any) {
    return (
      <div style={{ flex: "1 1 110px", minWidth: "100px" }}>
        <p style={{ margin: 0, fontSize: "24px", color: props.couleur || "#fff" }}>{props.valeur}</p>
        <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "rgba(255,255,255,0.72)" }}>{props.libelle}</p>
      </div>
    );
  }

  const cabinets: any[] = (d && d.cabinets) || [];
  const equipe: any[] = (d && d.equipe) || [];
  const total = cabinets.reduce(function (s: any, c: any) {
    return {
      salaries: s.salaries + c.salaries, a_faire: s.a_faire + c.a_faire, brouillons: s.brouillons + c.brouillons,
      a_valider: s.a_valider + c.a_valider, renvoyes: s.renvoyes + c.renvoyes, emis: s.emis + c.emis,
    };
  }, { salaries: 0, a_faire: 0, brouillons: 0, a_valider: 0, renvoyes: 0, emis: 0 });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Administration
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          LE SERVICE DE PAIE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Équipe de production</h1>
        <p style={{ ...GRIS, marginTop: 0 }}>
          Qui prépare la paie de quel cabinet, ce qui reste à faire ce mois-ci, et la qualité de chacun.
        </p>

        <div style={{ ...CARTE, marginTop: "22px", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.35)" }}>
          <p style={{ ...GRIS, margin: 0, color: "rgba(255,255,255,0.8)" }}>
            Affecter un préparateur à un cabinet lui donne deux droits, et deux seulement :{" "}
            <b style={{ color: OR }}>modifier la fiche et le contrat des salariés</b> et{" "}
            <b style={{ color: OR }}>préparer la paie</b>. L&apos;émission des bulletins et le dépôt des
            déclarations restent au cabinet, qui peut à tout moment régler ou couper cet accès depuis son
            écran des collaborateurs. Chaque affectation est inscrite au journal du cabinet.
          </p>
        </div>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold", lineHeight: 1.7 }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px", lineHeight: 1.7 }}>{erreur}</p>}
        {chargement && !d && <p style={GRIS}>Lecture…</p>}

        {d && d.indisponible && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ margin: 0, color: ROUGE, fontSize: "14px", lineHeight: 1.7 }}>{d.indisponible}</p>
          </div>
        )}

        {d && !d.indisponible && (
          <>
            {/* ══ LE MOIS ══ */}
            <div style={CARTE}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                <p style={{ ...TITRE, margin: 0 }}>LE MOIS DE PAIE — {moisEnLettres(mois).toUpperCase()}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => changerMois(-1)} disabled={chargement} style={BOUTON}>← Mois précédent</button>
                  <button onClick={() => changerMois(1)} disabled={chargement} style={BOUTON}>Mois suivant →</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <Chiffre valeur={total.salaries} libelle="salariés à payer" />
                <Chiffre valeur={total.a_faire} libelle="sans bulletin" couleur={total.a_faire > 0 ? ROUGE : VERT} />
                <Chiffre valeur={total.brouillons} libelle="en brouillon" />
                <Chiffre valeur={total.a_valider} libelle="à valider par le cabinet" />
                <Chiffre valeur={total.renvoyes} libelle="renvoyés pour correction" couleur={total.renvoyes > 0 ? ROUGE : "#fff"} />
                <Chiffre valeur={total.emis} libelle="émis" couleur={VERT} />
              </div>
            </div>

            {/* ══ L EQUIPE ══ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", margin: "26px 0 12px" }}>
              <p style={{ ...TITRE, margin: 0 }}>LES PRÉPARATEURS ({equipe.length})</p>
              <button onClick={() => setFormulaire(!formulaire)} style={formulaire ? BOUTON : PLEIN}>
                {formulaire ? "Annuler" : "Ajouter un préparateur"}
              </button>
            </div>

            {formulaire && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 240px" }}>
                    <span style={LIBELLE}>Adresse électronique</span>
                    <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
                      placeholder="adresse@exemple.fr" autoCapitalize="none" autoCorrect="off" style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIBELLE}>Nom</span>
                    <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Prénom Nom" style={CHAMP} />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIBELLE}>Pays</span>
                    <input value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value })} placeholder="Madagascar" style={CHAMP} />
                  </div>
                </div>
                <button onClick={ajouterMembre} disabled={occupe !== "" || !String(f.email || "").trim()}
                  style={{ ...PLEIN, opacity: String(f.email || "").trim() ? 1 : 0.4 }}>
                  {occupe === "creation" ? "…" : "Ajouter à l'équipe"}
                </button>
                <p style={{ ...GRIS, fontSize: "12.5px", margin: "10px 0 0" }}>
                  L&apos;ajouter à l&apos;équipe ne lui ouvre encore aucun cabinet : c&apos;est l&apos;affectation qui le fait.
                </p>
              </div>
            )}

            {equipe.length === 0 && !formulaire && (
              <div style={CARTE}>
                <p style={{ ...GRIS, margin: 0 }}>
                  Aucun préparateur pour l&apos;instant. Touchez « Ajouter un préparateur ».
                </p>
              </div>
            )}

            {equipe.map(function (p: any) {
              const actifs = (p.cabinets || []).filter(function (c: any) { return c.actif; });
              const c = choix[p.email] || {};
              const libres = cabinets.filter(function (cab: any) {
                return !(p.cabinets || []).some(function (x: any) { return x.tenant_id === cab.tenant_id && x.actif; });
              });
              const cabChoisi = cabinets.filter(function (cab: any) { return cab.tenant_id === c.tenant_id; })[0];
              return (
                <div key={p.email} style={{ ...CARTE, opacity: p.actif ? 1 : 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                        {p.nom || p.email}
                        {p.pays ? <span style={{ color: OR, fontSize: "13.5px" }}>{" · " + p.pays}</span> : null}
                        {!p.actif ? <span style={{ color: ROUGE, fontSize: "13.5px" }}>{" · sorti de l'équipe"}</span> : null}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: "13.5px", color: "rgba(255,255,255,0.72)" }}>{p.email}</p>
                    </div>
                    <button onClick={() => setOuvert({ ...ouvert, [p.email]: !ouvert[p.email] })} style={BOUTON}>
                      {ouvert[p.email] ? "Fermer" : "Ses cabinets"}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "14px" }}>
                    <Chiffre valeur={actifs.length} libelle={actifs.length > 1 ? "cabinets confiés" : "cabinet confié"} />
                    <Chiffre valeur={p.prepares} libelle={"bulletins préparés en " + moisEnLettres(mois)} />
                    <Chiffre valeur={p.emis} libelle="dont émis" couleur={VERT} />
                    <Chiffre valeur={p.renvoyes} libelle="renvoyés pour correction" couleur={p.renvoyes > 0 ? ROUGE : "#fff"} />
                    <Chiffre
                      valeur={p.part_renvoyee === null ? "—" : String(p.part_renvoyee).replace(".", ",") + " %"}
                      libelle="part renvoyée"
                      couleur={p.part_renvoyee === null ? "#fff" : (p.part_renvoyee > 10 ? ROUGE : VERT)} />
                  </div>

                  {ouvert[p.email] && (
                    <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                      {(p.cabinets || []).length === 0 && (
                        <p style={{ ...GRIS, margin: "0 0 12px" }}>Aucun cabinet ne lui est confié.</p>
                      )}
                      {(p.cabinets || []).map(function (cab: any) {
                        const droits = [cab.contrats ? "fiche et contrat" : null, cab.preparer ? "préparer la paie" : null,
                          cab.emettre ? "émettre" : null, cab.deposer ? "déposer" : null]
                          .filter(function (x) { return !!x; }).join(", ") || "aucun droit de paie";
                        return (
                          <div key={cab.tenant_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                            flexWrap: "wrap", gap: "8px", padding: "9px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ flex: "1 1 320px" }}>
                              <p style={{ margin: 0, fontSize: "15px", color: cab.actif ? "#fff" : "rgba(255,255,255,0.6)" }}>
                                {cab.nom}
                                {!cab.actif ? <span style={{ color: ROUGE, fontSize: "13px" }}>
                                  {cab.retire_ici ? " · retiré d'ici" : " · désactivé par le cabinet"}</span> : null}
                              </p>
                              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
                                {cab.tous_dossiers ? "tous les dossiers (" + cab.nb_dossiers + ")" : pluriel(cab.nb_dossiers, "dossier", "dossiers")}
                                {" · " + droits}
                                {cab.cartes_blanches > 0 ? " · carte blanche sur " + pluriel(cab.cartes_blanches, "dossier", "dossiers") : ""}
                                {" · " + pluriel(cab.prepares, "bulletin préparé", "bulletins préparés") + " ce mois"}
                              </p>
                            </div>
                            {cab.actif && (
                              <button onClick={() => retirer(p, cab)} disabled={occupe !== ""}
                                style={{ ...BOUTON, color: ROUGE, borderColor: "rgba(232,131,106,0.5)" }}>
                                Retirer ce cabinet
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {p.actif && (
                        <div style={{ marginTop: "14px", padding: "14px 16px", borderRadius: "10px",
                          background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.3)" }}>
                          <span style={LIBELLE}>Lui confier un cabinet</span>
                          {libres.length === 0 ? (
                            <p style={{ ...GRIS, margin: 0 }}>Tous les cabinets lui sont déjà confiés.</p>
                          ) : (
                            <>
                              <select value={c.tenant_id || ""} style={CHAMP}
                                onChange={(e) => setChoix({ ...choix, [p.email]: { tenant_id: e.target.value, dossiers: [] } })}>
                                <option value="">— choisir un cabinet —</option>
                                {libres.map(function (cab: any) {
                                  return <option key={cab.tenant_id} value={cab.tenant_id}>
                                    {cab.nom + " — " + pluriel(cab.salaries, "salarié", "salariés")}</option>;
                                })}
                              </select>
                              {cabChoisi && cabChoisi.dossiers.length > 1 && (
                                <>
                                  <span style={LIBELLE}>Dossiers confiés — aucun coché signifie tous</span>
                                  <div style={{ marginBottom: "10px" }}>
                                    {cabChoisi.dossiers.map(function (s: any) {
                                      const coche = (c.dossiers || []).indexOf(s.id) >= 0;
                                      return (
                                        <div key={s.id} onClick={() => basculerDossier(p, s.id)}
                                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px",
                                            cursor: "pointer", marginBottom: "8px",
                                            background: coche ? "rgba(200,169,110,0.14)" : "rgba(255,255,255,0.03)",
                                            border: coche ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
                                          <span style={{ width: "19px", height: "19px", flexShrink: 0, borderRadius: "5px",
                                            background: coche ? OR : "transparent", border: coche ? "2px solid " + OR : "2px solid #777",
                                            color: "#050508", display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: "bold", fontSize: "12px" }}>{coche ? "✓" : ""}</span>
                                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                                            {s.raison_sociale + " (" + s.code + ")"}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                              <button onClick={() => affecter(p)} disabled={occupe !== "" || !c.tenant_id}
                                style={{ ...PLEIN, opacity: c.tenant_id ? 1 : 0.4 }}>
                                {occupe === p.email ? "…" : "Confier ce cabinet"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: "14px" }}>
                        <button
                          onClick={() => {
                            if (p.actif && !confirm("Sortir " + (p.nom || p.email) + " de l'équipe ? Ses accès aux cabinets ne sont PAS retirés par ce geste.")) return;
                            envoyer({ action: "membre", email: p.email, actif: !p.actif }, p.email);
                          }}
                          disabled={occupe !== ""}
                          style={{ ...BOUTON, color: p.actif ? ROUGE : VERT, borderColor: "rgba(255,255,255,0.2)" }}>
                          {p.actif ? "Sortir de l'équipe" : "Réintégrer dans l'équipe"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ══ LES CABINETS ══ */}
            <p style={{ ...TITRE, margin: "26px 0 12px" }}>LES CABINETS ({cabinets.length})</p>
            {cabinets.length === 0 && (
              <div style={CARTE}><p style={{ ...GRIS, margin: 0 }}>Aucun cabinet inscrit.</p></div>
            )}
            {cabinets.map(function (cab: any) {
              return (
                <div key={cab.tenant_id} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "17px", color: "#fff" }}>{cab.nom}</p>
                    <p style={{ margin: 0, fontSize: "13.5px", color: cab.preparateurs.length > 0 ? OR : "rgba(255,255,255,0.6)" }}>
                      {cab.preparateurs.length > 0 ? "préparé par " + cab.preparateurs.join(", ") : "aucun préparateur affecté"}
                    </p>
                  </div>
                  <p style={{ ...GRIS, margin: "8px 0 0" }}>
                    {pluriel(cab.dossiers.length, "dossier", "dossiers")} · {pluriel(cab.salaries, "salarié à payer", "salariés à payer")}
                    {" · "}<span style={{ color: cab.a_faire > 0 ? ROUGE : VERT }}>{cab.a_faire} sans bulletin</span>
                    {" · " + cab.brouillons + " en brouillon · " + cab.a_valider + " à valider · "}
                    <span style={{ color: cab.renvoyes > 0 ? ROUGE : "rgba(255,255,255,0.72)" }}>
                      {pluriel(cab.renvoyes, "renvoyé", "renvoyés")}</span>
                    {" · "}<span style={{ color: VERT }}>{pluriel(cab.emis, "émis", "émis")}</span>
                  </p>
                </div>
              );
            })}

            <p style={{ ...GRIS, fontSize: "12.5px", marginTop: "18px" }}>
              « Bulletins préparés » : les bulletins du mois que cette personne a sortis en brouillon ou soumis,
              hors bulletins annulés. « Part renvoyée » : parmi eux, ceux que le cabinet a renvoyés au moins une
              fois pour correction.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
