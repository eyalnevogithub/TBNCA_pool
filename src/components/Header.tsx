'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-tbnca-blue text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide">
          TBNCA Pool
        </Link>
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <nav className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-16 left-0 right-0 bg-tbnca-blue md:bg-transparent z-50 md:z-auto gap-1 md:gap-6 p-4 md:p-0 shadow-lg md:shadow-none`}>
          <Link href="/" className="hover:text-tbnca-gold-light py-2 md:py-0 transition-colors" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/pricing" className="hover:text-tbnca-gold-light py-2 md:py-0 transition-colors" onClick={() => setMenuOpen(false)}>Buy Pool Tags</Link>
          <Link href="/cart" className="hover:text-tbnca-gold-light py-2 md:py-0 transition-colors" onClick={() => setMenuOpen(false)}>Cart</Link>
        </nav>
      </div>
    </header>
  )
}
