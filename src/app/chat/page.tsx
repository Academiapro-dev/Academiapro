'use client'
import { useState, useEffect, useRef } from 'react'
import { AGENTS } from '../../../data'

export default function ChatPage() {
  const [agentId, setAgentId] = useState('unia')
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const agent = AGENTS.find((a: any) => a.id === agentId) || AGENTS[0]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('agent')
      if (id) setAgentId(id)
    }
  }, [])

  useEffect(() => {
    if (agent) {
      setMessages([{ role: 'assistant', content: agent.welcome }])
    }
  }, [agentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          messages: [...messages, userMsg],
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }])
    }
    setLoading(false)
  }

  return (
    <main style={{ paddingTop: 64, height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--s1)' }}>

      <div style={{ padding: '16px 6%', borderBottom: '1px solid var(--border)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${agent.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: `${agent.color}20` }}>
            {agent.icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{agent.nom}</div>
            <div style={{ fontSize: 12, color: agent.color }}>{agent.spec}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {AGENTS.slice(0, 6).map((a: any) => (
            <button key={a.id} onClick={() => setAgentId(a.id)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: agentId === a.id ? a.color : 'transparent',
              border: `1px solid ${agentId === a.id ? a.color : 'var(--border)'}`,
              color: agentId === a.id ? '#050508' : 'var(--dim)',
            }}>{a.icon} {a.nom}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 6%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${agent.color}`, marginRight: 10, flexShrink: 0, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `${agent.color}20` }}>
                {agent.icon}
              </div>
            )}
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--gold)' : 'var(--card)',
              color: m.role === 'user' ? '#050508' : 'var(--text)',
              fontSize: 14, lineHeight: 1.6,
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${agent.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `${agent.color}20` }}>
              {agent.icon}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--card)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--dim)' }}>
              ···
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '16px 6%', borderTop: '1px solid var(--border)', background: 'var(--s1)', display: 'flex', gap: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Écrivez à ${agent.nom}...`}
          style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
        />
        <button onClick={send} disabled={loading} style={{ padding: '13px 24px', borderRadius: 12, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 14, fontWeight: 700 }}>
          Envoyer →
        </button>
      </div>

    </main>
  )
}
