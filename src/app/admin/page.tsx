'use client'
import { useState } from 'react'
import Link from 'next/link'

const MOT_DE_PASSE = 'academiapro1326'

const EQUIPE_A = [
  { id: 'architecte', nom: 'Agent Architecte & Logistique', icon: '🏛️', desc: 'Locaux, infrastructure, logistique du centre',
    missions: ['Rédige un cahier des charges pour des locaux de formation 200m²', 'Crée un plan d\'aménagement type pour une salle de formation IA', 'Liste les équipements nécessaires pour un centre de formation hybride'] },
  { id: 'juridique', nom: 'Agent Juridique & Accréditation', icon: '⚖️', desc: 'RNCP, RS, Qualiopi, conformité légale',
    missions: ['Guide-moi pour obtenir la certification Qualiopi', 'Rédige les CGV pour AcadémIA Pro', 'Explique la procédure d\'enregistrement d\'une formation au RNCP'] },
  { id: 'rh', nom: 'Agent RH & Recrutement', icon: '👥', desc: 'Recrutement formateurs, contrats, fiches de poste',
    missions: ['Rédige une fiche de poste pour un formateur expert IA', 'Crée un contrat type pour formateur indépendant', 'Propose un processus de recrutement en 5 étapes'] },
  { id: 'marketing', nom: 'Agent Marketing & Communication', icon: '📣', desc: 'Campagnes, SEO, réseaux sociaux, copywriting',
    missions: ['Rédige 5 posts LinkedIn pour AcadémIA Pro', 'Crée une stratégie SEO pour le site academiapro.fr', 'Écris une campagne email pour le lancement CPF'] },
  { id: 'finance', nom: 'Agent Finance & Budget', icon: '💰', desc: 'Budget, prévisionnel, facturation, OPCO',
    missions: ['Crée un prévisionnel financier sur 12 mois', 'Explique comment facturer via un OPCO', 'Calcule le ROI d\'une formation à 3 900 EUR financée CPF'] },
]

const EQUIPE_B = [
  { id: 'ingenieur', nom: 'Ingénieur Pédagogique Chef', icon: '🎓', desc: 'Architecture globale des formations, standards qualité',
    missions: ['Crée le plan pédagogique complet d\'une formation IA 80h', 'Définis les objectifs pédagogiques SMART pour F28', 'Propose une grille d\'évaluation des compétences'] },
  { id: 'qualite', nom: 'Agent Qualité & Certification', icon: '✅', desc: 'Validation contenus, référentiels, évaluations',
    missions: ['Rédige un référentiel de certification pour F01', 'Crée une grille d\'évaluation formative', 'Propose un processus qualité Qualiopi en 10 points'] },
  { id: 'multimedia', nom: 'Agent Multimédia & Outils', icon: '🎬', desc: 'Vidéos, supports, quiz, outils e-learning',
    missions: ['Crée un script vidéo de présentation pour F28', 'Propose une structure de quiz pour valider les acquis', 'Liste les meilleurs outils e-learning pour 2026'] },
  { id: 'management', nom: 'Agent Péda — Management & Leadership', icon: '👔', desc: 'Modules management, leadership, PMP',
    missions: ['Crée le module 1 de la formation Management PMP', 'Rédige 10 études de cas management', 'Propose un plan de formation leadership 40h'] },
  { id: 'digital', nom: 'Agent Péda — Digital & Tech', icon: '💻', desc: 'Modules développement, cybersécurité, data',
    missions: ['Crée le syllabus complet de F07 Cybersécurité', 'Rédige un lab pratique pentest pour débutants', 'Propose 5 projets fil rouge pour F12 Data Science'] },
  { id: 'finance-peda', nom: 'Agent Péda — Finance & Comptabilité', icon: '📊', desc: 'Modules finance, comptabilité, gestion',
    missions: ['Crée le programme d\'une formation Finance 60h', 'Rédige 5 cas pratiques comptabilité analytique', 'Propose des exercices de gestion de trésorerie'] },
  { id: 'rh-soft', nom: 'Agent Péda — RH & Soft Skills', icon: '🤝', desc: 'Modules RH, communication, gestion du stress',
    missions: ['Crée un module de gestion du stress 8h', 'Rédige des exercices de communication non-violente', 'Propose un programme soft skills complet'] },
  { id: 'marketing-peda', nom: 'Agent Péda — Marketing & Vente', icon: '📢', desc: 'Modules marketing digital, vente, négociation',
    missions: ['Crée le programme formation Marketing Digital 100h', 'Rédige 5 études de cas Google Ads', 'Propose un module négociation commerciale 16h'] },
  { id: 'technique', nom: 'Agent Péda — Métiers Techniques', icon: '🔧', desc: 'Modules métiers techniques et industriels',
    missions: ['Propose un catalogue de formations techniques', 'Crée un module sécurité au travail 7h', 'Rédige un programme maintenance industrielle'] },
  { id: 'product-ia', nom: 'Agent Péda — Product Manager IA', icon: '🏗️', desc: 'Modules product management augmenté IA',
    missions: ['Crée le module 1 de F01 Product Builder', 'Rédige un exercice de création de PRD avec IA', 'Propose 3 projets pratiques no-code avec Bubble'] },
  { id: 'nocode', nom: 'Agent Péda — Builder No-Code', icon: '🫧', desc: 'Modules Bubble, Webflow, no-code',
    missions: ['Crée un tutoriel Bubble pour débutants', 'Rédige le programme F34 Bubble 35h complet', 'Propose 5 projets pratiques no-code progressifs'] },
  { id: 'prompt', nom: 'Agent Péda — Prompt Engineering', icon: '⚡', desc: 'Modules prompt, Claude API, GPT',
    missions: ['Crée un guide complet du prompt engineering', 'Rédige 20 exercices de prompting avancé', 'Propose un programme formation Claude API 30h'] },
  { id: 'automatisation', nom: 'Agent Péda — Automatisation & Agents IA', icon: '⚙️', desc: 'Modules Make, n8n, agents autonomes',
    missions: ['Crée le programme F29 Automatisations 80h', 'Rédige 5 scénarios Make progressifs', 'Propose un projet fil rouge agent IA autonome'] },
  { id: 'entrepreneuriat', nom: 'Agent Péda — Entrepreneuriat IA', icon: '🚀', desc: 'Modules business model, lancement, scaling IA',
    missions: ['Crée un module business model IA 16h', 'Rédige un guide de lancement startup IA', 'Propose 3 études de cas entrepreneurs IA'] },
  { id: 'anglais', nom: 'Agent Péda — Anglais Business', icon: '🇬🇧', desc: 'Modules anglais professionnel, TOEIC, TOEFL',
    missions: ['Crée un programme TOEIC 750+ en 3 mois', 'Rédige 10 dialogues business english', 'Propose un module anglais IA et tech 20h'] },
  { id: 'francais', nom: 'Agent Péda — Français FLE', icon: '🇫🇷', desc: 'Modules français langue étrangère, DELF',
    missions: ['Crée un programme FLE niveau B2 professionnel', 'Rédige des exercices DELF B2 entreprise', 'Propose un module français des affaires 40h'] },
  { id: 'espagnol', nom: 'Agent Péda — Espagnol', icon: '🇪', desc: 'Modules espagnol professionnel, DELE',
    missions: ['Crée un programme espagnol business A1→B2', 'Rédige des exercices de préparation DELE', 'Propose un module espagnol Amérique Latine'] },
  { id: 'allemand', nom: 'Agent Péda — Allemand', icon: '🇩🇪', desc: 'Modules allemand professionnel, Goethe',
    missions: ['Crée un programme allemand des affaires 60h', 'Rédige des exercices Goethe-Zertifikat B1', 'Propose un module allemand technique industriel'] },
  { id: 'mandarin', nom: 'Agent Péda — Mandarin', icon: '🇨🇳', desc: 'Modules mandarin business, HSK',
    missions: ['Crée un programme mandarin business HSK 4', 'Rédige des exercices de caractères essentiels', 'Propose un module négociation sino-française'] },
  { id: 'arabe', nom: 'Agent Péda — Arabe', icon: '🇸🇦', desc: 'Modules arabe professionnel',
    missions: ['Crée un programme arabe des affaires 60h', 'Rédige des exercices arabe standard moderne', 'Propose un module arabe Maghreb et Moyen-Orient'] },
  { id: 'hebreu', nom: 'Agent Péda — Hébreu', icon: '🇮🇱', desc: 'Modules hébreu moderne et biblique',
    missions: ['Crée un programme hébreu moderne A1→B1', 'Rédige des exercices alphabet et lecture', 'Propose un module hébreu biblique pour débutants'] },
]

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [mdp, setMdp] = useState('')
  const [voir, setVoir] = useState(false)
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
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={voir ? 'text' : 'password'}
            value={mdp}
            onChange={e => setMdp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Mot de passe"
            style={{ width: '100%', background: 'var(--s1)', border: `1px solid ${erreur ? 'red' : 'var(--border)'}`, borderRadius: 10, padding: '12px 48px 12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={() => setVoir(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
            {voir ? '🙈' : '👁️'}
          </button>
        </div>
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
              <div key={a.id} onClick={() => { setAgentActif(a); setReponse(''); setPrompt('') }} style={{
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
              <div key={a.id} onClick={() => { setAgentActif(a); setReponse(''); setPrompt('') }} style={{
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
                <div style={{ fontSize: 13, marginTop: 8, color: 'var(--dim)' }}>26 agents disponibles · 2 équipes</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{agentActif.icon} {agentActif.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>{agentActif.desc}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dim)', marginBottom: 8, letterSpacing: 1 }}>MISSIONS RAPIDES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agentActif.missions?.map((m: string, i: number) => (
                    <button key={i} onClick={() => setPrompt(m)} style={{
                      padding: '8px 14px', borderRadius: 8, background: 'transparent',
                      border: '1px solid var(--border)', cursor: 'pointer',
                      color: 'var(--dim)', fontSize: 12, textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--dim)' }}
                    >
                      → {m}
                    </button>
                  ))}
                </div>
              </div>

              {reponse && (
                <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16, overflowY: 'auto', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 400 }}>
                  {reponse}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={`Mission pour ${agentActif.nom}...`}
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
