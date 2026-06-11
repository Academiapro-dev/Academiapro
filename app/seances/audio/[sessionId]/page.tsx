export default function AudioSessionPage({ params }: { params: { sessionId: string } }) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [messages, setMessages] = React.useState<Array<{ role: string; content: string; time: string }>>([
    { role: 'assistant', content: 'Bonjour, je suis Dr. Aria. Comment vous sentez-vous aujourd\'hui ?', time: '00:00' },
  ]);
  const [inputText, setInputText] = React.useState('');
  const [audioLevels, setAudioLevels] = React.useState<number[]>(Array(32).fill(4));
  const [sessionNotes, setSessionNotes] = React.useState('');
  const [showNotes, setShowNotes] = React.useState(false);
  const [pulseScale, setPulseScale] = React.useState(1);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioAnimRef = React.useRef<NodeJS.Timeout | null>(null);
  const pulseRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setTimeout(() => setIsConnected(true), 1500);
  }, []);

  React.useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  React.useEffect(() => {
    if (isSpeaking || isListening) {
      audioAnimRef.current = setInterval(() => {
        setAudioLevels(
          Array(32).fill(0).map(() =>
            isSpeaking
              ? Math.floor(Math.random() * 60) + 10
              : Math.floor(Math.random() * 30) + 5
          )
        );
      }, 80);
    } else {
      setAudioLevels(Array(32).fill(4));
    }
    return () => {
      if (audioAnimRef.current) clearInterval(audioAnimRef.current);
    };
  }, [isSpeaking, isListening]);

  React.useEffect(() => {
    pulseRef.current = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.08 : 1);
    }, 1200);
    return () => {
      if (pulseRef.current) clearInterval(pulseRef.current);
    };
  }, []);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const time = formatDuration(duration);
    const newMsg = { role: 'user', content: inputText, time };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsSpeaking(false);
    setIsListening(false);
    setTimeout(() => {
      setIsSpeaking(true);
      setTimeout(() => {
        const responses = [
          'Je vous entends. Pouvez-vous m\'en dire davantage sur ce que vous ressentez ?',
          'C\'est tout à fait compréhensible. Explorons cela ensemble.',
          'Vos émotions sont valides. Comment cela se manifeste-t-il au quotidien ?',
          'Merci de partager cela avec moi. Qu\'est-ce qui vous a amené à cette pensée ?',
        ];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: reply, time: formatDuration(duration) }]);
        setTimeout(() => setIsSpeaking(false), 2000);
      }, 1500);
    }, 300);
  };

  const handleMicToggle = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setIsSpeaking(false);
    }
  };

  const handleEndSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    alert(`Séance terminée. Durée : ${formatDuration(duration)}. Merci d'avoir utilisé AcadémIA Pro.`);
  };

  const specialties = ['Thérapie Cognitive', 'Gestion du stress', 'Développement personnel'];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050508',
        color: '#e8e0d0',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(200,169,110,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          borderBottom: '1px solid rgba(200,169,110,0.12)',
          backgroundColor: 'rgba(5,5,8,0.95)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #c8a96e, #a07840)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px', color: '#c8a96e' }}>
              AcadémIA Pro
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.6)', letterSpacing: '1px' }}>
              SESSION #{params.sessionId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(200,169,110,0.08)',
              border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(200,169,110,0.2)'}`,
              borderRadius: '20px',
              padding: '6px 14px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#22c55e' : '#c8a96e',
                animation: isConnected ? 'none' : undefined,
              }}
            />
            <span style={{ fontSize: '12px', color: isConnected ? '#22c55e' : '#c8a96e', fontWeight: '500' }}>
              {isConnected ? 'Connecté' : 'Connexion...'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: '20px',
              padding: '6px 14px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#c8a96e' }}>⏱</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#c8a96e', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(duration)}
            </span>
          </div>

          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              backgroundColor: showNotes ? 'rgba(200,169,110,0.15)' : 'rgba(200,169,110,0.06)',
              border: '1px solid rgba(200,169,110,0.25)',
              borderRadius: '8px',
              padding: '7px 14px',
              color: '#c8a96e',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            📝 Notes
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 73px)' }}>

        <div
          style={{
            width: '280px',
            minWidth: '280px',
            borderRight: '1px solid rgba(200,169,110,0.1)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(200,169,110,0.04)',
              border: '1px solid rgba(200,169,110,0.12)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '90px',
                height: '90px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, #c8a96e, rgba(200,169,110,0.1), #c8a96e)',
                  transform: `scale(${isSpeaking ? pulseScale : 1})`,
                  transition: 'transform 0.4s ease',
                  opacity: isSpeaking ? 1 : 0.3,
                }}
              />
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a1508, #2d2010)',
                  border: '2px solid rgba(200,169,110,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '42px',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: isSpeaking
                    ? '0 0 30px rgba(200,169,110,0.4), inset 0 0 20px rgba(200,169,110,0.1)'
                    : '0 0 15px rgba(200,169,110,0.15)',
                }}
              >
                🧠
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#e8e0d0', marginBottom: '4px' }}>
                Dr. Aria
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#c8a96e',
                  backgroundColor: 'rgba(200,169,110,0.1)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '6px',
                }}
              >
                IA Thérapeute
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(232,224,208,0.5)' }}>
                {isSpeaking ? '🔊 En train de parler...' : isListening ? '🎙 À l\'écoute...' : '💬 En attente'}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(200,169,110,0.04)',
              border: '1px solid rgba(200,169,110,0.12)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'rgba(200,169,110,0.6)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Spécialités
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {specialties.map((spec, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'rgba(232,224,208,0.8)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#c8a96e',
                      opacity: 0.8,
                    }}
                  />
                  {spec}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(200,169,110,0.04)',
              border: