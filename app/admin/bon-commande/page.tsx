"use client";
import { useState, useEffect } from "react";

export default function PageBonCommande() {
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [tenant, setTenant] = useState("");
  const [lancement, setLancement] = useState(true);
  const [frais, setFrais] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) setOrganismes(data.organismes || []);
    } catch (e) {}
  }

  async function editer() {
    if (tenant.trim().length < 10) {
      setErreur("Choisissez un client.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/bon-commande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.trim(),
          lancement: lancement,
          frais_installation: frais,
        }),
      });

      if (!r.ok) {
        let detail = "code " + r.status;
        try {
          const err = await r.json();
          detail = err.erreur || detail;
        } catch (e) {}
        setErreur(detail);
        setOccupe(false);
        return;
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "bon-commande.pdf";
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      window.URL.revokeObjectURL(url);

      setMessage("Bon de commande edite. Il est enregistre au registre : vous pouvez le faire signer depuis les documents de ce client.");
      await charger();
    } catch (e: any) {
      setErreur("Edition impossible : " + String(e));
    }
    setOccupe(false);
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "6px",
  };

  const choisi = organismes.find(function (o) { return o.tenant_id === tenant; });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/admin/organismes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux organismes
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CONTRACTUALISATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Bon de commande</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Edite depuis la fiche du client, signable electroniquement
        </p>

        <div style={{ ...CARTE, marginTop: "26px" }}>
          <span style={LIBELLE}>Pour quel client ?</span>
          <select value={tenant} onChange={(e) => setTenant(e.target.value)} style={CHAMP}>
            <option value="">— choisir un client —</option>
            {organismes.map(function (o) {
              return (
                <option key={o.tenant_id} value={o.tenant_id}>
                  {o.raison_sociale}
                  {o.abonnement_mensuel ? " — " + o.abonnement_mensuel + " EUR/mois" : " — abonnement non fixe"}
                </option>
              );
            })}
          </select>

          <div
            onClick={() => setLancement(!lancement)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px", borderRadius: "8px", cursor: "pointer", background: lancement ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: lancement ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "16px" }}
          >
            <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: lancement ? "#c8a96e" : "transparent", border: lancement ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
              {lancement ? "✓" : ""}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", lineHeight: "1.6" }}>
              Appliquer le tarif de lancement, moitie prix jusqu a la date inscrite a sa fiche
            </span>
          </div>

          <span style={LIBELLE}>Frais de mise en service (EUR)</span>
          <input
            value={frais}
            onChange={(e) => setFrais(e.target.value)}
            placeholder="1500"
            style={CHAMP}
          />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "-8px 0 16px", lineHeight: "1.7" }}>
            Factures une seule fois a la signature. Ils couvrent l ouverture du compte, la
            configuration du catalogue et des prix, la mise a ses couleurs et la reprise de ses
            donnees. Comptez de 1 500 a 3 000 EUR selon le travail. Laissez vide pour ne rien
            facturer : le bloc n apparaitra pas sur le bon.
          </p>

          {choisi && (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 4px", lineHeight: "1.7" }}>
                {choisi.raison_sociale}
                {choisi.siret ? " · SIRET " + choisi.siret : " · SIRET manquant"}
                {choisi.numero_tva ? " · TVA " + choisi.numero_tva : " · TVA manquante"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.7" }}>
                {choisi.abonnement_mensuel ? choisi.abonnement_mensuel + " EUR/mois" : "abonnement non fixe"}
                {" · " + (choisi.taux_prelevement !== null && choisi.taux_prelevement !== undefined ? choisi.taux_prelevement : 35) + " % sur le catalogue"}
                {" · plancher " + (choisi.plancher_stagiaire !== null && choisi.plancher_stagiaire !== undefined ? choisi.plancher_stagiaire : 30) + " EUR"}
                {" · apport " + (choisi.taux_apport !== null && choisi.taux_apport !== undefined ? choisi.taux_apport : 50) + " %"}
                {choisi.lancement_jusqu_au ? " · lancement jusqu au " + new Date(choisi.lancement_jusqu_au).toLocaleDateString("fr-FR") : " · pas de date de lancement"}
                {" · " + (choisi.formations_ouvertes || 0) + " formation(s) ouverte(s)"}
              </p>
            </div>
          )}

          <button
            onClick={editer}
            disabled={occupe || !tenant}
            style={{ background: occupe || !tenant ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !tenant ? "#8a8a8a" : "#050508", padding: "15px 30px", borderRadius: "8px", border: "none", cursor: occupe || !tenant ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Edition..." : "Editer le bon de commande"}
          </button>
        </div>

        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{message}</p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{erreur}</p>
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.75" }}>
            Le bon reprend automatiquement la fiche du client, ses termes contractuels et la liste
            des formations qui lui sont ouvertes avec leur prix.
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0, lineHeight: "1.75" }}>
            Il refuse de s editer si l abonnement, la date de fin du tarif de lancement ou l email
            de contact manquent : ce sont les trois mentions qui vous protegent. Une fois edite, il
            apparait dans les documents du client, ou le bouton « Faire signer » lui envoie un lien
            de signature electronique.
          </p>
        </div>
      </div>
    </div>
  );
}
