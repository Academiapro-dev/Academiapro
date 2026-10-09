"use client";
import { useState, useEffect } from "react";
import Guide from "../../../../components/Guide";

// 🆕 « ÉTABLIR LA LIASSE » AJOUTEE LE 27/08.
//
// Elle vient EN TETE du groupe, et c est voulu : c est le point de depart.
// On etablit la liasse, on la relit, puis on la teletransmet. Les trois
// formulaires 2033, 2050 et 2065 sont des vues de detail, pas des portes
// d entree.
//
// ⚠️ LES ADRESSES RESTENT EN « compliance » DANS LE CODE. C est le
// middleware qui les transforme en /admin/comptable/... pour le cabinet.
// Ne pas les reecrire ici : la reecriture se fait en un seul endroit.
// 🆕🚨 28/09 — LA PAIE A SA FAMILLE ET SON RACCOURCI.
//
// Jacques : « j aimerais ne pas etre oblige de passer par un URL pour
// arriver a la paye […] les boutons sur l ecran d accueil doivent etre fait
// pour ca ». L ecran des bulletins (calcul, validation, recapitulatif
// client) n avait AUCUNE porte dans l espace du cabinet : il ne s ouvrait
// qu a /admin/paie, en tapant l adresse, avec la cle d administration.
// Il s ouvre desormais a /admin/compliance/bulletins-paie, avec la
// connexion du cabinet.
// ⚠️ DEUX PORTES « PAIE » PRETAIENT A CONFUSION : celle qui existait
// (/admin/compliance/paie, dans « Le cabinet ») passe l ECRITURE COMPTABLE
// d une paie deja faite. Elle s appelle desormais « Écriture de paie » et
// rejoint la famille Paie, a cote des bulletins.
// 🆕 28/09 (lot 2) — LA DSN A SA PORTE : son ecran s ouvre desormais avec la
// connexion du cabinet, a /admin/compliance/dsn.
const OUTILS = [
  { titre: "Tenue", liens: [
    { nom: "Saisie", href: "/admin/compliance/saisie" },
    { nom: "Plan comptable", href: "/admin/compliance/comptes" },
    { nom: "Balance", href: "/admin/compliance/balance" },
    { nom: "Lettrage", href: "/admin/compliance/lettrage" },
    { nom: "Factures et justificatifs", href: "/admin/compliance/pieces" },
    { nom: "Espaces clients", href: "/admin/compliance/acces-clients" },
    { nom: "Reprise d'un dossier", href: "/admin/compliance/reprise" },
  ]},
  { titre: "Paie", liens: [
    { nom: "Bulletins de paie", href: "/admin/compliance/bulletins-paie" },
    { nom: "DSN", href: "/admin/compliance/dsn" },
    { nom: "Écriture de paie", href: "/admin/compliance/paie" },
  ]},
  { titre: "Banque et TVA", liens: [
    { nom: "Relevés", href: "/admin/compliance/releve" },
    { nom: "Rapprochement", href: "/admin/compliance/rapprochement" },
    { nom: "TVA", href: "/admin/compliance/tva" },
    { nom: "DAS2", href: "/admin/compliance/das2" },
  ]},
  { titre: "Clôture", liens: [
    { nom: "Révision", href: "/admin/compliance/revision" },
    { nom: "Immobilisations", href: "/admin/compliance/immobilisations" },
    { nom: "Provisions", href: "/admin/compliance/provisions" },
    { nom: "Clôture", href: "/admin/compliance/cloture" },
    { nom: "Verrouillage", href: "/admin/compliance/verrouillage" },
    { nom: "Annexes", href: "/admin/compliance/annexes" },
    // 🆕 09/09 : les comptes annuels presentes.
    { nom: "Plaquette", href: "/admin/compliance/plaquette" },
  ]},
  { titre: "Liasse fiscale", liens: [
    { nom: "Établir la liasse", href: "/admin/compliance/liasse" },
    { nom: "Liasse 2033", href: "/admin/compliance/liasse-2033" },
    { nom: "Liasse 2050", href: "/admin/compliance/liasse-2050" },
    { nom: "Liasse 2065", href: "/admin/compliance/liasse-2065" },
    // 🆕 09/09 : BNC, declaration controlee.
    { nom: "Liasse 2035", href: "/admin/compliance/liasse-2035" },
    { nom: "Télétransmissions", href: "/admin/compliance/teledec" },
  ]},
  { titre: "Le cabinet", liens: [
    { nom: "Mes dossiers", href: "/admin/compliance/societes" },
    { nom: "CRM et relances", href: "/admin/compliance/crm" },
    { nom: "Ma société", href: "/admin/compliance/ma-societe" },
    { nom: "Mes collaborateurs", href: "/admin/compliance/collaborateurs" },
    // 🆕 09/09 : deux portes de gestion interne du cabinet.
    { nom: "Lettres de mission", href: "/admin/compliance/lettres-mission" },
    // 🆕 09/10 : la creation d une societe francaise (EURL, SARL, SASU, SAS, SCI).
    { nom: "Création de société", href: "/admin/compliance/creation-societe" },
    { nom: "Temps passés", href: "/admin/compliance/temps" },
    // 🆕 08/10 : trois ecrans qui n avaient aucune porte dans les menus.
    { nom: "Devis et factures", href: "/admin/compliance/facturation" },
    { nom: "Facturation récurrente", href: "/admin/compliance/recurrente" },
    { nom: "Prévisionnel de trésorerie", href: "/admin/compliance/tresorerie" },
    { nom: "Conformité internationale", href: "/admin/compliance" },
  ]},
  // 🆕 09/10 : les deux textes que le cabinet et ses clients acceptent, a
  // portee de main (demande de Jacques). Ce sont les pages publiques : le
  // cabinet peut en donner l adresse a un client.
  { titre: "Conditions générales", liens: [
    { nom: "Conditions générales de vente", href: "/comptable/cgv" },
    { nom: "Conditions — création de société", href: "/comptable/conditions-creation-societe" },
  ]},
];

export default function PageTableauDeBord() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  // 🆕 28/09 — PASSER D UN CABINET A L AUTRE. Le selecteur ne s affiche que
  // pour qui appartient a plusieurs cabinets (collaborateur partage,
  // production de paie en sous-traitance).
  const [cabinets, setCabinets] = useState<any>(null);
  const [changement, setChangement] = useState(false);

  useEffect(function () {
    fetch("/api/auth/cabinet", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (x) { if (x && x.ok) setCabinets(x); })
      .catch(function () {});
  }, []);

  async function changerDeCabinet(tenantId: string) {
    if (!tenantId || !cabinets || tenantId === cabinets.courant) return;
    setChangement(true); setErreur("");
    try {
      const r = await fetch("/api/auth/cabinet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const x = await r.json();
      if (x && x.ok) { window.location.reload(); return; }
      setErreur((x && x.erreur) || "Changement impossible.");
    } catch (e: any) {
      setErreur("Changement impossible : " + String(e));
    }
    setChangement(false);
  }

  useEffect(function () {
    (async function () {
      setChargement(true);
      try {
        const r = await fetch("/api/compliance/tableau-de-bord");
        const data = await r.json();
        if (data.ok) setD(data);
        else setErreur(data.erreur || "Lecture impossible.");
      } catch (e: any) {
        setErreur("Lecture impossible : " + String(e));
      }
      setChargement(false);
    })();
  }, []);

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const LIEN: any = { color: "#c8a96e", fontSize: "12.5px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.35)", padding: "6px 13px", borderRadius: "20px" };

  // Les acces generaux sont des CARTES, pas des pastilles : une pastille se
  // lit comme une etiquette, une carte se lit comme une porte.
  const PORTE: any = {
    display: "block",
    background: "rgba(200,169,110,0.07)",
    border: "1px solid rgba(200,169,110,0.35)",
    borderRadius: "12px",
    padding: "18px 20px",
    color: "#c8a96e",
    textDecoration: "none",
    fontSize: "15.5px",
    fontWeight: "bold",
  };

  // LES TROIS GESTES DU QUOTIDIEN, EN HAUT DE PAGE.
  //
  // Un comptable ouvre son logiciel pour saisir, deposer une piece, ou
  // regarder ses chiffres. Le faire descendre jusqu a « Tous les outils »
  // pour cela, c est lui faire perdre du temps trente fois par jour.
  //
  // ⚠️ LE CRM N EST PAS ICI, ET C EST VOLONTAIRE. Il figure desormais dans
  // la barre de navigation, visible depuis TOUS les ecrans du cabinet. Le
  // repeter en raccourci faisait doublon a l ecran — deux boutons cote a
  // cote menant au meme endroit.
  const RACCOURCIS = [
    { nom: "Les chiffres", href: "/admin/compliance/chiffres" },
    { nom: "Déposer une facture", href: "/admin/compliance/pieces" },
    { nom: "Saisir une écriture", href: "/admin/compliance/saisie" },
    // 🆕 28/09 — la paie du mois, sans taper d adresse.
    { nom: "Faire la paie", href: "/admin/compliance/bulletins-paie" },
  ];

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function Compteur({ valeur, texte, couleur }: any) {
    return (
      <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0, border: valeur > 0 && couleur ? "1px solid " + couleur + "80" : CARTE.border }}>
        <p style={{ color: valeur > 0 && couleur ? couleur : "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
          {valeur}
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>{texte}</p>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Les dossiers
        </a>

        {/* 🆕 28/09 — le cabinet ouvert, et le passage a un autre. */}
        {cabinets && cabinets.cabinets && cabinets.cabinets.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            margin: "18px 0 0", padding: "10px 14px", borderRadius: "10px",
            border: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.06)" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Cabinet :</span>
            <select value={cabinets.courant || ""} disabled={changement}
              onChange={(e) => changerDeCabinet(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.4)",
                background: "#050508", color: "#fff", fontSize: "14px", fontFamily: "Georgia, serif" }}>
              {cabinets.cabinets.map(function (c: any) {
                return <option key={c.tenant_id} value={c.tenant_id}>{c.nom}</option>;
              })}
            </select>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
              {changement ? "ouverture…" : "choisissez un autre cabinet pour y travailler"}
            </span>
          </div>
        )}

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Vos dossiers</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 22px" }}>
          Classés du plus urgent au plus calme
        </p>

        <Guide ecran="comptable.dossiers" />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "0 0 4px" }}>
          {RACCOURCIS.map(function (r) {
            return (
              <a
                key={r.href}
                href={r.href}
                style={{
                  background: "#c8a96e",
                  color: "#050508",
                  padding: "13px 22px",
                  borderRadius: "9px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "14.5px",
                }}
              >
                {r.nom}
              </a>
            );
          })}
        </div>

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Analyse des dossiers…</p>
          </div>
        ) : !d ? null : d.total === 0 ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun dossier actif. Ouvrez-en un pour commencer.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
              <Compteur valeur={d.total} texte={d.total > 1 ? "Dossiers" : "Dossier"} />
              <Compteur valeur={d.desequilibres} texte={d.desequilibres > 1 ? "Déséquilibres" : "Déséquilibre"} couleur="#e8836a" />
              <Compteur valeur={d.tva_a_liquider} texte="TVA à liquider" couleur="#e8a33d" />
              <Compteur valeur={d.banque_a_rapprocher} texte="Banque à rapprocher" couleur="#e8a33d" />
              <Compteur valeur={d.dormants} texte={d.dormants > 1 ? "Dossiers dormants" : "Dossier dormant"} couleur="#c8a96e" />
            </div>

            {d.alertes === 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15.5px", margin: 0, lineHeight: "1.8" }}>
                  Rien ne réclame votre attention.{" "}
                  {d.total > 1 ? "Les " + d.total + " dossiers sont équilibrés" : "Le dossier est équilibré"}, la
                  banque est rapprochée et la TVA du mois est traitée.
                </p>
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.75" }}>
                {d.alertes > 1
                  ? d.alertes + " dossiers demandent une intervention, du plus urgent au moins urgent."
                  : "Un dossier demande une intervention."}
              </p>
            )}

            {d.dossiers.map(function (s: any) {
              const q = "?societe_id=" + s.id;
              const grave = !s.equilibre && s.lignes > 0;

              // Le pays vient de la fiche du dossier. Un SIREN ne se reclame
              // qu a une societe francaise, et l en-tete doit dire la meme
              // chose que la liste des motifs juste en dessous.
              const francais = s.francais !== undefined
                ? s.francais === true
                : String(s.pays || "FR").toUpperCase() === "FR";

              const bordure = grave
                ? "1px solid rgba(232,131,106,0.55)"
                : s.priorite >= 20
                  ? "1px solid rgba(232,163,61,0.45)"
                  : s.priorite > 0
                    ? CARTE.border
                    : "1px solid rgba(76,175,80,0.3)";

              return (
                <div key={s.id} style={{ ...CARTE, border: bordure }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ flex: "1 1 280px" }}>
                      <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                        {s.code}
                        {!francais ? " · " + String(s.pays || "").toUpperCase() : ""}
                        {s.siren
                          ? " · SIREN " + s.siren
                          : (francais ? " · SIREN manquant" : "")}
                        {s.derniere_ecriture
                          ? " · dernière écriture le " + new Date(s.derniere_ecriture).toLocaleDateString("fr-FR")
                          : " · aucune écriture"}
                      </p>
                      <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.raison_sociale}</h3>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                        {s.lignes} {s.lignes > 1 ? "lignes" : "ligne"} d'écriture
                        {s.provisions > 0 ? " · " + euros(s.provisions) + " provisionnés" : ""}
                        {s.tva_due > 0 ? " · TVA du mois " + euros(s.tva_due) : ""}
                      </p>
                    </div>
                    {s.priorite === 0 && (
                      <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "bold" }}>À jour</span>
                    )}
                  </div>

                  {s.raisons.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      {s.raisons.map(function (r: string, i: number) {
                        return (
                          <p key={i} style={{ color: i === 0 && grave ? "#e8836a" : "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.7" }}>
                            · {r}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "14px" }}>
                    <a href={"/admin/compliance/chiffres?societe_id=" + s.id} style={LIEN}>Ses chiffres</a>
                    <a href={"/admin/compliance/revision" + q} style={LIEN}>Réviser</a>
                    {!s.equilibre && s.lignes > 0 && (
                      <a href={"/admin/compliance/balance" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Chercher l'écart
                      </a>
                    )}
                    {s.releves_ouverts > 0 && (
                      <a href={"/admin/compliance/rapprochement" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Rapprocher
                      </a>
                    )}
                    {s.tva_a_liquider && (
                      <a href={"/admin/compliance/tva" + q} style={{ ...LIEN, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                        Liquider la TVA
                      </a>
                    )}
                    {s.ecritures_sans_piece > 0 && (
                      <a href={"/admin/compliance/pieces" + q} style={LIEN}>Déposer les factures</a>
                    )}
                    <a href={"/admin/compliance/saisie" + q} style={LIEN}>Saisir</a>
                  </div>
                </div>
              );
            })}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                L'ordre suit l'urgence comptable : un déséquilibre passe avant une TVA, une TVA
                avant un rapprochement, un rapprochement avant une pièce manquante. Un dossier
                dormant remonte aussi, parce qu'un client qu'on oublie est un client qui part.
              </p>
            </div>
          </>
        )}

        <h2 style={{ color: "#c8a96e", fontSize: "20px", letterSpacing: "2px", margin: "52px 0 6px", textTransform: "uppercase" }}>
          Tous les outils
        </h2>
        <div style={{ height: "2px", background: "rgba(200,169,110,0.35)", marginBottom: "28px" }} />

        {OUTILS.map(function (g) {
          return (
            <div key={g.titre} style={{ marginBottom: "40px" }}>
              {/* Le titre de groupe doit se voir. En seize pixels sans graisse,
                  il se noyait entre les cartes et personne ne comprenait ce
                  que ces boutons faisaient ensemble. */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "0 0 16px" }}>
                <h3 style={{ color: "#fff", fontSize: "22px", margin: 0, fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {g.titre}
                </h3>
                <div style={{ flex: 1, height: "1px", background: "rgba(200,169,110,0.22)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px" }}>
                {g.liens.map(function (l) {
                  return (
                    <a key={l.href} href={l.href} style={PORTE}>
                      {l.nom} <span style={{ float: "right", opacity: 0.7 }}>→</span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
