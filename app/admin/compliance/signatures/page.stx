"use client";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// LE REGISTRE DES SIGNATURES — MYSTERLLC, 01/09.
//
// A QUOI IL SERT. Ce n est pas une liste : c est LE LIEU OU L ON PROUVE. En
// cas de contestation, c est cet ecran qu on ouvre, et le dossier de preuve
// qu on imprime.
//
// 🚨 DEUX VERIFICATIONS, ET ELLES NE DETECTENT PAS LA MEME CHOSE.
//
// LE SCEAU verifie chaque signature prise isolement. Il est calcule en HMAC
// sur l ensemble de ses elements : si une seule ligne a ete modifiee en base
// apres coup — le nom du signataire, la date, l empreinte du document — il
// ne correspond plus.
//
// LE CHAINAGE relie chaque preuve a la precedente. Il detecte ce que le
// sceau ne voit pas : LA SUPPRESSION d une signature du milieu, qui ne
// laisse aucune trace sur les lignes restantes. Sans lui, effacer une preuve
// genante serait invisible.
//
// ⚠️ UNE SIGNATURE AU SCEAU ALTERE NE DOIT PAS ETRE OPPOSEE A UN TIERS.
// L ecran le dit franchement plutot que d afficher un avertissement discret :
// produire une preuve qu on sait alteree serait pire que ne rien produire.
//
// 🆕 LE TRACE MANUSCRIT s affiche dans le dossier de preuve. Son empreinte
// fait partie du sceau : il n est pas decoratif, il est prouve.
//
// ⚠️ LE TRACE PEUT ETRE ABSENT, et ce n est pas un defaut. Il est facultatif :
// quelqu un qui signe depuis un ordinateur sans ecran tactile n en produit
// pas, et sa signature vaut autant.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const NUIT = "#050508";

const LIBELLE_TYPE: any = {
  mandat: "Mandat de gestion",
  lettre_mission: "Lettre de mission",
  autorisation_depot: "Autorisation de dépôt",
  accuse_lecture: "Accusé de lecture avant dépôt",
  convention: "Convention de prestation",
  devis: "Devis",
};

export default function RegistreSignatures() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});

  useEffect(function () {
    charger();
  }, []);

  // Le filtre par société, quand on arrive depuis le dossier d une seule.
  function suffixe() {
    try {
      const p = new URLSearchParams(window.location.search);
      const e = p.get("entite");
      const t = p.get("tenant");
      const bouts: string[] = [];
      if (e) bouts.push("entite=" + encodeURIComponent(e));
      if (t) bouts.push("tenant=" + encodeURIComponent(t));
      return bouts.length ? "?" + bouts.join("&") : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/signature" + suffixe());
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
    background: NUIT,
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
    color: OR,
    fontSize: "12px",
    margin: "0 0 3px",
  };

  const VALEUR: any = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    margin: "0 0 12px",
    lineHeight: "1.6",
    wordBreak: "break-all",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour au portefeuille
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
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
            {/* ---- LES COMPTEURS ---- */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: OR, fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.total}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Document(s) signé(s)
                </p>
              </div>

              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.alterees > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.alterees}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Sceau(x) altéré(s)
                </p>
              </div>

              {/* 🚨 LE CHAINAGE A SON PROPRE COMPTEUR. Il ne se confond pas
                  avec les sceaux : une chaine rompue signale une SUPPRESSION,
                  qu aucun sceau ne peut detecter. */}
              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: d.chaine_rompue > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.chaine_rompue}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Chaîne(s) rompue(s)
                </p>
              </div>

              <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                  {d.verifiees_par_code}
                </p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                  Vérifiée(s) par code
                </p>
              </div>
            </div>

            {d.alterees > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.alterees} signature(s) portent un sceau qui ne correspond plus à leur
                  contenu. Cela signifie que la ligne a été modifiée en base après la
                  signature. Ces signatures ne doivent pas être opposées à un tiers.
                </p>
              </div>
            )}

            {d.chaine_rompue > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.chaine_rompue} signature(s) présentent une rupture de chaîne. Chaque
                  preuve porte l&apos;empreinte de la précédente : une rupture indique
                  qu&apos;une signature a été supprimée du registre, ou insérée hors ordre.
                </p>
              </div>
            )}

            {/* ---- LA LISTE ---- */}
            {d.signatures.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
                  Aucune signature. Produisez un mandat, une lettre de mission ou un accusé
                  de lecture depuis le dossier d&apos;une société, puis envoyez-le à la
                  signature.
                </p>
              </div>
            ) : (
              d.signatures.map(function (s: any) {
                const estOuvert = ouvert[s.id] === true;
                const saine = s.intacte && s.chaine_intacte;
                return (
                  <div
                    key={s.id}
                    style={{
                      ...CARTE,
                      border: "1px solid " + (saine ? "rgba(76,175,80,0.35)" : "rgba(232,131,106,0.6)"),
                      opacity: s.annulee ? 0.5 : 1,
                    }}
                  >
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
                        <p style={{ color: saine ? "#4caf50" : "#e8836a", fontSize: "13px", fontWeight: "bold", margin: "0 0 2px" }}>
                          {s.annulee
                            ? "Annulée"
                            : !s.intacte
                              ? "Sceau altéré"
                              : !s.chaine_intacte
                                ? "Chaîne rompue"
                                : "Sceau vérifié"}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                          {new Date(s.signe_le).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })}
                      style={{
                        background: "none",
                        border: "1px solid rgba(200,169,110,0.45)",
                        color: OR,
                        padding: "7px 15px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontFamily: "Georgia,serif",
                        marginTop: "14px",
                      }}
                    >
                      {estOuvert ? "Fermer le dossier de preuve" : "Dossier de preuve"}
                    </button>

                    {estOuvert && (
                      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>

                        {/* 🆕 LE TRACE MANUSCRIT, EN TETE DU DOSSIER.
                            C est ce qu on regarde en premier — et son empreinte
                            fait partie du sceau, donc il est prouve, pas
                            decoratif. */}
                        {s.trace_signature ? (
                          <>
                            <p style={ETIQUETTE}>Signature manuscrite apposée</p>
                            <div style={{ background: "#fdfcf8", borderRadius: "9px", padding: "10px", marginBottom: "14px", display: "inline-block", maxWidth: "100%" }}>
                              <img
                                src={s.trace_signature}
                                alt="Signature manuscrite"
                                style={{ maxWidth: "100%", height: "auto", display: "block" }}
                              />
                            </div>
                            <p style={ETIQUETTE}>Empreinte du tracé</p>
                            <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "11.5px" }}>
                              {s.trace_sha256}
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={ETIQUETTE}>Signature manuscrite</p>
                            <p style={{ ...VALEUR, color: "rgba(255,255,255,0.45)" }}>
                              Aucun tracé. Le signataire a signé sans dessiner —
                              la signature reste valable.
                            </p>
                          </>
                        )}

                        <p style={ETIQUETTE}>Signataire</p>
                        <p style={VALEUR}>
                          {s.signataire_email}
                          {s.signataire_nom ? " — " + s.signataire_nom : ""}
                          {s.signataire_qualite ? " — " + s.signataire_qualite : ""}
                        </p>

                        <p style={ETIQUETTE}>Date et heure de la signature</p>
                        <p style={VALEUR}>{new Date(s.signe_le).toLocaleString("fr-FR")}</p>

                        {s.ouvert_le && (
                          <>
                            <p style={ETIQUETTE}>Document ouvert le</p>
                            <p style={VALEUR}>{new Date(s.ouvert_le).toLocaleString("fr-FR")}</p>
                          </>
                        )}

                        <p style={ETIQUETTE}>Empreinte SHA-256 du document signé</p>
                        <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "12px" }}>
                          {s.empreinte_sha256}
                        </p>

                        <p style={ETIQUETTE}>Code de vérification</p>
                        <p style={VALEUR}>
                          {s.code_verifie_le
                            ? "Envoyé le " + new Date(s.code_envoye_le).toLocaleString("fr-FR")
                              + ", vérifié le " + new Date(s.code_verifie_le).toLocaleString("fr-FR")
                              + (s.tentatives ? " après " + s.tentatives + " tentative(s)" : "")
                            : "Non vérifié par code"}
                        </p>

                        <p style={ETIQUETTE}>Adresse de connexion</p>
                        <p style={VALEUR}>{s.adresse_ip || "non enregistrée"}</p>

                        <p style={ETIQUETTE}>Navigateur déclaré</p>
                        <p style={{ ...VALEUR, fontSize: "12px" }}>{s.navigateur || "non enregistré"}</p>

                        <p style={ETIQUETTE}>Texte accepté par le signataire</p>
                        <p style={{ ...VALEUR, fontStyle: "italic" }}>{s.consentement}</p>

                        <p style={ETIQUETTE}>Sceau du dossier</p>
                        <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "11px" }}>
                          {s.jeton_preuve}
                        </p>

                        <p style={ETIQUETTE}>Empreinte de chaîne</p>
                        <p style={{ ...VALEUR, fontFamily: "monospace", fontSize: "11px" }}>
                          {s.empreinte_chaine || "première signature du registre"}
                        </p>

                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "12px 0 0", lineHeight: "1.7" }}>
                          Le sceau est calculé sur l&apos;ensemble des éléments ci-dessus, tracé
                          compris. Toute modification, même d&apos;un seul caractère, le rendrait
                          invalide. L&apos;empreinte de chaîne relie cette preuve à la précédente :
                          supprimer une signature du registre se verrait.
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
