import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">✕</div>
      <h1 className="text-3xl font-bold text-tbnca-blue mb-4">Payment Cancelled</h1>
      <p className="text-tbnca-gray mb-6">
        Your payment was cancelled. No charges have been made. Your cart items are still available.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/cart" className="inline-block bg-tbnca-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-tbnca-blue-light transition-colors">
          Return to Cart
        </Link>
        <Link href="/" className="inline-block border border-tbnca-blue text-tbnca-blue font-bold py-3 px-8 rounded-lg hover:bg-tbnca-blue/5 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  )
}
