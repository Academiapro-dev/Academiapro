"use client";
import { useState, useEffect } from "react";

const ETAPES = [
  { cle: "prospect", nom: "Prospects", couleur: "rgba(255,255,255,0.55)" },
  { cle: "contacte", nom: "Contactes", couleur: "#e8a33d" },
  { cle: "interesse", nom: "Interesses", couleur: "#c8a96e" },
  { cle: "client", nom: "Clients", couleur: "#4caf50" },
  { cle: "perdu", nom: "Perdus", couleur: "rgba(255,255,255,0.35)" },
];

const LIBELLE_STATUT: any = {
  prospect: "Prospect",
  contacte: "Contacte",
  interesse: "Interesse",
  client: "Client",
  perdu: "Perdu",
};

export default function PageCRM() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [importOuvert, setImportOuvert] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [filtre, setFiltre] = useState("");
  const [prix, setPrix] = useState<any>({});
  const [inscrire, setInscrire] = useState<any>({});

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [formation, setFormation] = useState("");
  const [source, setSource] = useState("formulaire");
  const [notes, setNotes] = useState("");

  const [contenu, setContenu] = useState("");
  const [rejets, setRejets] = useState<any[]>([]);

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

  async function appeler(corps: any) {
    const r = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const liste = await appeler({ action: "prospects" });
      if (Array.isArray(liste)) setProspects(liste);
      else setErreur(liste.erreur || "Lecture impossible.");

      const s = await appeler({ action: "stats" });
      if (s && !s.erreur) setStats(s);
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (email.indexOf("@") < 1) {
      setErreur("Indiquez un email valable.");
      return;
    }
    setOccupe("ajout");
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({
        action: "upsert",
        data: {
          nom: nom,
          email: email.trim().toLowerCase(),
          telephone: telephone,
          formation_interesse: formation,
          source: source,
          statut: "prospect",
          notes: notes,
        },
      });
      if (data.succes) {
        setMessage("Prospect enregistre, score " + data.score + " sur 100.");
        setNom(""); setEmail(""); setTelephone(""); setFormation(""); setNotes("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  async function importer() {
    if (contenu.trim().length < 6) {
      setErreur("Collez votre liste.");
      return;
    }
    setOccupe("import");
    setMessage("");
    setErreur("");
    setRejets([]);
    try {
      const r = await fetch("/api/organisme/importer-prospects" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: contenu }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setContenu("");
        setImportOuvert(false);
        if (data.rejets) setRejets(data.rejets);
        await charger();
      } else {
        setErreur(data.erreur || "Import impossible.");
        if (data.rejets) setRejets(data.rejets);
      }
    } catch (e: any) {
      setErreur("Import impossible : " + String(e));
    }
    setOccupe("");
  }

  async function changerStatut(p: any, statut: string) {
    setOccupe("statut-" + p.email);
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({
        action: "upsert",
        data: { email: p.email, nom: p.nom, statut: statut },
      });
      if (data.succes) {
        setMessage("Etape mise a jour.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
  }

  async function convertir(p: any) {
    setOccupe("convertir-" + p.email);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/convertir" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: p.email,
          formation_code: p.formation_interesse,
          prix_vente: prix[p.email] || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setInscrire({ ...inscrire, [p.email]: false });
        await charger();
      } else {
        setErreur(data.erreur || "Inscription impossible.");
      }
    } catch (e: any) {
      setErreur("Inscription impossible : " + String(e));
    }
    setOccupe("");
  }

  async function analyser(mail: string) {
    setOccupe("analyse-" + mail);
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({ action: "analyser", email: mail });
      if (data.analyse) {
        setOuvert({ ...ouvert, [mail]: { type: "analyse", texte: data.analyse } });
      } else {
        setErreur(data.erreur || "Analyse impossible.");
      }
    } catch (e: any) {
      setErreur("Analyse impossible : " + String(e));
    }
    setOccupe("");
  }

  async function relancer(mail: string) {
    setOccupe("relance-" + mail);
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({ action: "relance", email: mail });
      if (data.email_relance) {
        setOuvert({ ...ouvert, [mail]: { type: "relance", texte: data.email_relance } });
      } else {
        setErreur(data.erreur || "Redaction impossible.");
      }
    } catch (e: any) {
      setErreur("Redaction impossible : " + String(e));
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
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  function couleurScore(s: number) {
    if (s >= 60) return "#4caf50";
    if (s >= 35) return "#e8a33d";
    return "rgba(255,255,255,0.5)";
  }

  const compte: any = {};
  for (const e of ETAPES) {
    compte[e.cle] = prospects.filter(function (p) {
      return (p.statut || "prospect") === e.cle;
    }).length;
  }

  const clients = compte["client"] || 0;
  const conversion = prospects.length > 0
    ? Math.round((clients / prospects.length) * 100)
    : 0;

  const affiches = filtre
    ? prospects.filter(function (p) { return (p.statut || "prospect") === filtre; })
    : prospects;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          SUIVI COMMERCIAL
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes prospects</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {prospects.length} fiche(s) · {clients} devenu(s) client(s) · {conversion} % de conversion
        </p>

        {stats && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.total || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Au total</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.chauds || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Chauds · score 60+</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.clients || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Devenus clients</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.score_moyen || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Score moyen</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          <button
            onClick={() => setFiltre("")}
            style={{ padding: "9px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: filtre === "" ? "#c8a96e" : "rgba(255,255,255,0.06)", color: filtre === "" ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: filtre === "" ? "bold" : "normal" }}
          >
            Tous · {prospects.length}
          </button>
          {ETAPES.map(function (e) {
            const actif = filtre === e.cle;
            return (
              <button
                key={e.cle}
                onClick={() => setFiltre(e.cle)}
                style={{ padding: "9px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "13.5px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {e.nom} · {compte[e.cle]}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
          <button
            onClick={() => { setFormulaire(!formulaire); setImportOuvert(false); }}
            style={{ ...BOUTON, background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", fontWeight: "bold", padding: "10px 20px" }}
          >
            {formulaire ? "Annuler" : "Ajouter un prospect"}
          </button>
          <button
            onClick={() => { setImportOuvert(!importOuvert); setFormulaire(false); }}
            style={{ ...BOUTON, padding: "10px 20px" }}
          >
            {importOuvert ? "Fermer l import" : "Importer une liste"}
          </button>
        </div>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Nom</span>
                <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Telephone</span>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Formation qui l interesse</span>
                <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="F028" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Comment il vous a trouve</span>
                <select value={source} onChange={(e) => setSource(e.target.value)} style={CHAMP}>
                  <option value="formulaire">Formulaire</option>
                  <option value="webinaire">Webinaire</option>
                  <option value="chat">Chat</option>
                  <option value="recommandation">Recommandation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <span style={LIBELLE}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={CHAMP} />

            <button
              onClick={ajouter}
              disabled={occupe === "ajout"}
              style={{ background: occupe === "ajout" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "ajout" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "ajout" ? "Enregistrement..." : "Enregistrer"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.6" }}>
              Le score se calcule tout seul : email, telephone, formation visee, origine.
              Plus la fiche est complete, plus le prospect est joignable.
            </p>
          </div>
        )}

        {importOuvert && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Ordre des colonnes</span>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px", fontFamily: "monospace", lineHeight: "1.7" }}>
              email ; nom ; telephone ; formation ; origine ; notes
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.7" }}>
              Seule la premiere colonne est obligatoire. Point-virgule, virgule ou tabulation :
              les trois fonctionnent, et une ligne d en-tete est ignoree.
            </p>

            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={8}
              placeholder={"marie.dupont@exemple.fr ; Marie Dupont ; 0612345678 ; F028 ; salon\njean.martin@exemple.fr ; Jean Martin ; ; ; recommandation"}
              style={{ ...CHAMP, fontFamily: "monospace", fontSize: "14px", lineHeight: "1.7" }}
            />

            <button
              onClick={importer}
              disabled={occupe === "import" || contenu.trim().length < 6}
              style={{ background: occupe === "import" || contenu.trim().length < 6 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "import" || contenu.trim().length < 6 ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "import" ? "Import en cours..." : "Importer"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Un prospect deja connu est mis a jour, sans que son etape ni ses notes soient
              effacees.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {rejets.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 12px" }}>
              {rejets.length} ligne(s) ecartee(s)
            </h2>
            {rejets.map(function (r: any, i: number) {
              return (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Ligne {r.ligne} · </span>
                    {r.valeur}
                  </p>
                  <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "3px 0 0" }}>{r.motif}</p>
                </div>
              );
            })}
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : affiches.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
              Aucun prospect {filtre ? "a cette etape" : "pour le moment"}. Les demandes venues
              de votre page publique arrivent directement ici.
            </p>
          </div>
        ) : (
          affiches.map(function (p) {
            const panneau = ouvert[p.email];
            const etape = p.statut || "prospect";
            const enInscription = inscrire[p.email] === true;
            return (
              <div key={p.email} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 3px" }}>
                      {p.nom || p.email}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                      {p.email}
                      {p.telephone ? " · " + p.telephone : ""}
                      {p.formation_interesse ? " · " + p.formation_interesse : ""}
                      {p.source ? " · " + p.source : ""}
                    </p>
                    {p.progression ? (
                      <p style={{ color: "#4caf50", fontSize: "13px", margin: "6px 0 0" }}>
                        {p.progression} % de sa formation · {p.modules_valides || 0} module(s)
                      </p>
                    ) : null}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: couleurScore(p.score || 0), fontSize: "22px", fontWeight: "bold", margin: "0 0 2px" }}>
                      {p.score || 0}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                      {LIBELLE_STATUT[etape] || etape}
                    </p>
                  </div>
                </div>

                {p.notes && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {p.notes}
                  </p>
                )}

                <div style={{ display: "flex", gap: "7px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
                  {ETAPES.filter(function (e) { return e.cle !== etape; }).map(function (e) {
                    return (
                      <button
                        key={e.cle}
                        onClick={() => changerStatut(p, e.cle)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, color: e.couleur, borderColor: "rgba(255,255,255,0.18)", fontSize: "12.5px", padding: "6px 13px" }}
                      >
                        → {e.nom}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={() => analyser(p.email)}
                    disabled={occupe !== ""}
                    style={BOUTON}
                  >
                    {occupe === "analyse-" + p.email ? "Analyse..." : "Analyser"}
                  </button>

                  <button
                    onClick={() => relancer(p.email)}
                    disabled={occupe !== ""}
                    style={BOUTON}
                  >
                    {occupe === "relance-" + p.email ? "Redaction..." : "Rediger une relance"}
                  </button>

                  {etape !== "client" && (
                    <button
                      onClick={() => setInscrire({ ...inscrire, [p.email]: !enInscription })}
                      style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                    >
                      {enInscription ? "Annuler" : "Inscrire au registre"}
                    </button>
                  )}

                  {panneau && (
                    <button
                      onClick={() => setOuvert({ ...ouvert, [p.email]: null })}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                    >
                      Fermer
                    </button>
                  )}

                  {p.derniere_interaction && (
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", alignSelf: "center" }}>
                      vu le {new Date(p.derniere_interaction).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>

                {enInscription && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#c8a96e", fontSize: "13px" }}>Prix de vente</span>
                    <input
                      value={prix[p.email] || ""}
                      onChange={(e) => setPrix({ ...prix, [p.email]: e.target.value })}
                      placeholder="1500"
                      style={{ ...CHAMP, width: "130px", marginBottom: 0 }}
                    />
                    <button
                      onClick={() => convertir(p)}
                      disabled={occupe !== ""}
                      style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "11px 22px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif", fontWeight: "bold" }}
                    >
                      {occupe === "convertir-" + p.email ? "Inscription..." : "Confirmer l inscription"}
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
                      {p.formation_interesse ? "sur " + p.formation_interesse : "sans formation precisee"}
                    </span>
                  </div>
                )}

                {panneau && panneau.texte && (
                  <div style={{ marginTop: "14px", background: "#ffffff", borderRadius: "10px", padding: "20px 22px", color: "#1a1a1a" }}>
                    <p style={{ color: "#0a3d2e", fontSize: "13px", fontWeight: "bold", margin: "0 0 10px", letterSpacing: "1px" }}>
                      {panneau.type === "relance" ? "EMAIL DE RELANCE PROPOSE" : "ANALYSE COMMERCIALE"}
                    </p>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "1.75" }}>
                      {String(panneau.texte).replace(/\*\*/g, "")}
                    </div>
                    {panneau.type === "relance" && (
                      <p style={{ color: "#777", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.6" }}>
                        Copiez ce texte dans votre messagerie apres l avoir relu. Rien n est
                        envoye automatiquement.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
