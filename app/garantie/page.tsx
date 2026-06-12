"use client";
import { useState } from "react";

export default function RemboursementPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [commande, setCommande] = useState("");
  const [raison, setRaison] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nom || !email || !commande || !raison) {
      setErreur("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setErreur("");
    setEnvoye(true);
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "Georgia, serif", padding: "60px 20px" }}>

      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-block", border: "1px solid #c8a96e", padding: "6px 22px", marginBottom: "24px" }}>
            <span style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase" }}>Garantie Absolue</span>
          </div>
          <h1 style={{ color: "#f5f0e8", fontSize: "38px", fontWeight: "300", letterSpacing: "2px", margin: "0 0 16px 0", lineHeight: "1.2" }}>
            Satisfait ou Remboursé
          </h1>
          <div style={{ width: "60px", height: "1px", backgroundColor: "#c8a96e", margin: "0 auto 24px auto" }}></div>
          <p style={{ color: "#9a9080", fontSize: "16px", lineHeight: "1.8", maxWidth: "520px", margin: "0 auto" }}>
            Nous offrons une garantie complète de <span style={{ color: "#c8a96e", fontWeight: "600" }}>30 jours</span> sur l'ensemble de nos produits. Si vous n'êtes pas entièrement satisfait, nous vous remboursons sans question.
          </p>
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "56px", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "200px", backgroundColor: "#0d0d12", border: "1px solid #1e1e28", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: "#c8a96e", fontSize: "28px", marginBottom: "10px" }}>30</div>
            <div style={{ color: "#f5f0e8", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Jours de Garantie</div>
            <div style={{ color: "#6a6460", fontSize: "13px", lineHeight: "1.6" }}>À compter de la date de réception de votre commande</div>
          </div>
          <div style={{ flex: "1", minWidth: "200px", backgroundColor: "#0d0d12", border: "1px solid #1e1e28", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: "#c8a96e", fontSize: "28px", marginBottom: "10px" }}>100%</div>
            <div style={{ color: "#f5f0e8", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Remboursement</div>
            <div style={{ color: "#6a6460", fontSize: "13px", lineHeight: "1.6" }}>Montant intégral remboursé sur votre moyen de paiement</div>
          </div>
          <div style={{ flex: "1", minWidth: "200px", backgroundColor: "#0d0d12", border: "1px solid #1e1e28", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ color: "#c8a96e", fontSize: "28px", marginBottom: "10px" }}>5j</div>
            <div style={{ color: "#f5f0e8", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Délai de Traitement</div>
            <div style={{ color: "#6a6460", fontSize: "13px", lineHeight: "1.6" }}>Votre demande traitée en moins de 5 jours ouvrés</div>
          </div>
        </div>

        {!envoye ? (
          <div style={{ backgroundColor: "#0d0d12", border: "1px solid #1e1e28", padding: "48px 40px" }}>

            <div style={{ marginBottom: "36px" }}>
              <h2 style={{ color: "#f5f0e8", fontSize: "22px", fontWeight: "300", letterSpacing: "2px", margin: "0 0 8px 0", textTransform: "uppercase" }}>
                Demande de Remboursement
              </h2>
              <div style={{ width: "40px", height: "1px", backgroundColor: "#c8a96e" }}></div>
            </div>

            {erreur && (
              <div style={{ backgroundColor: "#1a0a0a", border: "1px solid #6b2020", padding: "14px 18px", marginBottom: "28px" }}>
                <p style={{ color: "#e05555", fontSize: "13px", margin: "0", letterSpacing: "0.5px" }}>{erreur}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
                <div style={{ flex: "1", minWidth: "220px" }}>
                  <label style={{ display: "block", color: "#c8a96e", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Jean Dupont"
                    style={{ width: "100%", backgroundColor: "#050508", border: "1px solid #2a2a35", borderRadius: "0", padding: "14px 16px", color: "#f5f0e8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }}
                  />
                </div>
                <div style={{ flex: "1", minWidth: "220px" }}>
                  <label style={{ display: "block", color: "#c8a96e", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
                    Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@exemple.com"
                    style={{ width: "100%", backgroundColor: "#050508", border: "1px solid #2a2a35", borderRadius: "0", padding: "14px 16px", color: "#f5f0e8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#c8a96e", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Numéro de commande *
                </label>
                <input
                  type="text"
                  value={commande}
                  onChange={(e) => setCommande(e.target.value)}
                  placeholder="Ex : CMD-2024-00182"
                  style={{ width: "100%", backgroundColor: "#050508", border: "1px solid #2a2a35", borderRadius: "0", padding: "14px 16px", color: "#f5f0e8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#c8a96e", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Motif de la demande *
                </label>
                <select
                  value={raison}
                  onChange={(e) => setRaison(e.target.value)}
                  style={{ width: "100%", backgroundColor: "#050508", border: "1px solid #2a2a35", borderRadius: "0", padding: "14px 16px", color: raison ? "#f5f0e8" : "#6a6460", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif", appearance: "none", cursor: "pointer" }}
                >
                  <option value="" style={{ color: "#6a6460", backgroundColor: "#0d0d12" }}>Sélectionnez un motif</option>
                  <option value="non-conforme" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Produit non conforme à la description</option>
                  <option value="defectueux" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Produit défectueux ou endommagé</option>
                  <option value="non-recu" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Commande non reçue</option>
                  <option value="insatisfait" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Insatisfaction générale</option>
                  <option value="erreur" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Erreur de commande</option>
                  <option value="autre" style={{ color: "#f5f0e8", backgroundColor: "#0d0d12" }}>Autre raison</option>
                </select>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", color: "#c8a96e", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Message complémentaire
                </label>
                <textarea
                  rows={5}
                  placeholder="Décrivez votre situation en détail pour accélérer le traitement de votre demande..."
                  style={{ width: "100%", backgroundColor: "#050508", border: "1px solid #2a2a35", borderRadius: "0", padding: "14px 16px", color: "#f5f0e8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif", resize: "vertical", lineHeight: "1.7" }}
                />
              </div>

              <div style={{ backgroundColor: "#050508", border: "1px solid #1e1e28", padding: "18px 20px", marginBottom: "32px" }}>
                <p style={{ color: "#6a6460", fontSize: "12px", lineHeight: "1.8", margin: "0", letterSpacing: "0.3px" }}>
                  En soumettant ce formulaire, vous confirmez que votre achat date de moins de 30 jours et que vous acceptez notre politique de remboursement. Notre équipe vous contactera sous 2 jours ouvrés pour confirmer votre demande.
                </p>
              </div>

              <button
                type="submit"
                style={{ width: "100%", backgroundColor: "#c8a96e", color: "#050508", border: "none", padding: "18px 32px", fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: "700", cursor: "pointer" }}
              >
                Soumettre ma Demande
              </button>

            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: "#0d0d12", border: "1px solid #c8a96e", padding: "56px 40px", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", border: "2px solid #c8a96e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px auto" }}>
              <div style={{ color: "#c8a96e", fontSize: "24px", lineHeight: "1" }}>✓</div>
            </div>
            <h2 style={{ color: "#f5f0e8", fontSize: "26px", fontWeight: "300", letterSpacing: "2px", margin: "0 0 16px 0" }}>
              Demande Enregistrée
            </h2>
            <div style={{ width: "40px", height: "1px", backgroundColor: "#c8a96e", margin: "0 auto 24px auto" }}></div>
            <p style={{ color: "#9a9080", fontSize: "15px", lineHeight: "1.8", maxWidth: "440px", margin: "0 auto 12px auto" }}>
              Votre demande de remboursement a bien été transmise à notre équipe. Vous recevrez une confirmation par e-mail dans les plus brefs délais.
            </p>
            <p style={{ color: "#6a6460", fontSize: "13px", lineHeight: "1.8", maxWidth: "440px", margin: "0 auto 36px auto" }}>
              Délai de traitement estimé : <span style={{ color: "#c8a96e" }}>2 à 5 jours ouvrés</span>
            </p>
            <button
              onClick={() => { setEnvoye(false); setNom(""); setEmail(""); setCommande(""); setRaison(""); }}
              style={{ backgroundColor: "transparent", color: "#c8a96e", border: "1px solid #c8a96e", padding: "14px 36px", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "Georgia, serif", cursor: "pointer" }}
            >
              Nouvelle Demande
            </button>
          </div>
        )}

        <div style={{ marginTop: "56px", borderTop: "1px solid #1e1e28", paddingTop: "40px", display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "3