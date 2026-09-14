"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LES MANDATS ET LE REGISTRE — 14/09.
//
// DEUX ECRANS EN UN : la liste de travail — ce qui court, ce qui va finir —
// et LE REGISTRE, dans l ordre des numeros, tel qu on le presente a un
// controle de la CCI ou de la DGCCRF.
//
// 🚨 LE REGISTRE NE SE FILTRE PAS. Pas de recherche, pas de tri, pas de
// « masquer les resilies » : un registre filtre n est plus un registre. Le
// bouton bascule d une vue a l autre, il ne trie rien.
//
// 🚨 UN MANDAT NE SE SUPPRIME PAS et l ecran n en offre pas le moyen. Il se
// resilie, expire ou se realise. Un trou dans la numerotation est ce que le
// controle cherche en premier.
//
// ⚠️ L IRREVOCABILITE DE PLUS DE TROIS MOIS EST REFUSEE PAR LA ROUTE sur un
// exclusif. L ecran le dit AVANT la saisie, pour que le refus ne soit pas
// une surprise — mais c est la route qui tranche, parce qu un controle a
// l ecran se contourne.
//
// ⚠️ UN MANDAT SE CREE DEPUIS UN BIEN : le bien, le proprietaire, le prix
// et les honoraires viennent de lui. Ouvert sans bien, l ecran le dit et
// renvoie au portefeuille.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" };
const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };
const ETIQ: any = { display: "block", fontSize: "12.5px", color: "rgba(255,255,255,0.55)", marginBottom: "2px" };

const LIB_TYPE: any = { simple: "Simple", exclusif: "Exclusif", semi_exclusif: "Semi-exclusif" };
const LIB_STATUT: any = { en_cours: "En cours", expire: "Échu", resilie: "Résilié", realise: "Réalisé" };

function euros(n: any) {
  if (n === null || n === undefined || n === "") return "—";
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}
function jolie(d: any) {
  if (!d) return "—";
  try { return new Date(String(d) + "T12:00:00Z").toLocaleDateString("fr-FR"); } catch (e) { return String(d); }
}

export default function PageMandats() {
  const [mandats, setMandats] = useState<any[]>([]);
  const [enCours, setEnCours] = useState(0);
  const [bientot, setBientot] = useState(0);
  const [vueRegistre, setVueRegistre] = useState(false);

  const [bienId, setBienId] = useState("");
  const [nomBien, setNomBien] = useState("");
  const [creation, setCreation] = useState(false);

  const [type, setType] = useState("simple");
  const [signeLe, setSigneLe] = useState("");
  const [duree, setDuree] = useState("3");
  const [irrevocabilite, setIrrevocabilite] = useState("0");
  const [horsEtab, setHorsEtab] = useState(false);
  const [notes, setNotes] = useState("");

  const [ouvert, setOuvert] = useState<any>(null);

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  // Quand la route sait ou envoyer le client, l ecran pose le lien : un
  // message qui dit quoi faire sans dire ou est un message a moitie ecrit.
  const [allerA, setAllerA] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const b = p.get("bien") || "";
    const n = p.get("nom") || "";
    setBienId(b);
    setNomBien(n);
    if (b) setCreation(true);

    const d = new Date();
    setSigneLe(
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0")
    );
    charger(false);
  }, []);

  async function charger(registre: boolean) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/mandats" + (registre ? "?registre=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setMandats(d.mandats || []);
        setEnCours(d.en_cours || 0);
        setBientot(d.bientot_finis || 0);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function creer() {
    setErreur(""); setMessage("");
    if (!bienId) { setErreur("Un mandat se crée depuis un bien."); return; }
    setOccupe("creer");
    try {
      const r = await fetch("/api/organisme/mandats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "creer", bien_id: bienId, type_mandat: type,
          signe_le: signeLe, duree_mois: duree, irrevocabilite_mois: irrevocabilite,
          hors_etablissement: horsEtab, notes: notes,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message);
        setAllerA("");
        setCreation(false); setBienId(""); setNotes("");
        await charger(vueRegistre);
        if (d.mandat) setOuvert(d.mandat);
      } else {
        setErreur(d.erreur || "Création impossible.");
        setAllerA(d.aller_a || "");
      }
    } catch (e: any) { setErreur("Création impossible : " + String(e)); }
    setOccupe("");
  }

  async function changerStatut(m: any, statut: string) {
    let motif = "";
    if (statut === "resilie") {
      const saisi = prompt("Pourquoi ce mandat est-il résilié ?", "");
      if (saisi === null) return;
      motif = saisi;
    }
    setOccupe("st"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/mandats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "statut", id: m.id, statut: statut, motif_resiliation: motif || undefined }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); setOuvert(null); await charger(vueRegistre); }
      else setErreur(d.erreur || "Action impossible.");
    } catch (e: any) { setErreur("Action impossible : " + String(e)); }
    setOccupe("");
  }

  // L avertissement se dit AVANT la saisie, pas apres le refus.
  const trop = type === "exclusif" && (Number(irrevocabilite) || 0) > 3;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/organisme/biens" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au portefeuille</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>MANDATS</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          {vueRegistre ? "Registre des mandats" : "Mes mandats"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          {vueRegistre
            ? "Tous les mandats, dans l'ordre de leur numéro, sans exception. C'est ce document qui est présenté en cas de contrôle."
            : "Chaque mandat reçoit son numéro de registre à l'inscription. Ce numéro se reporte sur l'exemplaire remis au mandant."}
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && (
          <p style={{ color: ROUGE, fontSize: "15px", lineHeight: 1.7 }}>
            {erreur}
            {allerA ? (
              <>
                {" "}
                <a href={allerA} style={{ color: OR }}>Ouvrir mon portefeuille →</a>
              </>
            ) : null}
          </p>
        )}

        {!vueRegistre && !chargement && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "18px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{enCours}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>mandat(s) en cours</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0, borderColor: bientot > 0 ? "rgba(232,131,106,0.5)" : CARTE.border }}>
              <p style={{ color: bientot > 0 ? ROUGE : "rgba(255,255,255,0.5)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{bientot}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>arrive(nt) à échéance sous 30 jours</p>
            </div>
          </div>
        )}

        <button
          onClick={() => { const v = !vueRegistre; setVueRegistre(v); setOuvert(null); charger(v); }}
          style={{ ...SECOND, marginBottom: "18px" }}
        >
          {vueRegistre ? "Revenir à mes mandats" : "Voir le registre des mandats"}
        </button>

        {/* ---- CREATION ---- */}
        {creation && !vueRegistre && (
          <div style={{ ...CARTE, borderColor: OR }}>
            <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>Nouveau mandat</h2>
            <p style={{ color: OR, fontSize: "13.5px", margin: "0 0 14px" }}>
              {nomBien ? "Sur : " + nomBien : "Sur le bien sélectionné"} — le propriétaire, le prix et
              les honoraires sont repris du bien et figés à la signature.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 180px" }}>
                <span style={ETIQ}>Type de mandat</span>
                <select value={type} onChange={(e) => setType(e.target.value)} style={CHAMP}>
                  <option value="simple">Simple</option>
                  <option value="exclusif">Exclusif</option>
                  <option value="semi_exclusif">Semi-exclusif</option>
                </select>
              </div>
              <div style={{ flex: "0 1 180px" }}>
                <span style={ETIQ}>Signé le</span>
                <input type="date" value={signeLe} onChange={(e) => setSigneLe(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={ETIQ}>Durée (mois)</span>
                <input value={duree} onChange={(e) => setDuree(e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 190px" }}>
                <span style={ETIQ}>Irrévocabilité (mois)</span>
                <input value={irrevocabilite} onChange={(e) => setIrrevocabilite(e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
            </div>

            {trop && (
              <p style={{ color: ROUGE, fontSize: "13.5px", margin: "0 0 12px", lineHeight: 1.7 }}>
                L&apos;irrévocabilité d&apos;un mandat exclusif ne peut pas dépasser trois mois.
                Au-delà, la clause est attaquable.
              </p>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 12px", fontSize: "14px" }}>
              <input type="checkbox" checked={horsEtab} onChange={(e) => setHorsEtab(e.target.checked)} style={{ width: 17, height: 17 }} />
              <span>Signé hors de l&apos;agence (chez le vendeur, à distance)</span>
            </label>
            {horsEtab && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: "0 0 12px", lineHeight: 1.7 }}>
                Le mandant dispose alors de quatorze jours pour se rétracter. La date est
                calculée et inscrite au mandat.
              </p>
            )}

            <span style={ETIQ}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...CHAMP, resize: "vertical" }} />

            <button onClick={creer} disabled={occupe !== "" || trop} style={{ ...BOUTON, opacity: trop ? 0.5 : 1 }}>
              {occupe === "creer" ? "Inscription…" : "Inscrire au registre"}
            </button>
            <button onClick={() => { setCreation(false); setBienId(""); }} style={{ ...SECOND, marginLeft: "12px" }}>
              Annuler
            </button>
          </div>
        )}

        {!creation && !vueRegistre && (
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: "0 0 18px", lineHeight: 1.7 }}>
            Un mandat se crée depuis un bien : ouvrez le bien dans{" "}
            <a href="/organisme/biens" style={{ color: OR }}>votre portefeuille</a> et cliquez sur
            « Établir un mandat ».
          </p>
        )}

        {/* ---- LA LISTE ---- */}
        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : mandats.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucun mandat inscrit. Le registre se remplit tout seul, dans l&apos;ordre, à
              mesure que vous en établissez.
            </p>
          </div>
        ) : (
          mandats.map(function (m: any) {
            const alerte = m.expire || m.bientot_fini;
            return (
              <div
                key={m.id}
                style={{
                  ...CARTE, marginBottom: "10px",
                  borderColor: m.expire ? "rgba(232,131,106,0.5)" : alerte ? "rgba(200,169,110,0.5)" : CARTE.border,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 320px" }}>
                    <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px", fontWeight: "bold" }}>
                      N° {m.numero} · {LIB_TYPE[m.type_mandat] || m.type_mandat}
                      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", fontWeight: "normal" }}>
                        {" "}· {LIB_STATUT[m.statut] || m.statut}
                      </span>
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "0 0 3px" }}>
                      {m.mandant || "Mandant inconnu"}
                      {m.bien ? " · " + m.bien : ""}
                      {m.bien_reference ? " · réf. " + m.bien_reference : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      Signé le {jolie(m.signe_le)} · {m.duree_mois} mois · échéance {jolie(m.fin_le)}
                      {Number(m.irrevocabilite_mois) > 0 ? " · irrévocable " + m.irrevocabilite_mois + " mois" : ""}
                    </p>
                    <p style={{ color: OR, fontSize: "13.5px", margin: "5px 0 0" }}>
                      {euros(m.prix_mandat)}
                      {m.honoraires_montant ? " dont " + euros(m.honoraires_montant) + " d'honoraires" : ""}
                      {m.honoraires_charge === "acquereur" ? " à la charge de l'acquéreur" : " à la charge du vendeur"}
                    </p>

                    {m.expire && (
                      <p style={{ color: ROUGE, fontSize: "13px", margin: "6px 0 0" }}>
                        Échéance dépassée — le mandat ne court plus.
                      </p>
                    )}
                    {m.bientot_fini && (
                      <p style={{ color: OR, fontSize: "13px", margin: "6px 0 0" }}>
                        Arrive à échéance le {jolie(m.fin_le)}. Un exclusif ne se reconduit pas
                        tacitement : il faut en signer un nouveau.
                      </p>
                    )}
                    {m.retractable && (
                      <p style={{ color: OR, fontSize: "13px", margin: "6px 0 0" }}>
                        Rétractation possible jusqu&apos;au {jolie(m.retractation_jusqu_au)}.
                      </p>
                    )}
                    {m.motif_resiliation && (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "6px 0 0" }}>
                        Résilié le {jolie(m.resilie_le)} — {m.motif_resiliation}
                      </p>
                    )}
                  </div>

                  {!vueRegistre && (
                    <button onClick={() => setOuvert(ouvert && ouvert.id === m.id ? null : m)} style={SECOND}>
                      {ouvert && ouvert.id === m.id ? "Fermer" : "Modifier l'état"}
                    </button>
                  )}
                </div>

                {!vueRegistre && ouvert && ouvert.id === m.id && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                      {Object.keys(LIB_STATUT).map(function (s) {
                        const courant = m.statut === s;
                        return (
                          <button
                            key={s}
                            onClick={() => changerStatut(m, s)}
                            disabled={occupe !== "" || courant}
                            style={{
                              ...SECOND,
                              background: courant ? "rgba(200,169,110,0.18)" : "none",
                              borderColor: s === "resilie" ? "rgba(232,131,106,0.5)" : s === "realise" ? "rgba(76,175,80,0.5)" : "rgba(200,169,110,0.45)",
                              color: s === "resilie" ? ROUGE : s === "realise" ? VERT : OR,
                              opacity: courant ? 0.55 : 1,
                              cursor: courant ? "default" : "pointer",
                            }}
                          >
                            {LIB_STATUT[s]}
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "10px 0 0", lineHeight: 1.7 }}>
                      Un mandat ne se supprime pas : son numéro reste au registre. Il se résilie,
                      il échoit, ou il se réalise.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {vueRegistre && mandats.length > 0 && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "18px 0 0", lineHeight: 1.7 }}>
            {mandats.length} mandat(s) inscrits, du n° {mandats[0].numero} au n° {mandats[mandats.length - 1].numero}.
            Aucun numéro n&apos;est sauté : la numérotation est continue par construction.
          </p>
        )}
      </div>
    </div>
  );
}
