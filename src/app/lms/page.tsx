'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS, AGENTS } from '../../../data'

const APPRENANT = {
  nom: 'Jacques',
  formation: 'Bootcamp Product Builder No-Code & IA',
  code: 'F01',
  progression: 34,
  heuresEffectuees: 142,
  heuresTotales: 420,
  prochainModule: 'Module 8 — Intégration Claude API',
  prochainDate: 'Lundi 9 juin · 14h00',
  coach: 'Isabelle Moreau',
  formateur: 'Thomas Martin',
}

const MODULES = [
  { num: 1, titre: 'Introduction au Product Management', statut: 'terminé', score: 94 },
  { num: 2, titre: 'Idéation & Validation', statut: 'terminé', score: 88 },
  { num: 3, titre: 'Bubble — Fondamentaux', statut: 'terminé', score: 91 },
  { num: 4, titre: 'Bubble — Base de données', statut: 'terminé', score: 85 },
  { num: 5, titre: 'Make — Automatisations de base', statut: 'terminé', score: 90 },
  { num: 6, titre: 'Make — Webhooks & API', statut: 'terminé', score: 87 },
  { num: 7, titre: 'Stripe — Paiements', statut: 'en cours', score: null },
  { num: 8, titre: 'Intégration Claude API', statut: 'à venir', score: null },
  { num: 9, titre: 'Supabase — Base de données', statut: 'à venir', score: null },
  { num: 10, titre: 'Déploiement & Production', statut: 'à venir', score: null },
  { num: 11, titre: 'MVP — Projet final', statut: 'à venir', score: null },
  { num: 12, titre: 'Certification & Présentation', statut: 'à venir', score: null },
]

const KPIS = [
  { label: 'Progression', valeur: '34%', icon: '📈', color: '#c8a96e' },
  { label: 'Heures effectuées', valeur: '142h', icon: '⏱️', color: '#00e676' },
  { label: 'Score moyen', valeur: '89/100', icon: '🎯', color: '#448aff' },
  { label: 'Modules terminés', valeur: '6/12', icon: '✅', color: '#9b7cf4' },
]

export default function LMSPage() {
  const [onglet, setOnglet] = useState('dashboard')
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: 'assistant', content: `Bonjour Jacques ! Je suis Thomas, votre formateur. Vous en êtes au module 7. Comment puis-je vous aider aujourd'hui ?` }
  ])
  const [loading, setLoading] = useState(false)

  const sendMsg = async () => {
    if (!chatMsg.trim() || loading) return
    const msg = chatMsg
    setChatMsg('')
    setChatHistory(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'thomas', messages: [...chatHistory, { role: 'user', content: msg }] }),
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch { setChatHistory(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion.' }]) }
    setLoading(false)
  }

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)' }}>

      <div style={{ padding: '20px 6%', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700 }}>Bonjour {APPRENANT.nom} 👋</h1>
          <p style={{ fontSize: 13, color: 'var(--dim)', marginTop: 4 }}>{APPRENANT.formation}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['dashboard', 'modules', 'formateur', 'coach'].map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: onglet === o ? 'var(--gold)' : 'transparent',
              border: `1px solid ${onglet === o ? 'var(--gold)' : 'var(--border)'}`,
              color: onglet === o ? '#050508' : 'var(--dim)',
            }}>
              {o === 'dashboard' ? '🏠 Dashboard' : o === 'modules' ? '📚 Modules' : o === 'formateur' ? '🤖 Formateur IA' : '💆 Coach'}
            </button>
          ))}
        </div>
      </div>

      {onglet === 'dashboard' && (
        <div style={{ padding: '32px 6%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {KPIS.map(k => (
              <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${k.color}, transparent)` }}/>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: k.color }}>{k.valeur}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>PROGRESSION GLOBALE</div>
              <div style={{ background: 'var(--s2)', borderRadius: 8, height: 12, marginBottom: 8 }}>
                <div style={{ background: 'var(--gold)', borderRadius: 8, height: 12, width: `${APPRENANT.progression}%`, transition: 'width 1s' }}/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>{APPRENANT.heuresEffectuees}h / {APPRENANT.heuresTotales}h effectuées</div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 

