'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS, AGENTS } from '../../../../data'

export default function FormationDetailPage({ params }: { params: { code: string } }) {
  const formation = FORMATIONS.find((f: any) => f.code.toLowerCase() === params.code.toLowerCase())
  const [onglet, setOnglet] = useState('programme')

  if (!formation) return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, marginBottom: 16 }}>Formation introuvable</h1>
        <Link href="/formations" style={{ color: 'var(--gold)', textDecoration: 'none' }}>← Voir toutes les formations</Link>
      </div>
    </main>
  )

  const formateur = AGENTS.find((a: any) => a.spec?.includes(formation.code))

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)' }}>

      {/* Hero */}
      <section style={{ padding: '60px 6% 48px', background: 'var(--s1)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link href="/formations" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none', marginBottom: 20, display: 'inline-block' }}>← Toutes les formations</Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{formation.code}</span>
                <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{formation.cert}</span>
                {formation.cpf && <span style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--gold-pale)', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>💳 CPF</span>}
                {formation.tp && <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,188,212,0.1)', fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>Transitions Pro</span>}
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
                {formation.icon} {formation.titre}
              </h1>
              <p style={{ fontSize: 16, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 24, maxWidth: 700 }}>{formation.description}</p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>Durée</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formation.heures} · {formation.duree}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🎓</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>Certification</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formation.cert}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🌍</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>Accessible</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>France · DOM-TOM · International</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, minWidth: 280 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{formation.tarif.toLocaleString()}€</div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 20 }}>Financement disponible — jusqu'à 0 EUR</div>
              <Link href={`/chat?agent=unia`} style={{ display: 'block', padding: '14px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 10 }}>
                🎯 S'inscrire — Entretien gratuit
              </Link>
              <Link href="/financement" style={{ display: 'block', padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)', textDecoration: 'none', textAlign: 'center', fontSize: 13 }}>
                Simuler mon financement →
              </Link>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['✓ Formateur Expert IA 24h/24', '✓ Coach Personnel inclus', '✓ Certification reconnue', '✓ Accès à vie aux ressources'].map(item => (
                  <div key={item} style={{ fontSize: 12, color: 'var(--dim)' }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onglets */}
      <div style={{ padding: '0 6%', borderBottom: '1px solid var(--border)', background: 'var(--s1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4 }}>
          {['programme', 'formateur', 'financement', 'inscription'].map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{
              padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${onglet === o ? 'var(--gold)' : 'transparent'}`,
              color: onglet === o ? 'var(--gold)' : 'var(--dim)', fontSize: 13, fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {o === 'programme' ? '📚 Programme' : o === 'formateur' ? '🤖 Formateur IA' : o === 'financement' ? '💳 Financement' : '✍️ Inscription'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '48px 6%', maxWidth: 1100, margin: '0 auto' }}>

        {/* Programme */}
        {onglet === 'programme' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Programme complet</h2>
            {formation.modules ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(formation.modules as any[]).map((m: any, i: number) => (
                  <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--gold)' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                          {m.num}
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Module {m.num} — {m.titre}</h3>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius:
