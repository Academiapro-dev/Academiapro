import React from "react";
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcadémIA Pro',
  description: '131 formations certifiantes propulsées par l IA',
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