'use client'
import { useState } from 'react'
import Link from 'next/link'

const MOT_DE_PASSE = 'academiapro2026'

const EQUIPE_A = [
  { id: 'architecte', nom: 'Agent Architecte & Logistique', icon: '🏛️', desc: 'Locaux, infrastructure, logistique du centre' },
  { id: 'juridique', nom: 'Agent Juridique & Accréditation', icon: '⚖️', desc: 'RNCP, RS, Qualiopi, conformité légale' },
  { id: 'rh', nom: 'Agent RH & Recrutement', icon: '👥', desc: 'Recrutement formateurs, contrats, fiches de poste' },
  { id: 'marketing', nom: 'Agent Marketing & Communication', icon: '📣', desc: 'Campagnes, SEO, réseaux sociaux, copywriting' },
  { id: 'finance', nom: 'Agent Finance & Budget', icon: '💰', desc: 'Budget, prévisionnel, facturation, OPCO' },
]

const EQUIPE_B = [
  { id: 'ingenieur', nom: 'Ingénieur Pédagogique Chef', icon: '🎓', desc: 'Architecture globale des formations, standards qualité' },
  { id: 'qualite', nom: 'Agent Qualité & Certification', icon: '✅', desc: 'Validation contenus, référentiels, évaluations' },
  { id: 'multimedia', nom: 'Agent Multimédia & Outils', icon: '🎬', desc: 'Vidéos, supports, quiz, outils e-learning' },
  { id: 'management', nom: 'Agent Péda — Management & Leadership', icon: '👔', desc: 'Modules management, leadership, PMP' },
  { id: 'digital', nom: 'Agent Péda — Digital & Tech', icon: '💻', desc: 'Modules développement, cybersécurité, data' },
  { id: 'finance-péda', nom: 'Agent Péda — Finance & Comptabilité', icon: '📊', desc: 'Modules finance, comptabilité, gestion' },
  { id: 'rh-soft', nom: 'Agent Péda — RH & Soft Skills', icon: '🤝', desc: 'Modules RH, communication, gestion du stress' },
  { id: 'marketing-péda', nom: 'Agent Péda — Marketing & Vente', icon: '📢', desc: 'Modules marketing digital, vente, négociation' },
  { id: 'technique', nom: 'Agent Péda — Métiers Techniques', icon: '🔧', desc: 'Modules métiers techniques et industriels' },
  { id: 'product-ia', nom: 'Agent Péda — Product Manager IA', icon: '🏗️', desc: 'Modules product management augmenté IA' },
  { id: 'nocode', nom: 'Agent Péda — Builder No-Code', icon: '🫧', desc: 'Modules Bubble, Webflow, no-code' },
  { id: 'prompt', nom: 'Agent Péda — Prompt Engineering', icon: '⚡', desc: 'Modules prompt, Claude API, GPT' },
  { id: 'automatisation', nom: 'Agent Péda — Automatisation & Agents IA', icon: '⚙', desc: 'Modules Make, n8n, agents autonomes' },
  { id: 'entrepreneuriat', nom: 'Agent Péda — Entrepreneuriat IA', icon: '🚀', desc: 'Modules business model, lancement, scaling IA' },
  { id: 'anglais', nom: 'Agent Péda — Anglais Business', icon: '🇬🇧', desc: 'Modules anglais professionnel, TOEIC, TOEFL' },
  { id: 'francais', nom: 'Agent Péda — Français FLE', icon: '🇫🇷', desc: 'Modules français langue étrangère, DELF' },
  { id: 'espagnol', nom: 'Agent Péda — Espagnol', icon: '🇪🇸', desc: 'Modules espagnol professionnel, DELE' },
  { id: 'allemand', nom: 'Agent Péda — Allemand', icon: '🇩🇪', desc: 'Modules allemand professionnel, Goethe' },
  { id: 'mandarin', nom: 'Agent Péda — Mandarin', icon: '🇨🇳', desc: 'Modules mandarin business, HSK' },
  { id: 'arabe', nom: 'Agent Péda — Arabe', icon: '🇸🇦', desc: 'Modules arabe professionnel' },
  { id: 'hebreu', nom: 'Agent Péda — Hébreu', icon: '🇮🇱', desc: 'Modules hébreu moderne et biblique' },
]

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState(false)
  const [agentActif, setAgentActif] = useState<any>(null)
  const [prompt, setPrompt] = useState('')
  const [reponse, setReponse] = useState('')
  const [loading, setLoading] = useState(false)

  const login = () => {
    if (mdp === MOT_DE_PASSE) { setAuth(true); setErreur(false) }
    else setErreur(true)
  }

  const executer = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setReponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'cam',
          messages: [{ role: 'user', content: `[Agent actif: ${agentActif?.nom}]\n\n${prompt}` }],
        }),
      })
      const data = await res.json()
      setReponse(data.content)
    } catch { setReponse('Erreur de connexion.') }
    setLoading(false)
  }

  if (!auth) return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 48, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Back-office CAM</h1>
        <p style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 28 }}>Accès réservé — AcadémIA Pro</p>
        <input
          type="password"
          value={mdp}
          onChange={e => setMdp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Mot de passe"
          style={{ width: '100%', background: 'var(--s1)', border: `1px solid ${erreur ? 'red' : 'var(--border)'}`, borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        {erreur && <p style={{ color: 'red', fontSize: 12, marginBottom: 12 }}>Mot de passe incorrect</p>}
        <button onClick={login} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 14, fontWeight: 700 }}>
          Accéder →
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)' }}>

      <div style={{ padding: '20px 6%', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700 }}>⚡ CAM — Back-office</h1>
          <p style={{ fontSize: 13, color: 'var(--dim)' }}>116 agents · 2 équipes · Production formations</p>
        </div>
        <Link href="/" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>← Site public</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 'calc(100vh - 130px)' }}>

        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 10, letterSpacing: 1 }}>ÉQUIPE A — INFRASTRUCTURE</div>
            {EQUIPE_A.map(a => (
              <div key={a.id} onClick={() => { setAgentActif(a); setReponse('') }} style={{
                padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                background: agentActif?.id === a.id ? 'var(--gold-pale)' : 'transparent',
                border: `1px solid ${agentActif?.id === a.id ? 'var(--gold)' : 'transparent'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.icon} {a.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{a.desc}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 10, letterSpacing: 1 }}>ÉQUIPE B — FORMATIONS</div>
            {EQUIPE_B.map(a => (
              <div key={a.id} onClick={() => { setAgentActif(a); setReponse('') }} style={{
                padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                background: agentActif?.id === a.id ? 'var(--gold-pale)' : 'transparent',
                border: `1px solid ${agentActif?.id === a.id ? 'var(--gold)' : 'transparent'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.icon} {a.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
          {!agentActif ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div style={{ fontSize: 16 }}>Sélectionnez un agent pour démarrer</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{agentActif.icon} {agentActif.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>{agentActif.desc}</div>
              </div>

              {reponse && (
                <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16, overflowY: 'auto', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {reponse}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={`Donner une mission à ${agentActif.nom}...`}
                  rows={3}
                  style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none' }}
                />
                <button onClick={executer} disabled={loading} style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 13, fontWeight: 700, alignSelf: 'flex-end' }}>
                  {loading ? '···' : 'Exécuter →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

