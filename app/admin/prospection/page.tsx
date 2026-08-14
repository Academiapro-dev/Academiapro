"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// LES FILTRES SONT DES INTENTIONS, pas des vues. « A envoyer » repond a la
// question qui se pose vraiment le matin : a qui puis-je ecrire aujourd hui.
const FILTRES = [
  { cle: "", nom: "Tout" },
  { cle: "a_envoyer", nom: "A envoyer" },
  { cle: "envoyes", nom: "Deja contactes" },
  { cle: "avec_email", nom: "Avec adresse" },
  { cle: "avec_telephone", nom: "Avec telephone" },
  { cle: "a_enrichir", nom: "A enrichir" },
  { cle: "desabonnes", nom: "Desabonnes" },
];

export default function PageProspection() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [base, setBase] = useState("");
  const [filtre, setFiltre] = useState("");
  const [cherche, setCherche] = useState("");
  const [saisie, setSaisie] = useState("");
  const [page, setPage] = useState(0);

  useEffect(function () {
    charger();
  }, [base, filtre, cherche, page]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const p = new URLSearchParams();
      if (base) p.set("base", base);
      if (filtre) p.set("filtre", filtre);
      if (cherche) p.set("q", cherche);
      if (page) p.set("page", String(page));

      const r = await fetch("/api/admin/prospection?" + p.toString(), { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function ouvrir(cle: string) {
    setBase(cle);
    setFiltre("");
    setCherche("");
    setSaisie("");
    setPage(0);
  }

  function changerFiltre(f: string) {
    setFiltre(f);
    setPage(0);
  }

  function lancerRecherche() {
    setCherche(saisie.trim());
    setPage(0);
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
  const BOUTON: any = {
    background: "none", border: "1px solid rgba(200,169,110,0.45)",
    color: OR, padding: "8px 16px", borderRadius: "20px",
    cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif",
  };
  const CHAMP: any = {
    padding: "11px 14px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box",
  };

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  const detail = d && d.detail ? d.detail : null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour a l administration
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          MA PROSPECTION
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Les quatre bases
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px" }}>
          {d ? nombre(d.total_general) + " prospects au total" : "Chargement…"}
        </p>

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>
        )}

        {/* LE RESUME. Quatre cartes, toujours visibles : on voit d un coup
            ou en est chaque base sans avoir a ouvrir quoi que ce soit. */}
        {d && d.resume && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "26px" }}>
            {d.resume.map(function (r: any) {
              const actif = base === r.cle;
              return (
                <div
                  key={r.cle}
                  onClick={() => ouvrir(actif ? "" : r.cle)}
                  style={{
                    ...CARTE,
                    flex: "1 1 240px",
                    marginBottom: 0,
                    cursor: "pointer",
                    border: actif ? "2px solid " + OR : CARTE.border,
                    background: actif ? "rgba(200,169,110,0.08)" : CARTE.background,
                  }}
                >
                  <p style={{ color: OR, fontSize: "15px", margin: "0 0 3px", fontWeight: "bold" }}>
                    {r.titre}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: "0 0 12px" }}>
                    {r.cible}
                  </p>

                  <p style={{ color: "#fff", fontSize: "26px", fontWeight: "bold", margin: "0 0 10px" }}>
                    {nombre(r.total)}
                  </p>

                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 4px", lineHeight: "1.6" }}>
                    {nombre(r.avec_email)} adresse(s) · {nombre(r.avec_telephone)} telephone(s)
                  </p>
                  <p style={{ color: r.envoyes > 0 ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
                    {nombre(r.envoyes)} contacte(s)
                    {r.a_envoyer > 0 ? " · " + nombre(r.a_envoyer) + " a envoyer" : ""}
                  </p>
                  {r.desabonnes > 0 && (
                    <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "4px 0 0" }}>
                      {nombre(r.desabonnes)} desabonne(s)
                    </p>
                  )}
                  {r.soumis_dropcontact > 0 && (
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "6px 0 0" }}>
                      {nombre(r.soumis_dropcontact)} deja soumis a Dropcontact
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!base && !chargement && (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.8" }}>
              Choisissez une base ci-dessus pour en parcourir le detail.
            </p>
          </div>
        )}

        {/* LE DETAIL D UNE BASE */}
        {detail && (
          <div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              {FILTRES.map(function (f) {
                const actif = filtre === f.cle;
                return (
                  <button
                    key={f.cle || "tout"}
                    onClick={() => changerFiltre(f.cle)}
                    style={{
                      ...BOUTON,
                      background: actif ? OR : "rgba(255,255,255,0.06)",
                      color: actif ? FOND : "rgba(255,255,255,0.6)",
                      border: actif ? "none" : BOUTON.border,
                      fontWeight: actif ? "bold" : "normal",
                      padding: "9px 16px",
                    }}
                  >
                    {f.nom}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <input
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lancerRecherche(); }}
                placeholder="Nom, ville, adresse ou SIREN"
                style={{ ...CHAMP, flex: "1 1 280px" }}
              />
              <button onClick={lancerRecherche} style={{ ...BOUTON, padding: "11px 22px" }}>
                Chercher
              </button>
              {cherche && (
                <button
                  onClick={() => { setSaisie(""); setCherche(""); setPage(0); }}
                  style={{ ...BOUTON, padding: "11px 22px" }}
                >
                  Effacer
                </button>
              )}
            </div>

            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 14px" }}>
              {nombre(detail.total_filtre)} ligne(s)
              {detail.pages > 1 ? " · page " + (detail.page + 1) + " sur " + detail.pages : ""}
            </p>

            {chargement ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
              </div>
            ) : detail.lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune ligne pour ce filtre.
                </p>
              </div>
            ) : (
              detail.lignes.map(function (l: any) {
                return (
                  <div key={l.id} style={{ ...CARTE, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 4px" }}>
                          {l.raison_sociale}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 6px" }}>
                          {l.ville || "ville inconnue"}
                          {l.code_postal ? " · " + l.code_postal : ""}
                          {l.siren ? " · SIREN " + l.siren : ""}
                          {detail.porte_vague && l.vague ? " · vague " + l.vague : ""}
                        </p>

                        {(l.dirigeant_prenom || l.dirigeant_nom) && (
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: "0 0 4px" }}>
                            {l.dirigeant_prenom} {l.dirigeant_nom}
                          </p>
                        )}

                        {l.email && (
                          <p style={{ color: OR, fontSize: "13.5px", margin: "0 0 3px", wordBreak: "break-all" }}>
                            {l.email}
                          </p>
                        )}
                        {l.telephone && (
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: "0 0 3px" }}>
                            {l.telephone}
                            {l.sms_accepte_le
                              ? " · SMS accepte"
                              : " · pas de consentement SMS"}
                          </p>
                        )}
                        {l.site_web && (
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: 0, wordBreak: "break-all" }}>
                            {l.site_web}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: "right", minWidth: "150px" }}>
                        {l.desabonne ? (
                          <p style={{ color: "#e8836a", fontSize: "13px", margin: 0, fontWeight: "bold" }}>
                            Desabonne
                          </p>
                        ) : l.statut === "envoye" ? (
                          <p style={{ color: "#4caf50", fontSize: "13px", margin: 0, fontWeight: "bold" }}>
                            Contacte
                            {l.envoye_le
                              ? <><br /><span style={{ color: "rgba(255,255,255,0.4)", fontWeight: "normal", fontSize: "12px" }}>
                                  le {new Date(l.envoye_le).toLocaleDateString("fr-FR")}
                                </span></>
                              : null}
                          </p>
                        ) : l.email ? (
                          <p style={{ color: OR, fontSize: "13px", margin: 0 }}>
                            Joignable
                          </p>
                        ) : (
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>
                            {l.dropcontact_le ? "Sans adresse" : "A enrichir"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {detail.pages > 1 && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{ ...BOUTON, padding: "11px 22px", opacity: page === 0 ? 0.35 : 1 }}
                >
                  Precedent
                </button>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", alignSelf: "center" }}>
                  {page + 1} / {detail.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= detail.pages}
                  style={{ ...BOUTON, padding: "11px 22px", opacity: page + 1 >= detail.pages ? 0.35 : 1 }}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
