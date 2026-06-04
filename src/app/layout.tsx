import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcadémIA Pro',
  description: 'Premier LMS 100% IA',
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
