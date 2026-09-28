"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA PAGE QUE LE CLIENT OUVRE DEPUIS LE COURRIEL
//
// L employeur n a pas de compte : il arrive par le lien du recapitulatif,
// lit la paie preparee par son cabinet (salaries, elements du mois, brut,
// net), puis CONFIRME ou SIGNALE CE QUI NE VA PAS. Aucun bulletin du mois
// ne s emet avant sa reponse.
//
// ⚠️ PAS DE BARRE DE NAVIGATION : components/NavBar.tsx l efface sur
// /compliance/recap-paie/, comme sur la page de signature. Il n y a qu une
// chose a faire ici : lire, puis repondre.
// ⚠️ CE N EST PAS UN BULLETIN DE PAIE, et la page le dit : c est la paie
// preparee, avant emission. Un employeur qui imprimerait cet ecran pour
// son salarie lui remettrait un document sans valeur.
// ═══════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const VERT = "#7fc97f";
const ROUGE = "#e57373";

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function jma(d: any): string {
  const t = String(d || "");
  if (t.length < 10) return "";
  return t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4);
}

export default function RecapitulatifPaie({ params }: { params: { jeton: string } }) {
  const jeton = String((params && params.jeton) || "");
  const [d, setD] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [signaler, setSignaler] = useState(false);
  const [remarque, setRemarque] = useState("");
  const [fait, setFait] = useState("");
  const [marque, setMarque] = useState("");

  useEffect(function () {
    const h = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
    setMarque(h.indexOf("mrcomptable") >= 0 ? "MR. COMPTABLE" : "");
    charger();
  }, []);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/paie/recap?jeton=" + encodeURIComponent(jeton), { cache: "no-store" });
      const x = await r.json();
      if (x && x.success) setD(x);
      else setErreur((x && x.erreur) || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : vérifiez votre connexion, puis rechargez la page.");
    }
  }

  async function repondre(reponse: string) {
    if (reponse === "confirme" && !confirm("Vous confirmez que la paie de " + (d ? d.mois : "ce mois")
      + " est juste pour tous les salariés listés ?")) return;
    if (reponse === "conteste" && remarque.trim().length < 5) {
      setErreur("Dites en quelques mots ce qui ne va pas : votre cabinet corrigera.");
      return;
    }
    setOccupe(true); setErreur("");
    try {
      const r = await fetch("/api/paie/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton: jeton, reponse: reponse, remarque: remarque }),
      });
      const x = await r.json();
      if (x && x.success) {
        setFait(x.message || "Réponse enregistrée.");
        await charger();
      } else setErreur((x && x.erreur) || "Enregistrement impossible.");
    } catch (e: any) {
      setErreur("Enregistrement impossible : vérifiez votre connexion, puis réessayez.");
    }
    setOccupe(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff",
    fontFamily: "Georgia, serif", padding: "36px 16px" };
  const CARTE: any = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "16px 18px", marginBottom: "12px" };
  const BOUTON: any = { width: "100%", padding: "14px", border: "none", borderRadius: "8px",
    fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia, serif", cursor: "pointer" };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {marque && (
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>{marque}</p>
        )}

        {!d && !erreur && <p style={{ color: "rgba(255,255,255,0.6)" }}>Lecture…</p>}
        {!d && erreur && (
          <div style={CARTE}>
            <p style={{ color: ROUGE, margin: 0, lineHeight: 1.7 }}>{erreur}</p>
          </div>
        )}

        {d && (
          <>
            <h1 style={{ fontSize: "24px", margin: "0 0 6px" }}>Paie de {d.mois}</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 18px" }}>{d.societe}</p>

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.06)" }}>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                Votre cabinet a préparé la paie ci-dessous. Vérifiez chaque ligne : les éléments du mois
                (heures, primes, absences) et le net à payer. Aucun bulletin n&apos;est émis avant votre
                réponse. Ce récapitulatif n&apos;est pas un bulletin de paie.
              </p>
            </div>

            {d.remplace && (
              <div style={{ ...CARTE, borderColor: ROUGE }}>
                <p style={{ margin: 0, color: ROUGE, lineHeight: 1.7 }}>
                  Un récapitulatif plus récent vous a été envoyé : répondez depuis le dernier courriel reçu.
                </p>
              </div>
            )}

            {(d.lignes || []).map(function (l: any) {
              return (
                <div key={l.contrat_id} style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>{l.salarie}</p>
                      {l.poste && <p style={{ margin: "2px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{l.poste}</p>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Brut {euros(l.brut)}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "16px", color: OR, fontWeight: "bold" }}>Net {euros(l.net)}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    {(!l.elements || l.elements.length === 0) ? (
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>Aucun élément particulier ce mois-ci.</span>
                    ) : l.elements.map(function (e: any, i: number) {
                      return (
                        <div key={i}>
                          {e.libelle}
                          {e.quantite !== null && e.quantite !== undefined ? " (" + Number(e.quantite).toLocaleString("fr-FR") + ")" : ""}
                          {e.montant ? " : " + euros(e.montant) : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ ...CARTE, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>Total : {(d.lignes || []).length} salarié(s)</span>
              <span style={{ fontSize: "14px" }}>
                Brut {euros(d.totaux && d.totaux.brut)} · <b style={{ color: OR }}>Net {euros(d.totaux && d.totaux.net)}</b>
              </span>
            </div>

            {fait && <p style={{ color: VERT, fontSize: "15px", lineHeight: 1.7 }}>{fait}</p>}
            {erreur && <p style={{ color: ROUGE, fontSize: "14px", lineHeight: 1.7 }}>{erreur}</p>}

            {d.statut === "envoye" && !d.remplace && (
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => repondre("confirme")} disabled={occupe}
                  style={{ ...BOUTON, background: occupe ? "rgba(200,169,110,0.3)" : OR, color: "#050508" }}>
                  {occupe ? "Enregistrement…" : "Tout est juste, je confirme"}
                </button>
                {!signaler ? (
                  <button onClick={() => setSignaler(true)} disabled={occupe}
                    style={{ ...BOUTON, marginTop: "10px", background: "none", color: ROUGE,
                      border: "1px solid rgba(229,115,115,0.5)" }}>
                    Je signale une erreur
                  </button>
                ) : (
                  <div style={{ ...CARTE, marginTop: "10px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "14px" }}>Qu&apos;est-ce qui ne va pas ?</p>
                    <textarea value={remarque} onChange={(e) => setRemarque(e.target.value)} rows={4}
                      placeholder="Par exemple : la prime de Paul est de 200 €, pas 250 €."
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "#fff",
                        fontSize: "15px", fontFamily: "Georgia, serif" }} />
                    <button onClick={() => repondre("conteste")} disabled={occupe}
                      style={{ ...BOUTON, marginTop: "10px", background: ROUGE, color: "#050508" }}>
                      {occupe ? "Envoi…" : "Envoyer ma remarque au cabinet"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {d.statut === "confirme" && (
              <div style={CARTE}>
                <p style={{ margin: 0, color: VERT, lineHeight: 1.7 }}>
                  Vous avez confirmé cette paie le {jma(d.repondu_le)}. Votre cabinet peut émettre les bulletins.
                </p>
              </div>
            )}
            {d.statut === "conteste" && (
              <div style={CARTE}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
                  Vous avez signalé le {jma(d.repondu_le)} : « {d.remarque} ». Votre cabinet corrige et vous
                  renverra le récapitulatif.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
