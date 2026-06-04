'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(3,3,10,0.97)' : 'rgba(3,3,10,0.8)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
      display: 'flex', alignItems: 'center',
      padding: '0 6%', justifyContent: 'space-between',
      transition: 'background 0.3s',
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🎓</div>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 19, fontWeight: 700, color: 'var(--gold)',
        }}>AcadémIA Pro</span>
      </Link>

      {/* Links desktop */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="nav-links">
        {[
          ['Formations', '/formations'],
          ['Formateurs IA', '/agents'],
          ['Bien-être', '/bienetre'],
          ['Financement', '/financement'],
          ['Blog', '/blog'],
        ].map(([label, href]) => (
          <Link key={href} href={href} style={{
            color: 'var(--dim)', textDecoration: 'none',
            fontSize: 13, fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href="/agents" style={{
          padding: '8px 18px', borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--gold)',
          fontSize: 12, fontWeight: 600, textDecoration: 'none',
          transition: 'all 0.2s',
        }}>
          Connexion
        </Link>
        <Link href="/agents#unia" style={{
          padding: '9px 20px', borderRadius: 9,
          background: 'var(--gold)', color: '#050508',
          fontSize: 12, fontWeight: 700, textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Entretien gratuit →
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
