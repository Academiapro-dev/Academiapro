export default async function AdminCertificatsPage() {

  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: certificats, error } = await supabase
    .from('certificats')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: stats } = await supabase
    .from('certificats')
    .select('statut');

  const total = stats?.length || 0;
  const actifs = stats?.filter((c: any) => c.statut === 'actif').length || 0;
  const revoques = stats?.filter((c: any) => c.statut === 'revoque').length || 0;
  const enAttente = stats?.filter((c: any) => c.statut === 'en_attente').length || 0;

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#050508',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#e8e0d0',
    padding: '0',
    margin: '0',
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0a0a12 0%, #0d0d1a 50%, #080810 100%)',
    borderBottom: '1px solid rgba(200, 169, 110, 0.3)',
    padding: '24px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: '0',
    zIndex: 100,
    backdropFilter: 'blur(20px)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const logoIconStyle: React.CSSProperties = {
    width: '42px',
    height: '42px',
    background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#050508',
    boxShadow: '0 4px 20px rgba(200, 169, 110, 0.4)',
  };

  const brandStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const brandNameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2',
  };

  const brandSubStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(200, 169, 110, 0.6)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  };

  const headerActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const adminBadgeStyle: React.CSSProperties = {
    background: 'rgba(200, 169, 110, 0.1)',
    border: '1px solid rgba(200, 169, 110, 0.3)',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '12px',
    color: '#c8a96e',
    letterSpacing: '1px',
  };

  const mainStyle: React.CSSProperties = {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  };

  const pageTitleAccentStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const pageSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(232, 224, 208, 0.5)',
    marginBottom: '40px',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '40px',
  };

  const statCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(200,169,110,0.03) 100%)',
    border: '1px solid rgba(200, 169, 110, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  };

  const statCardGlowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(200, 169, 110, 0.7)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '12px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '42px',
    fontWeight: '700',
    color: '#fff',
    lineHeight: '1',
    marginBottom: '8px',
  };

  const statTrendStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(232, 224, 208, 0.4)',
  };

  const actionsBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
  };

  const primaryBtnStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#050508',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 20px rgba(200, 169, 110, 0.3)',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    background: 'rgba(200, 169, 110, 0.08)',
    border: '1px solid rgba(200, 169, 110, 0.25)',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#c8a96e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  };

  const searchStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200, 169, 110, 0.2)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#e8e0d0',
    outline: 'none',
    width: '280px',
    marginLeft: 'auto',
  };

  const tableContainerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(200,169,110,0.02) 100%)',
    border: '1px solid rgba(200, 169, 110, 0.12)',
    borderRadius: '20px',
    overflow: 'hidden',
  };

  const tableHeaderStyle: React.CSSProperties = {
    padding: '20px 28px',
    borderBottom: '1px solid rgba(200, 169, 110, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(200, 169, 110, 0.03)',
  };

  const tableHeaderTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as const,
  };

  const thStyle: React.CSSProperties = {
    padding: '14px 20px',
    textAlign: 'left' as const,
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(200, 169, 110, 0.7)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid rgba(200, 169, 110, 0.08)',
    background: 'rgba(200, 169, 110, 0.02)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#e8e0d0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle' as const,
  };

  const certIdStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#c8a96e',
    background: 'rgba(200, 169, 110, 0.1)',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-block',
  };

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c8a96e40, #c8a96e20)',
    border: '1px solid rgba(200, 169, 110, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#c8a96e',
    marginRight: '10px',
  };

  const userCellStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const userNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
  };

  const userEmailStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(232, 224, 208, 0.4)',
  };

  const getStatusStyle = (statut: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      letterSpacing: '0.5px',
    };
    if (statut === 'actif') return { ...base, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' };
    if (statut === 'revoque') return { ...base, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
    return { ...base, background: 'rgba(200, 169, 110, 0.1)', color: '#c8a96e', border: '1px solid rgba(200, 169, 110, 0.2)' };
  };

  const getStatusDot = (statut: string): React.CSSProperties => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: statut === 'actif' ? '#22c55e' : statut === 'revoque' ? '#ef4444' : '#c8a96e',
    display: 'inline-block',
  });

  const actionGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const iconBtnStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(200, 169, 110, 0.2)',
    background: 'rgba(200, 169, 110, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    color: '#c8a96e',
  };

  const iconBtnDangerStyle: React.CSSProperties = {
    ...iconBtnStyle,
    border: '1px solid rgba(239, 68, 68, 0.2)',
    background: 'rgba(239, 68, 68, 0.06)',
    color: '#ef4444',
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center' as const,
    padding: '80px 40px',
    color: 'rgba(232, 224, 208, 0.4)',
  };

  const footerStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(200, 169, 110, 0.1)',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    just