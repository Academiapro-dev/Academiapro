'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS } from '../../../data'

export default function FormationDetailPage({ params }: { params: { code: string } }) {
  const formation = FORMATIONS.find((f: any) => f?.code?.toLowerCase() === params.code?.toLowerCase())
  const [onglet, setOnglet] = useState('programme')

  if (!formation) return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, marginBottom: 16 }}>Formation introuvable</h1>
        <Link href="/formations" style={{ color: 'var(--gold)', textDecoration: 'none' }}>← Voir toutes les formations</Link>
      </div>
    </main>
  )

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)' }}>
      <section style={{ padding: '60px 6% 48px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
        <Link href="/formations" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none', marginBottom: 20, display: 'inline-block' }}>← Toutes les formations</Link>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--gold-pale)', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{formation.code}</span>
              <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{formation.cert}</span>
              {formation.cpf && <span style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--gold-pale)', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>💳 CPF</span>}
              {(formation as any).tp && <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,188,212,0.1)', fontSize: 11, color: '#00bcd4', fontWeight: 600 }}>Transitions Pro</span>}
              {(formation as any).domtom && <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(200,169,110,0.08)', fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>DOM-TOM ✓</span>}
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
              {formation.icon} {formation.titre}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 24 }}>{formation.description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 11, color: 'var(--dim)' }}>Durée</div><div style={{ fontSize: 14, fontWeight: 700 }}>{formation.heures} · {formation.duree}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--dim)' }}>Certification</div><div style={{ fontSize: 14, fontWeight: 700 }}>{formation.cert}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--dim)' }}>Catégorie</div><div style={{ fontSize: 14, fontWeight: 700 }}>{formation.cat}</div></div>
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{formation.tarif.toLocaleString()}€</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 20 }}>Financement disponible — jusqu'à 0 EUR</div>
            <Link href="/chat?agent=unia" style={{ display: 'block', padding: '13px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
              🎯 S'inscrire — Entretien gratuit
            </Link>
            <Link href="/financement" style={{ display: 'block', padding: '11px', borderRadius: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)', textDecoration: 'none', textAlign: 'center', fontSize: 13 }}>
              Simuler mon financement →
            </Link>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['✓ Formateur Expert IA 24h/24', '✓ Coach Personnel inclus', '✓ Certification reconnue', '✓ Accès à vie aux ressources', '✓ DOM-TOM accessible'].map(item => (
                <div key={item} style={{ fontSize: 12, color: 'var(--dim)' }}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '0 6%', display: 'flex', gap: 4 }}>
          {[
            { id: 'programme', label: '📚 Programme' },
            { id: 'financement', label: '💳 Financement' },
            { id: 'debouches', label: '🎯 Débouchés' },
            { id: 'inscription', label: '✍️ S\'inscrire' },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={{
              padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${onglet === o.id ? 'var(--gold)' : 'transparent'}`,
              color: onglet === o.id ? 'var(--gold)' : 'var(--dim)', fontSize: 13, fontWeight: 600,
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '48px 6%', maxWidth: 1100, margin: '0 auto' }}>

        {onglet === 'programme' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Programme complet</h2>
            {(formation as any).chapitres ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {((formation as any).chapitres as any[]).map((chapitre: any) => (
                  <div key={chapitre.num} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{chapitre.num}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>Chapitre {chapitre.num} — {chapitre.titre}</div>
                          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{chapitre.modules?.length} modules · {chapitre.heures}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {chapitre.modules?.map((m: any) => (
                        <div key={m.num} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', borderLeft: '3px solid var(--gold)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Module {m.num} — {m.titre}</span>
                            <span style={{ fontSize: 11, color: 'var(--dim)' }}>{m.heures}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6 }}>{m.contenu}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', color: 'var(--dim)' }}>
                Programme détaillé disponible sur demande.
              </div>
            )}
          </div>
        )}

        {onglet === 'financement' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Options de financement</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { icon: '💳', titre: 'CPF', desc: 'Compte Personnel de Formation jusqu\'à 5 000 EUR.', dispo: formation.cpf, color: '#c8a96e' },
                { icon: '🏢', titre: 'OPCO', desc: `${(formation as any).opco === true ? 'Tous OPCO' : (formation as any).opco || 'Sur demande'}.`, dispo: !!(formation as any).opco, color: '#448aff' },
                { icon: '🔄', titre: 'Transitions Pro', desc: 'Maintien de salaire + formation financée.', dispo: !!(formation as any).tp, color: '#00e676' },
                { icon: '🏛️', titre: 'France Travail', desc: 'Financement pour demandeurs d\'emploi.', dispo: true, color: '#9b7cf4' },
                { icon: '♿', titre: 'AGEFIPH', desc: 'Aide complémentaire jusqu\'à 5 000 EUR.', dispo: !!(formation as any).handicap, color: '#0ec4b0' },
                { icon: '🏝', titre: 'DOM-TOM', desc: 'Dispositifs spécifiques LADOM.', dispo: !!(formation as any).domtom, color: '#f06292' },
              ].map(d => (
                <div key={d.titre} style={{ background: 'var(--card)', border: `1px solid ${d.dispo ? d.color + '40' : 'var(--border)'}`, borderRadius: 16, padding: 20, opacity: d.dispo ? 1 : 0.5 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{d.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 12 }}>{d.desc}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.dispo ? d.color : 'var(--dim)' }}>
                    {d.dispo ? '✓ Disponible' : '✗ Non disponible'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'debouches' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Débouchés & Perspectives</h2>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--dim)', lineHeight: 1.7 }}>{formation.description}</p>
            </div>
          </div>
        )}

        {onglet === 'inscription' && (
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Prêt à démarrer ?</h2>
            <Link href="/chat?agent=unia" style={{ display: 'block', padding: '16px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', fontSize: 15, marginBottom: 16 }}>
              🎯 Démarrer l'entretien gratuit avec UNIA
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
