"use client";

export default function PolitiqueCookiesPage() {
  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "60px 20px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e", fontSize: "32px", marginBottom: "10px" }}>Politique de Cookies</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "40px" }}>Derniere mise a jour : juillet 2026</p>

        <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8", fontSize: "15px" }}>
          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Qu est-ce qu un cookie ?</h2>
          <p>Un cookie est un petit fichier texte depose sur votre appareil lors de votre visite sur AcademIA Pro. Il permet au site de fonctionner correctement et, avec votre consentement, d ameliorer votre experience.</p>

          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Cookies strictement necessaires</h2>
          <p>Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas etre desactives. Ils incluent :</p>
          <ul>
            <li><strong>Session utilisateur</strong> (Supabase Auth) — permet de rester connecte a votre compte</li>
            <li><strong>Paiement securise</strong> (Stripe) — necessaire au traitement de vos transactions</li>
            <li><strong>Preferences de langue</strong> — memorise la langue choisie parmi nos 7 langues disponibles</li>
          </ul>

          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Cookies de mesure d audience</h2>
          <p>Avec votre consentement, nous pouvons utiliser des cookies analytiques pour comprendre comment vous utilisez le site et ameliorer nos services. Ces cookies sont anonymises et ne permettent pas de vous identifier personnellement.</p>

          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Duree de conservation</h2>
          <p>Les cookies de session expirent a la fermeture du navigateur. Les cookies de preference et de consentement sont conserves 13 mois maximum, conformement aux recommandations de la CNIL.</p>

          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Comment gerer vos cookies ?</h2>
          <p>Vous pouvez a tout moment modifier votre choix via le bandeau de consentement affiche lors de votre premiere visite, ou en supprimant les cookies directement depuis les parametres de votre navigateur.</p>

          <h2 style={{ color: "#c8a96e", marginTop: "32px" }}>Contact</h2>
          <p>Pour toute question relative a notre utilisation des cookies : contact@academiapro.fr</p>
        </div>
      </div>
    </div>
  );
}
