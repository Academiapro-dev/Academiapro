"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// LES COMPTES ETRANGERS — ECRAN CORRIGE LE 31/08 AU SOIR.
//
// 🚨 CE QUI ETAIT CASSE. Cet ecran ne connaissait pas les societes. Sur un
// portefeuille de plusieurs LLC, il affichait LES COMPTES BANCAIRES DE
// TOUTES LES SOCIETES MELANGES, sans dire lequel appartient a qui — et
// l ajout etait IMPOSSIBLE, la route refusant d enregistrer un compte sans
// savoir a quelle societe le rattacher.
//
// ⚠️ POURQUOI LE MELANGE EST GRAVE ICI PLUS QU AILLEURS. Ces lignes portent
// des NUMEROS DE COMPTES BANCAIRES. Un gestionnaire qui ouvre l ecran
// depuis le dossier d un client et voit les comptes d un autre client perd
// confiance immediatement — et il a raison.
//
// ⚠️ ET LE 3916 SE GENERE A PARTIR DE CES LIGNES. Un compte rattache a la
// mauvaise societe, ou orphelin, produit une declaration fausse. La
// penalite d omission est de 1 500 EUR par compte et par an.
//
// LA CORRECTION : un selecteur de societe OBLIGATOIRE. Rien ne s affiche et
// rien ne s ajoute tant qu une societe n est pas choisie. L ecran accepte
// aussi ?entite=<id> dans l adresse, pour qu on arrive directement sur la
// bonne depuis la fiche d une societe.
//
// ⚠️ LE tenant_id N EST PLUS ENVOYE. Il l etait, et la route l ignorait
// deja — elle prend celui de la session signee. L envoyer entretenait
// l illusion qu un identifiant transmis par le navigateur decide de quelque
// chose : c est precisement le defaut corrige le matin dans f5472 et f3916.
// ---------------------------------------------------------------------------

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

type Societe = {
  id: string;
  label: string;
  legal_name: string | null;
  formation_state: string | null;
  fr_tax_resident: boolean | null;
};

export default function ComptesEtrangers() {
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [entiteId, setEntiteId] = useState("");
  const [pretes, setPretes] = useState(false);

  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [chargement, setChargement] = useState(false);
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

  const societeChoisie = societes.filter(function (s) { return s.id === entiteId; })[0] || null;

  // ---- LE PORTEFEUILLE ----
  //
  // La liste des societes vient de /api/compliance/entites, qui la borne au
  // tenant de la session. Une societe d un autre gestionnaire n y figure
  // pas — ce n est donc pas au navigateur de decider ce qu il peut voir.
  useEffect(function () {
    async function demarrer() {
      try {
        const r = await fetch("/api/compliance/entites?taille=200", { cache: "no-store" });
        const d = await r.json();

        if (!d.ok) {
          setMsg(d.erreur || "Connectez-vous pour accéder à votre espace.");
          setPretes(true);
          return;
        }

        const liste: Societe[] = d.entites || [];
        setSocietes(liste);

        // ?entite=<id> dans l adresse : on arrive directement sur la bonne
        // societe depuis sa fiche. L identifiant n est retenu que s il
        // figure dans la liste rendue par l API — donc que s il appartient
        // bien a l organisme.
        let choisie = "";
        try {
          const p = new URLSearchParams(window.location.search);
          const demandee = (p.get("entite") || "").trim();
          if (demandee && liste.some(function (s) { return s.id === demandee; })) {
            choisie = demandee;
          }
        } catch (e) {
          // pas d adresse lisible : on ignore
        }

        // Une seule societe au portefeuille : la choisir evite un clic
        // inutile. Au-dela, on laisse choisir plutot que de deviner.
        if (!choisie && liste.length === 1) choisie = liste[0].id;

        setEntiteId(choisie);
        setPretes(true);
      } catch (e: any) {
        setMsg("Erreur : " + String(e));
        setPretes(true);
      }
    }
    demarrer();
  }, []);

  useEffect(function () {
    if (entiteId) charger(entiteId, annee);
    else setComptes([]);
  }, [entiteId, annee]);

  async function charger(id: string, a: number) {
    setChargement(true);
    setMsg(null);
    try {
      const r = await fetch(
        "/api/compliance/comptes-etrangers?entite=" + encodeURIComponent(id) + "&year=" + a,
        { cache: "no-store" }
      );
      const d = await r.json();
      if (d.success) setComptes(d.comptes || []);
      else setMsg("Erreur : " + (d.error || "inconnue"));
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    // 🚨 SANS SOCIETE, RIEN NE PART. Un compte orphelin n apparaitrait sur
    // aucune fiche 3916 : il ne serait jamais declare.
    if (!entiteId) {
      setMsg("Erreur : choisissez d'abord la société à laquelle rattacher ce compte.");
      return;
    }

    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/comptes-etrangers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entite_id: entiteId,
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
        setMsg("Compte enregistré.");
        setDesignation("");
        setOrganismeNom("");
        setOrganismeAdresse("");
        setOrganismePays("");
        setNumeroCompte("");
        setDateOuverture("");
        setDateCloture("");
        setTitulairePrecision("");
        setNotes("");
        charger(entiteId, annee);
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
  }

  async function supprimer(id: string, nom: string) {
    if (!confirm("Supprimer définitivement le compte « " + nom + " » ?")) return;
    setEnCours(true);
    try {
      const r = await fetch("/api/compliance/comptes-etrangers?id=" + id, { method: "DELETE" });
      const d = await r.json();
      if (d.success) {
        setMsg("Compte supprimé.");
        if (entiteId) charger(entiteId, annee);
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
        <a href="/admin/compliance/entites" style={{ color: "#0a3d2e", fontSize: 14 }}>
          ← Portefeuille
        </a>

        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
          Comptes étrangers (formulaire 3916)
        </h1>

        <div style={{ background: "#f0f5f2", borderLeft: "4px solid #0a3d2e", padding: 16, marginBottom: 24 }}>
          <strong>Article 1649 A du CGI :</strong> toute personne physique domiciliée en France
          doit déclarer les comptes ouverts, détenus, utilisés ou sous procuration à l'étranger.
          Un compte au nom de la société est concerné dès lors que vous pouvez le faire fonctionner.
          Pénalité d'omission : 1 500 € par compte et par an.
        </div>

        {/* ---- LE SELECTEUR DE SOCIETE ---- */}
        <label style={label}>Société</label>
        <select
          value={entiteId}
          onChange={(e) => setEntiteId(e.target.value)}
          style={champ}
        >
          <option value="">— choisir une société —</option>
          {societes.map(function (s) {
            return (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.formation_state ? " (" + s.formation_state + ")" : ""}
              </option>
            );
          })}
        </select>

        <label style={label}>Exercice</label>
        <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} style={{ ...champ, width: 160 }}>
          {[2026, 2027, 2028].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Tant qu aucune societe n est choisie, l ecran ne montre rien et
            ne propose rien : afficher une liste vide laisserait croire qu il
            n y a pas de compte, ce qui est une information fausse. */}
        {!pretes ? (
          <p>Chargement du portefeuille…</p>
        ) : societes.length === 0 ? (
          <div style={{ background: "#fff8e1", borderLeft: "4px solid #c8a96e", padding: 16 }}>
            Aucune société enregistrée. Ajoutez-en une depuis le portefeuille avant de
            déclarer un compte étranger.
          </div>
        ) : !entiteId ? (
          <div style={{ background: "#fff8e1", borderLeft: "4px solid #c8a96e", padding: 16 }}>
            Choisissez une société ci-dessus pour voir ses comptes étrangers et en ajouter.
            Chaque compte appartient à une société précise : c'est ce rattachement qui
            détermine sur quelle fiche 3916 il apparaîtra.
          </div>
        ) : (
          <>
            {societeChoisie && societeChoisie.fr_tax_resident === false && (
              <div style={{ background: "#fff8e1", borderLeft: "4px solid #c8a96e", padding: 16, marginBottom: 20 }}>
                <strong>{societeChoisie.label}</strong> n'est pas rattachée à un résident
                fiscal français. Les comptes peuvent être enregistrés pour mémoire, mais
                la fiche 3916 ne s'applique pas à cette société.
              </div>
            )}

            <h2 style={{ color: "#0a3d2e", fontSize: 20 }}>
              {societeChoisie ? societeChoisie.label + " — c" : "C"}omptes enregistrés pour {annee} : {comptes.length}
            </h2>

            {chargement && <p>Chargement…</p>}

            {!chargement && comptes.length === 0 && (
              <p style={{ color: "#666" }}>Aucun compte enregistré pour cet exercice.</p>
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
                  {c.valide_par_fiscaliste ? "validé par un fiscaliste" : "non validé"}
                </span>
                <br />
                {c.organisme_nom}
                {c.organisme_pays ? " (" + c.organisme_pays + ")" : ""}
                {c.numero_compte ? " — n° " + c.numero_compte : ""}
                {c.devise ? " — " + c.devise : ""}
                <br />
                <span style={{ color: "#666", fontSize: 14 }}>
                  Titulaire : {c.titulaire || "—"}
                  {c.date_ouverture ? " — ouvert le " + c.date_ouverture : ""}
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

            <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>
              Ajouter un compte {societeChoisie ? "à " + societeChoisie.label : ""}
            </h2>

            <label style={label}>Désignation du compte (obligatoire)</label>
            <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Compte courant Airwallex" style={champ} />

            <label style={label}>Type de compte</label>
            <select value={typeCompte} onChange={(e) => setTypeCompte(e.target.value)} style={champ}>
              <option value="compte bancaire">Compte bancaire</option>
              <option value="compte d actifs numeriques">Compte d'actifs numériques</option>
              <option value="compte de paiement">Compte de paiement</option>
            </select>

            <label style={label}>Caractère</label>
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
            <input value={organismePays} onChange={(e) => setOrganismePays(e.target.value)} placeholder="États-Unis" style={champ} />

            <label style={label}>Numéro de compte</label>
            <input value={numeroCompte} onChange={(e) => setNumeroCompte(e.target.value)} style={champ} />

            <label style={label}>Date d'ouverture</label>
            <input type="date" value={dateOuverture} onChange={(e) => setDateOuverture(e.target.value)} style={champ} />

            <label style={label}>Date de clôture (laisser vide si actif)</label>
            <input type="date" value={dateCloture} onChange={(e) => setDateCloture(e.target.value)} style={champ} />

            <label style={label}>Devise</label>
            <input value={devise} onChange={(e) => setDevise(e.target.value)} style={champ} />

            <label style={label}>Titulaire déclaré</label>
            <select value={titulaire} onChange={(e) => setTitulaire(e.target.value)} style={champ}>
              <option value="entite">L'entité (la société)</option>
              <option value="personne_physique">Une personne physique</option>
            </select>

            <label style={label}>Précision sur le titulaire</label>
            <input value={titulairePrecision} onChange={(e) => setTitulairePrecision(e.target.value)} placeholder="Membre unique et gérant, droit d'utilisation" style={champ} />

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
              {enCours ? "Enregistrement…" : "Enregistrer le compte"}
            </button>
          </>
        )}

        {msg && (
          <p style={{ marginTop: 14, color: msg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
