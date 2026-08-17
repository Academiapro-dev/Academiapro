"use client";
import { useState, useEffect } from "react";

// LES CLIENTS B2B, ET LEURS TROIS OFFRES POSSIBLES.
//
// 🚨🚨 LA GRILLE DEFINITIVE DU PACK, arretee le 17/08 :
//     390 EUR HT par mois (plateforme + suivi commercial)
//   + 40 % du prix de vente hors taxes de chaque formation du catalogue
//   + 30 EUR HT PAR STAGIAIRE INSCRIT, QUI S'ADDITIONNENT A LA PART
//   = gestion administrative COMPRISE, bilan pedagogique annuel inclus.
//   + 1 500 EUR de mise en service, QUI NE S'APPLIQUE QU'AU PACK.
//
//  LMS SEUL — 290 EUR HT par mois en forfait, sans catalogue editeur, donc
//    aucune part ni redevance par stagiaire.
//  CRM SEUL — 35 EUR HT PAR UTILISATEUR ET PAR MOIS, sans degressivite.
//
// ⚠️⚠️ CE QUI A CHANGE DANS CET ECRAN LE 17/08, ET POURQUOI :
//
// (1) LE CHAMP « GESTION ADMINISTRATIVE » ET SA CASE A COCHER SONT RETIRES.
//     La gestion est desormais COMPRISE dans les trois montants ci-dessus.
//     La case disait « le forfait remplace alors le minimum par stagiaire » :
//     c'etait l'ancien modele, ou souscrire la gestion faisait DISPARAITRE la
//     redevance. Ce n'est plus vrai, et le laisser aurait produit des
//     factures fausses.
//
// (2) « MINIMUM PAR STAGIAIRE » DEVIENT « REDEVANCE PAR STAGIAIRE ». Ce
//     n'est plus un plancher qui se substitue a la part quand elle est
//     faible, c'est un montant qui S'AJOUTE toujours. Le bon de commande et
//     les CGV viennent d'etre repris pour lever cette confusion — garder
//     l'ancien mot ici la reintroduirait par la petite porte.
//
// CE QUI A ETE ESSAYE ET ECARTE LE MEME JOUR, pour ne pas y revenir : deux
// formules au choix (35 % ou 10 % + 180 EUR) ; une option de gestion a 79
// puis 49 EUR par mois et par stagiaire actif, qui contredisait la promesse
// d'une gestion annuelle ; un abonnement abaisse a 49 EUR ; et 45 % sans
// redevance.
//
// 🚨 SUR LE CRM SEUL, LE CHAMP « ABONNEMENT » PORTE LE PRIX PAR POSTE — 35 —
// ET NON LE TOTAL. C'est le bon de commande qui multiplie par le nombre
// d'utilisateurs. Saisir 3 500 pour cent postes donnerait 350 000 EUR sur le
// bon. L'ecran le rappelle quand l'offre CRM est choisie.
//
// 🚨 LE QUOTA DE REDACTION N'EST PLUS AFFICHE ICI. Retire le 16/08 : « il
// faut l'effacer vis-a-vis de l'utilisateur, ca entraine des questions ». LA
// PROTECTION RESTE ENTIERE — la colonne quota_ia_mensuel vaut toujours 40 en
// base et /api/organisme/rediger-module continue de la lire. Seul l'affichage
// disparait. NE PAS croire, en relisant cet ecran, que le garde-fou a saute.

const OFFRES = [
  { cle: "pack", nom: "Pack complet", detail: "LMS + CRM + catalogue · forfait" },
  { cle: "lms", nom: "Plateforme seule", detail: "sans catalogue · forfait" },
  { cle: "crm", nom: "Suivi commercial seul", detail: "par utilisateur" },
];

export default function PageOrganismes() {
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [fiche, setFiche] = useState<any>({});

  const [raison, setRaison] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [siret, setSiret] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [telephone, setTelephone] = useState("");
  const [qualiopi, setQualiopi] = useState(false);
  const [offreNeuve, setOffreNeuve] = useState("pack");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) {
        setOrganismes(data.organismes || []);
        const f: any = {};
        for (const o of data.organismes || []) {
          f[o.id] = {
            offre: o.offre || "pack",
            utilisateurs: o.nb_utilisateurs !== null && o.nb_utilisateurs !== undefined ? String(o.nb_utilisateurs) : "1",
            abonnement: o.abonnement_mensuel !== null && o.abonnement_mensuel !== undefined ? String(o.abonnement_mensuel) : "",
            taux: o.taux_prelevement !== null && o.taux_prelevement !== undefined ? String(o.taux_prelevement) : "",
            redevance: o.plancher_stagiaire !== null && o.plancher_stagiaire !== undefined ? String(o.plancher_stagiaire) : "",
            apport: o.taux_apport !== null && o.taux_apport !== undefined ? String(o.taux_apport) : "",
            telephone: o.telephone || "",
            siret: o.siret || "",
            numero_da: o.numero_da || "",
            numero_tva: o.numero_tva || "",
            adresse: o.adresse || "",
            certificateur: o.certificateur || "",
            notes: o.notes || "",
          };
        }
        setFiche(f);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (!raison.trim() || !emailContact.trim()) return;
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raison_sociale: raison,
          email_contact: emailContact,
          siret: siret,
          numero_da: numeroDa,
          telephone: telephone,
          qualiopi: qualiopi,
          offre: offreNeuve,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Client cree. Completez sa fiche avant d editer son bon de commande.");
        setRaison(""); setEmailContact(""); setSiret(""); setNumeroDa("");
        setTelephone(""); setQualiopi(false); setOffreNeuve("pack");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Creation impossible.");
      }
    } catch (e: any) {
      setErreur("Creation impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Fiche enregistree.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
  };

  const LIEN: any = {
    color: "#c8a96e",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid rgba(200,169,110,0.35)",
    padding: "6px 14px",
    borderRadius: "20px",
  };

  function champ(id: string, cle: string) {
    return (fiche[id] && fiche[id][cle]) || "";
  }

  function poser(id: string, cle: string, valeur: any) {
    setFiche({ ...fiche, [id]: { ...(fiche[id] || {}), [cle]: valeur } });
  }

  function nomOffre(cle: string) {
    const o = OFFRES.filter(function (x) { return x.cle === cle; })[0];
    return o ? o.nom : cle;
  }

  const actifs = organismes.filter(function (o) { return o.statut === "actif"; }).length;
  const totalStagiaires = organismes.reduce(function (s: number, o: any) { return s + (o.stagiaires || 0); }, 0);

  const PORTES = [
    ["/admin/facturation", "Facturation"],
    ["/admin/bon-commande", "Bon de commande"],
    ["/admin/contrats", "Contrats"],
    ["/admin/modeles", "Modeles"],
    ["/admin/coffre", "Coffre"],
    ["/admin/usage-ia", "Ce que l IA coute"],
    ["/admin/domaines", "Domaines"],
    ["/admin/telechargements", "Telechargements"],
    ["/admin/diagnostic", "Diagnostic"],
  ];

  // Le selecteur d offre, partage par le formulaire de creation et la fiche.
  function choixOffre(valeur: string, surChoix: any) {
    return (
      <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "14px" }}>
        {OFFRES.map(function (o) {
          const actif = valeur === o.cle;
          return (
            <div
              key={o.cle}
              onClick={() => surChoix(o.cle)}
              style={{
                flex: "1 1 190px", cursor: "pointer", borderRadius: "9px", padding: "12px 14px",
                background: actif ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)",
                border: actif ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.8)", fontSize: "14.5px", fontWeight: "bold" }}>
                {o.nom}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "3px" }}>
                {o.detail}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          CLIENTS B2B
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Organismes et entreprises clientes</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {organismes.length} client(s) · {actifs} actif(s) · {totalStagiaires} stagiaire(s)
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "24px 0" }}>
          {PORTES.map(function (p: any) {
            return (
              <a key={p[0]} href={p[0]} style={{ ...LIEN, fontSize: "14px", padding: "11px 20px" }}>
                {p[1]} →
              </a>
            );
          })}
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "11px 22px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
          >
            {formulaire ? "Annuler" : "Ouvrir un compte client"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 16px" }}>Nouveau client</h2>

            <span style={LIBELLE}>Offre souscrite</span>
            {choixOffre(offreNeuve, setOffreNeuve)}

            <span style={LIBELLE}>Raison sociale</span>
            <input value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Formation Conseil SARL" style={CHAMP} />

            <span style={LIBELLE}>Email de contact</span>
            <input value={emailContact} onChange={(e) => setEmailContact(e.target.value)} placeholder="direction@exemple.fr" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>SIRET</span>
                <input value={siret} onChange={(e) => setSiret(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Numero de declaration</span>
                <input value={numeroDa} onChange={(e) => setNumeroDa(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Telephone</span>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div
              onClick={() => setQualiopi(!qualiopi)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: qualiopi ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: qualiopi ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "14px" }}
            >
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: qualiopi ? "#c8a96e" : "transparent", border: qualiopi ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {qualiopi ? "✓" : ""}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>Deja certifie Qualiopi</span>
            </div>

            <button
              onClick={creer}
              disabled={occupe || !raison.trim() || !emailContact.trim()}
              style={{ background: occupe || !raison.trim() || !emailContact.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !raison.trim() || !emailContact.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Creation..." : "Ouvrir le compte"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p></div>
        ) : organismes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun client pour le moment.
            </p>
          </div>
        ) : (
          organismes.map(function (o) {
            const estOuvert = ouvert[o.id] === true;
            const pretAContracter = !!o.abonnement_mensuel && !!o.email_contact;
            const offreFiche = (fiche[o.id] && fiche[o.id].offre) || o.offre || "pack";
            const auPoste = offreFiche === "crm";
            const avecCatalogue = offreFiche === "pack";
            const postes = Math.max(1, Number(champ(o.id, "utilisateurs")) || 1);
            const unitaire = Number(champ(o.id, "abonnement")) || 0;

            return (
              <div key={o.id} style={{ ...CARTE, border: pretAContracter ? CARTE.border : "1px solid rgba(232,163,61,0.45)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px" }}>{o.raison_sociale}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 4px" }}>{o.email_contact}</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      <span style={{ color: "#c8a96e" }}>{nomOffre(o.offre || "pack")}</span>
                      {" · "}
                      {o.abonnement_mensuel
                        ? ((o.offre === "crm")
                            ? o.abonnement_mensuel + " EUR x " + (o.nb_utilisateurs || 1) + " poste(s) = "
                              + (Number(o.abonnement_mensuel) * (Number(o.nb_utilisateurs) || 1)).toLocaleString("fr-FR") + " EUR/mois"
                            : o.abonnement_mensuel + " EUR/mois")
                        : "abonnement non fixe"}
                      {o.offre === "pack"
                        ? " · " + (o.taux_prelevement !== null && o.taux_prelevement !== undefined ? o.taux_prelevement : 40) + " %"
                        : ""}
                      {o.offre === "pack"
                        ? " + " + (o.plancher_stagiaire !== null && o.plancher_stagiaire !== undefined ? o.plancher_stagiaire : 30) + " EUR par stagiaire"
                        : ""}
                      {o.numero_tva ? "" : " · TVA manquante"}
                      {o.domaine ? " · " + o.domaine : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 2px" }}>{o.stagiaires}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                      stagiaire(s) · {o.formations_ouvertes} formation(s)
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "16px", flexWrap: "wrap" }}>
                  <span style={{ background: o.statut === "actif" ? "rgba(76,175,80,0.18)" : "rgba(232,131,106,0.18)", color: o.statut === "actif" ? "#4caf50" : "#e8836a", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                    {o.statut}
                  </span>

                  <button
                    onClick={() => setOuvert({ ...ouvert, [o.id]: !estOuvert })}
                    style={{ ...LIEN, background: "none", cursor: "pointer", fontFamily: "Georgia,serif" }}
                  >
                    {estOuvert ? "Fermer la fiche" : "Sa fiche"}
                  </button>

                  <a href={"/organisme/catalogue?tenant=" + o.tenant_id} style={LIEN}>Son catalogue</a>
                  <a href={"/organisme/stagiaires?tenant=" + o.tenant_id} style={LIEN}>Ses stagiaires</a>
                  <a href={"/organisme?tenant=" + o.tenant_id} style={LIEN}>Son espace</a>

                  <button
                    onClick={() => modifier(o.id, { statut: o.statut === "actif" ? "suspendu" : "actif" })}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                  >
                    {o.statut === "actif" ? "Suspendre" : "Reactiver"}
                  </button>
                </div>

                {estOuvert && (
                  <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <h4 style={{ color: "#c8a96e", fontSize: "15px", margin: "0 0 12px" }}>Offre souscrite</h4>
                    {choixOffre(offreFiche, function (v: string) { poser(o.id, "offre", v); })}

                    <h4 style={{ color: "#c8a96e", fontSize: "15px", margin: "14px 0" }}>Termes du contrat</h4>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 170px" }}>
                        <span style={LIBELLE}>
                          {auPoste ? "Prix PAR UTILISATEUR (EUR)" : "Abonnement mensuel (EUR)"}
                        </span>
                        <input
                          value={champ(o.id, "abonnement")}
                          onChange={(e) => poser(o.id, "abonnement", e.target.value)}
                          placeholder={auPoste ? "35" : (offreFiche === "lms" ? "290" : "390")}
                          style={{ ...CHAMP, borderColor: auPoste ? "rgba(68,138,255,0.5)" : CHAMP.border }}
                        />
                      </div>

                      {auPoste && (
                        <div style={{ flex: "1 1 150px" }}>
                          <span style={LIBELLE}>Nombre d utilisateurs</span>
                          <input
                            value={champ(o.id, "utilisateurs")}
                            onChange={(e) => poser(o.id, "utilisateurs", e.target.value)}
                            placeholder="1"
                            style={{ ...CHAMP, borderColor: "rgba(68,138,255,0.5)" }}
                          />
                        </div>
                      )}

                      {avecCatalogue && (
                        <>
                          <div style={{ flex: "1 1 130px" }}>
                            <span style={LIBELLE}>Part catalogue (%)</span>
                            <input value={champ(o.id, "taux")} onChange={(e) => poser(o.id, "taux", e.target.value)} placeholder="40" style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 170px" }}>
                            <span style={LIBELLE}>Redevance par stagiaire (EUR)</span>
                            <input value={champ(o.id, "redevance")} onChange={(e) => poser(o.id, "redevance", e.target.value)} placeholder="30" style={CHAMP} />
                          </div>
                          <div style={{ flex: "1 1 150px" }}>
                            <span style={LIBELLE}>Apport d affaires (%)</span>
                            <input value={champ(o.id, "apport")} onChange={(e) => poser(o.id, "apport", e.target.value)} placeholder="50" style={CHAMP} />
                          </div>
                        </>
                      )}
                    </div>

                    {auPoste && (
                      <div style={{ background: "rgba(68,138,255,0.09)", border: "1px solid rgba(68,138,255,0.35)", borderRadius: "8px", padding: "13px 15px", marginBottom: "14px" }}>
                        <p style={{ color: "#448aff", fontSize: "13.5px", margin: "0 0 4px", fontWeight: "bold" }}>
                          Le champ ci-dessus porte le prix PAR POSTE, pas le total.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", margin: 0, lineHeight: "1.7" }}>
                          {unitaire > 0
                            ? unitaire.toLocaleString("fr-FR") + " EUR x " + postes + " poste(s) = "
                              + (unitaire * postes).toLocaleString("fr-FR") + " EUR HT par mois sur le bon de commande."
                            : "Saisissez 35 pour le tarif arrete. Le bon de commande multipliera par le nombre d utilisateurs."}
                        </p>
                      </div>
                    )}

                    {/* LA PART ET LA REDEVANCE S'ADDITIONNENT — le rappeler ici
                        evite de refaire le calcul de tete a chaque fiche. */}
                    {avecCatalogue && (
                      <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "13px 15px", marginBottom: "14px" }}>
                        <p style={{ color: "#c8a96e", fontSize: "13.5px", margin: "0 0 4px", fontWeight: "bold" }}>
                          La part et la redevance s additionnent.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", margin: 0, lineHeight: "1.7" }}>
                          Pour chaque stagiaire inscrit, le client verse le pourcentage du prix de
                          vente ET la redevance. Sur une formation vendue 600 EUR :{" "}
                          {(Number(champ(o.id, "taux")) || 40)} % font{" "}
                          {Math.round(600 * (Number(champ(o.id, "taux")) || 40)) / 100} EUR, plus{" "}
                          {Number(champ(o.id, "redevance")) || 30} EUR de redevance ={" "}
                          <strong style={{ color: "#c8a96e" }}>
                            {Math.round(600 * (Number(champ(o.id, "taux")) || 40)) / 100 + (Number(champ(o.id, "redevance")) || 30)} EUR
                          </strong>{" "}
                          par stagiaire. La gestion administrative est comprise, bilan pedagogique
                          et financier annuel inclus.
                        </p>
                      </div>
                    )}

                    {!avecCatalogue && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-4px 0 14px", lineHeight: "1.6" }}>
                        Sans le catalogue de l Editeur, il n y a ni part sur les ventes ni redevance
                        par stagiaire : ces champs disparaissent du bon de commande.
                      </p>
                    )}

                    <h4 style={{ color: "#c8a96e", fontSize: "15px", margin: "14px 0" }}>Identification</h4>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 170px" }}>
                        <span style={LIBELLE}>SIRET</span>
                        <input value={champ(o.id, "siret")} onChange={(e) => poser(o.id, "siret", e.target.value)} style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 170px" }}>
                        <span style={LIBELLE}>Numero de declaration</span>
                        <input value={champ(o.id, "numero_da")} onChange={(e) => poser(o.id, "numero_da", e.target.value)} style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 170px" }}>
                        <span style={LIBELLE}>TVA intracommunautaire</span>
                        <input value={champ(o.id, "numero_tva")} onChange={(e) => poser(o.id, "numero_tva", e.target.value)} placeholder="FR12345678901" style={CHAMP} />
                      </div>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-6px 0 14px", lineHeight: "1.6" }}>
                      Sans numero de TVA, l autoliquidation ne tient pas.
                    </p>

                    <span style={LIBELLE}>Adresse</span>
                    <input value={champ(o.id, "adresse")} onChange={(e) => poser(o.id, "adresse", e.target.value)} style={CHAMP} />

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Telephone</span>
                        <input value={champ(o.id, "telephone")} onChange={(e) => poser(o.id, "telephone", e.target.value)} style={CHAMP} />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIBELLE}>Certificateur</span>
                        <input value={champ(o.id, "certificateur")} onChange={(e) => poser(o.id, "certificateur", e.target.value)} placeholder="AFNOR, ICPF..." style={CHAMP} />
                      </div>
                    </div>

                    <span style={LIBELLE}>Notes internes</span>
                    <textarea value={champ(o.id, "notes")} onChange={(e) => poser(o.id, "notes", e.target.value)} rows={3} style={CHAMP} />

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => modifier(o.id, {
                          offre: offreFiche,
                          nb_utilisateurs: champ(o.id, "utilisateurs"),
                          abonnement_mensuel: champ(o.id, "abonnement"),
                          taux_prelevement: champ(o.id, "taux"),
                          plancher_stagiaire: champ(o.id, "redevance"),
                          taux_apport: champ(o.id, "apport"),
                          siret: champ(o.id, "siret"),
                          numero_da: champ(o.id, "numero_da"),
                          numero_tva: champ(o.id, "numero_tva"),
                          telephone: champ(o.id, "telephone"),
                          adresse: champ(o.id, "adresse"),
                          certificateur: champ(o.id, "certificateur"),
                          notes: champ(o.id, "notes"),
                        })}
                        style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                      >
                        Enregistrer la fiche
                      </button>

                      <a href="/admin/bon-commande" style={{ ...LIEN, padding: "13px 26px", fontSize: "15px" }}>
                        Son bon de commande →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
