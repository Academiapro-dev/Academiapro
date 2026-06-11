export default function LiveSession({ params }: { params: { sessionId: string } }) {
  const [status, setStatus] = React.useState<'waiting' | 'active' | 'ended'>('active');
  const [micOn, setMicOn] = React.useState(true);
  const [cameraOn, setCameraOn] = React.useState(true);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState([
    { id: 1, sender: 'IA', text: 'Bonjour ! Je suis votre assistant AcadémIA Pro. Comment puis-je vous aider aujourd\'hui ?', time: '14:32' },
    { id: 2, sender: 'Vous', text: 'J\'aimerais comprendre les dérivées partielles.', time: '14:33' },
    { id: 3, sender: 'IA', text: 'Parfait ! Commençons par les bases. Une dérivée partielle mesure la variation d\'une fonction par rapport à une seule variable, en maintenant les autres constantes.', time: '14:33' },
  ]);
  const [participants] = React.useState([
    { id: 1, name: 'Vous', role: 'Étudiant', active: true },
    { id: 2, name: 'AcadémIA', role: 'Tuteur IA', active: true },
  ]);
  const [avatarPulse, setAvatarPulse] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'active') {
        setDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  React.useEffect(() => {
    const pulse = setInterval(() => {
      setAvatarPulse(prev => !prev);
      setSpeaking(prev => !prev);
    }, 2000);
    return () => clearInterval(pulse);
  }, []);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'Vous',
      text: message,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        sender: 'IA',
        text: 'Excellente question ! Je vais vous expliquer cela en détail avec des exemples concrets adaptés à votre niveau.',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleEndSession = () => {
    setStatus('ended');
  };

  const statusConfig = {
    waiting: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    active: { label: 'En cours', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    ended: { label: 'Terminée', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  };

  const currentStatus = statusConfig[status];

  if (status === 'ended') {
    return React.createElement(
      'div',
      {
        style: {
          minHeight: '100vh',
          background: '#050508',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }
      },
      React.createElement(
        'div',
        {
          style: {
            textAlign: 'center',
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.03))',
            border: '1px solid rgba(200,169,110,0.2)',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '90%',
          }
        },
        React.createElement(
          'div',
          {
            style: {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8a96e, #a07840)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '36px',
            }
          },
          '✓'
        ),
        React.createElement('h2', {
          style: { color: '#c8a96e', fontSize: '28px', fontWeight: '700', margin: '0 0 12px' }
        }, 'Séance terminée'),
        React.createElement('p', {
          style: { color: 'rgba(255,255,255,0.6)', fontSize: '16px', margin: '0 0 8px' }
        }, `Durée totale : ${formatDuration(duration)}`),
        React.createElement('p', {
          style: { color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 32px' }
        }, `Session ID : ${params.sessionId}`),
        React.createElement(
          'button',
          {
            onClick: () => setStatus('active'),
            style: {
              background: 'linear-gradient(135deg, #c8a96e, #a07840)',
              color: '#050508',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
            }
          },
          'Nouvelle séance'
        )
      )
    );
  }

  return React.createElement(
    'div',
    {
      style: {
        minHeight: '100vh',
        background: '#050508',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    },

    React.createElement(
      'header',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(200,169,110,0.15)',
          background: 'rgba(5,5,8,0.95)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        React.createElement(
          'div',
          {
            style: {
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c8a96e, #a07840)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '800',
              color: '#050508',
            }
          },
          'A'
        ),
        React.createElement(
          'div',
          null,
          React.createElement('span', {
            style: { color: '#c8a96e', fontWeight: '700', fontSize: '18px', letterSpacing: '-0.3px' }
          }, 'AcadémIA'),
          React.createElement('span', {
            style: { color: 'rgba(255,255,255,0.4)', fontWeight: '400', fontSize: '18px' }
          }, ' Pro')
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: currentStatus.bg,
              border: `1px solid ${currentStatus.color}40`,
            }
          },
          React.createElement('div', {
            style: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentStatus.color,
              boxShadow: status === 'active' ? `0 0 8px ${currentStatus.color}` : 'none',
              animation: status === 'active' ? 'pulse 2s infinite' : 'none',
            }
          }),
          React.createElement('span', {
            style: { color: currentStatus.color, fontSize: '13px', fontWeight: '600' }
          }, currentStatus.label)
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
            }
          },
          React.createElement('span', { style: { fontSize: '14px' } }, '⏱'),
          React.createElement('span', {
            style: { color: '#c8a96e', fontSize: '14px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }
          }, formatDuration(duration))
        ),
        React.createElement(
          'div',
          {
            style: {
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
            }
          },
          React.createElement('span', {
            style: { color: 'rgba(255,255,255,0.5)', fontSize: '12px' }
          }, `#${params.sessionId}`)
        )
      )
    ),

    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 73px)',
          overflow: 'hidden',
        }
      },

      React.createElement(
        'div',
        {
          style: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '20px',
            overflow: 'auto',
          }
        },

        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              gap: '16px',
              padding: '12px 16px',
              background: 'rgba(200,169,110,0.06)',
              border: '1px solid rgba(200,169,110,0.15)',
              borderRadius: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }
          },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('span', { style: { fontSize: '16px' } }, '📐'),
            React.createElement('div', null,
              React.createElement('div', {
                style: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }
              }, 'Spécialité'),
              React.createElement('div', {
                style: { color: '#c8a96e', fontSize: '14px', fontWeight: '600' }
              }, 'Mathématiques · Analyse')
            )
          ),
          React.createElement('div', { style: { width: '1px', height: '32px', background: 'rgba(200,169,110,0.2)' } }),
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('span', { style: { fontSize: '16px' } }, '🎓'),
            React.createElement('div', null,
              React.createElement('div', {
                style: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }
              }, 'Niveau'),
              React.createElement('div', {
                style: { color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }
              }, 'Licence 2 · Semestre 3')
            )
          ),
          React.createElement('div', { style: { width: '1px', height: '32px', background: 'rgba(200,169,110,0.2)' } }),
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('span', { style: { fontSize: '16px' } }, '👥'),
            React.createElement('div', null,
              React.createElement('div', {
                style: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }
              }, 'Participants'),
              React.createElement('div', {
                style: { color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }
              }, `${participants.length} connectés`)
            )
          )
        ),

        React.createElement(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              flex: 1,
            }
          },

          React.