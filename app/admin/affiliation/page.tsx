import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

const CADRE: any = {
  minHeight: "100vh",
  background: "#050508",
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "40px 20px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "20px 24px",
  marginBottom: "16px",
};

function euros(n: any) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default async function PageAffiliation() {
  const session = sessionCourante();

  if (!session || ADMINS.indexOf(session.email) < 0) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", fontSize: "24px" }}>Programme partenaire</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7" }}>
            Cette page est réservée à l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  const { data: affilies } = await supabase
    .from("affilies")
    .select("id, nom, email, code_affiliation, commission_pct, total_clics, total_ventes, total_gains, statut, created_at")
    .order("total_gains", { ascending: false })
    .limit(500);

  const { data: ventes } = await supabase
    .from("ventes_affiliation")
    .select("id, code_affiliation, formation_code, montant, commission, statut, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const liste = affilies || [];
  const lignes = ventes || [];

  // Ce qui reste a payer, ce qui a deja ete regle, et ce qui a ete annule
  // par un remboursement : trois totaux qui ne se confondent pas.
  let aRegler = 0;
  let regle = 0;
  let annule = 0;

  for (const v of lignes) {
    const c = Number(v.commission) || 0;
    const s = String(v.statut || "a_regler");
    if (s === "regle" || s === "payee") regle = regle + c;
    else if (s === "annulee") annule = annule + c;
    else aRegler = aRegler + c;
  }

  aRegler = Math.round(aRegler * 100) / 100;
  regle = Math.round(regle * 100) / 100;
  annule = Math.round(annule * 100) / 100;

  const nomDe: any = {};
  for (const a of liste) nomDe[a.code_affiliation] = a.nom;

  const clics = liste.reduce(function (t: number, a: any) { return t + (a.total_clics || 0); }, 0);
  const ventesTotal = lignes.filter(function (v: any) { return String(v.statut || "") !== "annulee"; }).length;
  const conversion = clics > 0 ? Math.round((ventesTotal / clics) * 1000) / 10 : 0;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/admin" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          PROGRAMME PARTENAIRE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Mes partenaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {liste.length} partenaire(s) · {clics} visite(s) apportée(s) · {conversion} % de conversion
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(aRegler)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              À régler
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
            <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(regle)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Déjà réglé
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 180px", marginBottom: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(annule)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Annulé par remboursement
            </p>
          </div>
        </div>

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "30px 0 14px" }}>
          Les partenaires
        </h2>

        {liste.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucun partenaire inscrit pour l'instant. La page publique est à l'adresse
              academiapro.fr/partenaire.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden", marginBottom: "30px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.7fr 0.7fr 0.9fr 0.8fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Partenaire</span>
              <span>Code</span>
              <span>Visites</span>
              <span>Ventes</span>
              <span>Gains</span>
              <span>Statut</span>
            </div>

            {liste.map(function (a: any) {
              return (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.7fr 0.7fr 0.9fr 0.8fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span>
                    {a.nom}
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", wordBreak: "break-all" }}>{a.email}</span>
                  </span>
                  <span style={{ color: "#c8a96e", fontSize: "12.5px" }}>{a.code_affiliation}</span>
                  <span>{a.total_clics || 0}</span>
                  <span>{a.total_ventes || 0}</span>
                  <span style={{ color: "#4caf50", fontWeight: "bold" }}>{euros(a.total_gains)}</span>
                  <span style={{ color: String(a.statut) === "actif" ? "#4caf50" : "#e8836a", fontSize: "12.5px" }}>
                    {String(a.statut) === "actif" ? "actif" : a.statut}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "30px 0 14px" }}>
          Les commissions
        </h2>

        {lignes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune vente attribuée pour l'instant.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.9fr 0.9fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Partenaire</span>
              <span>Formation</span>
              <span>Base HT</span>
              <span>Commission</span>
              <span>Statut</span>
              <span>Date</span>
            </div>

            {lignes.map(function (v: any) {
              const statut = String(v.statut || "a_regler");
              const couleur = statut === "annulee"
                ? "rgba(255,255,255,0.4)"
                : (statut === "regle" || statut === "payee") ? "#4caf50" : "#e8a33d";

              return (
                <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.9fr 0.9fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center", opacity: statut === "annulee" ? 0.55 : 1 }}>
                  <span>{nomDe[v.code_affiliation] || v.code_affiliation}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{v.formation_code}</span>
                  <span>{euros(v.montant)}</span>
                  <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{euros(v.commission)}</span>
                  <span style={{ color: couleur, fontSize: "12.5px" }}>
                    {statut === "annulee" ? "annulée" : (statut === "regle" || statut === "payee") ? "réglée" : "à régler"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
                    {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "24px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            La commission se calcule sur le montant hors taxes de la vente, frais de paiement
            déduits, et n'est versée qu'une seule fois par vente. Un remboursement l'annule
            automatiquement.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            Pour marquer une commission comme réglée, passez son statut à « regle » dans la table
            ventes_affiliation. Un bouton sera ajouté ici quand les premiers versements auront lieu.
          </p>
        </div>
      </div>
    </div>
  );
}
