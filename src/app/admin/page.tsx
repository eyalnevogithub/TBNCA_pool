'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalOrders: number
  paidOrders: number
  fulfilledOrders: number
  totalRevenue: number
  totalResidents: number
  residentsWithDues: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats) return <p className="text-tbnca-gray">Loading dashboard...</p>

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders },
    { label: 'Paid Orders', value: stats.paidOrders },
    { label: 'Fulfilled', value: stats.fulfilledOrders },
    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}` },
    { label: 'Total Residents', value: stats.totalResidents },
    { label: 'Residents with Dues', value: stats.residentsWithDues },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-tbnca-gray">{c.label}</p>
            <p className="text-2xl font-bold text-tbnca-blue">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
