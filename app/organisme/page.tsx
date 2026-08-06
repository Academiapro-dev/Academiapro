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

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "18px 22px",
};

// Les quatre profils. Une porte sans liste « pour » est visible par tous.
const TOUS: string[] = [];
const VENTE = ["vend_formations"];
const QUALIOPI = ["vend_formations", "devenir_of"];

export default async function TableauDeBordOrganisme() {
  const session = sessionCourante();

  if (!session) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Tableau de bord</h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            Connectez-vous pour accéder à votre espace.
          </p>
          <a href="/connexion" style={{ color: "#c8a96e" }}>Se connecter</a>
        </div>
      </div>
    );
  }

  const t = session.tenantId;
  const vide: any = { data: [] };

  const filtre = function (r: any) {
    return t ? r.eq("tenant_id", t) : r.is("tenant_id", null);
  };

  const { data: lignes } = await filtre(
    supabase
      .from("progression_apprenants")
      .select("user_email, formation_code, updated_at")
      .eq("statut", "valide")
  ).limit(5000);

  const { data: notes } = await filtre(
    supabase
      .from("qcm_reponses")
      .select("email, formation_code, note, updated_at")
      .eq("statut", "corrigee")
  ).limit(5000);

  const { data: registre } = t
    ? await supabase.from("organisme_apprenants").select("email, statut, statut_stagiaire, payeur").eq("tenant_id", t).limit(5000)
    : vide;

  const { data: catalogue } = t
    ? await supabase.from("organisme_catalogue").select("formation_code").eq("tenant_id", t).eq("actif", true).limit(1000)
    : vide;

  const { data: coursPropres } = t
    ? await supabase.from("organisme_cours").select("id, publie").eq("tenant_id", t).limit(500)
    : vide;

  const { data: seances } = t
    ? await supabase.from("organisme_seances").select("id, debut, duree_minutes").eq("tenant_id", t).limit(300)
    : vide;

  const { data: prospects } = t
    ? await supabase.from("crm").select("statut").eq("tenant_id", t).limit(3000)
    : vide;

  const { data: org } = t
    ? await supabase.from("organismes_formation").select("slug, portail_actif, abonnement_mensuel, lancement_jusqu_au, profils").eq("tenant_id", t).maybeSingle()
    : { data: null };

  const { data: documents } = t
    ? await supabase.from("organisme_documents").select("id").eq("tenant_id", t).limit(2000)
    : vide;

  const { data: signatures } = t
    ? await supabase.from("organisme_signatures").select("id, annulee").eq("tenant_id", t).limit(2000)
    : vide;

  const { data: evaluations } = t
    ? await supabase.from("organisme_evaluations").select("note_globale").eq("tenant_id", t).limit(2000)
    : vide;

  const { data: reclamations } = t
    ? await supabase.from("organisme_reclamations").select("statut").eq("tenant_id", t).limit(1000)
    : vide;

  const { data: fiches } = await supabase.from("formations").select("code, titre").limit(1000);

  const titreDe: any = {};
  for (const f of fiches || []) titreDe[f.code] = f.titre;

  const parStagiaire: any = {};

  for (const l of lignes || []) {
    const cle = l.user_email + "|" + l.formation_code;
    if (!parStagiaire[cle]) {
      parStagiaire[cle] = { email: l.user_email, code: l.formation_code, modules: 0, notes: [], derniere: null };
    }
    parStagiaire[cle].modules = parStagiaire[cle].modules + 1;
    const d1 = l.updated_at ? new Date(l.updated_at).getTime() : 0;
    if (d1 && (!parStagiaire[cle].derniere || d1 > parStagiaire[cle].derniere)) {
      parStagiaire[cle].derniere = d1;
    }
  }

  for (const n of notes || []) {
    const cle = n.email + "|" + n.formation_code;
    if (!parStagiaire[cle]) {
      parStagiaire[cle] = { email: n.email, code: n.formation_code, modules: 0, notes: [], derniere: null };
    }
    if (typeof n.note === "number") parStagiaire[cle].notes.push(n.note);
    const d2 = n.updated_at ? new Date(n.updated_at).getTime() : 0;
    if (d2 && (!parStagiaire[cle].derniere || d2 > parStagiaire[cle].derniere)) {
      parStagiaire[cle].derniere = d2;
    }
  }

  const rangees = Object.values(parStagiaire).sort(function (a: any, b: any) {
    return (b.derniere || 0) - (a.derniere || 0);
  });

  const maintenant = Date.now();
  const actifs = new Set(rangees.map(function (r: any) { return r.email; })).size;
  const modulesTotal = rangees.reduce(function (s: number, r: any) { return s + r.modules; }, 0);
  const toutesNotes = rangees.reduce(function (acc: number[], r: any) { return acc.concat(r.notes); }, []);
  const moyenne = toutesNotes.length > 0
    ? Math.round((toutesNotes.reduce(function (s: number, n: number) { return s + n; }, 0) / toutesNotes.length) * 10) / 10
    : null;

  const decroches = rangees.filter(function (r: any) {
    return r.derniere && maintenant - r.derniere > 15 * 86400000;
  }).length;

  const inscrits = (registre || []).length;
  const aInviter = (registre || []).filter(function (a: any) { return a.statut === "invite"; }).length;
  const incomplets = (registre || []).filter(function (a: any) { return !a.statut_stagiaire || !a.payeur; }).length;
  const ouvertes = (reclamations || []).filter(function (r: any) {
    return r.statut === "ouverte" || r.statut === "en_cours";
  }).length;
  const signees = (signatures || []).filter(function (s: any) { return !s.annulee; }).length;
  const publiees = (coursPropres || []).filter(function (c: any) { return c.publie; }).length;
  const aTraiter = (prospects || []).filter(function (p: any) {
    return (p.statut || "prospect") === "prospect";
  }).length;

  const seancesAvenir = (seances || []).filter(function (s: any) {
    const fin = new Date(s.debut).getTime() + (Number(s.duree_minutes) || 90) * 60000;
    return fin > maintenant;
  }).length;

  const notesEval = (evaluations || [])
    .map(function (e: any) { return e.note_globale; })
    .filter(function (n: any) { return typeof n === "number"; });
  const satisfaction = notesEval.length > 0
    ? Math.round((notesEval.reduce(function (a: number, b: number) { return a + b; }, 0) / notesEval.length) * 10) / 10
    : null;

  const abonnement = org ? Number(org.abonnement_mensuel) || 0 : 0;
  const enLancement = org && org.lancement_jusqu_au
    ? new Date(org.lancement_jusqu_au).getTime() >= maintenant
    : false;

  // PROFILS DU CLIENT. Sans profil declare, on suppose qu'il vend des
  // formations : c'est le cas de tous les comptes existants.
  const mesProfils: string[] =
    org && Array.isArray(org.profils) && org.profils.length > 0
      ? org.profils
      : ["vend_formations"];

  function visible(pour: string[]): boolean {
    if (pour.length === 0) return true;
    return mesProfils.some(function (p: string) { return pour.indexOf(p) >= 0; });
  }

  const famillesBrutes = [
    {
      titre: "Former",
      portes: [
        { pour: TOUS, href: "/organisme/stagiaires", nom: "Mes stagiaires", detail: inscrits + " inscrit(s)", alerte: aInviter > 0 ? aInviter + " sans accès" : "" },
        { pour: TOUS, href: "/organisme/cours", nom: "Mes formations", detail: (coursPropres || []).length + " créée(s) · " + publiees + " publiée(s)", alerte: "" },
        { pour: TOUS, href: "/organisme/catalogue", nom: "Catalogue AcadémIA", detail: (catalogue || []).length + " formation(s)", alerte: "" },
        { pour: TOUS, href: "/organisme/seances", nom: "Classes virtuelles", detail: seancesAvenir > 0 ? seancesAvenir + " à venir" : (seances || []).length + " séance(s)", alerte: "" },
        { pour: TOUS, href: "/organisme/relances", nom: "Qui a décroché", detail: decroches > 0 ? decroches + " inactif(s)" : "tout le monde avance", alerte: decroches > 0 ? "à relancer" : "" },
        { pour: TOUS, href: "/organisme/importer", nom: "Importer une liste", detail: "jusqu'à 500 stagiaires", alerte: "" },
      ],
    },
    {
      titre: "Vendre",
      portes: [
        { pour: VENTE, href: "/organisme/crm", nom: "Mes prospects", detail: (prospects || []).length + " fiche(s)", alerte: aTraiter > 0 ? aTraiter + " à traiter" : "" },
        { pour: VENTE, href: "/organisme/portail", nom: "Ma page publique", detail: org && org.portail_actif ? "en ligne · /of/" + org.slug : "fermée", alerte: org && !org.portail_actif ? "à ouvrir" : "" },
        { pour: VENTE, href: "/organisme/facturation", nom: "Ma facturation", detail: abonnement > 0 ? (enLancement ? Math.round(abonnement / 2) : abonnement) + " € / mois + inscriptions" : "en cours", alerte: "" },
      ],
    },
    {
      titre: "Prouver",
      portes: [
        { pour: TOUS, href: "/organisme/documents", nom: "Mes documents", detail: (documents || []).length + " émis", alerte: "" },
        { pour: QUALIOPI, href: "/organisme/signatures", nom: "Signatures", detail: signees + " signé(s)", alerte: "" },
        { pour: QUALIOPI, href: "/organisme/evaluations", nom: "Évaluations", detail: satisfaction !== null ? satisfaction + "/5 sur " + notesEval.length : "aucune réponse", alerte: "" },
        { pour: QUALIOPI, href: "/organisme/reclamations", nom: "Réclamations", detail: (reclamations || []).length + " au registre", alerte: ouvertes > 0 ? ouvertes + " en attente" : "" },
        { pour: QUALIOPI, href: "/organisme/bilan", nom: "Bilan pédagogique", detail: "Cerfa 10443", alerte: incomplets > 0 ? incomplets + " à compléter" : "" },
      ],
    },
  ];

  const familles = famillesBrutes
    .map(function (f) {
      return { titre: f.titre, portes: f.portes.filter(function (p) { return visible(p.pour); }) };
    })
    .filter(function (f) { return f.portes.length > 0; });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          ESPACE PROFESSIONNEL
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Tableau de bord</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {t ? "Votre organisme" : "AcadémIA Pro"} · {session.email}
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "26px 0 30px" }}>
          <div style={{ ...CARTE, flex: "1 1 190px" }}>
            <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>{actifs}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>Stagiaire(s) actif(s)</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 190px" }}>
            <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>{modulesTotal}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>Module(s) validé(s)</p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 190px" }}>
            <p style={{ color: "#c8a96e", fontSize: "28px", fontWeight: "bold", margin: "0 0 4px" }}>
              {moyenne !== null ? moyenne + "/20" : "—"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>Moyenne aux QCM</p>
          </div>
        </div>

        {familles.map(function (f) {
          return (
            <div key={f.titre} style={{ marginBottom: "28px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "16px", letterSpacing: "2px", margin: "0 0 14px", textTransform: "uppercase" }}>
                {f.titre}
              </h2>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {f.portes.map(function (p) {
                  return (
                    <a
                      key={p.href}
                      href={p.href}
                      style={{ ...CARTE, flex: "1 1 210px", textDecoration: "none", border: p.alerte ? "1px solid rgba(232,131,106,0.45)" : CARTE.border }}
                    >
                      <p style={{ color: "#c8a96e", fontSize: "15.5px", margin: "0 0 6px" }}>{p.nom} →</p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                        {p.detail}
                      </p>
                      {p.alerte && (
                        <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "6px 0 0", fontWeight: "bold" }}>
                          {p.alerte}
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        {rangees.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun stagiaire n'a encore validé de module. Le suivi apparaîtra dès la première validation.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "13px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Stagiaire</span>
              <span>Formation</span>
              <span>Modules</span>
              <span>Moyenne</span>
              <span>Dernière activité</span>
            </div>

            {rangees.map(function (r: any, i: number) {
              const moy = r.notes.length > 0
                ? Math.round((r.notes.reduce(function (s: number, n: number) { return s + n; }, 0) / r.notes.length) * 10) / 10
                : null;
              const inactif = r.derniere && maintenant - r.derniere > 15 * 86400000;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "13px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>{r.email}</span>
                  <span>{titreDe[r.code] || r.code}</span>
                  <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{r.modules}</span>
                  <span style={{ color: moy !== null && moy >= 14 ? "#4caf50" : moy !== null ? "#e8a33d" : "rgba(255,255,255,0.4)" }}>
                    {moy !== null ? moy + "/20" : "—"}
                  </span>
                  <span style={{ color: inactif ? "#e8836a" : "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                    {r.derniere ? new Date(r.derniere).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
