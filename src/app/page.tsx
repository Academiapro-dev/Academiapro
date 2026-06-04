import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS, AGENTS, PRATICIENS_BIENETRE } from '../../data'

export default function HomePage() {
  const topFormations = FORMATIONS.slice(0, 8)
  const topAgents = AGENTS.slice(0, 6)

  return (
    <main style={{ paddingTop: 64, background: 'var(--s1)', minHeight: '100vh' }}>

      <section style={{ padding: '100px 6% 80px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, marginBottom: 16 }}>
          AcadémIA Pro
        </h1>
        <p style={{ fontSize: 18, color: 'var(--dim)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          43 formations certifiantes · Formateur Expert IA 24h/24 · CPF · OPCO
        </p>
        <Link href="/formations" style={{ padding: '16px 40px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Voir toutes les formations
        </Link>
      </section>

      <section style={{ padding: '72px 6%' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          Nos formations certifiantes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {topFormations.map((f: any) => (
            <div key={f.code} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.titre}</h3>
              <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: '72px 6%', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          Vos Agents IA personnels
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {topAgents.map((a: any) => (
            <div key={a.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{a.avatar}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{a.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{a.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '72px 6%', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, marginBottom: 16 }}>
          Financement a 0 EUR
        </h2>
        <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Dans 95% des cas, nos formations sont entierement financees. CPF, OPCO, Transitions Pro, AGEFIPH
        </p>
        <Link href="/financement" style={{ padding: '14px 32px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none' }}>
          Simuler mon financement
        </Link>
      </section>

      <footer style={{ padding: '48px 6%', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>AcadémIA Pro</div>
          <p style={{ fontSize: 13, color: 'var(--dim)' }}>Centre de formation 100% IA</p>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 14 }}>
          <Link href="/formations" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Formations</Link>
          <Link href="/agents" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Agents IA</Link>
          <Link href="/financement" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Financement</Link>
          <Link href="/blog" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Blog</Link>
          <Link href="/contact" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Contact</Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--dim)', width: '100%' }}>2026 AcadémIA Pro. Tous droits reserves</p>
      </footer>

    </main>
  )
}
