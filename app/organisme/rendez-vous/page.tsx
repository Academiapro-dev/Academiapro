"use client";

import { useEffect, useState } from "react";

// ══════════════════════════════════════════════════════════════════════════
// PRENDRE UN RENDEZ-VOUS — 14/09.
//
// L ecran s ouvre depuis la fiche d un prospect :
//   /organisme/rendez-vous?fiche=<id>&nom=<nom>
// et pose le rendez-vous dans l agenda Google du client, par
// /api/organisme/google/evenement.
//
// 🚨 L HEURE. Le champ « date et heure » du navigateur rend une valeur SANS
// fuseau (« 2026-09-15T10:00 »). Envoyee telle quelle, elle serait lue en
// UTC par le serveur : un rendez-vous de 10 h tomberait a 12 h dans
// l agenda. On la convertit donc ICI, dans le navigateur, ou l heure locale
// du client est connue — new Date(valeur).toISOString().
//
// 🚨 AUCUN INVITE SANS QUE CE SOIT DEMANDE. La case « prévenir le client »
// est decochee : la cocher envoie un courriel Google au prospect. Elle
// n apparait meme pas si la fiche n a pas d adresse.
//
// ⚠️ SI AUCUN AGENDA N EST CONNECTE, on le dit AVANT que le client remplisse
// quoi que ce soit, avec le lien pour le connecter — pas apres avoir perdu
// sa saisie.
// ══════════════════════════════════════════════════════════════════════════

type Etat = { connecte: boolean; compte: any } | null;

export default function RendezVousPage() {
  const [etat, setEtat] = useState<Etat>(null);
  const [chargement, setChargement] = useState(true);

  const [ficheId, setFicheId] = useState("");
  const [nomFiche, setNomFiche] = useState("");
  const [emailFiche, setEmailFiche] = useState("");

  const [titre, setTitre] = useState("");
  const [debut, setDebut] = useState("");
  const [duree, setDuree] = useState(30);
  const [lieu, setLieu] = useState("");
  const [notes, setNotes] = useState("");
  const [inviter, setInviter] = useState(false);

  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [lien, setLien] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    const p = new URLSearchParams(window.location.search);
    const f = p.get("fiche") || "";
    const n = p.get("nom") || "";
    const e = p.get("email") || "";
    setFicheId(f);
    setNomFiche(n);
    setEmailFiche(e);
    setTitre(n ? "Rendez-vous — " + n : "Rendez-vous");

    // Proposition d heure : demain, 10 h, heure du client.
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setDebut(
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0") + "T" +
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0")
    );

    (async function () {
      try {
        const r = await fetch("/api/organisme/google?etat=1", { cache: "no-store" });
        const j = await r.json();
        if (j.ok) setEtat({ connecte: !!j.connecte, compte: j.compte || null });
        else setErreur(j.erreur || "Lecture impossible pour le moment.");
      } catch {
        setErreur("Lecture impossible pour le moment.");
      }
      setChargement(false);
    })();
  }, []);

  async function poser() {
    setErreur("");
    setMessage("");
    setLien("");

    if (!titre.trim()) { setErreur("Donnez un titre au rendez-vous."); return; }
    if (!debut) { setErreur("Indiquez la date et l'heure."); return; }

    const d0 = new Date(debut);
    if (isNaN(d0.getTime())) { setErreur("Date illisible."); return; }
    if (d0.getTime() < Date.now() - 60000) {
      if (!confirm("Cette date est déjà passée. Poser quand même le rendez-vous ?")) return;
    }

    setEnvoi(true);
    try {
      const r = await fetch("/api/organisme/google/evenement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre.trim(),
          debut: d0.toISOString(),
          duree: duree,
          fiche_id: ficheId || undefined,
          lieu: lieu.trim() || undefined,
          notes: notes.trim() || undefined,
          inviter: inviter === true,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setMessage(j.message || "Rendez-vous ajouté à votre agenda.");
        setLien(j.lien || "");
      } else {
        setErreur(j.erreur || "Le rendez-vous n'a pas été posé.");
      }
    } catch {
      setErreur("Le rendez-vous n'a pas été posé.");
    }
    setEnvoi(false);
  }

  const cadre = {
    border: "1px solid #e2e2e2",
    borderRadius: 10,
    padding: 20,
    marginTop: 18,
    background: "#fff",
  } as const;

  const champ = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #c9c9c9",
    marginTop: 6,
    boxSizing: "border-box",
  } as const;

  const etiquette = { display: "block", marginTop: 16, fontWeight: 600, fontSize: 15 } as const;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Prendre un rendez-vous</h1>
      <p style={{ color: "#555", marginTop: 0, lineHeight: 1.5 }}>
        {nomFiche
          ? "Le rendez-vous sera posé dans votre agenda Google, avec les coordonnées de " + nomFiche + "."
          : "Le rendez-vous sera posé dans votre agenda Google."}
      </p>

      {message ? (
        <div style={{ background: "#eef7ee", border: "1px solid #bcd9bc", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
          {message}
          {lien ? (
            <>
              {" "}
              <a href={lien} target="_blank" rel="noreferrer" style={{ color: "#1a73e8" }}>
                Voir dans mon agenda →
              </a>
            </>
          ) : null}
        </div>
      ) : null}

      {erreur ? (
        <div style={{ background: "#fdecec", border: "1px solid #efb9b9", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
          {erreur}
        </div>
      ) : null}

      {chargement ? (
        <div style={cadre}><p style={{ margin: 0, color: "#666" }}>Lecture en cours…</p></div>
      ) : etat && !etat.connecte ? (
        <div style={cadre}>
          <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 17 }}>Aucun agenda relié</p>
          <p style={{ margin: "0 0 14px", color: "#555" }}>
            Reliez votre agenda Google une fois : les rendez-vous s&apos;y poseront ensuite depuis vos fiches.
          </p>
          <a href="/organisme/agenda" style={{ display: "inline-block", padding: "12px 20px", fontSize: 16, fontWeight: 600, borderRadius: 8, background: "#1a73e8", color: "#fff", textDecoration: "none" }}>
            Connecter mon agenda →
          </a>
        </div>
      ) : (
        <div style={cadre}>
          <label style={{ ...etiquette, marginTop: 0 }}>
            Titre
            <input value={titre} onChange={function (e) { setTitre(e.target.value); }} style={champ} />
          </label>

          <label style={etiquette}>
            Date et heure
            <input type="datetime-local" value={debut} onChange={function (e) { setDebut(e.target.value); }} style={champ} />
          </label>

          <label style={etiquette}>
            Durée
            <select value={duree} onChange={function (e) { setDuree(Number(e.target.value)); }} style={champ}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 heure</option>
              <option value={90}>1 h 30</option>
              <option value={120}>2 heures</option>
            </select>
          </label>

          <label style={etiquette}>
            Lieu <span style={{ fontWeight: 400, color: "#777" }}>(facultatif)</span>
            <input value={lieu} onChange={function (e) { setLieu(e.target.value); }} placeholder="Adresse, visioconférence, téléphone…" style={champ} />
          </label>

          <label style={etiquette}>
            Notes <span style={{ fontWeight: 400, color: "#777" }}>(facultatif)</span>
            <textarea value={notes} onChange={function (e) { setNotes(e.target.value); }} rows={3} style={{ ...champ, resize: "vertical" }} />
          </label>

          {emailFiche ? (
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, fontSize: 15 }}>
              <input type="checkbox" checked={inviter} onChange={function (e) { setInviter(e.target.checked); }} style={{ width: 18, height: 18 }} />
              <span>Prévenir {nomFiche || "le client"} par courriel ({emailFiche})</span>
            </label>
          ) : (
            <p style={{ marginTop: 18, color: "#777", fontSize: 14 }}>
              Cette fiche n&apos;a pas d&apos;adresse électronique : le rendez-vous sera posé dans votre agenda sans invitation.
            </p>
          )}

          <button
            onClick={poser}
            disabled={envoi}
            style={{
              marginTop: 22, padding: "13px 22px", fontSize: 16, fontWeight: 600,
              borderRadius: 8, border: "none",
              background: envoi ? "#9bbdf0" : "#1a73e8", color: "#fff",
              cursor: envoi ? "default" : "pointer",
            }}
          >
            {envoi ? "Envoi en cours…" : "Poser le rendez-vous →"}
          </button>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/organisme/crm" style={{ color: "#1a73e8" }}>← Revenir à mes prospects</a>
      </p>
    </div>
  );
}
