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
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-tbnca-blue text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold">TBNCA Admin</span>
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
          <button onClick={handleLogout} className="text-sm hover:text-tbnca-gold-light">Logout</button>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  )
}
