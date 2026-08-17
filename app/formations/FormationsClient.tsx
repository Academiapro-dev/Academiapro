"use client";
import { useState, useMemo } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const FRT = {
  surTitre: "ACADEMIAPRO",
  formationsDisponibles: "formations disponibles",
  recherche: "Rechercher une formation...",
  reinitialiser: "Reinitialiser",
  aucun: "Aucune formation trouvee",
  precedent: "Precedent",
  suivant: "Suivant",
  voir: "Voir la formation",
};

const DOMAINES = ["Tous", "IA", "Business", "Marketing", "Langues", "Bien-etre", "Securite", "Tech", "Design", "Finance", "Droit", "Outils"];
const NIVEAUX = ["Tous", "Debutant", "Intermediaire", "Avance", "Expert", "Tous niveaux"];
const PAR_PAGE = 20;

const COULEURS: Record<string, string> = {
  "IA": "#c8a96e",
  "Business": "#4a9eff",
  "Marketing": "#f97316",
  "Langues": "#22c55e",
  "Bien-etre": "#a855f7",
  "Securite": "#ef4444",
  "Tech": "#06b6d4",
  "Design": "#ec4899",
  "Finance": "#eab308",
  "Droit": "#64748b",
  "Outils": "#94a3b8",
};

export default function FormationsClient({ formations }: { formations: any[] }) {
  const { txt: txtT } = useTraductionAuto(FRT);
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [niveau, setNiveau] = useState("Tous");
  const [page, setPage] = useState(1);

  // LE COMPTE PAR DOMAINE ET PAR NIVEAU.
  //
  // Un catalogue de 331 formations sans compteur oblige a cliquer pour
  // savoir s il y a deux ou quarante titres derriere un filtre. Le nombre
  // affiche a cote de chaque bouton donne le volume d un coup d oeil.
  //
  // ⚠️ LE COMPTE TIENT COMPTE DES AUTRES FILTRES ACTIFS. Si un niveau est
  // choisi, le compte des domaines ne montre que les formations de ce
  // niveau : sans cela, un bouton annoncerait douze titres et l ecran n en
  // afficherait aucun. Un compteur qui ment est pire que pas de compteur.
  const comptesDomaine = useMemo(() => {
    const base = formations.filter((f) => {
      const r = recherche.toLowerCase();
      const matchR = !r || f.titre.toLowerCase().includes(r) || f.code.toLowerCase().includes(r);
      const matchN = niveau === "Tous" || f.niveau === niveau;
      return matchR && matchN;
    });
    const c: Record<string, number> = { Tous: base.length };
    for (const f of base) {
      if (f.domaine) c[f.domaine] = (c[f.domaine] || 0) + 1;
    }
    return c;
  }, [formations, recherche, niveau]);

  const comptesNiveau = useMemo(() => {
    const base = formations.filter((f) => {
      const r = recherche.toLowerCase();
      const matchR = !r || f.titre.toLowerCase().includes(r) || f.code.toLowerCase().includes(r);
      const matchD = domaine === "Tous" || f.domaine === domaine;
      return matchR && matchD;
    });
    const c: Record<string, number> = { Tous: base.length };
    for (const f of base) {
      if (f.niveau) c[f.niveau] = (c[f.niveau] || 0) + 1;
    }
    return c;
  }, [formations, recherche, domaine]);

  const filtrees = useMemo(() => {
    return formations.filter((f) => {
      const matchR = f.titre.toLowerCase().includes(recherche.toLowerCase()) || f.code.toLowerCase().includes(recherche.toLowerCase());
      const matchD = domaine === "Tous" || f.domaine === domaine;
      const matchN = niveau === "Tous" || f.niveau === niveau;
      return matchR && matchD && matchN;
    });
  }, [recherche, domaine, niveau, formations]);

  const totalPages = Math.ceil(filtrees.length / PAR_PAGE);
  const paginees = filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const reset = () => {
    setRecherche("");
    setDomaine("Tous");
    setNiveau("Tous");
    setPage(1);
  };

  // 🚨 LE LIEN D UNE FICHE S ECRIT EN MAJUSCULES — corrige le 17/08.
  //
  // Ce catalogue construisait ses liens avec `f.code.toLowerCase()`, donc
  // /formation/f005. Or LE SITEMAP ET LA CANONIQUE declarent tous deux le
  // code TEL QU IL EST EN BASE, c est-a-dire /formation/F005 en majuscules.
  //
  // Google suivait donc des liens internes vers une adresse dont la
  // canonique pointait ailleurs — d ou l avertissement recu de la Search
  // Console : « Page en double : Google n a pas choisi la meme URL canonique
  // que l utilisateur », et dix-neuf pages en double sans canonique retenue.
  //
  // Les deux adresses continuent de fonctionner : la route et le layout
  // mettent le code en majuscules avant de chercher en base. Mais UNE SEULE
  // doit etre celle vers laquelle on pointe, et c est celle du sitemap.
  function lienFiche(code: string): string {
    return "/formation/" + String(code || "").trim().toUpperCase();
  }

  // Un bouton de filtre avec son compte. Un domaine vide se grise et ne se
  // clique pas : il n y a rien derriere.
  function pastille(valeur: string, actif: boolean, compte: number, onClick: any) {
    const vide = compte === 0 && !actif;
    return (
      <button
        key={valeur}
        onClick={vide ? undefined : onClick}
        disabled={vide}
        style={{
          background: actif ? "#c8a96e" : "#050508",
          color: actif ? "#050508" : (vide ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)"),
          border: "1px solid " + (vide ? "rgba(200,169,110,0.12)" : "rgba(200,169,110,0.3)"),
          borderRadius: "20px",
          padding: "5px 14px",
          fontSize: "12px",
          cursor: vide ? "default" : "pointer",
          fontWeight: actif ? "bold" : "normal",
        }}
      >
        {valeur}
        <span style={{ opacity: actif ? 0.75 : 0.5, marginLeft: "6px" }}>{compte}</span>
      </button>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "#0d0d14", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 8px" }}>{filtrees.length} Formations</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0" }}>Attestation de fin de formation - Retractation 14 jours</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "1px solid rgba(200,169,110,0.2)" }}>
          <input
            type="text"
            placeholder={txtT.recherche}
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            style={{ width: "100%", background: "#050508", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
          />

          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>DOMAINE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {DOMAINES.map((d) =>
                pastille(d, domaine === d, comptesDomaine[d] || 0, () => { setDomaine(d); setPage(1); })
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 8px" }}>NIVEAU</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {NIVEAUX.map((n) =>
                  pastille(n, niveau === n, comptesNiveau[n] || 0, () => { setNiveau(n); setPage(1); })
                )}
              </div>
            </div>
            {(recherche || domaine !== "Tous" || niveau !== "Tous") && (
              <button onClick={reset} style={{ background: "transparent", color: "#c8a96e", border: "1px solid #c8a96e", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer" }}>{txtT.reinitialiser}</button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {paginees.map((f: any) => (
            <a key={f.code} href={lienFiche(f.code)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a2e", borderRadius: "10px", padding: "16px 20px", border: "1px solid rgba(200,169,110,0.15)", textDecoration: "none", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <span style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", minWidth: "48px" }}>{f.code}</span>
                <span style={{ color: "#fff", fontSize: "15px", flex: 1 }}>{f.titre}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ background: (COULEURS[f.domaine] || "#c8a96e") + "22", color: COULEURS[f.domaine] || "#c8a96e", padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>{f.domaine}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", minWidth: "60px", textAlign: "right" }}>{f.duree}</span>
                <span style={{ color: "#c8a96e", fontSize: "16px", fontWeight: "bold", minWidth: "70px", textAlign: "right" }}>{f.prix} €</span>
                <span style={{ color: "#c8a96e", fontSize: "18px" }}>&rsaquo;</span>
              </div>
            </a>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: page === 1 ? "#1a1a2e" : "#c8a96e", color: page === 1 ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === 1 ? "default" : "pointer", fontWeight: "bold" }}>{txtT.precedent}</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ background: page === p ? "#c8a96e" : "#1a1a2e", color: page === p ? "#050508" : "rgba(255,255,255,0.6)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: page === p ? "bold" : "normal" }}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: page === totalPages ? "#1a1a2e" : "#c8a96e", color: page === totalPages ? "rgba(255,255,255,0.3)" : "#050508", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: page === totalPages ? "default" : "pointer", fontWeight: "bold" }}>{txtT.suivant}</button>
          </div>
        )}

        {filtrees.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Aucune formation trouvee.</p>
            <button onClick={reset} style={{ marginTop: "16px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>Voir toutes les formations</button>
          </div>
        )}

        {/* CE QUE VOUS CHERCHEZ N EST PAS AU CATALOGUE.
            Chaque visite qui ne trouve pas son sujet doit devenir une
            demande, pas un depart. La promesse est tenable et verifiable —
            le sur-mesure sous une semaine est ce qu aucun concurrent ne
            sait faire. */}
        <div style={{ background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "16px", padding: "36px 28px", marginTop: "40px", textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "23px", margin: "0 0 12px" }}>
            Vous ne trouvez pas votre sujet ?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.8", margin: "0 auto 24px", maxWidth: "620px" }}>
            Dites-nous ce que vos stagiaires doivent savoir faire, et nous produisons la
            formation sur mesure — modules, exercices corrigés, questionnaires et manuel.
            Comptez une semaine.
          </p>
          <a
            href="mailto:contact@academiapro.fr?subject=Formation%20sur%20mesure&body=Bonjour%2C%0A%0AJe%20cherche%20une%20formation%20sur%20le%20sujet%20suivant%20%3A%0A%0ADuree%20souhaitee%20%3A%20%0APublic%20vise%20%3A%20%0A%0AMerci."
            style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "15px 32px", borderRadius: "9px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}
          >
            Demander cette formation
          </a>
        </div>
      </div>
    </div>
  );
}
