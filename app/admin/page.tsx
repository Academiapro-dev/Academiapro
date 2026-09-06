"use client";
import React, { useState, useEffect } from "react";

const GROUPES = [
  {
    titre: "Catalogue et LMS",
    liens: [
      { nom: "Modules et formations", href: "/admin/module" },
      { nom: "Sessions", href: "/admin/sessions" },
      { nom: "Certificats", href: "/admin/certificats" },
      { nom: "Téléchargements", href: "/admin/telechargements" },
      { nom: "Gamification", href: "/admin/gamification" },
      { nom: "Relance des apprenants inactifs", href: "/admin/remotivation" },
      { nom: "CAM — génération et pilotage des agents", href: "/admin/cam" },
      { nom: "Maintenance", href: "/maintenance" },
    ],
  },
  {
    titre: "Commercial",
    liens: [
      { nom: "CRM et prospects", href: "/admin/crm" },
      { nom: "Organismes clients", href: "/admin/organismes" },
      { nom: "Contrats", href: "/admin/contrats" },
      { nom: "Bons de commande", href: "/admin/bon-commande" },
      { nom: "Modèles de documents", href: "/admin/modeles" },
      { nom: "Coffre", href: "/admin/coffre" },
      { nom: "Agent commercial", href: "/admin/agent-commercial" },
      { nom: "Agents", href: "/admin/agents" },
      { nom: "Marque blanche", href: "/admin/domaines" },
    ],
  },
  {
    titre: "Facturation",
    liens: [
      { nom: "Facturation", href: "/admin/facturation" },
      // 🆕 06/09 — LES COMMANDES DE CREDITS SMS ET MINUTES.
      //
      // 🚨 SANS CE LIEN, L ECRAN N EXISTE PAS. Il porte le SEUL geste du
      // code qui ajoute reellement des credits a un organisme : tant qu il
      // n est pas fait, un client qui a paye n a rien recu.
      //
      // ⚠️ EN B2B LE REGLEMENT SE FAIT PAR VIREMENT : le client commande,
      // Jacques facture, et credite a reception. Rien n est automatique, et
      // c est voulu — crediter a la commande reviendrait a livrer avant
      // d etre paye.
      { nom: "Commandes de crédits", href: "/admin/credits" },
    ],
  },
  {
    titre: "Comptabilité",
    liens: [
      { nom: "Dépenses et justificatifs", href: "/admin/comptabilite" },
      { nom: "Mr. Comptable", href: "/admin/mr-comptable" },
    ],
  },
  {
    titre: "Conformité et international",
    liens: [
      { nom: "Compliance", href: "/admin/compliance" },
      { nom: "Structures internationales", href: "/admin/holding" },
      { nom: "Mr. Juridique", href: "/admin/mr-juridique" },
    ],
  },
  {
    titre: "Qualiopi",
    liens: [
      { nom: "Qualiopi — préparer ma certification", href: "/admin/qualiopi" },
    ],
  },
  {
    titre: "Communication",
    liens: [
      { nom: "Marketing", href: "/admin/marketing" },
      { nom: "Emailing", href: "/admin/emailing" },
      { nom: "Emails automatiques", href: "/admin/emails" },
      { nom: "Réseaux sociaux", href: "/admin/reseaux-sociaux" },
      { nom: "Blog", href: "/admin/blog" },
    ],
  },
  {
    titre: "Technique",
    liens: [
      { nom: "Analyses", href: "/admin/analytics" },
      { nom: "Diagnostic", href: "/admin/diagnostic" },
      { nom: "Usage de l'IA", href: "/admin/usage-ia" },
    ],
  },
];

export default function AdminPage() {
  const [ind, setInd] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  // 🆕 LES COMMANDES DE CREDITS EN ATTENTE — 06/09.
  //
  // ⚠️ AFFICHEES SUR LE LIEN LUI-MEME, pas dans une carte separee. Une
  // commande payee et non creditee est un client qui attend : elle doit se
  // voir en arrivant, sans avoir a ouvrir l ecran.
  const [credits, setCredits] = useState(0);

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/indicateurs", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setInd(d.indicateurs);
        setDetail(d.detail);
      } else {
        setErreur(d.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur(String(e));
    }

    // ⚠️ DANS SON PROPRE ESSAI : si les commandes echouent, les
    // indicateurs doivent quand meme s afficher.
    try {
      const rc = await fetch("/api/admin/credits", { cache: "no-store" });
      const dc = await rc.json();
      if (dc && dc.ok && Array.isArray(dc.commandes)) {
        setCredits(dc.commandes.filter(function (c: any) {
          return c.statut === "commandee" || c.statut === "facturee";
        }).length);
      }
    } catch (e) {}

    setChargement(false);
  }

  const carte: any = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid rgba(200,169,110,0.3)",
  };

  const bouton: any = {
    display: "block",
    background: "#12121f",
    border: "1px solid rgba(200,169,110,0.35)",
    borderRadius: "10px",
    padding: "16px 18px",
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
  };

  function euros(n: number): string {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  // Les six indicateurs sont desormais calcules depuis la base, plus ecrits
  // en dur. Un chiffre faux vaut moins que pas de chiffre : en cas d erreur
  // de lecture, on affiche un tiret plutot qu un zero rassurant.
  const CARTES = ind
    ? [
        { titre: "Chiffre d'affaires", sous: "Encaissé et facturé, cumulé", valeur: euros(ind.ca_total) },
        { titre: "Apprenants", sous: "Total inscrits", valeur: String(ind.apprenants) },
        { titre: "Formations vendues", sous: "Ce mois", valeur: String(ind.formations_vendues) },
        { titre: "Séances réservées", sous: "Ce mois", valeur: String(ind.seances) },
        { titre: "Attestations délivrées", sous: "Total", valeur: String(ind.certificats) },
        { titre: "Pipeline", sous: "CRM · prospects encore ouverts", valeur: String(ind.pipeline) },
      ]
    : [
        { titre: "Chiffre d'affaires", sous: "Encaissé et facturé, cumulé", valeur: "—" },
        { titre: "Apprenants", sous: "Total inscrits", valeur: "—" },
        { titre: "Formations vendues", sous: "Ce mois", valeur: "—" },
        { titre: "Séances réservées", sous: "Ce mois", valeur: "—" },
        { titre: "Attestations délivrées", sous: "Total", valeur: "—" },
        { titre: "Pipeline", sous: "CRM · prospects encore ouverts", valeur: "—" },
      ];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ADMIN ACADEMIAPRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>Admin AcadémIA Pro</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", margin: "0" }}>Vue globale · CA · Apprenants · Formations · Séances</p>
        </div>

        {/* 🚨 CE QUI ATTEND UNE ACTION SE VOIT EN HAUT — 06/09.
            Une commande payee et non creditee est un client qui attend.
            ⚠️ N APPARAIT QUE S IL Y A QUELQUE CHOSE A FAIRE : un encadre a
            zero tous les matins deviendrait un decor qu on ne lit plus. */}
        {credits > 0 && (
          <a href="/admin/credits" style={{
            display: "block", textDecoration: "none",
            background: "rgba(232,163,61,0.07)",
            border: "1px solid rgba(232,163,61,0.5)",
            borderRadius: "12px", padding: "16px 22px", marginBottom: "24px",
          }}>
            <p style={{ color: "#e8a33d", fontSize: "16px", margin: 0, lineHeight: "1.6" }}>
              <strong>{credits}</strong> commande{credits > 1 ? "s" : ""} de
              crédits à traiter
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
              margin: "4px 0 0", lineHeight: "1.6" }}>
              À facturer, ou à créditer si le virement est arrivé.
            </p>
          </a>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {CARTES.map((i) => (
            <div key={i.titre} style={carte}>
              <h3 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 12px" }}>{i.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>{i.sous}</p>
              <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", margin: "0" }}>
                {chargement ? "…" : i.valeur}
              </p>
            </div>
          ))}
        </div>

        {detail && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "18px", textAlign: "center" }}>
            Dont {euros(detail.ca_encaisse_lemonsqueezy)} encaissés par Lemon Squeezy
            et {euros(detail.ca_facture_llc)} facturés directement.
          </p>
        )}

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "14px", marginTop: "18px", textAlign: "center" }}>
            Indicateurs indisponibles : {erreur}
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={charger}
            style={{ background: "transparent", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "10px 22px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "14px" }}
          >
            Rafraîchir
          </button>
        </div>

        {GROUPES.map((g) => (
          <div key={g.titre} style={{ marginTop: "48px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 6px" }}>{g.titre}</h2>
            <div style={{ height: "1px", background: "rgba(200,169,110,0.25)", marginBottom: "20px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {g.liens.map((l) => (
                <a key={l.nom} href={l.href} style={bouton}>
                  {l.nom}
                  {/* La pastille suit le lien : on voit ce qui attend sans
                      avoir a se souvenir de l encadre du haut. */}
                  {l.href === "/admin/credits" && credits > 0 && (
                    <span style={{ color: "#e8a33d", marginLeft: "8px", fontSize: "13px" }}>
                      · {credits}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
