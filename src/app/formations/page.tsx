'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS } from '../../data'

const CATS = ['Tous', 'IA & No-Code', 'Bien-être', 'Métier', 'Outils']

export default function FormationsPage() {
  const [cat, setCat] = useState('Tous')
  const filtered = cat === 'Tous' ? FORMATIONS : FORMATIONS.filter((f: any) => f.cat === cat)

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)' }}>
      <section style={{ padding: '60px 6% 40px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, marginBottom: 16 }}>Nos formations certifiantes</h1>
        <p style={{ fontSize: 16, color: 'var(--dim)', marginBottom: 32 }}>{FORMATIONS.length} formations · CPF · OPCO · Transitions Pro · DOM-TOM</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid var(--border)', background: cat === c ? 'var(--gold)' : 'transparent', color: cat === c ? '#050508' : 'var(--dim)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{c}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--dim)', alignSelf: 'center' }}>{filtered.length} formations</span>
        </div>
      </section>
      <section style={{ padding: '40px 6%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
          {filtered.map((f: any) => (
            <div key={f.code} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{f.icon}</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{f.tarif.toLocaleString()}€</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 8 }}>{f.code} · {f.duree}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{f.titre}</h3>
              <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{f.description?.slice(0, 120)}...</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {f.cpf && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--gold-pale)', fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>CPF</span>}
                {f.cert && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{f.cert}</span>}
                {f.heures && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--s2)', fontSize: 10, color: 'var(--dim)', fontWeight: 600 }}>{f.heures}</span>}
              </div>
              <Link href={`/formations/${f.code.toLowerCase()}`} style={{ display: 'block', padding: '11px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontSize: 13 }}>
                Voir la formation
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
