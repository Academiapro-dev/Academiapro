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

  // ══════════════════════════════════════════════════════════════════════
  // LE JUSTIFICATIF ET SA LECTURE — 07/09.
  //
  // 🚨 C EST LA BRIQUE QUI MANQUAIT, et Jacques l a vue tout de suite : un
  // formulaire de depense sans piece jointe ramene au declaratif. Avec la
  // piece, le montant vient du document, pas de la memoire.
  //
  // DEUX ETAPES, VOLONTAIREMENT SEPAREES :
  //   1. « Analyser » — l IA lit la photo ou le PDF et PREREMPLIT le
  //      formulaire. Rien n est enregistre.
  //   2. « Enregistrer » — le client a verifie, corrige si besoin, et
  //      valide. Le fichier part avec.
  //
  // ⚠️ POURQUOI NE PAS ENREGISTRER DIRECTEMENT APRES LECTURE. Une photo
  // floue, un montant HT pris pour du TTC, une devise mal lue : l IA se
  // trompe parfois, et une erreur ici finit dans le 5472. Le client doit
  // voir ce qui a ete lu avant que ca compte.
  //
  // ⚠️ LES IMAGES SONT COMPRESSEES AVANT ENVOI, comme sur l ecran
  // d AcadeMIA : une photo de telephone pese 4 a 8 Mo, la route en refuse
  // plus de 4 pour l analyse. On ramene a 1600 px, ce qui reste lisible.
  // ══════════════════════════════════════════════════════════════════════
  const [fichier, setFichier] = useState<any>(null);
  const [analyse, setAnalyse] = useState("");

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

  // La compression d une image, reprise de l ecran d AcadeMIA. Un PDF
  // passe tel quel : on ne sait pas le reduire sans le degrader.
  async function comprimer(f: any): Promise<any> {
    if (!f || !String(f.type || "").startsWith("image/")) return f;
    return new Promise(function (resolve) {
      try {
        const img = new Image();
        const url = URL.createObjectURL(f);
        img.onload = function () {
          const maxDim = 1600;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio); h = Math.round(h * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(f); return; }
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob: any) {
            URL.revokeObjectURL(url);
            if (!blob) { resolve(f); return; }
            resolve(new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg",
              { type: "image/jpeg" }));
          }, "image/jpeg", 0.85);
        };
        img.onerror = function () { resolve(f); };
        img.src = url;
      } catch (e) {
        resolve(f);
      }
    });
  }

  async function analyser() {
    if (!fichier) return;
    setAnalyse("encours");
    setErreur("");
    try {
      const f = await comprimer(fichier);
      const data = new FormData();
      data.append("fichier", f);
      data.append("societe", societeId);
      const r = await fetch("/api/compliance/depenses/analyser", { method: "POST", body: data });
      const d = await r.json();
      if (d && d.ok && d.extrait) {
        const x = d.extrait;
        // ⚠️ ON NE REMPLIT QUE CE QUI A ETE LU. Un null laisse le champ
        // tel quel : le client garde ce qu il avait deja saisi.
        if (x.fournisseur) setFournisseur(String(x.fournisseur));
        if (x.montant_ttc !== null && x.montant_ttc !== undefined) setMontant(String(x.montant_ttc));
        if (x.devise && devises.indexOf(x.devise) >= 0) setDevise(x.devise);
        if (x.date_depense) setDate(String(x.date_depense).slice(0, 10));
        if (x.pays_fournisseur) setPays(String(x.pays_fournisseur).toUpperCase().slice(0, 2));
        if (x.categorie && categories.indexOf(x.categorie) >= 0) setCategorie(x.categorie);
        if (x.description) setDescription(String(x.description));
        setAnalyse("ok");
      } else {
        setAnalyse("");
        setErreur((d && d.erreur) || "Lecture impossible.");
      }
    } catch (e: any) {
      setAnalyse("");
      setErreur("Lecture impossible : " + String(e));
    }
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

    // 🚨 L AJOUT PART EN formData, PAS EN JSON : c est le seul moyen de
    // joindre le fichier. Les autres actions restent en JSON.
    setOccupe("ajouter");
    setMessage("");
    setErreur("");
    try {
      const data = new FormData();
      data.append("action", "ajouter");
      data.append("societe", societeId);
      data.append("fournisseur", fournisseur.trim());
      data.append("montant_ttc", String(Number(montant)));
      data.append("devise", devise);
      data.append("categorie", categorie);
      data.append("pays_fournisseur", pays);
      data.append("date_depense", date);
      data.append("description", description.trim());
      data.append("avance_perso", avance ? "true" : "false");
      data.append("recurrente", recurrente ? "true" : "false");
      if (fichier) {
        // ⚠️ ON ENVOIE L ORIGINAL POUR L ARCHIVAGE, PAS LA VERSION
        // COMPRESSEE. La compression sert a l analyse ; la piece
        // conservee doit etre le document tel qu il a ete recu.
        data.append("fichier", fichier);
      }

      const r = await fetch("/api/compliance/depenses", { method: "POST", body: data });
      const d = await r.json();
      if (d && d.ok) {
        setMessage(fichier ? "Dépense et justificatif enregistrés." : "Dépense enregistrée.");
        setFournisseur("");
        setMontant("");
        setDescription("");
        setFichier(null);
        setAnalyse("");
        setFormulaire(false);
        await charger(societeId);
      } else {
        setErreur((d && d.erreur) || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function ouvrirPiece(id: string) {
    setErreur("");
    try {
      const r = await fetch("/api/compliance/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ouvrir_piece", id: id, societe: societeId }),
      });
      const d = await r.json();
      if (d && d.ok && d.url) window.open(d.url, "_blank");
      else setErreur((d && d.erreur) || "Pièce indisponible.");
    } catch (e: any) {
      setErreur("Pièce indisponible : " + String(e));
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
            {/* ---- LE JUSTIFICATIF, EN PREMIER ----
                🚨 IL EST PLACE AVANT LES CHAMPS, pas apres. Le geste naturel
                est : je photographie la facture, l outil lit, je verifie.
                Le mettre en bas inviterait a tout saisir a la main puis a
                joindre — l inverse de ce qu on veut. */}
            <div style={{ padding: "14px 16px", marginBottom: "18px",
              background: "rgba(79,195,247,0.06)",
              border: "1px dashed rgba(79,195,247,0.4)", borderRadius: "10px" }}>
              <span style={{ ...LIBELLE, color: "#4fc3f7" }}>
                Justificatif — photo ou PDF
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setFichier(f);
                  setAnalyse("");
                }}
                style={{ color: "#fff", fontSize: "14px", marginBottom: "10px" }}
              />
              {fichier && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={analyser} disabled={analyse === "encours"}
                    style={{ ...BOUTON, borderColor: "rgba(79,195,247,0.5)", color: "#4fc3f7",
                      background: analyse === "encours" ? "rgba(79,195,247,0.15)" : "transparent" }}>
                    {analyse === "encours" ? "Lecture en cours…" : "Lire le document et remplir"}
                  </button>
                  {analyse === "ok" && (
                    <span style={{ color: "#4caf50", fontSize: "13px" }}>
                      Champs remplis — vérifiez et complétez si besoin.
                    </span>
                  )}
                </div>
              )}
              {!fichier && (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
                  margin: 0, lineHeight: "1.6" }}>
                  Joignez la facture ou le reçu : l&apos;outil lit le montant,
                  la date et le fournisseur, et vous n&apos;avez plus qu&apos;à
                  vérifier.
                </p>
              )}
            </div>

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
                    {d.pdf_url && (
                      <button
                        onClick={() => ouvrirPiece(d.id)}
                        style={{ background: "none", border: "none", color: "#4fc3f7",
                          fontSize: "12.5px", fontFamily: "Georgia,serif",
                          cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        Voir la pièce
                      </button>
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
