"use client";
import { useState, useEffect } from "react";

const SPECIALITES = [
  { code: "", nom: "\u2014 choisir la sp\u00e9cialit\u00e9 \u2014" },
  { code: "326", nom: "Informatique, num\u00e9rique, intelligence artificielle" },
  { code: "320", nom: "Communication, image, multim\u00e9dia" },
  { code: "312", nom: "Commerce, vente, marketing" },
  { code: "310", nom: "Gestion, management, entreprise" },
  { code: "313", nom: "Finance, banque, assurance" },
  { code: "314", nom: "Comptabilit\u00e9, gestion financi\u00e8re" },
  { code: "315", nom: "Ressources humaines" },
  { code: "128", nom: "Droit, sciences politiques" },
  { code: "331", nom: "Sant\u00e9, soins" },
  { code: "332", nom: "Travail social, accompagnement" },
  { code: "333", nom: "Enseignement, formation" },
  { code: "334", nom: "Accueil, h\u00f4tellerie, tourisme, restauration" },
  { code: "336", nom: "Coiffure, esth\u00e9tique, bien-\u00eatre corporel" },
  { code: "136", nom: "Langues vivantes" },
  { code: "135", nom: "Langues et civilisations anciennes" },
  { code: "413", nom: "D\u00e9veloppement personnel, relationnel, gestion du stress" },
  { code: "414", nom: "Organisation, gestion du temps, m\u00e9thodes de travail" },
  { code: "411", nom: "Pratiques sportives" },
  { code: "343", nom: "Nettoyage, s\u00e9curit\u00e9, services aux personnes" },
  { code: "230", nom: "B\u00e2timent, travaux publics" },
  { code: "200", nom: "Technologies industrielles" },
];

export default function PageCours() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);

  const [titre, setTitre] = useState("");
  const [domaine, setDomaine] = useState("");
  const [duree, setDuree] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [prerequis, setPrerequis] = useState("");
  const [publicCible, setPublicCible] = useState("");
  const [objectif, setObjectif] = useState("autre_formation");
  const [nsf, setNsf] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/cours" + suffixe());
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (titre.trim().length < 3) {
      setErreur("Donnez un titre \u00e0 votre formation.");
      return;
    }
    setOccupe("creation");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/cours" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre,
          domaine: domaine,
          duree: duree,
          prix: prix,
          description: description,
          objectifs: objectifs,
          prerequis: prerequis,
          public_cible: publicCible,
          objectif: objectif,
          code_nsf: nsf,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Formation " + (data.cours ? data.cours.code : "") + " cr\u00e9\u00e9e. Ajoutez-lui des modules.");
        setTitre(""); setDomaine(""); setDuree(""); setPrix("");
        setDescription(""); setObjectifs(""); setPrerequis(""); setPublicCible(""); setNsf("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Cr\u00e9ation impossible.");
      }
    } catch (e: any) {
      setErreur("Cr\u00e9ation impossible : " + String(e));
    }
    setOccupe("");
  }

  async function basculer(id: string, publie: boolean) {
    setOccupe("publier-" + id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/cours" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, publie: publie }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(publie ? "Formation publi\u00e9e." : "Formation retir\u00e9e de la publication.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
  }

  async function poserNsf(id: string, code: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/cours" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, code_nsf: code }),
      });
      const data = await r.json();
      if (data.ok) await charger();
      else setErreur(data.erreur || "Modification impossible.");
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  async function supprimer(id: string, t: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/cours" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(t + " supprim\u00e9e, avec ses modules.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
    }
  }

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

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
    textDecoration: "none",
  };

  function nomSpecialite(code: any) {
    const t = SPECIALITES.find(function (s) { return s.code === String(code || ""); });
    return t ? t.nom : null;
  }

  const sansNsf = d ? d.cours.filter(function (c: any) { return !c.code_nsf; }).length : 0;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au tableau de bord"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          MES PROPRES FORMATIONS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes formations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {d ? d.total : 0}{" formation(s) \u00b7 "}{d ? d.publies : 0}{" publi\u00e9e(s)"}
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "22px 0" }}>
          <a
            href={"/organisme/cours/creer" + suffixe()}
            style={{ background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "20px", textDecoration: "none", fontSize: "15px", fontWeight: "bold" }}
          >
            {"Construire \u00e0 partir d'une description \u2192"}
          </a>
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: "none", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "13px 26px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif" }}
          >
            {formulaire ? "Annuler" : "Cr\u00e9er \u00e0 la main"}
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-8px 0 20px", lineHeight: "1.7" }}>
          {"D\u00e9crivez votre formation : le plan complet est \u00e9tabli imm\u00e9diatement, et chaque module se r\u00e9dige ensuite depuis votre trame. La cr\u00e9ation manuelle vous laisse tout \u00e9crire vous-m\u00eame."}
        </p>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>{"Intitul\u00e9 de la formation"}</span>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Gestes et postures en milieu professionnel" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Domaine</span>
                <input value={domaine} onChange={(e) => setDomaine(e.target.value)} placeholder={"S\u00e9curit\u00e9"} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>{"Dur\u00e9e (heures)"}</span>
                <input value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="14" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>Prix (EUR)</span>
                <input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="890" style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>{"Sp\u00e9cialit\u00e9 \u00b7 remplit le cadre F-4 de votre bilan"}</span>
            <select value={nsf} onChange={(e) => setNsf(e.target.value)} style={CHAMP}>
              {SPECIALITES.map(function (s) {
                return <option key={s.code} value={s.code}>{s.nom}</option>;
              })}
            </select>

            <span style={LIBELLE}>{"Objectif de la prestation \u00b7 cadre F-3"}</span>
            <select value={objectif} onChange={(e) => setObjectif(e.target.value)} style={CHAMP}>
              {Object.keys(d && d.objectifs ? d.objectifs : { autre_formation: "Autre formation professionnelle" }).map(function (k) {
                return <option key={k} value={k}>{d.objectifs[k]}</option>;
              })}
            </select>

            <span style={LIBELLE}>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={CHAMP} />

            <span style={LIBELLE}>{"Objectifs p\u00e9dagogiques"}</span>
            <textarea value={objectifs} onChange={(e) => setObjectifs(e.target.value)} rows={3} placeholder={"\u00c0 l'issue de la formation, le stagiaire sait..."} style={CHAMP} />

            <span style={LIBELLE}>{"Pr\u00e9requis"}</span>
            <textarea value={prerequis} onChange={(e) => setPrerequis(e.target.value)} rows={2} placeholder={"Aucun pr\u00e9requis acad\u00e9mique."} style={CHAMP} />

            <span style={LIBELLE}>{"Public concern\u00e9"}</span>
            <textarea value={publicCible} onChange={(e) => setPublicCible(e.target.value)} rows={2} style={CHAMP} />

            <button
              onClick={creer}
              disabled={occupe === "creation"}
              style={{ background: occupe === "creation" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "creation" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Cr\u00e9ation..." : "Cr\u00e9er"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {sansNsf > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.45)" }}>
            <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              {sansNsf}{" formation(s) sans sp\u00e9cialit\u00e9. Sans elle, elles n'appara\u00eetront pas dans le cadre F-4 de votre bilan p\u00e9dagogique."}
            </p>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.cours.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              {"Aucune formation propre. D\u00e9crivez ce que vous voulez enseigner : le plan complet se construit imm\u00e9diatement, puis chaque module s'\u00e9crit depuis votre trame. Ou cr\u00e9ez tout \u00e0 la main."}
            </p>
          </div>
        ) : (
          d.cours.map(function (c: any) {
            return (
              <div key={c.id} style={{ ...CARTE, border: "1px solid " + (c.publie ? "rgba(76,175,80,0.4)" : "rgba(200,169,110,0.25)") }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                      {c.code}{c.domaine ? " \u00b7 " + c.domaine : ""}
                      {c.duree ? " \u00b7 " + c.duree + " h" : ""}
                      {c.prix ? " \u00b7 " + Number(c.prix).toLocaleString("fr-FR") + " EUR" : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{c.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {c.modules}{" module(s) \u00b7 "}{c.modules_rediges}{" r\u00e9dig\u00e9(s)"}
                      {c.code_nsf ? " \u00b7 " + (nomSpecialite(c.code_nsf) || "sp\u00e9cialit\u00e9 " + c.code_nsf) : ""}
                    </p>
                  </div>

                  <span style={{ color: c.publie ? "#4caf50" : "rgba(255,255,255,0.45)", fontSize: "13px", fontWeight: "bold" }}>
                    {c.publie ? "Publi\u00e9e" : "Brouillon"}
                  </span>
                </div>

                {!c.code_nsf && (
                  <div style={{ marginTop: "12px" }}>
                    <span style={{ ...LIBELLE, color: "#e8a33d" }}>{"Sp\u00e9cialit\u00e9 \u00e0 choisir"}</span>
                    <select
                      value=""
                      onChange={(e) => poserNsf(c.id, e.target.value)}
                      style={{ ...CHAMP, marginBottom: 0, border: "1px solid rgba(232,163,61,0.5)" }}
                    >
                      {SPECIALITES.map(function (s) {
                        return <option key={s.code} value={s.code}>{s.nom}</option>;
                      })}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <a href={"/organisme/cours/" + c.id + suffixe()} style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}>
                    {c.modules_rediges < c.modules ? "R\u00e9diger les modules" : "Relire les modules"}
                  </a>

                  <button
                    onClick={() => basculer(c.id, !c.publie)}
                    disabled={occupe !== ""}
                    style={BOUTON}
                  >
                    {occupe === "publier-" + c.id ? "..." : c.publie ? "D\u00e9publier" : "Publier"}
                  </button>

                  {c.publie && (
                    <a href={"/organisme/formation/" + c.code + suffixe()} style={BOUTON}>
                      La lire
                    </a>
                  )}

                  <button
                    onClick={() => supprimer(c.id, c.titre)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
