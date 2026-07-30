"use client";
import { useState, useEffect } from "react";

const LIBELLE_TYPE: any = {
  convention: "Convention de formation professionnelle",
  devis: "Devis",
  convocation: "Convocation",
  programme: "Programme de formation",
  attestation: "Attestation de fin de formation",
  emargement: "Attestation d assiduite",
  livret: "Livret d accueil",
};

export default function PageSignature({ params }: { params: { reference: string } }) {
  const reference = params.reference || "";

  const [consentement, setConsentement] = useState("");
  const [deja, setDeja] = useState<any>(null);
  const [nom, setNom] = useState("");
  const [qualite, setQualite] = useState("");
  const [accepte, setAccepte] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/organisme/signature?vue=miennes");
      const data = await r.json();
      if (data.ok) {
        setConsentement(data.consentement || "");
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

  async function signer() {
    if (!accepte) {
      setErreur("Cochez la case pour signer.");
      return;
    }
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_reference: reference,
          accepte: true,
          signataire_nom: nom,
          signataire_qualite: qualite,
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
    setOccupe(false);
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

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          SIGNATURE ELECTRONIQUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "27px", margin: "0 0 10px" }}>
          Document {reference}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: "1.7", marginTop: 0 }}>
          Relisez le document que vous avez recu, puis signez-le ci-dessous.
        </p>

        {erreur && (
          <div style={{ ...CARTE, background: "#fdf3f2", border: "1px solid #f0c8c2" }}>
            <p style={{ color: "#a33a2a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>{erreur}</p>
          </div>
        )}

        {signature ? (
          <div style={{ ...CARTE, background: "#f2f9f3", border: "1px solid #b8ddbd" }}>
            <p style={{ color: "#2e7d32", fontSize: "19px", fontWeight: "bold", margin: "0 0 14px" }}>
              Document signe
            </p>

            <p style={{ color: "#3a5a3d", fontSize: "15px", margin: "0 0 6px", lineHeight: "1.7" }}>
              {LIBELLE_TYPE[signature.document_type] || signature.document_type || "Document"}
              {" · "}
              {new Date(signature.signe_le).toLocaleString("fr-FR")}
            </p>

            <p style={{ color: "#5a7a5d", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7", wordBreak: "break-all" }}>
              Empreinte du document signe :<br />
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {signature.empreinte_sha256 || signature.empreinte}
              </span>
            </p>

            <p style={{ color: "#6b8a6e", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
              Cette empreinte identifie le document de maniere unique. Si une seule lettre
              en etait modifiee, elle changerait entierement. Conservez-la.
            </p>
          </div>
        ) : (
          <div style={CARTE}>
            <span style={LIBELLE}>Votre nom et prenom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Votre qualite (facultatif)</span>
            <input
              value={qualite}
              onChange={(e) => setQualite(e.target.value)}
              placeholder="Stagiaire, gerant, responsable de formation..."
              style={CHAMP}
            />

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
                {accepte ? "✓" : ""}
              </span>
              <span style={{ color: "#1a1a1a", fontSize: "15px", lineHeight: "1.75" }}>
                {consentement || "Chargement du texte de consentement..."}
              </span>
            </div>

            <button
              onClick={signer}
              disabled={occupe || !accepte || nom.trim().length < 2}
              style={{
                background: occupe || !accepte || nom.trim().length < 2 ? "#dfe5e1" : "#0a3d2e",
                color: occupe || !accepte || nom.trim().length < 2 ? "#8a8a8a" : "#ffffff",
                padding: "17px 30px",
                borderRadius: "8px",
                border: "none",
                cursor: occupe || !accepte || nom.trim().length < 2 ? "default" : "pointer",
                fontWeight: "bold",
                fontSize: "17px",
                fontFamily: "Georgia,serif",
                width: "100%",
              }}
            >
              {occupe ? "Signature en cours..." : "Signer ce document"}
            </button>

            <p style={{ color: "#777", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
              Au moment de votre signature, le document est archive tel quel et son empreinte
              numerique est calculee. La date, votre adresse de connexion et le texte que vous
              acceptez sont enregistres avec elle.
            </p>

            <p style={{ color: "#999", fontSize: "12px", margin: "12px 0 0", lineHeight: "1.6" }}>
              Signature electronique simple au sens du reglement europeen eIDAS. Elle n est
              ni avancee ni qualifiee.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
