"use client";

import { useEffect, useState } from "react";

const TENANT_ID = "048da817-b4d1-40d8-9107-88fe87e600ee";

type Compte = {
  id: string;
  designation: string;
  type_compte: string | null;
  caractere: string | null;
  organisme_nom: string;
  organisme_adresse: string | null;
  organisme_pays: string | null;
  numero_compte: string | null;
  date_ouverture: string | null;
  date_cloture: string | null;
  devise: string | null;
  titulaire: string | null;
  titulaire_precision: string | null;
  valide_par_fiscaliste: boolean;
  notes: string | null;
  exercice: number;
};

export default function ComptesEtrangers() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [designation, setDesignation] = useState("");
  const [typeCompte, setTypeCompte] = useState("compte bancaire");
  const [caractere, setCaractere] = useState("professionnel");
  const [organismeNom, setOrganismeNom] = useState("");
  const [organismeAdresse, setOrganismeAdresse] = useState("");
  const [organismePays, setOrganismePays] = useState("");
  const [numeroCompte, setNumeroCompte] = useState("");
  const [dateOuverture, setDateOuverture] = useState("");
  const [dateCloture, setDateCloture] = useState("");
  const [devise, setDevise] = useState("USD");
  const [titulaire, setTitulaire] = useState("entite");
  const [titulairePrecision, setTitulairePrecision] = useState("");
  const [notes, setNotes] = useState("");

  async function charger(a: number) {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/comptes-etrangers?tenant_id=" + TENANT_ID + "&year=" + a);
      const d = await r.json();
      if (d.success) setComptes(d.comptes || []);
      else setMsg("Erreur : " + (d.error || "inconnue"));
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger(annee);
  }, [annee]);

  async function ajouter() {
    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/comptes-etrangers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          designation,
          type_compte: typeCompte,
          caractere,
          organisme_nom: organismeNom,
          organisme_adresse: organismeAdresse,
          organisme_pays: organismePays,
          numero_compte: numeroCompte,
          date_ouverture: dateOuverture || null,
          date_cloture: dateCloture || null,
          devise,
          titulaire,
          titulaire_precision: titulairePrecision,
          notes,
          exercice: annee,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg("Compte enregistre.");
        setDesignation("");
        setOrganismeNom("");
        setOrganismeAdresse("");
        setOrganismePays("");
        setNumeroCompte("");
        setDateOuverture("");
        setDateCloture("");
        setTitulairePrecision("");
        setNotes("");
        charger(annee);
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  async function supprimer(id: string, nom: string) {
    if (!confirm("Supprimer definitivement le compte \"" + nom + "\" ?")) return;
    setEnCours(true);
    try {
      const r = await fetch("/api/compliance/comptes-etrangers?id=" + id, { method: "DELETE" });
      const d = await r.json();
      if (d.success) {
        setMsg("Compte supprime.");
        charger(annee);
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  const champ = {
    width: "100%",
    padding: 10,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 14,
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#ffffff",
    color: "#1a1a1a",
  };

  const label = { display: "block", fontWeight: 600, fontSize: 14 };

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
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
          Comptes etrangers (formulaire 3916)
        </h1>

        <div style={{ background: "#f0f5f2", borderLeft: "4px solid #0a3d2e", padding: 16, marginBottom: 24 }}>
          <strong>Article 1649 A du CGI :</strong> toute personne physique domiciliee en France
          doit declarer les comptes ouverts, detenus, utilises ou sous procuration a l'etranger.
          Un compte au nom de la LLC est concerne des lors que vous pouvez le faire fonctionner.
          Penalite d'omission : 1 500 EUR par compte et par an.
        </div>

        <label style={label}>Exercice</label>
        <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} style={{ ...champ, width: 160 }}>
          {[2026, 2027, 2028].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <h2 style={{ color: "#0a3d2e", fontSize: 20 }}>
          Comptes enregistres pour {annee} : {comptes.length}
        </h2>

        {chargement && <p>Chargement...</p>}

        {!chargement && comptes.length === 0 && (
          <p style={{ color: "#666" }}>Aucun compte enregistre pour cet exercice.</p>
        )}

        {comptes.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: "#ffffff",
            }}
          >
            <strong style={{ color: "#0a3d2e", fontSize: 17 }}>{c.designation}</strong>
            <span style={{ color: c.valide_par_fiscaliste ? "#2e7d32" : "#8a6d2f", marginLeft: 10, fontSize: 13 }}>
              {c.valide_par_fiscaliste ? "valide par un fiscaliste" : "non valide"}
            </span>
            <br />
            {c.organisme_nom}
            {c.organisme_pays ? " (" + c.organisme_pays + ")" : ""}
            {c.numero_compte ? " - n. " + c.numero_compte : ""}
            {c.devise ? " - " + c.devise : ""}
            <br />
            <span style={{ color: "#666", fontSize: 14 }}>
              Titulaire : {c.titulaire || "-"}
              {c.date_ouverture ? " - ouvert le " + c.date_ouverture : ""}
            </span>
            <br />
            <button
              onClick={() => supprimer(c.id, c.designation)}
              disabled={enCours}
              style={{
                marginTop: 10,
                background: "#ffffff",
                color: "#c62828",
                border: "1px solid #c62828",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Supprimer
            </button>
          </div>
        ))}

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>Ajouter un compte</h2>

        <label style={label}>Designation du compte (obligatoire)</label>
        <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Compte courant Airwallex ACADEMIA PRO LLC" style={champ} />

        <label style={label}>Type de compte</label>
        <select value={typeCompte} onChange={(e) => setTypeCompte(e.target.value)} style={champ}>
          <option value="compte bancaire">Compte bancaire</option>
          <option value="compte d actifs numeriques">Compte d'actifs numeriques</option>
          <option value="compte de paiement">Compte de paiement</option>
        </select>

        <label style={label}>Caractere</label>
        <select value={caractere} onChange={(e) => setCaractere(e.target.value)} style={champ}>
          <option value="professionnel">Professionnel</option>
          <option value="personnel">Personnel</option>
          <option value="mixte">Mixte</option>
        </select>

        <label style={label}>Organisme gestionnaire (obligatoire)</label>
        <input value={organismeNom} onChange={(e) => setOrganismeNom(e.target.value)} placeholder="Airwallex" style={champ} />

        <label style={label}>Adresse de l'organisme</label>
        <input value={organismeAdresse} onChange={(e) => setOrganismeAdresse(e.target.value)} style={champ} />

        <label style={label}>Pays de l'organisme</label>
        <input value={organismePays} onChange={(e) => setOrganismePays(e.target.value)} placeholder="Etats-Unis" style={champ} />

        <label style={label}>Numero de compte</label>
        <input value={numeroCompte} onChange={(e) => setNumeroCompte(e.target.value)} style={champ} />

        <label style={label}>Date d'ouverture</label>
        <input type="date" value={dateOuverture} onChange={(e) => setDateOuverture(e.target.value)} style={champ} />

        <label style={label}>Date de cloture (laisser vide si actif)</label>
        <input type="date" value={dateCloture} onChange={(e) => setDateCloture(e.target.value)} style={champ} />

        <label style={label}>Devise</label>
        <input value={devise} onChange={(e) => setDevise(e.target.value)} style={champ} />

        <label style={label}>Titulaire declare</label>
        <select value={titulaire} onChange={(e) => setTitulaire(e.target.value)} style={champ}>
          <option value="entite">Entite (la LLC)</option>
          <option value="personne_physique">Personne physique</option>
        </select>

        <label style={label}>Precision sur le titulaire</label>
        <input value={titulairePrecision} onChange={(e) => setTitulairePrecision(e.target.value)} placeholder="ACADEMIA PRO LLC - membre unique et gerant, droit d'utilisation" style={champ} />

        <label style={label}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={champ} />

        <button
          onClick={ajouter}
          disabled={enCours}
          style={{
            background: "#0a3d2e",
            color: "#ffffff",
            border: "none",
            padding: "14px 22px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {enCours ? "Enregistrement..." : "Enregistrer le compte"}
        </button>

        {msg && (
          <p style={{ marginTop: 14, color: msg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
