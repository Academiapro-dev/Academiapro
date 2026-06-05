'use client'
import { useState } from 'react'
import { AGENTS } from '../../../data'
import Link from 'next/link'

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <>
      <main style={{ paddingTop: 64 }}>

        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, marginBottom: 14 }}>
            Vos Agents IA <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>personnels.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Formateurs experts, coachs et conseillers disponibles 24h/24. Chaque agent est spécialisé dans son domaine.
          </p>
        </section>

        <section style={{ padding: '48px 6% 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
            {AGENTS.map((a: any) => (
              <div key={a.id} style={{
                background: 'var(--card)', border: `1px solid ${selected === a.id ? a.color : 'var(--border)'}`,
                borderRadius: 20, padding: 28, transition: 'all 0.25s', cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
              }}
              onClick={() => setSelected(selected === a.id ? null : a.id)}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${a.color}, transparent)` }}/>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.nom} style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${a.color}` }} />
                  ) : (
                    <div style={{ fontSize: 40 }}>{a.icon}</div>
                  )}
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{a.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--dim)' }}>{a.role}</div>
                    <div style={{ fontSize: 11, color: a.color, fontWeight: 600, marginTop: 2 }}>{a.spec}</div>
                  </div>
                </div>

                {a.bio && (
                  <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 16 }}>{a.bio}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                    background: a.gratuit ? 'rgba(0,230,118,0.1)' : 'var(--gold-pale)',
                    color: a.gratuit ? 'var(--green)' : 'var(--gold)',
                    border: `1px solid ${a.gratuit ? 'rgba(0,230,118,0.2)' : 'var(--border)'}`,
                  }}>
                    {a.gratuit ? '✓ Gratuit' : a.tarif || 'Formation requise'}
                  </span>
                  <Link href={`/chat?agent=${a.id}`} style={{
                    padding: '8px 18px', borderRadius: 10,
                    background: a.color, color: '#050508', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none',
                  }} onClick={e => e.stopPropagation()}>
                    Démarrer →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '60px 6%', textAlign: 'center', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, marginBottom: 14 }}>
            Commencez par UNIA
          </h2>
          <p style={{ fontSize: 15, color: 'var(--dim)', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
            Entretien gratuit de 20 minutes pour trouver votre formation idéale et simuler votre financement.
          </p>
          <Link href="/chat?agent=unia" style={{ padding: '14px 32px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            🎯 Démarrer avec UNIA — Gratuit
          </Link>
        </section>

      </main>
    </>
  )
}

