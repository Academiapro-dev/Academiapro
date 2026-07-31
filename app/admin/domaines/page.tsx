"use client";
import { useState, useEffect } from "react";

export default function PageDomaines() {
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [saisie, setSaisie] = useState<any>({});
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) {
        setOrganismes(data.organismes || []);
        const s: any = {};
        for (const o of data.organismes || []) s[o.id] = o.domaine || "";
        setSaisie(s);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function enregistrer(id: string) {
    setOccupe(id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, domaine: saisie[id] || "" }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Domaine enregistre. Pensez a l ajouter dans Vercel.");
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
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
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    flex: "1 1 240px",
    padding: "11px 13px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
  };

  const avecDomaine = organismes.filter(function (o) { return !!o.domaine; }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          MARQUE BLANCHE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Domaines des clients</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {avecDomaine} client(s) sur {organismes.length} ont leur propre adresse
        </p>

        <div style={{ ...CARTE, marginTop: "24px", background: "rgba(200,169,110,0.06)" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>
            Les deux gestes a faire, une seule fois par client
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            <strong style={{ color: "#fff" }}>Chez lui</strong> — son hebergeur ou son bureau
            d enregistrement doit ajouter un enregistrement CNAME pour le sous-domaine choisi,
            pointant vers <span style={{ color: "#c8a96e", fontFamily: "monospace" }}>cname.vercel-dns.com</span>.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            <strong style={{ color: "#fff" }}>Chez vous</strong> — ajoutez ce domaine dans les
            reglages du projet Vercel, rubrique Domains, puis attendez que Vercel confirme le
            certificat.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            La propagation prend de quelques minutes a quelques heures. Ensuite, l adresse de votre
            client mene directement a sa vitrine, sans qu AcadeMIA Pro apparaisse nulle part.
          </p>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : organismes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun client pour le moment.
            </p>
          </div>
        ) : (
          organismes.map(function (o) {
            return (
              <div key={o.id} style={{ ...CARTE, border: o.domaine ? "1px solid rgba(76,175,80,0.35)" : CARTE.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 3px" }}>{o.raison_sociale}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {o.portail_actif
                        ? "page en ligne · academiapro.fr/of/" + (o.slug || "…")
                        : "page fermee — a ouvrir avant de brancher un domaine"}
                    </p>
                  </div>
                  {o.domaine && (
                    <a
                      href={"https://" + o.domaine}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#4caf50", fontSize: "13.5px", textDecoration: "none", alignSelf: "center" }}
                    >
                      {o.domaine} ↗
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={saisie[o.id] || ""}
                    onChange={(e) => setSaisie({ ...saisie, [o.id]: e.target.value })}
                    placeholder="formation.son-entreprise.fr"
                    style={CHAMP}
                  />
                  <button
                    onClick={() => enregistrer(o.id)}
                    disabled={occupe !== ""}
                    style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "11px 22px", borderRadius: "8px", cursor: occupe !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif" }}
                  >
                    {occupe === o.id ? "..." : "Enregistrer"}
                  </button>
                </div>

                {!o.portail_actif && saisie[o.id] && (
                  <p style={{ color: "#e8a33d", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7" }}>
                    Sa page publique est fermee : le domaine ne montrera rien tant qu il ne l aura
                    pas ouverte depuis son espace.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
