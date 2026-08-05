"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  surTitre: "TARIFS",
  titre1: "Des formations premium",
  titre2: "a prix accessible",
  dispo: "Formations disponibles · Agent IA 24h/24 · Manuel PDF inclus",
  fondateur: "🎯 Offre Fondateur — code {CODE} : -{PCT} % pour les {PLACES} premiers clients",
  fondateurDetail: "Le code se saisit au moment du paiement. Il cesse de fonctionner apres la {PLACES}e utilisation.",
  choisissez: "Choisissez votre formule — le prix s ajuste pour chaque formation :",
  noteCourte: "Les seances live hebdomadaires concernent les formations de 40 heures et plus. En dessous, une seance d accompagnement est incluse et le prix reste celui de la formule de base.",
  bootcampsTitre: "🚀 Bootcamps — la gamme premium",
  bootcampsTexte: "Programmes intensifs complets vers un metier, 3 classes virtuelles et plus par semaine, prix unique.",
  chargement: "Chargement des formations...",
  erreur: "Chargement impossible pour le moment. Reessayez dans un instant.",
  pretTitre: "Pret a commencer ?",
  pretTexte: "Les {PLACES} premiers clients beneficient de -{PCT} % avec le code {CODE}.",
  voirFormations: "Voir les formations",
  paliers: [
    { id: "elearning", nom: "E-learning", detail: "Formation complete a votre rythme, manuel PDF inclus" },
    { id: "plus", nom: "E-learning Plus", detail: "+ chat virtuel 24h/24 qui repond a toutes vos questions" },
    { id: "cv1", nom: "Classe virtuelle 1x/sem", detail: "+ 1 seance live par semaine" },
    { id: "cv2", nom: "Classe virtuelle 2x/sem", detail: "+ 2 seances live par semaine" },
    { id: "cv3", nom: "Intensif 3x/sem", detail: "+ 3 seances live par semaine" },
  ],
};

// Valeurs de repli : si la table ne repond pas, la page annonce quand meme
// quelque chose de vrai plutot qu un trou.
const REMISE_DEFAUT = { pct: "10", places: "100", code: "FONDATEURS" };

// Meme seuil que la fiche formation : en dessous de 40 heures, soit moins
// d une semaine a raison de 8 heures par jour, un rythme hebdomadaire n a
// aucun sens et les supplements de 800 et 1 800 EUR sont absurdes.
const SEUIL_COURTE = 40;

type Formation = {
  code: string;
  titre: string;
  domaine: string;
  niveau: string;
  prix: number;
  duree?: string | null;
};

// "8h", "120h", "250h - 10 mois" -> 8, 120, 250. Zero si illisible.
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

// Le palier demande est ramene a ce que la formation peut reellement offrir.
function palierApplicable(palier: string, heures: number): string {
  if (heures > 0 && heures < SEUIL_COURTE && (palier === "cv2" || palier === "cv3")) {
    return "cv1";
  }
  return palier;
}

export default function TarifsPage() {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [etat, setEtat] = useState<"chargement" | "ok" | "erreur">("chargement");
  const [palier, setPalier] = useState("cv1");
  const [remise, setRemise] = useState(REMISE_DEFAUT);

  useEffect(() => {
    fetch("/api/tarifs-formations")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setFormations(d.formations);
          setEtat("ok");
        } else {
          setEtat("erreur");
        }
      })
      .catch(() => setEtat("erreur"));
  }, []);

  // Le pourcentage, le nombre de places et le code viennent de textes_site :
  // les changer ne demande plus de toucher au code.
  useEffect(() => {
    fetch("/api/textes")
      .then((r) => r.json())
      .then((d) => {
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

  const bootcamps = formations.filter((f) => f.titre.startsWith("Bootcamp"));
  const classiques = formations.filter((f) => !f.titre.startsWith("Bootcamp"));

  const domaines: { nom: string; liste: Formation[] }[] = [];
  for (const f of classiques) {
    const d = domaines.find((x) => x.nom === f.domaine);
    if (d) {
      d.liste.push(f);
    } else {
      domaines.push({ nom: f.domaine, liste: [f] });
    }
  }

  const courtesConcernees =
    (palier === "cv2" || palier === "cv3") &&
    classiques.some((f) => {
      const h = heuresDe(f.duree);
      return h > 0 && h < SEUIL_COURTE;
    });

  // LE PRIX AFFICHE EST LE PRIX PAYE. La remise Fondateur ne se calcule plus
  // ici : elle s obtient avec le code, et seulement pour les premiers clients.
  const carte = (f: Formation, fixe: boolean) => {
    const heures = heuresDe(f.duree);
    const applicable = palierApplicable(palier, heures);
    const p = fixe ? f.prix : prixPalier(f.prix, applicable);
    const ramene = !fixe && applicable !== palier;
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "12px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>{f.titre}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
            {f.niveau}{heures > 0 ? " · " + heures + " h" : ""}
          </div>
          {ramene && (
            <div style={{ color: "rgba(200,169,110,0.7)", fontSize: "11px", marginTop: "5px", lineHeight: 1.5 }}>
              Formation courte : 1 seance d accompagnement incluse
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", marginLeft: "16px" }}>
          <div style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold" }}>
            {p.toLocaleString("fr-FR")}€
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 30px", textAlign: "center", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "3px", margin: "0 0 12px" }}>{txtT.surTitre}</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "36px", margin: "0 0 16px" }}>{txtT.titre1}<br/>{txtT.titre2}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 16px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          {formations.length > 0 ? formations.length + " " : ""}{txtT.dispo}
        </p>
        <div style={{ display: "inline-block", background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "30px", padding: "10px 24px" }}>
          <span style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold" }}>{remplir(txtT.fondateur)}</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: "12px auto 0", maxWidth: "520px", lineHeight: "1.7" }}>
          {remplir(txtT.fondateurDetail)}
        </p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px 60px" }}>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", textAlign: "center", margin: "0 0 16px" }}>{txtT.choisissez}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
          {txtT.paliers.map((p: { id: string; nom: string; detail: string }) => (
            <button
              key={p.id}
              onClick={() => setPalier(p.id)}
              style={{
                background: palier === p.id ? "#c8a96e" : "rgba(255,255,255,0.05)",
                color: palier === p.id ? "#050508" : "rgba(255,255,255,0.7)",
                border: "1px solid rgba(200,169,110,0.4)",
                borderRadius: "24px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {p.nom}
            </button>
          ))}
        </div>
        <p style={{ color: "rgba(200,169,110,0.8)", fontSize: "13px", textAlign: "center", margin: "0 0 10px" }}>
          {(txtT.paliers.find((p: { id: string }) => p.id === palier) || txtT.paliers[0]).detail}
        </p>

        {courtesConcernees && (
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", textAlign: "center", margin: "0 auto 36px", maxWidth: "620px", lineHeight: 1.7 }}>
            {txtT.noteCourte}
          </p>
        )}
        {!courtesConcernees && <div style={{ marginBottom: "36px" }} />}

        {etat === "chargement" && (
          <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{txtT.chargement}</p>
        )}
        {etat === "erreur" && (
          <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{txtT.erreur}</p>
        )}

        {etat === "ok" && domaines.map((domaine, di) => (
          <div key={di} style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid rgba(200,169,110,0.2)" }}>
              {domaine.nom}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {domaine.liste.map((f) => (
                <div key={f.code}>{carte(f, false)}</div>
              ))}
            </div>
          </div>
        ))}

        {etat === "ok" && bootcamps.length > 0 && (
          <div style={{ marginBottom: "40px", marginTop: "50px", padding: "30px", background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "16px" }}>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "22px", margin: "0 0 8px" }}>
              {txtT.bootcampsTitre}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "0 0 18px" }}>{txtT.bootcampsTexte}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {bootcamps.map((f) => (
                <div key={f.code}>{carte(f, true)}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "40px", padding: "40px", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "16px" }}>
          <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "24px", margin: "0 0 12px" }}>{txtT.pretTitre}</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>{remplir(txtT.pretTexte)}</p>
          <Link href="/formations" style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "16px 40px", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            {txtT.voirFormations} →
          </Link>
        </div>
      </div>
    </div>
  );
}
