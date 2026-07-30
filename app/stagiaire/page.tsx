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
  padding: "20px 24px",
  marginBottom: "16px",
};

const LIEN: any = {
  display: "inline-block",
  background: "#c8a96e",
  color: "#050508",
  padding: "10px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
};

export default async function EspaceStagiaire() {
  const session = sessionCourante();

  if (!session) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", fontSize: "24px" }}>Votre espace</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7" }}>
            Connectez-vous pour retrouver vos formations.
          </p>
          <a href="/connexion" style={{ color: "#c8a96e" }}>Se connecter</a>
        </div>
      </div>
    );
  }

  const t = session.tenantId;
  const vide: any = { data: [] };

  // Sa fiche au registre : formation a laquelle il est inscrit.
  const { data: fiche } = t
    ? await supabase
        .from("organisme_apprenants")
        .select("nom, formation_code")
        .eq("tenant_id", t)
        .eq("email", session.email)
        .maybeSingle()
    : { data: null };

  const { data: organisme } = t
    ? await supabase
        .from("organismes_formation")
        .select("raison_sociale, email_contact")
        .eq("tenant_id", t)
        .maybeSingle()
    : { data: null };

  // Le catalogue souscrit par son organisme.
  const { data: souscrites } = t
    ? await supabase
        .from("organisme_catalogue")
        .select("formation_code")
        .eq("tenant_id", t)
        .eq("actif", true)
        .limit(1000)
    : vide;

  const codes = (souscrites || []).map(function (c: any) { return c.formation_code; });

  const { data: fiches } = codes.length > 0
    ? await supabase.from("formations").select("code, titre, duree, domaine").in("code", codes).limit(1000)
    : vide;

  // Les formations propres de son organisme, publiees seulement.
  const { data: propres } = t
    ? await supabase
        .from("organisme_cours")
        .select("code, titre, duree, domaine")
        .eq("tenant_id", t)
        .eq("publie", true)
        .limit(200)
    : vide;

  // Sa progression.
  const { data: progression } = await supabase
    .from("progression_apprenants")
    .select("formation_code, module_cle")
    .eq("user_email", session.email)
    .eq("statut", "valide")
    .limit(2000);

  const valides: any = {};
  for (const p of progression || []) {
    valides[p.formation_code] = (valides[p.formation_code] || 0) + 1;
  }

  // Ses seances a venir.
  const { data: seances } = t
    ? await supabase
        .from("organisme_seances")
        .select("id, titre, debut, duree_minutes, formateur")
        .eq("tenant_id", t)
        .gte("debut", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
        .order("debut", { ascending: true })
        .limit(20)
    : vide;

  // Ses documents en attente de signature.
  const { data: aSigner } = t
    ? await supabase
        .from("organisme_documents")
        .select("reference, type")
        .eq("tenant_id", t)
        .eq("stagiaire_email", session.email)
        .in("type", ["convention", "devis"])
        .limit(50)
    : vide;

  const { data: signes } = await supabase
    .from("organisme_signatures")
    .select("document_reference")
    .eq("signataire_email", session.email)
    .eq("annulee", false)
    .limit(200);

  const dejaSignes = new Set((signes || []).map(function (s: any) { return s.document_reference; }));
  const enAttente = (aSigner || []).filter(function (d: any) { return !dejaSignes.has(d.reference); });

  // Ses evaluations non remplies.
  const { data: evaluations } = t
    ? await supabase
        .from("organisme_evaluations")
        .select("formation_code, moment")
        .eq("tenant_id", t)
        .eq("stagiaire_email", session.email)
        .limit(200)
    : vide;

  const evaluees = new Set((evaluations || []).map(function (e: any) { return e.formation_code + "|" + e.moment; }));

  const catalogue = (fiches || []).map(function (f: any) {
    return { code: f.code, titre: f.titre, duree: f.duree, domaine: f.domaine, propre: false };
  });

  const miennes = (propres || []).map(function (c: any) {
    return { code: c.code, titre: c.titre, duree: c.duree, domaine: c.domaine, propre: true };
  });

  const formations = miennes.concat(catalogue);

  const nom = fiche && fiche.nom ? fiche.nom : (session.email || "").split("@")[0];
  const nomOrganisme = organisme ? organisme.raison_sociale : null;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          VOTRE ESPACE DE FORMATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 6px" }}>Bonjour {nom}</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {nomOrganisme ? nomOrganisme + " · " : ""}{session.email}
        </p>

        {enAttente.length > 0 && (
          <div style={{ ...CARTE, marginTop: "26px", border: "1px solid rgba(232,163,61,0.5)" }}>
            <h2 style={{ color: "#e8a33d", fontSize: "17px", margin: "0 0 10px" }}>
              {enAttente.length} document(s) attendent votre signature
            </h2>
            {enAttente.map(function (dd: any) {
              return (
                <div key={dd.reference} style={{ marginBottom: "10px" }}>
                  <a href={"/signature/" + dd.reference} style={{ color: "#c8a96e", fontSize: "15px" }}>
                    {dd.type === "convention" ? "Convention de formation" : "Devis"} · {dd.reference} →
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {(seances || []).length > 0 && (
          <div style={{ ...CARTE, marginTop: "20px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 14px" }}>
              Vos prochaines classes en direct
            </h2>
            {(seances || []).map(function (s: any) {
              const debut = new Date(s.debut).getTime();
              const fin = debut + (Number(s.duree_minutes) || 90) * 60000;
              const maintenant = Date.now();
              const ouverte = maintenant >= debut - 15 * 60000 && maintenant <= fin + 15 * 60000;
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 2px" }}>{s.titre}</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {new Date(s.debut).toLocaleString("fr-FR")} · {s.duree_minutes} min
                      {s.formateur ? " · " + s.formateur : ""}
                    </p>
                  </div>
                  {ouverte ? (
                    <a href={"/seance/" + s.id} style={LIEN}>Rejoindre</a>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                      ouvre 15 min avant
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "28px 0 14px" }}>Vos formations</h2>

        {formations.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucune formation ne vous est encore ouverte.
              {organisme && organisme.email_contact
                ? " Contactez votre organisme a l adresse " + organisme.email_contact + "."
                : ""}
            </p>
          </div>
        ) : (
          formations.map(function (f: any) {
            const modules = valides[f.code] || 0;
            const aEvaluer = f.code === (fiche ? fiche.formation_code : null) &&
              modules > 0 &&
              !evaluees.has(f.code + "|chaud");
            return (
              <div key={f.code} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                      {f.code}{f.domaine ? " · " + f.domaine : ""}{f.duree ? " · " + f.duree + " h" : ""}
                      {f.propre ? " · formation de votre organisme" : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{f.titre}</h3>
                    <p style={{ color: modules > 0 ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {modules > 0 ? modules + " module(s) valide(s)" : "pas encore commencee"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                  <a
                    href={f.propre ? "/organisme/formation/" + f.code : "/lms/" + f.code.toLowerCase()}
                    style={LIEN}
                  >
                    {modules > 0 ? "Reprendre" : "Commencer"}
                  </a>

                  {aEvaluer && (
                    <a
                      href={"/evaluation/" + f.code}
                      style={{ ...LIEN, background: "none", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)" }}
                    >
                      Donner mon avis
                    </a>
                  )}

                  {!evaluees.has(f.code + "|positionnement") && modules === 0 && (
                    <a
                      href={"/positionnement/" + f.code}
                      style={{ ...LIEN, background: "none", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)" }}
                    >
                      Parlez-nous de vous
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}

        {nomOrganisme && organisme && organisme.email_contact && (
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "26px", lineHeight: "1.7" }}>
            Une question sur votre parcours ? Ecrivez a {nomOrganisme} : {organisme.email_contact}.
          </p>
        )}
      </div>
    </div>
  );
}
