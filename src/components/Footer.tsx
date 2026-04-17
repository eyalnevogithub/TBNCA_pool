export default function Footer() {
  return (
    <footer className="bg-tbnca-blue text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Thunderbird North Community Association</p>
        <p className="mt-1 text-white/70">
          Managed by Marshall Management Group Inc. | (713) 977-6644 |{' '}
          <a href="mailto:ops@mmgihouston.com" className="underline hover:text-tbnca-gold-light">ops@mmgihouston.com</a>
        </p>
      </div>
    </footer>
  )
}
