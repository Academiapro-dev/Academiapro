"use client";
import { useState, useEffect } from "react";

// L ECRAN D INVITATION LINKEDIN — UNE FICHE A LA FOIS.
//
// 🚨 DEFAUT DE CONCEPTION CORRIGE LE 16/08, ET IL ETAIT DE MOI.
// Le bouton faisait DEUX choses d un seul clic : ouvrir le profil ET
// marquer la fiche comme invitee. Or on ne sait qu APRES avoir vu le
// profil si on veut inviter — le dirigeant a change d entreprise, la
// societe n a plus d activite, LinkedIn refuse la note. Resultat : toute
// fiche dont Jacques ouvrait le profil sortait de la file, meme quand
// rien n avait ete envoye. Cinq fiches perdues en une matinee.
//
// DESORMAIS : « Ouvrir le profil » ne marque RIEN. Le marquage se fait au
// retour, en conscience, avec « J ai envoye l invitation ». Regarder ne
// doit jamais avoir de consequence — seul agir en a une.
//
// RIEN N EST AUTOMATISE, ET C EST VOLONTAIRE. L API de LinkedIn ne permet
// pas d envoyer des invitations. Les outils qui le font pilotent le
// navigateur en cachette : LinkedIn les detecte, restreint le compte, puis
// le supprime.
//
// « ECARTER » N EST PAS « REFUSER ». Ecarter est la decision de Jacques,
// prise avant tout envoi ; refuser est celle du destinataire, apres.

const BASES = [
  { cle: "organismes", nom: "Organismes certifiés Qualiopi" },
  { cle: "qualiopi", nom: "Organismes NON certifiés" },
  { cle: "interim", nom: "Agences d'intérim" },
];

// 🚨 DEUX CENTS CARACTERES, PAS TROIS CENTS. Constate a l ecran le 16/08 :
// LinkedIn n accorde 300 caracteres QU AUX COMPTES PREMIUM. En compte
// gratuit la limite est de 200 — et le nombre de notes personnalisees est
// lui-meme plafonne a quelques-unes par mois. Au-dela, il ne reste que
// « Envoyer sans note », qui BRULE LA FICHE POUR TROIS SEMAINES.
const LIMITE_NOTE = 200;

function mot(prenom: string) {
  const p = String(prenom || "").trim();
  const civilite = p ? "Bonjour " + p : "Bonjour";
  return civilite + ", j'ai dirigé un organisme de formation certifié, et c'est l'administratif "
    + "qui m'a coûté le plus de temps. J'en ai fait un outil qui le prend en charge. "
    + "Ravi d'échanger avec vous.";
}

export default function PageLinkedin() {
  const [base, setBase] = useState("organismes");
  const [fiche, setFiche] = useState<any>(null);
  const [restant, setRestant] = useState(0);
  const [epuise, setEpuise] = useState(false);
  const [compteurs, setCompteurs] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);
  const [texte, setTexte] = useState("");
  const [vu, setVu] = useState(false);

  useEffect(() => { chargerSuivante(); }, [base]);

  async function appeler(corps: any) {
    const r = await fetch("/api/admin/linkedin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  function poser(d: any) {
    setFiche(d.fiche || null);
    setRestant(d.restant || 0);
    setEpuise(!!d.epuise);
    setTexte(d.fiche ? mot(d.fiche.dirigeant_prenom) : "");
    setCopie(false);
    setVu(false);
  }

  async function chargerSuivante() {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ action: "suivante", base: base });
      if (d.ok) {
        poser(d);
        setCompteurs(d.compteurs || null);
      } else {
        setErreur(d.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  // OUVRIR LE PROFIL — ET RIEN D AUTRE.
  //
  // Aucun appel reseau, aucune ecriture en base. Regarder un profil ne doit
  // avoir aucune consequence : c est precisement le defaut corrige le 16/08.
  function ouvrir() {
    if (!fiche) return;
    try { window.open(lien(fiche.linkedin), "_blank", "noopener"); } catch (e) { }
    setVu(true);
  }

  // MARQUER, AU RETOUR, EN CONSCIENCE.
  async function marquerInvite() {
    if (!fiche) return;
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ base: base, id: fiche.id, statut: "invite" });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        poser(d);
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  // ECARTER SANS INVITER. La fiche sort de la file, ne compte dans aucun
  // quota, et reste distincte d une invitation refusee.
  async function ecarter() {
    if (!fiche) return;
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ base: base, id: fiche.id, statut: "ecarte" });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        poser(d);
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  // PASSER SANS RIEN DECIDER. La fiche n est pas modifiee : elle reviendra
  // a la prochaine session. Pour les cas ou on ne veut ni inviter ni
  // ecarter — LinkedIn qui refuse la note, un doute a lever plus tard.
  function passer() {
    chargerSuivante();
  }

  function copier() {
    try {
      navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
  }

  // Le profil est stocke sans schema : « www.linkedin.com/in/x ». Tel quel
  // dans un href, le navigateur le prendrait pour un chemin relatif.
  function lien(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";

  const CARTE: any = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "22px 24px",
    marginBottom: "16px",
    border: "1px solid rgba(200,169,110,0.2)",
  };

  const BOUTON: any = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(200,169,110,0.35)",
    color: OR,
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
  };

  const plafondJour = compteurs ? (compteurs.reste_jour || 0) <= 0 : false;
  const plafondSemaine = compteurs ? (compteurs.reste_semaine || 0) <= 0 : false;
  const bloque = plafondJour || plafondSemaine;
  const trop = texte.length > LIMITE_NOTE;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "28px 20px" }}>
        <a href="/admin/crm" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour au CRM
        </a>
        <h1 style={{ color: OR, margin: "14px 0 4px", fontSize: "23px" }}>Inviter sur LinkedIn</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "13px" }}>
          Copier · ouvrir · inviter sur LinkedIn · marquer au retour
        </p>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: "760px", margin: "0 auto" }}>

        {/* ---------- LE RYTHME ---------- */}
        {compteurs && (
          <div style={{ ...CARTE, borderColor: bloque ? "rgba(232,131,106,0.5)" : "rgba(68,138,255,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ color: plafondJour ? "#e8836a" : BLEU, fontSize: "20px", fontWeight: "bold" }}>
                  {nombre(compteurs.jour)} / {compteurs.plafond_jour}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>aujourd'hui</div>
              </div>
              <div>
                <div style={{ color: plafondSemaine ? "#e8836a" : BLEU, fontSize: "20px", fontWeight: "bold" }}>
                  {nombre(compteurs.semaine)} / {compteurs.plafond_semaine}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>sept derniers jours</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "20px", fontWeight: "bold" }}>
                  {nombre(compteurs.total)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>invitations au total</div>
              </div>
              <div>
                <div style={{ color: OR, fontSize: "20px", fontWeight: "bold" }}>{nombre(restant)}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>restent dans cette base</div>
              </div>
            </div>

            {compteurs.ecartes > 0 && (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "12px 0 0" }}>
                {nombre(compteurs.ecartes)} fiche(s) écartée(s) — jamais sollicitées, hors quota.
              </p>
            )}

            {bloque && (
              <p style={{ color: "#e8836a", fontSize: "13px", lineHeight: "1.7", margin: "14px 0 0" }}>
                {plafondJour
                  ? "Vous avez atteint les " + compteurs.plafond_jour + " invitations du jour. Reprenez demain."
                  : "Vous avez atteint les " + compteurs.plafond_semaine + " invitations de la semaine. Laissez passer quelques jours."}
              </p>
            )}
          </div>
        )}

        {/* ---------- LA BASE ---------- */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          {BASES.map(function (b) {
            const actif = base === b.cle;
            return (
              <button
                key={b.cle}
                onClick={() => setBase(b.cle)}
                style={{
                  ...BOUTON, borderRadius: "20px", padding: "8px 16px", fontSize: "13px",
                  background: actif ? OR : "rgba(255,255,255,0.06)",
                  color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                  border: actif ? "none" : BOUTON.border,
                  fontWeight: actif ? "bold" : "normal",
                }}
              >
                {b.nom}
              </button>
            );
          })}
        </div>

        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "16px", color: "#e8836a", fontSize: "13.5px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {/* ---------- LA FICHE ---------- */}
        {charge && !fiche ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
        ) : epuise || !fiche ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
              Plus aucun profil à inviter dans cette base. Essayez-en une autre, ou
              enrichissez de nouvelles fiches pour en récupérer.
            </p>
          </div>
        ) : (
          <>
            <div style={CARTE}>
              <div style={{ color: "#fff", fontSize: "19px", fontWeight: "bold", marginBottom: "5px" }}>
                {(fiche.dirigeant_prenom || "") + " " + (fiche.dirigeant_nom || "")}
              </div>
              <div style={{ color: OR, fontSize: "15px", marginBottom: "10px" }}>
                {fiche.raison_sociale || "—"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8" }}>
                {fiche.ville || "ville inconnue"}
                {fiche.code_postal ? " · " + fiche.code_postal : ""}
                {fiche.siren ? " · SIREN " + fiche.siren : ""}
              </div>
              {fiche.site_web && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", wordBreak: "break-all", marginTop: "4px" }}>
                  {fiche.site_web}
                </div>
              )}
              {(fiche.email || fiche.telephone) && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", marginTop: "4px", wordBreak: "break-all" }}>
                  {fiche.email ? "✉️ " + fiche.email : ""}
                  {fiche.email && fiche.telephone ? " · " : ""}
                  {fiche.telephone ? "☎️ " + fiche.telephone : ""}
                </div>
              )}
            </div>

            {/* ---------- LE MOT ---------- */}
            <div style={CARTE}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>1. COPIEZ LE MOT</span>
                <span style={{ color: trop ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                  {texte.length} / {LIMITE_NOTE} caractères
                </span>
              </div>

              <textarea
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                rows={5}
                style={{
                  width: "100%", padding: "13px", borderRadius: "9px",
                  border: "1px solid " + (trop ? "rgba(232,131,106,0.6)" : "rgba(200,169,110,0.3)"),
                  background: "rgba(255,255,255,0.04)", color: "#fff",
                  fontSize: "14.5px", lineHeight: "1.75", fontFamily: "Georgia,serif",
                  boxSizing: "border-box", resize: "vertical",
                }}
              />

              {trop && (
                <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                  Au-delà de {LIMITE_NOTE} caractères, LinkedIn retire le bouton « Ajouter une note »
                  en compte gratuit.
                </p>
              )}

              <button
                onClick={copier}
                disabled={trop}
                style={{ ...BOUTON, width: "100%", marginTop: "12px", opacity: trop ? 0.4 : 1, background: copie ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie ? VERT : OR, borderColor: copie ? "rgba(0,230,118,0.4)" : BOUTON.border }}
              >
                {copie ? "✓ Copié" : "Copier le mot"}
              </button>
            </div>

            {/* ---------- OUVRIR, SANS RIEN MARQUER ---------- */}
            <div style={CARTE}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                2. OUVREZ LE PROFIL ET INVITEZ SUR LINKEDIN
              </p>
              <button
                onClick={ouvrir}
                style={{
                  width: "100%", background: vu ? "rgba(255,255,255,0.06)" : BLEU,
                  color: vu ? "rgba(255,255,255,0.6)" : "#fff",
                  border: vu ? "1px solid rgba(255,255,255,0.2)" : "none",
                  borderRadius: "9px", padding: "15px",
                  fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer",
                }}
              >
                {vu ? "Rouvrir le profil" : "Ouvrir le profil LinkedIn"}
              </button>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                Ce bouton n'enregistre rien — vous pouvez regarder le profil et revenir sans
                conséquence. Sur LinkedIn : <strong>⋯</strong> puis <strong>Se connecter</strong>,
                puis <strong>Ajouter une note</strong>. Ne cliquez jamais « Envoyer sans note » :
                la personne devient injoignable trois semaines.
              </p>
            </div>

            {/* ---------- MARQUER, AU RETOUR ---------- */}
            <div style={{ ...CARTE, borderColor: vu ? "rgba(0,230,118,0.35)" : "rgba(200,169,110,0.2)" }}>
              <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                3. DE RETOUR ICI
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={marquerInvite}
                  disabled={charge || bloque}
                  style={{
                    flex: "2 1 220px",
                    background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)",
                    color: bloque ? "rgba(255,255,255,0.3)" : VERT,
                    border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"),
                    borderRadius: "9px", padding: "15px",
                    fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif",
                    cursor: bloque ? "not-allowed" : "pointer",
                  }}
                >
                  {charge ? "…" : bloque ? "Plafond atteint" : "✓ J'ai envoyé l'invitation"}
                </button>

                <button
                  onClick={ecarter}
                  disabled={charge}
                  style={{ ...BOUTON, flex: "1 1 130px", padding: "15px", color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.18)" }}
                >
                  Écarter
                </button>

                <button
                  onClick={passer}
                  disabled={charge}
                  style={{ ...BOUTON, flex: "1 1 130px", padding: "15px", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}
                >
                  Passer
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                <strong>Écarter</strong> retire la fiche définitivement — profil hors cible,
                dirigeant parti ailleurs. <strong>Passer</strong> ne touche à rien : la fiche
                reviendra à la prochaine session.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
