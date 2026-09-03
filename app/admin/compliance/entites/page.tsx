"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// LE PORTEFEUILLE D ENTITES — 31/08.
//
// C est l ecran d entree d un gestionnaire qui suit les obligations de
// plusieurs societes. Il remplace « Ma societe », qui supposait qu on n en
// avait qu une et affichait « pour modifier, contactez le support ».
//
// 🚨 CE QUE CET ECRAN DOIT MONTRER EN PREMIER, ET POURQUOI. Un gestionnaire
// n ouvre pas son logiciel pour admirer sa liste : il l ouvre pour savoir
// CE QUI ARRIVE. La colonne « prochaine echeance » est donc la seule qui
// compte vraiment, et le tri par defaut la met en avant.
//
// ⚠️ AUCUN PLAFOND N EST SUPPOSE. La pagination vient de la route, qui
// compte en base. Trois cents ou dix mille dossiers s affichent pareil.
//
// ⚠️ LA RECHERCHE EST INDISPENSABLE AU-DELA DE CINQUANTE DOSSIERS : faire
// defiler n est plus une methode, on cherche par nom.
// ---------------------------------------------------------------------------

const VERT = "#0a3d2e";

const STYLE_CHAMP: any = {
  width: "100%",
  padding: 10,
  fontSize: 15,
  marginTop: 4,
  marginBottom: 16,
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#ffffff",
  color: "#1a1a1a",
};

const STYLE_LIBELLE: any = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
};

// ══════════════════════════════════════════════════════════════════════════
// LES ETATS DE CONSTITUTION — REVU LE 04/09.
//
// 🚨 LE ROYAUME-UNI A ETE RETIRE. Une Ltd britannique N EST PAS UNE LLC :
// elle n a ni Form 5472, ni registered agent, ni rapport d Etat americain.
// Le choisir donnait un suivi entierement faux — des obligations
// americaines sur une societe qui n en a aucune. Le produit s appelle
// MysterLLC ; il suit des LLC.
// ⚠️ NE PAS LE REMETTRE. Si le suivi des societes britanniques devient un
// jour un sujet, c est un autre produit, avec ses propres regles.
//
// 🚨 `couvert` DIT SI LES REGLES D ETAT EXISTENT EN BASE.
//
// POURQUOI CE DRAPEAU EXISTE. La Californie et New York sont des Etats
// americains ou une LLC se constitue tout a fait, et leurs obligations
// FEDERALES — Form 5472, 7004, BOI, 1040-NR — sont suivies normalement :
// le federal ne depend pas de l Etat. Mais aucune regle d Etat n est encore
// en base pour eux. Sans avertissement, un gestionnaire creerait sa societe
// et ne verrait JAMAIS d echeance d Etat, SANS QU AUCUNE ERREUR NE LE
// SIGNALE. Il se croirait suivi.
//
// ⚠️ CETTE LISTE DOIT SUIVRE `compliance_rules`. Avant de passer un Etat a
// `couvert: true`, verifier que ses regles existent vraiment :
//   select distinct etat_requis from compliance_rules where actif;
// Sept Etats couverts au 04/09 : WY, DE, NM, NV, FL, TX, MT.
// ══════════════════════════════════════════════════════════════════════════
const ETATS = [
  { code: "WY", libelle: "Wyoming (WY)", couvert: true },
  { code: "DE", libelle: "Delaware (DE)", couvert: true },
  { code: "NM", libelle: "Nouveau-Mexique (NM)", couvert: true },
  { code: "NV", libelle: "Nevada (NV)", couvert: true },
  { code: "FL", libelle: "Floride (FL)", couvert: true },
  { code: "TX", libelle: "Texas (TX)", couvert: true },
  { code: "MT", libelle: "Montana (MT)", couvert: true },
  { code: "CA", libelle: "Californie (CA)", couvert: false },
  { code: "NY", libelle: "New York (NY)", couvert: false },
  { code: "AUTRE", libelle: "Autre État — à préciser en notes", couvert: false },
];

function etatCouvert(code: string): boolean {
  const e = ETATS.find(function (x) { return x.code === code; });
  return e ? e.couvert : false;
}

const RESIDENCES = [
  { code: "", libelle: "— Non renseignée —" },
  { code: "FR", libelle: "France (FR)" },
  { code: "BE", libelle: "Belgique (BE)" },
  { code: "CH", libelle: "Suisse (CH)" },
  { code: "LU", libelle: "Luxembourg (LU)" },
  { code: "CA", libelle: "Canada (CA)" },
  { code: "AE", libelle: "Émirats arabes unis (AE)" },
  { code: "PT", libelle: "Portugal (PT)" },
  { code: "AUTRE", libelle: "Autre" },
];

function joursAvant(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

// Le code couleur porte l information : rouge sous quinze jours, ambre sous
// soixante. Un gestionnaire doit voir ou regarder sans lire chaque ligne.
function couleurEcheance(jours: number | null): string {
  if (jours === null) return "#999";
  if (jours < 0) return "#c62828";
  if (jours <= 15) return "#c62828";
  if (jours <= 60) return "#8a6d2f";
  return "#2e7d32";
}

export default function Entites() {
  const [chargement, setChargement] = useState(true);
  const [entites, setEntites] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const [formulaire, setFormulaire] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [legalName, setLegalName] = useState("");
  const [formationState, setFormationState] = useState("WY");
  const [formationDate, setFormationDate] = useState("");
  const [wyFilingId, setWyFilingId] = useState("");
  const [registeredAgent, setRegisteredAgent] = useState("");
  const [memberResidence, setMemberResidence] = useState("");
  const [frTaxResident, setFrTaxResident] = useState(false);
  const [notes, setNotes] = useState("");

  async function charger(p: number, q: string) {
    setChargement(true);
    setErreur(null);
    try {
      const url = "/api/compliance/entites?echeances=1&page=" + p
        + (q ? "&q=" + encodeURIComponent(q) : "");
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setEntites(d.entites || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setPage(d.page || 1);
      } else {
        setErreur(d.erreur || "Chargement impossible.");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger(1, "");
  }, []);

  async function creer() {
    if (label.trim().length < 2) {
      setMsg("Erreur : indiquez un nom d'usage.");
      return;
    }
    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/entites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          legal_name: legalName.trim() || label.trim(),
          formation_state: formationState,
          formation_date: formationDate || null,
          wy_filing_id: wyFilingId.trim() || null,
          registered_agent_name: registeredAgent.trim() || null,
          member_residence: memberResidence || null,
          fr_tax_resident: frTaxResident,
          notes: notes.trim() || null,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        let m = "Entité créée : " + d.entite.legal_name + ".";
        // L etat des echeances est dit explicitement : une entite sans
        // echeance ne declenchera aucune relance, et c est precisement ce
        // que le client achete.
        if (d.echeances && d.echeances.generees) {
          m += " " + (d.echeances.nombre || 0) + " échéance(s) générée(s).";
        } else {
          m += " ATTENTION : les échéances n'ont pas été générées ("
            + ((d.echeances && d.echeances.raison) || "cause inconnue") + ").";
        }
        setMsg(m);
        setLabel("");
        setLegalName("");
        setFormationDate("");
        setWyFilingId("");
        setRegisteredAgent("");
        setNotes("");
        setFormulaire(false);
        charger(1, recherche);
      } else {
        setMsg("Erreur : " + (d.erreur || "inconnue"));
      }
    } catch (e: any) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  const styleBouton: any = {
    background: VERT,
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15,
    marginRight: 10,
    marginBottom: 10,
  };

  const styleBoutonClair: any = {
    ...styleBouton,
    background: "#ffffff",
    color: VERT,
    border: "1px solid " + VERT,
  };

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        <h1 style={{ color: VERT, borderBottom: "3px solid " + VERT, paddingBottom: 10 }}>
          Portefeuille
        </h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") charger(1, recherche); }}
            placeholder="Rechercher une société…"
            style={{ ...STYLE_CHAMP, marginBottom: 0, maxWidth: 320 }}
          />
          <button onClick={() => charger(1, recherche)} style={{ ...styleBoutonClair, marginBottom: 0 }}>
            Rechercher
          </button>
          {recherche && (
            <button
              onClick={() => { setRecherche(""); charger(1, ""); }}
              style={{ ...styleBoutonClair, marginBottom: 0 }}
            >
              Tout afficher
            </button>
          )}
          <span style={{ marginLeft: "auto", color: "#666", fontSize: 14 }}>
            {total} société{total > 1 ? "s" : ""}
          </span>
          <button onClick={() => setFormulaire(!formulaire)} style={{ ...styleBouton, marginBottom: 0 }}>
            {formulaire ? "Annuler" : "Ajouter une société"}
          </button>
        </div>

        {formulaire && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              background: "#f8f8f4",
            }}
          >
            <h2 style={{ color: VERT, marginTop: 0, fontSize: 18 }}>Nouvelle société</h2>

            <span style={STYLE_LIBELLE}>Nom d&apos;usage (obligatoire)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Dupont Consulting" style={STYLE_CHAMP} />

            <span style={STYLE_LIBELLE}>Dénomination légale exacte</span>
            <input value={legalName} onChange={(e) => setLegalName(e.target.value)}
              placeholder="DUPONT CONSULTING LLC" style={STYLE_CHAMP} />
            <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
              Exactement comme sur les documents officiels, majuscules comprises.
            </p>

            <span style={STYLE_LIBELLE}>État de constitution (obligatoire)</span>
            <select value={formationState} onChange={(e) => setFormationState(e.target.value)}
              style={STYLE_CHAMP}>
              {ETATS.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.libelle}{e.couvert ? "" : " — échéances d'État non couvertes"}
                </option>
              ))}
            </select>

            {/* 🚨 L AVERTISSEMENT S AFFICHE A LA SELECTION, PAS APRES.
                Un gestionnaire qui choisit la Californie doit savoir TOUT DE
                SUITE que seules les obligations federales seront suivies.
                Le decouvrir plus tard, c est le decouvrir en cherchant une
                echeance qui ne viendra jamais. */}
            {formationState && !etatCouvert(formationState) ? (
              <div style={{
                marginTop: -8,
                marginBottom: 16,
                padding: "12px 14px",
                background: "#fdf6e8",
                border: "1px solid #d9b866",
                borderRadius: 6,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "#5a4520",
              }}>
                <strong>Échéances d&apos;État non couvertes pour cet État.</strong> Les
                obligations fédérales — Form 5472, 7004, BOI, 1040-NR — sont
                suivies normalement : elles ne dépendent pas de l&apos;État. En
                revanche, le rapport annuel, la taxe de franchise et l&apos;agent
                enregistré propres à cet État ne sont pas encore en base et
                n&apos;apparaîtront pas dans l&apos;agenda.
              </div>
            ) : (
              <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
                Les échéances déclaratives dépendent de ce choix.
              </p>
            )}

            <span style={STYLE_LIBELLE}>Date de constitution</span>
            <input type="date" value={formationDate}
              onChange={(e) => setFormationDate(e.target.value)} style={STYLE_CHAMP} />
            <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
              Elle détermine le mois anniversaire, donc l&apos;échéance du rapport annuel.
            </p>

            <span style={STYLE_LIBELLE}>Numéro d&apos;immatriculation</span>
            <input value={wyFilingId} onChange={(e) => setWyFilingId(e.target.value)}
              style={STYLE_CHAMP} />

            <span style={STYLE_LIBELLE}>Agent enregistré</span>
            <input value={registeredAgent} onChange={(e) => setRegisteredAgent(e.target.value)}
              style={STYLE_CHAMP} />

            <span style={STYLE_LIBELLE}>Résidence fiscale du membre</span>
            <select value={memberResidence} onChange={(e) => setMemberResidence(e.target.value)}
              style={STYLE_CHAMP}>
              {RESIDENCES.map((r) => (
                <option key={r.code} value={r.code}>{r.libelle}</option>
              ))}
            </select>

            <label style={{ display: "block", marginBottom: 16, fontSize: 15 }}>
              <input
                type="checkbox"
                checked={frTaxResident}
                onChange={(e) => setFrTaxResident(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Résident fiscal français
            </label>
            <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
              Détermine les obligations françaises : formulaire 3916 pour les comptes
              détenus à l&apos;étranger. Un expatrié n&apos;y est pas soumis.
            </p>

            <span style={STYLE_LIBELLE}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} style={STYLE_CHAMP} />

            <button onClick={creer} disabled={enCours} style={styleBouton}>
              {enCours ? "Création…" : "Créer la société"}
            </button>
          </div>
        )}

        {msg && (
          <p style={{
            marginBottom: 16,
            color: msg.indexOf("Erreur") === 0 || msg.indexOf("ATTENTION") !== -1 ? "#c62828" : VERT,
          }}>
            {msg}
          </p>
        )}

        {chargement && <p>Chargement…</p>}
        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        {!chargement && !erreur && entites.length === 0 && (
          <div style={{
            background: "#f0f5f2",
            borderLeft: "4px solid " + VERT,
            padding: 16,
          }}>
            {recherche
              ? "Aucune société ne correspond à cette recherche."
              : "Aucune société enregistrée. Ajoutez la première pour activer son suivi."}
          </div>
        )}

        {!chargement && entites.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: VERT, color: "#ffffff" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Société</th>
                <th style={{ padding: 10 }}>État</th>
                <th style={{ padding: 10 }}>Constituée</th>
                <th style={{ padding: 10 }}>Prochaine échéance</th>
                <th style={{ padding: 10 }}>À venir</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {entites.map((e: any) => {
                const jours = joursAvant(e.prochaine_echeance);
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                    <td style={{ padding: 10 }}>
                      <strong>{e.label}</strong>
                      {e.legal_name && e.legal_name !== e.label && (
                        <><br /><span style={{ fontSize: 13, color: "#666" }}>{e.legal_name}</span></>
                      )}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>{e.formation_state || "—"}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {e.formation_date || "—"}
                    </td>
                    <td style={{ padding: 10, textAlign: "center", color: couleurEcheance(jours) }}>
                      {e.prochaine_echeance
                        ? e.prochaine_echeance + (jours !== null
                          ? (jours < 0 ? " (échue)" : " (J-" + jours + ")")
                          : "")
                        : "—"}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {e.echeances_a_venir === undefined ? "…" : e.echeances_a_venir}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <a
                        href={"/admin/compliance?entite=" + e.id}
                        style={{ color: VERT, fontWeight: "bold", textDecoration: "none" }}
                      >
                        Ouvrir →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => charger(page - 1, recherche)}
              disabled={page <= 1}
              style={{ ...styleBoutonClair, marginBottom: 0, opacity: page <= 1 ? 0.4 : 1 }}
            >
              ← Précédent
            </button>
            <span style={{ color: "#666" }}>Page {page} sur {pages}</span>
            <button
              onClick={() => charger(page + 1, recherche)}
              disabled={page >= pages}
              style={{ ...styleBoutonClair, marginBottom: 0, opacity: page >= pages ? 0.4 : 1 }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
