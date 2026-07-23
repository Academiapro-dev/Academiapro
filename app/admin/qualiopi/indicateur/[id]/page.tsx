"use client";

import { useEffect, useState, useRef } from "react";

const STYLE_CARTE = {
  border: "1px solid #dddddd",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  background: "#ffffff",
};

const STYLE_CHAMP = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cccccc",
  borderRadius: 6,
  fontSize: 15,
  background: "#ffffff",
  color: "#1a1a1a",
  marginBottom: 14,
};

const STYLE_BOUTON = {
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "12px 24px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 15,
};

const STYLE_LIEN = {
  display: "inline-block",
  background: "#ffffff",
  color: "#0a3d2e",
  border: "1px solid #0a3d2e",
  padding: "10px 18px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 15,
  marginBottom: 20,
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: "bold" as const,
  marginBottom: 6,
  color: "#0a3d2e",
};

const VERDICTS: Record<string, { label: string; couleur: string }> = {
  a_retravailler: { label: "A retravailler", couleur: "#c62828" },
  en_bonne_voie: { label: "En bonne voie", couleur: "#8a6d2f" },
  pret_pour_audit: { label: "Pret pour l'audit", couleur: "#2e7d32" },
};

function taille(octets: number): string {
  if (!octets) return "";
  if (octets < 1024) return octets + " o";
  if (octets < 1024 * 1024) return Math.round(octets / 1024) + " Ko";
  return (octets / (1024 * 1024)).toFixed(1) + " Mo";
}

export default function PageIndicateur({ params }: { params: { id: string } }) {
  const indicateurId = params.id;
  const finChat = useRef<HTMLDivElement | null>(null);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preuves, setPreuves] = useState<any[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [titre, setTitre] = useState("");
  const [notes, setNotes] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  const [commentaire, setCommentaire] = useState("");
  const [dateRevue, setDateRevue] = useState("");
  const [sauvegardeNote, setSauvegardeNote] = useState(false);
  const [messageNote, setMessageNote] = useState<string | null>(null);

  const [examens, setExamens] = useState<any[]>([]);
  const [restants, setRestants] = useState<number>(5);
  const [examenEnCours, setExamenEnCours] = useState(false);

  const [conversation, setConversation] = useState<any[]>([]);
  const [messagesRestants, setMessagesRestants] = useState<number>(50);
  const [saisie, setSaisie] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);
  const [ouvertureEnCours, setOuvertureEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      const r = await fetch(
        "/api/qualiopi/preuves?indicateur_id=" + indicateurId
      );
      const data = await r.json();
      if (data.ok) {
        setPreuves(data.preuves || []);
      } else {
        setErreur(data.erreur || "Erreur de chargement");
      }

      const rg = await fetch("/api/qualiopi/grille");
      const dg = await rg.json();
      if (dg.ok) {
        let trouve: any = null;
        (dg.groupes || []).forEach((g: any) => {
          (g.indicateurs || []).forEach((i: any) => {
            if (i.id === indicateurId) trouve = i;
          });
        });
        if (trouve) {
          setCommentaire(trouve.commentaire || "");
          setDateRevue(trouve.date_revue || "");
        }
      }

      const re = await fetch(
        "/api/qualiopi/examen?indicateur_id=" + indicateurId
      );
      const de = await re.json();
      if (de.ok) {
        setExamens(de.examens || []);
        setRestants(de.restants);
      }

      const rc = await fetch("/api/qualiopi/chat?indicateur_id=" + indicateurId);
      const dc = await rc.json();
      if (dc.ok) {
        setConversation(dc.messages || []);
        setMessagesRestants(dc.restants);
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    if (finChat.current) {
      finChat.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  async function ouvrirChat() {
    setOuvertureEnCours(true);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicateur_id: indicateurId, ouverture: true }),
      });
      const data = await r.json();
      if (data.ok) {
        setConversation(data.messages || []);
        if (data.restants !== undefined) setMessagesRestants(data.restants);
      } else {
        setErreur(data.erreur || "Erreur d'ouverture");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setOuvertureEnCours(false);
  }

  async function envoyerMessage() {
    if (!saisie.trim()) return;
    const texte = saisie;
    setSaisie("");
    setChatEnCours(true);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicateur_id: indicateurId,
          message: texte,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setConversation(data.messages || []);
        setMessagesRestants(data.restants);
      } else {
        setErreur(data.erreur || "Erreur d'envoi");
        setSaisie(texte);
      }
    } catch (e: any) {
      setErreur(String(e));
      setSaisie(texte);
    }
    setChatEnCours(false);
  }

  async function lancerExamen() {
    setExamenEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const r = await fetch("/api/qualiopi/examen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicateur_id: indicateurId }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Examen termine.");
        charger();
      } else {
        setErreur(data.erreur || "Erreur d'examen");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setExamenEnCours(false);
  }

  async function enregistrerNote() {
    setSauvegardeNote(true);
    setMessageNote(null);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/grille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicateur_id: indicateurId,
          commentaire: commentaire,
          date_revue: dateRevue || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessageNote("Note enregistree.");
      } else {
        setErreur(data.erreur || "Erreur d'enregistrement");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setSauvegardeNote(false);
  }

  async function deposer() {
    if (!fichier) {
      setErreur("Choisissez d'abord un fichier.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("indicateur_id", indicateurId);
      form.append("titre", titre);
      form.append("notes", notes);
      form.append("fichier", fichier);

      const r = await fetch("/api/qualiopi/preuves", {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Preuve deposee.");
        setTitre("");
        setNotes("");
        setFichier(null);
        charger();
      } else {
        setErreur(data.erreur || "Erreur de depot");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setEnvoi(false);
  }

  async function supprimer(id: string) {
    setErreur(null);
    setMessage(null);
    try {
      const r = await fetch("/api/qualiopi/preuves?id=" + id, {
        method: "DELETE",
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Preuve supprimee.");
        charger();
      } else {
        setErreur(data.erreur || "Erreur de suppression");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
  }

  const dernier = examens.length > 0 ? examens[0] : null;

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
        <a href="/admin/qualiopi" style={STYLE_LIEN}>
          Retour a la grille
        </a>

        <h1
          style={{
            color: "#0a3d2e",
            borderBottom: "3px solid #0a3d2e",
            paddingBottom: 10,
          }}
        >
          Preparation de l'indicateur
        </h1>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Mon assistant
          </h2>

          {conversation.length === 0 && (
            <div>
              <p style={{ fontSize: 15, color: "#555555", marginTop: 0 }}>
                Votre assistant connait le niveau attendu par le guide de
                lecture. Il vous explique ce qui est demande, repond a vos
                questions et vous dit ce qu'il manque. Il ne delivre aucune
                certification et ne prejuge pas de la decision de l'auditeur.
              </p>
              <button
                onClick={ouvrirChat}
                disabled={ouvertureEnCours}
                style={STYLE_BOUTON}
              >
                {ouvertureEnCours
                  ? "Ouverture..."
                  : "Commencer cet indicateur"}
              </button>
            </div>
          )}

          {conversation.length > 0 && (
            <div>
              <div
                style={{
                  maxHeight: 460,
                  overflowY: "auto",
                  border: "1px solid #eeeeee",
                  borderRadius: 6,
                  padding: 14,
                  marginBottom: 14,
                  background: "#fbfbf9",
                }}
              >
                {conversation.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 14,
                      textAlign: m.role === "utilisateur" ? "right" : "left",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        maxWidth: "85%",
                        textAlign: "left",
                        background:
                          m.role === "utilisateur" ? "#0a3d2e" : "#ffffff",
                        color: m.role === "utilisateur" ? "#ffffff" : "#1a1a1a",
                        border:
                          m.role === "utilisateur"
                            ? "none"
                            : "1px solid #dddddd",
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontSize: 15,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.message}
                    </div>
                  </div>
                ))}
                <div ref={finChat} />
              </div>

              <textarea
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                rows={3}
                placeholder="Posez votre question a l'assistant"
                disabled={chatEnCours || messagesRestants <= 0}
                style={STYLE_CHAMP}
              />

              <button
                onClick={envoyerMessage}
                disabled={chatEnCours || messagesRestants <= 0 || !saisie.trim()}
                style={STYLE_BOUTON}
              >
                {chatEnCours ? "L'assistant reflechit..." : "Envoyer"}
              </button>

              <p style={{ fontSize: 13, color: "#666666", marginTop: 12 }}>
                {messagesRestants > 0
                  ? messagesRestants + " message(s) restant(s) sur 50."
                  : "Vous avez utilise vos 50 messages pour cet indicateur."}
              </p>
            </div>
          )}
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Faire examiner mon dossier
          </h2>
          <p style={{ fontSize: 14, color: "#666666", marginTop: 0 }}>
            L'assistant lit vos preuves et votre note, les compare au niveau
            attendu par le guide de lecture, et vous dit ce qui manque.
          </p>

          {dernier && (
            <div
              style={{
                border:
                  "2px solid " +
                  (VERDICTS[dernier.verdict]
                    ? VERDICTS[dernier.verdict].couleur
                    : "#999999"),
                borderRadius: 6,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: VERDICTS[dernier.verdict]
                    ? VERDICTS[dernier.verdict].couleur
                    : "#999999",
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                {VERDICTS[dernier.verdict]
                  ? VERDICTS[dernier.verdict].label
                  : dernier.verdict}
              </div>

              {dernier.synthese && (
                <p style={{ marginTop: 0 }}>{dernier.synthese}</p>
              )}

              {dernier.points_forts && (
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: "#2e7d32" }}>
                    Ce qui est solide
                  </strong>
                  <div style={{ fontSize: 14 }}>{dernier.points_forts}</div>
                </div>
              )}

              {dernier.points_manquants && (
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: "#c62828" }}>Ce qui manque</strong>
                  <div style={{ fontSize: 14 }}>{dernier.points_manquants}</div>
                </div>
              )}

              <div style={{ fontSize: 13, color: "#888888" }}>
                {dernier.documents_lus} document(s) lu(s)
                {dernier.documents_illisibles > 0
                  ? ", " +
                    dernier.documents_illisibles +
                    " non lisible(s) par l'assistant"
                  : ""}
                {" — " +
                  new Date(dernier.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
          )}

          <button
            onClick={lancerExamen}
            disabled={examenEnCours || restants <= 0}
            style={STYLE_BOUTON}
          >
            {examenEnCours
              ? "Examen en cours..."
              : dernier
              ? "Refaire examiner"
              : "Faire examiner cet indicateur"}
          </button>

          <p style={{ fontSize: 13, color: "#666666", marginTop: 12 }}>
            {restants > 0
              ? restants + " examen(s) restant(s) sur 5 pour cet indicateur."
              : "Vous avez utilise vos 5 examens pour cet indicateur."}
          </p>
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Ma note sur cet indicateur
          </h2>
          <p style={{ fontSize: 14, color: "#666666", marginTop: 0 }}>
            Ce que vous avez mis en place, ce qui reste a faire, ou ce que vous
            direz a l'auditeur.
          </p>

          <span style={STYLE_LIBELLE}>Commentaire</span>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={5}
            style={STYLE_CHAMP}
          />

          <span style={STYLE_LIBELLE}>Date de revue (facultatif)</span>
          <input
            type="date"
            value={dateRevue}
            onChange={(e) => setDateRevue(e.target.value)}
            style={STYLE_CHAMP}
          />

          <button
            onClick={enregistrerNote}
            disabled={sauvegardeNote}
            style={STYLE_BOUTON}
          >
            {sauvegardeNote ? "Enregistrement..." : "Enregistrer ma note"}
          </button>

          {messageNote && (
            <p style={{ color: "#0a3d2e", fontWeight: "bold", marginTop: 12 }}>
              {messageNote}
            </p>
          )}
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Deposer une preuve
          </h2>

          <span style={STYLE_LIBELLE}>Fichier</span>
          <input
            type="file"
            onChange={(e) =>
              setFichier(
                e.target.files && e.target.files[0] ? e.target.files[0] : null
              )
            }
            style={STYLE_CHAMP}
          />

          <span style={STYLE_LIBELLE}>Titre (facultatif)</span>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex : Catalogue 2026 publie sur le site"
            style={STYLE_CHAMP}
          />

          <span style={STYLE_LIBELLE}>Notes (facultatif)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ce que ce document prouve, ou l'auditeur le trouvera"
            style={STYLE_CHAMP}
          />

          <button onClick={deposer} disabled={envoi} style={STYLE_BOUTON}>
            {envoi ? "Depot en cours..." : "Deposer la preuve"}
          </button>

          <p style={{ fontSize: 13, color: "#666666", marginTop: 12 }}>
            20 Mo maximum par fichier. Chaque depot est horodate et scelle par
            une empreinte SHA-256.
          </p>
        </div>

        {message && (
          <p style={{ color: "#0a3d2e", fontWeight: "bold" }}>{message}</p>
        )}
        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Preuves deposees
            <span style={{ color: "#999999", fontWeight: "normal" }}>
              {" (" + preuves.length + ")"}
            </span>
          </h2>

          {chargement && <p>Chargement...</p>}

          {!chargement && preuves.length === 0 && (
            <p style={{ color: "#666666" }}>
              Aucune preuve deposee pour cet indicateur.
            </p>
          )}

          {preuves.map((p: any) => (
            <div
              key={p.id}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong>{p.titre}</strong>
                <span style={{ color: "#666666", fontSize: 13 }}>
                  {" " + taille(p.size_bytes)}
                </span>
              </div>

              {p.notes && (
                <div
                  style={{ fontSize: 14, color: "#555555", marginBottom: 6 }}
                >
                  {p.notes}
                </div>
              )}

              <div style={{ fontSize: 13, color: "#888888", marginBottom: 8 }}>
                Depose le {new Date(p.uploaded_at).toLocaleDateString("fr-FR")}
              </div>

              <div>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#0a3d2e",
                      fontWeight: "bold",
                      marginRight: 16,
                    }}
                  >
                    Telecharger
                  </a>
                )}
                <button
                  onClick={() => supprimer(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
