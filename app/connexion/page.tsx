"use client";
import { useState, useEffect } from "react";

const MESSAGES: Record<string, string> = {
  lien_expire: "Ce lien a expiré. Demandez-en un nouveau ci-dessous.",
  lien_deja_utilise: "Ce lien a déjà servi. Demandez-en un nouveau ci-dessous.",
  lien_inconnu: "Ce lien n'est pas valide. Demandez-en un nouveau ci-dessous.",
  lien_incomplet: "Le lien semble incomplet. Demandez-en un nouveau ci-dessous.",
  configuration: "Problème de configuration du serveur. Réessayez plus tard.",
  technique: "Un problème technique est survenu. Réessayez.",
};

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  // 🚨 LA PAGE DE CONNEXION EST PARTAGEE PAR TOUS LES DOMAINES — 31/08.
  //
  // LE DEFAUT CONSTATE. Sur mysterllc.com/connexion, un gestionnaire de LLC
  // pour expatries lisait « S'inscrire — espace comptabilité » et « Vous
  // cherchez une formation ? Découvrir le catalogue ». Deux propositions
  // qui n ont aucun sens pour lui, et qui donnent l impression d etre
  // tombe sur le site de quelqu un d autre — au moment precis ou il ouvre
  // un compte, donc au pire moment possible.
  //
  // LE DOMAINE EST LU APRES LE MONTAGE, jamais pendant le rendu initial :
  // window n existe pas cote serveur. Tant qu il n est pas connu, on
  // affiche la version neutre — c est le defaut le plus sur, puisqu il ne
  // propose rien de faux a personne.
  const [surMysterLLC, setSurMysterLLC] = useState(false);

  // 🆕 LA PAGE DE RETOUR — 02/09. Quand une page protegee renvoie ici avec
  // ?retour=/chemin, ce chemin est transmis a /api/auth/demander, qui le
  // glisse dans le lien du courriel ; /api/auth/valider y renvoie apres la
  // connexion. Constate en test reel sur la signature MysterLLC : sans
  // cela, le signataire atterrissait sur le portefeuille au lieu de
  // retrouver son document. Seul un chemin relatif est retenu.
  const [retour, setRetour] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("erreur");
      if (code) setErreur(MESSAGES[code] || MESSAGES.technique);
      const r = String(params.get("retour") || "").trim();
      if (r && r.charAt(0) === "/" && r.indexOf("//") !== 0) setRetour(r);
    } catch (e) {}

    try {
      setSurMysterLLC(window.location.hostname.toLowerCase().indexOf("mysterllc.com") >= 0);
    } catch (e) {}
  }, []);

  async function demander() {
    const propre = email.toLowerCase().trim();
    if (!propre || propre.indexOf("@") < 1) {
      setErreur("Veuillez saisir votre adresse électronique.");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/auth/demander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: propre, retour: retour || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setEnvoye(true);
      } else {
        setErreur(data.error || "Une erreur est survenue.");
      }
    } catch (e) {
      setErreur("Erreur de connexion au serveur.");
    }
    setLoading(false);
  }

  const cadre = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "16px",
    padding: "40px",
  } as any;

  if (envoye) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: "520px", textAlign: "center" }}>
          <div style={{ fontSize: "54px", marginBottom: "20px" }}>📩</div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "15px" }}>
            Vérifiez votre boîte de réception
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8", marginBottom: "10px" }}>
            Un lien de connexion vient d'être envoyé à <strong style={{ color: "#fff" }}>{email.toLowerCase().trim()}</strong>.
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.7" }}>
            Il est valable 20 minutes et ne peut servir qu'une fois. Pensez à regarder dans les indésirables.
          </p>
          <button
            onClick={() => { setEnvoye(false); setErreur(""); }}
            style={{ marginTop: "25px", background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.4)", padding: "10px 24px", borderRadius: "8px", cursor: "pointer" }}
          >
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", marginBottom: "15px" }}>VOTRE ESPACE</p>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "2.4rem", marginBottom: "15px" }}>
          Connexion
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", maxWidth: "560px", margin: "0 auto" }}>
          Saisissez votre adresse électronique. Vous recevrez un lien de connexion, sans mot de passe à retenir.
        </p>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "50px 20px" }}>
        <div style={cadre}>
          {erreur && (
            <div style={{ background: "rgba(255,0,0,0.1)", border: "1px solid red", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#ff6b6b", textAlign: "center", fontSize: "14px" }}>
              {erreur}
            </div>
          )}
          <label style={{ color: "#c8a96e", fontSize: "13px", display: "block", marginBottom: "6px" }}>Votre adresse électronique</label>
          <input
            type="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") demander(); }}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", boxSizing: "border-box" as any, marginBottom: "20px" }}
          />
          <button
            onClick={demander}
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Envoi en cours…" : "Recevoir mon lien de connexion"}
          </button>

          {/* ⚠️ LE BAS DE CARTE NE S AFFICHE PAS SUR MYSTERLLC.COM.
              Aucune inscription en ligne n y est ouverte : les comptes des
              gestionnaires se creent au cas par cas apres entretien. Une
              porte d inscription libre y serait donc une promesse fausse,
              en plus d etre celle d un autre produit. */}
          {!surMysterLLC && (
            <>
              <div style={{ height: "1px", background: "rgba(200,169,110,0.2)", margin: "28px 0 22px" }} />

              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", textAlign: "center", margin: "0 0 14px" }}>
                Vous n'avez pas encore de compte ?
              </p>

              <a
                href="/comptable/inscription"
                style={{ display: "block", textAlign: "center", padding: "13px", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px", marginBottom: "12px" }}
              >
                S'inscrire — espace comptabilité
              </a>

              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "16px", marginBottom: 0 }}>
                Vous cherchez une formation ? <a href="/catalogue" style={{ color: "#c8a96e" }}>Découvrir le catalogue</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
