"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// LE TELEPHONE — 06/09.
//
// MEME ECRAN QUE /organisme/sms, AUTRE CANAL. Le solde, le numero
// d expedition, et le journal complet.
//
// 🚨 POURQUOI UN ECRAN SEPARE. Le journal d appels vit deja sur chaque
// fiche du CRM, mais fiche par fiche : on ne peut pas y voir ce qui s est
// passe dans la journee, ni ce qu il reste de credit. Un client qui
// consomme des minutes doit pouvoir les compter sans ouvrir trente fiches.
//
// ⚠️ CET ECRAN NE PASSE AUCUN APPEL. Il montre. L appel se lance depuis la
// fiche, la ou l on sait qui l on appelle et pourquoi — un numero compose
// depuis une liste sans contexte ne sert a rien.
//
// ⚠️ IL VIT SOUS /organisme, chemin a session simple : tout utilisateur
// connecte y entre et ne voit que les appels de SON organisme.
// ══════════════════════════════════════════════════════════════════════════

const RESULTATS: any = {
  repondu: { nom: "A répondu", couleur: "#4caf50" },
  absent: { nom: "Absent", couleur: "rgba(255,255,255,0.45)" },
  rappeler: { nom: "À rappeler", couleur: "#e8a33d" },
  refus: { nom: "Ne veut pas", couleur: "#e8836a" },
};

export default function PageTelephone() {
  const [appels, setAppels] = useState<any[]>([]);
  const [numero, setNumero] = useState("");
  const [credits, setCredits] = useState(0);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    // Le numero et le credit viennent de la meme route que les colonnes :
    // elle les renvoie deja, inutile d en appeler une de plus.
    try {
      const r1 = await fetch("/api/organisme/champs", { cache: "no-store" });
      const d1 = await r1.json();
      if (d1 && d1.ok) {
        setNumero(String(d1.tel_numero || ""));
        setCredits(Number(d1.tel_credits_sec || 0));
      } else if (d1 && d1.erreur) {
        setErreur(d1.erreur);
      }
    } catch (e) {}

    try {
      const r2 = await fetch("/api/organisme/appels", { cache: "no-store" });
      const d2 = await r2.json();
      if (d2 && d2.ok && Array.isArray(d2.appels)) setAppels(d2.appels);
    } catch (e) {}

    setCharge(true);
  }

  // ⚠️ LE CREDIT EST EN SECONDES EN BASE — Plivo facture a la seconde. On
  // l affiche en minutes, qui est ce que le client achete.
  const minutes = Math.floor(credits / 60);

  // 🚨 L AVERTISSEMENT DE SOLDE BAS — 06/09.
  //
  // MEME SEUIL QUE LE CRON /api/cron/credits-bas. ⚠️ SI L UN CHANGE,
  // CHANGER L AUTRE : un client averti par courriel qui ne verrait rien
  // sur l ecran douterait de l un comme de l autre.
  //
  // ⚠️ CINQUANTE MINUTES, PAS DIX. Le credit suit le virement : a dix
  // minutes restantes, l avertissement arriverait trop tard pour servir.
  //
  // 🚨 ON N OFFRE RIEN D AVANCE. Jacques, le 06/09 : une avance « ouvre
  // une faille dans la strategie ». La reponse au delai n est pas un
  // cadeau, c est de prevenir a temps.
  const SEUIL_MINUTES = 50;
  const soldeBas = numero !== "" && minutes <= SEUIL_MINUTES;

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "22px 26px", marginBottom: "16px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à mes contacts
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          TÉLÉPHONE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Vos appels
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Les appels se lancent depuis une fiche, avec le bouton
          « Appeler ». Votre téléphone sonne, vous décrochez, et votre
          correspondant est appelé aussitôt.
        </p>

        {/* ---- LE SOLDE BAS ----
            ⚠️ EN PREMIER, ET SEULEMENT S IL Y A LIEU. Un encadre permanent
            deviendrait un decor qu on ne lit plus — et le jour ou il compte
            vraiment, on ne le verrait pas davantage. */}
        {charge && soldeBas && (
          <div style={{ ...CARTE, borderColor: "rgba(232,163,61,0.5)",
            background: "rgba(232,163,61,0.07)" }}>
            <p style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 6px", lineHeight: "1.6" }}>
              Il vous reste <strong>{minutes} minute{minutes > 1 ? "s" : ""}</strong>.
            </p>
            {/* 🚨 LE DELAI EST DIT FRANCHEMENT, ET LA SOLUTION AVEC. Cacher
                que le credit suit le virement ferait decouvrir l attente au
                pire moment — celui ou le client a besoin d appeler. */}
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
              Commandez maintenant pour ne pas être interrompu. Avec un
              virement instantané — gratuit et proposé par toutes les banques
              européennes — vos crédits sont ajoutés dans la journée.{" "}
              <a href="/organisme/credits" style={{ color: OR, fontWeight: "bold" }}>
                Commander des minutes &rarr;
              </a>
            </p>
          </div>
        )}

        {/* ---- L ETAT DU COMPTE ----
            ⚠️ AFFICHE AVANT LE JOURNAL : ce qu on vient chercher ici, c est
            d abord de savoir s il reste de quoi appeler. */}
        {charge && (
          <div style={{ ...CARTE, borderColor: numero ? "rgba(200,169,110,0.25)" : "rgba(232,131,106,0.5)" }}>
            {numero ? (
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                Vos appels s&apos;affichent sous le numéro{" "}
                <strong style={{ color: OR }}>{numero}</strong> chez votre
                correspondant.<br />
                Il vous reste{" "}
                <strong style={{ color: minutes > 0 ? "#4caf50" : "#e8836a" }}>
                  {minutes} minute(s)
                </strong>.
              </p>
            ) : (
              <p style={{ color: "#e8836a", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                Votre numéro d&apos;appel n&apos;est pas encore réglé. C&apos;est
                lui qui s&apos;affiche chez la personne appelée — sans lui,
                l&apos;appel partirait en numéro masqué et personne ne
                décrocherait. Écrivez-nous pour le faire poser.
              </p>
            )}

            {/* 🚨 LE LIEN VERS LA COMMANDE, TOUJOURS PRESENT — 06/09.
                ⚠️ Y COMPRIS QUAND LE NUMERO N EST PAS REGLE : un organisme
                peut commander ses minutes pendant qu on lui pose son
                numero. Attendre l un pour l autre ferait perdre les deux.
                ⚠️ ET Y COMPRIS QUAND LE SOLDE EST BON : on renouvelle avant
                d etre a zero, pas apres. */}
            <p style={{ margin: "12px 0 0" }}>
              <a href="/organisme/credits" style={{ color: OR, fontSize: "14px" }}>
                Commander des minutes &rarr;
              </a>
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              {erreur}
            </p>
          </div>
        )}

        {/* ---- LE JOURNAL ----
            🚨 TOUS LES APPELS, ceux passes depuis l outil comme ceux notes
            a la main apres coup. Les distinguer serait un detail technique
            sans interet pour le client : ce qui compte, c est ce qui s est
            dit et quand. */}
        {charge && appels.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Vos derniers appels
            </h2>
            {appels.map(function (a: any) {
              const r = RESULTATS[a.resultat] || null;
              return (
                <div key={a.id} style={{ padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "13.5px",
                    color: "rgba(255,255,255,0.75)" }}>
                    {a.fiche_email || a.numero || "—"}
                    {r && (
                      <span style={{ color: r.couleur, marginLeft: "10px" }}>
                        {r.nom}
                      </span>
                    )}
                    {a.duree_min ? " · " + a.duree_min + " min" : ""}
                    {/* ⚠️ « automatique » DISTINGUE UN APPEL PASSE DEPUIS
                        L OUTIL d une note saisie apres coup : la duree du
                        premier est mesuree, celle du second estimee. */}
                    {a.saisi_par === "automatique" && (
                      <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "8px", fontSize: "12px" }}>
                        depuis l&apos;outil
                      </span>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "10px", fontSize: "12.5px" }}>
                      {a.appele_le
                        ? new Date(a.appele_le).toLocaleString("fr-FR")
                        : ""}
                    </span>
                  </p>
                  {a.notes && (
                    <p style={{ margin: 0, fontSize: "12.5px",
                      color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>
                      {a.notes}
                    </p>
                  )}
                  {a.rappeler_le && (
                    <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#e8a33d" }}>
                      À rappeler le {new Date(a.rappeler_le).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {charge && appels.length === 0 && (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px", margin: 0, lineHeight: "1.7" }}>
              Aucun appel pour le moment. Ouvrez une fiche portant un numéro :
              le bouton « Appeler » s&apos;y trouve, à côté de « Noter un appel ».
            </p>
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.8", marginTop: "20px" }}>
          Les appels partent vers l&apos;Europe et la Suisse. Ailleurs, le coût
          dépasse largement le prix facturé : ils sont refusés.
        </p>
      </div>
    </div>
  );
}
