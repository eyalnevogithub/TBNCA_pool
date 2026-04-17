'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface OrderDetails {
  orderNumber: string
  total: number
  customerName: string
  customerEmail: string
  qrToken: string | null
}

function QRCodeImage({ token }: { token: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      const url = `${window.location.origin}/tag/${token}`
      QRCode.toDataURL(url, { width: 250, margin: 2 }).then(setSrc)
    })
  }, [token])

  if (!src) return <div className="w-[250px] h-[250px] bg-gray-100 animate-pulse rounded mx-auto" />

  return <img src={src} alt="Your pool tag QR code" className="mx-auto" width={250} height={250} />
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    fetch(`/api/order-status?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.order) setOrder(data.order)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return <p className="text-tbnca-gray">Loading order details...</p>
  }

  return (
    <>
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">✓</div>
      <h1 className="text-3xl font-bold text-tbnca-blue mb-4">Payment Successful!</h1>
      {order ? (
        <>
          <div className="bg-white rounded-lg shadow p-6 text-left max-w-md mx-auto mb-6">
            <p className="text-sm text-tbnca-gray mb-1">Order Number</p>
            <p className="font-bold text-lg mb-4 font-mono">{order.orderNumber}</p>
            <p className="text-sm text-tbnca-gray mb-1">Name</p>
            <p className="font-medium mb-4">{order.customerName}</p>
            <p className="text-sm text-tbnca-gray mb-1">Total Paid</p>
            <p className="font-bold text-xl text-green-600">${order.total.toFixed(2)}</p>
            <p className="text-sm text-tbnca-gray mt-4">
              A confirmation email has been sent to {order.customerEmail}.
            </p>
          </div>

          {order.qrToken && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-6">
              <h2 className="font-bold text-tbnca-blue mb-3 text-lg">Your Digital Pool Tag</h2>
              <QRCodeImage token={order.qrToken} />
              <p className="text-sm text-tbnca-gray mt-4">
                Show this QR code at the pool entrance. You can also access it from the link in your confirmation email.
              </p>
              <p className="text-sm text-tbnca-gray mt-2">
                Save a screenshot or bookmark{' '}
                <Link href={`/tag/${order.qrToken}`} className="text-tbnca-blue-light underline">
                  your tag page
                </Link>
                {' '}for quick access.
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-tbnca-gray mb-6">Your payment has been processed successfully.</p>
      )}
      <p className="text-tbnca-gray mb-6">
        Pool staff will scan your QR code to verify your tags at the entrance.
      </p>
      <Link href="/" className="inline-block bg-tbnca-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-tbnca-blue-light transition-colors">
        Return Home
      </Link>
    </>
  )
}

export default function SuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <Suspense fallback={<p className="text-tbnca-gray">Loading...</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
