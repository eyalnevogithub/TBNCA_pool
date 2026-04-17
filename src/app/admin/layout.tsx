'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type AdminRole = 'editor' | 'validator'

const AdminRoleContext = createContext<AdminRole | null>(null)

export function useAdminRole() {
  return useContext(AdminRoleContext)
}

const editorOnlyPaths = ['/admin', '/admin/orders', '/admin/residents', '/admin/products', '/admin/waiver', '/admin/users']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<AdminRole | null>(null)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        if (pathname !== '/admin/login') router.push('/admin/login')
        setChecking(false)
        return
      }

      setAuthenticated(true)
      const email = session.user.email
      if (!email) {
        setChecking(false)
        return
      }

      try {
        const res = await fetch(`/api/admin/me?email=${encodeURIComponent(email)}`)
        const data = await res.json()

        if (data.authorized) {
          setRole(data.role)
        } else {
          setUnauthorized(true)
        }
      } catch {
        setUnauthorized(true)
      }

      setChecking(false)
    })
  }, [pathname, router])

  useEffect(() => {
    if (!role || checking) return
    if (role === 'validator' && editorOnlyPaths.includes(pathname)) {
      router.push('/admin/scan')
    }
  }, [role, pathname, checking, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (checking) return <div className="p-8 text-center text-tbnca-gray">Loading...</div>
  if (!authenticated) return null

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">!</div>
          <h1 className="text-xl font-bold text-tbnca-blue mb-2">Access Denied</h1>
          <p className="text-tbnca-gray mb-6">Your account is not authorized for admin access. Contact an administrator to get access.</p>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login') }}
            className="bg-tbnca-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!role) return null

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const allNavItems = [
    { href: '/admin', label: 'Dashboard', editorOnly: true },
    { href: '/admin/orders', label: 'Orders', editorOnly: true },
    { href: '/admin/residents', label: 'Residents', editorOnly: true },
    { href: '/admin/products', label: 'Products', editorOnly: true },
    { href: '/admin/waiver', label: 'Waiver', editorOnly: true },
    { href: '/admin/scan', label: 'Scan QR', editorOnly: false },
    { href: '/admin/users', label: 'Users', editorOnly: true },
  ]

  const navItems = allNavItems.filter(item => !item.editorOnly || role === 'editor')

  return (
    <AdminRoleContext.Provider value={role}>
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
              <span className="hidden md:inline text-xs text-white/60 capitalize">{role}</span>
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
              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <span className="text-xs text-white/60 capitalize">{role}</span>
                <button onClick={handleLogout} className="text-sm hover:text-tbnca-gold-light">Logout</button>
              </div>
            </div>
          )}
        </nav>
        <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
      </div>
    </AdminRoleContext.Provider>
  )
}
