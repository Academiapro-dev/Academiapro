"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// MES SEQUENCES DE RELANCE — 14/09.
//
// Une sequence est une suite d etapes datees EN JOURS depuis l inscription :
// courriel a J0, SMS a J+3, appel a J+7. Le client inscrit lui-meme les
// fiches qu il veut suivre ; le cron de 9 h fait partir ce qui est du.
//
// ⚠️ CE QUE L ECRAN DIT, PARCE QUE C EST CE QUI RASSURE : la sequence
// s arrete des que la personne repond, sept jours au minimum separent deux
// messages, et un desinscrit ne recoit plus rien. Un client qui ignore ces
// regles n ose pas se servir de l outil.
// ⚠️ L ETAPE « APPEL » NE COMPOSE RIEN : elle pose un rappel du jour.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
const CHAMP: any = { width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
const BOUTON: any = { background: OR, color: FOND, padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "9px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13.5px", fontFamily: "Georgia,serif" };

const CANAUX: any = { email: "Courriel", sms: "SMS", appel: "Rappel d'appel" };

// Un exemple qui marche, pour ne pas partir d une page blanche.
const MODELE = [
  { canal: "email", jour: 0, objet: "Suite à notre échange", message: "Bonjour {prenom},\n\nJe reviens vers vous comme convenu.\n\nBien à vous," },
  { canal: "sms", jour: 3, objet: "", message: "Bonjour {prenom}, avez-vous pu regarder ma proposition ? Je reste disponible." },
  { canal: "appel", jour: 7, objet: "", message: "" },
];

export default function PageSequences() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [compteurs, setCompteurs] = useState<any>({});
  const [inscrits, setInscrits] = useState<any[]>([]);
  const [voirInscrits, setVoirInscrits] = useState("");

  const [ouvert, setOuvert] = useState(false);
  const [id, setId] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [etapes, setEtapes] = useState<any[]>([]);

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(); }, []);

  function suffixe(q?: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      const base = q ? "?" + q : "";
      if (!t) return base;
      return base ? base + "&tenant=" + t : "?tenant=" + t;
    } catch { return q ? "?" + q : ""; }
  }

  async function charger() {
    setChargement(true);
    try {
      const r = await fetch("/api/organisme/sequences" + suffixe());
      const d = await r.json();
      if (d.ok) { setSequences(d.sequences || []); setCompteurs(d.compteurs || {}); }
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function chargerInscrits(seq: string) {
    if (voirInscrits === seq) { setVoirInscrits(""); return; }
    setVoirInscrits(seq);
    try {
      const r = await fetch("/api/organisme/sequences" + suffixe("vue=inscrits&sequence=" + encodeURIComponent(seq)));
      const d = await r.json();
      if (d.ok) setInscrits(d.inscrits || []);
    } catch (e) {}
  }

  function nouvelle() {
    setId(""); setNom(""); setDescription(""); setEtapes(MODELE.slice());
    setOuvert(true); setMessage(""); setErreur("");
  }

  function modifier(s: any) {
    setId(s.id); setNom(s.nom); setDescription(s.description || "");
    setEtapes(Array.isArray(s.etapes) ? s.etapes.slice() : []);
    setOuvert(true); setMessage(""); setErreur("");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  }

  function poser(i: number, champ: string, valeur: any) {
    const copie = etapes.slice();
    copie[i] = { ...copie[i], [champ]: valeur };
    setEtapes(copie);
  }

  async function enregistrer() {
    setOccupe("enregistrer"); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/sequences" + suffixe(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: id ? "modifier" : "creer", id: id || undefined, nom: nom, description: description, etapes: etapes }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); setOuvert(false); await charger(); }
      else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe("");
  }

  async function basculer(s: any) {
    setOccupe("etat-" + s.id);
    try {
      const r = await fetch("/api/organisme/sequences" + suffixe(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: s.actif ? "desactiver" : "reactiver", id: s.id }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); await charger(); } else setErreur(d.erreur);
    } catch (e: any) { setErreur(String(e)); }
    setOccupe("");
  }

  async function arreterPour(i: any) {
    if (!window.confirm("Arrêter la séquence pour cette fiche ? L'historique est conservé.")) return;
    setOccupe("arret-" + i.id);
    try {
      const r = await fetch("/api/organisme/sequences" + suffixe(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "arreter", id: i.id }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); await chargerInscrits(voirInscrits); await chargerInscrits(voirInscrits); }
      else setErreur(d.erreur);
    } catch (e: any) { setErreur(String(e)); }
    setOccupe("");
  }

  function jolie(d: any) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return "—"; }
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>RELANCES</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes séquences</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Une séquence enchaîne des relances datées : un courriel aujourd&apos;hui, un SMS
          dans trois jours, un rappel d&apos;appel dans une semaine. Vous choisissez les
          fiches qui la suivent, depuis leur fiche au CRM.
        </p>

        <div style={{ ...CARTE, borderColor: "rgba(76,175,80,0.35)", background: "rgba(76,175,80,0.05)" }}>
          <p style={{ color: VERT, fontSize: "14px", margin: "0 0 6px", fontWeight: "bold" }}>Ce qui ne peut pas arriver</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: 1.8 }}>
            La séquence s&apos;arrête d&apos;elle-même dès que la personne répond, devient
            cliente ou se désinscrit. Jamais deux messages à la même personne en moins de
            sept jours, tous canaux confondus : une étape trop rapprochée est reportée, pas
            supprimée. Et l&apos;étape « rappel d&apos;appel » ne compose rien — elle inscrit
            le contact dans « À rappeler aujourd&apos;hui ».
          </p>
        </div>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {!ouvert && <button onClick={nouvelle} style={{ ...BOUTON, marginBottom: "22px" }}>Créer une séquence</button>}

        {ouvert && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 14px" }}>{id ? "Modifier la séquence" : "Nouvelle séquence"}</h2>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Nom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Relance après devis" style={CHAMP} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>À quoi elle sert (facultatif)</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={CHAMP} />

            <h3 style={{ color: OR, fontSize: "16px", margin: "18px 0 10px" }}>Les étapes</h3>
            {etapes.map(function (e: any, i: number) {
              return (
                <div key={i} style={{ padding: "14px 16px", marginBottom: "12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "10px" }}>
                    <div style={{ flex: "0 1 170px" }}>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Canal</span>
                      <select value={e.canal} onChange={(ev) => poser(i, "canal", ev.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
                        {Object.keys(CANAUX).map(function (c) { return <option key={c} value={c}>{CANAUX[c]}</option>; })}
                      </select>
                    </div>
                    <div style={{ flex: "0 1 130px" }}>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Au jour</span>
                      <input value={String(e.jour)} onChange={(ev) => poser(i, "jour", Number(ev.target.value) || 0)} inputMode="numeric" style={{ ...CHAMP, marginBottom: 0 }} />
                    </div>
                    <button onClick={() => setEtapes(etapes.filter(function (_x: any, j: number) { return j !== i; }))} style={{ ...SECOND, marginBottom: "2px" }}>
                      Retirer
                    </button>
                  </div>

                  {e.canal === "email" && (
                    <>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Objet du courriel</span>
                      <input value={e.objet || ""} onChange={(ev) => poser(i, "objet", ev.target.value)} style={CHAMP} />
                    </>
                  )}
                  {e.canal !== "appel" ? (
                    <>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                        Message — <span style={{ color: OR }}>{"{prenom}"}</span> est remplacé par le prénom du contact
                      </span>
                      <textarea value={e.message || ""} onChange={(ev) => poser(i, "message", ev.target.value)} rows={e.canal === "sms" ? 3 : 6} style={{ ...CHAMP, lineHeight: 1.7 }} />
                      {e.canal === "sms" && (
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: "-6px 0 0" }}>
                          {String(e.message || "").length} caractère(s) · un SMS fait 160 caractères.
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, lineHeight: 1.7 }}>
                      Ce jour-là, le contact apparaît dans « À rappeler aujourd&apos;hui ».
                      Rien n&apos;est composé automatiquement : c&apos;est vous qui appelez.
                    </p>
                  )}
                </div>
              );
            })}

            <button onClick={() => setEtapes(etapes.concat([{ canal: "email", jour: (etapes.length > 0 ? Number(etapes[etapes.length - 1].jour) + 3 : 0), objet: "", message: "" }]))} style={{ ...SECOND, marginBottom: "16px" }}>
              Ajouter une étape
            </button>

            <div style={{ marginTop: "6px" }}>
              <button onClick={enregistrer} disabled={occupe !== ""} style={BOUTON}>
                {occupe === "enregistrer" ? "Enregistrement…" : "Enregistrer la séquence"}
              </button>
              <button onClick={() => setOuvert(false)} style={{ ...SECOND, marginLeft: "12px" }}>Annuler</button>
            </div>
          </div>
        )}

        <h2 style={{ color: OR, fontSize: "18px", margin: "26px 0 14px" }}>Vos séquences</h2>

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : sequences.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucune séquence. Commencez par celle que vous faites le plus souvent à la
              main : la relance après un devis resté sans réponse.
            </p>
          </div>
        ) : (
          sequences.map(function (s: any) {
            const c = compteurs[s.id] || { en_cours: 0, terminees: 0, arretees: 0 };
            const et = Array.isArray(s.etapes) ? s.etapes : [];
            return (
              <div key={s.id} style={{ ...CARTE, opacity: s.actif ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 280px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>
                      {s.nom}{!s.actif && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> · arrêtée</span>}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: "0 0 8px", lineHeight: 1.7 }}>
                      {et.map(function (e: any, i: number) {
                        return (CANAUX[e.canal] || e.canal) + " à J+" + e.jour + (i < et.length - 1 ? " → " : "");
                      }).join("")}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {c.en_cours} en cours · {c.terminees} terminée(s) · {c.arretees} arrêtée(s)
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <button onClick={() => chargerInscrits(s.id)} style={SECOND}>
                      {voirInscrits === s.id ? "Masquer" : "Qui la suit"}
                    </button>
                    <button onClick={() => modifier(s)} style={SECOND}>Modifier</button>
                    <button onClick={() => basculer(s)} disabled={occupe !== ""} style={SECOND}>
                      {s.actif ? "Arrêter" : "Remettre"}
                    </button>
                  </div>
                </div>

                {voirInscrits === s.id && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {inscrits.length === 0 ? (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: 0, lineHeight: 1.7 }}>
                        Personne ne suit cette séquence. Ouvrez une fiche au CRM et inscrivez-la.
                      </p>
                    ) : inscrits.map(function (i: any) {
                      const h = Array.isArray(i.historique) ? i.historique : [];
                      return (
                        <div key={i.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                              {i.fiche_email || i.fiche_id}
                              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginLeft: "8px" }}>
                                étape {Number(i.etape) + 1}
                                {i.statut === "en_cours" ? " · prochaine le " + jolie(i.prochaine_le) : " · " + i.statut}
                                {i.motif_arret ? " (" + i.motif_arret + ")" : ""}
                              </span>
                            </span>
                            {i.statut === "en_cours" && (
                              <button onClick={() => arreterPour(i)} disabled={occupe !== ""} style={{ ...SECOND, padding: "5px 12px", fontSize: "12.5px" }}>
                                Arrêter
                              </button>
                            )}
                          </div>
                          {h.length > 0 && (
                            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: "4px 0 0" }}>
                              {h.map(function (x: any) { return (CANAUX[x.etape] || x.etape) + " " + jolie(x.le) + (x.ok ? "" : " (échec)"); }).join(" · ")}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
