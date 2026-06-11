export default function CGV() {
  const styles = {
    page: {
      backgroundColor: '#050508',
      color: '#e8e8e8',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      minHeight: '100vh',
      padding: '0',
      margin: '0',
    } as React.CSSProperties,

    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '60px 24px 80px 24px',
    } as React.CSSProperties,

    header: {
      borderBottom: '2px solid #c8a96e',
      paddingBottom: '32px',
      marginBottom: '48px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    logo: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#c8a96e',
      letterSpacing: '2px',
      marginBottom: '8px',
    } as React.CSSProperties,

    subtitle: {
      fontSize: '13px',
      color: '#888',
      letterSpacing: '3px',
      textTransform: 'uppercase' as const,
      marginBottom: '24px',
    } as React.CSSProperties,

    title: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '12px',
      lineHeight: '1.2',
    } as React.CSSProperties,

    updateDate: {
      fontSize: '13px',
      color: '#c8a96e',
      fontStyle: 'italic',
    } as React.CSSProperties,

    tocBox: {
      backgroundColor: '#0d0d14',
      border: '1px solid #c8a96e33',
      borderLeft: '4px solid #c8a96e',
      borderRadius: '8px',
      padding: '28px 32px',
      marginBottom: '48px',
    } as React.CSSProperties,

    tocTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#c8a96e',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      marginBottom: '16px',
      marginTop: '0',
    } as React.CSSProperties,

    tocList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '8px',
    } as React.CSSProperties,

    tocItem: {
      fontSize: '14px',
      color: '#b0b0b0',
      paddingLeft: '0',
      cursor: 'pointer',
    } as React.CSSProperties,

    tocLink: {
      color: '#b0b0b0',
      textDecoration: 'none',
      transition: 'color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,

    tocNumber: {
      color: '#c8a96e',
      fontWeight: '700',
      fontSize: '12px',
      minWidth: '24px',
    } as React.CSSProperties,

    section: {
      marginBottom: '52px',
    } as React.CSSProperties,

    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px',
    } as React.CSSProperties,

    sectionNumber: {
      backgroundColor: '#c8a96e',
      color: '#050508',
      fontSize: '13px',
      fontWeight: '800',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#ffffff',
      margin: '0',
      flex: 1,
      borderBottom: '1px solid #c8a96e44',
      paddingBottom: '8px',
    } as React.CSSProperties,

    paragraph: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#c8c8c8',
      marginBottom: '16px',
      marginTop: '0',
    } as React.CSSProperties,

    strong: {
      color: '#ffffff',
      fontWeight: '600',
    } as React.CSSProperties,

    goldText: {
      color: '#c8a96e',
      fontWeight: '600',
    } as React.CSSProperties,

    infoBox: {
      backgroundColor: '#0d0d14',
      border: '1px solid #c8a96e33',
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '16px',
    } as React.CSSProperties,

    warningBox: {
      backgroundColor: '#1a1208',
      border: '1px solid #c8a96e66',
      borderLeft: '4px solid #c8a96e',
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '16px',
    } as React.CSSProperties,

    warningTitle: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#c8a96e',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginBottom: '8px',
      marginTop: '0',
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '16px',
      fontSize: '14px',
    } as React.CSSProperties,

    th: {
      backgroundColor: '#c8a96e',
      color: '#050508',
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontWeight: '700',
      fontSize: '13px',
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #1a1a2e',
      color: '#c8c8c8',
      verticalAlign: 'top' as const,
    } as React.CSSProperties,

    tdEven: {
      padding: '12px 16px',
      borderBottom: '1px solid #1a1a2e',
      color: '#c8c8c8',
      backgroundColor: '#0a0a12',
      verticalAlign: 'top' as const,
    } as React.CSSProperties,

    list: {
      paddingLeft: '0',
      marginBottom: '16px',
      listStyle: 'none',
    } as React.CSSProperties,

    listItem: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#c8c8c8',
      paddingLeft: '24px',
      position: 'relative' as const,
      marginBottom: '8px',
    } as React.CSSProperties,

    listBullet: {
      position: 'absolute' as const,
      left: '0',
      color: '#c8a96e',
      fontWeight: '700',
    } as React.CSSProperties,

    contactCard: {
      backgroundColor: '#0d0d14',
      border: '1px solid #c8a96e',
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    contactEmail: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#c8a96e',
      textDecoration: 'none',
      display: 'block',
      marginBottom: '8px',
    } as React.CSSProperties,

    divider: {
      border: 'none',
      borderTop: '1px solid #1a1a2e',
      margin: '48px 0',
    } as React.CSSProperties,

    footer: {
      textAlign: 'center' as const,
      borderTop: '1px solid #c8a96e33',
      paddingTop: '32px',
      marginTop: '48px',
    } as React.CSSProperties,

    footerText: {
      fontSize: '13px',
      color: '#555',
      marginBottom: '8px',
    } as React.CSSProperties,

    badge: {
      display: 'inline-block',
      backgroundColor: '#c8a96e22',
      border: '1px solid #c8a96e',
      color: '#c8a96e',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '1px',
      textTransform: 'uppercase' as const,
      padding: '4px 10px',
      borderRadius: '4px',
      marginRight: '8px',
      marginBottom: '8px',
    } as React.CSSProperties,
  };

  const sections = [
    { num: '01', title: 'Identification du Vendeur' },
    { num: '02', title: 'Objet des CGV' },
    { num: '03', title: 'Prix et Modalités de Paiement' },
    { num: '04', title: 'Livraison et Accès aux Formations' },
    { num: '05', title: 'Droit de Rétractation (14 jours)' },
    { num: '06', title: 'Garantie Satisfaction (30 jours)' },
    { num: '07', title: 'Propriété Intellectuelle' },
    { num: '08', title: 'Limitation de Responsabilité' },
    { num: '09', title: 'Protection des Données (RGPD)' },
    { num: '10', title: 'Droit Applicable — France' },
    { num: '11', title: 'Attribution de Juridiction' },
    { num: '12', title: 'Contact et Réclamations' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.logo}>AcadémIA Pro</div>
          <div style={styles.subtitle}>Plateforme de Formations en Intelligence Artificielle</div>
          <h1 style={styles.title}>Conditions Générales de Vente</h1>
          <div style={styles.updateDate}>
            Dernière mise à jour : 1er janvier 2025 — Version 3.2
          </div>
        </header>

        {/* TABLE OF CONTENTS */}
        <div style={styles.tocBox}>
          <h2 style={styles.tocTitle}>Sommaire</h2>
          <ul style={styles.tocList}>
            {sections.map((s) => (
              <li key={s.num} style={styles.tocItem}>
                <a href={`#section-${s.num}`} style={styles.tocLink}>
                  <span style={styles.tocNumber}>{s.num}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* PRÉAMBULE */}
        <div style={styles.warningBox}>
          <p style={styles.warningTitle}>⚠ Préambule — À lire attentivement</p>
          <p style={{ ...styles.paragraph, marginBottom: '0' }}>
            Les présentes Conditions Générales de Vente (ci-après « CGV ») constituent le socle unique de la relation commerciale entre la société AcadémIA Pro SAS et tout acheteur (ci-après « Client ») souhaitant acquérir des formations, programmes ou contenus pédagogiques proposés sur la plateforme <span style={styles.goldText}>academiapro.fr</span>. Toute commande implique l&apos;acceptation pleine et entière des présentes CGV. Conformément à l&apos;article L.441-1 du Code de commerce, les CGV constituent la base des négociations commerciales.
          </p>
        </div>

        <hr style={styles.divider} />

        {/* SECTION 01 — IDENTIFICATION VENDEUR */}
        <section id="section-01" style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionNumber}>01</div>
            <h2 style={styles.sectionTitle}>Identification du Vendeur</h2>
          </div>

          <p style={styles.paragraph}>
            Le site <span style={styles.strong}>academiapro.fr</span> est édité et exploité par la société :
          </p>

          <div style={styles.infoBox}>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#c8a96e', width: '200px' }}>Raison sociale</td>
                  <td style={styles.td}>AcadémIA Pro SAS</td>
                </tr>
                <tr>
                  <td style={{ ...styles.tdEven, fontWeight: '600', color: '#c8a96e' }}>Forme juridique</td>
                  <td style={styles.tdEven}>Société par Actions Simplifiée (SAS)</td>
                </tr>
                <tr>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#c8a96e' }}>Capital social</td>
                  <td style={styles.td}>50 000 €</td>
                </tr>
                <tr>
                  <td style={{ ...styles.tdEven, fontWeight: '600', color: '#c8a96e' }}>Siège social</td>
                  <td style={styles.tdEven}>12 rue de la Paix, 75001 Paris, France</td>
                </tr>
                <tr>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#c8a96e' }}>SIREN / SIRET</td>
                  <td style={styles.td}>123 456 789 / 123 456 789 00010</td>
                </tr>
                <tr>
                  <td style={{ ...styles.tdEven, fontWeight: '600', color: '#c8a96e' }}>N° TVA Intracommunautaire</td>
                  <td style={styles.tdEven}>FR 12 123456789</td>
                </tr>
                <tr>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#c8a96e' }}>RCS</td>
                  <td style={styles.td}>RCS Paris B 123 456 789</td>
                </tr>
                <tr>
                  <td style={{ ...styles.tdEven, fontWeight: '600', color: '#c8a96e' }}>Directeur de publication</td>
                  <td style={styles.tdEven}>Prénom Nom, Président</td>
                </tr>
                <tr>