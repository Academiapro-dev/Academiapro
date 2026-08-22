"use client";
import { useState, useEffect, useRef } from "react";

// LE CRM DU CABINET — meme architecture que /admin/crm, autre metier.
//
// Le CRM de l editeur travaille des PROSPECTS : des gens a convaincre.
// Celui-ci travaille des CLIENTS DEJA SIGNES : des gens a relancer.
//
// 🚨 TOUT SE FAIT ICI, SANS CHANGER D ECRAN — exigence de Jacques, 23/08 :
// « si le logiciel n est pas simple a utiliser, on n aura pas de client ».
// Le collaborateur relance, le client repond, il depose la piece, elle se
// lit, elle se comptabilise. Quatre gestes, une seule page.
//
// Envoyer chercher le depot sur /admin/compliance/pieces revenait a une
// chasse au tresor : on relance ici, on depose la-bas, on revient ici pour
// savoir ou l on en est.
//
// 🚨 LE MOTIF « RAPPROCHEMENT » EST CELUI QU AUCUN CONCURRENT N A. Les
// autres SIGNALENT l operation bancaire sans justificatif ; ils ne
// RELANCENT pas le client a la place du cabinet.

const FILTRES = [
  { cle: "", nom: "Tous" },
  { cle: "a_relancer", nom: "A relancer" },
  { cle: "sans_piece", nom: "Pieces manquantes" },
  { cle: "rapprochement", nom: "Banque a justifier" },
  { cle: "impayes", nom: "Impayes" },
  { cle: "sans_contact", nom: "Sans contact" },
  { cle: "avec_sms", nom: "SMS accepte" },
];

// LES TYPES DE PIECE QU ON DEPOSE DEPUIS LE CRM.
//
// Le type conditionne l ecriture : une facture d achat credite le
// fournisseur, une note de frais credite le compte du salarie.
const TYPES_PIECE = [
  { cle: "facture_achat", nom: "Facture d'achat", credit: "401000" },
  { cle: "note_frais", nom: "Note de frais", credit: "421000" },
  { cle: "facture_vente", nom: "Facture de vente", credit: "411000" },
  { cle: "releve_bancaire", nom: "Justificatif bancaire", credit: "401000" },
  { cle: "autre", nom: "Autre pièce", credit: "401000" },
];

const PAR_PAGE = 50;

export default function CRMCabinet() {
  const [onglet, setOnglet] = useState("dashboard");
  const [d, setD] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [filtre, setFiltre] = useState("");
  const [saisie, setSaisie] = useState("");
  const [cherche, setCherche] = useState("");
  const [page, setPage] = useState(0);

  const [ouverte, setOuverte] = useState("");
  const [occupe, setOccupe] = useState("");

  const [brouillon, setBrouillon] = useState<any>(null);
  const [fiche, setFiche] = useState<any>(null);

  // LE DEPOT DE PIECE, DEPUIS LE CRM.
  const champFichier = useRef<any>(null);
  const [cible, setCible] = useState<any>(null);
  const [typePiece, setTypePiece] = useState("facture_achat");
  const [lecture, setLecture] = useState<any>(null);

  useEffect(function () { charger(); }, []);

  async function charger() {
    setCharge(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/crm", { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function appeler(corps: any) {
    const r = await fetch("/api/compliance/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  // ---------- LE DEPOT, LA LECTURE ET L ECRITURE, D UN SEUL GESTE ----------
  //
  // ⚠️ TROIS APPELS S ENCHAINENT : depot, lecture, puis attente de la
  // validation. LA COMPTABILISATION RESTE UN CLIC SEPARE — une ecriture
  // validee ne se supprime pas, elle se contre-passe. Le collaborateur voit
  // ce qui a ete lu avant d engager.
  async function deposer(fichier: File) {
    if (!fichier || !cible) return;
    setOccupe("depot");
    setErreur("");
    setMessage("");
    setLecture(null);
    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      donnees.append("societe_id", cible.id);
      donnees.append("type_document", typePiece);
      donnees.append("nom", fichier.name);

      const r = await fetch("/api/compliance/pieces", { method: "POST", body: donnees });
      const data = await r.json();

      if (!data.ok) {
        setErreur(data.erreur || "Dépôt impossible.");
        setOccupe("");
        return;
      }

      if (data.piece && data.piece.id) {
        setOccupe("lecture");
        const r2 = await fetch("/api/compliance/lire-facture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ piece_id: data.piece.id, societe_id: cible.id }),
        });
        const lu = await r2.json();
        if (lu.ok) {
          setLecture({ ...lu, piece: data.piece, societe: cible });
          setMessage(lu.message);
        } else {
          setErreur(lu.erreur || "Lecture impossible.");
        }
      } else {
        setMessage(data.message || "Pièce déposée.");
      }

      await charger();
    } catch (e: any) {
      setErreur("Dépôt impossible : " + String(e));
    }
    setOccupe("");
  }

  // L ECRITURE COMPTABLE, construite depuis ce qui a ete lu.
  //
  // ⚠️ LE COMPTE DE CONTREPARTIE DEPEND DU TYPE : fournisseur pour un achat,
  // personnel pour une note de frais, client pour une vente. Les confondre
  // fausserait les comptes de tiers.
  async function comptabiliser() {
    if (!lecture) return;
    setOccupe("ecriture");
    setErreur("");
    try {
      const l = lecture.lu;
      const ht = Number(l.montant_ht) || 0;
      const tva = Number(l.montant_tva) || 0;
      const ttc = Number(l.montant_ttc) || 0;

      const type = TYPES_PIECE.filter(function (t) { return t.cle === typePiece; })[0]
        || TYPES_PIECE[0];
      const vente = typePiece === "facture_vente";

      const lignes: any[] = [];

      if (vente) {
        lignes.push({ compte: "411000", debit: ttc, credit: "" });
        if (tva > 0) lignes.push({ compte: "445710", debit: "", credit: tva });
        lignes.push({ compte: "706000", debit: "", credit: ht > 0 ? ht : ttc });
      } else {
        lignes.push({ compte: lecture.proposition.compte, debit: ht > 0 ? ht : ttc, credit: "" });
        if (tva > 0) lignes.push({ compte: "445660", debit: tva, credit: "" });
        lignes.push({ compte: type.credit, debit: "", credit: ttc });
      }

      const r = await fetch("/api/compliance/ecriture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: lecture.societe.id,
          journal: vente ? "VE" : "AC",
          date: l.date || new Date().toISOString().slice(0, 10),
          piece_ref: l.reference || lecture.piece.nom,
          libelle: (l.fournisseur || lecture.piece.nom) + (l.reference ? " - " + l.reference : ""),
          lignes: lignes,
        }),
      });
      const data = await r.json();

      if (data.ok) {
        await fetch("/api/compliance/pieces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: lecture.piece.id, ecriture_num: data.ecriture_num }),
        });
        setMessage(data.message + " Pièce rattachée.");
        setLecture(null);
        setCible(null);
        await charger();
      } else {
        setErreur(data.erreur || "Écriture impossible.");
      }
    } catch (e: any) {
      setErreur("Écriture impossible : " + String(e));
    }
    setOccupe("");
  }

  // ---------- LES RELANCES ----------

  async function preparer(c: any, motif: string) {
    setOccupe("prep-" + c.id);
    setErreur("");
    setMessage("");
    try {
      const data = await appeler({ action: "preparer", societe_id: c.id, motif: motif });
      if (data.ok) {
        setBrouillon({
          societe_id: c.id,
          raison_sociale: c.raison_sociale,
          motif: motif,
          objet: data.objet,
          corps: data.corps,
          sms: data.sms,
          contact: data.contact,
          canal: "email",
          reference: "",
        });
      } else {
        setErreur(data.erreur || "Preparation impossible.");
      }
    } catch (e: any) {
      setErreur("Preparation impossible : " + String(e));
    }
    setOccupe("");
  }

  async function envoyer() {
    if (!brouillon) return;
    setOccupe("envoi");
    setErreur("");
    try {
      const data = await appeler({
        action: "relancer",
        societe_id: brouillon.societe_id,
        motif: brouillon.motif,
        canal: brouillon.canal,
        contact_id: brouillon.contact ? brouillon.contact.id : null,
        objet: brouillon.objet,
        corps: brouillon.canal === "sms" ? brouillon.sms : brouillon.corps,
        reference: brouillon.reference,
      });
      if (data.ok) {
        setMessage(data.message);
        setBrouillon(null);
        await charger();
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  async function enregistrerContact() {
    if (!fiche) return;
    setOccupe("contact");
    setErreur("");
    try {
      const data = await appeler({ action: "contact", ...fiche });
      if (data.ok) {
        setMessage(data.message);
        setFiche(null);
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function supprimerContact(id: any) {
    setOccupe("suppr-" + id);
    setErreur("");
    try {
      const data = await appeler({ action: "supprimer_contact", id: id });
      if (data.ok) { setMessage(data.message); await charger(); }
      else setErreur(data.erreur || "Suppression impossible.");
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
    setOccupe("");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function jolieDate(x: any) {
    if (!x) return "";
    try { return new Date(x).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  function aplatir(v: any): string {
    return String(v === null || v === undefined ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";
  const ROUGE = "#e8836a";

  const LIEN: any = { color: OR, textDecoration: "none" };
  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "15px", marginBottom: "10px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: OR, padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
  const CHAMP: any = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const TH: any = { position: "sticky", top: 0, background: "#12121f", color: OR, fontSize: "11.5px", fontWeight: "bold", textAlign: "left", padding: "9px 10px", borderBottom: "2px solid rgba(200,169,110,0.35)", whiteSpace: "nowrap", zIndex: 2 };
  const TD: any = { padding: "7px 10px", fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.85)" };

  const onglets = [
    { id: "dashboard", label: "📊 Tableau de bord" },
    { id: "clients", label: "🗂 Mes clients" },
    { id: "relances", label: "🔔 A relancer" },
    { id: "historique", label: "📨 Relances envoyees" },
  ];

  const clients = d && d.clients ? d.clients : [];
  const c = d && d.compteurs ? d.compteurs : null;

  const filtres = clients.filter(function (x: any) {
    if (filtre === "a_relancer" && x.a_relancer === 0) return false;
    if (filtre === "sans_piece" && x.sans_piece === 0) return false;
    if (filtre === "rapprochement" && x.rapprochement === 0) return false;
    if (filtre === "impayes" && x.impayes === 0) return false;
    if (filtre === "sans_contact" && x.joignable) return false;
    if (filtre === "avec_sms" && !x.sms_accepte) return false;
    if (!cherche) return true;
    const q = aplatir(cherche);
    const foin = aplatir(
      (x.raison_sociale || "") + " " + (x.code || "") + " " +
      (x.siren || "") + " " + (x.email || "")
    );
    return foin.indexOf(q) >= 0;
  });

  const pages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const visibles = filtres.slice(page * PAR_PAGE, (page + 1) * PAR_PAGE);
  const aRelancer = clients.filter(function (x: any) { return x.a_relancer > 0; });

  function carteCompteur(valeur: any, texte: string, couleur: string, cle?: string) {
    return (
      <div
        key={texte}
        onClick={cle !== undefined ? function () { setOnglet("clients"); setFiltre(cle); setPage(0); } : undefined}
        style={{
          background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: "10px", padding: "15px", textAlign: "center",
          cursor: cle !== undefined ? "pointer" : "default",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: "bold", color: couleur }}>{valeur}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" }}>{texte}</div>
      </div>
    );
  }

  // LE BOUTON DE DEPOT, disponible sur CHAQUE dossier, partout dans l ecran.
  function boutonDepot(x: any, large?: boolean) {
    return (
      <button
        onClick={() => { setCible(x); setLecture(null); setErreur(""); setMessage(""); }}
        style={{
          background: "rgba(68,138,255,0.15)", color: BLEU,
          border: "1px solid rgba(68,138,255,0.45)", borderRadius: large ? "8px" : "18px",
          padding: large ? "11px 18px" : "4px 12px", fontSize: large ? "13.5px" : "12px",
          fontFamily: "Georgia,serif", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        📎 Déposer une pièce
      </button>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* Le champ de fichier, invisible, declenche par le panneau de depot. */}
      <input
        ref={champFichier}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) deposer(f);
          e.target.value = "";
        }}
      />

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
              ← Retour aux dossiers
            </a>
            <h1 style={{ color: OR, margin: "12px 0 0", fontSize: "24px" }}>🎯 CRM du cabinet</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
              Mes clients · leurs contacts · mes relances · mes pièces
            </p>
          </div>
          {c && c.a_relancer > 0 && (
            <div
              onClick={() => setOnglet("relances")}
              style={{
                background: "rgba(232,163,61,0.15)", border: "1px solid rgba(232,163,61,0.5)",
                color: ORANGE, padding: "9px 18px", borderRadius: "20px", fontSize: "13px",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              🔔 {nombre(c.a_relancer)} dossier(s) à relancer
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", padding: "15px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {onglets.map(function (o) {
          const actif = onglet === o.id;
          return (
            <button key={o.id} onClick={() => { setOnglet(o.id); setPage(0); }}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none",
                background: actif ? OR : "rgba(255,255,255,0.08)",
                color: actif ? "#050508" : "#fff", cursor: "pointer",
                whiteSpace: "nowrap", fontWeight: actif ? "bold" : "normal",
                fontFamily: "Georgia,serif", fontSize: "13.5px",
              }}>
              {o.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "25px 20px", maxWidth: onglet === "clients" ? "100%" : "980px", margin: "0 auto" }}>

        {message && (
          <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: VERT, fontSize: "13px", lineHeight: "1.7" }}>
            {message}
          </div>
        )}
        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: ROUGE, fontSize: "13px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {charge && !d && <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>}

        {/* ---------- TABLEAU DE BORD ---------- */}
        {onglet === "dashboard" && c && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "25px" }}>
              {carteCompteur(nombre(c.dossiers), "Dossiers clients", OR)}
              {carteCompteur(nombre(c.a_relancer), "À relancer 🔔", ORANGE, "a_relancer")}
              {carteCompteur(nombre(c.contacts), "Contacts enregistrés", BLEU)}
              {carteCompteur(nombre(c.sans_piece), "Pièces manquantes", ORANGE, "sans_piece")}
              {carteCompteur(nombre(c.rapprochement), "Banque à justifier", ROUGE, "rapprochement")}
              {carteCompteur(nombre(c.impayes), "Impayés clients", ROUGE, "impayes")}
              {carteCompteur(euros(c.montant_impaye), "Montant impayé", ROUGE)}
              {carteCompteur(nombre(c.sans_contact), "Sans contact ⚠️", ROUGE, "sans_contact")}
              {carteCompteur(nombre(c.relances_envoyees), "Relances envoyées", VERT)}
            </div>

            <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.3)" }}>
              <h3 style={{ color: ROUGE, marginTop: 0, fontSize: "14px" }}>CE QUI BLOQUE VOS DOSSIERS</h3>
              {c.a_relancer === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.7", margin: 0 }}>
                  Rien à réclamer. Tous les justificatifs sont là et la banque est rapprochée.
                </p>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                  {nombre(c.sans_piece)} écriture(s) sans justificatif, {nombre(c.rapprochement)} opération(s)
                  bancaire(s) inexpliquée(s) et {nombre(c.impayes)} facture(s) impayée(s) chez {nombre(c.a_relancer)} client(s).
                </p>
              )}
            </div>

            {c.sans_contact > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.35)" }}>
                <h3 style={{ color: ORANGE, marginTop: 0, fontSize: "14px" }}>DOSSIERS INJOIGNABLES</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 12px" }}>
                  {nombre(c.sans_contact)} dossier(s) n'ont aucune adresse ni téléphone. Aucune relance
                  ne peut partir tant qu'un contact n'y est pas enregistré.
                </p>
                <button onClick={() => { setOnglet("clients"); setFiltre("sans_contact"); setPage(0); }} style={BOUTON}>
                  Voir ces dossiers →
                </button>
              </div>
            )}

            <button onClick={charger} style={{ width: "100%", background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px", cursor: "pointer", fontFamily: "Georgia,serif" }}>
              🔄 Rafraîchir
            </button>
          </div>
        )}

        {/* ---------- MES CLIENTS ---------- */}
        {onglet === "clients" && d && (
          <div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "12px" }}>
              {FILTRES.map(function (f) {
                const actif = filtre === f.cle;
                return (
                  <button key={f.cle || "tout"} onClick={() => { setFiltre(f.cle); setPage(0); }}
                    style={{
                      ...BOUTON, padding: "6px 13px",
                      background: actif ? OR : "rgba(255,255,255,0.06)",
                      color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                      border: actif ? "none" : BOUTON.border,
                      fontWeight: actif ? "bold" : "normal",
                    }}>
                    {f.nom}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
              <input
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setCherche(saisie.trim()); setPage(0); } }}
                placeholder="Raison sociale, code, SIREN ou adresse"
                style={{ ...CHAMP, flex: "1 1 260px" }}
              />
              <button onClick={() => { setCherche(saisie.trim()); setPage(0); }} style={{ ...BOUTON, padding: "10px 20px" }}>
                Chercher
              </button>
              {cherche && (
                <button onClick={() => { setSaisie(""); setCherche(""); setPage(0); }} style={{ ...BOUTON, padding: "10px 20px" }}>
                  Effacer
                </button>
              )}
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
                {nombre(filtres.length)} dossier(s)
                {pages > 1 ? " · page " + (page + 1) + "/" + pages : ""}
              </span>
            </div>

            {visibles.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Aucun dossier pour ce filtre.</p>
            ) : (
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", background: "#12121f" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1350px" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Dossier</th>
                      <th style={TH}>Contact</th>
                      <th style={TH}>Adresse e-mail</th>
                      <th style={TH}>Téléphone</th>
                      <th style={TH}>SMS</th>
                      <th style={TH}>Pièces</th>
                      <th style={TH}>Banque</th>
                      <th style={TH}>Impayés</th>
                      <th style={TH}>Dernière relance</th>
                      <th style={TH}>Déposer</th>
                      <th style={TH}>Relancer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map(function (x: any, i: number) {
                      const fond = !x.joignable
                        ? "rgba(232,131,106,0.09)"
                        : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)");
                      return (
                        <tr key={x.id} style={{ background: fond }}>
                          <td style={{ ...TD, color: "#fff", fontWeight: "bold", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {x.raison_sociale}
                            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: "normal" }}> · {x.code}</span>
                          </td>
                          <td style={TD}>
                            {x.contact_principal && x.contact_principal.nom
                              ? x.contact_principal.nom
                              : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                          </td>
                          <td style={TD}>
                            {x.email
                              ? <a href={"mailto:" + x.email} style={LIEN}>{x.email}</a>
                              : <span style={{ color: ROUGE }}>aucune</span>}
                          </td>
                          <td style={TD}>
                            {x.telephone
                              ? <a href={"tel:" + appelable(x.telephone)} style={LIEN}>{x.telephone}</a>
                              : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                          </td>
                          <td style={{ ...TD, color: x.sms_accepte ? VERT : "rgba(255,255,255,0.25)" }}>
                            {x.sms_accepte ? "oui" : "non"}
                          </td>
                          <td style={{ ...TD, color: x.sans_piece > 0 ? ORANGE : "rgba(255,255,255,0.3)" }}>
                            {x.sans_piece > 0 ? nombre(x.sans_piece) : "—"}
                          </td>
                          <td style={{ ...TD, color: x.rapprochement > 0 ? ROUGE : "rgba(255,255,255,0.3)" }}>
                            {x.rapprochement > 0 ? nombre(x.rapprochement) : "—"}
                          </td>
                          <td style={{ ...TD, color: x.impayes > 0 ? ROUGE : "rgba(255,255,255,0.3)" }}>
                            {x.impayes > 0 ? nombre(x.impayes) + " · " + euros(x.montant_impaye) : "—"}
                          </td>
                          <td style={{ ...TD, color: "rgba(255,255,255,0.5)" }}>
                            {jolieDate(x.derniere_relance_le) || "jamais"}
                          </td>
                          <td style={TD}>{boutonDepot(x)}</td>
                          <td style={TD}>
                            <button onClick={() => { setOuverte(x.id); setOnglet("relances"); }}
                              style={{ ...BOUTON, padding: "4px 12px", fontSize: "12px" }}>
                              Ouvrir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
                <button onClick={() => setPage(0)} disabled={page === 0} style={{ ...BOUTON, padding: "9px 16px", opacity: page === 0 ? 0.35 : 1 }}>⏮ Début</button>
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ ...BOUTON, padding: "9px 18px", opacity: page === 0 ? 0.35 : 1 }}>Précédent</button>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>{page + 1} / {pages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page + 1 >= pages} style={{ ...BOUTON, padding: "9px 18px", opacity: page + 1 >= pages ? 0.35 : 1 }}>Suivant</button>
                <button onClick={() => setPage(pages - 1)} disabled={page + 1 >= pages} style={{ ...BOUTON, padding: "9px 16px", opacity: page + 1 >= pages ? 0.35 : 1 }}>Fin ⏭</button>
              </div>
            )}
          </div>
        )}

        {/* ---------- A RELANCER ---------- */}
        {onglet === "relances" && d && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Choisissez le motif : le message se prépare, vous le relisez, il part par courriel
              ou par SMS. Quand le client répond, déposez la pièce ici même — elle se lit et se
              comptabilise sans changer d'écran.
            </p>

            {aRelancer.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Rien à relancer. Tous les justificatifs sont là.
                </p>
              </div>
            ) : (
              aRelancer.map(function (x: any) {
                const ouvert = ouverte === x.id;
                return (
                  <div key={x.id} style={{ ...CARTE, border: ouvert ? "1px solid rgba(200,169,110,0.5)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <div style={{ color: "#fff", fontSize: "15px", fontWeight: "bold" }}>
                          {x.raison_sociale}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "3px" }}>
                          {x.code}
                          {x.contact_principal && x.contact_principal.nom ? " · " + x.contact_principal.nom : ""}
                          {x.derniere_relance_le ? " · relancé le " + jolieDate(x.derniere_relance_le) : " · jamais relancé"}
                        </div>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "7px", fontSize: "12.5px" }}>
                          {x.sans_piece > 0 && <span style={{ color: ORANGE }}>{nombre(x.sans_piece)} pièce(s) manquante(s)</span>}
                          {x.rapprochement > 0 && <span style={{ color: ROUGE }}>{nombre(x.rapprochement)} opération(s) bancaire(s)</span>}
                          {x.impayes > 0 && <span style={{ color: ROUGE }}>{euros(x.montant_impaye)} impayé(s)</span>}
                        </div>
                        {x.email && (
                          <div style={{ fontSize: "12.5px", marginTop: "6px" }}>
                            ✉️ <a href={"mailto:" + x.email} style={LIEN}>{x.email}</a>
                            {x.telephone ? <span> · ☎️ <a href={"tel:" + appelable(x.telephone)} style={LIEN}>{x.telephone}</a></span> : null}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignSelf: "flex-start" }}>
                        {boutonDepot(x, true)}
                        <button onClick={() => setOuverte(ouvert ? "" : x.id)} style={{ ...BOUTON, borderRadius: "8px", padding: "11px 18px", fontSize: "13.5px" }}>
                          {ouvert ? "Fermer" : "🔔 Relancer"}
                        </button>
                      </div>
                    </div>

                    {!x.joignable && (
                      <div style={{ marginTop: "10px", padding: "10px 12px", background: "rgba(232,131,106,0.1)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", color: ROUGE, fontSize: "12.5px", lineHeight: "1.7" }}>
                        Aucun contact enregistré : aucune relance ne peut partir.
                        <button
                          onClick={() => setFiche({ societe_id: x.id, nom: "", fonction: "", email: "", telephone: "", sms_accepte: false, principal: true, notes: "" })}
                          style={{ ...BOUTON, marginLeft: "10px", padding: "5px 13px", fontSize: "12px" }}>
                          ➕ Ajouter un contact
                        </button>
                      </div>
                    )}

                    {ouvert && (
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ color: OR, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "10px" }}>
                          LE MOTIF DE LA RELANCE
                        </div>
                        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>
                          {Object.keys(d.motifs || {}).map(function (m) {
                            return (
                              <button key={m} onClick={() => preparer(x, m)} disabled={occupe !== ""}
                                style={{ ...BOUTON, padding: "7px 14px" }}>
                                {occupe === "prep-" + x.id ? "…" : d.motifs[m].nom}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ color: OR, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "10px" }}>
                          LES CONTACTS DE CE DOSSIER
                        </div>
                        {(x.contacts || []).map(function (ct: any) {
                          return (
                            <div key={ct.id} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "12.5px" }}>
                              <span style={{ color: "rgba(255,255,255,0.8)" }}>
                                {ct.principal ? "★ " : ""}{ct.nom || "Sans nom"}
                                {ct.fonction ? " · " + ct.fonction : ""}
                                {ct.email ? " · " + ct.email : ""}
                                {ct.telephone ? " · " + ct.telephone : ""}
                                {ct.sms_accepte_le ? " · SMS accepté" : ""}
                              </span>
                              <button onClick={() => supprimerContact(ct.id)} disabled={occupe !== ""}
                                style={{ background: "none", border: "none", color: ROUGE, cursor: "pointer", fontSize: "12px" }}>
                                supprimer
                              </button>
                            </div>
                          );
                        })}

                        <button
                          onClick={() => setFiche({ societe_id: x.id, nom: "", fonction: "", email: "", telephone: "", sms_accepte: false, principal: (x.contacts || []).length === 0, notes: "" })}
                          style={{ ...BOUTON, marginTop: "12px" }}>
                          ➕ Ajouter un contact
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------- HISTORIQUE ---------- */}
        {onglet === "historique" && d && (
          <div>
            <h2 style={{ color: OR, fontSize: "16px", marginBottom: "16px" }}>
              RELANCES ENVOYÉES ({nombre(d.historique ? d.historique.length : 0)})
            </h2>
            {!d.historique || d.historique.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
                Aucune relance envoyée pour l'instant.
              </p>
            ) : (
              d.historique.map(function (h: any, i: number) {
                const nom = clients.filter(function (x: any) { return x.id === h.societe_id; })[0];
                return (
                  <div key={i} style={{ ...CARTE, padding: "12px 15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "13px" }}>
                      <span style={{ color: "#fff" }}>
                        {nom ? nom.raison_sociale : "Dossier supprimé"}
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>
                          {" · "}{d.motifs && d.motifs[h.motif] ? d.motifs[h.motif].nom : h.motif}
                        </span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                        {h.canal === "sms" ? "SMS" : "Courriel"} · {jolieDate(h.envoye_le)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ---------- LE DEPOT DE PIECE ---------- */}
      {cible && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div style={{ background: "#12121f", border: "1px solid rgba(68,138,255,0.45)", borderRadius: "12px", padding: "22px", maxWidth: "560px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ color: BLEU, fontSize: "12px", letterSpacing: "2px", marginBottom: "6px" }}>
              DÉPOSER UNE PIÈCE — {cible.raison_sociale}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 16px" }}>
              La pièce est lue automatiquement : fournisseur, date, montants et TVA. Vous relisez,
              puis vous comptabilisez.
            </p>

            {!lecture && (
              <>
                <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "8px" }}>
                  De quelle pièce s'agit-il ?
                </label>
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
                  {TYPES_PIECE.map(function (t) {
                    const actif = typePiece === t.cle;
                    return (
                      <button key={t.cle} onClick={() => setTypePiece(t.cle)}
                        style={{
                          ...BOUTON, padding: "8px 14px",
                          background: actif ? OR : BOUTON.background,
                          color: actif ? "#050508" : OR,
                          border: actif ? "none" : BOUTON.border,
                          fontWeight: actif ? "bold" : "normal",
                        }}>
                        {t.nom}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => { if (champFichier.current) champFichier.current.click(); }}
                  disabled={occupe !== ""}
                  style={{
                    width: "100%",
                    background: occupe !== "" ? "rgba(255,255,255,0.06)" : BLEU,
                    color: occupe !== "" ? "rgba(255,255,255,0.4)" : "#fff",
                    border: "none", borderRadius: "9px", padding: "16px",
                    fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
                    cursor: occupe !== "" ? "wait" : "pointer", marginBottom: "12px",
                  }}
                >
                  {occupe === "depot" ? "Dépôt en cours…"
                    : occupe === "lecture" ? "Lecture de la pièce…"
                    : "📎 Choisir le fichier"}
                </button>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 16px" }}>
                  PDF, JPEG ou PNG, 5 Mo maximum. Une facture électronique au format Factur-X est
                  lue dans son fichier structuré : les montants sont alors certains.
                </p>
              </>
            )}

            {lecture && (
              <div style={{ padding: "15px 17px", borderRadius: "10px", marginBottom: "16px", background: lecture.coherent ? "rgba(0,230,118,0.08)" : "rgba(232,163,61,0.08)", border: "1px solid " + (lecture.coherent ? "rgba(0,230,118,0.4)" : "rgba(232,163,61,0.45)") }}>
                <div style={{ color: lecture.structuree ? VERT : OR, fontSize: "11.5px", letterSpacing: "1.5px", marginBottom: "9px" }}>
                  {lecture.structuree ? "FACTURE ÉLECTRONIQUE — MONTANTS CERTAINS" : "LECTURE DE LA PIÈCE"}
                </div>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.75" }}>
                  {lecture.lu.fournisseur || "Fournisseur non lu"}
                  {lecture.lu.date ? " · " + jolieDate(lecture.lu.date) : ""}
                  {lecture.lu.reference ? " · " + lecture.lu.reference : ""}
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 8px" }}>
                  {euros(lecture.lu.montant_ht)} HT · {euros(lecture.lu.montant_tva)} de TVA ·{" "}
                  <strong>{euros(lecture.lu.montant_ttc)} TTC</strong>
                  {lecture.lu.confiance ? " · confiance " + lecture.lu.confiance + " %" : ""}
                </p>
                <p style={{ color: lecture.coherent ? VERT : ORANGE, fontSize: "12.5px", margin: 0, lineHeight: "1.7" }}>
                  {lecture.coherent
                    ? "Compte proposé : " + lecture.proposition.compte + " — " + lecture.proposition.origine
                    : "Les montants ne tombent pas juste : vérifiez avant de comptabiliser."}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              {lecture && (
                <button onClick={comptabiliser} disabled={occupe !== ""}
                  style={{ flex: "2 1 200px", background: OR, color: "#050508", border: "none", borderRadius: "8px", padding: "13px", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                  {occupe === "ecriture" ? "Écriture…" : "Comptabiliser"}
                </button>
              )}
              <button onClick={() => { setCible(null); setLecture(null); }} style={{ ...BOUTON, flex: "1 1 120px", borderRadius: "8px", padding: "13px" }}>
                {lecture ? "Plus tard" : "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- LE BROUILLON DE RELANCE ---------- */}
      {brouillon && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "640px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "6px" }}>
              RELANCE — {brouillon.raison_sociale}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 16px" }}>
              Relisez avant d'envoyer : ce message part au nom du cabinet.
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button onClick={() => setBrouillon({ ...brouillon, canal: "email" })}
                style={{ ...BOUTON, flex: 1, background: brouillon.canal === "email" ? OR : BOUTON.background, color: brouillon.canal === "email" ? "#050508" : OR, fontWeight: "bold" }}>
                ✉️ Courriel
              </button>
              <button
                onClick={() => setBrouillon({ ...brouillon, canal: "sms" })}
                disabled={!brouillon.contact || !brouillon.contact.sms_accepte_le}
                style={{
                  ...BOUTON, flex: 1,
                  background: brouillon.canal === "sms" ? OR : BOUTON.background,
                  color: brouillon.canal === "sms" ? "#050508"
                    : (brouillon.contact && brouillon.contact.sms_accepte_le) ? OR : "rgba(255,255,255,0.3)",
                  fontWeight: "bold",
                  cursor: (brouillon.contact && brouillon.contact.sms_accepte_le) ? "pointer" : "not-allowed",
                }}>
                📱 SMS
              </button>
            </div>

            {brouillon.canal === "sms" && (!brouillon.contact || !brouillon.contact.sms_accepte_le) && (
              <p style={{ color: ORANGE, fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 12px" }}>
                Ce contact n'a pas donné son accord pour recevoir des SMS.
              </p>
            )}

            <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "5px" }}>
              Référence de la pièce ou de la facture (facultative)
            </label>
            <input value={brouillon.reference} onChange={(e) => setBrouillon({ ...brouillon, reference: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            {brouillon.canal === "email" && (
              <>
                <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "5px" }}>Objet</label>
                <input value={brouillon.objet} onChange={(e) => setBrouillon({ ...brouillon, objet: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </>
            )}

            <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "5px" }}>
              Le message {brouillon.canal === "sms" ? "(SMS, 480 caractères maximum)" : ""}
            </label>
            <textarea
              value={brouillon.canal === "sms" ? brouillon.sms : brouillon.corps}
              onChange={(e) => setBrouillon(brouillon.canal === "sms"
                ? { ...brouillon, sms: e.target.value }
                : { ...brouillon, corps: e.target.value })}
              rows={brouillon.canal === "sms" ? 5 : 12}
              style={{ ...CHAMP, resize: "vertical", marginBottom: "16px" }} />

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <button onClick={envoyer} disabled={occupe === "envoi"}
                style={{ flex: "2 1 200px", background: OR, color: "#050508", border: "none", borderRadius: "8px", padding: "13px", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                {occupe === "envoi" ? "Envoi…" : "Envoyer la relance"}
              </button>
              <button onClick={() => setBrouillon(null)} style={{ ...BOUTON, flex: "1 1 120px", borderRadius: "8px", padding: "13px" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- LA FICHE CONTACT ---------- */}
      {fiche && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "520px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>
              NOUVEAU CONTACT
            </div>

            {[
              ["nom", "Nom et prénom"],
              ["fonction", "Fonction"],
              ["email", "Adresse électronique"],
              ["telephone", "Téléphone"],
            ].map(function (f: any) {
              return (
                <div key={f[0]}>
                  <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "5px" }}>{f[1]}</label>
                  <input value={fiche[f[0]] || ""} onChange={(e) => setFiche({ ...fiche, [f[0]]: e.target.value })}
                    style={{ ...CHAMP, marginBottom: "12px" }} />
                </div>
              );
            })}

            <label style={{ color: OR, fontSize: "12px", display: "block", marginBottom: "5px" }}>Notes</label>
            <textarea value={fiche.notes || ""} onChange={(e) => setFiche({ ...fiche, notes: e.target.value })}
              rows={3} style={{ ...CHAMP, resize: "vertical", marginBottom: "14px" }} />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button onClick={() => setFiche({ ...fiche, principal: !fiche.principal })}
                style={{ ...BOUTON, flex: "1 1 160px", background: fiche.principal ? "rgba(200,169,110,0.2)" : BOUTON.background }}>
                {fiche.principal ? "★ Contact principal" : "☆ Contact secondaire"}
              </button>
              <button onClick={() => setFiche({ ...fiche, sms_accepte: !fiche.sms_accepte })}
                style={{ ...BOUTON, flex: "1 1 160px", background: fiche.sms_accepte ? "rgba(0,230,118,0.15)" : BOUTON.background, color: fiche.sms_accepte ? VERT : OR }}>
                {fiche.sms_accepte ? "✓ Accepte les SMS" : "Pas de SMS"}
              </button>
            </div>

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 16px" }}>
              Ne cochez les SMS que si le client vous a donné son accord : un SMS non consenti
              est une infraction, et le numéro d'expédition se fait bloquer.
            </p>

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <button onClick={enregistrerContact} disabled={occupe === "contact"}
                style={{ flex: "2 1 180px", background: OR, color: "#050508", border: "none", borderRadius: "8px", padding: "13px", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                {occupe === "contact" ? "Enregistrement…" : "Enregistrer le contact"}
              </button>
              <button onClick={() => setFiche(null)} style={{ ...BOUTON, flex: "1 1 110px", borderRadius: "8px", padding: "13px" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
