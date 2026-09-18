"use client";

// ═══════════════════════════════════════════════════════════════════════
// L ECRAN DSN — 16/09/2026, complete le 18/09/2026
//
// Un mois, une societe, une declaration. L ecran dit ou en est chaque mois
// et ce qu il reste a faire.
//
// 🚨 LE PARCOURS EST VOLONTAIREMENT CONTRAIGNANT :
//   brouillon → controlee (dsn-val) → deposee → acceptee | rejetee
// ⛔ ON NE PEUT PAS MARQUER « DEPOSEE » UNE DECLARATION QUI N A PAS ETE
// CONTROLEE. Deposer sans passer par dsn-val, c est se garantir un rejet —
// et le rejet arrive apres la date limite, donc avec une penalite.
//
// ⚠️ LE CONTROLE dsn-val EST MANUEL : l outil officiel se telecharge et
// tourne sur le poste. La plateforme ne peut que demander confirmation
// qu il a ete passe, et le consigner.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — « AUCUN BULLETIN » NE SE DIT PLUS SANS SE JUSTIFIER
//
// Au premier essai, l ecran annoncait « 0 mois avec des bulletins » alors
// que la base en portait trois, dont un emis. Aucun message, aucune piste :
// impossible de savoir si la reponse etait « il n y a rien » ou « je n ai
// pas pu lire ». Trois allers-retours ont ete perdus a cette seule
// question.
//
// ⚠️ UN ECRAN VIDE DOIT DIRE POURQUOI IL EST VIDE. Le compte de lecture
// rendu par la route s affiche desormais sous le message : combien de
// bulletins lus, combien d annules ecartes, combien de mois construits.
// Trois chiffres qui repondent en une seconde.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 18/09 — LE DEPOT SUR NET-ENTREPRISES, SANS QUITTER L ECRAN
//
// Deux ajouts, et rien d autre n a ete retire :
//
// 1. UN BLOC « ACCES NET-ENTREPRISES » PAR SOCIETE. Les quatre champs sont
//    ceux de l ecran de connexion de net-entreprises.fr : SIRET, nom,
//    prenom, mot de passe.
//    ⛔ LE MOT DE PASSE PART EN POST, JAMAIS DANS L ADRESSE : une adresse
//    finit dans les journaux de Vercel. Il est chiffre a l arrivee et ne
//    peut plus etre reaffiche — seulement remplace.
//
// 2. UN BOUTON « DEPOSER SUR NET-ENTREPRISES » sur chaque declaration
//    controlee. Le bouton « Marquer deposee » RESTE : il sert quand le
//    depot a ete fait a la main sur le site. Un bouton ne doit jamais etre
//    le seul chemin.
//
// 🚨 ESSAI OU REEL : L ECRAN NE DECIDE PAS, LE FICHIER DIT.
// La route lit la rubrique S10.G00.00.005 dans le fichier lui-meme. Si
// elle vaut « 02 » (envoi reel), la route refuse et le dit ; l ecran
// demande alors une confirmation explicite avant de recommencer. Ainsi on
// ne declare jamais pour de vrai en croyant faire un essai.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

const OR = "#c8a96e";
const VERT = "#7fc97f";
const ROUGE = "#e57373";
const BLEU = "#7fb3d5";
const FOND = "#0b0b10";
const CARTE = "rgba(255,255,255,0.04)";
const BORD = "1px solid rgba(255,255,255,0.10)";

const CADRE: any = {
  background: CARTE, border: BORD, borderRadius: "10px",
  padding: "18px", marginBottom: "16px",
};
const CHAMP: any = {
  width: "100%", padding: "9px 11px", borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.30)",
  color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};
const LIB: any = {
  display: "block", fontSize: "12px", color: "rgba(255,255,255,0.55)",
  marginBottom: "4px",
};
const BOUTON: any = {
  padding: "9px 16px", borderRadius: "7px", border: "none",
  background: OR, color: "#0b0b10", fontSize: "13.5px", fontWeight: "bold",
  fontFamily: "Georgia,serif", cursor: "pointer",
};
const SECOND: any = {
  ...BOUTON, background: "transparent", color: OR,
  border: "1px solid " + OR, fontWeight: "normal",
};

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function moisLisible(p: string): string {
  const x = String(p).split("-");
  return MOIS[Number(x[1]) - 1] + " " + x[0];
}

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🚨 LA DATE LIMITE DE DEPOT. Le 5 du mois suivant pour les entreprises de
// cinquante salaries et plus, le 15 pour les autres.
// ⚠️ C EST UNE DATE DE RECEPTION, PAS D ENVOI : un depot le 15 a 23 h 50 qui
// echoue est un depot en retard.
function dateLimite(periode: string, effectif: number): string {
  const x = String(periode).split("-");
  const m = Number(x[1]) + 1;
  const annee = m > 12 ? Number(x[0]) + 1 : Number(x[0]);
  const mois = m > 12 ? 1 : m;
  const jour = effectif >= 50 ? 5 : 15;
  return jour + " " + MOIS[mois - 1] + " " + annee;
}

// Une date rendue par la base, affichee simplement.
function quand(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function PageDsn() {
  const [secret, setSecret] = useState("");
  const [mois, setMois] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [contenu, setContenu] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState("");
  const [detail, setDetail] = useState<any>(null);
  // 🆕 CE QUE LA ROUTE A REELLEMENT LU.
  const [diag, setDiag] = useState<any>(null);

  // 🆕 18/09 — LES ACCES NET-ENTREPRISES.
  // `acces` : ce qui est enregistre, par societe. `saisie` : ce qui est en
  // cours de frappe. `ouvert` : quelle societe a son formulaire deplie.
  const [acces, setAcces] = useState<any>({});
  const [saisie, setSaisie] = useState<any>({});
  const [ouvert, setOuvert] = useState("");
  // 🚨 LE RETOUR DU DEPOT, GARDE PAR MOIS : l accuse ou l avis de rejet
  // s affiche sous la declaration concernee, pas en haut de page.
  const [retour, setRetour] = useState<any>({});

  useEffect(function () {
    const s = sessionStorage.getItem("paie_secret") || "";
    if (s) { setSecret(s); charger(s); }
  }, []);

  async function appeler(corps: any, s?: string): Promise<any> {
    const cle = s || secret;
    const r = await fetch("/api/dsn/dossier?secret=" + encodeURIComponent(cle), {
      method: "POST",
      // ⚠️ `no-store` COTE NAVIGATEUR AUSSI : la route porte deja ses
      // en-tetes, mais rien n empeche Safari de garder sa propre copie.
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  async function charger(s?: string) {
    setErr(""); setOccupe("charger");
    const d = await appeler({ action: "etat" }, s);
    if (d.success) {
      setMois(d.mois); setSocietes(d.societes);
      setDiag(d.diagnostic || null);
      if (s) sessionStorage.setItem("paie_secret", s);
      // 🆕 L etat des acces suit le chargement, pour toutes les societes
      // d un coup : sinon il faudrait un clic par societe pour savoir si
      // le depot en ligne est possible.
      chargerAcces(d.societes || [], s);
    } else {
      setErr((d.erreur || "chargement impossible")
        + (d.ou ? " (table : " + d.ou + ")" : ""));
    }
    setOccupe("");
  }

  // 🆕 18/09 — CE QUI EST ENREGISTRE, SANS RIEN REVELER.
  // La route ne rend jamais le mot de passe : seulement le SIRET, le nom du
  // declarant, et la date de la derniere verification reussie.
  async function chargerAcces(liste: any[], s?: string) {
    const cle = s || secret;
    const suite: any = {};
    for (let i = 0; i < liste.length; i++) {
      const soc = liste[i];
      try {
        const r = await fetch("/api/dsn/deposer?action=etat&v=" + Date.now()
          + "&societe=" + encodeURIComponent(soc.id)
          + "&secret=" + encodeURIComponent(cle), { cache: "no-store" });
        suite[soc.id] = await r.json();
      } catch {
        // ⚠️ UN ECHEC DE LECTURE N EMPECHE PAS L ECRAN DE S AFFICHER : la
        // DSN se genere et se telecharge meme sans acces enregistres.
        suite[soc.id] = { enregistre: false, indisponible: true };
      }
    }
    setAcces(suite);
  }

  // 🆕 18/09 — ENREGISTRER LES IDENTIFIANTS.
  // ⛔ EN POST : le mot de passe ne doit jamais passer par l adresse.
  async function enregistrerAcces(soc: any) {
    const f = saisie[soc.id] || {};
    setErr(""); setMsg(""); setOccupe("acces" + soc.id);

    const r = await fetch("/api/dsn/deposer?secret=" + encodeURIComponent(secret), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enregistrer",
        societe_id: soc.id,
        siret_declarant: (f.siret || soc.siret || "").replace(/\s/g, ""),
        nom_declarant: f.nom || "",
        prenom_declarant: f.prenom || "",
        mot_de_passe: f.motdepasse || "",
      }),
    });
    const d = await r.json();

    if (d.success) {
      setMsg(d.message);
      // 🚨 LE MOT DE PASSE EST EFFACE DE L ECRAN DES QU IL EST PARTI.
      setSaisie({ ...saisie, [soc.id]: { ...f, motdepasse: "" } });
      await chargerAcces(societes);
      // Enchainement naturel : on vient de le saisir, on l eprouve.
      await testerAcces(soc, true);
    } else {
      setErr(d.erreur || "enregistrement impossible");
    }
    setOccupe("");
  }

  // 🆕 18/09 — EPROUVER LES ACCES : une authentification, aucun depot.
  async function testerAcces(soc: any, silencieux?: boolean) {
    if (!silencieux) { setErr(""); setMsg(""); }
    setOccupe("tester" + soc.id);

    const r = await fetch("/api/dsn/deposer?action=tester&v=" + Date.now()
      + "&societe=" + encodeURIComponent(soc.id)
      + "&secret=" + encodeURIComponent(secret), { cache: "no-store" });
    const d = await r.json();

    if (d.success) setMsg("Accès vérifiés : net-entreprises a accepté la connexion.");
    else setErr(d.erreur || d.lecture || "vérification impossible");

    await chargerAcces(societes);
    setOccupe("");
  }

  // 🆕🚨 18/09 — LE DEPOT.
  //
  // Premier appel SANS confirmation. Si le fichier est un envoi reel, la
  // route refuse et le dit : on demande alors une confirmation explicite
  // avant de recommencer avec `confirmer=reel`.
  // ⚠️ C EST LE FICHIER QUI TRANCHE, PAS L ECRAN : un fichier genere est une
  // photographie, et le mode enregistre en base a pu changer depuis.
  async function deposer(m: any, d: any) {
    setErr(""); setMsg(""); setOccupe("deposer" + d.id);

    async function envoyer(confirmer: boolean) {
      const r = await fetch("/api/dsn/deposer?action=deposer&v=" + Date.now()
        + "&declaration=" + encodeURIComponent(d.id)
        + (confirmer ? "&confirmer=reel" : "")
        + "&secret=" + encodeURIComponent(secret), { cache: "no-store" });
      const j = await r.json();
      // ⚠️ LE STATUT COMPTE AUTANT QUE LE CORPS : c est lui qui distingue un
      // refus d une panne.
      j.statut_http = r.status;
      return j;
    }

    let rep = await envoyer(false);

    // 🚨 LE REFUS « ENVOI REEL » EST LE SEUL QU ON RATTRAPE, et seulement
    // apres un accord explicite.
    //
    // ⛔ ON NE RECONNAIT PAS CE REFUS A UN MOT ACCENTUE DU MESSAGE : un
    // accent mal encode, et le garde-fou sauterait sans bruit — soit en
    // deposant pour de vrai sans demander, soit en bloquant un depot
    // legitime. On s appuie sur le code 409 et sur le nom du parametre
    // technique, qui ne porte ni accent ni majuscule.
    const refusReel = rep.statut_http === 409
      && String(rep.erreur || "").indexOf("confirmer=reel") >= 0;

    if (!rep.success && refusReel) {
      const accord = confirm(
        "CE FICHIER EST UN ENVOI RÉEL.\n\n"
        + moisLisible(m.periode) + " · " + m.societe + "\n\n"
        + "Il sera déclaré aux organismes et ne pourra pas être retiré. "
        + "Une correction passera par une nouvelle DSN en « annule et "
        + "remplace ».\n\nDéposer maintenant ?");
      if (!accord) {
        setErr("Dépôt annulé : le fichier est un envoi réel et n'a pas été confirmé.");
        setOccupe("");
        return;
      }
      rep = await envoyer(true);
    }

    setRetour({ ...retour, [d.id]: rep });
    if (rep.success) setMsg(rep.message || "Dépôt accepté.");
    else setErr(rep.erreur || rep.message || "dépôt impossible");

    await charger();
    setOccupe("");
  }

  async function generer(m: any) {
    setErr(""); setMsg(""); setOccupe("generer" + m.periode);
    const r = await fetch("/api/dsn/generer?secret=" + encodeURIComponent(secret), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ societe_id: m.societe_id, periode: m.periode }),
    });
    const d = await r.json();
    if (d.success) {
      setMsg(d.message);
      setDetail(d);
      await charger();
    } else setErr(d.erreur || "génération impossible");
    setOccupe("");
  }

  async function voir(id: string) {
    const d = await appeler({ action: "voir", id: id });
    if (d.success && d.url) window.open(d.url, "_blank");
    else setErr(d.erreur || "ouverture impossible");
  }

  async function lire(id: string) {
    setOccupe("lire");
    const d = await appeler({ action: "contenu", id: id });
    if (d.success) setContenu(d);
    else setErr(d.erreur || "lecture impossible");
    setOccupe("");
  }

  async function controlee(id: string) {
    // 🚨 C EST UNE DECLARATION SUR L HONNEUR : la plateforme n a aucun moyen
    // de verifier que dsn-val a tourne. On demande confirmation explicite.
    if (!confirm("Confirmez-vous que ce fichier est passé dans dsn-val "
      + "sans anomalie bloquante ?\n\n"
      + "L'outil officiel se télécharge sur net-entreprises.fr et tourne "
      + "sur votre poste. Déposer sans ce contrôle, c'est se garantir un "
      + "rejet — et le rejet arrive après la date limite.")) return;

    setOccupe("controlee");
    const d = await appeler({ action: "controlee", id: id });
    if (d.success) { setMsg(d.message); await charger(); }
    else setErr(d.erreur || "impossible");
    setOccupe("");
  }

  async function deposee(id: string) {
    if (!confirm("Marquer cette déclaration comme déposée ?\n\n"
      + "Elle ne pourra plus être modifiée. Une correction passera par une "
      + "nouvelle DSN du même mois, en « annule et remplace ».")) return;

    setOccupe("deposee");
    const d = await appeler({ action: "deposee", id: id });
    if (d.success) { setMsg(d.message); await charger(); }
    else setErr(d.erreur || "impossible");
    setOccupe("");
  }

  // ---- L ECRAN D ENTREE ----
  if (!secret) {
    return (
      <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
        fontFamily: "Georgia,serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: "420px", margin: "60px auto" }}>
          <h1 style={{ color: OR, fontSize: "24px", marginBottom: "6px" }}>
            Déclaration sociale nominative
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px",
            lineHeight: "1.6", marginBottom: "22px" }}>
            Un fichier par mois et par établissement.
          </p>
          <div style={CADRE}>
            <span style={LIB}>Clé d&apos;accès</span>
            <input type="password" value={secret} style={CHAMP}
              onChange={(ev) => setSecret(ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") charger(secret); }} />
            <button onClick={() => charger(secret)} disabled={!secret}
              style={{ ...BOUTON, marginTop: "12px", width: "100%",
                opacity: secret ? 1 : 0.4 }}>
              Ouvrir
            </button>
          </div>
          {err && <p style={{ color: ROUGE, fontSize: "13px" }}>{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia,serif", padding: "30px 20px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <h1 style={{ color: OR, fontSize: "26px", marginBottom: "4px" }}>
          Déclaration sociale nominative
        </h1>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px",
          flexWrap: "wrap", marginBottom: "10px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
            {mois.length} mois avec des bulletins
          </p>
          {/* ⚠️ RECHARGER SANS QUITTER L ECRAN : un bulletin emis dans
              l autre onglet ne se voit pas tout seul. */}
          <button onClick={() => charger()} disabled={occupe !== ""}
            style={{ background: "none", border: "none", color: OR,
              cursor: "pointer", fontSize: "12.5px", padding: 0 }}>
            {occupe === "charger" ? "…" : "recharger"}
          </button>
        </div>

        {/* 🚨 LE RAPPEL QUI EVITE LA PENALITE. */}
        <div style={{ ...CADRE, borderLeft: "3px solid " + OR }}>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.65",
            color: "rgba(255,255,255,0.7)" }}>
            La DSN se dépose <strong>le 5 du mois suivant</strong> pour les
            entreprises de 50 salariés et plus, <strong>le 15</strong> pour
            les autres. C&apos;est une date de réception, pas d&apos;envoi.
            <br />
            Avant tout dépôt, le fichier doit passer dans <strong>dsn-val</strong>,
            l&apos;outil officiel de contrôle — il se télécharge sur
            net-entreprises.fr.
          </p>
        </div>

        {msg && <p style={{ color: VERT, fontSize: "14px", marginBottom: "12px" }}>{msg}</p>}
        {err && <p style={{ color: ROUGE, fontSize: "14px", marginBottom: "12px" }}>{err}</p>}

        {/* ═══════════════════════════════════════════════════════════════
            🆕 18/09 — LES ACCES NET-ENTREPRISES

            Les quatre champs sont ceux de l ecran de connexion de
            net-entreprises.fr. Ce sont les identifiants DU DECLARANT, pas
            ceux de l editeur : AcadeMIA Pro LLC n a pas de SIRET et ne peut
            donc pas etre concentrateur.

            ⛔ LE MOT DE PASSE NE SE REAFFICHE JAMAIS. Il est chiffre a
            l arrivee ; on ne peut que le remplacer.
            ═══════════════════════════════════════════════════════════════ */}
        {societes.filter(function (s: any) { return !!s.siret; }).length > 0 && (
          <div style={CADRE}>
            <h3 style={{ color: OR, fontSize: "15px", margin: "0 0 4px" }}>
              Accès à net-entreprises
            </h3>
            <p style={{ fontSize: "12.5px", lineHeight: "1.6", margin: "0 0 14px",
              color: "rgba(255,255,255,0.5)" }}>
              Les identifiants de connexion du déclarant, ceux de
              net-entreprises.fr. Ils permettent de déposer la DSN sans
              quitter cet écran. Le mot de passe est chiffré : il ne
              s&apos;affichera plus, il pourra seulement être remplacé.
            </p>

            {societes.filter(function (s: any) { return !!s.siret; })
              .map(function (soc: any) {
                const a = acces[soc.id] || {};
                const f = saisie[soc.id] || {};
                const deplie = ouvert === soc.id;

                return (
                  <div key={soc.id} style={{ paddingTop: "12px", marginTop: "12px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "14.5px" }}>
                          {soc.raison_sociale || soc.nom || soc.siret}
                        </strong>
                        <span style={{ fontSize: "12px", marginLeft: "10px",
                          color: a.enregistre
                            ? (a.derniere_verification_reussie ? VERT : OR)
                            : "rgba(255,255,255,0.45)" }}>
                          {!a.enregistre ? "aucun accès enregistré"
                            : a.derniere_verification_reussie
                              ? "vérifié le " + quand(a.derniere_verification_reussie)
                              : "enregistré, jamais vérifié"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {a.enregistre && (
                          <button onClick={() => testerAcces(soc)} disabled={occupe !== ""}
                            style={{ ...SECOND, color: BLEU, borderColor: BLEU,
                              padding: "6px 12px", fontSize: "12.5px" }}>
                            {occupe === "tester" + soc.id ? "…" : "Tester mes accès"}
                          </button>
                        )}
                        <button onClick={() => setOuvert(deplie ? "" : soc.id)}
                          style={{ ...SECOND, padding: "6px 12px", fontSize: "12.5px" }}>
                          {deplie ? "annuler" : a.enregistre ? "remplacer" : "enregistrer"}
                        </button>
                      </div>
                    </div>

                    {/* 🚨 LE DERNIER ECHEC EST AFFICHE : sans lui, on ne sait
                        pas s il faut changer le mot de passe, debloquer le
                        compte ou attendre l inscription. */}
                    {a.enregistre && a.dernier_echec && (
                      <p style={{ margin: "8px 0 0", fontSize: "12px", color: ROUGE,
                        lineHeight: "1.55" }}>
                        {a.dernier_echec}
                      </p>
                    )}

                    {deplie && (
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 160px" }}>
                            <span style={LIB}>SIRET du déclarant</span>
                            <input style={CHAMP} inputMode="numeric"
                              value={f.siret !== undefined ? f.siret : (soc.siret || "")}
                              onChange={(ev) => setSaisie({ ...saisie,
                                [soc.id]: { ...f, siret: ev.target.value } })} />
                          </div>
                          <div style={{ flex: "1 1 120px" }}>
                            <span style={LIB}>Nom</span>
                            <input style={CHAMP} value={f.nom || ""}
                              onChange={(ev) => setSaisie({ ...saisie,
                                [soc.id]: { ...f, nom: ev.target.value } })} />
                          </div>
                          <div style={{ flex: "1 1 120px" }}>
                            <span style={LIB}>Prénom</span>
                            <input style={CHAMP} value={f.prenom || ""}
                              onChange={(ev) => setSaisie({ ...saisie,
                                [soc.id]: { ...f, prenom: ev.target.value } })} />
                          </div>
                          <div style={{ flex: "1 1 160px" }}>
                            <span style={LIB}>Mot de passe</span>
                            <input style={CHAMP} type="password"
                              autoComplete="new-password"
                              value={f.motdepasse || ""}
                              onChange={(ev) => setSaisie({ ...saisie,
                                [soc.id]: { ...f, motdepasse: ev.target.value } })} />
                          </div>
                        </div>

                        <p style={{ margin: "10px 0 0", fontSize: "11.5px",
                          lineHeight: "1.6", color: "rgba(255,255,255,0.42)" }}>
                          Le nom et le prénom sont ceux du compte net-entreprises,
                          pas ceux du dirigeant s&apos;ils diffèrent. Le SIRET est
                          celui qui sert à se connecter.
                        </p>

                        <button
                          onClick={() => enregistrerAcces(soc)}
                          disabled={occupe !== "" || !(f.motdepasse || "")}
                          style={{ ...BOUTON, marginTop: "12px",
                            opacity: (f.motdepasse || "") ? 1 : 0.4 }}>
                          {occupe === "acces" + soc.id ? "…" : "Enregistrer et vérifier"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ---- LE COMPTE RENDU DE LA DERNIERE GENERATION ---- */}
        {detail && (
          <div style={{ ...CADRE, borderLeft: "3px solid " + BLEU }}>
            <h3 style={{ color: BLEU, fontSize: "15px", marginTop: 0 }}>
              {detail.fichier}
            </h3>
            <p style={{ fontSize: "13px", margin: "0 0 8px",
              color: "rgba(255,255,255,0.7)" }}>
              {detail.nb_individus} salarié(s) · {detail.nb_lignes} lignes ·
              brut {euros(detail.total_brut)} € ·
              cotisations {euros(detail.total_cotisations)} €
              {detail.type === "annule et remplace" && (
                <span style={{ color: OR }}> · annule et remplace</span>
              )}
            </p>

            {(detail.anomalies || []).length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", color: ROUGE, margin: "0 0 5px" }}>
                  {detail.anomalies.length} anomalie(s) à corriger
                </p>
                {detail.anomalies.map(function (a: string, i: number) {
                  return (
                    <p key={i} style={{ fontSize: "12px", lineHeight: "1.55",
                      color: "rgba(255,255,255,0.6)", margin: "0 0 3px" }}>
                      {a}
                    </p>
                  );
                })}
              </div>
            )}

            {/* 🚨 CE QUI RESTE AVANT UN DEPOT REEL, TOUJOURS AFFICHE. */}
            {(detail.avant_depot || []).length > 0 && (
              <div style={{ marginTop: "12px", paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: "12px", color: OR, margin: "0 0 5px" }}>
                  Avant tout dépôt réel
                </p>
                {detail.avant_depot.map(function (a: string, i: number) {
                  return (
                    <p key={i} style={{ fontSize: "11.5px", lineHeight: "1.6",
                      color: "rgba(255,255,255,0.45)", margin: "0 0 3px" }}>
                      {a}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- LE CONTENU DU FICHIER ---- */}
        {contenu && (
          <div style={CADRE}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ color: OR, fontSize: "15px", margin: 0 }}>
                Le fichier, ligne par ligne · {contenu.nb_lignes} lignes
              </h3>
              <button onClick={() => setContenu(null)}
                style={{ background: "none", border: "none", color: OR,
                  cursor: "pointer", fontSize: "12.5px" }}>
                fermer
              </button>
            </div>
            <pre style={{ fontSize: "11px", lineHeight: "1.5",
              color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.35)",
              padding: "12px", borderRadius: "6px", overflow: "auto",
              maxHeight: "400px", fontFamily: "Menlo,monospace", margin: 0 }}>
              {contenu.contenu}
            </pre>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ---- QUAND IL N Y A RIEN, DIRE POURQUOI ----

            🚨 « Aucun bulletin » peut vouloir dire deux choses opposees :
            il n y en a vraiment pas, ou la lecture n a rien rendu. Les
            trois chiffres ci-dessous tranchent sans qu il faille ouvrir la
            base.
            ⚠️ SI `bulletins_lus` EST A ZERO alors que la base en porte, le
            defaut est dans la lecture — pas dans les donnees.
            ═══════════════════════════════════════════════════════════════ */}
        {mois.length === 0 && !occupe && (
          <div style={CADRE}>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)",
              margin: "0 0 10px", lineHeight: "1.6" }}>
              Aucun mois à déclarer. La DSN se construit à partir des
              bulletins <strong>émis</strong> — un brouillon n&apos;a pas été
              remis au salarié, et un bulletin annulé ne compte plus.
            </p>
            {diag && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)",
                margin: 0, lineHeight: "1.7" }}>
                Ce que la lecture a rendu : <strong>{diag.bulletins_lus}</strong> bulletin(s)
                lu(s), dont <strong>{diag.annules_ignores}</strong> annulé(s) écarté(s) ·
                <strong> {diag.societes_lues}</strong> société(s) ·
                <strong> {diag.declarations_lues}</strong> déclaration(s) ·
                <strong> {diag.mois_construits}</strong> mois construit(s).
              </p>
            )}
            {!diag && (
              <p style={{ fontSize: "12px", color: ROUGE, margin: 0 }}>
                La route n&apos;a rendu aucun compte de lecture : elle n&apos;est
                pas à jour.
              </p>
            )}
          </div>
        )}

        {/* ---- LES MOIS ---- */}
        {mois.map(function (m: any) {
          const d = m.declaration;
          const soc = societes.filter(function (s: any) {
            return s.id === m.societe_id;
          })[0];
          const eff = soc && soc.effectif ? Number(soc.effectif) : 0;
          // 🆕 LE DEPOT EN LIGNE N EST POSSIBLE QUE SI DES ACCES EXISTENT.
          const a = acces[m.societe_id] || {};
          const rep = d ? retour[d.id] : null;

          return (
            <div key={m.societe_id + m.periode} style={CADRE}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "16px" }}>{moisLisible(m.periode)}</strong>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                    marginLeft: "10px" }}>
                    {m.societe}
                  </span>
                </div>
                {d && (
                  <span style={{ fontSize: "12px",
                    color: d.statut === "deposee" || d.statut === "acceptee" ? VERT
                      : d.statut === "rejetee" ? ROUGE : OR }}>
                    {d.statut === "brouillon" ? "brouillon"
                      : d.statut === "controlee" ? "contrôlée dans dsn-val"
                      : d.statut === "deposee" ? "déposée"
                      : d.statut === "acceptee" ? "acceptée"
                      : "rejetée"}
                    {Number(d.numero_ordre) > 1 && " · dépôt n°" + d.numero_ordre}
                  </span>
                )}
              </div>

              <p style={{ margin: "6px 0 0", fontSize: "12.5px",
                color: "rgba(255,255,255,0.5)" }}>
                {m.bulletins} bulletin(s) · {m.emis} émis
                {m.brouillons > 0 && (
                  <span style={{ color: OR }}> · {m.brouillons} en brouillon</span>
                )}
                {" · "}brut {euros(m.brut)} €
                {" · "}à déposer avant le {dateLimite(m.periode, eff)}
              </p>

              {/* 🚨 SANS SIRET, AUCUNE DSN N EST POSSIBLE : c est
                  l identifiant de l etablissement declarant. Autant le dire
                  avant le clic plutot qu apres. */}
              {!m.siret && (
                <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: ROUGE,
                  lineHeight: "1.6" }}>
                  Cette société n&apos;a pas de SIRET : la DSN ne peut pas être
                  générée. Une société étrangère ne peut pas être établissement
                  déclarant en France.
                </p>
              )}

              {/* ⛔ LA DSN NE PREND QUE LES BULLETINS EMIS. */}
              {m.emis === 0 && (
                <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: ROUGE }}>
                  Aucun bulletin émis : la DSN ne peut pas être générée. Un
                  brouillon n&apos;a pas été remis au salarié.
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px",
                marginTop: "12px" }}>
                {/* 🆕🚨 16/09 — UN ECRAN NE PROPOSE PAS CE QU IL VIENT
                    D INTERDIRE. Le bouton restait actif sous le message
                    « la DSN ne peut pas etre generee » : cliquer dessus
                    donnait un refus previsible, et un ecran qui interdit et
                    propose en meme temps ne veut plus rien dire. */}
                {m.siret && m.emis > 0 && (!d || d.statut === "brouillon") && (
                  <button onClick={() => generer(m)} disabled={occupe !== ""}
                    style={BOUTON}>
                    {occupe === "generer" + m.periode ? "…"
                      : d ? "Regénérer" : "Générer la DSN"}
                  </button>
                )}

                {m.siret && m.emis > 0 && d && (d.statut === "deposee" || d.statut === "acceptee") && (
                  <button onClick={() => generer(m)} disabled={occupe !== ""}
                    style={SECOND}>
                    Générer un annule et remplace
                  </button>
                )}

                {d && (
                  <>
                    <button onClick={() => lire(d.id)} style={SECOND}>
                      Lire le fichier
                    </button>
                    <button onClick={() => voir(d.id)} style={SECOND}>
                      Télécharger
                    </button>
                  </>
                )}

                {d && d.statut === "brouillon" && (
                  <button onClick={() => controlee(d.id)} disabled={occupe !== ""}
                    style={{ ...SECOND, color: BLEU, borderColor: BLEU }}>
                    Passé dans dsn-val
                  </button>
                )}

                {/* 🆕 18/09 — LE DEPOT EN LIGNE.
                    ⚠️ Il apparait APRES le controle dsn-val, comme le
                    marquage manuel : le parcours ne change pas, seul le
                    moyen s ajoute. */}
                {d && d.statut === "controlee" && a.enregistre && (
                  <button onClick={() => deposer(m, d)} disabled={occupe !== ""}
                    style={{ ...BOUTON, background: VERT }}>
                    {occupe === "deposer" + d.id ? "…" : "Déposer sur net-entreprises"}
                  </button>
                )}

                {/* 🚨 LE MARQUAGE A LA MAIN RESTE : il sert quand le depot a
                    ete fait directement sur le site. Un bouton ne doit
                    jamais etre le seul chemin. */}
                {d && d.statut === "controlee" && (
                  <button onClick={() => deposee(d.id)} disabled={occupe !== ""}
                    style={{ ...SECOND, color: VERT, borderColor: VERT }}>
                    Marquer déposée
                  </button>
                )}
              </div>

              {/* ⚠️ QUAND LE DEPOT EN LIGNE N EST PAS POSSIBLE, DIRE
                  POURQUOI plutot que de laisser un bouton absent sans
                  explication. */}
              {d && d.statut === "controlee" && !a.enregistre && (
                <p style={{ margin: "10px 0 0", fontSize: "12px",
                  color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>
                  Le dépôt en ligne demande les identifiants net-entreprises de
                  cette société : ils s&apos;enregistrent en haut de l&apos;écran.
                  Sans eux, le fichier se télécharge et se dépose à la main.
                </p>
              )}

              {/* 🆕 L ACCUSE, OU L AVIS DE REJET, SOUS LA DECLARATION
                  CONCERNEE — pas en haut de page. */}
              {rep && (
                <div style={{ marginTop: "12px", paddingTop: "10px",
                  borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: "12.5px", margin: "0 0 6px",
                    color: rep.success ? VERT : ROUGE }}>
                    {rep.success
                      ? "Accusé d'enregistrement reçu"
                      : "Dépôt non abouti"}
                    {rep.code_http ? " · HTTP " + rep.code_http : ""}
                    {rep.type_envoi ? " · envoi " + rep.type_envoi : ""}
                  </p>
                  {rep.retour_extrait && (
                    <pre style={{ fontSize: "10.5px", lineHeight: "1.5",
                      color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.35)",
                      padding: "10px", borderRadius: "6px", overflow: "auto",
                      maxHeight: "220px", fontFamily: "Menlo,monospace", margin: 0,
                      whiteSpace: "pre-wrap" }}>
                      {rep.retour_extrait}
                    </pre>
                  )}
                  <p style={{ margin: "6px 0 0", fontSize: "11px",
                    color: "rgba(255,255,255,0.40)" }}>
                    Le retour complet est conservé dans la base.
                  </p>
                </div>
              )}

              {d && d.notes && (
                <p style={{ margin: "10px 0 0", fontSize: "11.5px",
                  lineHeight: "1.55", color: ROUGE }}>
                  {d.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
