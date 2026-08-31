"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// 🚨 LE TABLEAU DE BORD PORTE DESORMAIS SUR UNE SOCIETE PRECISE — 31/08.
//
// CE QUI CHANGE. Cet ecran lisait « la » societe du compte : il tenait pour
// acquis qu il n y en avait qu une. Il lit maintenant l identifiant passe
// dans l adresse (?entite=...), ce qui permet a un gestionnaire de passer
// d un dossier a l autre depuis son portefeuille.
//
// ⚠️ SANS PARAMETRE, RIEN NE CHANGE : la route rend la premiere societe de
// l organisme. Un client qui n en a qu une ne voit aucune difference, et
// aucun lien existant n est casse.
//
// ⚠️ L IDENTIFIANT VENANT DE L ADRESSE N EST PAS UNE AUTORISATION : c est
// la route qui verifie qu il appartient bien a l organisme de la session.
// Cet ecran ne fait que le transmettre.
// ---------------------------------------------------------------------------

const PNL_YEAR = 2026;
const VERT = "#0a3d2e";

type Deadline = {
  id: string;
  rule_code: string;
  title: string;
  jurisdiction: string;
  channel: string;
  period_label: string;
  due_date: string;
  status: string;
  amount_due: number | null;
  currency: string;
};

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  version: number;
  uploaded_at: string;
  download_url: string | null;
};

const STATUT_LABEL: Record<string, string> = {
  a_venir: "À venir",
  prepare: "Préparé",
  depose: "Déposé",
  accuse_archive: "Accusé archivé",
};

const STATUT_COLOR: Record<string, string> = {
  a_venir: "#888",
  prepare: "#8a6d2f",
  depose: "#2e7d32",
  accuse_archive: VERT,
};

function joursRestants(due: string): number {
  const d = new Date(due).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / 86400000);
}

export default function ComplianceDashboard() {
  // L organisme vient de la session, JAMAIS d une constante ecrite en dur :
  // sinon chaque client verrait les donnees du meme organisme.
  const [tenantId, setTenantId] = useState<string | null>(null);

  // La societe affichee. Lue dans l adresse au premier rendu, puis confirmee
  // par la reponse de la route — qui peut en choisir une autre si le
  // parametre est absent.
  const [entiteId, setEntiteId] = useState<string | null>(null);
  const [nbEntites, setNbEntites] = useState(1);

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [pnl, setPnl] = useState<any>(null);
  const [bilan, setBilan] = useState<any>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genDetail, setGenDetail] = useState<string | null>(null);

  const [irsLoading, setIrsLoading] = useState<string | null>(null);
  const [irsMsg, setIrsMsg] = useState<string | null>(null);
  const [irsUrl, setIrsUrl] = useState<string | null>(null);

  const [nbComptes, setNbComptes] = useState<number | null>(null);
  const [f3916Loading, setF3916Loading] = useState(false);
  const [f3916Msg, setF3916Msg] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const [pdfControle, setPdfControle] = useState<string | null>(null);

  // Les obligations ajoutees le 31/08 : extension de delai et fiches de
  // preparation. Un seul etat de chargement pour les quatre, elles ne se
  // lancent jamais en meme temps.
  const [autreLoading, setAutreLoading] = useState<string | null>(null);
  const [autreMsg, setAutreMsg] = useState<string | null>(null);
  const [autreUrl, setAutreUrl] = useState<string | null>(null);

  async function charger(id: string, entite: string | null) {
    setLoading(true);
    setErreur(null);
    try {
      const suffixe = entite ? "?entite=" + encodeURIComponent(entite) : "";
      const r = await fetch("/api/compliance/dashboard" + suffixe, { cache: "no-store" });
      const data = await r.json();
      if (!data.success) {
        setErreur(data.error || "Erreur de chargement");
      } else {
        setTenant(data.tenant);
        setDeadlines(data.deadlines || []);
        setDocuments(data.documents || []);
        setEntiteId(data.entite_id || null);
        setNbEntites(data.nb_entites || 1);
      }
      const rp = await fetch("/api/compliance/pnl?year=" + PNL_YEAR);
      const dp = await rp.json();
      if (dp.success) setPnl(dp);
      const rb = await fetch("/api/compliance/bilan");
      const db = await rb.json();
      if (db.success) setBilan(db);
      const rc = await fetch("/api/compliance/comptes-etrangers?tenant_id=" + id + "&year=" + PNL_YEAR);
      const dc = await rc.json();
      if (dc.success) setNbComptes((dc.comptes || []).length);
    } catch (e: any) {
      setErreur(String(e));
    }
    setLoading(false);
  }

  useEffect(() => {
    async function demarrer() {
      try {
        // L identifiant de societe est lu dans l adresse. Absent, la route
        // choisit la premiere de l organisme.
        let depuisUrl: string | null = null;
        try {
          depuisUrl = new URLSearchParams(window.location.search).get("entite");
        } catch (e) {
          depuisUrl = null;
        }

        const r = await fetch("/api/compliance/moi", { cache: "no-store" });
        const d = await r.json();
        if (!d.ok || !d.tenant_id) {
          setErreur("Connectez-vous pour accéder à votre espace.");
          setLoading(false);
          return;
        }
        setTenantId(d.tenant_id);
        charger(d.tenant_id, depuisUrl);
      } catch (e: any) {
        setErreur(String(e));
        setLoading(false);
      }
    }
    demarrer();
  }, []);

  // Toutes les generations portent sur la societe affichee. entite_id est
  // transmis en plus de tenant_id : les routes deja converties l utilisent,
  // les autres l ignorent sans dommage.
  async function genererAnnualReport() {
    if (!tenantId) return;
    setGenLoading(true);
    setGenMsg(null);
    setGenDetail(null);
    try {
      const r = await fetch("/api/compliance/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, entite_id: entiteId, year: 2027 }),
      });
      const data = await r.json();
      if (data.success) {
        let msg = "Fiche générée (version " + data.version + ", license tax " + data.tax + " USD) et archivée au coffre.";
        const em = data.email || {};
        if (em.envoye === true) {
          msg += " Courriel envoyé.";
        } else {
          msg += " ATTENTION : le courriel n'est PAS parti.";
          setGenDetail(
            "Cause : " + (em.raison || "inconnue") +
            (em.statut_http ? " (code HTTP " + em.statut_http + ")" : "") +
            (em.reponse ? " — réponse du service : " + em.reponse : "")
          );
        }
        setGenMsg(msg);
        charger(tenantId, entiteId);
      } else {
        setGenMsg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e: any) {
      setGenMsg("Erreur : " + String(e));
    }
    setGenLoading(false);
  }

  async function genererIRS(formulaire: "f5472" | "f1120") {
    if (!tenantId) return;
    setIrsLoading(formulaire);
    setIrsMsg(null);
    setIrsUrl(null);
    try {
      const r = await fetch("/api/compliance/" + formulaire + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entite_id: entiteId, year: PNL_YEAR }),
      });
      const data = await r.json();
      if (data.success) {
        const c = data.calcul || {};
        let msg =
          (formulaire === "f5472" ? "Form 5472" : "Form 1120 pro forma") +
          " généré pour " + data.year +
          " — " + c.nb_avances + " avances, total " + c.total_usd + " USD";
        if (c.taux_valide === false) {
          msg += " (taux de change PROVISOIRE, non validé par l'IRS)";
        }
        if (data.nb_avertissements > 0) {
          msg += " — " + data.nb_avertissements + " champ(s) non trouvé(s)";
        }
        setIrsMsg(msg);
        setIrsUrl(data.url || null);
      } else {
        setIrsMsg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e: any) {
      setIrsMsg("Erreur : " + String(e));
    }
    setIrsLoading(null);
  }

  async function generer3916() {
    if (!tenantId) return;
    setF3916Loading(true);
    setF3916Msg(null);
    try {
      const r = await fetch("/api/compliance/f3916/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entite_id: entiteId, year: PNL_YEAR }),
      });
      const data = await r.json();
      if (data.success) {
        let msg =
          "Fiche 3916 générée (version " + data.version + ") pour " + data.annee +
          " — " + data.nb_comptes + " compte(s) étranger(s), archivée au coffre.";
        if (data.nb_comptes === 0) {
          msg += " ATTENTION : aucun compte enregistré, la fiche est vide.";
        } else if (!data.tous_valides) {
          msg += " Au moins un compte n'est pas encore validé par un fiscaliste.";
        }
        const em = data.email || {};
        if (em.envoye === true) {
          msg += " Courriel envoyé.";
        } else {
          msg += " Le courriel n'est PAS parti (" + (em.raison || "cause inconnue") + ").";
        }
        setF3916Msg(msg);
        charger(tenantId, entiteId);
      } else {
        setF3916Msg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e: any) {
      setF3916Msg("Erreur : " + String(e));
    }
    setF3916Loading(false);
  }

  async function verifier3916Pdf() {
    if (!tenantId) return;
    setPdfLoading(true);
    setPdfMsg(null);
    setPdfControle(null);
    try {
      const r = await fetch("/api/compliance/f3916/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entite_id: entiteId, controle: true }),
      });
      const data = await r.json();
      if (data.ok) {
        setPdfMsg("Contrôle effectué sur le compte : " + data.compte);
        let txt = "CHAMPS REMPLIS\n";
        Object.keys(data.champs_remplis || {}).forEach((k) => {
          txt += k + " = " + data.champs_remplis[k] + "\n";
        });
        if ((data.avertissements || []).length > 0) {
          txt += "\nAVERTISSEMENTS\n";
          (data.avertissements || []).forEach((a: string) => {
            txt += "- " + a + "\n";
          });
        }
        setPdfControle(txt);
      } else {
        setPdfMsg("Erreur : " + (data.erreur || "inconnue"));
        if ((data.avertissements || []).length > 0) {
          setPdfControle((data.avertissements || []).join("\n"));
        }
      }
    } catch (e: any) {
      setPdfMsg("Erreur : " + String(e));
    }
    setPdfLoading(false);
  }

  async function telecharger3916Pdf() {
    if (!tenantId) return;
    setPdfLoading(true);
    setPdfMsg(null);
    try {
      const r = await fetch("/api/compliance/f3916/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entite_id: entiteId }),
      });
      if (!r.ok) {
        const data = await r.json();
        setPdfMsg("Erreur : " + (data.erreur || "inconnue"));
        setPdfLoading(false);
        return;
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "3916_prerempli.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setPdfMsg("PDF téléchargé. Vérifiez le rendu page par page.");
    } catch (e: any) {
      setPdfMsg("Erreur : " + String(e));
    }
    setPdfLoading(false);
  }

  // ---- LE FORM 7004 : EXTENSION DE DELAI ----
  //
  // ⚠️ IL DOIT ETRE DEPOSE AVANT L ECHEANCE D ORIGINE. Un 7004 envoye apres
  // le 15 avril ne vaut rien : l extension previent le retard, elle ne le
  // rattrape pas. C est pourquoi la reponse rappelle les deux dates.
  async function genererExtension() {
    if (!tenantId) return;
    setAutreLoading("7004");
    setAutreMsg(null);
    setAutreUrl(null);
    try {
      const r = await fetch("/api/compliance/f7004/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entite_id: entiteId, year: PNL_YEAR }),
      });
      const d = await r.json();
      if (d.success) {
        let msg = "Form 7004 généré pour " + d.year + ".";
        if (d.echeances) {
          msg += " À déposer avant le " + d.echeances.depot_extension_avant
            + " — reporte le dépôt du 1120 au " + d.echeances.nouvelle_limite_1120 + ".";
        }
        if (d.nb_avertissements > 0) {
          msg += " " + d.nb_avertissements + " champ(s) non trouvé(s) dans le formulaire.";
        }
        setAutreMsg(msg);
        setAutreUrl(d.url || null);
        charger(tenantId, entiteId);
      } else {
        setAutreMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e: any) {
      setAutreMsg("Erreur : " + String(e));
    }
    setAutreLoading(null);
  }

  // ---- LES FICHES DE PREPARATION ----
  //
  // Ces trois obligations ne se deposent pas sur un formulaire pre-rempli :
  // le BOI se saisit en ligne, le W-8BEN-E depend d un statut FATCA que
  // l outil ne connait pas, et le registered agent est un contrat a
  // renouveler. La fiche dit ou aller et quoi preparer.
  async function genererFiche(type: string, libelle: string) {
    if (!tenantId) return;
    setAutreLoading(type);
    setAutreMsg(null);
    setAutreUrl(null);
    try {
      const r = await fetch("/api/compliance/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, entite_id: entiteId, year: PNL_YEAR }),
      });
      const d = await r.json();
      if (d.success) {
        setAutreMsg(libelle + " générée (version " + d.version + ") et archivée au coffre.");
        setAutreUrl(d.url || null);
        charger(tenantId, entiteId);
      } else {
        setAutreMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e: any) {
      setAutreMsg("Erreur : " + String(e));
    }
    setAutreLoading(null);
  }

  const styleBouton = {
    background: VERT,
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15,
    marginRight: 10,
    marginBottom: 10,
  };

  const styleLien = {
    ...styleBouton,
    display: "inline-block",
    textDecoration: "none",
    background: "#ffffff",
    color: VERT,
    border: "1px solid " + VERT,
  };

  const styleCarte = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    background: "#ffffff",
    color: "#1a1a1a",
  };

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 32 }}>
        {/* Le retour au portefeuille n apparait QUE s il y a plusieurs
            societes : inutile d encombrer l ecran d un client qui n en a
            qu une. */}
        {nbEntites > 1 && (
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            <a href="/admin/compliance/entites" style={{ color: VERT, textDecoration: "none" }}>
              ← Portefeuille ({nbEntites} sociétés)
            </a>
          </p>
        )}

        <h1 style={{ color: VERT, borderBottom: "3px solid " + VERT, paddingBottom: 10 }}>
          {tenant && nbEntites > 1 ? tenant.label : "Conformité internationale"}
        </h1>

        {loading && <p>Chargement…</p>}
        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        {tenant && (
          <div style={{ background: "#f4f4f0", color: "#1a1a1a", padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <strong>{tenant.legal_name}</strong><br />
            État de constitution : {tenant.formation_state || "—"}<br />
            Wyoming Filing ID : {tenant.wy_filing_id || "—"}<br />
            Résidence du membre : {tenant.member_residence || "—"}<br />
            Résident fiscal français : {tenant.fr_tax_resident ? "Oui" : "Non"}<br />
            Revenus de source US : {tenant.has_us_source_income ? "Oui" : "Non"}
          </div>
        )}

        <h2 style={{ color: VERT, fontSize: 20 }}>Wyoming</h2>
        <button onClick={genererAnnualReport} disabled={genLoading} style={styleBouton}>
          {genLoading ? "Génération…" : "Générer la fiche Annual Report 2027"}
        </button>
        {genMsg && (
          <p style={{ marginTop: 10, color: genMsg.indexOf("ATTENTION") !== -1 ? "#c62828" : VERT }}>
            {genMsg}
          </p>
        )}
        {genDetail && (
          <pre
            style={{
              background: "#fff4f4",
              border: "1px solid #f0c0c0",
              color: "#8a1c1c",
              padding: 12,
              borderRadius: 6,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {genDetail}
          </pre>
        )}

        {/* ---- LES FORMULAIRES OFFICIELS DE L IRS ----
            Les trois produisent un vrai PDF a partir du CERFA americain.
            Le 7004 y figure parce qu il est l accessoire du 1120 : il en
            reporte le depot. Le separer des fiches de preparation, qui ne
            produisent que des documents de travail, evite de laisser croire
            que tout se depose de la meme facon. */}
        <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
          Formulaires IRS {PNL_YEAR}
        </h2>
        <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
          Documents fictifs tant que la qualification du compte courant n'a pas été
          validée par un CPA américain et que le taux de change officiel de l'IRS
          n'est pas publié. Les montants se recalculent automatiquement depuis les
          dépenses marquées comme avances personnelles.
        </p>
        <p style={{ fontSize: 14, color: "#8a1c1c", marginTop: 0 }}>
          <strong>Le Form 5472 est dû au 15 avril.</strong> Son dépôt tardif ou omis
          coûte 25 000 USD par société et par an, quelle que soit l'activité.
        </p>
        <button
          onClick={() => genererIRS("f5472")}
          disabled={irsLoading !== null}
          style={styleBouton}
        >
          {irsLoading === "f5472" ? "Génération…" : "Générer le Form 5472"}
        </button>
        <button
          onClick={() => genererIRS("f1120")}
          disabled={irsLoading !== null}
          style={styleBouton}
        >
          {irsLoading === "f1120" ? "Génération…" : "Générer le Form 1120 pro forma"}
        </button>
        <button
          onClick={genererExtension}
          disabled={autreLoading !== null}
          style={styleBouton}
        >
          {autreLoading === "7004" ? "Génération…" : "Générer le Form 7004"}
        </button>
        <p style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
          Le Form 7004 reporte au 15 octobre le dépôt du 1120 et de son 5472.
          Il doit être déposé avant le 15 avril, sinon l'échéance d'origine
          s'applique.
        </p>

        {irsMsg && (
          <p style={{ marginTop: 10, color: irsMsg.indexOf("Erreur") === 0 ? "#c62828" : VERT }}>
            {irsMsg}
          </p>
        )}
        {irsUrl && (
          <p style={{ marginTop: 6 }}>
            <a href={irsUrl} target="_blank" rel="noreferrer" style={{ color: VERT, fontWeight: "bold" }}>
              Ouvrir le PDF généré
            </a>
            <span style={{ color: "#666", fontSize: 13 }}> (lien valable 1 heure)</span>
          </p>
        )}

        {/* Le message du 7004 s affiche ici, sous le bouton qui l a
            declenche — et non en bas de page, ou il fallait le chercher. */}
        {autreMsg && autreLoading === null && autreMsg.indexOf("7004") >= 0 && (
          <p style={{ marginTop: 10, color: autreMsg.indexOf("Erreur") === 0 ? "#c62828" : VERT }}>
            {autreMsg}
            {autreUrl && (
              <>
                <br />
                <a href={autreUrl} target="_blank" rel="noreferrer" style={{ color: VERT, fontWeight: "bold" }}>
                  Ouvrir le PDF généré
                </a>
                <span style={{ color: "#666", fontSize: 13 }}> (lien valable 1 heure)</span>
              </>
            )}
          </p>
        )}

        {/* Le bloc 3916 ne concerne QUE les residents fiscaux francais.
            L afficher a un expatrie serait au mieux inutile, au pire
            inquietant : il fuit precisement ces obligations. */}
        {tenant && tenant.fr_tax_resident && (
          <>
            <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
              Comptes étrangers — formulaire 3916 ({PNL_YEAR})
            </h2>
            <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
              Article 1649 A du CGI : tout compte ouvert, détenu, utilisé ou sous procuration
              à l'étranger doit être déclaré. Pénalité d'omission : 1 500 € par compte et par an.
            </p>
            <p style={{ fontSize: 15, marginTop: 0 }}>
              Comptes enregistrés pour {PNL_YEAR} :{" "}
              <strong style={{ color: nbComptes === 0 ? "#c62828" : VERT }}>
                {nbComptes === null ? "…" : nbComptes}
              </strong>
              {nbComptes === 0 && (
                <span style={{ color: "#c62828" }}> — rien à déclarer pour l'instant</span>
              )}
            </p>
            <a href="/admin/compliance/comptes-etrangers" style={styleLien}>
              Gérer les comptes étrangers
            </a>
            <button onClick={generer3916} disabled={f3916Loading} style={styleBouton}>
              {f3916Loading ? "Génération…" : "Générer la fiche 3916"}
            </button>
            {f3916Msg && (
              <p style={{ marginTop: 10, color: f3916Msg.indexOf("Erreur") === 0 || f3916Msg.indexOf("ATTENTION") !== -1 ? "#c62828" : VERT }}>
                {f3916Msg}
              </p>
            )}

            <div style={{ ...styleCarte, marginTop: 16, background: "#f8f8f4" }}>
              <h3 style={{ color: VERT, marginTop: 0, fontSize: 17 }}>
                CERFA 3916 pré-rempli (PDF officiel)
              </h3>
              <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
                Remplit le CERFA officiel n° 11916*13 à partir de la fiche déclarant et
                du compte sélectionné. Aide-mémoire à recopier : la déclaration réelle se
                saisit en ligne sur impots.gouv.fr.
              </p>
              <button onClick={verifier3916Pdf} disabled={pdfLoading} style={styleLien}>
                {pdfLoading ? "…" : "Vérifier le mapping"}
              </button>
              <button onClick={telecharger3916Pdf} disabled={pdfLoading} style={styleBouton}>
                {pdfLoading ? "…" : "Télécharger le PDF pré-rempli"}
              </button>
              {pdfMsg && (
                <p style={{ marginTop: 10, color: pdfMsg.indexOf("Erreur") === 0 ? "#c62828" : VERT }}>
                  {pdfMsg}
                </p>
              )}
              {pdfControle && (
                <pre
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ddd",
                    color: "#1a1a1a",
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {pdfControle}
                </pre>
              )}
            </div>
          </>
        )}

        {/* ---- LES FICHES DE PREPARATION ----
            Elles ne produisent PAS de formulaire officiel : le BOI se
            saisit en ligne, le W-8BEN-E depend d un statut FATCA que
            l outil ne connait pas, et le registered agent est un contrat a
            renouveler. Le document produit est une aide au travail, pas une
            piece a deposer — d ou la section separee. */}
        <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
          Fiches de préparation
        </h2>
        <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
          Ces obligations ne se déposent pas sur un formulaire pré-rempli. La fiche
          indique où déposer, quoi préparer, et ce qui est en jeu.
        </p>

        <button
          onClick={() => genererFiche("boi", "Fiche BOI FinCEN")}
          disabled={autreLoading !== null}
          style={styleLien}
        >
          {autreLoading === "boi" ? "…" : "Fiche BOI FinCEN"}
        </button>
        <button
          onClick={() => genererFiche("w8bene", "Fiche W-8BEN-E")}
          disabled={autreLoading !== null}
          style={styleLien}
        >
          {autreLoading === "w8bene" ? "…" : "Fiche W-8BEN-E"}
        </button>
        {tenant && (!tenant.formation_state || tenant.formation_state === "WY") && (
          <button
            onClick={() => genererFiche("registered_agent", "Fiche registered agent")}
            disabled={autreLoading !== null}
            style={styleLien}
          >
            {autreLoading === "registered_agent" ? "…" : "Fiche registered agent"}
          </button>
        )}

        {/* Le message des fiches, ici et pas ailleurs. Le test sur « 7004 »
            evite qu un message d extension s affiche dans cette section. */}
        {autreMsg && autreLoading === null && autreMsg.indexOf("7004") < 0 && (
          <p style={{ marginTop: 10, color: autreMsg.indexOf("Erreur") === 0 ? "#c62828" : VERT }}>
            {autreMsg}
            {autreUrl && (
              <>
                <br />
                <a href={autreUrl} target="_blank" rel="noreferrer" style={{ color: VERT, fontWeight: "bold" }}>
                  Ouvrir la fiche générée
                </a>
                <span style={{ color: "#666", fontSize: 13 }}> (lien valable 1 heure)</span>
              </>
            )}
          </p>
        )}

        <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
          Compte de résultat {PNL_YEAR} (par devise)
        </h2>
        {!pnl && <p>Chargement du compte de résultat…</p>}
        {pnl && Object.keys(pnl.resultat || {}).length === 0 && (
          <p>Aucune donnée financière pour {PNL_YEAR}.</p>
        )}
        {pnl && Object.keys(pnl.resultat || {}).map((dev: string) => {
          const res = pnl.resultat[dev];
          const cats = pnl.charges[dev]?.parCategorie || {};
          return (
            <div key={dev} style={styleCarte}>
              <h3 style={{ color: VERT, marginTop: 0 }}>Devise : {dev}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <tbody>
                  <tr><td style={{ padding: 6 }}>Produits (factures encaissées)</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{res.produits.toFixed(2)} {dev}</td></tr>
                  <tr><td style={{ padding: 6 }}>Charges (dépenses)</td>
                    <td style={{ padding: 6, textAlign: "right" }}>- {res.charges.toFixed(2)} {dev}</td></tr>
                  <tr style={{ borderTop: "2px solid " + VERT, fontWeight: "bold" }}>
                    <td style={{ padding: 6 }}>Résultat net</td>
                    <td style={{ padding: 6, textAlign: "right", color: res.net >= 0 ? "#2e7d32" : "#c62828" }}>
                      {res.net.toFixed(2)} {dev}
                    </td></tr>
                </tbody>
              </table>
              {Object.keys(cats).length > 0 && (
                <details>
                  <summary style={{ cursor: "pointer", color: VERT }}>Détail des charges par catégorie</summary>
                  <ul>
                    {Object.keys(cats).map((c) => (
                      <li key={c}>{c} : {cats[c].toFixed(2)} {dev}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}

        {pnl && pnl.trimestres && Object.keys(pnl.trimestres).length > 0 && (
          <>
            <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
              Ventilation trimestrielle {PNL_YEAR} (pour l'OSS)
            </h2>
            {Object.keys(pnl.trimestres).map((dev: string) => (
              <div key={dev} style={styleCarte}>
                <h3 style={{ color: VERT, marginTop: 0 }}>Devise : {dev}</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: VERT, color: "#ffffff" }}>
                      <th style={{ padding: 8, textAlign: "left" }}>Trimestre</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Produits</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Charges</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Résultat net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((t) => {
                      const b = pnl.trimestres[dev][t] || { produits: 0, charges: 0, net: 0 };
                      return (
                        <tr key={t} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: 8 }}>T{t}</td>
                          <td style={{ padding: 8, textAlign: "right" }}>{b.produits.toFixed(2)}</td>
                          <td style={{ padding: 8, textAlign: "right" }}>{b.charges.toFixed(2)}</td>
                          <td style={{ padding: 8, textAlign: "right", color: b.net >= 0 ? "#2e7d32" : "#c62828" }}>
                            {b.net.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}

        {bilan && bilan.bilan && (
          <>
            <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>
              Bilan de gestion
            </h2>
            {Object.keys(bilan.bilan).length === 0 && (
              <p>Aucune créance ni dette en cours.</p>
            )}
            {Object.keys(bilan.bilan).map((dev: string) => {
              const b = bilan.bilan[dev];
              return (
                <div key={dev} style={styleCarte}>
                  <h3 style={{ color: VERT, marginTop: 0 }}>Devise : {dev}</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ fontWeight: "bold", color: VERT }}>
                        <td style={{ padding: 6 }}>ACTIF</td><td></td>
                      </tr>
                      <tr><td style={{ padding: 6, paddingLeft: 20 }}>Créances (factures non payées)</td>
                        <td style={{ padding: 6, textAlign: "right" }}>{b.actif.creances.toFixed(2)} {dev}</td></tr>
                      <tr><td style={{ padding: 6, paddingLeft: 20, color: "#666" }}>Trésorerie</td>
                        <td style={{ padding: 6, textAlign: "right", color: "#666" }}>via Wise (à venir)</td></tr>
                      <tr style={{ fontWeight: "bold", color: VERT }}>
                        <td style={{ padding: 6, paddingTop: 12 }}>PASSIF</td><td></td>
                      </tr>
                      <tr><td style={{ padding: 6, paddingLeft: 20 }}>Dettes envers le membre (avances perso)</td>
                        <td style={{ padding: 6, textAlign: "right" }}>{b.passif.dettes_membre.toFixed(2)} {dev}</td></tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
            <p style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>{bilan.note}</p>
          </>
        )}

        <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>Calendrier des échéances</h2>
        {deadlines.length === 0 && (
          <p style={{ color: "#c62828" }}>
            Aucune échéance enregistrée pour cette société. Sans échéance, aucune
            relance ne partira.
          </p>
        )}
        {deadlines.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: VERT, color: "#ffffff" }}>
                <th style={{ padding: 8, textAlign: "left" }}>Échéance</th>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Dans</th>
                <th style={{ padding: 8 }}>Statut</th>
                <th style={{ padding: 8 }}>Montant</th>
                <th style={{ padding: 8 }}>Canal</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((d) => {
                const jr = joursRestants(d.due_date);
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: 8 }}>{d.title}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{d.due_date}</td>
                    <td style={{ padding: 8, textAlign: "center", color: jr <= 15 ? "#c62828" : "#1a1a1a" }}>
                      {jr > 0 ? "J-" + jr : "échue"}
                    </td>
                    <td style={{ padding: 8, textAlign: "center", color: STATUT_COLOR[d.status] || "#1a1a1a" }}>
                      {STATUT_LABEL[d.status] || d.status}
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>
                      {d.amount_due ? d.amount_due + " " + d.currency : "—"}
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>{d.channel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <h2 style={{ color: VERT, fontSize: 20, marginTop: 32 }}>Coffre documentaire</h2>
        <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
          Documents générés par le système et pièces justificatives déposées.
          Chaque dépôt est versionné, horodaté et scellé par une empreinte SHA-256.
        </p>
        <a href="/admin/compliance/deposer" style={styleLien}>
          Déposer une pièce au coffre
        </a>
        {documents.length === 0 && <p>Aucun document archivé.</p>}
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} style={{ marginBottom: 8 }}>
              {doc.title} (v{doc.version}) — {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
              {doc.download_url && (
                <> — <a href={doc.download_url} target="_blank" rel="noreferrer" style={{ color: VERT }}>Télécharger</a></>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
