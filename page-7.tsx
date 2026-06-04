
import Link from 'next/link'
import { FORMATIONS, AGENTS, PRATICIENS_BIENETRE } from '@/lib/data'

export default function HomePage() {
  const topFormations = FORMATIONS.slice(0, 8)
  const topAgents = AGENTS.slice(0, 6)

  return (
    <>
      <Nav />
      <main>

        {/* ── HERO ── */}
        <section style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center',
          padding: '100px 6% 80px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(200,169,110,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          {/* Floating elements */}
          {['🤖', '🎓', '✨', '🧘'].map((e, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${[25, 20, 70, 65][i]}%`,
              left: i < 2 ? `${[8, undefined, 12][i]}%` : undefined,
              right: i >= 2 ? `${[undefined, 10, undefined, 8][i]}%` : undefined,
              fontSize: 28, opacity: 0.35,
              animation: `float ${6 + i}s ease-in-out ${i * 1.5}s infinite`,
              pointerEvents: 'none',
            }}>{e}</div>
          ))}

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 18px', borderRadius: 24,
              background: 'var(--gold-pale)', border: '1px solid var(--border-hi)',
              fontSize: 11, color: 'var(--gold)', fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--green)', boxShadow: '0 0 7px var(--green)',
                display: 'inline-block',
              }}/>
              Phase 0 opérationnelle · 10 agents actifs · ~30 EUR/mois
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(42px, 6vw, 78px)',
              fontWeight: 700, lineHeight: 1.07, marginBottom: 22,
              color: 'var(--text)',
            }}>
              Votre <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Formateur Expert IA</em><br />
              disponible à 3h du matin.<br />
              <span style={{ color: 'var(--dim)', fontSize: '0.75em' }}>Répond en 2 secondes.</span>
            </h1>

            {/* Sub */}
            <p style={{
              fontSize: 18, color: 'var(--dim)',
              maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7,
            }}>
              43 formations certifiantes. Formateur Expert IA + Coach Personnel inclus dans chaque formation. Finançable CPF, OPCO, Transitions Pro.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
              <Link href="/agents#unia" style={{
                padding: '16px 40px', borderRadius: 12,
                background: 'var(--gold)', color: '#050508',
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                🎯 Entretien gratuit avec UNIA
              </Link>
              <Link href="/formations" style={{
                padding: '16px 36px', borderRadius: 12,
                border: '1px solid var(--border-hi)', background: 'transparent',
                color: 'var(--text)', fontSize: 15, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}>
                Voir les 43 formations
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: 40, justifyContent: 'center',
              flexWrap: 'wrap', padding: '28px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}>
              {[
                ['43', 'Formations certifiantes'],
                ['116', 'Agents IA'],
                ['<2s', 'Réponse formateur'],
                ['0€', 'Reste à charge possible'],
                ['<15%', "Taux d'abandon cible"],
              ].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLÈME / SOLUTION ── */}
        <section style={{ padding: '88px 6%' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 700, marginBottom: 14 }}>
              Le problème de la formation.<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Enfin résolu.</em>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 560, margin: '0 auto' }}>
              60 à 80% des apprenants abandonnent l'e-learning classique. La cause : l'absence d'accompagnement au bon moment.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 3, maxWidth: 1000, margin: '0 auto',
            borderRadius: 18, overflow: 'hidden',
          }}>
            {[
              { bad: true, icon: '❌', title: 'Formation classique', desc: 'Le formateur est disponible 2h par semaine. Vous bloquez à 22h. Personne ne répond. Vous abandonnez.' },
              { bad: false, icon: '✅', title: 'AcadémIA Pro', desc: 'Votre Formateur Expert IA répond en 2 secondes à 3h du matin, s\'adapte à votre niveau, simule votre jury.' },
              { bad: true, icon: '❌', title: 'Contenu générique', desc: 'Des vidéos identiques pour tous. Peu importe votre niveau ou vos objectifs. Seul face à un écran.' },
              { bad: false, icon: '✅', title: 'Personnalisation totale', desc: 'Le Formateur IA s\'adapte en temps réel. Le Coach Personnel IA ancre chaque module dans votre projet réel.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.bad ? 'rgba(255,23,68,0.04)' : 'rgba(0,230,118,0.04)',
                border: `1px solid ${item.bad ? 'rgba(255,23,68,0.12)' : 'rgba(0,230,118,0.12)'}`,
                padding: 28,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DÉMO FORMATEUR IA ── */}
        <section style={{ padding: '88px 6%', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 56, alignItems: 'center', maxWidth: 1100, margin: '0 auto',
          }}>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, marginBottom: 16 }}>
                Votre <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Formateur Expert IA</em><br />n'est pas une vidéo.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--dim)', marginBottom: 28, lineHeight: 1.7 }}>
                C'est un vrai expert de votre domaine, disponible à la seconde, qui simule votre client, joue votre jury, débogue votre code en live — et ne vous juge jamais.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  ['🎭', 'Simulation de rôles', 'Joue le client, le jury, le recruteur, l\'investisseur.'],
                  ['⚡', 'Réponse en 2 secondes', 'Pipeline Claude · ElevenLabs · Disponible 24h/24.'],
                  ['🎯', 'Adapté à votre niveau', 'Détecte et ajuste en temps réel. Ni trop simple, ni trop complexe.'],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{
                    display: 'flex', gap: 14, padding: '14px 16px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/agents" className="btn-gold">
                Tester un agent IA →
              </Link>
            </div>

            {/* Chat preview */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border-hi)',
              borderRadius: 18, padding: 24, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
              <div style={{
                display: 'flex', gap: 12, alignItems: 'center',
                marginBottom: 18, padding: '12px 14px',
                background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏗️</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Thomas Martin — F01 Product Builder</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--green)' }}>
                    <span className="status-dot"/>EN LIGNE · 24h/24
                  </div>
                </div>
              </div>
              {[
                { ai: true, text: 'Module 8 — MCP Protocol. On reprend là où vous vous êtes arrêté. Par quoi voulez-vous commencer ?' },
                { ai: false, text: 'Je veux comprendre comment Claude API lit ma base Supabase via MCP.' },
                { ai: true, text: 'Parfait. Le MCP standardise l\'accès aux données. Dans votre cas Supabase : 1/ Un MCP Server expose vos tables. 2/ Claude lit et écrit directement. Voulez-vous qu\'on construise le code ensemble maintenant ?' },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: m.ai ? 'row' : 'row-reverse',
                  gap: 8, alignItems: 'flex-end', marginBottom: 10,
                }}>
                  {m.ai && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏗️</div>}
                  <div style={{
                    maxWidth: '80%', padding: '10px 13px',
                    borderRadius: m.ai ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                    background: m.ai ? 'var(--s2)' : 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
                    border: m.ai ? '1px solid var(--border)' : 'none',
                    color: m.ai ? 'var(--text)' : '#050508',
                    fontSize: 13, lineHeight: 1.6,
                  }}>{m.text}</div>
                </div>
              ))}
              <div style={{
                display: 'inline-flex', gap: 6, alignItems: 'center',
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)',
                fontSize: 10, color: 'var(--green)', fontWeight: 700, marginTop: 6,
              }}>
                ⚡ Réponse en 1,4 seconde
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMATIONS ── */}
        <section style={{ padding: '88px 6%', background: 'var(--s2)', borderTop: '1px solid var(--border)' }} id="formations">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,50px)', fontWeight: 700, marginBottom: 14 }}>
              43 formations <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>certifiantes.</em>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 540, margin: '0 auto' }}>
              Formateur Expert IA + Coach Personnel inclus. CPF · OPCO · DOM-TOM · Accessibilité.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14, maxWidth: 1200, margin: '0 auto 32px',
          }}>
            {topFormations.map(f => (
              <Link key={f.code} href={`/formations/${f.code.toLowerCase()}`} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 18, textDecoration: 'none',
                transition: 'all 0.25s', display: 'block', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0 }}/>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'DM Mono, monospace', marginBottom: 3 }}>{f.code}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 10 }}>{f.titre}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 9, color: 'var(--green)', fontWeight: 600 }}>{f.cert}</span>
                  {f.cpf && <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>CPF</span>}
                  {f.tp && <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(0,188,212,0.1)', fontSize: 9, color: 'var(--teal)', fontWeight: 600 }}>T.Pro</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{f.tarif.toLocaleString()}€</span>
                  <span style={{ fontSize: 10, color: 'var(--dim)' }}>{f.heures}</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/formations" className="btn-outline">Voir les 43 formations →</Link>
          </div>
        </section>

        {/* ── FINANCEMENTS ── */}
        <section style={{ padding: '88px 6%' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,50px)', fontWeight: 700, marginBottom: 14 }}>
              Financement à <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>100%</em> possible.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 520, margin: '0 auto' }}>
              Dans 95% des cas, nos formations sont financées à 0 EUR de reste à charge.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 14, maxWidth: 1100, margin: '0 auto',
          }}>
            {[
              { icon: '💳', name: 'CPF', desc: 'Vérifiez votre solde sur moncompteformation.gouv.fr. Toutes nos formations RS et RNCP sont éligibles.', amount: 'Jusqu\'à 5 000€' },
              { icon: '🏢', name: 'OPCO — 11 opérateurs', desc: 'Salarié ? Votre employeur cotise chaque mois. AcadémIA Pro gère le dossier OPCO avec vous.', amount: '100% possible' },
              { icon: '🔄', name: 'Transitions Pro', desc: 'Reconversion avec maintien de salaire pendant toute la durée de la formation. CDI requis.', amount: 'Salaire maintenu' },
              { icon: '🤝', name: 'France Travail', desc: 'Demandeurs d\'emploi : aide individuelle à la formation pour tous nos parcours certifiants.', amount: 'Variable' },
              { icon: '♿', name: 'AGEFIPH — RQTH', desc: 'Reconnaissance de la Qualité de Travailleur Handicapé : abondement CPF jusqu\'à +5 000 EUR.', amount: '+5 000€ CPF' },
            ].map(f => (
              <div key={f.name} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 22, transition: 'all 0.25s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hi)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 12 }}>{f.desc}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--teal)', fontWeight: 700 }}>{f.amount}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PÔLE BIEN-ÊTRE ── */}
        <section style={{ padding: '88px 6%', background: 'linear-gradient(135deg, var(--s1), rgba(14,196,176,0.02))', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,50px)', fontWeight: 700, marginBottom: 14 }}>
              Pôle <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>Bien-être.</em><br />8 praticiens disponibles.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 500, margin: '0 auto' }}>
              Sophrologie · Hypnose · Coaching · CNV · Nutrition. 30 min · 50 EUR · Données HDS.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12, maxWidth: 1100, margin: '0 auto 32px',
          }}>
            {PRATICIENS_BIENETRE.map(p => (
              <Link key={p.id} href="/bienetre" style={{
                background: 'var(--card)', border: '1px solid rgba(14,196,176,0.12)',
                borderRadius: 12, padding: 18, textAlign: 'center',
                textDecoration: 'none', transition: 'all 0.25s', display: 'block',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,196,176,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,196,176,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(14,196,176,0.12)', border: '2px solid rgba(14,196,176,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 10px' }}>{p.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{p.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--teal)', marginBottom: 8, fontWeight: 600 }}>{p.spec}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dispo === 'Maintenant' ? 'var(--green)' : 'var(--amber)', display: 'inline-block' }}/>
                  <span style={{ color: p.dispo === 'Maintenant' ? 'var(--green)' : 'var(--amber)' }}>{p.dispo}</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/bienetre" style={{
              padding: '12px 28px', borderRadius: 10, fontSize: 13, textDecoration: 'none',
              background: 'transparent', border: '1px solid rgba(14,196,176,0.3)',
              color: 'var(--teal)', fontWeight: 600, display: 'inline-block',
            }}>
              Découvrir le Pôle Bien-être →
            </Link>
          </div>
        </section>

        {/* ── TÉMOIGNAGES ── */}
        <section style={{ padding: '88px 6%', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, marginBottom: 14 }}>
              Ils ont <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>transformé</em> leur parcours.
            </h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 18, maxWidth: 1100, margin: '0 auto',
          }}>
            {[
              { stars: 5, text: 'Le Formateur IA m\'a répondu à 23h30 un dimanche sur un bug Make. En moins de 2 secondes. Aucun formateur humain ne peut faire ça.', name: 'Julien M.', role: 'F01 Bootcamp Product Builder' },
              { stars: 5, text: 'La sophrologie avec Maya, c\'est bluffant. Disponible le soir après le travail. Les données sont protégées, c\'est rassurant.', name: 'Sarah L.', role: 'F03 Sophrologie · Niveau 2' },
              { stars: 5, text: 'Le Coach Personnel IA m\'a aidé à clarifier mon projet en 3 semaines. Ce que j\'avais cherché à faire avec un vrai coach pendant 6 mois.', name: 'Thomas R.', role: 'F28 IA Générative' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
                <div style={{ color: 'var(--amber)', fontSize: 14, marginBottom: 12 }}>{'⭐'.repeat(t.stars)}</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', marginBottom: 16, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{ padding: '100px 6%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.05), transparent 65%)',
            pointerEvents: 'none',
          }}/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,62px)', fontWeight: 700, marginBottom: 16 }}>
              Commencez votre<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>transformation</em> maintenant.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--dim)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Entretien de positionnement gratuit avec UNIA · 20 minutes · Sans engagement · Simulation financement incluse.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/agents#unia" style={{
                padding: '16px 40px', borderRadius: 12,
                background: 'var(--gold)', color: '#050508',
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
              }}>
                🎯 Démarrer mon entretien gratuit
              </Link>
              <Link href="/formations" style={{
                padding: '16px 36px', borderRadius: 12,
                border: '1px solid var(--border-hi)', background: 'transparent',
                color: 'var(--text)', fontSize: 15, fontWeight: 600, textDecoration: 'none',
              }}>
                Voir toutes les formations
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
