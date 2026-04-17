'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthenticated(true)
      } else if (pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      setChecking(false)
    })
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (checking) return <div className="p-8 text-center text-tbnca-gray">Loading...</div>
  if (!authenticated) return null

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/residents', label: 'Residents' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/waiver', label: 'Waiver' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-tbnca-blue text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold">TBNCA Admin</span>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm hover:text-tbnca-gold-light transition-colors ${pathname === item.href ? 'text-tbnca-gold' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-sm hover:text-tbnca-gold-light hidden md:block">Logout</button>
            <button
              className="md:hidden p-1"
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
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/20 mt-3 pt-3 pb-1 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm py-1 hover:text-tbnca-gold-light transition-colors ${pathname === item.href ? 'text-tbnca-gold' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="block text-sm py-1 hover:text-tbnca-gold-light w-full text-left">Logout</button>
          </div>
        )}
      </nav>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
    </div>
  )
}
