"use client";
import { useState, useEffect } from "react";

// L ECRAN LINKEDIN — TROIS TEMPS, TROIS ONGLETS.
//
// INVITER : une fiche a la fois, le mot pre-redige, le profil qui s ouvre.
// MES INVITATIONS : ce qui est parti et attend une reponse. C est la que
//   Jacques marque les acceptations vues dans ses notifications LinkedIn.
// A RELANCER : les personnes qui ont accepte. LA CONNEXION ETABLIE CHANGE
//   TOUT — plus de limite de caracteres, plus de quota, et un lecteur qui
//   a deja dit oui. C est la que le vrai message se place.
//
// 🚨 AVEC NOTE OU SANS NOTE — LA DISTINCTION EST LA RAISON D ETRE DE CET
// ECRAN. LinkedIn plafonne les notes personnalisees a quelques-unes par
// mois en compte gratuit ; la plupart des invitations partiront donc nues.
// Marquer les deux separement est la SEULE facon de savoir si l abonnement
// Premium se justifie : si les invitations avec note sont acceptees deux
// fois plus, il vaut son prix ; sinon non.
//
// 🚨 DEFAUT CORRIGE LE 16/08 : le bouton faisait DEUX choses d un clic —
// ouvrir le profil ET marquer la fiche. Or on ne sait qu APRES avoir vu le
// profil si on veut inviter. Cinq fiches perdues en une matinee. Desormais
// ouvrir ne marque rien : regarder n a jamais de consequence.

const BASES = [
  { cle: "organismes", nom: "Organismes certifiés Qualiopi" },
  { cle: "qualiopi", nom: "Organismes NON certifiés" },
  { cle: "interim", nom: "Agences d'intérim" },
];

// 🚨 DEUX CENTS CARACTERES, PAS TROIS CENTS. LinkedIn n accorde 300
// caracteres QU AUX COMPTES PREMIUM. Au-dela de 200 en compte gratuit, le
// bouton « Ajouter une note » disparait et il ne reste que « Envoyer sans
// note » — ce qui BRULE LA FICHE POUR TROIS SEMAINES si on ne voulait pas.
const LIMITE_NOTE = 200;

function motInvitation(prenom: string) {
  const p = String(prenom || "").trim();
  const civilite = p ? "Bonjour " + p : "Bonjour";
  return civilite + ", j'ai dirigé un organisme de formation certifié, et c'est l'administratif "
    + "qui m'a coûté le plus de temps. J'en ai fait un outil qui le prend en charge. "
    + "Ravi d'échanger avec vous.";
}

// LE MESSAGE APRES ACCEPTATION. Il peut enfin dire ce que la note ne
// pouvait pas. Pas de promesse de resultat, pas de chiffre invente, pas de
// temoignage — les memes regles que partout ailleurs.
function messageRelance(prenom: string, societe: string) {
  const p = String(prenom || "").trim();
  const s = String(societe || "").trim();
  return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
    + "Merci d'avoir accepté ma demande.\n\n"
    + "Je vous écris parce que j'ai dirigé un organisme de formation certifié Qualiopi pendant "
    + "quelques années. Ce qui m'a coûté le plus de temps n'a jamais été de former : c'était le "
    + "bilan pédagogique et financier, les preuves à réunir avant l'audit, et le suivi "
    + "administratif des stagiaires.\n\n"
    + "J'en ai fait une plateforme qui prend tout cela en charge — évaluations à chaud et à "
    + "froid, registre des réclamations, dossiers des formateurs, bilan prérempli cadre par "
    + "cadre. S'y ajoute un catalogue de plus de trois cents formations que vous pouvez vendre "
    + "sous votre propre marque, ce qu'aucun logiciel du marché ne propose.\n\n"
    + "Je ne cherche pas à vous vendre quoi que ce soit aujourd'hui. Je serais surtout curieux "
    + "de savoir ce qui vous prend le plus de temps"
    + (s ? " chez " + s : "") + " sur la partie administrative — c'est ce qui me dit si l'outil "
    + "répond à un vrai besoin ou pas.\n\n"
    + "Bien à vous,\nJacques Lalou\nacademiapro.fr";
}

export default function PageLinkedin() {
  const [onglet, setOnglet] = useState("inviter");
  const [base, setBase] = useState("organismes");

  const [fiche, setFiche] = useState<any>(null);
  const [restant, setRestant] = useState(0);
  const [epuise, setEpuise] = useState(false);
  const [texte, setTexte] = useState("");
  const [vu, setVu] = useState(false);

  const [lignes, setLignes] = useState<any[]>([]);
  const [ouverte, setOuverte] = useState<any>(null);
  const [texteLong, setTexteLong] = useState("");

  const [compteurs, setCompteurs] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState("");

  useEffect(() => {
    if (onglet === "inviter") chargerSuivante();
    else chargerListe();
  }, [onglet, base]);

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
    setTexte(d.fiche ? motInvitation(d.fiche.dirigeant_prenom) : "");
    setCopie("");
    setVu(false);
  }

  async function chargerSuivante() {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ action: "suivante", base: base });
      if (d.ok) { poser(d); setCompteurs(d.compteurs || null); }
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function chargerListe() {
    setCharge(true);
    setErreur("");
    setOuverte(null);
    try {
      const action = onglet === "attente" ? "en_attente" : "a_relancer";
      const d = await appeler({ action: action });
      if (d.ok) {
        setLignes(d.lignes || []);
        setCompteurs(d.compteurs || null);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  // OUVRIR UN PROFIL — ET RIEN D AUTRE.
  function ouvrirProfil(l: any) {
    try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { }
    setVu(true);
  }

  async function marquer(l: any, statut: string, cleBase?: string) {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ base: cleBase || l.base || base, id: l.id, statut: statut });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        if (onglet === "inviter") poser(d);
        else await chargerListe();
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  function copier(t: string, cle: string) {
    try {
      navigator.clipboard.writeText(t);
      setCopie(cle);
      setTimeout(() => setCopie(""), 2500);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
  }

  function lien(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(d: any) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function joursDepuis(d: any) {
    if (!d) return null;
    try { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); } catch (e) { return null; }
  }

  // Ce qui a ete envoye a cette personne — la trace est dans le statut.
  function avecNote(l: any) {
    return l.linkedin_statut === "invite" || l.linkedin_statut === "accepte";
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";

  const CARTE: any = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "20px 22px",
    marginBottom: "14px",
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

  const CHAMP: any = {
    width: "100%", padding: "13px", borderRadius: "9px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)", color: "#fff",
    fontSize: "14.5px", lineHeight: "1.75", fontFamily: "Georgia,serif",
    boxSizing: "border-box", resize: "vertical",
  };

  const plafondJour = compteurs ? (compteurs.reste_jour || 0) <= 0 : false;
  const plafondSemaine = compteurs ? (compteurs.reste_semaine || 0) <= 0 : false;
  const bloque = plafondJour || plafondSemaine;
  const trop = texte.length > LIMITE_NOTE;

  const ONGLETS = [
    { id: "inviter", nom: "Inviter" },
    { id: "attente", nom: "Mes invitations" + (compteurs && compteurs.en_attente ? " · " + compteurs.en_attente : "") },
    { id: "relancer", nom: "À relancer" + (compteurs && compteurs.acceptes ? " · " + compteurs.acceptes : "") },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "26px 20px" }}>
        <a href="/admin/crm" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour au CRM
        </a>
        <h1 style={{ color: OR, margin: "13px 0 4px", fontSize: "23px" }}>Prospection LinkedIn</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "13px" }}>
          Inviter · suivre les réponses · écrire à ceux qui ont accepté
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", padding: "14px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {ONGLETS.map(function (o) {
          const actif = onglet === o.id;
          return (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{
                padding: "9px 17px", borderRadius: "8px", border: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: "13.5px", fontFamily: "Georgia,serif",
                background: actif ? OR : "rgba(255,255,255,0.08)",
                color: actif ? "#050508" : "#fff",
                fontWeight: actif ? "bold" : "normal",
              }}>
              {o.nom}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "22px 20px", maxWidth: "800px", margin: "0 auto" }}>

        {/* ---------- LES COMPTEURS ---------- */}
        {compteurs && (
          <div style={{ ...CARTE, borderColor: bloque ? "rgba(232,131,106,0.5)" : "rgba(68,138,255,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <div style={{ color: plafondJour ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.jour)} / {compteurs.plafond_jour}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>aujourd'hui</div>
              </div>
              <div>
                <div style={{ color: plafondSemaine ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.semaine)} / {compteurs.plafond_semaine}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>cette semaine</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.en_attente)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>sans réponse</div>
              </div>
              <div>
                <div style={{ color: VERT, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.acceptes)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>acceptées</div>
              </div>
              <div>
                <div style={{ color: OR, fontSize: "19px", fontWeight: "bold" }}>
                  {compteurs.taux_global === null ? "—" : compteurs.taux_global + " %"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>taux d'acceptation</div>
              </div>
            </div>

            {/* AVEC NOTE CONTRE SANS NOTE — la comparaison qui decide de Premium */}
            {(compteurs.accepte_note > 0 || compteurs.accepte_nu > 0 || compteurs.attente_note > 0 || compteurs.attente_nu > 0) && (
              <div style={{ marginTop: "14px", paddingTop: "13px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "22px", flexWrap: "wrap" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12.5px", lineHeight: "1.7" }}>
                  <strong style={{ color: OR }}>Avec note</strong> — {nombre(compteurs.attente_note)} en attente,
                  {" " + nombre(compteurs.accepte_note)} acceptée(s)
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12.5px", lineHeight: "1.7" }}>
                  <strong style={{ color: "rgba(255,255,255,0.75)" }}>Sans note</strong> — {nombre(compteurs.attente_nu)} en attente,
                  {" " + nombre(compteurs.accepte_nu)} acceptée(s)
                </div>
              </div>
            )}

            {bloque && (
              <p style={{ color: "#e8836a", fontSize: "13px", lineHeight: "1.7", margin: "13px 0 0" }}>
                {plafondJour
                  ? "Plafond du jour atteint (" + compteurs.plafond_jour + "). Reprenez demain — dépasser ce rythme est ce qui fait restreindre un compte."
                  : "Plafond de la semaine atteint (" + compteurs.plafond_semaine + "). Laissez passer quelques jours."}
              </p>
            )}
          </div>
        )}

        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "14px", color: "#e8836a", fontSize: "13.5px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {/* ═══════════ ONGLET INVITER ═══════════ */}
        {onglet === "inviter" && (
          <>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {BASES.map(function (b) {
                const actif = base === b.cle;
                return (
                  <button key={b.cle} onClick={() => setBase(b.cle)}
                    style={{
                      ...BOUTON, borderRadius: "20px", padding: "8px 16px", fontSize: "13px",
                      background: actif ? OR : "rgba(255,255,255,0.06)",
                      color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                      border: actif ? "none" : BOUTON.border,
                      fontWeight: actif ? "bold" : "normal",
                    }}>
                    {b.nom}
                  </button>
                );
              })}
            </div>

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
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: "19px", fontWeight: "bold", marginBottom: "4px" }}>
                        {(fiche.dirigeant_prenom || "") + " " + (fiche.dirigeant_nom || "")}
                      </div>
                      <div style={{ color: OR, fontSize: "15px", marginBottom: "9px" }}>
                        {fiche.raison_sociale || "—"}
                      </div>
                    </div>
                    <div style={{ color: OR, fontSize: "13px" }}>{nombre(restant)} restantes</div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8" }}>
                    {fiche.ville || "ville inconnue"}
                    {fiche.code_postal ? " · " + fiche.code_postal : ""}
                    {fiche.siren ? " · SIREN " + fiche.siren : ""}
                  </div>
                  {fiche.site_web && (
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", wordBreak: "break-all", marginTop: "3px" }}>
                      {fiche.site_web}
                    </div>
                  )}
                  {(fiche.email || fiche.telephone) && (
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", marginTop: "3px", wordBreak: "break-all" }}>
                      {fiche.email ? "✉️ " + fiche.email : ""}
                      {fiche.email && fiche.telephone ? " · " : ""}
                      {fiche.telephone ? "☎️ " + fiche.telephone : ""}
                    </div>
                  )}
                </div>

                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>1. SI VOUS METTEZ UNE NOTE, COPIEZ-LA</span>
                    <span style={{ color: trop ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                      {texte.length} / {LIMITE_NOTE}
                    </span>
                  </div>
                  <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={5}
                    style={{ ...CHAMP, borderColor: trop ? "rgba(232,131,106,0.6)" : "rgba(200,169,110,0.3)" }} />
                  {trop && (
                    <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                      Au-delà de {LIMITE_NOTE} caractères, LinkedIn retire le bouton « Ajouter une note » en compte gratuit.
                    </p>
                  )}
                  <button onClick={() => copier(texte, "note")} disabled={trop}
                    style={{ ...BOUTON, width: "100%", marginTop: "12px", opacity: trop ? 0.4 : 1, background: copie === "note" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "note" ? VERT : OR, borderColor: copie === "note" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                    {copie === "note" ? "✓ Copié" : "Copier le mot"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "10px 0 0" }}>
                    Les notes personnalisées sont plafonnées à quelques-unes par mois en compte
                    gratuit. Sans note, l'invitation part quand même — et le vrai message vient
                    après l'acceptation.
                  </p>
                </div>

                <div style={CARTE}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    2. OUVREZ LE PROFIL ET INVITEZ SUR LINKEDIN
                  </p>
                  <button onClick={() => ouvrirProfil(fiche)}
                    style={{ width: "100%", background: vu ? "rgba(255,255,255,0.06)" : BLEU, color: vu ? "rgba(255,255,255,0.6)" : "#fff", border: vu ? "1px solid rgba(255,255,255,0.2)" : "none", borderRadius: "9px", padding: "15px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                    {vu ? "Rouvrir le profil" : "Ouvrir le profil LinkedIn"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    Ce bouton n'enregistre rien — vous pouvez regarder et revenir sans conséquence.
                    Sur LinkedIn : <strong>⋯</strong> puis <strong>Se connecter</strong>.
                  </p>
                </div>

                <div style={{ ...CARTE, borderColor: vu ? "rgba(0,230,118,0.35)" : "rgba(200,169,110,0.2)" }}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    3. DE RETOUR ICI — QU'AVEZ-VOUS ENVOYÉ ?
                  </p>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "9px" }}>
                    <button onClick={() => marquer(fiche, "invite", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée avec la note
                    </button>
                    <button onClick={() => marquer(fiche, "invite_nu", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée sans note
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                    <button onClick={() => marquer(fiche, "ecarte", base)} disabled={charge}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.18)" }}>
                      Écarter
                    </button>
                    <button onClick={chargerSuivante} disabled={charge}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>
                      Passer
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    Distinguer les deux est ce qui vous dira, dans quelques semaines, si la note
                    change vraiment le taux d'acceptation — et donc si Premium vaut son prix.
                    <strong> Écarter</strong> retire la fiche définitivement, <strong>Passer</strong> ne
                    touche à rien.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ ONGLET MES INVITATIONS ═══════════ */}
        {onglet === "attente" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Les invitations parties, en attente de réponse. Quand LinkedIn vous notifie une
              acceptation, marquez-la ici : la fiche passera dans « À relancer », où le message
              long devient possible.
            </p>

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Aucune invitation en attente. Elles apparaîtront ici dès que vous en aurez envoyé.
                </p>
              </div>
            ) : (
              lignes.map(function (l) {
                const j = joursDepuis(l.linkedin_le);
                const note = avecNote(l);
                return (
                  <div key={l.base + "-" + l.id} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {l.raison_sociale || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {jolieDate(l.linkedin_le)}
                          {j !== null ? " · il y a " + j + " jour" + (j > 1 ? "s" : "") : ""}
                          <span style={{ color: note ? OR : "rgba(255,255,255,0.3)" }}>
                            {note ? " · avec note" : " · sans note"}
                          </span>
                        </div>
                      </div>
                      <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                        style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                        Voir le profil
                      </a>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <button onClick={() => marquer(l, note ? "accepte" : "accepte_nu")} disabled={charge}
                        style={{ flex: "1 1 150px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                        ✓ A accepté
                      </button>
                      <button onClick={() => marquer(l, "refuse")} disabled={charge}
                        style={{ ...BOUTON, flex: "1 1 150px", padding: "11px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                        Sans suite
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ONGLET À RELANCER ═══════════ */}
        {onglet === "relancer" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Ces personnes ont accepté votre invitation. La messagerie est maintenant libre :
              aucune limite de caractères, aucun quota. C'est ici que le vrai message se place.
            </p>

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Personne à relancer pour l'instant. Marquez vos acceptations dans
                  « Mes invitations » et elles arriveront ici.
                </p>
              </div>
            ) : (
              lignes.map(function (l) {
                const active = ouverte === l.base + "-" + l.id;
                return (
                  <div key={l.base + "-" + l.id} style={{ ...CARTE, borderColor: active ? "rgba(0,230,118,0.4)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {l.raison_sociale || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {l.ville || ""}{l.ville && l.site_web ? " · " : ""}{l.site_web || ""}
                        </div>
                      </div>
                      <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                        style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                        Ouvrir la messagerie
                      </a>
                    </div>

                    {!active ? (
                      <button
                        onClick={() => { setOuverte(l.base + "-" + l.id); setTexteLong(messageRelance(l.dirigeant_prenom, l.raison_sociale)); }}
                        style={{ ...BOUTON, width: "100%", marginTop: "12px" }}>
                        Préparer le message
                      </button>
                    ) : (
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
                          <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>VOTRE MESSAGE</span>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                            {texteLong.length} caractères · aucune limite
                          </span>
                        </div>
                        <textarea value={texteLong} onChange={(e) => setTexteLong(e.target.value)} rows={14} style={CHAMP} />

                        <button onClick={() => copier(texteLong, "long")}
                          style={{ ...BOUTON, width: "100%", marginTop: "11px", background: copie === "long" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "long" ? VERT : OR, borderColor: copie === "long" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                          {copie === "long" ? "✓ Copié — collez-le dans la messagerie" : "Copier le message"}
                        </button>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "9px" }}>
                          <button onClick={() => marquer(l, "relance")} disabled={charge}
                            style={{ flex: "2 1 200px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "13px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                            ✓ Message envoyé
                          </button>
                          <button onClick={() => setOuverte(null)}
                            style={{ ...BOUTON, flex: "1 1 110px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

      </div>
    </div>
  );
}
