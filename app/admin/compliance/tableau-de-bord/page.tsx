"use client";
import { useState, useEffect } from "react";

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
  ]},
  { titre: "Liasse fiscale", liens: [
    { nom: "Liasse 2033", href: "/admin/compliance/liasse-2033" },
    { nom: "Liasse 2050", href: "/admin/compliance/liasse-2050" },
    { nom: "Liasse 2065", href: "/admin/compliance/liasse-2065" },
    { nom: "Télétransmissions", href: "/admin/compliance/teledec" },
  ]},
  { titre: "Le cabinet", liens: [
    { nom: "Mes dossiers", href: "/admin/compliance/societes" },
    { nom: "Ma société", href: "/admin/compliance/ma-societe" },
    { nom: "Mes collaborateurs", href: "/admin/compliance/collaborateurs" },
    { nom: "Paie", href: "/admin/compliance/paie" },
    { nom: "Conformité internationale", href: "/admin/compliance" },
  ]},
];

export default function PageTableauDeBord() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

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
  // regarder un dossier. Le faire descendre jusqu a « Tous les outils »
  // pour cela, c est lui faire perdre du temps trente fois par jour.
  const RACCOURCIS = [
    { nom: "Déposer une facture", href: "/admin/compliance/pieces" },
    { nom: "Saisir une écriture", href: "/admin/compliance/saisie" },
    { nom: "Ouvrir un dossier", href: "/admin/compliance/societes" },
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

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Vos dossiers</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Classés du plus urgent au plus calme
        </p>

        {/* Les trois gestes du quotidien, avant tout le reste. */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "22px 0 0" }}>
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
              <Compteur valeur={d.total} texte="Dossier(s)" />
              <Compteur valeur={d.desequilibres} texte="Déséquilibre(s)" couleur="#e8836a" />
              <Compteur valeur={d.tva_a_liquider} texte="TVA à liquider" couleur="#e8a33d" />
              <Compteur valeur={d.banque_a_rapprocher} texte="Banque à rapprocher" couleur="#e8a33d" />
              <Compteur valeur={d.dormants} texte="Dossier(s) dormant(s)" couleur="#c8a96e" />
            </div>

            {d.alertes === 0 ? (
              <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)" }}>
                <p style={{ color: "#4caf50", fontSize: "15.5px", margin: 0, lineHeight: "1.8" }}>
                  Rien ne réclame votre attention. Les {d.total} dossier(s) sont équilibrés, la
                  banque est rapprochée et la TVA du mois est traitée.
                </p>
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.75" }}>
                {d.alertes} dossier(s) demandent une intervention, du plus urgent au moins urgent.
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
                        {s.lignes} ligne(s) d'écriture
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
            <div key={g.titre} style={{ marginBottom: "34px" }}>
              <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 14px", fontWeight: "normal" }}>{g.titre}</h3>
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
