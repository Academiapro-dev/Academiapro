// app/mentions-legales/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales | AcadémIA Pro',
  description:
    'Mentions légales, conditions générales de vente et politique de confidentialité de AcadémIA Pro.',
}

const Section = ({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c8a96e]/30" />
      <h2 className="text-xl md:text-2xl font-semibold text-[#c8a96e] whitespace-nowrap px-2">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c8a96e]/30" />
    </div>
    <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
  </section>
)

const SubSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="mt-6">
    <h3 className="text-base md:text-lg font-semibold text-[#c8a96e]/80 mb-3 flex items-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-[#c8a96e]" />
      {title}
    </h3>
    <div className="pl-4 border-l border-[#c8a96e]/20 space-y-2">{children}</div>
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4">
    <span className="text-[#c8a96e]/70 font-medium min-w-[200px] shrink-0">{label} :</span>
    <span className="text-gray-300">{value}</span>
  </div>
)

const tableOfContents = [
  { id: 'editeur', label: 'Éditeur du site' },
  { id: 'directeur', label: 'Directeur de publication' },
  { id: 'hebergeur', label: 'Hébergeur' },
  { id: 'propriete', label: 'Propriété intellectuelle' },
  { id: 'rgpd', label: 'Données personnelles & RGPD' },
  { id: 'cookies', label: 'Politique des cookies' },
  { id: 'certification', label: 'Certification AcadémIA Pro' },
  { id: 'cgv-formations', label: 'CGV — Formations' },
  { id: 'cgv-therapeutique', label: 'CGV — Séances thérapeutiques' },
]

export default function MentionsLegalesPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: '#050508' }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#c8a96e]/10">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #c8a96e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c8a96e 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c8a96e]/30 bg-[#c8a96e]/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] animate-pulse" />
            <span className="text-[#c8a96e] text-sm font-medium tracking-widest uppercase">
              Document légal
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Mentions{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #c8a96e 0%, #e8d4a8 50%, #c8a96e 100%)',
              }}
            >
              Légales
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Informations légales, conditions générales de vente et politique de
            confidentialité de la plateforme AcadémIA Pro.
          </p>
          <p className="text-gray-600 text-sm mt-4">
            Dernière mise à jour : 1er juillet 2025
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Table des matières sticky */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-[#c8a96e]/15 bg-white/2 backdrop-blur-sm p-5"
                style={{ backgroundColor: 'rgba(200,169,110,0.03)' }}>
                <h2 className="text-[#c8a96e] font-semibold text-sm uppercase tracking-widest mb-4">
                  Table des matières
                </h2>
                <nav className="space-y-1">
                  {tableOfContents.map((item, i) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-[#c8a96e] hover:bg-[#c8a96e]/5 transition-all duration-200 text-sm group"
                    >
                      <span className="text-xs text-[#c8a96e]/40 group-hover:text-[#c8a96e]/70 font-mono w-4 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1 space-y-14">

            {/* 01 — Éditeur */}
            <Section id="editeur" title="01 — Éditeur du site">
              <p>
                Le site <strong className="text-white">academia-pro.fr</strong> est édité par :
              </p>
              <div className="rounded-xl border border-[#c8a96e]/15 p-6 space-y-3"
                style={{ backgroundColor: 'rgba(200,169,110,0.03)' }}>
                <InfoRow label="Dénomination sociale" value="AcadémIA Pro" />
                <InfoRow label="Forme juridique" value="Entreprise individuelle / SASU (à préciser)" />
                <InfoRow label="Siège social" value="France (adresse disponible sur demande)" />
                <InfoRow label="SIRET" value="XXX XXX XXX XXXXX (à compléter)" />
                <InfoRow label="N° TVA intracommunautaire" value="FR XX XXXXXXXXX (à compléter)" />
                <InfoRow label="Email de contact" value="contact@academia-pro.fr" />
                <InfoRow label="Téléphone" value="+33 (0)X XX XX XX XX (à compléter)" />
              </div>
            </Section>

            {/* 02 — Directeur de publication */}
            <Section id="directeur" title="02 — Directeur de publication">
              <p>
                Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004
                pour la confiance dans l'économie numérique (LCEN), le directeur
                de la publication est :
              </p>
              <div className="rounded-xl border border-[#c8a96e]/15 p-6 space-y-3"
                style={{ backgroundColor: 'rgba(200,169,110,0.03)' }}>
                <InfoRow label="Nom" value="Jacques" />
                <InfoRow label="Qualité" value="Fondateur & Directeur de AcadémIA Pro" />
                <InfoRow label="Email" value="direction@academia-pro.fr" />
              </div>
              <p className="text-gray-500 text-sm">
                Le directeur de publication est responsable du contenu éditorial
                publié sur l'ensemble des pages du site academia-pro.fr.
              </p>
            </Section>

            {/* 03 — Hébergeur */}
            <Section id="hebergeur" title="03 — Hébergeur">
              <p>
                Le site est hébergé par la société Vercel Inc., spécialisée dans
                l'hébergement de plateformes web et d'applications :
              </p>
              <div className="rounded-xl border border-[#c8a96e]/15 p-6 space-y-3"
                style={{ backgroundColor: 'rgba(200,169,110,0.03)' }}>
                <InfoRow label="Société" value="Vercel Inc." />
                <InfoRow label="Siège social" value="440 N Barranca Ave #4133, Covina, CA 91723, États-Unis" />
                <InfoRow label="Site web" value="https://vercel.com" />
                <InfoRow label="Email" value="privacy@vercel.com" />
              </div>
              <p className="text-sm text-gray-500">
                Les données sont hébergées sur des serveurs sécurisés. Des
                transferts de données vers les États-Unis peuvent avoir lieu
                conformément aux garanties appropriées (Standard Contractual
                Clauses).
              </p>
            </Section>

            {/* 04 — Propriété intellectuelle */}
            <Section id="propriete" title="04 — Propriété intellectuelle">
              <p>
                L'ensemble des éléments constituant le site academia-pro.fr —
                notamment les textes, graphismes, logos, images, vidéos,
                séquences sonores, logiciels, bases de données, programmes
                informatiques et architectures — sont protégés par le{' '}
                <strong className="text-white">
                  Code de la propriété intellectuelle
                </strong>{' '}
                et les conventions internationales relatives au droit d'auteur.
              </p>