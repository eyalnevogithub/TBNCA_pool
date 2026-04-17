import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      <section className="bg-tbnca-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Thunderbird North Pool</h1>
          <p className="text-xl text-white/90 mb-8">
            Welcome to the TBNCA pool tag purchase system. Buy your pool tags
            and day passes online — skip the trip to the management office.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-tbnca-gold hover:bg-tbnca-gold-light text-tbnca-blue font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Buy Pool Tags
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-tbnca-blue mb-6">Pool Season 2026</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-tbnca-blue mb-3">Season Dates</h3>
            <p className="text-tbnca-gray">
              Memorial Day (May 25) through Labor Day (September 7, 2026)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-tbnca-blue mb-3">Pool Hours</h3>
            <ul className="text-tbnca-gray space-y-1">
              <li>Thursday &amp; Friday: 2:00 PM - 8:00 PM</li>
              <li>Saturday: 12:00 PM - 8:00 PM</li>
              <li>Sunday: 12:00 PM - 6:00 PM</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-tbnca-blue mb-3">Pool Tags</h3>
            <p className="text-tbnca-gray">
              Every resident needs a pool tag to access the pool. The first tag
              is $20, and additional tags are $5 each. You can purchase up to 20
              tags per household.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-tbnca-blue mb-3">Day Passes</h3>
            <p className="text-tbnca-gray">
              Visiting for the day? Residents can buy day passes for $10 per
              person. Guests (non-residents) pay $15 per person. Up to 5 passes
              per purchase.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-tbnca-blue mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-tbnca-gold rounded-full flex items-center justify-center text-tbnca-blue font-bold text-xl mx-auto mb-3">1</div>
              <h3 className="font-bold mb-2">Select Products</h3>
              <p className="text-tbnca-gray text-sm">Choose pool tags or day passes and select your quantities.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-tbnca-gold rounded-full flex items-center justify-center text-tbnca-blue font-bold text-xl mx-auto mb-3">2</div>
              <h3 className="font-bold mb-2">Verify &amp; Review</h3>
              <p className="text-tbnca-gray text-sm">Sign the waiver, confirm your identity as a resident, and review your cart.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-tbnca-gold rounded-full flex items-center justify-center text-tbnca-blue font-bold text-xl mx-auto mb-3">3</div>
              <h3 className="font-bold mb-2">Pay Online</h3>
              <p className="text-tbnca-gray text-sm">Pay securely with your credit or debit card. Your tags will be mailed or available for pickup.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-tbnca-blue/5 border border-tbnca-blue/20 rounded-lg p-6">
          <h2 className="text-lg font-bold text-tbnca-blue mb-2">Questions?</h2>
          <p className="text-tbnca-gray">
            Contact Marshall Management Group Inc. at{' '}
            <a href="tel:7139776644" className="text-tbnca-blue-light underline">(713) 977-6644</a> or{' '}
            <a href="mailto:ops@mmgihouston.com" className="text-tbnca-blue-light underline">ops@mmgihouston.com</a>.
            Office hours: Mon-Thu 9 AM - 5 PM, Fri 9 AM - 3 PM.
          </p>
        </div>
      </section>
    </div>
  )
}
