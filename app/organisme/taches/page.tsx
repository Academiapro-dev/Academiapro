"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// MES TACHES — 14/09.
//
// CE QU ON OUVRE LE MATIN : ce qui est en retard, puis ce qui est du
// aujourd hui, puis la suite. Dans cet ordre et pas un autre.
//
// 🚨 UNE TACHE SE COCHE D UN SEUL GESTE, la ou elle est. Pas d ecran de
// detail a ouvrir pour dire « c est fait » : si terminer coute trois clics,
// personne ne termine, et la liste ment des la deuxieme semaine.
//
// ⚠️ « EN RETARD » VIENT DU SERVEUR, qui calcule sur le jour a Paris.
// L ecran ne recalcule pas de dates : le navigateur d un client en voyage
// donnerait un autre jour que le sien.
//
// ⚠️ AJOUT EN HAUT, TOUJOURS VISIBLE. Une tache se note en dix secondes,
// entre deux appels — un formulaire replie qu il faut deplier d abord
// suffirait a ce qu on ne la note pas.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" };
const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "6px 13px", borderRadius: "20px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };

const PRIO: any = { basse: "Basse", normale: "Normale", haute: "Haute" };

function jolie(d: any) {
  if (!d) return "sans date";
  try { return new Date(String(d) + "T12:00:00Z").toLocaleDateString("fr-FR"); } catch (e) { return String(d); }
}

export default function PageTaches() {
  const [taches, setTaches] = useState<any[]>([]);
  const [enRetard, setEnRetard] = useState(0);
  const [dujour, setDujour] = useState(0);
  const [faites, setFaites] = useState(false);

  const [titre, setTitre] = useState("");
  const [echeance, setEcheance] = useState("");
  const [priorite, setPriorite] = useState("normale");

  const [ficheId, setFicheId] = useState("");
  const [nomFiche, setNomFiche] = useState("");

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    setFicheId(p.get("fiche") || "");
    setNomFiche(p.get("nom") || "");

    // Proposition : aujourd hui. La plupart des taches notees sont pour le
    // jour meme ou le lendemain ; une date vide oblige a y penser.
    const d = new Date();
    setEcheance(
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0")
    );
    charger(false);
  }, []);

  async function charger(avecFaites: boolean) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/taches" + (avecFaites ? "?faites=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setTaches(d.taches || []);
        setEnRetard(d.en_retard || 0);
        setDujour(d.aujourdhui || 0);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function agir(corps: any, occupation: string) {
    setOccupe(occupation); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/taches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); await charger(faites); }
      else setErreur(d.erreur || "Action impossible.");
    } catch (e: any) { setErreur("Action impossible : " + String(e)); }
    setOccupe("");
  }

  async function ajouter() {
    if (!titre.trim()) { setErreur("Écrivez ce qu'il y a à faire."); return; }
    await agir({
      action: "creer", titre: titre.trim(),
      echeance: echeance || undefined, priorite: priorite,
      fiche_id: ficheId || undefined,
    }, "creer");
    setTitre("");
  }

  const retards = taches.filter(function (t: any) { return t.en_retard; });
  const aujourdhui = taches.filter(function (t: any) { return t.aujourdhui; });
  const suite = taches.filter(function (t: any) { return !t.en_retard && !t.aujourdhui && !t.fait_le; });
  const terminees = taches.filter(function (t: any) { return t.fait_le; });

  function ligne(t: any) {
    return (
      <div
        key={t.id}
        style={{
          display: "flex", gap: "12px", alignItems: "flex-start",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid " + (t.en_retard ? "rgba(232,131,106,0.4)" : "rgba(255,255,255,0.09)"),
          borderRadius: "10px", padding: "12px 14px", marginBottom: "8px",
        }}
      >
        {/* Cocher, d un seul geste, la ou la tache est. */}
        <button
          onClick={() => agir({ action: t.fait_le ? "rouvrir" : "terminer", id: t.id }, "t-" + t.id)}
          disabled={occupe !== ""}
          title={t.fait_le ? "Remettre à faire" : "C'est fait"}
          style={{
            width: "26px", height: "26px", flexShrink: 0, marginTop: "2px",
            borderRadius: "6px", cursor: "pointer",
            border: "1px solid " + (t.fait_le ? VERT : "rgba(200,169,110,0.5)"),
            background: t.fait_le ? "rgba(76,175,80,0.2)" : "none",
            color: VERT, fontSize: "15px", lineHeight: "1",
          }}
        >
          {t.fait_le ? "✓" : ""}
        </button>

        <div style={{ flex: "1 1 auto" }}>
          <p style={{
            color: t.fait_le ? "rgba(255,255,255,0.45)" : "#fff",
            fontSize: "15px", margin: "0 0 3px",
            textDecoration: t.fait_le ? "line-through" : "none",
          }}>
            {t.titre}
          </p>
          <p style={{ color: t.en_retard ? ROUGE : "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: 0 }}>
            {jolie(t.echeance)}
            {t.en_retard ? " — en retard" : ""}
            {t.priorite === "haute" ? " · priorité haute" : ""}
            {t.contact ? " · " + t.contact : ""}
          </p>
        </div>

        {!t.fait_le && (
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", flexShrink: 0 }}>
            <button onClick={() => agir({ action: "reporter", id: t.id, jours: 1 }, "r-" + t.id)} disabled={occupe !== ""} style={SECOND}>
              Demain
            </button>
            <button onClick={() => agir({ action: "reporter", id: t.id, jours: 7 }, "s-" + t.id)} disabled={occupe !== ""} style={SECOND}>
              +7 j
            </button>
            <button
              onClick={() => { if (confirm("Supprimer « " + t.titre + " » ?")) agir({ action: "supprimer", id: t.id }, "x-" + t.id); }}
              disabled={occupe !== ""}
              style={{ ...SECOND, borderColor: "rgba(232,131,106,0.45)", color: ROUGE }}
            >
              Retirer
            </button>
          </div>
        )}
      </div>
    );
  }

  function bloc(titreBloc: string, couleur: string, liste: any[]) {
    if (liste.length === 0) return null;
    return (
      <>
        <h2 style={{ color: couleur, fontSize: "17px", margin: "24px 0 12px" }}>
          {titreBloc} <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>· {liste.length}</span>
        </h2>
        {liste.map(ligne)}
      </>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>À FAIRE</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes tâches</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Ce qui est en retard d&apos;abord, ce qui est dû aujourd&apos;hui ensuite. Une tâche
          se coche là où elle est.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {/* ---- AJOUTER ---- */}
        <div style={{ ...CARTE, marginTop: "18px" }}>
          {nomFiche && (
            <p style={{ color: OR, fontSize: "13.5px", margin: "0 0 10px" }}>
              Cette tâche sera rattachée à {nomFiche}.
            </p>
          )}
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ajouter(); }}
            placeholder="Qu'y a-t-il à faire ?"
            style={CHAMP}
          />
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "0 1 180px" }}>
              <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>Pour quand</span>
              <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }} />
            </div>
            <div style={{ flex: "0 1 160px" }}>
              <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>Priorité</span>
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
              </select>
            </div>
            <button onClick={ajouter} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "creer" ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </div>

        {/* ---- LES COMPTEURS ---- */}
        {!chargement && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "18px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0, borderColor: enRetard > 0 ? "rgba(232,131,106,0.5)" : CARTE.border }}>
              <p style={{ color: enRetard > 0 ? ROUGE : "rgba(255,255,255,0.5)", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{enRetard}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>en retard</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{dujour}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>pour aujourd&apos;hui</p>
            </div>
          </div>
        )}

        <button
          onClick={() => { const v = !faites; setFaites(v); charger(v); }}
          style={SECOND}
        >
          {faites ? "Masquer les tâches faites" : "Voir aussi les tâches faites"}
        </button>

        {/* ---- LES LISTES ---- */}
        {chargement ? (
          <div style={{ ...CARTE, marginTop: "18px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : taches.length === 0 ? (
          <div style={{ ...CARTE, marginTop: "18px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucune tâche. Notez la première ci-dessus — ou ouvrez une fiche dans{" "}
              <a href="/organisme/crm" style={{ color: OR }}>Mon CRM</a> et cliquez sur « Noter une tâche ».
            </p>
          </div>
        ) : (
          <>
            {bloc("En retard", ROUGE, retards)}
            {bloc("Aujourd'hui", OR, aujourdhui)}
            {bloc("À venir", "rgba(255,255,255,0.75)", suite)}
            {faites && bloc("Faites", VERT, terminees)}
          </>
        )}
      </div>
    </div>
  );
}
