"use client";
import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// L ECRAN DE SIGNATURE MYSTERLLC — 01/09.
//
// TROIS TEMPS, DANS CET ORDRE, ET L ORDRE COMPTE :
//   1. LIRE le document. On ne demande a personne de reconnaitre avoir lu
//      un texte qu on ne lui montre pas — la case de consentement se
//      retournerait contre nous.
//   2. TRACER sa signature au doigt ou au stylet.
//   3. SAISIR le code recu par courriel, qui prouve que le titulaire de
//      l adresse est bien celui qui a clique.
//
// 🆕 LE TRACE MANUSCRIT. Observation de Jacques, en tant qu utilisateur :
// « je me laisse souvent entrainer par les apparences comme tout humain ».
// Cocher une case ne RESSEMBLE pas a signer. Le trace ne change rien au
// droit — la signature electronique simple vaut deja entre les parties —
// mais il change le sentiment d engagement.
//
// ⚠️ IL EST FACULTATIF, ET C EST VOULU. Certains signeront depuis un
// ordinateur sans ecran tactile, a la souris, avec un resultat qui ne
// ressemble a rien. Leur imposer un trace produirait un gribouillis qui
// affaiblirait la preuve au lieu de la renforcer.
//
// ⚠️ SON EMPREINTE ENTRE DANS LE SCEAU. Un trace hors du sceau serait
// decoratif et remplacable : on montrerait une signature sans pouvoir
// prouver que c est celle qui a ete apposee.
//
// ⚠️ LE CANVAS SE REDIMENSIONNE AVEC L ECRAN. Un canvas HTML a deux
// tailles — celle de son attribut et celle de son style. Les confondre
// decale le trace du doigt, defaut classique et tres visible sur iPad.
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

export default function PageSignature({ params }: any) {
  const [reference, setReference] = useState("");
  const [doc, setDoc] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [lu, setLu] = useState(false);
  const [accepte, setAccepte] = useState(false);
  const [nom, setNom] = useState("");
  const [qualite, setQualite] = useState("");
  const [code, setCode] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [signe, setSigne] = useState<any>(null);

  // 🆕 SANS SESSION, OU AVEC LA MAUVAISE — 02/09.
  //
  // CONSTATE EN TEST REEL. Le lien du courriel s ouvre dans le navigateur
  // integre de Gmail, qui n a aucune session : la page disait
  // « Connectez-vous. » en rouge, et rien d autre. Le signataire n avait
  // aucun bouton, aucun chemin. Meme chose quand la session est celle d une
  // autre personne : « connectez-vous avec ce compte », sans porte.
  //
  // La porte, c est /connexion?retour=<cette page> : apres le clic dans le
  // courriel de connexion, /api/auth/valider ramene ici, sur ce document.
  const [nonConnecte, setNonConnecte] = useState(false);

  // L instant ou le document a ete ouvert : il entre dans le dossier de
  // preuve et montre que le signataire a eu le temps de lire.
  const ouvertLe = useRef<string>(new Date().toISOString());

  // ---- LE TRACE ----
  const toile = useRef<any>(null);
  const dessine = useRef(false);
  const [aTrace, setATrace] = useState(false);

  useEffect(function () {
    try {
      const p = params && params.reference ? String(params.reference) : "";
      setReference(decodeURIComponent(p));
    } catch {
      setReference("");
    }
  }, [params]);

  useEffect(function () {
    if (reference) charger();
  }, [reference]);

  // ⚠️ LE CANVAS EST DIMENSIONNE APRES LE RENDU, quand sa largeur reelle est
  // connue. Fixer une largeur en dur produirait un trace decale sur toute
  // taille d ecran differente.
  useEffect(function () {
    function ajuster() {
      const c = toile.current;
      if (!c) return;
      const largeur = c.offsetWidth;
      const hauteur = 180;
      // On ne redimensionne que si necessaire : changer la taille d un
      // canvas EFFACE son contenu.
      if (c.width !== largeur || c.height !== hauteur) {
        c.width = largeur;
        c.height = hauteur;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#1a1a2e";
        }
      }
    }
    ajuster();
    window.addEventListener("resize", ajuster);
    return function () { window.removeEventListener("resize", ajuster); };
  }, [doc]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/signature?vue=document&reference="
        + encodeURIComponent(reference));
      const d = await r.json();
      if (d.ok) setDoc(d);
      else if (r.status === 401) setNonConnecte(true);
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  // ---- LE DESSIN ----
  //
  // ⚠️ ON UTILISE LES EVENEMENTS POINTER, non les evenements souris ou
  // tactiles separement : ils couvrent le doigt, le stylet et la souris
  // avec le meme code.
  function position(e: any) {
    const c = toile.current;
    const cadre = c.getBoundingClientRect();
    return {
      x: e.clientX - cadre.left,
      y: e.clientY - cadre.top,
    };
  }

  function commencer(e: any) {
    e.preventDefault();
    const c = toile.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const p = position(e);
    dessine.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function tracer(e: any) {
    if (!dessine.current) return;
    e.preventDefault();
    const c = toile.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const p = position(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!aTrace) setATrace(true);
  }

  function finir() {
    dessine.current = false;
  }

  function effacer() {
    const c = toile.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    setATrace(false);
  }

  function traceEnImage(): string {
    if (!aTrace) return "";
    const c = toile.current;
    if (!c) return "";
    try {
      return c.toDataURL("image/png");
    } catch {
      return "";
    }
  }

  async function demanderCode() {
    setOccupe(true);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/compliance/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_reference: reference, action: "code" }),
      });
      const d = await r.json();
      if (d.ok) {
        setCodeEnvoye(true);
        setMessage(d.message || "Code envoyé.");
      } else {
        setErreur(d.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function signer() {
    setOccupe(true);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/compliance/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_reference: reference,
          accepte: true,
          code: code,
          signataire_nom: nom,
          signataire_qualite: qualite,
          trace: traceEnImage(),
          ouvert_le: ouvertLe.current,
        }),
      });
      const d = await r.json();
      if (d.ok) setSigne(d);
      else setErreur(d.erreur || "Signature impossible.");
    } catch (e: any) {
      setErreur("Signature impossible : " + String(e));
    }
    setOccupe(false);
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
    padding: "22px 24px",
    marginBottom: "16px",
  };

  const BOUTON: any = {
    background: "linear-gradient(135deg,#c8a96e,#a07840)",
    color: NUIT,
    border: "none",
    borderRadius: "9px",
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "bold",
    fontFamily: "Georgia,serif",
    cursor: "pointer",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "14.5px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
  };

  // Le chemin de cette page, pour y revenir apres la connexion.
  const lienConnexion = "/connexion?retour="
    + encodeURIComponent("/compliance/signature/" + reference);

  // ---- LA SIGNATURE EST FAITE ----
  if (signe) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "620px", margin: "0 auto" }}>
          <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.45)", textAlign: "center" }}>
            <p style={{ color: "#00e676", fontSize: "13px", letterSpacing: "2px", margin: "0 0 12px" }}>
              SIGNATURE ENREGISTRÉE
            </p>
            <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 16px" }}>
              C&apos;est signé.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.85", margin: "0 0 20px" }}>
              Le document {reference} porte désormais votre signature. Un
              dossier de preuve a été constitué : empreinte du document,
              date, heure, adresse de connexion et code vérifié.
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.8", margin: 0, wordBreak: "break-all" }}>
              Empreinte du document signé<br />
              <span style={{ fontFamily: "monospace" }}>{signe.empreinte}</span>
            </p>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", lineHeight: "1.8", textAlign: "center" }}>
            {signe.avertissement}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "620px", margin: "0 auto" }}>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          SIGNATURE ÉLECTRONIQUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "26px", margin: "0 0 26px" }}>
          {doc && LIBELLE_TYPE[doc.type] ? LIBELLE_TYPE[doc.type] : "Document à signer"}
        </h1>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
              {erreur}
            </p>
          </div>
        )}

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.4)" }}>
            <p style={{ color: "#00e676", fontSize: "14.5px", lineHeight: "1.8", margin: 0 }}>
              {message}
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : nonConnecte ? (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "14.5px", lineHeight: "1.85", margin: "0 0 18px" }}>
              Pour lire et signer ce document, connectez-vous avec l&apos;adresse
              à laquelle il vous a été envoyé. Vous recevrez un lien de
              connexion, sans mot de passe, et vous reviendrez directement ici.
            </p>
            <a href={lienConnexion} style={{ ...BOUTON, display: "inline-block", textDecoration: "none" }}>
              Se connecter
            </a>
          </div>
        ) : !doc ? null : !doc.signable ? (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "14.5px", lineHeight: "1.85", margin: 0 }}>
              {doc.avertissement}
            </p>
          </div>
        ) : !doc.vous_pouvez_signer ? (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "14.5px", lineHeight: "1.85", margin: "0 0 18px" }}>
              Ce document est établi au nom de {doc.signataire}. Seule cette
              personne peut le signer : connectez-vous avec ce compte.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a href={lienConnexion} style={{ ...BOUTON, display: "inline-block", textDecoration: "none" }}>
                Se connecter avec ce compte
              </a>
              {/* Le gestionnaire qui a produit le document peut le LIRE sans
                  pouvoir le signer : la route l y autorise, l ecran ne le
                  proposait pas. */}
              {doc.lien_lecture && (
                <a
                  href={doc.lien_lecture}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "14px 28px",
                    borderRadius: "9px",
                    border: "1px solid rgba(200,169,110,0.45)",
                    color: OR,
                    textDecoration: "none",
                    fontSize: "15px",
                    fontFamily: "Georgia,serif",
                  }}
                >
                  Lire le document
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ---- 1. LIRE ---- */}
            <div style={CARTE}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                1. LISEZ LE DOCUMENT
              </p>
              {doc.titre && (
                <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 6px" }}>{doc.titre}</p>
              )}
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 16px" }}>
                Référence {doc.reference}
              </p>

              {doc.lien_lecture ? (
                <a
                  href={doc.lien_lecture}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setLu(true)}
                  style={{ ...BOUTON, display: "inline-block", textDecoration: "none" }}
                >
                  Ouvrir le document
                </a>
              ) : (
                <p style={{ color: "#e8836a", fontSize: "14px", margin: 0 }}>
                  Le document n&apos;est pas encore archivé. Il doit l&apos;être
                  avant de pouvoir être signé.
                </p>
              )}

              {lu && (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "14px 0 0", lineHeight: "1.7" }}>
                  Vous pouvez le rouvrir autant de fois que nécessaire avant
                  de signer.
                </p>
              )}
            </div>

            {/* ---- 2. TRACER ---- */}
            <div style={CARTE}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 8px" }}>
                2. TRACEZ VOTRE SIGNATURE
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.75", margin: "0 0 14px" }}>
                Au doigt ou au stylet. Facultatif : votre signature est
                valable sans tracé, mais il figurera au dossier de preuve.
              </p>

              {/* ⚠️ touchAction none EMPECHE LA PAGE DE DEFILER pendant qu on
                  dessine. Sans lui, tracer sur iPad fait glisser l ecran et
                  le trait s interrompt. */}
              <canvas
                ref={toile}
                onPointerDown={commencer}
                onPointerMove={tracer}
                onPointerUp={finir}
                onPointerLeave={finir}
                style={{
                  width: "100%",
                  height: "180px",
                  background: "#fdfcf8",
                  borderRadius: "9px",
                  border: "1px solid rgba(200,169,110,0.35)",
                  touchAction: "none",
                  display: "block",
                  cursor: "crosshair",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ color: aTrace ? "#00e676" : "rgba(255,255,255,0.35)", fontSize: "12.5px" }}>
                  {aTrace ? "Tracé enregistré" : "Zone de signature"}
                </span>
                <button
                  onClick={effacer}
                  disabled={!aTrace}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: aTrace ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                    borderRadius: "7px",
                    padding: "7px 16px",
                    fontSize: "12.5px",
                    fontFamily: "Georgia,serif",
                    cursor: aTrace ? "pointer" : "default",
                  }}
                >
                  Effacer
                </button>
              </div>
            </div>

            {/* ---- 3. S IDENTIFIER ---- */}
            <div style={CARTE}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 14px" }}>
                3. VOS COORDONNÉES
              </p>

              <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>
                Nom et prénom
              </label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Jean Dupont"
                style={{ ...CHAMP, marginBottom: "14px" }}
              />

              <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>
                Qualité (facultatif)
              </label>
              <input
                value={qualite}
                onChange={(e) => setQualite(e.target.value)}
                placeholder="Gérant"
                style={CHAMP}
              />
            </div>

            {/* ---- 4. CONSENTIR ET SIGNER ---- */}
            <div style={CARTE}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 14px" }}>
                4. VÉRIFICATION ET SIGNATURE
              </p>

              <label style={{ display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer", marginBottom: "18px" }}>
                <input
                  type="checkbox"
                  checked={accepte}
                  onChange={(e) => setAccepte(e.target.checked)}
                  style={{ marginTop: "4px", width: "18px", height: "18px", flexShrink: 0 }}
                />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", lineHeight: "1.8" }}>
                  Je reconnais avoir lu le document, j&apos;en accepte les
                  termes, et j&apos;appose ma signature électronique. Je
                  reconnais que cette signature a la même valeur que ma
                  signature manuscrite entre les parties. Je confirme être le
                  titulaire de l&apos;adresse électronique à laquelle le code
                  de vérification a été adressé.
                </span>
              </label>

              {!codeEnvoye ? (
                <button
                  onClick={demanderCode}
                  disabled={occupe || !accepte}
                  style={{
                    ...BOUTON,
                    width: "100%",
                    opacity: accepte ? 1 : 0.4,
                    cursor: accepte ? "pointer" : "not-allowed",
                  }}
                >
                  {occupe ? "Envoi…" : "Recevoir mon code par courriel"}
                </button>
              ) : (
                <>
                  <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>
                    Code à six chiffres
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    style={{
                      ...CHAMP,
                      marginBottom: "14px",
                      fontSize: "24px",
                      letterSpacing: "8px",
                      textAlign: "center",
                    }}
                  />
                  <button
                    onClick={signer}
                    disabled={occupe || code.length !== 6}
                    style={{
                      ...BOUTON,
                      width: "100%",
                      opacity: code.length === 6 ? 1 : 0.4,
                      cursor: code.length === 6 ? "pointer" : "not-allowed",
                    }}
                  >
                    {occupe ? "Signature…" : "Signer le document"}
                  </button>
                  <button
                    onClick={demanderCode}
                    disabled={occupe}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "12.5px",
                      fontFamily: "Georgia,serif",
                      cursor: "pointer",
                      marginTop: "12px",
                      textDecoration: "underline",
                      width: "100%",
                    }}
                  >
                    Renvoyer un code
                  </button>
                </>
              )}
            </div>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", lineHeight: "1.8", textAlign: "center" }}>
              Signature électronique simple au sens du règlement eIDAS. Elle
              n&apos;est ni avancée ni qualifiée : elle est opposable entre les
              parties, elle ne vaut pas vérification d&apos;identité.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
