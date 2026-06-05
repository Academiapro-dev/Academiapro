import Link from 'next/link'

const DISPOSITIFS = [
  {
    icon: '💳',
    titre: 'CPF — Compte Personnel de Formation',
    montant: 'Jusqu\'à 5 000 EUR',
    color: '#c8a96e',
    desc: 'Chaque salarié accumule des droits CPF chaque année. Utilisable sans accord de l\'employeur pour les formations certifiantes. Solde consultable sur moncompteformation.gouv.fr.',
    eligibilite: 'Tout salarié ou demandeur d\'emploi ayant travaillé au moins 1 an',
    delai: 'Immédiat',
  },
  {
    icon: '🏢',
    titre: 'OPCO — Financement Employeur',
    montant: 'Prise en charge totale',
    color: '#448aff',
    desc: '11 OPCO financent les formations de vos salariés. Démarche simple : votre employeur contacte son OPCO et la formation est prise en charge sans reste à charge.',
    eligibilite: 'Salariés en poste — accord employeur requis',
    delai: '2 à 4 semaines',
  },
  {
    icon: '🔄',
    titre: 'Transitions Pro — Projet de Transition',
    montant: 'Salaire maintenu + frais',
    color: '#00e676',
    desc: 'Financement pour changer de métier tout en conservant son salaire. Idéal pour les CDI souhaitant se reconvertir. Prise en charge des frais pédagogiques et maintien de rémunération.',
    eligibilite: 'CDI avec 24 mois d\'ancienneté dont 12 dans l\'entreprise actuelle',
    delai: '2 à 3 mois',
  },
  {
    icon: '🏛️',
    titre: 'France Travail — Demandeurs d\'emploi',
    montant: 'Prise en charge totale',
    color: '#9b7cf4',
    desc: 'France Travail finance les formations des demandeurs d\'emploi dans le cadre du PPAE. Maintien des allocations chômage pendant la formation.',
    eligibilite: 'Demandeurs d\'emploi inscrits à France Travail',
    delai: '3 à 6 semaines',
  },
  {
    icon: '♿',
    titre: 'AGEFIPH — Handicap',
    montant: 'Jusqu\'à 5 000 EUR supplémentaires',
    color: '#0ec4b0',
    desc: 'Aide complémentaire pour les personnes en situation de handicap (RQTH). Cumulable avec le CPF pour financer intégralement votre formation.',
    eligibilite: 'Personnes avec RQTH (Reconnaissance Qualité Travailleur Handicapé)',
    delai: '2 à 4 semaines',
  },
  {
    icon: '🏝️',
    titre: 'DOM-TOM — Dispositifs spécifiques',
    montant: 'Variable selon territoire',
    color: '#f06292',
    desc: 'Des dispositifs spécifiques existent pour les résidents des DOM-TOM : LADOM, FIP, aides régionales. UNIA vous guide vers le bon dispositif selon votre territoire.',
    eligibilite: 'Résidents des DOM-TOM',
    delai: 'Variable',
  },
]

export default function FinancementPage() {
  return (
    <>
      <main style={{ paddingTop: 64 }}>

        <section style={{ padding: '60px 6% 48px', textAlign: 'center', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, marginBottom: 14 }}>
            Financement <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>à 0 EUR.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Dans 95% des cas, nos formations sont entièrement financées. CPF, OPCO, Transitions Pro, France Travail, AGEFIPH — UNIA simule votre financement en 20 minutes.
          </p>
          <Link href="/chat?agent=unia" style={{ padding: '16px 40px', borderRadius: 12, background: 'var(--gold)', color: '#050508', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            🎯 Simuler mon financement — Gratuit
          </Link>
        </section>

        <section style={{ padding: '48px 6% 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
            {DISPOSITIFS.map(d => (
              <div key={d.titre} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${d.color}, transparent)` }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 36 }}>{d.icon}</span>
                  <span style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--gold-pale)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>{d.montant}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{d.titre}</h3>
                <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 16 }}>{d.desc}</p>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--dim)', marginBottom: 8 }}>
                  <span style={{ color: d.color, fontWeight: 600 }}>Éligibilité : </span>{d.eligibilite}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>
                  <span style={{ color: d.color, fontWeight: 600 }}>Délai : </span>{d.delai}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: '60px 6%', textAlign: 'center', background: 'var(--s1)', borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, marginBottom: 14 }}>
            UNIA simule votre financement
          </h2>
          <p style={{ fontSize: 15, color: 'var(--dim)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
            En 20 minutes, UNIA analyse votre situation, identifie les dispositifs disponibles et calcule votre reste à charge — souvent 0 EUR.
          </p>
          <Link href="/chat?agent=unia" style={{ padding: '14px 32px', borderRadius: 10, background: 'var(--gold)', color: '#050508', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Démarrer l'entretien gratuit →
          </Link>
        </section>

      </main>
    </>
  )
}

