export default function MiniCours() {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#050508',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#ffffff',
    overflowX: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px 60px',
    maxWidth: '800px',
    margin: '0 auto',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'rgba(200, 169, 110, 0.15)',
    border: '1px solid rgba(200, 169, 110, 0.4)',
    color: '#c8a96e',
    padding: '6px 18px',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '32px',
  };

  const h1Style: React.CSSProperties = {
    fontSize: 'clamp(32px, 6vw, 64px)',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '24px',
    letterSpacing: '-1px',
  };

  const gradientTextStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #c8a96e 0%, #f0d9a8 50%, #c8a96e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.6',
    marginBottom: '16px',
  };

  const highlightStyle: React.CSSProperties = {
    color: '#c8a96e',
    fontWeight: '600',
  };

  const dividerStyle: React.CSSProperties = {
    width: '60px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)',
    margin: '48px auto',
  };

  const daysContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '680px',
    margin: '0 auto',
    padding: '0 20px 64px',
  };

  const dayCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(200, 169, 110, 0.12)',
    borderRadius: '16px',
    padding: '24px 28px',
    transition: 'all 0.3s ease',
  };

  const dayNumberStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.2), rgba(200, 169, 110, 0.05))',
    border: '1px solid rgba(200, 169, 110, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '800',
    color: '#c8a96e',
  };

  const dayContentStyle: React.CSSProperties = {
    flex: 1,
  };

  const dayLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(200, 169, 110, 0.7)',
    marginBottom: '6px',
  };

  const dayTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '6px',
  };

  const dayDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: '1.5',
  };

  const formSectionStyle: React.CSSProperties = {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '0 20px 100px',
  };

  const formCardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(200, 169, 110, 0.2)',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 0 80px rgba(200, 169, 110, 0.05)',
  };

  const formTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#ffffff',
  };

  const formSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginBottom: '36px',
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c8a96e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '44px',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#050508',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    marginTop: '8px',
    transition: 'opacity 0.2s, transform 0.2s',
  };

  const guaranteeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.35)',
  };

  const dotStyle: React.CSSProperties = {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'rgba(200, 169, 110, 0.4)',
  };

  const statsBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    padding: '32px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '64px',
    flexWrap: 'wrap',
  };

  const statItemStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '800',
    color: '#c8a96e',
    lineHeight: '1',
    marginBottom: '6px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: '0.5px',
  };

  const logoStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  };

  const logoSpanStyle: React.CSSProperties = {
    color: '#c8a96e',
    fontWeight: '700',
  };

  const days = [
    {
      number: '1',
      label: 'Jour 1 · 15 min',
      title: 'Ton premier prompt parfait',
      desc: 'Structure, contexte, contraintes — la formule exacte pour des résultats professionnels immédiatement.',
    },
    {
      number: '2',
      label: 'Jour 2 · 15 min',
      title: 'Automatiser ta première tâche',
      desc: 'Identifie une tâche répétitive et construis ton workflow IA personnel. Gain de temps garanti.',
    },
    {
      number: '3',
      label: 'Jour 3 · 15 min',
      title: 'Déployer ton premier agent IA',
      desc: 'Crée un agent qui travaille pour toi, prend des décisions et produit des livrables autonomes.',
    },
  ];

  const metiers = [
    'Mon métier...',
    'Entrepreneur / Fondateur',
    'Marketing & Communication',
    'Développeur / Tech',
    'Consultant / Coach',
    'Commercial / Ventes',
    'Créateur de contenu',
    'Ressources Humaines',
    'Finance / Comptabilité',
    'Enseignant / Formateur',
    'Étudiant',
    'Autre',
  ];

  return (
    <div style={containerStyle}>

      <div style={logoStyle}>
        <span style={logoSpanStyle}>Académ</span>IA Pro
      </div>

      <div style={headerStyle}>
        <div style={badgeStyle}>✦ Mini-cours gratuit</div>
        <h1 style={h1Style}>
          Maîtrise{' '}
          <span style={gradientTextStyle}>Claude</span>
          <br />
          en 3 jours
        </h1>
        <p style={subtitleStyle}>
          <span style={highlightStyle}>15 minutes par jour.</span> Pas de blabla théorique.
          <br />
          Des compétences concrètes que tu utilises dès demain.
        </p>
        <p style={{ ...subtitleStyle, fontSize: '14px' }}>
          Rejoins{' '}
          <span style={highlightStyle}>2 847 professionnels</span>{' '}
          qui ont déjà transformé leur façon de travailler.
        </p>
      </div>

      <div style={statsBarStyle}>
        <div style={statItemStyle}>
          <div style={statValueStyle}>3</div>
          <div style={statLabelStyle}>Jours de formation</div>
        </div>
        <div style={statItemStyle}>
          <div style={statValueStyle}>15<span style={{ fontSize: '16px' }}>min</span></div>
          <div style={statLabelStyle}>Par jour seulement</div>
        </div>
        <div style={statItemStyle}>
          <div style={statValueStyle}>100%</div>
          <div style={statLabelStyle}>Gratuit</div>
        </div>
        <div style={statItemStyle}>
          <div style={statValueStyle}>∞</div>
          <div style={statLabelStyle}>Impact sur ta carrière</div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 16px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: 'rgba(200, 169, 110, 0.6)',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          Programme des 3 jours
        </p>
      </div>

      <div style={daysContainerStyle}>
        {days.map((day) => (
          <div key={day.number} style={dayCardStyle}>
            <div style={dayNumberStyle}>{day.number}</div>
            <div style={dayContentStyle}>
              <div style={dayLabelStyle}>{day.label}</div>
              <div style={dayTitleStyle}>{day.title}</div>
              <div style={dayDescStyle}>{day.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={dividerStyle} />

      <div style={formSectionStyle}>
        <div style={formCardStyle}>
          <div style={formTitleStyle}>
            Je veux ma{' '}
            <span style={gradientTextStyle}>formation gratuite</span>
          </div>
          <div style={formSubtitleStyle}>
            Reçois le Jour 1 dans ta boîte mail dans 2 minutes.
          </div>

          <form onSubmit={(e) => e.preventDefault()}>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Ton prénom</label>
              <input
                type="text"
                placeholder="Alexandre"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(200, 169, 110,