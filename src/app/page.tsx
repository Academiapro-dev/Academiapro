'use client'
import Link from 'next/link'
import { FORMATIONS, AGENTS, PRATICIENS_BIENETRE } from '../../data'

export default function HomePage() {
  const topFormations = FORMATIONS.slice(0, 8)
  const topAgents = AGENTS.slice(0, 6)

  return (
    <main style={{ paddingTop: 64 }}>
      <h1>AcadémIA Pro</h1>
      <p>43 formations certifiantes</p>
    </main>
  )
}
