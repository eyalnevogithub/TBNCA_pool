'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price_resident: number
  price_guest: number
  max_quantity: number
  product_type: string
  active: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Product>>({})

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function startEdit(product: Product) {
    setEditing(product.id)
    setForm({ ...product })
  }

  async function saveEdit() {
    if (!editing) return
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, ...form } as Product : p))
      setEditing(null)
    }
  }

  if (loading) return <p className="text-tbnca-gray">Loading products...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Products &amp; Pricing</h1>
      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow p-6">
            {editing === product.id ? (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-tbnca-gray block mb-1">Name</label>
                    <input
                      value={form.name || ''}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tbnca-gray block mb-1">Description</label>
                    <input
                      value={form.description || ''}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tbnca-gray block mb-1">
                      {product.product_type === 'pool_tag' ? 'First Tag Price' : 'Resident Price'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_resident || 0}
                      onChange={e => setForm(f => ({ ...f, price_resident: parseFloat(e.target.value) }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tbnca-gray block mb-1">
                      {product.product_type === 'pool_tag' ? 'Additional Tag Price' : 'Guest Price'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price_guest || 0}
                      onChange={e => setForm(f => ({ ...f, price_guest: parseFloat(e.target.value) }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tbnca-gray block mb-1">Max Quantity</label>
                    <input
                      type="number"
                      value={form.max_quantity || 0}
                      onChange={e => setForm(f => ({ ...f, max_quantity: parseInt(e.target.value) }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.active ?? true}
                        onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-4 py-2 bg-tbnca-blue text-white rounded text-sm">Save</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-tbnca-gray">{product.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      {product.product_type === 'pool_tag' ? 'First: ' : 'Resident: '}
                      <strong>${product.price_resident.toFixed(2)}</strong>
                    </span>
                    <span>
                      {product.product_type === 'pool_tag' ? 'Additional: ' : 'Guest: '}
                      <strong>${product.price_guest.toFixed(2)}</strong>
                    </span>
                    <span>Max: <strong>{product.max_quantity}</strong></span>
                    <span className={product.active ? 'text-green-600' : 'text-red-600'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => startEdit(product)}
                  className="px-4 py-2 bg-tbnca-gold text-tbnca-blue rounded text-sm font-medium hover:bg-tbnca-gold-light"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
