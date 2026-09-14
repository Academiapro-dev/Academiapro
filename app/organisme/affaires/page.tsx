"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LE PIPELINE DES AFFAIRES — 14/09.
//
// CE QU ON OUVRE LE MATIN : ce qui est en cours, colonne par colonne, avec
// le montant de chaque colonne. Une affaire se deplace d un bouton.
//
// 🚨 LE MONTANT NE SE TAPE PAS. Il n y a AUCUN champ « montant » sur cet
// ecran : on saisit des lignes — designation, quantite, prix — et le total
// tombe. C est la doctrine, et c est aussi ce qui evite qu un devis dise
// 4 800 € pendant que l affaire en annonce 4 500.
//
// 🚨 UNE AFFAIRE SE CREE DEPUIS LA FICHE DU CONTACT, pas ici : elle
// s ouvre avec ?fiche=<id>. Meme chemin que « Produire un document » et
// « Prendre un rendez-vous » — on part de la personne, jamais d un ecran
// ou l on rechoisit le client.
//
// ⚠️ LE PREVISIONNEL EST UNE ESTIMATION : la somme des affaires ouvertes
// ponderee par leur probabilite. L ecran le dit, sinon quelqu un le prend
// pour du chiffre d affaires.
//
// 🚨 TROIS DEFAUTS RELEVES PAR JACQUES A L ESSAI DU 14/09, CORRIGES ICI :
//   1. LES COLONNES DE SAISIE N AVAIENT PAS D ETIQUETTE. Trois cases « 1 »,
//      « 0 », « 20 » sans rien au-dessus : une fois la ligne remplie, plus
//      personne ne sait laquelle est la quantite. Un texte d invite qui
//      disparait des qu on tape ne remplace pas une etiquette.
//   2. L AFFAIRE DISPARAISSAIT QUAND ON LA GAGNAIT. Le pipeline ne montre
//      que les affaires ouvertes ; en la gagnant, elle sortait des colonnes
//      et le client ne la retrouvait plus. On bascule desormais TOUT SEUL
//      sur l affichage complet des qu une affaire se ferme.
//   3. LE TTC N ETAIT NULLE PART. Le HT sert au pilotage, le TTC est ce que
//      le client paiera : les deux se lisent.
//
// ⚠️ LA TVA RESTE SUR LA LIGNE, a 20 % par defaut. Mr CRM est vendu a des
// organismes, cabinets et agences FRANCAIS, qui facturent leurs clients
// francais avec TVA. Le 0 % sert aux cas reels : client professionnel dans
// un autre pays de l UE (autoliquidation), client hors UE, vendeur en
// franchise en base, activite exoneree. Ne pas raisonner depuis le cas de
// l editeur, dont la LLC facture hors taxes : ce n est pas celui du client.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";
const ROUGE = "#e8836a";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "18px 20px", marginBottom: "14px" };
const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "10px" };
const BOUTON: any = { background: OR, color: FOND, padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14.5px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

const LIBELLE: any = {
  qualification: "Qualification",
  proposition: "Proposition envoyée",
  negociation: "Négociation",
  gagnee: "Gagnée",
  perdue: "Perdue",
};
const OUVERTES = ["qualification", "proposition", "negociation"];

function euros(n: any) { return (Number(n) || 0).toFixed(2).replace(".", ",") + " €"; }
function jolie(d: any) {
  if (!d) return "—";
  try { return new Date(String(d) + (String(d).length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("fr-FR"); } catch (e) { return String(d); }
}

export default function PageAffaires() {
  const [affaires, setAffaires] = useState<any[]>([]);
  const [totaux, setTotaux] = useState<any>({});
  const [previsionnel, setPrevisionnel] = useState(0);
  const [fermees, setFermees] = useState(false);

  const [ouverte, setOuverte] = useState<any>(null);
  const [lignes, setLignes] = useState<any[]>([]);

  const [ficheId, setFicheId] = useState("");
  const [nomFiche, setNomFiche] = useState("");
  const [titre, setTitre] = useState("");
  const [echeance, setEcheance] = useState("");
  const [proba, setProba] = useState("50");

  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const f = p.get("fiche") || "";
    const n = p.get("nom") || "";
    setFicheId(f);
    setNomFiche(n);
    if (f) setTitre(n ? "Affaire — " + n : "Nouvelle affaire");
    charger(false);
  }, []);

  async function charger(avecFermees: boolean) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/affaires" + (avecFermees ? "?fermees=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setAffaires(d.affaires || []);
        setTotaux(d.totaux || {});
        setPrevisionnel(d.previsionnel_ht || 0);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
    setChargement(false);
  }

  async function creer() {
    setErreur(""); setMessage("");
    if (!titre.trim()) { setErreur("Donnez un titre à l'affaire."); return; }
    setOccupe("creer");
    try {
      const r = await fetch("/api/organisme/affaires", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "creer", titre: titre.trim(), fiche_id: ficheId,
          cloture_prevue_le: echeance || undefined,
          probabilite: Number(proba) || 50,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message);
        setFicheId(""); setTitre(""); setEcheance("");
        await charger(fermees);
        if (d.affaire) await ouvrir(d.affaire.id);
      } else setErreur(d.erreur || "Création impossible.");
    } catch (e: any) { setErreur("Création impossible : " + String(e)); }
    setOccupe("");
  }

  async function ouvrir(id: string) {
    setErreur("");
    try {
      const r = await fetch("/api/organisme/affaires?affaire=" + encodeURIComponent(id), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setOuverte(d.affaire);
        setLignes((d.lignes || []).map(function (l: any) {
          return { designation: l.designation, quantite: l.quantite, prix_unitaire: l.prix_unitaire, tva_taux: l.tva_taux };
        }));
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
  }

  async function enregistrerLignes() {
    if (!ouverte) return;
    setOccupe("lignes"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/affaires", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lignes", id: ouverte.id, lignes: lignes }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); await ouvrir(ouverte.id); await charger(fermees); }
      else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) { setErreur("Enregistrement impossible : " + String(e)); }
    setOccupe("");
  }

  async function deplacer(etape: string) {
    if (!ouverte) return;
    let motif = "";
    if (etape === "perdue") {
      const saisi = prompt("Pourquoi cette affaire est-elle perdue ?", "");
      if (saisi === null) return;
      motif = saisi;
    }
    setOccupe("etape"); setErreur(""); setMessage("");
    try {
      const r = await fetch("/api/organisme/affaires", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "etape", id: ouverte.id, etape: etape, motif_perte: motif || undefined }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage(d.message);
        // 🚨 UNE AFFAIRE QUI SE FERME NE DOIT PAS DISPARAITRE SOUS LES YEUX
        // de celui qui vient de la fermer. Les colonnes ne montrent que
        // l ouvert : on ouvre donc l affichage complet, tout seul, et on le
        // dit. Defaut releve a l essai du 14/09.
        const ferme = etape === "gagnee" || etape === "perdue";
        const vue = ferme ? true : fermees;
        if (ferme && !fermees) setFermees(true);
        await ouvrir(ouverte.id);
        await charger(vue);
      }
      else setErreur(d.erreur || "Déplacement impossible.");
    } catch (e: any) { setErreur("Déplacement impossible : " + String(e)); }
    setOccupe("");
  }

  function majLigne(i: number, champ: string, valeur: any) {
    const copie = lignes.slice();
    copie[i] = { ...copie[i], [champ]: valeur };
    setLignes(copie);
  }

  // Le total affiche PENDANT la saisie, avant meme d enregistrer : sans
  // lui, on tape trois lignes a l aveugle et on decouvre le montant apres.
  let totalHt = 0;
  let totalTva = 0;
  for (const l of lignes) {
    const ligneHt = (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0);
    totalHt += ligneHt;
    totalTva += ligneHt * ((Number(l.tva_taux) || 0) / 100);
  }
  totalHt = Math.round(totalHt * 100) / 100;
  totalTva = Math.round(totalTva * 100) / 100;
  const totalTtc = Math.round((totalHt + totalTva) * 100) / 100;

  const colonnes = fermees ? ["qualification", "proposition", "negociation", "gagnee", "perdue"] : OUVERTES;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>PIPELINE</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes affaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Ce qui est en cours, à quelle étape, pour combien. Le montant se calcule
          à partir des lignes : il ne se saisit pas.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px" }}>{erreur}</p>}

        {/* ---- CREATION, quand on arrive depuis une fiche ---- */}
        {ficheId && (
          <div style={{ ...CARTE, borderColor: "rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 4px" }}>Nouvelle affaire</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: "0 0 12px" }}>
              Pour {nomFiche || "ce contact"}. Vous chiffrerez juste après.
            </p>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de l'affaire" style={CHAMP} />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 1 190px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Signature espérée le</span>
                <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "0 1 150px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Chances (%)</span>
                <input value={proba} onChange={(e) => setProba(e.target.value)} inputMode="numeric" style={CHAMP} />
              </div>
            </div>
            <button onClick={creer} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "creer" ? "Création…" : "Créer l'affaire"}
            </button>
            <button onClick={() => setFicheId("")} style={{ ...SECOND, marginLeft: "12px" }}>Annuler</button>
          </div>
        )}

        {/* ---- LES COMPTEURS ---- */}
        {!chargement && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "18px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: OR, fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(OUVERTES.reduce(function (s, e) { return s + ((totaux[e] && totaux[e].montant_ht) || 0); }, 0))}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>en cours, hors taxes</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
              <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{euros(previsionnel)}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                prévisionnel — estimation d&apos;après vos chances
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => { const v = !fermees; setFermees(v); charger(v); }}
          style={{ ...SECOND, marginBottom: "18px" }}
        >
          {fermees ? "Masquer les affaires terminées" : "Voir aussi les gagnées et les perdues"}
        </button>

        {/* ---- LE PIPELINE ---- */}
        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : affaires.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.75 }}>
              Aucune affaire pour le moment. Ouvrez une fiche dans <a href="/organisme/crm" style={{ color: OR }}>Mon CRM</a> et
              cliquez sur « Ouvrir une affaire ».
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
            {colonnes.map(function (etape) {
              const dedans = affaires.filter(function (a: any) { return a.etape === etape; });
              const t = totaux[etape] || { nombre: 0, montant_ht: 0 };
              return (
                <div key={etape} style={{ flex: "1 1 260px", minWidth: "240px" }}>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(200,169,110,0.3)", marginBottom: "10px" }}>
                    <p style={{ color: etape === "perdue" ? ROUGE : etape === "gagnee" ? VERT : OR, fontSize: "15px", fontWeight: "bold", margin: 0 }}>
                      {LIBELLE[etape]}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: "3px 0 0" }}>
                      {t.nombre} affaire(s) · {euros(t.montant_ht)} HT
                    </p>
                  </div>
                  {dedans.map(function (a: any) {
                    return (
                      <div
                        key={a.id}
                        onClick={() => ouvrir(a.id)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid " + (ouverte && ouverte.id === a.id ? OR : "rgba(255,255,255,0.1)"),
                          borderRadius: "10px", padding: "12px 14px", marginBottom: "9px", cursor: "pointer",
                        }}
                      >
                        <p style={{ color: "#fff", fontSize: "14.5px", margin: "0 0 3px", fontWeight: "bold" }}>{a.titre}</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: 0 }}>
                          {a.contact || "—"}
                        </p>
                        <p style={{ color: OR, fontSize: "13.5px", margin: "6px 0 0" }}>
                          {euros(a.montant_ht)} HT
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>
                            {a.cloture_prevue_le ? " · " + jolie(a.cloture_prevue_le) : ""}
                            {a.etape !== "gagnee" && a.etape !== "perdue" ? " · " + (a.probabilite || 0) + " %" : ""}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ---- L AFFAIRE OUVERTE ---- */}
        {ouverte && (
          <div style={{ ...CARTE, marginTop: "26px", borderColor: OR }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px" }}>{ouverte.titre}</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: 0 }}>
                  {LIBELLE[ouverte.etape] || ouverte.etape}
                  {ouverte.cloture_prevue_le ? " · signature espérée le " + jolie(ouverte.cloture_prevue_le) : ""}
                  {ouverte.motif_perte ? " · " + ouverte.motif_perte : ""}
                </p>
              </div>
              <button onClick={() => setOuverte(null)} style={SECOND}>Fermer</button>
            </div>

            {/* Les lignes */}
            <h3 style={{ color: OR, fontSize: "15px", margin: "20px 0 4px" }}>Ce qui est chiffré</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 12px", lineHeight: 1.7 }}>
              Le montant de l&apos;affaire est la somme de ces lignes. Mettez 0 en TVA
              pour un client hors taxes — professionnel d&apos;un autre pays de l&apos;Union
              européenne, client hors Union, ou activité exonérée.
            </p>

            {/* 🚨 LES ETIQUETTES DE COLONNES. Sans elles, trois cases « 57 »,
                « 110 », « 20 » ne disent rien une fois remplies. Elles
                restent visibles meme quand la ligne est saisie, ce qu un
                simple texte d invite ne fait pas. */}
            {lignes.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                <div style={{ flex: "2 1 220px", fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>Désignation</div>
                <div style={{ flex: "0 1 80px", fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>Quantité</div>
                <div style={{ flex: "0 1 110px", fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>Prix unitaire HT</div>
                <div style={{ flex: "0 1 80px", fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}>TVA %</div>
                <div style={{ flex: "0 1 92px" }} />
              </div>
            )}

            {lignes.map(function (l: any, i: number) {
              return (
                <div key={i} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "6px" }}>
                  <div style={{ flex: "2 1 220px" }}>
                    <input value={l.designation || ""} onChange={(e) => majLigne(i, "designation", e.target.value)} placeholder="Désignation" style={{ ...CHAMP, marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: "0 1 80px" }}>
                    <input value={l.quantite} onChange={(e) => majLigne(i, "quantite", e.target.value)} inputMode="decimal" placeholder="Qté" style={{ ...CHAMP, marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: "0 1 110px" }}>
                    <input value={l.prix_unitaire} onChange={(e) => majLigne(i, "prix_unitaire", e.target.value)} inputMode="decimal" placeholder="Prix HT" style={{ ...CHAMP, marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: "0 1 80px" }}>
                    <input value={l.tva_taux} onChange={(e) => majLigne(i, "tva_taux", e.target.value)} inputMode="decimal" placeholder="TVA" style={{ ...CHAMP, marginBottom: 0 }} />
                  </div>
                  <button
                    onClick={() => setLignes(lignes.filter(function (_x: any, j: number) { return j !== i; }))}
                    style={{ ...SECOND, borderColor: "rgba(232,131,106,0.5)", color: ROUGE }}
                  >
                    Retirer
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setLignes(lignes.concat([{ designation: "", quantite: 1, prix_unitaire: 0, tva_taux: 20 }]))}
              style={{ ...SECOND, marginTop: "8px" }}
            >
              + Ajouter une ligne
            </button>

            <p style={{ color: "#fff", fontSize: "17px", margin: "16px 0 4px", fontWeight: "bold" }}>
              Total : {euros(totalHt)} HT
              <span style={{ color: OR, fontWeight: "normal" }}>
                {" "}· TVA {euros(totalTva)} · {euros(totalTtc)} TTC
              </span>
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "0 0 12px" }}>
              Enregistré : {euros(ouverte.montant_ht)} HT · {euros(ouverte.montant_ttc)} TTC
              {Math.abs(totalHt - (Number(ouverte.montant_ht) || 0)) > 0.009
                ? " — le chiffrage à l'écran n'est pas encore enregistré."
                : ""}
            </p>

            <button onClick={enregistrerLignes} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "lignes" ? "Enregistrement…" : "Enregistrer le chiffrage"}
            </button>

            {/* Les etapes */}
            <h3 style={{ color: OR, fontSize: "15px", margin: "24px 0 10px" }}>Où en est-on ?</h3>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              {["qualification", "proposition", "negociation", "gagnee", "perdue"].map(function (e) {
                const courante = ouverte.etape === e;
                return (
                  <button
                    key={e}
                    onClick={() => deplacer(e)}
                    disabled={occupe !== "" || courante}
                    style={{
                      ...SECOND,
                      background: courante ? "rgba(200,169,110,0.18)" : "none",
                      borderColor: e === "perdue" ? "rgba(232,131,106,0.5)" : e === "gagnee" ? "rgba(76,175,80,0.5)" : "rgba(200,169,110,0.45)",
                      color: e === "perdue" ? ROUGE : e === "gagnee" ? VERT : OR,
                      cursor: courante ? "default" : "pointer",
                      opacity: courante ? 0.55 : 1,
                    }}
                  >
                    {LIBELLE[e]}
                  </button>
                );
              })}
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "10px 0 0", lineHeight: 1.7 }}>
              Une affaire gagnée fait passer le contact en client. Une affaire perdue
              demande son motif — c&apos;est lui qui sert ensuite à comprendre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
