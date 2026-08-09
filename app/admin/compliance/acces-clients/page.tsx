"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const NOIR = "#050508";

// LES ACCES CLIENTS, VUS PAR LE CABINET.
//
// Le cabinet ouvre un espace a un dirigeant, la plateforme lui envoie son
// lien, et le dirigeant depose ses factures lui-meme. C est le seul moyen
// de cesser de courir apres les justificatifs.
//
// Un acces se revoque d un clic : un dirigeant qui part ne doit plus rien
// voir, et cela sans supprimer l historique de ses depots.

export default function AccesClients() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [choisie, setChoisie] = useState("");
  const [acces, setAcces] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [etat, setEtat] = useState("");
  const [lien, setLien] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(function () { chargerSocietes(); }, []);

  useEffect(function () {
    if (choisie) chargerAcces(choisie);
    else setAcces([]);
  }, [choisie]);

  async function chargerSocietes() {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/societes", { cache: "no-store" });
      const d = await r.json();
      const liste = d.societes || d.data || [];
      setSocietes(liste);
      if (liste.length === 1) setChoisie(liste[0].id);
    } catch (e) {}
    setChargement(false);
  }

  async function chargerAcces(societeId: string) {
    try {
      const r = await fetch("/api/compliance/acces-client?societe=" + encodeURIComponent(societeId), { cache: "no-store" });
      const d = await r.json();
      setAcces(d.ok ? (d.acces || []) : []);
    } catch (e) {
      setAcces([]);
    }
  }

  async function ouvrir() {
    if (!choisie || !email || email.indexOf("@") < 1) {
      setEtat("Choisissez un dossier et saisissez une adresse valable.");
      return;
    }
    setEtat("Ouverture…");
    setLien("");
    try {
      const r = await fetch("/api/compliance/acces-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societe_id: choisie, email: email, nom: nom }),
      });
      const d = await r.json();
      if (d.ok) {
        setEtat(d.message || "Accès ouvert.");
        setLien(d.lien || "");
        setEmail("");
        setNom("");
        chargerAcces(choisie);
      } else {
        setEtat(d.erreur || "Ouverture impossible.");
      }
    } catch (e: any) {
      setEtat("Ouverture impossible.");
    }
  }

  async function revoquer(id: string, adresse: string) {
    if (!confirm("Révoquer l'accès de " + adresse + " ? Son lien cessera de fonctionner.")) return;
    try {
      await fetch("/api/compliance/acces-client?id=" + encodeURIComponent(id), { method: "DELETE" });
      chargerAcces(choisie);
    } catch (e) {}
  }

  const section: any = { maxWidth: "900px", margin: "0 auto", padding: "0 20px" };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "13px",
    padding: "22px",
    marginBottom: "16px",
  };

  const champ: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia, serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  function jour(d: any) {
    if (!d) return "jamais";
    return new Date(d).toLocaleDateString("fr-FR");
  }

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 0" }}>
      <div style={section}>

        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "26px 0 10px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ fontSize: "29px", margin: "0 0 12px" }}>Espaces clients</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.75", margin: "0 0 30px", maxWidth: "660px" }}>
          Ouvrez un espace à un dirigeant : il verra les justificatifs que vous
          attendez et pourra les envoyer en photographiant le document. Il n'a ni
          compte à créer ni mot de passe à retenir.
        </p>

        <div style={carte}>
          <h2 style={{ fontSize: "18px", margin: "0 0 16px" }}>Ouvrir un accès</h2>

          <select
            value={choisie}
            onChange={function (e) { setChoisie(e.target.value); setEtat(""); setLien(""); }}
            style={champ}
          >
            <option value="">
              {chargement ? "Chargement des dossiers…" : "Choisissez un dossier"}
            </option>
            {societes.map(function (s: any) {
              return <option key={s.id} value={s.id}>{s.raison_sociale || s.code}</option>;
            })}
          </select>

          <input
            value={nom}
            onChange={function (e) { setNom(e.target.value); }}
            placeholder="Nom du dirigeant (facultatif)"
            style={champ}
          />

          <input
            type="email"
            value={email}
            onChange={function (e) { setEmail(e.target.value); }}
            placeholder="Son adresse électronique"
            onKeyDown={function (e) { if (e.key === "Enter") ouvrir(); }}
            style={champ}
          />

          <button
            onClick={ouvrir}
            style={{ background: OR, color: NOIR, border: "none", borderRadius: "8px", padding: "13px 28px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", fontFamily: "Georgia, serif" }}
          >
            Ouvrir et envoyer le lien
          </button>

          {etat && (
            <p style={{ color: lien ? "#00e676" : "rgba(255,255,255,0.6)", fontSize: "14px", margin: "14px 0 0" }}>
              {etat}
            </p>
          )}

          {lien && (
            <div style={{ marginTop: "12px", padding: "12px 14px", background: "rgba(0,0,0,0.35)", borderRadius: "8px" }}>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: "0 0 6px" }}>
                Le lien, si vous préférez le transmettre vous-même :
              </p>
              <p style={{ color: OR, fontSize: "12px", margin: 0, wordBreak: "break-all", fontFamily: "monospace" }}>
                {lien}
              </p>
            </div>
          )}
        </div>

        {choisie && (
          <div style={carte}>
            <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>Accès ouverts</h2>

            {acces.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "10px 0 0" }}>
                Aucun accès sur ce dossier.
              </p>
            )}

            {acces.map(function (a: any) {
              return (
                <div key={a.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "15px", color: a.actif ? "#fff" : "rgba(255,255,255,0.35)" }}>
                      {a.nom ? a.nom + " · " : ""}{a.email}
                      {!a.actif && <span style={{ color: "#e8836a", fontSize: "12px", marginLeft: "8px" }}>révoqué</span>}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "4px" }}>
                      ouvert le {jour(a.cree_le)} · dernière visite : {jour(a.derniere_visite)}
                    </div>
                  </div>
                  {a.actif && (
                    <button
                      onClick={function () { revoquer(a.id, a.email); }}
                      style={{ background: "transparent", color: "#e8836a", border: "1px solid rgba(232,131,106,0.35)", borderRadius: "7px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
