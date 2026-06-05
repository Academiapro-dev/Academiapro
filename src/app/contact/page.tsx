'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <>
      <main style={{ paddingTop: 64 }}>

        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, marginBottom: 14 }}>
            Contactez <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>AcadémIA Pro.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Une question sur une formation, un financement ou une inscription ? Notre équipe répond sous 24h.
          </p>
        </section>

        <section style={{ padding: '48px 6% 60px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Envoyez-nous un message</h2>

              {sent ? (
                <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Message envoyé !</div>
                  <div style={{ fontSize: 14, color: 'var(--dim)' }}>Nous vous répondons sous 24h.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Prénom</label>
                      <input placeholder="Marie" style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom</label>
                      <input placeholder="Dupont" style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
                    <input placeholder="marie@email.fr" type="email" style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Sujet</label>
                    <select style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                      <option>Question sur une formation</option>
                      <option>Financement CPF / OPCO</option>
                      <option>Inscription</option>
                      <option>Partenariat</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Message</label>
                    <textarea placeholder="Votre message..." rows={5} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}/>
                  </div>
                  <button onClick={() => setSent(true)} style={{ padding: '14px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 14, fontWeight: 700 }}>
                    Envoyer le message →
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Ou démarrez directement</h2>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧑‍💼</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Entretien gratuit avec UNIA</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 16 }}>20 minutes pour trouver votre formation idéale et simuler votre financement. Gratuit et sans engagement.</div>
                <Link href="/chat?agent=unia" style={{ display: 'block', padding: '10px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                  Démarrer avec UNIA →
                </Link>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Email direct</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 8 }}>contact@academiapro.fr</div>
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>Réponse sous 24h ouvrées</div>
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Siège social</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>AcadémIA Pro<br/>France · DOM-TOM · International<br/>100% formation en ligne</div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

