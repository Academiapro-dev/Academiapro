export default function AudioSessionPage({ params }: { params: { sessionId: string } }) {
  const [status, setStatus] = React.useState<'waiting' | 'active' | 'ended'>('waiting');
  const [isMicOn, setIsMicOn] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
    { role: 'ai', text: 'Bonjour, je suis votre assistant AcadémIA Pro. Comment puis-je vous aider aujourd\'hui ?', time: '09:00' },
  ]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [duration, setDuration] = React.useState(0);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (status === 'active') {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  React.useEffect(() => {
    if (status === 'active') {
      const speakInterval = setInterval(() => {
        setIsAvatarSpeaking(prev => !prev);
      }, 2000);
      return () => clearInterval(speakInterval);
    }
  }, [status]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartSession = () => {
    setStatus('active');
    setIsAvatarSpeaking(true);
  };

  const handleEndSession = () => {
    setStatus('ended');
    setIsMicOn(false);
    setIsAvatarSpeaking(false);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMessages(prev => [...prev, { role: 'user', text: inputMessage, time }]);
    setInputMessage('');
    setTimeout(() => {
      const responses = [
        'Excellente question. Voici ce que je peux vous expliquer à ce sujet...',
        'Je comprends votre point de vue. Permettez-moi d\'approfondir ce concept.',
        'Très bien. Analysons cela ensemble étape par étape.',
        'C\'est un aspect fondamental que nous allons explorer en détail.',
      ];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      const aiTime = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse, time: aiTime }]);
    }, 1200);
  };

  const statusConfig = {
    waiting: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    active: { label: 'En cours', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    ended: { label: 'Terminée', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };

  const specialties = ['Mathématiques Avancées', 'Physique Quantique', 'Intelligence Artificielle', 'Philosophie'];
  const specialty = specialties[parseInt(params.sessionId || '0') % specialties.length];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050508',
      color: '#e8e0d0',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid rgba(200,169,110,0.15)',
        backgroundColor: 'rgba(5,5,8,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #c8a96e, #a07840)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 20px rgba(200,169,110,0.3)',
          }}>
            🎓
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c8a96e', letterSpacing: '0.5px' }}>AcadémIA Pro</div>
            <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.6)', marginTop: '1px' }}>Séance #{params.sessionId}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: statusConfig[status].bg,
            border: `1px solid ${statusConfig[status].color}30`,
          }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: statusConfig[status].color,
              boxShadow: status === 'active' ? `0 0 8px ${statusConfig[status].color}` : 'none',
              animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: statusConfig[status].color }}>{statusConfig[status].label}</span>
          </div>

          {status === 'active' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
            }}>
              <span style={{ fontSize: '13px', color: '#c8a96e' }}>⏱</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#c8a96e', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(duration)}</span>
            </div>
          )}

          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(200,169,110,0.06)',
            border: '1px solid rgba(200,169,110,0.15)',
            fontSize: '12px',
            color: 'rgba(200,169,110,0.8)',
            fontWeight: 500,
          }}>
            {specialty}
          </div>
        </div>
      </header>

      {}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {}
        <div style={{
          flex: isChatOpen ? '1' : '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
          gap: '40px',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}>
          {}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            position: 'relative',
            zIndex: 1,
          }}>
            {}
            <div style={{ position: 'relative' }}>
              {}
              {isAvatarSpeaking && (
                <>
                  {[1, 2, 3].map(ring => (
                    <div key={ring} style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: `${140 + ring * 40}px`,
                      height: `${140 + ring * 40}px`,
                      borderRadius: '50%',
                      border: `1px solid rgba(200,169,110,${0.3 - ring * 0.08})`,
                      animation: `ripple ${1 + ring * 0.3}s ease-out infinite`,
                      animationDelay: `${ring * 0.2}s`,
                    }} />
                  ))}
                </>
              )}

              {}
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a1508 0%, #0d0a04 50%, #1a1508 100%)',
                border: `2px solid ${isAvatarSpeaking ? '#c8a96e' : 'rgba(200,169,110,0.3)'}`,
                boxShadow: isAvatarSpeaking
                  ? '0 0 40px rgba(200,169,110,0.4), 0 0 80px rgba(200,169,110,0.15), inset 0 0 30px rgba(200,169,110,0.1)'
                  : '0 0 20px rgba(200,169,110,0.1), inset 0 0 20px rgba(200,169,110,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease',
              }}>
                {}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 35% 35%, rgba(200,169,110,0.15) 0%, transparent 60%)',
                }} />

                {}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <div style={{ fontSize: '48px', lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(200,169,110,0.5))' }}>🤖</div>
                  {isAvatarSpeaking && (
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '20px' }}>
                      {[1, 2, 3, 4, 5].map(bar => (
                        <div key={bar} style={{
                          width: '3px',
                          backgroundColor: '#c8a96e',
                          borderRadius: '2px',
                          animation: `soundBar${bar} 0.8s ease-in-out infinite`,
                          animationDelay: `${bar * 0.1}s`,
                          height: `${8 + Math.random() * 12}px`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: statusConfig[status].color,
                border: '2px solid #050508',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: `0 0 10px ${statusConfig[status].color}60`,
              }}>
                {status === 'waiting' ? '⏳' : status === 'active' ? '✨' : '✓'}
              </div>
            </div>

            {}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #c8a96e, #e8c87e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
              }}>
                Assistant IA
              </h2>
              <p style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: 'rgba(200,169,110,0.6)',
                fontWeight: 500,
              }}>
                Spécialiste en {specialty}
              </p>
            </div>

            {}
            {status === 'active' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 20px',
                borderRadius: '20px',
                backgroundColor: 'rgba(200,169,110,0.08)',
                border: '1px solid rgba(200,169,110,0.15)',
              }}>
                {isAvatarSpeaking ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#c8a96e', animation: 'fadePulse