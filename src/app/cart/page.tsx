'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

interface DuesInfo {
  amount: number
  residentId: string
}

export default function CartPage() {
  const router = useRouter()
  const { items, waiver, removeItem, getSubtotal, clearCart } = useCart()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [dues, setDues] = useState<DuesInfo | null>(null)
  const [residentId, setResidentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasOnlyDayPasses = items.every(i => i.product.product_type === 'day_pass')

  async function handleVerify() {
    if (!name.trim() || !address.trim() || !email.trim()) {
      setVerifyError('Please fill in all fields.')
      return
    }

    setVerifying(true)
    setVerifyError('')

    try {
      const res = await fetch('/api/verify-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      })
      const data = await res.json()

      if (data.verified) {
        setVerified(true)
        setResidentId(data.residentId)
        if (data.duesOwed > 0) {
          setDues({ amount: data.duesOwed, residentId: data.residentId })
        }
      } else if (hasOnlyDayPasses) {
        setVerified(true)
        setResidentId(null)
      } else {
        setVerifyError(
          'We could not verify your residency. Pool tags are only available to TBNCA residents. ' +
          'If you believe this is an error, please contact Marshall Management Group at (713) 977-6644 or ops@mmgihouston.com.'
        )
      }
    } catch {
      setVerifyError('An error occurred. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleCheckout() {
    if (!email.trim()) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            passDate: i.passDate || null,
          })),
          customerName: name.trim(),
          customerAddress: address.trim(),
          customerEmail: email.trim(),
          residentId,
          isResident: !!residentId,
          duesAmount: dues?.amount || 0,
          waiverName: waiver?.name || '',
          waiverDate: waiver?.date || '',
        }),
      })
      const data = await res.json()

      if (data.url) {
        clearCart()
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session.')
      }
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-tbnca-blue mb-4">Your Cart</h1>
        <p className="text-tbnca-gray mb-6">Your cart is empty.</p>
        <Link href="/pricing" className="inline-block bg-tbnca-gold hover:bg-tbnca-gold-light text-tbnca-blue font-bold py-3 px-8 rounded-lg transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const total = subtotal + (dues?.amount || 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-tbnca-blue mb-6">Your Cart</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Cart Items</h2>
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <span className="font-medium">{item.product.name}</span>
              <span className="text-tbnca-gray ml-2">x{item.quantity}</span>
              {item.passDate && <span className="text-tbnca-gray ml-2">({item.passDate})</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
          </div>
        ))}
        {dues && (
          <div className="flex items-center justify-between py-3 border-b bg-amber-50 px-3 rounded mt-2">
            <div>
              <span className="font-medium">Outstanding HOA Dues</span>
            </div>
            <span className="font-medium">${dues.amount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold mt-4 pt-4 border-t text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {!verified ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-2">Verify Your Information</h2>
          <p className="text-tbnca-gray text-sm mb-4">
            {hasOnlyDayPasses
              ? 'Please enter your details. Residents receive a discounted rate.'
              : 'Please enter your name and address to verify your residency.'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tbnca-gray mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tbnca-blue focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tbnca-gray mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tbnca-blue focus:border-transparent"
                placeholder="123 Thunderbird Lane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tbnca-gray mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tbnca-blue focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            {verifyError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {verifyError}
              </div>
            )}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-tbnca-blue text-white py-3 rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">✓</div>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-sm text-tbnca-gray">{address}</p>
              <p className="text-sm text-tbnca-gray">{email}</p>
            </div>
          </div>
          {residentId && <p className="text-sm text-green-600 mb-4">Verified TBNCA resident</p>}
          {!residentId && <p className="text-sm text-tbnca-gray mb-4">Guest checkout</p>}

          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="w-full bg-tbnca-gold hover:bg-tbnca-gold-light text-tbnca-blue py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Preparing checkout...' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      )}

      <Link href="/pricing" className="text-tbnca-blue-light hover:underline text-sm">
        ← Back to products
      </Link>
    </div>
  )
}
