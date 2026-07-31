"use client";
import { useState, useEffect } from "react";

export default function PortailOrganisme({ params }: { params: { slug: string } }) {
  const slug = params.slug || "";

  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [introuvable, setIntrouvable] = useState(false);
  const [domaine, setDomaine] = useState("");

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [formation, setFormation] = useState("");
  const [texte, setTexte] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [envoye, setEnvoye] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/portail/" + encodeURIComponent(slug));
      const data = await r.json();
      if (data.ok) setD(data);
      else setIntrouvable(true);
    } catch (e) {
      setIntrouvable(true);
    }
    setChargement(false);
  }

  async function demander() {
    if (email.indexOf("@") < 1) {
      setErreur("Indiquez une adresse email valable.");
      return;
    }
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/portail/" + encodeURIComponent(slug), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom,
          email: email,
          telephone: telephone,
          formation: formation,
          message: texte,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setEnvoye(data.message || "Merci, votre demande est transmise.");
        setNom(""); setEmail(""); setTelephone(""); setFormation(""); setTexte("");
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  const FOND = "#faf9f6";
  const o = d ? d.organisme : null;
  // La couleur du client habille toute la page : titres, boutons, bandeau.
  const TEINTE = (o && o.couleur) || "#0a3d2e";

  const CADRE: any = {
    minHeight: "100vh",
    background: FOND,
    color: "#1a1a1a",
    fontFamily: "Georgia, serif",
    colorScheme: "light",
  };

  const CARTE: any = {
    background: "#ffffff",
    border: "1px solid #e6e3dc",
    borderRadius: "12px",
    padding: "22px 26px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const LIBELLE: any = {
    display: "block",
    color: TEINTE,
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "6px",
  };

  if (chargement) {
    return (
      <div style={{ ...CADRE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#666", fontSize: "17px" }}>Chargement...</p>
      </div>
    );
  }

  if (introuvable || !d || !o) {
    return (
      <div style={{ ...CADRE, padding: "60px 20px" }}>
        <div style={{ maxWidth: "620px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ color: "#0a3d2e", fontSize: "25px", margin: "0 0 12px" }}>Page introuvable</h1>
          <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.75" }}>
            Cette adresse ne correspond a aucun organisme, ou sa page n est pas encore ouverte.
          </p>
        </div>
      </div>
    );
  }

  const affichees = domaine
    ? d.formations.filter(function (f: any) { return f.domaine === domaine; })
    : d.formations;

  return (
    <div style={CADRE}>
      <div style={{ background: TEINTE, color: "#fff", padding: "40px 20px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
          {o.logo_url && (
            <img
              src={o.logo_url}
              alt={o.raison_sociale}
              style={{ height: "72px", maxWidth: "220px", objectFit: "contain", background: "#fff", borderRadius: "8px", padding: "10px" }}
            />
          )}
          <div style={{ flex: "1 1 320px" }}>
            <h1 style={{ fontSize: "30px", margin: "0 0 10px", lineHeight: "1.3" }}>
              {o.raison_sociale}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
              Organisme de formation
              {o.numero_da ? " · declaration d activite n " + o.numero_da : ""}
              {o.qualiopi ? " · certifie Qualiopi" + (o.certificateur ? " par " + o.certificateur : "") : ""}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "34px 20px" }}>
        {o.presentation && (
          <div style={CARTE}>
            <p style={{ fontSize: "17px", lineHeight: "1.85", margin: 0, whiteSpace: "pre-wrap" }}>
              {o.presentation}
            </p>
          </div>
        )}

        <h2 style={{ color: TEINTE, fontSize: "22px", margin: "30px 0 6px" }}>
          Nos formations
        </h2>
        <p style={{ color: "#777", fontSize: "15px", margin: "0 0 18px" }}>
          {d.total} formation(s) disponible(s)
        </p>

        {d.domaines.length > 1 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            <button
              onClick={() => setDomaine("")}
              style={{ padding: "8px 16px", borderRadius: "20px", border: domaine ? "1px solid #ccc" : "none", background: domaine ? "#fff" : TEINTE, color: domaine ? "#666" : "#fff", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif" }}
            >
              Toutes
            </button>
            {d.domaines.map(function (dd: string) {
              const actif = domaine === dd;
              return (
                <button
                  key={dd}
                  onClick={() => setDomaine(dd)}
                  style={{ padding: "8px 16px", borderRadius: "20px", border: actif ? "none" : "1px solid #ccc", background: actif ? TEINTE : "#fff", color: actif ? "#fff" : "#666", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif" }}
                >
                  {dd}
                </button>
              );
            })}
          </div>
        )}

        {affichees.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "#777", margin: 0, fontSize: "16px" }}>
              Aucune formation dans cette categorie.
            </p>
          </div>
        ) : (
          affichees.map(function (f: any) {
            return (
              <div key={f.code} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <p style={{ color: "#999", fontSize: "13px", margin: "0 0 4px" }}>
                      {f.domaine || ""}{f.duree ? " · " + f.duree + " heures" : ""}
                    </p>
                    <h3 style={{ color: TEINTE, fontSize: "19px", margin: "0 0 8px" }}>{f.titre}</h3>
                    {f.description && (
                      <p style={{ color: "#444", fontSize: "15px", margin: "0 0 8px", lineHeight: "1.75" }}>
                        {String(f.description).slice(0, 320)}
                      </p>
                    )}
                    {f.public_cible && (
                      <p style={{ color: "#777", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                        Public : {f.public_cible}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {f.prix ? (
                      <p style={{ color: TEINTE, fontSize: "21px", fontWeight: "bold", margin: "0 0 8px" }}>
                        {Number(f.prix).toLocaleString("fr-FR")} EUR
                      </p>
                    ) : (
                      <p style={{ color: "#777", fontSize: "15px", margin: "0 0 8px" }}>sur devis</p>
                    )}
                    <button
                      onClick={() => {
                        setFormation(f.code);
                        const zone = document.getElementById("demande");
                        if (zone) zone.scrollIntoView({ behavior: "smooth" });
                      }}
                      style={{ background: TEINTE, color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
                    >
                      Cette formation
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div id="demande" style={{ ...CARTE, marginTop: "34px", border: "2px solid " + TEINTE }}>
          <h2 style={{ color: TEINTE, fontSize: "21px", margin: "0 0 8px" }}>
            Demander des informations
          </h2>
          <p style={{ color: "#666", fontSize: "15px", margin: "0 0 20px", lineHeight: "1.75" }}>
            Laissez-nous vos coordonnees : nous revenons vers vous rapidement, sans engagement.
          </p>

          {envoye ? (
            <div style={{ background: "#f2f9f3", border: "1px solid #b8ddbd", borderRadius: "8px", padding: "20px 22px" }}>
              <p style={{ color: "#2e7d32", fontSize: "17px", fontWeight: "bold", margin: 0, lineHeight: "1.7" }}>
                {envoye}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <span style={LIBELLE}>Votre nom</span>
                  <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <span style={LIBELLE}>Votre email</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} style={CHAMP} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <span style={LIBELLE}>Votre telephone</span>
                  <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <span style={LIBELLE}>Formation souhaitee</span>
                  <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="code ou intitule" style={CHAMP} />
                </div>
              </div>

              <span style={LIBELLE}>Votre demande</span>
              <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} style={{ ...CHAMP, lineHeight: "1.7" }} />

              {erreur && (
                <p style={{ color: "#a33a2a", fontSize: "15px", margin: "0 0 14px" }}>{erreur}</p>
              )}

              <button
                onClick={demander}
                disabled={occupe || email.indexOf("@") < 1}
                style={{ background: occupe || email.indexOf("@") < 1 ? "#dfe5e1" : TEINTE, color: occupe || email.indexOf("@") < 1 ? "#8a8a8a" : "#fff", padding: "16px 30px", borderRadius: "8px", border: "none", cursor: occupe || email.indexOf("@") < 1 ? "default" : "pointer", fontWeight: "bold", fontSize: "17px", fontFamily: "Georgia,serif", width: "100%" }}
              >
                {occupe ? "Envoi..." : "Envoyer ma demande"}
              </button>
            </>
          )}
        </div>

        <div style={{ ...CARTE, background: "#f4f2ed" }}>
          <h2 style={{ color: TEINTE, fontSize: "17px", margin: "0 0 10px" }}>Nous contacter</h2>
          <p style={{ color: "#555", fontSize: "15px", margin: 0, lineHeight: "1.85" }}>
            {o.raison_sociale}
            {o.adresse ? <><br />{o.adresse}</> : null}
            {o.email_contact ? <><br />{o.email_contact}</> : null}
            {o.telephone ? <><br />{o.telephone}</> : null}
            {o.numero_da ? <><br />Declaration d activite n {o.numero_da}</> : null}
          </p>
          <p style={{ color: "#999", fontSize: "13px", margin: "16px 0 0", lineHeight: "1.7" }}>
            Formations accessibles aux personnes en situation de handicap : contactez-nous pour
            etudier les amenagements possibles.
          </p>
        </div>
      </div>
    </div>
  );
}
