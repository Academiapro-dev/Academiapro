"use client";

// ═══════════════════════════════════════════════════════════════════════
// L ECRAN DSN — 16/09/2026
//
// Un mois, une societe, une declaration. L ecran dit ou en est chaque mois
// et ce qu il reste a faire.
//
// 🚨 LE PARCOURS EST VOLONTAIREMENT CONTRAIGNANT :
//   brouillon → controlee (dsn-val) → deposee → acceptee | rejetee
// ⛔ ON NE PEUT PAS MARQUER « DEPOSEE » UNE DECLARATION QUI N A PAS ETE
// CONTROLEE. Deposer sans passer par dsn-val, c est se garantir un rejet —
// et le rejet arrive apres la date limite, donc avec une penalite.
//
// ⚠️ LE CONTROLE dsn-val EST MANUEL : l outil officiel se telecharge et
// tourne sur le poste. La plateforme ne peut que demander confirmation
// qu il a ete passe, et le consigner.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — « AUCUN BULLETIN » NE SE DIT PLUS SANS SE JUSTIFIER
//
// Au premier essai, l ecran annoncait « 0 mois avec des bulletins » alors
// que la base en portait trois, dont un emis. Aucun message, aucune piste :
// impossible de savoir si la reponse etait « il n y a rien » ou « je n ai
// pas pu lire ». Trois allers-retours ont ete perdus a cette seule
// question.
//
// ⚠️ UN ECRAN VIDE DOIT DIRE POURQUOI IL EST VIDE. Le compte de lecture
// rendu par la route s affiche desormais sous le message : combien de
// bulletins lus, combien d annules ecartes, combien de mois construits.
// Trois chiffres qui repondent en une seconde.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

const OR = "#c8a96e";
const VERT = "#7fc97f";
const ROUGE = "#e57373";
const BLEU = "#7fb3d5";
const FOND = "#0b0b10";
const CARTE = "rgba(255,255,255,0.04)";
const BORD = "1px solid rgba(255,255,255,0.10)";

const CADRE: any = {
  background: CARTE, border: BORD, borderRadius: "10px",
  padding: "18px", marginBottom: "16px",
};
const CHAMP: any = {
  width: "100%", padding: "9px 11px", borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.30)",
  color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};
const LIB: any = {
  display: "block", fontSize: "12px", color: "rgba(255,255,255,0.55)",
  marginBottom: "4px",
};
const BOUTON: any = {
  padding: "9px 16px", borderRadius: "7px", border: "none",
  background: OR, color: "#0b0b10", fontSize: "13.5px", fontWeight: "bold",
  fontFamily: "Georgia,serif", cursor: "pointer",
};
const SECOND: any = {
  ...BOUTON, background: "transparent", color: OR,
  border: "1px solid " + OR, fontWeight: "normal",
};

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function moisLisible(p: string): string {
  const x = String(p).split("-");
  return MOIS[Number(x[1]) - 1] + " " + x[0];
}

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🚨 LA DATE LIMITE DE DEPOT. Le 5 du mois suivant pour les entreprises de
// cinquante salaries et plus, le 15 pour les autres.
// ⚠️ C EST UNE DATE DE RECEPTION, PAS D ENVOI : un depot le 15 a 23 h 50 qui
// echoue est un depot en retard.
function dateLimite(periode: string, effectif: number): string {
  const x = String(periode).split("-");
  const m = Number(x[1]) + 1;
  const annee = m > 12 ? Number(x[0]) + 1 : Number(x[0]);
  const mois = m > 12 ? 1 : m;
  const jour = effectif >= 50 ? 5 : 15;
  return jour + " " + MOIS[mois - 1] + " " + annee;
}

export default function PageDsn() {
  const [secret, setSecret] = useState("");
  const [mois, setMois] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [contenu, setContenu] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState("");
  const [detail, setDetail] = useState<any>(null);
  // 🆕 CE QUE LA ROUTE A REELLEMENT LU.
  const [diag, setDiag] = useState<any>(null);

  useEffect(function () {
    const s = sessionStorage.getItem("paie_secret") || "";
    if (s) { setSecret(s); charger(s); }
  }, []);

  async function appeler(corps: any, s?: string): Promise<any> {
    const cle = s || secret;
    const r = await fetch("/api/dsn/dossier?secret=" + encodeURIComponent(cle), {
      method: "POST",
      // ⚠️ `no-store` COTE NAVIGATEUR AUSSI : la route porte deja ses
      // en-tetes, mais rien n empeche Safari de garder sa propre copie.
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  async function charger(s?: string) {
    setErr(""); setOccupe("charger");
    const d = await appeler({ action: "etat" }, s);
    if (d.success) {
      setMois(d.mois); setSocietes(d.societes);
      setDiag(d.diagnostic || null);
      if (s) sessionStorage.setItem("paie_secret", s);
    } else {
      setErr((d.erreur || "chargement impossible")
        + (d.ou ? " (table : " + d.ou + ")" : ""));
    }
    setOccupe("");
  }

  async function generer(m: any) {
    setErr(""); setMsg(""); setOccupe("generer" + m.periode);
    const r = await fetch("/api/dsn/generer?secret=" + encodeURIComponent(secret), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ societe_id: m.societe_id, periode: m.periode }),
    });
    const d = await r.json();
    if (d.success) {
      setMsg(d.message);
      setDetail(d);
      await charger();
    } else setErr(d.erreur || "génération impossible");
    setOccupe("");
  }

  async function voir(id: string) {
    const d = await appeler({ action: "voir", id: id });
    if (d.success && d.url) window.open(d.url, "_blank");
    else setErr(d.erreur || "ouverture impossible");
  }

  async function lire(id: string) {
    setOccupe("lire");
    const d = await appeler({ action: "contenu", id: id });
    if (d.success) setContenu(d);
    else setErr(d.erreur || "lecture impossible");
    setOccupe("");
  }

  async function controlee(id: string) {
    // 🚨 C EST UNE DECLARATION SUR L HONNEUR : la plateforme n a aucun moyen
    // de verifier que dsn-val a tourne. On demande confirmation explicite.
    if (!confirm("Confirmez-vous que ce fichier est passé dans dsn-val "
      + "sans anomalie bloquante ?\n\n"
      + "L'outil officiel se télécharge sur net-entreprises.fr et tourne "
      + "sur votre poste. Déposer sans ce contrôle, c'est se garantir un "
      + "rejet — et le rejet arrive après la date limite.")) return;

    setOccupe("controlee");
    const d = await appeler({ action: "controlee", id: id });
    if (d.success) { setMsg(d.message); await charger(); }
    else setErr(d.erreur || "impossible");
    setOccupe("");
  }

  async function deposee(id: string) {
    if (!confirm("Marquer cette déclaration comme déposée ?\n\n"
      + "Elle ne pourra plus être modifiée. Une correction passera par une "
      + "nouvelle DSN du même mois, en « annule et remplace ».")) return;

    setOccupe("deposee");
    const d = await appeler({ action: "deposee", id: id });
    if (d.success) { setMsg(d.message); await charger(); }
    else setErr(d.erreur || "impossible");
    setOccupe("");
  }

  // ---- L ECRAN D ENTREE ----
  if (!secret) {
    return (
      <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
        fontFamily: "Georgia,serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: "420px", margin: "60px auto" }}>
          <h1 style={{ color: OR, fontSize: "24px", marginBottom: "6px" }}>
            Déclaration sociale nominative
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px",
            lineHeight: "1.6", marginBottom: "22px" }}>
            Un fichier par mois et par établissement.
          </p>
          <div style={CADRE}>
            <span style={LIB}>Clé d&apos;accès</span>
            <input type="password" value={secret} style={CHAMP}
              onChange={(ev) => setSecret(ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") charger(secret); }} />
            <button onClick={() => charger(secret)} disabled={!secret}
              style={{ ...BOUTON, marginTop: "12px", width: "100%",
                opacity: secret ? 1 : 0.4 }}>
              Ouvrir
            </button>
          </div>
          {err && <p style={{ color: ROUGE, fontSize: "13px" }}>{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia,serif", padding: "30px 20px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <h1 style={{ color: OR, fontSize: "26px", marginBottom: "4px" }}>
          Déclaration sociale nominative
        </h1>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px",
          flexWrap: "wrap", marginBottom: "10px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
            {mois.length} mois avec des bulletins
          </p>
          {/* ⚠️ RECHARGER SANS QUITTER L ECRAN : un bulletin emis dans
              l autre onglet ne se voit pas tout seul. */}
          <button onClick={() => charger()} disabled={occupe !== ""}
            style={{ background: "none", border: "none", color: OR,
              cursor: "pointer", fontSize: "12.5px", padding: 0 }}>
            {occupe === "charger" ? "…" : "recharger"}
          </button>
        </div>

        {/* 🚨 LE RAPPEL QUI EVITE LA PENALITE. */}
        <div style={{ ...CADRE, borderLeft: "3px solid " + OR }}>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.65",
            color: "rgba(255,255,255,0.7)" }}>
            La DSN se dépose <strong>le 5 du mois suivant</strong> pour les
            entreprises de 50 salariés et plus, <strong>le 15</strong> pour
            les autres. C&apos;est une date de réception, pas d&apos;envoi.
            <br />
            Avant tout dépôt, le fichier doit passer dans <strong>dsn-val</strong>,
            l&apos;outil officiel de contrôle — il se télécharge sur
            net-entreprises.fr.
          </p>
        </div>

        {msg && <p style={{ color: VERT, fontSize: "14px", marginBottom: "12px" }}>{msg}</p>}
        {err && <p style={{ color: ROUGE, fontSize: "14px", marginBottom: "12px" }}>{err}</p>}

        {/* ---- LE COMPTE RENDU DE LA DERNIERE GENERATION ---- */}
        {detail && (
          <div style={{ ...CADRE, borderLeft: "3px solid " + BLEU }}>
            <h3 style={{ color: BLEU, fontSize: "15px", marginTop: 0 }}>
              {detail.fichier}
            </h3>
            <p style={{ fontSize: "13px", margin: "0 0 8px",
              color: "rgba(255,255,255,0.7)" }}>
              {detail.nb_individus} salarié(s) · {detail.nb_lignes} lignes ·
              brut {euros(detail.total_brut)} € ·
              cotisations {euros(detail.total_cotisations)} €
              {detail.type === "annule et remplace" && (
                <span style={{ color: OR }}> · annule et remplace</span>
              )}
            </p>

            {(detail.anomalies || []).length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", color: ROUGE, margin: "0 0 5px" }}>
                  {detail.anomalies.length} anomalie(s) à corriger
                </p>
                {detail.anomalies.map(function (a: string, i: number) {
                  return (
                    <p key={i} style={{ fontSize: "12px", lineHeight: "1.55",
                      color: "rgba(255,255,255,0.6)", margin: "0 0 3px" }}>
                      {a}
                    </p>
                  );
                })}
              </div>
            )}

            {/* 🚨 CE QUI RESTE AVANT UN DEPOT REEL, TOUJOURS AFFICHE. */}
            {(detail.avant_depot || []).length > 0 && (
              <div style={{ marginTop: "12px", paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: "12px", color: OR, margin: "0 0 5px" }}>
                  Avant tout dépôt réel
                </p>
                {detail.avant_depot.map(function (a: string, i: number) {
                  return (
                    <p key={i} style={{ fontSize: "11.5px", lineHeight: "1.6",
                      color: "rgba(255,255,255,0.45)", margin: "0 0 3px" }}>
                      {a}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- LE CONTENU DU FICHIER ---- */}
        {contenu && (
          <div style={CADRE}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ color: OR, fontSize: "15px", margin: 0 }}>
                Le fichier, ligne par ligne · {contenu.nb_lignes} lignes
              </h3>
              <button onClick={() => setContenu(null)}
                style={{ background: "none", border: "none", color: OR,
                  cursor: "pointer", fontSize: "12.5px" }}>
                fermer
              </button>
            </div>
            <pre style={{ fontSize: "11px", lineHeight: "1.5",
              color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.35)",
              padding: "12px", borderRadius: "6px", overflow: "auto",
              maxHeight: "400px", fontFamily: "Menlo,monospace", margin: 0 }}>
              {contenu.contenu}
            </pre>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ---- QUAND IL N Y A RIEN, DIRE POURQUOI ----

            🚨 « Aucun bulletin » peut vouloir dire deux choses opposees :
            il n y en a vraiment pas, ou la lecture n a rien rendu. Les
            trois chiffres ci-dessous tranchent sans qu il faille ouvrir la
            base.
            ⚠️ SI `bulletins_lus` EST A ZERO alors que la base en porte, le
            defaut est dans la lecture — pas dans les donnees.
            ═══════════════════════════════════════════════════════════════ */}
        {mois.length === 0 && !occupe && (
          <div style={CADRE}>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)",
              margin: "0 0 10px", lineHeight: "1.6" }}>
              Aucun mois à déclarer. La DSN se construit à partir des
              bulletins <strong>émis</strong> — un brouillon n&apos;a pas été
              remis au salarié, et un bulletin annulé ne compte plus.
            </p>
            {diag && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)",
                margin: 0, lineHeight: "1.7" }}>
                Ce que la lecture a rendu : <strong>{diag.bulletins_lus}</strong> bulletin(s)
                lu(s), dont <strong>{diag.annules_ignores}</strong> annulé(s) écarté(s) ·
                <strong> {diag.societes_lues}</strong> société(s) ·
                <strong> {diag.declarations_lues}</strong> déclaration(s) ·
                <strong> {diag.mois_construits}</strong> mois construit(s).
              </p>
            )}
            {!diag && (
              <p style={{ fontSize: "12px", color: ROUGE, margin: 0 }}>
                La route n&apos;a rendu aucun compte de lecture : elle n&apos;est
                pas à jour.
              </p>
            )}
          </div>
        )}

        {/* ---- LES MOIS ---- */}
        {mois.map(function (m: any) {
          const d = m.declaration;
          const soc = societes.filter(function (s: any) {
            return s.id === m.societe_id;
          })[0];
          const eff = soc && soc.effectif ? Number(soc.effectif) : 0;

          return (
            <div key={m.societe_id + m.periode} style={CADRE}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "16px" }}>{moisLisible(m.periode)}</strong>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                    marginLeft: "10px" }}>
                    {m.societe}
                  </span>
                </div>
                {d && (
                  <span style={{ fontSize: "12px",
                    color: d.statut === "deposee" || d.statut === "acceptee" ? VERT
                      : d.statut === "rejetee" ? ROUGE : OR }}>
                    {d.statut === "brouillon" ? "brouillon"
                      : d.statut === "controlee" ? "contrôlée dans dsn-val"
                      : d.statut === "deposee" ? "déposée"
                      : d.statut === "acceptee" ? "acceptée"
                      : "rejetée"}
                    {Number(d.numero_ordre) > 1 && " · dépôt n°" + d.numero_ordre}
                  </span>
                )}
              </div>

              <p style={{ margin: "6px 0 0", fontSize: "12.5px",
                color: "rgba(255,255,255,0.5)" }}>
                {m.bulletins} bulletin(s) · {m.emis} émis
                {m.brouillons > 0 && (
                  <span style={{ color: OR }}> · {m.brouillons} en brouillon</span>
                )}
                {" · "}brut {euros(m.brut)} €
                {" · "}à déposer avant le {dateLimite(m.periode, eff)}
              </p>

              {/* 🚨 SANS SIRET, AUCUNE DSN N EST POSSIBLE : c est
                  l identifiant de l etablissement declarant. Autant le dire
                  avant le clic plutot qu apres. */}
              {!m.siret && (
                <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: ROUGE,
                  lineHeight: "1.6" }}>
                  Cette société n&apos;a pas de SIRET : la DSN ne peut pas être
                  générée. Une société étrangère ne peut pas être établissement
                  déclarant en France.
                </p>
              )}

              {/* ⛔ LA DSN NE PREND QUE LES BULLETINS EMIS. */}
              {m.emis === 0 && (
                <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: ROUGE }}>
                  Aucun bulletin émis : la DSN ne peut pas être générée. Un
                  brouillon n&apos;a pas été remis au salarié.
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px",
                marginTop: "12px" }}>
                {m.emis > 0 && (!d || d.statut === "brouillon") && (
                  <button onClick={() => generer(m)} disabled={occupe !== ""}
                    style={BOUTON}>
                    {occupe === "generer" + m.periode ? "…"
                      : d ? "Regénérer" : "Générer la DSN"}
                  </button>
                )}

                {m.emis > 0 && d && (d.statut === "deposee" || d.statut === "acceptee") && (
                  <button onClick={() => generer(m)} disabled={occupe !== ""}
                    style={SECOND}>
                    Générer un annule et remplace
                  </button>
                )}

                {d && (
                  <>
                    <button onClick={() => lire(d.id)} style={SECOND}>
                      Lire le fichier
                    </button>
                    <button onClick={() => voir(d.id)} style={SECOND}>
                      Télécharger
                    </button>
                  </>
                )}

                {d && d.statut === "brouillon" && (
                  <button onClick={() => controlee(d.id)} disabled={occupe !== ""}
                    style={{ ...SECOND, color: BLEU, borderColor: BLEU }}>
                    Passé dans dsn-val
                  </button>
                )}

                {d && d.statut === "controlee" && (
                  <button onClick={() => deposee(d.id)} disabled={occupe !== ""}
                    style={{ ...SECOND, color: VERT, borderColor: VERT }}>
                    Marquer déposée
                  </button>
                )}
              </div>

              {d && d.notes && (
                <p style={{ margin: "10px 0 0", fontSize: "11.5px",
                  lineHeight: "1.55", color: ROUGE }}>
                  {d.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
