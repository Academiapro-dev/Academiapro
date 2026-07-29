import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../lib/session";

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

export default async function TableauDeBordOrganisme() {
  const session = sessionCourante();

  if (!session) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Tableau de bord</h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            Connectez-vous pour acceder au suivi de vos stagiaires.
          </p>
          <a href="/connexion" style={{ color: "#c8a96e" }}>Se connecter</a>
        </div>
      </div>
    );
  }

  // Cloisonnement : un organisme ne voit que SES stagiaires. Une session sans
  // organisme (AcademIA Pro) voit les apprenants qui n en ont pas non plus.
  let requete = supabase
    .from("progression_apprenants")
    .select("user_email, formation_code, module_cle, statut, score")
    .eq("statut", "valide");

  requete = session.tenantId
    ? requete.eq("tenant_id", session.tenantId)
    : requete.is("tenant_id", null);

  const { data: lignes } = await requete.limit(5000);

  let requeteNotes = supabase
    .from("qcm_reponses")
    .select("email, formation_code, note, updated_at")
    .eq("statut", "corrigee");

  requeteNotes = session.tenantId
    ? requeteNotes.eq("tenant_id", session.tenantId)
    : requeteNotes.is("tenant_id", null);

  const { data: notes } = await requeteNotes.limit(5000);

  const { data: fiches } = await supabase
    .from("formations")
    .select("code, titre")
    .limit(1000);

  const titreDe: any = {};
  for (const f of fiches || []) titreDe[f.code] = f.titre;

  // Regroupement par stagiaire puis par formation.
  const parStagiaire: any = {};

  for (const l of lignes || []) {
    const cle = l.user_email + "|" + l.formation_code;
    if (!parStagiaire[cle]) {
      parStagiaire[cle] = {
        email: l.user_email,
        code: l.formation_code,
        modules: 0,
        notes: [],
        derniere: null,
      };
    }
    parStagiaire[cle].modules = parStagiaire[cle].modules + 1;
  }

  for (const n of notes || []) {
    const cle = n.email + "|" + n.formation_code;
    if (!parStagiaire[cle]) {
      parStagiaire[cle] = {
        email: n.email,
        code: n.formation_code,
        modules: 0,
        notes: [],
        derniere: null,
      };
    }
    if (typeof n.note === "number") parStagiaire[cle].notes.push(n.note);
    const d = n.updated_at ? new Date(n.updated_at).getTime() : 0;
    if (d && (!parStagiaire[cle].derniere || d > parStagiaire[cle].derniere)) {
      parStagiaire[cle].derniere = d;
    }
  }

  const rangees = Object.values(parStagiaire).sort(function (a: any, b: any) {
    return (b.derniere || 0) - (a.derniere || 0);
  });

  const apprenants = new Set(rangees.map(function (r: any) { return r.email; })).size;
  const modulesTotal = rangees.reduce(function (s: number, r: any) { return s + r.modules; }, 0);
  const toutesNotes = rangees.reduce(function (acc: number[], r: any) { return acc.concat(r.notes); }, []);
  const moyenne = toutesNotes.length > 0
    ? Math.round((toutesNotes.reduce(function (s: number, n: number) { return s + n; }, 0) / toutesNotes.length) * 10) / 10
    : null;

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "20px 24px",
    flex: "1 1 200px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          SUIVI DES STAGIAIRES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Tableau de bord</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {session.tenantId ? "Votre organisme" : "AcadeMIA Pro"} · {session.email}
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "28px 0" }}>
          <div style={CARTE}>
            <p style={{ color: "#c8a96e", fontSize: "32px", fontWeight: "bold", margin: "0 0 4px" }}>{apprenants}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Stagiaire(s) actif(s)</p>
          </div>
          <div style={CARTE}>
            <p style={{ color: "#c8a96e", fontSize: "32px", fontWeight: "bold", margin: "0 0 4px" }}>{modulesTotal}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Module(s) valide(s)</p>
          </div>
          <div style={CARTE}>
            <p style={{ color: "#c8a96e", fontSize: "32px", fontWeight: "bold", margin: "0 0 4px" }}>
              {moyenne !== null ? moyenne + "/20" : "—"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>Note moyenne</p>
          </div>
        </div>

        {rangees.length === 0 ? (
          <div style={{ ...CARTE, flex: "1 1 100%" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun stagiaire n a encore valide de module. Le suivi apparaitra des la premiere validation.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "14px 18px", fontSize: "13px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Stagiaire</span>
              <span>Formation</span>
              <span>Modules</span>
              <span>Moyenne</span>
              <span>Derniere activite</span>
            </div>

            {rangees.map(function (r: any, i: number) {
              const moy = r.notes.length > 0
                ? Math.round((r.notes.reduce(function (s: number, n: number) { return s + n; }, 0) / r.notes.length) * 10) / 10
                : null;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>{r.email}</span>
                  <span>{titreDe[r.code] || r.code}</span>
                  <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{r.modules}</span>
                  <span style={{ color: moy !== null && moy >= 14 ? "#4caf50" : moy !== null ? "#e8a33d" : "rgba(255,255,255,0.4)" }}>
                    {moy !== null ? moy + "/20" : "—"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                    {r.derniere ? new Date(r.derniere).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "24px" }}>
          Ce tableau ne montre que les stagiaires rattaches a votre organisme.
        </p>
      </div>
    </div>
  );
}
