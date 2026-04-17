'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_address: string
  customer_email: string
  is_resident: boolean
  total: number
  dues_amount: number
  status: string
  waiver_name: string
  waiver_date: string
  created_at: string
  fulfilled_by: string | null
  fulfilled_at: string | null
  qr_token: string | null
  qr_valid: boolean
  order_items: { product_name: string; quantity: number; unit_price: number; subtotal: number; pass_date: string | null }[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(orderId: string, status: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const adminEmail = session?.user?.email || 'unknown'
    const now = new Date().toISOString()

    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status, adminEmail }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status,
        ...(status === 'fulfilled' ? { fulfilled_by: adminEmail, fulfilled_at: now } : {}),
      } : o))
    }
  }

  async function toggleQrValid(orderId: string, currentlyValid: boolean) {
    const action = currentlyValid ? 'invalidate_qr' : 'reactivate_qr'
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, qr_valid: !currentlyValid } : o))
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <p className="text-tbnca-gray">Loading orders...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Orders</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'pending', 'paid', 'fulfilled', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${filter === f ? 'bg-tbnca-blue text-white' : 'bg-white border'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-tbnca-gray">No orders found.</p>}
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow">
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="font-mono text-xs sm:text-sm font-bold">{order.order_number}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    order.status === 'paid' ? 'bg-green-100 text-green-700' :
                    order.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-sm">
                  <span className="hidden sm:inline">{order.customer_name}</span>
                  <span className="font-bold">${order.total.toFixed(2)}</span>
                  <span className="text-tbnca-gray text-xs sm:text-sm">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-tbnca-gray mt-1 sm:hidden">{order.customer_name}</p>
            </div>

            {expandedId === order.id && (
              <div className="border-t p-4 bg-gray-50">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-tbnca-gray">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm break-all">{order.customer_address}</p>
                    <p className="text-sm break-all">{order.customer_email}</p>
                    <p className="text-sm mt-1">{order.is_resident ? 'Verified Resident' : 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-tbnca-gray">Waiver</p>
                    <p className="text-sm">Signed by: {order.waiver_name}</p>
                    <p className="text-sm">Date: {order.waiver_date}</p>
                  </div>
                </div>

                {order.fulfilled_by && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Fulfilled by:</strong> {order.fulfilled_by}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Fulfilled at:</strong> {new Date(order.fulfilled_at!).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm mb-4 min-w-[320px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Item</th>
                        <th className="text-right py-1">Qty</th>
                        <th className="text-right py-1">Price</th>
                        <th className="text-right py-1">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items?.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-1">
                            {item.product_name}
                            {item.pass_date && <span className="text-tbnca-gray ml-1">({item.pass_date})</span>}
                          </td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="text-right">${item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {order.qr_token && (
                  <div className={`rounded-lg p-3 mb-4 ${order.qr_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className={`text-sm font-medium ${order.qr_valid ? 'text-green-800' : 'text-red-800'}`}>
                          QR Tag: {order.qr_valid ? 'Active' : 'Invalidated'}
                        </p>
                        <p className="text-xs text-tbnca-gray font-mono mt-1">{order.qr_token}</p>
                      </div>
                      <button
                        onClick={() => toggleQrValid(order.id, order.qr_valid)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          order.qr_valid
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {order.qr_valid ? 'Invalidate QR' : 'Reactivate QR'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => updateStatus(order.id, 'fulfilled')}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Mark Fulfilled
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
