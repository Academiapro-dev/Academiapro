"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// L ECRAN D ESSAI DU SMS.
//
// La tuyauterie a ete posee le 14 aout — table sms_envoyes, colonne de
// consentement sur cinq tables, route /api/admin/envoyer-sms, cle Brevo
// dans Vercel — mais AUCUN message n est jamais parti. Une route qui n a
// jamais tourne n est pas une route qui marche.
//
// LA ROUTE ATTEND UN APPEL EN POST : on ne peut pas l eprouver depuis la
// barre d adresse. D ou cet ecran.
//
// LE COMPTE DES CARACTERES EST AFFICHE AVANT L ENVOI : au-dela de 160, un
// message est decoupe et facture en plusieurs SMS. Mieux vaut le voir en
// ecrivant qu en relisant sa facture.
export default function PageEssaiSMS() {
  const [numero, setNumero] = useState("");
  const [message, setMessage] = useState(
    "Bonjour, ceci est un essai depuis AcadeMIA Pro. Merci de ne pas repondre."
  );
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [historique, setHistorique] = useState<any[]>([]);

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/admin/sms-envoyes", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.ok && Array.isArray(d.lignes)) setHistorique(d.lignes);
    } catch (e) { /* l historique est un confort, pas une necessite */ }
  }

  async function envoyer() {
    setOccupe(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/admin/envoyer-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero,
          message: message,
          origine: "essai",
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setResultat(d);
        await charger();
      } else {
        setErreur(d.erreur || "Envoi impossible.");
        if (d.detail) setErreur((d.erreur || "") + " — " + d.detail);
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  const n = message.length;
  const morceaux = n <= 160 ? 1 : Math.ceil(n / 153);

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "22px 26px", marginBottom: "16px",
  };
  const CHAMP: any = {
    width: "100%", padding: "12px 14px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "14px",
  };
  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "13px", marginBottom: "6px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à l'administration
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          ESSAI
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Envoyer un SMS
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Envoyez-vous un message pour vérifier que la chaîne fonctionne de bout
          en bout. Chaque envoi consomme un crédit Brevo.
        </p>

        <div style={CARTE}>
          <span style={LIBELLE}>Numéro du destinataire</span>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="06 12 34 56 78 ou +33 6 12 34 56 78"
            style={CHAMP}
          />

          <span style={LIBELLE}>Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ ...CHAMP, lineHeight: "1.6" }}
          />

          <p style={{
            color: morceaux > 1 ? "#e8a33d" : "rgba(255,255,255,0.4)",
            fontSize: "13px", margin: "0 0 18px",
          }}>
            {n} caractère(s)
            {morceaux > 1
              ? " — attention, " + morceaux + " SMS seront décomptés"
              : " — 1 SMS"}
          </p>

          <button
            onClick={envoyer}
            disabled={occupe || numero.trim().length < 6 || message.trim().length < 2}
            style={{
              background: occupe || numero.trim().length < 6 ? "rgba(200,169,110,0.3)" : OR,
              color: occupe || numero.trim().length < 6 ? "#8a8a8a" : FOND,
              padding: "14px 28px", borderRadius: "8px", border: "none",
              cursor: occupe ? "default" : "pointer", fontWeight: "bold",
              fontSize: "15px", fontFamily: "Georgia,serif", width: "100%",
            }}
          >
            {occupe ? "Envoi en cours…" : "Envoyer le SMS"}
          </button>
        </div>

        {resultat && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "16px", fontWeight: "bold", margin: "0 0 10px" }}>
              {resultat.message}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
              Destinataire : {resultat.destinataire}<br />
              {resultat.caracteres} caractère(s) · {resultat.sms_decomptes} SMS décompté(s)
              {resultat.message_id ? <><br />Référence : {resultat.message_id}</> : null}
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              {erreur}
            </p>
          </div>
        )}

        {historique.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Les derniers envois
            </h2>
            {historique.map(function (l: any) {
              return (
                <div key={l.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", margin: "0 0 3px" }}>
                    {l.destinataire}
                    <span style={{
                      color: l.statut === "envoye" ? "#4caf50" : l.statut === "echec" ? "#e8836a" : "rgba(255,255,255,0.4)",
                      marginLeft: "10px",
                    }}>
                      {l.statut}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "10px", fontSize: "12.5px" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString("fr-FR") : ""}
                    </span>
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: 0, lineHeight: "1.6" }}>
                    {String(l.message || "").slice(0, 120)}
                  </p>
                  {l.erreur && (
                    <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "3px 0 0" }}>
                      {String(l.erreur).slice(0, 200)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.8", marginTop: "20px" }}>
          Rappel : la prospection par SMS exige un consentement préalable, même
          entre professionnels. Les numéros de la base servent au suivi — rappeler
          un prospect qui a répondu, prévenir après un courriel — jamais à une
          campagne.
        </p>
      </div>
    </div>
  );
}
