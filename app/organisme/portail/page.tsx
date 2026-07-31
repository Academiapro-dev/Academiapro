"use client";
import { useState, useEffect } from "react";

const COULEURS = [
  { code: "#0a3d2e", nom: "Vert profond" },
  { code: "#1a3a5c", nom: "Bleu nuit" },
  { code: "#7a2e2e", nom: "Bordeaux" },
  { code: "#2c2c2c", nom: "Anthracite" },
  { code: "#5b3a7a", nom: "Prune" },
  { code: "#1f5f5b", nom: "Sarcelle" },
  { code: "#8a5a1e", nom: "Ambre" },
  { code: "#3d5a2c", nom: "Olive" },
];

export default function PagePortail() {
  const [d, setD] = useState<any>(null);
  const [slug, setSlug] = useState("");
  const [presentation, setPresentation] = useState("");
  const [couleur, setCouleur] = useState("#0a3d2e");
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/portail" + suffixe("?"));
      const data = await r.json();
      if (data.ok) {
        setD(data);
        setSlug(data.organisme.slug || data.suggestion || "");
        setPresentation(data.organisme.portail_presentation || "");
        setCouleur(data.organisme.couleur || "#0a3d2e");
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function enregistrer(actif?: boolean) {
    setOccupe(actif === undefined ? "enr" : "bascule");
    setMessage("");
    setErreur("");
    try {
      const corps: any = { slug: slug, portail_presentation: presentation, couleur: couleur };
      if (actif !== undefined) corps.portail_actif = actif;

      const r = await fetch("/api/organisme/portail" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(
          actif === true ? "Votre page est en ligne."
          : actif === false ? "Votre page est fermee."
          : "Enregistre."
        );
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
  }

  async function deposerLogo(e: any) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    setOccupe("logo");
    setMessage("");
    setErreur("");
    try {
      const donnees = new FormData();
      donnees.append("logo", f);

      const r = await fetch("/api/organisme/portail" + suffixe("?"), {
        method: "POST",
        body: donnees,
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Logo depose.");
        await charger();
      } else {
        setErreur(data.erreur || "Depot impossible.");
      }
    } catch (e2: any) {
      setErreur("Depot impossible : " + String(e2));
    }
    setOccupe("");
  }

  async function retirerLogo() {
    setOccupe("logo");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/portail" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retirer_logo: true }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Logo retire.");
        await charger();
      } else {
        setErreur(data.erreur || "Retrait impossible.");
      }
    } catch (e: any) {
      setErreur("Retrait impossible : " + String(e));
    }
    setOccupe("");
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "6px",
  };

  const actif = d && d.organisme && d.organisme.portail_actif;
  const logo = d && d.organisme ? d.organisme.logo_url : null;
  const adresse = "academiapro.fr/of/" + (slug || "...");

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          VOTRE VITRINE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Ma page publique</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          A vos couleurs, avec un formulaire qui alimente votre suivi commercial
        </p>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={{ ...CARTE, marginTop: "24px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, marginTop: "24px", border: "2px solid " + (actif ? "rgba(76,175,80,0.5)" : "rgba(200,169,110,0.35)") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ color: actif ? "#4caf50" : "rgba(255,255,255,0.5)", fontSize: "17px", fontWeight: "bold", margin: "0 0 4px" }}>
                    {actif ? "Votre page est en ligne" : "Votre page est fermee"}
                  </p>
                  <p style={{ color: "#c8a96e", fontSize: "14px", margin: 0, wordBreak: "break-all" }}>
                    {adresse}
                  </p>
                </div>

                <button
                  onClick={() => enregistrer(!actif)}
                  disabled={occupe !== "" || !slug}
                  style={{ background: actif ? "none" : "#c8a96e", color: actif ? "#e8836a" : "#050508", border: actif ? "1px solid rgba(232,131,106,0.5)" : "none", padding: "12px 24px", borderRadius: "8px", cursor: occupe !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                >
                  {occupe === "bascule" ? "..." : actif ? "Fermer ma page" : "Mettre en ligne"}
                </button>
              </div>

              {actif && (
                <a
                  href={"/of/" + slug}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: "14px", color: "#c8a96e", fontSize: "14px" }}
                >
                  Voir ma page telle que la voient mes visiteurs →
                </a>
              )}
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 16px" }}>Votre identite visuelle</h2>

              <span style={LIBELLE}>Votre logo</span>

              {logo ? (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <img
                    src={logo}
                    alt="logo"
                    style={{ height: "64px", maxWidth: "200px", objectFit: "contain", background: "#fff", borderRadius: "8px", padding: "8px" }}
                  />
                  <button
                    onClick={retirerLogo}
                    disabled={occupe !== ""}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px" }}
                  >
                    Retirer
                  </button>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={deposerLogo}
                disabled={occupe !== ""}
                style={{ ...CHAMP, fontSize: "14px" }}
              />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-8px 0 18px", lineHeight: "1.6" }}>
                PNG, JPEG, WEBP ou SVG, deux megaoctets au maximum. Un logo sur fond transparent
                rend le mieux.
              </p>

              <span style={LIBELLE}>Votre couleur</span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                {COULEURS.map(function (c) {
                  const choisie = couleur.toLowerCase() === c.code;
                  return (
                    <div
                      key={c.code}
                      onClick={() => setCouleur(c.code)}
                      title={c.nom}
                      style={{ width: "52px", height: "52px", borderRadius: "10px", background: c.code, cursor: "pointer", border: choisie ? "3px solid #c8a96e" : "1px solid rgba(255,255,255,0.15)" }}
                    />
                  );
                })}
              </div>

              <input
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                placeholder="#0a3d2e"
                style={{ ...CHAMP, width: "160px", fontFamily: "monospace" }}
              />

              <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ background: couleur, padding: "22px 24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  {logo && (
                    <img src={logo} alt="" style={{ height: "44px", maxWidth: "130px", objectFit: "contain", background: "#fff", borderRadius: "6px", padding: "6px" }} />
                  )}
                  <div>
                    <p style={{ color: "#fff", fontSize: "19px", margin: "0 0 3px", fontWeight: "bold" }}>
                      {d.organisme.raison_sociale}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>
                      Apercu de votre bandeau
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => enregistrer()}
                disabled={occupe !== ""}
                style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
              >
                {occupe === "enr" ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            <div style={CARTE}>
              <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 16px" }}>Adresse et presentation</h2>

              <span style={LIBELLE}>Adresse de votre page</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="formation-conseil"
                style={CHAMP}
              />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-8px 0 16px", lineHeight: "1.7" }}>
                Lettres, chiffres et tirets. C est l adresse que vous communiquerez : choisissez-la
                courte et memorisable, elle ne devrait plus changer ensuite.
              </p>

              <span style={LIBELLE}>Presentation de votre organisme</span>
              <textarea
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                rows={7}
                placeholder={"Qui vous etes, ce que vous faites, ce qui vous distingue.\n\nQuelques phrases suffisent : vos visiteurs viennent surtout voir vos formations."}
                style={CHAMP}
              />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-8px 0 16px" }}>
                {presentation.length} caracteres sur 4000
              </p>

              <button
                onClick={() => enregistrer()}
                disabled={occupe !== ""}
                style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
              >
                {occupe === "enr" ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            {d.sans_prix > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
                <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.sans_prix} formation(s) n ont pas de prix de vente : elles s afficheront
                  « sur devis ». Renseignez-les dans votre catalogue si vous preferez afficher
                  un tarif.
                </p>
              </div>
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.75" }}>
                Votre page affiche {d.formations_publiables} formation(s) : celles que vous avez
                creees et publiees, et celles de votre catalogue.
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0, lineHeight: "1.75" }}>
                Rien n y rappelle AcadeMIA Pro : c est votre vitrine. Chaque demande deposee par un
                visiteur arrive dans vos prospects, avec un score selon les coordonnees laissees.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
