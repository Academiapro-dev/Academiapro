import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcadémIA Pro — Premier LMS 100% IA · Formateur Expert 24h/24',
  description: 'AcadémIA Pro : 43 formations certifiantes avec un Formateur Expert IA disponible 24h/24 et un Coach Personnel IA. Finançable CPF, OPCO, Transitions Pro. DOM-TOM. Accessibilité.',
  keywords: 'formation professionnelle ia, cpf formation, formateur ia, coaching ia, sophrologie, cybersécurité, bootcamp no-code',
  openGraph: {
    title: 'AcadémIA Pro — Premier LMS 100% IA',
    description: 'Formateur Expert IA 24h/24 · Coach Personnel · 43 formations certifiantes · CPF · OPCO',
    type: 'website',
    url: 'https://academiapro.fr',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
