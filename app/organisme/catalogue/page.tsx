"use client";
import { useState, useEffect } from "react";

export default function PageCatalogueOrganisme() {
  const [formations, setFormations] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [admin, setAdmin] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [reprise, setReprise] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [codes, setCodes] = useState("");
  const [prixEnCours, setPrixEnCours] = useState<any>({});

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setFormations(data.formations || []);
        setDisponibles(data.disponibles || []);
        setAdmin(data.admin === true);

        // Le champ part du prix de vente enregistre ; a defaut, du prix public
        // de l Editeur. Un champ vide obligerait a chercher un chiffre ailleurs.
        const p: any = {};
        for (const f of data.formations || []) {
          if (f.prix_vente_public !== null && f.prix_vente_public !== undefined) {
            p[f.id] = String(f.prix_vente_public);
          } else if (f.prix_academia !== null && f.prix_academia !== undefined) {
            p[f.id] = String(f.prix_academia);
          } else {
            p[f.id] = "";
          }
        }
        setPrixEnCours(p);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ouvrir(tout: boolean) {
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tout ? { tout: true } : { codes: codes }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.ouvertes + " formation(s) ouverte(s) \u00e0 cet organisme.");
        setCodes("");
        await charger();
      } else {
        setErreur(data.erreur || "Ouverture impossible.");
      }
    } catch (e: any) {
      setErreur("Ouverture impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function enregistrerPrix(id: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, prix_vente_public: prixEnCours[id] }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Prix enregistr\u00e9.");
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
  }

  // REPRENDRE TOUS LES PRIX, EN UN GESTE.
  //
  // Enregistrer trois cent dix prix un par un, personne ne le fait. Ce bouton
  // ne touche QUE les formations sans prix : celles deja fixees sont celles de
  // l organisme, elles ne sont pas ecrasees. Il peut donc en poser trois a la
  // main, laisser le reste en « sur devis », et changer d avis plus tard.
  async function reprendreTousLesPrix() {
    setReprise(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/catalogue" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tout_reprendre: true }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message || "Prix repris.");
        await charger();
      } else {
        setErreur(data.erreur || "Reprise impossible.");
      }
    } catch (e: any) {
      setErreur("Reprise impossible : " + String(e));
    }
    setReprise(false);
  }

  async function retirer(id: string, code: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/catalogue" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(code + " retir\u00e9e du catalogue de cet organisme.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const CHAMP: any = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    width: "140px",
  };

  const totalStagiaires = formations.reduce(function (s: number, f: any) {
    return s + (f.stagiaires || 0);
  }, 0);

  const sansPrix = formations.filter(function (f: any) {
    return f.prix_vente_public === null || f.prix_vente_public === undefined;
  }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au tableau de bord"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FORMATIONS OUVERTES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mon catalogue</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {formations.length}{" formation(s) \u00b7 "}{totalStagiaires}{" stagiaire(s) inscrit(s)"}
          {sansPrix > 0 ? " \u00b7 " + sansPrix + " sans prix enregistr\u00e9" : ""}
        </p>

        {/* CE QUE COUTE UN PRIX NON ENREGISTRE.
            L organisme ne voyait pas la consequence : sa page publique affiche
            « sur devis » a ses propres prospects, silencieusement. Le prix de
            l editeur n y est jamais montre — ce serait exposer nos tarifs a
            ses clients. */}
        {sansPrix > 0 && (
          <div style={{ ...CARTE, marginTop: "18px", background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)" }}>
            <p style={{ color: "#e8a33d", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.8" }}>
              {sansPrix}{" formation(s) n'ont pas encore de prix de vente enregistr\u00e9. Tant qu'il ne l'est pas, votre page publique affiche \u00ab sur devis \u00bb \u00e0 vos prospects, et le prix ne figure ni sur votre bon de commande ni sur vos documents. Le montant propos\u00e9 ci-dessous est celui du catalogue Acad\u00e9mIA Pro : ajustez-le \u00e0 votre tarif, puis appuyez sur Enregistrer."}
            </p>

            <button
              onClick={reprendreTousLesPrix}
              disabled={reprise}
              style={{ background: reprise ? "rgba(232,163,61,0.3)" : "#e8a33d", color: reprise ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: reprise ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
            >
              {reprise ? "Reprise en cours\u2026" : "Reprendre les " + sansPrix + " prix du catalogue Acad\u00e9mIA Pro"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              {"Les prix que vous avez d\u00e9j\u00e0 enregistr\u00e9s ne seront pas modifi\u00e9s : ce sont les v\u00f4tres."}
            </p>
          </div>
        )}

        {admin && (
          <div style={{ ...CARTE, marginTop: "26px", border: "1px solid rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 8px" }}>Ouvrir des formations</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
              {"R\u00e9serv\u00e9 \u00e0 l'\u00e9diteur. "}{disponibles.length}{" formation(s) encore ferm\u00e9e(s) \u00e0 cet organisme."}
            </p>

            <input
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              placeholder="F028 F030 F327"
              style={{ ...CHAMP, width: "100%", marginBottom: "12px" }}
            />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => ouvrir(false)}
                disabled={occupe || !codes.trim()}
                style={{ background: occupe || !codes.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !codes.trim() ? "#8a8a8a" : "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: occupe || !codes.trim() ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                {occupe ? "\u2026" : "Ouvrir ces codes"}
              </button>

              <button
                onClick={() => ouvrir(true)}
                disabled={occupe}
                style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "12px 24px", borderRadius: "8px", cursor: occupe ? "default" : "pointer", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                Ouvrir tout le catalogue
              </button>
            </div>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>{"Chargement\u2026"}</p>
          </div>
        ) : formations.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune formation ouverte pour le moment.
            </p>
          </div>
        ) : (
          formations.map(function (f) {
            const enregistre = f.prix_vente_public !== null && f.prix_vente_public !== undefined;
            return (
              <div key={f.id} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                      {f.formation_code}{f.domaine ? " \u00b7 " + f.domaine : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 6px" }}>{f.titre}</h3>

                    {f.prix_academia ? (
                      <p style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 3px" }}>
                        {"Prix public Acad\u00e9mIA : "}
                        <strong>{Number(f.prix_academia).toLocaleString("fr-FR")}{" \u20ac"}</strong>
                      </p>
                    ) : null}

                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {f.duree ? String(f.duree) : ""}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: (f.stagiaires || 0) > 0 ? "#4caf50" : "rgba(255,255,255,0.3)", fontSize: "20px", fontWeight: "bold" }}>
                      {f.stagiaires || 0}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> inscrit(s)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>Votre prix de vente</span>

                  <input
                    value={prixEnCours[f.id] || ""}
                    onChange={(e) => setPrixEnCours({ ...prixEnCours, [f.id]: e.target.value })}
                    style={{ ...CHAMP, border: enregistre ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(232,163,61,0.55)" }}
                  />

                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>{"\u20ac"}</span>

                  <button
                    onClick={() => enregistrerPrix(f.id)}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    Enregistrer
                  </button>

                  {!enregistre && (
                    <span style={{ color: "#e8a33d", fontSize: "13px" }}>
                      {"prix propos\u00e9, \u00e0 enregistrer"}
                    </span>
                  )}

                  {admin && (
                    <button
                      onClick={() => retirer(f.id, f.formation_code)}
                      style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
