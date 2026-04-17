'use client'

import { useEffect, useRef, useState } from 'react'

interface TagResult {
  valid: boolean
  invalidated: boolean
  orderNumber: string
  customerName: string
  customerAddress: string
  customerEmail: string
  isResident: boolean
  status: string
  tagCount: number
  dayPasses: { quantity: number; date: string | null }[]
  total: number
  createdAt: string
  error?: string
}

export default function AdminScanPage() {
  const scannerRef = useRef<HTMLDivElement>(null)
  const scannerInstanceRef = useRef<unknown>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<TagResult | null>(null)
  const [error, setError] = useState('')
  const [manualToken, setManualToken] = useState('')

  async function startScanner() {
    setResult(null)
    setError('')

    const { Html5Qrcode } = await import('html5-qrcode')

    if (scannerInstanceRef.current) {
      try {
        await (scannerInstanceRef.current as { stop: () => Promise<void> }).stop()
      } catch { /* ignore */ }
    }

    const scanner = new Html5Qrcode('qr-reader')
    scannerInstanceRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop()
          setScanning(false)
          handleScan(decodedText)
        },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      setError('Could not access camera. Please allow camera permissions and try again.')
      console.error('Scanner error:', err)
    }
  }

  async function stopScanner() {
    if (scannerInstanceRef.current) {
      try {
        await (scannerInstanceRef.current as { stop: () => Promise<void> }).stop()
      } catch { /* ignore */ }
    }
    setScanning(false)
  }

  async function handleScan(url: string) {
    const tokenMatch = url.match(/\/tag\/([a-f0-9-]+)/i)
    const token = tokenMatch ? tokenMatch[1] : url

    try {
      const res = await fetch(`/api/verify-tag?token=${token}`)
      const data = await res.json()
      if (data.orderNumber) {
        setResult(data)
      } else {
        setResult(null)
        setError(data.error || 'QR code not recognized')
      }
    } catch {
      setError('Failed to verify tag')
    }
  }

  async function handleManualLookup() {
    if (!manualToken.trim()) return
    const tokenMatch = manualToken.match(/\/tag\/([a-f0-9-]+)/i)
    const token = tokenMatch ? tokenMatch[1] : manualToken.trim()
    await handleScan(token)
  }

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try {
          (scannerInstanceRef.current as { stop: () => Promise<void> }).stop()
        } catch { /* ignore */ }
      }
    }
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-tbnca-blue mb-6">Scan Pool Tag</h1>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div id="qr-reader" ref={scannerRef} className="mb-4 overflow-hidden rounded-lg" />

        <div className="flex gap-2">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex-1 bg-tbnca-blue text-white py-3 rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Stop Camera
            </button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-tbnca-gray mb-2">Or enter a token/URL manually:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
              placeholder="Token or tag URL"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleManualLookup}
              className="px-4 py-2 bg-tbnca-gold text-tbnca-blue rounded-lg text-sm font-bold hover:bg-tbnca-gold-light transition-colors"
            >
              Look Up
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className={`rounded-lg shadow p-4 sm:p-6 mb-6 ${result.valid ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${result.valid ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
              {result.valid ? '✓' : '✕'}
            </div>
            <div>
              <p className={`font-bold text-lg ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                {result.valid ? 'VALID' : result.invalidated ? 'INVALIDATED' : 'NOT VALID'}
              </p>
              <p className="text-sm text-tbnca-gray">Order {result.orderNumber}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-tbnca-gray uppercase">Name</p>
                <p className="font-medium">{result.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-tbnca-gray uppercase">Status</p>
                <p className="font-medium capitalize">{result.status}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-tbnca-gray uppercase">Address</p>
              <p className="text-sm">{result.customerAddress}</p>
            </div>
            <div>
              <p className="text-xs text-tbnca-gray uppercase">Email</p>
              <p className="text-sm">{result.customerEmail}</p>
            </div>
            {result.tagCount > 0 && (
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-tbnca-gray uppercase">Pool Tags</p>
                <p className="text-2xl font-bold text-tbnca-blue">{result.tagCount}</p>
              </div>
            )}
            {result.dayPasses.length > 0 && (
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-tbnca-gray uppercase">Day Passes</p>
                {result.dayPasses.map((pass, i) => (
                  <p key={i} className="text-sm font-medium">{pass.quantity} pass{pass.quantity !== 1 ? 'es' : ''} {pass.date ? `- ${pass.date}` : ''}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-tbnca-gray uppercase">Resident</p>
                <p className="text-sm">{result.isResident ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-tbnca-gray uppercase">Purchased</p>
                <p className="text-sm">{new Date(result.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setResult(null); setError(''); startScanner() }}
            className="w-full mt-4 bg-tbnca-blue text-white py-3 rounded-lg font-bold hover:bg-tbnca-blue-light transition-colors"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  )
}
