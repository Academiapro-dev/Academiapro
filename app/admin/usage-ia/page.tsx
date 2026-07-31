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
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR") + " EUR";
}

export default async function PageUsageIA() {
  const session = sessionCourante();

  if (!session || ADMINS.indexOf(session.email) < 0) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Reserve a l administrateur</h1>
        </div>
      </div>
    );
  }

  const maintenant = new Date();
  const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));

  const { data: usage } = await supabase
    .from("organisme_usage_ia")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  const { data: organismes } = await supabase
    .from("organismes_formation")
    .select("tenant_id, raison_sociale, quota_ia_mensuel, abonnement_mensuel")
    .limit(500);

  const nomDe: any = {};
  const quotaDe: any = {};
  const abonnementDe: any = {};
  for (const o of organismes || []) {
    nomDe[o.tenant_id] = o.raison_sociale;
    quotaDe[o.tenant_id] = o.quota_ia_mensuel !== null && o.quota_ia_mensuel !== undefined ? Number(o.quota_ia_mensuel) : 40;
    abonnementDe[o.tenant_id] = Number(o.abonnement_mensuel) || 0;
  }

  const parClient: any = {};
  let coutTotal = 0;
  let coutMois = 0;

  for (const u of usage || []) {
    const ceMois = new Date(u.created_at).getTime() >= debutMois.getTime();
    const c = Number(u.cout_estime) || 0;

    coutTotal = coutTotal + c;
    if (ceMois) coutMois = coutMois + c;

    if (!parClient[u.tenant_id]) {
      parClient[u.tenant_id] = {
        tenant_id: u.tenant_id,
        nom: nomDe[u.tenant_id] || "client inconnu",
        quota: quotaDe[u.tenant_id] || 40,
        abonnement: abonnementDe[u.tenant_id] || 0,
        mois: 0,
        cout_mois: 0,
        total: 0,
        cout_total: 0,
        derniere: u.created_at,
      };
    }

    const p = parClient[u.tenant_id];
    p.total = p.total + 1;
    p.cout_total = p.cout_total + c;
    if (ceMois) {
      p.mois = p.mois + 1;
      p.cout_mois = p.cout_mois + c;
    }
  }

  const clients = Object.keys(parClient)
    .map(function (k) { return parClient[k]; })
    .sort(function (a: any, b: any) { return b.cout_mois - a.cout_mois; });

  const enTension = clients.filter(function (c: any) {
    return c.quota > 0 && c.mois >= c.quota * 0.8;
  });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CE QUE L USINE VOUS COUTE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Redaction assistee</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Cout reel de la redaction des modules, par client
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(coutMois)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Ce mois-ci</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(coutTotal)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Depuis le debut</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: enTension.length > 0 ? "#e8a33d" : "rgba(255,255,255,0.4)", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {enTension.length}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Pres de leur quota
            </p>
          </div>
        </div>

        {enTension.length > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
            <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              {enTension.length} client(s) ont consomme plus de quatre cinquiemes de leur quota.
              Appelez-les avant qu ils ne butent dessus : un client qui produit beaucoup est un
              client qui se sert de la plateforme, c est une bonne nouvelle — et l occasion de
              parler d une formule superieure.
            </p>
          </div>
        )}

        {clients.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune redaction assistee pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1.1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Client</span>
              <span>Ce mois</span>
              <span>Cout du mois</span>
              <span>Total</span>
              <span>Part de l abonnement</span>
            </div>

            {clients.map(function (c: any, i: number) {
              const proche = c.quota > 0 && c.mois >= c.quota * 0.8;
              const part = c.abonnement > 0 ? Math.round((c.cout_mois / c.abonnement) * 100) : null;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1.1fr", padding: "13px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center", background: proche ? "rgba(232,163,61,0.06)" : "transparent" }}>
                  <span>{c.nom}</span>
                  <span style={{ color: proche ? "#e8a33d" : "rgba(255,255,255,0.8)", fontWeight: proche ? "bold" : "normal" }}>
                    {c.mois} / {c.quota}
                  </span>
                  <span style={{ color: "#c8a96e" }}>{euros(c.cout_mois)}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{c.total} · {euros(c.cout_total)}</span>
                  <span style={{ color: part !== null && part > 20 ? "#e8836a" : "rgba(255,255,255,0.5)" }}>
                    {part !== null ? part + " %" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            La derniere colonne est la plus utile : elle dit quelle part de l abonnement d un
            client part en frais de redaction. Au-dela de vingt pour cent, elle passe en rouge —
            c est le moment de revoir son quota ou son tarif.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            Les couts sont estimes d apres les jetons reellement consommes. Le quota par defaut est
            de quarante modules par mois et se regle client par client.
          </p>
        </div>
      </div>
    </div>
  );
}
