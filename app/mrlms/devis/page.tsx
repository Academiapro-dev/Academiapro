"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LE FORMULAIRE DE DEVIS MR LMS — 03/09.
//
// LE PROSPECT REMPLIT SES PROPRES INFORMATIONS. Personne ne recopie une
// raison sociale ni un SIRET : celui qui les connait est celui qui les
// saisit, et il ne se trompe pas sur son propre nom.
//
// 🚨 CETTE PAGE N EST ATTEIGNABLE QUE PAR UN LIEN A JETON, envoye apres
// l echange. C est ce qui permet d y afficher des prix sans les rendre
// publics : la doctrine interdit un tarif en vitrine, pas un tarif donne
// apres l echange.
//
// 🚨 AUCUN MONTANT N EST ECRIT DANS CE FICHIER. Tout vient de la route, qui
// le lit dans `lms_tarifs`. Le jour ou un prix change en base, ce formulaire
// le porte sans etre touche.
//
// ⚠️ LE CALCUL AFFICHE ICI EST CELUI QUE LA ROUTE RENVOIE, jamais un calcul
// refait cote navigateur. Deux calculs pour un meme devis finissent
// toujours par diverger, et c est le client qui le decouvre.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";

const CADRE: any = {
  minHeight: "100vh",
  background: FOND,
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "0 0 60px",
};

const SECTION: any = {
  maxWidth: "820px",
  margin: "0 auto",
  padding: "0 22px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "14px",
  padding: "24px 26px",
  marginBottom: "18px",
};

const CHAMP: any = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(200,169,110,0.28)",
  borderRadius: "8px",
  padding: "11px 13px",
  color: "#fff",
  fontSize: "15px",
  fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};

const ETIQUETTE: any = {
  display: "block",
  color: "rgba(255,255,255,0.6)",
  fontSize: "13px",
  margin: "0 0 6px",
};

const PLEIN: any = {
  background: "linear-gradient(135deg,#c8a96e,#a07840)",
  color: FOND,
  border: "none",
  padding: "14px 30px",
  borderRadius: "9px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  fontFamily: "Georgia,serif",
};

// 🚨 « 147,50 € » ET NON « 147,5 € » — 03/09. toLocaleString coupe le zero
// final : sur un devis, un montant ampute d une decimale se remarque.
// Les montants ronds restent sans decimale, ceux qui en ont en portent deux.
function euros(n: any) {
  const v = Number(n) || 0;
  const entier = Math.round(v * 100) % 100 === 0;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  }) + " €";
}

// 🚨 « 1er », PAS « 1e ». Les bornes des paliers se construisent a partir
// d un nombre ; en francais, le premier est le seul a ne pas prendre « e ».
// Le devis affichait « du 1e au 10e » — une faute sur le premier mot que
// lit un prospect qui compare des offres.
function ordinal(n: number): string {
  return n === 1 ? "1er" : String(n) + "e";
}

// Les champs de la fiche, dans l ordre ou on les remplit. `obligatoire`
// n est vrai que pour ce sans quoi un devis n a pas de destinataire.
const CHAMPS = [
  { cle: "raison_sociale", libelle: "Raison sociale", obligatoire: true, large: true },
  { cle: "contact_nom", libelle: "Votre nom", obligatoire: true },
  { cle: "contact_email", libelle: "Adresse électronique", obligatoire: true, type: "email" },
  { cle: "telephone", libelle: "Téléphone" },
  { cle: "adresse", libelle: "Adresse", large: true },
  { cle: "code_postal", libelle: "Code postal" },
  { cle: "ville", libelle: "Ville" },
  { cle: "pays", libelle: "Pays" },
  { cle: "siret", libelle: "SIRET" },
  { cle: "numero_da", libelle: "Numéro de déclaration d'activité" },
];

export default function PageDevisLMS() {
  const [jeton, setJeton] = useState("");
  const [f, setF] = useState<any>(null);
  const [tarifs, setTarifs] = useState<any>(null);
  const [devis, setDevis] = useState<any>(null);
  const [numero, setNumero] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    let j = "";
    try {
      j = new URLSearchParams(window.location.search).get("jeton") || "";
    } catch (e) {}
    setJeton(j);
    charger(j);
  }, []);

  async function charger(j: string) {
    setChargement(true);
    setErreur("");
    if (!j) {
      setErreur("Ce lien est incomplet. Demandez-nous-en un nouveau.");
      setChargement(false);
      return;
    }
    try {
      const r = await fetch("/api/lms/devis?jeton=" + encodeURIComponent(j));
      const d = await r.json();
      if (d.ok) {
        setF(d.prospect);
        setTarifs(d.tarifs);
        setNumero(d.prospect.numero_devis || "");
      } else {
        setErreur(d.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function modifier(cle: string, valeur: any) {
    setF(function (avant: any) {
      const apres = { ...avant, [cle]: valeur };
      // L OFFRE AVEC CATALOGUE COMPREND LES DEUX OPTIONS : les cases se
      // cochent d elles-memes et se verrouillent, pour que l ecran dise la
      // meme chose que le devis.
      if (cle === "offre" && valeur === "avec_catalogue") {
        apres.marque_blanche = true;
        apres.accompagnement_bpf = true;
      }
      return apres;
    });
    setDevis(null);
  }

  async function enregistrer() {
    setErreur("");

    for (const c of CHAMPS) {
      if (c.obligatoire && !String(f[c.cle] || "").trim()) {
        setErreur("Merci de renseigner : " + c.libelle + ".");
        return;
      }
    }

    setEnvoi(true);
    try {
      const r = await fetch("/api/lms/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, jeton: jeton }),
      });
      const d = await r.json();
      if (d.ok) {
        setDevis(d.devis);
        setNumero(d.numero_devis || "");
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setEnvoi(false);
  }

  function telecharger() {
    window.location.href = "/api/lms/devis/pdf?jeton=" + encodeURIComponent(jeton);
  }

  const g = tarifs && f ? tarifs[f.offre] : null;

  return (
    <div style={CADRE}>
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", background: "#000", marginBottom: "34px" }}>
        <div style={{ ...SECTION, padding: "10px 22px" }}>
          <img
            src="/mrlms-banniere.jpeg.png"
            alt="Mr LMS"
            style={{ width: "620px", maxWidth: "82vw", height: "auto", display: "block", margin: "-4px", clipPath: "inset(4px)" }}
          />
        </div>
      </header>

      <div style={SECTION}>
        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)", background: "rgba(232,131,106,0.07)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>{erreur}</p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : !f ? null : (
          <>
            {/* ---- LE DEVIS, QUAND IL EST CALCULE ---- */}
            {devis && (
              <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.55)", background: "rgba(200,169,110,0.05)" }}>
                <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
                  DEVIS {numero}
                </p>
                <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 18px" }}>
                  Votre proposition
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "8px 12px", fontSize: "15px", marginBottom: "16px" }}>
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>
                    Mise en place, une seule fois
                  </span>
                  <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                    {euros(devis.mise_en_place)}
                  </span>

                  <span style={{ color: "rgba(255,255,255,0.75)" }}>
                    Abonnement mensuel
                  </span>
                  <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                    {euros(devis.abonnement)}
                  </span>

                  {devis.marque_blanche_comprise ? (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>
                        Marque blanche · comprise dans cette offre
                      </span>
                      <span style={{ color: "#4caf50", textAlign: "right" }}>comprise</span>
                    </>
                  ) : devis.marque_blanche > 0 ? (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>
                        Marque blanche : votre nom, vos couleurs
                      </span>
                      <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                        {euros(devis.marque_blanche)}
                      </span>
                    </>
                  ) : null}

                  {devis.accompagnement_bpf_compris ? (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>
                        Accompagnement jusqu&apos;au bilan · compris
                      </span>
                      <span style={{ color: "#4caf50", textAlign: "right" }}>compris</span>
                    </>
                  ) : devis.accompagnement_bpf > 0 ? (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>
                        Accompagnement jusqu&apos;au bilan pédagogique et financier
                      </span>
                      <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                        {euros(devis.accompagnement_bpf)}
                      </span>
                    </>
                  ) : null}

                  {devis.part_catalogue > 0 && (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>
                        Part sur le chiffre d&apos;affaires réalisé sur le catalogue
                      </span>
                      <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                        {devis.part_catalogue} %
                      </span>
                    </>
                  )}
                </div>

                {/* 🚨 LA GRILLE COMPLETE, ET NON LE SEUL PALIER ATTEINT —
                    03/09. Constate en test : a dix stagiaires, une seule
                    ligne s affichait et RIEN NE DISAIT QUE LE PRIX BAISSE
                    ENSUITE. Un organisme qui compte grandir ne voyait pas
                    ce qu il gagnerait a le faire — c est pourtant l argument
                    le plus fort de la grille. Les paliers non atteints sont
                    montres en gris, celui qui s applique en clair. */}
                {devis.paliers && devis.paliers.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", marginBottom: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "0 0 10px" }}>
                      Stagiaire actif, par mois — le tarif baisse avec le nombre :
                    </p>
                    {devis.paliers.map(function (p: any, i: number) {
                      const utilise = devis.stagiaires >= p.min;
                      const borne = p.max === null
                        ? "au-delà du " + (p.min - 1) + "e"
                        : "du " + ordinal(p.min) + " au " + ordinal(p.max);
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", padding: "4px 0" }}>
                          <span style={{ color: utilise ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.35)" }}>
                            {borne}
                          </span>
                          <span style={{ color: utilise ? OR : "rgba(255,255,255,0.35)", textAlign: "right", fontWeight: utilise ? "bold" : "normal" }}>
                            {euros(p.prix)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ---- LA SIGNATURE ELECTRONIQUE ---- */}
                {/* 🚨 LE PRIX RESTE AFFICHE MEME QUAND LE LOT EST OFFERT —
                    03/09. « La signature est un cadeau, jamais un du. » Un
                    lot compris sans montant a cote ne se retient pas : le
                    prospect ne sait pas ce qu on lui donne, et l organisme
                    qui envisage de partir ne sait pas ce qu il perdrait. */}
                {devis.signature_unitaire > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", marginBottom: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "0 0 8px" }}>
                      Signature électronique :
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", padding: "3px 0" }}>
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>À l&apos;unité</span>
                      <span style={{ color: OR, textAlign: "right" }}>
                        {euros(devis.signature_unitaire)}
                      </span>
                    </div>

                    {devis.signature_lots && devis.signature_lots.map(function (l: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", padding: "3px 0" }}>
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>
                            Lot de {l.nombre} · {euros(l.unitaire)} l&apos;unité
                          </span>
                          <span style={{ color: OR, textAlign: "right" }}>{euros(l.prix)}</span>
                        </div>
                      );
                    })}

                    {devis.signatures_offertes > 0 && (
                      <div style={{ marginTop: "12px", padding: "12px 14px", background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.35)", borderRadius: "9px" }}>
                        <p style={{ color: "#4caf50", fontSize: "15px", margin: "0 0 5px", fontWeight: "bold" }}>
                          {devis.signatures_offertes} signatures comprises chaque année
                        </p>
                        {/* 🚨 PAS DE « VALEUR X € » — 03/09. Chiffrer le
                            cadeau le rapetisse : cinquante euros a cote d un
                            abonnement de deux cents ne pese rien. Le prix a
                            l unite et les lots sont juste au-dessus ; le
                            prospect fait le calcul s il le veut, et il le
                            fait a son avantage. */}
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: "1.7" }}>
                          Elles se renouvellent tant que votre offre est en cours. Au-delà,
                          les signatures sont facturées à l&apos;unité ou par lot.
                        </p>
                      </div>
                    )}

                    {devis.signatures_offertes === 0 && (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7" }}>
                        Avec l&apos;option marque blanche, cent signatures sont comprises chaque
                        année.
                      </p>
                    )}
                  </div>
                )}

                {devis.stagiaires_detail.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", marginBottom: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "0 0 8px" }}>
                      Pour {devis.stagiaires} stagiaire(s) actif(s) dans le mois :
                    </p>
                    {devis.stagiaires_detail.map(function (d: any, i: number) {
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", padding: "3px 0" }}>
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>
                            {d.nombre} × {euros(d.prix)} · {d.libelle}
                          </span>
                          <span style={{ color: OR, textAlign: "right" }}>{euros(d.montant)}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", paddingTop: "8px", marginTop: "5px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "rgba(255,255,255,0.78)" }}>Total stagiaires, par mois</span>
                      <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                        {euros(devis.stagiaires_total)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 🚨 LE COUT PAR STAGIAIRE, JAMAIS UN TOTAL ANNUEL.
                    Regle de Jacques : un total annuel effraie sans rien
                    expliquer, alors que le cout par stagiaire se compare a
                    ce que l organisme facture. */}
                {devis.cout_par_stagiaire !== null && (
                  <div style={{ borderTop: "1px solid rgba(200,169,110,0.3)", paddingTop: "16px" }}>
                    <p style={{ color: "#fff", fontSize: "17px", margin: "0 0 6px", lineHeight: "1.7" }}>
                      Sur une formation de {devis.duree_moyenne_mois} mois, le suivi complet
                      d&apos;un stagiaire représente{" "}
                      <strong style={{ color: OR }}>{euros(devis.cout_par_stagiaire)}</strong>.
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0, lineHeight: "1.7" }}>
                      Inscription, présences, évaluations, documents signés et sa part du
                      bilan compris. Prix hors taxes.
                    </p>
                  </div>
                )}

                <div style={{ marginTop: "22px" }}>
                  <button onClick={telecharger} style={PLEIN}>
                    Télécharger le devis
                  </button>
                </div>
              </div>
            )}

            {/* ---- LA FICHE ---- */}
            <div style={CARTE}>
              <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 6px" }}>
                Votre organisme
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 20px", lineHeight: "1.7" }}>
                Ces informations figureront sur votre devis puis sur vos factures.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px" }}>
                {CHAMPS.map(function (c: any) {
                  return (
                    <div key={c.cle} style={c.large ? { gridColumn: "1 / -1" } : {}}>
                      <label style={ETIQUETTE}>
                        {c.libelle}
                        {c.obligatoire ? <span style={{ color: OR }}> *</span> : null}
                      </label>
                      <input
                        type={c.type || "text"}
                        value={f[c.cle] || ""}
                        onChange={function (e) { modifier(c.cle, e.target.value); }}
                        style={CHAMP}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---- L OFFRE ---- */}
            <div style={CARTE}>
              <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 20px" }}>
                Votre offre
              </h2>

              {[
                {
                  valeur: "sans_catalogue",
                  titre: "Vos formations seules",
                  texte: "Vos contenus, vos parcours, vos stagiaires suivis de bout en bout.",
                },
                {
                  valeur: "avec_catalogue",
                  titre: "Avec le catalogue AcadéMIA",
                  texte: "Vos formations, plus celles que vous retenez dans notre catalogue et proposez sous votre nom, à vos prix. Marque blanche et accompagnement jusqu'au bilan compris.",
                },
              ].map(function (o) {
                const choisie = f.offre === o.valeur;
                const t = tarifs ? tarifs[o.valeur] : null;
                return (
                  <div
                    key={o.valeur}
                    onClick={function () { modifier("offre", o.valeur); }}
                    style={{
                      border: "1px solid " + (choisie ? "rgba(200,169,110,0.7)" : "rgba(255,255,255,0.12)"),
                      background: choisie ? "rgba(200,169,110,0.07)" : "transparent",
                      borderRadius: "11px",
                      padding: "16px 18px",
                      marginBottom: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ color: choisie ? OR : "#fff", fontSize: "17px", fontWeight: "bold", margin: "0 0 6px" }}>
                      {choisie ? "● " : "○ "}{o.titre}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px", margin: "0 0 8px", lineHeight: "1.7" }}>
                      {o.texte}
                    </p>
                    {t && (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13.5px", margin: 0 }}>
                        {euros(t.mise_en_place)} de mise en place, puis {euros(t.abonnement)} par mois
                        {t.part_catalogue > 0 ? " et " + t.part_catalogue + " % sur le catalogue" : ""}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Les options ne s affichent que dans l offre ou elles en sont. */}
              {f.offre === "sans_catalogue" && g && (
                <div style={{ marginTop: "18px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", letterSpacing: "2px", margin: "0 0 14px" }}>
                    OPTIONS
                  </p>

                  <label style={{ display: "flex", gap: "11px", alignItems: "flex-start", marginBottom: "14px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!f.marque_blanche}
                      onChange={function (e) { modifier("marque_blanche", e.target.checked); }}
                      style={{ marginTop: "4px", width: "17px", height: "17px", flexShrink: 0 }}
                    />
                    <span>
                      <span style={{ color: "#fff", fontSize: "15px" }}>
                        Marque blanche — {euros(g.marque_blanche)} par mois
                      </span>
                      <span style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.7", marginTop: "3px" }}>
                        L&apos;espace, les documents et les courriels portent votre nom et vos
                        couleurs. Sans cette option, vos stagiaires voient la marque Mr LMS.
                      </span>
                    </span>
                  </label>

                  <label style={{ display: "flex", gap: "11px", alignItems: "flex-start", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!f.accompagnement_bpf}
                      onChange={function (e) { modifier("accompagnement_bpf", e.target.checked); }}
                      style={{ marginTop: "4px", width: "17px", height: "17px", flexShrink: 0 }}
                    />
                    <span>
                      <span style={{ color: "#fff", fontSize: "15px" }}>
                        Accompagnement jusqu&apos;au bilan — {euros(g.accompagnement_bpf)} par mois
                      </span>
                      <span style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.7", marginTop: "3px" }}>
                        Nous vous accompagnons jusqu&apos;à votre bilan pédagogique et financier.
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* ---- LE VOLUME ---- */}
            <div style={CARTE}>
              <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 6px" }}>
                Votre activité
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.7" }}>
                Une estimation suffit. Elle sert à chiffrer votre devis ; la facturation
                suit ensuite vos stagiaires réels, mois par mois.
              </p>

              {/* 🚨 LA DEGRESSIVITE SE DIT AVANT LA SAISIE, PAS APRES — 03/09.
                  Remarque de Jacques : « il peut arreter avant meme de
                  savoir ». Un organisme qui saisit cinquante stagiaires
                  calcule de tete 50 x 49 € et ferme la page — alors qu a
                  cinquante, quarante d entre eux sont deja a 39 €. Le
                  chiffre le plus decourageant du formulaire etait affiche
                  sans son remede. */}
              {g && g.paliers && g.paliers.length > 1 && (
                <div style={{ border: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.05)", borderRadius: "10px", padding: "14px 16px", marginBottom: "18px" }}>
                  <p style={{ color: OR, fontSize: "14px", margin: "0 0 10px", lineHeight: "1.6" }}>
                    Le tarif par stagiaire baisse avec le nombre :
                  </p>
                  {g.paliers.map(function (p: any, i: number) {
                    const borne = p.max === null
                      ? "au-delà du " + (p.min - 1) + "e"
                      : "du " + ordinal(p.min) + " au " + ordinal(p.max);
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "3px 12px", fontSize: "14px", padding: "3px 0" }}>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{borne}</span>
                        <span style={{ color: OR, textAlign: "right" }}>{euros(p.prix)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px" }}>
                <div>
                  <label style={ETIQUETTE}>Stagiaires en formation, en moyenne chaque mois</label>
                  <input
                    type="number"
                    min={0}
                    value={f.stagiaires_estimes || ""}
                    onChange={function (e) { modifier("stagiaires_estimes", e.target.value); }}
                    style={CHAMP}
                  />
                </div>
                <div>
                  <label style={ETIQUETTE}>Durée moyenne d&apos;une formation, en mois</label>
                  <input
                    type="number"
                    min={1}
                    value={f.duree_moyenne_mois || ""}
                    onChange={function (e) { modifier("duree_moyenne_mois", e.target.value); }}
                    style={CHAMP}
                  />
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "26px" }}>
              <button onClick={enregistrer} disabled={envoi} style={{ ...PLEIN, opacity: envoi ? 0.5 : 1 }}>
                {envoi ? "Calcul…" : devis ? "Recalculer mon devis" : "Voir mon devis"}
              </button>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
                Prix hors taxes. Sans engagement de durée, résiliation avec un préavis
                d&apos;un mois. Devis valable trente jours.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
