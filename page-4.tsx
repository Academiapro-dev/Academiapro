
import Link from 'next/link'

export default function ContactPage() {
  return (
    <>
    
      
        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, marginBottom: 14 }}>
            Nous <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>contacter.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 480, margin: '0 auto' }}>
            Réponse sous 24 heures. UNIA disponible maintenant pour un entretien gratuit.
          </p>
        </section>

        <section style={{ padding: '60px 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, maxWidth: 1000, margin: '0 auto' }}>

            {/* Contacts */}
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Coordonnées</h2>
              {[
                { icon: '📧', label: 'Contact général', value: 'contact@academiapro.fr', link: 'mailto:contact@academiapro.fr' },
                { icon: '🎓', label: 'Admissions & inscriptions', value: 'admissions@academiapro.fr', link: 'mailto:admissions@academiapro.fr' },
                { icon: '💰', label: 'Financement CPF & OPCO', value: 'financement@academiapro.fr', link: 'mailto:financement@academiapro.fr' },
                { icon: '♿', label: 'Référent Handicap', value: 'handicap@academiapro.fr', link: 'mailto:handicap@academiapro.fr' },
                { icon: '📰', label: 'Presse', value: 'presse@academiapro.fr', link: 'mailto:presse@academiapro.fr' },
                { icon: '🔒', label: 'RGPD & confidentialité', value: 'rgpd@academiapro.fr', link: 'mailto:rgpd@academiapro.fr' },
                { icon: '🛠️', label: 'Support technique', value: 'support@academiapro.fr', link: 'mailto:support@academiapro.fr' },
              ].map(c => (
                <a key={c.label} href={c.link} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.paddingLeft = '8px')}
                onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>{c.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* UNIA CTA + Formulaire */}
            <div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border-hi)', borderRadius: 18, padding: 28, marginBottom: 20 }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>🧑‍💼</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Parler à UNIA maintenant</h3>
                <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 18 }}>
                  Entretien de positionnement gratuit · 20 minutes · Simulation financement · Sans engagement.
                </p>
                <Link href="/agents#unia" className="btn-gold" style={{ display: 'block', textAlign: 'center' }}>
                  🎯 Démarrer l'entretien gratuit →
                </Link>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Envoyer un message</h3>
                <input placeholder="Votre nom" style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 12 }}/>
                <input placeholder="votre@email.fr" type="email" style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 12 }}/>
                <textarea placeholder="Votre message..." rows={4} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 16, resize: 'vertical' }}/>
                <button style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 13, fontWeight: 700 }}>
                  Envoyer →
                </button>
                <p style={{ fontSize: 11, color: 'var(--dim)', marginTop: 10, textAlign: 'center' }}>Réponse sous 24 heures ouvrées</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer/>

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
