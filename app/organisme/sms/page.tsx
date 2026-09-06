"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const FOND = "#050508";

// ══════════════════════════════════════════════════════════════════════════
// L ENVOI DE SMS PAR UN CLIENT — 05/09.
//
// CET ECRAN EST LA COPIE DE app/admin/sms/page.tsx, l ecran d essai de
// l editeur, adapte au client. La brique n a pas ete reconstruite : la
// tuyauterie Brevo est posee depuis le 14 aout et eprouvee, seul le
// cloisonnement change.
//
// TROIS DIFFERENCES AVEC L ECRAN DE L EDITEUR, ET ELLES SONT VOULUES :
//
//   1. L EXPEDITEUR NE SE CHOISIT PAS. L editeur bascule entre
//      « AcademiaPro » et « MrComptable » ; un client n a qu un nom, celui
//      de son organisme, lu dans `organismes_formation.sms_expediteur`.
//      Tant qu il n est pas regle, l envoi est refuse plutot que de partir
//      sous un nom qui n est pas le sien.
//
//   2. LE SOLDE DE CREDITS EST AFFICHE ET DECOMPTE. L editeur consomme les
//      credits Brevo sans compteur ; un client paie ses SMS.
//
//   3. LE JOURNAL EST FILTRE PAR ORGANISME. La route lit le tenant dans le
//      cookie signe, jamais dans la requete : un client ne voit que ses
//      propres envois.
//
// 🚨 POURQUOI UN ECRAN SEPARE PLUTOT QU UN BOUTON DANS LE CRM — LECON DU
// 04/09. Une premiere tentative avait ajoute le bouton directement dans
// app/organisme/crm/page.tsx, un fichier de 1 152 lignes qui fonctionnait.
// Resultat : PAGE BLANCHE. ⚠️ LE BUILD VERCEL ETAIT VERT et les
// delimiteurs equilibres — l erreur etait a l EXECUTION, invisible dans
// les journaux de deploiement. Le CRM a du etre restaure depuis le commit
// du 14/08.
//
// ⚠️ SUR UN FICHIER QUI FONCTIONNE, PREFERER UN ECRAN SEPARE. S il casse,
// il ne casse que lui. Le bouton sur les fiches viendra APRES, une fois
// cet ecran eprouve.
//
// ⚠️ /organisme EST UN CHEMIN A SESSION SIMPLE (CHEMINS_ELEVE du
// middleware), pas un chemin d administration : tout utilisateur connecte
// y entre. Ne JAMAIS placer un ecran client sous /admin, reserve a
// contact@academiapro.fr — il rendrait « Page introuvable ».
// ══════════════════════════════════════════════════════════════════════════

export default function PageSmsOrganisme() {
  const [numero, setNumero] = useState("");
  const [nomFiche, setNomFiche] = useState("");
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [historique, setHistorique] = useState<any[]>([]);
  const [expediteur, setExpediteur] = useState("");
  const [credits, setCredits] = useState(0);
  const [charge, setCharge] = useState(false);

  useEffect(function () {
    charger();

    // 🆕 LE NUMERO PEUT VENIR DE L ADRESSE — 05/09.
    //
    // Depuis une fiche du CRM, un lien « SMS » ouvre cet ecran avec le
    // numero et le nom deja poses : ?numero=0612345678&nom=Dupont
    //
    // 🚨 POURQUOI PAR L ADRESSE ET NON PAR UN PANNEAU DANS LE CRM. Une
    // premiere tentative, le 04/09, avait ajoute un panneau de saisie
    // directement dans app/organisme/crm/page.tsx — un fichier de 1 152
    // lignes qui fonctionnait. Resultat : PAGE BLANCHE, avec un build
    // Vercel VERT et des delimiteurs equilibres. Le CRM a du etre restaure.
    //
    // Ici, le CRM ne recoit qu un lien : rien qui puisse s executer au
    // mauvais moment. Tout le travail se fait dans cet ecran-ci.
    //
    // ⚠️ LE NUMERO N EST PAS VALIDE ICI. La route s en charge — elle
    // normalise « +33 6 12 34 56 78 » comme « 06 12 34 56 78 » — et elle
    // seule refuse ce qui est illisible. Un controle en double se
    // desynchronise toujours.
    try {
      const params = new URLSearchParams(window.location.search);
      const n = String(params.get("numero") || "").trim();
      const nom = String(params.get("nom") || "").trim();
      if (n) setNumero(n.slice(0, 30));
      if (nom) setNomFiche(nom.slice(0, 80));
    } catch (e) {}
  }, []);

  async function charger() {
    try {
      const r = await fetch("/api/organisme/sms", { cache: "no-store" });
      const d = await r.json();
      if (d && d.ok) {
        setExpediteur(String(d.expediteur || ""));
        setCredits(Number(d.credits || 0));
        setHistorique(Array.isArray(d.journal) ? d.journal : []);
      } else if (d && d.erreur) {
        setErreur(d.erreur);
      }
    } catch (e) {
      // L historique est un confort, pas une necessite : on n empeche pas
      // l ecran de s ouvrir si la lecture echoue.
    }
    setCharge(true);
  }

  async function envoyer() {
    setOccupe(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/organisme/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero,
          message: message,
          origine: "manuel",
        }),
      });
      const d = await r.json();
      if (d && d.ok) {
        setResultat(d);
        setMessage("");
        // 🚨 LE SOLDE VIENT DE LA ROUTE, JAMAIS D UN CALCUL LOCAL. Elle
        // seule decompte, et elle rend le solde exact — y compris quand
        // un message long consomme plusieurs credits.
        setCredits(Number(d.credits_restants || 0));
        await charger();
      } else {
        setErreur((d && d.erreur) || "Envoi impossible.");
        if (d && typeof d.credits_restants === "number") {
          setCredits(Number(d.credits_restants));
        }
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  // 🚨 UN SMS DE PLUS DE 160 CARACTERES est decoupe par l operateur en
  // morceaux de 153 et CHACUN EST FACTURE. Le compte est affiche pendant
  // la saisie : mieux vaut le voir en ecrivant qu en relisant sa facture.
  // ⚠️ MEME REGLE QUE DANS LA ROUTE. Si l une change, changer l autre.
  const n = message.length;
  const morceaux = n <= 160 ? 1 : Math.ceil(n / 153);

  const pret = expediteur !== "" && credits >= morceaux;

  // 🚨 L AVERTISSEMENT DE SOLDE BAS — 06/09.
  //
  // MEME SEUIL QUE LE CRON /api/cron/credits-bas. ⚠️ SI L UN CHANGE,
  // CHANGER L AUTRE : un client averti par courriel qui ne verrait rien
  // sur l ecran douterait de l un comme de l autre.
  //
  // ⚠️ CINQUANTE, PAS CINQ. Le credit suit le virement : a cinq SMS
  // restants, l avertissement arriverait trop tard pour servir.
  //
  // 🚨 ON N OFFRE RIEN D AVANCE. Jacques, le 06/09 : une avance « ouvre
  // une faille dans la strategie ». La reponse au delai n est pas un
  // cadeau, c est de prevenir a temps.
  const SEUIL_SMS = 50;
  const soldeBas = expediteur !== "" && credits <= SEUIL_SMS;

  const CADRE: any = {
    minHeight: "100vh", background: FOND, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "22px 26px", marginBottom: "16px",
  };
  const CHAMP: any = {
    width: "100%", padding: "12px 14px", borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: "15px", fontFamily: "Georgia,serif",
    boxSizing: "border-box", marginBottom: "14px",
  };
  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "13px", marginBottom: "6px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* ⚠️ LE RETOUR VA SUR /organisme/crm, PAS SUR /admin. Un client
            n a pas acces a l administration : l y renvoyer lui donnerait
            « Page introuvable ». */}
        <a href="/organisme/crm" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à mes contacts
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          SMS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Envoyer un SMS
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Le message part sous le nom de votre organisme. Chaque envoi
          consomme un crédit — deux ou plus si le message dépasse 160
          caractères.
        </p>

        {/* Quand on arrive depuis une fiche, on rappelle a qui on ecrit :
            le numero seul ne dit rien, et une erreur de destinataire ne se
            rattrape pas une fois le message parti. */}
        {nomFiche && (
          <p style={{ color: OR, fontSize: "15px", margin: "-14px 0 24px", lineHeight: "1.7" }}>
            Message à <strong>{nomFiche}</strong>
          </p>
        )}

        {/* ---- LE SOLDE BAS ----
            ⚠️ EN PREMIER, ET SEULEMENT S IL Y A LIEU. Un encadre permanent
            deviendrait un decor qu on ne lit plus — et le jour ou il compte
            vraiment, on ne le verrait pas davantage. */}
        {charge && soldeBas && (
          <div style={{ ...CARTE, borderColor: "rgba(232,163,61,0.5)",
            background: "rgba(232,163,61,0.07)" }}>
            <p style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 6px", lineHeight: "1.6" }}>
              Il vous reste <strong>{credits} SMS</strong>.
            </p>
            {/* 🚨 LE DELAI EST DIT FRANCHEMENT, ET LA SOLUTION AVEC. Cacher
                que le credit suit le virement ferait decouvrir l attente au
                pire moment — celui ou le client a besoin d ecrire. */}
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
              Commandez maintenant pour ne pas être interrompu. Avec un
              virement instantané — gratuit et proposé par toutes les banques
              européennes — vos crédits sont ajoutés dans la journée.{" "}
              <a href="/organisme/credits" style={{ color: OR, fontWeight: "bold" }}>
                Commander des SMS &rarr;
              </a>
            </p>
          </div>
        )}

        {/* ---- L ETAT DU COMPTE ----
            Affiche AVANT le formulaire : le client doit savoir ce dont il
            dispose avant d ecrire, pas apres avoir cliqué. */}
        {charge && (
          <div style={{ ...CARTE, borderColor: expediteur ? "rgba(200,169,110,0.25)" : "rgba(232,131,106,0.5)" }}>
            {expediteur ? (
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                Vos messages s&apos;afficheront sous le nom{" "}
                <strong style={{ color: OR }}>{expediteur}</strong> à la place
                d&apos;un numéro.<br />
                Il vous reste{" "}
                <strong style={{ color: credits > 0 ? "#4caf50" : "#e8836a" }}>
                  {credits} crédit(s)
                </strong>.
              </p>
            ) : (
              <p style={{ color: "#e8836a", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                Votre nom d&apos;expéditeur n&apos;est pas encore réglé. C&apos;est
                lui qui s&apos;affiche à la place du numéro chez votre
                destinataire : onze caractères au maximum, lettres et chiffres
                seulement. Écrivez-nous pour le faire poser.
              </p>
            )}

            {/* 🚨 LE LIEN VERS LA COMMANDE, TOUJOURS PRESENT — 06/09.
                ⚠️ Y COMPRIS QUAND L EXPEDITEUR N EST PAS REGLE : un
                organisme peut commander ses SMS pendant qu on lui pose son
                nom d expediteur. Attendre l un pour l autre ferait perdre
                les deux.
                ⚠️ ET Y COMPRIS QUAND LE SOLDE EST BON : on renouvelle avant
                d etre a zero, pas apres. */}
            <p style={{ margin: "12px 0 0" }}>
              <a href="/organisme/credits" style={{ color: OR, fontSize: "14px" }}>
                Commander des SMS &rarr;
              </a>
            </p>
          </div>
        )}

        <div style={CARTE}>
          <span style={LIBELLE}>Numéro du destinataire</span>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="06 12 34 56 78 ou +33 6 12 34 56 78"
            style={CHAMP}
          />

          <span style={LIBELLE}>Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Votre message…"
            style={{ ...CHAMP, lineHeight: "1.6" }}
          />

          <p style={{
            color: morceaux > 1 ? "#e8a33d" : "rgba(255,255,255,0.4)",
            fontSize: "13px", margin: "0 0 18px",
          }}>
            {n} caractère(s)
            {morceaux > 1
              ? " — attention, " + morceaux + " SMS seront décomptés"
              : " — 1 SMS"}
          </p>

          <button
            onClick={envoyer}
            disabled={occupe || !pret || numero.trim().length < 6 || message.trim().length < 2}
            style={{
              background: occupe || !pret || numero.trim().length < 6
                ? "rgba(200,169,110,0.3)" : OR,
              color: occupe || !pret || numero.trim().length < 6 ? "#8a8a8a" : FOND,
              padding: "14px 28px", borderRadius: "8px", border: "none",
              cursor: occupe ? "default" : "pointer", fontWeight: "bold",
              fontSize: "15px", fontFamily: "Georgia,serif", width: "100%",
            }}
          >
            {occupe
              ? "Envoi en cours…"
              : expediteur
                ? "Envoyer sous le nom " + expediteur
                : "Envoyer"}
          </button>

          {charge && expediteur && credits < morceaux && (
            <p style={{ color: "#e8836a", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Crédits insuffisants : ce message en consomme {morceaux} et il
              vous en reste {credits}.{" "}
              {/* ⚠️ ON RENVOIE VERS LA COMMANDE, PAS VERS UN COURRIEL. Un
                  client bloque doit pouvoir se debloquer lui-meme : lui
                  demander d ecrire ajoute un delai pour rien. */}
              <a href="/organisme/credits" style={{ color: OR }}>
                Commander des SMS &rarr;
              </a>
            </p>
          )}
        </div>

        {resultat && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "16px", fontWeight: "bold", margin: "0 0 10px" }}>
              {resultat.message}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
              Destinataire : {resultat.destinataire}<br />
              Expéditeur : {resultat.expediteur}<br />
              {resultat.caracteres} caractère(s) · {resultat.sms_decomptes} SMS décompté(s)
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              {erreur}
            </p>
          </div>
        )}

        {historique.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: OR, fontSize: "16px", margin: "0 0 14px" }}>
              Vos derniers envois
            </h2>
            {historique.map(function (l: any) {
              return (
                <div key={l.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", margin: "0 0 3px" }}>
                    {l.destinataire}
                    <span style={{
                      color: l.statut === "envoye" ? "#4caf50" : l.statut === "echec" ? "#e8836a" : "rgba(255,255,255,0.4)",
                      marginLeft: "10px",
                    }}>
                      {l.statut}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "10px", fontSize: "12.5px" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString("fr-FR") : ""}
                    </span>
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", margin: 0, lineHeight: "1.6" }}>
                    {String(l.message || "").slice(0, 120)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 🚨 LE RAPPEL SUR LE CONSENTEMENT NE SE SUPPRIME PAS. La
            prospection par SMS exige un accord prealable, meme entre
            professionnels. Le client doit le lire au moment ou il ecrit,
            pas dans des conditions generales qu il ne rouvrira jamais. */}
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.8", marginTop: "20px" }}>
          Rappel : la prospection par SMS exige un consentement préalable, même
          entre professionnels. Les numéros de vos fiches servent au suivi —
          rappeler quelqu&apos;un qui a répondu, prévenir après un courriel —
          jamais à une campagne.
        </p>
      </div>
    </div>
  );
}
