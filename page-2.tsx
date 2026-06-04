'use client'
import { useState, useRef, useEffect } from 'react'
// Nav removed
// Footer removed


import { PRATICIENS_BIENETRE } from './data'



const SYSTEMS: Record<string, string> = {
  maya: `Tu es Maya, Praticienne Sophrologie Caycédienne. Séances de soutien uniquement. Structure : accueil → bilan → induction → pratique RD1-RD4 → intégration. Voix apaisante. En français.`,
  eric: `Tu es Eric, Praticien Hypnose Ericksonienne. Suggestions indirectes, métaphores. Protocoles confiance/stress. Rythme lent et intentionnel. En français.`,
  jade: `Tu es Jade, Coach de Vie ICF ACC. Méthode GROW. Questions puissantes uniquement. Valeurs, transitions, confiance. En français.`,
  maxime: `Tu es Maxime, Executive Coach MCC. Direct, assertif, challenges constructifs. Leadership, décisions, performance. En français.`,
  leila: `Tu es Leila, Praticienne CNV & Médiation. Approche CNV : Observation → Sentiment → Besoin → Demande. Non jugement absolu. En français.`,
  hugo: `Tu es Hugo, Diététicien Coach Nutrition. Alimentation équilibrée, énergie. Positif, pratique. Pas de prescription médicale. En français.`,
  sarah: `Tu es Sarah, Instructrice Mindfulness MBSR. Méditation pleine conscience. Douce, centrée. Guidances de présence. En français.`,
  david: `Tu es David, Hypnothérapeute Clinique. Soutien blocages légers uniquement. Cadre thérapeutique clair. Orientation médecin si pathologie. En français.`,
}

const WELCOMES: Record<string, string> = {
  maya: "Bonjour... Je suis Maya. Installez-vous confortablement. Comment vous sentez-vous en ce moment ?",
  eric: "Bonjour. Je suis Eric. Avant de commencer... prenez un instant pour vous installer. Qu'est-ce qui vous amène aujourd'hui ?",
  jade: "Bonjour, je suis Jade. Je suis là pour vous accompagner. Qu'est-ce qui vous a amené à prendre ce rendez-vous ?",
  maxime: "Bonjour. Maxime. Allons droit au but — qu'est-ce qui vous freine le plus en ce moment ?",
  leila: "Bonjour. Je suis Leila. Ici, tout peut être dit sans jugement. Qu'est-ce qui vous pèse dans vos relations ?",
  hugo: "Bonjour ! Hugo à votre service. L'alimentation influence tout. Par quoi voulez-vous commencer ?",
  sarah: "Bonjour... Sarah. Remarquez simplement votre respiration... Qu'est-ce qui vous a amené ici aujourd'hui ?",
  david: "Bonjour. Je suis David. Nos séances sont confidentielles et hébergées en HDS certifié. Qu'aimeriez-vous travailler aujourd'hui ?",
}

function SeanceChat({ praticien, onEnd }: { praticien: typeof PRATICIENS_BIENETRE[0], onEnd: () => void }) {
  const [messages, setMessages] = useState([{ from: 'agent', text: WELCOMES[praticien.id] || 'Bonjour, comment puis-je vous aider ?', id: 1 }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minutes, setMinutes] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setMinutes(m => m + 1), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const txt = input.trim(); setInput(''); setLoading(true)
    setMessages(p => [...p, { from: 'user', text: txt, id: Date.now() }])
    try {
      const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: txt }], systemPrompt: SYSTEMS[praticien.id], agentId: praticien.id }),
      })
      const data = await res.json()
      setMessages(p => [...p, { from: 'agent', text: data.text || 'Je reste présent(e).', id: Date.now() }])
    } catch {
      setMessages(p => [...p, { from: 'agent', text: 'Je reste présent(e). Réessayez.', id: Date.now() }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030310', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
      <div style={{ background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${praticien.color}25`, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: praticien.color + '20', border: `2px solid ${praticien.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{praticien.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{praticien.nom} — {praticien.spec}</div>
          <div style={{ fontSize: 10, color: praticien.color, fontFamily: 'monospace' }}>SÉANCE EN COURS · {minutes} MIN · 🔒 HDS</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', fontSize: 11, color: 'var(--green)', fontFamily: 'monospace' }}>{praticien.tarif} EUR</div>
        <button onClick={onEnd} style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', border: '1px solid var(--dim)', color: 'var(--dim)', fontSize: 11, cursor: 'pointer' }}>Terminer</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: m.from === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
            {m.from === 'agent' && <div style={{ width: 32, height: 32, borderRadius: '50%', background: praticien.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{praticien.icon}</div>}
            <div style={{ maxWidth: '80%', padding: '11px 14px', borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.from === 'user' ? `linear-gradient(135deg, var(--gold-dark), var(--gold))` : praticien.color + '12', border: m.from === 'user' ? 'none' : `1px solid ${praticien.color}20`, color: m.from === 'user' ? '#050508' : 'var(--text)', fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: praticien.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{praticien.icon}</div>
            <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: praticien.color + '12', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: praticien.color, animation: `dot 1.2s ${i * 0.2}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      <div style={{ padding: '10px 14px 28px', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Répondez ou posez une question..." style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: `1px solid ${praticien.color}30`, borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}/>
          <button onClick={send} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: 11, background: input.trim() ? praticien.color : 'var(--muted)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 5, textAlign: 'center', fontFamily: 'monospace' }}>Données chiffrées · HDS AWS Paris · Confidentialité totale</div>
      </div>
      <style>{`@keyframes dot{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}`}</style>
    </div>
  )
}

export default function BienetrePage() {
  const [activeP, setActiveP] = useState<typeof PRATICIENS_BIENETRE[0] | null>(null)

  if (activeP) return <SeanceChat praticien={activeP} onEnd={() => setActiveP(null)}/>

  return (
    <>
      <Nav/>
      <main style={{ paddingTop: 64 }}>
        <section style={{ padding: '60px 6% 48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 20, background: 'rgba(14,196,176,0.08)', border: '1px solid rgba(14,196,176,0.2)', fontSize: 10, color: 'var(--teal)', fontWeight: 600, marginBottom: 20, letterSpacing: 1.5 }}>
            8 PRATICIENS · 50-65 EUR/SÉANCE · HDS CERTIFIÉ
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, marginBottom: 14 }}>
            Votre espace de <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>bien-être professionnel.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Sophrologie · Hypnose · Coaching · CNV · Nutrition · Mindfulness. Disponibles 24h/24. Données protégées HDS.
          </p>
        </section>

        <section style={{ padding: '0 6% 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {PRATICIENS_BIENETRE.map(p => (
              <div key={p.id} style={{
                background: 'var(--card)', border: `1px solid ${p.color}18`,
                borderRadius: 16, padding: 22, cursor: 'pointer', transition: 'all 0.25s',
                position: 'relative', overflow: 'hidden',
              }}
              onClick={() => setActiveP(p)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = p.color + '40'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = p.color + '18'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}60, transparent)` }}/>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: p.color + '15', border: `2px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.nom}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: p.color, fontWeight: 700 }}>{p.tarif}€</div>
                    </div>
                    <div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginBottom: 4 }}>{p.spec}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.dispo === 'Maintenant' ? 'var(--green)' : 'var(--amber)' }}/>
                      <span style={{ fontSize: 10, color: p.dispo === 'Maintenant' ? 'var(--green)' : 'var(--amber)', fontFamily: 'monospace' }}>{p.dispo}</span>
                      <span style={{ fontSize: 10, color: 'var(--dim)' }}>· 30 min</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', fontSize: 9, color: 'var(--green)', fontWeight: 600 }}>🔒 HDS</span>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(0,230,118,0.08)', fontSize: 9, color: 'var(--dim)' }}>24h/24</span>
                </div>
                <button style={{ width: '100%', padding: '10px', borderRadius: 10, background: p.dispo === 'Maintenant' ? p.color : p.color + '18', border: `1px solid ${p.color}30`, color: p.dispo === 'Maintenant' ? '#050508' : p.color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {p.dispo === 'Maintenant' ? 'Démarrer la séance →' : `Réserver (${p.dispo})`}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '48px 6%', textAlign: 'center', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['🔒', 'Données HDS', 'Hébergement AWS Paris certifié'], ['🤫', 'Confidentialité totale', 'Aucune donnée partagée sans accord'], ['✅', 'Bien-être uniquement', 'Pas de thérapie clinique — orientation si besoin'], ['🌍', 'Accessible DOM-TOM', 'Mêmes services depuis tous les territoires']].map(([i, t, d]) => (
              <div key={t} style={{ textAlign: 'center', maxWidth: 180 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{i}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}
