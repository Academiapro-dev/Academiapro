export default async function GamificationPage() {

  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: leaderboardData } = await supabase
    .from('user_profiles')
    .select('id, username, avatar_url, xp_total, level, streak_days, badges_count')
    .order('xp_total', { ascending: false })
    .limit(10);

  const { data: badgesData } = await supabase
    .from('badges')
    .select('id, name, description, icon_url, rarity, xp_reward, unlocked_at')
    .order('rarity', { ascending: false })
    .limit(12);

  const { data: challengesData } = await supabase
    .from('weekly_challenges')
    .select('id, title, description, xp_reward, progress, target, deadline, category, difficulty')
    .eq('is_active', true)
    .order('xp_reward', { ascending: false });

  const { data: rewardsData } = await supabase
    .from('rewards')
    .select('id, name, description, cost_xp, image_url, category, is_available')
    .eq('is_available', true)
    .order('cost_xp', { ascending: true })
    .limit(8);

  const { data: currentUserData } = await supabase
    .from('user_profiles')
    .select('id, username, avatar_url, xp_total, xp_this_week, level, streak_days, badges_count, rank_position')
    .eq('is_current_session', true)
    .single();

  const leaderboard = leaderboardData || [
    { id: '1', username: 'AlexDupont', avatar_url: null, xp_total: 15420, level: 28, streak_days: 45, badges_count: 23 },
    { id: '2', username: 'MarieC', avatar_url: null, xp_total: 13890, level: 25, streak_days: 32, badges_count: 19 },
    { id: '3', username: 'ThomasB', avatar_url: null, xp_total: 12340, level: 23, streak_days: 28, badges_count: 17 },
    { id: '4', username: 'SophieL', avatar_url: null, xp_total: 11200, level: 21, streak_days: 19, badges_count: 14 },
    { id: '5', username: 'NicolasP', avatar_url: null, xp_total: 9870, level: 19, streak_days: 15, badges_count: 12 },
    { id: '6', username: 'LaurieM', avatar_url: null, xp_total: 8650, level: 17, streak_days: 22, badges_count: 10 },
    { id: '7', username: 'JulienR', avatar_url: null, xp_total: 7430, level: 15, streak_days: 8, badges_count: 9 },
    { id: '8', username: 'CamilleD', avatar_url: null, xp_total: 6210, level: 13, streak_days: 12, badges_count: 7 },
  ];

  const badges = badgesData || [
    { id: '1', name: 'Premier Pas', description: 'Complétez votre première leçon', icon_url: null, rarity: 'common', xp_reward: 50, unlocked_at: '2024-01-15' },
    { id: '2', name: 'Série de Feu', description: '7 jours consécutifs de pratique', icon_url: null, rarity: 'rare', xp_reward: 200, unlocked_at: '2024-01-22' },
    { id: '3', name: 'Maître des Quiz', description: 'Score parfait 10 fois de suite', icon_url: null, rarity: 'epic', xp_reward: 500, unlocked_at: '2024-02-01' },
    { id: '4', name: 'Explorateur', description: 'Découvrez 5 catégories différentes', icon_url: null, rarity: 'common', xp_reward: 100, unlocked_at: null },
    { id: '5', name: 'Génie IA', description: 'Maîtrisez le module Intelligence Artificielle', icon_url: null, rarity: 'legendary', xp_reward: 1000, unlocked_at: null },
    { id: '6', name: 'Nuit Blanche', description: 'Étudiez plus de 4h en une journée', icon_url: null, rarity: 'rare', xp_reward: 300, unlocked_at: '2024-01-28' },
  ];

  const challenges = challengesData || [
    { id: '1', title: 'Sprint Mathématiques', description: 'Complétez 20 exercices de maths cette semaine', xp_reward: 450, progress: 13, target: 20, deadline: '2024-12-22', category: 'Mathématiques', difficulty: 'medium' },
    { id: '2', title: 'Maître du Code', description: 'Résolvez 5 algorithmes complexes', xp_reward: 800, progress: 2, target: 5, deadline: '2024-12-22', category: 'Programmation', difficulty: 'hard' },
    { id: '3', title: 'Polyglotte Express', description: 'Pratiquez 3 langues différentes', xp_reward: 350, progress: 1, target: 3, deadline: '2024-12-22', category: 'Langues', difficulty: 'easy' },
    { id: '4', title: 'Série Parfaite', description: 'Maintenez une série de 7 jours', xp_reward: 600, progress: 5, target: 7, deadline: '2024-12-22', category: 'Régularité', difficulty: 'medium' },
  ];

  const rewards = rewardsData || [
    { id: '1', name: 'Thème Sombre Pro', description: 'Débloquez le thème premium obsidienne', cost_xp: 2000, image_url: null, category: 'Personnalisation', is_available: true },
    { id: '2', name: 'Cours Exclusif IA', description: 'Accès au module IA avancé', cost_xp: 5000, image_url: null, category: 'Contenu', is_available: true },
    { id: '3', name: 'Mentor Personnel 1h', description: 'Session de mentorat dédiée', cost_xp: 8000, image_url: null, category: 'Service', is_available: true },
    { id: '4', name: 'Avatar Légendaire', description: 'Cadre de profil exclusif or', cost_xp: 3500, image_url: null, category: 'Personnalisation', is_available: true },
  ];

  const currentUser = currentUserData || {
    id: 'me',
    username: 'Vous',
    avatar_url: null,
    xp_total: 9870,
    xp_this_week: 1240,
    level: 19,
    streak_days: 15,
    badges_count: 12,
    rank_position: 5
  };

  const xpForCurrentLevel = currentUser.level * 500;
  const xpForNextLevel = (currentUser.level + 1) * 500;
  const xpProgress = ((currentUser.xp_total % 500) / 500) * 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ff9500';
      case 'epic': return '#bf5af2';
      case 'rare': return '#0a84ff';
      case 'common': return '#30d158';
      default: return '#8e8e93';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'Légendaire';
      case 'epic': return 'Épique';
      case 'rare': return 'Rare';
      case 'common': return 'Commun';
      default: return 'Normal';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return '#ff453a';
      case 'medium': return '#ffd60a';
      case 'easy': return '#30d158';
      default: return '#8e8e93';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'Difficile';
      case 'medium': return 'Moyen';
      case 'easy': return 'Facile';
      default: return 'Normal';
    }
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getBadgeIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Premier Pas': '👣',
      'Série de Feu': '🔥',
      'Maître des Quiz': '🎯',
      'Explorateur': '🗺️',
      'Génie IA': '🤖',
      'Nuit Blanche': '🌙',
    };
    return icons[name] || '🏆';
  };

  return (
    <div style={{
      backgroundColor: '#050508',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: '#ffffff',
      overflowX: 'hidden',
    }}>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(5, 5, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(200, 169, 110, 0.15)',
        padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c8a96e, #f0d080)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>🎓</div>
            <div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c8a96e', letterSpacing: '-0.3px' }}>AcadémIA</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}> Pro</span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {['Tableau de bord', 'Cours', 'Gamification', 'Communauté'].map((item, i) => (
              <a key={i} href="#" style={{
                color: i === 2 ? '#c8a96e' : 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: i === 2 ? 600 : 400,
                borderBottom: i === 2 ? '2px solid #c8a96e' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'color 0.2s',
              }}>{item}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(200, 169, 110, 0.1)',
              border: '1px solid rgba(200, 169, 110, 0.3)',
              borderRadius: '20px',
              padding: '6px 14px',
            }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={{ color: '#c8a96e', fontWeight: 700, fontSize: '0.9rem' }}>{currentUser.xp_total.toLocaleString()} XP</span>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8a96e, #f0d080)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
              color: '#050508',
            }}>
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '90px 2rem 3rem',
      }}>

        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #c8a96e20, #c8a96e40)',
              border: '1px solid rgba(200, 169, 110, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>🏆</div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff, #c8a96e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip
}}}