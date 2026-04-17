'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface TagInfo {
  valid: boolean
  invalidated: boolean
  orderNumber: string
  customerName: string
  customerAddress: string
  isResident: boolean
  status: string
  tagCount: number
  dayPasses: { quantity: number; date: string | null }[]
  createdAt: string
}

function QRCodeImage({ token }: { token: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      const url = `${window.location.origin}/tag/${token}`
      QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setSrc)
    })
  }, [token])

  if (!src) return <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded mx-auto" />

  return <img src={src} alt="Pool tag QR code" className="mx-auto" width={200} height={200} />
}

export default function TagPage() {
  const params = useParams()
  const token = params.token as string
  const [tag, setTag] = useState<TagInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/verify-tag?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.orderNumber) {
          setTag(data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-tbnca-gray">Verifying tag...</p>
      </div>
    )
  }

  if (error || !tag) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">✕</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid QR Code</h1>
        <p className="text-tbnca-gray mb-6">This QR code is not recognized. It may be expired or invalid.</p>
        <Link href="/" className="text-tbnca-blue-light hover:underline">Go to homepage</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-6">
        {tag.valid ? (
          <>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-700">Valid Pool Tag</h1>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4">✕</div>
            <h1 className="text-2xl font-bold text-red-600">
              {tag.invalidated ? 'Tag Invalidated' : 'Tag Not Valid'}
            </h1>
            {tag.invalidated && (
              <p className="text-red-500 text-sm mt-2">This tag has been deactivated by an administrator.</p>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-tbnca-gray uppercase tracking-wider">Resident</p>
            <p className="font-bold text-lg">{tag.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-tbnca-gray uppercase tracking-wider">Address</p>
            <p className="text-sm">{tag.customerAddress}</p>
          </div>
          <div>
            <p className="text-xs text-tbnca-gray uppercase tracking-wider">Order</p>
            <p className="text-sm font-mono">{tag.orderNumber}</p>
          </div>
          {tag.tagCount > 0 && (
            <div>
              <p className="text-xs text-tbnca-gray uppercase tracking-wider">Pool Tags</p>
              <p className="text-lg font-bold text-tbnca-blue">{tag.tagCount} tag{tag.tagCount !== 1 ? 's' : ''}</p>
            </div>
          )}
          {tag.dayPasses.length > 0 && (
            <div>
              <p className="text-xs text-tbnca-gray uppercase tracking-wider">Day Passes</p>
              {tag.dayPasses.map((pass, i) => (
                <p key={i} className="text-sm">{pass.quantity} pass{pass.quantity !== 1 ? 'es' : ''} {pass.date ? `for ${pass.date}` : ''}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs text-tbnca-gray uppercase tracking-wider">Purchased</p>
            <p className="text-sm">{new Date(tag.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <QRCodeImage token={token} />
        <p className="text-xs text-tbnca-gray mt-3">Show this page to pool staff for entry</p>
      </div>
    </div>
  )
}
