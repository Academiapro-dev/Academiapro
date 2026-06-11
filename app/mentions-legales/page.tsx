export default function MentionsLegales() {
  const styles = {
    page: {
      backgroundColor: '#050508',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#e8e4dc',
      padding: '0',
      margin: '0',
    } as React.CSSProperties,

    header: {
      backgroundColor: '#080810',
      borderBottom: '1px solid #c8a96e33',
      padding: '24px 0',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    headerInner: {
      maxWidth: '860px',
      margin: '0 auto',
      padding: '0 24px',
    } as React.CSSProperties,

    logoText: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#c8a96e',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      margin: '0 0 6px 0',
    } as React.CSSProperties,

    headerSubtitle: {
      fontSize: '12px',
      color: '#888',
      letterSpacing: '3px',
      textTransform: 'uppercase' as const,
      margin: '0',
    } as React.CSSProperties,

    main: {
      maxWidth: '860px',
      margin: '0 auto',
      padding: '60px 24px 80px',
    } as React.CSSProperties,

    pageTitle: {
      fontSize: '36px',
      fontWeight: '300',
      color: '#c8a96e',
      margin: '0 0 10px 0',
      letterSpacing: '1px',
    } as React.CSSProperties,

    titleUnderline: {
      width: '60px',
      height: '2px',
      backgroundColor: '#c8a96e',
      margin: '0 0 16px 0',
      border: 'none',
    } as React.CSSProperties,

    introText: {
      fontSize: '14px',
      color: '#888',
      margin: '0 0 52px 0',
      lineHeight: '1.6',
    } as React.CSSProperties,

    section: {
      backgroundColor: '#0c0c14',
      border: '1px solid #1e1e2e',
      borderRadius: '8px',
      padding: '32px 36px',
      marginBottom: '20px',
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

    sectionAccent: {
      position: 'absolute' as const,
      top: '0',
      left: '0',
      width: '3px',
      height: '100%',
      backgroundColor: '#c8a96e',
      borderRadius: '8px 0 0 8px',
    } as React.CSSProperties,

    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginBottom: '20px',
    } as React.CSSProperties,

    sectionIcon: {
      width: '36px',
      height: '36px',
      backgroundColor: '#c8a96e15',
      border: '1px solid #c8a96e40',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: '16px',
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: '17px',
      fontWeight: '600',
      color: '#c8a96e',
      margin: '0',
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    divider: {
      border: 'none',
      borderTop: '1px solid #1e1e2e',
      margin: '0 0 20px 0',
    } as React.CSSProperties,

    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px',
    } as React.CSSProperties,

    infoItem: {
      backgroundColor: '#080810',
      border: '1px solid #1e1e2e',
      borderRadius: '6px',
      padding: '16px 18px',
    } as React.CSSProperties,

    infoLabel: {
      fontSize: '11px',
      color: '#c8a96e',
      textTransform: 'uppercase' as const,
      letterSpacing: '1.5px',
      fontWeight: '600',
      margin: '0 0 6px 0',
      display: 'block',
    } as React.CSSProperties,

    infoValue: {
      fontSize: '14px',
      color: '#d4cfc7',
      margin: '0',
      lineHeight: '1.5',
    } as React.CSSProperties,

    paragraph: {
      fontSize: '14px',
      color: '#b8b4ac',
      lineHeight: '1.8',
      margin: '0 0 14px 0',
    } as React.CSSProperties,

    paragraphLast: {
      fontSize: '14px',
      color: '#b8b4ac',
      lineHeight: '1.8',
      margin: '0',
    } as React.CSSProperties,

    highlight: {
      color: '#c8a96e',
      fontWeight: '600',
    } as React.CSSProperties,

    contactBox: {
      backgroundColor: '#080810',
      border: '1px solid #c8a96e33',
      borderRadius: '8px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '16px',
    } as React.CSSProperties,

    contactLeft: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    } as React.CSSProperties,

    contactTitle: {
      fontSize: '14px',
      color: '#888',
      margin: '0',
    } as React.CSSProperties,

    contactEmail: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#c8a96e',
      textDecoration: 'none',
      letterSpacing: '0.3px',
    } as React.CSSProperties,

    contactBadge: {
      backgroundColor: '#c8a96e18',
      border: '1px solid #c8a96e40',
      borderRadius: '20px',
      padding: '8px 20px',
      fontSize: '12px',
      color: '#c8a96e',
      letterSpacing: '1px',
      textTransform: 'uppercase' as const,
      fontWeight: '600',
    } as React.CSSProperties,

    list: {
      margin: '0',
      padding: '0 0 0 0',
      listStyle: 'none',
    } as React.CSSProperties,

    listItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '12px',
      fontSize: '14px',
      color: '#b8b4ac',
      lineHeight: '1.7',
    } as React.CSSProperties,

    listBullet: {
      color: '#c8a96e',
      fontWeight: '700',
      flexShrink: 0,
      marginTop: '2px',
    } as React.CSSProperties,

    footer: {
      backgroundColor: '#080810',
      borderTop: '1px solid #1e1e2e',
      padding: '28px 24px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    footerText: {
      fontSize: '12px',
      color: '#555',
      margin: '0 0 6px 0',
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    footerTextLast: {
      fontSize: '12px',
      color: '#555',
      margin: '0',
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    footerAccent: {
      color: '#c8a96e88',
    } as React.CSSProperties,

    updateBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#0c0c14',
      border: '1px solid #1e1e2e',
      borderRadius: '20px',
      padding: '6px 14px',
      fontSize: '12px',
      color: '#666',
      marginBottom: '40px',
    } as React.CSSProperties,

    updateDot: {
      width: '6px',
      height: '6px',
      backgroundColor: '#c8a96e',
      borderRadius: '50%',
      display: 'inline-block',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.page}>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <p style={styles.logoText}>AcadémIA Pro</p>
          <p style={styles.headerSubtitle}>Intelligence Artificielle · Formation · Excellence</p>
        </div>
      </header>

      <main style={styles.main}>

        <h1 style={styles.pageTitle}>Mentions Légales</h1>
        <hr style={styles.titleUnderline} />
        <p style={styles.introText}>
          Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la Confiance
          dans l'Économie Numérique (LCEN), nous vous informons de l'identité des différents
          intervenants dans le cadre de la réalisation et du suivi de ce site.
        </p>

        <div style={styles.updateBadge}>
          <span style={styles.updateDot}></span>
          Dernière mise à jour : Janvier 2025
        </div>

        <div style={styles.section}>
          <div style={styles.sectionAccent}></div>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>🏢</div>
            <h2 style={styles.sectionTitle}>Éditeur du Site</h2>
          </div>
          <hr style={styles.divider} />
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Raison sociale</span>
              <p style={styles.infoValue}>AcadémIA Pro</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Forme juridique</span>
              <p style={styles.infoValue}>Société par Actions Simplifiée (SAS)</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Siège social</span>
              <p style={styles.infoValue}>Paris, France</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Activité principale</span>
              <p style={styles.infoValue}>Formation & Intelligence Artificielle</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Site web</span>
              <p style={styles.infoValue}>www.academiapro.fr</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Contact général</span>
              <p style={styles.infoValue}>contact@academiapro.fr</p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionAccent}></div>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>👤</div>
            <h2 style={styles.sectionTitle}>Directeur de la Publication</h2>
          </div>
          <hr style={styles.divider} />
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Nom complet</span>
              <p style={styles.infoValue}>Jacques Zenou</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Qualité</span>
              <p style={styles.infoValue}>Directeur de la Publication</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Responsabilité éditoriale</span>
              <p style={styles.infoValue}>Ensemble des contenus publiés sur la plateforme AcadémIA Pro</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Contact</span>
              <p style={styles.infoValue}>contact@academiapro.fr</p>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={styles.paragraphLast}>
              Conformément à l'article 6-III-1° de la loi LCEN, le directeur de la publication est
              responsable de l'ensemble des contenus éditoriaux mis en ligne sur le site
              <span style={styles.highlight}> AcadémIA Pro</span>. Toute demande relative au contenu
              éditorial peut lui être adressée par email.
            </p>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionAccent}></div>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>☁️</div>
            <h2 style={styles.sectionTitle}>Hébergement</h2>
          </div>
          <hr style={styles.divider} />
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Hébergeur</span>
              <p style={styles.infoValue}>Vercel Inc.</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Siège social</span>
              <p style={styles.infoValue}>440 N Barranca Ave #4133<br />Covina, CA 91723 — États-Unis</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Site officiel</span>
              <p style={styles.infoValue}>vercel.com</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Infrastructure</span>
              <p style={styles.infoValue}>Edge Network mondial · CDN haute disponibilité</p>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={styles.parag