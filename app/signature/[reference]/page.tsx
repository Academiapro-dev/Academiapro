"use client";
import { useState, useEffect, useRef } from "react";

const LIBELLE_TYPE: any = {
  convention: "Convention de formation professionnelle",
  devis: "Devis",
  bon_commande: "Bon de commande",
  contrat: "Contrat",
  convocation: "Convocation",
  programme: "Programme de formation",
  attestation: "Attestation de fin de formation",
  emargement: "Attestation d'assiduité",
  livret: "Livret d'accueil",
  soustraitance_contrat: "Contrat de sous-traitance",
  soustraitance_certificat: "Certificat Qualiopi du prestataire",
};

export default function PageSignature({ params }: { params: { reference: string } }) {
  const reference = params.reference || "";

  const [consentement, setConsentement] = useState("");
  const [email, setEmail] = useState("");
  const [deja, setDeja] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [nom, setNom] = useState("");
  const [qualite, setQualite] = useState("");
  const [code, setCode] = useState("");
  const [accepte, setAccepte] = useState(false);
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // 🆕 SANS SESSION, OU AVEC LA MAUVAISE — 03/09, repris de MysterLLC.
  // Le lien du courriel s ouvre souvent dans un navigateur sans session
  // (Gmail integre) : la page disait « Connectez-vous. » sans aucune porte.
  // La porte, c est /connexion?retour=<cette page> : apres le clic dans le
  // courriel de connexion, /api/auth/valider ramene ici, sur ce document.
  const [nonConnecte, setNonConnecte] = useState(false);
  const lienConnexion = "/connexion?retour=" + encodeURIComponent("/signature/" + reference);

  // L heure d ouverture de la page est relevee : elle documente le temps
  // ecoule entre la mise a disposition du document et son acceptation.
  const ouvertLe = useRef(new Date().toISOString());

  // ---- LE TRACE MANUSCRIT — ajout du 01/09, sur le modele MysterLLC ----
  //
  // Le signataire peut dessiner sa signature au doigt ou au stylet. Cocher
  // une case ne RESSEMBLE pas a signer ; le trace change le sentiment
  // d engagement sans rien changer au droit.
  //
  // IL EST FACULTATIF, ET C EST VOULU. A la souris, le resultat ne
  // ressemble a rien : l imposer affaiblirait la preuve au lieu de la
  // renforcer. S il est trace, son empreinte entre dans le sceau cote
  // route : il devient indissociable de la preuve.
  const toile = useRef<any>(null);
  const dessine = useRef(false);
  const [aTrace, setATrace] = useState(false);

  useEffect(function () {
    charger();
    chargerDocument();
  }, []);

  // LE CANVAS EST DIMENSIONNE APRES LE RENDU, quand sa largeur reelle est
  // connue. Un canvas HTML a deux tailles — celle de son attribut et celle
  // de son style ; les confondre decale le trace du doigt, defaut tres
  // visible sur iPad. On ne redimensionne que si necessaire : changer la
  // taille d un canvas EFFACE son contenu.
  useEffect(function () {
    function ajuster() {
      const c = toile.current;
      if (!c) return;
      const largeur = c.offsetWidth;
      const hauteur = 180;
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
  }, [codeEnvoye, document]);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/organisme/signature?vue=miennes");
      const data = await r.json();
      if (r.status === 401) {
        setNonConnecte(true);
      } else if (data.ok) {
        setConsentement(data.consentement || "");
        setEmail(data.email || "");
        const trouvee = (data.signatures || []).find(function (s: any) {
          return s.document_reference === reference && !s.annulee;
        });
        if (trouvee) setDeja(trouvee);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  // Le document doit etre lisible AVANT la signature : la case de consentement
  // fait reconnaitre qu on l a lu.
  async function chargerDocument() {
    try {
      const r = await fetch(
        "/api/organisme/signature?vue=document&reference=" + encodeURIComponent(reference)
      );
      const data = await r.json();
      if (r.status === 401) setNonConnecte(true);
      else if (data.ok) setDocument(data);
      else setErreur(data.erreur || "");
    } catch (e) {}
  }

  // ---- LE DESSIN ----
  //
  // ON UTILISE LES EVENEMENTS POINTER, non les evenements souris ou tactiles
  // separement : ils couvrent le doigt, le stylet et la souris avec le meme
  // code.
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
    setOccupe("code");
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/organisme/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_reference: reference, action: "code" }),
      });
      const data = await r.json();
      if (data.ok) {
        setCodeEnvoye(true);
        setMessage(data.message || "Code envoyé.");
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  async function signer() {
    if (!accepte) {
      setErreur("Cochez la case pour signer.");
      return;
    }
    setOccupe("signature");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_reference: reference,
          accepte: true,
          code: code.trim(),
          signataire_nom: nom,
          signataire_qualite: qualite,
          ouvert_le: ouvertLe.current,
          trace: traceEnImage(),
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setResultat(data);
        await charger();
      } else {
        setErreur(data.erreur || "Signature impossible.");
      }
    } catch (e: any) {
      setErreur("Signature impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "44px 20px",
  };

  const CARTE: any = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "30px 34px",
    marginBottom: "20px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    color: "#1a1a1a",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "18px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#0a3d2e",
    fontSize: "15px",
    fontWeight: "bold",
    marginBottom: "7px",
  };

  const signature = resultat || deja;
  const pretASigner = accepte && nom.trim().length >= 2 && code.trim().length === 6;

  const intitule = document
    ? document.titre || LIBELLE_TYPE[document.type] || "Document"
    : "";

  // L ADRESSE DU BENEFICIAIRE, PAS CELLE DE LA SESSION. Le code part a la
  // personne au nom de qui le document est etabli : annoncer une autre
  // adresse ferait mentir la page, et c est exactement ce qui s est produit.
  const beneficiaire = (document && document.beneficiaire) || "";

  // Le droit de signer est decide par la route, la page ne fait que le
  // refleter — et surtout ne laisse plus cliquer dans le vide.
  const jePeuxSigner = document ? document.vous_pouvez_signer !== false : true;

  const lienCertificat =
    "/api/organisme/certificat?reference=" + encodeURIComponent(reference);

  // L erreur est repetee au plus pres du bouton : sur un telephone ou une
  // tablette, un message affiche en haut de page est invisible depuis le bas.
  function bandeauErreur() {
    if (!erreur) return null;
    return (
      <div style={{ background: "#fdf3f2", border: "1px solid #f0c8c2", borderRadius: "8px", padding: "16px 18px", marginBottom: "18px" }}>
        <p style={{ color: "#a33a2a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>{erreur}</p>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          SIGNATURE ÉLECTRONIQUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "27px", margin: "0 0 10px" }}>
          Document {reference}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.7", marginTop: 0 }}>
          Relisez le document ci-dessous, puis signez-le.
        </p>

        {erreur && (
          <div style={{ ...CARTE, background: "#fdf3f2", border: "1px solid #f0c8c2" }}>
            <p style={{ color: "#a33a2a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>{erreur}</p>
          </div>
        )}

        {document && (
          <div style={{ ...CARTE, background: "#faf8f3", border: "1px solid #e0d6c0" }}>
            <p style={{ color: "#8a7040", fontSize: "12px", letterSpacing: "2px", margin: "0 0 8px" }}>
              LE DOCUMENT
            </p>
            <h2 style={{ color: "#0a3d2e", fontSize: "20px", margin: "0 0 6px" }}>
              {intitule}
            </h2>
            {document.contrepartie && (
              <p style={{ color: "#555", fontSize: "15px", margin: "0 0 16px", lineHeight: "1.7" }}>
                Établi avec {document.contrepartie}.
              </p>
            )}

            {document.lien_lecture ? (
              <a
                href={document.lien_lecture}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#0a3d2e",
                  color: "#ffffff",
                  padding: "14px 26px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontFamily: "Georgia,serif",
                  fontWeight: "bold",
                }}
              >
                Lire le document
              </a>
            ) : (
              <p style={{ color: "#a33a2a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
                Le document n&apos;a pas pu être affiché. Ne signez pas avant d&apos;en avoir pris
                connaissance : demandez-en une copie à l&apos;expéditeur.
              </p>
            )}

            {document.empreinte && (
              <p style={{ color: "#8a7a5a", fontSize: "12px", margin: "16px 0 0", lineHeight: "1.7", wordBreak: "break-all" }}>
                Empreinte du document :<br />
                <span style={{ fontFamily: "monospace" }}>{document.empreinte}</span>
              </p>
            )}
          </div>
        )}

        {nonConnecte ? (
          <div style={{ ...CARTE, background: "#fdf8ee", border: "1px solid #e5d3a8" }}>
            <h2 style={{ color: "#8a6d1f", fontSize: "19px", margin: "0 0 10px" }}>
              Connectez-vous pour lire et signer
            </h2>
            <p style={{ color: "#5a4d2a", fontSize: "15px", margin: "0 0 18px", lineHeight: "1.75" }}>
              Utilisez l&apos;adresse à laquelle ce document vous a été envoyé. Vous recevrez
              un lien de connexion, sans mot de passe, et vous reviendrez directement ici.
            </p>
            <a
              href={lienConnexion}
              style={{ display: "inline-block", background: "#0a3d2e", color: "#ffffff", padding: "14px 26px", borderRadius: "8px", textDecoration: "none", fontSize: "16px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
            >
              Se connecter
            </a>
          </div>
        ) : signature ? (
          <div style={{ ...CARTE, background: "#f2f9f3", border: "1px solid #b8ddbd" }}>
            <p style={{ color: "#2e7d32", fontSize: "19px", fontWeight: "bold", margin: "0 0 14px" }}>
              Document signé
            </p>

            <p style={{ color: "#3a5a3d", fontSize: "15px", margin: "0 0 6px", lineHeight: "1.7" }}>
              {LIBELLE_TYPE[signature.document_type] || signature.document_type || "Document"}
              {" · "}
              {new Date(signature.signe_le).toLocaleString("fr-FR")}
            </p>

            {(signature.code_verifie_le || signature.verifie_par_code) && (
              <p style={{ color: "#2e7d32", fontSize: "14px", margin: "10px 0 0", lineHeight: "1.7" }}>
                Votre identité a été vérifiée par un code envoyé à votre adresse électronique.
              </p>
            )}

            <p style={{ color: "#5a7a5d", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7", wordBreak: "break-all" }}>
              Empreinte du document signé :<br />
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {signature.empreinte_sha256 || signature.empreinte}
              </span>
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "22px 0 0" }}>
              <a
                href={lienCertificat}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#0a3d2e",
                  color: "#ffffff",
                  padding: "14px 26px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontFamily: "Georgia,serif",
                  fontWeight: "bold",
                }}
              >
                Télécharger le certificat
              </a>

              {document && document.lien_lecture && (
                <a
                  href={document.lien_lecture}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: "none",
                    color: "#0a3d2e",
                    border: "1px solid #0a3d2e",
                    padding: "14px 26px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontFamily: "Georgia,serif",
                  }}
                >
                  Relire le document
                </a>
              )}
            </div>

            <p style={{ color: "#6b8a6e", fontSize: "13px", margin: "18px 0 0", lineHeight: "1.7" }}>
              Le document n&apos;a pas été modifié par votre signature : son empreinte reste
              identique. C&apos;est le certificat qui porte la preuve — conservez les deux
              ensemble.
            </p>
          </div>
        ) : !jePeuxSigner ? (
          <div style={{ ...CARTE, background: "#fdf8ee", border: "1px solid #e5d3a8" }}>
            <h2 style={{ color: "#8a6d1f", fontSize: "19px", margin: "0 0 10px" }}>
              Ce document ne vous est pas destiné
            </h2>
            <p style={{ color: "#5a4d2a", fontSize: "15px", margin: "0 0 14px", lineHeight: "1.75" }}>
              Il est établi au nom de <strong>{beneficiaire || "une autre personne"}</strong>.
              Seule cette personne peut le signer : c&apos;est ce qui donne sa valeur à la signature.
            </p>
            <p style={{ color: "#7a6a4a", fontSize: "14px", margin: "0 0 18px", lineHeight: "1.75" }}>
              Vous pouvez lire le document ci-dessus. Pour le signer, connectez-vous avec le
              compte correspondant à cette adresse.
            </p>
            <a
              href={lienConnexion}
              style={{ display: "inline-block", background: "#0a3d2e", color: "#ffffff", padding: "14px 26px", borderRadius: "8px", textDecoration: "none", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
            >
              Se connecter avec ce compte
            </a>
          </div>
        ) : (
          <div style={CARTE}>
            {!codeEnvoye ? (
              <div>
                <h2 style={{ color: "#0a3d2e", fontSize: "19px", margin: "0 0 10px" }}>
                  Vérification de votre identité
                </h2>
                <p style={{ color: "#555", fontSize: "15px", margin: "0 0 20px", lineHeight: "1.75" }}>
                  Avant de signer, nous vérifions que vous êtes bien le titulaire de
                  l&apos;adresse <strong>{beneficiaire || email || "à laquelle ce lien a été envoyé"}</strong>.
                  Un code à six chiffres va vous y être adressé.
                </p>

                {bandeauErreur()}

                <button
                  onClick={demanderCode}
                  disabled={occupe !== ""}
                  style={{ background: occupe !== "" ? "#dfe5e1" : "#0a3d2e", color: occupe !== "" ? "#8a8a8a" : "#ffffff", padding: "17px 30px", borderRadius: "8px", border: "none", cursor: occupe !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "17px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === "code" ? "Envoi du code..." : "Recevoir mon code"}
                </button>

                <p style={{ color: "#777", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
                  Cette vérification renforce la valeur de votre signature : elle établit que
                  la personne qui signe contrôle bien cette adresse.
                </p>
              </div>
            ) : (
              <div>
                {message && (
                  <p style={{ color: "#2e7d32", fontSize: "15px", margin: "0 0 20px", lineHeight: "1.7" }}>
                    {message}
                  </p>
                )}

                <span style={LIBELLE}>Le code reçu par courriel</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="000000"
                  style={{ ...CHAMP, fontSize: "26px", letterSpacing: "10px", textAlign: "center", fontFamily: "monospace" }}
                />

                <button
                  onClick={demanderCode}
                  disabled={occupe !== ""}
                  style={{ background: "none", border: "none", color: "#0a3d2e", cursor: "pointer", fontSize: "14px", textDecoration: "underline", padding: 0, marginBottom: "22px" }}
                >
                  Je n&apos;ai rien reçu — renvoyer un code
                </button>

                <span style={LIBELLE}>Votre nom et prénom</span>
                <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />

                <span style={LIBELLE}>Votre qualité (facultatif)</span>
                <input
                  value={qualite}
                  onChange={(e) => setQualite(e.target.value)}
                  placeholder="Stagiaire, gérant, responsable de formation…"
                  style={CHAMP}
                />

                <span style={LIBELLE}>Votre signature manuscrite (facultatif)</span>
                <p style={{ color: "#777", fontSize: "13px", margin: "0 0 10px", lineHeight: "1.7" }}>
                  Tracez votre signature au doigt ou au stylet dans le cadre. Elle sera
                  jointe à la preuve. Vous pouvez aussi signer sans tracé : la case et le
                  code suffisent.
                </p>
                <canvas
                  ref={toile}
                  onPointerDown={commencer}
                  onPointerMove={tracer}
                  onPointerUp={finir}
                  onPointerLeave={finir}
                  style={{
                    width: "100%",
                    height: "180px",
                    border: "1px dashed #bbb",
                    borderRadius: "8px",
                    background: "#fdfcf9",
                    touchAction: "none",
                    display: "block",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 20px" }}>
                  <span style={{ color: aTrace ? "#2e7d32" : "#999", fontSize: "13px" }}>
                    {aTrace ? "Tracé relevé — il sera scellé avec la signature." : "Aucun tracé pour l'instant."}
                  </span>
                  <button
                    onClick={effacer}
                    style={{ background: "none", border: "1px solid #ccc", color: "#555", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    Effacer
                  </button>
                </div>

                <div
                  onClick={() => setAccepte(!accepte)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "18px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: accepte ? "rgba(10,61,46,0.06)" : "#fafafa",
                    border: accepte ? "2px solid #0a3d2e" : "1px solid #ddd",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{
                    flexShrink: 0,
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    background: accepte ? "#0a3d2e" : "#fff",
                    border: accepte ? "2px solid #0a3d2e" : "2px solid #bbb",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}>
                    {accepte ? "\u2713" : ""}
                  </span>
                  <span style={{ color: "#1a1a1a", fontSize: "15px", lineHeight: "1.75" }}>
                    {consentement || "Chargement du texte de consentement..."}
                  </span>
                </div>

                {bandeauErreur()}

                <button
                  onClick={signer}
                  disabled={occupe !== "" || !pretASigner}
                  style={{
                    background: occupe !== "" || !pretASigner ? "#dfe5e1" : "#0a3d2e",
                    color: occupe !== "" || !pretASigner ? "#8a8a8a" : "#ffffff",
                    padding: "17px 30px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: occupe !== "" || !pretASigner ? "default" : "pointer",
                    fontWeight: "bold",
                    fontSize: "17px",
                    fontFamily: "Georgia,serif",
                    width: "100%",
                  }}
                >
                  {occupe === "signature" ? "Signature en cours..." : "Signer ce document"}
                </button>

                <p style={{ color: "#777", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
                  Au moment de votre signature, le document est archivé tel quel et son empreinte
                  numérique est calculée. La date, l&apos;heure de vérification de votre code, votre
                  adresse de connexion et le texte que vous acceptez sont enregistrés avec elle.
                </p>

                <p style={{ color: "#999", fontSize: "12px", margin: "12px 0 0", lineHeight: "1.6" }}>
                  Signature électronique simple au sens du règlement européen eIDAS. Elle n&apos;est
                  ni avancée ni qualifiée.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
