"use client";

import { useEffect, useState } from "react";

const TENANT_ID = "048da817-b4d1-40d8-9107-88fe87e600ee";
const PNL_YEAR = 2026;

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
  a_venir: "A venir",
  prepare: "Prepare",
  depose: "Depose",
  accuse_archive: "Accuse archive",
};

const STATUT_COLOR: Record<string, string> = {
  a_venir: "#888",
  prepare: "#8a6d2f",
  depose: "#2e7d32",
  accuse_archive: "#0a3d2e",
};

function joursRestants(due: string): number {
  const d = new Date(due).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / 86400000);
}

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [pnl, setPnl] = useState<any>(null);
  const [bilan, setBilan] = useState<any>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  const [irsLoading, setIrsLoading] = useState<string | null>(null);
  const [irsMsg, setIrsMsg] = useState<string | null>(null);
  const [irsUrl, setIrsUrl] = useState<string | null>(null);

  async function charger() {
    setLoading(true);
    setErreur(null);
    try {
      const r = await fetch("/api/compliance/dashboard?tenant_id=" + TENANT_ID);
      const data = await r.json();
      if (!data.success) {
        setErreur(data.error || "Erreur de chargement");
      } else {
        setTenant(data.tenant);
        setDeadlines(data.deadlines || []);
        setDocuments(data.documents || []);
      }
      const rp = await fetch("/api/compliance/pnl?year=" + PNL_YEAR);
      const dp = await rp.json();
      if (dp.success) setPnl(dp);
      const rb = await fetch("/api/compliance/bilan");
      const db = await rb.json();
      if (db.success) setBilan(db);
    } catch (e: any) {
      setErreur(String(e));
    }
    setLoading(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function genererAnnualReport() {
    setGenLoading(true);
    setGenMsg(null);
    try {
      const r = await fetch("/api/compliance/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID, year: 2027 }),
      });
      const data = await r.json();
      if (data.success) {
        setGenMsg("Fiche generee (version " + data.version + ", license tax " + data.tax + " USD). Envoyee par email et archivee.");
        charger();
      } else {
        setGenMsg("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e: any) {
      setGenMsg("Erreur : " + String(e));
    }
    setGenLoading(false);
  }

  async function genererIRS(formulaire: "f5472" | "f1120") {
    setIrsLoading(formulaire);
    setIrsMsg(null);
    setIrsUrl(null);
    try {
      const r = await fetch("/api/compliance/" + formulaire + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID, year: PNL_YEAR }),
      });
      const data = await r.json();
      if (data.success) {
        const c = data.calcul || {};
        let msg =
          (formulaire === "f5472" ? "Form 5472" : "Form 1120 pro forma") +
          " genere pour " + data.year +
          " - " + c.nb_avances + " avances, total " + c.total_usd + " USD";
        if (c.taux_valide === false) {
          msg += " (taux de change PROVISOIRE, non valide par l'IRS)";
        }
        if (data.nb_avertissements > 0) {
          msg += " - " + data.nb_avertissements + " champ(s) non trouve(s)";
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

  const styleBouton = {
    background: "#0a3d2e",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15,
    marginRight: 10,
    marginBottom: 10,
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
        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
          Tableau de bord Compliance
        </h1>

        {loading && <p>Chargement...</p>}
        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        {tenant && (
          <div style={{ background: "#f4f4f0", color: "#1a1a1a", padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <strong>{tenant.legal_name}</strong><br />
            Wyoming Filing ID : {tenant.wy_filing_id || "-"}<br />
            Residence du fondateur : {tenant.member_residence || "-"}<br />
            Revenus de source US : {tenant.has_us_source_income ? "Oui" : "Non"}
          </div>
        )}

        <h2 style={{ color: "#0a3d2e", fontSize: 20 }}>Wyoming</h2>
        <button onClick={genererAnnualReport} disabled={genLoading} style={styleBouton}>
          {genLoading ? "Generation..." : "Generer la fiche Annual Report 2027"}
        </button>
        {genMsg && <p style={{ marginTop: 10, color: "#0a3d2e" }}>{genMsg}</p>}

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>
          Formulaires IRS {PNL_YEAR}
        </h2>
        <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
          Documents fictifs tant que la qualification du compte courant n'a pas ete
          validee par un CPA americain et que le taux de change officiel de l'IRS
          n'est pas publie. Les montants se recalculent automatiquement depuis les
          depenses marquees comme avances personnelles.
        </p>
        <button
          onClick={() => genererIRS("f5472")}
          disabled={irsLoading !== null}
          style={styleBouton}
        >
          {irsLoading === "f5472" ? "Generation..." : "Generer le Form 5472"}
        </button>
        <button
          onClick={() => genererIRS("f1120")}
          disabled={irsLoading !== null}
          style={styleBouton}
        >
          {irsLoading === "f1120" ? "Generation..." : "Generer le Form 1120 pro forma"}
        </button>
        {irsMsg && (
          <p style={{ marginTop: 10, color: irsMsg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>
            {irsMsg}
          </p>
        )}
        {irsUrl && (
          <p style={{ marginTop: 6 }}>
            <a href={irsUrl} target="_blank" rel="noreferrer" style={{ color: "#0a3d2e", fontWeight: "bold" }}>
              Ouvrir le PDF genere
            </a>
            <span style={{ color: "#666", fontSize: 13 }}> (lien valable 1 heure)</span>
          </p>
        )}

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>
          Compte de resultat {PNL_YEAR} (par devise)
        </h2>
        {!pnl && <p>Chargement du P&L...</p>}
        {pnl && Object.keys(pnl.resultat || {}).length === 0 && (
          <p>Aucune donnee financiere pour {PNL_YEAR}.</p>
        )}
        {pnl && Object.keys(pnl.resultat || {}).map((dev: string) => {
          const res = pnl.resultat[dev];
          const cats = pnl.charges[dev]?.parCategorie || {};
          return (
            <div key={dev} style={styleCarte}>
              <h3 style={{ color: "#0a3d2e", marginTop: 0 }}>Devise : {dev}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <tbody>
                  <tr><td style={{ padding: 6 }}>Produits (factures encaissees)</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{res.produits.toFixed(2)} {dev}</td></tr>
                  <tr><td style={{ padding: 6 }}>Charges (depenses)</td>
                    <td style={{ padding: 6, textAlign: "right" }}>- {res.charges.toFixed(2)} {dev}</td></tr>
                  <tr style={{ borderTop: "2px solid #0a3d2e", fontWeight: "bold" }}>
                    <td style={{ padding: 6 }}>Resultat net</td>
                    <td style={{ padding: 6, textAlign: "right", color: res.net >= 0 ? "#2e7d32" : "#c62828" }}>
                      {res.net.toFixed(2)} {dev}
                    </td></tr>
                </tbody>
              </table>
              {Object.keys(cats).length > 0 && (
                <details>
                  <summary style={{ cursor: "pointer", color: "#0a3d2e" }}>Detail des charges par categorie</summary>
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
            <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>
              Ventilation trimestrielle {PNL_YEAR} (pour l'OSS)
            </h2>
            {Object.keys(pnl.trimestres).map((dev: string) => (
              <div key={dev} style={styleCarte}>
                <h3 style={{ color: "#0a3d2e", marginTop: 0 }}>Devise : {dev}</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0a3d2e", color: "#ffffff" }}>
                      <th style={{ padding: 8, textAlign: "left" }}>Trimestre</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Produits</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Charges</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Resultat net</th>
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
            <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>
              Bilan de gestion
            </h2>
            {Object.keys(bilan.bilan).length === 0 && (
              <p>Aucune creance ni dette en cours.</p>
            )}
            {Object.keys(bilan.bilan).map((dev: string) => {
              const b = bilan.bilan[dev];
              return (
                <div key={dev} style={styleCarte}>
                  <h3 style={{ color: "#0a3d2e", marginTop: 0 }}>Devise : {dev}</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ fontWeight: "bold", color: "#0a3d2e" }}>
                        <td style={{ padding: 6 }}>ACTIF</td><td></td>
                      </tr>
                      <tr><td style={{ padding: 6, paddingLeft: 20 }}>Creances (factures non payees)</td>
                        <td style={{ padding: 6, textAlign: "right" }}>{b.actif.creances.toFixed(2)} {dev}</td></tr>
                      <tr><td style={{ padding: 6, paddingLeft: 20, color: "#666" }}>Tresorerie</td>
                        <td style={{ padding: 6, textAlign: "right", color: "#666" }}>via Wise (a venir)</td></tr>
                      <tr style={{ fontWeight: "bold", color: "#0a3d2e" }}>
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

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>Calendrier des echeances</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0a3d2e", color: "#ffffff" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Echeance</th>
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
                  <td style={{ padding: 8, textAlign: "center" }}>{jr > 0 ? "J-" + jr : "echu"}</td>
                  <td style={{ padding: 8, textAlign: "center", color: STATUT_COLOR[d.status] || "#1a1a1a" }}>
                    {STATUT_LABEL[d.status] || d.status}
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    {d.amount_due ? d.amount_due + " " + d.currency : "-"}
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>{d.channel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 style={{ color: "#0a3d2e", fontSize: 20, marginTop: 32 }}>Coffre documentaire</h2>
        {documents.length === 0 && <p>Aucun document archive.</p>}
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} style={{ marginBottom: 8 }}>
              {doc.title} (v{doc.version}) - {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
              {doc.download_url && (
                <> - <a href={doc.download_url} target="_blank" rel="noreferrer" style={{ color: "#0a3d2e" }}>Telecharger</a></>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
