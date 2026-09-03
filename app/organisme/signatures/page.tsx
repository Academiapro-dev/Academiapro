"use client";
import { useState, useEffect } from "react";

const LIBELLE_TYPE: any = {
  convention: "Convention de formation",
  devis: "Devis",
  convocation: "Convocation",
  programme: "Programme de formation",
  attestation: "Attestation de fin de formation",
  emargement: "Attestation d'assiduité",
  livret: "Livret d'accueil",
};

export default function PageSignatures() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});

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
      const r = await fetch("/api/organisme/signature" + suffixe());
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
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
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const ETIQUETTE: any = {
    color: "#c8a96e",
    fontSize: "12px",
    margin: "0 0 3px",
  };

  const VALEUR: any = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    margin: "0 0 10px",
    lineHeight: "1.6",
    wordBreak: "break-all",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          REGISTRE DES SIGNATURES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Signatures</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Signature électronique simple au sens du règlement européen eIDAS
        </p>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.total}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Document(s) signé(s)
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: d.alterees > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.alterees}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Sceau(x) altéré(s)
                </p>
              </div>
              {/* 🆕 DEUX COMPTEURS REPRIS DE MYSTERLLC — 03/09. La route les
                  renvoyait deja ; l ecran ne les montrait pas. Le chainage
                  detecte ce que le sceau ne voit pas : la suppression d une
                  signature du milieu. */}
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: (d.chaine_rompue || 0) > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.chaine_rompue || 0}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Chaîne(s) rompue(s)
                </p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.verifiees_par_code || 0}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Vérifiée(s) par code
                </p>
              </div>
            </div>

            {d.alterees > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.alterees} signature(s) portent un sceau qui ne correspond plus à leur contenu.
                  Cela signifie que la ligne a été modifiée en base après la signature. Ces
                  signatures ne doivent pas être opposées à un tiers.
                </p>
              </div>
            )}

            {d.signatures.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
                  Aucune signature. Produisez une convention ou un devis depuis vos documents,
                  puis cliquez sur « Faire signer ».
                </p>
              </div>
            ) : (
              d.signatures.map(function (s: any) {
                const estOuvert = ouvert[s.id] === true;
                return (
                  <div key={s.id} style={{ ...CARTE, border: "1px solid " + (s.intacte ? "rgba(76,175,80,0.35)" : "rgba(232,131,106,0.6)"), opacity: s.annulee ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>
                          {LIBELLE_TYPE[s.document_type] || s.document_type}
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                          {s.document_reference} · {s.signataire_nom || s.signataire_email}
                          {s.signataire_qualite ? " · " + s.signataire_qualite : ""}
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: s.intacte ? "#4caf50" : "#e8836a", fontSize: "13px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {s.annulee ? "Annulée" : s.intacte ? "Sceau vérifié" : "Sceau altéré"}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                          {new Date(s.signe_le).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })}
                      style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 15px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif", marginTop: "14px" }}
                    >
                      {estOuvert ? "Fermer le dossier de preuve" : "Dossier de preuve"}
                    </button>

                    {estOuvert && (
                      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <p style={ETIQUETTE}>Signataire</p>
                        <p style={VALEUR}>
                          {s.signataire_email}
                          {s.signataire_nom ? " — " + s.signataire_nom : ""}
                          {s.signataire_qualite ? " — " + s.signataire_qualite : ""}
                        </p>

                        <p style={ETIQUETTE}>Date et heure de la signature</p>
                        <p style={VALEUR}>{new Date(s.signe_le).toLocaleString("fr-FR")}</p>

                        <p style={ETIQUETTE}>Empreinte SHA-256 du document signé</p>
                        <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "12px" }}>
                          {s.empreinte_sha256}
                        </p>

                        <p style={ETIQUETTE}>Adresse de connexion</p>
                        <p style={VALEUR}>{s.adresse_ip || "non enregistrée"}</p>

                        <p style={ETIQUETTE}>Navigateur déclaré</p>
                        <p style={{ ...VALEUR, fontSize: "12px" }}>{s.navigateur || "non enregistré"}</p>

                        {s.code_verifie_le && (
                          <>
                            <p style={ETIQUETTE}>Code vérifié le</p>
                            <p style={VALEUR}>{new Date(s.code_verifie_le).toLocaleString("fr-FR")}</p>
                          </>
                        )}

                        {s.trace_signature && (
                          <>
                            <p style={ETIQUETTE}>Tracé manuscrit (son empreinte entre dans le sceau)</p>
                            <img
                              src={s.trace_signature}
                              alt="Tracé de la signature"
                              style={{ display: "block", maxWidth: "320px", width: "100%", background: "#fdfcf9", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", margin: "0 0 10px" }}
                            />
                          </>
                        )}

                        <p style={ETIQUETTE}>Texte accepté par le signataire</p>
                        <p style={{ ...VALEUR, fontStyle: "italic" }}>{s.consentement}</p>

                        <p style={ETIQUETTE}>Sceau du dossier</p>
                        <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "11px" }}>
                          {s.jeton_preuve}
                        </p>

                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "12px 0 0", lineHeight: "1.7" }}>
                          Ce sceau est calculé sur l&apos;ensemble des éléments ci-dessus. Toute
                          modification, même d&apos;un seul caractère, le rendrait invalide — c&apos;est
                          ce qui donne au dossier sa valeur.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
