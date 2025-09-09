import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-indigo-600">Auditly</div>
        <nav>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
            Log In
          </Link>
          <Link href="/signup" className="ml-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="text-center py-20 px-6">
        <h1 className="text-5xl font-extrabold mb-4">
          Get a Complete Website Audit in Minutes
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Turn website analysis into actionable insights. We check performance, SEO, security, and more, then generate a professional PDF report for you or your clients.
        </p>
        <Link href="/signup" className="px-8 py-4 text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Get Your Free Audit
        </Link>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-2">All-in-One Analysis</h2>
          <p className="text-gray-600 mb-12">Everything you need to audit and improve a website.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Lighthouse Scores</h3>
              <p className="text-gray-600">Performance, SEO, Accessibility, and Best Practices summaries.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Security Checks</h3>
              <p className="text-gray-600">Verify essential security headers like CSP, HSTS, and more.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Tech Stack Detection</h3>
              <p className="text-gray-600">Identify the frameworks and tools a website is built with.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Branded PDF Reports</h3>
              <p className="text-gray-600">Generate professional, client-ready reports with your own branding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Pricing Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 bg-white rounded-lg shadow-md border-t-4 border-indigo-500">
              <h3 className="text-2xl font-bold mb-4">Starter</h3>
              <p className="text-4xl font-extrabold mb-4">$0</p>
              <ul className="text-gray-600 mb-8 space-y-2">
                <li>10 Audits per month</li>
                <li>3 Proposals</li>
                <li>1 Seat</li>
              </ul>
              <Link href="/signup" className="w-full block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                Get Started
              </Link>
            </div>
            {/* Pro Plan */}
            <div className="p-8 bg-white rounded-lg shadow-md border-t-4 border-indigo-700">
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <p className="text-4xl font-extrabold mb-4">$49<span className="text-lg font-medium text-gray-500">/mo</span></p>
              <ul className="text-gray-600 mb-8 space-y-2">
                <li>50 Audits per month</li>
                <li>Unlimited Proposals</li>
                <li>2 Seats</li>
              </ul>
              <button disabled className="w-full block px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-md cursor-not-allowed">
                Coming Soon
              </button>
            </div>
            {/* Agency Plan */}
            <div className="p-8 bg-white rounded-lg shadow-md border-t-4 border-purple-600">
              <h3 className="text-2xl font-bold mb-4">Agency</h3>
              <p className="text-4xl font-extrabold mb-4">$99<span className="text-lg font-medium text-gray-500">/mo</span></p>
              <ul className="text-gray-600 mb-8 space-y-2">
                <li>200 Audits per month</li>
                <li>Unlimited Proposals</li>
                <li>5 Seats</li>
              </ul>
              <button disabled className="w-full block px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-md cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-gray-100 text-gray-600">
        <p>&copy; {new Date().getFullYear()} Auditly. All rights reserved.</p>
      </footer>
    </div>
  )
}
