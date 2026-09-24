"use client";

import { useEffect, useState } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LA FICHE ANNUELLE — 24/09.
//
// L ECRAN QUI MANQUAIT. Sans lui, un nouveau client ne pouvait generer ni son
// 5472, ni son 1120, ni son 7004, ni son 3916 : leurs fiches n existaient
// qu en base, ecrites a la main pour AcademIA Pro LLC. Voir la route
// /api/compliance/fiche-annuelle, qui porte toute la logique.
//
// CE QUE LE CLIENT VOIT : ce que l outil sait deja (nom, Etat, date de
// constitution, EIN du parcours de creation, adresse decoupee) — il le
// relit et le corrige au besoin ; puis ce que l outil ne peut pas savoir :
// l identite du membre, l activite, l actif de fin d exercice.
//
// ⚠️ LES EXEMPLES GRISES NE RESSEMBLENT JAMAIS A UNE VRAIE VALEUR (regle du
// 02/08) : un champ vide doit se voir vide.
// ⚠️ FOND BLANC ET colorScheme "light" SUR LE CONTENEUR (regle du 22/07) :
// sinon le theme sombre de l iPad rend la page illisible.
// ══════════════════════════════════════════════════════════════════════════

const VERT = "#0a3d2e";
const OR = "#a07840";

// Quelques codes NAICS courants pour une LLC detenue depuis la France. Un
// clic remplit l activite et le code ; tout autre code se saisit a la main.
const CODES_NAICS = [
  { code: "541611", activite: "Management consulting services", nom: "Conseil en management" },
  { code: "611430", activite: "Professional training services", nom: "Formation professionnelle" },
  { code: "541511", activite: "Custom software development", nom: "Développement logiciel" },
  { code: "541990", activite: "Professional services", nom: "Autres services professionnels" },
];

const STYLE_CHAMP: any = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 16,
  border: "1px solid #c9c9c0",
  borderRadius: 6,
  background: "#ffffff",
  color: "#1a1a1a",
  fontFamily: "inherit",
};

const STYLE_TITRE_CHAMP: any = {
  display: "block",
  fontSize: 14,
  color: "#333",
  margin: "0 0 5px",
  fontWeight: "bold",
};

const STYLE_AIDE: any = {
  display: "block",
  fontSize: 13,
  color: "#666",
  margin: "5px 0 0",
  lineHeight: 1.5,
};

const STYLE_CARTE: any = {
  background: "#ffffff",
  border: "1px solid #e2e2d8",
  borderRadius: 10,
  padding: "20px 22px",
  marginBottom: 20,
};

const STYLE_BOUTON: any = {
  background: VERT,
  color: "#ffffff",
  border: "none",
  padding: "14px 26px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: "bold",
};

function Champ(props: {
  titre: string;
  valeur: string;
  onChange: (v: string) => void;
  aide?: string;
  indice?: string;
  type?: string;
  lectureSeule?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={STYLE_TITRE_CHAMP}>{props.titre}</span>
      <input
        type={props.type || "text"}
        value={props.valeur}
        placeholder={props.indice || ""}
        readOnly={!!props.lectureSeule}
        onChange={function (e) { props.onChange(e.target.value); }}
        style={props.lectureSeule
          ? { ...STYLE_CHAMP, background: "#f3f3ee", color: "#555" }
          : STYLE_CHAMP}
      />
      {props.aide && <span style={STYLE_AIDE}>{props.aide}</span>}
    </div>
  );
}

function Deux(props: { children: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
      {props.children}
    </div>
  );
}

export default function PageFicheAnnuelle() {
  const [entite, setEntite] = useState("");
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [fiche, setFiche] = useState<any>(null);
  const [societe, setSociete] = useState<any>({});
  const [membre, setMembre] = useState<any>({});
  const [exercice, setExercice] = useState<any>({});
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [manquants, setManquants] = useState<string[]>([]);
  const [succes, setSucces] = useState("");
  const [avertissements, setAvertissements] = useState<string[]>([]);

  async function charger(ent: string, an: number) {
    setChargement(true);
    setErreur("");
    setSucces("");
    try {
      const q = "?annee=" + an + (ent ? "&entite=" + encodeURIComponent(ent) : "");
      const r = await fetch("/api/compliance/fiche-annuelle" + q, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setErreur(d.error || "Lecture impossible.");
      } else {
        setFiche(d.fiche);
        setSociete(d.fiche.societe);
        setMembre(d.fiche.membre);
        setExercice(d.fiche.exercice);
        setManquants(d.manquants || []);
        setAvertissements(d.avertissements || []);
        if (!ent && d.fiche.entite && d.fiche.entite.id) setEntite(d.fiche.entite.id);
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const ent = p.get("entite") || p.get("entite_id") || "";
    const an = Number(p.get("annee")) || new Date().getFullYear();
    setEntite(ent);
    setAnnee(an);
    charger(ent, an);
  }, []);

  function changerAnnee(an: number) {
    setAnnee(an);
    const p = new URLSearchParams(window.location.search);
    p.set("annee", String(an));
    if (entite) p.set("entite", entite);
    window.history.replaceState(null, "", window.location.pathname + "?" + p.toString());
    charger(entite, an);
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur("");
    setSucces("");
    setManquants([]);
    try {
      const r = await fetch("/api/compliance/fiche-annuelle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entite_id: entite || (fiche && fiche.entite ? fiche.entite.id : ""),
          annee: annee,
          societe: societe,
          membre: membre,
          exercice: exercice,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setErreur(d.error || "Enregistrement impossible.");
        setManquants(d.manquants || []);
        window.scrollTo(0, 0);
      } else {
        setSucces(d.message || "Fiche enregistrée.");
        setFiche(d.fiche);
        setSociete(d.fiche.societe);
        setMembre(d.fiche.membre);
        setExercice(d.fiche.exercice);
        window.scrollTo(0, 0);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setEnvoi(false);
  }

  function s(cle: string) {
    return function (v: string) { setSociete({ ...societe, [cle]: v }); };
  }
  function m(cle: string) {
    return function (v: string) { setMembre({ ...membre, [cle]: v }); };
  }
  function x(cle: string) {
    return function (v: string) { setExercice({ ...exercice, [cle]: v }); };
  }

  const idEntite = entite || (fiche && fiche.entite ? fiche.entite.id : "");
  const retour = "/admin/compliance" + (idEntite ? "?entite=" + encodeURIComponent(idEntite) : "");
  const anneeCourante = new Date().getFullYear();
  const annees = [anneeCourante - 1, anneeCourante, anneeCourante + 1];
  const residentFrancais = String(membre.pays_residence || "").trim().toLowerCase() === "france";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f2", color: "#1a1a1a",
      colorScheme: "light", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 60px" }}>
        <a href={retour} style={{ color: VERT, fontSize: 15, textDecoration: "none" }}>
          &larr; Retour au tableau de bord
        </a>

        <h1 style={{ color: VERT, fontSize: 28, margin: "18px 0 8px" }}>
          Fiche annuelle{fiche && fiche.entite ? " — " + fiche.entite.nom : ""}
        </h1>
        <p style={{ fontSize: 16, color: "#444", lineHeight: 1.7, margin: "0 0 18px" }}>
          Une seule saisie remplit le Form 5472, le Form 1120 pro forma, le Form 7004
          {residentFrancais ? " et le formulaire 3916" : ""}. Ce que l&apos;outil sait déjà
          est prérempli : relisez-le, puis complétez le reste.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ fontSize: 15, color: "#333" }}>Exercice</span>
          <select
            value={annee}
            onChange={function (e) { changerAnnee(Number(e.target.value)); }}
            style={{ ...STYLE_CHAMP, width: "auto", padding: "8px 12px" }}
          >
            {annees.map(function (a) { return <option key={a} value={a}>{a}</option>; })}
          </select>
        </div>

        {succes && (
          <div style={{ ...STYLE_CARTE, borderColor: VERT, background: "rgba(10,61,46,0.06)" }}>
            <p style={{ margin: 0, color: VERT, fontSize: 16, fontWeight: "bold" }}>{succes}</p>
            <p style={{ margin: "10px 0 0", fontSize: 15 }}>
              <a href={retour} style={{ color: VERT, fontWeight: "bold" }}>
                Générer les formulaires depuis le tableau de bord &rarr;
              </a>
            </p>
            {residentFrancais && fiche && fiche.nb_comptes_etrangers === 0 && (
              <p style={{ margin: "10px 0 0", fontSize: 15, color: "#555" }}>
                Pour le 3916, enregistrez aussi le compte bancaire de la société :{" "}
                <a href={"/admin/compliance/comptes-etrangers" + (idEntite ? "?entite=" + encodeURIComponent(idEntite) : "")}
                  style={{ color: VERT, fontWeight: "bold" }}>
                  comptes à l&apos;étranger
                </a>.
              </p>
            )}
          </div>
        )}

        {erreur && (
          <div style={{ ...STYLE_CARTE, borderColor: "#e0a0a0", background: "#fff4f4" }}>
            <p style={{ margin: 0, color: "#8a1c1c", fontSize: 16, fontWeight: "bold" }}>{erreur}</p>
            {manquants.length > 0 && (
              <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "#8a1c1c", fontSize: 15, lineHeight: 1.7 }}>
                {manquants.map(function (t) { return <li key={t}>{t}</li>; })}
              </ul>
            )}
          </div>
        )}

        {chargement && <p style={{ fontSize: 16, color: "#555" }}>Chargement…</p>}

        {!chargement && fiche && (
          <>
            {/* ---- LA SOCIETE ---- */}
            <div style={STYLE_CARTE}>
              <h2 style={{ color: VERT, fontSize: 20, margin: "0 0 14px" }}>La société</h2>
              <Deux>
                <Champ titre="Dénomination" valeur={fiche.entite.nom} onChange={function () {}} lectureSeule
                  aide="Reprise de « Ma société »." />
                <Champ titre="État et date de constitution"
                  valeur={(fiche.entite.etat || "—") + (fiche.entite.date_constitution
                    ? " · " + String(fiche.entite.date_constitution).split("-").reverse().join("/") : "")}
                  onChange={function () {}} lectureSeule aide="Repris de « Ma société »." />
              </Deux>
              <Champ titre="EIN" valeur={societe.ein || ""} onChange={s("ein")} indice="neuf chiffres"
                aide={societe.ein_source === "creation"
                  ? "Repris du parcours de création."
                  : "Le numéro fiscal américain de la société, sur la lettre de l'IRS."} />
              <Deux>
                <Champ titre="Rue" valeur={societe.adr_rue || ""} onChange={s("adr_rue")} indice="numéro et rue" />
                <Champ titre="Suite" valeur={societe.adr_suite || ""} onChange={s("adr_suite")} indice="facultatif" />
              </Deux>
              <Deux>
                <Champ titre="Ville" valeur={societe.adr_ville || ""} onChange={s("adr_ville")} indice="ville" />
                <Champ titre="État" valeur={societe.adr_etat || ""} onChange={s("adr_etat")} indice="deux lettres" />
                <Champ titre="Code ZIP" valeur={societe.adr_zip || ""} onChange={s("adr_zip")} indice="cinq chiffres" />
              </Deux>
              <span style={{ ...STYLE_AIDE, marginTop: -6, marginBottom: 14 }}>
                L&apos;adresse est découpée depuis « Ma société » : vérifiez chaque case.
              </span>

              <span style={STYLE_TITRE_CHAMP}>Activité</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 10px" }}>
                {CODES_NAICS.map(function (c) {
                  const choisi = societe.naics === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={function () { setSociete({ ...societe, naics: c.code, activite: c.activite }); }}
                      style={{
                        padding: "8px 12px", fontSize: 14, borderRadius: 18, cursor: "pointer",
                        border: "1px solid " + (choisi ? VERT : "#c9c9c0"),
                        background: choisi ? "rgba(10,61,46,0.08)" : "#ffffff",
                        color: choisi ? VERT : "#333", fontFamily: "inherit",
                      }}
                    >
                      {c.nom} · {c.code}
                    </button>
                  );
                })}
              </div>
              <Deux>
                <Champ titre="Description, en anglais" valeur={societe.activite || ""} onChange={s("activite")}
                  indice="texte en anglais" aide="Elle figure telle quelle sur le 5472." />
                <Champ titre="Code NAICS" valeur={societe.naics || ""} onChange={s("naics")} indice="six chiffres"
                  aide="La nomenclature américaine des activités." />
              </Deux>
            </div>

            {/* ---- LE MEMBRE ---- */}
            <div style={STYLE_CARTE}>
              <h2 style={{ color: VERT, fontSize: 20, margin: "0 0 6px" }}>Le membre</h2>
              <p style={{ fontSize: 15, color: "#555", margin: "0 0 14px", lineHeight: 1.6 }}>
                La personne qui détient la société. Elle est l&apos;actionnaire étranger du 5472,
                le propriétaire déclaré sur le 1120
                {residentFrancais ? ", et le déclarant du 3916" : ""}.
              </p>
              <Deux>
                <Champ titre="Nom" valeur={membre.nom || ""} onChange={m("nom")} indice="nom de famille" />
                <Champ titre="Prénom" valeur={membre.prenoms || ""} onChange={m("prenoms")} indice="prénom" />
              </Deux>
              <Champ titre="Adresse" valeur={membre.adresse_rue || ""} onChange={m("adresse_rue")} indice="numéro et rue" />
              <Deux>
                <Champ titre="Code postal" valeur={membre.adresse_code_postal || ""} onChange={m("adresse_code_postal")}
                  indice="code postal" />
                <Champ titre="Ville" valeur={membre.adresse_ville || ""} onChange={m("adresse_ville")} indice="ville" />
                <Champ titre="Pays" valeur={membre.adresse_pays || ""} onChange={m("adresse_pays")} indice="pays" />
              </Deux>
              <Deux>
                <Champ titre="Nationalité" valeur={membre.nationalite || ""} onChange={m("nationalite")} indice="pays" />
                <Champ titre="Pays de résidence fiscale" valeur={membre.pays_residence || ""}
                  onChange={m("pays_residence")} indice="pays"
                  aide="France : le 3916 s'ajoute aux formulaires américains." />
              </Deux>
              <Champ titre="Numéro fiscal" valeur={membre.numero_fiscal || ""} onChange={m("numero_fiscal")}
                indice="treize chiffres en France"
                aide="Le numéro fiscal de référence, en haut de l'avis d'impôt. C'est le « foreign TIN » du 5472." />
              {residentFrancais && (
                <Deux>
                  <Champ titre="Date de naissance" type="date" valeur={membre.date_naissance || ""}
                    onChange={m("date_naissance")} />
                  <Champ titre="Lieu de naissance" valeur={membre.lieu_naissance || ""} onChange={m("lieu_naissance")}
                    indice="commune et département" />
                </Deux>
              )}
            </div>

            {/* ---- L EXERCICE ---- */}
            <div style={STYLE_CARTE}>
              <h2 style={{ color: VERT, fontSize: 20, margin: "0 0 14px" }}>L&apos;exercice {annee}</h2>
              <Champ titre="Actif total en fin d'exercice, en dollars" valeur={exercice.actif_total_usd || ""}
                onChange={x("actif_total_usd")} indice="montant en USD"
                aide="Le total de ce que possède la société au 31 décembre : trésorerie, créances, biens." />
              <Deux>
                <Champ titre="Pays où l'activité est exercée" valeur={exercice.pays_activite || ""}
                  onChange={x("pays_activite")} indice="pays" />
                <Champ titre="Taux de change euro-dollar" valeur={exercice.taux_eur_usd || ""}
                  onChange={x("taux_eur_usd")} indice="facultatif"
                  aide="Le taux annuel moyen publié par l'IRS. Il convertit les avances payées en euros." />
              </Deux>
              <p style={{ fontSize: 14, color: "#555", margin: "4px 0 0", lineHeight: 1.6 }}>
                Les avances du membre ne se saisissent pas ici : elles viennent des dépenses
                enregistrées dans la comptabilité de la société, justificatifs à l&apos;appui.
              </p>
            </div>

            {avertissements.length > 0 && (
              <div style={{ ...STYLE_CARTE, borderColor: "#e6d3a8", background: "#fffaf0" }}>
                {avertissements.map(function (t) {
                  return <p key={t} style={{ margin: "0 0 6px", color: OR, fontSize: 15 }}>{t}</p>;
                })}
              </div>
            )}

            <button onClick={enregistrer} disabled={envoi} style={{ ...STYLE_BOUTON, opacity: envoi ? 0.6 : 1 }}>
              {envoi ? "Enregistrement…" : "Enregistrer la fiche " + annee}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
