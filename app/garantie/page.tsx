"use client";

export default function GarantiePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 12px" }}>ACADEMIA PRO</p>
          <h1 style={{ color: "#fff", fontSize: "32px", margin: "0 0 12px" }}>Droit de retractation</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: 0 }}>14 jours, conformement au Code de la consommation</p>
        </div>

        <div style={{ background: "#1a1a2e", borderRadius: "16px", padding: "36px", border: "1px solid rgba(200,169,110,0.3)", lineHeight: 1.8 }}>

          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>Votre droit</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: "0 0 26px" }}>
            Vous disposez de quatorze (14) jours calendaires a compter de la confirmation de votre paiement pour exercer votre droit de retractation, sans avoir a justifier votre decision ni a supporter de penalites.
          </p>

          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>Une condition importante</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: "0 0 26px" }}>
            Nos formations sont des contenus numeriques livres immediatement. Conformement a l article L.221-28 13 du Code de la consommation, le droit de retractation prend fin des lors que vous avez commence a acceder au contenu : ouverture d un module, d un manuel, participation a une session live. Tant que vous n avez ouvert aucun contenu, votre droit reste entier.
          </p>

          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>Comment l exercer</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: "0 0 12px" }}>
            Ecrivez a <a href="mailto:contact@academiapro.fr" style={{ color: "#c8a96e" }}>contact@academiapro.fr</a> avec l objet « Retractation », en indiquant :
          </p>
          <ul style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", paddingLeft: "1.4em", margin: "0 0 26px" }}>
            <li>vos nom et prenom</li>
            <li>l adresse e-mail de votre compte</li>
            <li>la reference de commande et sa date</li>
            <li>l intitule de la formation ou de la seance</li>
          </ul>

          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>Remboursement</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: "0 0 26px" }}>
            En cas de retractation valide, le remboursement intervient dans les quatorze (14) jours suivant la reception de votre demande, par le meme moyen de paiement que celui utilise lors de l achat.
          </p>

          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>Clients hors Union europeenne</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: "0 0 26px" }}>
            Le regime legal de retractation de 14 jours ne s applique pas. AcademIA Pro accorde neanmoins, a titre commercial, une garantie de satisfaction de 7 jours, sans acces prealable aux contenus, selon les memes modalites.
          </p>

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
            Les modalites completes figurent a l article 8 de nos <a href="/cgv" style={{ color: "#c8a96e" }}>conditions generales de vente</a>.
          </p>

        </div>
      </div>
    </div>
  );
}
