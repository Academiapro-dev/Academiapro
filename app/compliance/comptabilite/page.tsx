"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// LA COMPTABILITE D UNE SOCIETE — ECRAN CLIENT — 07/09.
//
// 🚨 CE QUE CET ECRAN REND POSSIBLE, ET C EST TOUT SON INTERET : preremplir
// le Form 5472 a partir de CE QUI S EST PASSE SUR LE COMPTE, et non de ce
// que le client declare de memoire.
//
// Jacques, le 07/09 : « l avantage de s occuper de la comptabilite, c est
// de s assurer de la veracite de la declaration du formulaire 5472 ».
//
// ⚠️ LA SOCIETE SE CHOISIT DANS L ADRESSE : ?societe=<id>. Un client peut
// en avoir plusieurs, et chacune a sa comptabilite. La route verifie que
// la societe lui appartient — l ecran ne fait que passer l identifiant.
//
// 🚨 LE COMPTE COURANT S AFFICHE PAR DEVISE, JAMAIS ADDITIONNE. Convertir
// supposerait un taux ; celui de l IRS n est publie qu en debut d annee
// suivante. Un total unique aurait l air juste et serait faux.
//
// ⚠️ LES MOUVEMENTS SANS JUSTIFICATIF SONT COMPTES ET AFFICHES. C est la
// limite de service posee par Jacques : « MysterLLC passera la main a un
// expert-comptable si la comptabilite possede des trous sur le plan des
// justificatifs ». On le signale avant, pas au moment de generer.
// ══════════════════════════════════════════════════════════════════════════

function euros(n: any, devise: string) {
  const v = Number(n) || 0;
  return v.toFixed(2).replace(".", ",") + " " + (devise === "EUR" ? "€" : devise);
}

function jour(d: any) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
}

export default function PageComptabiliteSociete() {
  const [societeId, setSocieteId] = useState("");
  const [societe, setSociete] = useState<any>(null);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [compteCourant, setCompteCourant] = useState<any[]>([]);
  const [nbAvances, setNbAvances] = useState(0);
  const [sansJustificatif, setSansJustificatif] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [devises, setDevises] = useState<string[]>([]);

  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);

  // Le formulaire de saisie.
  const [fournisseur, setFournisseur] = useState("");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("USD");
  const [categorie, setCategorie] = useState("Logiciels");
  const [pays, setPays] = useState("US");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [avance, setAvance] = useState(true);
  const [recurrente, setRecurrente] = useState(false);

  useEffect(function () {
    // ⚠️ L IDENTIFIANT VIENT DE L ADRESSE. On le lit une fois au montage,
    // puis on charge. Sans lui, l ecran ne peut rien afficher.
    try {
      const params = new URLSearchParams(window.location.search);
      const s = String(params.get("societe") || "").trim();
      if (s) {
        setSocieteId(s);
        charger(s);
      } else {
        setErreur("Aucune société précisée.");
        setCharge(true);
      }
    } catch (e) {
      setCharge(true);
    }
  }, []);

  async function charger(id: string) {
    try {
      const r = await fetch("/api/compliance/depenses?societe=" + encodeURIComponent(id),
        { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) {
        setSociete(d.societe || null);
        setDepenses(Array.isArray(d.depenses) ? d.depenses : []);
        setCompteCourant(Array.isArray(d.compte_courant) ? d.compte_courant : []);
        setNbAvances(Number(d.nb_avances || 0));
        setSansJustificatif(Number(d.sans_justificatif || 0));
        setCategories(Array.isArray(d.categories) ? d.categories : []);
        setDevises(Array.isArray(d.devises) ? d.devises : []);
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          setCategorie(d.categories[0]);
        }
      } else if (d && d.erreur) {
        setErreur(d.erreur);
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(true);
  }

  async function agir(corps: any, texte: string) {
    setOccupe(corps.action + (corps.id || ""));
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...corps, societe: societeId }),
      });
      const d = await r.json();
      if (d && d.ok) {
        setMessage(texte);
        await charger(societeId);
        setOccupe("");
        return true;
      }
      setErreur((d && d.erreur) || "Opération impossible.");
    } catch (e: any) {
      setErreur("Opération impossible : " + String(e));
    }
    setOccupe("");
    return false;
  }

  async function ajouter() {
    if (fournisseur.trim().length < 2) {
      setErreur("Indiquez le fournisseur.");
      return;
    }
    if (!montant || Number(montant) <= 0) {
      setErreur("Indiquez un montant.");
      return;
    }
    const ok = await agir({
      action: "ajouter",
      fournisseur: fournisseur.trim(),
      montant_ttc: Number(montant),
      devise: devise,
      categorie: categorie,
      pays_fournisseur: pays,
      date_depense: date,
      description: description.trim(),
      avance_perso: avance,
      recurrente: recurrente,
    }, "Dépense enregistrée.");

    if (ok) {
      setFournisseur("");
      setMontant("");
      setDescription("");
      setFormulaire(false);
    }
  }

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "20px 24px", marginBottom: "16px",
  };
  const CHAMP: any = {
    width: "100%", padding: "11px 13px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "14px",
  };
  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "13px", marginBottom: "6px",
  };
  const BOUTON: any = {
    padding: "10px 20px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.45)",
    background: "transparent", color: OR,
    fontSize: "14px", fontFamily: "Georgia,serif", cursor: "pointer",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <a href="/compliance" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          &larr; Retour au portefeuille
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          {societe ? (societe.label || societe.legal_name) : "Chargement…"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px",
          margin: "0 0 24px", lineHeight: "1.7" }}>
          Chaque dépense payée pour cette société, avec son justificatif.
          Celles que vous avez réglées personnellement alimentent votre
          compte courant d&apos;associé — c&apos;est ce montant qui figure
          au formulaire 5472.
        </p>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {erreur}
            </p>
          </div>
        )}

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "14.5px", margin: 0 }}>{message}</p>
          </div>
        )}

        {/* ---- LE COMPTE COURANT ----
            🚨 EN PREMIER : c est le chiffre que le client vient chercher,
            et celui qui alimente le 5472. */}
        {charge && societe && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ ...CARTE, flex: "1 1 260px", marginBottom: 0,
              borderColor: "rgba(177,140,255,0.45)" }}>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "0 0 8px" }}>
                Compte courant d&apos;associé
                {nbAvances > 0 ? " · " + nbAvances + " avance(s)" : ""}
              </p>
              {compteCourant.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", margin: 0 }}>
                  Aucune avance en cours.
                </p>
              ) : (
                compteCourant.map(function (c: any) {
                  return (
                    <p key={c.devise} style={{ color: "#b18cff", fontSize: "22px",
                      fontWeight: "bold", margin: "0 0 4px" }}>
                      {euros(c.montant, c.devise)}
                    </p>
                  );
                })
              )}
              {/* ⚠️ ON EXPLIQUE POURQUOI LES DEVISES NE SONT PAS
                  ADDITIONNEES. Sans cette phrase, le client croit a un
                  defaut d affichage. */}
              {compteCourant.length > 1 && (
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px",
                  margin: "8px 0 0", lineHeight: "1.6" }}>
                  Les devises restent séparées : le taux de change officiel
                  n&apos;est publié qu&apos;en début d&apos;année suivante.
                </p>
              )}
            </div>

            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold",
                margin: "0 0 4px" }}>
                {depenses.length}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                dépense{depenses.length > 1 ? "s" : ""} enregistrée{depenses.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* ---- LES MOUVEMENTS SANS PIECE ----
            🚨 LA LIMITE DE SERVICE. Jacques, le 07/09 : « MysterLLC passera
            la main a un expert-comptable si la comptabilite possede des
            trous sur le plan des justificatifs ».
            ⚠️ ON LE DIT AVANT, pas au moment de generer le formulaire. Un
            client prevenu en mars corrige ; prevenu le 14 avril, il subit. */}
        {charge && sansJustificatif > 0 && (
          <div style={{ ...CARTE, borderColor: "rgba(232,163,61,0.5)",
            background: "rgba(232,163,61,0.07)" }}>
            <p style={{ color: "#e8a33d", fontSize: "15.5px", margin: "0 0 6px",
              lineHeight: "1.6" }}>
              <strong>{sansJustificatif}</strong> dépense{sansJustificatif > 1 ? "s" : ""} sans
              justificatif.
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px",
              margin: 0, lineHeight: "1.75" }}>
              Un formulaire ne se prépare qu&apos;à partir de mouvements
              justifiables. Ajoutez les pièces manquantes, ou faites appel à
              un expert-comptable pour ces lignes.
            </p>
          </div>
        )}

        {/* ---- AJOUTER ---- */}
        {charge && societe && (
          <div style={{ marginBottom: "18px" }}>
            <button onClick={() => setFormulaire(!formulaire)}
              style={{ ...BOUTON, background: formulaire ? "transparent" : OR,
                color: formulaire ? OR : FOND,
                border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none",
                fontWeight: formulaire ? "normal" : "bold" }}>
              {formulaire ? "Annuler" : "Ajouter une dépense"}
            </button>
          </div>
        )}

        {formulaire && (
          <div style={CARTE}>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <span style={LIBELLE}>Fournisseur *</span>
                <input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}
                  placeholder="Anthropic, Vercel…" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <span style={LIBELLE}>Montant TTC *</span>
                <input value={montant} onChange={(e) => setMontant(e.target.value)}
                  placeholder="20.00" inputMode="decimal" style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 120px" }}>
                <span style={LIBELLE}>Devise</span>
                <select value={devise} onChange={(e) => setDevise(e.target.value)}
                  style={CHAMP}>
                  {devises.map(function (d) {
                    return <option key={d} value={d}>{d}</option>;
                  })}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Catégorie</span>
                <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
                  style={CHAMP}>
                  {categories.map(function (c) {
                    return <option key={c} value={c}>{c}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "0 1 130px" }}>
                <span style={LIBELLE}>Pays du fournisseur</span>
                <input value={pays} onChange={(e) => setPays(e.target.value)}
                  placeholder="US" maxLength={2} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Abonnement mensuel…" style={CHAMP} />

            {/* 🚨 LES DEUX CASES QUI COMPTENT.
                « Avance personnelle » decide de ce qui alimente le compte
                courant d associe, donc du 5472. Elle est cochee par defaut
                parce que c est le cas le plus frequent au demarrage d une
                societe : le proprietaire paie tout, la societe le lui doit.
                ⚠️ MAIS C EST LE CLIENT QUI TRANCHE. La plateforme pose la
                question, elle n y repond pas a sa place. S il qualifie, il
                assume ; si elle qualifiait pour lui, Jacques assumerait. */}
            <label style={{ display: "flex", gap: "10px", alignItems: "flex-start",
              cursor: "pointer", marginBottom: "10px" }}>
              <input type="checkbox" checked={avance}
                onChange={(e) => setAvance(e.target.checked)}
                style={{ marginTop: "3px", width: "18px", height: "18px" }} />
              <span>
                <span style={{ color: "#b18cff", fontSize: "15px" }}>
                  Avance personnelle (compte courant d&apos;associé)
                </span>
                <span style={{ display: "block", color: "rgba(255,255,255,0.45)",
                  fontSize: "13px", lineHeight: "1.7", marginTop: "2px" }}>
                  Vous avez réglé cette dépense avec vos fonds personnels.
                  La société vous doit cette somme, et elle figurera au
                  formulaire 5472.
                </span>
              </span>
            </label>

            <label style={{ display: "flex", gap: "10px", alignItems: "flex-start",
              cursor: "pointer", marginBottom: "18px" }}>
              <input type="checkbox" checked={recurrente}
                onChange={(e) => setRecurrente(e.target.checked)}
                style={{ marginTop: "3px", width: "18px", height: "18px" }} />
              <span style={{ color: "#4fc3f7", fontSize: "15px" }}>
                Dépense récurrente (abonnement mensuel)
              </span>
            </label>

            <button onClick={ajouter} disabled={occupe !== ""}
              style={{ ...BOUTON, background: OR, color: FOND, border: "none",
                fontWeight: "bold", padding: "13px 26px" }}>
              {occupe === "ajouter" ? "…" : "Enregistrer la dépense"}
            </button>
          </div>
        )}

        {/* ---- LA LISTE ---- */}
        {charge && depenses.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "17px", margin: "0 0 14px" }}>
              Les dépenses
            </h2>
            {depenses.map(function (d: any) {
              return (
                <div key={d.id} style={{ padding: "11px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                    <span style={{ color: "#fff", fontSize: "15px" }}>
                      {d.fournisseur}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
                        marginLeft: "10px" }}>
                        {d.categorie}
                      </span>
                      {d.avance_perso && !d.rembourse && (
                        <span style={{ color: "#b18cff", fontSize: "12.5px", marginLeft: "10px" }}>
                          avance perso
                        </span>
                      )}
                      {d.avance_perso && d.rembourse && (
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12.5px",
                          marginLeft: "10px" }}>
                          remboursée
                        </span>
                      )}
                      {d.recurrente && (
                        <span style={{ color: "#4fc3f7", fontSize: "12.5px", marginLeft: "10px" }}>
                          récurrente
                        </span>
                      )}
                    </span>
                    <span style={{ color: OR, fontSize: "15px", whiteSpace: "nowrap" }}>
                      {euros(d.montant_ttc, d.devise)}
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px",
                        marginLeft: "10px" }}>
                        {jour(d.date_depense)}
                      </span>
                    </span>
                  </div>

                  {d.description && (
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px",
                      margin: "4px 0 0", lineHeight: "1.6" }}>
                      {d.description}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap",
                    marginTop: "6px", alignItems: "center" }}>
                    {/* ⚠️ L ABSENCE DE PIECE SE SIGNALE LIGNE PAR LIGNE, pas
                        seulement en compteur global : c est ainsi qu on sait
                        laquelle corriger. */}
                    {!d.pdf_url && (
                      <span style={{ color: "#e8a33d", fontSize: "12.5px" }}>
                        sans justificatif
                      </span>
                    )}
                    {d.avance_perso && !d.rembourse && (
                      <button
                        onClick={() => agir({ action: "rembourser", id: d.id },
                          "Avance marquée remboursée.")}
                        disabled={occupe !== ""}
                        style={{ background: "none", border: "none", color: OR,
                          fontSize: "12.5px", fontFamily: "Georgia,serif",
                          cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        Marquer remboursée
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm("Supprimer cette dépense ?")) {
                          agir({ action: "supprimer", id: d.id }, "Dépense supprimée.");
                        }
                      }}
                      disabled={occupe !== ""}
                      style={{ background: "none", border: "none",
                        color: "rgba(232,131,106,0.7)", fontSize: "12.5px",
                        fontFamily: "Georgia,serif", cursor: "pointer",
                        textDecoration: "underline", padding: 0 }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {charge && societe && depenses.length === 0 && (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px",
              margin: 0, lineHeight: "1.75" }}>
              Aucune dépense enregistrée. Chaque dépense payée pour cette
              société — abonnement, agent enregistré, honoraires — se note
              ici, avec son justificatif.
            </p>
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px",
          lineHeight: "1.8", marginTop: "20px" }}>
          Les montants marqués comme avances personnelles alimentent votre
          compte courant d&apos;associé et figurent au formulaire 5472. La
          qualification de chaque mouvement vous appartient : elle décide de
          ce qui sera déclaré.
        </p>
      </div>
    </div>
  );
}
