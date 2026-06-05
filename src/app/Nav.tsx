'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

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
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: '64px',
      display: 'flex', alignItems: 'center',
      padding: '0 6%', justifyContent: 'space-between',
      transition: 'background 0.3s',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #a07840, #c8a96e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🎓</div>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 19, fontWeight: 700, color: '#c8a96e',
        }}>AcadémIA Pro</span>
      </Link>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center', fontSize: 14 }}>
        <Link href="/formations" style={{ color: 'rgba(240,237,232,0.5)', textDecoration: 'none' }}>Formations</Link>
        <Link href="/agents" style={{ color: 'rgba(240,237,232,0.5)', textDecoration: 'none' }}>Agents IA</Link>
        <Link href="/financement" style={{ color: 'rgba(240,237,232,0.5)', textDecoration: 'none' }}>Financement</Link>
        <Link href="/blog" style={{ color: 'rgba(240,237,232,0.5)', textDecoration: 'none' }}>Blog</Link>
        <Link href="/contact" style={{ color: 'rgba(240,237,232,0.5)', textDecoration: 'none' }}>Contact</Link>
        <Link href="/chat?agent=unia" style={{
          padding: '8px 18px', borderRadius: 10,
          background: '#c8a96e', color: '#050508',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>Démarrer →</Link>
      </div>
    </nav>
  )
}

