"use client";

import { useEffect, useState, useRef } from "react";

const STYLE_CARTE = {
  border: "1px solid #dddddd",
  borderRadius: 8,
  padding: 24,
  marginBottom: 22,
  background: "#ffffff",
};

const STYLE_CHAMP = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #cccccc",
  borderRadius: 6,
  fontSize: 17,
  background: "#ffffff",
  color: "#1a1a1a",
  marginBottom: 14,
};

const STYLE_BOUTON = {
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "14px 26px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 17,
};

const STYLE_LIEN = {
  display: "inline-block",
  background: "#ffffff",
  color: "#0a3d2e",
  border: "1px solid #0a3d2e",
  padding: "12px 20px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 16,
  marginBottom: 22,
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: "bold" as const,
  marginBottom: 8,
  color: "#0a3d2e",
  fontSize: 17,
};

const STYLE_ECOUTER = {
  background: "none",
  border: "none",
  color: "#0a3d2e",
  cursor: "pointer",
  fontSize: 15,
  padding: 0,
  textDecoration: "underline",
};

const VERDICTS: Record<string, { label: string; couleur: string }> = {
  a_retravailler: { label: "À retravailler", couleur: "#c62828" },
  en_bonne_voie: { label: "En bonne voie", couleur: "#8a6d2f" },
  pret_pour_audit: { label: "Prêt pour l'audit", couleur: "#2e7d32" },
};

function taille(octets: number): string {
  if (!octets) return "";
  if (octets < 1024) return octets + " o";
  if (octets < 1024 * 1024) return Math.round(octets / 1024) + " Ko";
  return (octets / (1024 * 1024)).toFixed(1) + " Mo";
}

function sansMarkdown(texte: string): string {
  return String(texte || "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s/gm, "")
    .replace(/`/g, "");
}

export default function PageIndicateur({ params }: { params: { id: string } }) {
  const indicateurId = params.id;
  const finChat = useRef<HTMLDivElement | null>(null);
  const lecteur = useRef<HTMLAudioElement | null>(null);

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
  const [chatVisible, setChatVisible] = useState(false);
  const [voixEnCours, setVoixEnCours] = useState<string | null>(null);
  const [erreurVoix, setErreurVoix] = useState<string | null>(null);

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
        if ((dc.messages || []).length > 0) setChatVisible(true);
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
    if (chatVisible && finChat.current) {
      finChat.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, chatVisible, chatEnCours]);

  async function ecouter(texte: string, cle: string) {
    setErreurVoix(null);

    if (lecteur.current) {
      lecteur.current.pause();
      lecteur.current = null;
    }
    if (voixEnCours === cle) {
      setVoixEnCours(null);
      return;
    }

    setVoixEnCours(cle);

    try {
      const r = await fetch("/api/qualiopi/voix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: texte }),
      });

      if (!r.ok) {
        let detail = "";
        try {
          const err = await r.json();
          detail =
            (err.erreur || "code " + r.status) +
            (err.detail ? " — " + err.detail : "");
        } catch (e) {
          detail = "code " + r.status;
        }
        setErreurVoix("Audio indisponible : " + detail);
        setVoixEnCours(null);
        return;
      }

      const blob = await r.blob();

      if (!blob || blob.size < 100) {
        setErreurVoix(
          "Audio indisponible : fichier vide (" + (blob ? blob.size : 0) + " octets)"
        );
        setVoixEnCours(null);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      lecteur.current = audio;

      audio.onended = () => {
        setVoixEnCours(null);
        window.URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setErreurVoix("Audio indisponible : le navigateur ne peut pas lire ce fichier.");
        setVoixEnCours(null);
      };

      try {
        await audio.play();
      } catch (e: any) {
        setErreurVoix(
          "Lecture bloquée par le navigateur. Touchez à nouveau Écouter."
        );
        setVoixEnCours(null);
      }
    } catch (e: any) {
      setErreurVoix("Audio indisponible : " + String(e));
      setVoixEnCours(null);
    }
  }

  async function ouvrirChat() {
    if (conversation.length > 0) {
      setChatVisible(true);
      return;
    }
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
        setChatVisible(true);
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
    const provisoire = {
      id: "provisoire-" + Date.now(),
      role: "utilisateur",
      message: texte,
      provisoire: true,
    };

    // AFFICHAGE IMMEDIAT : le message apparait dans le fil des l envoi,
    // sinon il semble perdu pendant les dix a quinze secondes d attente.
    setConversation((actuelle) => [...actuelle, provisoire]);
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
        setConversation((actuelle) =>
          actuelle.filter((m: any) => m.id !== provisoire.id)
        );
        setErreur(data.erreur || "Erreur d'envoi");
        setSaisie(texte);
      }
    } catch (e: any) {
      setConversation((actuelle) =>
        actuelle.filter((m: any) => m.id !== provisoire.id)
      );
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
        setMessage("Examen terminé.");
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
        setMessageNote("Note enregistrée.");
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
        setMessage("Preuve déposée.");
        setTitre("");
        setNotes("");
        setFichier(null);
        charger();
      } else {
        setErreur(data.erreur || "Erreur de dépôt");
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
        setMessage("Preuve supprimée.");
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
        fontSize: 17,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
        <a href="/admin/qualiopi" style={STYLE_LIEN}>
          Retour à la grille
        </a>

        <h1
          style={{
            color: "#0a3d2e",
            borderBottom: "3px solid #0a3d2e",
            paddingBottom: 10,
            fontSize: 32,
          }}
        >
          Préparation de l'indicateur
        </h1>

        {erreurVoix && (
          <div
            style={{
              background: "#fff4f4",
              border: "1px solid #f0c0c0",
              color: "#8a1c1c",
              padding: 14,
              borderRadius: 6,
              marginBottom: 20,
              fontSize: 16,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {erreurVoix}
          </div>
        )}

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 21, marginTop: 0 }}>
            Mon assistant
          </h2>

          <p
            style={{
              fontSize: 17,
              color: "#444444",
              marginTop: 0,
              lineHeight: 1.6,
            }}
          >
            Votre assistant connaît le niveau attendu par le guide de lecture.
            Il vous explique ce qui est demandé, répond à vos questions et vous
            dit ce qu'il manque. Il ne délivre aucune certification et ne
            préjuge pas de la décision de l'auditeur.
          </p>

          <button
            onClick={ouvrirChat}
            disabled={ouvertureEnCours}
            style={STYLE_BOUTON}
          >
            {ouvertureEnCours
              ? "Ouverture…"
              : conversation.length > 0
              ? "Reprendre avec l'assistant"
              : "Commencer cet indicateur"}
          </button>

          {chatVisible && conversation.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div
                style={{
                  maxHeight: 500,
                  overflowY: "auto",
                  border: "1px solid #eeeeee",
                  borderRadius: 6,
                  padding: 16,
                  marginBottom: 16,
                  background: "#fbfbf9",
                }}
              >
                {conversation.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 16,
                      textAlign: m.role === "utilisateur" ? "right" : "left",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        maxWidth: "88%",
                        textAlign: "left",
                        background:
                          m.role === "utilisateur" ? "#0a3d2e" : "#ffffff",
                        color: m.role === "utilisateur" ? "#ffffff" : "#1a1a1a",
                        border:
                          m.role === "utilisateur"
                            ? "none"
                            : "1px solid #dddddd",
                        borderRadius: 10,
                        padding: "12px 16px",
                        fontSize: 17,
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        opacity: m.provisoire ? 0.75 : 1,
                      }}
                    >
                      {sansMarkdown(m.message)}
                    </div>

                    {m.role === "agent" && (
                      <div style={{ marginTop: 6 }}>
                        <button
                          onClick={() => ecouter(m.message, m.id)}
                          style={STYLE_ECOUTER}
                        >
                          {voixEnCours === m.id ? "Arrêter" : "Écouter"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {chatEnCours && (
                  <div style={{ marginBottom: 16, textAlign: "left" }}>
                    <div
                      style={{
                        display: "inline-block",
                        background: "#ffffff",
                        border: "1px dashed #cccccc",
                        borderRadius: 10,
                        padding: "12px 16px",
                        fontSize: 17,
                        color: "#777777",
                        fontStyle: "italic",
                      }}
                    >
                      L'assistant réfléchit…
                    </div>
                  </div>
                )}

                <div ref={finChat} />
              </div>

              <textarea
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                rows={3}
                placeholder="Posez votre question à l'assistant"
                disabled={chatEnCours || messagesRestants <= 0}
                style={STYLE_CHAMP}
              />

              <button
                onClick={envoyerMessage}
                disabled={chatEnCours || messagesRestants <= 0 || !saisie.trim()}
                style={STYLE_BOUTON}
              >
                {chatEnCours ? "L'assistant réfléchit…" : "Envoyer"}
              </button>

              <p style={{ fontSize: 15, color: "#666666", marginTop: 14 }}>
                {messagesRestants > 0
                  ? messagesRestants + " message(s) restant(s) sur 50."
                  : "Vous avez utilisé vos 50 messages pour cet indicateur."}
              </p>
            </div>
          )}
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 21, marginTop: 0 }}>
            Faire examiner mon dossier
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#555555",
              marginTop: 0,
              lineHeight: 1.6,
            }}
          >
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
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  color: VERDICTS[dernier.verdict]
                    ? VERDICTS[dernier.verdict].couleur
                    : "#999999",
                  fontWeight: "bold",
                  fontSize: 19,
                  marginBottom: 12,
                }}
              >
                {VERDICTS[dernier.verdict]
                  ? VERDICTS[dernier.verdict].label
                  : dernier.verdict}
              </div>

              {dernier.synthese && (
                <p style={{ marginTop: 0, fontSize: 17, lineHeight: 1.6 }}>
                  {sansMarkdown(dernier.synthese)}
                </p>
              )}

              {dernier.points_forts && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "#2e7d32", fontSize: 17 }}>
                    Ce qui est solide
                  </strong>
                  <div style={{ fontSize: 16, lineHeight: 1.6 }}>
                    {sansMarkdown(dernier.points_forts)}
                  </div>
                </div>
              )}

              {dernier.points_manquants && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "#c62828", fontSize: 17 }}>
                    Ce qui manque
                  </strong>
                  <div style={{ fontSize: 16, lineHeight: 1.6 }}>
                    {sansMarkdown(dernier.points_manquants)}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 15, color: "#888888" }}>
                {dernier.documents_lus} document(s) lu(s)
                {dernier.documents_illisibles > 0
                  ? ", " +
                    dernier.documents_illisibles +
                    " non lisible(s) par l'assistant"
                  : ""}
                {" — " +
                  new Date(dernier.created_at).toLocaleDateString("fr-FR")}
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() =>
                    ecouter(
                      (dernier.synthese || "") +
                        " " +
                        (dernier.points_manquants || ""),
                      "examen-" + dernier.id
                    )
                  }
                  style={STYLE_ECOUTER}
                >
                  {voixEnCours === "examen-" + dernier.id
                    ? "Arrêter"
                    : "Écouter ce retour"}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={lancerExamen}
            disabled={examenEnCours || restants <= 0}
            style={STYLE_BOUTON}
          >
            {examenEnCours
              ? "Examen en cours…"
              : dernier
              ? "Refaire examiner"
              : "Faire examiner cet indicateur"}
          </button>

          <p style={{ fontSize: 15, color: "#666666", marginTop: 14 }}>
            {restants > 0
              ? restants + " examen(s) restant(s) sur 5 pour cet indicateur."
              : "Vous avez utilisé vos 5 examens pour cet indicateur."}
          </p>
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 21, marginTop: 0 }}>
            Ma note sur cet indicateur
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#555555",
              marginTop: 0,
              lineHeight: 1.6,
            }}
          >
            Ce que vous avez mis en place, ce qui reste à faire, ou ce que vous
            direz à l'auditeur.
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
            {sauvegardeNote ? "Enregistrement…" : "Enregistrer ma note"}
          </button>

          {messageNote && (
            <p
              style={{
                color: "#0a3d2e",
                fontWeight: "bold",
                marginTop: 14,
                fontSize: 17,
              }}
            >
              {messageNote}
            </p>
          )}
        </div>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 21, marginTop: 0 }}>
            Déposer une preuve
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
            placeholder="Ex : Catalogue 2026 publié sur le site"
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
            {envoi ? "Dépôt en cours…" : "Déposer la preuve"}
          </button>

          <p style={{ fontSize: 15, color: "#666666", marginTop: 14 }}>
            20 Mo maximum par fichier. Chaque dépôt est horodaté et scellé par
            une empreinte SHA-256.
          </p>
        </div>

        {message && (
          <p style={{ color: "#0a3d2e", fontWeight: "bold", fontSize: 17 }}>
            {message}
          </p>
        )}
        {erreur && (
          <p style={{ color: "#c62828", fontSize: 17 }}>Erreur : {erreur}</p>
        )}

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 21, marginTop: 0 }}>
            Preuves déposées
            <span style={{ color: "#999999", fontWeight: "normal" }}>
              {" (" + preuves.length + ")"}
            </span>
          </h2>

          {chargement && <p>Chargement…</p>}

          {!chargement && preuves.length === 0 && (
            <p style={{ color: "#666666", fontSize: 16 }}>
              Aucune preuve déposée pour cet indicateur.
            </p>
          )}

          {preuves.map((p: any) => (
            <div
              key={p.id}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: 17 }}>{p.titre}</strong>
                <span style={{ color: "#666666", fontSize: 15 }}>
                  {" " + taille(p.size_bytes)}
                </span>
              </div>

              {p.notes && (
                <div
                  style={{
                    fontSize: 16,
                    color: "#555555",
                    marginBottom: 6,
                    lineHeight: 1.6,
                  }}
                >
                  {p.notes}
                </div>
              )}

              <div style={{ fontSize: 15, color: "#888888", marginBottom: 8 }}>
                Déposé le {new Date(p.uploaded_at).toLocaleDateString("fr-FR")}
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
                      marginRight: 18,
                      fontSize: 16,
                    }}
                  >
                    Télécharger
                  </a>
                )}
                <button
                  onClick={() => supprimer(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                    fontSize: 16,
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
