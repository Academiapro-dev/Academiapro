"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LE FORMULAIRE DE DEVIS MR CRM — 03/09.
//
// LE PROSPECT REMPLIT SES PROPRES INFORMATIONS, comme sur Mr LMS.
//
// 🚨 LE PALIER NE SE CHOISIT PAS : il se deduit de l effectif saisi. Le
// prospect dit combien de personnes utiliseront l outil, la route calcule.
// Il voit ainsi qu a six personnes il bascule au palier suivant plutot que
// de payer cinq utilisateurs supplementaires.
//
// 🚨 LA GRILLE DES TROIS PALIERS S AFFICHE AVANT LA SAISIE. Meme lecon que
// sur Mr LMS : sans elle, quelqu un qui compte huit personnes calcule de
// tete huit fois un prix qu il ne connait pas, et ferme la page.
//
// 🚨 AUCUN MONTANT ECRIT ICI. Tout vient de la route, qui lit la table
// `tarifs` (produit = 'crm').
//
// ⚠️ LA TELEPHONIE N APPARAIT QUE SI LE PAYS EST EUROPEEN. La route ne
// renvoie meme pas son prix hors EEA : ce qui n est pas envoye ne peut pas
// s afficher par erreur.
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

// 🚨 « 18,80 € » ET NON « 18,8 € » — 03/09. toLocaleString coupe le zero
// final : sur un devis, un montant ampute d une decimale se remarque, et
// donne l impression d un calcul approximatif.
// Les montants ronds restent sans decimale (« 49 € »), ceux qui en ont en
// portent deux.
function euros(n: any) {
  const v = Number(n) || 0;
  const entier = Math.round(v * 100) % 100 === 0;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  }) + " €";
}

// Les centimes comptent pour une minute ou un SMS : « 0,12 € » et non
// « 0 € ».
function centimes(n: any) {
  return (Number(n) || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }) + " €";
}

const CHAMPS = [
  { cle: "raison_sociale", libelle: "Raison sociale ou votre nom", obligatoire: true, large: true },
  { cle: "contact_nom", libelle: "Votre nom", obligatoire: true },
  { cle: "contact_email", libelle: "Adresse électronique", obligatoire: true, type: "email" },
  { cle: "telephone", libelle: "Téléphone" },
  { cle: "adresse", libelle: "Adresse", large: true },
  { cle: "code_postal", libelle: "Code postal" },
  { cle: "ville", libelle: "Ville" },
  { cle: "pays", libelle: "Pays" },
  { cle: "siret", libelle: "SIRET (si vous en avez un)" },
];

export default function PageDevisCRM() {
  const [jeton, setJeton] = useState("");
  const [f, setF] = useState<any>(null);
  const [tarifs, setTarifs] = useState<any>(null);
  const [europeen, setEuropeen] = useState(true);
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
      const r = await fetch("/api/crm/devis?jeton=" + encodeURIComponent(j));
      const d = await r.json();
      if (d.ok) {
        setF(d.prospect);
        setTarifs(d.tarifs);
        setEuropeen(d.europeen);
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
    setF(function (avant: any) { return { ...avant, [cle]: valeur }; });
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
      const r = await fetch("/api/crm/devis", {
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
    window.location.href = "/api/crm/devis/pdf?jeton=" + encodeURIComponent(jeton);
  }

  // La grille montree avant la saisie : les trois paliers, avec celui qui
  // correspond a l effectif actuel mis en valeur.
  const paliers = tarifs
    ? ["solo", "equipe", "entreprise"].map(function (o) { return tarifs[o]; })
    : [];

  const nbUtil = f ? Number(f.utilisateurs_estimes) || 0 : 0;

  function palierActif(p: any) {
    if (!p) return false;
    if (p.plafond === null) return nbUtil > 15;
    if (p.offre === "solo") return nbUtil === 1;
    if (p.offre === "equipe") return nbUtil >= 2 && nbUtil <= 5;
    return nbUtil >= 6;
  }

  const g = tarifs ? tarifs.equipe : null;

  return (
    <div style={CADRE}>
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", background: "#000", marginBottom: "34px" }}>
        <div style={{ ...SECTION, padding: "10px 22px" }}>
          <img
            src="/mrcrm-banniere.png"
            alt="Mr CRM"
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
            {/* ---- LE DEVIS ---- */}
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
                    {devis.offre_libelle}
                  </span>
                  <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                    {euros(devis.abonnement)}
                  </span>

                  {devis.utilisateurs_supplementaires > 0 && (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>
                        {devis.utilisateurs_supplementaires} utilisateur(s) au-delà de{" "}
                        {devis.plafond} · {euros(devis.utilisateur_sup)} chacun
                      </span>
                      <span style={{ color: OR, textAlign: "right", fontWeight: "bold" }}>
                        {euros(devis.cout_supplementaires)}
                      </span>
                    </>
                  )}
                </div>

                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: "0 0 16px", lineHeight: "1.7" }}>
                  Tout est compris : contacts, historique, relances, devis et factures,
                  campagnes, rendez-vous en ligne. Aucun module à débloquer.
                </p>

                {/* ---- LES USAGES ---- */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", marginBottom: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", margin: "0 0 8px" }}>
                    À l&apos;usage, en plus de l&apos;abonnement :
                  </p>

                  {/* ⚠️ LES LIGNES « Appel sortant, a la minute » ET
                      « SMS envoye » ONT ETE RETIREES LE 04/09 : ces deux
                      fonctions n existent pas. Il ne reste ici que la
                      signature electronique, qui elle fonctionne. */}

                  <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "4px 12px", fontSize: "14px", padding: "3px 0" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>Signature électronique</span>
                    <span style={{ color: OR, textAlign: "right" }}>
                      {centimes(devis.signature_unitaire)}
                    </span>
                  </div>

                  {devis.signatures_offertes > 0 && (
                    <div style={{ marginTop: "12px", padding: "12px 14px", background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.35)", borderRadius: "9px" }}>
                      <p style={{ color: "#4caf50", fontSize: "15px", margin: "0 0 5px", fontWeight: "bold" }}>
                        {devis.signatures_offertes} signatures comprises chaque année
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: 0, lineHeight: "1.7" }}>
                        Elles se renouvellent tant que votre abonnement est en cours.
                        Au-delà, les signatures sont facturées à l&apos;unité ou par lot.
                      </p>
                    </div>
                  )}
                </div>

                {/* ⚠️ L ESTIMATION D USAGE — « X minutes d appel » et
                    « X SMS » — A ETE RETIREE LE 04/09. Ces deux fonctions
                    n existent pas dans l outil. Voir le commentaire du bloc
                    de saisie, plus bas. */}

                {/* 🚨 LE COUT PAR UTILISATEUR, JAMAIS UN TOTAL ANNUEL. */}
                {devis.cout_par_utilisateur !== null && (
                  <div style={{ borderTop: "1px solid rgba(200,169,110,0.3)", paddingTop: "16px" }}>
                    <p style={{ color: "#fff", fontSize: "17px", margin: "0 0 6px", lineHeight: "1.7" }}>
                      Pour {devis.utilisateurs} utilisateur(s), cela représente{" "}
                      <strong style={{ color: OR }}>
                        {euros(devis.cout_par_utilisateur)}
                      </strong>{" "}
                      par personne et par mois.
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0, lineHeight: "1.7" }}>
                      Soit {euros(devis.mensuel_total)} par mois au total. Prix hors taxes.
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
                Vous
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

            {/* ---- L EFFECTIF ---- */}
            <div style={CARTE}>
              <h2 style={{ color: OR, fontSize: "20px", margin: "0 0 6px" }}>
                Combien serez-vous
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.7" }}>
                Le tarif suit le nombre de personnes qui utiliseront l&apos;outil. Tout le
                reste est compris.
              </p>

              {/* 🚨 LA GRILLE AVANT LA SAISIE. Sans elle, quelqu un qui compte
                  huit personnes calcule de tete un prix qu il ne connait pas. */}
              {paliers.length > 0 && (
                <div style={{ border: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.05)", borderRadius: "10px", padding: "14px 16px", marginBottom: "18px" }}>
                  {paliers.map(function (p: any, i: number) {
                    const actif = palierActif(p);
                    const borne = p.plafond === null
                      ? "au-delà de quinze"
                      : p.plafond === 1
                        ? "un utilisateur"
                        : "jusqu'à " + p.plafond + " utilisateurs";
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "3px 12px", fontSize: "14px", padding: "4px 0" }}>
                        <span style={{ color: actif ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", fontWeight: actif ? "bold" : "normal" }}>
                          {borne}
                        </span>
                        <span style={{ color: actif ? OR : "rgba(255,255,255,0.4)", textAlign: "right", fontWeight: actif ? "bold" : "normal" }}>
                          {euros(p.abonnement)}
                        </span>
                      </div>
                    );
                  })}
                  {g && g.utilisateur_sup > 0 && (
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "8px 0 0", lineHeight: "1.6" }}>
                      Au-delà de quinze, {euros(tarifs.entreprise.utilisateur_sup)} par
                      utilisateur supplémentaire et par mois.
                    </p>
                  )}
                </div>
              )}

              <div style={{ maxWidth: "300px" }}>
                <label style={ETIQUETTE}>Nombre d&apos;utilisateurs</label>
                <input
                  type="number"
                  min={1}
                  value={f.utilisateurs_estimes || ""}
                  onChange={function (e) { modifier("utilisateurs_estimes", e.target.value); }}
                  style={CHAMP}
                />
              </div>
            </div>

            {/* 🚨🚨 LE BLOC DE SAISIE « APPELS ET SMS » A ETE RETIRE — 04/09.

                CE QU IL FAISAIT. Deux cases a cocher — « Appeler depuis
                l outil, 0,12 € la minute » et « Envoyer des SMS, 0,09 € le
                message » — chacune suivie d un champ d estimation
                mensuelle. Le devis chiffrait ensuite ces consommations.

                POURQUOI IL DISPARAIT. CES DEUX FONCTIONS N EXISTENT PAS.
                Verifie dans le code le 04/09 : dans le CRM, le numero est
                un lien `tel:` qui compose sur le telephone, l adresse un
                lien `mailto:` qui ouvre la messagerie. Rien ne revient
                dans l outil ; il n y a ni journal d appels, ni SMS.
                La vitrine a ete corrigee le meme jour, mais le devis les
                vendait encore : un client qui cochait une case achetait
                une fonction que personne ne pouvait livrer.

                ⚠️ LA GRILLE RESTE EN BASE, INTACTE. Les lignes
                `telephonie`, `telephonie_lot`, `sms` et `sms_lot` de la
                table `tarifs` (produit = 'crm') n ont PAS ete supprimees :
                prix arretes, marges calculees, tout est pret pour le jour
                ou la fonction sera construite — au premier client qui la
                demande, decision de Jacques du 04/09.

                ⚠️ POUR LES REMETTRE, LE JOUR VENU : restaurer ce bloc, les
                deux lignes du recapitulatif et le bloc d estimation, tous
                trois signales plus haut. NE RIEN REMETTRE AVANT QUE LE
                CODE DE LA TELEPHONIE EXISTE. */}

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
