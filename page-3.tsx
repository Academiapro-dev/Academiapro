// Nav removed
// Footer removed

import Link from 'next/link'

const ARTICLES = [
  { slug: 'financer-formation-cpf-2026', titre: 'Comment financer sa formation à 100% avec le CPF en 2026', cat: 'Financement CPF', date: '3 juin 2026', duree: '8 min', icon: '💳', desc: 'Le guide complet pour utiliser votre CPF, OPCO, Transitions Pro et France Travail. 0 EUR de reste à charge dans 95% des cas.' },
  { slug: 'metiers-ia-2026-salaires', titre: 'Les 7 métiers IA les plus recherchés en 2026 — Salaires et formations', cat: 'Métiers IA', date: '27 mai 2026', duree: '10 min', icon: '🤖', desc: '+180% d\'offres d\'emploi IA en 2 ans. Découvrez les 7 profils hybrides que les employeurs s\'arrachent, avec les vrais salaires et formations.' },
  { slug: 'reconversion-sophrologie-2026', titre: 'Se reconvertir en sophrologie en 2026 — Ce que personne ne vous dit', cat: 'Bien-être', date: '20 mai 2026', duree: '7 min', icon: '🧘', desc: '2,3 millions de personnes en burn-out. 15 000 sophrologues pour 67 millions d\'habitants. Le guide honnête pour se certifier et vivre de la sophrologie.' },
  { slug: 'cybersecurite-comptia-6-mois', titre: 'Cybersécurité : de débutant à certifié CompTIA Security+ en 6 mois', cat: 'Cybersécurité', date: '13 mai 2026', duree: '9 min', icon: '🔐', desc: '400 000 postes non pourvus en Europe. Le guide pour décrocher la certification CompTIA Security+ — la référence mondiale — en 6 mois.' },
  { slug: 'formation-dom-tom-cpf-2026', titre: 'Se former depuis les DOM-TOM en 2026 — Le guide complet', cat: 'DOM-TOM', date: '29 avril 2026', duree: '6 min', icon: '🏝️', desc: '38 millions d\'actifs avec droits CPF en France. 2,7 millions en DOM-TOM. 80% de ces droits non utilisés. Comment changer ça.' },
  { slug: 'reconversion-data-scientist', titre: 'Reconversion data scientist — Le guide honnête 2026', cat: 'Métiers', date: '22 avril 2026', duree: '11 min', icon: '📊', desc: '"Devenez Data Scientist en 6 semaines !" est un mensonge. Voici la vérité : les vrais pré-requis, les vrais délais, les vrais salaires.' },
  { slug: 'bootcamp-no-code-5900-euros', titre: 'Bootcamp No-Code 2026 — Vaut-il vraiment 5 900 EUR ?', cat: 'Formations', date: '13 mai 2026', duree: '9 min', icon: '🏗️', desc: 'Le calcul honnête du ROI. Pour certains profils : 5 900 EUR et remboursé en 2 jours de freelance. Pour d\'autres : non. Ce guide vous aide à décider.' },
  { slug: 'manager-avec-ia-2026', titre: 'Manager avec l\'IA en 2026 — Ce qui change vraiment', cat: 'Management', date: '8 avril 2026', duree: '7 min', icon: '👔', desc: 'Les 5 pratiques des meilleurs managers qui utilisent l\'IA. Pas pour remplacer l\'humain — pour se concentrer sur ce que seul un humain peut faire.' },
  { slug: 'toeic-750-3-mois', titre: 'TOEIC 750+ en 3 mois — La méthode avec un formateur IA natif', cat: 'Langues', date: '1 avril 2026', duree: '6 min', icon: '🇬🇧', desc: 'Le TOEIC 750+ ouvre les postes internationaux. Un formateur IA natif disponible 24h/24 change tout. Voici la méthode en 3 phases.' },
  { slug: 'certification-coach-icf-2026', titre: 'Se certifier coach professionnel ICF en 2026 — Le guide complet', cat: 'Coaching', date: '25 mars 2026', duree: '9 min', icon: '💆', desc: 'Le marché du coaching pèse 1 milliard d\'euros. La certification ICF est la seule vraiment reconnue dans 140 pays. Voici comment l\'obtenir.' },
  { slug: 'automatisations-make-5-scenarios', titre: 'Automatisez 10 heures par semaine avec Make — 5 scénarios concrets', cat: 'Automatisation', date: '18 mars 2026', duree: '8 min', icon: '⚙️', desc: '5 scénarios Make que vous pouvez mettre en place ce week-end. Du plus simple (email résumé en 45 min) au plus complexe (pipeline contenu complet).' },
  { slug: 'csrd-rse-formation-2026', titre: 'CSRD 2026 — Tout comprendre sur la nouvelle obligation RSE', cat: 'RSE', date: '11 mars 2026', duree: '8 min', icon: '🌱', desc: '50 000 entreprises concernées dès 2026. Le rôle de Référent RSE explose. +45% d\'offres d\'emploi RSE en 2 ans. Voici ce qu\'il faut savoir.' },
]

const CATS = ['Tous', 'Financement CPF', 'Métiers IA', 'Bien-être', 'Formations', 'DOM-TOM']

export default function BlogPage() {
  return (
    <>

      <main style={{ paddingTop: 64 }}>
        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, marginBottom: 14 }}>
            Blog <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>AcadémIA Pro.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 480, margin: '0 auto' }}>
            Formation · IA · Financement · Reconversion · Bien-être professionnel.
          </p>
        </section>

        <section style={{ padding: '48px 6% 60px' }}>
          {/* Article vedette */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <span style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--gold)', fontWeight: 600, marginBottom: 16, display: 'inline-block' }}>Article de la semaine</span>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 700, marginBottom: 14, lineHeight: 1.3 }}>{ARTICLES[0].titre}</h2>
                <p style={{ fontSize: 14, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 20 }}>{ARTICLES[0].desc}</p>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Link href={`/blog/${ARTICLES[0].slug}`} className="btn-gold">Lire l'article →</Link>
                  <span style={{ fontSize: 12, color: 'var(--dim)' }}>{ARTICLES[0].date} · {ARTICLES[0].duree}</span>
                </div>
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: 16, padding: 28, border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>{ARTICLES[0].icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--gold)', fontWeight: 700 }}>Financement CPF</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 8 }}>Guide complet · 8 min de lecture</div>
              </div>
            </div>
          </div>

          {/* Grille articles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {ARTICLES.slice(1).map(a => (
              <Link key={a.slug} href={`/blog/${a.slug}`} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: 22, textDecoration: 'none', transition: 'all 0.25s', display: 'block',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{a.icon}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>{a.cat}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>{a.titre}</h3>
                <p style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 14 }}>{a.desc.substring(0, 100)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)' }}>{a.date}</span>
                  <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>{a.duree} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section style={{ padding: '60px 6%', textAlign: 'center', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, marginBottom: 12 }}>
            Newsletter <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>hebdomadaire.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--dim)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>Formations · IA · Financement · Métiers en tension. Chaque semaine. Sans spam.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            <input placeholder="votre@email.fr" style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 13, outline: 'none' }}/>
            <button style={{ padding: '12px 22px', borderRadius: 10, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#050508', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>S'abonner →</button>
          </div>
        </section>
      </main>
      

      <style>{`
        @media (max-width: 768px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
