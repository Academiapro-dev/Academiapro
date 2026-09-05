"use client";
import { useState, useEffect } from "react";
import Guide from "../../../components/Guide";

const ETAPES = [
  { cle: "prospect", nom: "Prospects", couleur: "rgba(255,255,255,0.55)" },
  { cle: "contacte", nom: "Contactés", couleur: "#e8a33d" },
  { cle: "interesse", nom: "Intéressés", couleur: "#c8a96e" },
  { cle: "client", nom: "Clients", couleur: "#4caf50" },
  { cle: "perdu", nom: "Perdus", couleur: "rgba(255,255,255,0.35)" },
];

const LIBELLE_STATUT: any = {
  prospect: "Prospect",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  perdu: "Perdu",
};

// LES MOTIFS DE PERTE SONT UNE LISTE, PAS UN CHAMP LIBRE.
//
// Un champ libre produit autant de formulations que de fiches, et le
// regroupement ne montre plus rien. La liste sert au comptage, la
// precision libre sert a la memoire. Les deux partent dans la meme
// colonne, separes par un tiret cadratin : le regroupement ne retient
// que ce qui precede le tiret.
const MOTIFS_PERTE = [
  "Prix trop élevé",
  "A choisi un concurrent",
  "Projet abandonné",
  "Pas de budget",
  "Sans réponse",
  "Hors cible",
  "Mauvais moment",
  "Autre",
];

const SEPARATEUR = " — ";

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
  const [campagne, setCampagne] = useState<any>(null);

  // Perte, relance automatique, affichage.
  const [motifs, setMotifs] = useState<any>(null);
  const [fichePerdu, setFichePerdu] = useState("");
  const [motifChoisi, setMotifChoisi] = useState("");
  const [precision, setPrecision] = useState("");
  const [tableau, setTableau] = useState(false);
  const [cherche, setCherche] = useState("");

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

      const m = await appeler({ action: "motifs_perte" });
      if (m && Array.isArray(m.motifs)) setMotifs(m);
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
        setMessage("Prospect enregistré, score " + data.score + " sur 100.");
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
        setMessage("Étape mise à jour.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
    setOccupe("");
  }

  // MARQUER PERDU AVEC SON MOTIF.
  //
  // Le motif choisi dans la liste et la precision libre partent dans la
  // meme colonne, separes par le tiret cadratin. La fiche sort des
  // relances automatiques au passage.
  async function marquerPerdu(mail: string) {
    if (!motifChoisi) {
      setErreur("Choisissez d'abord un motif.");
      return;
    }
    setOccupe("perdu-" + mail);
    setMessage("");
    setErreur("");
    const texte = precision.trim() ? motifChoisi + SEPARATEUR + precision.trim() : motifChoisi;
    try {
      const data = await appeler({ action: "perdu", email: mail, motif: texte });
      if (data.succes) {
        setMessage("Fiche fermée. Le motif rejoint votre analyse des pertes.");
        setFichePerdu("");
        setMotifChoisi("");
        setPrecision("");
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  // ROUVRIR UNE FICHE FERMEE PAR ERREUR. Le motif et la date de perte
  // sont effaces, sans quoi le regroupement resterait fausse.
  async function rouvrir(mail: string) {
    setOccupe("rouvrir-" + mail);
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({ action: "rouvrir", email: mail });
      if (data.succes) {
        setMessage("Fiche rouverte.");
        await charger();
      } else {
        setErreur(data.erreur || "Réouverture impossible.");
      }
    } catch (e: any) {
      setErreur("Réouverture impossible : " + String(e));
    }
    setOccupe("");
  }

  // ARMER OU DESARMER LA RELANCE AUTOMATIQUE, FICHE PAR FICHE.
  //
  // Armer ne declenche rien aujourd hui : le second verrou, cote serveur,
  // reste ferme. Ce reglage prepare le jour ou il s ouvrira.
  async function basculerRelanceAuto(mail: string, actif: boolean) {
    setOccupe("auto-" + mail);
    setMessage("");
    setErreur("");
    try {
      const data = await appeler({ action: "relance_auto", email: mail, actif: actif });
      if (data.succes) await charger();
      else setErreur(data.erreur || "Modification impossible.");
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
        setErreur(data.erreur || "Rédaction impossible.");
      }
    } catch (e: any) {
      setErreur("Rédaction impossible : " + String(e));
    }
    setOccupe("");
  }

  // ENVOI D UNE RELANCE RELUE. Le texte affiche est celui qui part : rien
  // n est envoye sans que l organisme l ait sous les yeux.
  async function envoyer(mail: string, texte: string) {
    setOccupe("envoi-" + mail);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/relancer-prospects" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, texte: texte }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setOuvert({ ...ouvert, [mail]: null });
        await charger();
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe("");
  }

  // APERCU DE LA CAMPAGNE. On regarde qui recevra le message avant de
  // l envoyer : une relance en nombre ne se declenche pas a l aveugle.
  async function preparerCampagne() {
    setOccupe("campagne");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/relancer-prospects" + suffixe("?"));
      const data = await r.json();
      if (data.ok) setCampagne(data);
      else setErreur(data.erreur || "Aperçu impossible.");
    } catch (e: any) {
      setErreur("Aperçu impossible : " + String(e));
    }
    setOccupe("");
  }

  async function lancerCampagne() {
    setOccupe("campagne-envoi");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/relancer-prospects" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setCampagne(null);
        await charger();
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
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

  // LE TABLEAU. En-tete figee, colonnes fixes, lignes serrees : trente
  // fiches d un coup d oeil au lieu de cinq. Les cartes restent
  // disponibles — elles portent l analyse, la relance redigee et
  // l inscription au registre, qui ne tiennent pas dans une ligne.
  const TH: any = { position: "sticky", top: 0, background: "#12121f", color: "#c8a96e", fontSize: "11.5px", fontWeight: "bold", textAlign: "left", padding: "9px 10px", borderBottom: "2px solid rgba(200,169,110,0.35)", whiteSpace: "nowrap", zIndex: 2 };
  const TD: any = { padding: "7px 10px", fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.85)" };

  function couleurScore(s: number) {
    if (s >= 60) return "#4caf50";
    if (s >= 35) return "#e8a33d";
    return "rgba(255,255,255,0.5)";
  }

  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  function jolieDate(d: any) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  // REGROUPEMENT DES MOTIFS. Le serveur renvoie le texte complet ; on n en
  // retient ici que la partie qui precede le tiret, sans quoi chaque
  // precision libre creerait sa propre ligne.
  function motifsRegroupes() {
    if (!motifs || !Array.isArray(motifs.motifs)) return [];
    const compte: any = {};
    motifs.motifs.forEach(function (m: any) {
      const tete = String(m.motif || "").split(SEPARATEUR)[0].trim() || "Sans motif";
      compte[tete] = (compte[tete] || 0) + (Number(m.nombre) || 0);
    });
    return Object.keys(compte)
      .map(function (k) { return { motif: k, nombre: compte[k] }; })
      .sort(function (a, b) { return b.nombre - a.nombre; });
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

  const parEtape = filtre
    ? prospects.filter(function (p) { return (p.statut || "prospect") === filtre; })
    : prospects;

  const recherche = cherche.trim().toLowerCase();
  const affiches = recherche
    ? parEtape.filter(function (p) {
        return (String(p.nom || "") + " " + String(p.email || "") + " " + String(p.formation_interesse || "")).toLowerCase().indexOf(recherche) >= 0;
      })
    : parEtape;

  const regroupes = motifsRegroupes();
  const totalMotifs = regroupes.reduce(function (s, m) { return s + m.nombre; }, 0);
  const armees = prospects.filter(function (p) { return !!p.relance_auto; }).length;

  // Le panneau « Perdu », partage par les deux affichages.
  function panneauPerte(mail: string) {
    return (
      <div style={{ marginTop: "12px", padding: "14px", background: "rgba(232,131,106,0.07)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px" }}>
        <span style={{ ...LIBELLE, color: "#e8836a" }}>Pourquoi cette affaire est-elle perdue ?</span>
        <select value={motifChoisi} onChange={(e) => setMotifChoisi(e.target.value)} style={CHAMP}>
          <option value="">Choisir un motif…</option>
          {MOTIFS_PERTE.map(function (m) {
            return <option key={m} value={m}>{m}</option>;
          })}
        </select>

        <span style={{ ...LIBELLE, color: "rgba(255,255,255,0.5)" }}>Précision (facultative)</span>
        <textarea
          value={precision}
          onChange={(e) => setPrecision(e.target.value)}
          rows={2}
          placeholder="Ce qu'il vous a dit exactement…"
          style={{ ...CHAMP, resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => marquerPerdu(mail)}
            disabled={occupe !== "" || !motifChoisi}
            style={{ flex: 1, minWidth: "150px", background: motifChoisi ? "#e8836a" : "rgba(232,131,106,0.3)", color: motifChoisi ? "#050508" : "#8a8a8a", padding: "12px", borderRadius: "8px", border: "none", cursor: motifChoisi ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif" }}
          >
            {occupe === "perdu-" + mail ? "Enregistrement…" : "Enregistrer la perte"}
          </button>
          <button
            onClick={() => { setFichePerdu(""); setMotifChoisi(""); setPrecision(""); }}
            style={{ ...BOUTON, flex: 1, minWidth: "110px", borderRadius: "8px", padding: "12px" }}
          >
            Annuler
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "10px 0 0", lineHeight: "1.6" }}>
          La fiche est fermée, sort des relances, et le motif rejoint votre analyse des pertes
          en haut de cette page. Une fiche fermée par erreur se rouvre d'un bouton.
        </p>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: tableau ? "100%" : "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          SUIVI COMMERCIAL
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes prospects</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {prospects.length} fiche(s) · {clients} devenu(s) client(s) · {conversion} % de conversion
          {armees > 0 ? " · " + armees + " en relance automatique" : ""}
        </p>

        <div style={{ marginTop: "18px" }}>
          <Guide ecran="crm.prospects" />
        </div>

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
              <p style={{ color: "#e8836a", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.perdus || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Perdus</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>{stats.score_moyen || 0}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Score moyen</p>
            </div>
          </div>
        )}

        {/* ---------- POURQUOI VOUS PERDEZ DES AFFAIRES ---------- */}
        {regroupes.length > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.3)" }}>
            <h2 style={{ color: "#e8836a", fontSize: "16px", margin: "0 0 4px" }}>
              Pourquoi vous perdez des affaires
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 14px" }}>
              {totalMotifs} affaire(s) fermée(s). Ce classement vaut mieux qu'une étude de marché :
              il vient de vos propres clients.
            </p>
            {regroupes.map(function (m) {
              const part = totalMotifs > 0 ? Math.round((m.nombre / totalMotifs) * 100) : 0;
              return (
                <div key={m.motif} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "5px" }}>
                    <span style={{ color: "rgba(255,255,255,0.75)" }}>{m.motif}</span>
                    <span style={{ color: "#e8836a", fontWeight: "bold" }}>{m.nombre} · {part} %</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                    <div style={{ background: "#e8836a", height: "100%", width: part + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
          <input
            value={cherche}
            onChange={(e) => setCherche(e.target.value)}
            placeholder="Chercher un nom, une adresse, une formation"
            style={{ ...CHAMP, flex: "1 1 260px", marginBottom: 0, fontSize: "14px", padding: "10px 13px" }}
          />
          <button
            onClick={() => setTableau(!tableau)}
            style={{ ...BOUTON, padding: "10px 20px", background: tableau ? "#c8a96e" : "none", color: tableau ? "#050508" : "#c8a96e", border: tableau ? "none" : BOUTON.border, fontWeight: tableau ? "bold" : "normal" }}
          >
            {tableau ? "Vue détaillée" : "Vue tableau"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
          <button
            onClick={() => { setFormulaire(!formulaire); setImportOuvert(false); setCampagne(null); }}
            style={{ ...BOUTON, background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", fontWeight: "bold", padding: "10px 20px" }}
          >
            {formulaire ? "Annuler" : "Ajouter un prospect"}
          </button>
          <button
            onClick={() => { setImportOuvert(!importOuvert); setFormulaire(false); setCampagne(null); }}
            style={{ ...BOUTON, padding: "10px 20px" }}
          >
            {importOuvert ? "Fermer l'import" : "Importer une liste"}
          </button>
          <button
            onClick={() => { if (campagne) setCampagne(null); else preparerCampagne(); }}
            disabled={occupe !== ""}
            style={{ ...BOUTON, padding: "10px 20px" }}
          >
            {occupe === "campagne" ? "Préparation…" : campagne ? "Fermer la campagne" : "Relancer mes prospects"}
          </button>
        </div>

        {campagne && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 10px" }}>
              {campagne.nombre} prospect(s) seront relancé(s)
            </h2>

            {campagne.nombre === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
                Personne à relancer aujourd'hui. Sont écartés : ceux qui se sont désinscrits,
                ceux qui sont déjà clients ou perdus, ceux qui n'ont jamais pris contact
                d'eux-mêmes, et ceux qui ont reçu un message il y a moins de{" "}
                {campagne.repos_jours} jours.
              </p>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.75", marginTop: 0 }}>
                  Seuls les prospects venus d'eux-mêmes sont relancés : formulaire, webinaire,
                  chat ou recommandation. Chaque message porte un lien de désinscription, et
                  personne ne reçoit deux messages en moins de {campagne.repos_jours} jours.
                </p>

                <div style={{ maxHeight: "240px", overflowY: "auto", margin: "14px 0", paddingRight: "6px" }}>
                  {(campagne.candidats || []).map(function (c: any) {
                    return (
                      <div key={c.email} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", wordBreak: "break-all" }}>
                          {c.nom || c.email}
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>
                            {" · " + c.source}{c.formation ? " · " + c.formation : ""}
                            {c.relances > 0 ? " · déjà relancé " + c.relances + " fois" : ""}
                          </span>
                        </span>
                        <span style={{ color: couleurScore(c.score || 0), fontSize: "13.5px", fontWeight: "bold" }}>
                          {c.score || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={lancerCampagne}
                  disabled={occupe !== ""}
                  style={{ background: occupe === "campagne-envoi" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "campagne-envoi" ? "#8a8a8a" : "#050508", padding: "14px 28px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
                >
                  {occupe === "campagne-envoi"
                    ? "Envoi en cours…"
                    : "Envoyer les " + campagne.nombre + " relances"}
                </button>
              </>
            )}
          </div>
        )}

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Nom</span>
                <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Adresse électronique</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Téléphone</span>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Formation qui l'intéresse</span>
                <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="F028" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Comment il vous a trouvé</span>
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
              {occupe === "ajout" ? "Enregistrement…" : "Enregistrer"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.6" }}>
              Le score se calcule tout seul : adresse, téléphone, formation visée, origine.
              Plus la fiche est complète, plus le prospect est joignable.
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
              Seule la première colonne est obligatoire. Point-virgule, virgule ou tabulation :
              les trois fonctionnent, et une ligne d'en-tête est ignorée.
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
              {occupe === "import" ? "Import en cours…" : "Importer"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Un prospect déjà connu est mis à jour, sans que son étape ni ses notes soient
              effacées. Une liste importée n'entre pas dans les relances en nombre : ces
              personnes ne vous ont pas contacté d'elles-mêmes.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {rejets.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 12px" }}>
              {rejets.length} ligne(s) écartée(s)
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
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : affiches.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.75" }}>
              {recherche
                ? "Aucune fiche ne correspond à cette recherche."
                : "Aucun prospect " + (filtre ? "à cette étape" : "pour le moment") + ". Les demandes venues de votre page publique arrivent directement ici."}
            </p>
          </div>
        ) : tableau ? (

          /* ---------- VUE TABLEAU ---------- */
          <div>
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", background: "#12121f" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1150px" }}>
                <thead>
                  <tr>
                    <th style={TH}>Nom</th>
                    <th style={TH}>Adresse e-mail</th>
                    <th style={TH}>Téléphone</th>
                    <th style={TH}>Formation</th>
                    <th style={TH}>Origine</th>
                    <th style={TH}>Score</th>
                    <th style={TH}>Étape</th>
                    <th style={TH}>Relance auto</th>
                    <th style={TH}>Motif de perte</th>
                    <th style={TH}>Dernier contact</th>
                  </tr>
                </thead>
                <tbody>
                  {affiches.map(function (p, i) {
                    const etape = p.statut || "prospect";
                    const estPerdu = etape === "perdu";
                    const fond = estPerdu
                      ? "rgba(232,131,106,0.08)"
                      : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.022)");
                    return (
                      <tr key={p.email} style={{ background: fond }}>
                        <td style={{ ...TD, color: "#fff", fontWeight: "bold", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.nom || "—"}
                        </td>
                        <td style={TD}>
                          <a href={"mailto:" + p.email} style={{ color: "#c8a96e", textDecoration: "none" }}>{p.email}</a>
                        </td>
                        <td style={TD}>
                          {p.telephone
                            ? <>
                                <a href={"tel:" + appelable(p.telephone)} style={{ color: "#c8a96e", textDecoration: "none" }}>{p.telephone}</a>
                                {!p.desinscrit && (
                                  <a
                                    href={"/organisme/sms?numero=" + encodeURIComponent(p.telephone) + "&nom=" + encodeURIComponent(p.nom || p.email || "")}
                                    style={{ color: "#7fb3ff", textDecoration: "none", marginLeft: "8px", fontSize: "12px" }}
                                  >
                                    SMS
                                  </a>
                                )}
                              </>
                            : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                        </td>
                        <td style={TD}>{p.formation_interesse || "—"}</td>
                        <td style={{ ...TD, color: "rgba(255,255,255,0.5)" }}>{p.source || "—"}</td>
                        <td style={{ ...TD, color: couleurScore(p.score || 0), fontWeight: "bold" }}>{p.score || 0}</td>
                        <td style={TD}>{LIBELLE_STATUT[etape] || etape}</td>
                        <td style={TD}>
                          {estPerdu ? (
                            <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>
                          ) : (
                            <button
                              onClick={() => basculerRelanceAuto(p.email, !p.relance_auto)}
                              disabled={occupe !== ""}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif", padding: 0, color: p.relance_auto ? "#4caf50" : "rgba(255,255,255,0.35)" }}
                            >
                              {p.relance_auto ? "🔔 armée" : "🔕 désarmée"}
                            </button>
                          )}
                        </td>
                        <td style={{ ...TD, color: "#e8836a", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.motif_perte || ""}
                        </td>
                        <td style={{ ...TD, color: "rgba(255,255,255,0.45)" }}>
                          {jolieDate(p.derniere_interaction) || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: "12px 0 0", lineHeight: "1.6" }}>
              {affiches.length} fiche(s) affichée(s). Repassez en vue détaillée pour analyser un
              prospect, rédiger une relance ou l'inscrire au registre.
            </p>
          </div>

        ) : (

          /* ---------- VUE DÉTAILLÉE ---------- */
          affiches.map(function (p) {
            const panneau = ouvert[p.email];
            const etape = p.statut || "prospect";
            const estPerdu = etape === "perdu";
            const enInscription = inscrire[p.email] === true;
            return (
              <div key={p.email} style={{ ...CARTE, borderColor: estPerdu ? "rgba(232,131,106,0.35)" : "rgba(200,169,110,0.25)", opacity: estPerdu ? 0.8 : 1 }}>
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

                    {/* 🆕 ENVOYER UN SMS — 05/09.
                        🚨 UN SIMPLE LIEN, PAS UN PANNEAU. Une premiere
                        tentative le 04/09 avait ajoute ici un formulaire
                        complet — etats, fonction d envoi, compteur de
                        caracteres. Resultat : PAGE BLANCHE sur tout le CRM.
                        ⚠️ LE BUILD VERCEL ETAIT VERT et les delimiteurs
                        equilibres : l erreur etait a l EXECUTION, invisible
                        dans les journaux. Le fichier a du etre restaure
                        depuis le commit du 14/08.

                        Ici, rien ne s execute : un lien porte le numero et
                        le nom vers app/organisme/sms/page.tsx, qui fait
                        tout le travail. Si cet ecran-la casse un jour, le
                        CRM continue de fonctionner.

                        ⚠️ PAS DE LIEN SUR UNE FICHE DESINSCRITE. Quelqu un
                        qui a demande a ne plus recevoir de messages ne doit
                        pas en recevoir par un autre canal. */}
                    {p.telephone && !p.desinscrit && (
                      <a
                        href={"/organisme/sms?numero=" + encodeURIComponent(p.telephone) + "&nom=" + encodeURIComponent(p.nom || p.email || "")}
                        style={{ color: "#7fb3ff", fontSize: "13px", textDecoration: "none", display: "inline-block", marginTop: "6px" }}
                      >
                        Envoyer un SMS →
                      </a>
                    )}
                    {p.desinscrit && (
                      <p style={{ color: "#e8836a", fontSize: "13px", margin: "6px 0 0" }}>
                        Désinscrit — ne reçoit plus de messages
                      </p>
                    )}
                    {p.relance_le && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "4px 0 0" }}>
                        Relancé le {new Date(p.relance_le).toLocaleDateString("fr-FR")}
                        {p.relances ? " · " + p.relances + " au total" : ""}
                      </p>
                    )}
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

                {estPerdu && (
                  <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", padding: "11px 14px", margin: "12px 0 0" }}>
                    <p style={{ color: "#e8836a", fontSize: "13px", fontWeight: "bold", margin: "0 0 3px" }}>
                      Affaire perdue{p.perdu_le ? " le " + jolieDate(p.perdu_le) : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
                      {p.motif_perte || "Aucun motif enregistré"}
                    </p>
                    <button
                      onClick={() => rouvrir(p.email)}
                      disabled={occupe !== ""}
                      style={{ ...BOUTON, marginTop: "10px", fontSize: "12.5px", padding: "6px 14px" }}
                    >
                      {occupe === "rouvrir-" + p.email ? "Réouverture…" : "Rouvrir cette fiche"}
                    </button>
                  </div>
                )}

                {p.notes && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {p.notes}
                  </p>
                )}

                {!estPerdu && (
                  <div style={{ display: "flex", gap: "7px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
                    {ETAPES.filter(function (e) { return e.cle !== etape && e.cle !== "perdu"; }).map(function (e) {
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
                )}

                {!estPerdu && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => analyser(p.email)}
                      disabled={occupe !== ""}
                      style={BOUTON}
                    >
                      {occupe === "analyse-" + p.email ? "Analyse…" : "Analyser"}
                    </button>

                    <button
                      onClick={() => relancer(p.email)}
                      disabled={occupe !== ""}
                      style={BOUTON}
                    >
                      {occupe === "relance-" + p.email ? "Rédaction…" : "Rédiger une relance"}
                    </button>

                    <button
                      onClick={() => basculerRelanceAuto(p.email, !p.relance_auto)}
                      disabled={occupe !== ""}
                      style={{ ...BOUTON, color: p.relance_auto ? "#4caf50" : "rgba(255,255,255,0.5)", borderColor: p.relance_auto ? "rgba(76,175,80,0.5)" : "rgba(255,255,255,0.18)" }}
                    >
                      {occupe === "auto-" + p.email
                        ? "…"
                        : p.relance_auto ? "🔔 Relance auto armée" : "🔕 Relance auto désarmée"}
                    </button>

                    {etape !== "client" && (
                      <button
                        onClick={() => setInscrire({ ...inscrire, [p.email]: !enInscription })}
                        style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                      >
                        {enInscription ? "Annuler" : "Inscrire au registre"}
                      </button>
                    )}

                    <button
                      onClick={() => { setFichePerdu(fichePerdu === p.email ? "" : p.email); setMotifChoisi(""); setPrecision(""); setErreur(""); }}
                      disabled={occupe !== ""}
                      style={{ ...BOUTON, color: "#e8836a", borderColor: "rgba(232,131,106,0.4)" }}
                    >
                      Affaire perdue
                    </button>

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
                )}

                {fichePerdu === p.email && !estPerdu && panneauPerte(p.email)}

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
                      {occupe === "convertir-" + p.email ? "Inscription…" : "Confirmer l'inscription"}
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px" }}>
                      {p.formation_interesse ? "sur " + p.formation_interesse : "sans formation précisée"}
                    </span>
                  </div>
                )}

                {panneau && panneau.texte && (
                  <div style={{ marginTop: "14px", background: "#ffffff", borderRadius: "10px", padding: "20px 22px", color: "#1a1a1a" }}>
                    <p style={{ color: "#0a3d2e", fontSize: "13px", fontWeight: "bold", margin: "0 0 10px", letterSpacing: "1px" }}>
                      {panneau.type === "relance" ? "EMAIL DE RELANCE PROPOSÉ" : "ANALYSE COMMERCIALE"}
                    </p>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "1.75" }}>
                      {String(panneau.texte).replace(/\*\*/g, "")}
                    </div>

                    {panneau.type === "relance" && (
                      <>
                        <button
                          onClick={() => envoyer(p.email, String(panneau.texte).replace(/\*\*/g, ""))}
                          disabled={occupe !== "" || p.desinscrit === true}
                          style={{ background: p.desinscrit ? "#ddd" : "#0a3d2e", color: p.desinscrit ? "#999" : "#ffffff", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: p.desinscrit ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", marginTop: "18px", width: "100%" }}
                        >
                          {occupe === "envoi-" + p.email
                            ? "Envoi…"
                            : p.desinscrit
                            ? "Ce prospect s'est désinscrit"
                            : "Envoyer cette relance"}
                        </button>

                        <p style={{ color: "#777", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.6" }}>
                          Relisez avant d'envoyer : c'est ce texte qui partira, signé de votre
                          organisme, avec un lien de désinscription. Vous pouvez aussi le copier
                          dans votre propre messagerie.
                        </p>
                      </>
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
