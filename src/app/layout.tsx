import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from './Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AcadémIA Pro — 43 formations certifiantes',
  description: 'Centre de formation 100% IA. Formateur Expert IA 24h/24. CPF · OPCO · Transitions Pro · DOM-TOM.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Nav />
        {children}
      </body>
    </html>
  )
}
