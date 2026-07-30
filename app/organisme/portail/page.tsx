"use client";
import { useState, useEffect } from "react";

export default function PagePortail() {
  const [d, setD] = useState<any>(null);
  const [slug, setSlug] = useState("");
  const [presentation, setPresentation] = useState("");
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
      const corps: any = { slug: slug, portail_presentation: presentation };
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
          Vos formations, visibles de tous, avec un formulaire qui alimente votre suivi commercial
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

            {d.sans_prix > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,163,61,0.5)" }}>
                <p style={{ color: "#e8a33d", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
                  {d.sans_prix} formation(s) n ont pas de prix de vente : elles s afficheront
                  « sur devis ». Renseignez-les dans votre catalogue si vous preferez afficher
                  un tarif.
                </p>
              </div>
            )}

            <div style={CARTE}>
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
                style={{ background: occupe !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: occupe !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
              >
                {occupe === "enr" ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.75" }}>
                Votre page affiche {d.formations_publiables} formation(s) : celles que vous avez
                creees et publiees, et celles de votre catalogue.
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0, lineHeight: "1.75" }}>
                Chaque demande d information deposee par un visiteur arrive directement dans vos
                prospects, avec un score selon les coordonnees laissees. Votre numero de
                declaration d activite et la mention d accessibilite y figurent automatiquement.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
