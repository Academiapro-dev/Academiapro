import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--s1)',
      borderTop: '1px solid var(--border)',
      padding: '52px 6% 32px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: 40, marginBottom: 40,
      }}>
        {/* Brand */}
        <div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 22, color: 'var(--gold)', fontWeight: 700,
            marginBottom: 12,
          }}>🎓 AcadémIA Pro</div>
          <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 16 }}>
            Premier centre de formation professionnelle 100% piloté par l'IA. Formateur Expert IA 24h/24, Coach Personnel, 43 formations certifiantes.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['CPF ✓', 'OPCO ✓', 'DOM-TOM ✓', 'Handicap ✓'].map(tag => (
              <span key={tag} style={{
                padding: '3px 10px', borderRadius: 8,
                background: 'var(--gold-pale)',
                border: '1px solid var(--border)',
                fontSize: 10, color: 'var(--gold)', fontWeight: 600,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Formations */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Formations</div>
          {[['IA & No-Code', '/formations?cat=ia'], ['Bien-être', '/formations?cat=bienetre'], ['Métiers', '/formations?cat=metiers'], ['Langues', '/formations?cat=langues'], ['Outils', '/formations?cat=outils']].map(([l, h]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: 13, color: 'var(--dim)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
            >{l}</Link>
          ))}
        </div>

        {/* Infos */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Informations</div>
          {[['Financement CPF', '/financement'], ['Accessibilité', '/accessibilite'], ['DOM-TOM', '/domtom'], ['Blog', '/blog'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: 13, color: 'var(--dim)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
            >{l}</Link>
          ))}
        </div>

        {/* Légal */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Légal</div>
          {[['Mentions légales', '/mentions-legales'], ['CGV', '/cgv'], ['Confidentialité', '/confidentialite'], ['Accessibilité', '/accessibilite'], ['Réclamation', '/reclamation']].map(([l, h]) => (
            <Link key={h} href={h} style={{ display: 'block', fontSize: 13, color: 'var(--dim)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
            >{l}</Link>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 24, borderTop: '1px solid var(--border)',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>
          © 2026 AcadémIA Pro SAS · NDA [À compléter] · Qualiopi en cours
        </span>
        <span style={{ fontSize: 11, color: 'var(--dim)' }}>
          🇫🇷 France & DOM-TOM · Distanciel 100% · CPF · OPCO
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
