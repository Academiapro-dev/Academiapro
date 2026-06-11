import React from "react";

const MentionsLegales: React.FC = () => {
  const styles = {
    page: {
      backgroundColor: "#050508",
      minHeight: "100vh",
      fontFamily: "'Georgia', serif",
      color: "#c8a96e",
      padding: "0",
      margin: "0",
    } as React.CSSProperties,

    header: {
      borderBottom: "1px solid #c8a96e33",
      padding: "48px 64px 32px 64px",
      textAlign: "center" as const,
    } as React.CSSProperties,

    logoText: {
      fontSize: "13px",
      letterSpacing: "6px",
      textTransform: "uppercase" as const,
      color: "#c8a96e99",
      marginBottom: "16px",
    } as React.CSSProperties,

    mainTitle: {
      fontSize: "36px",
      fontWeight: "300",
      letterSpacing: "2px",
      color: "#c8a96e",
      margin: "0 0 8px 0",
    } as React.CSSProperties,

    subtitle: {
      fontSize: "14px",
      color: "#c8a96e66",
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
    } as React.CSSProperties,

    container: {
      maxWidth: "860px",
      margin: "0 auto",
      padding: "64px 32px",
    } as React.CSSProperties,

    ornament: {
      textAlign: "center" as const,
      color: "#c8a96e44",
      fontSize: "20px",
      letterSpacing: "12px",
      margin: "0 0 56px 0",
    } as React.CSSProperties,

    section: {
      marginBottom: "52px",
    } as React.CSSProperties,

    sectionNumber: {
      fontSize: "10px",
      letterSpacing: "4px",
      color: "#c8a96e55",
      textTransform: "uppercase" as const,
      marginBottom: "8px",
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: "18px",
      fontWeight: "400",
      letterSpacing: "2px",
      color: "#c8a96e",
      margin: "0 0 20px 0",
      paddingBottom: "12px",
      borderBottom: "1px solid #c8a96e22",
      textTransform: "uppercase" as const,
    } as React.CSSProperties,

    paragraph: {
      fontSize: "15px",
      lineHeight: "1.9",
      color: "#c8a96ecc",
      margin: "0 0 16px 0",
      fontWeight: "300",
    } as React.CSSProperties,

    infoBlock: {
      backgroundColor: "#0d0d12",
      border: "1px solid #c8a96e22",
      borderLeft: "3px solid #c8a96e66",
      padding: "24px 28px",
      marginBottom: "12px",
    } as React.CSSProperties,

    infoLabel: {
      fontSize: "10px",
      letterSpacing: "3px",
      color: "#c8a96e66",
      textTransform: "uppercase" as const,
      marginBottom: "6px",
    } as React.CSSProperties,

    infoValue: {
      fontSize: "16px",
      color: "#c8a96e",
      fontWeight: "400",
      letterSpacing: "0.5px",
    } as React.CSSProperties,

    contactLink: {
      color: "#c8a96e",
      textDecoration: "none",
      borderBottom: "1px solid #c8a96e44",
      paddingBottom: "1px",
      fontSize: "16px",
      letterSpacing: "0.5px",
    } as React.CSSProperties,

    divider: {
      border: "none",
      borderTop: "1px solid #c8a96e18",
      margin: "0 0 52px 0",
    } as React.CSSProperties,

    highlight: {
      color: "#c8a96e",
      fontStyle: "italic",
    } as React.CSSProperties,

    footer: {
      borderTop: "1px solid #c8a96e22",
      padding: "32px 64px",
      textAlign: "center" as const,
    } as React.CSSProperties,

    footerText: {
      fontSize: "11px",
      letterSpacing: "2px",
      color: "#c8a96e44",
      textTransform: "uppercase" as const,
    } as React.CSSProperties,

    footerOrnament: {
      color: "#c8a96e33",
      fontSize: "16px",
      letterSpacing: "8px",
      display: "block",
      marginTop: "12px",
    } as React.CSSProperties,

    twoCol: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <p style={styles.logoText}>AcadémIA Pro</p>
        <h1 style={styles.mainTitle}>Mentions Légales</h1>
        <p style={styles.subtitle}>Informations légales et réglementaires</p>
      </header>

      <div style={styles.container}>
        <p style={styles.ornament}>— ✦ —</p>

        {/* Section 1 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 01</p>
          <h2 style={styles.sectionTitle}>Éditeur du site</h2>

          <p style={styles.paragraph}>
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004
            pour la confiance dans l'économie numérique (LCEN), les informations
            relatives à l'éditeur du présent site sont les suivantes :
          </p>

          <div style={styles.twoCol}>
            <div style={styles.infoBlock}>
              <p style={styles.infoLabel}>Nom de l'éditeur</p>
              <p style={styles.infoValue}>AcadémIA Pro</p>
            </div>
            <div style={styles.infoBlock}>
              <p style={styles.infoLabel}>Directeur de la publication</p>
              <p style={styles.infoValue}>Jacques Zenou</p>
            </div>
          </div>

          <div style={styles.infoBlock}>
            <p style={styles.infoLabel}>Adresse électronique de contact</p>
            <a href="mailto:contact@academiapro.fr" style={styles.contactLink}>
              contact@academiapro.fr
            </a>
          </div>

          <p style={styles.paragraph}>
            Le directeur de la publication est{" "}
            <span style={styles.highlight}>Monsieur Jacques Zenou</span>, en sa
            qualité de responsable éditorial d'AcadémIA Pro. Toute demande
            relative au contenu éditorial du site peut lui être adressée via
            l'adresse de contact indiquée ci-dessus.
          </p>
        </section>

        <hr style={styles.divider} />

        {/* Section 2 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 02</p>
          <h2 style={styles.sectionTitle}>Hébergement</h2>

          <p style={styles.paragraph}>
            Le site AcadémIA Pro est hébergé par la société{" "}
            <span style={styles.highlight}>Vercel Inc.</span>, dont le siège
            social est établi aux États-Unis d'Amérique.
          </p>

          <div style={styles.infoBlock}>
            <p style={styles.infoLabel}>Hébergeur</p>
            <p style={styles.infoValue}>Vercel Inc.</p>
          </div>

          <div style={styles.infoBlock}>
            <p style={styles.infoLabel}>Site web de l'hébergeur</p>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.contactLink}
            >
              https://vercel.com
            </a>
          </div>

          <p style={styles.paragraph}>
            Vercel est une plateforme de déploiement et d'hébergement de
            services numériques, proposant une infrastructure mondiale distribuée
            conforme aux standards internationaux de sécurité et de
            disponibilité. L'hébergement est soumis aux conditions générales
            d'utilisation de Vercel Inc.
          </p>
        </section>

        <hr style={styles.divider} />

        {/* Section 3 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 03</p>
          <h2 style={styles.sectionTitle}>Propriété intellectuelle</h2>

          <p style={styles.paragraph}>
            L'ensemble des éléments constitutifs du site AcadémIA Pro —
            incluant, sans s'y limiter, les textes, articles, contenus
            pédagogiques, algorithmes d'intelligence artificielle, interfaces
            graphiques, logos, chartes visuelles, bases de données, ainsi que
            tout autre contenu ou logiciel — est protégé par le{" "}
            <span style={styles.highlight}>droit de la propriété
            intellectuelle français</span> et par les conventions
            internationales applicables.
          </p>

          <p style={styles.paragraph}>
            Ces éléments sont la propriété exclusive d'AcadémIA Pro ou de leurs
            ayants droit respectifs. Toute reproduction, représentation,
            modification, publication, adaptation ou exploitation, totale ou
            partielle, de ces éléments, par quelque procédé ou sur quelque
            support que ce soit, est strictement interdite sans autorisation
            écrite préalable de l'éditeur.
          </p>

          <p style={styles.paragraph}>
            Conformément aux articles L.111-1 et suivants du Code de la
            propriété intellectuelle, toute utilisation non autorisée constitue
            une contrefaçon sanctionnée pénalement et civilement. Les droits
            d'auteur sont protégés pour une durée de soixante-dix (70) ans à
            compter du décès de l'auteur, conformément à la législation
            française et européenne.
          </p>

          <div style={styles.infoBlock}>
            <p style={styles.infoLabel}>Régime juridique applicable</p>
            <p style={styles.infoValue}>
              Droit français — Code de la propriété intellectuelle
            </p>
          </div>
        </section>

        <hr style={styles.divider} />

        {/* Section 4 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 04</p>
          <h2 style={styles.sectionTitle}>Protection des données personnelles</h2>

          <p style={styles.paragraph}>
            AcadémIA Pro s'engage à protéger la vie privée de ses utilisateurs
            conformément au{" "}
            <span style={styles.highlight}>
              Règlement Général sur la Protection des Données (RGPD)
            </span>{" "}
            — Règlement (UE) 2016/679 du 27 avril 2016 — ainsi qu'à la loi
            Informatique et Libertés du 6 janvier 1978, modifiée.
          </p>

          <p style={styles.paragraph}>
            Les données personnelles collectées lors de l'utilisation du site
            sont traitées de manière licite, loyale et transparente. Elles sont
            utilisées exclusivement aux fins pour lesquelles elles ont été
            collectées et ne sont pas transmises à des tiers sans consentement
            explicite de l'utilisateur, sauf obligation légale.
          </p>

          <p style={styles.paragraph}>
            Conformément à la réglementation en vigueur, vous disposez des
            droits d'accès, de rectification, d'effacement, de limitation du
            traitement, à la portabilité de vos données et d'opposition à leur
            traitement. Pour exercer ces droits, veuillez contacter l'éditeur à
            l'adresse :{" "}
            <a href="mailto:contact@academiapro.fr" style={styles.contactLink}>
              contact@academiapro.fr
            </a>
          </p>
        </section>

        <hr style={styles.divider} />

        {/* Section 5 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 05</p>
          <h2 style={styles.sectionTitle}>Droit applicable et juridiction</h2>

          <p style={styles.paragraph}>
            Le présent site et l'ensemble de ses mentions légales sont soumis au{" "}
            <span style={styles.highlight}>droit français</span>. Tout litige
            relatif à l'utilisation du site AcadémIA Pro sera soumis à la
            compétence exclusive des tribunaux français compétents.
          </p>

          <p style={styles.paragraph}>
            En cas de litige, les parties s'engagent à rechercher une solution
            amiable avant tout recours judiciaire. À défaut d'accord amiable
            dans un délai de trente (30) jours à compter de la notification du
            différend, le litige sera porté devant les juridictions compétentes
            du ressort du siège social de l'éditeur.
          </p>

          <div style={styles.infoBlock}>
            <p style={styles.infoLabel}>Loi applicable</p>
            <p style={styles.infoValue}>Droit de la République Française</p>
          </div>
        </section>

        <hr style={styles.divider} />

        {/* Section 6 */}
        <section style={styles.section}>
          <p style={styles.sectionNumber}>Article 06</p>
          <h2 style={styles.sectionTitle}>Responsabilité</h2>

          <p style={styles.paragraph}>
            AcadémIA Pro s'efforce d'assurer l'exactitude et la mise à jour des
            informations diffusées sur ce site. Toutefois, l'éditeur ne peut
            garantir l'exhaustivité, la précision ou l'actualité des informations
            publiées et décline toute responsabilité pour les erreurs ou omissions
            pouvant subsister dans le contenu du site.
          </p>

          <p style={styles.paragraph}>
            L'éditeur ne saurait être tenu responsable de dommages directs ou
            indirects résultant de l'accès au site ou de l'utilisation de ses
            contenus, y compris en cas d'indisponibilité temporaire du service.
            Les liens hypertextes présents sur le site vers des sites tiers
            n'engagent pas la responsabilité d'AcadémIA Pro quant à leur contenu.