'use client'
import { useState, useRef, useEffect } from 'react'
// Nav removed
// Footer removed
import { AGENTS } from './data'

const QUICK: Record<string, string[]> = {
  unia: ['Mon solde CPF ?', 'Quelle formation pour moi ?', 'Financement OPCO ?', 'Je suis en reconversion'],
  thomas: ['Déboguer un workflow Bubble', 'Intégrer Claude API', 'Créer un SaaS', 'Bootcamp Product Builder'],
  karim: ['Simuler examen CompTIA', 'Expliquer SQL injection', 'Préparer SOC analyst', 'CompTIA Security+'],
  alex: ['Créer un agent IA', 'Optimiser mon prompt', 'Connecter MCP', 'IA Générative débutant'],
  nina: ['Automatiser mes emails', 'Scénario Make', 'n8n vs Make', 'ROI automatisation'],
  claire: ['Pratiquer RD1', 'Séance guidée stress', 'Déontologie sophrologue', 'Commencer sophrologie'],
  isabelle: ['Check-in hebdo', 'Clarifier mon objectif', 'Lever un blocage', 'Plan d\'action semaine'],
  maya: ['Séance sophrologie', 'Gestion du stress', 'Préparer le sommeil', 'Relaxation rapide 10min'],
  cam: ['Produire un document', 'Stratégie lancement', 'Vérifier conformité', 'État du projet'],
  support: ['Problème connexion', 'Émargement bloqué', 'App mobile bug', 'CPF non reconnu'],
}

function ChatWindow({ agent, onClose }: { agent: typeof AGENTS[0], onClose: () => void }) {
  const [messages, setMessages] = useState([{ from: 'agent', text: agent.welcome, id: 1 }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text?: string) => {
    const txt = text || input.trim()
    if (!txt || loading) return
    setInput('')
    setMessages(p => [...p, { from: 'user', text: txt, id: Date.now() }])
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: txt }],
          systemPrompt: agent.system,
          agentId: agent.id,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const reply = data.text
      setMessages(p => [...p, { from: 'agent', text: reply, id: Date.now() }])

      // Voice synthesis if enabled
      if (voiceActive) {
        try {
          const voiceRes = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: reply, voiceId: agent.voiceId }),
          })
          if (voiceRes.ok) {
            const blob = await voiceRes.blob()
            const url = URL.createObjectURL(blob)
            new Audio(url).play()
          }
        } catch {}
      }
    } catch (err: any) {
      setMessages(p => [...p, { from: 'agent', text: `Erreur : ${err.message}. Vérifiez la configuration API.`, id: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#03030a', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', fontSize: 22 }}>←</button>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: agent.color + '20', border: `2px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{agent.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{agent.nom}</div>
          <div style={{ fontSize: 11, color: agent.color }}>{agent.role}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setVoiceActive(v => !v)} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: voiceActive ? agent.color : 'transparent',
            border: `1px solid ${voiceActive ? agent.color : 'var(--border)'}`,
            color: voiceActive ? '#050508' : 'var(--dim)',
          }}>
            {voiceActive ? '🔊 Voix ON' : '🔇 Voix OFF'}
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 5px var(--green)', margin: '0 auto 2px' }}/>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'monospace' }}>{loading ? 'TRAITE...' : 'EN LIGNE'}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: m.from === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
            {m.from === 'agent' && <div style={{ width: 34, height: 34, borderRadius: '50%', background: agent.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{agent.icon}</div>}
            <div style={{
              maxWidth: '80%', padding: '11px 15px',
              borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.from === 'user' ? `linear-gradient(135deg, var(--gold-dark), var(--gold))` : 'var(--s2)',
              border: m.from === 'user' ? 'none' : '1px solid var(--border)',
              color: m.from === 'user' ? '#050508' : 'var(--text)',
              fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap',
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: agent.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{agent.icon}</div>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--s2)', border: '1px solid var(--border)', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: agent.color, animation: `dot 1.2s ${i * 0.2}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Suggestions */}
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {(QUICK[agent.id] || []).map((s, i) => (
          <button key={i} onClick={() => send(s)} style={{ padding: '5px 13px', borderRadius: 12, background: 'var(--gold-pale)', border: '1px solid var(--border)', color: 'var(--dim)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 28px', borderTop: '1px solid var(--border)', background: 'var(--s1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Message ${agent.nom}...`}
            style={{ flex: 1, background: 'var(--card)', border: `1px solid ${agent.color}30`, borderRadius: 14, padding: '11px 14px', color: 'var(--text)', fontSize: 13.5, outline: 'none' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 46, height: 46, borderRadius: 12, background: input.trim() && !loading ? agent.color : 'var(--muted)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 6, textAlign: 'center', fontFamily: 'monospace' }}>
          Claude API sécurisé · AcadémIA Pro
        </div>
      </div>

      <style>{`@keyframes dot{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}`}</style>
    </div>
  )
}

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<typeof AGENTS[0] | null>(null)
  const [filter, setFilter] = useState('tous')

  const filtered = filter === 'tous' ? AGENTS
    : filter === 'formateurs' ? AGENTS.filter(a => a.role.includes('Formateur'))
    : filter === 'coaches' ? AGENTS.filter(a => a.role.includes('Coach'))
    : filter === 'bien-être' ? AGENTS.filter(a => a.id === 'maya')
    : AGENTS.filter(a => ['unia', 'cam', 'support'].includes(a.id))

  if (activeAgent) return <ChatWindow agent={activeAgent} onClose={() => setActiveAgent(null)}/>

  return (
    <>
      
      <main style={{ paddingTop: 64 }}>
        {/* Hero */}
        <section style={{ padding: '60px 6% 40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 20, background: 'var(--gold-pale)', border: '1px solid var(--border-hi)', fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginBottom: 20 }}>
            10 agents actifs · Phase 0 · ~30 EUR/mois
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 700, marginBottom: 14 }}>
            Vos <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Experts IA</em> disponibles.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 480, margin: '0 auto' }}>
            Formateurs · Coachs · Praticiens Bien-être · Support. Disponibles 24h/24. Claude API.
          </p>
        </section>

        {/* Filtres */}
        <div style={{ padding: '0 6% 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['tous', 'formateurs', 'coaches', 'bien-être', 'support'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? 'var(--gold)' : 'transparent',
              border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--border)'}`,
              color: filter === f ? '#050508' : 'var(--dim)', textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}>{f}</button>
          ))}
        </div>

        {/* Grid agents */}
        <section style={{ padding: '0 6% 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(agent => (
              <div key={agent.id} onClick={() => setActiveAgent(agent)} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: 20, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = agent.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}60, transparent)` }}/>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: agent.color + '18', border: `2px solid ${agent.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{agent.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{agent.nom}</div>
                      {agent.gratuit && <span style={{ padding: '2px 10px', borderRadius: 10, background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.25)', color: 'var(--green)', fontSize: 9, fontWeight: 700 }}>GRATUIT</span>}
                    </div>
                    <div style={{ fontSize: 11, color: agent.color, fontWeight: 600, marginBottom: 4 }}>{agent.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 4px var(--green)' }}/>
                      <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>EN LIGNE · 24h/24</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 14 }}>{agent.spec}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace' }}>{agent.tarif || (agent.gratuit ? 'Entretien gratuit' : '')}</span>
                  <div style={{ padding: '6px 16px', borderRadius: 8, background: agent.color + '18', border: `1px solid ${agent.color}30`, color: agent.color, fontSize: 11, fontWeight: 700 }}>Démarrer →</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      
    </>
  )
}
