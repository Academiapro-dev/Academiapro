import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcadémIA Pro — 131 Formations Certifiantes',
  description: 'La plateforme de formation propulsée par l IA. 131 formations certifiantes. Agent IA tuteur 24h/24.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='fr'>
      <body style={{ margin: 0, background: '#050508', color: '#fff', fontFamily: 'Georgia, serif' }}>
        {children}
      </body>
    </html>
  );
}