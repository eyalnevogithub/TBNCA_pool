'use client'

import { useEffect, useState } from 'react'

interface AdminUser {
  id: string
  email: string
  role: 'editor' | 'validator'
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'editor' | 'validator'>('validator')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  function loadUsers() {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  async function handleAdd() {
    if (!newEmail.trim()) return
    setAdding(true)
    setError('')

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
    })
    const data = await res.json()
    if (res.ok) {
      setNewEmail('')
      loadUsers()
    } else {
      setError(data.error || 'Failed to add user')
    }
    setAdding(false)
  }

  async function handleChangeRole(id: string, role: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as 'editor' | 'validator' } : u))
    }
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove admin access for ${email}?`)) return

    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  if (loading) return <p className="text-tbnca-gray">Loading users...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Admin Users</h1>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="font-bold mb-3">Add Admin User</h2>
        <p className="text-sm text-tbnca-gray mb-3">
          The user must have a Supabase Auth account. Add their email here to grant admin access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="user@example.com"
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'editor' | 'validator')}
            className="border rounded-lg px-4 py-2"
          >
            <option value="validator">Validator</option>
            <option value="editor">Editor</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-6 py-2 bg-tbnca-blue text-white rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Added</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="editor">Editor</option>
                      <option value="validator">Validator</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-tbnca-gray">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(u.id, u.email)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y">
          {users.map(u => (
            <div key={u.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-sm">{u.email}</p>
                <button
                  onClick={() => handleRemove(u.id, u.email)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  onChange={e => handleChangeRole(u.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="editor">Editor</option>
                  <option value="validator">Validator</option>
                </select>
                <span className="text-xs text-tbnca-gray">Added {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && <p className="p-4 text-center text-tbnca-gray">No admin users configured.</p>}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Editor:</strong> Full access to all admin features (orders, residents, products, waiver, scanner, users).
        </p>
        <p className="text-sm text-blue-800 mt-1">
          <strong>Validator:</strong> Can only access the QR code scanner to verify pool tags at the entrance.
        </p>
      </div>
    </div>
  )
}
