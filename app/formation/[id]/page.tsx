"use client";
import { useState, useEffect } from "react";
import { useTraductionAuto } from "../../../hooks/useTraductionAuto";

const FR = {
  chargement: "Chargement...",
  nonTrouvee: "Formation non trouvee",
  retourCatalogue: "Retour au catalogue",
  niveau: "Niveau",
  formuleTitre: "Choisissez votre formule",
  fondateur: "Code {CODE} : -{PCT} % pour les {PLACES} premiers clients, a saisir au moment du paiement.",
  bootcampNote: "Programme intensif complet — 3 classes virtuelles et plus par semaine, prix unique",
  description: "Description",
  objectifs: "Objectifs",
  prerequis: "Prerequis",
  publicCible: "Public cible",
  programme: "Programme",
  modulesMot: "modules",
  heuresTotal: "heures de formation",
  support: "Apercu du manuel",
  supportSub: "Lisez les premieres pages avant de vous inscrire",
  voirSupport: "Feuilleter",
  coachBtn: "Mon coach IA",
  classeBtn: "Classe virtuelle",
  pret: "Pret a demarrer ?",
  acces: "Acces immediat apres inscription",
  acheter: "Acheter",
  paiementTitre: "Comment souhaitez-vous regler ?",
  comptant: "En une fois",
  comptantDetail: "Reglement unique, acces immediat",
  quatreFois: "En 4 fois sans frais",
  quatreFoisDetail: "4 prelevements mensuels, acces immediat des le premier",
  parMois: "par mois",
  soitTotal: "soit",
  auTotal: "au total",
  paliers: [
    { id: "elearning", nom: "E-learning", detail: "Formation complete a votre rythme, manuel PDF inclus" },
    { id: "plus", nom: "E-learning Plus", detail: "+ chat virtuel 24h/24 qui repond a toutes vos questions" },
    { id: "cv1", nom: "Classe virtuelle 1x/sem", detail: "+ 1 seance live par semaine" },
    { id: "cv2", nom: "Classe virtuelle 2x/sem", detail: "+ 2 seances live par semaine" },
    { id: "cv3", nom: "Intensif 3x/sem", detail: "+ 3 seances live par semaine" },
  ],
  courtNom: "Classe virtuelle",
  courtDetail: "+ 1 seance live d accompagnement incluse",
};

const MINIMUM_ECHELONNE = 300;

// Moins d une semaine de formation (8 h par jour) : une seance live PAR
// SEMAINE n a aucun sens, le stagiaire a fini avant.
const SEUIL_COURTE = 40;

const REMISE_DEFAUT = { pct: "10", places: "100", code: "FONDATEURS" };

function heuresDe(duree: any): number {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return n > 0 ? n : 0;
}

function prixPalier(base: number, palier: string): number {
  if (palier === "elearning") return Math.round(base * 0.5);
  if (palier === "plus") return Math.round(base * 0.7);
  if (palier === "cv2") return base + 800;
  if (palier === "cv3") return base + 1800;
  return base;
}

export default function FormationPage({ params }: { params: { id: string } }) {
  const { txt, langue } = useTraductionAuto(FR);
  const [formation, setFormation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [palier, setPalier] = useState("cv1");
  const [paiement, setPaiement] = useState("comptant");
  const [apercu, setApercu] = useState<any>(null);
  const [remise, setRemise] = useState(REMISE_DEFAUT);

  useEffect(() => {
    fetch(`/api/formation/${params.id}?lang=${langue}`)
      .then(r => r.json())
      .then(data => { setFormation(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, langue]);

  useEffect(() => {
    fetch(`/api/apercu-formation?code=${params.id}`)
      .then(r => r.json())
      .then(d => { if (d && d.ok) setApercu(d); })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    fetch("/api/textes")
      .then(r => r.json())
      .then(d => {
        const t = (d && d.textes) || {};
        setRemise({
          pct: t.remise_fondateurs_pct || REMISE_DEFAUT.pct,
          places: t.remise_fondateurs_places || REMISE_DEFAUT.places,
          code: t.remise_fondateurs_code || REMISE_DEFAUT.code,
        });
      })
      .catch(() => {});
  }, []);

  function remplir(s: string): string {
    return String(s)
      .replace(/\{CODE\}/g, remise.code)
      .replace(/\{PCT\}/g, remise.pct)
      .replace(/\{PLACES\}/g, remise.places);
  }

  if (loading) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a96e", fontSize: "18px" }}>{txt.chargement}</div>
    </div>
  );

  if (!formation || formation.error) return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "#c8a96e" }}>{txt.nonTrouvee}</h1>
      <a href="/catalogue" style={{ color: "#c8a96e" }}>{txt.retourCatalogue}</a>
    </div>
  );

  const estBootcamp = typeof formation.titre === "string" && formation.titre.startsWith("Bootcamp");
  const estAtelier = String(params.id).toUpperCase().indexOf("SK") === 0;
  const prixBase = formation.prix || 0;

  const aProgrammeBase = formation.programme && Array.isArray(formation.programme) && formation.programme.length > 0;
  const aApercu = apercu && apercu.modules && apercu.modules.length > 0;
  const heures = (apercu && apercu.heures_programme) || 0;
  const nbModules = (apercu && apercu.nb_modules) || 0;

  const heuresReference = heures > 0 ? heures : heuresDe(formation.duree);
  const estCourte = heuresReference > 0 && heuresReference < SEUIL_COURTE;

  const paliersAffiches = estCourte
    ? txt.paliers
        .filter((p: { id: string }) => p.id === "elearning" || p.id === "plus" || p.id === "cv1")
        .map((p: { id: string; nom: string; detail: string }) =>
          p.id === "cv1" ? { id: "cv1", nom: txt.courtNom, detail: txt.courtDetail } : p)
    : txt.paliers;

  const palierActif = paliersAffiches.find((p: { id: string }) => p.id === palier) ? palier : "cv1";
  const prixFormule = estBootcamp ? prixBase : prixPalier(prixBase, palierActif);
  const detailPalier = (paliersAffiches.find((p: { id: string }) => p.id === palierActif) || paliersAffiches[0]).detail;

  const echelonnable = !estAtelier && prixFormule >= MINIMUM_ECHELONNE;
  const paiementActif = echelonnable ? paiement : "comptant";
  const mensualite = Math.ceil(prixFormule / 4);
  const totalEchelonne = mensualite * 4;

  const ligneTotal = heures > 0 ? (
    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: 0, marginBottom: "18px" }}>
      {nbModules} {txt.modulesMot} · {heures} {txt.heuresTotal}
    </p>
  ) : null;

  const styleChoix = (actif: boolean) => ({
    flex: "1 1 240px",
    background: actif ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)",
    border: actif ? "2px solid #c8a96e" : "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "16px 18px",
    cursor: "pointer",
    textAlign: "left" as const,
    color: "#fff",
  });

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        "name": formation.titre,
        "description": formation.description || formation.titre,
        "provider": { "@type": "Organization", "name": "Acad\u00e9mIA Pro", "url": "https://www.academiapro.fr" },
        ...(formation.prix ? { "offers": { "@type": "Offer", "price": String(formation.prix), "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": "https://www.academiapro.fr/formation/" + params.id } } : {}),
        "hasCourseInstance": { "@type": "CourseInstance", "courseMode": "online" }
      }) }} />
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ color: "#c8a96e", fontSize: "13px", marginBottom: "10px" }}>{formation.code} · {formation.domaine}</div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2rem", marginBottom: "20px" }}>{formation.titre}</h1>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          {heures > 0 && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{heures} h</span>}
          {formation.niveau && <span style={{ background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px" }}>{txt.niveau} {formation.niveau}</span>}
          {prixBase > 0 && <span style={{ background: "#c8a96e", color: "#050508", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{prixFormule.toLocaleString("fr-FR")}€</span>}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        {prixBase > 0 && !estBootcamp && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "18px", textAlign: "center", marginBottom: "14px" }}>{txt.formuleTitre}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
              {paliersAffiches.map((p: { id: string; nom: string }) => (
                <button key={p.id} onClick={() => setPalier(p.id)}
                  style={{ background: palierActif === p.id ? "#c8a96e" : "rgba(255,255,255,0.05)", color: palierActif === p.id ? "#050508" : "rgba(255,255,255,0.7)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "24px", padding: "10px 18px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
                  {p.nom}
                </button>
              ))}
            </div>
            <p style={{ color: "rgba(200,169,110,0.8)", fontSize: "13px", textAlign: "center", margin: 0 }}>{detailPalier}</p>
          </div>
        )}

        {prixBase > 0 && estBootcamp && (
          <div style={{ marginBottom: "40px", padding: "16px 20px", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0 }}>🚀 {txt.bootcampNote}</p>
          </div>
        )}

        {formation.description && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{txt.description}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.description}</p>
          </div>
        )}

        {formation.objectifs && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{txt.objectifs}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.objectifs}</p>
          </div>
        )}

        {formation.prerequis && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{txt.prerequis}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.prerequis}</p>
          </div>
        )}

        {formation.public_cible && (
          <div style={{ marginBottom: "35px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>{txt.publicCible}</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>{formation.public_cible}</p>
          </div>
        )}

        {aProgrammeBase && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "6px" }}>{txt.programme}</h2>
            {ligneTotal}
            {formation.programme.map((ch: any, i: number) => (
              <div key={i} style={{ marginBottom: "15px", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", padding: "12px 20px" }}>
                  <h3 style={{ color: "#fff", margin: 0, fontFamily: "Georgia,serif", fontSize: "15px" }}>{ch.chapitre} — {ch.titre}</h3>
                </div>
                {ch.modules && (
                  <div style={{ padding: "10px 20px" }}>
                    {ch.modules.map((mod: any, j: number) => (
                      <div key={j} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                        <span>{mod.module} — {mod.titre}</span>
                        {mod.duree && <span style={{ color: "#c8a96e" }}>{mod.duree}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!aProgrammeBase && aApercu && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "6px" }}>{txt.programme}</h2>
            {ligneTotal}
            <div style={{ border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden" }}>
              {apercu.modules.map((mod: string, j: number) => (
                <div key={j} style={{ padding: "12px 20px", borderBottom: j < apercu.modules.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                  <span style={{ color: "#c8a96e", marginRight: "10px" }}>{j + 1}.</span>
                  {mod}
                </div>
              ))}
            </div>
          </div>
        )}

        {aApercu && (
          <div style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ color: "#c8a96e", fontWeight: "bold", marginBottom: "3px" }}>📖 {txt.support}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{txt.supportSub}</div>
            </div>
            <a href={"/apercu/" + String(params.id).toUpperCase()} style={{ background: "#c8a96e", color: "#050508", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "13px" }}>
              {txt.voirSupport}
            </a>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <a href="/dashboard" style={{ flex: 1, display: "block", background: "#c8a96e", color: "#050508", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>
            {txt.coachBtn}
          </a>
          <a href="/classe-virtuelle" style={{ flex: 1, display: "block", background: "rgba(200,169,110,0.2)", color: "#c8a96e", padding: "14px 20px", borderRadius: "8px", fontWeight: "bold", textDecoration: "none", textAlign: "center", border: "1px solid rgba(200,169,110,0.3)" }}>
            {txt.classeBtn}
          </a>
        </div>

        <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
          <h2 style={{ color: "#fff", fontFamily: "Georgia,serif", marginBottom: "10px" }}>{txt.pret}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>{txt.acces}</p>

          {echelonnable && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "#c8a96e", fontSize: "14px", marginBottom: "12px" }}>{txt.paiementTitre}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setPaiement("comptant")} style={styleChoix(paiementActif === "comptant")}>
                  <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>{txt.comptant}</div>
                  <div style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>{prixFormule.toLocaleString("fr-FR")}€</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{txt.comptantDetail}</div>
                </button>
                <button onClick={() => setPaiement("4x")} style={styleChoix(paiementActif === "4x")}>
                  <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>{txt.quatreFois}</div>
                  <div style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>
                    {mensualite.toLocaleString("fr-FR")}€ <span style={{ fontSize: "13px", fontWeight: "normal" }}>{txt.parMois}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                    {txt.quatreFoisDetail} · {txt.soitTotal} {totalEchelonne.toLocaleString("fr-FR")}€ {txt.auTotal}
                  </div>
                </button>
              </div>
            </div>
          )}

          <a href={`/api/checkout?formation=${params.id}&formule=${estBootcamp ? "bootcamp" : palierActif}&paiement=${paiementActif}`}
            style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "18px" }}>
            {paiementActif === "4x"
              ? `${txt.acheter} — 4 × ${mensualite.toLocaleString("fr-FR")}€`
              : `${txt.acheter} — ${prixFormule.toLocaleString("fr-FR")}€`}
          </a>

          {prixBase > 0 && (
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: "16px auto 0", maxWidth: "460px", lineHeight: "1.7" }}>
              {remplir(txt.fondateur)}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
