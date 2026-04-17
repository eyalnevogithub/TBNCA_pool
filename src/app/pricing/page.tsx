'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types'

export default function PricingPage() {
  const router = useRouter()
  const { addItem, setWaiver, items } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tagQty, setTagQty] = useState(1)
  const [passQty, setPassQty] = useState(1)
  const [passDate, setPassDate] = useState('')
  const [isResident, setIsResident] = useState(true)
  const [step, setStep] = useState<'select' | 'waiver'>('select')
  const [waiverName, setWaiverName] = useState('')
  const [waiverDate, setWaiverDate] = useState(new Date().toISOString().split('T')[0])
  const [waiverAgreed, setWaiverAgreed] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; qty: number; price: number; date?: string }[]>([])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tagProduct = products.find(p => p.product_type === 'pool_tag')
  const passProduct = products.find(p => p.product_type === 'day_pass')

  function calculateTagPrice(qty: number): number {
    if (!tagProduct || qty <= 0) return 0
    const firstTagPrice = tagProduct.price_resident
    const additionalPrice = tagProduct.price_guest
    if (qty === 1) return firstTagPrice
    return firstTagPrice + (qty - 1) * additionalPrice
  }

  function handleAddTags() {
    if (!tagProduct || tagQty < 1) return
    const existingTagQty = items
      .filter(i => i.product.product_type === 'pool_tag')
      .reduce((sum, i) => sum + i.quantity, 0)
    if (existingTagQty + tagQty > tagProduct.max_quantity) {
      alert(`You can only purchase up to ${tagProduct.max_quantity} pool tags per household. You already have ${existingTagQty} in your cart.`)
      return
    }
    setSelectedProducts(prev => [...prev, { product: tagProduct, qty: tagQty, price: calculateTagPrice(tagQty) }])
  }

  function handleAddPasses() {
    if (!passProduct || passQty < 1 || !passDate) {
      alert('Please select a date for the day pass.')
      return
    }
    const existingPassQty = items
      .filter(i => i.product.product_type === 'day_pass')
      .reduce((sum, i) => sum + i.quantity, 0)
    const selectedPassQty = selectedProducts
      .filter(s => s.product.product_type === 'day_pass')
      .reduce((sum, s) => sum + s.qty, 0)
    if (existingPassQty + selectedPassQty + passQty > passProduct.max_quantity) {
      alert(`You can only purchase up to ${passProduct.max_quantity} day passes per transaction.`)
      return
    }
    const unitPrice = isResident ? passProduct.price_resident : passProduct.price_guest
    setSelectedProducts(prev => [...prev, { product: passProduct, qty: passQty, price: unitPrice * passQty, date: passDate }])
  }

  function handleContinueToWaiver() {
    if (selectedProducts.length === 0) {
      alert('Please add at least one item before continuing.')
      return
    }
    setStep('waiver')
  }

  function handleSignWaiver() {
    if (!waiverName.trim() || !waiverDate || !waiverAgreed) {
      alert('Please complete and agree to the waiver.')
      return
    }
    setWaiver({ name: waiverName.trim(), date: waiverDate })
    for (const s of selectedProducts) {
      if (s.product.product_type === 'pool_tag') {
        const firstPrice = s.product.price_resident
        const additionalPrice = s.product.price_guest
        for (let i = 0; i < s.qty; i++) {
          const existingCount = items.filter(it => it.product.product_type === 'pool_tag').length + i
          const price = existingCount === 0 ? firstPrice : additionalPrice
          addItem(s.product, 1, price)
        }
      } else {
        const unitPrice = isResident ? s.product.price_resident : s.product.price_guest
        addItem(s.product, s.qty, unitPrice, s.date)
      }
    }
    router.push('/cart')
  }

  function removeSelected(index: number) {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index))
  }

  const selectedTotal = selectedProducts.reduce((sum, s) => sum + s.price, 0)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-tbnca-gray">Loading products...</p>
      </div>
    )
  }

  if (step === 'waiver') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-tbnca-blue mb-6">Pool Use Waiver</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Waiver and Release of Liability</h2>
          <div className="bg-gray-50 border rounded p-4 mb-6 text-sm text-tbnca-gray max-h-64 overflow-y-auto">
            <p className="mb-3">
              By signing this waiver, I acknowledge and agree to the following terms and conditions
              regarding the use of the Thunderbird North Community Association swimming pool facilities:
            </p>
            <p className="mb-3">
              <strong>Assumption of Risk:</strong> I understand that the use of the swimming pool and
              surrounding facilities involves inherent risks, including but not limited to drowning,
              slipping, falling, and other injuries. I voluntarily assume all risks associated with
              the use of these facilities.
            </p>
            <p className="mb-3">
              <strong>Release of Liability:</strong> I hereby release, waive, and discharge Thunderbird
              North Community Association, its board members, officers, agents, employees, and
              management company (Marshall Management Group Inc.) from any and all liability, claims,
              demands, and causes of action arising out of or related to any injury, loss, or damage
              that may occur as a result of my use of the pool facilities.
            </p>
            <p className="mb-3">
              <strong>Rules Compliance:</strong> I agree to abide by all posted pool rules and
              regulations. I understand that failure to comply may result in removal from the
              premises and revocation of pool privileges.
            </p>
            <p className="mb-3">
              <strong>Minor Supervision:</strong> I understand that children under 14 must be
              accompanied by a responsible adult at all times while using the pool facilities.
            </p>
            <p>
              <strong>Medical Acknowledgment:</strong> I confirm that I am physically fit to use
              the pool facilities and have no medical conditions that would make such use dangerous.
              I agree to not use the pool while under the influence of alcohol or drugs.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={waiverAgreed}
                onChange={e => setWaiverAgreed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm">
                I have read and understand the above waiver. I voluntarily agree to its terms
                and acknowledge that I am giving up substantial legal rights.
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-tbnca-gray mb-1">Full Legal Name (Electronic Signature)</label>
              <input
                type="text"
                value={waiverName}
                onChange={e => setWaiverName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tbnca-blue focus:border-transparent"
                placeholder="Enter your full legal name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-tbnca-gray mb-1">Date</label>
              <input
                type="date"
                value={waiverDate}
                onChange={e => setWaiverDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tbnca-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-3">Your Selections</h3>
          {selectedProducts.map((s, i) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
              <span>
                {s.product.name} x{s.qty}
                {s.date && <span className="text-tbnca-gray ml-2">({s.date})</span>}
              </span>
              <span className="font-medium">${s.price.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-3 border-t">
            <span>Subtotal</span>
            <span>${selectedTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('select')}
            className="px-6 py-3 border border-tbnca-blue text-tbnca-blue rounded-lg hover:bg-tbnca-blue/5 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSignWaiver}
            disabled={!waiverAgreed || !waiverName.trim() || !waiverDate}
            className="flex-1 bg-tbnca-blue text-white py-3 rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign Waiver &amp; Continue to Cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-tbnca-blue mb-2">Buy Pool Tags &amp; Day Passes</h1>
      <p className="text-tbnca-gray mb-8">Select what you would like to purchase below.</p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {tagProduct && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-tbnca-blue mb-2">Pool Tags</h2>
            <p className="text-tbnca-gray text-sm mb-4">{tagProduct.description}</p>
            <div className="bg-tbnca-cream rounded-lg p-4 mb-4">
              <p className="text-sm"><span className="font-bold">First tag:</span> ${tagProduct.price_resident.toFixed(2)}</p>
              <p className="text-sm"><span className="font-bold">Each additional:</span> ${tagProduct.price_guest.toFixed(2)}</p>
              <p className="text-sm text-tbnca-gray mt-1">Limit: {tagProduct.max_quantity} per household</p>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">Quantity:</label>
              <input
                type="number"
                min={1}
                max={tagProduct.max_quantity}
                value={tagQty}
                onChange={e => setTagQty(Math.max(1, Math.min(tagProduct.max_quantity, parseInt(e.target.value) || 1)))}
                className="w-20 border rounded-lg px-3 py-2 text-center"
              />
              <span className="text-sm text-tbnca-gray">
                = ${calculateTagPrice(tagQty).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAddTags}
              className="w-full bg-tbnca-gold hover:bg-tbnca-gold-light text-tbnca-blue font-bold py-2 rounded-lg transition-colors"
            >
              Add Pool Tags
            </button>
          </div>
        )}

        {passProduct && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-tbnca-blue mb-2">Day Passes</h2>
            <p className="text-tbnca-gray text-sm mb-4">{passProduct.description}</p>
            <div className="bg-tbnca-cream rounded-lg p-4 mb-4">
              <p className="text-sm"><span className="font-bold">Residents:</span> ${passProduct.price_resident.toFixed(2)} / person</p>
              <p className="text-sm"><span className="font-bold">Guests:</span> ${passProduct.price_guest.toFixed(2)} / person</p>
              <p className="text-sm text-tbnca-gray mt-1">Limit: {passProduct.max_quantity} per transaction</p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={isResident} onChange={() => setIsResident(true)} />
                  <span className="text-sm">Resident (${ passProduct.price_resident.toFixed(2)})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!isResident} onChange={() => setIsResident(false)} />
                  <span className="text-sm">Guest (${ passProduct.price_guest.toFixed(2)})</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Date:</label>
                <input
                  type="date"
                  value={passDate}
                  onChange={e => setPassDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Quantity:</label>
                <input
                  type="number"
                  min={1}
                  max={passProduct.max_quantity}
                  value={passQty}
                  onChange={e => setPassQty(Math.max(1, Math.min(passProduct.max_quantity, parseInt(e.target.value) || 1)))}
                  className="w-20 border rounded-lg px-3 py-2 text-center"
                />
                <span className="text-sm text-tbnca-gray">
                  = ${((isResident ? passProduct.price_resident : passProduct.price_guest) * passQty).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleAddPasses}
              className="w-full bg-tbnca-gold hover:bg-tbnca-gold-light text-tbnca-blue font-bold py-2 rounded-lg transition-colors"
            >
              Add Day Passes
            </button>
          </div>
        )}
      </div>

      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold text-lg text-tbnca-blue mb-3">Selected Items</h3>
          {selectedProducts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <span className="font-medium">{s.product.name}</span>
                <span className="text-tbnca-gray ml-2">x{s.qty}</span>
                {s.date && <span className="text-tbnca-gray ml-2">({s.date})</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">${s.price.toFixed(2)}</span>
                <button onClick={() => removeSelected(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-3 border-t text-lg">
            <span>Subtotal</span>
            <span>${selectedTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleContinueToWaiver}
        disabled={selectedProducts.length === 0}
        className="w-full bg-tbnca-blue text-white py-3 rounded-lg font-bold text-lg hover:bg-tbnca-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Waiver
      </button>
    </div>
  )
}
