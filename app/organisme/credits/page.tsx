"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// COMMANDER DES CREDITS — SMS et minutes d appel — 06/09.
//
// 🚨 CET ECRAN NE FAIT PAS PAYER. En B2B le reglement se fait par virement :
// le client commande, il recoit une facture, et ses credits sont ajoutes a
// reception. C est dit en toutes lettres — un bouton « Commander » qui
// n ouvre pas de paiement doit expliquer ce qui se passe ensuite, sinon le
// client attend un ecran de carte bancaire qui ne vient jamais.
//
// ⚠️ LE SOLDE S AFFICHE AVANT LES LOTS. Ce qu on vient chercher ici, c est
// d abord de savoir ou l on en est.
//
// ⚠️ LES LOTS VIENNENT DE LA BASE, jamais ecrits ici. Une grille recopiee
// dans du code finit toujours par mentir.
// ══════════════════════════════════════════════════════════════════════════

function euros(n: any) {
  const v = Number(n) || 0;
  return v.toFixed(2).replace(".", ",") + " €";
}

// LE PRIX A L UNITE, EN CENTIMES LISIBLES.
//
// ⚠️ DEUX DECIMALES PAR DEFAUT, TROIS QUAND ELLES PORTENT UNE VALEUR.
// « 0,10 € » se lit, « 0,1 € » a l air d une coquille ; et un lot a
// 0,075 € la minute doit garder sa troisieme decimale, sans quoi deux lots
// differents afficheraient le meme prix.
function centimes(n: any) {
  const v = Number(n) || 0;
  const entierEnCentimes = Math.abs(v * 100 - Math.round(v * 100)) < 0.0001;
  return v.toFixed(entierEnCentimes ? 2 : 3).replace(".", ",") + " €";
}

export default function PageCredits() {
  const [lots, setLots] = useState<any>({ sms: [], minutes: [] });
  const [smsCredits, setSmsCredits] = useState(0);
  const [minCredits, setMinCredits] = useState(0);
  const [expediteur, setExpediteur] = useState("");
  const [numero, setNumero] = useState("");
  const [commandes, setCommandes] = useState<any[]>([]);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/organisme/credits", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) {
        setLots(d.lots || { sms: [], minutes: [] });
        setSmsCredits(Number(d.sms_credits || 0));
        setMinCredits(Number(d.minutes_credits || 0));
        setExpediteur(String(d.sms_expediteur || ""));
        setNumero(String(d.tel_numero || ""));
        setCommandes(Array.isArray(d.commandes) ? d.commandes : []);
      } else if (d && d.erreur) {
        setErreur(d.erreur);
      }
    } catch (e) {}
    setCharge(true);
  }

  async function commander(nature: string, nombre: number) {
    setOccupe(nature + nombre);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nature: nature, nombre: nombre }),
      });
      const d = await r.json();
      if (d && d.ok) {
        setMessage(d.message || "Votre commande est enregistrée.");
        await charger();
      } else {
        setErreur((d && d.erreur) || "Commande impossible.");
      }
    } catch (e: any) {
      setErreur("Commande impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "22px 26px", marginBottom: "16px",
  };

  // Une rangee de lots, pour l une ou l autre nature.
  function rangee(nature: string, liste: any[], unite: string) {
    if (!liste || liste.length === 0) return null;
    return (
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {liste.map(function (l: any) {
          const enCours = occupe === nature + l.nombre;
          return (
            <div key={l.nombre} style={{
              flex: "1 1 180px", padding: "16px 18px", borderRadius: "10px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(200,169,110,0.2)",
            }}>
              <p style={{ color: "#fff", fontSize: "20px", fontWeight: "bold",
                margin: "0 0 3px" }}>
                {l.nombre} {unite}
              </p>
              {/* 🚨 LE PRIX A L UNITE EST CE QUI REND LA REMISE LISIBLE.
                  « 240 € » ne dit rien ; « 0,08 € la minute » se compare. */}
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px",
                margin: "0 0 12px" }}>
                {euros(l.prix)} · {centimes(l.unitaire)} l&apos;unité
              </p>
              <button
                onClick={() => commander(nature, l.nombre)}
                disabled={occupe !== ""}
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px",
                  border: "1px solid rgba(200,169,110,0.45)",
                  background: "transparent", color: OR,
                  fontSize: "14px", fontFamily: "Georgia,serif",
                  cursor: occupe !== "" ? "default" : "pointer",
                  opacity: occupe !== "" ? 0.5 : 1,
                }}>
                {enCours ? "…" : "Commander"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à mes contacts
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CRÉDITS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Vos SMS et vos minutes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Les SMS et les appels se paient à l&apos;usage, par crédits. Vous
          commandez ici, vous recevez une facture, et vos crédits sont ajoutés
          dès réception de votre règlement.
        </p>

        {/* ---- LE SOLDE ---- */}
        {charge && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: smsCredits > 0 ? "#4caf50" : "#e8836a",
                fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {smsCredits}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                SMS restants
              </p>
              {/* ⚠️ SANS EXPEDITEUR, AUCUN SMS NE PART. On le dit ici, la
                  ou l on regarde son solde — pas au moment de l envoi, ou
                  il serait trop tard. */}
              {!expediteur && (
                <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                  Votre nom d&apos;expéditeur n&apos;est pas encore réglé.
                  Écrivez-nous pour le faire poser.
                </p>
              )}
            </div>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: minCredits > 0 ? "#4caf50" : "#e8836a",
                fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {minCredits}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                minutes restantes
              </p>
              {!numero && (
                <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                  Votre numéro d&apos;appel n&apos;est pas encore réglé.
                  Écrivez-nous pour le faire poser.
                </p>
              )}
            </div>
          </div>
        )}

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {message}
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {erreur}
            </p>
          </div>
        )}

        {/* ---- LES LOTS ---- */}
        {charge && lots.sms && lots.sms.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Des SMS
            </h2>
            {rangee("sms", lots.sms, "SMS")}
          </div>
        )}

        {charge && lots.minutes && lots.minutes.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Des minutes d&apos;appel
            </h2>
            {rangee("minutes", lots.minutes, "minutes")}
          </div>
        )}

        {/* ---- LES COMMANDES ---- */}
        {charge && commandes.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Vos commandes
            </h2>
            {commandes.map(function (c: any) {
              const attente = c.statut === "commandee" || c.statut === "facturee";
              return (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between",
                  gap: "12px", flexWrap: "wrap", padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px" }}>
                    {c.quantite} {c.nature === "sms" ? "SMS" : "minutes"}
                    <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "10px" }}>
                      {c.commande_le
                        ? new Date(c.commande_le).toLocaleDateString("fr-FR")
                        : ""}
                    </span>
                  </span>
                  <span style={{
                    fontSize: "13px",
                    color: c.statut === "creditee" ? "#4caf50"
                      : c.statut === "annulee" ? "rgba(255,255,255,0.35)"
                      : "#e8a33d",
                  }}>
                    {c.statut === "creditee" ? "crédités"
                      : c.statut === "facturee" ? "facturé, en attente du règlement"
                      : c.statut === "annulee" ? "annulée"
                      : "en attente de facture"}
                    {attente ? "" : ""}
                    <span style={{ color: OR, marginLeft: "12px" }}>
                      {euros(c.prix)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.8", marginTop: "20px" }}>
          Prix hors taxes. Les crédits sont valables un an à compter de leur
          ajout. SMS et appels partent vers l&apos;Europe et la Suisse.
        </p>
      </div>
    </div>
  );
}
