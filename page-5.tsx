'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS } from '/data'


export default function FinancementPage() {
  const [statut, setStatut] = useState('')
  const [mois, setMois] = useState('')
  const [rqth, setRqth] = useState(false)
  const [solde, setSolde] = useState('')
  const [formationCode, setFormationCode] = useState('F28')
  const [result, setResult] = useState<any>(null)

  const formation = FORMATIONS.find(f => f.code === formationCode)

  const simulate = () => {
    const tarif = formation?.tarif || 1400
    const cpf = Math.min(parseFloat(solde) || 500, 5000)
    const agefiph = rqth ? 5000 : 0
    const tp = statut === 'salarie' && parseInt(mois) >= 24 && !!formation?.tp
    const opco = statut === 'salarie' && formation?.opco
    let reste = Math.max(0, tarif - cpf - agefiph)
    if (tp) reste = 0
    setResult({ tarif, cpf, agefiph, tp, opco, reste })
  }

  return (
    
      <main style={{ paddingTop: 64 }}>

        {/* Hero */}
        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,58px)', fontWeight: 700, marginBottom: 14 }}>
            Financement à <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>0 EUR</em> de reste à charge.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Dans 95% des cas, nos formations sont entièrement financées. Simulez votre situation en 2 minutes.
          </p>
        </section>

        {/* 5 dispositifs */}
        <section style={{ padding: '72px 6%' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
            5 dispositifs. <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Cumulables.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
            {[
              { icon: '💳', name: 'CPF — Mon Compte Formation', amount: 'Jusqu\'à 5 000 EUR', color: 'var(--gold)', who: 'Tous les actifs', detail: '500 EUR par an · Plafond 5 000 EUR · Vérifier sur moncompteformation.gouv.fr', how: 'Demande en ligne sur moncompteformation.gouv.fr · Délai : 11 jours ouvrés' },
              { icon: '🏢', name: 'OPCO — 11 opérateurs', amount: '100% possible', color: 'var(--teal)', who: 'Salariés', detail: 'Votre employeur cotise chaque mois. Atlas · AFDAS · AKTO · OPCO 2I · etc.', how: 'Demander à votre RH · Trouver votre OPCO sur quel-est-mon-opco.fr' },
              { icon: '🔄', name: 'Transitions Pro', amount: 'Salaire maintenu', color: 'var(--blue)', who: 'CDI · 2 ans ancienneté', detail: 'Formation financée + salaire maintenu pendant toute la durée', how: 'Contacter votre commission Transitions Pro régionale · Délai 2 mois' },
              { icon: '🤝', name: 'France Travail — AIF', amount: 'Variable', color: 'var(--purple)', who: 'Demandeurs d\'emploi', detail: 'Aide Individuelle à la Formation selon votre situation et votre région', how: 'Parler à votre conseiller France Travail lors du prochain RDV' },
              { icon: '♿', name: 'AGEFIPH — RQTH', amount: '+5 000 EUR', color: 'var(--green)', who: 'RQTH uniquement', detail: 'Abondement CPF supplémentaire jusqu\'à 5 000 EUR pour les RQTH', how: 'Contacter notre Référent Handicap : handicap@academiapro.fr' },
            ].map(d => (
              <div key={d.name} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, transition: 'all 0.25s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hi)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{d.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: d.color, fontWeight: 700, marginBottom: 8 }}>{d.amount}</div>
                <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>Pour : {d.who}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 10 }}>{d.detail}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)', padding: '8px 12px', background: 'var(--s2)', borderRadius: 8, lineHeight: 1.5 }}>💡 {d.how}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Simulateur */}
        <section style={{ padding: '72px 6%', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
              Simulez votre <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>financement.</em>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--dim)', textAlign: 'center', marginBottom: 36 }}>2 minutes · Sans engagement · Résultat immédiat</p>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>

              {/* Formation */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8, fontWeight: 600 }}>Formation souhaitée</div>
                <select value={formationCode} onChange={e => setFormationCode(e.target.value)} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  {FORMATIONS.map(f => <option key={f.code} value={f.code}>{f.code} — {f.titre} — {f.tarif.toLocaleString()} EUR</option>)}
                </select>
              </div>

              {/* Statut */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8, fontWeight: 600 }}>Votre statut</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['salarie', 'Salarié CDI'], ['demandeur', "Demandeur d'emploi"], ['independant', 'Indépendant']].map(([v, l]) => (
                    <button key={v} onClick={() => setStatut(v)} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 600, background: statut === v ? 'var(--gold)' : 'transparent', border: `1px solid ${statut === v ? 'var(--gold)' : 'var(--border)'}`, color: statut === v ? '#050508' : 'var(--dim)', transition: 'all 0.2s' }}>{l}</button>
                  ))}
                </div>
              </div>

              {statut === 'salarie' && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8, fontWeight: 600 }}>Ancienneté dans l'entreprise (mois)</div>
                  <input value={mois} onChange={e => setMois(e.target.value)} placeholder="ex: 36" style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}/>
                </div>
              )}

              {/* Solde CPF */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8, fontWeight: 600 }}>Solde CPF estimé (EUR) — vérifier sur moncompteformation.gouv.fr</div>
                <input value={solde} onChange={e => setSolde(e.target.value)} placeholder="ex: 2500" style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}/>
              </div>

              {/* RQTH */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <input type="checkbox" checked={rqth} onChange={e => setRqth(e.target.checked)} id="rqth" style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }}/>
                <label htmlFor="rqth" style={{ fontSize: 12, color: 'var(--dim)', cursor: 'pointer' }}>J'ai une RQTH (Reconnaissance Qualité Travailleur Handicapé) → +5 000 EUR AGEFIPH</label>
              </div>

              <button onClick={simulate} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 14, fontWeight: 700 }}>
                Calculer mon financement →
              </button>

              {/* Résultat */}
              {result && (
                <div style={{ marginTop: 20, background: 'var(--gold-pale)', border: '1px solid var(--border-hi)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, marginBottom: 14 }}>Résultat de votre simulation</div>
                  {[
                    ['Formation sélectionnée', `${formationCode} — ${result.tarif.toLocaleString()} EUR`, 'var(--text)'],
                    ['CPF mobilisable', `- ${result.cpf.toLocaleString()} EUR`, 'var(--green)'],
                    result.agefiph > 0 && ['AGEFIPH (RQTH)', `- ${result.agefiph.toLocaleString()} EUR`, 'var(--green)'],
                    result.tp && ['Transitions Pro', 'Financement total + salaire maintenu', 'var(--teal)'],
                    result.opco && !result.tp && ['OPCO (selon accord)', 'Complément possible', 'var(--blue)'],
                    ['RESTE À CHARGE', result.reste > 0 ? `${result.reste.toLocaleString()} EUR` : '0 EUR ✅ FINANCÉ À 100%', result.reste > 0 ? 'var(--amber)' : 'var(--green)'],
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 12, color: 'var(--dim)' }}>{row[0]}</span>
                      <span style={{ fontSize: 13, color: row[2], fontWeight: 700, fontFamily: 'monospace' }}>{row[1]}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Link href="/agents#unia" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      Démarrer avec UNIA — Entretien gratuit →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    
    </>
  )
}
