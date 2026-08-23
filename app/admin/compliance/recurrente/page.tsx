"use client";
import { useState, useEffect } from "react";

// LA FACTURATION RECURRENTE.
//
// 🚨 UN ABONNEMENT N EST PAS UNE FACTURE, C EST UN MODELE. Il ne porte ni
// numero ni statut comptable, il ne figure dans aucune liste de factures et
// n entre dans aucun total. C est un moule dont on tire une vraie facture a
// chaque echeance.
//
// L INDICATEUR QUI COMPTE : le chiffre d affaires recurrent mensuel. C est
// ce qu un cabinet regarde en premier — combien rentre chaque mois sans
// avoir rien a faire.

const TAUX = [20, 10, 5.5, 2.1, 0];

export default function Recurrente() {
  const [d, setD] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [fiche, setFiche] = useState<any>(null);
  const [depliee, setDepliee] = useState<any>(null);

  useEffect(function () { charger(); }, []);

  async function charger() {
    setCharge(true);
    setErreur("");
    try {
      const r = await fetch("/api/compliance/recurrente", { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function agir(corps: any, nom: string) {
    setOccupe(nom);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/compliance/recurrente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message || "Enregistré.");
        await charger();
      } else {
        setErreur(data.erreur || "Action impossible.");
      }
      setOccupe("");
      return data;
    } catch (e: any) {
      setErreur("Action impossible : " + String(e));
      setOccupe("");
      return null;
    }
  }

  async function enregistrer() {
    if (!fiche) return;
    const data = await agir({ action: "enregistrer", ...fiche }, "save");
    if (data && data.ok) setFiche(null);
  }

  function nouvelle() {
    setFiche({
      libelle: "",
      client_nom: "",
      client_email: "",
      objet: "",
      frequence: "mensuelle",
      jour_du_mois: 1,
      delai_paiement: 30,
      autoliquidation: false,
      envoi_auto: false,
      lignes: [{ designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, taux_tva: 20 }],
    });
    setErreur("");
    setMessage("");
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(x: any) {
    if (!x) return "";
    try { return new Date(x).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";
  const ROUGE = "#e8836a";

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" };
  const CARTE: any = { background: "#1a1a2e", borderRadius: "10px", padding: "16px 18px", marginBottom: "12px", border: "1px solid rgba(200,169,110,0.15)" };
  const BOUTON: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,169,110,0.3)", color: OR, padding: "8px 15px", borderRadius: "18px", cursor: "pointer", fontSize: "12.5px", fontFamily: "Georgia,serif" };
  const PLEIN: any = { background: OR, color: "#050508", border: "none", padding: "12px 22px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif" };
  const CHAMP: any = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff", fontSize: "13.5px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LABEL: any = { color: OR, fontSize: "12px", display: "block", marginBottom: "5px" };

  const liste = d && d.abonnements ? d.abonnements : [];
  const c = d && d.compteurs ? d.compteurs : null;
  const freq = d && d.frequences ? d.frequences : {};

  function totalFiche() {
    if (!fiche) return { ht: 0, tva: 0, ttc: 0 };
    let ht = 0, tva = 0;
    for (const l of fiche.lignes || []) {
      const brut = (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0);
      const net = brut * (1 - (Number(l.remise_pct) || 0) / 100);
      const t = fiche.autoliquidation ? 0 : (Number(l.taux_tva) || 0);
      ht = ht + net;
      tva = tva + net * t / 100;
    }
    return { ht: ht, tva: tva, ttc: ht + tva };
  }

  const tot = totalFiche();

  return (
    <div style={CADRE}>

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "30px 20px" }}>
        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>
        <h1 style={{ color: OR, margin: "12px 0 0", fontSize: "24px" }}>🔁 Facturation récurrente</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "5px 0 0", fontSize: "13px" }}>
          Les honoraires qui reviennent chaque mois, saisis une seule fois
        </p>
      </div>

      <div style={{ padding: "25px 20px", maxWidth: "1000px", margin: "0 auto" }}>

        {message && (
          <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: VERT, fontSize: "13px", lineHeight: "1.7" }}>
            {message}
          </div>
        )}
        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: ROUGE, fontSize: "13px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {c && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { v: euros(c.recurrent_mensuel), t: "Récurrent par mois HT", col: VERT },
              { v: euros(c.recurrent_annuel), t: "Sur l'année", col: OR },
              { v: nombre(c.actifs), t: "Abonnements actifs", col: BLEU },
              { v: nombre(c.dus), t: "À facturer maintenant", col: c.dus > 0 ? ORANGE : "rgba(255,255,255,0.4)" },
            ].map(function (x) {
              return (
                <div key={x.t} style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "10px", padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "19px", fontWeight: "bold", color: x.col }}>{x.v}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "5px" }}>{x.t}</div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={nouvelle} style={{ ...PLEIN, marginBottom: "18px" }}>
          ➕ Nouvel abonnement
        </button>

        {charge && !d ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
        ) : liste.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
              Aucun abonnement. Créez le premier : les honoraires d'un client qui revient
              chaque mois se saisissent une fois, et la facture part toute seule.
            </p>
          </div>
        ) : (
          liste.map(function (a: any) {
            const ouvert = depliee === a.id;
            const suspendu = !a.actif || a.expire;
            return (
              <div key={a.id} style={{
                ...CARTE,
                opacity: suspendu ? 0.6 : 1,
                border: a.due ? "1px solid rgba(232,163,61,0.5)" : CARTE.border,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                      {a.libelle}
                    </div>
                    <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                      {a.client_nom}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", marginTop: "5px" }}>
                      {(freq[a.frequence] && freq[a.frequence].nom) || a.frequence}
                      {" · le " + a.jour_du_mois + " du mois"}
                      {a.nb_emises > 0 ? " · " + a.nb_emises + " facture(s) émise(s)" : ""}
                      {a.envoi_auto ? " · envoi automatique" : " · reste en brouillon"}
                    </div>
                    <div style={{ color: a.due ? ORANGE : "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                      {suspendu
                        ? (a.expire ? "Terminé le " + jolieDate(a.date_fin) : "Suspendu")
                        : a.due
                          ? "À facturer — échéance du " + jolieDate(a.prochaine_emission)
                          : "Prochaine facture le " + jolieDate(a.prochaine_emission)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#fff", fontSize: "19px", fontWeight: "bold" }}>
                      {euros(a.total_ttc)}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px" }}>
                      {euros(a.total_ht)} HT
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                  {!suspendu && (
                    <>
                      {/* 🚨 DEUX BOUTONS DISTINCTS, ET C EST VOULU. « Préparer »
                          fait un brouillon relisible ; « Émettre » attribue le
                          numéro et fige le document. Les confondre ferait naître
                          des factures qu on n a pas relues. */}
                      <button onClick={() => agir({ action: "emettre", id: a.id, emettre: false }, "b-" + a.id)}
                        disabled={occupe !== ""} style={BOUTON}>
                        {occupe === "b-" + a.id ? "…" : "Préparer un brouillon"}
                      </button>
                      <button onClick={() => agir({ action: "emettre", id: a.id, emettre: true }, "e-" + a.id)}
                        disabled={occupe !== ""}
                        style={{ ...BOUTON, background: "rgba(0,230,118,0.13)", color: VERT, borderColor: "rgba(0,230,118,0.4)" }}>
                        {occupe === "e-" + a.id ? "…" : "Émettre maintenant"}
                      </button>
                    </>
                  )}
                  <button onClick={() => setFiche({ ...a, lignes: Array.isArray(a.lignes) ? a.lignes : [] })} style={BOUTON}>
                    Modifier
                  </button>
                  <button onClick={() => agir({ action: "basculer", id: a.id }, "t-" + a.id)}
                    disabled={occupe !== ""} style={BOUTON}>
                    {a.actif ? "Suspendre" : "Reprendre"}
                  </button>
                  <button onClick={() => setDepliee(ouvert ? null : a.id)} style={BOUTON}>
                    {ouvert ? "Masquer le détail" : "Voir le détail"}
                  </button>
                  <button onClick={() => agir({ action: "supprimer", id: a.id }, "s-" + a.id)}
                    disabled={occupe !== ""}
                    style={{ ...BOUTON, color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                    Supprimer
                  </button>
                </div>

                {ouvert && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {(Array.isArray(a.lignes) ? a.lignes : []).map(function (l: any, i: number) {
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "12.5px", padding: "5px 0" }}>
                          <span style={{ color: "rgba(255,255,255,0.75)" }}>
                            {l.designation}
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>
                              {" · " + l.quantite + (l.unite ? " " + l.unite : "") + " × " + euros(l.prix_unitaire)}
                              {(Number(l.remise_pct) || 0) > 0 ? " − " + l.remise_pct + " %" : ""}
                              {" · TVA " + l.taux_tva + " %"}
                            </span>
                          </span>
                          <span style={{ color: "#fff", fontWeight: "bold" }}>{euros(l.total_ht)}</span>
                        </div>
                      );
                    })}
                    {a.objet && (
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: "10px 0 0" }}>
                        Objet : {a.objet} — la période facturée s'ajoute automatiquement.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ---------- LA FICHE D ABONNEMENT ---------- */}
      {fiche && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div style={{ background: "#12121f", border: "1px solid rgba(200,169,110,0.4)", borderRadius: "12px", padding: "22px", maxWidth: "620px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "6px" }}>
              {fiche.id ? "MODIFIER L'ABONNEMENT" : "NOUVEL ABONNEMENT"}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 18px" }}>
              Ce n'est pas une facture : c'est le modèle dont une facture naîtra à chaque
              échéance, avec son propre numéro.
            </p>

            <label style={LABEL}>Nom de l'abonnement *</label>
            <input value={fiche.libelle || ""} onChange={(e) => setFiche({ ...fiche, libelle: e.target.value })}
              placeholder="Honoraires mensuels — Dupont SARL" style={{ ...CHAMP, marginBottom: "12px" }} />

            <label style={LABEL}>Nom du client *</label>
            <input value={fiche.client_nom || ""} onChange={(e) => setFiche({ ...fiche, client_nom: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            <label style={LABEL}>Adresse électronique</label>
            <input value={fiche.client_email || ""} onChange={(e) => setFiche({ ...fiche, client_email: e.target.value })}
              style={{ ...CHAMP, marginBottom: "12px" }} />

            <label style={LABEL}>Objet de la facture</label>
            <input value={fiche.objet || ""} onChange={(e) => setFiche({ ...fiche, objet: e.target.value })}
              placeholder="Tenue comptable" style={{ ...CHAMP, marginBottom: "4px" }} />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11.5px", margin: "0 0 14px" }}>
              La période facturée s'ajoutera automatiquement : « Tenue comptable — mars 2026 ».
            </p>

            {/* ---- LA PERIODICITE ---- */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={LABEL}>Fréquence</label>
                <select value={fiche.frequence} onChange={(e) => setFiche({ ...fiche, frequence: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }}>
                  {Object.keys(freq).map(function (k) {
                    return <option key={k} value={k}>{freq[k].nom}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <label style={LABEL}>Jour du mois</label>
                <input type="number" min="1" max="31" value={fiche.jour_du_mois}
                  onChange={(e) => setFiche({ ...fiche, jour_du_mois: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={LABEL}>Délai de paiement</label>
                <input type="number" min="0" value={fiche.delai_paiement}
                  onChange={(e) => setFiche({ ...fiche, delai_paiement: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 150px" }}>
                <label style={LABEL}>Début</label>
                <input type="date" value={fiche.date_debut ? String(fiche.date_debut).slice(0, 10) : ""}
                  onChange={(e) => setFiche({ ...fiche, date_debut: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "12px" }} />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label style={LABEL}>Fin (facultative)</label>
                <input type="date" value={fiche.date_fin ? String(fiche.date_fin).slice(0, 10) : ""}
                  onChange={(e) => setFiche({ ...fiche, date_fin: e.target.value })}
                  style={{ ...CHAMP, marginBottom: "14px" }} />
              </div>
            </div>

            {/* ---- LES LIGNES ---- */}
            <div style={{ color: OR, fontSize: "12px", letterSpacing: "1.5px", marginBottom: "10px" }}>
              CE QUI EST FACTURÉ
            </div>

            {(fiche.lignes || []).map(function (l: any, i: number) {
              return (
                <div key={i} style={{ padding: "12px", background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "8px", marginBottom: "10px" }}>
                  <input value={l.designation || ""}
                    onChange={(e) => {
                      const n = [...fiche.lignes];
                      n[i] = { ...n[i], designation: e.target.value };
                      setFiche({ ...fiche, lignes: n });
                    }}
                    placeholder="Désignation" style={{ ...CHAMP, marginBottom: "9px" }} />

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 80px" }}>
                      <label style={{ ...LABEL, fontSize: "11px" }}>Qté</label>
                      <input type="number" step="0.01" value={l.quantite}
                        onChange={(e) => {
                          const n = [...fiche.lignes];
                          n[i] = { ...n[i], quantite: e.target.value };
                          setFiche({ ...fiche, lignes: n });
                        }} style={CHAMP} />
                    </div>
                    <div style={{ flex: "1 1 110px" }}>
                      <label style={{ ...LABEL, fontSize: "11px" }}>Prix HT</label>
                      <input type="number" step="0.01" value={l.prix_unitaire}
                        onChange={(e) => {
                          const n = [...fiche.lignes];
                          n[i] = { ...n[i], prix_unitaire: e.target.value };
                          setFiche({ ...fiche, lignes: n });
                        }} style={CHAMP} />
                    </div>
                    <div style={{ flex: "1 1 90px" }}>
                      <label style={{ ...LABEL, fontSize: "11px" }}>Remise %</label>
                      <input type="number" step="0.01" value={l.remise_pct}
                        onChange={(e) => {
                          const n = [...fiche.lignes];
                          n[i] = { ...n[i], remise_pct: e.target.value };
                          setFiche({ ...fiche, lignes: n });
                        }} style={CHAMP} />
                    </div>
                    <div style={{ flex: "1 1 100px" }}>
                      <label style={{ ...LABEL, fontSize: "11px" }}>TVA</label>
                      <select value={l.taux_tva} disabled={fiche.autoliquidation}
                        onChange={(e) => {
                          const n = [...fiche.lignes];
                          n[i] = { ...n[i], taux_tva: e.target.value };
                          setFiche({ ...fiche, lignes: n });
                        }} style={CHAMP}>
                        {TAUX.map(function (t) {
                          return <option key={t} value={t}>{t} %</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {(fiche.lignes || []).length > 1 && (
                    <button
                      onClick={() => setFiche({ ...fiche, lignes: fiche.lignes.filter(function (_: any, j: number) { return j !== i; }) })}
                      style={{ background: "none", border: "none", color: ROUGE, cursor: "pointer", fontSize: "12px", marginTop: "8px", padding: 0 }}>
                      Retirer cette ligne
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setFiche({ ...fiche, lignes: [...(fiche.lignes || []), { designation: "", quantite: 1, prix_unitaire: 0, remise_pct: 0, taux_tva: fiche.autoliquidation ? 0 : 20 }] })}
              style={{ ...BOUTON, marginBottom: "14px" }}>
              ➕ Ajouter une ligne
            </button>

            <div style={{ padding: "12px 14px", background: "rgba(200,169,110,0.08)", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Total HT</span>
                <span style={{ color: "#fff" }}>{euros(tot.ht)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>TVA</span>
                <span style={{ color: "#fff" }}>{euros(tot.tva)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", paddingTop: "7px", borderTop: "1px solid rgba(200,169,110,0.25)", marginTop: "5px" }}>
                <span style={{ color: OR }}>Par échéance</span>
                <span style={{ color: OR }}>{euros(tot.ttc)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
              <button onClick={() => setFiche({ ...fiche, autoliquidation: !fiche.autoliquidation })}
                style={{ ...BOUTON, flex: "1 1 170px", background: fiche.autoliquidation ? "rgba(232,163,61,0.15)" : BOUTON.background, color: fiche.autoliquidation ? ORANGE : OR }}>
                {fiche.autoliquidation ? "✓ Autoliquidation" : "TVA facturée"}
              </button>
              <button onClick={() => setFiche({ ...fiche, envoi_auto: !fiche.envoi_auto })}
                style={{ ...BOUTON, flex: "1 1 170px", background: fiche.envoi_auto ? "rgba(0,230,118,0.15)" : BOUTON.background, color: fiche.envoi_auto ? VERT : OR }}>
                {fiche.envoi_auto ? "✓ Envoi automatique" : "Reste en brouillon"}
              </button>
            </div>

            {/* 🚨 L AVERTISSEMENT SUR L ENVOI AUTOMATIQUE. Un cabinet qui
                découvre qu'une facture est partie sans son accord coupe la
                fonction et ne la rallume jamais. */}
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "0 0 16px" }}>
              {fiche.envoi_auto
                ? "La facture sera émise, numérotée et envoyée au client à chaque échéance, sans intervention de votre part."
                : "À chaque échéance, un brouillon sera créé. Vous le relirez puis l'émettrez depuis « Devis et factures »."}
            </p>

            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <button onClick={enregistrer} disabled={occupe !== "" || !fiche.client_nom || !fiche.libelle}
                style={{ ...PLEIN, flex: "2 1 180px", opacity: (fiche.client_nom && fiche.libelle) ? 1 : 0.4 }}>
                {occupe === "save" ? "Enregistrement…" : "Enregistrer l'abonnement"}
              </button>
              <button onClick={() => setFiche(null)} style={{ ...BOUTON, flex: "1 1 110px", borderRadius: "8px", padding: "12px" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
