export default async function DashboardPage() {

  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050508',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d0d14 0%, #12121e 100%)',
          border: '1px solid #c8a96e33',
          borderRadius: '24px',
          padding: '60px 50px',
          textAlign: 'center',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 0 60px #c8a96e15',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: '36px',
            boxShadow: '0 0 30px #c8a96e40',
          }}>
            🎓
          </div>
          <h1 style={{
            color: '#c8a96e',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
          }}>
            AcadémIA Pro
          </h1>
          <p style={{
            color: '#8888aa',
            fontSize: '15px',
            margin: '0 0 36px',
            lineHeight: '1.6',
          }}>
            Connectez-vous pour accéder à votre espace apprenant personnalisé et continuer votre parcours.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
              color: '#050508',
              padding: '16px 40px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '15px',
              textDecoration: 'none',
              letterSpacing: '0.3px',
              boxShadow: '0 4px 20px #c8a96e40',
              transition: 'all 0.2s',
            }}
          >
            Se connecter →
          </a>
          <p style={{
            color: '#555566',
            fontSize: '13px',
            marginTop: '24px',
          }}>
            Pas encore de compte ?{' '}
            <a href="/register" style={{ color: '#c8a96e', textDecoration: 'none' }}>
              S'inscrire gratuitement
            </a>
          </p>
        </div>
      </div>
    );
  }

  const userId = session.user.id;
  const userEmail = session.user.email || '';
  const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Apprenant';
  const userAvatar = session.user.user_metadata?.avatar_url || null;

  const [
    { data: formations },
    { data: progressions },
    { data: certificats },
    { data: seances },
    { data: badges },
    { data: profil },
  ] = await Promise.all([
    supabase
      .from('formations_achetees')
      .select('id, titre, description, categorie, duree_totale, thumbnail_url, slug, date_achat, statut')
      .eq('user_id', userId)
      .order('date_achat', { ascending: false }),
    supabase
      .from('progressions')
      .select('formation_id, pourcentage, derniere_activite, modules_completes, total_modules, xp_gagne')
      .eq('user_id', userId),
    supabase
      .from('certificats')
      .select('id, titre, formation_id, date_obtention, code_verification, image_url')
      .eq('user_id', userId)
      .order('date_obtention', { ascending: false }),
    supabase
      .from('seances')
      .select('id, titre, description, date_heure, duree_minutes, lien_reunion, formateur_nom, statut, formation_id')
      .eq('user_id', userId)
      .gte('date_heure', new Date().toISOString())
      .order('date_heure', { ascending: true })
      .limit(3),
    supabase
      .from('badges')
      .select('id, nom, description, icone, couleur, date_obtention, categorie')
      .eq('user_id', userId)
      .order('date_obtention', { ascending: false }),
    supabase
      .from('profils')
      .select('xp_total, niveau, streak_jours, objectif_hebdo, heures_apprises, rang')
      .eq('user_id', userId)
      .single(),
  ]);

  const xpTotal = profil?.xp_total || 0;
  const niveau = profil?.niveau || 1;
  const streak = profil?.streak_jours || 0;
  const heuresApprises = profil?.heures_apprises || 0;
  const rang = profil?.rang || 'Débutant';
  const xpPourNiveauSuivant = niveau * 500;
  const xpProgress = Math.min((xpTotal % 500) / 500 * 100, 100);

  const formationsEnCours = (formations || []).filter((f: { id: string }) => {
    const prog = (progressions || []).find((p: { formation_id: string }) => p.formation_id === f.id);
    return prog && prog.pourcentage < 100;
  });

  const formationsTerminees = (formations || []).filter((f: { id: string }) => {
    const prog = (progressions || []).find((p: { formation_id: string }) => p.formation_id === f.id);
    return prog && prog.pourcentage >= 100;
  });

  const prochainSeance = seances && seances.length > 0 ? seances[0] : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateCourt = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return '#4ade80';
    if (pct >= 50) return '#c8a96e';
    return '#6366f1';
  };

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0d0d14 0%, #10101a 100%)',
    border: '1px solid #c8a96e22',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 4px 24px #00000040',
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: '#c8a96e',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: '#e8e8f0',
    }}>

      <nav style={{
        background: 'linear-gradient(180deg, #0a0a12 0%, #050508 100%)',
        borderBottom: '1px solid #c8a96e18',
        padding: '0 32px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, #c8a96e, #e8c98e)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 0 20px #c8a96e30',
          }}>
            🎓
          </div>
          <div>
            <div style={{ color: '#c8a96e', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>
              AcadémIA Pro
            </div>
            <div style={{ color: '#555566', fontSize: '11px' }}>Tableau de bord</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'Formations', href: '/formations', icon: '📚' },
              { label: 'IA Agent', href: '/agent', icon: '🤖' },
              { label: 'Certificats', href: '/certificats', icon: '🏆' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  color: '#8888aa',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#c8a96e18',
              border: '1px solid #c8a96e33',
              borderRadius: '20px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={{ color: '#c8a96e', fontWeight: '700', fontSize: '13px' }}>{xpTotal.toLocaleString()} XP</span>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: userAvatar ? `url(${userAvatar}) center/cover` : 'linear-gradient(135deg, #c8a96e, #8866aa)',
              border: '2px solid #c8a96e44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#050508',
              overflow: 'hidden',
            }}>
              {!userAvatar && userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

        <div style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #14101e 50%, #0f0f1a 100%)',
          border: '1px solid #c8a96e22',
          borderRadius: '28px',
          padding: '40px 44px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 40px #c8a96e08',
        }}>
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, #c8a96e12 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '30%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, #6366f110 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#666677', fontSize: '13px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Bonjour 👋
              </div>
              <h1 style={{
                color: '#f0f0f8',
                fontSize: '32px',
                fontWeight: '800',
                margin: '0 0 6px',
                letterSpacing: '-0.8px',
              }}>
                {userName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{
                  background: '#c8a96e18',
                  border: '1px solid #c8a96e33',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  color: '#c8a96e',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  🏅 {rang}
                </div