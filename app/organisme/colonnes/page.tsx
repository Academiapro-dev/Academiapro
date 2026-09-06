"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// MES COLONNES — L ECRAN DE REGLAGE DES CHAMPS PERSONNALISES, 06/09.
//
// POURQUOI IL EXISTE. Mr CRM sert des metiers qu il ne connait pas. Jacques,
// le 06/09 : « le cabinet comptable doit pouvoir rajouter les gens qui lui
// correspondent en fonction de son organisation personnelle ». Sans cet
// ecran, il faudrait intervenir a chaque demande d un client.
//
// 🚨 CE N EST PAS LE MODELE DE MR COMPTABLE. La-bas, « Pieces manquantes »
// et « Banque a justifier » sont CALCULES depuis la comptabilite : le
// logiciel connait le metier. Ici, rien n est calcule — le client saisit.
//
// ⚠️ TROIS TYPES SEULEMENT, et c est deliberе :
//   CASE   — « A jour de ses pieces », « Disponible »
//   DATE   — « Dernier bilan remis », « Fin de mission »
//   TEXTE  — « Regime fiscal », « Qualification »
// Chaque type ajoute se paie sur trois ecrans : la saisie, le filtre et le
// tableau. Trois suffisent a presque tout.
//
// ⚠️ CET ECRAN VIT SOUS /organisme, un chemin a session simple : tout
// utilisateur connecte y entre, et ne voit que les colonnes de SON
// organisme. Ne jamais le placer sous /admin, reserve a l editeur.
// ══════════════════════════════════════════════════════════════════════════

// LES EXEMPLES PAR METIER. Ils ne s ecrivent pas en base : ils se touchent
// pour remplir le formulaire, et le client corrige ensuite. Un ecran vide
// devant quelqu un qui ne sait pas quoi y mettre reste vide.
const EXEMPLES = [
  { metier: "Cabinet comptable", champs: [
    { libelle: "À jour de ses pièces", type: "case" },
    { libelle: "Dernier bilan remis", type: "date" },
    { libelle: "Régime fiscal", type: "texte" },
    { libelle: "Collaborateur en charge", type: "texte" },
  ] },
  { metier: "Organisme de formation", champs: [
    { libelle: "Dossier de financement déposé", type: "case" },
    { libelle: "Date d'entrée en formation", type: "date" },
    { libelle: "Financeur", type: "texte" },
  ] },
  { metier: "Agence d'intérim", champs: [
    { libelle: "Disponible", type: "case" },
    { libelle: "Fin de mission", type: "date" },
    { libelle: "Qualification", type: "texte" },
  ] },
  { metier: "Suivi de sociétés américaines", champs: [
    { libelle: "Rapport annuel déposé", type: "case" },
    { libelle: "Prochaine échéance", type: "date" },
    { libelle: "État de constitution", type: "texte" },
  ] },
];

const TYPES = [
  { cle: "case", nom: "Case à cocher", exemple: "oui ou non" },
  { cle: "date", nom: "Date", exemple: "une échéance, un dernier envoi" },
  { cle: "texte", nom: "Texte court", exemple: "un nom, une référence" },
];

export default function PageColonnes() {
  const [champs, setChamps] = useState<any[]>([]);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [libelle, setLibelle] = useState("");
  const [type, setType] = useState("");
  const [renomme, setRenomme] = useState("");
  const [nouveauNom, setNouveauNom] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/organisme/champs", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) setChamps(Array.isArray(d.champs) ? d.champs : []);
      else if (d && d.erreur) setErreur(d.erreur);
    } catch (e) {}
    setCharge(true);
  }

  async function appeler(corps: any) {
    setOccupe(true);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/organisme/champs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const d = await r.json();
      if (!d || !d.ok) {
        setErreur((d && d.erreur) || "Opération impossible.");
        setOccupe(false);
        return false;
      }
      await charger();
      setOccupe(false);
      return true;
    } catch (e: any) {
      setErreur("Opération impossible : " + String(e));
      setOccupe(false);
      return false;
    }
  }

  async function creer() {
    if (libelle.trim().length < 2) {
      setErreur("Donnez un nom à cette colonne.");
      return;
    }
    if (!type) {
      setErreur("Choisissez le type de colonne.");
      return;
    }
    const ok = await appeler({ action: "creer", libelle: libelle.trim(), type: type });
    if (ok) {
      setLibelle("");
      setType("");
      setMessage("Colonne ajoutée. Elle apparaît maintenant sur chaque fiche.");
    }
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
  const BOUTON: any = {
    padding: "10px 20px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.45)",
    background: "transparent", color: OR,
    fontSize: "14px", fontFamily: "Georgia,serif", cursor: "pointer",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à mes contacts
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          RÉGLAGES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Mes colonnes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Ajoutez les informations que vous suivez sur chaque contact. Elles
          apparaissent sur la fiche, dans le tableau, et servent à filtrer.
          Dix colonnes au maximum.
        </p>

        {/* ---- CE QUI EXISTE DEJA ---- */}
        {charge && champs.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Vos colonnes ({champs.length})
            </h2>
            {champs.map(function (c: any) {
              const t = TYPES.filter(function (x) { return x.cle === c.type; })[0];
              return (
                <div key={c.id} style={{ padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {renomme === c.id ? (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        value={nouveauNom}
                        onChange={(e) => setNouveauNom(e.target.value)}
                        style={{ ...CHAMP, flex: "1 1 220px", marginBottom: 0, padding: "9px 12px" }}
                      />
                      <button
                        onClick={async () => {
                          const ok = await appeler({ action: "renommer", id: c.id, libelle: nouveauNom });
                          if (ok) { setRenomme(""); setMessage("Colonne renommée."); }
                        }}
                        disabled={occupe}
                        style={{ ...BOUTON, padding: "9px 16px", fontSize: "13px" }}>
                        Enregistrer
                      </button>
                      <button onClick={() => setRenomme("")}
                        style={{ ...BOUTON, padding: "9px 16px", fontSize: "13px",
                          borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                      alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#fff", fontSize: "15px" }}>
                        {c.libelle}
                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", marginLeft: "9px" }}>
                          {t ? t.nom.toLowerCase() : c.type}
                        </span>
                      </span>
                      <span style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => { setRenomme(c.id); setNouveauNom(c.libelle); }}
                          style={{ background: "none", border: "none", color: OR,
                            fontSize: "13px", fontFamily: "Georgia,serif",
                            cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                          Renommer
                        </button>
                        {/* ⚠️ SUPPRIMER NE DETRUIT RIEN. La colonne
                            disparait des ecrans, mais les valeurs deja
                            saisies restent en base : une suppression par
                            erreur ne coute donc aucune donnee. */}
                        <button
                          onClick={async () => {
                            const ok = await appeler({ action: "supprimer", id: c.id });
                            if (ok) setMessage("Colonne retirée. Les valeurs déjà saisies sont conservées.");
                          }}
                          disabled={occupe}
                          style={{ background: "none", border: "none",
                            color: "rgba(232,131,106,0.8)", fontSize: "13px",
                            fontFamily: "Georgia,serif", cursor: "pointer",
                            textDecoration: "underline", padding: 0 }}>
                          Retirer
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---- AJOUTER ---- */}
        {champs.length < 10 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Ajouter une colonne
            </h2>

            <span style={LIBELLE}>Son nom</span>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="À jour de ses pièces"
              style={CHAMP}
            />

            <span style={LIBELLE}>Ce qu&apos;elle contient</span>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "16px" }}>
              {TYPES.map(function (t) {
                const actif = type === t.cle;
                return (
                  <button key={t.cle} onClick={() => setType(t.cle)}
                    style={{
                      flex: "1 1 170px", padding: "12px", borderRadius: "9px",
                      fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: "pointer",
                      fontWeight: actif ? "bold" : "normal",
                      background: actif ? OR : "rgba(255,255,255,0.05)",
                      color: actif ? FOND : OR,
                      border: actif ? "none" : "1px solid rgba(200,169,110,0.4)",
                    }}>
                    {t.nom}
                    <span style={{ display: "block", fontSize: "11.5px", opacity: 0.75,
                      fontWeight: "normal", marginTop: "3px" }}>
                      {t.exemple}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={creer}
              disabled={occupe || libelle.trim().length < 2 || !type}
              style={{
                width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                background: occupe || libelle.trim().length < 2 || !type
                  ? "rgba(200,169,110,0.3)" : OR,
                color: occupe || libelle.trim().length < 2 || !type ? "#8a8a8a" : FOND,
                fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif",
                cursor: occupe ? "default" : "pointer",
              }}>
              {occupe ? "…" : "Ajouter cette colonne"}
            </button>
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

        {/* ---- LES EXEMPLES ----
            Ils ne s ecrivent pas en base : ils REMPLISSENT le formulaire.
            Un ecran vide devant quelqu un qui ne sait pas quoi y mettre
            reste vide — et la fonction ne sert jamais. */}
        {charge && champs.length === 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 6px" }}>
              Des idées, selon votre métier
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
              margin: "0 0 16px", lineHeight: "1.7" }}>
              Touchez une proposition pour la reprendre — vous pourrez la
              modifier avant de l&apos;ajouter.
            </p>
            {EXEMPLES.map(function (g) {
              return (
                <div key={g.metier} style={{ marginBottom: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px",
                    margin: "0 0 8px" }}>
                    {g.metier}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {g.champs.map(function (x) {
                      return (
                        <button key={x.libelle}
                          onClick={() => { setLibelle(x.libelle); setType(x.type); setErreur(""); }}
                          style={{ padding: "7px 13px", borderRadius: "20px",
                            fontSize: "12.5px", fontFamily: "Georgia,serif",
                            cursor: "pointer", background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.14)" }}>
                          {x.libelle}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
