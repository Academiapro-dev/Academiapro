"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";

// ══════════════════════════════════════════════════════════════════════════
// L ABONNEMENT MYSTERLLC — ECRAN CLIENT — 07/09, PALIERS LE 08/09, OFFRE
// « CREATION » LE 11/09.
//
// ⚠️ CET ECRAN VIT SOUS /compliance/abonnement, PAS /facturation : une
// route /api/compliance/facturation existe deja et produit les documents
// legaux. Ici on montre seulement ce que le client paie chaque mois.
//
// 🚨 UNE LIGNE PAR SOCIETE, ET C EST LE POINT. Le forfait se compte par
// LLC, pas par client.
//
// 🆕 LE PRIX BAISSE AVEC LE NOMBRE DE SOCIETES — 08/09 (comptabilite).
// 🆕 TROIS OFFRES — 11/09 : Suivi (LLC existante, sans comptabilite),
// Suivi et comptabilite, et Creation (la LLC creee par MysterLLC : agent,
// statuts, EIN, Operating Agreement, banque + suivi + comptabilite).
//
// ⚠️ AUCUN PRIX N EST ECRIT ICI. Tout vient de `tarifs`, produit
// 'mysterllc'. Seuls les LIBELLES des offres sont ici.
// ══════════════════════════════════════════════════════════════════════════

function euros(n: any) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
}

function libelleOffre(offre: string): string {
  if (offre === "comptabilite") return "Suivi et comptabilité";
  if (offre === "creation") return "Création, suivi et comptabilité";
  return "Suivi";
}

export default function PageFacturationMysterLLC() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [grille, setGrille] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [sansForfait, setSansForfait] = useState(0);
  const [prochain, setProchain] = useState<any>(null);
  const [paliers, setPaliers] = useState<any[]>([]);
  const [volume, setVolume] = useState(0);
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
        setProchain(d.prochain_palier || null);
        setPaliers(Array.isArray(d.paliers_comptabilite) ? d.paliers_comptabilite : []);
        setVolume(Number(d.volume || 0));
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

        {charge && !erreur && prochain && (
          <div style={{ ...CARTE, borderColor: "rgba(76,175,80,0.45)",
            background: "rgba(76,175,80,0.07)" }}>
            <p style={{ color: VERT, fontSize: "15.5px", margin: "0 0 6px",
              lineHeight: "1.7" }}>
              À partir de <strong>{prochain.a_partir_de} sociétés</strong>, le
              forfait Suivi et comptabilité passe de {euros(prochain.montant_actuel)} à{" "}
              <strong>{euros(prochain.montant)}</strong> par mois et par société.
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px",
              margin: 0, lineHeight: "1.75" }}>
              Le nouveau prix s&apos;applique à toutes vos sociétés, pas
              seulement aux suivantes.
            </p>
          </div>
        )}

        {charge && !erreur && paliers.length > 1 && (
          <>
            <h2 style={{ color: OR, fontSize: "18px", margin: "26px 0 10px" }}>
              Le prix baisse avec le nombre de sociétés
            </h2>
            <div style={CARTE}>
              {paliers.map(function (p: any, i: number) {
                const borne = Number(p.seuil_max) >= 9999
                  ? "À partir de " + p.seuil_min + " sociétés"
                  : "De " + p.seuil_min + " à " + p.seuil_max + " sociétés";
                return (
                  <div key={p.seuil_min} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", gap: "12px", flexWrap: "wrap",
                    padding: "11px 12px",
                    borderRadius: "8px",
                    marginBottom: i < paliers.length - 1 ? "4px" : 0,
                    background: p.actuel ? "rgba(200,169,110,0.12)" : "transparent",
                    border: p.actuel
                      ? "1px solid rgba(200,169,110,0.5)"
                      : "1px solid transparent",
                  }}>
                    <span style={{
                      color: p.actuel ? "#fff" : "rgba(255,255,255,0.6)",
                      fontSize: "15px",
                    }}>
                      {borne}
                      {p.actuel && (
                        <span style={{ color: OR, fontSize: "12.5px", marginLeft: "10px" }}>
                          votre palier
                        </span>
                      )}
                    </span>
                    <span style={{
                      color: p.actuel ? OR : "rgba(255,255,255,0.6)",
                      fontSize: "16px", fontWeight: p.actuel ? "bold" : "normal",
                      whiteSpace: "nowrap",
                    }}>
                      {euros(p.montant)}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
                        marginLeft: "6px" }}>
                        / mois et par société
                      </span>
                    </span>
                  </div>
                );
              })}
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                margin: "12px 0 0", lineHeight: "1.75" }}>
                Le palier atteint s&apos;applique à toutes vos sociétés, pas
                seulement à celles qui dépassent le seuil. Les sociétés sans
                forfait comptent dans le total.
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px",
                margin: "6px 0 0", lineHeight: "1.75" }}>
                Les forfaits Suivi et Création restent au même prix quel que soit le nombre.
              </p>
            </div>
          </>
        )}

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
                      {libelleOffre(s.forfait)}
                      {(s.forfait === "comptabilite" || s.forfait === "creation") && (
                        <span style={{ color: "#b18cff", marginLeft: "8px" }}>
                          · dépenses et justificatifs compris
                        </span>
                      )}
                      {s.forfait === "creation" && (
                        <span style={{ color: VERT, marginLeft: "8px" }}>
                          · création accompagnée de A à Z
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

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
                    flex: "1 1 260px", padding: "18px 20px", borderRadius: "10px",
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
                      {libelleOffre(g.offre)}
                    </p>
                    {g.offre === "comptabilite" && Number(g.seuil_max) < 9999 && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
                        margin: "0 0 8px" }}>
                        Votre palier : {g.seuil_min} à {g.seuil_max} sociétés
                      </p>
                    )}
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
