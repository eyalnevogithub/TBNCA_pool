'use client'

import { useEffect, useState, useRef } from 'react'

interface Resident {
  id: string
  full_name: string
  address: string
  email: string | null
  dues_owed: number
  created_at: string
}

export default function AdminResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function loadResidents() {
    fetch('/api/admin/residents')
      .then(r => r.json())
      .then(data => { setResidents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadResidents() }, [])

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult('')

    const text = await file.text()
    const res = await fetch('/api/admin/residents/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text }),
    })
    const data = await res.json()
    setImportResult(data.message || data.error || 'Import complete')
    setImporting(false)
    loadResidents()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function markDuesPaid(residentId: string) {
    const res = await fetch('/api/admin/residents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ residentId, duesOwed: 0 }),
    })
    if (res.ok) {
      setResidents(prev => prev.map(r => r.id === residentId ? { ...r, dues_owed: 0 } : r))
    }
  }

  const filtered = search
    ? residents.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.address.toLowerCase().includes(search.toLowerCase())
      )
    : residents

  if (loading) return <p className="text-tbnca-gray">Loading residents...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Residents</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold mb-3">Import Residents (CSV)</h2>
        <p className="text-sm text-tbnca-gray mb-3">
          CSV format: <code className="bg-gray-100 px-1 rounded">full_name,address,email,dues_owed</code><br />
          First row should be headers. Email and dues_owed are optional.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input type="file" accept=".csv" ref={fileRef} className="text-sm" />
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 bg-tbnca-blue text-white rounded text-sm hover:bg-tbnca-blue-light disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
        {importResult && <p className="mt-2 text-sm text-green-700">{importResult}</p>}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Address</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-right px-4 py-3">Dues Owed</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.full_name}</td>
                <td className="px-4 py-3">{r.address}</td>
                <td className="px-4 py-3 text-tbnca-gray">{r.email || '-'}</td>
                <td className="px-4 py-3 text-right">
                  {r.dues_owed > 0 ? (
                    <span className="text-red-600 font-medium">${r.dues_owed.toFixed(2)}</span>
                  ) : (
                    <span className="text-green-600">Paid</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.dues_owed > 0 && (
                    <button
                      onClick={() => markDuesPaid(r.id)}
                      className="text-tbnca-blue-light hover:underline text-xs"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-center text-tbnca-gray">No residents found.</p>}
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium">{r.full_name}</p>
              {r.dues_owed > 0 ? (
                <span className="text-red-600 font-medium text-sm">${r.dues_owed.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 text-sm">Paid</span>
              )}
            </div>
            <p className="text-sm text-tbnca-gray">{r.address}</p>
            {r.email && <p className="text-sm text-tbnca-gray">{r.email}</p>}
            {r.dues_owed > 0 && (
              <button
                onClick={() => markDuesPaid(r.id)}
                className="text-tbnca-blue-light hover:underline text-xs mt-2"
              >
                Mark Paid
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-tbnca-gray">No residents found.</p>}
      </div>
      <p className="text-sm text-tbnca-gray mt-2">Showing {filtered.length} of {residents.length} residents</p>
    </div>
  )
}
