export default function DashboardApprenantAcademIA() {
  const styles = {
    page: {
      backgroundColor: '#050508',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e8e0d0',
      padding: '0',
      margin: '0',
    } as React.CSSProperties,

    header: {
      background: 'linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #050508 100%)',
      borderBottom: '1px solid rgba(200, 169, 110, 0.2)',
      padding: '20px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
    } as React.CSSProperties,

    logo: {
      fontSize: '24px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #c8a96e, #f0d898, #c8a96e)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
    } as React.CSSProperties,

    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    } as React.CSSProperties,

    avatar: {
      width: '42px',
      height: '42px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #c8a96e, #8b6914)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '700',
      color: '#050508',
      border: '2px solid rgba(200, 169, 110, 0.4)',
      cursor: 'pointer',
    } as React.CSSProperties,

    notifBell: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: 'rgba(200, 169, 110, 0.08)',
      border: '1px solid rgba(200, 169, 110, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '18px',
    } as React.CSSProperties,

    mainContent: {
      padding: '40px',
      maxWidth: '1600px',
      margin: '0 auto',
    } as React.CSSProperties,

    welcomeBanner: {
      background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.12) 0%, rgba(200, 169, 110, 0.04) 50%, rgba(10, 10, 20, 0.8) 100%)',
      border: '1px solid rgba(200, 169, 110, 0.25)',
      borderRadius: '20px',
      padding: '32px 40px',
      marginBottom: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

    welcomeGlow: {
      position: 'absolute' as const,
      top: '-50px',
      right: '-50px',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(200, 169, 110, 0.15) 0%, transparent 70%)',
      pointerEvents: 'none' as const,
    } as React.CSSProperties,

    welcomeTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#f0e8d8',
      marginBottom: '8px',
    } as React.CSSProperties,

    welcomeSubtitle: {
      fontSize: '15px',
      color: 'rgba(200, 169, 110, 0.7)',
      marginBottom: '0',
    } as React.CSSProperties,

    xpBadge: {
      background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.2), rgba(200, 169, 110, 0.05))',
      border: '1px solid rgba(200, 169, 110, 0.4)',
      borderRadius: '16px',
      padding: '16px 24px',
      textAlign: 'center' as const,
    } as React.CSSProperties,

    xpNumber: {
      fontSize: '36px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #c8a96e, #f0d898)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'block',
    } as React.CSSProperties,

    xpLabel: {
      fontSize: '12px',
      color: 'rgba(200, 169, 110, 0.6)',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginTop: '4px',
    } as React.CSSProperties,

    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginBottom: '28px',
    } as React.CSSProperties,

    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '28px',
    } as React.CSSProperties,

    grid21: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
      marginBottom: '28px',
    } as React.CSSProperties,

    card: {
      background: 'linear-gradient(145deg, #0d0d18, #080810)',
      border: '1px solid rgba(200, 169, 110, 0.12)',
      borderRadius: '18px',
      padding: '28px',
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

    cardTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#c8a96e',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    cardTitleIcon: {
      fontSize: '18px',
    } as React.CSSProperties,

    progressSection: {
      marginBottom: '0',
    } as React.CSSProperties,

    progressItem: {
      marginBottom: '18px',
    } as React.CSSProperties,

    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    } as React.CSSProperties,

    progressLabel: {
      fontSize: '13px',
      color: '#d0c8b8',
      fontWeight: '500',
    } as React.CSSProperties,

    progressPercent: {
      fontSize: '13px',
      color: '#c8a96e',
      fontWeight: '700',
    } as React.CSSProperties,

    progressBar: {
      height: '6px',
      backgroundColor: 'rgba(200, 169, 110, 0.1)',
      borderRadius: '10px',
      overflow: 'hidden',
    } as React.CSSProperties,

    progressFill: (percent: number, color: string) => ({
      height: '100%',
      width: `${percent}%`,
      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
      borderRadius: '10px',
      transition: 'width 1s ease',
    } as React.CSSProperties),

    certGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '14px',
    } as React.CSSProperties,

    certItem: {
      background: 'rgba(200, 169, 110, 0.06)',
      border: '1px solid rgba(200, 169, 110, 0.18)',
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    } as React.CSSProperties,

    certBadge: {
      fontSize: '28px',
      marginBottom: '4px',
    } as React.CSSProperties,

    certName: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#f0e8d8',
      lineHeight: '1.3',
    } as React.CSSProperties,

    certDate: {
      fontSize: '11px',
      color: 'rgba(200, 169, 110, 0.6)',
    } as React.CSSProperties,

    certVerified: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: 'rgba(72, 199, 142, 0.15)',
      border: '1px solid rgba(72, 199, 142, 0.3)',
      borderRadius: '20px',
      padding: '2px 8px',
      fontSize: '10px',
      color: '#48c78e',
      fontWeight: '600',
      width: 'fit-content',
    } as React.CSSProperties,

    sessionCard: {
      background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.1), rgba(200, 169, 110, 0.02))',
      border: '1px solid rgba(200, 169, 110, 0.25)',
      borderRadius: '14px',
      padding: '20px',
      marginBottom: '16px',
    } as React.CSSProperties,

    sessionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#f0e8d8',
      marginBottom: '8px',
    } as React.CSSProperties,

    sessionMeta: {
      display: 'flex',
      gap: '16px',
      marginBottom: '14px',
    } as React.CSSProperties,

    sessionMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: 'rgba(200, 169, 110, 0.7)',
    } as React.CSSProperties,

    btnPrimary: {
      background: 'linear-gradient(135deg, #c8a96e, #a07840)',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 20px',
      color: '#050508',
      fontWeight: '700',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,

    btnSecondary: {
      background: 'rgba(200, 169, 110, 0.08)',
      border: '1px solid rgba(200, 169, 110, 0.25)',
      borderRadius: '10px',
      padding: '10px 20px',
      color: '#c8a96e',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,

    chatContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '340px',
    } as React.CSSProperties,

    chatMessages: {
      flex: 1,
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginBottom: '16px',
      paddingRight: '4px',
    } as React.CSSProperties,

    chatBubbleAI: {
      background: 'rgba(200, 169, 110, 0.08)',
      border: '1px solid rgba(200, 169, 110, 0.15)',
      borderRadius: '14px 14px 14px 4px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#d0c8b8',
      maxWidth: '85%',
      lineHeight: '1.5',
    } as React.CSSProperties,

    chatBubbleUser: {
      background: 'rgba(200, 169, 110, 0.15)',
      border: '1px solid rgba(200, 169, 110, 0.3)',
      borderRadius: '14px 14px 4px 14px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#f0e8d8',
      maxWidth: '85%',
      lineHeight: '1.5',
      alignSelf: 'flex-end' as const,
    } as React.CSSProperties,

    aiLabel: {
      fontSize: '10px',
      color: '#c8a96e',
      fontWeight: '700',
      marginBottom: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    chatInput: {
      display: 'flex',
      gap: '10px',
    } as React.CSSProperties,

    chatField: {
      flex: 1,
      background: 'rgba(200, 169, 110, 0.06)',
      border: '1px solid rgba(200, 169, 110, 0.2)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#e8e0d0',
      fontSize: '13px',
      outline: 'none',
    } as React.CSSProperties,

    sendBtn: {
      background: 'linear-gradient(135deg, #c8a96e, #a07840)',
      border: 'none',
      borderRadius: '12px',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#050508',
      fontWeight: '700',
    } as React.CSSProperties,

    gamifRow: {
      display: 'flex',
      gap: '16px',
      marginBottom: '20px',
    } as React.CSSProperties,

    gamifStat: {
      flex: 1,
      background: 'rgba(200, 169, 110, 0.06)',
      border: '1px solid rgba(200,