import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
}

export default async function PageFacturationClient() {
  const session = sessionCourante();

  if (!session || !session.tenantId) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", fontSize: "24px" }}>Votre facturation</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7" }}>
            Connectez-vous avec le compte de votre organisme.
          </p>
        </div>
      </div>
    );
  }

  const t = session.tenantId;

  const { data: org } = await supabase
    .from("organismes_formation")
    .select("raison_sociale, abonnement_mensuel, taux_prelevement, plancher_stagiaire, lancement_jusqu_au")
    .eq("tenant_id", t)
    .maybeSingle();

  const maintenant = new Date();
  const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 1));

  const { data: inscriptions } = await supabase
    .from("organisme_apprenants")
    .select("email, nom, formation_code, prix_vente, created_at")
    .eq("tenant_id", t)
    .gte("created_at", debut.toISOString())
    .lt("created_at", fin.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  const { data: catalogue } = await supabase
    .from("organisme_catalogue")
    .select("formation_code, prix_vente_public")
    .eq("tenant_id", t)
    .eq("actif", true)
    .limit(1000);

  const prixDe: any = {};
  const souscrites = new Set<string>();
  for (const c of catalogue || []) {
    prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;
    souscrites.add(c.formation_code);
  }

  const { data: fiches } = await supabase
    .from("formations")
    .select("code, titre")
    .limit(1000);

  const titreDe: any = {};
  for (const f of fiches || []) titreDe[f.code] = f.titre;

  const taux = org && org.taux_prelevement !== null && org.taux_prelevement !== undefined
    ? Number(org.taux_prelevement)
    : 35;
  const plancher = org && org.plancher_stagiaire !== null && org.plancher_stagiaire !== undefined
    ? Number(org.plancher_stagiaire)
    : 30;

  const abonnementPlein = org ? Number(org.abonnement_mensuel) || 0 : 0;
  const enLancement = org && org.lancement_jusqu_au
    ? new Date(org.lancement_jusqu_au).getTime() >= debut.getTime()
    : false;
  const abonnement = enLancement ? Math.round(abonnementPlein / 2) : abonnementPlein;

  const lignes: any[] = [];
  let du = 0;
  let propres = 0;

  for (const i of inscriptions || []) {
    const code = i.formation_code || "";

    if (!code || !souscrites.has(code)) {
      propres = propres + 1;
      lignes.push({
        email: i.email,
        nom: i.nom,
        code: code,
        titre: code ? (titreDe[code] || code) : "sans formation",
        prix: null,
        du: 0,
        motif: "votre propre formation",
        quand: i.created_at,
      });
      continue;
    }

    let prix = Number(i.prix_vente) || 0;
    if (!prix) prix = prixDe[code] || 0;

    const part = Math.round(prix * taux) / 100;
    const retenu = Math.max(part, plancher);
    du = du + retenu;

    lignes.push({
      email: i.email,
      nom: i.nom,
      code: code,
      titre: titreDe[code] || code,
      prix: prix,
      du: retenu,
      motif: part < plancher ? "minimum par stagiaire" : taux + " % de " + euros(prix),
      quand: i.created_at,
    });
  }

  du = Math.round(du * 100) / 100;
  const total = Math.round((abonnement + du) * 100) / 100;
  const mois = maintenant.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          EN COURS · {mois.toUpperCase()}
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Ma facturation</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce qui sera facture en fin de mois, mis a jour en continu
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(abonnement)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Abonnement{enLancement ? " · tarif de lancement" : ""}
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(du)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Sur le catalogue · {(inscriptions || []).length - propres} inscription(s)
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0, border: "1px solid rgba(200,169,110,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(total)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Total du mois, hors taxes
            </p>
          </div>
        </div>

        {enLancement && org && org.lancement_jusqu_au && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
              Vous beneficiez du tarif de lancement jusqu au{" "}
              {new Date(org.lancement_jusqu_au).toLocaleDateString("fr-FR")}. Au-dela, l abonnement
              passera a {euros(abonnementPlein)} par mois, comme prevu a votre bon de commande.
            </p>
          </div>
        )}

        {propres > 0 && (
          <div style={{ ...CARTE, background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.3)" }}>
            <p style={{ color: "#4caf50", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
              {propres} inscription(s) sur vos propres formations : elles ne vous coutent rien.
              Seules les formations de notre catalogue donnent lieu a une part.
            </p>
          </div>
        )}

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
          Le detail, inscription par inscription
        </h2>

        {lignes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune inscription ce mois-ci. Seul l abonnement sera facture.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr 0.9fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Stagiaire</span>
              <span>Formation</span>
              <span>Calcul</span>
              <span>Du</span>
            </div>

            {lignes.map(function (l: any, i: number) {
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr 0.9fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>{l.nom || l.email}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{l.titre}</span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>{l.motif}</span>
                  <span style={{ color: l.du > 0 ? "#c8a96e" : "#4caf50", fontWeight: "bold" }}>
                    {l.du > 0 ? euros(l.du) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            Comment se calcule votre facture : l abonnement, plus {taux} % du prix de vente de
            chaque formation de notre catalogue, avec un minimum de {euros(plancher)} par stagiaire
            inscrit. Le plus eleve des deux est retenu.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            Rien n est du sur les formations que vous creez. La facture est etablie en fin de mois,
            reglable a trente jours. Cette page est mise a jour en continu : vous n avez aucune
            declaration a faire.
          </p>
        </div>
      </div>
    </div>
  );
}
