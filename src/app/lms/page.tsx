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
              700, color: 'var(--gold)', marginBottom: 16 }}>PROCHAIN MODULE</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{APPRENANT.prochainModule}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>{APPRENANT.prochainDate}</div>
              <Link href="/lms?onglet=modules" style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                Accéder au module →
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>VOTRE FORMATEUR</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <img src="https://api.dicebear.com/8.x/lorelei/svg?seed=thomas&backgroundColor=2a2a2a&radius=50" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #c8a96e' }} alt="Thomas" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{APPRENANT.formateur}</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)' }}>Product Builder No-Code & IA</div>
                </div>
              </div>
              <button onClick={() => setOnglet('formateur')} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 12, fontWeight: 700 }}>
                Poser une question →
              </button>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>VOTRE COACH PERSONNEL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <img src="https://api.dicebear.com/8.x/lorelei/svg?seed=isabelle&backgroundColor=1a0a2e&radius=50" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #0ec4b0' }} alt="Isabelle" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{APPRENANT.coach}</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)' }}>Coach ICF PCC · Méthode GROW</div>
                </div>
              </div>
              <button onClick={() => setOnglet('coach')} style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#0ec4b0', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 12, fontWeight: 700 }}>
                Session coaching →
              </button>
            </div>
          </div>
        </div>
      )}

      {onglet === 'modules' && (
        <div style={{ padding: '32px 6%' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Parcours de formation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODULES.map(m => (
              <div key={m.num} style={{
                background: 'var(--card)', border: `1px solid ${m.statut === 'en cours' ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0,
                  background: m.statut === 'terminé' ? 'rgba(0,230,118,0.15)' : m.statut === 'en cours' ? 'var(--gold-pale)' : 'var(--s2)',
                  color: m.statut === 'terminé' ? '#00e676' : m.statut === 'en cours' ? 'var(--gold)' : 'var(--dim)',
                  border: `1px solid ${m.statut === 'terminé' ? 'rgba(0,230,118,0.3)' : m.statut === 'en cours' ? 'var(--gold)' : 'var(--border)'}`,
                }}>
                  {m.statut === 'terminé' ? '✓' : m.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Module {m.num} — {m.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                    {m.statut === 'terminé' ? `Score : ${m.score}/100` : m.statut === 'en cours' ? 'En cours...' : 'À venir'}
                  </div>
                </div>
                {m.statut === 'en cours' && (
                  <button onClick={() => setOnglet('formateur')} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 11, fontWeight: 700 }}>
                    Continuer →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(onglet === 'formateur' || onglet === 'coach') && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', padding: '20px 6%' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={onglet === 'formateur' ? "https://api.dicebear.com/8.x/lorelei/svg?seed=thomas&backgroundColor=2a2a2a&radius=50" : "https://api.dicebear.com/8.x/lorelei/svg?seed=isabelle&backgroundColor=1a0a2e&radius=50"}
              style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${onglet === 'formateur' ? '#c8a96e' : '#0ec4b0'}` }}
              alt="agent"
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{onglet === 'formateur' ? 'Thomas Martin' : 'Isabelle Moreau'}</div>
              <div style={{ fontSize: 12, color: onglet === 'formateur' ? 'var(--gold)' : '#0ec4b0' }}>
                {onglet === 'formateur' ? 'Formateur Expert IA · F01' : 'Coach Personnel ICF PCC'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--gold)' : 'var(--card)',
                  color: m.role === 'user' ? '#050508' : 'var(--text)',
                  fontSize: 14, lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ padding: '12px 16px', background: 'var(--card)', borderRadius: 12, fontSize: 14, color: 'var(--dim)', width: 60, border: '1px solid var(--border)' }}>···</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder={onglet === 'formateur' ? 'Poser une question à Thomas...' : 'Parler à Isabelle...'}
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <button onClick={sendMsg} disabled={loading} style={{ padding: '13px 24px', borderRadius: 12, background: onglet === 'formateur' ? 'var(--gold)' : '#0ec4b0', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 14, fontWeight: 700 }}>
              Envoyer →
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

