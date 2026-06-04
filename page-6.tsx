'use client'
import { useState } from 'react'
import { FORMATIONS } from '@/lib/data'
import Link from 'next/link'

const CATS = ['Tous', 'IA & No-Code', 'Bien-être', 'Métier', 'Outils']

export default function FormationsPage() {
  const [cat, setCat] = useState('Tous')
  const [search, setSearch] = useState('')
  const [cpfOnly, setCpfOnly] = useState(false)

  const filtered = FORMATIONS.filter(f => {
    if (cat !== 'Tous' && f.cat !== cat) return false
    if (cpfOnly && !f.cpf) return false
    if (search && !f.titre.toLowerCase().includes(search.toLowerCase()) && !f.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
    
      <main style={{ paddingTop: 64 }}>

        {/* Hero */}
        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, marginBottom: 14 }}>
            43 formations <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>certifiantes.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Formateur Expert IA 24h/24 + Coach Personnel inclus dans chaque formation. CPF · OPCO · Transitions Pro · DOM-TOM.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600, margin: '0 auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une formation..."
              style={{ flex: 1, minWidth: 240, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 16px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
            <button onClick={() => setCpfOnly(v => !v)} style={{
              padding: '11px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: cpfOnly ? 'var(--gold)' : 'transparent',
              border: `1px solid ${cpfOnly ? 'var(--gold)' : 'var(--border)'}`,
              color: cpfOnly ? '#050508' : 'var(--gold)',
            }}>💳 CPF uniquement</button>
          </div>
        </section>

        {/* Filtres catégories */}
        <div style={{ padding: '20px 6%', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '7px 18px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: cat === c ? 'var(--gold)' : 'transparent',
              border: `1px solid ${cat === c ? 'var(--gold)' : 'var(--border)'}`,
              color: cat === c ? '#050508' : 'var(--dim)', transition: 'all 0.2s',
            }}>{c}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--dim)', display: 'flex', alignItems: 'center' }}>
            {filtered.length} formation{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        <section style={{ padding: '32px 6% 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(f => (
              <div key={f.code} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '22px', transition: 'all 0.25s',
                position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 30 }}>{f.icon}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--gold)', fontWeight: 700 }}>{f.tarif.toLocaleString()}€</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)' }}>{f.duree}</div>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace', marginBottom: 4 }}>{f.code}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 14, flex: 1 }}>{f.titre}</div>

                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{f.cert}</span>
                  {f.cpf && <span style={{ padding: '3px 9px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>CPF ✓</span>}
                  {f.tp && <span style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(0,188,212,0.1)', fontSize: 10, color: 'var(--teal)', fontWeight: 600 }}>Transitions Pro</span>}
                  {f.domtom && <span style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(200,169,110,0.08)', fontSize: 10, color: 'var(--dim)', fontWeight: 500 }}>DOM-TOM</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href="/agents#unia" style={{
                    flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center',
                    background: 'var(--gold)', color: '#050508', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', transition: 'opacity 0.2s',
                  }}>
                    S'inscrire
                  </Link>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {f.heures}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16 }}>Aucune formation ne correspond à votre recherche.</div>
              <button onClick={() => { setSearch(''); setCat('Tous'); setCpfOnly(false) }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontWeight: 700 }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </section>

        {/* CTA UNIA */}
        <section style={{ padding: '60px 6%', textAlign: 'center', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, marginBottom: 14 }}>
            Pas sûr de quelle formation choisir ?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--dim)', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
            UNIA vous guide en 20 minutes et simule votre financement. Gratuit et sans engagement.
          </p>
          <Link href="/agents#unia" className="btn-gold">🎯 Entretien gratuit avec UNIA</Link>
        </section>
      </main>
      <Footer/>
    </>
  )
}
