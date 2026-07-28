import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcadémIA Pro — Premier LMS 100% IA · Formateur Expert 24h/24',
  description: 'AcadémIA Pro : 266 formations professionnelles avec certificat AcadémIA Pro, un Formateur Expert IA disponible 24h/24 et un Coach Personnel IA. Accessible partout, DOM-TOM inclus.',
  keywords: 'formation professionnelle ia, formateur ia, coaching ia, sophrologie, cybersécurité, bootcamp no-code',
  openGraph: {
    title: 'AcadémIA Pro — Premier LMS 100% IA',
    description: 'Formateur Expert IA 24h/24 · Coach Personnel · 266 formations avec certificat AcadémIA Pro',
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
