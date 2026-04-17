'use client'

import { useEffect, useState } from 'react'

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
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <p className="text-tbnca-gray">Loading orders...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Orders</h1>
      <div className="flex gap-2 mb-4">
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
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold">{order.order_number}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  order.status === 'paid' ? 'bg-green-100 text-green-700' :
                  order.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{order.customer_name}</span>
                <span className="font-bold">${order.total.toFixed(2)}</span>
                <span className="text-tbnca-gray">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {expandedId === order.id && (
              <div className="border-t p-4 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-tbnca-gray">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm">{order.customer_address}</p>
                    <p className="text-sm">{order.customer_email}</p>
                    <p className="text-sm mt-1">{order.is_resident ? 'Verified Resident' : 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-tbnca-gray">Waiver</p>
                    <p className="text-sm">Signed by: {order.waiver_name}</p>
                    <p className="text-sm">Date: {order.waiver_date}</p>
                  </div>
                </div>

                <table className="w-full text-sm mb-4">
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

                <div className="flex gap-2">
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
