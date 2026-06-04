'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS, AGENTS, PRATICIENS_BIENETRE } from '../../data'

export default function HomePage() {
  const topFormations = FORMATIONS.slice(0, 8)
  const topAgents = AGENTS.slice(0, 6)

  return (
    <main style={{ paddingTop: 64, background: 'var(--s1)', minHeight: '100vh' }}>

      {/* HERO */}
      <section style={{ padding: '100px 6% 80px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, marginBottom: 24 }}>
          AcadémIA Pro
        </h1>
        <p style={{ fontSize: 20, color: 'var(--dim)', maxWidth: 560, margin: '0 auto 40px' }}>
          43 formations certifiantes · Formateur Expert IA 24h/24 · CPF · OPCO
        </p>
        <Link href="/formations" style={{ padding: '16px 40px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Voir toutes les formations →
        </Link>
      </section>

    </main>
  )
}
