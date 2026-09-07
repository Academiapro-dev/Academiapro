"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";

// ══════════════════════════════════════════════════════════════════════════
// L ABONNEMENT MYSTERLLC — ECRAN CLIENT — 07/09.
//
// ⚠️ CET ECRAN VIT SOUS /compliance/abonnement, PAS /facturation : une
// route /api/compliance/facturation existe deja et produit les documents
// legaux (devis, factures, mandats, numerotation continue). Ici on montre
// seulement ce que le client paie chaque mois.
//
// 🚨 UNE LIGNE PAR SOCIETE, ET C EST LE POINT. Le forfait se compte par
// LLC, pas par client : un gestionnaire qui suit trois societes paie trois
// fois. L ecran doit le montrer sans ambiguite, sinon la premiere facture
// surprend.
//
// ⚠️ LES SOCIETES SANS FORFAIT SONT AFFICHEES A PART. Une societe ajoutee
// au portefeuille mais pas encore souscrite ne se facture pas — et le
// client doit voir laquelle, pour la souscrire ou la retirer.
//
// ⚠️ LA GRILLE EST RAPPELEE EN BAS. Un client au forfait Suivi doit voir
// ce que la Comptabilite apporte : c est la seule facon qu il y pense le
// jour ou il en a besoin.
//
// ⚠️ AUCUN PRIX N EST ECRIT ICI. Tout vient de `tarifs`, produit
// 'mysterllc'. Une grille recopiee dans un ecran finit toujours par
// diverger de celle qui facture.
// ══════════════════════════════════════════════════════════════════════════

function euros(n: any) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
}

export default function PageFacturationMysterLLC() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [grille, setGrille] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [sansForfait, setSansForfait] = useState(0);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/compliance/abonnement", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) {
        setSocietes(Array.isArray(d.societes) ? d.societes : []);
        setGrille(Array.isArray(d.grille) ? d.grille : []);
        setTotal(Number(d.total || 0));
        setSansForfait(Number(d.nb_sans_forfait || 0));
      } else if (d && d.erreur) {
        setErreur(d.erreur);
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(true);
  }

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "20px 24px", marginBottom: "16px",
  };

  const mois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const facturees = societes.filter(function (s: any) { return s.forfait; });
  const enAttente = societes.filter(function (s: any) { return !s.forfait; });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          &larr; Retour au portefeuille
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          EN COURS · {String(mois).toUpperCase()}
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Ma facturation
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px",
          margin: "0 0 24px", lineHeight: "1.7" }}>
          Un forfait par société. Chaque LLC de votre portefeuille a son
          propre suivi, ses propres échéances et ses propres formulaires.
        </p>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {erreur}
            </p>
          </div>
        )}

        {/* ---- LE TOTAL ---- */}
        {charge && !erreur && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}>
            <div style={{ ...CARTE, flex: "1 1 220px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(total)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                par mois, hors taxes
              </p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 220px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {facturees.length}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                société{facturees.length > 1 ? "s" : ""} suivie{facturees.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* ---- LE DETAIL, SOCIETE PAR SOCIETE ---- */}
        {charge && facturees.length > 0 && (
          <>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 12px" }}>
              Vos sociétés
            </h2>
            <div style={CARTE}>
              {facturees.map(function (s: any) {
                return (
                  <div key={s.id} style={{ padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                      <span style={{ color: "#fff", fontSize: "16px" }}>
                        {s.label}
                        {s.formation_state && (
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
                            marginLeft: "10px" }}>
                            {s.formation_state}
                          </span>
                        )}
                      </span>
                      <span style={{ color: OR, fontSize: "16px", whiteSpace: "nowrap" }}>
                        {euros(s.montant)}
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
                          marginLeft: "6px" }}>
                          / mois
                        </span>
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                      margin: "4px 0 0", lineHeight: "1.6" }}>
                      {s.forfait === "comptabilite"
                        ? "Suivi et comptabilité"
                        : "Suivi"}
                      {s.forfait === "comptabilite" && (
                        <span style={{ color: "#b18cff", marginLeft: "8px" }}>
                          · dépenses et justificatifs compris
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---- LES SOCIETES SANS FORFAIT ----
            ⚠️ AFFICHEES A PART, EN AMBRE. Elles ne se facturent pas, mais
            elles ne sont pas suivies non plus : leurs echeances passeront
            sans que personne ne soit prevenu. Le client doit le savoir. */}
        {charge && enAttente.length > 0 && (
          <div style={{ ...CARTE, borderColor: "rgba(232,163,61,0.5)",
            background: "rgba(232,163,61,0.07)" }}>
            <p style={{ color: "#e8a33d", fontSize: "15.5px", margin: "0 0 8px",
              lineHeight: "1.6" }}>
              <strong>{enAttente.length}</strong> société{enAttente.length > 1 ? "s" : ""} sans
              forfait
            </p>
            {enAttente.map(function (s: any) {
              return (
                <p key={s.id} style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px",
                  margin: "0 0 4px" }}>
                  {s.label}
                  {s.formation_state ? " · " + s.formation_state : ""}
                </p>
              );
            })}
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px",
              margin: "10px 0 0", lineHeight: "1.75" }}>
              Ces sociétés ne sont pas suivies : leurs échéances passeront
              sans relance. Écrivez-nous pour leur ouvrir un forfait.
            </p>
          </div>
        )}

        {/* ---- LA GRILLE ----
            ⚠️ RAPPELEE MEME QUAND TOUT EST SOUSCRIT : un client au Suivi
            doit voir ce que la Comptabilite apporte, sinon il n y pensera
            pas le jour ou il en aura besoin. */}
        {charge && grille.length > 0 && (
          <>
            <h2 style={{ color: OR, fontSize: "18px", margin: "28px 0 12px" }}>
              Les forfaits
            </h2>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {grille.map(function (g: any) {
                const utilise = facturees.some(function (s: any) {
                  return s.forfait === g.offre;
                });
                return (
                  <div key={g.offre} style={{
                    flex: "1 1 280px", padding: "18px 20px", borderRadius: "10px",
                    background: utilise ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.025)",
                    border: utilise
                      ? "2px solid rgba(200,169,110,0.6)"
                      : "1px solid rgba(200,169,110,0.18)",
                  }}>
                    <p style={{ color: "#fff", fontSize: "20px", fontWeight: "bold",
                      margin: "0 0 3px" }}>
                      {euros(g.montant)}
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)",
                        marginLeft: "6px" }}>
                        par mois et par société
                      </span>
                    </p>
                    <p style={{ color: OR, fontSize: "14.5px", margin: "0 0 8px" }}>
                      {g.offre === "comptabilite" ? "Suivi et comptabilité" : "Suivi"}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                      margin: 0, lineHeight: "1.7" }}>
                      {g.commentaire}
                    </p>
                    {utilise && (
                      <p style={{ color: VERT, fontSize: "12.5px",
                        margin: "10px 0 0", fontWeight: "bold" }}>
                        Souscrit
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px",
          lineHeight: "1.8", marginTop: "22px" }}>
          Montants hors taxes. Pour ajouter une société, changer de forfait
          ou en retirer une, écrivez-nous.
        </p>
      </div>
    </div>
  );
}
