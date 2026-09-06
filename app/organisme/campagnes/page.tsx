"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// MES CAMPAGNES — 06/09.
//
// MEME ECRAN QUE « MES COLONNES », AUTRE OBJET. Les colonnes portent des
// informations sur un contact ; les campagnes decident du MESSAGE qu il
// recevra.
//
// 🚨 LE MESSAGE S ECRIT UNE FOIS, SUR LA CAMPAGNE. Jamais fiche par fiche :
// c est ce qui permet d ecrire a trente contacts sans rien retaper. Le
// prenom s insere a l envoi.
//
// ⚠️ UNE CAMPAGNE SANS MESSAGE RESTE UTILE : elle classe les fiches. Le
// texte peut venir apres.
// ══════════════════════════════════════════════════════════════════════════

const EXEMPLES = [
  { metier: "Cabinet comptable", noms: ["Bilan annuel", "TVA", "Paie", "Pièces manquantes"] },
  { metier: "Organisme de formation", noms: ["Catalogue", "Financement", "Session à venir"] },
  { metier: "Agence d'intérim", noms: ["Recrutement", "Mission disponible", "Fin de contrat"] },
  { metier: "Suivi de sociétés américaines", noms: ["Rapport annuel", "Échéance fiscale"] },
];

export default function PageCampagnes() {
  const [campagnes, setCampagnes] = useState<any[]>([]);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [libelle, setLibelle] = useState("");
  const [texte, setTexte] = useState("");
  const [ouverte, setOuverte] = useState("");
  const [editLibelle, setEditLibelle] = useState("");
  const [editTexte, setEditTexte] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/organisme/campagnes", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) setCampagnes(Array.isArray(d.campagnes) ? d.campagnes : []);
      else if (d && d.erreur) setErreur(d.erreur);
    } catch (e) {}
    setCharge(true);
  }

  async function appeler(corps: any) {
    setOccupe(true);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/organisme/campagnes", {
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
      setErreur("Donnez un nom à cette campagne.");
      return;
    }
    const ok = await appeler({
      action: "creer",
      libelle: libelle.trim(),
      message: texte.trim(),
    });
    if (ok) {
      setLibelle("");
      setTexte("");
      setMessage("Campagne ajoutée.");
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
          Mes campagnes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Une campagne décide du message qu&apos;un contact recevra. Écrivez-le
          une fois : il servira pour tous les contacts de cette campagne.
          Dix campagnes au maximum.
        </p>

        {/* ---- CE QUI EXISTE ---- */}
        {charge && campagnes.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Vos campagnes ({campagnes.length})
            </h2>
            {campagnes.map(function (c: any) {
              const ouvert = ouverte === c.id;
              return (
                <div key={c.id} style={{ padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                    alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      padding: "3px 12px", borderRadius: "20px", fontSize: "13px",
                      background: c.couleur + "26", color: c.couleur,
                      border: "1px solid " + c.couleur + "8c",
                    }}>
                      {c.libelle}
                    </span>
                    <span style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => {
                          setOuverte(ouvert ? "" : c.id);
                          setEditLibelle(c.libelle);
                          setEditTexte(c.message || "");
                        }}
                        style={{ background: "none", border: "none", color: OR,
                          fontSize: "13px", fontFamily: "Georgia,serif",
                          cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        {ouvert ? "Fermer" : "Modifier"}
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await appeler({ action: "supprimer", id: c.id });
                          if (ok) setMessage("Campagne retirée. Les fiches gardent leur classement.");
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

                  {!ouvert && (
                    <p style={{ color: c.message ? "rgba(255,255,255,0.4)" : "#e8a33d",
                      fontSize: "12.5px", margin: "7px 0 0", lineHeight: "1.6" }}>
                      {c.message
                        ? String(c.message).slice(0, 120) + (String(c.message).length > 120 ? "…" : "")
                        : "Aucun message écrit — cette campagne classe les fiches mais n'envoie rien."}
                    </p>
                  )}

                  {ouvert && (
                    <div style={{ marginTop: "12px" }}>
                      <span style={LIBELLE}>Son nom</span>
                      <input
                        value={editLibelle}
                        onChange={(e) => setEditLibelle(e.target.value)}
                        style={{ ...CHAMP, padding: "10px 13px" }}
                      />
                      <span style={LIBELLE}>Le message envoyé</span>
                      <textarea
                        value={editTexte}
                        onChange={(e) => setEditTexte(e.target.value)}
                        rows={5}
                        placeholder="Bonjour {prenom}, …"
                        style={{ ...CHAMP, lineHeight: "1.6" }}
                      />
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px",
                        margin: "-6px 0 12px", lineHeight: "1.6" }}>
                        Écrivez {"{prenom}"} là où le prénom du contact doit apparaître.
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={async () => {
                            const ok = await appeler({
                              action: "modifier", id: c.id,
                              libelle: editLibelle, message: editTexte,
                            });
                            if (ok) { setOuverte(""); setMessage("Campagne modifiée."); }
                          }}
                          disabled={occupe}
                          style={{ ...BOUTON, background: OR, color: FOND,
                            border: "none", fontWeight: "bold" }}>
                          Enregistrer
                        </button>
                        <button onClick={() => setOuverte("")} style={BOUTON}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---- AJOUTER ---- */}
        {campagnes.length < 10 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Ajouter une campagne
            </h2>

            <span style={LIBELLE}>Son nom</span>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Bilan annuel"
              style={CHAMP}
            />

            <span style={LIBELLE}>Le message envoyé (facultatif)</span>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={4}
              placeholder="Bonjour {prenom}, …"
              style={{ ...CHAMP, lineHeight: "1.6" }}
            />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px",
              margin: "-6px 0 16px", lineHeight: "1.6" }}>
              Écrivez {"{prenom}"} là où le prénom du contact doit apparaître.
              Vous pourrez l&apos;écrire plus tard.
            </p>

            <button
              onClick={creer}
              disabled={occupe || libelle.trim().length < 2}
              style={{
                width: "100%", padding: "14px", borderRadius: "8px", border: "none",
                background: occupe || libelle.trim().length < 2
                  ? "rgba(200,169,110,0.3)" : OR,
                color: occupe || libelle.trim().length < 2 ? "#8a8a8a" : FOND,
                fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif",
                cursor: occupe ? "default" : "pointer",
              }}>
              {occupe ? "…" : "Ajouter cette campagne"}
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

        {charge && campagnes.length === 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 6px" }}>
              Des idées, selon votre métier
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
              margin: "0 0 16px", lineHeight: "1.7" }}>
              Touchez une proposition pour la reprendre.
            </p>
            {EXEMPLES.map(function (g) {
              return (
                <div key={g.metier} style={{ marginBottom: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px",
                    margin: "0 0 8px" }}>
                    {g.metier}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {g.noms.map(function (n) {
                      return (
                        <button key={n}
                          onClick={() => { setLibelle(n); setErreur(""); }}
                          style={{ padding: "7px 13px", borderRadius: "20px",
                            fontSize: "12.5px", fontFamily: "Georgia,serif",
                            cursor: "pointer", background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.14)" }}>
                          {n}
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
