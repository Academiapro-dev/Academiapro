"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// LES COMMANDES DE CREDITS — L ECRAN DE JACQUES — 06/09.
//
// 🚨 C EST LA FILE DE TRAVAIL, PAS UN HISTORIQUE. Ce qui attend une action
// se voit en haut ; ce qui est fait descend et s efface visuellement.
//
// TROIS GESTES : facturer, crediter, annuler.
//   FACTURER  — « la facture est partie ». Le client voit son etat changer.
//   CREDITER  — « le virement est arrive ». C EST LE SEUL GESTE QUI AJOUTE
//               REELLEMENT DES CREDITS, et il previent le client.
//   ANNULER   — « le client a renonce ». Impossible apres credit.
//
// ⚠️ CET ECRAN VIT SOUS /admin : le middleware le reserve a
// contact@academiapro.fr. Un client qui taperait l adresse verrait « page
// introuvable ».
// ══════════════════════════════════════════════════════════════════════════

function euros(n: any) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
}

export default function PageCreditsAdmin() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState<any>({});

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/admin/credits", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) setCommandes(Array.isArray(d.commandes) ? d.commandes : []);
      else if (d && d.erreur) setErreur(d.erreur);
    } catch (e) {}
    setCharge(true);
  }

  async function agir(id: string, action: string) {
    // 🚨 CONFIRMATION SUR LE CREDIT. C est le seul geste qui donne quelque
    // chose, et il ne se defait pas : on ne reprend pas des minutes qu un
    // client a peut-etre deja consommees.
    if (action === "crediter"
      && !window.confirm("Le virement est bien arrivé ? Les crédits seront ajoutés et le client prévenu.")) {
      return;
    }
    if (action === "annuler"
      && !window.confirm("Annuler cette commande ?")) {
      return;
    }

    setOccupe(id + action);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          action: action,
          reference: reference[id] || "",
        }),
      });
      const d = await r.json();
      if (d && d.ok) {
        setMessage(action === "crediter" ? "Crédits ajoutés, client prévenu."
          : action === "facturer" ? "Marquée facturée."
          : "Commande annulée.");
        await charger();
      } else {
        setErreur((d && d.erreur) || "Opération impossible.");
      }
    } catch (e: any) {
      setErreur("Opération impossible : " + String(e));
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
    borderRadius: "12px", padding: "18px 22px", marginBottom: "12px",
  };
  const BOUTON: any = {
    padding: "8px 16px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.45)",
    background: "transparent", color: OR,
    fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: "pointer",
  };
  const CHAMP: any = {
    padding: "8px 12px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: "13.5px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", width: "160px",
  };

  const enAttente = commandes.filter(function (c: any) {
    return c.statut === "commandee" || c.statut === "facturee";
  });
  const traitees = commandes.filter(function (c: any) {
    return c.statut === "creditee" || c.statut === "annulee";
  });

  function ligne(c: any, actif: boolean) {
    const quoi = c.quantite + (c.nature === "sms" ? " SMS" : " minutes");
    return (
      <div key={c.id} style={{ ...CARTE, opacity: actif ? 1 : 0.5,
        borderColor: c.statut === "commandee" ? "rgba(232,163,61,0.5)"
          : c.statut === "facturee" ? "rgba(200,169,110,0.45)"
          : "rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
          <span style={{ color: "#fff", fontSize: "16px" }}>
            {c.organisme}
            <span style={{ color: OR, marginLeft: "12px" }}>{quoi}</span>
            <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "12px", fontSize: "14px" }}>
              {euros(c.prix)}
            </span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px" }}>
            {c.commande_le ? new Date(c.commande_le).toLocaleDateString("fr-FR") : ""}
          </span>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
          margin: "5px 0 0", lineHeight: "1.6" }}>
          {c.email_contact || "sans adresse de contact"}
          {" · "}solde actuel : {c.sms_credits} SMS, {c.minutes_credits} min
          {/* ⚠️ ON SIGNALE CE QUI MANQUE POUR QUE LE CREDIT SERVE. Crediter
              des minutes a un organisme sans numero d appel donne un solde
              qu il ne pourra pas depenser. */}
          {c.nature === "sms" && !c.sms_expediteur && (
            <span style={{ color: "#e8a33d" }}> · aucun expéditeur SMS réglé</span>
          )}
          {c.nature === "minutes" && !c.tel_numero && (
            <span style={{ color: "#e8a33d" }}> · aucun numéro d&apos;appel réglé</span>
          )}
        </p>

        {actif && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap",
            alignItems: "center", marginTop: "12px" }}>
            <input
              value={reference[c.id] || ""}
              onChange={(e) => setReference({ ...reference, [c.id]: e.target.value })}
              placeholder="N° de facture"
              style={CHAMP}
            />
            {c.statut === "commandee" && (
              <button onClick={() => agir(c.id, "facturer")}
                disabled={occupe !== ""} style={BOUTON}>
                {occupe === c.id + "facturer" ? "…" : "Facturée"}
              </button>
            )}
            <button onClick={() => agir(c.id, "crediter")}
              disabled={occupe !== ""}
              style={{ ...BOUTON, background: OR, color: FOND,
                border: "none", fontWeight: "bold" }}>
              {occupe === c.id + "crediter" ? "…" : "Virement reçu, créditer"}
            </button>
            <button onClick={() => agir(c.id, "annuler")}
              disabled={occupe !== ""}
              style={{ ...BOUTON, color: "rgba(232,131,106,0.8)",
                borderColor: "rgba(232,131,106,0.35)" }}>
              Annuler
            </button>
          </div>
        )}

        {!actif && (
          <p style={{ color: c.statut === "creditee" ? "#4caf50" : "rgba(255,255,255,0.35)",
            fontSize: "13px", margin: "7px 0 0" }}>
            {c.statut === "creditee"
              ? "Créditée le " + (c.creditee_le
                  ? new Date(c.creditee_le).toLocaleDateString("fr-FR") : "—")
              : "Annulée"}
            {c.reference ? " · " + c.reference : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à l&apos;administration
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FACTURATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Commandes de crédits
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Les clients commandent, vous facturez, et vous créditez à réception
          du virement. Le crédit ne s&apos;ajoute que par le bouton ci-dessous.
        </p>

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "14.5px", margin: 0 }}>{message}</p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {erreur}
            </p>
          </div>
        )}

        {charge && enAttente.length === 0 && (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px", margin: 0 }}>
              Aucune commande en attente.
            </p>
          </div>
        )}

        {enAttente.length > 0 && (
          <>
            <h2 style={{ color: OR, fontSize: "16px", margin: "24px 0 12px" }}>
              À traiter ({enAttente.length})
            </h2>
            {enAttente.map(function (c: any) { return ligne(c, true); })}
          </>
        )}

        {traitees.length > 0 && (
          <>
            <h2 style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px",
              margin: "32px 0 12px" }}>
              Traitées
            </h2>
            {traitees.map(function (c: any) { return ligne(c, false); })}
          </>
        )}
      </div>
    </div>
  );
}
