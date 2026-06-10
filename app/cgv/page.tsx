// app/cgv/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | AcadémIA Pro',
  description:
    'Conditions Générales de Vente d\'AcadémIA Pro - Formations en ligne propulsées par l\'intelligence artificielle. Conformes au droit français.',
  robots: 'index, follow',
}

const lastUpdate = '15 janvier 2025'

interface SectionProps {
  id: string
  number: string
  title: string
  children: React.ReactNode
}

function Section({ id, number, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-4 mb-4">
        <span
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: 'rgba(200,169,110,0.15)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.3)' }}
        >
          {number}
        </span>
        <h2 className="text-xl md:text-2xl font-bold pt-1.5" style={{ color: '#c8a96e' }}>
          {title}
        </h2>
      </div>
      <div className="ml-14 space-y-3 text-gray-300 leading-relaxed text-sm md:text-base">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4 mt-3"
      style={{ backgroundColor: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.25)' }}
    >
      {children}
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4 mt-3"
      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
    >
      <span className="text-red-400">{children}</span>
    </div>
  )
}

function Divider() {
  return <hr className="border-0 h-px my-8" style={{ backgroundColor: 'rgba(200,169,110,0.15)' }} />
}

export default function CGVPage() {
  const tableOfContents = [
    { id: 'vendeur', number: '1', title: 'Identification du vendeur' },
    { id: 'objet', number: '2', title: 'Objet et champ d\'application' },
    { id: 'prix', number: '3', title: 'Prix et modalités de paiement' },
    { id: 'livraison', number: '4', title: 'Modalités d\'accès aux formations' },
    { id: 'retractation', number: '5', title: 'Droit de rétractation' },
    { id: 'garantie', number: '6', title: 'Garantie satisfait ou remboursé 30 jours' },
    { id: 'propriete', number: '7', title: 'Propriété intellectuelle' },
    { id: 'responsabilite', number: '8', title: 'Responsabilité et limitations' },
    { id: 'donnees', number: '9', title: 'Protection des données personnelles (RGPD)' },
    { id: 'cookies', number: '10', title: 'Politique de cookies' },
    { id: 'droit', number: '11', title: 'Droit applicable et juridiction compétente' },
    { id: 'mediation', number: '12', title: 'Médiation des consommateurs' },
    { id: 'contact', number: '13', title: 'Contact et réclamations' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050508', color: '#e5e7eb' }}>
      {/* Background subtle texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 50%, rgba(200,169,110,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(200,169,110,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(5,5,8,0.9)', borderBottom: '1px solid rgba(200,169,110,0.2)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200 group-hover:scale-105"
              style={{ backgroundColor: '#c8a96e', color: '#050508' }}
            >
              AI
            </div>
            <span className="font-bold text-lg hidden sm:block" style={{ color: '#c8a96e' }}>
              AcadémIA Pro
            </span>
          </a>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Conformes au droit français</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Banner */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
            style={{ backgroundColor: 'rgba(200,169,110,0.1)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.25)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Document juridique officiel
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight">
            <span style={{ color: '#c8a96e' }}>Conditions Générales</span>
            <br />
            <span className="text-white">de Vente</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            En passant commande sur la plateforme AcadémIA Pro, vous acceptez sans réserve les présentes
            Conditions Générales de Vente dans leur intégralité.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Dernière mise à jour : {lastUpdate}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Version française
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Table of Contents */}
          <aside className="lg:w-72 flex-shrink-0">
            <div
              className="lg:sticky lg:top-24 rounded-xl p-5"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,169,110,0.15)' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#c8a96e' }}>
                Sommaire
              </h2>
              <nav className="space-y-1">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-all duration-150 group"
                    style={{ hover: { backgroundColor: 'rgba(200,169,110,0.08)' } } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(200,169,110,0.08)'
                      e.currentTarget.style.color = '#c8a96e'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#9ca3af'
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded text-center leading-5 text-xs font-bold mt-0.5"
                      style={{ backgroundColor: 'rgba(200,169,110,0.1)', color: '#c8a96e' }}
                    >
                      {item.number}
                    </span>
                    <span className="leading-relaxed">{item.title}</span>
                  </a>
                ))}
              </nav>
              <div
                className="mt-5 pt-4 text-xs text-gray-500 text-center"
                style={{ borderTop: '1px solid rgba(200,169,110,0.1)' }}
              >
                <p>Questions ?</p>
                <a
                  href="mailto:contact@academiapro.fr"
                  className="transition-colors duration-150"
                  style={{ color: '#c8a96e' }}
                >
                  contact@academiapro.fr
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl p-6 md:p-8 lg:p-10 space-y-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(200,169,110,0.12)' }}
            >
              {/* Preamble */}
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)' }}
              >
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-semibold" style={{ color: '#c8a96e' }}>Préambule — </span>
                  Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l'ensemble des transactions
                  commerciales conclues entre la société AcadémIA Pro et toute personne physique ou morale souhaitant
                  acquérir des formations en ligne (ci-après « l'Acheteur » ou le « Client »). Conformément aux
                  articles L.111-1 et suivants du Code de la consommation, les présentes CGV sont mises à la
                  disposition des Clients avant toute passation de commande. AcadémIA Pro se réserve le droit de
                  modifier à tout moment les présentes CGV. Les CGV applicables sont celles en vigueur à la date
                  de passation de la commande.
                </p>
              </div>

              <Divider />

              {/* Section 1 */}
              <Section id="vendeur" number="1" title="Identification du vendeur">
                <InfoBox>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Dénomination sociale', value: 'AcadémIA Pro' },
                      { label: 'Forme juridique', value: 'Société par actions simplifiée (SAS)' },
                      { label: 'Capital social', value: '10 000 euros' },
                      { label: '