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

export default async function PageTelechargements() {
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

  const { data: lignes } = await supabase
    .from("organisme_telechargements")
    .select("*")
    .order("telecharge_le", { ascending: false })
    .limit(2000);

  const { data: organismes } = await supabase
    .from("organismes_formation")
    .select("tenant_id, raison_sociale")
    .limit(500);

  const nomDe: any = {};
  for (const o of organismes || []) nomDe[o.tenant_id] = o.raison_sociale;

  const maintenant = Date.now();
  const jour = maintenant - 24 * 60 * 60 * 1000;
  const semaine = maintenant - 7 * 24 * 60 * 60 * 1000;

  const parPersonne: any = {};

  for (const l of lignes || []) {
    const t = new Date(l.telecharge_le).getTime();
    if (!parPersonne[l.email]) {
      parPersonne[l.email] = {
        email: l.email,
        organisme: nomDe[l.tenant_id] || null,
        total: 0,
        jour: 0,
        semaine: 0,
        derniere: l.telecharge_le,
        codes: new Set(),
        adresses: new Set(),
      };
    }
    const p = parPersonne[l.email];
    p.total = p.total + 1;
    if (t >= jour) p.jour = p.jour + 1;
    if (t >= semaine) p.semaine = p.semaine + 1;
    if (l.code) p.codes.add(l.code);
    if (l.adresse_ip) p.adresses.add(l.adresse_ip);
  }

  const gens = Object.keys(parPersonne)
    .map(function (k) {
      const p = parPersonne[k];
      return {
        email: p.email,
        organisme: p.organisme,
        total: p.total,
        jour: p.jour,
        semaine: p.semaine,
        derniere: p.derniere,
        formations: p.codes.size,
        adresses: p.adresses.size,
      };
    })
    .sort(function (a: any, b: any) { return b.semaine - a.semaine; });

  const surveiller = gens.filter(function (g: any) {
    return g.jour >= 6 || g.semaine >= 20 || g.adresses > 3;
  });

  const total = (lignes || []).length;
  const ceJour = (lignes || []).filter(function (l: any) {
    return new Date(l.telecharge_le).getTime() >= jour;
  }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          PROTECTION DU CATALOGUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Telechargements</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Chaque manuel porte le nom de celui qui l a sorti
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{total}</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Au total</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{ceJour}</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Dernieres 24 heures</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 160px", marginBottom: 0 }}>
            <p style={{ color: surveiller.length > 0 ? "#e8836a" : "#4caf50", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {surveiller.length}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>A surveiller</p>
          </div>
        </div>

        {surveiller.length > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              {surveiller.length} personne(s) telechargent a un rythme inhabituel, ou depuis
              plusieurs adresses differentes. Cela peut etre parfaitement innocent — un formateur
              qui prepare une session, un stagiaire en deplacement. Regardez le detail avant de
              conclure, et appelez plutot que d accuser.
            </p>
          </div>
        )}

        {gens.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun telechargement enregistre pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.6fr 0.7fr 0.7fr 0.9fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Personne</span>
              <span>Organisme</span>
              <span>24 h</span>
              <span>7 j</span>
              <span>Formations</span>
              <span>Derniere</span>
            </div>

            {gens.map(function (g: any, i: number) {
              const alerte = g.jour >= 6 || g.semaine >= 20 || g.adresses > 3;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2.4fr 1.6fr 0.7fr 0.7fr 0.9fr 1fr", padding: "13px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center", background: alerte ? "rgba(232,131,106,0.06)" : "transparent" }}>
                  <span style={{ wordBreak: "break-all" }}>
                    {g.email}
                    {g.adresses > 3 ? (
                      <span style={{ color: "#e8836a", fontSize: "12px" }}> · {g.adresses} adresses</span>
                    ) : null}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
                    {g.organisme || "—"}
                  </span>
                  <span style={{ color: g.jour >= 6 ? "#e8836a" : "rgba(255,255,255,0.7)", fontWeight: g.jour >= 6 ? "bold" : "normal" }}>
                    {g.jour}
                  </span>
                  <span style={{ color: g.semaine >= 20 ? "#e8836a" : "rgba(255,255,255,0.7)" }}>
                    {g.semaine}
                  </span>
                  <span style={{ color: "#c8a96e" }}>{g.formations}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px" }}>
                    {new Date(g.derniere).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
            La limite est de dix manuels par personne et par vingt-quatre heures. Au-dela, le
            telechargement est refuse jusqu au lendemain. Chaque exemplaire porte en filigrane
            l adresse de celui qui l a sorti, et la mention d interdiction de diffusion : un
            fichier qui circule designe son origine.
          </p>
        </div>
      </div>
    </div>
  );
}
