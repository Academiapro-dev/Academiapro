"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// MES DOCUMENTS DE METIER — 14/09.
//
// Le client depose SES documents (mandat, devis, bon de commande, contrat,
// lettre de mission), les parametre une fois, et ils se remplissent
// ensuite depuis la fiche du prospect.
//
// LA REGLE DE SAISIE, ET ELLE TIENT EN UNE PHRASE : ce qui change d un
// client a l autre s ecrit entre doubles accolades. {{nom}}, {{montant}},
// {{adresse}}. Rien d autre a declarer — la route releve ces marques et
// dit lesquelles la fiche sait remplir toute seule.
// ══════════════════════════════════════════════════════════════════════════

const OR = "#c8a96e";
const FOND = "#050508";
const VERT = "#4caf50";

const CADRE: any = { minHeight: "100vh", background: FOND, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
const CHAMP: any = { width: "100%", padding: "13px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "16px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "14px" };
const BOUTON: any = { background: OR, color: FOND, padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: OR, padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

// LES MODELES PRETS A L EMPLOI — 14/09.
//
// ⚠️ UN TEXTE PROPRE A CHAQUE TYPE, et c est le point. Jacques, 14/09 :
// « on va pas cliquer sur une convocation et que le texte indique
// mandat ». Chaque entree porte SON document, complet et utilisable tel
// quel : le client le choisit, l adapte, et il est pret a signer.
// La zone reste vide par defaut : coller son propre document marche
// aussi bien.
const EXEMPLES: any[] = [
  {
    cle: "mandat",
    nom: "Mandat de vente",
    titre: "Mandat de vente non exclusif",
    categorie: "Mandat",
    texte: `MANDAT DE VENTE NON EXCLUSIF

Entre les soussignes :

{{nom}}, demeurant {{adresse}}, {{code_postal}} {{ville}}, ci-apres le Mandant,

Et l agence, ci-apres le Mandataire,

Il a ete convenu ce qui suit.

Article 1 - Objet
Le Mandant confie au Mandataire la vente du bien situe {{adresse_bien}}, designe comme suit : {{designation_bien}}, au prix de {{prix}} euros net vendeur.

Article 2 - Honoraires
Les honoraires du Mandataire s elevent a {{honoraires}} euros, a la charge de {{charge_honoraires}}. Ils ne sont dus qu en cas de realisation effective de la vente.

Article 3 - Duree
Le present mandat est consenti pour une duree de {{duree}} mois a compter de sa signature. Il peut etre denonce par lettre recommandee apres un delai de trois mois, moyennant un preavis de quinze jours.

Article 4 - Obligations du Mandant
Le Mandant s engage a informer le Mandataire de toute vente conclue par ses soins et a lui communiquer les documents necessaires a la vente.

Fait le {{date}}, en deux exemplaires.`,
  },
  {
    cle: "devis",
    nom: "Devis",
    titre: "Devis",
    categorie: "Devis",
    texte: `DEVIS N {{numero}}

Etabli le {{date}} pour :

{{societe}}
{{nom}}
{{adresse}}, {{code_postal}} {{ville}}
{{email}} - {{telephone}}

Prestation : {{prestation}}
Description : {{description}}

Montant hors taxes : {{montant_ht}} euros
TVA ({{taux_tva}} %) : {{montant_tva}} euros
Montant toutes taxes comprises : {{montant_ttc}} euros

Conditions de reglement : {{conditions_reglement}}
Delai d execution : {{delai}}
Validite du present devis : {{validite}} jours.

Bon pour accord, le {{date}}.`,
  },
  {
    cle: "prestation",
    nom: "Contrat de prestation",
    titre: "Contrat de prestation de services",
    categorie: "Contrat",
    texte: `CONTRAT DE PRESTATION DE SERVICES

Entre {{societe}}, representee par {{nom}}, dont le siege est situe {{adresse}}, {{code_postal}} {{ville}}, ci-apres le Client,

Et le Prestataire,

Il a ete convenu ce qui suit.

Article 1 - Objet
Le Prestataire s engage a realiser la prestation suivante : {{prestation}}.

Article 2 - Duree
Le contrat prend effet le {{date_debut}} pour une duree de {{duree}}.

Article 3 - Prix et reglement
Le prix est fixe a {{montant}} euros hors taxes. Reglement : {{conditions_reglement}}.

Article 4 - Obligations du Client
Le Client fournit au Prestataire les elements necessaires a la bonne execution de la prestation, dans les delais convenus.

Article 5 - Resiliation
Chaque partie peut resilier le contrat en cas de manquement de l autre, apres mise en demeure restee sans effet pendant trente jours.

Fait le {{date}}, en deux exemplaires.`,
  },
  {
    cle: "mission",
    nom: "Lettre de mission",
    titre: "Lettre de mission",
    categorie: "Mission",
    texte: `LETTRE DE MISSION

A l attention de {{nom}}
{{societe}}
{{adresse}}, {{code_postal}} {{ville}}

Le {{date}}

Objet : {{objet}}

Madame, Monsieur,

Nous vous remercions de la confiance que vous nous accordez et vous confirmons les termes de notre mission.

Nature de la mission : {{mission}}
Periode couverte : {{periode}}
Honoraires : {{honoraires}} euros, selon les modalites suivantes : {{modalites}}.

Nous vous remercions de nous retourner un exemplaire signe, qui vaudra acceptation.

Veuillez agreer, Madame, Monsieur, l expression de nos salutations distinguees.`,
  },
  {
    cle: "commande",
    nom: "Bon de commande",
    titre: "Bon de commande",
    categorie: "Commande",
    texte: `BON DE COMMANDE N {{numero}}

Client : {{societe}} - {{nom}}
Adresse : {{adresse}}, {{code_postal}} {{ville}}
Contact : {{email}} - {{telephone}}

Designation : {{designation}}
Quantite : {{quantite}}
Prix unitaire hors taxes : {{prix_unitaire}} euros
Montant total hors taxes : {{montant_ht}} euros

Livraison prevue le {{date_livraison}}, a l adresse suivante : {{adresse_livraison}}.
Reglement : {{conditions_reglement}}.

Bon pour commande, le {{date}}.`,
  },
  {
    cle: "partenariat",
    nom: "Contrat de partenariat",
    titre: "Contrat de partenariat",
    categorie: "Partenariat",
    texte: `CONTRAT DE PARTENARIAT

Entre {{societe}}, representee par {{nom}}, dont le siege est situe {{adresse}}, {{code_postal}} {{ville}}, ci-apres le Partenaire,

Et la societe, ci-apres l Apporteur,

Il a ete convenu ce qui suit.

Article 1 - Objet
Les parties conviennent de collaborer sur : {{objet}}.

Article 2 - Engagements du Partenaire
{{engagements_partenaire}}

Article 3 - Engagements de l Apporteur
{{engagements_apporteur}}

Article 4 - Remuneration
La remuneration du partenariat est fixee a {{remuneration}}, versee selon les modalites suivantes : {{modalites}}.

Article 5 - Duree
Le present contrat est conclu pour une duree de {{duree}} a compter du {{date_debut}}, renouvelable par accord ecrit.

Article 6 - Confidentialite
Chaque partie s engage a ne pas divulguer les informations obtenues dans le cadre du partenariat.

Fait le {{date}}, en deux exemplaires.`,
  },
  {
    cle: "nda",
    nom: "Accord de confidentialite (NDA)",
    titre: "Accord de confidentialite",
    categorie: "Confidentialite",
    texte: `ACCORD DE CONFIDENTIALITE

Entre {{societe}}, representee par {{nom}}, dont le siege est situe {{adresse}}, {{code_postal}} {{ville}}, ci-apres la Partie receptrice,

Et la societe, ci-apres la Partie emettrice,

Il a ete convenu ce qui suit.

Article 1 - Objet
Les parties echangent des informations confidentielles dans le cadre de : {{objet}}.

Article 2 - Definition
Sont confidentielles toutes les informations communiquees par la Partie emettrice, quel qu en soit le support, a l exception de celles deja publiques ou obtenues licitement d un tiers.

Article 3 - Obligations
La Partie receptrice s engage a ne pas divulguer ces informations, a ne les utiliser que pour l objet ci-dessus, et a n y donner acces qu aux personnes qui en ont besoin, tenues aux memes obligations.

Article 4 - Duree
Les obligations du present accord s appliquent pendant {{duree}} a compter du {{date_debut}}, y compris apres la fin des echanges.

Article 5 - Restitution
A la premiere demande, la Partie receptrice restitue ou detruit les documents confies, sans en conserver de copie.

Fait le {{date}}, en deux exemplaires.`,
  },
  {
    cle: "convocation",
    nom: "Convocation",
    titre: "Convocation",
    categorie: "Convocation",
    texte: `CONVOCATION

A l attention de {{nom}}
{{societe}}
{{email}} - {{telephone}}

Le {{date}}

Objet : {{objet}}

Madame, Monsieur,

Nous avons le plaisir de vous convoquer a : {{intitule}}.

Date : {{date_seance}}
Horaires : {{horaires}}
Lieu : {{lieu}}
Modalites d acces : {{acces}}

Merci de vous presenter quelques minutes avant le debut. En cas d empechement, nous vous remercions de nous prevenir au {{telephone_contact}}.

Veuillez agreer, Madame, Monsieur, l expression de nos salutations distinguees.`,
  },
  {
    cle: "attestation",
    nom: "Attestation",
    titre: "Attestation",
    categorie: "Attestation",
    texte: `ATTESTATION

Je soussigne, representant de la societe, atteste que :

{{nom}}
{{societe}}
{{adresse}}, {{code_postal}} {{ville}}

{{objet_attestation}}

Periode concernee : {{periode}}

La presente attestation est delivree pour servir et valoir ce que de droit.

Fait le {{date}}.`,
  },
];

export default function PageModeles() {
  const [modeles, setModeles] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [ouvert, setOuvert] = useState(false);
  const [id, setId] = useState("");
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("");
  const [corps, setCorps] = useState("");

  useEffect(function () { charger(); }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch { return ""; }
  }

  async function charger() {
    setChargement(true);
    try {
      const r = await fetch("/api/organisme/modeles" + suffixe());
      const d = await r.json();
      if (d.ok) setModeles(d.modeles || []);
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function nouveau() {
    setId(""); setTitre(""); setCategorie(""); setCorps("");
    setOuvert(true); setMessage(""); setErreur("");
  }

  function modifier(m: any) {
    setId(m.id); setTitre(m.titre); setCategorie(m.categorie || ""); setCorps(m.corps || "");
    setOuvert(true); setMessage(""); setErreur("");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  }

  async function enregistrer() {
    setOccupe("enregistrer"); setMessage(""); setErreur("");
    try {
      const r = await fetch("/api/organisme/modeles" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: id ? "modifier" : "creer", id: id || undefined, titre: titre, categorie: categorie, corps: corps }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message || "Enregistré."); setOuvert(false); await charger(); }
      else setErreur(d.erreur || "Enregistrement impossible.");
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function retirer(m: any) {
    if (!window.confirm("Retirer « " + m.titre + " » de la liste ? Les documents déjà produits sont conservés.")) return;
    setOccupe("retirer-" + m.id);
    try {
      const r = await fetch("/api/organisme/modeles" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: m.actif ? "desactiver" : "reactiver", id: m.id }),
      });
      const d = await r.json();
      if (d.ok) { setMessage(d.message); await charger(); } else setErreur(d.erreur);
    } catch (e: any) { setErreur(String(e)); }
    setOccupe("");
  }

  // Les champs reperes dans le texte en cours d ecriture : l utilisateur
  // voit ce que la machine a compris AVANT d enregistrer.
  const apercu = (function () {
    const vus: any = {}; const liste: string[] = [];
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let m = re.exec(corps);
    while (m) { const c = m[1].toLowerCase(); if (!vus[c]) { vus[c] = true; liste.push(c); } m = re.exec(corps); }
    return liste;
  })();

  const AUTO = ["nom", "prenom", "patronyme", "societe", "organisme", "email", "telephone", "ville", "adresse", "code_postal", "pays", "siret", "siren"];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>← Retour au CRM</a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>DOCUMENTS DE MÉTIER</p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes modèles</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0, lineHeight: 1.7 }}>
          Déposez vos propres documents — mandat, devis, bon de commande, contrat de
          prestation, lettre de mission. Écrivez entre doubles accolades ce qui change
          d&apos;un client à l&apos;autre : <span style={{ color: OR }}>{"{{nom}}"}</span>,{" "}
          <span style={{ color: OR }}>{"{{montant}}"}</span>. Le document se remplira
          ensuite depuis la fiche du prospect, prêt à être envoyé et signé.
        </p>

        {message && <p style={{ color: VERT, fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {!ouvert && (
          <button onClick={nouveau} style={{ ...BOUTON, marginBottom: "22px" }}>Déposer un document</button>
        )}

        {ouvert && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "18px", margin: "0 0 14px" }}>
              {id ? "Modifier le modèle" : "Nouveau modèle"}
            </h2>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Titre</span>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Mandat de vente non exclusif" style={CHAMP} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Catégorie (facultatif)</span>
            <input value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder="Mandat, devis, contrat…" style={CHAMP} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Le texte du document</span>
            <textarea
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              rows={16}
              placeholder={"Collez ici le texte de votre document.\n\nEcrivez entre doubles accolades ce qui change d un client a l autre : {{nom}}, {{adresse}}, {{montant}}, {{date}}..."}
              style={{ ...CHAMP, fontFamily: "monospace", fontSize: "14px", lineHeight: 1.7 }}
            />
            {corps.length === 0 && (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", margin: "0 0 10px", lineHeight: 1.7 }}>
                  Collez votre propre document, ou partez de l&apos;un de ceux-ci — chacun
                  s&apos;ouvre avec son propre texte, que vous adaptez :
                </p>
                {EXEMPLES.map(function (ex: any) {
                  return (
                    <button
                      key={ex.cle}
                      onClick={function () {
                        setCorps(ex.texte);
                        if (!titre) setTitre(ex.titre);
                        if (!categorie) setCategorie(ex.categorie);
                      }}
                      style={{ ...SECOND, marginRight: "8px", marginBottom: "8px" }}
                    >
                      {ex.nom}
                    </button>
                  );
                })}
              </div>
            )}

            {apercu.length > 0 && (
              <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "14px 16px", marginBottom: "14px" }}>
                <p style={{ color: OR, fontSize: "14px", margin: "0 0 8px", fontWeight: "bold" }}>
                  {apercu.length} champ(s) repéré(s)
                </p>
                {apercu.map(function (c) {
                  const auto = AUTO.indexOf(c) >= 0;
                  return (
                    <span key={c} style={{ display: "inline-block", margin: "0 8px 8px 0", padding: "5px 12px", borderRadius: "14px", fontSize: "13px", background: auto ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.06)", color: auto ? VERT : "rgba(255,255,255,0.7)", border: "1px solid " + (auto ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.15)") }}>
                      {c}{auto ? " · depuis la fiche" : " · à saisir"}
                    </span>
                  );
                })}
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "6px 0 0", lineHeight: 1.7 }}>
                  En vert, ce que la fiche du prospect remplit toute seule. Les autres vous
                  seront demandés au moment de produire le document.
                </p>
              </div>
            )}

            <button onClick={enregistrer} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "enregistrer" ? "Enregistrement…" : "Enregistrer le modèle"}
            </button>
            <button onClick={() => setOuvert(false)} style={{ ...SECOND, marginLeft: "12px" }}>Annuler</button>
          </div>
        )}

        <h2 style={{ color: OR, fontSize: "18px", margin: "26px 0 14px" }}>Vos documents</h2>

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p></div>
        ) : modeles.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: 1.7 }}>
              Aucun document déposé. Commencez par celui que vous faites signer le plus
              souvent : c&apos;est celui qui vous fera gagner le plus de temps.
            </p>
          </div>
        ) : (
          modeles.map(function (m) {
            const champs = Array.isArray(m.champs) ? m.champs : [];
            const auto = champs.filter(function (c: any) { return c.source === "fiche"; }).length;
            return (
              <div key={m.id} style={{ ...CARTE, opacity: m.actif ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>
                      {m.titre}{!m.actif && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> · retiré</span>}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {m.categorie ? m.categorie + " · " : ""}{champs.length} champ(s), dont {auto} depuis la fiche
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <button onClick={() => modifier(m)} style={SECOND}>Modifier</button>
                    <button onClick={() => retirer(m)} disabled={occupe !== ""} style={SECOND}>
                      {m.actif ? "Retirer" : "Remettre"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
