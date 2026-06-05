'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FORMATIONS } from '../../../../data'

export default function FormationDetailPage({ params }: { params: { code: string } }) {
  const formation = FORMATIONS.find((f: any) => f.code.toLowerCase() === params.code.toLowerCase())
  const [onglet, setOnglet] = useState('programme')
  const [chapitreOuvert, setChapitreOuvert] = useState<number>(1)

  if (!formation) return (
    <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, marginBottom: 16 }}>Formation introuvable</h1>
        <Link href="/formations" style={{ color: 'var(--gold)', textDecoration: 'none' }}>← Voir toutes les formations</Link>
      </div>
    </main>
  )

  const chapitres = (formation as any).chapitres

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
              {chapitres && <div><div style={{ fontSize: 11, color: 'var(--dim)' }}>Chapitres</div><div style={{ fontSize: 14, fontWeight: 700 }}>{chapitres.length} chapitres</div></div>}
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
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Parcours de formation</h2>
            {chapitres ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {chapitres.map((chapitre: any) => (
                  <div key={chapitre.num} style={{ background: 'var(--card)', border: `1px solid ${chapitreOuvert === chapitre.num ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden' }}>
                    <button
                      onClick={() => setChapitreOuvert(chapitreOuvert === chapitre.num ? 0 : chapitre.num)}
                      style={{ width: '100%', padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: chapitreOuvert === chapitre.num ? 'var(--gold)' : 'var(--gold-pale)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: chapitreOuvert === chapitre.num ? '#050508' : 'var(--gold)', flexShrink: 0 }}>
                        {chapitre.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Chapitre {chapitre.num} — {chapitre.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{chapitre.modules?.length} modules · {chapitre.heures}</div>
                      </div>
                      <div style={{ fontSize: 20, color: 'var(--gold)', transform: chapitreOuvert === chapitre.num ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</div>
                    </button>

                    {chapitreOuvert === chapitre.num && chapitre.modules && (
                      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {chapitre.modules.map((module: any) => (
                          <div key={module.num} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--gold)' }}/>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                                  {module.num}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Module {module.num} — {module.titre}</span>
                              </div>
                              <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--s2)', fontSize: 11, color: 'var(--dim)', fontWeight: 600, flexShrink: 0 }}>{module.heures}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.7, paddingLeft: 38 }}>
                              {module.contenu.split(' · ').map((item: string, i: number) => (
                                <span key={i}><span style={{ color: 'var(--gold)', marginRight: 4 }}>·</span>{item}{' '}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', color: 'var(--dim)' }}>
                Programme détaillé disponible sur demande. Contactez UNIA pour un entretien personnalisé.
              </div>
            )}
          </div>
        )}

        {onglet === 'financement' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Options de financement</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { icon: '💳', titre: 'CPF', desc: 'Compte Personnel de Formation jusqu\'à 5 000 EUR. Utilisable sans accord employeur.', dispo: formation.cpf, color: '#c8a96e' },
                { icon: '🏢', titre: 'OPCO', desc: `${(formation as any).opco === true ? 'Tous OPCO' : (formation as any).opco || 'Sur demande'}. Prise en charge totale par votre OPCO.`, dispo: !!(formation as any).opco, color: '#448aff' },
                { icon: '🔄', titre: 'Transitions Pro', desc: 'Maintien de salaire + formation financée pour les CDI en reconversion.', dispo: !!(formation as any).tp, color: '#00e676' },
                { icon: '🏛️', titre: 'France Travail', desc: 'Financement pour demandeurs d\'emploi. Allocations maintenues pendant la formation.', dispo: true, color: '#9b7cf4' },
                { icon: '♿', titre: 'AGEFIPH', desc: 'Aide complémentaire jusqu\'à 5 000 EUR pour les personnes avec RQTH.', dispo: !!(formation as any).handicap, color: '#0ec4b0' },
                { icon: '🏝️', titre: 'DOM-TOM', desc: 'Dispositifs spécifiques LADOM et aides régionales pour les résidents d\'outre-mer.', dispo: !!(formation as any).domtom, color: '#f06292' },
              ].map(d => (
                <div key={d.titre} style={{ background: 'var(--card)', border: `1px solid ${d.dispo ? d.color + '40' : 'var(--border)'}`, borderRadius: 16, padding: 20, opacity: d.dispo ? 1 : 0.5 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{d.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 12 }}>{d.desc}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.dispo ? d.color : 'var(--dim)' }}>
                    {d.dispo ? '✓ Disponible pour cette formation' : '✗ Non disponible'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Simulez votre financement en 20 minutes</h3>
              <p style={{ fontSize: 14, color: 'var(--dim)', marginBottom: 20 }}>UNIA calcule votre reste à charge — souvent 0 EUR.</p>
              <Link href="/chat?agent=unia" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                Démarrer l'entretien gratuit →
              </Link>
            </div>
          </div>
        )}

        {onglet === 'debouches' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Débouchés & Perspectives</h2>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>Ce que vous serez capable de faire</h3>
              <p style={{ fontSize: 14, color: 'var(--dim)', lineHeight: 1.7 }}>{formation.description}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {[
                { icon: '💼', titre: 'Salarié', desc: 'Montée en compétences · Évolution de poste · Augmentation salariale' },
                { icon: '🚀', titre: 'Freelance', desc: 'Missions indépendantes · Tarif journalier · Liberté professionnelle' },
                { icon: '🏢', titre: 'Entrepreneur', desc: 'Création d\'entreprise · Lancement produit · Développement business' },
                { icon: '🎓', titre: 'Formateur', desc: 'Transmettre ses compétences · Créer des formations · Revenus complémentaires' },
              ].map(d => (
                <div key={d.titre} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{d.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'inscription' && (
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Prêt à démarrer ?</h2>
            <p style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 32 }}>
              Commencez par un entretien gratuit de 20 minutes avec UNIA. Elle vérifie que cette formation correspond à votre profil et simule votre plan de financement.
            </p>
            <Link href="/chat?agent=unia" style={{ display: 'block', padding: '16px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', fontSize: 15, marginBottom: 16 }}>
              🎯 Démarrer l'entretien gratuit avec UNIA
            </Link>
            <Link href="/contact" style={{ display: 'block', padding: '14px', borderRadius: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)', textDecoration: 'none', fontSize: 14 }}>
              Contacter l'équipe →
            </Link>
            <div style={{ marginTop: 32, padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.8 }}>
                ✓ Entretien 100% gratuit et sans engagement<br/>
                ✓ Réponse en moins de 2 secondes<br/>
                ✓ Financement simulé en direct<br/>
                ✓ Convention de formation envoyée sous 24h
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
